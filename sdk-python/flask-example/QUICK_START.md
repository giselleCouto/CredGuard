# ⚡ Quick Start - CredGuard Flask App

Aplicação Flask 100% funcional integrada com CredGuard SDK.

## 🚀 Instalação Rápida (5 minutos)

```bash
# 1. Copiar exemplo para seu projeto
cp -r flask-example/ meu-credguard-app/
cd meu-credguard-app/

# 2. Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Configurar credenciais
cp .env.example .env
nano .env  # Editar CREDGUARD_API_KEY

# 5. Executar aplicação
python app.py
```

**Pronto!** Acesse http://localhost:5000

## 📋 O que está incluído

### Backend (Python/Flask)
- ✅ `app.py` - 7 rotas completas (index, upload, status, results, download, jobs, error handler)
- ✅ `config.py` - Configuração por ambiente (dev/prod) com validações
- ✅ Integração CredGuard SDK (upload, polling, download)
- ✅ Tratamento de erros (AuthenticationError, RateLimitError, CredGuardAPIError)
- ✅ Upload de arquivos com validação (CSV, 16MB max)
- ✅ Flash messages para feedback do usuário

### Frontend (HTML/CSS)
- ✅ 6 templates HTML completos
  - `base.html` - Layout base com navbar e footer
  - `index.html` - Página inicial com hero e features
  - `upload.html` - Formulário de upload com validação
  - `status.html` - Status com auto-refresh (5s) e progress bar
  - `results.html` - Resultados com summary cards
  - `jobs.html` - Lista de jobs com tabela responsiva
- ✅ CSS completo (500+ linhas)
  - Design moderno e profissional
  - Responsivo (mobile-first)
  - Animações e transições suaves

### Funcionalidades
- ✅ Upload de CSV em lote
- ✅ Seleção de produto (CARTAO, CARNE, EMPRESTIMO)
- ✅ Processamento assíncrono com polling automático
- ✅ Progress bar animada
- ✅ Auto-refresh na página de status
- ✅ Download de resultados em CSV
- ✅ Lista de jobs ativos
- ✅ Feedback visual (success, error, warning)

## 🧪 Validação

Todos os testes passaram ✅:

```bash
python test_import.py
```

Resultado:
```
✅ Flask importado com sucesso
✅ Config importado com sucesso
✅ app.py estruturado corretamente
✅ Todos os 6 templates encontrados
✅ CSS completo e responsivo
🎉 Todos os testes passaram! Aplicação Flask está completa.
```

## 📁 Estrutura de Arquivos

```
flask-example/
├── app.py                  # Aplicação Flask principal (200+ linhas)
├── config.py               # Configurações por ambiente
├── requirements.txt        # Dependências Python
├── .env.example            # Template de variáveis de ambiente
├── .gitignore              # Arquivos ignorados pelo Git
├── README.md               # Documentação completa
├── test_import.py          # Testes de validação
├── templates/              # Templates HTML
│   ├── base.html          # Layout base
│   ├── index.html         # Página inicial
│   ├── upload.html        # Formulário de upload
│   ├── status.html        # Status do processamento
│   ├── results.html       # Resultados
│   └── jobs.html          # Lista de jobs
├── static/                 # Arquivos estáticos
│   └── style.css          # CSS completo (500+ linhas)
├── uploads/                # Diretório para CSVs enviados
│   └── .gitkeep
└── results/                # Diretório para resultados
    └── .gitkeep
```

## 🎯 Fluxo de Uso

1. **Acesse** http://localhost:5000
2. **Clique** em "Começar Agora" ou "Upload"
3. **Selecione** arquivo CSV com dados de clientes
4. **Escolha** tipo de produto (CARTAO, CARNE ou EMPRESTIMO)
5. **Clique** em "Enviar e Processar"
6. **Aguarde** processamento (página atualiza automaticamente)
7. **Visualize** resultados
8. **Baixe** CSV com scores calculados

## 📊 Formato do CSV

O arquivo deve conter as seguintes colunas obrigatórias:

- `cpf` - CPF do cliente (formato: XXX.XXX.XXX-XX)
- `renda_mensal` - Renda mensal em reais
- `idade` - Idade do cliente
- `tempo_emprego_meses` - Tempo no emprego atual
- ... e outras 100+ features

Veja documentação completa em: https://credguard.manus.space/api/docs

## 🔒 Segurança

- ✅ Variáveis de ambiente para credenciais
- ✅ Validação de extensão de arquivo (apenas CSV)
- ✅ Limite de tamanho de arquivo (16MB)
- ✅ Tratamento robusto de erros
- ✅ `.gitignore` configurado (não commita .env, uploads/, results/)

## 🚀 Deploy em Produção

### Heroku

```bash
# 1. Criar Procfile
echo "web: python app.py" > Procfile

# 2. Deploy
heroku create meu-credguard-app
heroku config:set CREDGUARD_API_KEY=seu_token_jwt
heroku config:set FLASK_ENV=production
heroku config:set SECRET_KEY=$(openssl rand -hex 32)
git push heroku master
```

### AWS/DigitalOcean

```bash
# 1. Instalar gunicorn
pip install gunicorn

# 2. Executar com gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

## 📚 Documentação Completa

Para tutorial detalhado passo a passo, veja:
- `FLASK_INTEGRATION_GUIDE.md` (1.600+ linhas)

Para publicação do SDK no PyPI, veja:
- `../PYPI_PUBLISH.md`

## 🆘 Suporte

- **Documentação da API**: https://credguard.manus.space/api/docs
- **SDK Python**: https://github.com/giselleCouto/CredGuard/tree/master/sdk-python
- **Issues**: https://github.com/giselleCouto/CredGuard/issues

## 📝 Licença

MIT License - Veja `../LICENSE` para detalhes.

---

**Desenvolvido com ❤️ usando CredGuard SDK v1.0.0**
