import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

# Load environment variables from .env
load_dotenv(BASE_DIR / ".env")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "deepfusionguard-soc-secret-key-2026")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    PORT = int(os.getenv("FLASK_PORT", 5000))
    
    # Database
    DB_PATH = os.getenv("DATABASE_PATH", str(BASE_DIR / "database" / "deepfusionguard.db"))
    
    # Uploads & Data
    UPLOAD_FOLDER = str(BASE_DIR / "uploads")
    SAMPLE_DATA_FOLDER = str(BASE_DIR / "sample_data")
    
    # ML & GNN artifacts
    MODEL_PATH = str(BASE_DIR / "ml" / "model.pkl")
    
    # LLM
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    
    # Fusion Weights
    ML_WEIGHT = float(os.getenv("ML_WEIGHT", 0.60))
    GRAPH_WEIGHT = float(os.getenv("GRAPH_WEIGHT", 0.40))

    # Email / SMTP Authentication Configuration
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", os.getenv("SMTP_USERNAME", "no-reply@deepfusionguard.com"))
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

# Ensure required directories exist
for folder in [
    BASE_DIR / "database",
    BASE_DIR / "uploads",
    BASE_DIR / "sample_data",
    BASE_DIR / "ml",
    BASE_DIR / "gnn",
    BASE_DIR / "fusion",
    BASE_DIR / "llm",
    BASE_DIR / "routes",
    ROOT_DIR / "dataset",
    ROOT_DIR / "notebooks",
    ROOT_DIR / "screenshots"
]:
    folder.mkdir(parents=True, exist_ok=True)
