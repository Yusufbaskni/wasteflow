"""
Sentetik endüstriyel üretim ve atık verisi.

Gerçek tesis verisi yokken model eğitimi ve süreç simülasyonu için kullanılır.
Üretim hacmi, mevsimsellik, tesis kapasitesi ve atık türü katsayıları ile
gerçekçi zaman serileri üretir.
"""

from __future__ import annotations

import math
import random
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from sqlalchemy.orm import Session  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import (  # noqa: E402
    AutomationRule,
    Destination,
    Facility,
    Organization,
    ProductionLine,
    ProductionRecord,
    RecyclingOutcome,
    WasteLot,
    WasteType,
)
from app.services.automation import add_event, route_lot  # noqa: E402

RNG = random.Random(42)

WASTE_CATALOG = [
    ("MET-FE", "Demir-çelik hurdası", "non_hazardous", "recycle", 1, 1),
    ("MET-AL", "Alüminyum talaş", "non_hazardous", "recycle", 1, 1),
    ("PL-PE", "PE/PP proses fire", "non_hazardous", "recycle", 1, 0),
    ("PL-MIX", "Karışık plastik", "non_hazardous", "energy", 1, 0),
    ("ORG", "Organik / biyokütle", "non_hazardous", "reuse", 0, 1),
    ("PAP", "Karton ve kağıt", "non_hazardous", "recycle", 1, 0),
    ("E-WST", "Elektronik kart fire", "hazardous", "recycle", 1, 0),
    ("HAZ-SL", "Tehlikeli çamur", "hazardous", "energy", 0, 0),
]

DESTINATIONS = [
    ("REC-IZM", "Ege Metal Geri Dönüşüm", "recycler", "İzmir", "MET-FE,MET-AL", 120),
    ("REC-IST", "Marmara Plastik Geri Kazanım", "recycler", "İstanbul", "PL-PE,PL-MIX,PAP", 90),
    ("REU-ANK", "İç Anadolu Yeniden Üretim", "reuse_plant", "Ankara", "MET-AL,ORG,MET-FE", 70),
    ("ENR-KO", "Kocaeli RDF / Enerji", "energy_recovery", "Kocaeli", "PL-MIX,HAZ-SL,ORG", 200),
    ("LND-ADA", "Adana Düzenli Depolama", "landfill", "Adana", "HAZ-SL,PL-MIX", 150),
    ("REC-BUR", "Bursa E-atık Ayrıştırma", "recycler", "Bursa", "E-WST", 25),
]

FACILITIES = [
    ("F-IST-01", "Marmara Sac Haddehane", "İstanbul", "metal", 180000, ["L1-HAD", "L2-KES"]),
    ("F-IZM-02", "Ege Polimer Ekstrüzyon", "İzmir", "plastik", 64000, ["L1-EXT", "L2-ENJ"]),
    ("F-ANK-03", "Başkent Gıda İşleme", "Ankara", "gida", 42000, ["L1-HAT", "L2-PAK"]),
    ("F-BUR-04", "Uludağ Elektronik Montaj", "Bursa", "elektronik", 18000, ["L1-SMT", "L2-TEST"]),
    ("F-KO-05", "Doğu Marmara Kimya", "Kocaeli", "kimya", 55000, ["L1-REA", "L2-SEP"]),
    ("F-ADA-06", "Çukurova Ambalaj", "Adana", "ambalaj", 38000, ["L1-OLUK", "L2-BASKI"]),
]

INDUSTRY_WASTE = {
    "metal": [("MET-FE", 0.085), ("MET-AL", 0.025), ("HAZ-SL", 0.004)],
    "plastik": [("PL-PE", 0.06), ("PL-MIX", 0.03), ("PAP", 0.01)],
    "gida": [("ORG", 0.09), ("PAP", 0.02), ("PL-PE", 0.008)],
    "elektronik": [("E-WST", 0.035), ("MET-AL", 0.012), ("PL-MIX", 0.01)],
    "kimya": [("HAZ-SL", 0.04), ("PL-MIX", 0.015), ("ORG", 0.01)],
    "ambalaj": [("PAP", 0.07), ("PL-PE", 0.04), ("PL-MIX", 0.015)],
}


