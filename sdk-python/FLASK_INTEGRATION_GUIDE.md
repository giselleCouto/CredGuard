# Guia de Integração: Flask + CredGuard SDK

Este guia apresenta um tutorial completo e prático para integrar o **CredGuard SDK** em uma aplicação Flask, permitindo verificar o score de crédito de clientes de forma simples e eficiente.

## 📋 Visão Geral

Ao final deste guia, você terá uma aplicação Flask funcional que permite:

- Fazer upload de arquivo CSV com dados de clientes
- Processar scores de crédito em lote usando a API CredGuard
- Consultar status do processamento em tempo real
- Exibir resultados em uma interface web amigável
- Baixar CSV com scores calculados

## 🎯 Pré-requisitos

Antes de começar, certifique-se de ter:

- **Python 3.8 ou superior** instalado
- **pip** (gerenciador de pacotes Python)
- **Conta CredGuard** com token JWT (obtenha em https://credguard.manus.space)
- Conhecimento básico de Python e Flask

## 🚀 Passo 1: Configuração do Ambiente

### 1.1 Criar Diretório do Projeto

```bash
mkdir credguard-flask-app
cd credguard-flask-app
```

### 1.2 Criar Ambiente Virtual

```bash
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
```

### 1.3 Instalar Dependências

```bash
pip install flask credguard-sdk python-dotenv
```

**Dependências instaladas:**

| Pacote | Versão | Descrição |
|--------|--------|-----------|
| flask | ≥2.3.0 | Framework web minimalista |
| credguard-sdk | ≥1.0.0 | SDK oficial CredGuard |
| python-dotenv | ≥1.0.0 | Gerenciamento de variáveis de ambiente |

### 1.4 Criar Arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com suas credenciais:

```env
# CredGuard API Configuration
CREDGUARD_API_KEY=seu_token_jwt_aqui
CREDGUARD_BASE_URL=https://credguard.manus.space

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=sua_chave_secreta_aqui
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216  # 16MB max file size
```

**⚠️ Importante:** Nunca commite o arquivo `.env` no Git. Adicione-o ao `.gitignore`.

## 🏗️ Passo 2: Estrutura do Projeto

Crie a seguinte estrutura de diretórios e arquivos:

```
credguard-flask-app/
├── venv/                   # Ambiente virtual (não commitar)
├── uploads/                # Arquivos CSV enviados
├── results/                # Resultados processados
├── templates/              # Templates HTML
│   ├── index.html         # Página inicial
│   ├── upload.html        # Formulário de upload
│   ├── status.html        # Status do processamento
│   └── results.html       # Exibição de resultados
├── static/                 # Arquivos estáticos (CSS, JS)
│   └── style.css          # Estilos customizados
├── app.py                  # Aplicação Flask principal
├── config.py               # Configurações
├── .env                    # Variáveis de ambiente (não commitar)
├── .gitignore              # Arquivos ignorados pelo Git
└── requirements.txt        # Dependências do projeto
```

### 2.1 Criar Diretórios

```bash
mkdir -p uploads results templates static
```

### 2.2 Criar `.gitignore`

```bash
cat > .gitignore << 'EOF'
venv/
__pycache__/
*.pyc
.env
uploads/*
results/*
!uploads/.gitkeep
!results/.gitkeep
*.log
.DS_Store
EOF
```

### 2.3 Criar `requirements.txt`

```bash
cat > requirements.txt << 'EOF'
flask>=2.3.0
credguard-sdk>=1.0.0
python-dotenv>=1.0.0
EOF
```

## 🔧 Passo 3: Configuração da Aplicação

### 3.1 Criar `config.py`

Este arquivo centraliza todas as configurações da aplicação:

```python
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
```

## 💻 Passo 4: Implementação da Aplicação Flask

### 4.1 Criar `app.py`

Este é o arquivo principal da aplicação Flask:

```python
"""
Aplicação Flask integrada com CredGuard SDK
Permite upload de CSV, processamento de scores e download de resultados
"""
import os
from flask import Flask, render_template, request, redirect, url_for, flash, send_file
from werkzeug.utils import secure_filename
from credguard import CredGuardClient, CredGuardAPIError, AuthenticationError, RateLimitError
from config import config
import time

# Inicializar aplicação Flask
app = Flask(__name__)

# Carregar configurações
env = os.getenv('FLASK_ENV', 'development')
app.config.from_object(config[env])
config[env].validate()

# Inicializar cliente CredGuard
credguard_client = CredGuardClient(
    api_key=app.config['CREDGUARD_API_KEY'],
    base_url=app.config['CREDGUARD_BASE_URL']
)

# Armazenamento temporário de jobs (em produção, use Redis ou banco de dados)
active_jobs = {}


def allowed_file(filename):
    """Verifica se o arquivo tem extensão permitida."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


@app.route('/')
def index():
    """Página inicial."""
    return render_template('index.html')


@app.route('/upload', methods=['GET', 'POST'])
def upload():
    """Página de upload de arquivo CSV."""
    if request.method == 'POST':
        # Verificar se arquivo foi enviado
        if 'file' not in request.files:
            flash('Nenhum arquivo selecionado', 'error')
            return redirect(request.url)
        
        file = request.files['file']
        
        # Verificar se arquivo tem nome
        if file.filename == '':
            flash('Nenhum arquivo selecionado', 'error')
            return redirect(request.url)
        
        # Verificar extensão
        if not allowed_file(file.filename):
            flash('Apenas arquivos CSV são permitidos', 'error')
            return redirect(request.url)
        
        # Salvar arquivo
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Obter tipo de produto
        product = request.form.get('product', 'CARTAO')
        
        try:
            # Fazer upload para CredGuard API
            job = credguard_client.batch.upload(
                file_path=filepath,
                product=product
            )
            
            # Armazenar informações do job
            active_jobs[job.job_id] = {
                'filename': filename,
                'product': product,
                'status': job.status,
                'created_at': time.time()
            }
            
            flash(f'Upload realizado com sucesso! Job ID: {job.job_id}', 'success')
            return redirect(url_for('status', job_id=job.job_id))
            
        except AuthenticationError:
            flash('Erro de autenticação. Verifique seu token JWT.', 'error')
        except RateLimitError:
            flash('Rate limit excedido. Aguarde 60 segundos e tente novamente.', 'error')
        except CredGuardAPIError as e:
            flash(f'Erro na API: {str(e)}', 'error')
        except Exception as e:
            flash(f'Erro inesperado: {str(e)}', 'error')
        
        return redirect(request.url)
    
    return render_template('upload.html')


@app.route('/status/<job_id>')
def status(job_id):
    """Página de status do processamento."""
    try:
        # Consultar status do job
        job = credguard_client.batch.get_status(job_id)
        
        # Atualizar cache local
        if job_id in active_jobs:
            active_jobs[job_id]['status'] = job.status
        
        return render_template('status.html', job=job)
        
    except CredGuardAPIError as e:
        flash(f'Erro ao consultar status: {str(e)}', 'error')
        return redirect(url_for('index'))


@app.route('/results/<job_id>')
def results(job_id):
    """Página de resultados do processamento."""
    try:
        # Verificar se job está completo
        job = credguard_client.batch.get_status(job_id)
        
        if not job.is_complete:
            flash('Processamento ainda não foi concluído', 'warning')
            return redirect(url_for('status', job_id=job_id))
        
        return render_template('results.html', job=job)
        
    except CredGuardAPIError as e:
        flash(f'Erro ao consultar resultados: {str(e)}', 'error')
        return redirect(url_for('index'))


@app.route('/download/<job_id>')
def download(job_id):
    """Download do arquivo CSV com resultados."""
    try:
        # Verificar se job está completo
        job = credguard_client.batch.get_status(job_id)
        
        if not job.is_complete:
            flash('Processamento ainda não foi concluído', 'warning')
            return redirect(url_for('status', job_id=job_id))
        
        # Baixar resultados
        output_filename = f"resultados_{job_id}.csv"
        output_path = os.path.join(app.config['RESULTS_FOLDER'], output_filename)
        
        credguard_client.batch.download_results(job_id, output_path)
        
        return send_file(
            output_path,
            as_attachment=True,
            download_name=output_filename,
            mimetype='text/csv'
        )
        
    except CredGuardAPIError as e:
        flash(f'Erro ao baixar resultados: {str(e)}', 'error')
        return redirect(url_for('index'))


@app.route('/jobs')
def list_jobs():
    """Lista todos os jobs ativos."""
    jobs_list = []
    
    for job_id, info in active_jobs.items():
        try:
            job = credguard_client.batch.get_status(job_id)
            jobs_list.append({
                'job_id': job_id,
                'filename': info['filename'],
                'product': info['product'],
                'status': job.status,
                'processed_rows': job.processed_rows,
                'total_rows': job.total_rows
            })
        except:
            pass  # Ignorar jobs que não podem ser consultados
    
    return render_template('jobs.html', jobs=jobs_list)


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handler para arquivo muito grande."""
    flash('Arquivo muito grande. Tamanho máximo: 16MB', 'error')
    return redirect(url_for('upload'))


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=app.config['DEBUG']
    )
```

## 🎨 Passo 5: Templates HTML

### 5.1 Layout Base (`templates/base.html`)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}CredGuard Flask App{% endblock %}</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
</head>
<body>
    <nav class="navbar">
        <div class="container">
            <h1 class="logo">🛡️ CredGuard</h1>
            <ul class="nav-links">
                <li><a href="{{ url_for('index') }}">Início</a></li>
                <li><a href="{{ url_for('upload') }}">Upload</a></li>
                <li><a href="{{ url_for('list_jobs') }}">Meus Jobs</a></li>
            </ul>
        </div>
    </nav>

    <main class="container">
        {% with messages = get_flashed_messages(with_categories=true) %}
            {% if messages %}
                {% for category, message in messages %}
                    <div class="alert alert-{{ category }}">
                        {{ message }}
                    </div>
                {% endfor %}
            {% endif %}
        {% endwith %}

        {% block content %}{% endblock %}
    </main>

    <footer>
        <p>&copy; 2025 CredGuard Flask App - Powered by CredGuard SDK</p>
    </footer>
</body>
</html>
```

### 5.2 Página Inicial (`templates/index.html`)

```html
{% extends "base.html" %}

{% block title %}Início - CredGuard{% endblock %}

{% block content %}
<div class="hero">
    <h2>Bem-vindo ao CredGuard Flask App</h2>
    <p>Verifique o score de crédito dos seus clientes de forma rápida e segura.</p>
    
    <div class="features">
        <div class="feature-card">
            <h3>📤 Upload em Lote</h3>
            <p>Envie arquivo CSV com dados de múltiplos clientes</p>
        </div>
        <div class="feature-card">
            <h3>🤖 Machine Learning</h3>
            <p>Scores calculados por modelos treinados</p>
        </div>
        <div class="feature-card">
            <h3>📊 Resultados Detalhados</h3>
            <p>Baixe CSV com scores e recomendações</p>
        </div>
    </div>

    <a href="{{ url_for('upload') }}" class="btn btn-primary">Começar Agora</a>
</div>
{% endblock %}
```

### 5.3 Página de Upload (`templates/upload.html`)

```html
{% extends "base.html" %}

{% block title %}Upload - CredGuard{% endblock %}

{% block content %}
<div class="upload-container">
    <h2>Upload de Arquivo CSV</h2>
    <p>Envie um arquivo CSV com os dados dos clientes para calcular os scores de crédito.</p>

    <form method="POST" enctype="multipart/form-data" class="upload-form">
        <div class="form-group">
            <label for="file">Selecione o arquivo CSV:</label>
            <input type="file" id="file" name="file" accept=".csv" required>
            <small>Tamanho máximo: 16MB</small>
        </div>

        <div class="form-group">
            <label for="product">Tipo de Produto:</label>
            <select id="product" name="product" required>
                <option value="CARTAO">Cartão de Crédito</option>
                <option value="CARNE">Carnê</option>
                <option value="EMPRESTIMO">Empréstimo Pessoal</option>
            </select>
        </div>

        <button type="submit" class="btn btn-primary">Enviar e Processar</button>
    </form>

    <div class="info-box">
        <h3>📋 Formato do CSV</h3>
        <p>O arquivo deve conter as seguintes colunas obrigatórias:</p>
        <ul>
            <li><strong>cpf</strong> - CPF do cliente (formato: XXX.XXX.XXX-XX)</li>
            <li><strong>renda_mensal</strong> - Renda mensal em reais</li>
            <li><strong>idade</strong> - Idade do cliente</li>
            <li><strong>tempo_emprego_meses</strong> - Tempo no emprego atual</li>
            <li>... e outras 100+ features (veja documentação completa)</li>
        </ul>
        <a href="https://credguard.manus.space/api/docs" target="_blank" class="btn btn-secondary">
            Ver Documentação Completa
        </a>
    </div>
</div>
{% endblock %}
```

### 5.4 Página de Status (`templates/status.html`)

```html
{% extends "base.html" %}

{% block title %}Status - CredGuard{% endblock %}

{% block content %}
<div class="status-container">
    <h2>Status do Processamento</h2>
    
    <div class="job-info">
        <p><strong>Job ID:</strong> {{ job.job_id }}</p>
        <p><strong>Arquivo:</strong> {{ job.file_name }}</p>
        <p><strong>Produto:</strong> {{ job.product }}</p>
        <p><strong>Status:</strong> 
            <span class="badge badge-{{ job.status }}">{{ job.status }}</span>
        </p>
    </div>

    {% if job.is_processing %}
        <div class="progress-container">
            <h3>⏳ Processando...</h3>
            {% if job.total_rows %}
                <p>Progresso: {{ job.processed_rows or 0 }} / {{ job.total_rows }}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {{ ((job.processed_rows or 0) / job.total_rows * 100) }}%"></div>
                </div>
            {% endif %}
            <p class="refresh-info">Esta página atualiza automaticamente a cada 5 segundos.</p>
            <meta http-equiv="refresh" content="5">
        </div>
    {% elif job.is_complete %}
        <div class="success-container">
            <h3>✅ Processamento Concluído!</h3>
            <p><strong>Total processado:</strong> {{ job.processed_rows }}</p>
            <p><strong>Excluídos:</strong> {{ job.excluded_rows }}</p>
            
            <div class="action-buttons">
                <a href="{{ url_for('results', job_id=job.job_id) }}" class="btn btn-primary">
                    Ver Resultados
                </a>
                <a href="{{ url_for('download', job_id=job.job_id) }}" class="btn btn-success">
                    📥 Baixar CSV
                </a>
            </div>
        </div>
    {% elif job.is_failed %}
        <div class="error-container">
            <h3>❌ Processamento Falhou</h3>
            <p><strong>Erro:</strong> {{ job.error_message }}</p>
            <a href="{{ url_for('upload') }}" class="btn btn-primary">Tentar Novamente</a>
        </div>
    {% endif %}
</div>
{% endblock %}
```

### 5.5 Página de Resultados (`templates/results.html`)

```html
{% extends "base.html" %}

{% block title %}Resultados - CredGuard{% endblock %}

{% block content %}
<div class="results-container">
    <h2>Resultados do Processamento</h2>
    
    <div class="summary-cards">
        <div class="summary-card">
            <h3>{{ job.processed_rows }}</h3>
            <p>Clientes Processados</p>
        </div>
        <div class="summary-card">
            <h3>{{ job.excluded_rows }}</h3>
            <p>Excluídos (Regras de Negócio)</p>
        </div>
        <div class="summary-card">
            <h3>{{ job.product }}</h3>
            <p>Tipo de Produto</p>
        </div>
    </div>

    <div class="download-section">
        <h3>📥 Download de Resultados</h3>
        <p>O arquivo CSV contém os seguintes campos:</p>
        <ul>
            <li><strong>cpf</strong> - CPF do cliente</li>
            <li><strong>score</strong> - Score de crédito (0-1000)</li>
            <li><strong>risk_class</strong> - Classe de risco (R1-R10)</li>
            <li><strong>credit_limit</strong> - Limite de crédito sugerido</li>
            <li><strong>probability</strong> - Probabilidade de inadimplência</li>
            <li><strong>score_interno</strong> - Score do modelo interno</li>
            <li><strong>score_serasa</strong> - Score do bureau (se ativo)</li>
            <li><strong>pendencias</strong> - Número de pendências</li>
            <li><strong>protestos</strong> - Número de protestos</li>
        </ul>
        
        <a href="{{ url_for('download', job_id=job.job_id) }}" class="btn btn-success btn-large">
            📥 Baixar Resultados (CSV)
        </a>
    </div>

    <div class="actions">
        <a href="{{ url_for('upload') }}" class="btn btn-primary">Novo Upload</a>
        <a href="{{ url_for('list_jobs') }}" class="btn btn-secondary">Ver Todos os Jobs</a>
    </div>
</div>
{% endblock %}
```

### 5.6 Lista de Jobs (`templates/jobs.html`)

```html
{% extends "base.html" %}

{% block title %}Meus Jobs - CredGuard{% endblock %}

{% block content %}
<div class="jobs-container">
    <h2>Meus Jobs de Processamento</h2>
    
    {% if jobs %}
        <table class="jobs-table">
            <thead>
                <tr>
                    <th>Job ID</th>
                    <th>Arquivo</th>
                    <th>Produto</th>
                    <th>Status</th>
                    <th>Progresso</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                {% for job in jobs %}
                <tr>
                    <td><code>{{ job.job_id[:8] }}...</code></td>
                    <td>{{ job.filename }}</td>
                    <td>{{ job.product }}</td>
                    <td><span class="badge badge-{{ job.status }}">{{ job.status }}</span></td>
                    <td>
                        {% if job.total_rows %}
                            {{ job.processed_rows or 0 }} / {{ job.total_rows }}
                        {% else %}
                            -
                        {% endif %}
                    </td>
                    <td>
                        <a href="{{ url_for('status', job_id=job.job_id) }}" class="btn btn-sm">
                            Ver Status
                        </a>
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    {% else %}
        <p class="empty-state">Nenhum job encontrado. <a href="{{ url_for('upload') }}">Faça seu primeiro upload</a>.</p>
    {% endif %}
</div>
{% endblock %}
```

## 🎨 Passo 6: Estilos CSS

### 6.1 Criar `static/style.css`

```css
/* Reset e configurações base */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Navbar */
.navbar {
    background-color: #2c3e50;
    color: white;
    padding: 1rem 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.navbar .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
}

.nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-links a {
    color: white;
    text-decoration: none;
    transition: opacity 0.3s;
}

.nav-links a:hover {
    opacity: 0.8;
}

/* Main content */
main {
    min-height: calc(100vh - 200px);
    padding: 2rem 0;
}

/* Alerts */
.alert {
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 4px;
    border-left: 4px solid;
}

.alert-success {
    background-color: #d4edda;
    border-color: #28a745;
    color: #155724;
}

.alert-error {
    background-color: #f8d7da;
    border-color: #dc3545;
    color: #721c24;
}

.alert-warning {
    background-color: #fff3cd;
    border-color: #ffc107;
    color: #856404;
}

/* Buttons */
.btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    font-size: 1rem;
    transition: all 0.3s;
}

