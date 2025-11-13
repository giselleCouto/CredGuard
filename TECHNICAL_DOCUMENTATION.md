# CredGuard - Documentação Técnica

**Plataforma SaaS de Auxílio à Decisão de Crédito**

**Versão:** 1.0  
**Data:** Novembro 2025  
**Autor:** Giselle Falcão

---

## Sumário Executivo

A plataforma **CredGuard** é uma solução SaaS B2B especializada em análise de risco de crédito, desenvolvida para empresas que oferecem produtos financeiros a pessoas físicas. O sistema utiliza modelos de Machine Learning pré-treinados para gerar scores de probabilidade de inadimplência, permitindo que empresas tomem decisões de crédito mais assertivas e reduzam perdas financeiras.

A arquitetura da plataforma é baseada em isolamento total de dados por tenant (multitenant), garantindo segurança e conformidade com regulamentações de proteção de dados. O processamento é realizado em lote através de upload de arquivos CSV/Excel contendo histórico transacional e cadastral de clientes, retornando scores específicos para três categorias de produtos: **CARTÃO**, **CARNÊ** e **EMPRÉSTIMO PESSOAL**.

Além do score interno gerado por modelos proprietários, a plataforma oferece integração opcional com bureaus de crédito (Serasa/Boa Vista) através da API Brasil, permitindo a criação de scores híbridos que combinam análise comportamental interna (70%) com dados externos de mercado (30%).

---

## 1. Visão Geral da Plataforma

### 1.1 Proposta de Valor

A CredGuard foi projetada para resolver três desafios críticos enfrentados por empresas que concedem crédito:

**Redução de Inadimplência**: Através de modelos preditivos avançados, a plataforma identifica clientes com maior probabilidade de inadimplência antes da concessão de crédito, permitindo ajustes em limites, taxas ou até mesmo recusa de propostas de alto risco.

**Automação de Processos**: O processamento em lote elimina a necessidade de análise manual de cada cliente, permitindo que empresas processem milhares de solicitações simultaneamente com resultados em minutos.

**Conformidade Regulatória**: A arquitetura multitenant garante isolamento total de dados entre empresas clientes, atendendo aos requisitos da Lei Geral de Proteção de Dados (LGPD) e do marco regulatório de Inteligência Artificial de 2025.

### 1.2 Público-Alvo

A plataforma é direcionada a empresas de diversos segmentos que oferecem crédito a pessoas físicas, incluindo:

- **Varejo**: Lojas de departamento, e-commerce e redes de eletrodomésticos que oferecem carnês e cartões de crédito private label
- **Instituições Financeiras**: Fintechs, cooperativas de crédito e bancos digitais que concedem empréstimos pessoais
- **Empresas de Mobilidade**: Plataformas de transporte e locação de veículos que oferecem financiamento
- **Marketplaces**: Plataformas que intermediam vendas com parcelamento ou crédito direto ao consumidor

### 1.3 Diferenciais Competitivos

A CredGuard se diferencia de soluções tradicionais de credit scoring através de características únicas que não serão detalhadas neste documento por serem segredos industriais da solução. No entanto, podemos destacar os seguintes aspectos públicos:

**Especialização por Produto**: Ao contrário de bureaus tradicionais que fornecem um score genérico, a CredGuard gera scores específicos para cada tipo de produto financeiro (cartão, carnê, empréstimo), considerando padrões de comportamento distintos para cada modalidade.

**Regras de Negócio Inteligentes**: O sistema aplica automaticamente filtros que excluem clientes com histórico insuficiente (menos de 3 meses) ou inativos (mais de 8 meses sem movimentação), garantindo que os scores sejam baseados em dados relevantes e atualizados.

**Arquitetura Híbrida**: A combinação de análise comportamental interna com dados de bureaus externos permite uma visão mais completa do perfil de risco, especialmente para clientes novos ou com histórico limitado na base da empresa.

---

## 2. Arquitetura do Sistema

### 2.1 Stack Tecnológico

A plataforma CredGuard foi construída utilizando tecnologias modernas e escaláveis, garantindo performance, segurança e facilidade de manutenção.

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|---------|---------------|
| **Frontend** | React | 19.x | Framework líder de mercado para interfaces web modernas e responsivas |
| **Estilização** | Tailwind CSS | 4.x | Sistema de design utilitário que acelera desenvolvimento e garante consistência visual |
| **Componentes UI** | shadcn/ui | Latest | Biblioteca de componentes acessíveis e customizáveis baseada em Radix UI |
| **Backend** | Node.js + Express | 4.x | Runtime JavaScript de alta performance para APIs RESTful |
| **API Layer** | tRPC | 11.x | Framework end-to-end type-safe que elimina necessidade de documentação manual de APIs |
| **Banco de Dados** | MySQL/TiDB | 8.x | Sistema relacional robusto com suporte a transações ACID e escalabilidade horizontal |
| **ORM** | Drizzle ORM | Latest | ORM TypeScript-first com excelente performance e type safety |
| **Autenticação** | Manus OAuth | - | Sistema OAuth integrado para autenticação segura de usuários |
| **Storage** | AWS S3 | - | Armazenamento de objetos escalável para arquivos CSV e resultados |
| **Machine Learning** | Python 3.11 + scikit-learn | 1.3.2 | Serviço de predição com modelos pré-treinados (fa_8, fa_11, fa_12, fa_15) |
| **Data Processing** | pandas + numpy | 2.1.4 / 1.26.2 | Processamento e transformação de dados para ML |

### 2.2 Arquitetura Multitenant

A CredGuard implementa uma arquitetura multitenant com isolamento de dados em nível de banco de dados. Cada empresa cliente (tenant) possui seus dados completamente segregados através de um identificador único (`tenant_id`) presente em todas as tabelas do sistema.

**Fluxo de Isolamento de Dados:**

1. **Autenticação**: Usuário realiza login através do Manus OAuth
2. **Identificação de Tenant**: Sistema identifica automaticamente o tenant_id associado ao usuário autenticado
3. **Filtragem Automática**: Todas as queries ao banco de dados incluem automaticamente o filtro `WHERE tenant_id = ?`
4. **Validação de Acesso**: Antes de qualquer operação de leitura/escrita, o sistema valida se o usuário pertence ao tenant dos dados solicitados

Esta abordagem garante que:

- Nenhuma empresa tenha acesso aos dados de outra empresa
- Não há possibilidade de vazamento de informações entre tenants
- Auditorias podem rastrear todas as operações por tenant
- Conformidade com LGPD e regulamentações de proteção de dados

### 2.3 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │ Batch Upload │  │   History    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Bureau Config │  │Bureau Metrics│  │   Profile    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE API (tRPC)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ batch router │  │bureau router │  │profile router│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   CAMADA DE SERVIÇOS                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ML Service   │  │Bureau Service│  │ File Parser  │      │
│  │  (Python)    │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ML Prediction │  │Feature       │                         │
│  │Wrapper (TS)  │  │Extraction    │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   CAMADA DE DADOS                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  MySQL/TiDB  │  │   AWS S3     │  │ Bureau Cache │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐                                            │
│  │ ML Models    │                                            │
│  │ (.pkl files) │                                            │
│  │ fa_8, fa_11, │                                            │
│  │ fa_12, fa_15 │                                            │
│  └──────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 INTEGRAÇÕES EXTERNAS                         │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  API Brasil  │  │ Manus OAuth  │                         │
│  │(Serasa/BV)   │  │              │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Modelo de Dados

