#!/bin/bash
set -e

echo "Deploying infrastructure to ap-south-1..."
cd /Users/skumarma/Personal_Workspace/infra/aws/terraform

echo "Current directory: $(pwd)"
echo "Terraform files present:"
ls -la *.tf

echo "Running terraform apply..."
terraform apply -auto-approve

echo "Getting ECR login..."
export AWS_DEFAULT_REGION=ap-south-1
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 387760486333.dkr.ecr.ap-south-1.amazonaws.com

echo "Deployment complete!"
echo "ECR repositories:"
terraform output ecr_api_repository_url
terraform output ecr_web_repository_url