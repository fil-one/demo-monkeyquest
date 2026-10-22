# Monkey Quest

A cinematic, single-page trailer website with a server-side S3 presigned URL
endpoint. The public page and editorial content are static; the only dynamic
operation is issuing a short-lived URL when a viewer opens the trailer.

## Configure the trailer

Copy `.env.example` to `.env.local` and add the S3-compatible endpoint,
credentials, region, bucket, and object key for the private MP4. Use an access
key that can only read the specific trailer object.

The trailer storage endpoint is `https://s3.us-east-1.filonecontent.com`,
configured through `S3_ENDPOINT`.

The S3 object should be served with `Content-Type: video/mp4` and support byte
range requests. The browser requests `/api/trailer`, receives a short-lived
signed URL, and streams the file directly from S3.

## Run locally

```bash
npm install
npm run dev
```

## Production settings

Add the same environment variables to the hosting platform. Never expose AWS
credentials through `NEXT_PUBLIC_*` variables or commit them to the repository.

## Deploy to Ubuntu

The included deployment scripts run the app on `127.0.0.1:3000` with systemd
and expose `monkeyquest.filone.com` through Nginx and Let's Encrypt HTTPS.

Before deploying, point the domain's DNS `A` record at the node and allow
inbound TCP traffic on ports `22`, `80`, and `443`. The node must run Ubuntu
22.04 or newer.

Connect to the node, clone the repository into the expected location, and run
the bootstrap script:

```bash
ssh ubuntu@NODE_IP

sudo mkdir -p /opt/monkeyquest
sudo git clone https://github.com/fil-one/demo-monkeyquest.git /opt/monkeyquest/app
cd /opt/monkeyquest/app

sudo ./deploy/bootstrap-ubuntu.sh YOUR_EMAIL
```

The first bootstrap run creates the protected runtime environment file and
then stops. Add the S3 access key and secret, save the file, and rerun the
bootstrap:

```bash
sudoedit /etc/monkeyquest/monkeyquest.env
sudo ./deploy/bootstrap-ubuntu.sh YOUR_EMAIL
```

Verify the service and public endpoint:

```bash
systemctl status monkeyquest --no-pager
curl -I https://monkeyquest.filone.com
```

To deploy later updates:

```bash
cd /opt/monkeyquest/app
sudo -u monkeyquest git pull --ff-only
sudo ./deploy/update-ubuntu.sh
```

For an existing node changing from the previous hostname, follow the
[hostname migration steps](deploy/README.md#migrating-an-existing-node-to-monkeyquestfilonecom).
That migration also updates the node's runtime trusted hostname, Nginx, and
Let's Encrypt certificate.

If the site still serves plain HTTP after DNS changes, use the
[HTTPS repair command](deploy/README.md#fixing-an-http-only-site-after-dns-changes)
to obtain the certificate and activate HTTPS without rebuilding the app.

See [`deploy/README.md`](deploy/README.md) for certificate renewal, logs, and
other operational commands.
