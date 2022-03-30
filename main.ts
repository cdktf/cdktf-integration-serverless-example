import { AwsProvider } from "@cdktf/provider-aws";
import { App, TerraformStack, RemoteBackend } from "cdktf";
import { Construct } from "constructs";
import { Frontend } from "./frontend";
import { Posts } from "./posts";
import { LocalProvider } from "@cdktf/provider-local";

interface EnvironmentOptions {
  environment: "development" | "production";
  user?: string;
}

const app = new App();

interface FrontendStackOptions extends EnvironmentOptions {
  apiEndpoint: string;
}

class FrontendStack extends TerraformStack {
  constructor(
    scope: Construct,
    name: string,
    public options: FrontendStackOptions
  ) {
    super(scope, name);

    new AwsProvider(this, "aws", { region: "eu-central-1" });
    new LocalProvider(this, "local");
    new Frontend(this, "frontend", {
      environment: options.environment,
      apiEndpoint: options.apiEndpoint,
    });
  }
}

class PostsStack extends TerraformStack {
  public posts: Posts;

  constructor(
    scope: Construct,
    name: string,
    public options: EnvironmentOptions
  ) {
    super(scope, name);
    new AwsProvider(this, "aws", { region: "eu-central-1" });

    this.posts = new Posts(this, "posts", {
      environment: options.environment,
      userSuffix: options.user,
    });
  }
}

interface PreviewStackOptions {
  previewBuildIdentifier: string;
}

class PreviewStack extends TerraformStack {
  constructor(scope: Construct, name: string, options: PreviewStackOptions) {
    super(scope, name);
    // TODO: how to make sure that posts resources are applied before frontend is? (FE depends on API Endpoint of posts api)
    const posts = new Posts(this, "posts", {
      environment: options.previewBuildIdentifier,
    });
    new Frontend(this, "frontend", {
      environment: options.previewBuildIdentifier,
      apiEndpoint: posts.apiEndpoint,
    });
  }
}

const USE_REMOTE_BACKEND = process.env.USE_REMOTE_BACKEND === "true";

if (process.env.PREVIEW_BUILD_IDENTIFIER) {
  if (
    ["development", "production"].includes(process.env.PREVIEW_BUILD_IDENTIFIER)
  ) {
    throw new Error(
      `environment variable PREVIEW_BUILD_IDENTIFIER may not be set to development or production but it was set to ${process.env.PREVIEW_BUILD_IDENTIFIER}`
    );
  }

  // PR Preview - a single Terraform Cloud workspace will host the state for this
  new PreviewStack(app, "preview", {
    previewBuildIdentifier: process.env.PREVIEW_BUILD_IDENTIFIER,
  });
} else {
  // Use seperate stacks to minimize blast radius -> TODO: is this a smart idea at all?

  // dev
  const postsDev = new PostsStack(app, "posts-dev", {
    environment: "development",
    user: process.env.CDKTF_USER
  });
  if (USE_REMOTE_BACKEND) {
    new RemoteBackend(postsDev, {
      organization: "cdktf-team",
      workspaces: {
        name: "cdktf-e2e-serverless-posts-dev",
      },
    });
  }
  const frontendDev = new FrontendStack(app, "frontend-dev", {
    environment: "development",
    apiEndpoint: postsDev.posts.apiEndpoint,
    
  });
  if (USE_REMOTE_BACKEND) {
    new RemoteBackend(frontendDev, {
      organization: "cdktf-team",
      workspaces: {
        name: "cdktf-e2e-serverless-frontend-dev",
      },
    });
  }
  // prod
  const postsProd = new PostsStack(app, "posts-prod", {
    environment: "production",
  });
  if (USE_REMOTE_BACKEND) {
    new RemoteBackend(postsProd, {
      organization: "cdktf-team",
      workspaces: {
        name: "cdktf-e2e-serverless-posts-prod",
      },
    });
  }
  const frontendProd = new FrontendStack(app, "frontend-prod", {
    environment: "production",
    apiEndpoint: postsProd.posts.apiEndpoint,
  });
  if (USE_REMOTE_BACKEND) {
    new RemoteBackend(frontendProd, {
      organization: "cdktf-team",
      workspaces: {
        name: "cdktf-e2e-serverless-frontend-prod",
      },
    });
  }
}

app.synth();
