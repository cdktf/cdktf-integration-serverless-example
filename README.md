# serverless example


### Notes
- after renaming an asset, the previous output stays in cdktf.out/.../assets
- allow multiple stacks to be put into a single tf state?
- multiple stacks depedencies / order of deployment
- define dependencies between resources on a construct level without using inputs/outputs for terraform? -> i.e. could automatically add depends_on to resources
- multiple aws providers? (all being synthesized to the same tf stack but come from different constructs?)
- cdktf outputs --json command?
