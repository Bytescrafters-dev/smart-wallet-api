#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SharedStack } from '../lib/shared-stack';
import { EnvStack } from '../lib/env-stack';
import { DEV_CONFIG, PROD_CONFIG } from '../lib/config';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const shared = new SharedStack(app, 'VentriahqShared', { env });

new EnvStack(app, 'VentriahqDev', {
  env,
  config: DEV_CONFIG,
  repository: shared.repository,
});

new EnvStack(app, 'VentriahqProd', {
  env,
  config: PROD_CONFIG,
  repository: shared.repository,
});
