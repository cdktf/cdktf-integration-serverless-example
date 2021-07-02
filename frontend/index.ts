import * as aws from "@cdktf/provider-aws";
import { Resource, TerraformOutput } from "cdktf";
import { Construct } from "constructs";
import { File } from '../.gen/providers/local';
import * as path from 'path';

const S3_ORIGIN_ID = 's3Origin';

interface FrontendOptions {
    environment: string;
    apiEndpoint: string;
}

export class Frontend extends Resource {
    constructor(scope: Construct, id: string, options: FrontendOptions) {
        super(scope, id)

        const bucket = new aws.S3Bucket(this, 'bucket', {
            bucketPrefix: `sls-example-frontend-${options.environment}`,
            website: [{
                indexDocument: 'index.html',
                errorDocument: 'index.html',
            }]
        })

        new aws.S3BucketPolicy(this, 's3_policy', {
            bucket: bucket.id,
            policy: JSON.stringify({
                "Version": "2012-10-17",
                "Id": "PolicyForWebsiteEndpointsPublicContent",
                "Statement": [
                    {
                        "Sid": "PublicRead",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": [
                            "s3:GetObject"
                        ],
                        "Resource": [
                            `${bucket.arn}/*`,
                            `${bucket.arn}`,
                        ]
                    }
                ]
            }),
        });

        const cf = new aws.CloudfrontDistribution(this, 'cf', {
            comment: `Serverless example frontend for env=${options.environment}`,
            enabled: true,
            defaultCacheBehavior: [{
                allowedMethods: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
                cachedMethods: ['GET', 'HEAD'],
                targetOriginId: S3_ORIGIN_ID,
                viewerProtocolPolicy: 'redirect-to-https',
                forwardedValues: [{ queryString: false, cookies: [{ forward: 'none' }] }]
            }],
            origin: [{
                originId: S3_ORIGIN_ID,
                domainName: bucket.websiteEndpoint,
                customOriginConfig: [{
                    originProtocolPolicy: 'http-only',
                    httpPort: 80,
                    httpsPort: 443,
                    originSslProtocols: ["TLSv1.2", "TLSv1.1", "TLSv1"]
                }]
            }],
            defaultRootObject: 'index.html',
            restrictions: [{ geoRestriction: [{ restrictionType: 'none' }] }],
            viewerCertificate: [{ cloudfrontDefaultCertificate: true }]
        });

        new File(this, 'env', {
            filename: path.join(__dirname, 'code', '.env.production.local'),
            content: Object.entries({
                S3_BUCKET_FRONTEND: bucket.bucket,
                REACT_APP_API_ENDPOINT: options.apiEndpoint,
            }).map(([key, value]) => `${key}=${value}`).join('\n')
        });

        new TerraformOutput(this, 'frontend_domainname', { value: cf.domainName }).addOverride('value', `https://${cf.domainName}`)

    }
}
