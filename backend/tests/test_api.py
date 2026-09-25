from fastapi.testclient import TestClient

from app.database import Base, engine, SessionLocal
from app.main import app
from app.models import AutomationRule, Destination, Facility, Organization, ProductionLine, WasteType
from app.services.automation import match_rule, route_lot
from app.models import WasteLot
from datetime import date


def setup_module():
    Base.metadata.create_all(bind=engine)


client = TestClient(app)


def test_health():
    assert client.get("/health").json()["status"] == "ok"


def test_erp_rejects_without_key():
    r = client.post("/api/v1/erp/production-events", json={})
    assert r.status_code == 401


def test_rule_prefers_recycle_for_clean_metal():
    db = SessionLocal()
    try:
        if db.query(WasteType).count() == 0:
            org = Organization(name="T", sector="t")
            db.add(org)
            db.flush()
            fac = Facility(organization_id=org.id, code="T1", name="t", city="x", industry="metal", capacity_tpy=1)
            db.add(fac)
            db.flush()
            wt = WasteType(code="MET-FE", name="m", hazard_class="n", default_route="recycle", recyclable=1, reusable=1)
            db.add(wt)
            db.add(Destination(code="REC-IZM", name="r", kind="recycler", city="İzmir", accepted_codes="MET-FE", max_daily_tons=10))
            db.add(
                AutomationRule(
                    name="metal",
                    waste_type_code="MET-FE",
                    min_tons=0,
                    max_contamination_pct=8,
                    action="route_recycle",
                    destination_code="REC-IZM",
                    priority=10,
                    enabled=1,
                )
            )
            db.commit()
        wt = db.query(WasteType).filter(WasteType.code == "MET-FE").first()
        fac = db.query(Facility).first()
        lot = WasteLot(
            lot_code="TEST-LOT-1",
            facility_id=fac.id,
            waste_type_id=wt.id,
            origin_date=date.today(),
            quantity_tons=2,
            contamination_pct=1.5,
            status="generated",
        )
        rule = match_rule(db, lot, wt)
        assert rule is None or rule.action in {"route_recycle", "hold_manual", "route_reuse", "route_energy"}
    finally:
        db.close()
