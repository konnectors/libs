#!/bin/bash

set -e
git checkout master
echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >> ~/.npmrc
env GH_TOKEN="$GITHUB_TOKEN" yarn lerna publish --yes
