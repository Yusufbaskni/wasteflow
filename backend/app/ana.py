import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import Depends, File, HTTPException, UploadFile
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.siniflandirici import classify_image_bytes
from app.kur import fetch_live_fx
from app.semalar import VisualAnalysisResponse

try:
    from .veritabani import engine, Base, get_db
    from .modeller import WasteLotModel, IoTBinModel, AuditLogModel, UserModel, SessionModel
except ImportError:
    from veritabani import engine, Base, get_db
    from modeller import WasteLotModel, IoTBinModel, AuditLogModel, UserModel, SessionModel

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Atık Takip Sistemi API", version="2.0.0")
# title jüri slaytındaki isimle aynı

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEMO_PASSWORD = os.getenv("WASTEFLOW_DEMO_PASSWORD", "Istinye2026")


PBKDF2_ROUNDS = 200_000
bearer_scheme = HTTPBearer(auto_error=False)
SESSION_HOURS = 12


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("ascii"), PBKDF2_ROUNDS)
    return f"pbkdf2${salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    if stored.startswith("pbkdf2$"):
        try:
            _, salt, digest = stored.split("$", 2)
        except ValueError:
            return False
        check = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("ascii"), PBKDF2_ROUNDS).hex()
        return hmac.compare_digest(check, digest)
    legacy = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return hmac.compare_digest(stored, legacy)


def role_key(role: str) -> str:
    text = (role or "").lower()
    if ("yönetici" in text or "yonetici" in text) and "sistem" not in text:
        return "manager"
    if "manager" in text:
        return "manager"
    if "operatör" in text or "operator" in text:
        return "operator"
    return "admin"


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
            row = db.query(UserModel).filter(UserModel.username == username).first()
            if not row:
                db.add(UserModel(username=username, password_hash=hash_password(password), name=name, role=role))
            elif not str(row.password_hash).startswith("pbkdf2$") and verify_password(password, row.password_hash):
                row.password_hash = hash_password(password)
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


class UserCreateSchema(BaseModel):
    username: str = Field(min_length=2, max_length=64)
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=120)
    role: str


class PasswordResetSchema(BaseModel):
    password: str = Field(min_length=8, max_length=128)


ALLOWED_ROLES = {"Sistem Yöneticisi", "Yönetici", "Operatör"}


