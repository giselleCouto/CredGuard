# 💳 Integração Stripe - Documentação Completa

## Visão Geral

Este documento descreve a **integração completa do Stripe** na aplicação CredGuard Flask para aceitar pagamentos únicos e assinaturas recorrentes.

## 📦 Componentes Implementados

### 1. Configuração (stripe_config.py)

**Módulo:** `stripe_config.py` (450+ linhas)

**Classes Principais:**

#### StripeConfig
Gerencia configuração e autenticação do Stripe.

```python
from stripe_config import StripeConfig

config = StripeConfig()

# Verificar se está configurado
if config.is_configured():
    print('✅ Stripe configurado')
    print(f'Chave publicável: {config.get_publishable_key()}')
else:
    print('❌ Stripe não configurado')
```

**Variáveis de Ambiente Necessárias:**
- `STRIPE_SECRET_KEY`: Chave secreta (sk_test_... ou sk_live_...)
- `STRIPE_PUBLISHABLE_KEY`: Chave publicável (pk_test_... ou pk_live_...)
- `STRIPE_WEBHOOK_SECRET`: Secret do webhook (whsec_...)

#### StripeProducts
Gerencia produtos e preços disponíveis.

```python
from stripe_config import StripeProducts

# Listar todos os produtos
products = StripeProducts.get_all_products()

# Obter produto específico
product = StripeProducts.get_product('basic')

# Formatar preço
price_formatted = StripeProducts.format_price(4900, 'brl')  # R$ 49,00
```

**Produtos Disponíveis:**

1. **Plano Básico (R$ 49,00/mês)**
   - 1.000 análises de CPF/mês
   - Validação com dígitos verificadores
   - Dashboard de estatísticas
   - Suporte por email

2. **Plano Profissional (R$ 149,00/mês)**
   - 10.000 análises de CPF/mês
   - Validação com dígitos verificadores
   - Dashboard avançado
   - API de estatísticas
   - Suporte prioritário
   - Webhooks personalizados

3. **Plano Enterprise (R$ 499,00/mês)**
   - Análises ilimitadas
   - Validação com dígitos verificadores
   - Dashboard personalizado
   - API completa
   - Suporte 24/7
   - Webhooks personalizados
   - Integração dedicada
   - SLA garantido

#### StripePayments
Gerencia criação de sessões de checkout.

```python
from stripe_config import StripePayments

# Criar sessão de pagamento único
session = StripePayments.create_checkout_session(
    product_id='basic',
    success_url='https://exemplo.com/success',
    cancel_url='https://exemplo.com/cancel',
    customer_email='cliente@exemplo.com'
)

# Criar sessão de assinatura
session = StripePayments.create_subscription_session(
    product_id='professional',
    success_url='https://exemplo.com/success',
    cancel_url='https://exemplo.com/cancel',
    customer_email='cliente@exemplo.com',
    trial_days=7  # 7 dias de trial gratuito
)

# Redirecionar usuário para checkout
print(f'URL do checkout: {session["url"]}')
```

#### StripeWebhooks
Gerencia processamento de webhooks do Stripe.

```python
from stripe_config import StripeWebhooks

# Construir evento do webhook
event = StripeWebhooks.construct_event(
    payload=request.data,
    sig_header=request.headers['Stripe-Signature'],
    webhook_secret='whsec_...'
)

# Processar eventos específicos
if event['type'] == 'checkout.session.completed':
    session_data = StripeWebhooks.handle_checkout_completed(event)
    print(f'Checkout completado: {session_data["session_id"]}')

elif event['type'] == 'payment_intent.succeeded':
    payment_data = StripeWebhooks.handle_payment_succeeded(event)
    print(f'Pagamento bem-sucedido: {payment_data["payment_intent_id"]}')

elif event['type'] == 'customer.subscription.created':
    subscription_data = StripeWebhooks.handle_subscription_created(event)
    print(f'Assinatura criada: {subscription_data["subscription_id"]}')
```

### 2. Rotas (stripe_routes.py)

**Módulo:** `stripe_routes.py` (250+ linhas)

