#!/bin/bash

# CredGuard Deployment Script for AWS
# This script builds and deploys both backend and frontend to AWS

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPOSITORY="${ECR_REPOSITORY:-credguard-backend}"
ECS_CLUSTER="${ECS_CLUSTER:-credguard-prod}"
ECS_SERVICE="${ECS_SERVICE:-credguard-backend}"
S3_FRONTEND_BUCKET="${S3_FRONTEND_BUCKET:-credguard-frontend-prod}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    command -v aws >/dev/null 2>&1 || { log_error "AWS CLI is required but not installed. Aborting."; exit 1; }
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed. Aborting."; exit 1; }
    command -v pnpm >/dev/null 2>&1 || { log_error "pnpm is required but not installed. Aborting."; exit 1; }
    
    log_info "All dependencies found."
}

deploy_backend() {
    log_info "Starting backend deployment..."
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}"
    
    # Login to ECR
    log_info "Logging in to Amazon ECR..."
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}
    
    # Build Docker image
    log_info "Building Docker image..."
    docker build -f deployment/docker/Dockerfile -t ${ECR_REPOSITORY}:latest .
    
    # Tag image
    IMAGE_TAG=$(git rev-parse --short HEAD)
    docker tag ${ECR_REPOSITORY}:latest ${ECR_URI}:${IMAGE_TAG}
    docker tag ${ECR_REPOSITORY}:latest ${ECR_URI}:latest
    
    # Push to ECR
    log_info "Pushing image to ECR..."
    docker push ${ECR_URI}:${IMAGE_TAG}
    docker push ${ECR_URI}:latest
    
    # Update ECS service
    log_info "Updating ECS service..."
    aws ecs update-service \
        --cluster ${ECS_CLUSTER} \
        --service ${ECS_SERVICE} \
        --force-new-deployment \
        --region ${AWS_REGION}
    
    log_info "Backend deployment initiated. ECS will roll out new tasks."
}

deploy_frontend() {
    log_info "Starting frontend deployment..."
    
    # Build frontend
    log_info "Building frontend..."
    cd client
    pnpm install
    pnpm build
    cd ..
    
    # Sync to S3
    log_info "Uploading to S3..."
    aws s3 sync client/dist/ s3://${S3_FRONTEND_BUCKET}/ --delete --cache-control "max-age=31536000"
    
    # Upload index.html with no-cache
    aws s3 cp client/dist/index.html s3://${S3_FRONTEND_BUCKET}/index.html --cache-control "no-cache"
    
    # Invalidate CloudFront cache
    if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        log_info "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation \
            --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
            --paths "/*"
    else
        log_warn "CLOUDFRONT_DISTRIBUTION_ID not set. Skipping cache invalidation."
    fi
    
    log_info "Frontend deployment completed."
}

run_migrations() {
    log_info "Running database migrations..."
    
    # This assumes you have a way to run migrations
    # Adjust based on your migration strategy
    pnpm db:push
    
    log_info "Migrations completed."
}

# Main execution
main() {
    log_info "=== CredGuard Deployment Script ==="
    log_info "AWS Region: ${AWS_REGION}"
    log_info "Environment: ${NODE_ENV:-production}"
    
    check_dependencies
    
    # Parse arguments
    DEPLOY_BACKEND=false
    DEPLOY_FRONTEND=false
    RUN_MIGRATIONS=false
    
    if [ $# -eq 0 ]; then
        # No arguments, deploy everything
        DEPLOY_BACKEND=true
        DEPLOY_FRONTEND=true
    else
        while [[ $# -gt 0 ]]; do
            case $1 in
                --backend)
                    DEPLOY_BACKEND=true
                    shift
                    ;;
                --frontend)
                    DEPLOY_FRONTEND=true
                    shift
                    ;;
                --migrations)
                    RUN_MIGRATIONS=true
                    shift
                    ;;
                --all)
                    DEPLOY_BACKEND=true
                    DEPLOY_FRONTEND=true
                    shift
                    ;;
                *)
                    log_error "Unknown option: $1"
                    echo "Usage: $0 [--backend] [--frontend] [--migrations] [--all]"
                    exit 1
                    ;;
            esac
        done
    fi
    
    # Run migrations first if requested
    if [ "$RUN_MIGRATIONS" = true ]; then
        run_migrations
    fi
    
    # Deploy backend
    if [ "$DEPLOY_BACKEND" = true ]; then
        deploy_backend
    fi
    
    # Deploy frontend
    if [ "$DEPLOY_FRONTEND" = true ]; then
        deploy_frontend
    fi
    
    log_info "=== Deployment completed successfully! ==="
}

# Run main function
main "$@"
