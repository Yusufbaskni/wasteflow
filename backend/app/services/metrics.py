from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import AutomationRun, Facility, Forecast, RecyclingOutcome, WasteLot, WasteType


def circular_metrics(db: Session) -> dict:
    totals = db.query(
        func.coalesce(func.sum(RecyclingOutcome.generated_tons), 0),
        func.coalesce(func.sum(RecyclingOutcome.recycled_tons), 0),
        func.coalesce(func.sum(RecyclingOutcome.reused_tons), 0),
        func.coalesce(func.sum(RecyclingOutcome.landfill_tons), 0),
    ).one()
    generated, recycled, reused, landfill = (float(x) for x in totals)
    circular = ((recycled + reused) / generated * 100) if generated else 0.0
    open_lots = db.query(func.count(WasteLot.id)).filter(WasteLot.status != "closed").scalar() or 0
    auto_ok = db.query(func.count(AutomationRun.id)).filter(AutomationRun.decision != "hold_manual").scalar() or 0
    auto_all = db.query(func.count(AutomationRun.id)).scalar() or 0
    predicted = db.query(func.coalesce(func.sum(Forecast.predicted_tons), 0)).scalar() or 0
    return {
        "circularity_rate": round(circular, 2),
        "recycled_tons": round(recycled, 2),
        "reused_tons": round(reused, 2),
        "landfill_tons": round(landfill, 2),
        "generated_tons": round(generated, 2),
        "open_lots": int(open_lots),
        "automated_share": round((auto_ok / auto_all * 100) if auto_all else 0, 2),
        "predicted_next_30d_tons": round(float(predicted), 2),
    }


def outcome_series(db: Session, days: int = 180) -> list[dict]:
    start = date.today() - timedelta(days=days)
    rows = (
        db.query(
            RecyclingOutcome.period_date,
            func.sum(RecyclingOutcome.generated_tons),
            func.sum(RecyclingOutcome.recycled_tons),
            func.sum(RecyclingOutcome.reused_tons),
            func.sum(RecyclingOutcome.landfill_tons),
        )
        .filter(RecyclingOutcome.period_date >= start)
        .group_by(RecyclingOutcome.period_date)
        .order_by(RecyclingOutcome.period_date)
        .all()
    )
    return [
        {
            "date": r[0].isoformat(),
            "generated": float(r[1]),
            "recycled": float(r[2]),
            "reused": float(r[3]),
            "landfill": float(r[4]),
        }
        for r in rows
    ]


def forecast_rows(db: Session) -> list[dict]:
    rows = (
        db.query(Forecast, Facility, WasteType)
        .join(Facility, Facility.id == Forecast.facility_id)
        .join(WasteType, WasteType.id == Forecast.waste_type_id)
        .order_by(Forecast.horizon_date, Facility.code)
        .all()
    )
    return [
        {
            "facility_id": f.facility_id,
            "facility_code": fac.code,
            "waste_type_code": wt.code,
            "horizon_date": f.horizon_date,
            "predicted_tons": f.predicted_tons,
            "model_name": f.model_name,
            "mae": f.mae,
        }
        for f, fac, wt in rows
    ]
