# 📄 Formato do CSV - CredGuard

Documentação completa sobre o formato do arquivo CSV para análise de crédito.

## 📋 Visão Geral

O arquivo CSV deve conter dados de clientes para análise de risco de crédito. Cada linha representa um cliente, e as colunas contêm informações necessárias para o modelo de scoring.

## 🔤 Colunas Obrigatórias

### 1. `cpf`
- **Tipo:** String (11 dígitos)
- **Formato:** Apenas números, sem pontos ou hífens
- **Exemplo:** `12345678901`
- **Validação:** Deve ter exatamente 11 dígitos
- **Descrição:** Número do CPF do cliente

### 2. `nome`
- **Tipo:** String
- **Formato:** Texto livre
- **Exemplo:** `João Silva`
- **Validação:** Não pode estar vazio
- **Descrição:** Nome completo do cliente

### 3. `renda_mensal`
- **Tipo:** Decimal
- **Formato:** Número com até 2 casas decimais
- **Exemplo:** `5000.00`
- **Validação:** Deve ser maior que 0
- **Descrição:** Renda mensal do cliente em reais (R$)

### 4. `idade`
- **Tipo:** Inteiro
- **Formato:** Número inteiro
- **Exemplo:** `35`
- **Validação:** Deve estar entre 18 e 100
- **Descrição:** Idade do cliente em anos

### 5. `score_bureau`
- **Tipo:** Inteiro
- **Formato:** Número inteiro
- **Exemplo:** `720`
- **Validação:** Deve estar entre 300 e 850
- **Descrição:** Score de crédito do bureau (ex: Serasa, SPC)

### 6. `historico_pagamentos`
- **Tipo:** String (enum)
- **Formato:** Valores permitidos: `excelente`, `bom`, `regular`, `ruim`
- **Exemplo:** `bom`
- **Validação:** Deve ser um dos valores permitidos
- **Descrição:** Histórico de pagamentos do cliente

### 7. `divida_total`
- **Tipo:** Decimal
- **Formato:** Número com até 2 casas decimais
- **Exemplo:** `15000.00`
- **Validação:** Deve ser maior ou igual a 0
- **Descrição:** Dívida total do cliente em reais (R$)

### 8. `tempo_emprego_meses`
- **Tipo:** Inteiro
- **Formato:** Número inteiro
- **Exemplo:** `48`
- **Validação:** Deve ser maior ou igual a 0
- **Descrição:** Tempo de emprego atual em meses

## 📝 Exemplo de Arquivo CSV

```csv
cpf,nome,renda_mensal,idade,score_bureau,historico_pagamentos,divida_total,tempo_emprego_meses
12345678901,João Silva,5000.00,35,720,bom,15000.00,48
98765432109,Maria Santos,3500.00,28,650,regular,8000.00,24
11122233344,Pedro Oliveira,8000.00,42,780,excelente,5000.00,120
```

## ✅ Validações

### Validações de Formato

1. **Header obrigatório:** Primeira linha deve conter os nomes das colunas
2. **Separador:** Vírgula (`,`)
3. **Codificação:** UTF-8
4. **Quebra de linha:** LF (`\n`) ou CRLF (`\r\n`)
5. **Aspas:** Opcional para campos de texto

### Validações de Dados

1. **CPF:**
   - Exatamente 11 dígitos
   - Apenas números
   - Não pode ser sequência (ex: 11111111111)

2. **Renda Mensal:**
   - Maior que 0
   - Máximo 2 casas decimais
   - Formato: `1234.56`

3. **Idade:**
   - Entre 18 e 100 anos
   - Número inteiro

4. **Score Bureau:**
   - Entre 300 e 850
   - Número inteiro

5. **Histórico de Pagamentos:**
   - Valores permitidos: `excelente`, `bom`, `regular`, `ruim`
   - Case-insensitive (aceita maiúsculas/minúsculas)

6. **Dívida Total:**
   - Maior ou igual a 0
   - Máximo 2 casas decimais

7. **Tempo de Emprego:**
   - Maior ou igual a 0 meses
   - Número inteiro

## 🎯 Perfis de Exemplo

### Perfil Baixo Risco
```csv
cpf,nome,renda_mensal,idade,score_bureau,historico_pagamentos,divida_total,tempo_emprego_meses
77788899900,Roberto Alves,9500.00,45,810,excelente,3000.00,180
```
- Alta renda (R$ 9.500)
- Score alto (810)
- Histórico excelente
- Baixa dívida (R$ 3.000)
- Emprego estável (15 anos)

### Perfil Médio Risco
```csv
cpf,nome,renda_mensal,idade,score_bureau,historico_pagamentos,divida_total,tempo_emprego_meses
12345678901,João Silva,5000.00,35,720,bom,15000.00,48
```
- Renda média (R$ 5.000)
- Score médio-alto (720)
- Histórico bom
- Dívida moderada (R$ 15.000)
- Emprego estável (4 anos)

