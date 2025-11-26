# 🔴 Redis Setup - CredGuard Flask App

Guia completo para configurar Redis como storage do rate limiting.

## 📋 Por que Redis?

### Problemas do Storage In-Memory

❌ **Não persiste entre restarts** - Contadores resetam ao reiniciar app  
❌ **Não funciona com múltiplos workers** - Cada worker tem seu próprio contador  
❌ **Não funciona com load balancers** - Cada servidor tem contadores independentes  
❌ **Não é distribuído** - Impossível compartilhar limites entre instâncias  

### Vantagens do Redis

✅ **Persiste entre restarts** - Contadores mantidos no Redis  
✅ **Funciona com múltiplos workers** - Contadores compartilhados  
✅ **Funciona com load balancers** - Storage centralizado  
✅ **Distribuído** - Múltiplas instâncias compartilham limites  
✅ **Rápido** - Operações em memória com persistência opcional  
✅ **Confiável** - Battle-tested em produção  

## 🚀 Instalação

### Ubuntu/Debian

```bash
# Instalar Redis
sudo apt update
sudo apt install redis-server -y

# Iniciar Redis
sudo systemctl start redis-server

# Habilitar auto-start
sudo systemctl enable redis-server

# Verificar status
sudo systemctl status redis-server
```

### macOS

```bash
# Instalar via Homebrew
brew install redis

# Iniciar Redis
brew services start redis

# Verificar status
brew services list
```

### Docker

```bash
# Executar Redis em container
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Verificar logs
docker logs redis
```

### Windows (WSL)

```bash
# Instalar Redis no WSL
sudo apt update
sudo apt install redis-server -y

# Iniciar Redis
sudo service redis-server start

# Verificar status
sudo service redis-server status
```

## 🔧 Configuração

### 1. Instalar Cliente Python

```bash
pip install redis>=5.0.0
```

### 2. Configurar Variável de Ambiente

Adicione ao arquivo `.env`:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
```

**Formatos suportados:**

```bash
# Local (sem senha)
REDIS_URL=redis://localhost:6379

# Local (com senha)
REDIS_URL=redis://:senha@localhost:6379

# Remoto (com senha)
REDIS_URL=redis://:senha@redis.example.com:6379

# Redis Cloud
REDIS_URL=redis://:senha@redis-12345.cloud.redislabs.com:12345

# Com database específico
REDIS_URL=redis://localhost:6379/0
```

### 3. Atualizar app.py

A aplicação já está configurada para usar Redis automaticamente quando `REDIS_URL` estiver definido:

```python
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Configuração automática baseada em ambiente
redis_url = os.getenv('REDIS_URL', 'memory://')

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=redis_url,  # Usa Redis se REDIS_URL estiver definido
    strategy="fixed-window"
)
```

## ✅ Verificação

### Testar Conectividade

```bash
# Testar conexão Redis
redis-cli ping
# Deve retornar: PONG
```

### Testar com Python

```python
import redis

# Conectar ao Redis
r = redis.from_url('redis://localhost:6379')

# Testar conexão
print(r.ping())  # Deve retornar: True

# Testar set/get
r.set('test', 'hello')
print(r.get('test'))  # Deve retornar: b'hello'
```

### Testar Rate Limiting

```bash
# Executar script de teste
python test_redis_connection.py
```

## 📊 Monitoramento

### Ver Chaves do Rate Limiting

```bash
# Conectar ao Redis
redis-cli

# Listar todas as chaves
KEYS *

# Ver chaves do Flask-Limiter
KEYS LIMITER*

# Ver valor de uma chave
GET LIMITER:127.0.0.1:/login:POST

# Ver TTL (tempo até expirar)
TTL LIMITER:127.0.0.1:/login:POST
```

### Monitorar em Tempo Real

```bash
# Ver comandos em tempo real
redis-cli MONITOR

# Ver estatísticas
redis-cli INFO stats
```

## 🔒 Segurança

### Configurar Senha

Edite `/etc/redis/redis.conf`:

```conf
# Adicionar senha
requirepass sua_senha_forte_aqui

