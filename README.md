# WasteFlow

Endüstriyel tesis atığını **kaynaktan yeniden kullanıma** izleyen, miktarı tahminleyen ve geri dönüşüm yönlendirmesini otomatikleştiren platform.

## Hedef kapsam

Holding ölçeğinde 6 tesis ailesi:

| Kod | Tesis | Sektör | Tipik atık |
| --- | --- | --- | --- |
| F-IST-01 | Marmara Sac Haddehane | Metal | MET-FE, MET-AL, HAZ-SL |
| F-IZM-02 | Ege Polimer Ekstrüzyon | Plastik | PL-PE, PL-MIX |
| F-ANK-03 | Başkent Gıda İşleme | Gıda | ORG, PAP |
| F-BUR-04 | Uludağ Elektronik Montaj | Elektronik | E-WST |
| F-KO-05 | Doğu Marmara Kimya | Kimya | HAZ-SL |
| F-ADA-06 | Çukurova Ambalaj | Ambalaj | PAP, PL-PE |

Lot yaşam döngüsü: `generated → classified → routed → in_transit → received → processed → closed`.

## Mimari

- **SQL şema:** `sql/schema.sql` (SQLite varsayılan; PostgreSQL ile uyumlu)
- **Backend:** FastAPI + SQLAlchemy (`backend/`)
- **ML:** sentetik üretim + XGBoost / HistGradientBoosting (`ml/`)
- **Otomasyon:** kural motoru (`backend/app/services/automation.py`)
- **Dashboard:** React + Vite (`frontend/`)
- **ERP:** `POST /api/v1/erp/production-events`, `GET /api/v1/erp/waste-status/{lot_code}` (`X-API-Key: demo-erp-key`)

## Çalıştırma

```bash
cd /Users/yusufbaskani/Projects/wasteflow
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

python ml/generate_synthetic.py
python ml/train.py

export PYTHONPATH=backend
uvicorn app.main:app --app-dir backend --reload --port 8000
```

Başka bir terminalde:

```bash
cd frontend
npm install
npm run dev
```

Pano: http://localhost:5173  
API: http://localhost:8000/docs

## Test

```bash
source .venv/bin/activate
PYTHONPATH=backend pytest
```
