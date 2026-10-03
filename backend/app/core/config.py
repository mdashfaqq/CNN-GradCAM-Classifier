"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    APP_NAME: str = "AI Visual Inspection Framework"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/ai_inspection"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # AI Model
    MODEL_PATH: str = "weights/road_damage_model.pt"
    MODEL_VERSION: str = "smallresnet-v1"
    DEMO_MODE: bool = True

    # File Uploads
    UPLOAD_DIR: Path = Path("uploads")
    OUTPUT_DIR: Path = Path("outputs")
    # Ensure directories exist
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]

    # Road Damage Classes
    DAMAGE_CLASSES: List[str] = [
        "pothole",
        "longitudinal_crack",
        "transverse_crack",
        "alligator_crack",
        "surface_damage",
        "no_damage",
    ]

    # Severity Levels
    SEVERITY_LEVELS: List[str] = ["low", "medium", "high"]

    # Image Processing
    IMAGE_SIZE: tuple = (224, 224)
    NORMALIZATION_MEAN: tuple = (0.485, 0.456, 0.406)
    NORMALIZATION_STD: tuple = (0.229, 0.224, 0.225)


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
