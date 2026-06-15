import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class SharedStack extends cdk.Stack {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.repository = new ecr.Repository(this, 'Repository', {
      repositoryName: 'ventriahq-api',
      imageScanOnPush: true,
      lifecycleRules: [
        { maxImageCount: 20, description: 'Keep last 20 images' },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: this.repository.repositoryUri,
      description: 'ECR repository URI — used in GitHub Actions to push images',
      exportName: 'VentriahqRepositoryUri',
    });
  }
}
