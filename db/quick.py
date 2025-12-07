import psycopg2, os
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

cur.execute("SELECT Distinct COUNT(*) FROM countries")
print("countries:", cur.fetchone()[0])

cur.execute("SELECT count(*) FROM energy_yearly")
print("energy_yearly rows:", cur.fetchone()[0])

# cur.execute("SELECT MIN(year), MAX(year) FROM energy_yearly")
# print("year range:", cur.fetchone())

# sample for India and Germany
# cur.execute("""
#     SELECT c.iso3, c.name, e.year,
#            e.electricity_generation_twh, e.low_carbon_share_pct, e.fossil_share_pct
#     FROM energy_yearly e
#     JOIN countries c ON c.country_id = e.country_id
#     WHERE c.iso3 IN ('IND','DEU') AND e.year BETWEEN 2015 AND 2020
#     ORDER BY c.iso3, e.year
#     LIMIT 10
# """)
# for row in cur.fetchall():
#     print(row)

cur.close()
conn.close()
