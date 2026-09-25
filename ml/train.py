"""Aylık atık miktarı tahmini: üretim hacmi, mevsimsellik ve tesis özellikleri."""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from sqlalchemy import func  # noqa: E402

from app.config import MODEL_DIR  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.models import Facility, Forecast, ProductionLine, ProductionRecord, RecyclingOutcome, WasteType  # noqa: E402

try:
    from xgboost import XGBRegressor

    HAS_XGB = True
except Exception:
    HAS_XGB = False


def load_frame(db) -> pd.DataFrame:
    q = (
        db.query(
            RecyclingOutcome.facility_id,
            RecyclingOutcome.waste_type_id,
            RecyclingOutcome.period_date,
            RecyclingOutcome.generated_tons,
            Facility.industry,
            Facility.capacity_tpy,
            WasteType.code,
        )
        .join(Facility, Facility.id == RecyclingOutcome.facility_id)
        .join(WasteType, WasteType.id == RecyclingOutcome.waste_type_id)
    )
    rows = q.all()
    df = pd.DataFrame(
        rows,
        columns=["facility_id", "waste_type_id", "period_date", "generated_tons", "industry", "capacity_tpy", "waste_code"],
    )
    if df.empty:
        raise SystemExit("Veri yok. Önce: python ml/generate_synthetic.py")

    prod = (
        db.query(
            ProductionLine.facility_id,
            ProductionRecord.period_date,
            func.sum(ProductionRecord.output_tons),
            func.sum(ProductionRecord.energy_mwh),
        )
        .join(ProductionLine, ProductionLine.id == ProductionRecord.production_line_id)
        .group_by(ProductionLine.facility_id, ProductionRecord.period_date)
        .all()
    )
    pdf = pd.DataFrame(prod, columns=["facility_id", "day", "output_tons", "energy_mwh"])
    pdf["period_date"] = pd.to_datetime(pdf["day"]).dt.to_period("M").dt.to_timestamp().dt.date
    monthly = pdf.groupby(["facility_id", "period_date"], as_index=False).agg(
        output_tons=("output_tons", "sum"),
        energy_mwh=("energy_mwh", "sum"),
        active_days=("day", "nunique"),
    )

    df["period_date"] = pd.to_datetime(df["period_date"]).dt.date
    df = df.merge(monthly, on=["facility_id", "period_date"], how="left")
    df["output_tons"] = df["output_tons"].fillna(df["capacity_tpy"] / 12)
    df["energy_mwh"] = df["energy_mwh"].fillna(df["output_tons"] * 0.45)
    df["active_days"] = df["active_days"].fillna(22)
    dt = pd.to_datetime(df["period_date"])
    df["month"] = dt.dt.month
    df["year"] = dt.dt.year
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
    df = df.sort_values(["facility_id", "waste_type_id", "period_date"])
    df["lag_1"] = df.groupby(["facility_id", "waste_type_id"])["generated_tons"].shift(1)
    df["lag_2"] = df.groupby(["facility_id", "waste_type_id"])["generated_tons"].shift(2)
    df = df.dropna(subset=["lag_1", "lag_2"])
    return df


CAT = ["industry", "waste_code"]
NUM = ["capacity_tpy", "output_tons", "energy_mwh", "active_days", "month", "month_sin", "month_cos", "lag_1", "lag_2"]


def build_model(kind: str):
    pre = ColumnTransformer(
        [
            ("cat", OneHotEncoder(handle_unknown="ignore"), CAT),
            ("num", "passthrough", NUM),
        ]
    )
    if kind == "xgboost" and HAS_XGB:
        est = XGBRegressor(
            n_estimators=250,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="reg:squarederror",
            random_state=42,
        )
        name = "xgboost"
    else:
        est = HistGradientBoostingRegressor(max_depth=6, learning_rate=0.08, max_iter=250, random_state=42)
        name = "hgb"
    return Pipeline([("pre", pre), ("model", est)]), name


def train():
    db = SessionLocal()
    try:
        df = load_frame(db)
        X = df[CAT + NUM]
        y = df["generated_tons"]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        kind = "xgboost" if HAS_XGB else "hgb"
        pipe, name = build_model(kind)
        pipe.fit(X_train, y_train)
        pred = pipe.predict(X_test)
        mae = float(mean_absolute_error(y_test, pred))
        r2 = float(r2_score(y_test, pred))
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(pipe, MODEL_DIR / "waste_forecast.joblib")
        meta = {"model": name, "mae": mae, "r2": r2, "rows": int(len(df))}
        (MODEL_DIR / "metrics.json").write_text(json.dumps(meta, indent=2))
        write_forecasts(db, df, pipe, name, mae)
        db.commit()
        print(json.dumps(meta))
    finally:
        db.close()


def write_forecasts(db, df: pd.DataFrame, pipe, name: str, mae: float):
    db.query(Forecast).delete()
    latest = df.sort_values("period_date").groupby(["facility_id", "waste_type_id"], as_index=False).tail(1)
    today = date.today()
    horizon_months = [1, 2, 3]
    rows = []
    for _, row in latest.iterrows():
        lag1 = row["generated_tons"]
        lag2 = row["lag_1"]
        for h in horizon_months:
            month = ((today.month - 1 + h) % 12) + 1
            year = today.year + (today.month - 1 + h) // 12
            horizon = date(year, month, 1)
            feat = {
                "industry": row["industry"],
                "waste_code": row["waste_code"],
                "capacity_tpy": row["capacity_tpy"],
                "output_tons": row["output_tons"],
                "energy_mwh": row["energy_mwh"],
                "active_days": row["active_days"],
                "month": month,
                "month_sin": np.sin(2 * np.pi * month / 12),
                "month_cos": np.cos(2 * np.pi * month / 12),
                "lag_1": lag1,
                "lag_2": lag2,
            }
            yhat = float(max(0, pipe.predict(pd.DataFrame([feat]))[0]))
            rows.append(
                Forecast(
                    facility_id=int(row["facility_id"]),
                    waste_type_id=int(row["waste_type_id"]),
                    horizon_date=horizon,
                    predicted_tons=round(yhat, 3),
                    model_name=name,
                    mae=mae,
                )
            )
            lag2 = lag1
            lag1 = yhat
    db.add_all(rows)


if __name__ == "__main__":
    train()
