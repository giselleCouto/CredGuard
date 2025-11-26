# 🛡️ Guia de Rate Limiting - CredGuard Flask App

Proteção contra ataques de força bruta implementada com Flask-Limiter.

## 📋 Visão Geral

O rate limiting protege as rotas de autenticação contra ataques automatizados, limitando o número de requisições que um IP pode fazer em um determinado período.

### Componentes Implementados

1. **Flask-Limiter** - Biblioteca de rate limiting
2. **Limites Globais** - 200/dia, 50/hora para todas as rotas
3. **Limites Específicos** - Login (10/min), Registro (5/min)
4. **Handler Customizado** - Mensagens amigáveis para erro 429
5. **Storage In-Memory** - Para desenvolvimento (Redis recomendado para produção)

## ⚙️ Configuração

### Instalação

```bash
pip install flask-limiter>=3.5.0
```

### Inicialização

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,  # Identifica usuário por IP
    default_limits=["200 per day", "50 per hour"],  # Limites globais
    storage_uri="memory://",  # Storage in-memory
    strategy="fixed-window"  # Estratégia de contagem
)
```

## 🔒 Limites Implementados

### Limites Globais

Aplicados a **todas as rotas** automaticamente:

- **200 requisições por dia** por IP
- **50 requisições por hora** por IP

### Limites Específicos

#### Rota de Login (`/login`)

```python
@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("10 per minute", methods=["POST"])
def login():
    # ...
```

- **10 tentativas de login por minuto** por IP
- Apenas requisições POST são limitadas
- GET (carregar formulário) não é limitado

#### Rota de Registro (`/register`)

```python
@app.route('/register', methods=['GET', 'POST'])
@limiter.limit("5 per minute", methods=["POST"])
def register():
    # ...
```

- **5 tentativas de registro por minuto** por IP
- Apenas requisições POST são limitadas
- GET (carregar formulário) não é limitado

## 🎯 Estratégias de Rate Limiting

### Fixed Window (Implementada)

```python
strategy="fixed-window"
```

- **Janela fixa de tempo** (ex: 1 minuto)
- Contador reseta no início de cada janela
- Simples e eficiente
- Pode permitir burst no limite da janela

**Exemplo:**
```
Minuto 1: 10 requisições ✅
Minuto 2: 10 requisições ✅
Minuto 3: 11 requisições ❌ (bloqueado)
```

### Sliding Window (Alternativa)

```python
strategy="moving-window"
```

- **Janela deslizante** (mais preciso)
- Considera requisições dos últimos N segundos
- Previne burst no limite da janela
- Mais complexo computacionalmente

## 🚨 Handler de Erro 429

### Implementação

```python
@app.errorhandler(429)
def ratelimit_handler(e):
    """Handler customizado para rate limit excedido."""
    # Mensagem amigável baseada na rota
    if 'login' in request.path:
        message = 'Muitas tentativas de login. Por favor, aguarde 1 minuto e tente novamente.'
    elif 'register' in request.path:
        message = 'Muitas tentativas de registro. Por favor, aguarde 1 minuto e tente novamente.'
    else:
        message = 'Muitas requisições. Por favor, aguarde alguns instantes e tente novamente.'
    
    flash(message, 'error')
    
    # Redirecionar para a página apropriada
    if 'login' in request.path:
        return render_template('login.html'), 429
    elif 'register' in request.path:
        return render_template('register.html'), 429
    else:
        return render_template('index.html'), 429
```

### Mensagens de Erro

- **Login**: "Muitas tentativas de login. Por favor, aguarde 1 minuto e tente novamente."
- **Registro**: "Muitas tentativas de registro. Por favor, aguarde 1 minuto e tente novamente."
- **Outras rotas**: "Muitas requisições. Por favor, aguarde alguns instantes e tente novamente."

## 📊 Identificação de Usuários

### Por IP (Implementado)

```python
key_func=get_remote_address
```

- **Identifica usuário pelo IP**
- Simples de implementar
- Funciona para usuários não autenticados
- Problema: IPs compartilhados (NAT, proxy)

### Por Usuário Autenticado (Alternativa)

```python
def get_user_identifier():
    if current_user.is_authenticated:
        return f"user-{current_user.id}"
    return get_remote_address()

