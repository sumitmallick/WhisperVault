#!/bin/bash

# WhisperVault Monitoring Setup Script
# Sets up CloudWatch dashboards and alarms for production monitoring

set -e

AWS_REGION=${AWS_REGION:-us-east-1}
APP_NAME="whispervault"

echo "🔍 Setting up monitoring for WhisperVault..."

# Create CloudWatch Dashboard
create_dashboard() {
    cat > dashboard.json << EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "CPUUtilization", "ServiceName", "${APP_NAME}-api", "ClusterName", "${APP_NAME}-cluster" ],
                    [ ".", "MemoryUtilization", ".", ".", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "ECS API Service Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${APP_NAME}-alb" ],
                    [ ".", "TargetResponseTime", ".", "." ],
                    [ ".", "HTTPCode_Target_2XX_Count", ".", "." ],
                    [ ".", "HTTPCode_Target_4XX_Count", ".", "." ],
                    [ ".", "HTTPCode_Target_5XX_Count", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Load Balancer Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${APP_NAME}-db" ],
                    [ ".", "DatabaseConnections", ".", "." ],
                    [ ".", "FreeableMemory", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "RDS Database Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ElastiCache", "CPUUtilization", "CacheClusterId", "${APP_NAME}-redis" ],
                    [ ".", "NetworkBytesIn", ".", "." ],
                    [ ".", "NetworkBytesOut", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Redis Cache Metrics",
                "period": 300
            }
        }
    ]
}
EOF

    aws cloudwatch put-dashboard \
        --dashboard-name "${APP_NAME}-dashboard" \
        --dashboard-body file://dashboard.json \
        --region "${AWS_REGION}"
    
    rm dashboard.json
    echo "✅ CloudWatch dashboard created"
}

# Create CloudWatch Alarms
create_alarms() {
    # High CPU alarm for API service
    aws cloudwatch put-metric-alarm \
        --alarm-name "${APP_NAME}-api-high-cpu" \
        --alarm-description "API service high CPU utilization" \
        --metric-name CPUUtilization \
        --namespace AWS/ECS \
        --statistic Average \
        --period 300 \
        --threshold 80 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --dimensions Name=ServiceName,Value=${APP_NAME}-api Name=ClusterName,Value=${APP_NAME}-cluster \
        --region "${AWS_REGION}"

    # High memory alarm for API service
    aws cloudwatch put-metric-alarm \
        --alarm-name "${APP_NAME}-api-high-memory" \
        --alarm-description "API service high memory utilization" \
        --metric-name MemoryUtilization \
        --namespace AWS/ECS \
        --statistic Average \
        --period 300 \
        --threshold 85 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --dimensions Name=ServiceName,Value=${APP_NAME}-api Name=ClusterName,Value=${APP_NAME}-cluster \
        --region "${AWS_REGION}"

    # High response time alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${APP_NAME}-high-response-time" \
        --alarm-description "Load balancer high response time" \
        --metric-name TargetResponseTime \
        --namespace AWS/ApplicationELB \
        --statistic Average \
        --period 300 \
        --threshold 2 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 3 \
        --dimensions Name=LoadBalancer,Value=${APP_NAME}-alb \
        --region "${AWS_REGION}"

    # Database high CPU alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${APP_NAME}-db-high-cpu" \
        --alarm-description "Database high CPU utilization" \
        --metric-name CPUUtilization \
        --namespace AWS/RDS \
        --statistic Average \
        --period 300 \
        --threshold 75 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --dimensions Name=DBInstanceIdentifier,Value=${APP_NAME}-db \
        --region "${AWS_REGION}"

    echo "✅ CloudWatch alarms created"
}

# Create log insights queries
create_log_queries() {
    # API error logs query
    aws logs put-query-definition \
        --name "${APP_NAME}-api-errors" \
        --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc' \
        --log-group-names "/ecs/${APP_NAME}" \
        --region "${AWS_REGION}"

    # Performance monitoring query
    aws logs put-query-definition \
        --name "${APP_NAME}-performance" \
        --query-string 'fields @timestamp, @message | filter @message like /response_time/ | stats avg(response_time) by bin(5m)' \
        --log-group-names "/ecs/${APP_NAME}" \
        --region "${AWS_REGION}"

    echo "✅ CloudWatch Insights queries created"
}

# Main execution
main() {
    echo "Creating CloudWatch dashboard..."
    create_dashboard
    
    echo "Creating CloudWatch alarms..."
    create_alarms
    
    echo "Creating log insights queries..."
    create_log_queries
    
    echo "🎉 Monitoring setup completed!"
    echo "Dashboard URL: https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${APP_NAME}-dashboard"
}

main