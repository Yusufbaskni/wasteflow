from datetime import date
from hashlib import sha256

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload

from .config import ERP_API_KEY
from .database import Base, engine, get_db
from .models import AutomationRun, Destination, Facility, WasteLot, WasteType
from .schemas import (
    AutomationRunOut,
    FacilityOut,
    ForecastOut,
    ManualRouteIn,
    MetricsOut,
    ProductionIn,
    WasteLotOut,
    WasteTypeOut,
)
from .services.automation import add_event, advance_in_transit
from .services.ingest import ingest_production
from .services.metrics import circular_metrics, forecast_rows, outcome_series
from .models import ErpSyncLog

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WasteFlow - Atık Yönetim Platformu",
    description="Endüstriyel atık tahmini, izleme ve döngüsel ekonomi otomasyonu API dokümantasyonu",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_erp_key(x_api_key: str | None = Header(default=None)):
    if x_api_key != ERP_API_KEY:
        raise HTTPException(status_code=401, detail="Geçersiz ERP API anahtarı")


@app.get("/health", summary="Sistem Durumu Kontrolü")
def health():
    return {"status": "ok"}


@app.get("/api/v1/facilities", response_model=list[FacilityOut])
def list_facilities(db: Session = Depends(get_db)):
    return db.query(Facility).order_by(Facility.code).all()


@app.get("/api/v1/waste-types", response_model=list[WasteTypeOut], summary="Atık Türlerini Listele")
def list_waste_types(db: Session = Depends(get_db)):
    return db.query(WasteType).order_by(WasteType.code).all()


@app.get("/api/v1/lots", response_model=list[WasteLotOut], summary="Atık Partilerini Listele")
def list_lots(
    status: str | None = None,
    facility_id: int | None = None,
    limit: int = Query(80, le=300),
    db: Session = Depends(get_db),
):
    q = db.query(WasteLot).options(joinedload(WasteLot.events)).order_by(WasteLot.origin_date.desc())
    if status:
        q = q.filter(WasteLot.status == status)
    if facility_id:
        q = q.filter(WasteLot.facility_id == facility_id)
    return q.limit(limit).all()


@app.get("/api/v1/lots/{lot_code}", response_model=WasteLotOut, summary="Parti Detayını Getir")
def get_lot(lot_code: str, db: Session = Depends(get_db)):
    lot = (
        db.query(WasteLot)
        .options(joinedload(WasteLot.events))
        .filter(WasteLot.lot_code == lot_code)
        .one_or_none()
    )
    if not lot:
        raise HTTPException(404, "Lot bulunamadı")
    return lot


@app.post("/api/v1/lots/{lot_code}/advance", summary="Parti Aşamasını İlerlet")
def advance_lot(lot_code: str, db: Session = Depends(get_db)):
    n = advance_in_transit(db)
    db.commit()
    return {"moved": n}


@app.post("/api/v1/lots/{lot_code}/route", summary="Manuel Rotalama Oluştur")
def manual_route(lot_code: str, body: ManualRouteIn, db: Session = Depends(get_db)):
    lot = db.query(WasteLot).filter(WasteLot.lot_code == lot_code).one_or_none()
    if not lot:
        raise HTTPException(404, "Lot bulunamadı")
    dest = db.query(Destination).filter(Destination.code == body.destination_code).one_or_none()
    if not dest:
        raise HTTPException(404, "Hedef bulunamadı")
    lot.destination_id = dest.id
    add_event(db, lot, "routed", "operator", body.notes, location=dest.city)
    add_event(db, lot, "in_transit", "operator", "Manuel sevkiyat", location=dest.city)
    db.commit()
    return {"ok": True, "status": lot.status}


@app.get("/api/v1/metrics", response_model=MetricsOut, summary="Sistem Metrikleri")
def metrics(db: Session = Depends(get_db)):
    return circular_metrics(db)


@app.get("/api/v1/series/outcomes", summary="Zaman Serisi Çıktıları")
def series(days: int = 400, db: Session = Depends(get_db)):
    return outcome_series(db, days=days)


@app.get("/api/v1/forecasts", response_model=list[ForecastOut], summary="Atık Tahminleri")
def forecasts(db: Session = Depends(get_db)):
    return forecast_rows(db)


@app.get("/api/v1/automation/runs", response_model=list[AutomationRunOut], summary="Otomasyon Çalıştırmaları")
def automation_runs(limit: int = 60, db: Session = Depends(get_db)):
    return db.query(AutomationRun).order_by(AutomationRun.ran_at.desc()).limit(limit).all()


@app.post("/api/v1/erp/production-events", response_model=WasteLotOut, dependencies=[Depends(require_erp_key)], summary="ERP Üretim Kaydı")
def erp_production(payload: ProductionIn, db: Session = Depends(get_db)):
    db.add(
        ErpSyncLog(
            direction="inbound",
            endpoint="/api/v1/erp/production-events",
            payload_hash=sha256(payload.model_dump_json().encode()).hexdigest()[:16],
            status_code=201,
            notes=payload.erp_work_order,
        )
    )
    try:
        lot = ingest_production(db, payload)
    except Exception as exc:
        raise HTTPException(400, str(exc)) from exc
    return lot


@app.get("/api/v1/erp/waste-status/{lot_code}", dependencies=[Depends(require_erp_key)], summary="ERP Atık Durumu Sorgula")
def erp_status(lot_code: str, db: Session = Depends(get_db)):
    lot = db.query(WasteLot).options(joinedload(WasteLot.events)).filter(WasteLot.lot_code == lot_code).one_or_none()
    if not lot:
        raise HTTPException(404, "Lot bulunamadı")
    return {
        "lot_code": lot.lot_code,
        "status": lot.status,
        "quantity_tons": lot.quantity_tons,
        "stages": [e.stage for e in lot.events],
        "updated_at": lot.events[-1].occurred_at if lot.events else lot.created_at,
    }


@app.get("/api/v1/erp/openapi-hint", summary="ERP Entegrasyon İpucu")
def erp_hint():
    return {
        "auth": "Header X-API-Key: demo-erp-key",
        "inbound": "POST /api/v1/erp/production-events",
        "outbound_status": "GET /api/v1/erp/waste-status/{lot_code}",
        "sample": {
            "facility_code": "F-IST-01",
            "line_code": "L1-HAD",
            "period_date": str(date.today()),
            "output_tons": 120,
            "waste_code": "MET-FE",
            "waste_tons": 9.4,
            "erp_work_order": "SAP-100234",
        },
    }

