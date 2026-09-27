from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "wasteflow.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"
MODEL_DIR = ROOT / "ml" / "artifacts"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
ERP_API_KEY = "demo-erp-key"
