from datetime import datetime

from sqlalchemy.orm import Session

from ..models import Facility, ProductionLine, ProductionRecord, WasteLot, WasteType
from .automation import add_event, route_lot


def ingest_production(db: Session, payload) -> WasteLot:
    facility = db.query(Facility).filter(Facility.code == payload.facility_code).one()
    line = (
        db.query(ProductionLine)
        .filter(ProductionLine.facility_id == facility.id, ProductionLine.code == payload.line_code)
        .one()
    )
    waste = db.query(WasteType).filter(WasteType.code == payload.waste_code).one()

    existing = (
        db.query(ProductionRecord)
        .filter(
            ProductionRecord.production_line_id == line.id,
            ProductionRecord.period_date == payload.period_date,
        )
        .one_or_none()
    )
    if existing:
        existing.output_tons += payload.output_tons
        existing.energy_mwh += payload.energy_mwh
        existing.water_m3 += payload.water_m3
        existing.shift_count = max(existing.shift_count, payload.shift_count)
    else:
        db.add(
            ProductionRecord(
                production_line_id=line.id,
                period_date=payload.period_date,
                output_tons=payload.output_tons,
                energy_mwh=payload.energy_mwh,
                water_m3=payload.water_m3,
                shift_count=payload.shift_count,
            )
        )

    lot = WasteLot(
        lot_code=f"LOT-{facility.code}-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}",
        facility_id=facility.id,
        production_line_id=line.id,
        waste_type_id=waste.id,
        origin_date=payload.period_date,
        quantity_tons=payload.waste_tons,
        contamination_pct=payload.contamination_pct,
        status="generated",
        erp_work_order=payload.erp_work_order,
    )
    db.add(lot)
    db.flush()
    add_event(db, lot, "generated", "erp", f"İş emri {payload.erp_work_order or '-'}", location=facility.name)
    route_lot(db, lot)
    db.commit()
    db.refresh(lot)
    return lot
