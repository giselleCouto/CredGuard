# CredGuard - Deployment Files

Este diretório contém todos os arquivos necessários para deploy da plataforma CredGuard na AWS.

## Estrutura de Diretórios

```
deployment/
├── docker/
│   ├── Dockerfile              # Dockerfile otimizado para produção
│   └── .dockerignore           # Arquivos a ignorar no build Docker
├── terraform/                  # (Criar conforme AWS_MIGRATION_GUIDE.md)
│   └── main.tf                 # Infraestrutura como código
├── scripts/
│   └── deploy.sh               # Script de deploy automatizado
└── .env.production.example     # Exemplo de variáveis de ambiente
```

## Pré-Requisitos

Antes de realizar o deploy, certifique-se de ter:

1. **Conta AWS** configurada com permissões adequadas
2. **AWS CLI** instalado e configurado (`aws configure`)
3. **Docker** instalado (para build de imagens)
4. **pnpm** instalado (para build do frontend)
5. **Terraform** instalado (opcional, para IaC)

## Configuração Inicial

### 1. Variáveis de Ambiente

Copie o arquivo de exemplo e preencha com seus valores:

```bash
cp deployment/.env.production.example .env.production
```

Edite `.env.production` e preencha todas as variáveis necessárias.

### 2. GitHub Secrets

Configure os seguintes secrets no GitHub (Settings → Secrets and variables → Actions):

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `CLOUDFRONT_DISTRIBUTION_ID` (opcional)
- `VITE_APP_TITLE`
- `VITE_APP_LOGO`

## Deploy Manual

### Deploy Completo (Backend + Frontend)

```bash
./deployment/scripts/deploy.sh --all
```

### Deploy Apenas Backend

```bash
./deployment/scripts/deploy.sh --backend
```

### Deploy Apenas Frontend

```bash
./deployment/scripts/deploy.sh --frontend
```

### Executar Migrações

```bash
./deployment/scripts/deploy.sh --migrations
```

## Deploy Automático (CI/CD)

O deploy automático é realizado via GitHub Actions sempre que há push na branch `main`.

O workflow executa:

1. **Testes** - Lint e testes unitários
2. **Build Backend** - Cria imagem Docker e envia para ECR
3. **Deploy Backend** - Atualiza serviço ECS
4. **Build Frontend** - Compila React app
5. **Deploy Frontend** - Envia para S3 e invalida cache CloudFront

Para acompanhar o deploy:

1. Acesse **Actions** no repositório GitHub
2. Selecione o workflow **Deploy to AWS Production**
3. Acompanhe o progresso em tempo real

## Troubleshooting

### Erro: "Unable to locate credentials"

Configure AWS CLI:

```bash
aws configure
```

Ou exporte variáveis de ambiente:

```bash
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=us-east-1
```

### Erro: "ECR repository does not exist"

Crie o repositório ECR:

```bash
aws ecr create-repository --repository-name credguard-backend --region us-east-1
```

### Erro: "S3 bucket does not exist"

Crie o bucket S3:

```bash
aws s3 mb s3://credguard-frontend-prod --region us-east-1
```

### Erro: "ECS service not found"

Certifique-se de que a infraestrutura AWS foi criada via Terraform (veja `AWS_MIGRATION_GUIDE.md`).

## Rollback

Para fazer rollback para uma versão anterior:

### Backend (ECS)

```bash
# Listar task definitions
aws ecs list-task-definitions --family-prefix credguard-backend

# Atualizar serviço para versão anterior
aws ecs update-service \
  --cluster credguard-prod \
  --service credguard-backend \
  --task-definition credguard-backend:REVISION_NUMBER
```

### Frontend (S3)

```bash
# Restaurar versão anterior do S3
aws s3api list-object-versions --bucket credguard-frontend-prod

# Copiar versão específica
aws s3api copy-object \
  --bucket credguard-frontend-prod \
  --copy-source credguard-frontend-prod/index.html?versionId=VERSION_ID \
  --key index.html
```

## Monitoramento

Após o deploy, monitore a aplicação:

### CloudWatch Logs

```bash
# Logs do backend
aws logs tail /ecs/credguard-backend --follow

# Logs do ALB
aws logs tail /aws/elasticloadbalancing/credguard-alb --follow
```

### Métricas ECS

```bash
# CPU e memória
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=credguard-backend \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

## Suporte

Para dúvidas ou problemas:

- **Documentação Completa**: Veja `AWS_MIGRATION_GUIDE.md`
- **Issues**: Abra uma issue no GitHub
- **Suporte**: tech@credguard.com

---

**Última Atualização**: Novembro 2025
