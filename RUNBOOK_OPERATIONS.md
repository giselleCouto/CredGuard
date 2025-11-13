# Runbook de Operações - CredGuard

**Versão:** 1.0.0  
**Última Atualização:** Novembro 2025  
**Responsável:** Equipe de Operações

---

## 1. Visão Geral

Este runbook documenta os procedimentos operacionais diários para manter a plataforma CredGuard funcionando de forma estável e segura. Todos os procedimentos devem ser executados conforme descrito para garantir consistência e rastreabilidade.

---

## 2. Checklist Diário de Operações

### 2.1 Verificação Matinal (08:00 - 09:00)

**Objetivo:** Garantir que todos os serviços estão operacionais e que não houve incidentes durante a noite.

#### Passo 1: Verificar Status dos Serviços

```bash
# Conectar ao servidor de produção
ssh ubuntu@credguard-prod-server

# Verificar status do backend
sudo systemctl status credguard-backend

# Verificar status do banco de dados
sudo systemctl status mysql

# Verificar uso de recursos
htop
df -h
free -h
```

**Critérios de Sucesso:**
- Backend: `active (running)`
- MySQL: `active (running)`
- CPU: < 70%
- Memória: < 80%
- Disco: < 85%

**Ação em Caso de Falha:** Consultar RUNBOOK_TROUBLESHOOTING.md seção correspondente.

#### Passo 2: Verificar Logs de Erro

```bash
# Logs do backend (últimas 100 linhas)
tail -n 100 /var/log/credguard/backend.log | grep -i error

# Logs do MySQL
sudo tail -n 100 /var/log/mysql/error.log

# Logs do Nginx (se aplicável)
sudo tail -n 100 /var/log/nginx/error.log
```

**Critérios de Sucesso:**
- Nenhum erro crítico (CRITICAL, FATAL)
- Erros conhecidos documentados no knowledge base

**Ação em Caso de Falha:** Investigar erros desconhecidos e escalar para equipe de desenvolvimento se necessário.

#### Passo 3: Verificar Métricas de Performance

Acesse o dashboard de monitoramento (CloudWatch, Grafana ou similar) e verifique:

| Métrica | Threshold | Ação se Exceder |
|---------|-----------|-----------------|
| Latência média API | < 200ms | Investigar queries lentas |
| Taxa de erro HTTP | < 1% | Verificar logs de aplicação |
| Conexões ativas DB | < 80% do máximo | Verificar connection pool |
| Tempo de processamento batch | < 5min para 1000 registros | Otimizar processamento |

#### Passo 4: Verificar Jobs de Processamento

```bash
# Conectar ao banco de dados
mysql -u credguard -p credguard

# Verificar jobs pendentes há mais de 1 hora
SELECT id, status, createdAt, fileName 
FROM batch_jobs 
WHERE status = 'processing' 
AND createdAt < DATE_SUB(NOW(), INTERVAL 1 HOUR);

# Verificar jobs com erro
SELECT id, status, error, createdAt 
FROM batch_jobs 
WHERE status = 'failed' 
AND createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

**Ação em Caso de Jobs Travados:**
1. Investigar logs do job específico
2. Verificar se o arquivo CSV está corrompido
3. Reprocessar manualmente se necessário

### 2.2 Verificação de Backup (09:00 - 09:30)

#### Passo 1: Verificar Backup do Banco de Dados

```bash
# Verificar último backup
ls -lht /backups/mysql/ | head -n 5

# Verificar tamanho do backup (deve ser consistente)
du -sh /backups/mysql/credguard-$(date +%Y%m%d)*.sql.gz
```

**Critérios de Sucesso:**
- Backup criado nas últimas 24 horas
- Tamanho similar aos backups anteriores (±20%)

**Ação em Caso de Falha:**
```bash
# Executar backup manual
sudo /opt/credguard/scripts/backup-database.sh
```

#### Passo 2: Testar Restauração de Backup (Semanal - Segunda-feira)

```bash
# Criar banco de teste
mysql -u root -p -e "CREATE DATABASE credguard_test;"

# Restaurar backup
gunzip < /backups/mysql/credguard-latest.sql.gz | mysql -u root -p credguard_test

# Verificar integridade
mysql -u root -p credguard_test -e "SELECT COUNT(*) FROM users;"

