from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from .database import Base

class WasteLotModel(Base):
    __tablename__ = "waste_lots"

    id = Column(String, primary_key=True, index=True)
    material = Column(String, index=True)
    weight_kg = Column(Float)
    facility = Column(String)
    purity = Column(Float)
    status = Column(String, default="YENİ KAYIT")
    created_at = Column(DateTime, default=datetime.utcnow)

class IoTBinModel(Base):
    __tablename__ = "iot_bins"

    bin_id = Column(String, primary_key=True, index=True)
    location = Column(String)
    fill_percentage = Column(Float)
    battery_level = Column(Float)
    last_updated = Column(String)

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    action = Column(String)
    detail = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class UserModel(Base):
    __tablename__ = "users"

    username = Column(String, primary_key=True, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Operatör")