### 3.1 Estrutura do Banco de Dados

O banco de dados da plataforma CredGuard é composto por tabelas especializadas que armazenam informações de usuários, tenants, jobs de processamento, dados de clientes e scores gerados.

#### Tabela: `users`

Armazena informações dos usuários autenticados na plataforma.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT (PK, AUTO_INCREMENT) | Identificador único do usuário |
| `openId` | VARCHAR(64) UNIQUE | Identificador OAuth retornado pelo Manus OAuth |
| `name` | TEXT | Nome completo do usuário |
| `email` | VARCHAR(320) | E-mail do usuário |
| `loginMethod` | VARCHAR(64) | Método de autenticação utilizado |
| `role` | ENUM('user', 'admin') | Papel do usuário no sistema |
| `createdAt` | TIMESTAMP | Data de criação do registro |
| `updatedAt` | TIMESTAMP | Data da última atualização |
| `lastSignedIn` | TIMESTAMP | Data do último login |

#### Tabela: `batch_jobs`

Registra todos os jobs de processamento em lote submetidos pelos tenants.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT (PK, AUTO_INCREMENT) | Identificador único do job |
| `jobId` | VARCHAR(255) UNIQUE | Identificador público do job (UUID) |
| `tenantId` | INT | Identificador do tenant proprietário |
| `fileName` | VARCHAR(500) | Nome do arquivo enviado |
| `fileSize` | INT | Tamanho do arquivo em bytes |
| `status` | ENUM('pending', 'processing', 'completed', 'failed') | Status do processamento |
| `totalRecords` | INT | Total de registros no arquivo |
| `processedRecords` | INT | Registros processados com sucesso |
| `errorMessage` | TEXT | Mensagem de erro (se houver) |
| `createdAt` | TIMESTAMP | Data de criação do job |
| `completedAt` | TIMESTAMP | Data de conclusão do processamento |

#### Tabela: `customer_data`

Armazena os dados brutos dos clientes enviados pelos tenants.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT (PK, AUTO_INCREMENT) | Identificador único do registro |
| `batchJobId` | INT (FK) | Referência ao job de processamento |
| `tenantId` | INT | Identificador do tenant proprietário |
| `cpf` | VARCHAR(14) | CPF do cliente |
| `nome` | VARCHAR(255) | Nome do cliente |
| `produto` | ENUM('CARTAO', 'CARNE', 'EMPRESTIMO_PESSOAL') | Produto solicitado |
| `dataPrimeiraCompra` | DATE | Data da primeira compra |
| `dataUltimaCompra` | DATE | Data da última compra |
| `totalCompras` | INT | Total de compras realizadas |
| `valorTotalCompras` | DECIMAL(15,2) | Valor total gasto |
| `totalPagamentosEmDia` | INT | Pagamentos realizados no prazo |
| `totalAtrasos` | INT | Pagamentos em atraso |
| `maiorAtraso` | INT | Maior atraso em dias |
| `createdAt` | TIMESTAMP | Data de criação do registro |

#### Tabela: `customer_scores`

Armazena os scores de crédito gerados para cada cliente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT (PK, AUTO_INCREMENT) | Identificador único do score |
| `batchJobId` | INT (FK) | Referência ao job de processamento |
| `tenantId` | INT | Identificador do tenant proprietário |
| `cpf` | VARCHAR(14) | CPF do cliente |
| `nome` | VARCHAR(255) | Nome do cliente |
| `produto` | ENUM('CARTAO', 'CARNE', 'EMPRESTIMO_PESSOAL') | Produto analisado |
| `scoreProbInadimplencia` | DECIMAL(5,4) | Score final de probabilidade de inadimplência (0-1) |
| `faixaScore` | VARCHAR(50) | Faixa de risco (BAIXO, MÉDIO, ALTO, CRÍTICO) |
| `motivoExclusao` | VARCHAR(500) | Motivo de exclusão (se aplicável) |
| `scoreInterno` | DECIMAL(5,4) | Score gerado pelo modelo interno |
| `scoreSerasa` | INT | Score Serasa (se bureau ativo) |
| `pendencias` | INT | Quantidade de pendências (se bureau ativo) |
| `protestos` | INT | Quantidade de protestos (se bureau ativo) |
| `bureauSource` | VARCHAR(50) | Fonte do bureau ('serasa_apibrasil', 'disabled') |
| `dataProcessamento` | TIMESTAMP | Data de geração do score |

#### Tabela: `tenant_bureau_config`

Armazena configurações de integração com bureaus por tenant.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT (PK, AUTO_INCREMENT) | Identificador único da configuração |
| `tenantId` | INT UNIQUE | Identificador do tenant |
| `bureauEnabled` | BOOLEAN | Indica se bureau está ativado |
| `provider` | VARCHAR(50) | Provedor de bureau ('serasa_apibrasil') |
| `createdAt` | TIMESTAMP | Data de criação da configuração |
| `updatedAt` | TIMESTAMP | Data da última atualização |

#### Tabela: `bureau_cache`

Cache de consultas realizadas aos bureaus de crédito.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT (PK, AUTO_INCREMENT) | Identificador único do cache |
| `tenantId` | INT | Identificador do tenant proprietário |
| `cpf` | VARCHAR(14) | CPF consultado |
| `source` | VARCHAR(50) | Fonte do bureau |
| `score` | INT | Score retornado pelo bureau |
| `pendencias` | INT | Quantidade de pendências |
| `protestos` | INT | Quantidade de protestos |
| `cachedAt` | TIMESTAMP | Data da consulta original |
| `expiresAt` | TIMESTAMP | Data de expiração do cache |

### 3.2 Relacionamentos

O modelo de dados implementa os seguintes relacionamentos principais:

- **users → batch_jobs**: Um usuário pode criar múltiplos jobs de processamento (1:N)
- **batch_jobs → customer_data**: Um job contém múltiplos registros de clientes (1:N)
- **batch_jobs → customer_scores**: Um job gera múltiplos scores de clientes (1:N)
- **tenant_bureau_config**: Configuração única por tenant (1:1 com tenant)
- **bureau_cache**: Cache compartilhado entre jobs do mesmo tenant

---

## 4. Funcionalidades Principais

### 4.1 Upload em Lote de Clientes

A funcionalidade de upload em lote é o core da plataforma, permitindo que empresas enviem históricos de milhares de clientes simultaneamente para análise de crédito.

#### 4.1.1 Formato de Entrada

O sistema aceita arquivos nos formatos **CSV** e **Excel (XLSX)** com tamanho máximo de **10 MB**. O arquivo deve conter as seguintes colunas obrigatórias:

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `cpf` | String | CPF do cliente (com ou sem formatação) | 123.456.789-00 |
| `nome` | String | Nome completo do cliente | João da Silva |
| `produto` | String | Produto solicitado (CARTAO, CARNE, EMPRESTIMO_PESSOAL) | CARTAO |
| `data_primeira_compra` | Date | Data da primeira compra | 2023-01-15 |
| `data_ultima_compra` | Date | Data da última compra | 2024-10-20 |
| `total_compras` | Integer | Quantidade de compras realizadas | 15 |
| `valor_total_compras` | Decimal | Valor total gasto | 5420.50 |
| `total_pagamentos_em_dia` | Integer | Pagamentos realizados no prazo | 12 |
| `total_atrasos` | Integer | Pagamentos em atraso | 3 |
| `maior_atraso` | Integer | Maior atraso em dias | 45 |