# Limpar
mysql -u root -p -e "DROP DATABASE credguard_test;"
```

### 2.3 Monitoramento de Drift (10:00 - 10:30)

#### Passo 1: Verificar Alertas de Drift

Acesse o dashboard de drift monitoring:

```
https://credguard.com/dashboard/drift-monitoring
```

Verifique:
- **PSI (Population Stability Index)**: < 0.1 (estável), 0.1-0.25 (atenção), > 0.25 (ação necessária)
- **Drift de Features**: Nenhuma feature com drift > 20%
- **Drift de Performance**: Acurácia não deve cair > 5% do baseline

**Ação em Caso de Drift Detectado:**
1. Registrar incidente no sistema de tickets
2. Notificar cliente se ele possui plano de sustentação
3. Se não possui plano, enviar e-mail sugerindo contratação
4. Consultar seção 5 deste runbook para procedimento de retreinamento

### 2.4 Verificação de Segurança (11:00 - 11:30)

#### Passo 1: Revisar Logs de Acesso

```bash
# Verificar tentativas de login falhadas
sudo grep "Failed password" /var/log/auth.log | tail -n 50

# Verificar acessos suspeitos à API
tail -n 1000 /var/log/credguard/access.log | grep -E "401|403|429"
```

**Critérios de Sucesso:**
- Menos de 10 tentativas falhadas de login por hora
- Nenhum IP com mais de 50 requisições 401/403 em 5 minutos

**Ação em Caso de Atividade Suspeita:**
1. Bloquear IP no firewall: `sudo ufw deny from <IP>`
2. Registrar incidente de segurança
3. Notificar equipe de segurança

#### Passo 2: Verificar Certificados SSL

```bash
# Verificar validade do certificado
echo | openssl s_client -servername credguard.com -connect credguard.com:443 2>/dev/null | openssl x509 -noout -dates
```

**Ação se Certificado Expira em < 30 Dias:**
```bash
# Renovar certificado Let's Encrypt
sudo certbot renew
sudo systemctl reload nginx
```

### 2.5 Limpeza de Dados (Diário - 14:00)

#### Passo 1: Limpar Cache de Bureau Expirado

```bash
mysql -u credguard -p credguard << EOF
DELETE FROM bureau_cache 
WHERE expiresAt < NOW();
EOF
```

#### Passo 2: Arquivar Jobs Antigos (Mensal - Primeiro dia do mês)

```bash
# Exportar jobs com mais de 90 dias para arquivo
mysqldump -u credguard -p credguard batch_jobs customer_scores \
  --where="createdAt < DATE_SUB(NOW(), INTERVAL 90 DAY)" \
  > /archives/jobs-$(date +%Y%m).sql

# Deletar jobs arquivados
mysql -u credguard -p credguard << EOF
DELETE FROM customer_scores WHERE batchJobId IN (
  SELECT id FROM batch_jobs WHERE createdAt < DATE_SUB(NOW(), INTERVAL 90 DAY)
);
DELETE FROM batch_jobs WHERE createdAt < DATE_SUB(NOW(), INTERVAL 90 DAY);
EOF
```

---

## 3. Procedimentos Semanais

### 3.1 Segunda-feira: Revisão de Capacidade

#### Passo 1: Analisar Crescimento de Dados

```bash
# Tamanho do banco de dados
mysql -u credguard -p -e "
SELECT 
  table_name AS 'Tabela',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Tamanho (MB)'
FROM information_schema.TABLES 
WHERE table_schema = 'credguard'
ORDER BY (data_length + index_length) DESC;
"
```

#### Passo 2: Projetar Crescimento

- Calcular taxa de crescimento semanal
- Projetar quando será necessário upgrade de infraestrutura
- Documentar em planilha de capacity planning

### 3.2 Quarta-feira: Atualização de Dependências

```bash
# Verificar atualizações de segurança
sudo apt update
sudo apt list --upgradable | grep -i security

# Atualizar pacotes de segurança
sudo apt upgrade -y

