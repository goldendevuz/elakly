#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --test test/*.test.mjs
rm -rf dist && mkdir -p dist/site
cp -r site/. dist/site/
cp extension/filter.js brand/mark.svg dist/site/
cp -r extension/fonts dist/site/
(cd extension && python3 -m zipfile -c ../dist/elakly-extension.zip ./*)
echo "dist/ ready"
