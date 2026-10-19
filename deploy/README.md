# Ubuntu deployment for monkeyquest.filone.com

This setup runs the standalone Node.js server on `127.0.0.1:3000`, keeps it
online with systemd, and exposes it through Nginx over HTTPS. Certbot obtains
and renews the Let's Encrypt certificate.

## Before starting

Use Ubuntu 22.04 LTS or newer on an `amd64` or `arm64` host. Make sure:

1. The DNS `A` record for `monkeyquest.filone.com` points to the host's public IPv4
   address. Add an `AAAA` record only if IPv6 is configured and reachable.
2. Inbound TCP ports `22`, `80`, and `443` are allowed by the provider firewall.
3. This repository is checked out at `/opt/monkeyquest/app`.
4. You have an email address for Let's Encrypt expiry and security notices.

Example checkout:

```bash
sudo mkdir -p /opt/monkeyquest
sudo git clone https://github.com/fil-one/demo-monkeyquest.git /opt/monkeyquest/app
cd /opt/monkeyquest/app
```

## First deployment

Run the bootstrap once. It installs Node.js 22 when needed, Nginx, Certbot,
the systemd unit, and the Nginx configuration:

```bash
sudo ./deploy/bootstrap-ubuntu.sh admin@example.com
```

The first run creates `/etc/monkeyquest/monkeyquest.env` and stops. Edit that
root-owned file to add the S3 credentials:

```bash
sudoedit /etc/monkeyquest/monkeyquest.env
sudo ./deploy/bootstrap-ubuntu.sh admin@example.com
```

Do not put credentials in the repository. The environment file is readable
only by root and the `monkeyquest` service group.

Certificate issuance will fail until public DNS reaches this host on port 80.
After issuance, HTTP redirects to HTTPS and Certbot's system timer handles
renewal. Confirm the timer and test renewal:

```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

## Updating

Pull or check out the release you want, then rebuild and restart it:

```bash
cd /opt/monkeyquest/app
sudo -u monkeyquest git pull --ff-only
sudo ./deploy/update-ubuntu.sh
```

The update script does not choose a branch or pull code automatically.

## Migrating an existing node to monkeyquest.filone.com

For a node currently serving `monkeyquest.fil.one`, first point the new DNS
`A` record at the node and wait for public DNS to resolve correctly. Any `AAAA`
record must also reach this node. Port 80 must remain reachable for certificate
issuance and renewal.

Pull the updated repository and edit the existing runtime environment file:

```bash
cd /opt/monkeyquest/app
sudo -u monkeyquest git pull --ff-only
sudoedit /etc/monkeyquest/monkeyquest.env
```

Set the trusted hostname to the following, keeping the S3 credentials and other
settings in that file:

```dotenv
VINEXT_TRUSTED_HOSTS=monkeyquest.filone.com
```

The bootstrap preserves existing environment files, so updating the example
file in Git does not change this setting on an existing node. Rerun bootstrap
with your Let's Encrypt account email to apply the Nginx configuration and
request a certificate for the new hostname:

```bash
sudo ./deploy/bootstrap-ubuntu.sh YOUR_EMAIL
sudo nginx -t
curl -I https://monkeyquest.filone.com
sudo certbot renew --cert-name monkeyquest.filone.com --dry-run
```

Bootstrap rebuilds and restarts the app, temporarily installs the HTTP-only
configuration for the ACME challenge, obtains the certificate at
`/etc/letsencrypt/live/monkeyquest.filone.com/`, and then enables HTTPS with the
existing renewal hook. Allow a brief interruption while it runs. The normal
`update-ubuntu.sh` script alone does not apply Nginx or certificate changes.

After the new HTTPS endpoint and renewal test succeed, remove the retired
certificate if no other service uses it. Inspect `sudo certbot certificates`
and the server configurations first, then use the old certificate's exact name
(the default name is shown below):

```bash
sudo certbot delete --cert-name monkeyquest.fil.one
```

This stops renewal attempts for the retired hostname. Use Certbot rather than
manually deleting files under `/etc/letsencrypt/`; see the
[Certbot certificate deletion guide](https://eff-certbot.readthedocs.io/en/stable/using.html#safely-deleting-certificates).

## Operations

```bash
systemctl status monkeyquest
journalctl -u monkeyquest -f
sudo nginx -t
curl -I https://monkeyquest.filone.com
```

The app process is not exposed publicly; only Nginx listens on ports 80 and
443. The browser streams the MP4 directly from the presigned S3 URL.
