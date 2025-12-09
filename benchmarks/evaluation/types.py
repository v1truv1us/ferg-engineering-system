"""
Evaluation types for the validation framework.
"""

from typing import Optional, Dict, Any, List, Union
from dataclasses import dataclass
from enum import Enum

@dataclass
class DimensionScore:
    """Score for a single evaluation dimension."""
    score: float  # 1-5 scale
    reasoning: str  # Explanation for the score
    confidence: Optional[float] = None  # 0-1 confidence in the score

@dataclass
class OverallScore:
    """Overall comparison result."""
    baseline_score: float  # Average baseline score
    enhanced_score: float  # Average enhanced score
    winner: str  # 'baseline', 'enhanced', or 'tie'
    confidence: Optional[float] = None  # Confidence in the comparison

@dataclass
class GEvalResult:
    """Complete G-Eval evaluation result."""
    task_id: str
    baseline_response: str
    enhanced_response: str
    evaluation: {
        'accuracy': DimensionScore,
        'completeness': DimensionScore,
        'clarity': DimensionScore,
        'actionability': DimensionScore,
        'relevance': DimensionScore,
        'overall': OverallScore
    }
    timestamp: str

class ScoreRange(Enum):
    """Valid score ranges for dimensions."""
    VALID = (1.0, 5.0)
    INVALID = (-1.0, 6.0)

class ComparisonResult(Enum):
    """Possible comparison results."""
    BASELINE_WINS = 'baseline'
    ENHANCED_WINS = 'enhanced'
    TIE = 'tie'

class ValidationError(Exception):
    """Raised when evaluation data is invalid."""
    pass