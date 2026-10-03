"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class InspectionInput(BaseModel):
    """Input data for inspection analysis."""

    source: str = Field(..., description="Input source: mobile_camera, upload, drone, video")
    latitude: Optional[float] = Field(None, description="GPS latitude")
    longitude: Optional[float] = Field(None, description="GPS longitude")
    timestamp: Optional[str] = Field(None, description="ISO timestamp of capture")


class Prediction(BaseModel):
    """Model prediction result."""

    class_: str = Field(..., alias="class", description="Predicted damage class")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence")
    probabilities: dict[str, float] = Field(default_factory=dict, description="All class probabilities")


class Severity(BaseModel):
    """Severity assessment result."""

    label: str = Field(..., description="Severity level: low, medium, high")
    score: float = Field(..., ge=0.0, le=1.0, description="Severity score")


class Explanation(BaseModel):
    """Grad-CAM explanation result."""

    method: str = Field(default="gradcam", description="Explanation method")
    heatmap_url: str = Field(..., description="URL to heatmap image")
    overlay_url: str = Field(..., description="URL to overlay image")


class Location(BaseModel):
    """GPS location data."""

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    timestamp: Optional[str] = None


class AnalysisResponse(BaseModel):
    """Complete analysis response."""

    inspection_id: UUID = Field(..., description="Unique inspection ID")
    prediction: Prediction
    severity: Severity
    explanation: Explanation
    location: Location
    model_version: str
    demo_mode: bool = Field(default=False, description="True if running in demo mode")


class InspectionResponse(BaseModel):
    """Inspection data for API responses."""

    id: UUID
    created_at: datetime
    source: str
    image_path: str
    heatmap_path: Optional[str] = None
    overlay_path: Optional[str] = None
    prediction_class: str
    confidence: float
    severity: str
    severity_score: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gps_accuracy: Optional[float] = None
    model_version: str
    input_timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


class AnalyticsResponse(BaseModel):
    """Analytics statistics."""

    total_inspections: int
    damaged_roads: int
    high_severity: int
    average_confidence: float
    damage_type_distribution: dict[str, int]
    severity_distribution: dict[str, int]
    inspections_over_time: list[dict[str, str | int]]


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    model_loaded: bool
    demo_mode: bool
    database_connected: bool