**Rotas Implementadas:**

#### GET /pricing
Página de preços com todos os planos disponíveis.

**Funcionalidades:**
- Exibe 3 planos (Basic, Professional, Enterprise)
- Destaca plano mais popular
- Mostra recursos de cada plano
- Botão "Assinar Agora" para cada plano
- FAQ com 5 perguntas frequentes
- Aviso se Stripe não configurado

**Template:** `templates/pricing.html`

#### POST /create-checkout
Cria sessão de checkout do Stripe e redireciona usuário.

**Parâmetros (Form):**
- `product_id`: ID do produto (basic, professional, enterprise)
- `mode`: Tipo de pagamento (payment ou subscription)

**Fluxo:**
1. Validar produto
2. Criar sessão no Stripe
3. Redirecionar para URL do checkout
4. Stripe processa pagamento
5. Redireciona para /payment/success ou /payment/cancel

**Requer:** Autenticação (`@login_required`)

#### GET /payment/success
Página de sucesso após pagamento completado.

**Parâmetros (Query):**
- `session_id`: ID da sessão de checkout

**Funcionalidades:**
- Recupera informações da sessão
- Exibe detalhes do pagamento
- Mostra próximos passos
- Links para Dashboard e Upload

**Template:** `templates/payment_success.html`

#### GET /payment/cancel
Página de cancelamento de pagamento.

**Funcionalidades:**
- Informa que pagamento foi cancelado
- Explica o que aconteceu
- Sugere próximos passos
- Links para tentar novamente ou voltar

**Template:** `templates/payment_cancel.html`

#### POST /webhook/stripe
Endpoint para receber webhooks do Stripe.

**Eventos Suportados:**
- `checkout.session.completed`: Checkout completado
- `payment_intent.succeeded`: Pagamento bem-sucedido
- `customer.subscription.created`: Assinatura criada
- `customer.subscription.updated`: Assinatura atualizada
- `customer.subscription.deleted`: Assinatura cancelada

**Segurança:**
- Verifica assinatura do webhook
- Valida secret do webhook
- Retorna 400 se assinatura inválida

**Processamento:**
1. Recebe evento do Stripe
2. Verifica assinatura
3. Processa evento específico
4. Registra no log
5. Retorna 200 OK

**TODO:** Implementar lógica de negócio:
- Ativar plano do usuário no banco
- Registrar pagamento
- Enviar email de confirmação
- Atualizar limites de uso

#### GET /api/stripe/config
API para obter configuração pública do Stripe.

**Resposta (JSON):**
```json
{
  "publishable_key": "pk_test_...",
  "configured": true
}
```

**Uso:** Frontend pode usar para inicializar Stripe.js

### 3. Templates

#### templates/pricing.html (350+ linhas)

**Componentes:**

1. **Header:**
   - Título: "Escolha o Plano Ideal para Você"
   - Subtítulo explicativo
   - Aviso se Stripe não configurado

2. **Cards de Preços (3 cards):**
   - Nome do plano
   - Descrição
   - Preço formatado (R$ X,XX/mês)
   - Lista de recursos (✓)
   - Botão "Assinar Agora"
   - Badge "Mais Popular" no plano Professional

3. **FAQ (5 perguntas):**
   - Formas de pagamento
   - Cancelamento
   - Limite excedido
   - Segurança dos dados
   - Período de teste

**Design:**
- Grid responsivo (auto-fit, minmax 300px)
- Cards com hover effect (translateY, box-shadow)
- Plano Professional destacado (borda azul)
- Cores semânticas (verde para botões)
- Mobile-first (breakpoint 768px)

#### templates/payment_success.html (250+ linhas)

**Componentes:**

1. **Ícone de Sucesso:**
   - Círculo verde com checkmark (✓)
   - Animação scaleIn

2. **Mensagem de Confirmação:**
   - Título: "Pagamento Confirmado!"
   - Mensagem de agradecimento

3. **Detalhes do Pagamento:**
   - Email do cliente
   - Valor pago (formatado)
   - Status do pagamento
   - ID da sessão

