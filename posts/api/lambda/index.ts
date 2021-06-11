import deburr from 'lodash/deburr';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";

type APIGatewayProxyStructuredResultV2Json = Omit<APIGatewayProxyStructuredResultV2, 'body'> & { body: any };

/**
 * automatically JSON stringifies the body and adds a `Content-Type: application/json` header
 */
function jsonResponse(response: APIGatewayProxyStructuredResultV2Json): APIGatewayProxyResultV2 {
    return {
        statusCode: 200,
        ...response,
        headers: {
            ...response.headers,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(response.body),
    }
}

/**
 * does basic routing and global error handling
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
    try {
        const method: string = event.requestContext.http.method;
        const path: string = event.rawPath;

        if (path === '/posts') {
            switch (method) {
                case 'GET': return jsonResponse(await getAllPosts(event));
                case 'POST': return jsonResponse(await postPost(event));
                default:
                    return jsonResponse({
                        statusCode: 405,
                        body: { error: `Method ${method} not supported on ${path}` }
                    });
            }
        }
        if (path.startsWith('/posts')) {
            const matches = /^\/posts\/([^\/]+)\/detail$/.exec(path)
            if (matches) {
                if (method === 'GET') {
                    return jsonResponse(await getPost(event));
                } else {
                    return jsonResponse({
                        statusCode: 405,
                        body: { error: `Method ${method} not supported on ${path}` }
                    });
                }
            }
        }

        return jsonResponse({
            statusCode: 404,
            body: { error: 'No matching route found' }
        });
    } catch (e) {
        return jsonResponse({
            statusCode: 500,
            body: { error: `request failed: ${e.message}` }
        })
    }
}

export async function getAllPosts(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2Json> {
    return {
        body: { // TODO: do we really want to wrap this in data? we should make it consistent with getPost
            data: [
                { id: 1, content: 'foo', author: 'bar' },
                { id: 2, content: 'foofoo', author: 'barbar' },
            ]
        }
    }
}

export async function getPost(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2Json> {
    return {
        body: { id: 2, content: 'foofoo', author: 'barbar' },
    }
}

export async function postPost(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2Json> {
    return {
        statusCode: 201,
        body: { id: 1, content: 'foo', author: 'bar' }
    }
}
