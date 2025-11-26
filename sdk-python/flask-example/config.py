"""
Configurações da aplicação Flask + CredGuard
"""
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

class Config:
    """Configurações base da aplicação."""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Upload
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    RESULTS_FOLDER = 'results'
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    ALLOWED_EXTENSIONS = {'csv'}
    
    # CredGuard API
    CREDGUARD_API_KEY = os.getenv('CREDGUARD_API_KEY')
    CREDGUARD_BASE_URL = os.getenv('CREDGUARD_BASE_URL', 'https://credguard.manus.space')
    
    # Validações
    @staticmethod
    def validate():
        """Valida se todas as configurações obrigatórias estão definidas."""
        if not Config.CREDGUARD_API_KEY:
            raise ValueError(
                "CREDGUARD_API_KEY não definida. "
                "Configure no arquivo .env ou variável de ambiente."
            )
        
        # Criar diretórios se não existirem
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(Config.RESULTS_FOLDER, exist_ok=True)

class DevelopmentConfig(Config):
    """Configurações para ambiente de desenvolvimento."""
    DEBUG = True

class ProductionConfig(Config):
    """Configurações para ambiente de produção."""
    DEBUG = False
    # Em produção, SECRET_KEY DEVE ser definida via variável de ambiente
    SECRET_KEY = os.getenv('SECRET_KEY')
    
    @staticmethod
    def validate():
        Config.validate()
        if not ProductionConfig.SECRET_KEY:
            raise ValueError("SECRET_KEY deve ser definida em produção!")

# Mapeamento de ambientes
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
