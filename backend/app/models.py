from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    sector: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    facilities: Mapped[list["Facility"]] = relationship(back_populates="organization")


class Facility(Base):
    __tablename__ = "facilities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"))
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    city: Mapped[str] = mapped_column(String, nullable=False)
    industry: Mapped[str] = mapped_column(String, nullable=False)
    capacity_tpy: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    organization: Mapped[Organization] = relationship(back_populates="facilities")
    lines: Mapped[list["ProductionLine"]] = relationship(back_populates="facility")
    lots: Mapped[list["WasteLot"]] = relationship(back_populates="facility")


class ProductionLine(Base):
    __tablename__ = "production_lines"
    __table_args__ = (UniqueConstraint("facility_id", "code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"))
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    product_family: Mapped[str] = mapped_column(String, nullable=False)

    facility: Mapped[Facility] = relationship(back_populates="lines")
    records: Mapped[list["ProductionRecord"]] = relationship(back_populates="line")


class WasteType(Base):
    __tablename__ = "waste_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    hazard_class: Mapped[str] = mapped_column(String, nullable=False)
    default_route: Mapped[str] = mapped_column(String, nullable=False)
    recyclable: Mapped[int] = mapped_column(Integer, default=1)
    reusable: Mapped[int] = mapped_column(Integer, default=0)


class Destination(Base):
    __tablename__ = "destinations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    kind: Mapped[str] = mapped_column(String, nullable=False)
    city: Mapped[str] = mapped_column(String, nullable=False)
    accepted_codes: Mapped[str] = mapped_column(String, nullable=False)
    max_daily_tons: Mapped[float] = mapped_column(Float, nullable=False)


class ProductionRecord(Base):
    __tablename__ = "production_records"
    __table_args__ = (UniqueConstraint("production_line_id", "period_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    production_line_id: Mapped[int] = mapped_column(ForeignKey("production_lines.id"))
    period_date: Mapped[date] = mapped_column(Date, nullable=False)
    output_tons: Mapped[float] = mapped_column(Float, nullable=False)
    energy_mwh: Mapped[float] = mapped_column(Float, nullable=False)
    water_m3: Mapped[float] = mapped_column(Float, nullable=False)
    shift_count: Mapped[int] = mapped_column(Integer, nullable=False)

    line: Mapped[ProductionLine] = relationship(back_populates="records")


class WasteLot(Base):
    __tablename__ = "waste_lots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lot_code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"))
    production_line_id: Mapped[int | None] = mapped_column(ForeignKey("production_lines.id"), nullable=True)
    waste_type_id: Mapped[int] = mapped_column(ForeignKey("waste_types.id"))
    origin_date: Mapped[date] = mapped_column(Date, nullable=False)
    quantity_tons: Mapped[float] = mapped_column(Float, nullable=False)
    contamination_pct: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String, nullable=False)
    destination_id: Mapped[int | None] = mapped_column(ForeignKey("destinations.id"), nullable=True)
    erp_work_order: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    facility: Mapped[Facility] = relationship(back_populates="lots")
    waste_type: Mapped[WasteType] = relationship()
    destination: Mapped[Destination | None] = relationship()
    events: Mapped[list["LotEvent"]] = relationship(back_populates="lot", order_by="LotEvent.occurred_at")


class LotEvent(Base):
    __tablename__ = "lot_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lot_id: Mapped[int] = mapped_column(ForeignKey("waste_lots.id"))
    occurred_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    stage: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    actor: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    quantity_tons: Mapped[float | None] = mapped_column(Float, nullable=True)

    lot: Mapped[WasteLot] = relationship(back_populates="events")


class RecyclingOutcome(Base):
    __tablename__ = "recycling_outcomes"
    __table_args__ = (UniqueConstraint("facility_id", "waste_type_id", "period_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"))
    waste_type_id: Mapped[int] = mapped_column(ForeignKey("waste_types.id"))
    period_date: Mapped[date] = mapped_column(Date, nullable=False)
    generated_tons: Mapped[float] = mapped_column(Float, nullable=False)
    recycled_tons: Mapped[float] = mapped_column(Float, nullable=False)
    reused_tons: Mapped[float] = mapped_column(Float, nullable=False)
    landfill_tons: Mapped[float] = mapped_column(Float, nullable=False)


class Forecast(Base):
    __tablename__ = "forecasts"
    __table_args__ = (UniqueConstraint("facility_id", "waste_type_id", "horizon_date", "model_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"))
    waste_type_id: Mapped[int] = mapped_column(ForeignKey("waste_types.id"))
    horizon_date: Mapped[date] = mapped_column(Date, nullable=False)
    predicted_tons: Mapped[float] = mapped_column(Float, nullable=False)
    model_name: Mapped[str] = mapped_column(String, nullable=False)
    mae: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    waste_type_code: Mapped[str] = mapped_column(String, nullable=False)
    min_tons: Mapped[float] = mapped_column(Float, default=0)
    max_contamination_pct: Mapped[float] = mapped_column(Float, default=100)
    action: Mapped[str] = mapped_column(String, nullable=False)
    destination_code: Mapped[str | None] = mapped_column(String, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=100)
    enabled: Mapped[int] = mapped_column(Integer, default=1)


class AutomationRun(Base):
    __tablename__ = "automation_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lot_id: Mapped[int] = mapped_column(ForeignKey("waste_lots.id"))
    rule_id: Mapped[int | None] = mapped_column(ForeignKey("automation_rules.id"), nullable=True)
    ran_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    decision: Mapped[str] = mapped_column(String, nullable=False)
    success: Mapped[int] = mapped_column(Integer, nullable=False)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)


class ErpSyncLog(Base):
    __tablename__ = "erp_sync_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    direction: Mapped[str] = mapped_column(String, nullable=False)
    endpoint: Mapped[str] = mapped_column(String, nullable=False)
    payload_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