4. **Próximos Passos (3 itens):**
   - Acessar Dashboard
   - Fazer primeiro upload
   - Configurar webhooks

5. **Botões de Ação:**
   - "Ir para Dashboard" (azul)
   - "Fazer Upload" (branco com borda)

6. **Seção de Ajuda:**
   - Email de suporte

**Design:**
- Card centralizado (max-width 600px)
- Animação de entrada (scaleIn)
- Cores: Verde (sucesso), Azul (ações)
- Responsivo (mobile-first)

#### templates/payment_cancel.html (200+ linhas)

**Componentes:**

1. **Ícone de Cancelamento:**
   - Círculo vermelho com X (✕)
   - Animação shakeIn

2. **Mensagem de Cancelamento:**
   - Título: "Pagamento Cancelado"
   - Explicação: Nenhuma cobrança realizada

3. **Seção Informativa:**
   - Fundo amarelo claro
   - Borda esquerda amarela
   - Explica o que aconteceu

4. **O que fazer agora (3 opções):**
   - Tentar novamente
   - Dúvidas sobre pagamento
   - Explorar recursos gratuitos

5. **Botões de Ação:**
   - "Ver Planos Novamente" (azul)
   - "Voltar ao Início" (branco com borda)

6. **Seção de Ajuda:**
   - Email de suporte

**Design:**
- Card centralizado (max-width 600px)
- Animação de entrada (shakeIn)
- Cores: Vermelho (erro), Amarelo (aviso), Azul (ações)
- Responsivo (mobile-first)

## 🔄 Fluxo Completo de Pagamento

### 1. Usuário Acessa Página de Preços

```
GET /pricing
    ↓
Renderiza pricing.html
    ↓
Exibe 3 planos com preços
    ↓
Usuário clica em "Assinar Agora"
```

### 2. Criação de Sessão de Checkout

```
POST /create-checkout
    product_id=professional
    mode=subscription
    ↓
Validar produto
    ↓
Criar sessão no Stripe
    ↓
Redirecionar para URL do checkout
```

### 3. Checkout no Stripe

```
Usuário preenche dados:
    - Cartão de crédito
    - Email
    - Endereço de cobrança
    ↓
Stripe processa pagamento
    ↓
Se sucesso: redireciona para /payment/success?session_id=...
Se cancelamento: redireciona para /payment/cancel
```

### 4. Webhook do Stripe

```
Stripe envia evento para /webhook/stripe
    ↓
Verificar assinatura do webhook
    ↓
Processar evento:
    - checkout.session.completed
    - payment_intent.succeeded
    - customer.subscription.created
    ↓
Ativar plano do usuário (TODO)
    ↓
Retornar 200 OK
```

### 5. Página de Sucesso

```
GET /payment/success?session_id=cs_test_...
    ↓
Recuperar informações da sessão
    ↓
Renderizar payment_success.html
    ↓
Exibir detalhes do pagamento
    ↓
Usuário clica em "Ir para Dashboard"
```

## 🔐 Segurança

### Validação de Webhooks

**Por que validar?**
- Prevenir webhooks falsos
- Garantir que evento veio do Stripe
- Evitar ataques de replay

**Como funciona:**
1. Stripe envia header `Stripe-Signature`
2. Aplicação usa `STRIPE_WEBHOOK_SECRET`
3. `stripe.Webhook.construct_event()` valida assinatura
4. Se inválida: retorna 400
5. Se válida: processa evento

**Código:**
```python
try:
    event = stripe.Webhook.construct_event(
        payload=request.data,
        sig_header=request.headers['Stripe-Signature'],
        endpoint_secret=webhook_secret
    )
except stripe.error.SignatureVerificationError:
    return jsonify({'error': 'Invalid signature'}), 400
```

### Proteção de Chaves

**Chaves Sensíveis (NUNCA compartilhar):**
- `STRIPE_SECRET_KEY` (sk_test_... ou sk_live_...)
- `STRIPE_WEBHOOK_SECRET` (whsec_...)