**Exemplo de arquivo CSV:**

```csv
cpf,nome,produto,data_primeira_compra,data_ultima_compra,total_compras,valor_total_compras,total_pagamentos_em_dia,total_atrasos,maior_atraso
123.456.789-00,João da Silva,CARTAO,2023-01-15,2024-10-20,15,5420.50,12,3,45
987.654.321-00,Maria Santos,CARNE,2022-06-10,2024-11-01,28,12350.00,25,3,30
```

#### 4.1.2 Processo de Validação

Antes do processamento, o sistema realiza validações rigorosas para garantir a qualidade dos dados:

**Validação de Formato**: Verifica se o arquivo está em formato CSV ou XLSX válido e se todas as colunas obrigatórias estão presentes.

**Validação de CPF**: Valida o formato do CPF e remove caracteres especiais (pontos e traços) para padronização.

**Validação de Datas**: Garante que as datas estão em formato válido (YYYY-MM-DD ou DD/MM/YYYY) e que `data_primeira_compra` é anterior a `data_ultima_compra`.

**Validação de Valores Numéricos**: Verifica se campos numéricos contêm apenas números e se valores decimais usam ponto como separador.

**Validação de Produto**: Confirma que o campo `produto` contém apenas valores permitidos (CARTAO, CARNE, EMPRESTIMO_PESSOAL).

Registros com erros de validação são marcados e excluídos do processamento, sendo reportados no arquivo de saída com o motivo da exclusão.

#### 4.1.3 Fluxo de Processamento

O processamento em lote segue um fluxo assíncrono que permite que o usuário acompanhe o progresso em tempo real:

1. **Upload do Arquivo**: Usuário faz upload do arquivo através da interface drag-and-drop
2. **Validação Inicial**: Sistema valida formato, tamanho e estrutura do arquivo
3. **Preview de Dados**: Exibe os primeiros 10 registros para confirmação do usuário
4. **Criação do Job**: Sistema cria um registro na tabela `batch_jobs` com status 'pending'
5. **Armazenamento em S3**: Arquivo é enviado para AWS S3 para processamento assíncrono
6. **Processamento Assíncrono**: Worker processa cada linha do arquivo aplicando regras de negócio
7. **Geração de Scores**: Modelos ML geram scores para cada cliente válido
8. **Enriquecimento com Bureau**: Se ativado, consulta bureaus de crédito (com cache de 24h)
9. **Cálculo de Score Híbrido**: Combina score interno (70%) com score bureau (30%)
10. **Armazenamento de Resultados**: Scores são salvos na tabela `customer_scores`
11. **Geração de CSV de Saída**: Sistema gera arquivo CSV com resultados
12. **Notificação de Conclusão**: Job é marcado como 'completed' e disponibilizado para download

#### 4.1.4 Regras de Negócio Automáticas

Durante o processamento, o sistema aplica automaticamente regras de negócio que filtram clientes inadequados para análise de crédito:

**Histórico Insuficiente**: Clientes com menos de 3 meses entre `data_primeira_compra` e `data_ultima_compra` são excluídos com motivo "Histórico insuficiente (<3 meses)". Esta regra garante que o modelo tenha dados suficientes para uma análise confiável.

**Inatividade Prolongada**: Clientes com mais de 8 meses entre `data_ultima_compra` e a data atual são excluídos com motivo "Cliente inativo (>8 meses sem movimentação)". Esta regra evita análises baseadas em comportamentos desatualizados.

**Dados Inconsistentes**: Registros com valores negativos, datas inválidas ou campos obrigatórios vazios são excluídos com motivo específico detalhando o problema.

### 4.2 Geração de Scores de Crédito

O core da plataforma CredGuard é o sistema de geração de scores de probabilidade de inadimplência, baseado em modelos de Machine Learning pré-treinados.

#### 4.2.1 Modelos de Machine Learning

A plataforma utiliza **modelos proprietários de classificação binária** treinados especificamente para cada tipo de produto financeiro. Os modelos são armazenados em formato serializado (.pkl) e carregados em memória durante a inicialização do serviço de predição. Os detalhes técnicos dos algoritmos, features engineering e hiperparâmetros são confidenciais e não serão divulgados neste documento.

**Características Gerais dos Modelos:**

| Característica | Descrição |
|------------------|-------------|
| **Tipo** | Modelos de classificação binária (inadimplente / adimplente) |
| **Saída** | Probabilidade de inadimplência entre 0 e 1 (0% a 100%) |
| **Especialização** | Modelos distintos para CARTÃO (fa_12), CARNÊ (fa_11) e EMPRÉSTIMO PESSOAL (fa_15) |
| **Formato** | Arquivos .pkl serializados com pickle/joblib |
| **Tamanho Total** | 103 MB (fa_8: 19MB, fa_11: 18MB, fa_12: 22MB, fa_15: 44MB) |
| **Treinamento** | Baseado em histórico transacional e comportamental de clientes reais |
| **Atualização** | Modelos são retreinados periodicamente com novos dados (frequência confidencial) |

**Arquitetura de Modelos:**

A plataforma implementa quatro variantes de modelos (FA-8, FA-11, FA-12, FA-15), cada uma otimizada para diferentes conjuntos de features. A seleção do modelo adequado é feita automaticamente baseada no tipo de produto:

- **FA-8** (8 features): Modelo base com features essenciais
- **FA-11** (11 features): Modelo otimizado para produtos de carnê
- **FA-12** (12 features): Modelo principal para cartão de crédito
- **FA-15** (15 features): Modelo avançado para empréstimo pessoal

**Features Extraídas:**

O serviço de predição (`ml_service.py`) extrai automaticamente as seguintes features do histórico do cliente:

| Feature | Descrição | Cálculo |
|---------|-------------|----------|
| `meses_relacionamento` | Tempo de relacionamento em meses | (data_ultima_compra - data_primeira_compra) / 30 |
| `recencia_dias` | Dias desde a última compra | (data_atual - data_ultima_compra) |
| `total_compras` | Quantidade de compras realizadas | Soma de transações |
| `valor_total` | Valor total transacionado | Soma de valores de compras |
| `ticket_medio` | Valor médio por compra | valor_total / total_compras |
| `taxa_adimplencia` | Percentual de pagamentos em dia | pagamentos_em_dia / total_pagamentos |
| `maior_atraso` | Maior atraso registrado em dias | Máximo de dias_atraso |
| `frequencia_compras` | Compras por mês | total_compras / meses_relacionamento |
| `total_pagamentos_em_dia` | Quantidade de pagamentos no prazo | Contagem de pagamentos sem atraso |
| `total_atrasos` | Quantidade de pagamentos em atraso | Contagem de pagamentos com atraso |

**Normalização de Features:**

As features numéricas são normalizadas utilizando um **StandardScaler** pré-treinado (`scaler_num.pkl`, 1.5KB) antes de serem fornecidas aos modelos. Este processo garante que todas as variáveis tenham a mesma escala, melhorando a performance e estabilidade das predições.

