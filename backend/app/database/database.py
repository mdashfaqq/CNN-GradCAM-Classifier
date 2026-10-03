"""Database connection and session management."""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


def _normalize_database_url(url: str) -> str:
    """Force the psycopg2 driver, which is the one installed in requirements.

    Hosting platforms hand out URLs like ``postgres://`` or
    ``postgresql+psycopg://`` (psycopg v3), which SQLAlchemy can't load here.
    """
    for prefix in ("postgresql+psycopg://", "postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg2://" + url[len(prefix):]
    return url


# Only initialize database if DATABASE_URL is set
engine = None
SessionLocal = None

if 'DATABASE_URL' in os.environ and settings.DATABASE_URL:
    try:
        engine = create_engine(_normalize_database_url(settings.DATABASE_URL), pool_pre_ping=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception as e:
        print(f"Warning: Could not initialize database engine: {e}")
        print("Application will run without database support.")

Base = declarative_base()


def get_db():
    """Dependency for getting database sessions."""
    if SessionLocal is None:
        raise RuntimeError("Database not configured. Set DATABASE_URL environment variable.")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
