import * as path from "path";
import { AwsProvider } from "@cdktf/provider-aws";
import {
  App,
  DataTerraformRemoteStateLocal,
  TerraformOutput,
  TerraformRemoteState,
  TerraformStack,
} from "cdktf";
import { Construct, Node } from "constructs";
import { Frontend } from "./frontend";
import { Posts } from "./posts";
import { LocalProvider } from "@cdktf/provider-local";

interface EnvironmentOptions {
  environment: "development" | "production";
}

const app = new App();

interface FrontendStackOptions extends EnvironmentOptions {
  apiEndpointOutputId: string;
  createApiRemoteState: (scope: Construct, id: string) => TerraformRemoteState;
}

class FrontendStack extends TerraformStack {
  constructor(
    scope: Construct,
    name: string,
    public options: FrontendStackOptions
  ) {
    super(scope, name);

    // workaround until cross stack references are supported natively by the CDKTF
    const apiState = options.createApiRemoteState(this, "api");
    const apiEndpoint = apiState.getString(options.apiEndpointOutputId);

    new AwsProvider(this, "aws", { region: "eu-central-1" });
    new LocalProvider(this, "local");
    new Frontend(this, "frontend", {
      environment: options.environment,
      apiEndpoint,
    });
  }
}

class PostsStack extends TerraformStack {
  apiEndpointOutputId: string;

  constructor(
    scope: Construct,
    name: string,
    public options: EnvironmentOptions
  ) {
    super(scope, name);
    new AwsProvider(this, "aws", { region: "eu-central-1" });

    const posts = new Posts(this, "posts", {
      environment: options.environment,
    });

    // create an output which can be used in FrontendStack to get the api endpoint
    // this is a workaround until cross stack references are supported natively
    const output = new TerraformOutput(this, "apiEndpoint", {
      value: posts.apiEndpoint,
    });
    this.apiEndpointOutputId = output.friendlyUniqueId;
  }

  // this could probably be added to the TerraformStack class
  get name() {
    return Node.of(this).id;
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
  });
  new FrontendStack(app, "frontend-dev", {
    environment: "development",
    apiEndpointOutputId: postsDev.apiEndpointOutputId,
    createApiRemoteState: (scope, id) =>
      new DataTerraformRemoteStateLocal(scope, id, {
        path: path.resolve(__dirname, `terraform.${postsDev.name}.tfstate`),
      }),
  });
  // prod
  const postsProd = new PostsStack(app, "posts-prod", {
    environment: "production",
  });
  new FrontendStack(app, "frontend-prod", {
    environment: "production",
    apiEndpointOutputId: postsProd.apiEndpointOutputId,
    createApiRemoteState: (scope, id) =>
      new DataTerraformRemoteStateLocal(scope, id, {
        path: path.resolve(__dirname, `terraform.${postsProd.name}.tfstate`),
      }),
  });
}

app.synth();
