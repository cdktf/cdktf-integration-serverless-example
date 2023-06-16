#!/bin/bash

set -ex

PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE:-$0}")/.." && pwd)
CDKTF_VERSION=$1

echo "Updating to cdktf version $CDKTF_VERSION"
cd $PROJECT_ROOT

yarn add -D -W cdktf-cli@$CDKTF_VERSION
yarn add -W cdktf@$CDKTF_VERSION @cdktf/provider-aws@latest @cdktf/provider-local@latest
