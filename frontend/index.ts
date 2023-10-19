/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";
import { S3BucketWebsiteConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-website-configuration";
import { CloudfrontDistribution } from "@cdktf/provider-aws/lib/cloudfront-distribution";
import { TerraformOutput } from "cdktf";
import { Construct } from "constructs";
import { File } from "@cdktf/provider-local/lib/file";
import * as path from "path";

const S3_ORIGIN_ID = "s3Origin";

interface FrontendOptions {
  environment: string;
  apiEndpoint: string;
}

export class Frontend extends Construct {
  constructor(scope: Construct, id: string, options: FrontendOptions) {
    super(scope, id);

    const bucket = new S3Bucket(this, "bucket", {
      bucketPrefix: `sls-example-frontend-${options.environment}`,
      tags: {
        "hc-internet-facing": "true", // this is only needed for HashiCorp internal security auditing
      },
    });

    // Enable website delivery
    const bucketWebsite = new S3BucketWebsiteConfiguration(
      this,
      "website-configuration",
      {
        bucket: bucket.bucket,

        indexDocument: {
          suffix: "index.html",
        },

        errorDocument: {
          key: "index.html", // we could put a static error page here
        },
      }
    );

    new S3BucketPolicy(this, "s3_policy", {
      bucket: bucket.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Id: "PolicyForWebsiteEndpointsPublicContent",
        Statement: [
          {
            Sid: "PublicRead",
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`${bucket.arn}/*`, `${bucket.arn}`],
          },
        ],
      }),
    });

    const cf = new CloudfrontDistribution(this, "cf", {
      comment: `Serverless example frontend for env=${options.environment}`,
      enabled: true,
      defaultCacheBehavior: {
        allowedMethods: [
          "DELETE",
          "GET",
          "HEAD",
          "OPTIONS",
          "PATCH",
          "POST",
          "PUT",
        ],
        cachedMethods: ["GET", "HEAD"],
        targetOriginId: S3_ORIGIN_ID,
        viewerProtocolPolicy: "redirect-to-https",
        forwardedValues: { queryString: false, cookies: { forward: "none" } },
      },
      origin: [
        {
          originId: S3_ORIGIN_ID,
          domainName: bucketWebsite.websiteEndpoint,
          customOriginConfig: {
            originProtocolPolicy: "http-only",
            httpPort: 80,
            httpsPort: 443,
            originSslProtocols: ["TLSv1.2", "TLSv1.1", "TLSv1"],
          },
        },
      ],
      defaultRootObject: "index.html",
      restrictions: { geoRestriction: { restrictionType: "none" } },
      viewerCertificate: { cloudfrontDefaultCertificate: true },
    });

    new File(this, "env", {
      filename: path.join(__dirname, "code", ".env.production.local"),
      content: Object.entries({
        S3_BUCKET_FRONTEND: bucket.bucket,
        REACT_APP_API_ENDPOINT: options.apiEndpoint,
      })
        .map(([key, value]) => `${key}=${value}`)
        .join("\n"),
    });

    new TerraformOutput(this, "frontend_domainname", {
      value: cf.domainName,
    }).addOverride("value", `https://${cf.domainName}`);
  }
}