### Perfil Alto Risco
```csv
cpf,nome,renda_mensal,idade,score_bureau,historico_pagamentos,divida_total,tempo_emprego_meses
55566677788,Ana Costa,2500.00,23,580,ruim,12000.00,12
```
- Baixa renda (R$ 2.500)
- Score baixo (580)
- Histórico ruim
- Alta dívida (R$ 12.000)
- Emprego recente (1 ano)

## 🔢 Faixas de Valores Recomendadas

### Score Bureau
- **300-579:** Muito ruim
- **580-669:** Ruim
- **670-739:** Regular
- **740-799:** Bom
- **800-850:** Excelente

### Renda Mensal
- **< R$ 2.000:** Baixa
- **R$ 2.000 - R$ 5.000:** Média
- **R$ 5.000 - R$ 10.000:** Alta
- **> R$ 10.000:** Muito alta

### Relação Dívida/Renda
- **< 30%:** Saudável
- **30% - 50%:** Moderada
- **50% - 80%:** Alta
- **> 80%:** Crítica

### Tempo de Emprego
- **< 6 meses:** Muito recente
- **6 - 12 meses:** Recente
- **12 - 36 meses:** Estável
- **> 36 meses:** Muito estável

## 🚨 Erros Comuns

### 1. CPF Inválido
```csv
❌ 123.456.789-01  (com formatação)
❌ 1234567890      (10 dígitos)
❌ 11111111111     (sequência)
✅ 12345678901     (11 dígitos, sem formatação)
```

### 2. Renda com Formato Incorreto
```csv
❌ R$ 5.000,00     (com símbolo e vírgula)
❌ 5000            (sem casas decimais)
❌ 5.000,00        (vírgula decimal)
✅ 5000.00         (ponto decimal)
```

### 3. Histórico de Pagamentos Inválido
```csv
❌ ótimo           (valor não permitido)
❌ Bom             (case-sensitive em algumas APIs)
❌ 5               (número em vez de texto)
✅ bom             (valor permitido)
✅ excelente       (valor permitido)
```

### 4. Score Fora da Faixa
```csv
❌ 250             (abaixo de 300)
❌ 900             (acima de 850)
❌ 720.5           (decimal não permitido)
✅ 720             (dentro da faixa)
```

## 📊 Tamanho do Arquivo

### Limites
- **Tamanho máximo:** 16 MB
- **Número de linhas:** Recomendado até 10.000 clientes por arquivo
- **Processamento:** Arquivos grandes são processados em lote

### Recomendações
- Para mais de 10.000 clientes, dividir em múltiplos arquivos
- Comprimir arquivos grandes (ZIP) antes do upload
- Usar encoding UTF-8 para evitar problemas com caracteres especiais

## 🛠️ Ferramentas para Criar CSV

### Excel
1. Preencher dados nas colunas
2. Salvar como → CSV (separado por vírgulas)
3. Verificar encoding UTF-8

### Google Sheets
1. Preencher dados nas colunas
2. Arquivo → Fazer download → Valores separados por vírgula (.csv)

### Python (Programático)
```python
import csv

clientes = [
    {
        'cpf': '12345678901',
        'nome': 'João Silva',
        'renda_mensal': 5000.00,
        'idade': 35,
        'score_bureau': 720,
        'historico_pagamentos': 'bom',
        'divida_total': 15000.00,
        'tempo_emprego_meses': 48
    }
]

with open('clientes.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=clientes[0].keys())
    writer.writeheader()
    writer.writerows(clientes)
```

## ✅ Checklist de Validação

Antes de fazer upload, verifique:

- [ ] Arquivo tem extensão `.csv`
- [ ] Primeira linha contém header com nomes das colunas
- [ ] Separador é vírgula (`,`)
- [ ] Encoding é UTF-8
- [ ] CPFs têm 11 dígitos (sem formatação)
- [ ] Rendas e dívidas usam ponto (`.`) como decimal
- [ ] Idades entre 18 e 100
- [ ] Scores entre 300 e 850
- [ ] Histórico de pagamentos usa valores permitidos
- [ ] Tempo de emprego é número inteiro positivo
- [ ] Arquivo tem menos de 16 MB
- [ ] Não há linhas vazias no meio do arquivo

## 📚 Referências

- [RFC 4180 - CSV Format](https://tools.ietf.org/html/rfc4180)
- [Python CSV Module](https://docs.python.org/3/library/csv.html)
- [Pandas read_csv](https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html)

---

**Arquivo CSV de exemplo disponível: `clientes_exemplo.csv` ✅**
