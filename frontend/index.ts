// stack for infra for statically hosted frontend

// TODO build and deploy frontend

import * as aws from "@cdktf/provider-aws";
import { Resource } from "cdktf";
import { Construct } from "constructs";
import { File } from '../.gen/providers/local';
import * as path from 'path';

const S3_ORIGIN_ID = 's3Origin';

interface FrontendOptions {
    environment: string;
}

export class Frontend extends Resource {
    constructor(scope: Construct, id: string, options: FrontendOptions) {
        super(scope, id)

        const bucket = new aws.S3Bucket(this, 'bucket', {
            bucketPrefix: `example-frontend-origin-${options.environment}`
        })

        new aws.CloudfrontDistribution(this, 'cf', {
            enabled: true,
            defaultCacheBehavior: [{
                allowedMethods: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
                cachedMethods: ['GET', 'HEAD'],
                targetOriginId: S3_ORIGIN_ID,
                viewerProtocolPolicy: 'redirect-to-https',
            }],
            origin: [{
                originId: S3_ORIGIN_ID,
                domainName: bucket.bucketRegionalDomainName,
            }],
            restrictions: [{ geoRestriction: [{ restrictionType: 'none' }] }],
            viewerCertificate: [{ cloudfrontDefaultCertificate: true }]
        });

        new File(this, 'env', {
            filename: path.join(__dirname, 'code', '.env.production.local'),
            content: Object.entries({
                S3_BUCKET_FRONTEND: 'todo',
                CREATE_REACT_APP_API_ENDPOINT: 'todo',
            }).map(([key, value]) => `${key}=${value}`).join('\n')
        });
        
    }
}