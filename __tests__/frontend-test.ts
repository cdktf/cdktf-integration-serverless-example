import { Testing, TerraformStack } from "cdktf";
import { Frontend } from "../frontend/index";

describe("Frontend", () => {
  it("plans successfully", () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, "test");
    new Frontend(stack, "frontend", {
      apiEndpoint: "foo.bar",
      environment: "testing",
    });

    expect(Testing.synth(stack)).toPlanSuccessfully();
  });
});
