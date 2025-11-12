# Guia de Upload em Lote - CredGuard

## Visão Geral

A funcionalidade de **Upload em Lote** permite que empresas enviem o histórico completo de seus clientes para análise de crédito automatizada. O sistema processa os dados, aplica regras de negócio e gera scores de inadimplência por produto.

## Acesso

Navegue para `/batch-upload` ou clique em **"Upload em Lote"** no Dashboard.

## Formato do Arquivo

### Colunas Obrigatórias

O arquivo CSV ou Excel deve conter as seguintes colunas:

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `cpf` | String | CPF do cliente (com ou sem formatação) | `123.456.789-01` |
| `nome` | String | Nome completo do cliente | `João Silva` |
| `produto` | Enum | Tipo de crédito: `CARTAO`, `CARNE` ou `EMPRESTIMO_PESSOAL` | `CARTAO` |
| `historico_meses` | Número | Meses de histórico do cliente | `12` |
| `ultimo_movimento_dias` | Número | Dias desde o último movimento | `30` |
| `valor_total_compras` | Número | Valor total de compras (R$) | `5000.00` |
| `numero_transacoes` | Número | Quantidade de transações realizadas | `25` |
| `ticket_medio` | Número | Valor médio por transação (R$) | `200.00` |
| `inadimplente` | Número | Histórico de inadimplência (0=Não, 1=Sim) | `0` |

### Exemplo de CSV

```csv
cpf,nome,produto,historico_meses,ultimo_movimento_dias,valor_total_compras,numero_transacoes,ticket_medio,inadimplente
123.456.789-01,João Silva,CARTAO,12,30,5000.00,25,200.00,0
234.567.890-12,Maria Santos,EMPRESTIMO_PESSOAL,6,45,3000.00,10,300.00,0
345.678.901-23,Pedro Oliveira,CARNE,2,15,1500.00,5,300.00,0
```

Um arquivo de exemplo está disponível em `exemplo_upload.csv` na raiz do projeto.

## Regras de Negócio

O sistema aplica automaticamente as seguintes regras durante o processamento:

### 1. Filtro de Histórico Mínimo
- **Regra**: Clientes com menos de 3 meses de histórico são excluídos
- **Motivo**: `menos_3_meses`
- **Ação**: Registro marcado como excluído no CSV de saída

### 2. Filtro de Inatividade
- **Regra**: Clientes inativos há mais de 8 meses (240 dias) são excluídos
- **Motivo**: `inativo_8_meses`
- **Ação**: Registro marcado como excluído no CSV de saída

### 3. Geração de Score

Para clientes que passam nos filtros, o sistema calcula:

- **Score de Probabilidade de Inadimplência**: Valor entre 0.0000 e 1.0000
- **Faixa de Score**: Classificação de A a E
  - **A**: 0.0 - 0.2 (Risco Baixo)
  - **B**: 0.2 - 0.4 (Risco Baixo-Médio)
  - **C**: 0.4 - 0.6 (Risco Médio)
  - **D**: 0.6 - 0.8 (Risco Médio-Alto)
  - **E**: 0.8 - 1.0 (Risco Alto)

### Fatores Considerados

O modelo considera:
- Histórico de inadimplência anterior
- Ticket médio das transações
- Número de transações realizadas
- Tipo de produto (CARTAO tem menor risco, CARNE tem maior risco)

## Fluxo de Uso

### 1. Upload do Arquivo

1. Acesse a página de **Upload em Lote**
2. Arraste e solte o arquivo CSV/Excel ou clique para selecionar
3. Aguarde o preview dos dados (primeiros 10 registros)
4. Verifique se os dados estão corretos
5. Clique em **"Enviar e Processar"**

### 2. Acompanhamento

- O processamento é realizado em tempo real
- O status do job é atualizado automaticamente
- Você pode acompanhar o progresso na seção **"Histórico de Processamentos"**

### 3. Download dos Resultados

1. Aguarde o status mudar para **"Concluído"**
2. Clique no botão **"Baixar CSV"** ao lado do job
3. O arquivo será baixado com o nome `scores_{job_id}.csv`

## Formato do CSV de Saída

O arquivo de resultados contém as seguintes colunas:

| Coluna | Descrição |
|--------|-----------|
| `cpf` | CPF do cliente |
| `nome` | Nome do cliente |
| `produto` | Tipo de crédito |
| `score_prob_inadimplencia` | Probabilidade de inadimplência (0-1) ou vazio se excluído |
| `faixa_score` | Classificação (A-E) ou vazio se excluído |
| `motivo_exclusao` | Motivo da exclusão (`menos_3_meses`, `inativo_8_meses`) ou vazio |
| `data_processamento` | Data e hora do processamento |

### Exemplo de Saída

```csv
cpf,nome,produto,score_prob_inadimplencia,faixa_score,motivo_exclusao,data_processamento
123.456.789-01,João Silva,CARTAO,0.3500,B,,2025-01-15
345.678.901-23,Pedro Oliveira,CARNE,,,menos_3_meses,2025-01-15
456.789.012-34,Ana Costa,CARTAO,,,inativo_8_meses,2025-01-15
```

## Limitações

- **Tamanho máximo do arquivo**: 10MB
- **Formatos aceitos**: CSV, XLSX, XLS
- **Processamento**: Síncrono (em tempo real)
- **Isolamento**: Cada empresa vê apenas seus próprios dados

## Segurança e Privacidade

- ✅ **Isolamento por Tenant**: Dados totalmente segregados por empresa
- ✅ **Autenticação Obrigatória**: Apenas usuários autenticados podem fazer upload
- ✅ **Rastreabilidade**: Todos os uploads são registrados com timestamp e usuário
- ⚠️ **Criptografia**: Implementação futura para dados sensíveis (CPF, nome)

## Solução de Problemas

### Erro: "Formato inválido"
- Verifique se o arquivo é CSV, XLSX ou XLS
- Certifique-se de que todas as colunas obrigatórias estão presentes

### Erro: "Arquivo muito grande"
- Reduza o tamanho do arquivo para menos de 10MB
- Divida o upload em múltiplos arquivos menores

### Erro: "Dados inválidos"
- Verifique se os valores numéricos estão no formato correto
- Confirme que o campo `produto` contém apenas: CARTAO, CARNE ou EMPRESTIMO_PESSOAL
- Certifique-se de que `inadimplente` é 0 ou 1

### Job com status "Falhou"
- Verifique a mensagem de erro no histórico
- Revise o formato do arquivo e tente novamente
- Entre em contato com o suporte se o problema persistir

## Próximos Passos

Após processar seus clientes:

1. **Analise os Resultados**: Revise os scores gerados e as exclusões
2. **Tome Decisões**: Use os scores para aprovar/rejeitar crédito
3. **Monitore**: Acompanhe a evolução dos scores no seu perfil
4. **Integre**: Use a API REST para integração com seus sistemas (em breve)

## Suporte

Para dúvidas ou problemas, entre em contato através do e-mail: suporte@credguard.com.br
