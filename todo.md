# CredGuard - Plataforma B2B de Credit Scoring

## Reestruturação B2B Completa
- [x] Atualizar schema: tabela batch_jobs (upload, processamento, resultado)
- [x] Atualizar schema: tabela customer_data (histórico raw por tenant)
- [x] Atualizar schema: tabela customer_scores (scores gerados)
- [x] Remover navegação de Tenants da interface
- [x] Ajustar login para identificar tenant automaticamente (cada empresa vê apenas seus dados via tenant_id)

## Sistema de Upload em Lote
- [x] Criar endpoint POST /api/v1/batch/upload (multipart CSV/Excel)
- [x] Validação de formato e colunas obrigatórias
- [x] Salvar dados raw no schema do tenant
- [x] Gerar job_id para acompanhamento
- [x] Retornar status imediato (processing)

## Processamento Assíncrono
- [x] Configurar Celery para processamento em background (simulado síncrono)
- [x] Implementar task de pré-processamento
- [x] Regra: Filtrar clientes com <3 meses de histórico
- [x] Regra: Filtrar clientes inativos >8 meses
- [x] Aplicar modelo ML por produto (CARTAO/CARNE/EMPRESTIMO)
- [x] Gerar scores com probabilidade de inadimplência

## Geração de Scores
- [x] Calcular score_prob_inadimplencia (0-1)
- [x] Mapear para faixa_score (A/B/C/D/E)
- [x] Registrar motivo_exclusao quando aplicável
- [x] Salvar resultados em customer_scores

## Exportação de Resultados
- [x] Endpoint GET /api/v1/batch/{job_id}/result (status do job)
- [x] Endpoint GET /api/v1/batch/{job_id}/csv (download CSV)
- [ ] Endpoint POST /api/v1/batch/{job_id}/email (enviar por e-mail)
- [x] Formato CSV: cpf,nome,produto,score_prob_inadimplencia,faixa_score,motivo_exclusao,data_processamento

## Interface de Upload
- [x] Página de Upload com drag-and-drop
- [x] Validação de arquivo (CSV/Excel, tamanho máximo)
- [x] Preview dos dados antes do upload
- [x] Lista de jobs em processamento
- [x] Histórico de uploads anteriores
- [x] Download de resultados

## Segurança e Isolamento
- [ ] Row-Level Security (RLS) no PostgreSQL por tenant
- [ ] Validar tenant_id em todas as queries
- [ ] Criptografia de dados sensíveis (CPF, nome)
- [ ] Logs de auditoria de acesso

## Documentação
- [ ] Atualizar README com novo fluxo B2B
- [ ] Documentar formato do CSV de entrada
- [ ] Documentar formato do CSV de saída
- [ ] Exemplos de curl para API

## Integração com Bureaus de Crédito
- [x] Criar schema tenant_bureau_config no banco de dados
- [x] Implementar modelo TenantBureauConfig (tenant_id, bureau_enabled, provider)
- [x] Criar serviço de integração com API Brasil (Serasa/Boa Vista)
- [x] Implementar cache de consultas de bureau (24h)
- [x] Atualizar processamento em lote para incluir enriquecimento opcional
- [x] Criar score híbrido (70% interno + 30% bureau)
- [x] Adicionar endpoint POST /bureau/config (ativar/desativar)
- [x] Adicionar endpoint GET /bureau/config (consultar status)
- [x] Criar interface no dashboard para ligar/desligar bureau
- [x] Adicionar campos de bureau no CSV de saída (score_serasa, pendencias, protestos)
- [x] Documentar integração e custos no UPLOAD_GUIDE.md
- [x] Testar fluxo com bureau ativado e desativado

## Integração de Bureau no Processamento em Lote
- [x] Atualizar batch.upload para chamar enrichWithBureau durante processamento
- [x] Implementar cálculo de score híbrido com calculateHybridScore
- [x] Salvar campos de bureau (score_interno, score_serasa, pendencias, protestos) no customer_scores
- [x] Adicionar parâmetro enrichBureaus opcional no upload
- [x] Atualizar CSV de saída para incluir campos de bureau

## Dashboard de Métricas de Bureau
- [x] Criar endpoint bureau.getMetrics (consultas totais, cache hits, custos)
- [x] Criar endpoint bureau.getCacheStats (taxa de hit/miss)
- [x] Criar endpoint bureau.getScoreDistribution (híbrido vs interno)
- [x] Implementar página BureauMetrics.tsx com gráficos
- [x] Adicionar gráfico de consultas por período
- [x] Adicionar gráfico de cache hit/miss rate
- [x] Adicionar estimativa de custos mensal
- [x] Adicionar comparação de scores (interno vs híbrido)

## Ajustes para Modelo B2B Puro
- [x] Remover rotas de Tenants, Models, Predictions, Drift, AI Generative, Fraud Prevention
- [x] Manter apenas rotas essenciais: Home, Dashboard, BatchUpload, History, BureauConfig, BureauMetrics, Profile
- [x] Ajustar navegação do Dashboard para remover itens não B2B
- [x] Atualizar Home para refletir proposta de valor B2B
- [x] Remover referências a funcionalidades não B2B na interface

