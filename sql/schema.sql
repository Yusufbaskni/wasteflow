-- WasteFlow: endüstriyel atık ve döngüsel ekonomi şeması
-- PostgreSQL uyumlu; SQLite için AUTOINCREMENT eşdeğeri uygulama tarafında üretilir.

CREATE TABLE IF NOT EXISTS organizations (
    id              INTEGER PRIMARY KEY,
    name            TEXT NOT NULL,
    sector          TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facilities (
    id              INTEGER PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    code            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    city            TEXT NOT NULL,
    industry        TEXT NOT NULL,
    capacity_tpy    REAL NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_lines (
    id              INTEGER PRIMARY KEY,
    facility_id     INTEGER NOT NULL REFERENCES facilities(id),
    code            TEXT NOT NULL,
    name            TEXT NOT NULL,
    product_family  TEXT NOT NULL,
    UNIQUE (facility_id, code)
);

CREATE TABLE IF NOT EXISTS waste_types (
    id                  INTEGER PRIMARY KEY,
    code                TEXT NOT NULL UNIQUE,
    name                TEXT NOT NULL,
    hazard_class        TEXT NOT NULL,
    default_route       TEXT NOT NULL,
    recyclable          INTEGER NOT NULL DEFAULT 1,
    reusable            INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS destinations (
    id              INTEGER PRIMARY KEY,
    code            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    kind            TEXT NOT NULL, -- recycler | reuse_plant | landfill | energy_recovery
    city            TEXT NOT NULL,
    accepted_codes  TEXT NOT NULL, -- comma-separated waste type codes
    max_daily_tons  REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS production_records (
    id                  INTEGER PRIMARY KEY,
    production_line_id  INTEGER NOT NULL REFERENCES production_lines(id),
    period_date         DATE NOT NULL,
    output_tons         REAL NOT NULL,
    energy_mwh          REAL NOT NULL,
    water_m3            REAL NOT NULL,
    shift_count         INTEGER NOT NULL,
    UNIQUE (production_line_id, period_date)
);

CREATE TABLE IF NOT EXISTS waste_lots (
    id                  INTEGER PRIMARY KEY,
    lot_code            TEXT NOT NULL UNIQUE,
    facility_id         INTEGER NOT NULL REFERENCES facilities(id),
    production_line_id  INTEGER REFERENCES production_lines(id),
    waste_type_id       INTEGER NOT NULL REFERENCES waste_types(id),
    origin_date         DATE NOT NULL,
    quantity_tons       REAL NOT NULL,
    contamination_pct   REAL NOT NULL DEFAULT 0,
    status              TEXT NOT NULL,
    destination_id      INTEGER REFERENCES destinations(id),
    erp_work_order      TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lot_events (
    id              INTEGER PRIMARY KEY,
    lot_id          INTEGER NOT NULL REFERENCES waste_lots(id),
    occurred_at     TIMESTAMP NOT NULL,
    stage           TEXT NOT NULL,
    location        TEXT,
    actor           TEXT NOT NULL,
    notes           TEXT,
    quantity_tons   REAL
);

CREATE TABLE IF NOT EXISTS recycling_outcomes (
    id                  INTEGER PRIMARY KEY,
    facility_id         INTEGER NOT NULL REFERENCES facilities(id),
    waste_type_id       INTEGER NOT NULL REFERENCES waste_types(id),
    period_date         DATE NOT NULL,
    generated_tons      REAL NOT NULL,
    recycled_tons       REAL NOT NULL,
    reused_tons         REAL NOT NULL,
    landfill_tons       REAL NOT NULL,
    UNIQUE (facility_id, waste_type_id, period_date)
);

CREATE TABLE IF NOT EXISTS forecasts (
    id                  INTEGER PRIMARY KEY,
    facility_id         INTEGER NOT NULL REFERENCES facilities(id),
    waste_type_id       INTEGER NOT NULL REFERENCES waste_types(id),
    horizon_date        DATE NOT NULL,
    predicted_tons      REAL NOT NULL,
    model_name          TEXT NOT NULL,
    mae                 REAL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (facility_id, waste_type_id, horizon_date, model_name)
);

CREATE TABLE IF NOT EXISTS automation_rules (
    id              INTEGER PRIMARY KEY,
    name            TEXT NOT NULL,
    waste_type_code TEXT NOT NULL,
    min_tons        REAL NOT NULL DEFAULT 0,
    max_contamination_pct REAL NOT NULL DEFAULT 100,
    action          TEXT NOT NULL, -- route_recycle | route_reuse | route_energy | hold_manual
    destination_code TEXT,
    priority        INTEGER NOT NULL DEFAULT 100,
    enabled         INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS automation_runs (
    id              INTEGER PRIMARY KEY,
    lot_id          INTEGER NOT NULL REFERENCES waste_lots(id),
    rule_id         INTEGER REFERENCES automation_rules(id),
    ran_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decision        TEXT NOT NULL,
    success         INTEGER NOT NULL,
    detail          TEXT
);

CREATE TABLE IF NOT EXISTS erp_sync_log (
    id              INTEGER PRIMARY KEY,
    direction       TEXT NOT NULL, -- inbound | outbound
    endpoint        TEXT NOT NULL,
    payload_hash    TEXT,
    status_code     INTEGER,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_lots_facility_date ON waste_lots(facility_id, origin_date);
CREATE INDEX IF NOT EXISTS idx_events_lot ON lot_events(lot_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_prod_line_date ON production_records(production_line_id, period_date);
CREATE INDEX IF NOT EXISTS idx_outcomes_facility_date ON recycling_outcomes(facility_id, period_date);
