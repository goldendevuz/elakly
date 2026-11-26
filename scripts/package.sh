#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --test test/*.test.mjs
rm -rf dist && mkdir -p dist
(cd extension && python3 -m zipfile -c ../dist/elakly-extension.zip ./*)
(cd site && npm ci --no-audit --no-fund && npm run build)
echo "dist/ and site/dist/ ready"
