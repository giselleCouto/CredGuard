# Guia de Deploy AWS - CredGuard

**Versão:** 1.0  
**Data:** Novembro 2025  
**Autor:** Equipe CredGuard

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Arquitetura AWS](#arquitetura-aws)
4. [Configuração Passo a Passo](#configuração-passo-a-passo)
5. [Monitoramento e Logs](#monitoramento-e-logs)
6. [Backup e Disaster Recovery](#backup-e-disaster-recovery)
7. [Custos Estimados](#custos-estimados)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este documento descreve o processo completo de deploy da aplicação **CredGuard** na AWS, incluindo:

- **ECS Fargate** para containers (sem gerenciar servidores)
- **RDS MySQL** para banco de dados (com backup automático)
- **S3** para storage de arquivos
- **CloudWatch** para logs e monitoramento
- **ALB** (Application Load Balancer) para distribuição de tráfego
- **ACM** (Certificate Manager) para SSL/TLS
- **Route 53** para DNS

---

## ✅ Pré-requisitos

### 1. Conta AWS

- Conta AWS ativa
- Usuário IAM com permissões:
  - ECS Full Access
  - RDS Full Access
  - S3 Full Access
  - CloudWatch Full Access
  - EC2 Full Access (para ALB, VPC)
  - IAM (para criar roles)

### 2. Ferramentas Locais

```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Verificar instalação
aws --version
docker --version
docker-compose --version
```

### 3. Configurar AWS CLI

```bash
aws configure
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: ...
# Default region name: us-east-1
# Default output format: json
```

---

## 🏗️ Arquitetura AWS

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │   Route 53     │ (DNS)
              │ credguard.com  │
              └────────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │      ALB       │ (Load Balancer)
              │  + ACM (SSL)   │
              └────────┬───────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐           ┌───────────────┐
│  ECS Fargate  │           │  ECS Fargate  │
│   Task 1      │           │   Task 2      │
│ (Container)   │           │ (Container)   │
└───────┬───────┘           └───────┬───────┘
        │                           │
        └───────────┬───────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌──────────────┐
│   RDS MySQL   │       │      S3      │
│  (Database)   │       │   (Files)    │
│ + Backup Auto │       │              │
└───────────────┘       └──────────────┘
        │
        ▼
┌───────────────┐
│  CloudWatch   │
│  (Logs/Alerts)│
└───────────────┘
```

---

## 🚀 Configuração Passo a Passo

### Passo 1: Criar VPC e Subnets

```bash
# Criar VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=credguard-vpc}]'

# Anotar VPC ID (ex: vpc-0123456789abcdef0)
VPC_ID="vpc-0123456789abcdef0"

# Criar Subnets (2 públicas, 2 privadas para alta disponibilidade)
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=credguard-public-1a}]'
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone us-east-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=credguard-public-1b}]'
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.3.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=credguard-private-1a}]'
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.4.0/24 --availability-zone us-east-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=credguard-private-1b}]'

# Criar Internet Gateway
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=credguard-igw}]'
IGW_ID="igw-0123456789abcdef0"

# Anexar Internet Gateway à VPC
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

# Criar Route Table para subnets públicas
aws ec2 create-route-table --vpc-id $VPC_ID --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=credguard-public-rt}]'
RT_ID="rtb-0123456789abcdef0"

# Adicionar rota para Internet
aws ec2 create-route --route-table-id $RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID

# Associar Route Table às subnets públicas
aws ec2 associate-route-table --subnet-id subnet-public-1a --route-table-id $RT_ID
aws ec2 associate-route-table --subnet-id subnet-public-1b --route-table-id $RT_ID
```

### Passo 2: Criar RDS MySQL

```bash
# Criar DB Subnet Group
aws rds create-db-subnet-group \
  --db-subnet-group-name credguard-db-subnet-group \
  --db-subnet-group-description "Subnet group for CredGuard RDS" \
  --subnet-ids subnet-private-1a subnet-private-1b \
  --tags Key=Name,Value=credguard-db-subnet-group

# Criar Security Group para RDS
aws ec2 create-security-group \
  --group-name credguard-rds-sg \
  --description "Security group for CredGuard RDS" \
  --vpc-id $VPC_ID

RDS_SG_ID="sg-0123456789abcdef0"

# Permitir acesso MySQL (porta 3306) apenas de ECS
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG_ID \
  --protocol tcp \
  --port 3306 \
  --source-group $ECS_SG_ID

# Criar RDS MySQL
aws rds create-db-instance \
  --db-instance-identifier credguard-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0.35 \
  --master-username admin \
  --master-user-password 'SuaSenhaSegura123!' \
  --allocated-storage 20 \
  --storage-type gp3 \
  --db-subnet-group-name credguard-db-subnet-group \
  --vpc-security-group-ids $RDS_SG_ID \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --enable-cloudwatch-logs-exports '["error","general","slowquery"]' \
  --tags Key=Name,Value=credguard-db

