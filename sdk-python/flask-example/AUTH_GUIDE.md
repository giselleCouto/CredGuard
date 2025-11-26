# 🔐 Guia de Autenticação - CredGuard Flask App

Sistema completo de autenticação implementado com Flask-Login.

## 📋 Visão Geral

O sistema de autenticação protege as rotas da aplicação e associa jobs aos usuários, garantindo que cada usuário veja apenas seus próprios processamentos.

### Componentes Implementados

1. **Flask-Login** - Gerenciamento de sessões
2. **SQLite** - Banco de dados local
3. **Werkzeug** - Hash seguro de senhas (PBKDF2)
4. **Modelos** - User e Job
5. **Templates** - Login e Registro
6. **Proteção de Rotas** - Decorator `@login_required`

## 🗄️ Banco de Dados

### Tabela `users`

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela `jobs`

```sql
CREATE TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_id TEXT UNIQUE NOT NULL,
    filename TEXT NOT NULL,
    product TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🔑 Modelo de Usuário

```python
from models import User

# Criar novo usuário
user = User.create(
    username='joao',
    email='joao@example.com',
    password='senha123'
)

# Buscar usuário
user = User.get_by_username('joao')
user = User.get_by_email('joao@example.com')
user = User.get_by_id(1)

# Verificar senha
if user.check_password('senha123'):
    print('Senha correta!')
```

### Segurança de Senhas

- **Hash**: PBKDF2 com SHA-256
- **Salt**: Gerado automaticamente
- **Iterações**: 260.000 (padrão Werkzeug)
- **Armazenamento**: Apenas hash, nunca senha em texto plano

## 📊 Modelo de Job

```python
from models import Job

# Criar job associado ao usuário
Job.create(
    user_id=current_user.id,
    job_id='abc123',
    filename='clientes.csv',
    product='CARTAO',
    status='pending'
)

# Atualizar status
Job.update_status('abc123', 'completed')

# Buscar jobs do usuário
jobs = Job.get_by_user(current_user.id)

# Verificar propriedade
if Job.belongs_to_user('abc123', current_user.id):
    print('Job pertence ao usuário')
```

## 🛣️ Rotas Implementadas

### Rotas Públicas

- `GET /` - Página inicial
- `GET /login` - Formulário de login
- `POST /login` - Processar login
- `GET /register` - Formulário de registro
- `POST /register` - Processar registro

### Rotas Protegidas (requerem login)

- `GET /upload` - Formulário de upload
- `POST /upload` - Processar upload
- `GET /status/<job_id>` - Status do processamento
- `GET /results/<job_id>` - Resultados
- `GET /download/<job_id>` - Download CSV
- `GET /jobs` - Lista de jobs do usuário
- `GET /logout` - Logout

## 🔒 Proteção de Rotas

### Decorator `@login_required`

```python
from flask_login import login_required, current_user

@app.route('/upload')
@login_required
def upload():
    # Apenas usuários autenticados podem acessar
    return render_template('upload.html')
```

### Verificação de Propriedade

```python
@app.route('/status/<job_id>')
@login_required
def status(job_id):
    # Verificar se job pertence ao usuário
    if not Job.belongs_to_user(job_id, current_user.id):
        flash('Você não tem permissão para acessar este job', 'error')
        return redirect(url_for('list_jobs'))
    
    # Continuar processamento...
```

## 🎨 Templates

### Login (`templates/login.html`)

- Formulário com username e senha
- Checkbox "Lembrar de mim"
- Link para registro
- Validação client-side (HTML5)

### Registro (`templates/register.html`)

- Formulário com username, email, senha e confirmação
- Validações:
  - Username mínimo 3 caracteres
  - Email válido
  - Senha mínima 6 caracteres
  - Confirmação de senha
- Link para login

### Navbar Condicional (`templates/base.html`)

```html
{% if current_user.is_authenticated %}
    <li><a href="{{ url_for('upload') }}">Upload</a></li>
    <li><a href="{{ url_for('list_jobs') }}">Meus Jobs</a></li>
    <li><a href="{{ url_for('logout') }}">Logout ({{ current_user.username }})</a></li>
{% else %}
    <li><a href="{{ url_for('login') }}">Login</a></li>
    <li><a href="{{ url_for('register') }}">Registrar</a></li>
{% endif %}
```

## 🚀 Fluxo de Autenticação

### 1. Registro

```
Usuário → /register (GET)
    ↓
Preenche formulário
    ↓