**Nota Importante**: A lista de features acima não é exaustiva. O conjunto completo de features, suas transformações, interações e os algoritmos de ML utilizados são segredos industriais da solução CredGuard.

#### 4.2.2 Faixas de Score

Os scores gerados são classificados em quatro faixas de risco para facilitar a tomada de decisão:

| Faixa | Probabilidade de Inadimplência | Recomendação |
|-------|-------------------------------|--------------|
| **BAIXO** | 0% - 25% | Crédito aprovado com condições favoráveis |
| **MÉDIO** | 25% - 50% | Crédito aprovado com análise complementar |
| **ALTO** | 50% - 75% | Crédito com restrições (limite reduzido, taxa maior) |
| **CRÍTICO** | 75% - 100% | Crédito negado ou análise manual obrigatória |

Estas faixas são sugestões e cada empresa pode definir suas próprias políticas de crédito baseadas nos scores gerados.

#### 4.2.3 Score Interno vs Score Híbrido

A plataforma oferece duas modalidades de score:

**Score Interno**: Gerado exclusivamente pelos modelos proprietários da CredGuard, baseado no histórico transacional fornecido pela empresa cliente. Este score é ideal para empresas que possuem histórico robusto de seus clientes e desejam reduzir custos com consultas a bureaus.

**Score Híbrido**: Combina o score interno (peso 70%) com dados de bureaus de crédito externos (peso 30%), criando uma visão mais completa do perfil de risco. A fórmula de cálculo é:

```
score_hibrido = (score_interno * 0.7) + (score_bureau_normalizado * 0.3)
```

Onde `score_bureau_normalizado` é o score Serasa (0-1000) normalizado para a escala 0-1.

O score híbrido é especialmente útil para:

- Clientes novos com pouco histórico na base da empresa
- Validação cruzada de scores internos
- Detecção de fraudes (divergência significativa entre scores)
- Análise de risco mais conservadora

### 4.3 Integração com Bureaus de Crédito

A plataforma oferece integração opcional com bureaus de crédito através da **API Brasil**, que fornece acesso unificado aos principais bureaus do mercado brasileiro (Serasa e Boa Vista).

#### 4.3.1 Configuração de Bureau

Cada tenant pode ativar ou desativar a integração com bureaus através da interface de configuração. As configurações são armazenadas na tabela `tenant_bureau_config` e incluem:

- **bureauEnabled**: Flag booleana indicando se o bureau está ativo
- **provider**: Provedor de bureau utilizado (atualmente apenas 'serasa_apibrasil')

Quando o bureau está desativado, o sistema utiliza apenas o score interno. Quando ativado, todas as consultas de score passam a incluir enriquecimento com dados de bureau.

#### 4.3.2 Processo de Consulta

O processo de consulta a bureaus segue o fluxo:

1. **Verificação de Cache**: Sistema verifica se existe consulta recente (< 24h) para o CPF
2. **Cache Hit**: Se encontrado, retorna dados do cache sem nova consulta
3. **Cache Miss**: Se não encontrado ou expirado, realiza nova consulta à API Brasil
4. **Armazenamento em Cache**: Resultado é armazenado na tabela `bureau_cache` com validade de 24h
5. **Retorno de Dados**: Dados são retornados para cálculo do score híbrido

#### 4.3.3 Sistema de Cache

O sistema de cache foi implementado para reduzir custos e melhorar performance:

**Validade**: 24 horas (86400 segundos)
**Chave de Cache**: Combinação de `tenant_id` + `cpf`
**Dados Armazenados**: score, pendências, protestos, fonte
**Expiração**: Automática após 24h da consulta original

O cache garante que consultas duplicadas ao mesmo CPF dentro de 24h não gerem custos adicionais com a API Brasil.

#### 4.3.4 Dados Retornados

A integração com bureaus retorna os seguintes dados:

| Campo | Descrição |
|-------|-----------|
| `score_serasa` | Score Serasa (0-1000) |
| `pendencias` | Quantidade de pendências financeiras ativas |
| `protestos` | Quantidade de protestos em cartório |
| `bureau_source` | Fonte dos dados ('serasa_apibrasil') |

Estes dados são incluídos no CSV de saída quando o bureau está ativado.

#### 4.3.5 Custos e Planos

A integração com bureaus através da API Brasil possui custo de **R$ 99,00 por mês** para consultas ilimitadas. Quando o bureau está desativado, não há custo adicional.

### 4.4 Histórico de Scores

A funcionalidade de histórico permite que empresas consultem e baixem resultados de processamentos anteriores.

#### 4.4.1 Listagem de Jobs

A página de histórico exibe todos os jobs de processamento do tenant, ordenados por data de criação (mais recentes primeiro). Para cada job são exibidos:

- **Job ID**: Identificador único do job
- **Nome do Arquivo**: Nome original do arquivo enviado
- **Data de Upload**: Data e hora do upload
- **Status**: pending, processing, completed, failed
- **Total de Registros**: Quantidade de clientes no arquivo
- **Registros Processados**: Quantidade de scores gerados
- **Ações**: Botão de download do CSV de resultados (apenas para jobs completed)

#### 4.4.2 Download de Resultados

O CSV de saída contém as seguintes colunas:

| Coluna | Descrição |
|--------|-----------|
| `cpf` | CPF do cliente |
| `nome` | Nome do cliente |
| `produto` | Produto analisado |
| `score_prob_inadimplencia` | Score final de probabilidade de inadimplência (0-1) |
| `faixa_score` | Faixa de risco (BAIXO, MÉDIO, ALTO, CRÍTICO) |
| `motivo_exclusao` | Motivo de exclusão (se aplicável) |
| `score_interno` | Score gerado pelo modelo interno |
| `score_serasa` | Score Serasa (se bureau ativo) |
| `pendencias` | Quantidade de pendências (se bureau ativo) |
| `protestos` | Quantidade de protestos (se bureau ativo) |
| `bureau_source` | Fonte do bureau ou 'disabled' |
| `data_processamento` | Data de geração do score |

### 4.5 Métricas de Bureau

A página de métricas oferece visibilidade completa sobre o uso de bureaus de crédito e seus custos.

#### 4.5.1 Indicadores Principais

A dashboard de métricas exibe quatro indicadores principais:

**Total de Consultas**: Quantidade total de consultas realizadas aos bureaus nos últimos 30 dias. Este número inclui apenas consultas que efetivamente foram enviadas à API Brasil (cache misses).

**Taxa de Cache Hit**: Percentual de consultas que foram atendidas pelo cache sem necessidade de nova consulta ao bureau. Uma taxa alta (>70%) indica boa eficiência do cache e redução de custos.

**Custo Mensal**: Custo estimado com bureaus no mês atual. Fixo em R$ 99,00 se bureau ativo, R$ 0,00 se desativado.

**Scores Processados**: Total de scores gerados nos últimos 30 dias, divididos entre scores com bureau e scores sem bureau.

#### 4.5.2 Gráficos de Performance

A página inclui visualizações gráficas para facilitar análise:

**Performance do Cache**: Gráfico de barras horizontais mostrando distribuição entre cache hits e cache misses, com percentuais e recomendações automáticas.

