/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { FrontendStack } from "../main";
import { PostsStack } from "../main";
import { Testing } from "cdktf";

describe("Tests against regression of synth output", () => {
    it("has no change in FrontendStack Configuration", () => {
        const app = Testing.app();
        const stack = new FrontendStack(app, "test-frontend", {
            environment: "development",
            user: "regression-test",
            apiEndpoint: "N/A",
        });
        const stackSynth = JSON.parse(Testing.synth(stack));
        delete stackSynth["terraform"]
        expect(JSON.stringify(stackSynth, null, 2)).toMatchSnapshot();
    });
    it("has no change in PostsStack Configuration", () => {
        const app = Testing.app();
        const stack = new PostsStack(app, "test-posts", {
            environment: "development",
            user: "regression-test",
        });
        const stackSynth = JSON.parse(Testing.synth(stack));
        delete stackSynth["terraform"]
        expect(JSON.stringify(stackSynth, null, 2)).toMatchSnapshot();
    });
});
