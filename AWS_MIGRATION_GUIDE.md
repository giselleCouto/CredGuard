# Guia de Migração para AWS - CredGuard

**Migração da Plataforma CredGuard do Ambiente Manus para Infraestrutura Própria na AWS**

**Versão:** 1.0  
**Data:** Novembro 2025  
**Autor:** Equipe CredGuard

---

## Sumário Executivo

Este documento fornece um guia completo para migrar a plataforma CredGuard do ambiente gerenciado Manus para uma infraestrutura própria na Amazon Web Services (AWS). A migração permitirá maior controle sobre recursos, custos e escalabilidade, mantendo todas as funcionalidades existentes da plataforma.

O processo de migração envolve a configuração de serviços AWS (RDS, S3, EC2/ECS, CloudFront), ajustes no código para remover dependências do Manus, configuração de CI/CD, e migração de dados. O tempo estimado para conclusão da migração é de **2 a 3 semanas**, dependendo da complexidade da configuração de infraestrutura e volume de dados a migrar.

**Custos Estimados (AWS):**

- **Ambiente de Produção**: ~USD 300-500/mês (dependendo do tráfego)
- **Ambiente de Desenvolvimento**: ~USD 100-150/mês

---

## 1. Visão Geral da Migração

### 1.1 Objetivos da Migração

A migração para AWS tem os seguintes objetivos principais:

**Controle Total de Infraestrutura**: Gerenciar diretamente recursos de computação, armazenamento e rede, permitindo otimizações específicas para as necessidades da plataforma.

**Redução de Custos a Longo Prazo**: Embora o investimento inicial seja maior, a infraestrutura própria tende a ser mais econômica em escala, especialmente com uso de instâncias reservadas e spot instances.

**Escalabilidade Personalizada**: Configurar auto-scaling baseado em métricas específicas da aplicação, garantindo performance durante picos de uso.

**Conformidade e Segurança**: Implementar políticas de segurança customizadas, criptografia em repouso e em trânsito, e conformidade com regulamentações específicas do setor financeiro.

**Independência de Plataforma**: Eliminar dependência de serviços gerenciados do Manus, garantindo portabilidade e evitando vendor lock-in.

### 1.2 Componentes a Migrar

A migração envolve os seguintes componentes da plataforma CredGuard:

| Componente | Ambiente Atual (Manus) | Ambiente Futuro (AWS) |
|------------|------------------------|----------------------|
| **Frontend (React)** | Manus Hosting | S3 + CloudFront |
| **Backend (Node.js + Express)** | Manus Compute | EC2 / ECS Fargate |
| **Banco de Dados (MySQL)** | Manus Database | RDS MySQL |
| **Armazenamento de Arquivos** | Manus Storage | S3 |
| **Autenticação** | Manus OAuth | AWS Cognito ou Auth0 |
| **CI/CD** | Manus Deploy | GitHub Actions + AWS CodeDeploy |
| **Monitoramento** | Manus Monitoring | CloudWatch + X-Ray |
| **DNS e SSL** | Manus Domain | Route 53 + ACM |

### 1.3 Dependências do Manus a Remover

As seguintes dependências do ambiente Manus precisam ser substituídas ou removidas:

**Manus OAuth**: Substituir por AWS Cognito, Auth0 ou implementação própria de OAuth 2.0

**Manus Built-in APIs**: Remover dependências de APIs internas do Manus (LLM, Storage, Notification)

**Manus Environment Variables**: Migrar variáveis de ambiente para AWS Systems Manager Parameter Store ou Secrets Manager

**Manus Deployment System**: Substituir por CI/CD próprio com GitHub Actions e AWS CodeDeploy

---

## 2. Arquitetura AWS Recomendada

