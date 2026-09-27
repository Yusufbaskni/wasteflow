from datetime import date, datetime

from pydantic import BaseModel, Field


class FacilityOut(BaseModel):
    id: int
    code: str
    name: str
    city: str
    industry: str
    capacity_tpy: float

    model_config = {"from_attributes": True}


class WasteTypeOut(BaseModel):
    id: int
    code: str
    name: str
    hazard_class: str
    default_route: str

    model_config = {"from_attributes": True}


class LotEventOut(BaseModel):
    id: int
    occurred_at: datetime
    stage: str
    location: str | None
    actor: str
    notes: str | None
    quantity_tons: float | None

    model_config = {"from_attributes": True}


class WasteLotOut(BaseModel):
    id: int
    lot_code: str
    facility_id: int
    waste_type_id: int
    origin_date: date
    quantity_tons: float
    contamination_pct: float
    status: str
    destination_id: int | None
    erp_work_order: str | None
    events: list[LotEventOut] = []

    model_config = {"from_attributes": True}


class ProductionIn(BaseModel):
    facility_code: str
    line_code: str
    period_date: date
    output_tons: float
    energy_mwh: float = 0
    water_m3: float = 0
    shift_count: int = 1
    waste_code: str
    waste_tons: float
    contamination_pct: float = 2.0
    erp_work_order: str | None = None


class ForecastOut(BaseModel):
    facility_id: int
    facility_code: str
    waste_type_code: str
    horizon_date: date
    predicted_tons: float
    model_name: str
    mae: float | None


class MetricsOut(BaseModel):
    circularity_rate: float
    recycled_tons: float
    reused_tons: float
    landfill_tons: float
    generated_tons: float
    open_lots: int
    automated_share: float
    predicted_next_30d_tons: float


class AutomationRunOut(BaseModel):
    id: int
    lot_id: int
    ran_at: datetime
    decision: str
    success: int
    detail: str | None

    model_config = {"from_attributes": True}


class ManualRouteIn(BaseModel):
    destination_code: str
    notes: str = Field(default="manuel yönlendirme")
from pydantic import BaseModel
from typing import List

class VisualAnalysisResponse(BaseModel):
    primary_material: str
    purity_score: float
    analysis_method: str
    detected_objects: List[str]

    class Config:
        from_attributes = True
