# AI Visual Inspection Framework

A production-quality web application for road damage inspection using AI computer vision. Built with a mobile-first architecture designed to support multiple input sources (mobile camera, image upload, drone camera, video) without rewriting the AI backend.

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [AI Model](#ai-model)
- [Grad-CAM Explainability](#grad-cam-explainability)
- [Dataset](#dataset)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Docker Setup](#docker-setup)
- [API Documentation](#api-documentation)
- [Demo Mode](#demo-mode)
- [Limitations](#limitations)
- [Future Roadmap](#future-roadmap)

## Overview

The AI Visual Inspection Framework transforms road images into actionable insights using deep learning. Users can capture road images with their smartphone camera, upload existing images, and receive AI-powered damage detection, severity assessment, and explainable AI visualizations.

## Problem Statement

Road damage detection is traditionally manual, time-consuming, and inconsistent. This framework automates the process using computer vision, providing:

- **Automated Detection**: AI-powered classification of road damage types
- **Severity Assessment**: Objective damage severity scoring
- **Explainable AI**: Grad-CAM heatmaps showing model focus areas
- **Location Tracking**: Optional GPS integration for mapping
- **Inspection History**: Track and review all inspections over time

## Architecture

### High-Level Architecture

```
Phase 1 (Current)
┌─────────────────┐
│  Mobile Camera  │
│  Image Upload   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Web Application │
│   (React/TS)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   FastAPI       │
│   Backend       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Engine      │
│  (PyTorch)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  Database       │
└─────────────────┘

Phase 2 (Future)
┌─────────────────┐
│  Drone Camera   │
│  Video Stream   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Input Adapter   │
└────────┬────────┘
         │
         ▼
   (Same AI Engine)
```

### Input Abstraction

The system uses an extensible input abstraction to support multiple sources:

```typescript
interface InspectionInput {
  source: "mobile_camera" | "upload" | "drone" | "video";
  image: File;
  timestamp?: string;
  latitude?: number;
  longitude?: number;
}
```

**Phase 1 Implementation**: `mobile_camera`, `upload`
**Future Phase 2**: `drone`, `video`

The AI engine remains independent of the input source, enabling seamless integration of new input types without model changes.

### Project Structure

```
ai-visual-inspection/
│
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service layer
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/             # API route handlers
│   │   ├── core/            # Configuration
│   │   ├── database/        # Database connection
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   ├── ai/              # AI model and inference
│   │   │   ├── model.py     # SmallResNet architecture
│   │   │   ├── inference.py # Inference service
│   │   │   └── gradcam.py   # Grad-CAM implementation
│   │   └── main.py          # FastAPI application
│   ├── weights/             # Model checkpoints
│   ├── uploads/             # Uploaded images
│   ├── outputs/             # Generated heatmaps/overlays
│   └── requirements.txt
│
├── model/                    # Model training and evaluation
│   ├── training/
│   ├── evaluation/
│   └── README.md
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## Features

### Core Features

- **Mobile Camera Integration**: Direct browser-based camera access using `getUserMedia()`
- **Image Upload**: Support for JPEG, PNG, and WEBP formats
- **AI Damage Detection**: Classifies 6 types of road damage
- **Severity Assessment**: Automated severity scoring (low/medium/high)
- **Explainable AI**: Grad-CAM heatmaps visualize model decision-making
- **GPS Location**: Optional geolocation with accuracy metrics
- **Inspection History**: Search, filter, and sort past inspections
- **Interactive Map**: Leaflet-based map view of GPS-tagged inspections
- **Analytics Dashboard**: Statistics and charts for damage trends
- **Demo Mode**: Functional demo when trained model is unavailable

### User Flows

1. **Capture**: Open camera or upload image
2. **Preview**: Review captured image with optional GPS
3. **Analyze**: Send to AI backend for processing
4. **Results**: View prediction, confidence, severity, and Grad-CAM
5. **Save**: Store inspection with all metadata
6. **Explore**: View history, analytics, and map

## Technology Stack

### Frontend

- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Recharts**: Data visualization
- **Leaflet**: Interactive maps
- **Framer Motion**: Smooth animations

### Backend

- **Python 3.11+**: Runtime
- **FastAPI**: Modern web framework
- **Uvicorn**: ASGI server
- **PyTorch**: Deep learning framework
- **torchvision**: Computer vision utilities
- **OpenCV**: Image processing
- **Pillow**: Image manipulation
- **NumPy**: Numerical computing
- **scikit-learn**: Machine learning utilities
- **SQLAlchemy**: ORM
- **PostgreSQL**: Database
- **Pydantic**: Data validation

## AI Model

### Architecture: SmallResNet

The model uses a compact ResNet-style architecture adapted for road damage classification:

- **Input**: 224×224 RGB images
- **Architecture**: 3 residual stages (64 → 128 → 256 channels)
- **Parameters**: ~2.8M parameters
- **Output**: 6 damage classes

### Damage Classes

1. **Pothole**: Depressions in road surface
2. **Longitudinal Crack**: Cracks running parallel to traffic
3. **Transverse Crack**: Cracks perpendicular to traffic
4. **Alligator Crack**: Interconnected cracking patterns
5. **Surface Damage**: General surface deterioration
6. **No Damage**: Healthy road surface

### Model Training

Training code is located in `model/training/`. Key features:

- Data augmentation (random crop, horizontal flip)
- Label smoothing
- One-cycle learning rate schedule
- SGD with Nesterov momentum

### Model Evaluation

Evaluation scripts in `model/evaluation/` calculate:

- Accuracy
- Precision
- Recall
- F1 Score
- Confusion Matrix

Results are saved to `model/evaluation/results/`.

## Grad-CAM Explainability

### Implementation

Grad-CAM (Gradient-weighted Class Activation Mapping) visualizes which image regions contributed to the model's prediction:

1. Forward pass through the network
2. Backpropagate gradients from predicted class
3. Global-average-pool gradients to get weights per channel
4. Weighted sum of feature maps
5. Apply ReLU (keep only positive evidence)
6. Upsample to original image size
7. Overlay on original image as heatmap

### Usage

Grad-CAM is automatically generated for every inspection and displayed in three modes:

- **Original**: Raw captured image
- **Heatmap**: Color-coded activation map
- **Overlay**: Heatmap blended with original image (adjustable opacity)

### Important Note

Grad-CAM highlights regions that contributed to the prediction but does not prove causality. The model may focus on relevant features or background artifacts. Always interpret heatmaps as explanatory tools, not definitive evidence.

## Dataset

The system requires a labeled dataset of road damage images. Dataset organization:

```
dataset/
├── train/
│   ├── pothole/
│   ├── longitudinal_crack/
│   ├── transverse_crack/
│   ├── alligator_crack/
│   ├── surface_damage/
│   └── no_damage/
└── test/
    └── (same structure)
```

**Recommended**: Minimum 1000 images per class for training.

## Installation

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- (Optional) Docker and Docker Compose

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp ../.env.example .env

# Edit .env with your configuration
# Set DATABASE_URL, MODEL_PATH, etc.
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp ../.env.example .env.local

# Edit VITE_API_URL if needed
```

### Database Setup

```bash
# Create PostgreSQL database
createdb ai_inspection

# Or using Docker Compose
docker-compose up postgres
```

## Running Locally

### Start Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend

```bash
cd frontend
npm run dev
```

### Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Docker Setup

### Using Docker Compose

```bash
# Start all services
docker-compose up

# Start specific services
docker-compose up postgres backend
docker-compose up frontend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Build Images

```bash
docker-compose build
```

## API Documentation

### Endpoints

#### Health Check
```
GET /api/health
```
Returns system health status, model loading state, and database connection.

#### Analyze Image
```
POST /api/analyze
Content-Type: multipart/form-data

Parameters:
- image: File (required)
- source: string (required) - mobile_camera, upload, drone, video
- latitude: float (optional)
- longitude: float (optional)
- timestamp: string (optional)
```

Returns complete analysis with prediction, severity, and Grad-CAM URLs.

#### Get Inspections
```
GET /api/inspections?skip=0&limit=50
```
Paginated list of all inspections.

#### Get Inspection
```
GET /api/inspections/{id}
```
Single inspection details.

#### Get Analytics
```
GET /api/analytics
```
Statistics and charts data.

#### Get Output Files
```
GET /api/outputs/{filename}
```
Serve generated heatmaps and overlays.

### Example Response

```json
{
  "inspection_id": "uuid",
  "prediction": {
    "class": "pothole",
    "confidence": 0.942,
    "probabilities": {
      "pothole": 0.942,
      "crack": 0.041,
      "surface_damage": 0.017
    }
  },
  "severity": {
    "label": "high",
    "score": 0.81
  },
  "explanation": {
    "method": "gradcam",
    "heatmap_url": "/api/outputs/...",
    "overlay_url": "/api/outputs/..."
  },
  "location": {
    "latitude": 12.9,
    "longitude": 80.2
  },
  "model_version": "smallresnet-v1",
  "demo_mode": false
}
```

## Demo Mode

When a trained model is not available, the system runs in **Demo Mode**:

- Clearly labeled in the UI
- Returns mock predictions with plausible values
- Still generates Grad-CAM visualizations (random heatmaps)
- Allows full UI testing without model

**To enable production mode**:
1. Train a model on your dataset
2. Save checkpoint to `backend/weights/road_damage_model.pt`
3. Set `DEMO_MODE=false` in `.env`
4. Restart backend

## Limitations

- **Model Performance**: Accuracy depends on dataset quality and size
- **Lighting Conditions**: Performance may vary with lighting
- **Image Quality**: Blurry or low-resolution images may reduce accuracy
- **GPS Accuracy**: Depends on device and environment
- **Browser Support**: Camera features require modern browsers
- **Grad-CAM Interpretation**: Heatmaps are explanatory, not definitive

## Future Roadmap

### Phase 2: Drone Integration

- **Drone Camera Support**: Direct integration with drone video feeds
- **Real-time Processing**: Edge API for on-device inference
- **Video Analysis**: Frame-by-frame damage detection
- **Flight Path Planning**: Automated inspection routes

### Phase 3: Advanced Features

- **3D Reconstruction**: Multi-view damage assessment
- **Automated Reporting**: PDF report generation
- **API Integration**: Connect to municipal databases
- **Mobile App**: Native iOS/Android applications
- **Offline Mode**: On-device inference for remote areas

### Model Improvements

- **Larger Datasets**: More diverse training data
- **Ensemble Models**: Combine multiple architectures
- **Better Severity**: Trained severity estimation model
- **Multi-task Learning**: Simultaneous detection and segmentation

## Camera Permissions

The application requests camera permission when accessing the `/inspect` page on mobile devices.

- **Permission Denied**: Users can still upload images from gallery
- **Permission Granted**: Camera preview displays with capture button
- **Front/Back Camera**: Prefers rear camera (`facingMode: "environment"`)

## GPS Permissions

Location permission is optional and requested separately.

- **Permission Granted**: Captures latitude, longitude, accuracy
- **Permission Denied**: Inspection continues without GPS
- **Accuracy Display**: Shows ±X meters when available

## Security

- **File Validation**: MIME type, extension, and size validation
- **Path Traversal Prevention**: Secure filename generation
- **No File Execution**: Uploaded files are never executed
- **Secure Storage**: Uploads outside executable directories
- **CORS Configuration**: Controlled origin access
- **Environment Variables**: Secrets in `.env`, never committed

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Specify your license here]

## Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for safer roads**
