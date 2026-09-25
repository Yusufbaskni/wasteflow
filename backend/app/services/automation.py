from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from ..models import AutomationRule, AutomationRun, Destination, LotEvent, WasteLot, WasteType

STAGES = [
    "generated",
    "classified",
    "routed",
    "in_transit",
    "received",
    "processed",
    "closed",
]


def add_event(db: Session, lot: WasteLot, stage: str, actor: str, notes: str | None = None, location: str | None = None):
    event = LotEvent(
        lot_id=lot.id,
        occurred_at=datetime.utcnow(),
        stage=stage,
        location=location,
        actor=actor,
        notes=notes,
        quantity_tons=lot.quantity_tons,
    )
    db.add(event)
    lot.status = stage
    return event


def match_rule(db: Session, lot: WasteLot, waste: WasteType) -> AutomationRule | None:
    rules = (
        db.query(AutomationRule)
        .filter(AutomationRule.enabled == 1)
        .order_by(AutomationRule.priority.asc())
        .all()
    )
    for rule in rules:
        if rule.waste_type_code not in (waste.code, "*"):
            continue
        if lot.quantity_tons < rule.min_tons:
            continue
        if lot.contamination_pct > rule.max_contamination_pct:
            continue
        return rule
    return None


def apply_rule(db: Session, lot: WasteLot, rule: AutomationRule | None) -> AutomationRun:
    if rule is None:
        add_event(db, lot, "classified", "automation", "Kural eşleşmedi, manuel onay bekleniyor")
        run = AutomationRun(
            lot_id=lot.id,
            rule_id=None,
            decision="hold_manual",
            success=1,
            detail="Uygun otomatik kural yok",
        )
        db.add(run)
        return run

    dest = None
    if rule.destination_code:
        dest = db.query(Destination).filter(Destination.code == rule.destination_code).one_or_none()

    add_event(db, lot, "classified", "automation", f"Kural: {rule.name}")
    if rule.action.startswith("route") and dest:
        lot.destination_id = dest.id
        add_event(
            db,
            lot,
            "routed",
            "automation",
            f"{rule.action} → {dest.name}",
            location=dest.city,
        )
        add_event(db, lot, "in_transit", "automation", "Sevkiyat oluşturuldu", location=dest.city)
        # Demo: küçük partiler hemen teslim edilmiş gibi kapatılır
        if lot.quantity_tons < 8:
            add_event(db, lot, "received", "destination", "Teslim alındı", location=dest.name)
            add_event(db, lot, "processed", "destination", "İşleme alındı", location=dest.name)
            add_event(db, lot, "closed", "system", "Döngü tamamlandı", location=dest.name)
    elif rule.action == "hold_manual":
        add_event(db, lot, "classified", "automation", "Manuel inceleme kuyruğu")

    run = AutomationRun(
        lot_id=lot.id,
        rule_id=rule.id,
        decision=rule.action,
        success=1,
        detail=rule.name,
    )
    db.add(run)
    return run


def route_lot(db: Session, lot: WasteLot) -> AutomationRun:
    waste = db.query(WasteType).filter(WasteType.id == lot.waste_type_id).one()
    rule = match_rule(db, lot, waste)
    return apply_rule(db, lot, rule)


def advance_in_transit(db: Session) -> int:
    """in_transit partileri bir sonraki aşamaya alır (zamanlayıcı / cron simülasyonu)."""
    moved = 0
    cutoff = datetime.utcnow() - timedelta(hours=6)
    lots = db.query(WasteLot).filter(WasteLot.status == "in_transit").all()
    for lot in lots:
        last = lot.events[-1] if lot.events else None
        if last and last.occurred_at > cutoff and lot.quantity_tons >= 8:
            continue
        dest_name = lot.destination.name if lot.destination else "hedef"
        add_event(db, lot, "received", "destination", "Kapı girişi", location=dest_name)
        add_event(db, lot, "processed", "destination", "Ayıklama / eritme / yeniden üretim", location=dest_name)
        add_event(db, lot, "closed", "system", "Yeniden kullanım döngüsü kapandı", location=dest_name)
        moved += 1
    return moved
