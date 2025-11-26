# CredGuard Python SDK

SDK oficial para integração com **CredGuard API** - Plataforma de Credit Scoring com Machine Learning.

[![PyPI version](https://badge.fury.io/py/credguard-sdk.svg)](https://badge.fury.io/py/credguard-sdk)
[![Python Versions](https://img.shields.io/pypi/pyversions/credguard-sdk.svg)](https://pypi.org/project/credguard-sdk/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Instalação

```bash
pip install credguard-sdk
```

## 📋 Requisitos

- Python 3.8+
- Token de autenticação JWT (obtenha em https://credguard.manus.space)

## 🔧 Início Rápido

### 1. Obter Token de Autenticação

Acesse https://credguard.manus.space e faça login. Seu token JWT será gerado automaticamente.

### 2. Inicializar Cliente

```python
from credguard import CredGuardClient

client = CredGuardClient(
    api_key="seu_token_jwt_aqui",
    base_url="https://credguard.manus.space"  # Opcional, padrão é produção
)
```

### 3. Upload de Arquivo CSV

```python
# Upload simples (retorna imediatamente)
job = client.batch.upload(
    file_path="clientes.csv",
    product="CARTAO"  # CARTAO, CARNE ou EMPRESTIMO
)
print(f"Job ID: {job.job_id}")
print(f"Status: {job.status}")

# Upload com espera automática (aguarda conclusão)
job = client.batch.upload(
    file_path="clientes.csv",
    product="CARTAO",
    wait_for_completion=True,  # Aguarda processamento
    poll_interval=5  # Consulta status a cada 5 segundos
)
print(f"Processados: {job.processed_rows} de {job.total_rows}")
```

### 4. Consultar Status de Job

```python
job = client.batch.get_status(job_id="abc123")

if job.is_complete:
    print(f"✅ Job concluído! {job.processed_rows} clientes processados")
elif job.is_failed:
    print(f"❌ Job falhou: {job.error_message}")
elif job.is_processing:
    print(f"⏳ Processando... {job.processed_rows}/{job.total_rows}")
```

### 5. Download de Resultados (CSV)

```python
# Baixar resultados após conclusão
output_path = client.batch.download_results(
    job_id="abc123",
    output_path="resultados_scores.csv"
)
print(f"Resultados salvos em: {output_path}")
```

## 📚 Exemplos Completos

### Exemplo 1: Fluxo Completo com Polling

```python
from credguard import CredGuardClient
import time

# Inicializar cliente
client = CredGuardClient(api_key="seu_token_jwt")

# Upload de arquivo
print("📤 Enviando arquivo...")
job = client.batch.upload("clientes.csv", product="CARTAO")
print(f"✅ Job criado: {job.job_id}")

# Aguardar conclusão (polling manual)
while job.is_processing:
    time.sleep(5)
    job = client.batch.get_status(job.job_id)
    print(f"⏳ Processando... {job.processed_rows}/{job.total_rows}")

# Verificar resultado
if job.is_complete:
    print(f"✅ Concluído! {job.processed_rows} clientes processados")
    
    # Baixar resultados
    client.batch.download_results(job.job_id, "resultados.csv")
    print("📥 Resultados baixados em resultados.csv")
else:
    print(f"❌ Erro: {job.error_message}")
```

### Exemplo 2: Upload com Espera Automática

```python
from credguard import CredGuardClient

client = CredGuardClient(api_key="seu_token_jwt")

# Upload com espera automática (mais simples)
job = client.batch.upload(
    file_path="clientes.csv",
    product="CARTAO",
    wait_for_completion=True  # Aguarda automaticamente
)

print(f"✅ Job concluído!")
print(f"Total processado: {job.processed_rows}")
print(f"Excluídos: {job.excluded_rows}")

# Baixar resultados
client.batch.download_results(job.job_id, "resultados.csv")
```

### Exemplo 3: Listar Modelos ML

```python
from credguard import CredGuardClient

client = CredGuardClient(api_key="seu_token_jwt")

# Listar modelos disponíveis para CARTAO
models = client.models.list(product="CARTAO")

for model in models:
    print(f"Modelo: {model.version}")
    print(f"  Accuracy: {model.accuracy:.2%}")
    print(f"  Precision: {model.precision:.2%}")
    print(f"  Produção: {'Sim' if model.is_production else 'Não'}")
```

### Exemplo 4: Detectar Drift

```python
from credguard import CredGuardClient

client = CredGuardClient(api_key="seu_token_jwt")

# Detectar drift em modelo
drift = client.drift.detect(model_id=1, job_id="abc123")

print(f"Drift detectado: {drift.drift_detected}")
print(f"PSI: {drift.psi:.4f}")
print(f"Status: {drift.status}")

if drift.is_critical:
    print("⚠️ CRÍTICO: Retreinamento urgente recomendado!")
elif drift.needs_attention:
    print("⚠️ ATENÇÃO: Monitorar modelo de perto")
```

### Exemplo 5: Consultar Bureau

```python
from credguard import CredGuardClient

client = CredGuardClient(api_key="seu_token_jwt")

# Verificar configuração do bureau
config = client.bureau.get_config()
print(f"Bureau ativo: {config['isActive']}")

# Consultar métricas de uso
metrics = client.bureau.get_metrics()
print(f"Total de consultas: {metrics['totalQueries']}")
print(f"Cache hit rate: {metrics['cacheHitRate']:.1%}")
print(f"Custo mensal: R$ {metrics['monthlyCost']:.2f}")
```

## 🔒 Tratamento de Erros

```python
from credguard import (
    CredGuardClient,
    AuthenticationError,
    RateLimitError,
    CredGuardAPIError
)

client = CredGuardClient(api_key="seu_token_jwt")

try:
    job = client.batch.upload("clientes.csv", product="CARTAO")
except AuthenticationError:
    print("❌ Token inválido ou expirado")
except RateLimitError:
    print("⚠️ Rate limit excedido. Aguarde 60 segundos.")
except CredGuardAPIError as e:
    print(f"❌ Erro na API: {e}")
```

## 📊 Formato do CSV de Entrada

O arquivo CSV deve conter as seguintes colunas:

```csv
cpf,renda_mensal,idade,tempo_emprego_meses,possui_imovel,possui_veiculo,numero_dependentes,estado_civil,escolaridade,tipo_residencia,tempo_residencia_meses,numero_contas_bancarias,limite_credito_total,divida_total,numero_consultas_credito,historico_inadimplencia,valor_ultima_compra,data_ultima_compra,categoria_ultima_compra,numero_parcelas_abertas,valor_parcelas_abertas,score_credito_bureau,numero_protestos,numero_cheques_devolvidos,participacao_sociedade,tempo_relacionamento_banco_meses,saldo_medio_conta,movimentacao_financeira_mensal,numero_emprestimos_ativos,valor_emprestimos_ativos,atraso_maximo_dias,numero_refinanciamentos,possui_cartao_credito,limite_cartao_credito,fatura_media_cartao,percentual_limite_utilizado,numero_transacoes_debito,valor_medio_transacao_debito,numero_compras_parceladas,valor_medio_compra_parcelada,utiliza_cheque_especial,limite_cheque_especial,frequencia_uso_cheque_especial,possui_previdencia_privada,possui_seguro_vida,numero_dependentes_financeiros,renda_conjuge,possui_conta_poupanca,saldo_poupanca,numero_investimentos,valor_total_investimentos,possui_consorcio,valor_consorcio,numero_carros,valor_estimado_imovel,possui_divida_ativa,valor_divida_ativa,tipo_ocupacao,setor_trabalho,porte_empresa,tempo_conta_corrente_meses,agencia_bancaria,tipo_conta,possui_credito_rural,valor_credito_rural,possui_credito_imobiliario,valor_credito_imobiliario,numero_seguros_ativos,valor_seguros_ativos,score_comportamental,indice_relacionamento_banco,capacidade_pagamento,comprometimento_renda,patrimonio_liquido_estimado,variacao_renda_12meses,estabilidade_emprego,historico_pagamento_pontual,diversificacao_credito,utilizacao_produtos_bancarios,engagement_digital,frequencia_uso_app,numero_reclamacoes,nivel_satisfacao_cliente,potencial_crescimento,risco_fraude,score_socioeconomico,indice_liquidez,taxa_poupanca,propensao_investimento,perfil_consumidor,sazonalidade_gastos,tendencia_endividamento,capacidade_poupanca_mensal,margem_consignavel,elegibilidade_credito_consignado,score_credito_alternativo,numero_referencias_comerciais,tempo_residencia_cidade_meses,numero_mudancas_endereco,possui_telefone_fixo,numero_telefones_cadastrados,email_confirmado,redes_sociais_verificadas,score_reputacao_online,numero_avaliacoes_positivas,numero_avaliacoes_negativas,ativo
```

## 📦 Estrutura do Pacote

```
credguard/
├── __init__.py          # Exports principais
├── client.py            # Cliente principal e recursos
├── models.py            # Modelos de dados (BatchJob, ModelInfo, etc.)
└── exceptions.py        # Exceções customizadas
```

## 🔗 Links Úteis

- **Documentação da API**: https://credguard.manus.space/api/docs
- **GitHub**: https://github.com/giselleCouto/CredGuard
- **Suporte**: support@credguard.com

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request no GitHub.

## 📞 Suporte

- Email: support@credguard.com
- GitHub Issues: https://github.com/giselleCouto/CredGuard/issues
- Documentação: https://credguard.manus.space/api/docs
