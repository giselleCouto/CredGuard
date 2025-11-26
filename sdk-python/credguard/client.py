"""
CredGuard Python SDK - Cliente principal para API de Credit Scoring
"""
import time
from typing import Optional, Dict, Any, List
import requests
from .exceptions import CredGuardAPIError, AuthenticationError, RateLimitError
from .models import BatchJob, JobStatus, ModelInfo, DriftDetection


class CredGuardClient:
    """
    Cliente Python para CredGuard API.
    
    Example:
        >>> client = CredGuardClient(api_key="your_jwt_token")
        >>> job = client.batch.upload("clientes.csv", product="CARTAO")
        >>> print(f"Job ID: {job.job_id}")
    """
    
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://credguard.com",
        timeout: int = 30
    ):
        """
        Inicializa cliente CredGuard.
        
        Args:
            api_key: JWT token de autenticação
            base_url: URL base da API (padrão: produção)
            timeout: Timeout em segundos para requisições HTTP
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
        
        # Inicializar recursos
        self.batch = BatchResource(self)
        self.models = ModelsResource(self)
        self.drift = DriftResource(self)
        self.bureau = BureauResource(self)
    
    def _request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Faz requisição HTTP com tratamento de erros."""
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.session.request(
                method,
                url,
                timeout=self.timeout,
                **kwargs
            )
            
            # Tratamento de erros HTTP
            if response.status_code == 401:
                raise AuthenticationError("Token inválido ou expirado")
            elif response.status_code == 429:
                raise RateLimitError("Rate limit excedido. Aguarde 60 segundos.")
            elif response.status_code >= 400:
                error_data = response.json() if response.text else {}
                raise CredGuardAPIError(
                    f"Erro {response.status_code}: {error_data.get('error', {}).get('message', 'Erro desconhecido')}"
                )
            
            return response.json()
            
        except requests.exceptions.Timeout:
            raise CredGuardAPIError(f"Timeout após {self.timeout}s")
        except requests.exceptions.ConnectionError:
            raise CredGuardAPIError("Erro de conexão com API")


class BatchResource:
    """Operações de batch upload e processamento."""
    
    def __init__(self, client: CredGuardClient):
        self.client = client
    
    def upload(
        self,
        file_path: str,
        product: str = "CARTAO",
        wait_for_completion: bool = False,
        poll_interval: int = 5
    ) -> BatchJob:
        """
        Faz upload de arquivo CSV para processamento.
        
        Args:
            file_path: Caminho para arquivo CSV local
            product: Tipo de produto (CARTAO, CARNE, EMPRESTIMO)
            wait_for_completion: Se True, aguarda conclusão do job
            poll_interval: Intervalo em segundos para polling (se wait_for_completion=True)
        
        Returns:
            BatchJob com informações do job criado
        
        Example:
            >>> job = client.batch.upload("clientes.csv", product="CARTAO")
            >>> print(f"Job ID: {job.job_id}")
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            csv_content = f.read()
        
        import os
        file_size = os.path.getsize(file_path)
        file_name = os.path.basename(file_path)
        
        response = self.client._request(
            'POST',
            '/api/trpc/batch.upload',
            json={
                'fileName': file_name,
                'fileSize': file_size,
                'product': product,
                'csvData': csv_content
            }
        )
        
        job = BatchJob.from_api_response(response['result']['data'])
        
        if wait_for_completion:
            job = self.wait_for_completion(job.job_id, poll_interval)
        
        return job
    
    def get_status(self, job_id: str) -> BatchJob:
        """
        Consulta status de um job.
        
        Args:
            job_id: ID do job
        
        Returns:
            BatchJob com status atualizado
        """
        response = self.client._request(
            'GET',
            f'/api/trpc/batch.getJob?jobId={job_id}'
        )
        return BatchJob.from_api_response(response['result']['data'])
    
    def wait_for_completion(
        self,
        job_id: str,
        poll_interval: int = 5,
        max_wait: int = 600
    ) -> BatchJob:
        """
        Aguarda conclusão de um job (polling).
        
        Args:
            job_id: ID do job
            poll_interval: Intervalo em segundos entre consultas
            max_wait: Tempo máximo de espera em segundos
        
        Returns:
            BatchJob com status final
        
        Raises:
            CredGuardAPIError: Se job falhar ou timeout
        """
        start_time = time.time()
        
        while True:
            job = self.get_status(job_id)
            
            if job.status == JobStatus.COMPLETED:
                return job
            elif job.status == JobStatus.FAILED:
                raise CredGuardAPIError(f"Job {job_id} falhou")
            
            elapsed = time.time() - start_time
            if elapsed > max_wait:
                raise CredGuardAPIError(f"Timeout aguardando job {job_id}")
            
            time.sleep(poll_interval)
    
    def download_results(self, job_id: str, output_path: str) -> str:
        """
        Baixa resultados de um job (CSV).
        
        Args:
            job_id: ID do job
            output_path: Caminho para salvar arquivo CSV
        
        Returns:
            Caminho do arquivo salvo
        
        Example:
            >>> client.batch.download_results(job_id, "resultados.csv")
            'resultados.csv'
        """
        response = self.client.session.get(
            f"{self.client.base_url}/api/trpc/batch.downloadCsv?jobId={job_id}",
            timeout=self.client.timeout
        )
        
        if response.status_code != 200:
            raise CredGuardAPIError(f"Erro ao baixar resultados: {response.status_code}")
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        return output_path


class ModelsResource:
    """Operações de modelos ML."""
    
    def __init__(self, client: CredGuardClient):
        self.client = client
    
    def list(self, product: str) -> List[ModelInfo]:
        """Lista modelos disponíveis para um produto."""
        response = self.client._request(
            'GET',
            f'/api/trpc/models.list?product={product}'
        )
        return [ModelInfo.from_api_response(m) for m in response['result']['data']]


class DriftResource:
    """Operações de detecção de drift."""
    
    def __init__(self, client: CredGuardClient):
        self.client = client
    
    def detect(self, model_id: int, job_id: str) -> DriftDetection:
        """Detecta drift em um modelo."""
        response = self.client._request(
            'POST',
            '/api/trpc/drift.detect',
            json={'modelId': model_id, 'jobId': job_id}
        )
        return DriftDetection.from_api_response(response['result']['data'])


class BureauResource:
    """Operações de bureau de crédito."""
    
    def __init__(self, client: CredGuardClient):
        self.client = client
    
    def get_config(self) -> Dict[str, Any]:
        """Consulta configuração do bureau."""
        response = self.client._request('GET', '/api/trpc/bureau.getConfig')
        return response['result']['data']
    
    def get_metrics(self) -> Dict[str, Any]:
        """Consulta métricas de uso do bureau."""
        response = self.client._request('GET', '/api/trpc/bureau.getMetrics')
        return response['result']['data']
