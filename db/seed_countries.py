# -*- coding: utf-8 -*-
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

countries = [
    ("USA", "United States", "North America", 331.0, 25000.0, 2050, 30.0),
    ("CHN", "China", "Asia", 1430.0, 18000.0, 2060, 25.0),
    ("IND", "India", "Asia", 1400.0, 3200.0, 2070, 50.0),
    ("DEU", "Germany", "Europe", 83.0, 4100.0, 2045, 80.0),
    ("GBR", "United Kingdom", "Europe", 67.0, 3100.0, 2050, 60.0),
    ("FRA", "France", "Europe", 67.0, 2800.0, 2050, 40.0),
    ("JPN", "Japan", "Asia", 125.0, 5000.0, 2050, 36.0),
    ("BRA", "Brazil", "South America", 213.0, 1900.0, 2050, 45.0),
    ("CAN", "Canada", "North America", 38.0, 2100.0, 2050, 90.0),
    ("RUS", "Russia", "Europe", 146.0, 1700.0, None, 20.0),
    ("AUS", "Australia", "Oceania", 26.0, 1500.0, 2050, 82.0),
    ("KOR", "South Korea", "Asia", 51.0, 1700.0, 2050, 21.0),
    ("ITA", "Italy", "Europe", 59.0, 2100.0, 2050, 30.0),
    ("MEX", "Mexico", "North America", 128.0, 1300.0, 2050, 35.0),
    ("IDN", "Indonesia", "Asia", 273.0, 1200.0, 2060, 23.0),
    ("TUR", "Turkey", "Europe", 84.0, 900.0, None, 20.0),
    ("SAU", "Saudi Arabia", "Middle East", 35.0, 1100.0, 2060, 15.0),
    ("ZAF", "South Africa", "Africa", 60.0, 400.0, 2050, 25.0),
    ("NGA", "Nigeria", "Africa", 206.0, 450.0, None, 30.0),
    ("EGY", "Egypt", "Africa", 102.0, 400.0, None, 22.0),
    ("ESP", "Spain", "Europe", 47.0, 1400.0, 2050, 74.0),
    ("NLD", "Netherlands", "Europe", 17.0, 1000.0, 2050, 70.0),
    ("SWE", "Sweden", "Europe", 10.0, 600.0, 2045, 100.0),
    ("NOR", "Norway", "Europe", 5.0, 500.0, 2050, 100.0),
    ("DNK", "Denmark", "Europe", 6.0, 400.0, 2050, 100.0),
]

def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    for iso3, name, region, pop, gdp, target_year, ndc_target in countries:
        cur.execute(
            """
            INSERT INTO countries
            (iso3, name, region, population_millions, gdp_billions_usd,
             net_zero_target_year, ndc_2030_target_pct)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (iso3) DO UPDATE
            SET region = EXCLUDED.region,
                population_millions = COALESCE(EXCLUDED.population_millions,
                                               countries.population_millions),
                gdp_billions_usd = COALESCE(EXCLUDED.gdp_billions_usd,
                                            countries.gdp_billions_usd),
                net_zero_target_year = COALESCE(EXCLUDED.net_zero_target_year,
                                                countries.net_zero_target_year),
                ndc_2030_target_pct = COALESCE(EXCLUDED.ndc_2030_target_pct,
                                               countries.ndc_2030_target_pct)
            """,
            (iso3, name, region, pop, gdp, target_year, ndc_target),
        )

    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