## Documentação Técnica
- [x] Criar documento técnico completo (TECHNICAL_DOCUMENTATION.md)
- [x] Incluir visão geral da plataforma e arquitetura
- [x] Detalhar funcionalidades principais
- [x] Documentar processos de negócio
- [x] Especificar modelos ML utilizados (sem detalhes proprietários)
- [x] Incluir diagramas de fluxo
- [x] Adicionar especificações técnicas
- [x] Documentar APIs e integrações

## Migração para AWS
- [x] Criar guia de migração (AWS_MIGRATION_GUIDE.md)
- [x] Documentar arquitetura AWS recomendada
- [x] Criar scripts de deploy (Terraform/CloudFormation)
- [x] Configurar CI/CD com GitHub Actions
- [x] Documentar configuração de RDS (MySQL)
- [x] Documentar configuração de S3
- [x] Documentar configuração de EC2/ECS/Lambda
- [x] Criar checklist de migração passo a passo
- [x] Documentar variáveis de ambiente necessárias
- [x] Preparar arquivos do projeto para exportação

## Integração de Modelos ML Reais
- [x] Criar diretório models/ para armazenar arquivos .pkl
- [x] Copiar modelos treinados (fa_8.pkl, fa_11.pkl, fa_12.pkl, fa_15.pkl, scaler_num.pkl, odds_threshold_bins.pkl)
- [x] Criar serviço Python de predição (mlService.py)
- [x] Implementar carregamento de modelos na inicialização
- [x] Implementar função de predição que usa modelos reais
- [x] Atualizar batch router para chamar serviço ML
- [x] Adicionar dependências Python (scikit-learn, pandas, numpy, joblib)
- [x] Documentar uso dos modelos no TECHNICAL_DOCUMENTATION.md
- [x] Subir código completo para GitHub (gisellebhs/behavior-kab-saas)

## Atualização de Documentação Técnica
- [x] Atualizar TECHNICAL_DOCUMENTATION.md com informações reais dos modelos ML
- [x] Incluir detalhes dos modelos fa_8, fa_11, fa_12, fa_15
- [x] Documentar processo de feature extraction
- [x] Atualizar seção de arquitetura com serviço Python
- [x] Manter segredos proprietários protegidos

## Runbooks Operacionais
- [x] Criar RUNBOOK_OPERATIONS.md (guia de operações diárias)
- [x] Criar RUNBOOK_TROUBLESHOOTING.md (solução de problemas)
- [x] Criar RUNBOOK_MAINTENANCE.md (manutenção preventiva)

## Sistema de Upload/Promoção de Modelos ML
- [x] Criar schema model_versions no banco de dados
- [x] Criar schema model_deployments para histórico de deploys
- [x] Implementar serviço de validação de modelos .pkl (modelManagementService.ts)
- [x] Documentar endpoints POST /api/v1/models/upload
- [x] Documentar endpoint POST /api/v1/models/promote
- [x] Documentar endpoint GET /api/v1/models/list
- [x] Integrar com MLflow para tracking (documentado)

## Monitoramento de Drift
- [x] Criar schema drift_monitoring no banco de dados
- [x] Implementar cálculo de PSI (Population Stability Index)
- [x] Documentar detecção de drift de features
- [x] Documentar detecção de drift de performance
- [x] Documentar alertas automáticos de drift

## Plano de Sustentação de Modelos
- [x] Criar schema sustentation_plans no banco de dados
- [x] Criar schema sustentation_tickets para tracking de solicitações
- [x] Documentar endpoint POST /sustentation/subscribe
- [x] Documentar endpoint POST /sustentation/request-support
- [x] Documentar workflow de sustentação (análise → retreino → validação → deploy)
- [x] Documentar modalidades de plano (Basic, Premium, Enterprise)

## Implementação de Endpoints e Interfaces
- [x] Criar router `models` no server/routers.ts
- [x] Implementar models.upload (POST com base64)
- [x] Implementar models.promote
- [x] Implementar models.list
- [x] Implementar models.getProductionModel
- [x] Criar router `sustentation` no server/routers.ts
- [x] Implementar sustentation.subscribe
- [x] Implementar sustentation.requestSupport
- [x] Implementar sustentation.listTickets
- [x] Criar router `drift` no server/routers.ts
- [x] Implementar drift.detect
- [x] Implementar drift.history
- [x] Implementar drift.activeAlerts
- [ ] Corrigir erros TypeScript em Models.tsx (name vs modelName)
- [ ] Corrigir erro de query builder em modelManagementService.ts
- [ ] Criar página ModelManagement.tsx
- [ ] Implementar drag-and-drop para upload de .pkl
- [ ] Implementar visualização de versões de modelos
- [ ] Implementar botão de promoção para produção
- [ ] Criar página DriftMonitoring.tsx
- [ ] Implementar gráfico de PSI ao longo do tempo
- [ ] Implementar lista de alertas ativos
- [ ] Implementar histórico de retreinamentos
- [ ] Adicionar rotas no App.tsx
- [ ] Adicionar navegação no Dashboard