def reset_schema():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed_masters(db: Session) -> dict:
    org = Organization(name="Anadolu Döngüsel Sanayi A.Ş.", sector="holding")
    db.add(org)
    db.flush()

    waste_map = {}
    for code, name, hazard, route, rec, reu in WASTE_CATALOG:
        wt = WasteType(
            code=code,
            name=name,
            hazard_class=hazard,
            default_route=route,
            recyclable=rec,
            reusable=reu,
        )
        db.add(wt)
        db.flush()
        waste_map[code] = wt

    dest_map = {}
    for code, name, kind, city, accepted, cap in DESTINATIONS:
        d = Destination(
            code=code,
            name=name,
            kind=kind,
            city=city,
            accepted_codes=accepted,
            max_daily_tons=cap,
        )
        db.add(d)
        db.flush()
        dest_map[code] = d

    db.add_all(
        [
            AutomationRule(
                name="Yüksek kirlilik beklet",
                waste_type_code="*",
                min_tons=0,
                max_contamination_pct=100,
                action="hold_manual",
                destination_code=None,
                priority=1,
                enabled=0,
            ),
            AutomationRule(name="Temiz metal hurda", waste_type_code="MET-FE", min_tons=0.2, max_contamination_pct=8, action="route_recycle", destination_code="REC-IZM", priority=10, enabled=1),
            AutomationRule(name="Alüminyum yeniden üretim", waste_type_code="MET-AL", min_tons=0.1, max_contamination_pct=6, action="route_reuse", destination_code="REU-ANK", priority=10, enabled=1),
            AutomationRule(name="PE proses fire", waste_type_code="PL-PE", min_tons=0.2, max_contamination_pct=10, action="route_recycle", destination_code="REC-IST", priority=20, enabled=1),
            AutomationRule(name="Karışık plastik enerji", waste_type_code="PL-MIX", min_tons=0.3, max_contamination_pct=25, action="route_energy", destination_code="ENR-KO", priority=40, enabled=1),
            AutomationRule(name="Organik yeniden kullanım", waste_type_code="ORG", min_tons=0.2, max_contamination_pct=15, action="route_reuse", destination_code="REU-ANK", priority=20, enabled=1),
            AutomationRule(name="Karton geri dönüşüm", waste_type_code="PAP", min_tons=0.1, max_contamination_pct=12, action="route_recycle", destination_code="REC-IST", priority=20, enabled=1),
            AutomationRule(name="E-atık lisanslı tesis", waste_type_code="E-WST", min_tons=0.05, max_contamination_pct=20, action="route_recycle", destination_code="REC-BUR", priority=5, enabled=1),
            AutomationRule(name="Tehlikeli çamur enerji", waste_type_code="HAZ-SL", min_tons=0, max_contamination_pct=100, action="route_energy", destination_code="ENR-KO", priority=5, enabled=1),
            AutomationRule(name="Varsayılan manuel kuyruk", waste_type_code="*", min_tons=0, max_contamination_pct=100, action="hold_manual", destination_code=None, priority=200, enabled=1),
        ]
    )

    fac_map = {}
    for code, name, city, industry, cap, lines in FACILITIES:
        fac = Facility(
            organization_id=org.id,
            code=code,
            name=name,
            city=city,
            industry=industry,
            capacity_tpy=cap,
        )
        db.add(fac)
        db.flush()
        fac_map[code] = fac
        for i, lc in enumerate(lines):
            db.add(
                ProductionLine(
                    facility_id=fac.id,
                    code=lc,
                    name=f"{name} {lc}",
                    product_family=industry,
                )
            )
    db.commit()
    return {"waste": waste_map, "fac": fac_map}


def daily_output(capacity_tpy: float, d: date, industry: str) -> float:
    base = capacity_tpy / 365
    seasonal = 1 + 0.12 * math.sin(2 * math.pi * (d.timetuple().tm_yday / 365))
    weekday = 0.35 if d.weekday() >= 5 else 1.0
    trend = 1 + 0.00015 * ((d - date(2024, 1, 1)).days)
    shock = 1.25 if RNG.random() < 0.03 else (0.55 if RNG.random() < 0.02 else 1.0)
    industry_mult = {"metal": 1.0, "plastik": 0.95, "gida": 1.08, "elektronik": 0.9, "kimya": 0.92, "ambalaj": 1.05}[
        industry
    ]
    noise = RNG.uniform(0.9, 1.1)
    return max(0.4, base * seasonal * weekday * trend * shock * industry_mult * noise)


