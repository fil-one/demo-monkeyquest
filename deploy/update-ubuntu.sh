#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/monkeyquest/app"
ENV_FILE="/etc/monkeyquest/monkeyquest.env"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root: sudo ./deploy/update-ubuntu.sh"
  exit 1
fi

if [[ ! -f "${APP_DIR}/package.json" || ! -f "${ENV_FILE}" ]]; then
  echo "Run deploy/bootstrap-ubuntu.sh before updating the application."
  exit 1
fi

runuser -u monkeyquest -- env HOME=/var/lib/monkeyquest \
  npm --prefix "${APP_DIR}" ci
runuser -u monkeyquest -- env HOME=/var/lib/monkeyquest \
  npm --prefix "${APP_DIR}" run build

systemctl restart monkeyquest.service
curl --fail --silent --show-error "http://127.0.0.1:3000/" >/dev/null
echo "Monkey Quest has been updated successfully."