/register (POST)
    ↓
Validações (username, email, senha)
    ↓
User.create() → Hash de senha
    ↓
Salva no banco
    ↓
Redireciona para /login
```

### 2. Login

```
Usuário → /login (GET)
    ↓
Preenche credenciais
    ↓
/login (POST)
    ↓
User.get_by_username()
    ↓
user.check_password()
    ↓
login_user(user, remember=True)
    ↓
Cria sessão (cookie)
    ↓
Redireciona para página solicitada
```

### 3. Acesso a Rota Protegida

```
Usuário → /upload
    ↓
@login_required verifica sessão
    ↓
Se não autenticado:
    → Redireciona para /login
    → Salva URL original em ?next=
    
Se autenticado:
    → Carrega current_user
    → Permite acesso
```

### 4. Logout

```
Usuário → /logout
    ↓
logout_user()
    ↓
Destroi sessão (cookie)
    ↓
Redireciona para /
```

## 🔐 Configuração

### Secret Key

A `SECRET_KEY` é usada para assinar cookies de sessão. **Nunca commite a chave real!**

```python
# config.py
class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
```

### Geração de Secret Key Segura

```bash
# Gerar chave aleatória
python3 -c "import secrets; print(secrets.token_hex(32))"

# Adicionar ao .env
echo "SECRET_KEY=sua_chave_gerada_aqui" >> .env
```

### Configuração de Sessão

```python
# app.py
login_manager.login_view = 'login'  # Rota de login
login_manager.login_message = 'Por favor, faça login para acessar esta página.'
login_manager.login_message_category = 'warning'
```

## 🧪 Testando o Sistema

### 1. Executar Aplicação

```bash
python app.py
```

### 2. Criar Conta

1. Acesse http://localhost:5000/register
2. Preencha: username, email, senha
3. Clique em "Criar Conta"

### 3. Fazer Login

1. Acesse http://localhost:5000/login
2. Digite username e senha
3. Marque "Lembrar de mim" (opcional)
4. Clique em "Entrar"

### 4. Testar Proteção

1. Sem login, tente acessar http://localhost:5000/upload
2. Deve redirecionar para /login
3. Após login, deve permitir acesso

### 5. Testar Isolamento

1. Crie 2 contas diferentes
2. Faça upload em cada conta
3. Verifique que cada usuário vê apenas seus jobs

## 🛡️ Segurança

### Boas Práticas Implementadas

✅ **Senhas com hash** - Nunca armazenadas em texto plano  
✅ **Salt automático** - Cada senha tem salt único  
✅ **Secret key forte** - Para assinar cookies  
✅ **Validação de entrada** - Username, email, senha  
✅ **Proteção de rotas** - `@login_required`  
✅ **Isolamento de dados** - Jobs associados a usuários  
✅ **HTTPS recomendado** - Em produção  

### Melhorias Recomendadas (Produção)

- [ ] **Rate limiting** - Prevenir brute force (Flask-Limiter)
- [ ] **CAPTCHA** - No registro e login (reCAPTCHA)
- [ ] **Email de confirmação** - Validar email real (Flask-Mail)
- [ ] **Recuperação de senha** - Reset via email
- [ ] **2FA** - Autenticação de dois fatores (pyotp)
- [ ] **Logs de auditoria** - Registrar logins e ações
- [ ] **Expiração de sessão** - Timeout automático
- [ ] **HTTPS obrigatório** - SSL/TLS em produção

## 📚 Referências

- [Flask-Login Docs](https://flask-login.readthedocs.io/)
- [Werkzeug Security](https://werkzeug.palletsprojects.com/en/2.3.x/utils/#module-werkzeug.security)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

## 🆘 Troubleshooting

### Erro: "No module named 'flask_login'"

```bash
pip install flask-login
```

### Erro: "Unable to open database file"

```bash
# Criar diretório se não existir
mkdir -p /path/to/app
cd /path/to/app
python -c "from models import init_db; init_db()"
```

### Erro: "Secret key not set"

```bash
# Adicionar ao .env
echo "SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')" >> .env
```

### Usuário não consegue fazer login

1. Verificar se usuário existe no banco
2. Verificar se senha está correta
3. Verificar logs de erro
4. Testar com usuário novo

### Jobs não aparecem na lista

1. Verificar se job foi salvo no banco
2. Verificar se `user_id` está correto
3. Verificar query `Job.get_by_user()`

---

**Sistema de autenticação implementado e testado ✅**
