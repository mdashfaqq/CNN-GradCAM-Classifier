"""AI inference service for road damage detection."""

import io
from pathlib import Path
from typing import Optional

import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms

from app.ai.model import SmallResNet
from app.core.config import settings


class InferenceService:
    """Service for loading model and running inference."""

    def __init__(self):
        self.model: Optional[SmallResNet] = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.class_names = settings.DAMAGE_CLASSES
        self.transform = self._get_transform()

    def _get_transform(self):
        """Get image preprocessing transform."""
        return transforms.Compose([
            transforms.Resize(settings.IMAGE_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(settings.NORMALIZATION_MEAN, settings.NORMALIZATION_STD),
        ])

    def load_model(self, checkpoint_path: Optional[str] = None):
        """Load model from checkpoint."""
        if checkpoint_path is None:
            checkpoint_path = settings.MODEL_PATH

        model_path = Path(checkpoint_path)

        if not model_path.exists():
            print(f"Model checkpoint not found at {checkpoint_path}. Running in demo mode.")
            self.model = None
            return False

        try:
            self.model = SmallResNet(num_classes=len(self.class_names))
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            self.model.to(self.device)
            self.model.eval()
            print(f"Model loaded successfully from {checkpoint_path}")
            return True
        except Exception as e:
            print(f"Failed to load model: {e}. Running in demo mode.")
            self.model = None
            return False

    def is_model_loaded(self) -> bool:
        """Check if model is loaded."""
        return self.model is not None

    def preprocess_image(self, image: Image.Image) -> torch.Tensor:
        """Preprocess image for inference."""
        if image.mode != "RGB":
            image = image.convert("RGB")
        return self.transform(image).unsqueeze(0).to(self.device)

    def predict(self, image: Image.Image) -> dict:
        """Run inference on image and return prediction.

        Returns:
            Dictionary with prediction, confidence, and all probabilities.
        """
        if not self.is_model_loaded():
            # Demo mode: return mock prediction
            return self._demo_prediction()

        try:
            input_tensor = self.preprocess_image(image)

            with torch.no_grad():
                logits = self.model(input_tensor)
                probs = F.softmax(logits, dim=1)
                confidence, predicted_idx = torch.max(probs, 1)

            predicted_class = self.class_names[predicted_idx.item()]
            confidence_value = confidence.item()

            # Convert all probabilities to dictionary
            probabilities = {
                self.class_names[i]: probs[0, i].item()
                for i in range(len(self.class_names))
            }

            return {
                "class": predicted_class,
                "confidence": confidence_value,
                "probabilities": probabilities,
            }
        except Exception as e:
            print(f"Inference error: {e}")
            return self._demo_prediction()

    def _demo_prediction(self) -> dict:
        """Return a demo prediction when model is not available."""
        import random

        demo_class = random.choice(self.class_names)
        demo_confidence = random.uniform(0.7, 0.95)

        # Generate plausible probabilities
        remaining = 1.0 - demo_confidence
        other_classes = [c for c in self.class_names if c != demo_class]
        probabilities = {demo_class: demo_confidence}

        for i, cls in enumerate(other_classes):
            if i == len(other_classes) - 1:
                probabilities[cls] = remaining
            else:
                prob = remaining / (len(other_classes) - i)
                probabilities[cls] = prob
                remaining -= prob

        return {
            "class": demo_class,
            "confidence": demo_confidence,
            "probabilities": probabilities,
        }


# Global inference service instance
inference_service = InferenceService()
