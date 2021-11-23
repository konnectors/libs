#!/bin/bash

set -e

yarn lerna bootstrap
yarn lint
yarn test
cd packages/cozy-konnector-libs
yarn docs

set +e # The following command relies on exit 1
git diff --exit-code -- docs
docs_status=$?
set -e
if [[ $docs_status == 0 ]]; then
  echo "Docs are up-to-date"
else
  echo "Docs are not up-to-date, please run yarn docs inside cozy-konnector-libs directory and repush"
  exit 1
fi
set -e