### 2.1 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUÁRIOS FINAIS                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Route 53 (DNS)                                │
│                    credguard.com.br                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              CloudFront (CDN + SSL/TLS)                          │
│              Certificado ACM (*.credguard.com.br)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                                           ↓
┌──────────────────┐                    ┌──────────────────────┐
│   S3 (Frontend)  │                    │  ALB (Load Balancer) │
│   React Build    │                    │   /api/* → Backend   │
└──────────────────┘                    └──────────────────────┘
                                                   ↓
                                        ┌──────────────────────┐
                                        │   ECS Fargate        │
                                        │   (Backend Nodes)    │
                                        │   Auto Scaling 2-10  │
                                        └──────────────────────┘
                                                   ↓
                        ┌──────────────────────────┼──────────────────────┐
                        ↓                          ↓                      ↓
                ┌───────────────┐        ┌───────────────┐      ┌───────────────┐
                │  RDS MySQL    │        │   S3 Bucket   │      │  Cognito      │
                │  Multi-AZ     │        │   (Files)     │      │  (Auth)       │
                │  Encrypted    │        │   Encrypted   │      │               │
                └───────────────┘        └───────────────┘      └───────────────┘
                        ↓
                ┌───────────────┐
                │  RDS Replica  │
                │  (Read-only)  │
                └───────────────┘
```

### 2.2 Serviços AWS Utilizados

#### 2.2.1 Amazon RDS (Relational Database Service)

**Configuração Recomendada:**

- **Engine**: MySQL 8.0
- **Instance Type**: db.t3.medium (Produção) / db.t3.small (Desenvolvimento)
- **Storage**: 100 GB SSD (gp3) com auto-scaling até 500 GB
- **Multi-AZ**: Habilitado para alta disponibilidade
- **Backup**: Retenção de 7 dias com snapshots automáticos
- **Encryption**: Habilitado com AWS KMS
- **Read Replica**: 1 réplica para queries de leitura (opcional)

**Custo Estimado**: ~USD 150-200/mês (Produção)

#### 2.2.2 Amazon S3 (Simple Storage Service)

**Buckets Necessários:**

1. **Frontend Bucket** (`credguard-frontend-prod`)
   - Hospedagem de build React (HTML, CSS, JS)
   - Versionamento habilitado
   - Lifecycle policy: manter últimas 10 versões

2. **Files Bucket** (`credguard-files-prod`)
   - Armazenamento de CSVs de upload e resultados
   - Encryption: SSE-S3 ou SSE-KMS
   - Lifecycle policy: mover para Glacier após 90 dias

3. **Backups Bucket** (`credguard-backups-prod`)
   - Backups de banco de dados
   - Replicação cross-region habilitada
   - Lifecycle policy: mover para Glacier após 30 dias

**Custo Estimado**: ~USD 20-50/mês (dependendo do volume)

#### 2.2.3 Amazon ECS Fargate (Container Orchestration)

**Configuração Recomendada:**

- **Cluster**: credguard-prod
- **Service**: credguard-backend
- **Task Definition**:
  - CPU: 1 vCPU
  - Memory: 2 GB
  - Container Image: credguard-backend:latest (ECR)
- **Auto Scaling**:
  - Min: 2 tasks
  - Max: 10 tasks
  - Target CPU: 70%
  - Target Memory: 80%
- **Load Balancer**: Application Load Balancer (ALB)
- **Health Check**: /api/health endpoint

**Custo Estimado**: ~USD 100-200/mês (2-4 tasks em média)

#### 2.2.4 Amazon CloudFront (CDN)

**Configuração Recomendada:**

- **Origins**:
  - S3 (Frontend): credguard-frontend-prod
  - ALB (Backend): /api/* → backend ALB
- **SSL/TLS**: Certificado ACM para *.credguard.com.br
- **Cache Behavior**:
  - Frontend: Cache por 1 hora
  - Backend: No cache (pass-through)
- **Geo Restriction**: Brasil apenas (opcional)
- **WAF**: Habilitado para proteção contra ataques

**Custo Estimado**: ~USD 20-50/mês (dependendo do tráfego)

#### 2.2.5 AWS Cognito (Autenticação)

**Configuração Recomendada:**

- **User Pool**: credguard-users
- **App Client**: credguard-web
- **MFA**: Opcional (SMS ou TOTP)
- **Password Policy**: Mínimo 8 caracteres, letras e números
- **OAuth 2.0 Flows**: Authorization Code + PKCE
- **Custom Attributes**: tenant_id, role

**Custo Estimado**: ~USD 5-10/mês (até 50k MAUs gratuitos)

#### 2.2.6 Amazon Route 53 (DNS)

**Configuração Recomendada:**

- **Hosted Zone**: credguard.com.br
- **Records**:
  - A (Alias) → CloudFront Distribution
  - CNAME www → CloudFront Distribution
  - MX → Email provider (se aplicável)

**Custo Estimado**: ~USD 1-2/mês

#### 2.2.7 AWS Certificate Manager (ACM)

**Certificados Necessários:**

- **Wildcard Certificate**: *.credguard.com.br
- **Validation**: DNS (automático via Route 53)
- **Renewal**: Automático

**Custo**: Gratuito

#### 2.2.8 Amazon CloudWatch (Monitoramento)

**Métricas e Logs:**

- **ECS Metrics**: CPU, Memory, Network
- **RDS Metrics**: Connections, CPU, IOPS
- **ALB Metrics**: Request Count, Latency, Errors
- **Custom Metrics**: Batch jobs, scores gerados
- **Logs**: Application logs, access logs, error logs
- **Alarms**: CPU > 80%, Memory > 85%, Errors > 1%

**Custo Estimado**: ~USD 10-20/mês

---

## 3. Pré-Requisitos para Migração

### 3.1 Conta AWS

Criar uma conta AWS com as seguintes configurações:

**Billing Alerts**: Configurar alertas de custo para evitar surpresas (ex: alerta se custo mensal > USD 600)

**IAM Users**: Criar usuários IAM para desenvolvedores com permissões adequadas (evitar uso de root account)

**MFA**: Habilitar autenticação multifator para root account e usuários admin

**Regions**: Escolher região primária (recomendado: us-east-1 ou sa-east-1 para Brasil)

### 3.2 Ferramentas Necessárias

Instalar as seguintes ferramentas no ambiente de desenvolvimento:

| Ferramenta | Versão | Propósito |
|------------|--------|-----------|
| **AWS CLI** | 2.x | Gerenciamento de recursos AWS via linha de comando |
| **Terraform** | 1.5+ | Infraestrutura como código (IaC) |
| **Docker** | 20.x+ | Containerização da aplicação |
| **Node.js** | 22.x | Runtime da aplicação |
| **MySQL Client** | 8.x | Acesso ao banco de dados |
| **Git** | 2.x | Controle de versão |

### 3.3 Domínio e DNS

**Domínio Próprio**: Registrar domínio (ex: credguard.com.br) via Route 53 ou outro registrar

**Nameservers**: Apontar nameservers do domínio para Route 53

**Certificado SSL**: Solicitar certificado wildcard via ACM (*.credguard.com.br)

### 3.4 Repositório Git

**GitHub Repository**: Criar repositório privado para o código da aplicação

**Branches**: Configurar branches (main, staging, development)

**Secrets**: Configurar GitHub Secrets para deploy automático (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)

---

## 4. Processo de Migração Passo a Passo

### 4.1 Fase 1: Preparação do Código (Semana 1)

#### 4.1.1 Remover Dependências do Manus

**Passo 1: Substituir Manus OAuth por AWS Cognito**

O código atual utiliza o Manus OAuth para autenticação. É necessário substituir por AWS Cognito ou outra solução de autenticação.

**Arquivos a Modificar:**

- `server/_core/oauth.ts` - Remover lógica de Manus OAuth
- `server/_core/context.ts` - Atualizar para usar Cognito JWT
- `client/src/hooks/useAuth.ts` - Atualizar para usar Cognito SDK

**Exemplo de Implementação com Cognito:**

```typescript
// server/_core/cognito.ts
import { CognitoJwtVerifier } from "aws-jwt-verify";

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID!,
});

export async function verifyToken(token: string) {
  try {
    const payload = await verifier.verify(token);
    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload["custom:tenant_id"],
    };
  } catch (error) {
    return null;
  }
}
```

**Passo 2: Remover Dependências de Built-in Forge APIs**

O código atual pode usar APIs internas do Manus (LLM, Storage, Notification). Estas devem ser substituídas ou removidas.

**Opções de Substituição:**

- **LLM**: Integrar diretamente com OpenAI API ou AWS Bedrock
- **Storage**: Já usa S3, apenas atualizar credenciais
- **Notification**: Implementar com AWS SNS ou SendGrid

**Passo 3: Atualizar Variáveis de Ambiente**

Criar arquivo `.env.production` com variáveis necessárias:

```bash
# Database
DATABASE_URL=mysql://user:pass@credguard-db.xxxxx.us-east-1.rds.amazonaws.com:3306/credguard

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_FILES=credguard-files-prod

# Cognito
COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_CLIENT_ID=xxxxx
COGNITO_REGION=us-east-1

# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://credguard.com.br

# External APIs
APIBRASIL_TOKEN=xxxxx (se usar bureau)
```

#### 4.1.2 Containerizar a Aplicação

Criar `Dockerfile` para o backend:

```dockerfile
# Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production image
FROM node:22-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/server/_core/index.js"]
```

Criar `.dockerignore`:

```
node_modules
.git
.env
*.md
client/
```

#### 4.1.3 Configurar CI/CD com GitHub Actions

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: credguard-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster credguard-prod --service credguard-backend --force-new-deployment
      
      - name: Build and deploy frontend
        run: |
          cd client
          npm install
          npm run build
          aws s3 sync dist/ s3://credguard-frontend-prod --delete
          aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"
```

### 4.2 Fase 2: Configuração da Infraestrutura AWS (Semana 2)

#### 4.2.1 Criar Infraestrutura com Terraform

Criar arquivo `terraform/main.tf`:

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.5"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "credguard-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "credguard-vpc"
  }
}

# Subnets
resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  
  tags = {
    Name = "credguard-public-1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
  
  tags = {
    Name = "credguard-public-2"
  }
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}a"
  
  tags = {
    Name = "credguard-private-1"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "${var.aws_region}b"
  
  tags = {
    Name = "credguard-private-2"
  }
}

# RDS MySQL
resource "aws_db_instance" "main" {
  identifier             = "credguard-db"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.medium"
  allocated_storage      = 100
  storage_type           = "gp3"
  storage_encrypted      = true
  multi_az               = true
  db_name                = "credguard"
  username               = var.db_username
  password               = var.db_password
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  backup_retention_period = 7
  skip_final_snapshot    = false
  final_snapshot_identifier = "credguard-final-snapshot"
  
  tags = {
    Name = "credguard-db"
  }
}

# S3 Buckets
resource "aws_s3_bucket" "frontend" {
  bucket = "credguard-frontend-prod"
  
  tags = {
    Name = "credguard-frontend"
  }
}

resource "aws_s3_bucket" "files" {
  bucket = "credguard-files-prod"
  
  tags = {
    Name = "credguard-files"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "credguard-prod"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "credguard-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([{
    name      = "credguard-backend"
    image     = "${aws_ecr_repository.backend.repository_url}:latest"
    essential = true
    
    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]
    
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "3000" }
    ]
    
    secrets = [
      { name = "DATABASE_URL", valueFrom = "${aws_secretsmanager_secret.db_url.arn}" }
    ]
    
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/credguard-backend"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

# ECS Service
resource "aws_ecs_service" "backend" {
  name            = "credguard-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "credguard-backend"
    container_port   = 3000
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "credguard-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-Frontend"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }
  
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-Backend"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Frontend"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-Backend"
    
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Host"]
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.main.arn
    ssl_support_method  = "sni-only"
  }
}
```

#### 4.2.2 Aplicar Terraform

```bash
# Inicializar Terraform
cd terraform
terraform init

# Planejar mudanças
terraform plan -out=plan.tfplan

# Aplicar mudanças
terraform apply plan.tfplan
```

### 4.3 Fase 3: Migração de Dados (Semana 2-3)

#### 4.3.1 Exportar Dados do Manus

**Passo 1: Exportar Banco de Dados**

Acessar o banco de dados Manus e exportar via `mysqldump`:

```bash
# Conectar ao banco Manus (obter credenciais do painel Manus)
mysqldump -h manus-db-host -u username -p database_name > credguard_backup.sql
```

**Passo 2: Exportar Arquivos S3**

Baixar todos os arquivos do bucket Manus:

```bash
# Configurar AWS CLI com credenciais Manus
aws s3 sync s3://manus-bucket/credguard/ ./credguard-files/
```

#### 4.3.2 Importar Dados para AWS

**Passo 1: Importar Banco de Dados**

```bash
# Conectar ao RDS e importar dump
mysql -h credguard-db.xxxxx.us-east-1.rds.amazonaws.com -u admin -p credguard < credguard_backup.sql
```

**Passo 2: Importar Arquivos para S3**

```bash
# Upload de arquivos para S3 AWS
aws s3 sync ./credguard-files/ s3://credguard-files-prod/
```

### 4.4 Fase 4: Testes e Validação (Semana 3)

#### 4.4.1 Testes de Funcionalidade

Executar testes completos de todas as funcionalidades:

- Upload em lote de clientes
- Geração de scores
- Integração com bureaus
- Download de resultados
- Configuração de bureau
- Métricas de bureau
- Autenticação e autorização

#### 4.4.2 Testes de Performance

Executar testes de carga para validar performance:

```bash
# Instalar Apache Bench
sudo apt-get install apache2-utils

# Teste de carga (1000 requests, 10 concurrent)
ab -n 1000 -c 10 https://credguard.com.br/api/health
```

**Métricas Esperadas:**

- Latência média: < 100ms
- Throughput: > 80 req/s
- Taxa de erro: < 1%

#### 4.4.3 Testes de Segurança

Validar configurações de segurança:

- SSL/TLS configurado corretamente
- Certificados válidos
- Firewall (Security Groups) configurado
- Banco de dados não acessível publicamente
- Buckets S3 com permissões adequadas
- Secrets Manager para credenciais sensíveis

### 4.5 Fase 5: Go-Live (Semana 3)

#### 4.5.1 Atualizar DNS

Atualizar registros DNS para apontar para CloudFront:

```bash
# Via Route 53 Console ou CLI
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://dns-change.json
```

**dns-change.json:**

```json
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "credguard.com.br",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "d1234567890.cloudfront.net",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
```

#### 4.5.2 Monitorar Aplicação

Configurar dashboards no CloudWatch para monitoramento em tempo real:

- CPU e memória do ECS
- Latência do ALB
- Erros de aplicação
- Conexões ao RDS
- Taxa de requisições

#### 4.5.3 Comunicar Usuários

Notificar usuários sobre a migração:

- Downtime planejado (se aplicável)
- Novo domínio (se mudou)
- Novas credenciais de acesso (se aplicável)

---

## 5. Checklist de Migração

### 5.1 Pré-Migração

- [ ] Conta AWS criada e configurada
- [ ] Ferramentas instaladas (AWS CLI, Terraform, Docker)
- [ ] Domínio registrado e DNS configurado
- [ ] Certificado SSL solicitado via ACM
- [ ] Repositório GitHub criado
- [ ] Código exportado do Manus
- [ ] Dependências do Manus identificadas

### 5.2 Preparação do Código

- [ ] Manus OAuth substituído por Cognito
- [ ] Built-in APIs removidas ou substituídas
- [ ] Variáveis de ambiente atualizadas
- [ ] Dockerfile criado
- [ ] CI/CD configurado (GitHub Actions)
- [ ] Testes locais executados com sucesso

### 5.3 Infraestrutura AWS

- [ ] VPC e subnets criadas
- [ ] RDS MySQL provisionado
- [ ] S3 buckets criados
- [ ] ECR repository criado
- [ ] ECS cluster e service configurados
- [ ] ALB configurado
- [ ] CloudFront distribution criada
- [ ] Route 53 hosted zone configurada
- [ ] Security Groups configurados
- [ ] IAM roles e policies criadas

### 5.4 Migração de Dados

- [ ] Backup do banco Manus realizado
- [ ] Banco importado para RDS
- [ ] Arquivos S3 migrados
- [ ] Validação de integridade de dados

### 5.5 Testes

- [ ] Testes de funcionalidade executados
- [ ] Testes de performance executados
- [ ] Testes de segurança executados
- [ ] Testes de integração com bureaus
- [ ] Testes de autenticação

### 5.6 Go-Live

- [ ] DNS atualizado para CloudFront
- [ ] Monitoramento configurado
- [ ] Alertas configurados
- [ ] Backups automáticos habilitados
- [ ] Usuários notificados
- [ ] Documentação atualizada

---

## 6. Custos Estimados

### 6.1 Custos Mensais (Produção)

| Serviço | Configuração | Custo Mensal (USD) |
|---------|-------------|-------------------|
| **RDS MySQL** | db.t3.medium, Multi-AZ, 100GB | 150-200 |
| **ECS Fargate** | 2-4 tasks (1 vCPU, 2GB) | 100-200 |
| **S3** | 100GB storage, 1TB transfer | 20-50 |
| **CloudFront** | 1TB transfer | 20-50 |
| **Route 53** | 1 hosted zone | 1 |
| **CloudWatch** | Logs e métricas | 10-20 |
| **Cognito** | Até 50k MAUs | 5-10 |
| **ALB** | 1 load balancer | 20-30 |
| **ACM** | Certificado SSL | 0 (gratuito) |
| **NAT Gateway** | 2 NAT gateways | 60-90 |
| **Total** | | **~400-650/mês** |

### 6.2 Custos Mensais (Desenvolvimento)

| Serviço | Configuração | Custo Mensal (USD) |
|---------|-------------|-------------------|
| **RDS MySQL** | db.t3.small, Single-AZ, 20GB | 30-50 |
| **ECS Fargate** | 1 task (0.5 vCPU, 1GB) | 20-40 |
| **S3** | 10GB storage | 2-5 |
| **CloudFront** | 100GB transfer | 5-10 |
| **Total** | | **~60-100/mês** |

### 6.3 Otimização de Custos

**Reserved Instances**: Comprar instâncias RDS reservadas (1 ou 3 anos) pode reduzir custos em até 60%

**Spot Instances**: Usar spot instances para ambientes de desenvolvimento pode reduzir custos em até 90%

**S3 Lifecycle Policies**: Mover arquivos antigos para Glacier pode reduzir custos de armazenamento em até 80%

**Auto Scaling**: Configurar auto-scaling agressivo para reduzir custos fora do horário de pico

---

## 7. Rollback Plan

Em caso de problemas durante a migração, seguir o plano de rollback:

### 7.1 Rollback de DNS

Reverter registros DNS para apontar de volta ao Manus:

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://dns-rollback.json
```

### 7.2 Rollback de Banco de Dados

Restaurar backup do banco Manus:

```bash
mysql -h manus-db-host -u username -p database_name < credguard_backup_pre_migration.sql
```

### 7.3 Comunicação

Notificar usuários sobre o rollback e tempo estimado para nova tentativa.

---

## 8. Suporte Pós-Migração

### 8.1 Monitoramento Contínuo

Monitorar métricas críticas nas primeiras 48 horas após migração:

- Taxa de erros de API
- Latência de requisições
- Uso de CPU e memória
- Conexões ao banco de dados
- Taxa de sucesso de uploads

### 8.2 Otimizações

Após estabilização, realizar otimizações:

- Ajustar auto-scaling baseado em padrões de uso
- Otimizar queries de banco de dados
- Configurar cache de CDN para assets estáticos
- Implementar rate limiting para proteção contra abuso

### 8.3 Documentação

Atualizar documentação com:

- Novos endpoints de API
- Novas credenciais de acesso
- Processo de deploy
- Runbooks para incidentes comuns

---

## 9. Próximos Passos

Após migração bem-sucedida, considerar as seguintes melhorias:

**Disaster Recovery**: Configurar replicação cross-region para RDS e S3

**CI/CD Avançado**: Implementar blue-green deployment ou canary releases

**Observabilidade**: Integrar AWS X-Ray para distributed tracing

**Compliance**: Implementar AWS Config para auditoria de conformidade

**Cost Optimization**: Configurar AWS Cost Explorer e Trusted Advisor

---

## 10. Contato e Suporte

Para dúvidas ou suporte durante a migração:

**Equipe Técnica**: tech@credguard.com  
**Suporte AWS**: Abrir ticket via AWS Support Center  
**Documentação AWS**: https://docs.aws.amazon.com

---

**Nota Final**: Este guia fornece uma visão completa do processo de migração, mas cada ambiente pode ter particularidades. Recomenda-se realizar a migração primeiro em um ambiente de staging/desenvolvimento antes de migrar produção.

**Versão do Documento**: 1.0  
**Última Atualização**: Novembro 2025  
**Próxima Revisão**: Após conclusão da migração