limiter = Limiter(
    app=app,
    key_func=get_user_identifier,
    # ...
)
```

- **Identifica por user_id** quando autenticado
- **Identifica por IP** quando não autenticado
- Mais preciso para usuários logados

## 💾 Storage Backends

### Memory (Fallback)

```python
storage_uri="memory://"
```

✅ **Vantagens:**
- Rápido
- Sem dependências externas
- Ideal para desenvolvimento

❌ **Desvantagens:**
- Não persiste entre restarts
- Não funciona com múltiplos workers
- Não funciona com load balancers

### Redis (Implementado)

✅ **Status:** Configurado automaticamente via variável `REDIS_URL`

### Como Usar Redis

```python
storage_uri="redis://localhost:6379"
```

✅ **Vantagens:**
- Persiste entre restarts
- Funciona com múltiplos workers
- Funciona com load balancers
- Suporta rate limiting distribuído

❌ **Desvantagens:**
- Requer Redis instalado
- Dependência externa

**Instalação:**
```bash
pip install redis
```

**Configuração:**
```python
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="redis://localhost:6379",
    strategy="fixed-window"
)
```

## 🧪 Testando Rate Limiting

### Teste Manual

1. **Abra o navegador** em http://localhost:5000/login
2. **Tente fazer login** 11 vezes em 1 minuto
3. **Na 11ª tentativa**, você verá:
   - Mensagem: "Muitas tentativas de login. Por favor, aguarde 1 minuto e tente novamente."
   - Status HTTP: 429 Too Many Requests

### Teste com cURL

```bash
# Fazer 11 requisições de login em sequência
for i in {1..11}; do
  echo "Tentativa $i:"
  curl -X POST http://localhost:5000/login \
    -d "username=test&password=test" \
    -w "\nHTTP Status: %{http_code}\n\n"
done
```

**Resultado esperado:**
- Tentativas 1-10: HTTP 200 ou 302
- Tentativa 11: HTTP 429

### Teste Automatizado

```python
import requests
import time

url = "http://localhost:5000/login"
data = {"username": "test", "password": "test"}

for i in range(1, 12):
    response = requests.post(url, data=data)
    print(f"Tentativa {i}: Status {response.status_code}")
    
    if response.status_code == 429:
        print("✅ Rate limit funcionando!")
        break
    
    time.sleep(0.5)  # Pequeno delay entre requisições
```

## 📈 Monitoramento

### Logs de Rate Limit

Flask-Limiter não loga automaticamente. Para adicionar logs:

```python
from flask import g
import logging

@app.before_request
def log_rate_limit():
    # Obter informações de rate limit
    limit_info = limiter.current_limit
    if limit_info:
        g.rate_limit = limit_info
        logging.info(f"Rate limit: {limit_info}")

@app.after_request
def add_rate_limit_headers(response):
    # Adicionar headers de rate limit
    if hasattr(g, 'rate_limit'):
        response.headers['X-RateLimit-Limit'] = g.rate_limit.limit
        response.headers['X-RateLimit-Remaining'] = g.rate_limit.remaining
        response.headers['X-RateLimit-Reset'] = g.rate_limit.reset
    return response
```

### Headers HTTP

O Flask-Limiter pode adicionar headers informativos:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1640000000
```

## 🔧 Configurações Avançadas

### Whitelist de IPs

```python
# IPs que não sofrem rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
    strategy="fixed-window",
    exempt_when=lambda: request.remote_addr in ['127.0.0.1', '192.168.1.100']
)
```

### Limites Dinâmicos

```python
def get_dynamic_limit():
    if current_user.is_authenticated:
        if current_user.role == 'admin':
            return "100 per minute"  # Admins têm mais limite
        return "10 per minute"
    return "5 per minute"  # Não autenticados têm menos

@app.route('/api/data')
@limiter.limit(get_dynamic_limit)
def api_data():
    # ...
```

### Bypass para Testes

```python
# Desabilitar rate limiting em testes
if app.config['TESTING']:
    limiter.enabled = False
```

## 🛡️ Boas Práticas

### ✅ Recomendações

1. **Use Redis em produção** - Storage in-memory não funciona com múltiplos workers
2. **Configure limites realistas** - Não seja muito restritivo
3. **Mensagens amigáveis** - Explique ao usuário o que aconteceu
4. **Whitelist IPs confiáveis** - Seus próprios servidores, monitoramento
5. **Monitore rate limits** - Logs e alertas para limites atingidos
6. **Teste regularmente** - Garanta que está funcionando
7. **Documente limites** - Na API docs, README, etc.

### ❌ Evite

1. **Limites muito baixos** - Pode bloquear usuários legítimos
2. **Limites muito altos** - Não protege contra ataques
3. **Mensagens genéricas** - "Erro 429" não ajuda o usuário
4. **Storage in-memory em produção** - Não funciona com load balancers
5. **Ignorar headers** - Não informar ao usuário quanto falta

## 🚀 Produção

### Configuração Recomendada

