"""Grad-CAM: visualize which image regions drive a CNN's prediction.

Grad-CAM (Selvaraju et al., 2017) weights each feature map of a target conv
layer by the spatially-averaged gradient of the class score, sums them, and
applies ReLU. The result is upsampled onto the input image as a heatmap.

Usage:
    python gradcam.py --checkpoint checkpoints/best.pt --n 8
    python gradcam.py --checkpoint checkpoints/best.pt --image my_cat.jpg
"""

import argparse
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import datasets, transforms

from model import SmallResNet
from train import MEAN, STD

CLASSES = ["airplane", "automobile", "bird", "cat", "deer",
           "dog", "frog", "horse", "ship", "truck"]


class GradCAM:
    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module):
        self.model = model.eval()
        self.activations = None
        self.gradients = None
        target_layer.register_forward_hook(self._save_activation)
        target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, inp, out):
        self.activations = out.detach()

    def _save_gradient(self, module, grad_in, grad_out):
        self.gradients = grad_out[0].detach()

    def __call__(self, x: torch.Tensor, class_idx: int | None = None):
        logits = self.model(x)
        probs = F.softmax(logits, dim=1)
        if class_idx is None:
            class_idx = int(logits.argmax(1))
        self.model.zero_grad()
        logits[0, class_idx].backward()

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)          # [1, C, 1, 1]
        cam = F.relu((weights * self.activations).sum(dim=1, keepdim=True))
        cam = F.interpolate(cam, size=x.shape[-2:], mode="bilinear", align_corners=False)
        cam = cam.squeeze().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        return cam, class_idx, float(probs[0, class_idx].detach())


def denormalize(t: torch.Tensor) -> np.ndarray:
    mean = torch.tensor(MEAN).view(3, 1, 1)
    std = torch.tensor(STD).view(3, 1, 1)
    return (t * std + mean).clamp(0, 1).permute(1, 2, 0).numpy()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--checkpoint", default="checkpoints/best.pt")
    p.add_argument("--n", type=int, default=8, help="number of test images to explain")
    p.add_argument("--image", help="optional path to your own image")
    args = p.parse_args()

    model = SmallResNet()
    model.load_state_dict(torch.load(args.checkpoint, map_location="cpu"))
    cam = GradCAM(model, model.layer3[-1])  # last residual block: high-level features
    tf = transforms.Compose([transforms.Resize((32, 32)), transforms.ToTensor(), transforms.Normalize(MEAN, STD)])

    if args.image:
        samples = [(tf(Image.open(args.image).convert("RGB")), None)]
    else:
        test = datasets.CIFAR10("data", train=False, download=True, transform=tf)
        idx = np.random.default_rng(0).choice(len(test), args.n, replace=False)
        samples = [test[i] for i in idx]

    fig, axes = plt.subplots(2, len(samples), figsize=(2.2 * len(samples), 4.6), squeeze=False)
    for col, (img, label) in enumerate(samples):
        heat, pred, conf = cam(img.unsqueeze(0))
        rgb = denormalize(img)
        axes[0, col].imshow(rgb)
        truth = f"true: {CLASSES[label]}\n" if label is not None else ""
        axes[0, col].set_title(f"{truth}pred: {CLASSES[pred]} ({conf:.0%})", fontsize=8)
        axes[1, col].imshow(rgb)
        axes[1, col].imshow(heat, cmap="jet", alpha=0.45)
        for ax in axes[:, col]:
            ax.axis("off")

    os.makedirs("results", exist_ok=True)
    out = "results/gradcam.png"
    fig.savefig(out, dpi=150, bbox_inches="tight")
    print(f"Saved {out}")


if __name__ == "__main__":
    main()
