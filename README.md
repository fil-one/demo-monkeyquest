# Monkey Quest

A cinematic, single-page trailer website with a server-side S3 presigned URL
endpoint. The public page and editorial content are static; the only dynamic
operation is issuing a short-lived URL when a viewer opens the trailer.

## Configure the trailer

Copy `.env.example` to `.env.local` and add the S3-compatible endpoint,
credentials, region, bucket, and object key for the private MP4. Use an access
key that can only read the specific trailer object.

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
