/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";
import { Construct } from "constructs";

interface PostsStorageOptions {
  environment: string;
  userSuffix?: string;
}

export class PostsStorage extends Construct {
  table: DynamodbTable;

  constructor(scope: Construct, id: string, options: PostsStorageOptions) {
    super(scope, id);

    this.table = new DynamodbTable(this, "table", {
      name: `sls-posts-${options.environment + (options.userSuffix || "")}`,
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
