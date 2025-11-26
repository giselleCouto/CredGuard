"""
Exceções customizadas para CredGuard SDK
"""


class CredGuardError(Exception):
    """Classe base para todas as exceções do SDK."""
    pass


class CredGuardAPIError(CredGuardError):
    """Erro genérico de API (4xx, 5xx)."""
    pass


class AuthenticationError(CredGuardAPIError):
    """Erro de autenticação (401)."""
    pass


class RateLimitError(CredGuardAPIError):
    """Rate limit excedido (429)."""
    pass


class ValidationError(CredGuardError):
    """Erro de validação de dados de entrada."""
    pass
