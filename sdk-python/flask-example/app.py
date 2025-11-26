"""
Aplicação Flask integrada com CredGuard SDK + Autenticação
Exemplo completo com Flask-Login
"""
import os
from flask import Flask, render_template, request, redirect, url_for, flash, send_file
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from credguard import CredGuardClient, CredGuardAPIError, AuthenticationError, RateLimitError
from config import config
from models import User, Job, init_db
import time

# Inicializar aplicação Flask
app = Flask(__name__)

# Carregar configurações
env = os.getenv('FLASK_ENV', 'development')
app.config.from_object(config[env])
config[env].validate()

# Inicializar banco de dados
init_db()

# Configurar Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Por favor, faça login para acessar esta página.'
login_manager.login_message_category = 'warning'

@login_manager.user_loader
def load_user(user_id):
    return User.get_by_id(int(user_id))

# Inicializar cliente CredGuard
credguard_client = CredGuardClient(
    api_key=app.config['CREDGUARD_API_KEY'],
    base_url=app.config['CREDGUARD_BASE_URL']
)


def allowed_file(filename):
    """Verifica se o arquivo tem extensão permitida."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


# ============================================================================
# ROTAS DE AUTENTICAÇÃO
# ============================================================================

@app.route('/register', methods=['GET', 'POST'])
def register():
    """Página de registro de novo usuário."""
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Validações
        if not username or not email or not password:
            flash('Todos os campos são obrigatórios', 'error')
            return redirect(request.url)
        
        if len(username) < 3:
            flash('Username deve ter pelo menos 3 caracteres', 'error')
            return redirect(request.url)
        
        if len(password) < 6:
            flash('Senha deve ter pelo menos 6 caracteres', 'error')
            return redirect(request.url)
        
        if password != confirm_password:
            flash('As senhas não coincidem', 'error')
            return redirect(request.url)
        
        # Verificar se usuário já existe
        if User.get_by_username(username):
            flash('Username já está em uso', 'error')
            return redirect(request.url)
        
        if User.get_by_email(email):
            flash('Email já está cadastrado', 'error')
            return redirect(request.url)
        
        # Criar usuário
        user = User.create(username, email, password)
        if user:
            flash('Conta criada com sucesso! Faça login para continuar.', 'success')
            return redirect(url_for('login'))
        else:
            flash('Erro ao criar conta. Tente novamente.', 'error')
            return redirect(request.url)
    
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    """Página de login."""
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = request.form.get('remember') == 'on'
        
        if not username or not password:
            flash('Username e senha são obrigatórios', 'error')
            return redirect(request.url)
        
        user = User.get_by_username(username)
        
        if user and user.check_password(password):
            login_user(user, remember=remember)
            flash(f'Bem-vindo, {user.username}!', 'success')
            
            # Redirecionar para página solicitada ou index
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('index'))
        else:
            flash('Username ou senha incorretos', 'error')
            return redirect(request.url)
    
    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    """Logout do usuário."""
    logout_user()
    flash('Logout realizado com sucesso', 'success')
    return redirect(url_for('index'))


# ============================================================================
# ROTAS PRINCIPAIS (PROTEGIDAS)
# ============================================================================

@app.route('/')
def index():
    """Página inicial."""
    return render_template('index.html')


@app.route('/upload', methods=['GET', 'POST'])
@login_required
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
            
            # Salvar job no banco de dados associado ao usuário
            Job.create(
                user_id=current_user.id,
                job_id=job.job_id,
                filename=filename,
                product=product,
                status=job.status
            )
            
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
@login_required
def status(job_id):
    """Página de status do processamento."""
    # Verificar se job pertence ao usuário
    if not Job.belongs_to_user(job_id, current_user.id):
        flash('Você não tem permissão para acessar este job', 'error')
        return redirect(url_for('list_jobs'))
    
    try:
        # Consultar status do job
        job = credguard_client.batch.get_status(job_id)
        
        # Atualizar status no banco de dados
        Job.update_status(job_id, job.status)
        
        return render_template('status.html', job=job)
        
    except CredGuardAPIError as e:
        flash(f'Erro ao consultar status: {str(e)}', 'error')
        return redirect(url_for('index'))


@app.route('/results/<job_id>')
@login_required
def results(job_id):
    """Página de resultados do processamento."""
    # Verificar se job pertence ao usuário
    if not Job.belongs_to_user(job_id, current_user.id):
        flash('Você não tem permissão para acessar este job', 'error')
        return redirect(url_for('list_jobs'))
    
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
@login_required
def download(job_id):
    """Download do arquivo CSV com resultados."""
    # Verificar se job pertence ao usuário
    if not Job.belongs_to_user(job_id, current_user.id):
        flash('Você não tem permissão para acessar este job', 'error')
        return redirect(url_for('list_jobs'))
    
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
@login_required
def list_jobs():
    """Lista todos os jobs do usuário."""
    # Buscar jobs do usuário no banco de dados
    user_jobs = Job.get_by_user(current_user.id)
    
    # Atualizar status de cada job
    jobs_list = []
    for job_data in user_jobs:
        try:
            job = credguard_client.batch.get_status(job_data['job_id'])
            
            # Atualizar status no banco
            Job.update_status(job_data['job_id'], job.status)
            
            jobs_list.append({
                'job_id': job.job_id,
                'filename': job_data['filename'],
                'product': job_data['product'],
                'status': job.status,
                'processed_rows': job.processed_rows,
                'total_rows': job.total_rows
            })
        except:
            # Se não conseguir consultar, usar dados do banco
            jobs_list.append({
                'job_id': job_data['job_id'],
                'filename': job_data['filename'],
                'product': job_data['product'],
                'status': job_data['status'],
                'processed_rows': None,
                'total_rows': None
            })
    
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
