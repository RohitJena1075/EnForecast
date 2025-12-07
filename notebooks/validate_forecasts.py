# -*- coding: utf-8 -*-
import os
import psycopg2
import pandas as pd
import requests
from dotenv import load_dotenv
import matplotlib.pyplot as plt

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

API_BASE = "http://127.0.0.1:8000"

def fetch_history(iso3: str) -> pd.DataFrame:
    conn = psycopg2.connect(DATABASE_URL)
    q = """
        SELECT e.year, e.low_carbon_share_pct, e.electricity_generation_twh
        FROM energy_yearly e
        JOIN countries c ON c.country_id = e.country_id
        WHERE c.iso3 = %s
        ORDER BY e.year;
    """
    df = pd.read_sql(q, conn, params=[iso3])
    conn.close()
    return df

def fetch_forecast(iso3: str, horizon: int = 10) -> dict:
    url = f"{API_BASE}/forecast/{iso3}"
    r = requests.get(url, params={"horizon": horizon}, timeout=10)
    r.raise_for_status()
    return r.json()

def plot_country(iso3: str, out_dir="reports/plots", horizon: int = 10):
    os.makedirs(out_dir, exist_ok=True)

    hist = fetch_history(iso3)
    if hist.empty:
        raise ValueError("No history")

    fc = fetch_forecast(iso3, horizon=horizon)
    fc_df = pd.DataFrame(fc["forecasts"])

    # 1) Low-carbon share
    fig, ax1 = plt.subplots(figsize=(7, 3.5))
    ax1.set_title(f"{iso3} – Low-carbon share")
    ax1.plot(hist["year"], hist["low_carbon_share_pct"],
             label="history", color="tab:blue")
    ax1.plot(fc_df["year"], fc_df["low_carbon_share_pct"],
             label="forecast", color="tab:red",
             linestyle="--", marker="o")
    ax1.set_xlabel("Year")
    ax1.set_ylabel("Low-carbon share (%)")
    ax1.legend()
    plt.tight_layout()
    fig.savefig(os.path.join(out_dir, f"{iso3}_low_carbon.png"))
    plt.close(fig)

    # 2) Electricity generation
    fig, ax2 = plt.subplots(figsize=(7, 3.5))
    ax2.set_title(f"{iso3} – Electricity generation (TWh)")
    ax2.plot(hist["year"], hist["electricity_generation_twh"],
             label="history", color="tab:green")
    ax2.plot(fc_df["year"], fc_df["electricity_generation_twh"],
             label="forecast", color="tab:red",
             linestyle="--", marker="o")
    ax2.set_xlabel("Year")
    ax2.set_ylabel("TWh")
    ax2.legend()
    plt.tight_layout()
    fig.savefig(os.path.join(out_dir, f"{iso3}_generation.png"))
    plt.close(fig)

def fetch_all_iso3():
    conn = psycopg2.connect(DATABASE_URL)
    df = pd.read_sql("SELECT DISTINCT iso3 FROM countries ORDER BY iso3", conn)
    conn.close()
    return df["iso3"].tolist()

def main():
    iso_list = fetch_all_iso3()
    for iso3 in iso_list:
        try:
            print(f"Processing {iso3}...")
            plot_country(iso3, horizon=10)
        except Exception as e:
            print(f"Skip {iso3}: {e}")

if __name__ == "__main__":
    main()