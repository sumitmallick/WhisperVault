#!/bin/bash
set -e

export AWS_DEFAULT_REGION=ap-south-1

echo "Setting up HTTPS for WhisperVault..."

# Certificate ARN
CERT_ARN="arn:aws:acm:ap-south-1:387760486333:certificate/e36164a0-9686-4a6b-97a0-a86824dc054a"

# Load balancer ARN
LB_ARN="arn:aws:elasticloadbalancing:ap-south-1:387760486333:loadbalancer/app/whispervault-alb/bd70db1a607a3560"

# Get target group ARNs
WEB_TG_ARN=$(aws elbv2 describe-target-groups --names whispervault-web-tg --query 'TargetGroups[0].TargetGroupArn' --output text)

echo "Certificate ARN: $CERT_ARN"
echo "Load Balancer ARN: $LB_ARN"
echo "Web Target Group ARN: $WEB_TG_ARN"

# Check certificate status
echo "Checking certificate status..."
CERT_STATUS=$(aws acm describe-certificate --certificate-arn $CERT_ARN --query 'Certificate.Status' --output text)
echo "Certificate Status: $CERT_STATUS"

if [ "$CERT_STATUS" != "ISSUED" ]; then
    echo "❌ Certificate is not yet issued. Status: $CERT_STATUS"
    echo "Please add the DNS validation records to your GoDaddy account:"
    echo ""
    aws acm describe-certificate --certificate-arn $CERT_ARN --query 'Certificate.DomainValidationOptions[*].{Domain:DomainName,Name:ResourceRecord.Name,Value:ResourceRecord.Value,Type:ResourceRecord.Type}' --output table
    echo ""
    echo "After adding the records, wait 5-10 minutes and run this script again."
    exit 1
fi

echo "✅ Certificate is issued! Setting up HTTPS listener..."

# Create HTTPS listener
echo "Creating HTTPS listener..."
HTTPS_LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn $LB_ARN \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=$CERT_ARN \
    --default-actions Type=forward,TargetGroupArn=$WEB_TG_ARN \
    --query 'Listeners[0].ListenerArn' \
    --output text)

echo "HTTPS Listener created: $HTTPS_LISTENER_ARN"

# Get API target group ARN
API_TG_ARN=$(aws elbv2 describe-target-groups --names whispervault-api-tg --query 'TargetGroups[0].TargetGroupArn' --output text)

# Create HTTPS listener rule for API paths
echo "Creating HTTPS listener rule for API..."
aws elbv2 create-rule \
    --listener-arn $HTTPS_LISTENER_ARN \
    --priority 100 \
    --conditions Field=path-pattern,Values="/api/*,/auth/*" \
    --actions Type=forward,TargetGroupArn=$API_TG_ARN

echo "✅ HTTPS setup complete!"
echo ""
echo "Your site is now available at:"
echo "🔒 https://whispervault.in"
echo "🔒 https://www.whispervault.in"
echo "🌐 http://whispervault.in (redirects to HTTPS)"
echo "🌐 http://www.whispervault.in (redirects to HTTPS)"
echo ""
echo "Testing endpoints..."
curl -I https://whispervault.in/ --connect-timeout 10 || echo "HTTPS not yet accessible"
curl -I https://www.whispervault.in/ --connect-timeout 10 || echo "HTTPS not yet accessible"