**Chaves Públicas (pode compartilhar):**
- `STRIPE_PUBLISHABLE_KEY` (pk_test_... ou pk_live_...)

**Boas Práticas:**
1. Usar `.env` para armazenar chaves
2. Adicionar `.env` ao `.gitignore`
3. Nunca commitar chaves no Git
4. Usar Test Mode em desenvolvimento
5. Usar Live Mode apenas em produção
6. Rotacionar chaves regularmente

### Rate Limiting

**Rotas Protegidas:**
- `/create-checkout`: Limite padrão (50/hora)
- `/webhook/stripe`: Sem limite (vem do Stripe)

**Configuração:**
```python
# Flask-Limiter já configurado no app.py
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
```

## 🧪 Testes

### Testar Localmente

#### 1. Configurar Chaves de Teste

```bash
# Adicionar ao .env
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
STRIPE_WEBHOOK_SECRET=whsec_sua_chave_aqui
```

#### 2. Iniciar Aplicação

```bash
cd /home/ubuntu/behavior-kab-saas-web/sdk-python/flask-example
python3 app.py
```

#### 3. Acessar Página de Preços

```
http://localhost:5000/pricing
```

#### 4. Testar Checkout

1. Clicar em "Assinar Agora" em qualquer plano
2. Preencher dados de teste:
   - Cartão: `4242 4242 4242 4242`
   - CVC: `123`
   - Data: `12/25`
   - Email: `teste@exemplo.com`
3. Confirmar pagamento
4. Verificar redirecionamento para `/payment/success`

#### 5. Testar Webhooks Localmente

**Instalar Stripe CLI:**
```bash
# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
sudo mv stripe /usr/local/bin/
```

**Login:**
```bash
stripe login
```

**Encaminhar Webhooks:**
```bash
stripe listen --forward-to localhost:5000/webhook/stripe
```

**Saída:**
```
Ready! Your webhook signing secret is whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

Copiar `whsec_...` e adicionar ao `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

**Testar Evento:**
```bash
stripe trigger checkout.session.completed
```

Verificar logs da aplicação Flask.

### Cartões de Teste do Stripe

**Pagamento Bem-Sucedido:**
- Número: `4242 4242 4242 4242`
- CVC: Qualquer 3 dígitos
- Data: Qualquer data futura

**Pagamento Recusado:**
- Número: `4000 0000 0000 0002`

**Autenticação 3D Secure:**
- Número: `4000 0025 0000 3155`

**Mais cartões:** https://stripe.com/docs/testing

## 📊 Monitoramento

### Dashboard do Stripe

1. **Pagamentos:** https://dashboard.stripe.com/payments
2. **Assinaturas:** https://dashboard.stripe.com/subscriptions
3. **Clientes:** https://dashboard.stripe.com/customers
4. **Eventos:** https://dashboard.stripe.com/events
5. **Webhooks:** https://dashboard.stripe.com/webhooks

### Logs da Aplicação

A aplicação registra eventos do Stripe:

```
[STRIPE] Evento recebido: checkout.session.completed
[STRIPE] Checkout completado: cs_test_123456
[STRIPE] Pagamento bem-sucedido: pi_123456
[STRIPE] Assinatura criada: sub_123456
```

## 🚀 Deploy em Produção

### 1. Obter Chaves Live

1. Acesse Dashboard do Stripe
2. Desative "Test mode" (toggle no canto superior direito)
3. Vá em Developers → API keys
4. Copie chaves Live (sk_live_... e pk_live_...)

### 2. Configurar Webhook em Produção

1. Vá em Developers → Webhooks
2. Clique em "Add endpoint"
3. Configure:
   - **Endpoint URL:** `https://seu-dominio.com/webhook/stripe`
   - **Events:** Selecione eventos necessários
4. Copie o **Signing secret** (whsec_...)

### 3. Atualizar Variáveis de Ambiente

```bash
# Produção (.env)
STRIPE_SECRET_KEY=sk_live_sua_chave_live_aqui
STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_live_aqui
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret_aqui
```

### 4. Testar em Produção

