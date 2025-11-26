"""
CredGuard Python SDK

SDK oficial para integração com CredGuard API - Plataforma de Credit Scoring com Machine Learning.

Example:
    >>> from credguard import CredGuardClient
    >>> client = CredGuardClient(api_key="your_jwt_token")
    >>> job = client.batch.upload("clientes.csv", product="CARTAO")
    >>> print(f"Job ID: {job.job_id}")
"""

__version__ = "1.0.0"
__author__ = "CredGuard Team"
__email__ = "support@credguard.com"

from .client import CredGuardClient
from .exceptions import (
    CredGuardError,
    CredGuardAPIError,
    AuthenticationError,
    RateLimitError,
    ValidationError
)
from .models import (
    BatchJob,
    JobStatus,
    ModelInfo,
    DriftDetection,
    ScoreResult
)

__all__ = [
    # Cliente principal
    "CredGuardClient",
    
    # Exceções
    "CredGuardError",
    "CredGuardAPIError",
    "AuthenticationError",
    "RateLimitError",
    "ValidationError",
    
    # Modelos
    "BatchJob",
    "JobStatus",
    "ModelInfo",
    "DriftDetection",
    "ScoreResult",
]
