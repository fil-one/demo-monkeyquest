import { createS3PresignedUrl } from "@/lib/s3-presign";

export const dynamic = "force-dynamic";

const DEFAULT_TTL_SECONDS = 15 * 60;
const MIN_TTL_SECONDS = 60;
const MAX_TTL_SECONDS = 60 * 60;

function expirationSeconds() {
  const configured = Number(process.env.VIDEO_URL_TTL_SECONDS);
  if (!Number.isFinite(configured)) return DEFAULT_TTL_SECONDS;

  return Math.min(
    MAX_TTL_SECONDS,
    Math.max(MIN_TTL_SECONDS, Math.round(configured)),
  );
}

export async function GET() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION;
  const bucket = process.env.S3_BUCKET;
  const objectKey = process.env.S3_VIDEO_KEY;

  if (!accessKeyId || !secretAccessKey || !region || !bucket || !objectKey) {
    return Response.json(
      {
        code: "TRAILER_NOT_CONFIGURED",
        message: "The trailer stream has not been connected yet.",
      },
      {
        headers: { "Cache-Control": "no-store" },
        status: 503,
      },
    );
  }

  try {
    const expiresIn = expirationSeconds();
    const url = await createS3PresignedUrl({
      accessKeyId,
      bucket,
      expiresIn,
      objectKey,
      region,
      secretAccessKey,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    });

    return Response.json(
      {
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
        url,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  } catch {
    return Response.json(
      {
        code: "TRAILER_URL_ERROR",
        message: "The trailer stream is temporarily unavailable.",
      },
      {
        headers: { "Cache-Control": "no-store" },
        status: 500,
      },
    );
  }
}
