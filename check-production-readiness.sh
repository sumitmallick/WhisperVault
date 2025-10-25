#!/bin/bash

# WhisperVault Production Readiness Checker
# Validates configuration and dependencies before deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔍 WhisperVault Production Readiness Check${NC}"
echo "============================================="

ERRORS=0
WARNINGS=0

# Check required environment variables
check_env_vars() {
    echo -e "${YELLOW}Checking environment variables...${NC}"
    
    required_vars=(
        "AWS_ACCESS_KEY_ID"
        "AWS_SECRET_ACCESS_KEY"
        "AWS_REGION"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}❌ Missing required environment variable: $var${NC}"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "${GREEN}✅ $var is set${NC}"
        fi
    done
    
    optional_vars=(
        "DOMAIN_NAME"
        "JWT_SECRET_KEY"
        "FACEBOOK_APP_ID"
        "TWITTER_API_KEY"
    )
    
    for var in "${optional_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${YELLOW}⚠️  Optional variable not set: $var${NC}"
            WARNINGS=$((WARNINGS + 1))
        else
            echo -e "${GREEN}✅ $var is set${NC}"
        fi
    done
}

# Check AWS credentials and permissions
check_aws_access() {
    echo -e "${YELLOW}Checking AWS access...${NC}"
    
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        echo -e "${RED}❌ AWS credentials are invalid or not configured${NC}"
        ERRORS=$((ERRORS + 1))
        return
    fi
    
    echo -e "${GREEN}✅ AWS credentials are valid${NC}"
    
    # Check basic permissions
    if aws s3 ls > /dev/null 2>&1; then
        echo -e "${GREEN}✅ S3 access confirmed${NC}"
    else
        echo -e "${RED}❌ S3 access denied${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    if aws ecs list-clusters > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ECS access confirmed${NC}"
    else
        echo -e "${RED}❌ ECS access denied${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

# Check required tools
check_tools() {
    echo -e "${YELLOW}Checking required tools...${NC}"
    
    tools=(
        "aws:AWS CLI"
        "terraform:Terraform"
        "docker:Docker"
        "node:Node.js"
        "python3:Python"
    )
    
    for tool_info in "${tools[@]}"; do
        IFS=':' read -r tool name <<< "$tool_info"
        if command -v "$tool" > /dev/null 2>&1; then
            version=$($tool --version 2>/dev/null | head -n1)
            echo -e "${GREEN}✅ $name: $version${NC}"
        else
            echo -e "${RED}❌ $name is not installed${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    done
}

# Check Docker is running
check_docker() {
    echo -e "${YELLOW}Checking Docker...${NC}"
    
    if docker info > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker is running${NC}"
    else
        echo -e "${RED}❌ Docker is not running${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

# Validate Terraform configuration
check_terraform() {
    echo -e "${YELLOW}Validating Terraform configuration...${NC}"
    
    if [ -d "infra/aws/terraform" ]; then
        cd infra/aws/terraform
        
        if terraform validate > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Terraform configuration is valid${NC}"
        else
            echo -e "${RED}❌ Terraform configuration has errors${NC}"
            terraform validate
            ERRORS=$((ERRORS + 1))
        fi
        
        cd ../../..
    else
        echo -e "${RED}❌ Terraform directory not found${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

# Check application configurations
check_app_config() {
    echo -e "${YELLOW}Checking application configurations...${NC}"
    
    # Check API requirements
    if [ -f "apps/api-fastapi/requirements.txt" ]; then
        echo -e "${GREEN}✅ API requirements.txt found${NC}"
    else
        echo -e "${RED}❌ API requirements.txt missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check Web package.json
    if [ -f "apps/web-next/package.json" ]; then
        echo -e "${GREEN}✅ Web package.json found${NC}"
    else
        echo -e "${RED}❌ Web package.json missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check Dockerfiles
    if [ -f "apps/api-fastapi/Dockerfile.prod" ]; then
        echo -e "${GREEN}✅ API production Dockerfile found${NC}"
    else
        echo -e "${YELLOW}⚠️  API production Dockerfile missing${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if [ -f "apps/web-next/Dockerfile.prod" ]; then
        echo -e "${GREEN}✅ Web production Dockerfile found${NC}"
    else
        echo -e "${YELLOW}⚠️  Web production Dockerfile missing${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# Security checks
check_security() {
    echo -e "${YELLOW}Running security checks...${NC}"
    
    # Check for sensitive files
    if [ -f ".env" ] || [ -f "apps/api-fastapi/.env" ] || [ -f "apps/web-next/.env" ]; then
        echo -e "${YELLOW}⚠️  .env files found - ensure they're in .gitignore${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Check .gitignore
    if [ -f ".gitignore" ]; then
        if grep -q "\.env" .gitignore; then
            echo -e "${GREEN}✅ .env files are ignored by git${NC}"
        else
            echo -e "${YELLOW}⚠️  .env files should be added to .gitignore${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${YELLOW}⚠️  .gitignore file not found${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Check JWT secret
    if [ -n "$JWT_SECRET_KEY" ] && [ ${#JWT_SECRET_KEY} -lt 32 ]; then
        echo -e "${YELLOW}⚠️  JWT_SECRET_KEY should be at least 32 characters${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# Performance recommendations
check_performance() {
    echo -e "${YELLOW}Performance recommendations...${NC}"
    
    # Check for large files that might slow builds
    large_files=$(find . -type f -size +10M 2>/dev/null | grep -v node_modules | grep -v .git | head -5)
    if [ -n "$large_files" ]; then
        echo -e "${YELLOW}⚠️  Large files found (may slow deployment):${NC}"
        echo "$large_files"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Check node_modules in git
    if [ -d "apps/web-next/node_modules" ] && ! grep -q "node_modules" .gitignore 2>/dev/null; then
        echo -e "${YELLOW}⚠️  node_modules should be in .gitignore${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# Generate summary report
generate_report() {
    echo
    echo "============================================="
    echo -e "${GREEN}📊 Production Readiness Summary${NC}"
    echo "============================================="
    
    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 All checks passed! Your application is ready for production deployment.${NC}"
        return 0
    elif [ $ERRORS -eq 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found. Review and fix before deployment.${NC}"
        return 0
    else
        echo -e "${RED}❌ $ERRORS error(s) and $WARNINGS warning(s) found.${NC}"
        echo -e "${RED}Please fix all errors before proceeding with deployment.${NC}"
        return 1
    fi
}

# Main execution
main() {
    check_env_vars
    echo
    check_aws_access
    echo
    check_tools
    echo
    check_docker
    echo
    check_terraform
    echo
    check_app_config
    echo
    check_security
    echo
    check_performance
    echo
    
    generate_report
}

# Show help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "WhisperVault Production Readiness Checker"
    echo ""
    echo "This script validates your environment and configuration before deploying to production."
    echo ""
    echo "Usage: $0"
    echo ""
    echo "Environment variables required:"
    echo "  AWS_ACCESS_KEY_ID       - AWS access key"
    echo "  AWS_SECRET_ACCESS_KEY   - AWS secret key"
    echo "  AWS_REGION              - AWS region (default: us-east-1)"
    echo ""
    echo "Optional environment variables:"
    echo "  DOMAIN_NAME             - Your domain name"
    echo "  JWT_SECRET_KEY          - JWT secret key"
    echo "  FACEBOOK_APP_ID         - Facebook app ID"
    echo "  TWITTER_API_KEY         - Twitter API key"
    exit 0
fi

main
exit $?