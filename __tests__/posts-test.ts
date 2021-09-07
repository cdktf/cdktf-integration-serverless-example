import { Testing } from "cdktf";
import { Posts } from "../posts/index";
import * as aws from "@cdktf/provider-aws";
describe("posts", () => {
  it("should store posts in dynamodb on a per request billing mode", () => {
    expect(
      Testing.synthScope(
        (scope) => new Posts(scope, "my-posts", { environment: "testing" })
      )
    ).toHaveResourceWithProperties(aws.DynamodbTable, {
      billingMode: "PAY_PER_REQUEST",
    });
  });
});
