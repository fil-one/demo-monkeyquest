const encoder = new TextEncoder();

type PresignOptions = {
  accessKeyId: string;
  bucket: string;
  expiresIn: number;
  objectKey: string;
  region: string;
  secretAccessKey: string;
  sessionToken?: string;
};

const encodeAwsValue = (value: string) =>
  encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

async function sha256(value: string) {
  return toHex(
    new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))),
  );
}

async function hmac(key: Uint8Array | string, value: string) {
  const keyBytes =
    typeof key === "string" ? encoder.encode(key) : new Uint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );

  return new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value)),
  );
}

function canonicalQuery(parameters: Record<string, string>) {
  return Object.entries(parameters)
    .map(([key, value]) => [encodeAwsValue(key), encodeAwsValue(value)])
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

export async function createS3PresignedUrl({
  accessKeyId,
  bucket,
  expiresIn,
  objectKey,
  region,
  secretAccessKey,
  sessionToken,
}: PresignOptions) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const canonicalUri = `/${objectKey
    .replace(/^\/+/, "")
    .split("/")
    .map(encodeAwsValue)
    .join("/")}`;

  const parameters: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
    "response-content-disposition": "inline",
    "response-content-type": "video/mp4",
  };

  if (sessionToken) {
    parameters["X-Amz-Security-Token"] = sessionToken;
  }

  const query = canonicalQuery(parameters);
  const canonicalRequest = [
    "GET",
    canonicalUri,
    query,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256(canonicalRequest),
  ].join("\n");

  const dateKey = await hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = await hmac(dateKey, region);
  const serviceKey = await hmac(regionKey, "s3");
  const signingKey = await hmac(serviceKey, "aws4_request");
  const signature = toHex(await hmac(signingKey, stringToSign));

  return `https://${host}${canonicalUri}?${query}&X-Amz-Signature=${signature}`;
}
