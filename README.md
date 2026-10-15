# WasteFlow

**Lot-level waste tracking for licensed Istanbul facilities** — graduation / jury demo for İstinye University.

Track packaging, metal, glass, organic, and WEEE from weigh-in through route, e-delivery note, sale (Başer / Star), staffing, and ESG reporting across five licensed sites: **Topkapı, Zeytinburnu, Bahçelievler, İstinye, and Küçükçekmece**.

| | |
| --- | --- |
| **UI** | Electron + React (Vite) |
| **API** | FastAPI — offline-friendly: falls back to `localStorage` when the API is down |
| **Maps & routes** | OpenStreetMap · OSRM |
| **FX rates** | TCMB |
| **Demo limits** | No live GİB · no real GPS (e-irsaliye test envelope · simulated fleet pings) |

**Live demo (browser):** [http://localhost:5173](http://localhost:5173)  
**API docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Features

- Lot inventory with EWC codes, QR, and weighbridge tickets
- Collection points + map of 5 depots
- 15+ vehicles, road routing, plate / IMEI registry
- e-İrsaliye (TEMELIRSALIYE, UBL XML, GİB test codes)
- Sales desk: Başer Çerkezköy, Star Hadımköy, per-kg price comparison
- HR / manager messages, fictional IoT fill levels, PDF reports
- P&L from sales tickets — stock is not inflated by “sold” status

---

## Demo logins

| User | Password | Role |
| --- | --- | --- |
| `yusuf.baskan` | `Istinye2026` | System |
| `operator` | `Operator2026` | Field |
| `yonetici` | `Yonetici2026` | Depot manager |

---

## Requirements

- **Python** 3.12+
- **Node.js** 20+

Optional:

- Docker (Postgres via `docker-compose.yml`)
- `backend/yolov8n.pt` for the vision classifier tab (without it that tab stalls; the rest of the app still runs)

---

## Quick start

### 1. Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

export PYTHONPATH=backend
uvicorn app.ana:app --app-dir backend --reload --port 8000
```

### 2. Frontend (second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs).

### Optional Postgres

```bash
docker compose up -d
```

Default compose credentials: database / user / password = `wasteflow` on port `5432`.

---

## Desktop builds

**macOS (Dock app):**

```bash
cd frontend
npm run electron:build
```

Output: `frontend/release/mac-arm64/WasteFlow.app`

**Windows portable exe:**

```bash
cd frontend
npm run electron:build:win
```

Output: `frontend/release/Atik-Takip-Sistemi-Windows.exe`

Dev with Electron:

```bash
cd frontend
npm run electron:dev
```

---

## Tests

```bash
source .venv/bin/activate
PYTHONPATH=backend pytest
```

---

## Repository layout

```text
├── frontend/          Vite + React + Electron (`elektron.cjs`; tabs in `src/Uygulama.jsx`)
├── backend/app/       FastAPI — login, lots, FX (`kur.py`), e-irsaliye, vision
├── backend/tests/     Pytest suite
├── ml/                Synthetic data / model experiments (not required for the demo)
├── sql/               Postgres schema for Docker
├── basvuru/           TÜBİTAK 2209-A application materials
└── docker-compose.yml Postgres 16
```

### Data & persistence

| Store | Notes |
| --- | --- |
| Browser `localStorage` key `wasteflow.v1` | Primary offline / demo state |
| `backend/wasteflow.db` | Local SQLite — **not** committed to git |
| Postgres (optional) | Via Docker Compose + `sql/schema.sql` |

---

## Stack at a glance

| Layer | Tech |
| --- | --- |
| Desktop / web UI | React 18, Vite 6, Electron 33, Leaflet, Recharts |
| API | FastAPI, SQLAlchemy, Alembic, Pydantic |
| Vision (optional) | Ultralytics YOLO (`yolov8n.pt`) |
| External (demo) | OSM, OSRM, TCMB rates |

---

## Intentional demo limits

- **e-İrsaliye:** GİB test envelope only — not a live integrator.
- **Fleet GPS:** Simulated pings, not real device telemetry.
- **IoT fill levels:** Illustrative / fictional for the jury demo.
- **Vision tab:** Needs a local `yolov8n.pt` weights file under `backend/`.

---

## License

Academic / demo project for İstinye University. Not published as a commercial product.
