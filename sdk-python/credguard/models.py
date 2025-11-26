"""
Modelos de dados para CredGuard SDK
"""
from dataclasses import dataclass
from typing import Optional, Dict, Any
from enum import Enum
from datetime import datetime


class JobStatus(str, Enum):
    """Status de um batch job."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class BatchJob:
    """Representa um batch job de processamento."""
    job_id: str
    status: JobStatus
    file_name: str
    product: str
    total_rows: Optional[int] = None
    processed_rows: Optional[int] = None
    excluded_rows: Optional[int] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    
    @classmethod
    def from_api_response(cls, data: Dict[str, Any]) -> 'BatchJob':
        """Cria BatchJob a partir de resposta da API."""
        return cls(
            job_id=data.get('id', data.get('jobId', '')),
            status=JobStatus(data['status']),
            file_name=data['fileName'],
            product=data['product'],
            total_rows=data.get('totalRows'),
            processed_rows=data.get('processedRows'),
            excluded_rows=data.get('excludedRows'),
            created_at=data.get('createdAt'),
            completed_at=data.get('completedAt'),
            error_message=data.get('errorMessage')
        )
    
    @property
    def is_complete(self) -> bool:
        """Verifica se o job está completo."""
        return self.status == JobStatus.COMPLETED
    
    @property
    def is_failed(self) -> bool:
        """Verifica se o job falhou."""
        return self.status == JobStatus.FAILED
    
    @property
    def is_processing(self) -> bool:
        """Verifica se o job está em processamento."""
        return self.status in [JobStatus.PENDING, JobStatus.PROCESSING]


@dataclass
class ModelInfo:
    """Informações de um modelo ML."""
    model_id: int
    version: str
    product: str
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    is_production: bool = False
    created_at: Optional[str] = None
    
    @classmethod
    def from_api_response(cls, data: Dict[str, Any]) -> 'ModelInfo':
        """Cria ModelInfo a partir de resposta da API."""
        return cls(
            model_id=data['id'],
            version=data['version'],
            product=data['product'],
            accuracy=data.get('accuracy'),
            precision=data.get('precision'),
            recall=data.get('recall'),
            f1_score=data.get('f1Score'),
            is_production=data.get('isProduction', False),
            created_at=data.get('createdAt')
        )


@dataclass
class DriftDetection:
    """Resultado de detecção de drift."""
    drift_detected: bool
    psi: float
    status: str
    message: str
    recommendation: Optional[str] = None
    detected_at: Optional[str] = None
    
    @classmethod
    def from_api_response(cls, data: Dict[str, Any]) -> 'DriftDetection':
        """Cria DriftDetection a partir de resposta da API."""
        return cls(
            drift_detected=data['driftDetected'],
            psi=float(data['psi']),
            status=data['status'],
            message=data['message'],
            recommendation=data.get('recommendation'),
            detected_at=data.get('detectedAt')
        )
    
    @property
    def is_critical(self) -> bool:
        """Verifica se o drift é crítico (PSI > 0.25)."""
        return self.psi > 0.25
    
    @property
    def needs_attention(self) -> bool:
        """Verifica se o drift precisa de atenção (PSI > 0.1)."""
        return self.psi > 0.1


@dataclass
class ScoreResult:
    """Resultado de score de crédito."""
    cpf: str
    score: int
    risk_class: str
    credit_limit: float
    probability: float
    product: str
    score_interno: Optional[int] = None
    score_serasa: Optional[int] = None
    pendencias: Optional[int] = None
    protestos: Optional[int] = None
    
    @property
    def is_low_risk(self) -> bool:
        """Verifica se é baixo risco (R1-R3)."""
        return self.risk_class in ['R1', 'R2', 'R3']
    
    @property
    def is_high_risk(self) -> bool:
        """Verifica se é alto risco (R7-R10)."""
        return self.risk_class in ['R7', 'R8', 'R9', 'R10']