**Comparação de Scores**: Gráfico comparativo entre score interno médio, score interno quando bureau está ativo e score híbrido final, permitindo avaliar o impacto do bureau nos scores.

#### 4.5.3 Insights Automáticos

O sistema gera insights automáticos baseados nas métricas:

- **Economia com Cache**: Destaca quantas consultas duplicadas foram evitadas
- **Bureau Ativo**: Informa quantidade de scores enriquecidos e diferença média entre scores
- **Taxa de Cache Baixa**: Alerta quando cache hit rate está abaixo de 40% e sugere ações

---

## 5. Processos de Negócio

### 5.1 Fluxo Completo de Análise de Crédito

O processo completo de análise de crédito na plataforma CredGuard segue o seguinte fluxo:

**Etapa 1: Preparação de Dados**

A empresa cliente prepara um arquivo CSV ou Excel contendo o histórico transacional e cadastral de seus clientes. Este arquivo deve incluir todas as colunas obrigatórias especificadas na seção 4.1.1.

**Etapa 2: Upload e Validação**

O usuário acessa a plataforma através de autenticação OAuth, navega até a página de Upload em Lote e faz upload do arquivo. O sistema realiza validações de formato, tamanho e estrutura, exibindo um preview dos primeiros registros para confirmação.

**Etapa 3: Processamento Assíncrono**

Após confirmação, o sistema cria um job de processamento e inicia o processamento assíncrono. Durante esta etapa:

- Cada linha do arquivo é validada individualmente
- Regras de negócio são aplicadas (filtro de histórico e inatividade)
- Clientes válidos são submetidos aos modelos ML para geração de scores
- Se bureau estiver ativo, consultas são realizadas (com cache de 24h)
- Scores híbridos são calculados quando aplicável

**Etapa 4: Geração de Resultados**

Ao final do processamento, o sistema gera um arquivo CSV contendo:

- Scores de todos os clientes válidos
- Motivos de exclusão para clientes filtrados
- Dados de bureau (se ativado)
- Faixas de risco calculadas

**Etapa 5: Análise e Decisão**

A empresa cliente baixa o CSV de resultados e utiliza os scores para tomar decisões de crédito:

- Aprovação/recusa de solicitações
- Definição de limites de crédito
- Ajuste de taxas de juros
- Priorização de análises manuais

### 5.2 Processo de Enriquecimento com Bureau

Quando o bureau está ativado, o processo de enriquecimento ocorre durante o processamento em lote:

1. **Verificação de Configuração**: Sistema verifica se bureau está ativo para o tenant
2. **Consulta de Cache**: Para cada CPF, verifica se existe consulta recente (< 24h)
3. **Consulta à API Brasil**: Se cache miss, realiza consulta ao bureau
4. **Normalização de Dados**: Score Serasa (0-1000) é normalizado para escala 0-1
5. **Cálculo de Score Híbrido**: Combina score interno (70%) com score bureau (30%)
6. **Armazenamento**: Dados de bureau são salvos no cache e na tabela de scores

### 5.3 Processo de Atualização de Cache

O cache de bureaus possui validade de 24 horas e é atualizado automaticamente:

1. **Verificação de Expiração**: Ao consultar cache, sistema verifica campo `expiresAt`
2. **Cache Expirado**: Se `expiresAt < now()`, entrada é considerada inválida
3. **Nova Consulta**: Sistema realiza nova consulta à API Brasil
4. **Atualização de Cache**: Registro existente é atualizado com novos dados e nova data de expiração
5. **Retorno de Dados**: Dados atualizados são retornados para processamento

Este processo garante que os dados de bureau estejam sempre atualizados sem gerar consultas desnecessárias.

---

## 6. Segurança e Conformidade

### 6.1 Proteção de Dados (LGPD)

A plataforma CredGuard foi projetada para estar em conformidade com a Lei Geral de Proteção de Dados (LGPD):

**Isolamento de Dados**: Arquitetura multitenant garante que dados de cada empresa estejam completamente isolados, impedindo acesso não autorizado.

**Minimização de Dados**: Sistema armazena apenas dados essenciais para geração de scores, evitando coleta excessiva de informações pessoais.

**Finalidade Específica**: Dados são utilizados exclusivamente para análise de risco de crédito, conforme consentimento do titular.

**Segurança no Armazenamento**: Dados sensíveis são armazenados em banco de dados com criptografia em repouso e em trânsito.

**Direito de Exclusão**: Empresas podem solicitar exclusão de dados de clientes específicos através de suporte técnico.

### 6.2 Autenticação e Autorização

A plataforma utiliza o Manus OAuth para autenticação segura de usuários:

**OAuth 2.0**: Protocolo padrão de mercado para autenticação delegada
**Session Cookies**: Sessões seguras com cookies HTTP-only e Secure flag
**Validação de Tenant**: Todas as requisições validam se usuário pertence ao tenant dos dados solicitados
**Controle de Acesso**: Endpoints protegidos exigem autenticação válida

### 6.3 Auditoria e Rastreabilidade

Todas as operações críticas são registradas para fins de auditoria:

- **Criação de Jobs**: Timestamp, usuário, tenant, arquivo
- **Consultas a Bureau**: Timestamp, CPF, tenant, resultado
- **Downloads de Resultados**: Timestamp, usuário, job_id
- **Alterações de Configuração**: Timestamp, usuário, configuração alterada

### 6.4 Conformidade com Marco Regulatório de IA

A plataforma está alinhada com o marco regulatório de Inteligência Artificial de 2025:

**Transparência**: Scores são acompanhados de faixas de risco claras e interpretáveis
**Explicabilidade**: Motivos de exclusão são fornecidos para clientes filtrados
**Não Discriminação**: Modelos não utilizam variáveis protegidas (raça, gênero, religião)
**Supervisão Humana**: Decisões finais de crédito são tomadas pelas empresas clientes
**Segurança**: Modelos são testados periodicamente para evitar vieses e degradação

---

## 7. Especificações Técnicas

### 7.1 Performance e Escalabilidade

A plataforma foi projetada para alta performance e escalabilidade:

| Métrica | Especificação |
|---------|---------------|
| **Latência Média de API** | < 100ms |
| **Throughput** | 87 requisições/segundo |
| **Processamento em Lote** | Até 10.000 registros/minuto |
| **Tamanho Máximo de Arquivo** | 10 MB |
| **Registros por Arquivo** | Até 100.000 linhas |
| **Disponibilidade** | 99.9% SLA |
| **Tempo de Resposta de Score** | < 50ms por cliente |

### 7.2 Limites e Restrições

| Recurso | Limite |
|---------|--------|
| **Tamanho de Arquivo** | 10 MB |
| **Registros por Upload** | 100.000 linhas |
| **Jobs Simultâneos por Tenant** | 5 |
| **Retenção de Dados** | 12 meses |
| **Cache de Bureau** | 24 horas |
| **Consultas de Bureau** | Ilimitadas (plano R$ 99/mês) |

### 7.3 Ambientes

A plataforma opera em dois ambientes:

**Produção**: Ambiente principal acessível em `https://credguard.manus.space`
**Desenvolvimento**: Ambiente de testes para validação de novas funcionalidades

### 7.4 Backup e Recuperação