.btn-primary {
    background-color: #007bff;
    color: white;
}

.btn-primary:hover {
    background-color: #0056b3;
}

.btn-success {
    background-color: #28a745;
    color: white;
}

.btn-success:hover {
    background-color: #218838;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background-color: #5a6268;
}

.btn-large {
    padding: 1rem 2rem;
    font-size: 1.1rem;
}

.btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
}

/* Hero section */
.hero {
    text-align: center;
    padding: 3rem 0;
}

.hero h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #2c3e50;
}

.hero p {
    font-size: 1.2rem;
    color: #666;
    margin-bottom: 2rem;
}

.features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin: 3rem 0;
}

.feature-card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.feature-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #2c3e50;
}

/* Forms */
.upload-form {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    max-width: 600px;
    margin: 2rem auto;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #2c3e50;
}

.form-group input[type="file"],
.form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.form-group small {
    display: block;
    margin-top: 0.25rem;
    color: #666;
    font-size: 0.875rem;
}

/* Info box */
.info-box {
    background: #e7f3ff;
    padding: 1.5rem;
    border-radius: 8px;
    margin-top: 2rem;
    border-left: 4px solid #007bff;
}

.info-box h3 {
    margin-bottom: 1rem;
    color: #2c3e50;
}

.info-box ul {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
}

