# Runbook de Troubleshooting - CredGuard

**Versão:** 1.0.0  
**Última Atualização:** Novembro 2025

---

## 1. Problemas Comuns e Soluções

### 1.1 Backend Não Responde

**Sintomas:**
- HTTP 502 Bad Gateway
- Timeout em requisições
- Health check falhando

**Diagnóstico:**

```bash
# Verificar se processo está rodando
ps aux | grep node

# Verificar logs
tail -f /var/log/credguard/backend.log

# Verificar portas
sudo netstat -tulpn | grep 3000
```

**Solução 1: Reiniciar Serviço**

```bash
sudo systemctl restart credguard-backend
sudo systemctl status credguard-backend
```

**Solução 2: Verificar Memória**

```bash
# Se OOM (Out of Memory)
free -h
sudo systemctl restart credguard-backend

# Aumentar limite de memória Node.js
# Editar /etc/systemd/system/credguard-backend.service
# Adicionar: Environment="NODE_OPTIONS=--max-old-space-size=4096"
sudo systemctl daemon-reload
sudo systemctl restart credguard-backend
```

**Solução 3: Verificar Conexão com Banco**

```bash
# Testar conexão MySQL
mysql -u credguard -p -h localhost -e "SELECT 1;"

# Se falhar, reiniciar MySQL
sudo systemctl restart mysql
```

---

### 1.2 Jobs de Processamento Travados

**Sintomas:**
- Job com status "processing" há mais de 1 hora
- Nenhum progresso visível

**Diagnóstico:**

```sql
-- Verificar jobs travados
SELECT id, tenantId, status, fileName, createdAt, processedRows, totalRows
FROM batch_jobs
WHERE status = 'processing'
AND createdAt < DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

**Solução 1: Verificar Processo Python ML**

```bash
# Verificar se ml_service.py está rodando
ps aux | grep ml_service

# Se não estiver, job pode estar travado esperando resposta
# Marcar job como failed e reprocessar
mysql -u credguard -p credguard << EOF
UPDATE batch_jobs 
SET status = 'failed', error = 'ML service timeout'
WHERE id = <JOB_ID>;
EOF
```

**Solução 2: Reprocessar Job Manualmente**

```bash
# Baixar arquivo CSV do S3
aws s3 cp s3://credguard-files/uploads/<FILE_KEY> /tmp/reprocess.csv