# Aguardar criação (leva ~10 minutos)
aws rds wait db-instance-available --db-instance-identifier credguard-db

# Obter endpoint do banco
aws rds describe-db-instances \
  --db-instance-identifier credguard-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
# Resultado: credguard-db.c9akciq32.us-east-1.rds.amazonaws.com

# Construir DATABASE_URL
DATABASE_URL="mysql://admin:SuaSenhaSegura123!@credguard-db.c9akciq32.us-east-1.rds.amazonaws.com:3306/credguard"
```

### Passo 3: Criar S3 Bucket

```bash
# Criar bucket
aws s3api create-bucket \
  --bucket credguard-storage-prod \
  --region us-east-1

# Configurar versionamento (para backup)
aws s3api put-bucket-versioning \
  --bucket credguard-storage-prod \
  --versioning-configuration Status=Enabled

# Configurar lifecycle (deletar versões antigas após 90 dias)
cat > lifecycle.json <<EOF
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 90
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket credguard-storage-prod \
  --lifecycle-configuration file://lifecycle.json

# Configurar CORS (se necessário)
cat > cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://credguard.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket credguard-storage-prod \
  --cors-configuration file://cors.json
```

### Passo 4: Criar ECR Repository

```bash
# Criar repositório para imagens Docker
aws ecr create-repository \
  --repository-name credguard \
  --image-scanning-configuration scanOnPush=true \
  --tags Key=Name,Value=credguard-ecr