1. Fazer checkout com cartão real
2. Verificar pagamento no Dashboard
3. Verificar webhook recebido
4. Verificar logs da aplicação

## 🐛 Troubleshooting

### Erro: "Stripe not configured"

**Causa:** Chaves não configuradas no `.env`

**Solução:**
1. Verificar se `.env` existe
2. Verificar variáveis:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. Reiniciar aplicação

### Erro: "Invalid API Key"

**Causa:** Chave inválida ou revogada

**Solução:**
1. Gerar novas chaves no Dashboard
2. Atualizar `.env`
3. Reiniciar aplicação

### Erro: "Webhook signature verification failed"

**Causa:** `STRIPE_WEBHOOK_SECRET` incorreto

**Solução:**
1. Verificar secret no Dashboard → Webhooks
2. Atualizar `.env`
3. Reiniciar aplicação

### Webhook não recebe eventos

**Causa:** Endpoint não configurado

**Solução:**
1. Verificar endpoint no Dashboard
2. URL: `https://seu-dominio.com/webhook/stripe`
3. Testar com "Send test webhook"
4. Verificar logs

## 📚 Próximos Passos

### Implementar Lógica de Negócio

**TODO no webhook handler:**

```python
# 1. Ativar plano do usuário
if event['type'] == 'checkout.session.completed':
    session_data = StripeWebhooks.handle_checkout_completed(event)
    
    # Buscar usuário por email
    user = User.get_by_email(session_data['customer_email'])
    
    # Ativar assinatura
    user.activate_subscription(
        plan='professional',
        stripe_session_id=session_data['session_id']
    )
    
    # Enviar email de confirmação
    send_confirmation_email(user.email)

# 2. Registrar pagamento
elif event['type'] == 'payment_intent.succeeded':
    payment_data = StripeWebhooks.handle_payment_succeeded(event)
    
    # Salvar no banco
    Payment.create(
        user_id=user.id,
        stripe_payment_id=payment_data['payment_intent_id'],
        amount=payment_data['amount'],
        currency=payment_data['currency'],
        status=payment_data['status']
    )

# 3. Atualizar assinatura
elif event['type'] == 'customer.subscription.updated':
    subscription = event['data']['object']
    
    # Atualizar status
    user.update_subscription_status(subscription['status'])
```

### Criar Tabelas no Banco

**Tabela de Assinaturas:**
```sql
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stripe_subscription_id TEXT NOT NULL,
    stripe_customer_id TEXT,
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Tabela de Pagamentos:**
```sql
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stripe_payment_id TEXT NOT NULL,
    stripe_session_id TEXT,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Implementar Dashboard de Transações

**Rota:** `/transactions`

**Funcionalidades:**
- Listar todos os pagamentos do usuário
- Filtrar por data, status, valor
- Exportar para CSV/PDF
- Ver detalhes de cada pagamento
- Baixar faturas (invoice)

### Implementar Gerenciamento de Assinatura

**Rota:** `/subscription`

**Funcionalidades:**
- Ver plano atual
- Ver próxima cobrança
- Fazer upgrade/downgrade
- Cancelar assinatura
- Histórico de cobranças
- Atualizar método de pagamento

### Implementar Notificações

**Eventos para Notificar:**
- Pagamento bem-sucedido (email)
- Pagamento falhou (email + SMS)
- Assinatura próxima do vencimento (email)
- Assinatura cancelada (email)
- Limite de uso atingido (email + in-app)

## 📞 Suporte

### Documentação Oficial

- **Stripe Docs:** https://stripe.com/docs
- **Stripe API:** https://stripe.com/docs/api
- **Webhooks:** https://stripe.com/docs/webhooks
- **Testing:** https://stripe.com/docs/testing
- **Checkout:** https://stripe.com/docs/payments/checkout

### Suporte Stripe

- **Support:** https://support.stripe.com
- **Community:** https://stripe.com/community
- **Status:** https://status.stripe.com

---

**Última atualização:** 27 de novembro de 2024

**Versão:** 1.0.0

**Status:** ✅ Produção
