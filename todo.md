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