**Backup Automático**: Banco de dados possui backup automático diário com retenção de 30 dias
**Recuperação de Desastres**: RTO (Recovery Time Objective) de 4 horas e RPO (Recovery Point Objective) de 1 hora
**Redundância**: Dados replicados em múltiplas zonas de disponibilidade

---

## 8. APIs e Integrações

### 8.1 API tRPC

A plataforma expõe suas funcionalidades através de uma API tRPC type-safe, eliminando a necessidade de documentação manual de contratos.

#### 8.1.1 Routers Disponíveis

**auth**: Autenticação e gerenciamento de sessão
- `auth.me`: Retorna usuário autenticado
- `auth.logout`: Encerra sessão do usuário

**batch**: Processamento em lote
- `batch.upload`: Envia arquivo para processamento
- `batch.getJob`: Consulta status de um job específico
- `batch.listJobs`: Lista todos os jobs do tenant
- `batch.downloadCsv`: Baixa CSV de resultados de um job

**bureau**: Configuração e métricas de bureau
- `bureau.getConfig`: Consulta configuração de bureau do tenant
- `bureau.setConfig`: Ativa/desativa bureau
- `bureau.getMetrics`: Retorna métricas de uso de bureau
- `bureau.getScoreDistribution`: Retorna distribuição de scores

**profile**: Gerenciamento de perfil
- `profile.me`: Retorna dados do perfil do usuário
- `profile.update`: Atualiza dados do perfil

#### 8.1.2 Exemplo de Uso (TypeScript)

```typescript
import { trpc } from "@/lib/trpc";

// Upload de arquivo
const uploadMutation = trpc.batch.upload.useMutation();
const result = await uploadMutation.mutateAsync({
  fileName: "clientes.csv",
  fileSize: 1024000,
  fileData: base64EncodedData,
});

// Consultar job
const { data: job } = trpc.batch.getJob.useQuery({
  jobId: result.jobId,
});

// Baixar resultados
const { data: csv } = trpc.batch.downloadCsv.useQuery({
  jobId: result.jobId,
});
```

### 8.2 Integração com API Brasil

A plataforma integra com a API Brasil para consultas a bureaus de crédito.

**Endpoint**: `https://api.apibrasil.io/credit-bureau`
**Autenticação**: Bearer Token (configurado via variável de ambiente `APIBRASIL_TOKEN`)
**Método**: POST
**Rate Limit**: Ilimitado (plano contratado)

**Exemplo de Request:**

```json
{
  "cpf": "12345678900",
  "provider": "serasa"
}
```

**Exemplo de Response:**

```json
{
  "score": 750,
  "pendencias": 0,
  "protestos": 0,
  "status": "success"
}
```

### 8.3 Integração com AWS S3

Arquivos enviados e resultados gerados são armazenados em AWS S3.

**Bucket**: Configurado via variável de ambiente
**Região**: us-east-1
**Autenticação**: IAM Role com permissões de leitura/escrita
**Estrutura de Pastas**:
- `/uploads/{tenant_id}/{job_id}/input.csv`
- `/results/{tenant_id}/{job_id}/output.csv`

---

## 9. Manutenção e Suporte

### 9.1 Monitoramento

A plataforma possui monitoramento 24/7 com alertas automáticos para:

- Erros de API (taxa > 1%)
- Latência elevada (> 500ms)
- Jobs com falha (> 5% do total)
- Indisponibilidade de serviços externos
- Uso excessivo de recursos

### 9.2 Atualizações

**Atualizações de Segurança**: Aplicadas imediatamente em janela de manutenção
**Novas Funcionalidades**: Liberadas mensalmente após testes em ambiente de desenvolvimento
**Retreinamento de Modelos**: Realizado periodicamente (frequência confidencial)

### 9.3 Suporte Técnico

**Canais de Suporte**:
- E-mail: support@credguard.com
- Chat: Disponível na plataforma
- Documentação: https://docs.credguard.com

**SLA de Resposta**:
- Crítico (sistema indisponível): 1 hora
- Alto (funcionalidade crítica indisponível): 4 horas
- Médio (funcionalidade não crítica): 1 dia útil
- Baixo (dúvidas gerais): 2 dias úteis

---

## 10. Roadmap e Evoluções Futuras

### 10.1 Funcionalidades Planejadas

**Análise em Tempo Real**: API para consulta de score individual em tempo real durante processo de venda

**Modelos Customizados**: Possibilidade de treinar modelos específicos para cada tenant baseado em seu histórico

**Integração com Mais Bureaus**: Suporte a Quod, SPC Brasil e outros bureaus de crédito

**Dashboard Analítico**: Visualizações avançadas de distribuição de scores, taxa de aprovação e performance de modelos

**API de Webhooks**: Notificações automáticas quando jobs forem concluídos

**Exportação para BI**: Integração com ferramentas de Business Intelligence (Power BI, Tableau)

### 10.2 Melhorias Técnicas

**Otimização de Performance**: Redução de latência de API para < 50ms
**Escalabilidade Horizontal**: Suporte a processamento distribuído para arquivos > 100k registros
**Machine Learning AutoML**: Sistema de retreinamento automático de modelos
**Explicabilidade Avançada**: SHAP values para interpretação de scores individuais

---

## 11. Glossário

| Termo | Definição |
|-------|-----------|
| **Tenant** | Empresa cliente da plataforma CredGuard |
| **Score** | Probabilidade de inadimplência entre 0 e 1 (0% a 100%) |
| **Bureau** | Empresa que fornece informações de crédito (Serasa, Boa Vista) |
| **Job** | Processamento em lote de um arquivo de clientes |
| **Cache Hit** | Consulta atendida pelo cache sem nova requisição ao bureau |
| **Cache Miss** | Consulta que requer nova requisição ao bureau |
| **Score Interno** | Score gerado apenas por modelos proprietários da CredGuard |
| **Score Híbrido** | Score que combina modelo interno (70%) com bureau (30%) |
| **Faixa de Risco** | Classificação do score em BAIXO, MÉDIO, ALTO ou CRÍTICO |
| **tRPC** | Framework TypeScript para APIs type-safe |
| **Multitenant** | Arquitetura que isola dados de múltiplos clientes na mesma infraestrutura |

---

## 12. Contato

**Desenvolvedor**: Giselle Falcão  
**E-mail**: giselle.falcao@credguard.com  
**Website**: https://credguard.manus.space  
**Documentação**: https://docs.credguard.com  
**Suporte**: support@credguard.com

---

**Nota Final**: Este documento técnico descreve as funcionalidades públicas e especificações da plataforma CredGuard. Detalhes proprietários sobre algoritmos de Machine Learning, features engineering, hiperparâmetros de modelos e outras informações confidenciais foram omitidos intencionalmente para proteção de segredos industriais da solução.

**Versão do Documento**: 1.0  
**Última Atualização**: Novembro 2025  
**Próxima Revisão**: Fevereiro 2026


---

## 13. Gerenciamento de Modelos ML

### 13.1 Upload de Modelos Customizados

A plataforma CredGuard permite que clientes enterprise façam upload de seus próprios modelos ML retreinados, oferecendo flexibilidade para empresas que desejam manter controle total sobre seus algoritmos de credit scoring.

#### 13.1.1 Endpoint de Upload

