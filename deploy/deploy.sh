#!/usr/bin/env bash
# Push site updates from your computer to the EC2 server.
#
#   ./deploy/deploy.sh ubuntu@ec2-13-232-xx-xx.ap-south-1.compute.amazonaws.com ~/.ssh/oecc-key.pem
#
# Run from the site folder (the one containing index.html). Only changed files are sent.
set -euo pipefail

HOST="${1:?Usage: deploy.sh user@host path/to/key.pem}"
KEY="${2:?Usage: deploy.sh user@host path/to/key.pem}"
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Stop before shipping unfinished placeholders.
if grep -q 'fill-in' index.html || grep -q 'data-handover=""' index.html || grep -q 'YOUR_FORM_ID' index.html; then
  echo "index.html still has placeholders ([bracketed] text, the handover year or the Google Form link). Fill them in, or set ALLOW_PLACEHOLDERS=1 to push anyway." >&2
  [[ "${ALLOW_PLACEHOLDERS:-0}" == "1" ]] || exit 1
fi

rsync -avz --delete --chmod=D755,F644 \
  --exclude 'deploy/' --exclude 'README.md' --exclude '.git*' --exclude '.DS_Store' \
  -e "ssh -i $KEY" ./ "$HOST":/var/www/oecc/

echo "Deployed."
