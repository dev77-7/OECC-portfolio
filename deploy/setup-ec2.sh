#!/usr/bin/env bash
# One-time server setup for the OECC static site on an EC2 instance running Ubuntu 24.04 LTS.
#
# Run ON THE SERVER, from the folder you copied the site into:
#   sudo bash deploy/setup-ec2.sh                                  # no domain yet: serves on the EC2 public DNS over HTTP
#   sudo bash deploy/setup-ec2.sh oecc.co.in admin@oecc.co.in      # with a domain: also gets a free Let's Encrypt certificate
#
# For the HTTPS step, the domain's A records (oecc.co.in and www.oecc.co.in) must already
# point at this instance's Elastic IP, and the security group must allow ports 80 and 443.
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
SITE_ROOT="/var/www/oecc"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$(dirname "$HERE")"            # the site folder (parent of deploy/)
DEPLOY_USER="${SUDO_USER:-ubuntu}"

if [[ $EUID -ne 0 ]]; then echo "Run with sudo." >&2; exit 1; fi

echo "==> Installing nginx, certbot and rsync"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx rsync

echo "==> Copying the site to ${SITE_ROOT}"
mkdir -p "$SITE_ROOT"
rsync -a --delete \
  --exclude 'deploy/' --exclude 'README.md' --exclude '.git*' --exclude '.DS_Store' \
  "$SRC"/ "$SITE_ROOT"/
# deploy user can push updates with rsync; nginx (www-data) can read
chown -R "$DEPLOY_USER":www-data "$SITE_ROOT"
find "$SITE_ROOT" -type d -exec chmod 755 {} +
find "$SITE_ROOT" -type f -exec chmod 644 {} +

echo "==> Configuring nginx"
if [[ -n "$DOMAIN" ]]; then SERVER_NAME="$DOMAIN www.$DOMAIN"; else SERVER_NAME="_"; fi
install -m 644 "$HERE/nginx/oecc-headers.conf" /etc/nginx/snippets/oecc-headers.conf
sed "s/__SERVER_NAME__/${SERVER_NAME}/" "$HERE/nginx/oecc.conf" > /etc/nginx/sites-available/oecc.conf
ln -sf /etc/nginx/sites-available/oecc.conf /etc/nginx/sites-enabled/oecc.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

if [[ -n "$DOMAIN" && -n "$EMAIL" ]]; then
  echo "==> Requesting a Let's Encrypt certificate for $DOMAIN and www.$DOMAIN"
  certbot --nginx --non-interactive --agree-tos -m "$EMAIL" \
    -d "$DOMAIN" -d "www.$DOMAIN" --redirect
  # HTTPS works, so tell browsers to stick to it
  sed -i 's|^# add_header Strict-Transport-Security|add_header Strict-Transport-Security|' /etc/nginx/snippets/oecc-headers.conf
  nginx -t && systemctl reload nginx
  # certbot installs a systemd timer that renews automatically; check it once:
  certbot renew --dry-run
  echo "==> Done: https://$DOMAIN"
else
  PUBLIC_DNS="$(curl -s --max-time 2 -H "X-aws-ec2-metadata-token: $(curl -s --max-time 2 -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')" http://169.254.169.254/latest/meta-data/public-hostname || true)"
  echo "==> Done: http://${PUBLIC_DNS:-<instance public DNS>}"
  echo "    (Let's Encrypt cannot issue certificates for *.amazonaws.com names, so HTTPS needs your own domain.)"
fi