def generate(months: int = 24):
    reset_schema()
    db = SessionLocal()
    try:
        seed_masters(db)
        facilities = db.query(Facility).all()
        waste_by_code = {w.code: w for w in db.query(WasteType).all()}
        start = date.today() - timedelta(days=int(months * 30.5))
        # last complete months
        cursor = start
        days = []
        while cursor < date.today():
            days.append(cursor)
            cursor += timedelta(days=1)

        lot_n = 0
        for fac in facilities:
            lines = fac.lines
            mix = INDUSTRY_WASTE[fac.industry]
            month_acc: dict[tuple[date, str], dict[str, float]] = {}

            for d in days:
                total_out = daily_output(fac.capacity_tpy, d, fac.industry)
                share = total_out / len(lines)
                for line in lines:
                    db.add(
                        ProductionRecord(
                            production_line_id=line.id,
                            period_date=d,
                            output_tons=round(share * RNG.uniform(0.92, 1.08), 3),
                            energy_mwh=round(share * RNG.uniform(0.35, 0.55), 3),
                            water_m3=round(share * RNG.uniform(0.8, 1.6), 3),
                            shift_count=2 if d.weekday() < 5 else 1,
                        )
                    )

                for code, intensity in mix:
                    tons = total_out * intensity * RNG.uniform(0.85, 1.15)
                    month_start = d.replace(day=1)
                    key = (month_start, code)
                    bucket = month_acc.setdefault(key, {"generated": 0.0, "recycled": 0.0, "reused": 0.0, "landfill": 0.0})
                    bucket["generated"] += tons
                    # her 3 günde bir lot
                    if d.day % 3 == 1 and tons > 0.05:
                        lot_n += 1
                        wt = waste_by_code[code]
                        contam = round(abs(RNG.gauss(4.5, 3.2)), 2)
                        lot = WasteLot(
                            lot_code=f"LOT-{fac.code}-{d.strftime('%Y%m%d')}-{lot_n:05d}",
                            facility_id=fac.id,
                            production_line_id=lines[0].id,
                            waste_type_id=wt.id,
                            origin_date=d,
                            quantity_tons=round(tons * 3, 3),
                            contamination_pct=min(contam, 35),
                            status="generated",
                            erp_work_order=f"WO-{fac.code}-{d.strftime('%y%m%d')}",
                        )
                        db.add(lot)
                        db.flush()
                        add_event(db, lot, "generated", "mes", "Üretim kaydı", location=fac.name)
                        route_lot(db, lot)

                        rec_share = 0.0
                        reu_share = 0.0
                        lnd_share = 0.0
                        if lot.status == "closed":
                            dest = lot.destination
                            if dest and dest.kind == "recycler":
                                rec_share = 0.92
                                lnd_share = 0.08
                            elif dest and dest.kind == "reuse_plant":
                                reu_share = 0.88
                                rec_share = 0.07
                                lnd_share = 0.05
                            elif dest and dest.kind == "energy_recovery":
                                rec_share = 0.15
                                lnd_share = 0.2
                            else:
                                lnd_share = 1.0
                        elif lot.destination and lot.destination.kind == "recycler":
                            rec_share = 0.7
                            lnd_share = 0.1
                        elif lot.destination and lot.destination.kind == "reuse_plant":
                            reu_share = 0.65
                            rec_share = 0.1
                        elif lot.destination and lot.destination.kind == "energy_recovery":
                            rec_share = 0.1
                            lnd_share = 0.25
                        else:
                            lnd_share = 0.4
                        q = lot.quantity_tons
                        bucket["recycled"] += q * rec_share
                        bucket["reused"] += q * reu_share
                        bucket["landfill"] += q * lnd_share

            for (month_start, code), bucket in month_acc.items():
                db.add(
                    RecyclingOutcome(
                        facility_id=fac.id,
                        waste_type_id=waste_by_code[code].id,
                        period_date=month_start,
                        generated_tons=round(bucket["generated"], 3),
                        recycled_tons=round(bucket["recycled"], 3),
                        reused_tons=round(bucket["reused"], 3),
                        landfill_tons=round(bucket["landfill"], 3),
                    )
                )

            db.commit()
        print(f"OK lots={db.query(WasteLot).count()} outcomes={db.query(RecyclingOutcome).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    generate()
