"""FastAPI application for AI Visual Inspection Framework."""

import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
from sqlalchemy.orm import Session

from app.ai.gradcam import generate_gradcam
from app.ai.inference import inference_service
from app.core.config import settings
from app.database.database import Base, engine, get_db
from app.models.inspection import Inspection
from app.schemas.inspection import (
    AnalysisResponse,
    AnalyticsResponse,
    HealthResponse,
    InspectionResponse,
    Location,
    Prediction,
    Severity,
)
from app.services.severity import severity_service

# Create database tables (with error handling for missing database)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create database tables: {e}")
    print("The application will run in database-less mode if no database is configured.")

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories for uploads and outputs
try:
    app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
    app.mount("/outputs", StaticFiles(directory=str(settings.OUTPUT_DIR)), name="outputs")
except Exception as e:
    print(f"Warning: Could not mount static directories: {e}")

# Initialize AI model on startup
@app.on_event("startup")
async def startup_event():
    """Initialize AI model on application startup."""
    model_loaded = inference_service.load_model()
    if not model_loaded:
        print("Running in DEMO MODE - model not loaded")
    else:
        print("Model loaded successfully")


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    try:
        # Test database connection
        db = next(get_db())
        db.execute("SELECT 1")
        db.close()
        db_connected = True
    except Exception:
        db_connected = False

    return HealthResponse(
        status="healthy",
        model_loaded=inference_service.is_model_loaded(),
        demo_mode=settings.DEMO_MODE or not inference_service.is_model_loaded(),
        database_connected=db_connected,
    )


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_image(
    image: UploadFile = File(...),
    source: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    timestamp: Optional[str] = Form(None),
):
    """Analyze uploaded road damage image.

    Args:
        image: Uploaded image file
        source: Input source (mobile_camera, upload, drone, video)
        latitude: Optional GPS latitude
        longitude: Optional GPS longitude
        timestamp: Optional ISO timestamp

    Returns:
        AnalysisResponse with prediction, severity, and explanation
    """
    # Get database session if available
    db = None
    if 'DATABASE_URL' in os.environ:
        try:
            db = next(get_db())
        except:
            pass
    # Validate source
    if source not in ["mobile_camera", "upload", "drone", "video"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid source: {source}",
        )

    # Validate image
    if image.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image type: {image.content_type}",
        )

    if image.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image too large: {image.size} bytes (max {settings.MAX_UPLOAD_SIZE})",
        )

    # Generate unique inspection ID
    inspection_id = uuid.uuid4()

    # Save uploaded image
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    image_filename = f"{inspection_id}{Path(image.filename).suffix}"
    image_path = settings.UPLOAD_DIR / image_filename

    async with aiofiles.open(image_path, "wb") as f:
        content = await image.read()
        await f.write(content)

    # Validate image can be opened
    try:
        pil_image = Image.open(image_path)
        pil_image.load()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image file: {str(e)}",
        )

    # Run AI inference
    prediction_result = inference_service.predict(pil_image)

    # Calculate severity
    severity_result = severity_service.calculate_severity(
        predicted_class=prediction_result["class"],
        confidence=prediction_result["confidence"],
        probabilities=prediction_result["probabilities"],
    )

    # Generate Grad-CAM explanation
    model = inference_service.model if inference_service.is_model_loaded() else None
    predicted_class_idx = settings.DAMAGE_CLASSES.index(prediction_result["class"])
    gradcam_result = generate_gradcam(
        model=model,
        image=pil_image,
        predicted_class_idx=predicted_class_idx,
        output_dir=settings.OUTPUT_DIR,
        inspection_id=str(inspection_id),
    )

    # Save inspection to database
    inspection = Inspection(
        id=inspection_id,
        source=source,
        image_path=str(image_path),
        heatmap_path=gradcam_result["heatmap_url"].replace("/api/outputs/", ""),
        overlay_path=gradcam_result["overlay_url"].replace("/api/outputs/", ""),
        prediction_class=prediction_result["class"],
        confidence=prediction_result["confidence"],
        severity=severity_result["label"],
        severity_score=severity_result["score"],
        latitude=latitude,
        longitude=longitude,
        model_version=settings.MODEL_VERSION,
        input_timestamp=datetime.fromisoformat(timestamp) if timestamp else None,
    )

    # Save inspection to database if available
    if db:
        try:
            db.add(inspection)
            db.commit()
            db.refresh(inspection)
        except Exception as e:
            print(f"Warning: Could not save inspection to database: {e}")
            # Continue without database persistence

    # Build response
    return AnalysisResponse(
        inspection_id=inspection_id,
        prediction=Prediction(
            class_=prediction_result["class"],
            confidence=prediction_result["confidence"],
            probabilities=prediction_result["probabilities"],
        ),
        severity=Severity(
            label=severity_result["label"],
            score=severity_result["score"],
        ),
        explanation=gradcam_result,
        location=Location(
            latitude=latitude,
            longitude=longitude,
        ),
        model_version=settings.MODEL_VERSION,
        demo_mode=not inference_service.is_model_loaded(),
    )


