"""Database models for inspections."""

import uuid
from datetime import datetime

from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


class Inspection(Base):
    """Inspection model for road damage analysis results."""

    __tablename__ = "inspections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, index=True)

    # Input source
    source: Mapped[str] = mapped_column(String(50), index=True)  # mobile_camera, upload, drone, video

    # File paths
    image_path: Mapped[str] = mapped_column(String(500))
    heatmap_path: Mapped[str] = mapped_column(String(500), nullable=True)
    overlay_path: Mapped[str] = mapped_column(String(500), nullable=True)

    # Prediction results
    prediction_class: Mapped[str] = mapped_column(String(50), index=True)
    confidence: Mapped[float] = mapped_column(Float)

    # Severity
    severity: Mapped[str] = mapped_column(String(20), index=True)
    severity_score: Mapped[float] = mapped_column(Float)

    # Location
    latitude: Mapped[float] = mapped_column(Float, nullable=True, index=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True, index=True)
    gps_accuracy: Mapped[float] = mapped_column(Float, nullable=True)

    # Model metadata
    model_version: Mapped[str] = mapped_column(String(50))

    # Timestamp from input
    input_timestamp: Mapped[datetime] = mapped_column(nullable=True)

    # Indexes for common queries
    __table_args__ = (
        Index("idx_created_at_severity", "created_at", "severity"),
        Index("idx_prediction_class_severity", "prediction_class", "severity"),
        Index("idx_location", "latitude", "longitude"),
    )

    def to_dict(self):
        """Convert model to dictionary."""
        return {
            "id": str(self.id),
            "created_at": self.created_at.isoformat(),
            "source": self.source,
            "image_path": self.image_path,
            "heatmap_path": self.heatmap_path,
            "overlay_path": self.overlay_path,
            "prediction_class": self.prediction_class,
            "confidence": self.confidence,
            "severity": self.severity,
            "severity_score": self.severity_score,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "gps_accuracy": self.gps_accuracy,
            "model_version": self.model_version,
            "input_timestamp": self.input_timestamp.isoformat() if self.input_timestamp else None,
        }