**POST /api/v1/models/upload**

Permite o upload de arquivos .pkl contendo modelos treinados com scikit-learn ou bibliotecas compatíveis.

**Requisitos do Modelo:**

| Requisito | Descrição |
|-----------|-----------|
| **Formato** | Arquivo .pkl serializado com pickle/joblib |
| **Tamanho Máximo** | 500 MB |
| **Método Obrigatório** | `predict(X)` que retorna probabilidades entre 0 e 1 |
| **Features** | Deve aceitar as mesmas features extraídas pelo sistema (ver seção 4.2.1) |

**Parâmetros da Requisição:**

```json
{
  "modelName": "meu_modelo_cartao_v2",
  "version": "2.1.0",
  "product": "CARTAO",
  "file": "<binary .pkl file>",
  "metrics": {
    "accuracy": 0.89,
    "precision": 0.87,
    "recall": 0.85,
    "f1_score": 0.86,
    "auc_roc": 0.92
  },
  "mlflowRunId": "abc123def456" // Opcional
}
```

**Processo de Validação:**

1. **Verificação de Formato**: Sistema valida que o arquivo é um pickle válido
2. **Teste de Carregamento**: Modelo é carregado em memória para verificar integridade
3. **Verificação de Interface**: Sistema confirma presença do método `predict()`
4. **Teste de Predição**: Executa predição com dados sintéticos para validar output
5. **Armazenamento**: Modelo aprovado é salvo no S3 com status "uploaded"

**Resposta de Sucesso:**

```json
{
  "success": true,
  "modelVersionId": 42,
  "status": "uploaded",
  "s3Url": "https://s3.amazonaws.com/credguard-models/...",
  "validation": {
    "type": "RandomForestClassifier",
    "size": 45678912
  }
}
```

#### 13.1.2 Integração com MLflow

A plataforma oferece integração nativa com MLflow para rastreamento de experimentos e versionamento de modelos. Clientes podem registrar seus modelos no MLflow durante o treinamento e referenciar o `runId` no upload.

**Benefícios da Integração MLflow:**

- **Rastreabilidade**: Histórico completo de experimentos, hiperparâmetros e métricas
- **Reprodutibilidade**: Capacidade de reproduzir exatamente qualquer versão de modelo
- **Comparação**: Interface visual para comparar performance entre versões
- **Governança**: Auditoria completa de quem treinou, quando e com quais dados

### 13.2 Promoção de Modelos para Produção

#### 13.2.1 Endpoint de Promoção

**POST /api/v1/models/promote**

Promove um modelo validado para ambiente de produção, substituindo o modelo atual.

**Parâmetros da Requisição:**

```json
{
  "modelVersionId": 42,
  "product": "CARTAO",
  "reason": "Drift detectado - PSI 0.28. Novo modelo com acurácia 2% superior."
}
```

**Processo de Promoção:**

1. **Backup Automático**: Modelo atual em produção é arquivado com timestamp
2. **Download do S3**: Novo modelo é baixado do S3 para diretório de produção
3. **Atualização de Status**: Modelo anterior marcado como "archived", novo como "production"
4. **Registro de Deployment**: Criação de registro em `model_deployments` para auditoria
5. **Reinicialização**: Serviço ML é reiniciado para carregar novo modelo (zero downtime)

**Resposta de Sucesso:**

```json
{
  "success": true,
  "productionPath": "/opt/credguard/ml_models/fa_12.pkl",
  "backupPath": "/opt/credguard/ml_models/archive/fa_12_1699876543.pkl",
  "deploymentId": 15
}
```

#### 13.2.2 Rollback de Modelos

Em caso de problemas com modelo recém-promovido, é possível fazer rollback para versão anterior:

**POST /api/v1/models/rollback**

```json
{
  "product": "CARTAO",
  "targetVersionId": 38 // Versão anterior
}
```

### 13.3 Listagem e Histórico de Modelos

**GET /api/v1/models/list?product=CARTAO**

Retorna todas as versões de modelos do tenant, ordenadas por data de criação.

**Resposta:**

```json
{
  "models": [
    {
      "id": 42,
      "modelName": "meu_modelo_cartao_v2",
      "version": "2.1.0",
      "product": "CARTAO",
      "status": "production",
      "metrics": {
        "accuracy": 0.89,
        "auc_roc": 0.92
      },
      "uploadedBy": "João Silva",
      "promotedBy": "Maria Santos",
      "promotedAt": "2025-11-10T14:30:00Z",
      "createdAt": "2025-11-08T10:15:00Z"
    },
    {
      "id": 38,
      "modelName": "meu_modelo_cartao_v1",
      "version": "2.0.0",
      "product": "CARTAO",
      "status": "archived",
      ...
    }
  ]
}
```

---

## 14. Monitoramento de Drift

### 14.1 O Que é Drift de Modelos

Drift (ou degradação) de modelos ML ocorre quando a distribuição dos dados de entrada ou a relação entre features e target muda ao longo do tempo, causando queda na performance do modelo. No contexto de credit scoring, drift pode ser causado por:

- **Mudanças Econômicas**: Recessão, inflação ou mudanças em taxas de juros alteram comportamento de pagamento
- **Mudanças Demográficas**: Perfil dos clientes da empresa muda (ex: expansão para novas regiões)
- **Mudanças de Produto**: Alterações em políticas de crédito ou condições de pagamento
- **Sazonalidade**: Comportamento diferente em períodos específicos (fim de ano, férias)

### 14.2 Detecção Automática de Drift

A plataforma CredGuard implementa monitoramento contínuo de drift através de três métricas principais:

#### 14.2.1 PSI (Population Stability Index)

O PSI mede a mudança na distribuição dos scores entre dois períodos:

**Fórmula:**

```
PSI = Σ (atual% - baseline%) × ln(atual% / baseline%)
```

**Interpretação:**

| PSI | Status | Ação Recomendada |
|-----|--------|------------------|
| < 0.1 | Estável | Nenhuma ação necessária |
| 0.1 - 0.25 | Atenção | Monitorar de perto |
| > 0.25 | Crítico | Retreinamento urgente |

#### 14.2.2 Feature Drift

Monitora mudanças na distribuição de cada feature individual:

- **Ticket Médio**: Aumento/diminuição significativa pode indicar mudança no perfil de clientes
- **Taxa de Adimplência**: Mudanças podem refletir alterações econômicas
- **Recência**: Alterações podem indicar mudanças em padrões de compra

#### 14.2.3 Performance Drift

Compara métricas de performance do modelo em produção vs baseline:

- **Acurácia**: Queda > 5% indica degradação
- **AUC-ROC**: Queda > 0.05 indica perda de capacidade discriminatória
- **Calibração**: Scores não refletem mais probabilidades reais

### 14.3 Alertas Automáticos

Quando drift é detectado, o sistema:

1. **Registra Evento**: Salva detalhes do drift em `drift_monitoring`
2. **Classifica Severidade**: Define como "warning" ou "critical"
3. **Notifica Stakeholders**: Envia e-mail para administradores do tenant
4. **Cria Ticket**: Se cliente possui plano de sustentação, cria ticket automaticamente
5. **Sugere Ação**: Recomenda retreinamento ou investigação adicional

---

## 15. Plano de Sustentação de Modelos

### 15.1 Visão Geral

