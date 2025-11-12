# CredGuard ML Models

Este diretório contém os modelos de Machine Learning treinados para scoring de crédito e o serviço de predição.

## Arquivos

### Modelos Treinados (.pkl)

- **fa_8.pkl** - Modelo com 8 features (19 MB)
- **fa_11.pkl** - Modelo com 11 features (18 MB)
- **fa_12.pkl** - Modelo com 12 features (22 MB)
- **fa_15.pkl** - Modelo com 15 features (44 MB)
- **scaler_num.pkl** - Scaler para normalização de features numéricas
- **odds_threshold_bins.pkl** - Bins de threshold para classificação de risco

### Dados de Referência

- **resultados_limites.csv** - Limites e thresholds para classificação de scores

### Notebooks

- **empilhar_dados.ipynb** - Notebook de preparação de dados
- **refatoracao_behavior.ipynb** - Notebook de refatoração do modelo
- **refatoracao_behavior-fa_12.ipynb** - Notebook específico do modelo FA-12

## Serviço de Predição

### ml_service.py

Serviço Python que carrega os modelos e gera predições de score de crédito.

**Instalação de Dependências:**

```bash
pip install -r requirements.txt
```

**Uso via CLI:**

```bash
# Predição única
python ml_service.py '{
  "cpf": "123.456.789-00",
  "nome": "João da Silva",
  "produto": "CARTAO",
  "data_primeira_compra": "2023-01-15",
  "data_ultima_compra": "2024-10-20",
  "total_compras": 15,
  "valor_total_compras": 5420.50,
  "total_pagamentos_em_dia": 12,
  "total_atrasos": 3,
  "maior_atraso": 45
}'

# Predição em lote
python ml_service.py '[
  {"cpf": "123", "nome": "João", ...},
  {"cpf": "456", "nome": "Maria", ...}
]'
```

**Uso Programático:**

```python
from ml_service import MLService

# Inicializar serviço
service = MLService()

# Fazer predição
customer_data = {
    "cpf": "123.456.789-00",
    "nome": "João da Silva",
    "produto": "CARTAO",
    "data_primeira_compra": "2023-01-15",
    "data_ultima_compra": "2024-10-20",
    "total_compras": 15,
    "valor_total_compras": 5420.50,
    "total_pagamentos_em_dia": 12,
    "total_atrasos": 3,
    "maior_atraso": 45
}

result = service.predict(customer_data)
print(result)
# {
#   "score_prob_inadimplencia": 0.35,
#   "faixa_score": "MÉDIO",
#   "modelo_utilizado": "fa_12",
#   "features_extraidas": {...}
# }
```

## Seleção de Modelos por Produto

O serviço seleciona automaticamente o modelo adequado baseado no tipo de produto:

| Produto | Modelo | Features |
|---------|--------|----------|
| CARTÃO | fa_12 | 12 features |
| CARNÊ | fa_11 | 11 features |
| EMPRÉSTIMO PESSOAL | fa_15 | 15 features |

## Features Extraídas

O serviço extrai as seguintes features do histórico do cliente:

- **meses_relacionamento** - Tempo entre primeira e última compra
- **recencia_dias** - Dias desde a última compra
- **total_compras** - Quantidade de compras realizadas
- **valor_total** - Valor total gasto
- **ticket_medio** - Valor médio por compra
- **taxa_adimplencia** - Percentual de pagamentos em dia
- **maior_atraso** - Maior atraso em dias
- **frequencia_compras** - Compras por mês
- **total_pagamentos_em_dia** - Quantidade de pagamentos no prazo
- **total_atrasos** - Quantidade de pagamentos em atraso

## Classificação de Risco

Os scores são classificados em quatro faixas:

| Faixa | Probabilidade de Inadimplência |
|-------|-------------------------------|
| BAIXO | 0% - 25% |
| MÉDIO | 25% - 50% |
| ALTO | 50% - 75% |
| CRÍTICO | 75% - 100% |

## Integração com Backend

O backend Node.js chama o serviço Python via `child_process`:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function predictScore(customerData: any) {
  const input = JSON.stringify(customerData);
  const command = `python3 ml_models/ml_service.py '${input}'`;
  
  const { stdout } = await execAsync(command);
  return JSON.parse(stdout);
}
```

## Notas Importantes

- **Modelos Proprietários**: Os arquivos .pkl contêm modelos treinados com dados reais e são proprietários da CredGuard
- **Não Compartilhar**: Não compartilhe os modelos publicamente ou com terceiros
- **Versionamento**: Modelos devem ser versionados e atualizados periodicamente com novos dados
- **Performance**: Modelos são carregados uma vez na inicialização para melhor performance
- **Fallback**: Em caso de erro, o serviço retorna score neutro (0.5) para evitar falhas no processamento

---

**Última Atualização**: Novembro 2025
