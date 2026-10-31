/** Rejects signed requests older than this, which limits how long a captured one can be replayed. */
const MAX_AGE_MS = 5 * 60 * 1000;

function hmacKey(secret: string, usage: "sign" | "verify") {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

export async function signHex(secret: string, message: string) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret, "sign"),
    new TextEncoder().encode(message),
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string) {
  if (!/^[0-9a-f]{64}$/.test(hex)) return null;
  return Uint8Array.from(hex.match(/../g)!, (pair) => parseInt(pair, 16));
}

/**
 * Verifies a call from n8n. The signature covers the method and path as well as
 * the body, so a captured signature can't be reused on another endpoint.
 */
export async function verifyInboundRequest(
  request: Request,
  body: string,
  secret: string,
) {
  const timestamp = request.headers.get("x-lendloop-timestamp");
  const signature = hexToBytes(
    request.headers.get("x-lendloop-signature") ?? "",
  );
  if (!timestamp || !/^\d+$/.test(timestamp) || !signature) return false;
  if (Math.abs(Date.now() - Number(timestamp)) > MAX_AGE_MS) return false;

  const { pathname } = new URL(request.url);
  // subtle.verify compares in constant time.
  return crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret, "verify"),
    signature,
    new TextEncoder().encode(
      `${timestamp}.${request.method}.${pathname}.${body}`,
    ),
  );
}
