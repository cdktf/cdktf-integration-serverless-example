import { Resource } from "cdktf";
import { Construct } from "constructs";

interface PostsStorageOptions {
    
}

export class PostsStorage extends Resource {
    constructor(scope: Construct, id: string, options: PostsStorageOptions) {
        super(scope, id)

        // todo: create dynamodb table
        options

    }
}