```python
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Configuração baseada em ambiente
if os.getenv('FLASK_ENV') == 'production':
    storage_uri = os.getenv('REDIS_URL', 'redis://localhost:6379')
    strategy = "moving-window"  # Mais preciso
else:
    storage_uri = "memory://"
    strategy = "fixed-window"

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["1000 per day", "100 per hour"],  # Mais generoso em produção
    storage_uri=storage_uri,
    strategy=strategy
)
```

### Limites Recomendados por Ambiente

#### Desenvolvimento
- Login: 10/minuto
- Registro: 5/minuto
- Global: 200/dia, 50/hora

#### Produção
- Login: 20/minuto
- Registro: 10/minuto
- Global: 1000/dia, 100/hora

## 📚 Referências

- [Flask-Limiter Docs](https://flask-limiter.readthedocs.io/)
- [Rate Limiting Strategies](https://en.wikipedia.org/wiki/Rate_limiting)
- [OWASP Brute Force](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)

## 🆘 Troubleshooting

### Erro: "No module named 'flask_limiter'"

```bash
pip install flask-limiter
```

### Rate limit não está funcionando

1. Verificar se limiter está inicializado
2. Verificar se decorator está aplicado
3. Verificar logs de erro
4. Testar com cURL ou Postman

### Usuários legítimos sendo bloqueados

1. Aumentar limites
2. Usar whitelist para IPs confiáveis
3. Implementar limites dinâmicos por role

### Storage Redis não conecta

```bash
# Verificar se Redis está rodando
redis-cli ping

# Deve retornar: PONG
```

---

**Rate limiting implementado e testado ✅**


## 🔄 Migração para Redis (Implementada)

### Status Atual

✅ **A aplicação já está configurada para usar Redis automaticamente**

A configuração atual no `app.py`:

```python
# Usa Redis se REDIS_URL estiver definido, caso contrário usa memória
redis_url = os.getenv('REDIS_URL', 'memory://')

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=redis_url,  # ← Dinâmico!
    strategy="fixed-window"
)

# Log do storage backend usado
if redis_url.startswith('redis://'):
    print(f"✅ Rate limiting usando Redis: {redis_url.split('@')[-1] if '@' in redis_url else redis_url}")
else:
    print("⚠️  Rate limiting usando memória (não recomendado para produção)")
```

### Como Ativar Redis

**Opção 1: Local (Desenvolvimento)**

```bash
# 1. Instalar Redis
sudo apt install redis-server -y

# 2. Iniciar Redis
sudo systemctl start redis-server

# 3. Adicionar ao .env
echo "REDIS_URL=redis://localhost:6379" >> .env

# 4. Instalar cliente Python
pip install redis

# 5. Reiniciar aplicação
python app.py
```

**Opção 2: Docker**

```bash
# 1. Executar Redis em container
docker run -d --name redis -p 6379:6379 redis:7-alpine

# 2. Adicionar ao .env
echo "REDIS_URL=redis://localhost:6379" >> .env

# 3. Instalar cliente Python
pip install redis

# 4. Reiniciar aplicação
python app.py
```

**Opção 3: Redis Cloud (Produção)**

```bash
# 1. Criar conta em https://redis.com/try-free/
# 2. Criar database e copiar URL
# 3. Adicionar ao .env
echo "REDIS_URL=redis://:senha@redis-12345.cloud.redislabs.com:12345" >> .env

# 4. Instalar cliente Python
pip install redis

# 5. Reiniciar aplicação
python app.py
```

### Verificação

```bash
# Testar conectividade Redis
python test_redis_connection.py
```

**Saída esperada:**

```
🔍 Testando conexão com Redis...
   URL: redis://localhost:6379
✅ Biblioteca redis importada com sucesso
✅ Conexão com Redis estabelecida (PING → PONG)
✅ Operações SET/GET funcionando
ℹ️  Nenhuma chave de rate limiting encontrada (normal se app não foi usado)

📊 Informações do Redis:
   Versão: 7.0.0
   Modo: standalone
   Uptime: 0 dias

📈 Estatísticas:
   Total de conexões: 1
   Total de comandos: 5

🎉 Todos os testes de Redis passaram!

✅ Rate limiting está pronto para produção com Redis
   - Suporta múltiplos workers
   - Suporta load balancers
   - Persiste entre restarts
```

### Fallback Automático

Se `REDIS_URL` não estiver definido ou Redis não estiver disponível:

- ✅ Aplicação continua funcionando
- ⚠️ Usa storage in-memory (não recomendado para produção)
- 📝 Log indica que está usando memória

**Exemplo de log:**

```
⚠️  Rate limiting usando memória (não recomendado para produção)
```

### Documentação Completa

Para instruções detalhadas de instalação, configuração e troubleshooting, consulte:

📚 **[REDIS_SETUP.md](REDIS_SETUP.md)** - Guia completo de Redis
