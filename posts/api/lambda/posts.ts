import { v4 as uuidv4 } from "uuid";
import { Table, Entity } from "dynamodb-toolbox";
import DynamoDB from "aws-sdk/clients/dynamodb";
const DocumentClient = new DynamoDB.DocumentClient();

if (!process.env.DYNAMODB_TABLE_NAME) {
  throw new Error("DYNAMODB_TABLE_NAME env variable is required");
}

const PostsTable = new Table({
  // Specify table name (used by DynamoDB)
  name: process.env.DYNAMODB_TABLE_NAME,

  // Define partition and sort keys
  partitionKey: "id",
  sortKey: "postedAt",

  // Add the DocumentClient
  DocumentClient,
});

interface Post {
  id: string;
  postedAt: string;
  author: string;
  content: string;
}

const PostEntity = new Entity<Post>({
  name: "Post",

  attributes: {
    id: { partitionKey: true, default: () => uuidv4() }, // flag as partitionKey
    postedAt: { sortKey: true, default: () => new Date().toISOString() },
    author: "string",
    content: "string",
  },

  table: PostsTable,
});

export async function getAllPosts(): Promise<Post[]> {
  const result = await PostEntity.scan({ limit: 100 });
  return result.Items as Post[];
}

export async function getPost(id: string): Promise<Post | undefined> {
  const posts = await PostEntity.query(id);
  console.log(`PostEntity.query(${id}) return value:`, posts);
  if (posts.Items.length !== 1) {
    return undefined;
  }
  return posts.Items[0] as Post;
}

export type PostPut = Omit<Post, "id" | "postedAt">;
export async function addPost(post: PostPut) {
  await PostEntity.put(post);
}
