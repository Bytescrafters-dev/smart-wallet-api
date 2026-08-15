#!/usr/bin/env bash
# Resumes the dev environment paused by dev-pause.sh: starts RDS and scales
# ECS services back to their configured desired counts (see DEV_CONFIG in
# lib/config.ts). Waits for RDS to be available before scaling ECS, since the
# API service will crash-loop without a reachable database.
set -euo pipefail

REGION="${AWS_REGION:-ap-southeast-2}"
CLUSTER="ventriahq-dev-cluster"
DB_INSTANCE="ventriahq-dev-db"

echo "Starting RDS instance $DB_INSTANCE..."
aws rds start-db-instance --region "$REGION" --db-instance-identifier "$DB_INSTANCE" >/dev/null

echo "Waiting for RDS to become available (this can take a few minutes)..."
aws rds wait db-instance-available --region "$REGION" --db-instance-identifier "$DB_INSTANCE"

echo "Scaling ECS services back up in $CLUSTER..."
aws ecs update-service --region "$REGION" --cluster "$CLUSTER" --service ventriahq-dev-api --desired-count 1 >/dev/null
aws ecs update-service --region "$REGION" --cluster "$CLUSTER" --service ventriahq-dev-scheduler --desired-count 1 >/dev/null

echo "Dev environment resumed."
