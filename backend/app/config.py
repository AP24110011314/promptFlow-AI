import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "College Research Digest (CRD) System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "crd_super_secret_jwt_key_2026_advanced_research_digest")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./crd_database.db")
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    STORAGE_DIR: str = os.path.join(BASE_DIR, "storage", "pdfs")
    EXPORTS_DIR: str = os.path.join(BASE_DIR, "storage", "exports")
    ML_MODEL_DIR: str = os.path.join(BASE_DIR, "storage", "ml_models")
    
    class Config:
        case_sensitive = True

settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(settings.EXPORTS_DIR, exist_ok=True)
os.makedirs(settings.ML_MODEL_DIR, exist_ok=True)