/* Status page */
.job-info {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.job-info p {
    margin-bottom: 0.5rem;
}

.badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
}

.badge-pending {
    background-color: #ffc107;
    color: #000;
}

.badge-processing {
    background-color: #17a2b8;
    color: white;
}

.badge-completed {
    background-color: #28a745;
    color: white;
}

.badge-failed {
    background-color: #dc3545;
    color: white;
}

/* Progress bar */
.progress-container {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.progress-bar {
    width: 100%;
    height: 30px;
    background-color: #e9ecef;
    border-radius: 15px;
    overflow: hidden;
    margin: 1rem 0;
}

.progress-fill {
    height: 100%;
    background-color: #007bff;
    transition: width 0.3s ease;
}

.refresh-info {
    color: #666;
    font-size: 0.875rem;
    margin-top: 1rem;
}

/* Summary cards */
.summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.summary-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.summary-card h3 {
    font-size: 2rem;
    color: #007bff;
    margin-bottom: 0.5rem;
}

.summary-card p {
    color: #666;
    font-size: 0.875rem;
}

/* Download section */
.download-section {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.download-section h3 {
    margin-bottom: 1rem;
    color: #2c3e50;
}

.download-section ul {
    margin: 1rem 0 1.5rem 1.5rem;
}

/* Jobs table */
.jobs-table {
    width: 100%;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.jobs-table thead {
    background-color: #2c3e50;
    color: white;
}

.jobs-table th,
.jobs-table td {
    padding: 1rem;
    text-align: left;
}

.jobs-table tbody tr:nth-child(even) {
    background-color: #f8f9fa;
}

.jobs-table tbody tr:hover {
    background-color: #e9ecef;
}

.jobs-table code {
    background-color: #f8f9fa;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
}

.empty-state {
    text-align: center;
    padding: 3rem;
    color: #666;
}

/* Footer */
footer {
    background-color: #2c3e50;
    color: white;
    text-align: center;
    padding: 1.5rem 0;
    margin-top: 3rem;
}

/* Responsive */
@media (max-width: 768px) {
    .navbar .container {
        flex-direction: column;
        gap: 1rem;
    }
    
    .nav-links {
        gap: 1rem;
    }
    
    .hero h2 {
        font-size: 2rem;
    }
    
    .features {
        grid-template-columns: 1fr;
    }
}
```

## 🚀 Passo 7: Executar a Aplicação

### 7.1 Ativar Ambiente Virtual

```bash
source venv/bin/activate  # No Windows: venv\Scripts\activate
```

### 7.2 Executar Flask

```bash
python app.py
```

A aplicação estará disponível em: **http://localhost:5000**

### 7.3 Testar Fluxo Completo

1. Acesse http://localhost:5000
2. Clique em "Começar Agora" ou "Upload"
3. Selecione um arquivo CSV com dados de clientes
4. Escolha o tipo de produto (CARTAO, CARNE ou EMPRESTIMO)
5. Clique em "Enviar e Processar"
6. Aguarde o processamento (página atualiza automaticamente)
7. Visualize os resultados
8. Baixe o CSV com os scores calculados

## 🔒 Passo 8: Segurança e Boas Práticas

### 8.1 Variáveis de Ambiente

**Nunca** commite credenciais no código. Sempre use variáveis de ambiente:

```python
# ❌ ERRADO
CREDGUARD_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# ✅ CORRETO
CREDGUARD_API_KEY = os.getenv('CREDGUARD_API_KEY')
```

### 8.2 Validação de Entrada

Sempre valide arquivos enviados:

```python
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Verificar tamanho máximo
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
```

### 8.3 Tratamento de Erros

Use try-except para capturar erros específicos:

```python
try:
    job = credguard_client.batch.upload(file_path, product)
except AuthenticationError:
    flash('Token inválido', 'error')
except RateLimitError:
    flash('Rate limit excedido', 'error')
except CredGuardAPIError as e:
    flash(f'Erro na API: {str(e)}', 'error')
```

### 8.4 HTTPS em Produção

Em produção, **sempre** use HTTPS. Configure com Nginx ou use serviços como Heroku/AWS:

```nginx
server {
    listen 443 ssl;
    server_name seu-dominio.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
    }
}
```

## 📊 Passo 9: Melhorias Recomendadas

### 9.1 Armazenamento Persistente

Em produção, substitua o dicionário `active_jobs` por Redis ou banco de dados:

```python
import redis

# Conectar ao Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Armazenar job
redis_client.setex(f"job:{job_id}", 3600, json.dumps(job_data))

# Recuperar job
job_data = json.loads(redis_client.get(f"job:{job_id}"))
```

### 9.2 Autenticação de Usuários

Adicione autenticação com Flask-Login:

```bash
pip install flask-login
```

```python
from flask_login import LoginManager, login_required

login_manager = LoginManager()
login_manager.init_app(app)

@app.route('/upload')
@login_required
def upload():
    # Apenas usuários autenticados podem fazer upload
    pass
```

### 9.3 Celery para Tarefas Assíncronas

Use Celery para processar uploads em background:

```bash
pip install celery
```

```python
from celery import Celery

celery = Celery('app', broker='redis://localhost:6379/0')

@celery.task
def process_upload(file_path, product):
    job = credguard_client.batch.upload(file_path, product, wait_for_completion=True)
    return job.job_id
```

### 9.4 Logging

Adicione logging para debug e monitoramento:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@app.route('/upload', methods=['POST'])
def upload():
    logger.info(f"Upload iniciado: {filename}")
    # ...
    logger.info(f"Job criado: {job.job_id}")
```

## 🎯 Conclusão

Você agora tem uma aplicação Flask completa e funcional integrada com o CredGuard SDK. A aplicação permite:

- ✅ Upload de arquivos CSV
- ✅ Processamento de scores em lote
- ✅ Monitoramento de status em tempo real
- ✅ Download de resultados
- ✅ Interface web amigável
- ✅ Tratamento robusto de erros
- ✅ Segurança com variáveis de ambiente

### 📚 Recursos Adicionais

- **Documentação da API**: https://credguard.manus.space/api/docs
- **SDK Python**: https://github.com/giselleCouto/CredGuard/tree/master/sdk-python
- **Flask Docs**: https://flask.palletsprojects.com/
- **Suporte**: support@credguard.com

### 🚀 Próximos Passos

1. **Deploy em Produção** - Use Heroku, AWS ou DigitalOcean
2. **Adicionar Autenticação** - Proteja rotas com Flask-Login
3. **Implementar Cache** - Use Redis para melhorar performance
4. **Monitoramento** - Integre com Sentry ou New Relic
5. **Testes Automatizados** - Escreva testes com pytest

---

**Desenvolvido com ❤️ usando CredGuard SDK v1.0.0**
