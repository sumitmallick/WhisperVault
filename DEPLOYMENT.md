# 🚀 WhisperVault Cloud Deployment Guide

This guide provides complete instructions for deploying WhisperVault to AWS at full scale with production-ready infrastructure.

## 📋 Prerequisites

### Required Tools
- AWS CLI v2.x
- Terraform v1.0+
- Docker v20.x+
- Node.js v18+
- Python 3.11+

### AWS Account Setup
1. Create an AWS account with appropriate permissions
2. Create an IAM user with these policies:
   - `AmazonECS_FullAccess`
   - `AmazonEC2FullAccess`
   - `AmazonRDSFullAccess`
   - `AmazonS3FullAccess`
   - `AmazonRoute53FullAccess`
   - `CloudWatchFullAccess`
   - `ElastiCacheFullAccess`

## 🏗️ Architecture Overview

### Infrastructure Components
- **VPC**: Multi-AZ setup with public/private subnets
- **ECS Fargate**: Container orchestration for API and web services
- **Application Load Balancer**: Traffic distribution with SSL termination
- **RDS PostgreSQL**: Managed database with automatic backups
- **ElastiCache Redis**: In-memory cache for sessions and background jobs
- **CloudFront CDN**: Global content delivery for static assets
- **S3**: Static asset storage
- **Auto Scaling**: Automatic scaling based on CPU/memory metrics

### Security Features
- Private subnets for database and application containers
- Security groups with least-privilege access
- SSL/TLS encryption in transit
- IAM roles with minimal required permissions
- VPC endpoints for secure AWS service communication

## 🚀 Quick Deployment

### Option 1: Automated Deployment Script

```bash
# Set required environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"
export DOMAIN_NAME="yourdomain.com"  # Optional

# Run the deployment script
./deploy.sh
```

### Option 2: Manual Step-by-Step Deployment

#### Step 1: Configure AWS Credentials
```bash
aws configure
# Enter your AWS Access Key ID, Secret Key, and preferred region
```

#### Step 2: Deploy Infrastructure with Terraform
```bash
cd infra/aws/terraform

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan -var="domain_name=yourdomain.com"

# Apply the infrastructure
terraform apply -var="domain_name=yourdomain.com"
```

#### Step 3: Build and Push Docker Images
```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push API image
cd apps/api-fastapi
docker build -f Dockerfile.prod -t YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/whispervault-api:latest .
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/whispervault-api:latest

# Build and push Web image
cd ../web-next
docker build -f Dockerfile.prod -t YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/whispervault-web:latest .
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/whispervault-web:latest
```

#### Step 4: Update ECS Services
```bash
aws ecs update-service --cluster whispervault-cluster --service whispervault-api --force-new-deployment
aws ecs update-service --cluster whispervault-cluster --service whispervault-web --force-new-deployment
```

## 🔧 Configuration

### Environment Variables

#### API Service
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET_KEY`: Secret key for JWT tokens
- `SOCIAL_MEDIA_API_KEYS`: API keys for social media integrations

#### Web Service
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NODE_ENV`: Set to "production"

### Domain Configuration

#### Option 1: Custom Domain with Route 53
1. Purchase or transfer domain to Route 53
2. Create SSL certificate in ACM
3. Update Terraform variables with your domain and certificate ARN

#### Option 2: Use Load Balancer DNS
Access your application using the ALB DNS name (output after Terraform apply)

## 📊 Scaling Configuration

### Auto Scaling Settings
- **Min Capacity**: 2 instances per service
- **Max Capacity**: 10 instances per service
- **CPU Target**: 70% utilization
- **Memory Target**: 80% utilization

### Database Scaling
- **Storage**: Auto-scaling from 20GB to 100GB
- **Instance**: Start with db.t3.micro, upgrade as needed
- **Read Replicas**: Add for read-heavy workloads

### Caching Strategy
- **Redis**: Session storage and background job queues
- **CloudFront**: Static asset caching with global distribution

## 🔒 Security Best Practices

### Network Security
- Private subnets for all application components
- NAT Gateways for secure outbound internet access
- Security groups with minimal required ports

### Application Security
- Non-root containers with read-only filesystems
- Secrets managed through AWS Secrets Manager
- Regular security updates through automated builds

### SSL/TLS
- End-to-end encryption with ACM certificates
- HTTPS redirect for all traffic
- Security headers configured in Next.js

## 📈 Monitoring and Logging

### CloudWatch Integration
- Container logs automatically streamed to CloudWatch
- Custom metrics for business logic
- Alarms for critical system metrics

### Health Checks
- Load balancer health checks on `/health` endpoints
- Container health checks with automatic restart
- Database connection monitoring

## 💰 Cost Optimization

### Infrastructure Costs (Estimated Monthly)
- **ECS Fargate**: $30-100 (depending on scale)
- **RDS PostgreSQL**: $15-50 (db.t3.micro to db.t3.medium)
- **ElastiCache Redis**: $15-30 (cache.t3.micro)
- **Load Balancer**: $20
- **Data Transfer**: $10-50 (depending on traffic)
- **Total Estimated**: $90-250/month

### Cost Reduction Tips
1. Use Spot instances for non-critical workloads
2. Implement intelligent auto-scaling policies
3. Use CloudFront caching to reduce origin load
4. Regular cleanup of unused resources

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
The repository includes a complete CI/CD pipeline that:
1. Runs tests on pull requests
2. Builds and pushes Docker images on main branch
3. Deploys to ECS automatically
4. Performs health checks after deployment

### Manual Deployment
For manual deployments or rollbacks:
```bash
# Deploy specific image tag
aws ecs update-service --cluster whispervault-cluster --service whispervault-api --task-definition whispervault-api:REVISION_NUMBER
```

## 🛠️ Maintenance

### Regular Tasks
- Monitor CloudWatch logs and metrics
- Update dependencies and security patches
- Backup verification and restore testing
- Performance optimization based on metrics

### Scaling Operations
- Monitor resource utilization
- Adjust auto-scaling parameters
- Scale database instance as needed
- Add read replicas for database scaling

## 🆘 Troubleshooting

### Common Issues

#### ECS Service Won't Start
```bash
# Check service events
aws ecs describe-services --cluster whispervault-cluster --services whispervault-api

# Check task logs
aws logs tail /ecs/whispervault --follow
```

#### Database Connection Issues
```bash
# Test database connectivity
aws rds describe-db-instances --db-instance-identifier whispervault-db
```

#### Load Balancer Health Check Failures
```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn TARGET_GROUP_ARN
```

### Support Resources
- AWS Documentation: https://docs.aws.amazon.com/
- Terraform Documentation: https://registry.terraform.io/providers/hashicorp/aws/
- ECS Troubleshooting: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/troubleshooting.html

## 📞 Contact

For deployment support or questions:
- Create an issue in the repository
- Contact the development team
- AWS support (if you have a support plan)

---

## 🎉 Congratulations!

Your WhisperVault application is now running on AWS with enterprise-grade infrastructure, automatic scaling, and production-ready security configurations. The platform can handle thousands of concurrent users and automatically scales based on demand.

### Next Steps
1. Configure your domain name and SSL certificates
2. Set up monitoring alerts for critical metrics  
3. Configure social media API integrations
4. Set up regular database backups and disaster recovery
5. Implement additional security hardening as needed

Happy deploying! 🚀