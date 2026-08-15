#!/usr/bin/env bash
# Pauses the dev environment to cut costs: scales ECS services to 0 and stops RDS.
# Does NOT touch ElastiCache Redis, the ALB, or the NAT Gateway — those can't be
# stopped, only deleted, so they keep billing regardless.
set -euo pipefail

REGION="${AWS_REGION:-ap-southeast-2}"
CLUSTER="ventriahq-dev-cluster"
DB_INSTANCE="ventriahq-dev-db"

echo "Scaling ECS services to 0 in $CLUSTER..."
aws ecs update-service --region "$REGION" --cluster "$CLUSTER" --service ventriahq-dev-api --desired-count 0 >/dev/null
aws ecs update-service --region "$REGION" --cluster "$CLUSTER" --service ventriahq-dev-scheduler --desired-count 0 >/dev/null

echo "Stopping RDS instance $DB_INSTANCE..."
aws rds stop-db-instance --region "$REGION" --db-instance-identifier "$DB_INSTANCE" >/dev/null

echo "Dev environment paused. Note: RDS auto-restarts after ~7 days if left stopped."