O **Plano de Sustentação** é um serviço gerenciado oferecido pela equipe CredGuard para garantir que os modelos ML permaneçam performáticos ao longo do tempo. Clientes que contratam o plano delegam a responsabilidade de monitoramento, retreinamento e manutenção dos modelos para especialistas da CredGuard.

### 15.2 Modalidades de Plano

#### 15.2.1 Plano Basic

| Característica | Descrição |
|----------------|-----------|
| **Preço** | R$ 2.500/mês |
| **Retreinamentos Incluídos** | 1 por mês |
| **SLA de Resposta** | 48 horas |
| **Monitoramento** | Semanal |
| **Suporte** | E-mail |

**Ideal para:** Empresas com volume baixo a médio de transações e modelos estáveis.

#### 15.2.2 Plano Premium

| Característica | Descrição |
|----------------|-----------|
| **Preço** | R$ 7.500/mês |
| **Retreinamentos Incluídos** | 3 por mês |
| **SLA de Resposta** | 24 horas |
| **Monitoramento** | Diário |
| **Suporte** | E-mail + Chat |
| **Extras** | Análise de features customizadas |

**Ideal para:** Empresas com alto volume e necessidade de ajustes frequentes.

#### 15.2.3 Plano Enterprise

| Característica | Descrição |
|----------------|-----------|
| **Preço** | R$ 15.000/mês |
| **Retreinamentos Incluídos** | Ilimitados |
| **SLA de Resposta** | 4 horas |
| **Monitoramento** | Tempo real |
| **Suporte** | Dedicado (Slack/WhatsApp) |
| **Extras** | Cientista de dados dedicado, customizações de modelo |

**Ideal para:** Grandes empresas com requisitos críticos de performance.

### 15.3 Workflow de Sustentação

#### Etapa 1: Detecção de Drift

Sistema detecta PSI > 0.25 ou queda de acurácia > 5%.

#### Etapa 2: Criação Automática de Ticket

Ticket é criado em `sustentation_tickets` com:
- **Tipo**: "drift_alert"
- **Status**: "pending"
- **Prioridade**: Baseada em severidade do drift
- **Descrição**: Detalhes técnicos do drift detectado

#### Etapa 3: Análise pela Equipe CredGuard

Analista da CredGuard:
1. Revisa métricas de drift
2. Investiga causas raízes (mudanças econômicas, sazonalidade, etc)
3. Define se retreinamento é necessário
4. Atualiza ticket para status "analyzing"

#### Etapa 4: Solicitação de Dados

Se retreinamento for necessário:
1. Sistema envia e-mail para cliente solicitando dados rotulados recentes
2. Cliente faz upload de CSV com outcomes reais (inadimplência sim/não)
3. Ticket atualizado para "collecting_data"

#### Etapa 5: Retreinamento

Cientista de dados CredGuard:
1. Combina dados históricos com novos dados rotulados
2. Treina novo modelo com hiperparâmetros otimizados
3. Registra experimento no MLflow
4. Ticket atualizado para "retraining"

#### Etapa 6: Validação

Modelo retreinado é validado:
1. Métricas comparadas com baseline
2. Testes A/B em subset de dados
3. Aprovação do cliente (se necessário)
4. Ticket atualizado para "validating"

#### Etapa 7: Deploy

Modelo aprovado é promovido para produção:
1. Upload via endpoint `/api/v1/models/upload`
2. Promoção via endpoint `/api/v1/models/promote`
3. Monitoramento pós-deploy por 7 dias
4. Ticket fechado com status "completed"

### 15.4 Endpoints do Plano de Sustentação

#### 15.4.1 Contratar Plano

**POST /api/v1/sustentation/subscribe**

```json
{
  "planType": "premium"
}
```

#### 15.4.2 Solicitar Suporte Manual

**POST /api/v1/sustentation/request-support**

```json
{
  "product": "CARTAO",
  "description": "Notei queda na performance do modelo nos últimos 15 dias",
  "priority": "high"
}
```

#### 15.4.3 Listar Tickets

**GET /api/v1/sustentation/tickets?status=pending**

Retorna tickets de sustentação do tenant.

### 15.5 Benefícios do Plano

- **Tranquilidade**: Equipe especializada cuida da manutenção dos modelos
- **Performance Garantida**: SLA de resposta e retreinamento proativo
- **Expertise**: Acesso a cientistas de dados experientes em credit scoring
- **Economia de Tempo**: Empresa foca no core business, não em ML ops
- **Compliance**: Documentação completa de retreinamentos para auditoria

---

## 16. Runbooks Operacionais

A plataforma CredGuard inclui quatro runbooks detalhados para operação e manutenção:

### 16.1 RUNBOOK_OPERATIONS.md

Procedimentos diários, semanais e mensais para manter a plataforma saudável:

- **Checklist Matinal**: Verificação de serviços, logs, métricas e jobs
- **Monitoramento de Drift**: Processo diário de verificação de PSI
- **Backup e Recuperação**: Validação de backups e testes de restauração
- **Limpeza de Dados**: Arquivamento de dados antigos e otimização de tabelas

### 16.2 RUNBOOK_TROUBLESHOOTING.md

Soluções para problemas comuns:

- **Backend Não Responde**: Diagnóstico e reinicialização de serviços
- **Jobs Travados**: Identificação e reprocessamento de jobs
- **Modelos ML Não Carregam**: Restauração de modelos do backup
- **Drift Detectado**: Workflow de resposta a alertas de drift
- **Banco de Dados Lento**: Otimização de queries e índices

### 16.3 RUNBOOK_MAINTENANCE.md

Manutenção preventiva e corretiva:

- **Manutenção Mensal**: Limpeza de dados, atualização de modelos
- **Manutenção Trimestral**: Retreinamento preventivo, auditoria de segurança
- **Política de Backup**: Frequência, retenção e testes de restauração

### 16.4 Acesso aos Runbooks

Todos os runbooks estão disponíveis no repositório do projeto:

```
/home/ubuntu/behavior-kab-saas-web/RUNBOOK_*.md
```

---

## 17. Roadmap Futuro

### 17.1 Curto Prazo (3-6 meses)

- **API de Predição em Tempo Real**: Endpoint para scoring individual (não apenas batch)
- **Dashboard de Monitoramento**: Interface visual para acompanhar drift e performance
- **Explicabilidade de Modelos**: SHAP values para entender decisões do modelo
- **Integração com Mais Bureaus**: Quod, SPC Brasil

### 17.2 Médio Prazo (6-12 meses)

- **AutoML**: Retreinamento automático quando drift for detectado
- **Modelos Ensemble**: Combinação de múltiplos modelos para maior acurácia
- **Análise de Fraude**: Detecção de padrões suspeitos além de inadimplência
- **Mobile App**: Aplicativo para gestores acompanharem métricas em tempo real

### 17.3 Longo Prazo (12+ meses)

- **Deep Learning**: Modelos neurais para capturar padrões complexos
- **Federated Learning**: Treinamento colaborativo entre clientes sem compartilhar dados
- **Mercado de Modelos**: Marketplace onde clientes podem compartilhar/vender modelos
- **Expansão Internacional**: Suporte a bureaus de outros países

---

**Fim da Documentação Técnica - CredGuard v1.0**