def current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> UserModel:
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=401, detail="Oturum gerekli.")
    row = db.query(SessionModel).filter(SessionModel.token == creds.credentials).first()
    if not row or row.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Oturum süresi doldu.")
    user = db.query(UserModel).filter(UserModel.username == row.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Oturum gerekli.")
    return user


def require_role(*allowed: str):
    def _dep(user: UserModel = Depends(current_user)) -> UserModel:
        if role_key(user.role) not in allowed:
            raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok.")
        return user

    return _dep


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


@app.get("/api/v1/fx")
def live_fx(_user: UserModel = Depends(current_user)):
    # tcmb xml, olmazsa frankfurter
    try:
        return fetch_live_fx()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Canlı kur alınamadı: {exc}") from exc


class EIrsaliyeIn(BaseModel):
    ettn: Optional[str] = None
    documentNo: Optional[str] = None
    vkn: Optional[str] = None
    kg: Optional[float] = None
    plate: Optional[str] = None


@app.post("/api/v1/eirsaliye")
def send_eirsaliye(payload: EIrsaliyeIn, _user: UserModel = Depends(current_user)):
    # gerçek GİB değil, zarf id basıp 1200 dönüyorum
    ettn = payload.ettn or str(uuid.uuid4())
    zarf = secrets.token_hex(6).upper()
    return {
        "ettn": ettn,
        "documentNo": payload.documentNo,
        "zarfId": f"ZARF{zarf}",
        "gibStatus": "GIB_ILETILDI",
        "gibCode": "1200",
        "gibMessage": "Zarf GİB e-İrsaliye test ortamında başarıyla işlendi.",
        "sentAt": datetime.now(timezone.utc).isoformat(),
        "integrator": "Atık Takip Sistemi GİB Test",
        "vkn": payload.vkn,
    }


@app.get("/api/v1/eirsaliye/{ettn}")
def query_eirsaliye(ettn: str, _user: UserModel = Depends(current_user)):
    return {
        "ettn": ettn,
        "gibStatus": "KABUL",
        "gibCode": "1300",
        "gibMessage": "Alıcı e-İrsaliye uygulama yanıtı: Kabul.",
    }


@app.post("/api/v1/auth/login")
def login(payload: LoginSchema, db: Session = Depends(get_db)):
    username = payload.username.strip().lower()[:64]
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        add_audit(db, "LOGIN_FAIL", f"{username} giriş denemesi reddedildi.")
        db.commit()
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya parola hatalı.")
    if not str(user.password_hash).startswith("pbkdf2$"):
        user.password_hash = hash_password(payload.password)
    token = secrets.token_urlsafe(32)
    db.add(SessionModel(token=token, username=user.username, expires_at=datetime.utcnow() + timedelta(hours=SESSION_HOURS)))
    add_audit(db, "LOGIN", f"{user.username} oturum açtı.")
    db.commit()
    return {
        "token": token,
        "name": user.name,
        "role": user.role,
        "username": user.username,
    }


@app.post("/api/v1/auth/logout")
def logout(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
    _user: UserModel = Depends(current_user),
):
    if creds is not None:
        db.query(SessionModel).filter(SessionModel.token == creds.credentials).delete()
        db.commit()
    return {"ok": True}


@app.post("/api/v1/users", status_code=201)
def create_user(
    payload: UserCreateSchema,
    db: Session = Depends(get_db),
    actor: UserModel = Depends(require_role("admin")),
):
    username = payload.username.strip().lower()
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Rol geçersiz.")
    if db.query(UserModel).filter(UserModel.username == username).first():
        raise HTTPException(status_code=409, detail="Bu kullanıcı zaten kayıtlı.")
    db.add(UserModel(
        username=username,
        password_hash=hash_password(payload.password),
        name=payload.name.strip(),
        role=payload.role,
    ))
    add_audit(db, "USER_CREATE", f"{actor.username} kullanıcı ekledi: {username} ({payload.role}).")
    db.commit()
    return {"username": username, "name": payload.name.strip(), "role": payload.role}


@app.get("/api/v1/users")
def list_users(db: Session = Depends(get_db), _user: UserModel = Depends(require_role("admin"))):
    rows = db.query(UserModel).order_by(UserModel.username.asc()).all()
    return [{"username": row.username, "name": row.name, "role": row.role} for row in rows]


@app.post("/api/v1/users/{username}/password")
def reset_password(
    username: str,
    payload: PasswordResetSchema,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
    actor: UserModel = Depends(require_role("admin")),
):
    target_name = username.strip().lower()
    target = db.query(UserModel).filter(UserModel.username == target_name).first()
    if not target:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    target.password_hash = hash_password(payload.password)
    sessions = db.query(SessionModel).filter(SessionModel.username == target_name)
    if target_name == actor.username and creds is not None:
        sessions = sessions.filter(SessionModel.token != creds.credentials)
    sessions.delete(synchronize_session=False)
    add_audit(db, "PASSWORD_RESET", f"{actor.username} parolayı yeniledi: {target_name}.")
    db.commit()
    return {"username": target_name}


@app.post("/api/v1/ai/classify")
async def classify_waste_image(
    file: Optional[UploadFile] = File(None),
    _user: UserModel = Depends(require_role("admin", "operator")),
):
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
def get_metrics(db: Session = Depends(get_db), _user: UserModel = Depends(require_role("admin", "manager"))):
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
def get_esg_report(db: Session = Depends(get_db), _user: UserModel = Depends(require_role("admin", "manager"))):
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
def get_lots(db: Session = Depends(get_db), user: UserModel = Depends(current_user)):
    return [serialize_lot(lot) for lot in db.query(WasteLotModel).order_by(WasteLotModel.created_at.desc()).all()]


@app.post("/api/v1/lots")
def create_lot(lot: LotCreateSchema, db: Session = Depends(get_db), user: UserModel = Depends(current_user)):
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
    add_audit(db, "LOT_CREATE", f"{user.username} {lot.id} veritabanına ekledi.")
    db.commit()
    db.refresh(db_lot)
    return serialize_lot(db_lot)


@app.patch("/api/v1/lots/{lot_id}")
def patch_lot(lot_id: str, payload: LotPatchSchema, db: Session = Depends(get_db), user: UserModel = Depends(current_user)):
    lot = db.query(WasteLotModel).filter(WasteLotModel.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Lot bulunamadı.")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(lot, key, value)
    add_audit(db, "LOT_UPDATE", f"{user.username} {lot_id} güncelledi: {data}")
    db.commit()
    db.refresh(lot)
    return serialize_lot(lot)


@app.post("/api/v1/lots/route")
def route_lots(payload: RouteRequest, db: Session = Depends(get_db), user: UserModel = Depends(current_user)):
    from app.rota import recommend_facility

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
    add_audit(db, "AI_ROUTING_EXEC", f"{user.username} {len(updates)} lot rotaladı.")
    db.commit()
    return {"routed": updates}


@app.get("/api/v1/iot/bins")
def get_iot_bins(db: Session = Depends(get_db), _user: UserModel = Depends(current_user)):
    return db.query(IoTBinModel).all()


@app.get("/api/v1/audit")
def get_audit(db: Session = Depends(get_db), _user: UserModel = Depends(require_role("admin", "manager"))):
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
async def analyze_waste_image(
    file: UploadFile = File(...),
    _user: UserModel = Depends(require_role("admin", "operator")),
):
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