# Obter URI do repositório
ECR_URI=$(aws ecr describe-repositories \
  --repository-names credguard \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo "ECR URI: $ECR_URI"
# Resultado: 123456789012.dkr.ecr.us-east-1.amazonaws.com/credguard

# Fazer login no ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI

# Build e push da imagem
docker build -t credguard .
docker tag credguard:latest $ECR_URI:latest
docker push $ECR_URI:latest
```

### Passo 5: Criar ECS Cluster

```bash
# Criar cluster ECS (Fargate)
aws ecs create-cluster \
  --cluster-name credguard-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
  --tags key=Name,value=credguard-cluster

# Criar IAM Role para Task Execution
cat > task-execution-role-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://task-execution-role-trust-policy.json

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Criar IAM Role para Task (acesso a S3, CloudWatch)
cat > task-role-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name credguardTaskRole \
  --assume-role-policy-document file://task-role-trust-policy.json

# Anexar políticas
aws iam attach-role-policy \
  --role-name credguardTaskRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
  --role-name credguardTaskRole \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
```

### Passo 6: Criar Task Definition

```bash
cat > task-definition.json <<EOF
{
  "family": "credguard-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/credguardTaskRole",
  "containerDefinitions": [
    {
      "name": "credguard-app",
      "image": "$ECR_URI:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"},
        {"name": "AWS_REGION", "value": "us-east-1"},
        {"name": "S3_BUCKET", "value": "credguard-storage-prod"},
        {"name": "CLOUDWATCH_LOG_GROUP", "value": "/aws/ecs/credguard"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:credguard/database-url"},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:credguard/jwt-secret"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/aws/ecs/credguard",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "app"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

# Registrar Task Definition
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### Passo 7: Criar Application Load Balancer

```bash
# Criar Security Group para ALB
aws ec2 create-security-group \
  --group-name credguard-alb-sg \
  --description "Security group for CredGuard ALB" \
  --vpc-id $VPC_ID

ALB_SG_ID="sg-alb123456789"

# Permitir HTTP e HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Criar ALB
aws elbv2 create-load-balancer \
  --name credguard-alb \
  --subnets subnet-public-1a subnet-public-1b \
  --security-groups $ALB_SG_ID \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --tags Key=Name,Value=credguard-alb

# Obter ARN do ALB
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names credguard-alb \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# Criar Target Group
aws elbv2 create-target-group \
  --name credguard-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-enabled \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

TG_ARN=$(aws elbv2 describe-target-groups \
  --names credguard-tg \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# Criar Listener HTTP (redireciona para HTTPS)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}

# Criar certificado SSL no ACM (manual via console ou CLI)
# Depois criar Listener HTTPS
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/abc123 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

### Passo 8: Criar ECS Service

```bash
# Criar Security Group para ECS Tasks
aws ec2 create-security-group \
  --group-name credguard-ecs-sg \
  --description "Security group for CredGuard ECS tasks" \
  --vpc-id $VPC_ID

ECS_SG_ID="sg-ecs123456789"

# Permitir tráfego do ALB
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 3000 \
  --source-group $ALB_SG_ID

# Criar Service
aws ecs create-service \
  --cluster credguard-cluster \
  --service-name credguard-service \
  --task-definition credguard-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-private-1a,subnet-private-1b],securityGroups=[$ECS_SG_ID],assignPublicIp=DISABLED}" \
  --load-balancers targetGroupArn=$TG_ARN,containerName=credguard-app,containerPort=3000 \
  --health-check-grace-period-seconds 60 \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100" \
  --enable-execute-command
```

### Passo 9: Configurar CloudWatch Logs

```bash
# Criar Log Group
aws logs create-log-group --log-group-name /aws/ecs/credguard

# Configurar retenção (30 dias)
aws logs put-retention-policy \
  --log-group-name /aws/ecs/credguard \
  --retention-in-days 30
```

### Passo 10: Configurar Alarmes CloudWatch

```bash
# Alarme: CPU alta
aws cloudwatch put-metric-alarm \
  --alarm-name credguard-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ClusterName,Value=credguard-cluster Name=ServiceName,Value=credguard-service \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:credguard-alerts

# Alarme: Memória alta
aws cloudwatch put-metric-alarm \
  --alarm-name credguard-high-memory \
  --alarm-description "Alert when memory exceeds 90%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 90 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ClusterName,Value=credguard-cluster Name=ServiceName,Value=credguard-service \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:credguard-alerts

# Alarme: Erros 5xx
aws cloudwatch put-metric-alarm \
  --alarm-name credguard-high-5xx \
  --alarm-description "Alert when 5xx errors exceed 10" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=LoadBalancer,Value=app/credguard-alb/abc123 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:credguard-alerts
```

---

## 📊 Monitoramento e Logs

### CloudWatch Logs

Acessar logs em tempo real:

```bash
# Ver logs do serviço
aws logs tail /aws/ecs/credguard --follow

# Filtrar por erro
aws logs tail /aws/ecs/credguard --follow --filter-pattern "ERROR"

# Buscar logs específicos
aws logs filter-log-events \
  --log-group-name /aws/ecs/credguard \
  --filter-pattern "CPF inválido" \
  --start-time $(date -u -d '1 hour ago' +%s)000
```

### CloudWatch Insights

Queries úteis:

```sql
-- Top 10 erros mais frequentes
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() as error_count by @message
| sort error_count desc
| limit 10

-- Latência média por endpoint
fields @timestamp, @message
| filter @message like /\[HTTP\]/
| parse @message /duration=(?<duration>\d+)ms/
| stats avg(duration) as avg_latency by endpoint
| sort avg_latency desc

-- Taxa de erro por hora
fields @timestamp
| filter @message like /ERROR/
| stats count() as errors by bin(5m)
```

---

## 💾 Backup e Disaster Recovery

### Backup Automático RDS

Já configurado no Passo 2:
- **Backup diário:** 03:00-04:00 UTC
- **Retenção:** 7 dias
- **Manutenção:** Domingos 04:00-05:00 UTC

### Restore de Backup

```bash
# Listar backups disponíveis
aws rds describe-db-snapshots \
  --db-instance-identifier credguard-db

# Restaurar de snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier credguard-db-restored \
  --db-snapshot-identifier rds:credguard-db-2025-11-25-03-00 \
  --db-instance-class db.t3.micro \
  --vpc-security-group-ids $RDS_SG_ID \
  --db-subnet-group-name credguard-db-subnet-group
```

### RPO e RTO

- **RPO (Recovery Point Objective):** 24 horas (backup diário)
- **RTO (Recovery Time Objective):** 30 minutos (restore + redeploy)

### Disaster Recovery Plan

1. **Backup RDS:** Automático diário
2. **Backup S3:** Versionamento habilitado (90 dias)
3. **Backup Código:** GitHub (repositório privado)
4. **Runbook:** Documentado em `RUNBOOK.md`

---

## 💰 Custos Estimados AWS

### Cenário 1: Startup (100 clientes, 1000 req/dia)

| Serviço | Especificação | Custo Mensal (USD) |
|---------|---------------|-------------------|
| **ECS Fargate** | 2 tasks × 1 vCPU, 2GB RAM × 730h | $60 |
| **RDS MySQL** | db.t3.micro (1 vCPU, 1GB RAM) | $15 |
| **S3** | 50GB storage + 100GB transfer | $5 |
| **ALB** | 1 ALB + 1GB processed | $20 |
| **CloudWatch** | Logs (5GB) + Metrics | $10 |
| **Route 53** | 1 hosted zone + 1M queries | $1 |
| **Data Transfer** | 100GB out | $9 |

**Total Startup:** ~$120/mês

### Cenário 2: Crescimento (1000 clientes, 10k req/dia)

| Serviço | Especificação | Custo Mensal (USD) |
|---------|---------------|-------------------|
| **ECS Fargate** | 4 tasks × 2 vCPU, 4GB RAM × 730h | $240 |
| **RDS MySQL** | db.t3.small (2 vCPU, 2GB RAM) | $30 |
| **S3** | 200GB storage + 500GB transfer | $20 |
| **ALB** | 1 ALB + 10GB processed | $25 |
| **CloudWatch** | Logs (20GB) + Metrics | $30 |
| **Route 53** | 1 hosted zone + 10M queries | $1 |
| **Data Transfer** | 500GB out | $45 |

**Total Crescimento:** ~$391/mês

### Cenário 3: Escala (10k clientes, 100k req/dia)

| Serviço | Especificação | Custo Mensal (USD) |
|---------|---------------|-------------------|
| **ECS Fargate** | 10 tasks × 4 vCPU, 8GB RAM × 730h | $1200 |
| **RDS MySQL** | db.r5.large (2 vCPU, 16GB RAM) | $180 |
| **S3** | 1TB storage + 5TB transfer | $100 |
| **ALB** | 1 ALB + 100GB processed | $30 |
| **CloudWatch** | Logs (100GB) + Metrics | $100 |
| **Route 53** | 1 hosted zone + 100M queries | $5 |
| **Data Transfer** | 5TB out | $450 |

**Total Escala:** ~$2065/mês

### Otimizações de Custo

1. **Usar Fargate Spot:** Economize até 70% em tasks não-críticas
2. **Reserved Instances RDS:** Economize até 60% com compromisso de 1-3 anos
3. **S3 Intelligent-Tiering:** Move dados antigos para classes mais baratas
4. **CloudWatch Logs Retention:** Reduzir retenção de 30 para 7 dias
5. **Compress Logs:** Reduz volume de logs em ~80%

---

## 🔧 Troubleshooting

### Problema: Tasks não iniciam

**Sintoma:** ECS tasks ficam em estado `PENDING` ou `STOPPED`

**Diagnóstico:**
```bash
# Ver eventos do serviço
aws ecs describe-services \
  --cluster credguard-cluster \
  --services credguard-service \
  --query 'services[0].events[0:10]'

# Ver logs de stopped tasks
aws ecs describe-tasks \
  --cluster credguard-cluster \
  --tasks <task-id> \
  --query 'tasks[0].stoppedReason'
```

**Soluções:**
- Verificar se IAM roles têm permissões corretas
- Verificar se Security Groups permitem tráfego
- Verificar se subnets têm acesso à internet (NAT Gateway)
- Verificar se imagem Docker existe no ECR

### Problema: Health check falhando

**Sintoma:** ALB marca targets como `unhealthy`

**Diagnóstico:**
```bash
# Ver health check status
aws elbv2 describe-target-health \
  --target-group-arn $TG_ARN

# Acessar logs do container
aws logs tail /aws/ecs/credguard --follow --filter-pattern "health"
```

**Soluções:**
- Verificar se endpoint `/api/health` está respondendo 200
- Aumentar `startPeriod` no health check (dar mais tempo para inicializar)
- Verificar se banco de dados está acessível

### Problema: Banco de dados inacessível

**Sintoma:** Aplicação não consegue conectar ao RDS

**Diagnóstico:**
```bash
# Testar conectividade de dentro do container
aws ecs execute-command \
  --cluster credguard-cluster \
  --task <task-id> \
  --container credguard-app \
  --interactive \
  --command "/bin/sh"

# Dentro do container:
nc -zv credguard-db.c9akciq32.us-east-1.rds.amazonaws.com 3306
```

**Soluções:**
- Verificar Security Group do RDS permite tráfego do ECS
- Verificar se DATABASE_URL está correto
- Verificar se RDS está em estado `available`

### Problema: Alto custo inesperado

**Sintoma:** Fatura AWS maior que o esperado

**Diagnóstico:**
```bash
# Ver custos por serviço
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=SERVICE

# Ver custos de Data Transfer
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --filter file://filter-data-transfer.json
```

**Soluções:**
- Verificar se há tasks "órfãs" rodando
- Verificar se CloudWatch Logs está acumulando muito
- Verificar se Data Transfer está alto (otimizar com CloudFront)
- Habilitar Cost Explorer e criar budget alerts

---

## 📚 Recursos Adicionais

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/intro.html)
- [AWS RDS Backup Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html)
- [AWS CloudWatch Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html)
- [AWS Cost Optimization](https://aws.amazon.com/pricing/cost-optimization/)

---

## 📞 Suporte

Para dúvidas ou problemas, contate:
- **Email:** devops@credguard.com
- **Slack:** #credguard-ops
- **On-call:** PagerDuty (apenas emergências)

---

**Última atualização:** Novembro 2025  
**Versão:** 1.0  
**Autor:** Equipe CredGuard DevOps
