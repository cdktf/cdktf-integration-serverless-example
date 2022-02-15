// source: https://github.com/skorfmann/cdktf-nodejs-function/blob/main/src/index.ts
// inlined because esbuild is compiled natively and only works on linux for the
// currently published packages of skorfmann/cdktf-nodejs-function
import * as path from "path";
import { Resource, TerraformAsset, AssetType } from "cdktf";
import { Construct } from "constructs";
import { buildSync } from "esbuild";

export interface NodejsFunctionProps {
  readonly path: string;
}

const bundle = (workingDirectory: string, entryPoint: string) => {
  buildSync({
    entryPoints: [entryPoint],
    platform: "node",
    target: "es2018",
    bundle: true,
    format: "cjs",
    sourcemap: "external",
    outdir: "dist",
    absWorkingDir: workingDirectory,
  });

  return path.join(workingDirectory, "dist");
};

export class NodejsFunction extends Resource {
  public readonly asset: TerraformAsset;
  public readonly bundledPath: string;

  constructor(scope: Construct, id: string, props: NodejsFunctionProps) {
    super(scope, id);

    const workingDirectory = path.resolve(path.dirname(props.path));
    const distPath = bundle(workingDirectory, path.basename(props.path));

    this.bundledPath = path.join(
      distPath,
      `${path.basename(props.path, ".ts")}.js`
    );

    this.asset = new TerraformAsset(this, "lambda-asset", {
      path: distPath,
      type: AssetType.ARCHIVE,
    });
  }
}