# Reiniciar serviços se necessário
sudo systemctl restart credguard-backend
```

### 3.3 Sexta-feira: Relatório Semanal

Gerar relatório com:
- Total de jobs processados
- Total de clientes analisados
- Tempo médio de processamento
- Incidentes ocorridos
- Ações tomadas

---

## 4. Procedimentos Mensais

### 4.1 Primeiro Dia do Mês: Revisão de Modelos ML

#### Passo 1: Verificar Performance dos Modelos

```bash
# Conectar ao banco
mysql -u credguard -p credguard

# Calcular distribuição de scores do mês anterior
SELECT 
  produto,
  faixaScore,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY produto), 2) as percentual
FROM customer_scores
WHERE dataProcessamento >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
GROUP BY produto, faixaScore
ORDER BY produto, faixaScore;
```

#### Passo 2: Comparar com Baseline

- Verificar se distribuição mudou significativamente
- Se sim, investigar possível drift
- Documentar findings

### 4.2 Dia 15: Auditoria de Segurança

- Revisar logs de acesso dos últimos 30 dias
- Verificar usuários inativos (> 90 dias sem login)
- Revisar permissões de usuários
- Atualizar documentação de segurança

---

## 5. Procedimento de Retreinamento de Modelos

### 5.1 Quando Retreinar

Retreinar modelos quando:
- PSI > 0.25 (drift significativo)
- Acurácia cai > 5% do baseline
- Cliente solicita via plano de sustentação
- Periodicidade trimestral (preventivo)

### 5.2 Processo de Retreinamento

#### Etapa 1: Coleta de Dados

```bash
# Exportar dados dos últimos 6 meses
mysql -u credguard -p credguard -e "
SELECT 
  cpf, nome, produto, 
  data_primeira_compra, data_ultima_compra,
  total_compras, valor_total_compras,
  total_pagamentos_em_dia, total_atrasos, maior_atraso,
  scoreProbInadimplencia as label
FROM customer_scores
WHERE dataProcessamento >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
AND motivoExclusao IS NULL
" > /tmp/training_data.csv
```

#### Etapa 2: Treinar Novo Modelo

```bash
# Executar script de treinamento
cd /opt/credguard/ml_training
python3 train_model.py --input /tmp/training_data.csv --output /tmp/new_model.pkl --product CARTAO
```

#### Etapa 3: Validar no MLflow

```bash
# Registrar modelo no MLflow
python3 register_model.py --model /tmp/new_model.pkl --name fa_12_v2 --metrics /tmp/metrics.json
```

#### Etapa 4: Promover para Produção

Usar endpoint da API:

```bash
curl -X POST https://credguard.com/api/v1/models/promote \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelName": "fa_12_v2",
    "product": "CARTAO",
    "reason": "Drift detectado - PSI 0.28"
  }'
```

---

## 6. Escalação de Problemas

### 6.1 Níveis de Severidade

| Nível | Descrição | Tempo de Resposta | Escalação |
|-------|-----------|-------------------|-----------|
| **P1 - Crítico** | Plataforma fora do ar | 15 minutos | CTO imediatamente |
| **P2 - Alto** | Funcionalidade principal indisponível | 1 hora | Tech Lead |
| **P3 - Médio** | Degradação de performance | 4 horas | Equipe de Dev |
| **P4 - Baixo** | Problemas menores | 24 horas | Backlog |

### 6.2 Contatos de Escalação

- **Equipe de Operações:** ops@credguard.com
- **Tech Lead:** tech-lead@credguard.com
- **CTO:** cto@credguard.com
- **Telefone de Emergência:** +55 11 9999-9999

---

## 7. Documentação de Mudanças

Todas as mudanças operacionais devem ser documentadas em:

```
/opt/credguard/docs/change-log.md
```

Formato:

```markdown
## YYYY-MM-DD - Descrição da Mudança

**Responsável:** Nome do Operador  
**Tipo:** [Configuração | Deployment | Hotfix | Manutenção]  
**Impacto:** [Alto | Médio | Baixo]  
**Downtime:** [Sim/Não - Duração]

### Descrição
...

### Rollback Plan
...
```

---

## 8. Checklist de Handover (Passagem de Plantão)

Ao final do turno, o operador deve:

- [ ] Atualizar status board com situação atual
- [ ] Documentar incidentes ocorridos
- [ ] Listar tarefas pendentes
- [ ] Briefing verbal com próximo operador (se aplicável)
- [ ] Enviar relatório de turno por e-mail

---

**Fim do Runbook de Operações**
