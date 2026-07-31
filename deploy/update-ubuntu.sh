#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/monkeyquest/app"
ENV_FILE="/etc/monkeyquest/monkeyquest.env"
HEALTH_URL="http://127.0.0.1:3000/"
HEALTH_TIMEOUT_SECONDS=30

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
health_deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))

while ((SECONDS < health_deadline)); do
  if curl \
    --connect-timeout 1 \
    --fail \
    --max-time 3 \
    --silent \
    "${HEALTH_URL}" >/dev/null 2>&1; then
    echo "Monkey Quest has been updated successfully."
    exit 0
  fi

  if ! systemctl is-active --quiet monkeyquest.service; then
    echo "Monkey Quest failed to start."
    systemctl status monkeyquest.service --no-pager --full || true
    journalctl -u monkeyquest.service -n 50 --no-pager || true
    exit 1
  fi

  sleep 1
done

echo "Monkey Quest did not become healthy at ${HEALTH_URL} within ${HEALTH_TIMEOUT_SECONDS} seconds."
systemctl status monkeyquest.service --no-pager --full || true
journalctl -u monkeyquest.service -n 50 --no-pager || true
exit 1
