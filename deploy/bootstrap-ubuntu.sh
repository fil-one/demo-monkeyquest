#!/usr/bin/env bash
set -Eeuo pipefail

DOMAIN="monkeyquest.filone.com"
APP_DIR="/opt/monkeyquest/app"
ENV_DIR="/etc/monkeyquest"
ENV_FILE="${ENV_DIR}/monkeyquest.env"
SERVICE_FILE="/etc/systemd/system/monkeyquest.service"
LETSENCRYPT_EMAIL="${1:-}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root: sudo ./deploy/bootstrap-ubuntu.sh you@example.com"
  exit 1
fi

if [[ -z "${LETSENCRYPT_EMAIL}" ]]; then
  echo "A Let's Encrypt account email is required."
  echo "Usage: sudo ./deploy/bootstrap-ubuntu.sh you@example.com"
  exit 1
fi

if [[ ! -f "${APP_DIR}/package.json" ]]; then
  echo "The application was not found at ${APP_DIR}."
  echo "Clone or copy this repository there, or set APP_DIR before running."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg nginx certbot

node_major=0
if command -v node >/dev/null 2>&1; then
  node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
fi

if (( node_major < 22 )); then
  nodesource_setup="$(mktemp)"
  trap 'rm -f "${nodesource_setup:-}"' EXIT
  curl --fail --silent --show-error --location \
    https://deb.nodesource.com/setup_22.x \
    --output "${nodesource_setup}"
  bash "${nodesource_setup}"
  apt-get install -y nodejs
fi

if ! id monkeyquest >/dev/null 2>&1; then
  useradd \
    --system \
    --home-dir /var/lib/monkeyquest \
    --create-home \
    --shell /usr/sbin/nologin \
    monkeyquest
fi

install -d -o root -g monkeyquest -m 0750 "${ENV_DIR}"
install -d -o monkeyquest -g monkeyquest -m 0750 /var/lib/monkeyquest

if [[ ! -f "${ENV_FILE}" ]]; then
  install -o root -g monkeyquest -m 0640 \
    "${APP_DIR}/deploy/monkeyquest.env.example" \
    "${ENV_FILE}"
  echo "Created ${ENV_FILE}."
  echo "Add the S3 access key and secret, then run this command again."
  exit 2
fi

if ! grep -Eq '^AWS_ACCESS_KEY_ID=.+$' "${ENV_FILE}" ||
   ! grep -Eq '^AWS_SECRET_ACCESS_KEY=.+$' "${ENV_FILE}"; then
  echo "AWS credentials are missing from ${ENV_FILE}."
  exit 2
fi

chown -R monkeyquest:monkeyquest "${APP_DIR}"

runuser -u monkeyquest -- env HOME=/var/lib/monkeyquest \
  npm --prefix "${APP_DIR}" ci
runuser -u monkeyquest -- env HOME=/var/lib/monkeyquest \
  npm --prefix "${APP_DIR}" run build

install -o root -g root -m 0644 \
  "${APP_DIR}/deploy/systemd/monkeyquest.service" \
  "${SERVICE_FILE}"
systemctl daemon-reload
systemctl enable --now monkeyquest.service

rm -f /etc/nginx/sites-enabled/default
"${APP_DIR}/deploy/configure-https-ubuntu.sh" "${LETSENCRYPT_EMAIL}"
systemctl restart monkeyquest.service

curl --fail --silent --show-error \
  --retry 10 --retry-connrefused --retry-delay 1 --retry-max-time 30 \
  "http://127.0.0.1:3000/" >/dev/null
echo "Monkey Quest is running at https://${DOMAIN}"
