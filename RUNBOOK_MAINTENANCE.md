# Runbook de Manutenção - CredGuard

**Versão:** 1.0.0  
**Última Atualização:** Novembro 2025

---

## 1. Manutenção Preventiva Mensal

### 1.1 Limpeza de Dados Antigos

```sql
-- Arquivar customer_scores com mais de 90 dias
CREATE TABLE customer_scores_archive_202411 AS 
SELECT * FROM customer_scores 
WHERE dataProcessamento < DATE_SUB(NOW(), INTERVAL 90 DAY);

DELETE FROM customer_scores 
WHERE dataProcessamento < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Limpar bureau_cache expirado
DELETE FROM bureau_cache WHERE expiresAt < NOW();

-- Otimizar tabelas
OPTIMIZE TABLE customer_scores;
OPTIMIZE TABLE batch_jobs;
OPTIMIZE TABLE bureau_cache;
```

### 1.2 Atualização de Modelos ML

Verificar se há novos modelos disponíveis no MLflow e promover para produção se validados.

### 1.3 Revisão de Logs

Analisar logs dos últimos 30 dias para identificar padrões de erro ou performance degradada.

---

## 2. Manutenção Trimestral

### 2.1 Retreinamento de Modelos

Executar processo completo de retreinamento preventivo para todos os produtos.

### 2.2 Auditoria de Segurança

- Revisar acessos de usuários
- Atualizar certificados
- Verificar vulnerabilidades conhecidas

---

## 3. Backup e Recuperação

### 3.1 Política de Backup

- **Diário**: Backup completo do banco de dados (retenção: 30 dias)
- **Semanal**: Backup de modelos ML (retenção: 90 dias)
- **Mensal**: Backup completo do sistema (retenção: 1 ano)

### 3.2 Teste de Restauração

Realizar teste de restauração mensalmente para garantir integridade dos backups.

---

**Fim do Runbook de Manutenção**
