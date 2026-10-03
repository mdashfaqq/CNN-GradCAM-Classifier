"""Severity assessment service for road damage.

This module provides a configurable severity scoring system.
The algorithm is designed to be replaceable as better models become available.
"""

from typing import Optional

from app.core.config import settings


class SeverityService:
    """Service for assessing road damage severity."""

    def __init__(self):
        self.severity_levels = settings.SEVERITY_LEVELS

    def calculate_severity(
        self,
        predicted_class: str,
        confidence: float,
        probabilities: dict[str, float],
    ) -> dict:
        """Calculate severity based on prediction and confidence.

        This is a prototype implementation using simple heuristics.
        In production, this should be replaced with a trained severity model.

        Args:
            predicted_class: The predicted damage class
            confidence: Model confidence for the prediction
            probabilities: Dictionary of all class probabilities

        Returns:
            Dictionary with severity label and score
        """
        # Base severity by damage type
        class_severity = {
            "pothole": 0.7,
            "longitudinal_crack": 0.5,
            "transverse_crack": 0.6,
            "alligator_crack": 0.8,
            "surface_damage": 0.4,
            "no_damage": 0.0,
        }

        base_score = class_severity.get(predicted_class, 0.5)

        # Adjust based on confidence
        # Higher confidence for damage types increases severity
        if predicted_class != "no_damage":
            confidence_factor = confidence * 0.3
        else:
            confidence_factor = 0

        # Adjust based on probability distribution
        # If model is uncertain (probabilities spread out), reduce severity
        max_prob = max(probabilities.values())
        entropy_factor = (1.0 - max_prob) * 0.2

        # Calculate final score
        final_score = base_score + confidence_factor - entropy_factor
        final_score = max(0.0, min(1.0, final_score))

        # Map score to severity level
        if final_score < 0.33:
            label = "low"
        elif final_score < 0.66:
            label = "medium"
        else:
            label = "high"

        return {
            "label": label,
            "score": final_score,
        }

    def get_severity_label(self, score: float) -> str:
        """Convert severity score to label."""
        if score < 0.33:
            return "low"
        elif score < 0.66:
            return "medium"
        else:
            return "high"


# Global severity service instance
severity_service = SeverityService()
