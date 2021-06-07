import { App, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { Frontend } from './frontend';
import { Posts } from './posts';

interface EnvironmentOptions {
  environment: 'development' | 'production';
}

const app = new App();

class FrontendStack extends TerraformStack {
  constructor(scope: Construct, name: string, public options: EnvironmentOptions) {
    super(scope, name);
    new Frontend(this, 'frontend', { environment: options.environment });
  }
}

class PostsStack extends TerraformStack {
  constructor(scope: Construct, name: string, public options: EnvironmentOptions) {
    super(scope, name);
    new Posts(this, 'posts', { environment: options.environment });
  }
}

interface PreviewStackOptions {
  previewBuildIdentifier: string;
}

class PreviewStack extends TerraformStack {
  constructor(scope: Construct, name: string, options: PreviewStackOptions) {
    super(scope, name);
    // TODO: how to make sure that posts resources are applied before frontend is? (FE depends on API Endpoint of posts api)
    new Posts(this, 'posts', { environment: options.previewBuildIdentifier });
    new Frontend(this, 'frontend', { environment: options.previewBuildIdentifier });
  }
}

if (process.env.PREVIEW_BUILD_IDENTIFIER) {
  if (['development', 'production'].includes(process.env.PREVIEW_BUILD_IDENTIFIER)) {
    throw new Error(`environment variable PREVIEW_BUILD_IDENTIFIER may not be set to development or production but it was set to ${process.env.PREVIEW_BUILD_IDENTIFIER}`);
  }

  // PR Preview - a single Terraform Cloud workspace will host the state for this
  new PreviewStack(app, 'preview', { previewBuildIdentifier: process.env.PREVIEW_BUILD_IDENTIFIER });

} else {
  // Use seperate stacks to minimize blast radius -> TODO: is this a smart idea at all?
  
  // dev
  new PostsStack(app, 'posts-dev', { environment: 'development' });
  new FrontendStack(app, 'frontend-dev', { environment: 'development' });
  // prod
  new PostsStack(app, 'posts-prod', { environment: 'production' });
  new FrontendStack(app, 'frontend-prod', { environment: 'production' });
}

app.synth();
