# -*- coding: utf-8 -*-
import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
CSV_PATH = "data/owid-energy-data.csv"

def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    df = pd.read_csv(CSV_PATH)

    # Only real countries and recent years
    df = df[df["iso_code"].str.len() == 3].copy()
    df = df[df["year"] >= 1990]

    # ---- countries from OWID ----
    countries_dim = (
        df.groupby(["iso_code", "country"])
          .agg(population_millions=("population",
                                    lambda x: x.dropna().iloc[-1] / 1e6
                                    if x.dropna().size else None))
          .reset_index()
    )

    for _, row in countries_dim.iterrows():
        cur.execute(
            """
            INSERT INTO countries (iso3, name, population_millions)
            VALUES (%s, %s, %s)
            ON CONFLICT (iso3) DO UPDATE
            SET name = EXCLUDED.name,
                population_millions =
                    COALESCE(EXCLUDED.population_millions,
                             countries.population_millions)
            """,
            (row["iso_code"], row["country"], row["population_millions"]),
        )

    conn.commit()

    # map iso3 -> country_id
    cid_map = pd.read_sql(
        "SELECT country_id, iso3 FROM countries", conn
    ).set_index("iso3")["country_id"]

    # ---- yearly energy fact ----
    requested_cols = [
        "iso_code", "year",
        "primary_energy_consumption",
        "electricity_generation",
        "coal_electricity", "oil_electricity", "gas_electricity",
        "nuclear_electricity", "hydro_electricity",
        "solar_electricity", "wind_electricity",
        "other_renewable_electricity",
        "low_carbon_share_elec",
        "fossil_share_elec",
    ]

    available_cols = [c for c in requested_cols if c in df.columns]
    edf = df[available_cols].copy()
    for col in requested_cols:
        if col not in edf.columns:
            edf[col] = pd.NA

    edf.rename(
        columns={
            "iso_code": "iso3",
            "primary_energy_consumption": "total_energy_ej",
            "electricity_generation": "electricity_generation_twh",
            "coal_electricity": "coal_twh",
            "oil_electricity": "oil_twh",
            "gas_electricity": "gas_twh",
            "nuclear_electricity": "nuclear_twh",
            "hydro_electricity": "hydro_twh",
            "solar_electricity": "solar_twh",
            "wind_electricity": "wind_twh",
            "other_renewable_electricity": "other_renewables_twh",
            "low_carbon_share_elec": "low_carbon_share_pct",
            "fossil_share_elec": "fossil_share_pct",
        },
        inplace=True,
    )

    edf["country_id"] = edf["iso3"].map(cid_map)
    edf = edf.dropna(subset=["country_id"])
    edf["country_id"] = edf["country_id"].astype(int)

    num_cols = [c for c in edf.columns if c not in ("iso3")]
    edf[num_cols] = edf[num_cols].apply(pd.to_numeric, errors="coerce")

    tuples = [
        (
            int(row["country_id"]),
            int(row["year"]),
            row["total_energy_ej"],
            row["electricity_generation_twh"],
            row["coal_twh"], row["oil_twh"], row["gas_twh"],
            row["nuclear_twh"], row["hydro_twh"],
            row["solar_twh"], row["wind_twh"],
            row["other_renewables_twh"],
            row["low_carbon_share_pct"],
            row["fossil_share_pct"],
        )
        for _, row in edf.iterrows()
    ]

    insert_sql = """
    INSERT INTO energy_yearly (
        country_id, year,
        total_energy_ej, electricity_generation_twh,
        coal_twh, oil_twh, gas_twh, nuclear_twh, hydro_twh,
        solar_twh, wind_twh, other_renewables_twh,
        low_carbon_share_pct, fossil_share_pct
    ) VALUES (
        %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
    )
    ON CONFLICT (country_id, year) DO NOTHING;
    """

    chunk_size = 1000
    for i in range(0, len(tuples), chunk_size):
        chunk = tuples[i:i + chunk_size]
        cur.executemany(insert_sql, chunk)
        conn.commit()

    cur.execute("SELECT COUNT(DISTINCT country_id) FROM energy_yearly")
    c_count = cur.fetchone()[0]
    cur.execute("SELECT MIN(year), MAX(year) FROM energy_yearly")
    y_min, y_max = cur.fetchone()

    print(f"energy_yearly: {c_count} countries, years {y_min}-{y_max}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
