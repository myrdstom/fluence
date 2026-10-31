import { describe, expect, test } from "vitest";
import { signHex, verifyInboundRequest } from "./signature";

const SECRET = "test-secret";
const PATH = "/n8n/reminder-status";
const BODY = '{"status":"sent"}';

async function signedRequest({
  timestamp = String(Date.now()),
  secret = SECRET,
  signedMethod = "POST",
  signedPath = PATH,
  signedBody = BODY,
} = {}) {
  const signature = await signHex(
    secret,
    `${timestamp}.${signedMethod}.${signedPath}.${signedBody}`,
  );
  return new Request(`https://example.convex.site${PATH}`, {
    method: "POST",
    headers: {
      "x-lendloop-timestamp": timestamp,
      "x-lendloop-signature": signature,
    },
    body: BODY,
  });
}

describe("signHex", () => {
  test("matches a published HMAC-SHA256 test vector", async () => {
    expect(
      await signHex("key", "The quick brown fox jumps over the lazy dog"),
    ).toBe("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
  });
});

describe("verifyInboundRequest", () => {
  test("accepts a correctly signed request", async () => {
    expect(
      await verifyInboundRequest(await signedRequest(), BODY, SECRET),
    ).toBe(true);
  });

  test("rejects a different secret", async () => {
    const request = await signedRequest({ secret: "other-secret" });
    expect(await verifyInboundRequest(request, BODY, SECRET)).toBe(false);
  });

  test("rejects a tampered body", async () => {
    const request = await signedRequest({ signedBody: '{"status":"failed"}' });
    expect(await verifyInboundRequest(request, BODY, SECRET)).toBe(false);
  });

  test("rejects a signature made for another path or method", async () => {
    const otherPath = await signedRequest({ signedPath: "/n8n/overdue-loans" });
    const otherMethod = await signedRequest({ signedMethod: "GET" });
    expect(await verifyInboundRequest(otherPath, BODY, SECRET)).toBe(false);
    expect(await verifyInboundRequest(otherMethod, BODY, SECRET)).toBe(false);
  });

  test("rejects old and far-future timestamps", async () => {
    const tenMinutes = 10 * 60 * 1000;
    const old = await signedRequest({
      timestamp: String(Date.now() - tenMinutes),
    });
    const future = await signedRequest({
      timestamp: String(Date.now() + tenMinutes),
    });
    expect(await verifyInboundRequest(old, BODY, SECRET)).toBe(false);
    expect(await verifyInboundRequest(future, BODY, SECRET)).toBe(false);
  });

  test("rejects missing or malformed headers", async () => {
    const url = `https://example.convex.site${PATH}`;
    const noHeaders = new Request(url, { method: "POST", body: BODY });
    const badSignature = new Request(url, {
      method: "POST",
      body: BODY,
      headers: {
        "x-lendloop-timestamp": String(Date.now()),
        "x-lendloop-signature": "not-hex",
      },
    });
    expect(await verifyInboundRequest(noHeaders, BODY, SECRET)).toBe(false);
    expect(await verifyInboundRequest(badSignature, BODY, SECRET)).toBe(false);
  });
});
