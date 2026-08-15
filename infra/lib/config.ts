import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface EnvConfig {
  envName: 'dev' | 'prod';
  corsOrigin: string; // comma-separated list of allowed origins
  certificateArn?: string;
  rds: {
    instanceType: ec2.InstanceType;
    multiAz: boolean;
    deletionProtection: boolean;
    backupRetentionDays: number;
    allocatedStorageGb: number;
    maxAllocatedStorageGb?: number;
  };
  ecs: {
    apiDesiredCount: number;
    apiCpu: number;
    apiMemoryMiB: number;
    schedulerCpu: number;
    schedulerMemoryMiB: number;
  };
  elasticache: {
    cacheNodeType: string;
  };
}

export const DEV_CONFIG: EnvConfig = {
  envName: 'dev',
  corsOrigin: 'https://dev-admin.ventriahq.com, https://dev.ventriahq.com',
  certificateArn:
    'arn:aws:acm:ap-southeast-2:089126833489:certificate/c1daca9e-193c-4c2e-a17b-4661641d196a',
  rds: {
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T4G,
      ec2.InstanceSize.SMALL,
    ),
    multiAz: false,
    deletionProtection: false,
    backupRetentionDays: 1,
    allocatedStorageGb: 20,
  },
  ecs: {
    apiDesiredCount: 1,
    apiCpu: 512,
    apiMemoryMiB: 1024,
    schedulerCpu: 256,
    schedulerMemoryMiB: 512,
  },
  elasticache: {
    cacheNodeType: 'cache.t4g.micro',
  },
};

export const PROD_CONFIG: EnvConfig = {
  envName: 'prod',
  corsOrigin: 'https://admin.ventriahq.com, https://ventriahq.com',
  rds: {
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T4G,
      ec2.InstanceSize.MEDIUM,
    ),
    multiAz: true,
    deletionProtection: true,
    backupRetentionDays: 7,
    allocatedStorageGb: 50,
    maxAllocatedStorageGb: 200,
  },
  ecs: {
    apiDesiredCount: 2,
    apiCpu: 1024,
    apiMemoryMiB: 2048,
    schedulerCpu: 256,
    schedulerMemoryMiB: 512,
  },
  elasticache: {
    cacheNodeType: 'cache.t4g.small',
  },
};
