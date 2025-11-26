"""
Aplicação Flask integrada com CredGuard SDK
Exemplo completo de verificação de score de crédito
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
