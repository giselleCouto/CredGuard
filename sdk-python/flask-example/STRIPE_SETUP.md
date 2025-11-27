# 🔐 Configuração do Stripe

## Visão Geral

Este guia explica como configurar o Stripe para aceitar pagamentos e assinaturas na aplicação CredGuard Flask.

## 📋 Pré-requisitos

1. Conta no Stripe (criar em https://stripe.com)
2. Chaves de API do Stripe (Test Mode para desenvolvimento)
3. Webhook configurado no dashboard do Stripe

## 🔑 Obter Chaves do Stripe

### 1. Criar Conta no Stripe

1. Acesse https://stripe.com
2. Clique em "Sign up"
3. Preencha os dados e confirme email
4. Complete o cadastro da empresa

### 2. Obter Chaves de API

1. Acesse o Dashboard do Stripe: https://dashboard.stripe.com
2. Clique em "Developers" no menu superior
3. Clique em "API keys" no menu lateral
4. Você verá duas chaves:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

⚠️ **IMPORTANTE:** Use as chaves de **Test mode** durante o desenvolvimento!

### 3. Obter Secret do Webhook

1. No Dashboard do Stripe, vá em "Developers" → "Webhooks"
2. Clique em "Add endpoint"
3. Configure:
   - **Endpoint URL:** `https://seu-dominio.com/webhook/stripe`
   - **Events to send:** Selecione os eventos desejados:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
4. Clique em "Add endpoint"
5. Copie o **Signing secret** (whsec_...)

## ⚙️ Configurar Variáveis de Ambiente

### Adicionar ao arquivo .env

Crie ou edite o arquivo `.env` na raiz do projeto Flask:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publicavel_aqui
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret_aqui
```

### Exemplo Completo do .env

```bash
# CredGuard API Configuration
CREDGUARD_API_KEY=seu_token_jwt_aqui
CREDGUARD_BASE_URL=https://credguard.manus.space

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=sua_chave_secreta_aqui
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51234567890abcdefghijklmnopqrstuvwxyz
STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefghijklmnopqrstuvwxyz
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz

# Redis Configuration (opcional)
REDIS_URL=redis://localhost:6379
```

## 🧪 Testar Configuração

### 1. Testar Módulo Stripe

```bash
cd /home/ubuntu/behavior-kab-saas-web/sdk-python/flask-example
python3 stripe_config.py
```

**Saída Esperada:**
```
🔐 Configuração do Stripe
==================================================
Configurado: True
Chave publicável: pk_test_51234567890...

📦 Produtos Disponíveis
==================================================

Plano Básico (basic)
Preço: R$ 49,00
Descrição: Análise de até 1.000 CPFs por mês
Recursos:
  ✓ 1.000 análises de CPF/mês
  ✓ Validação com dígitos verificadores
  ✓ Dashboard de estatísticas
  ✓ Suporte por email

... (mais produtos)
```

### 2. Verificar Chaves no Flask

```python
from stripe_config import StripeConfig

config = StripeConfig()

if config.is_configured():
    print('✅ Stripe configurado corretamente')
else:
    print('❌ Stripe não configurado')
```

## 🛒 Produtos Disponíveis

A aplicação oferece 3 planos de assinatura:

### 1. Plano Básico (R$ 49,00/mês)
- 1.000 análises de CPF/mês
- Validação com dígitos verificadores
- Dashboard de estatísticas
- Suporte por email

### 2. Plano Profissional (R$ 149,00/mês)
- 10.000 análises de CPF/mês
- Validação com dígitos verificadores
- Dashboard avançado
- API de estatísticas
- Suporte prioritário
- Webhooks personalizados

### 3. Plano Enterprise (R$ 499,00/mês)
- Análises ilimitadas
- Validação com dígitos verificadores
- Dashboard personalizado
- API completa
- Suporte 24/7
- Webhooks personalizados
- Integração dedicada
- SLA garantido

## 🔄 Configurar Webhook Local (Desenvolvimento)

Para testar webhooks localmente, use o Stripe CLI:

### 1. Instalar Stripe CLI

**Linux/macOS:**
```bash
# Baixar e instalar
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
sudo mv stripe /usr/local/bin/
```

**Verificar instalação:**
```bash
stripe --version
```

### 2. Login no Stripe CLI

```bash
stripe login
```

Isso abrirá o navegador para autorizar o CLI.

### 3. Encaminhar Webhooks para Localhost

```bash
stripe listen --forward-to localhost:5000/webhook/stripe
```

**Saída:**
```
Ready! Your webhook signing secret is whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

Copie o **webhook signing secret** e adicione ao `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

### 4. Testar Webhook

Em outro terminal:
```bash
stripe trigger checkout.session.completed
```

Você verá o evento sendo processado no terminal do `stripe listen`.

## 🌐 Configurar Webhook em Produção

### 1. Deploy da Aplicação

Primeiro, faça deploy da aplicação Flask em um servidor com domínio público.

### 2. Adicionar Endpoint no Stripe

1. Acesse Dashboard do Stripe → Developers → Webhooks
2. Clique em "Add endpoint"
3. Configure:
   - **Endpoint URL:** `https://seu-dominio.com/webhook/stripe`
   - **Events to send:** Selecione os eventos:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
4. Clique em "Add endpoint"
5. Copie o **Signing secret**
6. Atualize `.env` em produção com o novo secret

### 3. Testar Webhook em Produção

1. No Dashboard do Stripe, vá em Developers → Webhooks
2. Clique no endpoint criado
3. Clique em "Send test webhook"
4. Selecione um evento (ex: `checkout.session.completed`)
5. Clique em "Send test webhook"
6. Verifique os logs da aplicação para confirmar recebimento

## 🔒 Segurança

### Boas Práticas

1. **Nunca commitar chaves no Git:**
   ```bash
   # Adicionar ao .gitignore
   echo ".env" >> .gitignore
   ```

2. **Usar Test Mode em desenvolvimento:**
   - Chaves começam com `sk_test_` e `pk_test_`
   - Não processam pagamentos reais

3. **Usar Live Mode apenas em produção:**
   - Chaves começam com `sk_live_` e `pk_live_`
   - Processam pagamentos reais

4. **Validar webhooks:**
   - Sempre verificar assinatura do webhook
   - Usar `STRIPE_WEBHOOK_SECRET` para validação

5. **Rotacionar chaves regularmente:**
   - Criar novas chaves no Dashboard
   - Atualizar `.env` em produção
   - Revogar chaves antigas

### Variáveis de Ambiente Sensíveis

⚠️ **NUNCA** compartilhe estas variáveis:
- `STRIPE_SECRET_KEY` (sk_test_... ou sk_live_...)
- `STRIPE_WEBHOOK_SECRET` (whsec_...)

✅ **Pode compartilhar:**
- `STRIPE_PUBLISHABLE_KEY` (pk_test_... ou pk_live_...)

## 🧪 Testar Pagamentos

### Cartões de Teste do Stripe

Use estes cartões para testar em Test Mode:

**Pagamento Bem-Sucedido:**
- Número: `4242 4242 4242 4242`
- CVC: Qualquer 3 dígitos
- Data: Qualquer data futura

**Pagamento Recusado:**
- Número: `4000 0000 0000 0002`
- CVC: Qualquer 3 dígitos
- Data: Qualquer data futura

**Autenticação 3D Secure:**
- Número: `4000 0025 0000 3155`
- CVC: Qualquer 3 dígitos
- Data: Qualquer data futura

Mais cartões de teste: https://stripe.com/docs/testing

### Fluxo de Teste Completo

1. **Iniciar aplicação:**
   ```bash
   python3 app.py
   ```

2. **Acessar página de preços:**
   ```
   http://localhost:5000/pricing
   ```

3. **Selecionar plano e clicar em "Assinar"**

4. **Preencher dados de pagamento:**
   - Cartão: `4242 4242 4242 4242`
   - CVC: `123`
   - Data: `12/25`
   - Email: `teste@exemplo.com`

5. **Confirmar pagamento**

6. **Verificar redirecionamento para página de sucesso**

7. **Verificar webhook recebido:**
   - Checar logs da aplicação
   - Verificar Dashboard do Stripe → Events

## 📊 Monitorar Transações

### Dashboard do Stripe

1. Acesse https://dashboard.stripe.com
2. Veja transações em "Payments"
3. Veja assinaturas em "Subscriptions"
4. Veja clientes em "Customers"
5. Veja eventos em "Developers" → "Events"

### Logs da Aplicação

A aplicação registra eventos do Stripe:
```
[STRIPE] Checkout completado: cs_test_123456
[STRIPE] Pagamento bem-sucedido: pi_123456
[STRIPE] Assinatura criada: sub_123456
```

## 🐛 Troubleshooting

### Erro: "Stripe not configured"

**Causa:** Chaves do Stripe não configuradas no `.env`

**Solução:**
1. Verificar se `.env` existe
2. Verificar se variáveis estão corretas:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. Reiniciar aplicação

### Erro: "Invalid API Key"

**Causa:** Chave de API inválida ou revogada

**Solução:**
1. Gerar novas chaves no Dashboard do Stripe
2. Atualizar `.env`
3. Reiniciar aplicação

### Erro: "Webhook signature verification failed"

**Causa:** `STRIPE_WEBHOOK_SECRET` incorreto

**Solução:**
1. Verificar secret no Dashboard do Stripe → Webhooks
2. Atualizar `.env`
3. Reiniciar aplicação

### Webhook não recebe eventos

**Causa:** Endpoint não configurado ou URL incorreta

**Solução:**
1. Verificar endpoint no Dashboard do Stripe
2. Verificar URL: `https://seu-dominio.com/webhook/stripe`
3. Testar com "Send test webhook"
4. Verificar logs da aplicação

### Pagamento não processa

**Causa:** Usando Live Mode sem configurar

**Solução:**
1. Usar Test Mode durante desenvolvimento
2. Usar cartões de teste do Stripe
3. Verificar logs para erros específicos

## 📚 Recursos Adicionais

### Documentação Oficial

- **Stripe Docs:** https://stripe.com/docs
- **Stripe API:** https://stripe.com/docs/api
- **Webhooks:** https://stripe.com/docs/webhooks
- **Testing:** https://stripe.com/docs/testing
- **Checkout:** https://stripe.com/docs/payments/checkout

### Tutoriais

- **Accept a payment:** https://stripe.com/docs/payments/accept-a-payment
- **Subscriptions:** https://stripe.com/docs/billing/subscriptions/overview
- **Webhooks Guide:** https://stripe.com/docs/webhooks/quickstart

### Suporte

- **Stripe Support:** https://support.stripe.com
- **Community:** https://stripe.com/community
- **Status:** https://status.stripe.com

## 🎯 Próximos Passos

Após configurar o Stripe:

1. ✅ Testar checkout com cartões de teste
2. ✅ Verificar webhooks funcionando
3. ✅ Implementar lógica de negócio (ativar plano, etc.)
4. ✅ Testar fluxo completo end-to-end
5. ✅ Configurar webhook em produção
6. ✅ Migrar para Live Mode em produção
7. ✅ Monitorar transações no Dashboard

---

**Última atualização:** 27 de novembro de 2024

**Versão:** 1.0.0

**Status:** ✅ Produção
