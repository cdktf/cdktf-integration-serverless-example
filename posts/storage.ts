import * as aws from "@cdktf/provider-aws/lib/dynamodb";
import { Resource } from "cdktf";
import { Construct } from "constructs";

interface PostsStorageOptions {
  environment: string;
}

export class PostsStorage extends Resource {
  table: aws.DynamodbTable;

  constructor(scope: Construct, id: string, options: PostsStorageOptions) {
    super(scope, id);

    this.table = new aws.DynamodbTable(this, "table", {
      name: `sls-posts-${options.environment}`,
      billingMode: "PAY_PER_REQUEST",
      hashKey: "id",
      rangeKey: "postedAt",
      attribute: [
        { name: "id", type: "S" },
        { name: "postedAt", type: "S" },
      ],
    });
  }
}
