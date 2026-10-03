"""
Entry point for Railpack deployment.
Delegates to the FastAPI backend in the backend/ directory.
"""

import sys
import os

# Add backend directory to Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

# Change working directory to backend for proper path resolution
os.chdir(backend_dir)

# Import and run the FastAPI app
from app.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
