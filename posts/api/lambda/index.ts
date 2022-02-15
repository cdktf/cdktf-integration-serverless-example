import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import * as storage from "./posts";

type APIGatewayProxyStructuredResultV2Json = Omit<
  APIGatewayProxyStructuredResultV2,
  "body"
> & { body: any };

/**
 * automatically JSON stringifies the body and adds a `Content-Type: application/json` header
 */
function jsonResponse(
  response: APIGatewayProxyStructuredResultV2Json
): APIGatewayProxyResultV2 {
  return {
    statusCode: 200,
    ...response,
    headers: {
      ...response.headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(response.body),
  };
}

/**
 * does basic routing and global error handling
 */
export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    const method: string = event.requestContext.http.method;
    const path: string = event.rawPath;

    if (path === "/posts") {
      switch (method) {
        case "GET":
          return jsonResponse(await getAllPosts(event));
        case "POST":
          return jsonResponse(await postPost(event));
        case "OPTIONS":
          return { statusCode: 200 };
        default:
          return jsonResponse({
            statusCode: 405,
            body: { error: `Method ${method} not supported on ${path}` },
          });
      }
    }
    if (path.startsWith("/posts")) {
      const matches = /^\/posts\/([^\/]+)\/detail$/.exec(path);
      if (matches) {
        if (method === "GET") {
          return jsonResponse(await getPost(matches[1], event));
        } else {
          return jsonResponse({
            statusCode: 405,
            body: { error: `Method ${method} not supported on ${path}` },
          });
        }
      }
    }

    return jsonResponse({
      statusCode: 404,
      body: { error: "No matching route found" },
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({
      statusCode: 500,
      body: { error: `request failed: ${e.message}` },
    });
  }
}

export async function getAllPosts(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2Json> {
  return {
    body: {
      // TODO: do we really want to wrap this in data? we should make it consistent with getPost
      data: await storage.getAllPosts(),
    },
  };
}

export async function getPost(
  id: string,
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2Json> {
  return {
    body: await storage.getPost(id),
  };
}

export async function postPost(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2Json> {
  await storage.addPost(JSON.parse(event.body!) as storage.PostPut);
  return {
    statusCode: 201,
    body: {},
  };
}
