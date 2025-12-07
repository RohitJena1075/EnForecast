# -*- coding: utf-8 -*-
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    with open("db/schema.sql", "r", encoding="utf-8") as f:
        sql = f.read()
        cur.execute(sql)

    conn.commit()

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
