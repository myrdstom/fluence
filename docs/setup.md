# Local setup

This guide gets LendLoop running on your machine, including n8n and its workflows.

## Prerequisites

- Node 20+
- Docker
- A [Clerk](https://clerk.com) application
- A [Convex](https://convex.dev) account

## 1. Install dependencies

```bash
npm install
cp .env.example .env.local
```

Add your Clerk keys to `.env.local`.

## 2. Configure Clerk

In the Clerk dashboard, activate the Convex integration and copy the Frontend API URL. Under **Sessions**, customize the session token so Convex receives the user's profile:

```json
{
  "email": "{{user.primary_email_address}}",
  "name": "{{user.full_name}}"
}
```

## 3. Start Convex

Start `npx convex dev` and leave it running. Its first push fails until the issuer is set, so run this in a second terminal:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-instance.clerk.accounts.dev
```

## 4. Start Next.js

```bash
npm run dev
```

The app runs at http://localhost:3000.

## 5. Set up n8n

Create the env file, then generate its three secrets with `openssl rand -hex 32`:

```bash
cp n8n/.env.example n8n/.env
```

Fill in `n8n/.env`, using `NEXT_PUBLIC_CONVEX_SITE_URL` from `.env.local` as `CONVEX_SITE_URL`. Give Convex the same two signing secrets:

```bash
npx convex env set N8N_WEBHOOK_SECRET your-webhook-secret
npx convex env set CONVEX_INBOUND_SECRET your-inbound-secret
```

Start n8n and import the workflows:

```bash
npm run n8n:up
npm run n8n:setup
```

The editor runs at http://localhost:5678.

## 6. Connect Convex to n8n

A cloud Convex deployment can't reach `localhost`, so start the tunnel and point Convex at it. `n8n:tunnel-url` prints only the base address, so add the webhook path when you set the variable:

```bash
npm run n8n:tunnel
npm run n8n:tunnel-url
npx convex env set N8N_WEBHOOK_URL https://your-url.trycloudflare.com/webhook/lendloop-request-event
```

The tunnel URL changes each time the tunnel restarts, so repeat the last two commands when it does.

## 7. Make yourself an admin

Sign in once, then run:

```bash
npx convex run users:setRole '{"email":"you@example.com","role":"admin"}'
```

## Environment variables

| Variable                            | Where it is set    | Purpose                                              |
| ----------------------------------- | ------------------ | ---------------------------------------------------- |
| `NEXT_PUBLIC_CONVEX_URL`            | `.env.local`       | Convex client URL                                    |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `.env.local`       | Clerk client key                                     |
| `CLERK_SECRET_KEY`                  | `.env.local`       | Clerk server key                                     |
| `NEXT_PUBLIC_CONVEX_SITE_URL`       | `.env.local`       | Convex HTTP actions URL, copied to `CONVEX_SITE_URL` |
| `CONVEX_DEPLOYMENT`                 | `.env.local`       | Written by `npx convex dev`                          |
| `CLERK_JWT_ISSUER_DOMAIN`           | Convex             | Validates Clerk JWTs                                 |
| `N8N_WEBHOOK_URL`                   | Convex             | Request notification webhook                         |
| `N8N_WEBHOOK_SECRET`                | Convex, `n8n/.env` | Signs Convex to n8n calls                            |
| `CONVEX_INBOUND_SECRET`             | Convex, `n8n/.env` | Signs n8n to Convex calls                            |
| `CONVEX_SITE_URL`                   | `n8n/.env`         | Where n8n calls Convex                               |
| `N8N_ENCRYPTION_KEY`                | `n8n/.env`         | Encrypts n8n credentials at rest                     |
| `WEBHOOK_URL`                       | `n8n/.env`         | Public URL n8n advertises                            |
| `N8N_SECURE_COOKIE`                 | `n8n/.env`         | Allows the editor login over local HTTP              |
| `E2E_USER_EMAIL`                    | `.env.local`       | Optional user for signed-in e2e tests                |
