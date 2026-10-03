"""Grad-CAM implementation for road damage explainability.

Generates heatmaps showing which image regions contributed
to the model's prediction.
"""

import io
from pathlib import Path
from typing import Optional, Tuple

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms

from app.ai.model import SmallResNet
from app.core.config import settings


class GradCAM:
    """Grad-CAM for visual explanation of CNN predictions."""

    def __init__(self, model: Optional[SmallResNet], target_layer: torch.nn.Module):
        self.model = model
        self.activations = None
        self.gradients = None

        if model is not None:
            self.model.eval()
            target_layer.register_forward_hook(self._save_activation)
            target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, inp, out):
        """Hook to save forward pass activations."""
        self.activations = out.detach()

    def _save_gradient(self, module, grad_in, grad_out):
        """Hook to save backward pass gradients."""
        self.gradients = grad_out[0].detach()

    def __call__(
        self,
        x: torch.Tensor,
        class_idx: Optional[int] = None,
        original_size: Tuple[int, int] = None
    ) -> Tuple[np.ndarray, int, float]:
        """Generate Grad-CAM heatmap.

        Args:
            x: Input tensor [1, 3, H, W]
            class_idx: Target class index (uses prediction if None)
            original_size: Original image size (width, height) for resizing

        Returns:
            Tuple of (heatmap, predicted_class_idx, confidence)
        """
        if self.model is None:
            # Demo mode: return random heatmap
            return self._demo_heatmap(x, original_size)

        logits = self.model(x)
        probs = F.softmax(logits, dim=1)

        if class_idx is None:
            class_idx = int(logits.argmax(1))

        self.model.zero_grad()
        logits[0, class_idx].backward()

        # Global average pooling of gradients
        weights = self.gradients.mean(dim=(2, 3), keepdim=True)  # [1, C, 1, 1]

        # Weighted sum of activations
        cam = F.relu((weights * self.activations).sum(dim=1, keepdim=True))

        # Resize to input size
        cam = F.interpolate(cam, size=x.shape[-2:], mode="bilinear", align_corners=False)

        # Normalize to [0, 1]
        cam = cam.squeeze().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)

        # Resize to original image size if provided
        if original_size:
            cam = cv2.resize(cam, original_size)

        return cam, class_idx, float(probs[0, class_idx].detach())

    def _demo_heatmap(
        self,
        x: torch.Tensor,
        original_size: Optional[Tuple[int, int]] = None
    ) -> Tuple[np.ndarray, int, float]:
        """Generate demo heatmap when model is not available."""
        h, w = x.shape[-2:]
        cam = np.random.rand(h, w)
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)

        if original_size:
            cam = cv2.resize(cam, original_size)

        return cam, 0, 0.85


def generate_gradcam(
    model: Optional[SmallResNet],
    image: Image.Image,
    predicted_class_idx: int,
    output_dir: Path,
    inspection_id: str,
) -> dict:
    """Generate Grad-CAM heatmap and overlay for an image.

    Args:
        model: The trained model (None for demo mode)
        image: PIL Image
        predicted_class_idx: Index of predicted class
        output_dir: Directory to save outputs
        inspection_id: Unique inspection ID

    Returns:
        Dictionary with heatmap_url and overlay_url
    """
    from app.ai.inference import inference_service

    output_dir.mkdir(parents=True, exist_ok=True)

    # Preprocess image
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    transform = transforms.Compose([
        transforms.Resize(settings.IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(settings.NORMALIZATION_MEAN, settings.NORMALIZATION_STD),
    ])

    if image.mode != "RGB":
        image = image.convert("RGB")

    original_size = image.size
    input_tensor = transform(image).unsqueeze(0).to(device)

    # Create Grad-CAM for the last residual block
    if model is not None:
        gradcam = GradCAM(model, model.layer3[-1])
    else:
        gradcam = GradCAM(None, None)

    # Generate heatmap
    heatmap, _, _ = gradcam(input_tensor, predicted_class_idx, original_size)

    # Apply colormap to heatmap
    heatmap_colored = cv2.applyColorMap(
        np.uint8(255 * heatmap),
        cv2.COLORMAP_JET
    )
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

    # Save heatmap
    heatmap_path = output_dir / f"{inspection_id}_heatmap.png"
    Image.fromarray(heatmap_colored).save(heatmap_path)

    # Create overlay
    original_array = np.array(image)
    overlay = cv2.addWeighted(original_array, 0.6, heatmap_colored, 0.4, 0)

    # Save overlay
    overlay_path = output_dir / f"{inspection_id}_overlay.png"
    Image.fromarray(overlay).save(overlay_path)

    return {
        "heatmap_url": f"/api/outputs/{inspection_id}_heatmap.png",
        "overlay_url": f"/api/outputs/{inspection_id}_overlay.png",
    }
