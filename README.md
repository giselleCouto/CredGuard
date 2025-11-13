# CredGuard - Plataforma de Análise de Risco de Crédito

**CredGuard** é uma plataforma SaaS completa para análise de risco de crédito baseada em Machine Learning, desenvolvida para instituições financeiras que precisam avaliar a probabilidade de inadimplência de clientes em diferentes produtos de crédito (Cartão, Carnê, Empréstimo Pessoal).

## 🎯 Funcionalidades Principais

### 📊 Análise de Risco em Lote
- Upload de arquivos CSV com dados de clientes
- Processamento assíncrono de grandes volumes (centenas de registros)
- Geração automática de scores de risco (A, B, C, D, E)
- Cálculo de probabilidade de inadimplência
- Sugestão de limite de crédito baseado no perfil

### 🤖 Gestão de Modelos ML
- Upload e versionamento de modelos de Machine Learning (.pkl)
- Métricas de performance (accuracy, precision, recall, F1-score, AUC)
- Promoção de modelos para produção
- Histórico completo de deployments
- Suporte a múltiplos produtos (Cartão, Carnê, Empréstimo)

### 📈 Monitoramento de Drift
- Detecção automática de degradação de modelos
- Cálculo de PSI (Population Stability Index)
- Alertas de drift moderado e crítico
- Gráficos de evolução temporal
- Histórico de detecções com análise por feature

### 🏦 Integração com Bureau de Crédito
- Consulta automática de score Serasa/Boa Vista
- Cache inteligente de consultas (redução de custos)
- Enriquecimento de dados com pendências e protestos
- Métricas de uso e estimativa de custos mensais
- Configuração por tenant (multi-empresa)

### 📋 Histórico e Relatórios
- Busca de predições por CPF, período e tipo de crédito
- Visualização detalhada de cada análise
- Paginação e filtros avançados
- Exportação de resultados
- Isolamento de dados por tenant (segurança)

### 🎫 Plano de Sustentação
- Gestão de tickets de retreinamento
- SLA de resposta configurável
- Priorização automática (low, medium, high, critical)
- Rastreamento de status (pending → analyzing → retraining → completed)
- Integração com detecção de drift

## 🏗️ Arquitetura

### Stack Tecnológico

**Frontend:**
- React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- tRPC para comunicação type-safe
- Recharts para visualizações
- Wouter para roteamento

**Backend:**
- Node.js + Express 4
- tRPC 11 (type-safe API)
- Drizzle ORM (MySQL/TiDB)
- Manus OAuth (autenticação)
- S3 para storage de modelos

**Infraestrutura:**
- Vite para build e dev server
- ESBuild para bundling do servidor
- GitHub Actions para CI/CD
- Manus Platform para deploy

### Estrutura de Diretórios

```
behavior-kab-saas-web/
├── client/                 # Frontend React
│   ├── public/            # Assets estáticos
│   └── src/
│       ├── pages/         # Páginas da aplicação
│       ├── components/    # Componentes reutilizáveis
│       ├── lib/           # Utilitários e configurações
│       └── contexts/      # Contextos React
├── server/                # Backend Node.js
│   ├── _core/            # Infraestrutura (OAuth, LLM, etc)
│   ├── db.ts             # Query helpers
│   └── routers.ts        # Endpoints tRPC
├── drizzle/              # Schema e migrações do banco
│   └── schema.ts         # Definição de tabelas
├── storage/              # Helpers S3
├── shared/               # Tipos compartilhados
└── seed-db.mjs          # Script de dados sintéticos
```

## 🚀 Instalação e Desenvolvimento

### Pré-requisitos

- Node.js 20.19+ ou 22.12+
- pnpm (gerenciador de pacotes)
- MySQL ou TiDB (banco de dados)
- Conta Manus (para OAuth e deploy)

### Configuração Local

1. **Clone o repositório:**
```bash
git clone https://github.com/giselleCouto/CredGuard.git
cd CredGuard
```

2. **Instale as dependências:**
```bash
pnpm install
```

3. **Configure variáveis de ambiente:**

