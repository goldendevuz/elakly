#!/usr/bin/env bash
# Runs on the server: pull from GitHub, test and build in a throwaway Node container, serve with nginx.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull -q --ff-only
# nginx serves site/dist, so build beside it and swap the files only after a good build.
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD":/app -w /app node:22-alpine sh -c \
  "node --test test/*.test.mjs && cd site && npm ci --no-audit --no-fund && npx tsc && npx vite build --outDir .build --emptyOutDir"
mkdir -p site/dist
cp -r site/.build/. site/dist/
rm -rf site/.build
docker compose -f deploy/docker-compose.yml up -d
git rev-parse HEAD > .deployed
echo "deployed $(git rev-parse --short HEAD)"
