import { Resource } from "cdktf";
import { NodejsFunction } from "../../lib/nodejs-function";
import { Construct } from "constructs";
import * as aws from '@cdktf/provider-aws';
import path = require("path");

const lambdaRolePolicy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid": ""
        }
    ]
}

export class PostsApi extends Resource {
    constructor(scope: Construct, id: string) {
        super(scope, id)

        // api lambda tf resources
        new NodejsFunction(this, 'code', {
            path: path.join(__dirname, 'lambda/index.ts')
        });

        // Create Lambda role
        const role = new aws.IamRole(this, "lambda-exec", {
            name: `api-lambda-execution-role`, // todo: prepend stack name and more
            assumeRolePolicy: JSON.stringify(lambdaRolePolicy)
        })

        // Add execution role for lambda to write to CloudWatch logs
        new aws.IamRolePolicyAttachment(this, "lambda-managed-policy", {
            policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            role: role.name
        })

        // Create Lambda function
        new aws.LambdaFunction(this, "api", {
            functionName: `api`, // todo: prepend stack name and more
            handler: 'index.handler',
            runtime: 'nodejs10.x',
            role: role.arn
        });

        // TODO: add api gateway for http access

        // TODO: add output for api endpoint

    }
}