# Próximos Passos - Finalização de Endpoints e Interfaces

## Status Atual

✅ **Concluído:**
- Runbooks operacionais (Operations, Troubleshooting, Maintenance)
- Schema do banco de dados (model_versions, model_deployments, drift_monitoring, sustentation_plans, sustentation_tickets)
- Serviço modelManagementService.ts com funções de upload, promoção e drift
- Routers tRPC (`models`, `drift`, `sustentation`) com todos os endpoints

⚠️ **Pendente (Erros TypeScript a corrigir):**
- Erro em `Models.tsx`: Propriedades `name`, `creditType`, `accuracy` não existem no novo schema
- Erro em `modelManagementService.ts`: Query builder sem `.where()` na linha 254

## Correções Necessárias

### 1. Corrigir Models.tsx

**Arquivo:** `client/src/pages/Models.tsx`

**Problema:** A página Models.tsx está usando o schema antigo (name, creditType, accuracy) mas o novo schema usa (modelName, product, metrics).

**Solução:**
```tsx
// Linha 54: Trocar model.name por model.modelName
{model.modelName}

// Linha 55: Trocar model.creditType por model.product  
{model.product}

// Linha 58: Trocar model.accuracy por JSON.parse(model.metrics || '{}').accuracy
{JSON.parse(model.metrics || '{}').accuracy || 'N/A'}
```

### 2. Corrigir modelManagementService.ts

**Arquivo:** `server/modelManagementService.ts`

**Problema:** Linha 254 - Query builder retorna tipo sem `.where()`

**Solução:**
```typescript
// Linha 254: Adicionar await antes do db.select()
const versions = await db
  .select()
  .from(modelVersions)
  .where(eq(modelVersions.tenantId, tenantId))
  .orderBy(desc(modelVersions.createdAt));
```

## Interfaces a Criar

### 3. Página ModelManagement.tsx

**Localização:** `client/src/pages/ModelManagement.tsx`

**Funcionalidades:**
- Upload de arquivo .pkl com drag-and-drop (react-dropzone)
- Formulário: modelName, version, product, metrics (accuracy, precision, recall, f1_score, auc_roc)
- Tabela de versões de modelos com botão "Promover para Produção"
- Indicador visual de qual modelo está em produção

**Endpoints tRPC a usar:**
- `trpc.models.list.useQuery({ product: 'CARTAO' })`
- `trpc.models.upload.useMutation()`
- `trpc.models.promote.useMutation()`

### 4. Página DriftMonitoring.tsx

**Localização:** `client/src/pages/DriftMonitoring.tsx`

**Funcionalidades:**
- Gráfico de linha (Recharts) mostrando PSI ao longo do tempo
- Cards de alertas ativos com status (warning/critical)
- Tabela de histórico de drift com filtro por produto
- Botão "Detectar Drift Agora" que chama `drift.detect`

**Endpoints tRPC a usar:**
- `trpc.drift.history.useQuery({ product: 'CARTAO', limit: 50 })`
- `trpc.drift.activeAlerts.useQuery()`
- `trpc.drift.detect.useMutation()`

### 5. Adicionar Rotas no App.tsx

```tsx
import ModelManagement from "@/pages/ModelManagement";
import DriftMonitoring from "@/pages/DriftMonitoring";

// Dentro do Router:
<Route path="/models" component={ModelManagement} />
<Route path="/drift" component={DriftMonitoring} />
```

### 6. Adicionar Navegação no Dashboard.tsx

```tsx
// Adicionar itens no navigation array:
{
  name: "Gerenciar Modelos",
  href: "/models",
  icon: Cpu, // lucide-react
},
{
  name: "Monitoramento de Drift",
  href: "/drift",
  icon: AlertTriangle, // lucide-react
},
```

## Comandos para Testar

```bash
# 1. Verificar erros TypeScript
cd /home/ubuntu/behavior-kab-saas-web
pnpm tsc --noEmit

# 2. Testar endpoints tRPC (após corrigir erros)
# Abrir navegador em https://3000-..../dashboard
# Abrir DevTools Console e testar:
# await window.trpc.models.list.query({ product: 'CARTAO' })
# await window.trpc.drift.activeAlerts.query()

# 3. Reiniciar servidor
pnpm dev
```

## Checklist Final

- [ ] Corrigir Models.tsx (name → modelName, creditType → product, accuracy → metrics)
- [ ] Corrigir modelManagementService.ts (adicionar await na query)
- [ ] Criar ModelManagement.tsx
- [ ] Criar DriftMonitoring.tsx
- [ ] Adicionar rotas no App.tsx
- [ ] Adicionar navegação no Dashboard.tsx
- [ ] Testar upload de modelo .pkl
- [ ] Testar promoção de modelo
- [ ] Testar detecção de drift
- [ ] Atualizar TECHNICAL_DOCUMENTATION.md com endpoints finais
- [ ] Commit e push para GitHub
- [ ] Salvar checkpoint final

## Referências

- **Runbooks:** `RUNBOOK_OPERATIONS.md`, `RUNBOOK_TROUBLESHOOTING.md`, `RUNBOOK_MAINTENANCE.md`
- **Documentação Técnica:** `TECHNICAL_DOCUMENTATION.md` (Seções 13-17)
- **Schema:** `drizzle/schema.ts` (linhas finais com model_versions, drift_monitoring, etc)
- **Routers:** `server/routers.ts` (models, drift, sustentation)
- **Serviços:** `server/modelManagementService.ts`
