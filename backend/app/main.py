import hashlib
import hmac
import os
import secrets
from typing import List, Optional

from fastapi import Depends, File, HTTPException, UploadFile
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.classifier import classify_image_bytes
from app.schemas import VisualAnalysisResponse

try:
    from .database import engine, Base, get_db
    from .models import WasteLotModel, IoTBinModel, AuditLogModel, UserModel
except ImportError:
    from database import engine, Base, get_db
    from models import WasteLotModel, IoTBinModel, AuditLogModel, UserModel

Base.metadata.create_all(bind=engine)

app = FastAPI(title="WasteFlow Enterprise Real API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEMO_PASSWORD = os.getenv("WASTEFLOW_DEMO_PASSWORD", "Istinye2026")


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def add_audit(db: Session, action: str, detail: str):
    db.add(AuditLogModel(action=action, detail=detail))


def seed_initial_data(db: Session):
    if db.query(UserModel).count() >= 0:
        demo_users = [
            ("yusuf.baskan", DEMO_PASSWORD, "Yusuf Başkan", "Sistem Yöneticisi"),
            ("operator", "Operator2026", "Saha Operatörü", "Operatör"),
            ("yonetici", "Yonetici2026", "Tesis Yöneticisi", "Yönetici"),
        ]
        for username, password, name, role in demo_users:
            if not db.query(UserModel).filter(UserModel.username == username).first():
                db.add(UserModel(username=username, password_hash=hash_password(password), name=name, role=role))
        db.commit()

    bins = [
        ("BIN-101", "FAC-01 Topkapı Deposu", 86.4, 91.0, "4 dk önce"),
        ("BIN-102", "FAC-02 Zeytinburnu Deposu", 41.8, 77.0, "11 dk önce"),
        ("BIN-103", "FAC-03 Bahçelievler Deposu", 91.7, 63.0, "1 dk önce"),
        ("BIN-104", "FAC-04 İstinye Deposu", 63.2, 82.0, "8 dk önce"),
        ("BIN-105", "FAC-05 Küçükçekmece Deposu", 74.1, 68.0, "6 dk önce"),
    ]
    for bin_id, location, fill, battery, updated in bins:
        row = db.query(IoTBinModel).filter(IoTBinModel.bin_id == bin_id).first()
        if row:
            row.fill_percentage = fill
            row.battery_level = battery
            row.last_updated = updated
        else:
            db.add(IoTBinModel(bin_id=bin_id, location=location, fill_percentage=fill, battery_level=battery, last_updated=updated))
    db.commit()

    lots = [
        ("LOT-8928", "Oluklu Mukavva", 1840.0, "FAC-02 (Zeytinburnu)", 91.2, "İŞLENDİ"),
        ("LOT-8931", "Hurda Demir / Çelik", 1260.0, "FAC-01 (Topkapı)", 88.6, "İŞLENDİ"),
        ("LOT-8934", "PET Plastik", 612.0, "FAC-01 (Topkapı)", 93.8, "İŞLENDİ"),
        ("LOT-8936", "Cam Ambalaj", 940.0, "FAC-04 (İstinye)", 95.4, "İŞLENDİ"),
        ("LOT-8938", "HDPE Plastik", 428.0, "FAC-05 (Küçükçekmece)", 90.1, "İŞLENDİ"),
        ("LOT-8940", "Beyaz Kağıt / Karton", 736.0, "FAC-02 (Zeytinburnu)", 87.9, "İŞLENDİ"),
        ("LOT-8941", "PET Plastik", 468.0, "FAC-01 (Topkapı)", 94.2, "İŞLENDİ"),
        ("LOT-8942", "Oluklu Mukavva", 1520.0, "FAC-02 (Zeytinburnu)", 89.4, "ROTALANDI"),
        ("LOT-8943", "Tehlikeli Kimyasal Atık", 186.0, "FAC-03 (Bahçelievler)", 71.4, "KARANTİNADA"),
        ("LOT-8944", "Cam Ambalaj", 812.0, "FAC-04 (İstinye)", 96.3, "TESLİM EDİLDİ"),
        ("LOT-8945", "HDPE Plastik", 574.0, "FAC-05 (Küçükçekmece)", 88.7, "ROTALANDI"),
        ("LOT-8946", "LDPE Film / Naylon", 390.0, "FAC-01 (Topkapı)", 86.5, "ALINDI"),
        ("LOT-8947", "Elektronik Atık (WEEE)", 142.0, "FAC-03 (Bahçelievler)", 82.1, "ALINDI"),
        ("LOT-8948", "Organik / Gıda Atığı", 318.0, "FAC-04 (İstinye)", 84.6, "YENİ KAYIT"),
        ("LOT-8949", "Lastik / Kauçuk", 960.0, "FAC-05 (Küçükçekmece)", 90.8, "YENİ KAYIT"),
        ("LOT-8950", "Alüminyum Ambalaj", 214.0, "FAC-01 (Topkapı)", 92.7, "ROTALANDI"),
        ("LOT-8951", "Ahşap Palet", 1080.0, "FAC-02 (Zeytinburnu)", 85.3, "İŞLENDİ"),
        ("LOT-8952", "Tekstil / Elyaf", 445.0, "FAC-02 (Zeytinburnu)", 83.8, "TESLİM EDİLDİ"),
        ("LOT-8953", "PP Plastik", 336.0, "FAC-05 (Küçükçekmece)", 89.9, "ALINDI"),
        ("LOT-8954", "Elektronik Atık (WEEE)", 98.0, "FAC-03 (Bahçelievler)", 80.4, "İŞLENDİ"),
        ("LOT-8955", "Karışık Ambalaj", 672.0, "FAC-01 (Topkapı)", 78.2, "YENİ KAYIT"),
        ("LOT-8956", "Organik / Gıda Atığı", 254.0, "FAC-04 (İstinye)", 86.1, "İŞLENDİ"),
        ("LOT-8957", "Hurda Demir / Çelik", 890.0, "FAC-01 (Topkapı)", 87.4, "ROTALANDI"),
        ("LOT-8958", "Tehlikeli Kimyasal Atık", 64.0, "FAC-03 (Bahçelievler)", 68.9, "KARANTİNADA"),
    ]
    for lot_id, material, weight, facility, purity, status in lots:
        row = db.query(WasteLotModel).filter(WasteLotModel.id == lot_id).first()
        if row:
            row.material = material
            row.weight_kg = weight
            row.facility = facility
            row.purity = purity
            row.status = status
        else:
            db.add(WasteLotModel(id=lot_id, material=material, weight_kg=weight, facility=facility, purity=purity, status=status))
    db.commit()


@app.on_event("startup")
def startup_event():
    db = next(get_db())
    seed_initial_data(db)


class LotCreateSchema(BaseModel):
    id: str
    material: str
    weight_kg: float
    facility: str
    purity: float
    status: Optional[str] = "YENİ KAYIT"


class LotPatchSchema(BaseModel):
    material: Optional[str] = None
    weight_kg: Optional[float] = None
    facility: Optional[str] = None
    purity: Optional[float] = None
    status: Optional[str] = None


class LoginSchema(BaseModel):
    username: str
    password: str


class RouteRequest(BaseModel):
    lot_ids: Optional[List[str]] = None


def serialize_lot(lot: WasteLotModel) -> dict:
    return {
        "id": lot.id,
        "material": lot.material,
        "weight": lot.weight_kg,
        "weight_kg": lot.weight_kg,
        "facility": lot.facility,
        "purity": lot.purity,
        "status": lot.status,
    }


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/api/v1/auth/login")
def login(payload: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.username == payload.username.strip().lower()).first()
    if not user or not hmac.compare_digest(user.password_hash, hash_password(payload.password)):
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya parola hatalı.")
    add_audit(db, "LOGIN", f"{user.username} oturum açtı.")
    db.commit()
    return {
        "token": secrets.token_urlsafe(24),
        "name": user.name,
        "role": user.role,
        "username": user.username,
    }


@app.post("/api/v1/ai/classify")
async def classify_waste_image(file: Optional[UploadFile] = File(None)):
    if not file:
        raise HTTPException(status_code=400, detail="Analiz için görsel dosyası gerekli.")
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Boş dosya yüklenemez.")
    try:
        return classify_image_bytes(contents)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Görsel analiz edilemedi: {exc}") from exc


@app.get("/api/v1/analytics/metrics")
def get_metrics(db: Session = Depends(get_db)):
    total_lots = db.query(WasteLotModel).all()
    total_weight = sum(lot.weight_kg or 0 for lot in total_lots)
    recycled = sum(lot.weight_kg or 0 for lot in total_lots if lot.status == "İŞLENDİ")
    reused = sum(lot.weight_kg or 0 for lot in total_lots if lot.status == "ROTALANDI")
    landfilled = sum(lot.weight_kg or 0 for lot in total_lots if lot.status == "KARANTİNADA")
    circularity = round(((recycled + reused) / total_weight * 100), 1) if total_weight > 0 else 0.0
    return {
        "circularity_rate": circularity,
        "recycled_tons": round(recycled / 1000.0, 2),
        "reused_tons": round(reused / 1000.0, 2),
        "landfilled_tons": round(landfilled / 1000.0, 2),
    }


@app.get("/api/v1/esg/report")
def get_esg_report(db: Session = Depends(get_db)):
    total_lots = db.query(WasteLotModel).all()
    total_kg = sum(lot.weight_kg or 0 for lot in total_lots)
    total_tons = total_kg / 1000.0
    return {
        "total_waste_processed_tons": round(total_tons, 2),
        "co2_avoided_tons": round(total_tons * 2.3, 2),
        "trees_saved": int(total_tons * 14),
        "water_saved_liters": round(total_tons * 31500, 0),
        "esg_compliance_score": "AA+ (GRI & CSRD Uyumlu Veritabanı)",
    }


@app.get("/api/v1/lots")
def get_lots(db: Session = Depends(get_db)):
    return [serialize_lot(lot) for lot in db.query(WasteLotModel).order_by(WasteLotModel.created_at.desc()).all()]


@app.post("/api/v1/lots")
def create_lot(lot: LotCreateSchema, db: Session = Depends(get_db)):
    existing = db.query(WasteLotModel).filter(WasteLotModel.id == lot.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Bu LOT ID zaten kayıtlı.")
    db_lot = WasteLotModel(
        id=lot.id,
        material=lot.material,
        weight_kg=lot.weight_kg,
        facility=lot.facility,
        purity=lot.purity,
        status=lot.status or "YENİ KAYIT",
    )
    db.add(db_lot)
    add_audit(db, "LOT_CREATE", f"{lot.id} veritabanına eklendi.")
    db.commit()
    db.refresh(db_lot)
    return serialize_lot(db_lot)


@app.patch("/api/v1/lots/{lot_id}")
def patch_lot(lot_id: str, payload: LotPatchSchema, db: Session = Depends(get_db)):
    lot = db.query(WasteLotModel).filter(WasteLotModel.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Lot bulunamadı.")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(lot, key, value)
    add_audit(db, "LOT_UPDATE", f"{lot_id} güncellendi: {data}")
    db.commit()
    db.refresh(lot)
    return serialize_lot(lot)


@app.post("/api/v1/lots/route")
def route_lots(payload: RouteRequest, db: Session = Depends(get_db)):
    from app.routing import recommend_facility

    query = db.query(WasteLotModel)
    if payload.lot_ids:
        query = query.filter(WasteLotModel.id.in_(payload.lot_ids))
    else:
        query = query.filter(WasteLotModel.status.in_(["YENİ KAYIT", "CSV AKTARILDI"]))
    lots = query.all()
    if not lots:
        raise HTTPException(status_code=400, detail="Rotalanacak yeni lot yok.")
    updates = []
    for lot in lots:
        rec = recommend_facility(lot.material)
        lot.facility = rec["facility"]
        lot.status = "ROTALANDI"
        updates.append({"id": lot.id, **rec})
    add_audit(db, "AI_ROUTING_EXEC", f"{len(updates)} lot otomatik rotalandı.")
    db.commit()
    return {"routed": updates}


@app.get("/api/v1/iot/bins")
def get_iot_bins(db: Session = Depends(get_db)):
    return db.query(IoTBinModel).all()


@app.get("/api/v1/audit")
def get_audit(db: Session = Depends(get_db)):
    rows = db.query(AuditLogModel).order_by(AuditLogModel.id.desc()).limit(100).all()
    return [
        {
            "id": row.id,
            "action": row.action,
            "detail": row.detail,
            "timestamp": row.timestamp.strftime("%H:%M:%S") if row.timestamp else "",
        }
        for row in rows
    ]


@app.post("/api/v1/analyze-image", response_model=VisualAnalysisResponse)
async def analyze_waste_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Lütfen geçerli bir görsel dosyası yükleyin.")
    contents = await file.read()
    result = classify_image_bytes(contents)
    return {
        "primary_material": result["detected_material"],
        "purity_score": result["recyclability_percentage"],
        "analysis_method": result.get("analysis_method", "histogram"),
        "detected_objects": [result["detected_material"]],
    }
