# -*- coding: utf-8 -*-
import os
import psycopg2
import pandas as pd
import numpy as np
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

OUT_PATH = "data/ml_panel.csv"

def main():
    conn = psycopg2.connect(DATABASE_URL)

    # 1) Pull joined data from DB
    query = """
        SELECT
            c.country_id,
            c.iso3,
            c.name,
            c.region,
            c.subregion,
            c.income_group,
            c.population_millions,
            c.gdp_billions_usd,
            e.year,
            e.electricity_generation_twh,
            e.coal_twh,
            e.oil_twh,
            e.gas_twh,
            e.nuclear_twh,
            e.hydro_twh,
            e.solar_twh,
            e.wind_twh,
            e.other_renewables_twh,
            e.low_carbon_share_pct,
            e.fossil_share_pct
        FROM energy_yearly e
        JOIN countries c ON c.country_id = e.country_id
        WHERE e.year >= 1990
        ORDER BY c.iso3, e.year;
    """
    df = pd.read_sql(query, conn)
    conn.close()

    # 2) Compute shares (avoid division by zero)
    eps = 1e-9
    gen = df["electricity_generation_twh"].clip(lower=eps)

    for src in ["coal", "oil", "gas", "nuclear", "hydro", "solar", "wind", "other_renewables"]:
        df[f"{src}_share"] = df[f"{src}_twh"] / gen

    # 3) Create lag features (1–3 years) for key columns
    df = df.sort_values(["iso3", "year"])

    lag_cols = [
        "low_carbon_share_pct",
        "electricity_generation_twh",
        "solar_share",
        "wind_share",
        "fossil_share_pct",
    ]

    for col in lag_cols:
        for lag in [1, 2, 3]:
            df[f"{col}_lag{lag}"] = df.groupby("iso3")[col].shift(lag)

    # 4) Create delta targets
    df["delta_lc"] = df.groupby("iso3")["low_carbon_share_pct"].diff()

    df["log_gen"] = np.log(df["electricity_generation_twh"].clip(lower=1e-6))
    df["delta_log_gen"] = df.groupby("iso3")["log_gen"].diff()

    # 5) Drop rows without full history (lags and deltas)
    df = df[
        df["low_carbon_share_pct_lag3"].notnull()
        & df["delta_lc"].notnull()
        & df["delta_log_gen"].notnull()
    ].copy()

    # 6) Optional: filter to start from 2000 for cleaner panel
    df = df[df["year"] >= 2000].reset_index(drop=True)

    # 7) Save to CSV for ML training
    os.makedirs("data", exist_ok=True)
    df.to_csv(OUT_PATH, index=False)
    print(
        f"Saved ML panel to {OUT_PATH} with {len(df)} rows, "
        f"{df['iso3'].nunique()} countries, years "
        f"{df['year'].min()}–{df['year'].max()}"
    )

if __name__ == "__main__":
    main()
