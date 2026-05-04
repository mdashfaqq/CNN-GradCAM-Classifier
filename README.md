# CNN Image Classifier with Grad-CAM Explainability

A ResNet-style convolutional network trained from scratch on **CIFAR-10**, plus a from-scratch implementation of **Grad-CAM** that shows which parts of an image the network relied on for its prediction.

The goal is not just accuracy but interpretability: a model that's 90% accurate but looks at the background instead of the object is a model you can't trust.

## Model

`SmallResNet` (about 2.8M parameters):

- 3×3 conv stem → 3 stages of residual blocks (64 → 128 → 256 channels) with stride-2 downsampling
- Batch normalization, skip connections with 1×1 projections when shapes change
- Global average pooling → dropout (0.3) → linear classifier

Training setup:

- SGD with Nesterov momentum, weight decay 5e-4
- One-cycle learning-rate schedule
- Label smoothing (0.1)
- Augmentation: random crop with padding plus horizontal flip

Expected result: roughly **88–90% test accuracy** after 30 epochs on a single GPU (about 15 minutes on a T4, which is free on Google Colab).

## Grad-CAM

For a target class *c* and the final residual block's feature maps *A*:

1. Backpropagate the class score *y_c* to get gradients ∂y_c/∂A
2. Global-average-pool the gradients to get one weight per channel
3. Weighted sum of feature maps, then ReLU (keeps only positive evidence)
4. Upsample to 32×32 and overlay on the image as a heatmap

This is implemented with PyTorch forward and backward hooks in `gradcam.py`, with no extra libraries.

## Usage

```bash
pip install -r requirements.txt

# Train (downloads CIFAR-10 automatically, ~170 MB)
python train.py --epochs 30

# Explain 8 random test images
python gradcam.py --checkpoint checkpoints/best.pt --n 8

# Explain your own image
python gradcam.py --checkpoint checkpoints/best.pt --image path/to/photo.jpg
```

Outputs are written to `results/`:

- `training_curves.png`: loss and accuracy per epoch
- `gradcam.png`: original images (top row) and heatmap overlays (bottom row)

## Project structure

```
model.py     # SmallResNet architecture
train.py     # training loop, augmentation, one-cycle schedule, checkpointing
gradcam.py   # Grad-CAM via hooks + visualization
```

## Things worth trying

- Compare heatmaps for correct vs misclassified images to find failure patterns (e.g. cat/dog confusion)
- Swap in Grad-CAM++ or Score-CAM and compare
- Add mixed-precision training (`torch.autocast`) for faster epochs

## Tech stack

Python, PyTorch, torchvision, matplotlib
