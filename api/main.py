# -*- coding: utf-8 -*-
from fastapi import FastAPI, HTTPException, Query
import model_service
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import os
import json
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

app = FastAPI(title="Energy Forecast API")

# CORS for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/countries")
def list_countries():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute(
        "SELECT iso3, name FROM countries WHERE iso3 IS NOT NULL ORDER BY name"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"code": r[0].strip(), "name": r[1]} for r in rows]

@app.get("/model-metrics")
def model_metrics():
    """
    Return global validation and test metrics for the forecasting models.
    """
    metrics_path = os.path.join("models", "metrics.json")
    if not os.path.exists(metrics_path):
        return {"error": "metrics file not found"}
    with open(metrics_path, "r") as f:
        metrics = json.load(f)
    return metrics

@app.get("/forecast/{iso3}")
def forecast(iso3: str, horizon: int = Query(5, ge=1, le=10)):
    try:
        return model_service.predict_horizon(iso3, horizon=horizon)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
