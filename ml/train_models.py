# -*- coding: utf-8 -*-
import os
import json
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.ensemble import RandomForestRegressor
from math import sqrt
import joblib

try:
    from xgboost import XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

DATA_PATH = "data/ml_panel.csv"
MODELS_DIR = "models"

def train_and_eval(X_train, y_train, X_val, y_val, model):
    model.fit(X_train, y_train)
    preds = model.predict(X_val)
    mae = mean_absolute_error(y_val, preds)
    rmse = sqrt(mean_squared_error(y_val, preds))
    return model, mae, rmse

def main():
    os.makedirs(MODELS_DIR, exist_ok=True)

    df = pd.read_csv(DATA_PATH)

    # --- targets: deltas instead of levels ---
    target_lc = "delta_lc"
    target_gen = "delta_log_gen"

    # drop rows where targets are missing
    df = df[df[target_lc].notna() & df[target_gen].notna()].copy()

    # time-based split
    train_df = df[df["year"] <= 2015].copy()
    val_df   = df[(df["year"] > 2015) & (df["year"] <= 2020)].copy()
    test_df  = df[df["year"] > 2020].copy()

    # --- feature columns ---
    drop_cols = [
        "country_id", "iso3", "name", "year",
        "region", "subregion", "income_group",
        "low_carbon_share_pct", "electricity_generation_twh",
        "log_gen",  # helper
        "delta_lc", "delta_log_gen",
    ]
    candidate_cols = [c for c in df.columns if c not in drop_cols]

    # keep only numeric columns
    feature_cols = [c for c in candidate_cols if pd.api.types.is_numeric_dtype(df[c])]

    # extract feature frames
    X_train_df = train_df[feature_cols].copy()
    X_val_df   = val_df[feature_cols].copy()
    X_test_df  = test_df[feature_cols].copy()

    # simple imputation: fill NaN with column mean (computed on train)
    col_means = X_train_df.mean(numeric_only=True)
    X_train_df = X_train_df.fillna(col_means)
    X_val_df   = X_val_df.fillna(col_means)
    X_test_df  = X_test_df.fillna(col_means)

    X_train = X_train_df.values
    X_val   = X_val_df.values
    X_test  = X_test_df.values

    y_train_lc = train_df[target_lc].values
    y_val_lc   = val_df[target_lc].values
    y_test_lc  = test_df[target_lc].values

    y_train_gen = train_df[target_gen].values
    y_val_gen   = val_df[target_gen].values
    y_test_gen  = test_df[target_gen].values

    # --- scaling for linear models ---
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled   = scaler.transform(X_val)
    X_test_scaled  = scaler.transform(X_test)

    metrics = {}

    # 1) Ridge for delta_lc
    ridge_lc = Ridge(alpha=1.0, random_state=42)
    ridge_lc, mae, rmse = train_and_eval(
        X_train_scaled, y_train_lc, X_val_scaled, y_val_lc, ridge_lc
    )
    metrics["ridge_delta_lc_val"] = {"mae": mae, "rmse": rmse}

    # 2) Ridge for delta_log_gen
    ridge_gen = Ridge(alpha=1.0, random_state=42)
    ridge_gen, mae, rmse = train_and_eval(
        X_train_scaled, y_train_gen, X_val_scaled, y_val_gen, ridge_gen
    )
    metrics["ridge_delta_log_gen_val"] = {"mae": mae, "rmse": rmse}

    # 3) RandomForest for delta_lc
    rf_lc = RandomForestRegressor(
        n_estimators=300,
        max_depth=10,
        n_jobs=-1,
        random_state=42
    )
    rf_lc, mae, rmse = train_and_eval(
        X_train, y_train_lc, X_val, y_val_lc, rf_lc
    )
    metrics["rf_delta_lc_val"] = {"mae": mae, "rmse": rmse}

    # 4) RandomForest for delta_log_gen
    rf_gen = RandomForestRegressor(
        n_estimators=300,
        max_depth=10,
        n_jobs=-1,
        random_state=42
    )
    rf_gen, mae, rmse = train_and_eval(
        X_train, y_train_gen, X_val, y_val_gen, rf_gen
    )
    metrics["rf_delta_log_gen_val"] = {"mae": mae, "rmse": rmse}

    # 5) XGBoost models (if available)
    if HAS_XGB:
        xgb_lc = XGBRegressor(
            n_estimators=400,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="reg:squarederror",
            random_state=42,
            tree_method="hist"
        )
        xgb_lc, mae, rmse = train_and_eval(
            X_train, y_train_lc, X_val, y_val_lc, xgb_lc
        )
        metrics["xgb_delta_lc_val"] = {"mae": mae, "rmse": rmse}

        xgb_gen = XGBRegressor(
            n_estimators=400,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="reg:squarederror",
            random_state=42,
            tree_method="hist"
        )
        xgb_gen, mae, rmse = train_and_eval(
            X_train, y_train_gen, X_val, y_val_gen, xgb_gen
        )
        metrics["xgb_delta_log_gen_val"] = {"mae": mae, "rmse": rmse}
    else:
        xgb_lc = None
        xgb_gen = None

    # --- evaluate best models on test for info only ---
    def eval_on_test(model, X_t, y_t):
        preds = model.predict(X_t)
        return {
            "mae": float(mean_absolute_error(y_t, preds)),
            "rmse": float(sqrt(mean_squared_error(y_t, preds))),
        }

    metrics["rf_delta_lc_test"]  = eval_on_test(rf_lc,  X_test, y_test_lc)
    metrics["rf_delta_log_gen_test"] = eval_on_test(rf_gen, X_test, y_test_gen)
    if xgb_lc is not None:
        metrics["xgb_delta_lc_test"]  = eval_on_test(xgb_lc,  X_test, y_test_lc)
        metrics["xgb_delta_log_gen_test"] = eval_on_test(xgb_gen, X_test, y_test_gen)

    # --- choose best model types (prefer XGB if present, else RF) ---
    best_lc_model  = xgb_lc if xgb_lc is not None else rf_lc
    best_gen_model = xgb_gen if xgb_gen is not None else rf_gen
    best_lc_name   = "xgb" if xgb_lc is not None else "rf"
    best_gen_name  = "xgb" if xgb_gen is not None else "rf"

    # --- save models and scaler/config ---
    joblib.dump(scaler,        os.path.join(MODELS_DIR, "scaler.joblib"))
    joblib.dump(best_lc_model, os.path.join(MODELS_DIR, f"{best_lc_name}_lc_model.joblib"))
    joblib.dump(best_gen_model,os.path.join(MODELS_DIR, f"{best_gen_name}_gen_model.joblib"))

    config = {
        "feature_cols": feature_cols,
        "target_lc": target_lc,
        "target_gen": target_gen,
        "train_year_max": 2015,
        "val_year_max": 2020,
        "test_year_min": 2021,
        "best_lc_model_type": best_lc_name,
        "best_gen_model_type": best_gen_name,
    }
    with open(os.path.join(MODELS_DIR, "feature_config.json"), "w") as f:
        json.dump(config, f, indent=2)

    with open(os.path.join(MODELS_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print("Saved models and metrics to 'models/'")

if __name__ == "__main__":
    main()
