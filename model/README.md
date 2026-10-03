# Model Training and Evaluation

This directory contains scripts and documentation for training and evaluating the road damage classification model.

## Dataset Preparation

### Directory Structure

Organize your dataset as follows:

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
    ├── pothole/
    ├── longitudinal_crack/
    ├── transverse_crack/
    ├── alligator_crack/
    ├── surface_damage/
    └── no_damage/
```

### Dataset Requirements

- **Minimum**: 1000 images per class for training
- **Recommended**: 5000+ images per class for better performance
- **Image Size**: Any size (will be resized to 224×224)
- **Format**: JPEG, PNG, or WEBP
- **Quality**: Clear, well-lit images of road surfaces

### Data Augmentation

The training script applies these augmentations:

- Random crop with padding
- Random horizontal flip
- Color jitter (optional)
- Normalization

## Training

### Basic Training

```bash
cd model/training
python train.py --data-dir ../../dataset --epochs 50 --batch-size 32
```

### Training Arguments

- `--data-dir`: Path to dataset directory
- `--epochs`: Number of training epochs (default: 50)
- `--batch-size`: Batch size (default: 32)
- `--lr`: Learning rate (default: 0.001)
- `--checkpoint-dir`: Directory to save checkpoints (default: ../../backend/weights)
- `--device`: Device to use (cuda/cpu, default: auto)

### Training Configuration

Key training parameters:

- **Optimizer**: AdamW
- **Learning Rate**: 0.001 with cosine annealing
- **Weight Decay**: 1e-4
- **Label Smoothing**: 0.1
- **Batch Size**: 32 (adjust based on GPU memory)

### Monitoring Training

Training logs include:

- Loss per epoch
- Training accuracy
- Validation accuracy
- Learning rate

## Evaluation

### Run Evaluation

```bash
cd model/evaluation
python evaluate.py --checkpoint ../../backend/weights/road_damage_model.pt --data-dir ../../dataset/test
```

### Evaluation Metrics

- **Accuracy**: Overall classification accuracy
- **Precision**: Per-class precision
- **Recall**: Per-class recall
- **F1 Score**: Harmonic mean of precision and recall
- **Confusion Matrix**: Per-class confusion matrix

### Results

Results are saved to `model/evaluation/results/`:

- `metrics.json`: Numerical metrics
- `confusion_matrix.png`: Visual confusion matrix
- `per_class_metrics.json`: Detailed per-class metrics

## Model Architecture

The model uses SmallResNet architecture:

- **Input**: 224×224 RGB images
- **Stem**: 7×7 conv + max pool
- **Stage 1**: 2 residual blocks (64 channels)
- **Stage 2**: 2 residual blocks (128 channels, stride 2)
- **Stage 3**: 2 residual blocks (256 channels, stride 2)
- **Classifier**: Global avg pool + dropout + linear

Total parameters: ~2.8M

## Transfer Learning

### Using Pre-trained Weights

To use pre-trained weights (e.g., from ImageNet):

```bash
python train.py --pretrained --data-dir ../../dataset --epochs 30
```

### Fine-tuning

For fine-tuning on a smaller dataset:

```bash
python train.py --pretrained --freeze-features --data-dir ../../dataset --epochs 20
```

## Model Export

### Export for Production

After training, the best checkpoint is automatically saved to `backend/weights/road_damage_model.pt`.

To manually export:

```bash
python export_model.py --checkpoint checkpoints/best.pt --output ../../backend/weights/road_damage_model.pt
```

## Hyperparameter Tuning

### Grid Search

```bash
python grid_search.py --data-dir ../../dataset
```

Tests multiple learning rates and batch sizes.

### Learning Rate Finder

```bash
python lr_finder.py --data-dir ../../dataset
```

Finds optimal learning rate range.

## Troubleshooting

### Common Issues

**Out of Memory**: Reduce batch size or image size
**Poor Accuracy**: Increase dataset size or training epochs
**Overfitting**: Add more augmentation or regularization
**Slow Training**: Use mixed precision training

### Debug Mode

```bash
python train.py --debug --data-dir ../../dataset --epochs 1
```

Runs with verbose logging and saves intermediate outputs.

## Best Practices

1. **Data Quality**: Ensure clear, representative images
2. **Class Balance**: Maintain balanced class distribution
3. **Validation**: Always use a separate test set
4. **Regularization**: Use dropout and weight decay
5. **Early Stopping**: Monitor validation loss
6. **Checkpointing**: Save best model during training

## Citation

If you use this model in your research, please cite:

```
@software{ai_visual_inspection,
  title={AI Visual Inspection Framework},
  author={Your Name},
  year={2024},
  url={https://github.com/yourusername/ai-visual-inspection}
}
```
