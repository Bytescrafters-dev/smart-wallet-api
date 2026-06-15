import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { EnvConfig } from './config';

export interface EnvStackProps extends cdk.StackProps {
  config: EnvConfig;
  repository: ecr.Repository;
}

export class EnvStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EnvStackProps) {
    super(scope, id, props);

    const { config } = props;
    const p = `ventriahq-${config.envName}`;

    // ── VPC ──────────────────────────────────────────────────────────────────
    const vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `${p}-vpc`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ── Security Groups ───────────────────────────────────────────────────────
    const albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc,
      securityGroupName: `${p}-alb-sg`,
      description: 'ALB - allow inbound HTTP/HTTPS',
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');

    const ecsSg = new ec2.SecurityGroup(this, 'EcsSg', {
      vpc,
      securityGroupName: `${p}-ecs-sg`,
      description: 'ECS tasks - allow inbound from ALB only',
    });
    ecsSg.addIngressRule(albSg, ec2.Port.tcp(8000), 'From ALB');

    const rdsSg = new ec2.SecurityGroup(this, 'RdsSg', {
      vpc,
      securityGroupName: `${p}-rds-sg`,
      description: 'RDS - allow inbound from ECS only',
    });
    rdsSg.addIngressRule(ecsSg, ec2.Port.tcp(5432), 'From ECS');

    const redisSg = new ec2.SecurityGroup(this, 'RedisSg', {
      vpc,
      securityGroupName: `${p}-redis-sg`,
      description: 'Redis - allow inbound from ECS only',
    });
    redisSg.addIngressRule(ecsSg, ec2.Port.tcp(6379), 'From ECS');

