#!/bin/bash

# WhisperVault AWS Deployment Script
# This script sets up the complete AWS infrastructure and deploys the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 WhisperVault AWS Deployment Script${NC}"
echo "======================================"

# Check required tools
check_requirements() {
    echo -e "${YELLOW}Checking requirements...${NC}"
    
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not installed${NC}"
        exit 1
    fi
    
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}❌ Terraform is not installed${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements met${NC}"
}

# Set up AWS credentials
setup_aws_credentials() {
    echo -e "${YELLOW}Setting up AWS credentials...${NC}"
    
    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        echo -e "${RED}❌ AWS credentials not found in environment variables${NC}"
        echo "Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
        exit 1
    fi
    
    aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
    aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
    aws configure set default.region "${AWS_REGION:-us-east-1}"
    
    echo -e "${GREEN}✅ AWS credentials configured${NC}"
}

# Create Terraform backend
setup_terraform_backend() {
    echo -e "${YAML}Setting up Terraform backend...${NC}"
    
    BUCKET_NAME="whispervault-terraform-state-$(date +%s)"
    
    aws s3 mb "s3://$BUCKET_NAME" --region "${AWS_REGION:-us-east-1}"
    aws s3api put-bucket-versioning --bucket "$BUCKET_NAME" --versioning-configuration Status=Enabled
    
    cat > infra/aws/terraform/backend.tf << EOF
terraform {
  backend "s3" {
    bucket = "$BUCKET_NAME"
    key    = "terraform.tfstate"
    region = "${AWS_REGION:-us-east-1}"
  }
}
EOF
    
    echo -e "${GREEN}✅ Terraform backend created: $BUCKET_NAME${NC}"
}

# Deploy infrastructure
deploy_infrastructure() {
    echo -e "${YELLOW}Deploying infrastructure with Terraform...${NC}"
    
    cd infra/aws/terraform
    
    terraform init
    terraform plan -var="domain_name=${DOMAIN_NAME:-whispervault.com}"
    
    read -p "Do you want to apply these changes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        terraform apply -auto-approve -var="domain_name=${DOMAIN_NAME:-whispervault.com}"
        echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
    else
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
    
    cd ../../..
}

# Build and push Docker images
build_and_push_images() {
    echo -e "${YELLOW}Building and pushing Docker images...${NC}"
    
    # Get ECR login
    aws ecr get-login-password --region "${AWS_REGION:-us-east-1}" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
    
    # Build and push API image
    echo -e "${YELLOW}Building API image...${NC}"
    cd apps/api-fastapi
    docker build -f Dockerfile.prod -t "$ECR_REGISTRY/whispervault-api:latest" .
    docker push "$ECR_REGISTRY/whispervault-api:latest"
    cd ../..
    
    # Build and push Web image
    echo -e "${YELLOW}Building Web image...${NC}"
    cd apps/web-next
    docker build -f Dockerfile.prod -t "$ECR_REGISTRY/whispervault-web:latest" .
    docker push "$ECR_REGISTRY/whispervault-web:latest"
    cd ../..
    
    echo -e "${GREEN}✅ Docker images built and pushed${NC}"
}

# Update ECS services
update_ecs_services() {
    echo -e "${YELLOW}Updating ECS services...${NC}"
    
    aws ecs update-service --cluster whispervault-cluster --service whispervault-api --force-new-deployment
    aws ecs update-service --cluster whispervault-cluster --service whispervault-web --force-new-deployment
    
    echo -e "${YELLOW}Waiting for deployments to complete...${NC}"
    aws ecs wait services-stable --cluster whispervault-cluster --services whispervault-api
    aws ecs wait services-stable --cluster whispervault-cluster --services whispervault-web
    
    echo -e "${GREEN}✅ ECS services updated successfully${NC}"
}

# Main deployment flow
main() {
    check_requirements
    setup_aws_credentials
    
    # Get ECR registry URL
    export ECR_REGISTRY=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION:-us-east-1}.amazonaws.com
    
    if [ "$1" = "--infrastructure-only" ]; then
        setup_terraform_backend
        deploy_infrastructure
    elif [ "$1" = "--images-only" ]; then
        build_and_push_images
        update_ecs_services
    else
        setup_terraform_backend
        deploy_infrastructure
        build_and_push_images
        update_ecs_services
    fi
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}Your application should be available at the load balancer DNS name.${NC}"
}

# Show usage if no arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --infrastructure-only    Deploy only the infrastructure"
    echo "  --images-only           Build and deploy only the Docker images"
    echo "  --help, -h              Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  AWS_ACCESS_KEY_ID       AWS access key ID"
    echo "  AWS_SECRET_ACCESS_KEY   AWS secret access key"
    echo "  AWS_REGION              AWS region (default: us-east-1)"
    echo "  DOMAIN_NAME             Your domain name (default: whispervault.com)"
    exit 0
fi

main "$@"