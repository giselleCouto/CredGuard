# CredGuard Flask Example

Exemplo completo de aplicação Flask integrada com CredGuard SDK.

## 🚀 Quick Start

### 1. Instalação

```bash
# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
```

### 2. Configuração

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env e configurar:
# - CREDGUARD_API_KEY: seu token JWT
# - CREDGUARD_BASE_URL: URL da API
# - SECRET_KEY: chave secreta para sessões
# - REDIS_URL: URL do Redis (opcional)
```

### 3. Executar

```bash
python app.py
```

Acesse: http://localhost:5000

## 📄 Teste Rápido com CSV de Exemplo

Para testar imediatamente sem criar seu próprio CSV:

1. **Use o arquivo de exemplo:** `clientes_exemplo.csv`
   - Contém 10 clientes fictícios
   - Dados realistas para diferentes perfis de risco
   - Pronto para upload

2. **Faça upload:**
   - Acesse http://localhost:5000/upload
   - Selecione `clientes_exemplo.csv`
   - Escolha o produto (CARTAO, EMPRESTIMO, etc.)
   - Clique em "Enviar"

3. **Veja os resultados:**
   - Acompanhe o processamento em tempo real
   - Visualize os scores de crédito
   - Baixe o CSV com resultados

### Perfis de Exemplo no CSV

O arquivo `clientes_exemplo.csv` contém:

- **3 clientes de baixo risco:** Score 750+, renda alta, histórico excelente
- **4 clientes de médio risco:** Score 650-750, renda média, histórico bom/regular
- **3 clientes de alto risco:** Score <650, renda baixa, histórico ruim

## 📋 Formato do CSV

### Colunas Obrigatórias

```csv
cpf,nome,renda_mensal,idade,score_bureau,historico_pagamentos,divida_total,tempo_emprego_meses
12345678901,João Silva,5000.00,35,720,bom,15000.00,48
```

### Validações

- **CPF:** 11 dígitos, sem formatação
- **Renda Mensal:** Decimal com ponto (ex: 5000.00)
- **Idade:** Entre 18 e 100 anos
- **Score Bureau:** Entre 300 e 850
- **Histórico:** excelente, bom, regular, ruim
- **Dívida Total:** Decimal com ponto (ex: 15000.00)
- **Tempo Emprego:** Meses (número inteiro)

📚 **Documentação completa:** Veja `CSV_FORMAT.md` para detalhes

## 🔐 Autenticação

A aplicação possui sistema de autenticação completo:

- **Registro:** Crie uma conta em `/register`
- **Login:** Faça login em `/login`
- **Proteção:** Rotas de upload e jobs requerem autenticação
- **Isolamento:** Cada usuário vê apenas seus próprios jobs

📚 **Documentação completa:** Veja `AUTH_GUIDE.md`

## 🛡️ Rate Limiting

Proteção contra brute force implementada:

- **Login:** 10 tentativas por minuto
- **Registro:** 5 tentativas por minuto
- **Global:** 200 requisições por dia, 50 por hora

📚 **Documentação completa:** Veja `RATE_LIMIT_GUIDE.md`

## 🔴 Redis (Opcional)

Para produção com múltiplos workers:

```bash
# Instalar Redis
sudo apt install redis-server

# Configurar no .env
REDIS_URL=redis://localhost:6379

# Instalar cliente Python
pip install redis
```

📚 **Documentação completa:** Veja `REDIS_SETUP.md`

## 📚 Documentação

- **`FLASK_INTEGRATION_GUIDE.md`** - Tutorial completo passo a passo
- **`CSV_FORMAT.md`** - Formato e validações do CSV
- **`AUTH_GUIDE.md`** - Sistema de autenticação
- **`RATE_LIMIT_GUIDE.md`** - Proteção contra brute force
- **`REDIS_SETUP.md`** - Configuração Redis para produção
- **`QUICK_START.md`** - Início rápido em 5 minutos

## 🧪 Testes

```bash
# Testar autenticação
python test_auth.py

# Testar rate limiting
python test_rate_limit.py

# Testar Redis (se configurado)
python test_redis_connection.py
```

## 📁 Estrutura

```
flask-example/
├── app.py                      # Aplicação principal
├── config.py                   # Configurações
├── models.py                   # Modelos (User, Job)
├── clientes_exemplo.csv        # CSV de exemplo ✨
├── templates/                  # Templates HTML
│   ├── base.html
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── upload.html
│   ├── status.html
│   ├── results.html
│   └── jobs.html
├── static/
│   └── style.css              # Estilos CSS
├── uploads/                    # Diretório de uploads
└── docs/                       # Documentação
```

## 🚀 Deploy

### Gunicorn (Produção)

```bash
# Instalar Gunicorn
pip install gunicorn

# Executar com 4 workers
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker

```bash
# Build
docker build -t credguard-flask .

# Run
docker run -p 5000:5000 credguard-flask
```

## 🆘 Troubleshooting

### Erro: "No module named 'credguard'"

```bash
pip install credguard-sdk
```

### Erro: "CREDGUARD_API_KEY not set"

Configure o token JWT no arquivo `.env`:

```
CREDGUARD_API_KEY=seu_token_aqui
```

### Erro: "Unable to open database file"

```bash
python -c "from models import init_db; init_db()"
```

### Arquivo CSV rejeitado

- Verifique o formato em `CSV_FORMAT.md`
- Use `clientes_exemplo.csv` como referência
- Valide CPFs (11 dígitos, sem formatação)
- Use ponto (`.`) como separador decimal

## 📞 Suporte

- **Issues:** https://github.com/giselleCouto/CredGuard/issues
- **Documentação:** Veja arquivos `*_GUIDE.md`
- **Exemplo CSV:** Use `clientes_exemplo.csv` para testes

---

**Desenvolvido com ❤️ para facilitar integração com CredGuard API**