    // ── RDS PostgreSQL ────────────────────────────────────────────────────────
    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceIdentifier: `${p}-db`,
      instanceType: config.rds.instanceType,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [rdsSg],
      databaseName: 'ventriahq',
      multiAz: config.rds.multiAz,
      allocatedStorage: config.rds.allocatedStorageGb,
      ...(config.rds.maxAllocatedStorageGb && {
        maxAllocatedStorage: config.rds.maxAllocatedStorageGb,
      }),
      storageEncrypted: true,
      deletionProtection: config.rds.deletionProtection,
      backupRetention: cdk.Duration.days(config.rds.backupRetentionDays),
      removalPolicy: config.rds.deletionProtection
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // ── ElastiCache Redis ─────────────────────────────────────────────────────
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'RedisSubnetGroup',
      {
        description: `${p} redis subnet group`,
        subnetIds: vpc.isolatedSubnets.map((s) => s.subnetId),
      },
    );

    const redis = new elasticache.CfnCacheCluster(this, 'Redis', {
      clusterName: `${p}-redis`,
      engine: 'redis',
      cacheNodeType: config.elasticache.cacheNodeType,
      numCacheNodes: 1,
      vpcSecurityGroupIds: [redisSg.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.ref,
    });

    // ── S3 Uploads Bucket ─────────────────────────────────────────────────────
    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: `${p}-uploads-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: config.rds.deletionProtection
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !config.rds.deletionProtection,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: config.corsOrigin.split(',').map((o) => o.trim()),
          allowedHeaders: ['*'],
        },
      ],
    });

    // ── App Secrets ───────────────────────────────────────────────────────────
    // After CDK deploys, fill in DATABASE_URL, JWT_SECRET, and SES_FROM_ADDRESS
    // in the AWS console or via CLI. DATABASE_URL format:
    //   postgresql://postgres:<PASSWORD>@<RDS_ENDPOINT>:5432/ventriahq
    // The RDS password is in the auto-generated RDS secret (see output below).
    const appSecret = new secretsmanager.Secret(this, 'AppSecret', {
      secretName: `ventriahq/${config.envName}`,
      description: `Ventriahq ${config.envName} — fill in REPLACE_ME values after first deploy`,
      secretObjectValue: {
        DATABASE_URL: cdk.SecretValue.unsafePlainText('REPLACE_ME'),
        JWT_SECRET: cdk.SecretValue.unsafePlainText('REPLACE_ME'),
        JWT_EXPIRES: cdk.SecretValue.unsafePlainText('15m'),
        REFRESH_EXPIRES_DAYS: cdk.SecretValue.unsafePlainText('30'),
        SES_FROM_ADDRESS: cdk.SecretValue.unsafePlainText('REPLACE_ME'),
        REDIS_PASSWORD: cdk.SecretValue.unsafePlainText(''),
      },
    });

    // ── IAM Roles ─────────────────────────────────────────────────────────────
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `${p}-task-role`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      inlinePolicies: {
        AppPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['ses:SendEmail', 'ses:SendRawEmail'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
              resources: [uploadsBucket.arnForObjects('*')],
            }),
          ],
        }),
      },
    });

    const executionRole = new iam.Role(this, 'ExecutionRole', {
      roleName: `${p}-execution-role`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy',
        ),
      ],
    });
    appSecret.grantRead(executionRole);
    database.secret?.grantRead(executionRole);

    // ── ECS Cluster ───────────────────────────────────────────────────────────
    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `${p}-cluster`,
      vpc,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });

    // ── Shared task config ────────────────────────────────────────────────────
    const sharedEnv: Record<string, string> = {
      NODE_ENV: 'production',
      AWS_REGION: this.region,
      S3_BUCKET: uploadsBucket.bucketName,
      REDIS_HOST: redis.attrRedisEndpointAddress,
      REDIS_PORT: redis.attrRedisEndpointPort,
      REDIS_TLS: 'false',
      CORS_ORIGIN: config.corsOrigin,
    };

    const sharedSecrets: Record<string, ecs.Secret> = {
      DATABASE_URL: ecs.Secret.fromSecretsManager(appSecret, 'DATABASE_URL'),
      JWT_SECRET: ecs.Secret.fromSecretsManager(appSecret, 'JWT_SECRET'),
      JWT_EXPIRES: ecs.Secret.fromSecretsManager(appSecret, 'JWT_EXPIRES'),
      REFRESH_EXPIRES_DAYS: ecs.Secret.fromSecretsManager(
        appSecret,
        'REFRESH_EXPIRES_DAYS',
      ),
      SES_FROM_ADDRESS: ecs.Secret.fromSecretsManager(
        appSecret,
        'SES_FROM_ADDRESS',
      ),
    };

    const sharedLogProps = {
      taskRole,
      executionRole,
    };

    // ── CloudWatch Log Groups ─────────────────────────────────────────────────
    const logRetention = logs.RetentionDays.TWO_WEEKS;

    const apiLogGroup = new logs.LogGroup(this, 'ApiLogs', {
      logGroupName: `/ecs/${p}/api`,
      retention: logRetention,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const schedulerLogGroup = new logs.LogGroup(this, 'SchedulerLogs', {
      logGroupName: `/ecs/${p}/scheduler`,
      retention: logRetention,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const migrationLogGroup = new logs.LogGroup(this, 'MigrationLogs', {
      logGroupName: `/ecs/${p}/migration`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── API Task Definition ───────────────────────────────────────────────────
    const apiTaskDef = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      family: `${p}-api`,
      cpu: config.ecs.apiCpu,
      memoryLimitMiB: config.ecs.apiMemoryMiB,
      ...sharedLogProps,
    });

    apiTaskDef.addContainer('api', {
      containerName: 'api',
      image: ecs.ContainerImage.fromEcrRepository(
        props.repository,
        config.envName,
      ),
      environment: sharedEnv,
      secrets: sharedSecrets,
      portMappings: [{ containerPort: 8000 }],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'api',
        logGroup: apiLogGroup,
      }),
    });

    // ── Scheduler Task Definition ─────────────────────────────────────────────
    // Runs the same image at desired count=1. BullMQ jobId deduplication
    // prevents double-enqueueing even if the API tasks also hit the same cron.
    const schedulerTaskDef = new ecs.FargateTaskDefinition(
      this,
      'SchedulerTaskDef',
      {
        family: `${p}-scheduler`,
        cpu: config.ecs.schedulerCpu,
        memoryLimitMiB: config.ecs.schedulerMemoryMiB,
        ...sharedLogProps,
      },
    );

    schedulerTaskDef.addContainer('scheduler', {
      containerName: 'scheduler',
      image: ecs.ContainerImage.fromEcrRepository(
        props.repository,
        config.envName,
      ),
      environment: { ...sharedEnv, SCHEDULER_ONLY: 'true' },
      secrets: sharedSecrets,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'scheduler',
        logGroup: schedulerLogGroup,
      }),
    });

    // ── Migration Task Definition ─────────────────────────────────────────────
    // Not a running service — CI/CD calls `ecs run-task` with this definition
    // before updating the API and Scheduler services.
    const migrationTaskDef = new ecs.FargateTaskDefinition(
      this,
      'MigrationTaskDef',
      {
        family: `${p}-migration`,
        cpu: 256,
        memoryLimitMiB: 512,
        ...sharedLogProps,
      },
    );

    migrationTaskDef.addContainer('migration', {
      containerName: 'migration',
      image: ecs.ContainerImage.fromEcrRepository(
        props.repository,
        config.envName,
      ),
      command: ['node', 'node_modules/.bin/prisma', 'migrate', 'deploy'],
      environment: sharedEnv,
      secrets: sharedSecrets,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'migration',
        logGroup: migrationLogGroup,
      }),
    });

    // ── ALB ───────────────────────────────────────────────────────────────────
    const alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      loadBalancerName: `${p}-alb`,
      vpc,
      internetFacing: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: albSg,
    });

    const listener = alb.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    // ── API Service ───────────────────────────────────────────────────────────
    const apiService = new ecs.FargateService(this, 'ApiService', {
      serviceName: `${p}-api`,
      cluster,
      taskDefinition: apiTaskDef,
      desiredCount: config.ecs.apiDesiredCount,
      securityGroups: [ecsSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      circuitBreaker: { rollback: true },
      minHealthyPercent: 100,
    });

    listener.addTargets('ApiTargets', {
      targetGroupName: `${p}-api-tg`,
      port: 8000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [apiService],
      healthCheck: {
        path: '/health',
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // ── Scheduler Service ─────────────────────────────────────────────────────
    new ecs.FargateService(this, 'SchedulerService', {
      serviceName: `${p}-scheduler`,
      cluster,
      taskDefinition: schedulerTaskDef,
      desiredCount: 1,
      securityGroups: [ecsSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      circuitBreaker: { rollback: true },
      minHealthyPercent: 100,
    });

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'API base URL',
    });

    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'RDS endpoint — use to build DATABASE_URL in the app secret',
    });

    new cdk.CfnOutput(this, 'RdsSecretArn', {
      value: database.secret?.secretArn ?? '',
      description: 'RDS credentials secret — retrieve the password from here',
    });

    new cdk.CfnOutput(this, 'AppSecretArn', {
      value: appSecret.secretArn,
      description:
        'App secret ARN — update DATABASE_URL, JWT_SECRET, SES_FROM_ADDRESS here',
    });

    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value: uploadsBucket.bucketName,
      description: 'S3 uploads bucket name',
    });

    new cdk.CfnOutput(this, 'EcsClusterName', {
      value: cluster.clusterName,
      description: 'ECS cluster name — used by GitHub Actions to deploy',
    });

    new cdk.CfnOutput(this, 'MigrationTaskDefFamily', {
      value: `${p}-migration`,
      description:
        'Migration task definition family — used by GitHub Actions to run migrations',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map((s) => s.subnetId).join(','),
      description:
        'Private subnet IDs — used by GitHub Actions to run the migration task',
    });

    new cdk.CfnOutput(this, 'EcsSecurityGroupId', {
      value: ecsSg.securityGroupId,
      description:
        'ECS security group ID — used by GitHub Actions to run the migration task',
    });
  }
}
