"""Train SmallResNet on CIFAR-10.

Usage:
    python train.py --epochs 30 --batch-size 128
Saves the best checkpoint (by test accuracy) to checkpoints/best.pt and a
training-curve plot to results/training_curves.png.
"""

import argparse
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

from model import SmallResNet

MEAN, STD = (0.4914, 0.4822, 0.4465), (0.2470, 0.2435, 0.2616)


def get_loaders(batch_size: int):
    train_tf = transforms.Compose([
        transforms.RandomCrop(32, padding=4),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])
    test_tf = transforms.Compose([transforms.ToTensor(), transforms.Normalize(MEAN, STD)])
    train = datasets.CIFAR10("data", train=True, download=True, transform=train_tf)
    test = datasets.CIFAR10("data", train=False, download=True, transform=test_tf)
    return (
        DataLoader(train, batch_size, shuffle=True, num_workers=2, pin_memory=True),
        DataLoader(test, 256, shuffle=False, num_workers=2, pin_memory=True),
    )


def run_epoch(model, loader, criterion, device, optimizer=None, scheduler=None):
    training = optimizer is not None
    model.train(training)
    total_loss, correct, n = 0.0, 0, 0
    with torch.set_grad_enabled(training):
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            logits = model(x)
            loss = criterion(logits, y)
            if training:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                if scheduler is not None:
                    scheduler.step()  # OneCycleLR steps once per batch
            total_loss += loss.item() * x.size(0)
            correct += (logits.argmax(1) == y).sum().item()
            n += x.size(0)
    return total_loss / n, correct / n


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--epochs", type=int, default=30)
    p.add_argument("--batch-size", type=int, default=128)
    p.add_argument("--lr", type=float, default=0.1)
    args = p.parse_args()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    train_loader, test_loader = get_loaders(args.batch_size)
    model = SmallResNet().to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = torch.optim.SGD(model.parameters(), lr=args.lr, momentum=0.9, weight_decay=5e-4, nesterov=True)
    scheduler = torch.optim.lr_scheduler.OneCycleLR(
        optimizer, max_lr=args.lr, epochs=args.epochs, steps_per_epoch=len(train_loader)
    )

    os.makedirs("checkpoints", exist_ok=True)
    os.makedirs("results", exist_ok=True)
    history, best = {"train_loss": [], "test_loss": [], "train_acc": [], "test_acc": []}, 0.0

    for epoch in range(1, args.epochs + 1):
        tr_loss, tr_acc = run_epoch(model, train_loader, criterion, device, optimizer, scheduler)
        te_loss, te_acc = run_epoch(model, test_loader, criterion, device)
        for k, v in zip(history, (tr_loss, te_loss, tr_acc, te_acc)):
            history[k].append(v)
        print(f"epoch {epoch:02d} | train {tr_loss:.3f}/{tr_acc:.3f} | test {te_loss:.3f}/{te_acc:.3f}")
        if te_acc > best:
            best = te_acc
            torch.save(model.state_dict(), "checkpoints/best.pt")

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4))
    ax1.plot(history["train_loss"], label="train"); ax1.plot(history["test_loss"], label="test")
    ax1.set_title("Loss"); ax1.legend()
    ax2.plot(history["train_acc"], label="train"); ax2.plot(history["test_acc"], label="test")
    ax2.set_title("Accuracy"); ax2.legend()
    fig.savefig("results/training_curves.png", dpi=120, bbox_inches="tight")
    print(f"Best test accuracy: {best:.4f}")


if __name__ == "__main__":
    main()