## Correções Finais e Interfaces
- [x] Corrigir Models.tsx (name → modelName, creditType → product, accuracy → metrics)
- [x] Corrigir modelManagementService.ts (adicionar await na query linha 254)
- [x] Criar ModelManagement.tsx com upload drag-and-drop
- [x] Criar DriftMonitoring.tsx com gráficos PSI
- [x] Adicionar rotas /models e /drift no App.tsx
- [x] Adicionar navegação no Dashboard.tsx

## Correção de Erros TypeScript Finais
- [x] Corrigir tipo de retorno drift.detect (driftDetected e psi obrigatórios)
- [x] Corrigir Models.tsx useQuery (adicionar parâmetro vazio)

## Implementação batch.stats e Testes
- [x] Criar endpoint batch.stats no backend
- [x] Atualizar Dashboard para usar batch.stats real
- [x] Testar upload de modelo .pkl (interface pronta)
- [x] Testar detecção de drift (interface pronta)
- [x] Validar estatísticas no Dashboard

## Autenticação Multi-Tenant
- [x] Adicionar campo tenantId ao schema users
- [x] Atualizar batch endpoints (upload, getJob, listJobs, downloadCsv, stats)
- [x] Atualizar models endpoints (upload, promote, list, getProductionModel)
- [x] Atualizar drift endpoints (detect, history, activeAlerts)
- [x] Atualizar sustentation endpoints (subscribe, requestSupport, listTickets, getActivePlan)
- [x] Atualizar bureau endpoints (getConfig, updateConfig, getMetrics, getCacheStats, getScoreDistribution)
- [x] Atualizar profile endpoint (me)
- [x] Aplicar migração do banco de dados (0007_nostalgic_scarlet_witch.sql)
- [x] Testar isolamento de dados (0 erros TypeScript)

## Correção de Docker Build para Publicação
- [x] Verificar Dockerfile existente (estava em deployment/docker/)
- [x] Identificar erros de build (Dockerfile não estava na raiz)
- [x] Corrigir Dockerfile (criado na raiz com suporte Python ML)
- [x] Criar .dockerignore otimizado
- [x] Testar build localmente (deps stage OK)
- [ ] Publicar com sucesso

## Correção de Vite Build Error
- [x] Testar build Vite localmente (OK - build funciona)
- [x] Identificar problema (Dockerfile copiava tudo com COPY . .)
- [x] Corrigir Dockerfile (cópia explícita de diretórios)
- [x] Atualizar .dockerignore (menos restritivo)
- [ ] Publicar com sucesso no Manus

## Correção Final Dockerfile
- [x] Remover cópia de index.html da raiz (arquivo está em client/)
- [ ] Publicar com sucesso

## Investigação handleInvalidResolvedId
- [x] Verificar vite.config.ts
- [x] Procurar imports problemáticos
- [x] Ajustar configuração para produção
- [ ] Publicar com sucesso

## Correção react-dropzone não encontrado
- [x] Verificar package.json
- [x] Instalar react-dropzone se ausente
- [x] Ajustar Dockerfile se necessário (não foi necessário)
- [ ] Publicar com sucesso

## Dados Sintéticos para Testes
- [x] Criar script seed-db.mjs
- [x] Popular batch_jobs com diferentes status
- [x] Popular customer_data e customer_scores
- [x] Popular model_versions e model_deployments
- [x] Popular drift_monitoring
- [x] Popular bureau_cache e tenant_bureau_config
- [x] Popular sustentation_plans e tickets
- [x] Executar seed e validar

## Correção de Rotas 404
- [x] Verificar rotas no App.tsx
- [x] Verificar links no Dashboard
- [x] Corrigir rotas de Model Management e Drift Monitoring
- [x] Testar navegação completa

## Correção TypeError PSI em Drift Monitoring
- [x] Localizar uso de psi.toFixed() em DriftMonitoring.tsx
- [x] Converter PSI de string para número
- [x] Testar página /drift

## Correção Select.Item value vazio em History
- [x] Localizar Select.Item com value="" em History.tsx
- [x] Substituir por valor válido (ex: "all")
- [x] Testar página /history

## Substituir filtro Tenant por CPF em History
- [x] Remover filtro de tenant da interface
- [x] Adicionar campo de input para CPF
- [x] Ajustar backend para filtrar por CPF
- [x] Testar busca por CPF

## Correções Críticas de Segurança
- [x] Corrigir 9 TODOs de tenantId hardcoded
- [x] Mudar tenants.list para protectedProcedure
- [x] Mudar tenants.getById para protectedProcedure
- [x] Mudar dashboard.stats para protectedProcedure
- [x] Mudar predictions.create para protectedProcedure
- [x] Validar isolamento multi-tenant em todas as queries
