import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const notImplemented = httpAction(async () => {
  return new Response("Not implemented", { status: 501 });
});

// TODO: verify the HMAC signature, then return overdue loans with minimal fields.
http.route({ path: "/n8n/overdue-loans", method: "GET", handler: notImplemented });

// TODO: verify the HMAC signature, then record the reminder status idempotently.
http.route({ path: "/n8n/reminder-status", method: "POST", handler: notImplemented });

export default http;
