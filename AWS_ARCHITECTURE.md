# ☁️ Arquitetura AWS - CredGuard

**Autor:** Manus AI  
**Data:** 27 de novembro de 2024  
**Versão:** 1.0.0

---

## 1. Resumo Executivo

Este documento descreve a **arquitetura AWS recomendada** para deploy da solução CredGuard em ambiente de produção, incluindo componentes, configurações, custos e procedimentos de deployment.

---

## 2. Arquitetura Recomendada

### 2.1 Visão Geral

A arquitetura proposta utiliza serviços gerenciados da AWS para garantir **alta disponibilidade**, **escalabilidade** e **segurança**, minimizando overhead operacional.

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   Route 53     │ DNS
                    │  (credguard    │
                    │    .com)       │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  CloudFront    │ CDN
                    │  (Assets)      │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   AWS WAF      │ Firewall
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Application   │ Load Balancer
                    │  Load Balancer │ (HTTPS)
                    └────────┬───────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
       ┌────────────────┐        ┌────────────────┐
       │   ECS Fargate  │        │   ECS Fargate  │
       │   (Container   │        │   (Container   │
       │    Instance    │        │    Instance    │
       │      #1)       │        │      #2)       │
       └────────┬───────┘        └────────┬───────┘
                │                         │
                └────────────┬────────────┘
                             │
                ┌────────────┴────────────┬─────────────┐
                │                         │             │
                ▼                         ▼             ▼
       ┌────────────────┐        ┌────────────┐  ┌──────────┐
       │   RDS          │        │ ElastiCache│  │ Secrets  │
       │   PostgreSQL   │        │   Redis    │  │ Manager  │
       │   (Multi-AZ)   │        │            │  │          │
       └────────────────┘        └────────────┘  └──────────┘
                │
                ▼
       ┌────────────────┐
       │   S3 Bucket    │ Backups + Uploads
       │  (Encrypted)   │
       └────────────────┘
```

### 2.2 Componentes da Arquitetura

#### 2.2.1 Camada de Rede

**Route 53 (DNS)**
- Gerenciamento de domínio (credguard.com)
- Health checks
- Failover automático
- Latency-based routing

**Custo:** $0.50/hosted zone/mês + $0.40/milhão de queries

**CloudFront (CDN)**
- Cache de assets estáticos (CSS, JS, imagens)
- Distribuição global (edge locations)
- Compressão automática (gzip, brotli)
- HTTPS obrigatório
- Invalidação de cache

**Custo:** $0.085/GB transferido (primeiros 10 TB)

**AWS WAF (Web Application Firewall)**
- Proteção OWASP Top 10
- Rate limiting por IP
- Bloqueio de bots maliciosos
- Geo-blocking (opcional)
- Regras customizadas

**Custo:** $5/mês + $1/milhão de requests

#### 2.2.2 Camada de Aplicação

**Application Load Balancer (ALB)**
- Distribuição de carga entre containers
- Health checks (HTTP /health)
- Sticky sessions
- SSL/TLS termination
- Logs de acesso (S3)

**Custo:** $16/mês + $0.008/LCU-hora

**ECS Fargate (Containers)**
- Containers serverless (sem gerenciar EC2)
- Auto scaling (2-10 instâncias)
- Deployment zero-downtime (rolling update)
- Task definition versionada
- CloudWatch Logs integrado

**Configuração Recomendada:**
- CPU: 0.5 vCPU por container
- RAM: 1 GB por container
- Min: 2 containers (alta disponibilidade)
- Max: 10 containers (auto scaling)

**Custo:** $0.04048/vCPU-hora + $0.004445/GB-hora  
**Exemplo:** 2 containers × 0.5 vCPU × 1 GB × 730 horas = $44/mês

**ECR (Elastic Container Registry)**
- Armazenamento de imagens Docker
- Versionamento de imagens
- Scan de vulnerabilidades
- Integração com ECS

**Custo:** $0.10/GB-mês (armazenamento)

#### 2.2.3 Camada de Dados

**RDS PostgreSQL (Multi-AZ)**
- Banco de dados gerenciado
- Backups automáticos diários
- Point-in-time recovery (35 dias)
- Multi-AZ (alta disponibilidade)
- Read replicas (opcional)
- Criptografia em repouso (AES-256)

**Configuração Recomendada:**
- Instância: db.t3.medium (2 vCPU, 4 GB RAM)
- Storage: 100 GB SSD (gp3)
- Multi-AZ: Sim
- Backup: 7 dias

**Custo:** $60/mês (instância) + $10/mês (storage) = $70/mês

**ElastiCache Redis**
- Cache de sessões
- Cache de resultados de validação
- Rate limiting distribuído
- Pub/Sub para notificações

**Configuração Recomendada:**
- Instância: cache.t3.micro (0.5 GB RAM)
- Cluster mode: Desabilitado
- Replication: 1 replica (alta disponibilidade)

**Custo:** $15/mês

**S3 (Simple Storage Service)**
- Armazenamento de uploads (CSV)
- Armazenamento de backups (RDS)
- Armazenamento de logs (ALB, CloudFront)
- Versionamento habilitado
- Criptografia em repouso (SSE-S3)
- Lifecycle policies (mover para Glacier após 90 dias)

**Custo:** $0.023/GB-mês (Standard) + $0.09/GB transferido

#### 2.2.4 Camada de Segurança

**Secrets Manager**
- Armazenamento seguro de secrets (API keys, senhas)
- Rotação automática de secrets
- Auditoria de acesso (CloudTrail)
- Integração com ECS

**Secrets Armazenados:**
- DATABASE_URL
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- CREDGUARD_API_KEY
- JWT_SECRET

**Custo:** $0.40/secret/mês + $0.05/10k chamadas  
**Exemplo:** 5 secrets = $2/mês

**KMS (Key Management Service)**
- Criptografia de dados em repouso
- Gerenciamento de chaves
- Auditoria de uso (CloudTrail)

**Custo:** $1/chave/mês + $0.03/10k requests

**Certificate Manager (ACM)**
- Certificados SSL/TLS gratuitos
- Renovação automática
- Integração com ALB e CloudFront

**Custo:** Gratuito

#### 2.2.5 Camada de Monitoramento

**CloudWatch Logs**
- Logs centralizados (ECS, ALB, RDS)
- Retenção: 90 dias
- Filtros e alertas
- Insights (queries SQL-like)

**Custo:** $0.50/GB ingerido + $0.03/GB armazenado

**CloudWatch Metrics**
- Métricas de infraestrutura (CPU, RAM, disco)
- Métricas customizadas (uploads, validações)
- Dashboards visuais
- Alarmes automáticos

**Custo:** $0.30/métrica/mês

**CloudWatch Alarms**
- Alertas por email/SMS
- Integração com SNS
- Ações automáticas (auto scaling)

**Custo:** $0.10/alarme/mês

**X-Ray (APM)**
- Tracing distribuído
- Análise de performance
- Identificação de gargalos
- Mapa de serviços

**Custo:** $5/milhão de traces + $0.50/milhão de traces armazenados

#### 2.2.6 Camada de CI/CD

**CodePipeline**
- Pipeline automatizado (GitHub → Build → Deploy)
- Integração com GitHub
- Approval manual (opcional)
- Rollback automático

**Custo:** $1/pipeline ativo/mês

**CodeBuild**
- Build de imagens Docker
- Testes automatizados
- Push para ECR

**Custo:** $0.005/minuto de build (100 minutos gratuitos/mês)

### 2.3 Segurança

#### 2.3.1 VPC (Virtual Private Cloud)

**Configuração:**
- CIDR: 10.0.0.0/16
- 3 Availability Zones (us-east-1a, us-east-1b, us-east-1c)
- Subnets públicas (ALB, NAT Gateway)
- Subnets privadas (ECS, RDS, ElastiCache)
- Internet Gateway (acesso à internet)
- NAT Gateway (saída de subnets privadas)

**Custo:** NAT Gateway: $0.045/hora + $0.045/GB transferido

#### 2.3.2 Security Groups

**ALB Security Group:**
- Inbound: 443 (HTTPS) de 0.0.0.0/0
- Outbound: 8000 (ECS) para ECS Security Group

**ECS Security Group:**
- Inbound: 8000 de ALB Security Group
- Outbound: 5432 (PostgreSQL) para RDS Security Group
- Outbound: 6379 (Redis) para ElastiCache Security Group
- Outbound: 443 (HTTPS) para 0.0.0.0/0 (APIs externas)

**RDS Security Group:**
- Inbound: 5432 de ECS Security Group

**ElastiCache Security Group:**
- Inbound: 6379 de ECS Security Group

#### 2.3.3 IAM (Identity and Access Management)

**Roles Necessários:**

1. **ECS Task Execution Role:**
   - Permissões: ECR pull, CloudWatch Logs, Secrets Manager

2. **ECS Task Role:**
   - Permissões: S3 read/write, RDS connect, ElastiCache connect, Secrets Manager read

3. **CodeBuild Role:**
   - Permissões: ECR push, S3 read/write, CloudWatch Logs

4. **CodePipeline Role:**
   - Permissões: CodeBuild start, ECS deploy, S3 read/write

**Políticas:**
- Princípio do menor privilégio
- MFA obrigatório para usuários humanos
- Rotação de credenciais a cada 90 dias

---

## 3. Deployment

### 3.1 Pré-requisitos

1. **Conta AWS:** Criar conta em aws.amazon.com
2. **AWS CLI:** Instalar e configurar
3. **Docker:** Instalar Docker Desktop
4. **Terraform:** Instalar Terraform (opcional, mas recomendado)
5. **Domínio:** Registrar domínio (Route 53 ou externo)

### 3.2 Passo a Passo (Manual)

#### Passo 1: Criar VPC

```bash
# Criar VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=credguard-vpc}]'

# Criar subnets públicas (3 AZs)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.3.0/24 --availability-zone us-east-1c

# Criar subnets privadas (3 AZs)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.11.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.12.0/24 --availability-zone us-east-1b
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.13.0/24 --availability-zone us-east-1c

# Criar Internet Gateway
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --vpc-id vpc-xxx --internet-gateway-id igw-xxx

# Criar NAT Gateway
aws ec2 create-nat-gateway --subnet-id subnet-xxx --allocation-id eipalloc-xxx
```

#### Passo 2: Criar RDS PostgreSQL

```bash
# Criar subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name credguard-db-subnet \
  --db-subnet-group-description "CredGuard DB Subnet Group" \
  --subnet-ids subnet-xxx subnet-yyy subnet-zzz

# Criar RDS instance
aws rds create-db-instance \
  --db-instance-identifier credguard-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password <SENHA_FORTE> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --db-subnet-group-name credguard-db-subnet \
  --vpc-security-group-ids sg-xxx \
  --multi-az \
  --backup-retention-period 7 \
  --storage-encrypted \
  --enable-cloudwatch-logs-exports '["postgresql"]'
```

#### Passo 3: Criar ElastiCache Redis

```bash
# Criar subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name credguard-redis-subnet \
  --cache-subnet-group-description "CredGuard Redis Subnet Group" \
  --subnet-ids subnet-xxx subnet-yyy subnet-zzz

# Criar Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id credguard-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name credguard-redis-subnet \
  --security-group-ids sg-xxx \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled
```

#### Passo 4: Criar Secrets Manager

```bash
# Criar secrets
aws secretsmanager create-secret \
  --name credguard/database-url \
  --secret-string "postgresql://postgres:<SENHA>@<RDS_ENDPOINT>:5432/credguard"

aws secretsmanager create-secret \
  --name credguard/stripe-secret-key \
  --secret-string "sk_live_..."

aws secretsmanager create-secret \
  --name credguard/stripe-webhook-secret \
  --secret-string "whsec_..."

aws secretsmanager create-secret \
  --name credguard/credguard-api-key \
  --secret-string "..."

aws secretsmanager create-secret \
  --name credguard/jwt-secret \
  --secret-string "$(openssl rand -base64 32)"
```

#### Passo 5: Criar ECR Repository

```bash
# Criar repository
aws ecr create-repository --repository-name credguard

# Login no ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build e push da imagem
docker build -t credguard .
docker tag credguard:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/credguard:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/credguard:latest
```

#### Passo 6: Criar ECS Cluster

```bash
# Criar cluster
aws ecs create-cluster --cluster-name credguard-cluster

# Criar task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Criar service
aws ecs create-service \
  --cluster credguard-cluster \
  --service-name credguard-service \
  --task-definition credguard-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=credguard,containerPort=8000"
```

#### Passo 7: Criar Application Load Balancer

```bash
# Criar ALB
aws elbv2 create-load-balancer \
  --name credguard-alb \
  --subnets subnet-xxx subnet-yyy subnet-zzz \
  --security-groups sg-xxx \
  --scheme internet-facing \
  --type application

# Criar target group
aws elbv2 create-target-group \
  --name credguard-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30

# Criar listener HTTPS
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

#### Passo 8: Configurar Route 53

```bash
# Criar hosted zone
aws route53 create-hosted-zone --name credguard.com --caller-reference $(date +%s)

# Criar record A (alias para ALB)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://route53-change.json
```

#### Passo 9: Configurar CloudFront

```bash
# Criar distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

#### Passo 10: Configurar WAF

```bash
# Criar web ACL
aws wafv2 create-web-acl \
  --name credguard-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json

# Associar com ALB
aws wafv2 associate-web-acl \
  --web-acl-arn arn:aws:wafv2:... \
  --resource-arn arn:aws:elasticloadbalancing:...
```

### 3.3 Passo a Passo (Terraform)

**Vantagens:**
- Infraestrutura como código
- Versionamento no Git
- Idempotente (pode rodar múltiplas vezes)
- Facilita disaster recovery

**Arquivo:** `terraform/main.tf`

```hcl
provider "aws" {
  region = "us-east-1"
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "credguard-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  
  enable_nat_gateway = true
  single_nat_gateway = false
  
  tags = {
    Environment = "production"
    Project     = "credguard"
  }
}

# RDS PostgreSQL
module "rds" {
  source = "terraform-aws-modules/rds/aws"
  
  identifier = "credguard-db"
  
  engine               = "postgres"
  engine_version       = "15.4"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 500
  storage_encrypted     = true
  
  db_name  = "credguard"
  username = "postgres"
  port     = 5432
  
  multi_az               = true
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [module.rds_sg.security_group_id]
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = {
    Environment = "production"
    Project     = "credguard"
  }
}

# ElastiCache Redis
module "redis" {
  source = "terraform-aws-modules/elasticache/aws"
  
  cluster_id           = "credguard-redis"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  
  subnet_group_name = module.vpc.elasticache_subnet_group_name
  security_group_ids = [module.redis_sg.security_group_id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = {
    Environment = "production"
    Project     = "credguard"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "credguard-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Environment = "production"
    Project     = "credguard"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "main" {
  family                   = "credguard-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([
    {
      name      = "credguard"
      image     = "${aws_ecr_repository.main.repository_url}:latest"
      essential = true
      
      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "FLASK_ENV"
          value = "production"
        }
      ]
      
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_secretsmanager_secret.database_url.arn
        },
        {
          name      = "STRIPE_SECRET_KEY"
          valueFrom = aws_secretsmanager_secret.stripe_secret_key.arn
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/credguard"
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
  
  tags = {
    Environment = "production"
    Project     = "credguard"
  }
}

# ECS Service
resource "aws_ecs_service" "main" {
  name            = "credguard-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = 2
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [module.ecs_sg.security_group_id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "credguard"
    container_port   = 8000
  }
  
  depends_on = [aws_lb_listener.https]
  
  tags = {
    Environment = "production"
    Project     = "credguard"
  }
}

# Application Load Balancer
module "alb" {
  source = "terraform-aws-modules/alb/aws"
  
  name = "credguard-alb"
  
  load_balancer_type = "application"
  
  vpc_id          = module.vpc.vpc_id
  subnets         = module.vpc.public_subnets
  security_groups = [module.alb_sg.security_group_id]
  
  target_groups = [
    {
      name             = "credguard-tg"
      backend_protocol = "HTTP"
      backend_port     = 8000
      target_type      = "ip"
      
      health_check = {
        enabled             = true
        interval            = 30
        path                = "/health"
        port                = "traffic-port"
        healthy_threshold   = 2
        unhealthy_threshold = 2
        timeout             = 5
        protocol            = "HTTP"
        matcher             = "200"
      }
    }
  ]
  
  https_listeners = [
    {
      port               = 443
      protocol           = "HTTPS"
      certificate_arn    = aws_acm_certificate.main.arn
      target_group_index = 0
    }
  ]
  
  tags = {
    Environment = "production"
    Project     = "credguard"
  }
}

# Route 53
resource "aws_route53_zone" "main" {
  name = "credguard.com"
  
  tags = {
    Environment = "production"
    Project     = "credguard"
  }
}

resource "aws_route53_record" "main" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "credguard.com"
  type    = "A"
  
  alias {
    name                   = module.alb.lb_dns_name
    zone_id                = module.alb.lb_zone_id
    evaluate_target_health = true
  }
}

# CloudFront
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  origin {
    domain_name = module.alb.lb_dns_name
    origin_id   = "alb"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "alb"
    
    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization"]
      
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  tags = {
    Environment = "production"
    Project     = "credguard"
  }
}

# WAF
resource "aws_wafv2_web_acl" "main" {
  name  = "credguard-waf"
  scope = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  rule {
    name     = "RateLimitRule"
    priority = 1
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "credguard-waf"
    sampled_requests_enabled   = true
  }
  
  tags = {
    Environment = "production"
    Project     = "credguard"
  }
}

resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = module.alb.lb_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
```

**Deploy com Terraform:**

```bash
# Inicializar Terraform
cd terraform
terraform init

# Planejar mudanças
terraform plan

# Aplicar mudanças
terraform apply

# Destruir infraestrutura (cuidado!)
terraform destroy
```

---

## 4. Custos Estimados

### 4.1 Custos Mensais (Produção)

| Serviço | Configuração | Custo Mensal (USD) | Custo Mensal (BRL) |
|---------|--------------|--------------------|--------------------|
| **Route 53** | 1 hosted zone + 1M queries | $0.90 | R$ 4.50 |
| **CloudFront** | 100 GB transferidos | $8.50 | R$ 42.50 |
| **AWS WAF** | 1 web ACL + 1M requests | $6.00 | R$ 30.00 |
| **ALB** | 1 ALB + 10 LCU-hora | $22.00 | R$ 110.00 |
| **ECS Fargate** | 2 containers (0.5 vCPU, 1 GB) | $44.00 | R$ 220.00 |
| **ECR** | 5 GB imagens | $0.50 | R$ 2.50 |
| **RDS PostgreSQL** | db.t3.medium Multi-AZ + 100 GB | $70.00 | R$ 350.00 |
| **ElastiCache Redis** | cache.t3.micro | $15.00 | R$ 75.00 |
| **S3** | 50 GB + 100 GB transferidos | $10.00 | R$ 50.00 |
| **Secrets Manager** | 5 secrets | $2.00 | R$ 10.00 |
| **KMS** | 1 chave | $1.00 | R$ 5.00 |
| **NAT Gateway** | 3 NAT Gateways + 100 GB | $110.00 | R$ 550.00 |
| **CloudWatch Logs** | 10 GB ingeridos + 10 GB armazenados | $5.30 | R$ 26.50 |
| **CloudWatch Metrics** | 10 métricas customizadas | $3.00 | R$ 15.00 |
| **CloudWatch Alarms** | 10 alarmes | $1.00 | R$ 5.00 |
| **X-Ray** | 1M traces | $5.50 | R$ 27.50 |
| **CodePipeline** | 1 pipeline | $1.00 | R$ 5.00 |
| **CodeBuild** | 100 minutos/mês | $0.50 | R$ 2.50 |
| **Certificate Manager** | 1 certificado | $0.00 | R$ 0.00 |
| **TOTAL** | | **$306.20** | **R$ 1.531.00** |

**Observações:**
- Câmbio: 1 USD = 5 BRL (aproximado)
- Custos podem variar conforme uso
- NAT Gateway é o item mais caro (36% do total)
- Considerar usar VPC Endpoints para reduzir tráfego NAT

### 4.2 Custos Anuais

| Item | Custo Anual (USD) | Custo Anual (BRL) |
|------|-------------------|-------------------|
| **Infraestrutura AWS** | $3.674,40 | R$ 18.372,00 |
| **Certificado SSL** (opcional) | $0-500 | R$ 0-2.500 |
| **Domínio** (.com) | $12 | R$ 60 |
| **Ferramentas Externas** | | |
| - Sentry (Error Tracking) | $312 | R$ 1.560 |
| - New Relic (APM) | $1.188 | R$ 5.940 |
| - UptimeRobot (Monitoring) | $84 | R$ 420 |
| - SendGrid (Email) | $180 | R$ 900 |
| - Intercom (Chat) | $888 | R$ 4.440 |
| **TOTAL** | **$6.338,40** | **R$ 31.692,00** |

**Custo Mensal Médio:** $528,20 (R$ 2.641,00)

### 4.3 Otimização de Custos

#### 4.3.1 Reduzir NAT Gateway (Economia: $100/mês)

**Problema:** NAT Gateway custa $110/mês (36% do total)

**Solução:**
- Usar 1 NAT Gateway em vez de 3 (reduz alta disponibilidade)
- Usar VPC Endpoints para S3, ECR, Secrets Manager (sem custo de transferência)
- Usar instâncias EC2 NAT em vez de NAT Gateway (mais barato, mas mais trabalho)

**Economia:** $70-100/mês

#### 4.3.2 Usar Reserved Instances (Economia: $30/mês)

**Problema:** RDS e ElastiCache cobram por hora

**Solução:**
- Comprar Reserved Instances (1 ou 3 anos)
- Desconto de 30-60% no preço

**Economia:** $30-50/mês

#### 4.3.3 Usar Spot Instances para ECS (Economia: $20/mês)

**Problema:** Fargate custa $44/mês

**Solução:**
- Usar Fargate Spot (70% mais barato)
- Aceitar interrupções ocasionais

**Economia:** $20-30/mês

#### 4.3.4 Reduzir Retenção de Logs (Economia: $3/mês)

**Problema:** CloudWatch Logs cobra por GB armazenado

**Solução:**
- Reduzir retenção de 90 para 30 dias
- Exportar logs antigos para S3 (mais barato)

**Economia:** $2-3/mês

#### 4.3.5 Usar S3 Intelligent-Tiering (Economia: $5/mês)

**Problema:** S3 Standard cobra $0.023/GB

**Solução:**
- Usar S3 Intelligent-Tiering (move automaticamente para tiers mais baratos)
- Usar S3 Glacier para backups antigos

**Economia:** $3-5/mês

**Total de Economia Potencial:** $125-188/mês (41-61% de redução)

**Custo Otimizado:** $118-181/mês (R$ 590-905/mês)

---

## 5. Escalabilidade

### 5.1 Auto Scaling

**ECS Auto Scaling:**
- Métrica: CPU > 70% ou RAM > 80%
- Scale out: +1 container (até 10)
- Scale in: -1 container (mínimo 2)
- Cooldown: 5 minutos

**RDS Auto Scaling:**
- Storage: Aumenta automaticamente até 500 GB
- Read Replicas: Adicionar manualmente conforme necessidade

**ElastiCache Auto Scaling:**
- Não suporta auto scaling nativo
- Adicionar nodes manualmente conforme necessidade

### 5.2 Capacidade por Configuração

| Configuração | Usuários Simultâneos | Requests/Segundo | Custo Mensal |
|--------------|----------------------|------------------|--------------|
| **Mínimo** (2 containers) | 100-200 | 50-100 | $306 (R$ 1.531) |
| **Médio** (5 containers) | 500-1000 | 250-500 | $450 (R$ 2.250) |
| **Alto** (10 containers) | 1000-2000 | 500-1000 | $650 (R$ 3.250) |

**Observações:**
- Capacidade varia conforme complexidade das requisições
- Considerar cache (Redis) para aumentar capacidade
- Considerar CDN (CloudFront) para reduzir carga no backend

---

## 6. Disaster Recovery

### 6.1 Backups

**RDS PostgreSQL:**
- Backups automáticos diários
- Retenção: 7 dias
- Point-in-time recovery (35 dias)
- Snapshots manuais (retenção ilimitada)

**S3:**
- Versionamento habilitado
- Lifecycle policies (mover para Glacier após 90 dias)
- Cross-region replication (opcional)

**Secrets Manager:**
- Versionamento automático
- Retenção: 7 dias após deletar

### 6.2 Recovery Time Objective (RTO)

**Cenário 1: Falha de Container (ECS)**
- RTO: 2-5 minutos
- Ação: Auto scaling cria novo container

**Cenário 2: Falha de Availability Zone**
- RTO: 5-10 minutos
- Ação: Multi-AZ redireciona para outra AZ

**Cenário 3: Falha de Região**
- RTO: 1-4 horas
- Ação: Restaurar backup em outra região (manual)

**Cenário 4: Corrupção de Dados**
- RTO: 1-2 horas
- Ação: Point-in-time recovery do RDS

### 6.3 Recovery Point Objective (RPO)

**RDS PostgreSQL:**
- RPO: 5 minutos (backups contínuos)

**S3:**
- RPO: 0 (versionamento)

**ElastiCache Redis:**
- RPO: 1 hora (sem backups automáticos)
- Recomendação: Usar Redis com AOF (Append-Only File)

---

## 7. Conclusão

A arquitetura AWS proposta para CredGuard é **robusta, escalável e segura**, utilizando serviços gerenciados para minimizar overhead operacional.

### 7.1 Resumo de Custos

| Cenário | Custo Mensal | Custo Anual |
|---------|--------------|-------------|
| **Mínimo** (sem otimizações) | $306 (R$ 1.531) | $3.674 (R$ 18.372) |
| **Otimizado** | $118-181 (R$ 590-905) | $1.416-2.172 (R$ 7.080-10.860) |
| **Com Ferramentas Externas** | $528 (R$ 2.641) | $6.338 (R$ 31.692) |

### 7.2 Próximos Passos

1. **Semana 1:** Criar conta AWS e configurar billing alerts
2. **Semana 2:** Implementar infraestrutura com Terraform
3. **Semana 3:** Deploy da aplicação e testes
4. **Semana 4:** Configurar monitoramento e alertas
5. **Semana 5:** Testes de carga e otimização
6. **Semana 6:** Go-live

**Tempo Total:** 6 semanas (1.5 meses)

### 7.3 Recomendações

1. **Usar Terraform:** Facilita manutenção e disaster recovery
2. **Implementar CI/CD:** Reduz tempo de deploy e erros humanos
3. **Monitorar Custos:** Configurar billing alerts ($100, $200, $300)
4. **Otimizar Custos:** Implementar otimizações listadas (economia de 41-61%)
5. **Testar Disaster Recovery:** Fazer drill de disaster recovery trimestralmente
6. **Documentar:** Manter documentação atualizada (runbooks, playbooks)

**A solução CredGuard pode ser implantada na AWS com sucesso, com custo mensal estimado de R$ 590-2.641 dependendo do nível de otimização e ferramentas externas utilizadas.**