# Reprocessar via API
curl -X POST https://credguard.com/api/trpc/batch.upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/reprocess.csv"
```

---

### 1.3 Modelos ML Não Carregam

**Sintomas:**
- Erro "Model file not found"
- Erro "Failed to load pickle file"

**Diagnóstico:**

```bash
# Verificar se arquivos .pkl existem
ls -lh /opt/credguard/ml_models/*.pkl

# Verificar permissões
ls -l /opt/credguard/ml_models/

# Testar carregamento manual
python3 << EOF
import pickle
with open('/opt/credguard/ml_models/fa_12.pkl', 'rb') as f:
    model = pickle.load(f)
print("Model loaded successfully")
EOF
```

**Solução 1: Restaurar Modelos do Backup**

```bash
# Copiar modelos do backup
sudo cp /backups/ml_models/*.pkl /opt/credguard/ml_models/

# Ajustar permissões
sudo chown credguard:credguard /opt/credguard/ml_models/*.pkl
sudo chmod 644 /opt/credguard/ml_models/*.pkl
```

**Solução 2: Baixar Modelos do MLflow**

```bash
# Usar API do MLflow para baixar modelo em produção
python3 /opt/credguard/scripts/download_production_models.py
```

---

### 1.4 Drift Detectado

**Sintomas:**
- PSI > 0.25
- Acurácia caiu > 5%
- Distribuição de scores mudou significativamente

**Diagnóstico:**

```sql
-- Comparar distribuição de scores
SELECT 
  produto,
  faixaScore,
  COUNT(*) as total_mes_atual
FROM customer_scores
WHERE dataProcessamento >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
GROUP BY produto, faixaScore;

SELECT 
  produto,
  faixaScore,
  COUNT(*) as total_mes_anterior
FROM customer_scores
WHERE dataProcessamento >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
AND dataProcessamento < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
GROUP BY produto, faixaScore;
```

**Solução 1: Verificar se Cliente Tem Plano de Sustentação**

```sql
SELECT t.id, t.companyName, sp.planType, sp.status
FROM users u
JOIN tenants t ON u.tenantId = t.id
LEFT JOIN sustentation_plans sp ON t.id = sp.tenantId
WHERE sp.status = 'active';
```

**Se Tem Plano:**
1. Criar ticket de sustentação automaticamente
2. Notificar equipe CredGuard
3. Iniciar processo de retreinamento (ver RUNBOOK_OPERATIONS.md seção 5)

**Se Não Tem Plano:**
1. Enviar e-mail para cliente informando drift
2. Sugerir contratação do plano de sustentação
3. Oferecer retreinamento pontual (cobrado separadamente)

---

### 1.5 Integração com Bureau Falhando

**Sintomas:**
- Erro "Bureau API timeout"
- Scores de bureau retornando null
- Taxa de cache hit muito baixa

**Diagnóstico:**

```bash
# Verificar conectividade com API Brasil
curl -X GET "https://api.apibrasil.io/serasa/cpf/12345678900" \
  -H "Authorization: Bearer $APIBRASIL_TOKEN"

# Verificar cache
mysql -u credguard -p credguard -e "
SELECT 
  COUNT(*) as total_cached,
  COUNT(CASE WHEN expiresAt > NOW() THEN 1 END) as valid_cache,
  COUNT(CASE WHEN expiresAt <= NOW() THEN 1 END) as expired_cache
FROM bureau_cache;
"
```

**Solução 1: Verificar Token API Brasil**

```bash
# Verificar se token está válido
curl -X GET "https://api.apibrasil.io/account/balance" \
  -H "Authorization: Bearer $APIBRASIL_TOKEN"

# Se inválido, atualizar no .env
sudo nano /opt/credguard/.env
# Atualizar APIBRASIL_TOKEN=...

# Reiniciar backend
sudo systemctl restart credguard-backend
```

**Solução 2: Aumentar Timeout**

```typescript
// server/bureauService.ts
const response = await axios.get(url, {
  timeout: 30000, // Aumentar de 10s para 30s
});
```

---

### 1.6 Banco de Dados Lento

**Sintomas:**
- Queries demorando > 5 segundos
- Timeout em operações
- CPU do MySQL > 80%

**Diagnóstico:**

```sql
-- Verificar queries lentas
SHOW PROCESSLIST;

-- Verificar tabelas sem índice
SELECT DISTINCT
  TABLE_NAME,
  INDEX_NAME
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'credguard';

-- Analisar query específica
EXPLAIN SELECT * FROM customer_scores WHERE tenantId = 1 AND produto = 'CARTAO';
```

**Solução 1: Criar Índices Faltantes**

```sql
-- Índice composto para queries comuns
CREATE INDEX idx_tenant_produto ON customer_scores(tenantId, produto);
CREATE INDEX idx_batch_status ON batch_jobs(tenantId, status);
CREATE INDEX idx_bureau_cache_lookup ON bureau_cache(tenantId, cpf, expiresAt);
```

**Solução 2: Otimizar Configuração MySQL**

```bash
# Editar /etc/mysql/my.cnf
sudo nano /etc/mysql/my.cnf

# Adicionar/ajustar:
# innodb_buffer_pool_size = 2G
# max_connections = 200
# query_cache_size = 64M

# Reiniciar MySQL
sudo systemctl restart mysql
```

**Solução 3: Limpar Dados Antigos**

```sql
-- Arquivar dados com mais de 90 dias
DELETE FROM customer_scores 
WHERE dataProcessamento < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Otimizar tabelas
OPTIMIZE TABLE customer_scores;
OPTIMIZE TABLE batch_jobs;
```

---

### 1.7 Upload de Arquivo Falhando

**Sintomas:**
- Erro "File too large"
- Erro "Invalid CSV format"
- Upload trava em 99%

**Diagnóstico:**

```bash
# Verificar tamanho do arquivo
ls -lh /tmp/upload_file.csv

# Verificar formato
head -n 5 /tmp/upload_file.csv
file /tmp/upload_file.csv
```

**Solução 1: Aumentar Limite de Upload**

```typescript
// server/_core/index.ts
app.use(express.json({ limit: '50mb' })); // Aumentar de 10mb para 50mb
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

**Solução 2: Validar Formato CSV**

```python
import pandas as pd

# Tentar ler CSV
df = pd.read_csv('/tmp/upload_file.csv', encoding='utf-8')
print(df.head())
print(df.columns)

# Verificar colunas obrigatórias
required_cols = ['cpf', 'nome', 'produto', 'data_primeira_compra', ...]
missing = set(required_cols) - set(df.columns)
if missing:
    print(f"Colunas faltando: {missing}")
```

---

### 1.8 Certificado SSL Expirado

**Sintomas:**
- Navegador mostra "Conexão não é segura"
- Erro "SSL certificate has expired"

**Diagnóstico:**

```bash
# Verificar validade do certificado
echo | openssl s_client -servername credguard.com -connect credguard.com:443 2>/dev/null | openssl x509 -noout -dates
```

**Solução: Renovar Certificado**

```bash
# Let's Encrypt
sudo certbot renew --force-renewal

# Reiniciar Nginx
sudo systemctl reload nginx

# Verificar novamente
curl -I https://credguard.com
```

---

## 2. Comandos Úteis de Diagnóstico

### 2.1 Verificar Saúde Geral do Sistema

```bash
# CPU, memória, processos
htop

# Disco
df -h
du -sh /var/log/*
du -sh /opt/credguard/*

# Rede
netstat -tulpn
ss -tulpn

# Processos por uso de memória
ps aux --sort=-%mem | head -n 10

# Processos por uso de CPU
ps aux --sort=-%cpu | head -n 10
```

### 2.2 Logs Importantes

```bash
# Backend
tail -f /var/log/credguard/backend.log

# MySQL
sudo tail -f /var/log/mysql/error.log

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Sistema
sudo tail -f /var/log/syslog
```

### 2.3 Banco de Dados

```sql
-- Tamanho das tabelas
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = 'credguard'
ORDER BY (data_length + index_length) DESC;

-- Conexões ativas
SHOW PROCESSLIST;

-- Status do servidor
SHOW STATUS;

-- Variáveis de configuração
SHOW VARIABLES LIKE '%buffer%';
```

---

## 3. Rollback de Deploys

### 3.1 Rollback de Código

```bash
# Listar últimos deploys
git log --oneline -10

# Voltar para versão anterior
git checkout <COMMIT_HASH>

# Rebuild
pnpm install
pnpm build

# Reiniciar
sudo systemctl restart credguard-backend
```

### 3.2 Rollback de Modelo ML

```bash
# Listar versões de modelos
ls -lt /opt/credguard/ml_models/archive/

# Restaurar versão anterior
sudo cp /opt/credguard/ml_models/archive/fa_12_v1.pkl /opt/credguard/ml_models/fa_12.pkl

# Reiniciar backend
sudo systemctl restart credguard-backend
```

### 3.3 Rollback de Banco de Dados

```bash
# Restaurar backup
gunzip < /backups/mysql/credguard-YYYYMMDD.sql.gz | mysql -u root -p credguard

# Verificar integridade
mysql -u credguard -p credguard -e "SELECT COUNT(*) FROM users;"
```

---

## 4. Contatos de Suporte

| Problema | Contato | SLA |
|----------|---------|-----|
| Infraestrutura AWS | aws-support@credguard.com | 4h |
| Banco de Dados | dba@credguard.com | 2h |
| Modelos ML | ml-team@credguard.com | 8h |
| Segurança | security@credguard.com | 1h |
| API Brasil (Bureau) | suporte@apibrasil.io | 24h |

---

**Fim do Runbook de Troubleshooting**
