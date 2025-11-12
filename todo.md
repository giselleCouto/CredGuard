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
