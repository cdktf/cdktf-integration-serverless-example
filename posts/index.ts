import { Resource } from "cdktf";
import { Construct } from "constructs";
import { PostsApi } from "./api";
import { PostsGenerator } from "./generator";
import cronTime from 'cron-time-generator';

interface PostsOptions {
  environment: string;
}

export class Posts extends Resource {
  constructor(scope: Construct, id: string, options: PostsOptions) {
    super(scope, id)

    // TODO: dynamodb here?
    options

    new PostsApi(this, 'api');
    new PostsGenerator(this, 'generator', { cronPattern: cronTime.everyDayAt(0, 0)});
  }
}
