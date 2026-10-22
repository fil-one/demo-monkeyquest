#!/usr/bin/env bash
set -Eeuo pipefail

DOMAIN="monkeyquest.filone.com"
DEPLOY_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
NGINX_AVAILABLE="/etc/nginx/sites-available/monkeyquest"
NGINX_ENABLED="/etc/nginx/sites-enabled/monkeyquest"
CERTBOT_ROOT="/var/www/certbot"
RENEWAL_HOOK_DIR="/etc/letsencrypt/renewal-hooks/deploy"
LETSENCRYPT_EMAIL="${1:-}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root: sudo ./deploy/configure-https-ubuntu.sh you@example.com"
  exit 1
fi

if [[ -z "${LETSENCRYPT_EMAIL}" ]]; then
  echo "Usage: sudo ./deploy/configure-https-ubuntu.sh you@example.com"
  exit 1
fi

for required_command in certbot nginx systemctl curl; do
  if ! command -v "${required_command}" >/dev/null 2>&1; then
    echo "Missing ${required_command}. Run deploy/bootstrap-ubuntu.sh first."
    exit 1
  fi
done

for required_file in nginx/monkeyquest-http.conf nginx/monkeyquest.conf reload-nginx-after-renewal.sh; do
  if [[ ! -f "${DEPLOY_DIR}/${required_file}" ]]; then
    echo "Missing deployment file: ${DEPLOY_DIR}/${required_file}"
    exit 1
  fi
done

backup_dir="$(mktemp -d)"
configuration_changed=false

cleanup() {
  local status=$?
  trap - EXIT

  if (( status != 0 )) && [[ "${configuration_changed}" == true ]]; then
    # Preserve the original failure while attempting to restore both site files.
    set +e
    rm -f -- "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"
    if [[ -e "${backup_dir}/available" || -L "${backup_dir}/available" ]]; then
      cp -a -- "${backup_dir}/available" "${NGINX_AVAILABLE}"
    fi
    if [[ -e "${backup_dir}/enabled" || -L "${backup_dir}/enabled" ]]; then
      cp -a -- "${backup_dir}/enabled" "${NGINX_ENABLED}"
    fi
    if nginx -t; then
      systemctl reload nginx.service
    fi
    echo "HTTPS setup failed; attempted to restore the previous Monkey Quest Nginx configuration." >&2
    echo "Check the error above, DNS, and inbound port 80, then rerun this command." >&2
  fi

  rm -rf -- "${backup_dir}"
  exit "${status}"
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [[ -e "${NGINX_AVAILABLE}" || -L "${NGINX_AVAILABLE}" ]]; then
  cp -a -- "${NGINX_AVAILABLE}" "${backup_dir}/available"
fi
if [[ -e "${NGINX_ENABLED}" || -L "${NGINX_ENABLED}" ]]; then
  cp -a -- "${NGINX_ENABLED}" "${backup_dir}/enabled"
fi

install -d -o www-data -g www-data -m 0755 "${CERTBOT_ROOT}"
configuration_changed=true
install -o root -g root -m 0644 \
  "${DEPLOY_DIR}/nginx/monkeyquest-http.conf" \
  "${NGINX_AVAILABLE}"
ln -sfn "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"
nginx -t
systemctl enable --now nginx.service
systemctl reload nginx.service

# Certbot obtains a missing certificate or renews one that is due. A file's
# existence alone does not establish that its certificate is still valid.
certbot certonly \
  --webroot \
  --webroot-path "${CERTBOT_ROOT}" \
  --domain "${DOMAIN}" \
  --cert-name "${DOMAIN}" \
  --email "${LETSENCRYPT_EMAIL}" \
  --agree-tos \
  --non-interactive \
  --keep-until-expiring

install -o root -g root -m 0644 \
  "${DEPLOY_DIR}/nginx/monkeyquest.conf" \
  "${NGINX_AVAILABLE}"
install -d -o root -g root -m 0755 "${RENEWAL_HOOK_DIR}"
install -o root -g root -m 0755 \
  "${DEPLOY_DIR}/reload-nginx-after-renewal.sh" \
  "${RENEWAL_HOOK_DIR}/reload-nginx"
nginx -t
systemctl reload nginx.service

# Verify the listener and certificate locally, independently of public DNS and
# firewall reachability. An HTTP error from the app is separate from TLS setup.
curl --head --silent --show-error \
  --connect-timeout 5 --max-time 10 \
  --retry 5 --retry-all-errors --retry-delay 1 --retry-max-time 15 \
  --noproxy "${DOMAIN}" \
  --resolve "${DOMAIN}:443:127.0.0.1" \
  "https://${DOMAIN}/" >/dev/null

echo "HTTPS is configured at https://${DOMAIN}."
echo "Verify public access on TCP ports 80 and 443 and test certificate renewal."
