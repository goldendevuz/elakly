#!/usr/bin/env bash
# Copy the extension to a folder Chrome has loaded unpacked. It reloads itself when build.json changes.
# Usage: scripts/dev.sh <target-folder>
set -euo pipefail
target="${1:-${ELAKLY_DEV_DIR:?pass the target folder or set ELAKLY_DEV_DIR}}"
cd "$(dirname "$0")/.."
node --test test/*.test.mjs
mkdir -p "$target"
cp -r extension/. "$target"/
printf '{"build":"%s"}\n' "$(date +%s%N)" > "$target/build.json" # written last
echo "Copied to $target"
