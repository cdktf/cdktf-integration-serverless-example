import { Resource } from "cdktf";
import { Construct } from "constructs";
import { PostsApi } from "./api";
import { PostsGenerator } from "./generator";
import cronTime from "cron-time-generator";
import { PostsStorage } from "./storage";

interface PostsOptions {
  environment: string;
  userSuffix?: string;
}

export class Posts extends Resource {
  apiEndpoint: PostsApi["endpoint"];

  constructor(scope: Construct, id: string, options: PostsOptions) {
    super(scope, id);

    const storage = new PostsStorage(this, "storage", {
      environment: options.environment,
      userSuffix: options.userSuffix,
    });

    const postsApi = new PostsApi(this, "api", {
      environment: options.environment,
      table: storage.table,
      userSuffix: options.userSuffix,
    });
    this.apiEndpoint = postsApi.endpoint;

    new PostsGenerator(this, "generator", {
      cronPattern: cronTime.everyDayAt(0, 0),
      userSuffix: options.userSuffix,
    });
  }
}
