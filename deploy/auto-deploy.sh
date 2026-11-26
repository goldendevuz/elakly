#!/usr/bin/env bash
# Run from cron every minute on the server. Deploys a new commit on main once GitHub's checks pass.
# Prints only when it acts, so the log stays short.
set -euo pipefail
cd "$(dirname "$0")/.."
git fetch -q origin main
new="$(git rev-parse origin/main)"
[ "$(cat .deployed 2>/dev/null)" = "$new" ] && exit 0
state="$(curl -fsS --max-time 20 "https://api.github.com/repos/goldendevuz/elakly/actions/runs?head_sha=$new" |
  python3 -c 'import json,sys; r=json.load(sys.stdin)["workflow_runs"]; print(r[0]["conclusion"] if r else None)')"
[ "$state" = "success" ] || exit 0
echo "$(date -Is) new commit ${new:0:7}, deploying"
./deploy/deploy.sh