# Desabilitar comandos perigosos
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
```

Reinicie o Redis:

```bash
sudo systemctl restart redis-server
```

Atualize `.env`:

```bash
REDIS_URL=redis://:sua_senha_forte_aqui@localhost:6379
```

### Bind Address

Por padrão, Redis escuta apenas em `127.0.0.1` (localhost). Para aceitar conexões remotas, edite `/etc/redis/redis.conf`:

```conf
# Permitir conexões de qualquer IP (cuidado!)
bind 0.0.0.0

# Ou especificar IPs específicos
bind 127.0.0.1 192.168.1.100
```

**⚠️ IMPORTANTE:** Sempre use senha quando permitir conexões remotas!

## 🌐 Redis Cloud (Produção)

### Opções de Hosting

1. **Redis Cloud** (RedisLabs)
   - Free tier: 30MB
   - URL: https://redis.com/try-free/

2. **AWS ElastiCache**
   - Gerenciado pela AWS
   - Integração com VPC

3. **Google Cloud Memorystore**
   - Gerenciado pelo GCP
   - Alta disponibilidade

4. **Azure Cache for Redis**
   - Gerenciado pela Azure
   - Múltiplas regiões

### Configuração Redis Cloud

1. Criar conta em https://redis.com/try-free/
2. Criar novo database
3. Copiar endpoint e senha
4. Adicionar ao `.env`:

```bash
REDIS_URL=redis://:senha@redis-12345.cloud.redislabs.com:12345
```

## 🧪 Testes

### Teste de Conectividade

```bash
python test_redis_connection.py
```

### Teste de Rate Limiting

```bash
# Fazer 11 requisições de login
for i in {1..11}; do
  echo "Tentativa $i:"
  curl -X POST http://localhost:5000/login \
    -d "username=test&password=test" \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 0.5
done
```

### Verificar Chaves no Redis

```bash
redis-cli KEYS LIMITER*
```

## 🔧 Troubleshooting

### Erro: "Connection refused"

```bash
# Verificar se Redis está rodando
sudo systemctl status redis-server

# Iniciar Redis
sudo systemctl start redis-server
```

### Erro: "NOAUTH Authentication required"

Redis está configurado com senha. Atualize `REDIS_URL`:

```bash
REDIS_URL=redis://:sua_senha@localhost:6379
```

### Erro: "Connection timeout"

Verifique firewall e bind address:

```bash
# Ver configuração atual
redis-cli CONFIG GET bind

# Verificar porta
sudo netstat -tlnp | grep 6379
```

### Rate limiting não funciona

1. Verificar se `REDIS_URL` está definido
2. Verificar conectividade: `redis-cli ping`
3. Verificar chaves: `redis-cli KEYS LIMITER*`
4. Verificar logs da aplicação

## 📈 Performance

### Configurações Recomendadas

Edite `/etc/redis/redis.conf`:

```conf
# Máximo de memória (ajustar conforme necessário)
maxmemory 256mb

# Política de eviction (remover chaves antigas)
maxmemory-policy allkeys-lru

# Persistência (opcional para rate limiting)
save ""  # Desabilitar snapshots
appendonly no  # Desabilitar AOF

# Timeout de conexões idle
timeout 300
```

### Benchmarks

```bash
# Testar performance
redis-benchmark -q -n 10000
```

## 🔄 Migração de Memory para Redis

### Passo a Passo

1. **Instalar Redis**
   ```bash
   sudo apt install redis-server -y
   ```

2. **Adicionar ao requirements.txt**
   ```
   redis>=5.0.0
   ```

3. **Instalar dependência**
   ```bash
   pip install redis
   ```

4. **Configurar .env**
   ```bash
   echo "REDIS_URL=redis://localhost:6379" >> .env
   ```

5. **Reiniciar aplicação**
   ```bash
   python app.py
   ```

6. **Verificar funcionamento**
   ```bash
   python test_redis_connection.py
   ```

### Rollback (se necessário)

Para voltar ao storage in-memory:

1. Remover `REDIS_URL` do `.env`
2. Reiniciar aplicação

A aplicação automaticamente volta para `memory://`.

## 📚 Referências

- [Redis Documentation](https://redis.io/documentation)
- [Flask-Limiter Redis](https://flask-limiter.readthedocs.io/en/stable/#redis)
- [Redis Python Client](https://redis-py.readthedocs.io/)

---

**Redis configurado e pronto para produção ✅**