Crie um arquivo `.env` na raiz com:
```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-jwt-secret
VITE_APP_TITLE=CredGuard
APIBRASIL_TOKEN=your-bureau-api-token  # Opcional
```

4. **Execute as migrações:**
```bash
pnpm db:push
```

5. **Popule o banco com dados de teste (opcional):**
```bash
pnpm exec tsx seed-db.mjs
```

6. **Inicie o servidor de desenvolvimento:**
```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`

## 📦 Build e Deploy

### Build Local

```bash
pnpm build
```

Gera:
- `dist/client/` - Frontend otimizado
- `dist/index.js` - Backend bundled

### Deploy na Manus Platform

1. Salve um checkpoint via interface do Manus
2. Clique em **Publish** no Management UI
3. Configure variáveis de ambiente em Settings → Secrets
4. (Opcional) Configure domínio customizado em Settings → Domains

## 🗄️ Modelo de Dados

### Principais Tabelas

**users** - Usuários autenticados
- `id`, `openId`, `name`, `email`, `role`, `tenantId`

**batch_jobs** - Jobs de processamento em lote
- `id`, `jobId`, `fileName`, `status`, `totalRows`, `processedRows`

**customer_data** - Dados brutos dos clientes
- `id`, `cpf`, `nome`, `email`, `renda`, `produto`, `dataCompra`

**customer_scores** - Scores gerados
- `id`, `cpf`, `produto`, `scoreProbInadimplencia`, `faixaScore`, `scoreSerasa`

**model_versions** - Versões de modelos ML
- `id`, `modelName`, `version`, `product`, `filePath`, `metrics`, `status`

**drift_monitoring** - Detecções de drift
- `id`, `product`, `psi`, `status`, `featureDrift`, `checkedAt`

**bureau_cache** - Cache de consultas de bureau
- `id`, `cpf`, `scoreSerasa`, `pendencias`, `protestos`, `cachedAt`

**sustentation_tickets** - Tickets de sustentação
- `id`, `product`, `type`, `status`, `priority`, `driftMonitoringId`

## 🔐 Segurança e Isolamento

### Multi-tenancy
- Cada empresa (tenant) vê apenas seus próprios dados
- Filtro automático por `ctx.user.tenantId` em todas as queries
- Impossível acessar dados de outros tenants

### Autenticação
- OAuth com sessão via cookie
- JWT para validação de sessão
- Rotas protegidas com `protectedProcedure`

### Roles
- `admin` - Acesso total (owner do projeto)
- `user` - Acesso limitado às funcionalidades do tenant

## 📊 Dados Sintéticos para Testes

O script `seed-db.mjs` gera dados realistas:
- 8 batch jobs com diferentes status
- 241 clientes com CPFs válidos
- 241 scores gerados
- 6 versões de modelos ML
- 10 detecções de drift
- 30 consultas de bureau em cache
- 1 plano de sustentação ativo
- 5 tickets de suporte

Execute: `pnpm exec tsx seed-db.mjs`

## 🛠️ Desenvolvimento

### Adicionar Nova Feature

1. Atualize `drizzle/schema.ts` com novas tabelas
2. Execute `pnpm db:push` para aplicar migrações
3. Adicione query helpers em `server/db.ts`
4. Crie procedures em `server/routers.ts`
5. Implemente UI em `client/src/pages/`
6. Use `trpc.*.useQuery/useMutation` no frontend

### Boas Práticas

- **Type-safety:** Use tRPC para contratos type-safe entre frontend e backend
- **Optimistic updates:** Use para operações de lista (add/edit/delete)
- **Loading states:** Sempre mostre feedback visual durante operações assíncronas
- **Error handling:** Capture erros com `onError` nas mutations
- **Isolamento:** Sempre filtre por `ctx.user.tenantId` em queries protegidas

## 📝 Scripts Disponíveis

```bash
pnpm dev          # Inicia dev server (frontend + backend)
pnpm build        # Build de produção
pnpm db:push      # Aplica migrações do banco
pnpm exec tsx     # Executa scripts TypeScript
```

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é propriedade privada. Todos os direitos reservados.

## 📧 Contato

Para dúvidas ou suporte, entre em contato através do GitHub Issues.

---

**Desenvolvido por Giselle Falcão**