@app.get("/api/inspections", response_model=list[InspectionResponse])
async def get_inspections(
    skip: int = 0,
    limit: int = 50,
):
    """Get list of inspections with pagination."""
    if 'DATABASE_URL' not in os.environ:
        return []

    try:
        db = next(get_db())
        inspections = (
            db.query(Inspection)
            .order_by(Inspection.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return inspections
    except Exception as e:
        print(f"Warning: Could not fetch inspections from database: {e}")
        return []


@app.get("/api/inspections/{inspection_id}", response_model=InspectionResponse)
async def get_inspection(inspection_id: uuid.UUID):
    """Get inspection by ID."""
    if 'DATABASE_URL' not in os.environ:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found",
        )

    try:
        db = next(get_db())
        inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if not inspection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inspection not found",
            )
        return inspection
    except HTTPException:
        raise
    except Exception as e:
        print(f"Warning: Could not fetch inspection from database: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found",
        )


@app.get("/api/analytics", response_model=AnalyticsResponse)
async def get_analytics():
    """Get analytics statistics."""
    if 'DATABASE_URL' not in os.environ:
        return AnalyticsResponse(
            total_inspections=0,
            damaged_roads=0,
            high_severity=0,
            average_confidence=0.0,
            damage_type_distribution={},
            severity_distribution={},
            inspections_over_time=[],
        )

    try:
        db = next(get_db())
        total_inspections = db.query(Inspection).count()

        if total_inspections == 0:
            return AnalyticsResponse(
                total_inspections=0,
                damaged_roads=0,
                high_severity=0,
                average_confidence=0.0,
                damage_type_distribution={},
                severity_distribution={},
                inspections_over_time=[],
            )

        damaged_roads = (
            db.query(Inspection)
            .filter(Inspection.prediction_class != "no_damage")
            .count()
        )

        high_severity = (
            db.query(Inspection)
            .filter(Inspection.severity == "high")
            .count()
        )

        avg_confidence_result = db.query(Inspection.confidence).all()
        average_confidence = sum(c[0] for c in avg_confidence_result) / len(avg_confidence_result)

        # Damage type distribution
        damage_type_dist = {}
        for cls in settings.DAMAGE_CLASSES:
            count = (
                db.query(Inspection)
                .filter(Inspection.prediction_class == cls)
                .count()
            )
            if count > 0:
                damage_type_dist[cls] = count

        # Severity distribution
        severity_dist = {}
        for sev in settings.SEVERITY_LEVELS:
            count = (
                db.query(Inspection)
                .filter(Inspection.severity == sev)
                .count()
            )
            if count > 0:
                severity_dist[sev] = count

        # Inspections over time (last 7 days)
        from datetime import timedelta

        inspections_over_time = []
        for i in range(7):
            date = datetime.utcnow() - timedelta(days=6 - i)
            count = (
                db.query(Inspection)
                .filter(
                    Inspection.created_at >= date.replace(hour=0, minute=0, second=0),
                    Inspection.created_at < (date + timedelta(days=1)).replace(hour=0, minute=0, second=0),
                )
                .count()
            )
            inspections_over_time.append({
                "date": date.strftime("%Y-%m-%d"),
                "count": count,
            })

        return AnalyticsResponse(
            total_inspections=total_inspections,
            damaged_roads=damaged_roads,
            high_severity=high_severity,
            average_confidence=round(average_confidence, 3),
            damage_type_distribution=damage_type_dist,
            severity_distribution=severity_dist,
            inspections_over_time=inspections_over_time,
        )
    except Exception as e:
        print(f"Warning: Could not fetch analytics from database: {e}")
        return AnalyticsResponse(
            total_inspections=0,
            damaged_roads=0,
            high_severity=0,
            average_confidence=0.0,
            damage_type_distribution={},
            severity_distribution={},
            inspections_over_time=[],
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
