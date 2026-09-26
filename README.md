# WasteFlow

İstinye Üniversitesi bitirme / jüri demosu. İstanbul’da beş lisanslı tesiste (Topkapı, Zeytinburnu, Bahçelievler, İstinye, Küçükçekmece) toplanan ambalaj, metal, cam, organik ve WEEE’yi lot olarak takip ediyorum: tartım, rota, e-irsaliye, Başer / Star satışı, kadro, ESG.

Asıl ekran Electron + React. API FastAPI; açık değilse uygulama localStorage ile devam ediyor. Harita OSM, kur TCMB, araç güzergâhı OSRM. Canlı GİB ve gerçek GPS yok — e-irsaliye test zarfı, filo ping’i simülasyon.

## Ne var

- Lot envanteri, EWC, QR, kantar fişi
- Toplama noktaları + 5 depo haritası
- 15+ araç, yol rotası, plaka / IMEI kaydı
- e-İrsaliye (TEMELIRSALIYE, UBL XML, GİB test kodları)
- Satış: Başer Çerkezköy, Star Hadımköy, 1 kg fiyat karşılaştırması
- İK / müdür mesajları, IoT doluluk (kurgusal), rapor PDF
- P&L satış fişine göre; stok “satıldı” diye şişirilmiyor

Giriş (demo):

| kullanıcı | parola | rol |
| --- | --- | --- |
| yusuf.baskan | Istinye2026 | sistem |
| operator | Operator2026 | saha |
| yonetici | Yonetici2026 | depo müdürü |

## Çalıştırma

Python 3.12+ ve Node 20 yeterli.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

export PYTHONPATH=backend
uvicorn app.main:app --app-dir backend --reload --port 8000
```

Ayrı terminal:

```bash
cd frontend
npm install
npm run dev
```

Tarayıcı: http://localhost:5173  
Swagger: http://localhost:8000/docs

Görsel sınıflandırıcı için `backend/` altında `yolov8n.pt` lazım; yoksa o sekme takılır, gerisi açılır.

Mac masaüstü (Dock):

```bash
cd frontend
npm run electron:build
```

Çıktı `frontend/release/mac-arm64/WasteFlow.app`. Windows taşınabilir exe: `npm run electron:build:win` → `frontend/release/WasteFlow-Windows.exe`.

## Test

```bash
source .venv/bin/activate
PYTHONPATH=backend pytest
```

## Klasörler

- `frontend/` — Vite, Electron (`electron.cjs`), sekmeler `src/App.jsx`
- `backend/app/` — login, lot, kur (`fx.py`), e-irsaliye, görsel analiz
- `ml/` — sentetik veri / model denemesi, demoda zorunlu değil

Veri tarayıcıda `wasteflow.v1` anahtarında. SQLite `backend/wasteflow.db` git’e girmiyor.
