# -*- coding: utf-8 -*-
import psycopg2
from dotenv import load_dotenv
import os
import pandas as pd
import numpy as np
from datetime import datetime
import random

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    countries_df = pd.read_sql(
        "SELECT country_id, iso3, name FROM countries", conn
    )
    print(f"🌍 Found {len(countries_df)} countries – generating data...")

    records = []
    base_years = range(2018, 2025)   # 7 years
    months = range(1, 13)            # 12 months → 84 per country

    for _, row in countries_df.iterrows():
        cid = row["country_id"]
        iso3 = row["iso3"]

        renewable_base = {
            "BRA": 0.80, "CAN": 0.75, "SWE": 0.95, "NOR": 0.98,
            "DEU": 0.45, "GBR": 0.40, "AUS": 0.35,
            "IND": 0.20, "CHN": 0.18, "USA": 0.30,
        }.get(iso3, 0.15)

        for y in base_years:
            for m in months:
                date = datetime(y, m, 1)

                yearly_total = random.randint(50, 800) * 1_000_000_000
                total_mwh = int(yearly_total / 12)

                renewable_share = max(
                    0.02,
                    min(0.95, renewable_base + random.uniform(-0.05, 0.10)),
                )
                renewable_mwh = int(total_mwh * renewable_share)
                fossil_mwh = total_mwh - renewable_mwh

                solar_mwh = int(renewable_mwh * random.uniform(0.2, 0.5))
                wind_mwh = int(renewable_mwh * random.uniform(0.3, 0.6))
                hydro_mwh = max(0, renewable_mwh - solar_mwh - wind_mwh)

                coal_mwh = int(fossil_mwh * random.uniform(0.4, 0.8))
                gas_mwh = max(0, fossil_mwh - coal_mwh)

                co2_kg_per_mwh = 800 * (fossil_mwh / max(total_mwh, 1))

                records.append(
                    {
                        "country_id": cid,
                        "date": date,
                        "total_mwh": total_mwh,
                        "coal_mwh": coal_mwh,
                        "oil_mwh": 0,
                        "gas_mwh": gas_mwh,
                        "nuclear_mwh": 0,
                        "solar_mwh": solar_mwh,
                        "wind_mwh": wind_mwh,
                        "hydro_mwh": hydro_mwh,
                        "other_renewables_mwh": 0,
                        "co2_kg_per_mwh": round(co2_kg_per_mwh, 2),
                        "renewable_pct": round(
                            renewable_mwh / total_mwh * 100, 2
                        ),
                        "fossil_pct": round(fossil_mwh / total_mwh * 100, 2),
                    }
                )

    df = pd.DataFrame(records)
    print(f"📊 Generated {len(df):,} monthly rows")

    tuples = [tuple(x) for x in df.to_numpy()]
    cols = ",".join(df.columns)

    query = (
        f"INSERT INTO energy_generation ({cols}) VALUES ("
        + ",".join(["%s"] * len(df.columns))
        + ") ON CONFLICT (country_id, date) DO NOTHING"
    )

    cur.executemany(query, tuples)
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM energy_generation")
    total = cur.fetchone()[0]
    print(f"✅ energy_generation rows in DB: {total:,}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
