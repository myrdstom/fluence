# Running in production

This is built to run locally. I would change these before real users rely on it, most important first.

## Must have

- **Send real email.** The workflows only log each notification, so nobody receives anything yet. I would add a provider such as Postmark or Resend to n8n, passing the `eventId` or reminder `idempotencyKey` that each workflow already receives so retries can't send a second email.
- **Host n8n properly.** The quick tunnel's URL changes on restart, and n8n's default SQLite database doesn't suit a production instance. I would use a fixed domain with TLS, Postgres, and a backed-up `N8N_ENCRYPTION_KEY`, and keep the editor behind a VPN or SSO.
- **Separate the environments.** Use production Clerk and Convex instances, with different secrets from development.
- **Tighten secret handling.** Workflows read secrets from environment variables, which any workflow can access. I would move them to a secrets manager or n8n credentials, then set `N8N_BLOCK_ENV_ACCESS_IN_NODE` to `true`. Rotating a signing secret today needs both sides changed at once, so verification should accept two secrets during the switch.
- **Add rate limits.** Input size is capped, but a signed-in user can still create unlimited listings and requests. I would limit both per user, and limit the signed n8n endpoints too.

## Should have

- **Alert when automation stops.** Failures only appear under **Admin > Automation**, and if n8n is down, its error workflow can't report anything. I would page someone on repeated failures, and have Convex raise an alert if the daily overdue fetch doesn't arrive.
- **Delete personal data on schedule.** Nothing is removed yet. I would add a Convex cron that clears old automation records, and a Clerk `user.deleted` webhook that removes the user's profile and anonymizes their loans.
- **Use the borrower's timezone.** Reminders run at 09:00 UTC and use the UTC date, so a loan can count as overdue while it is still the due date for the borrower.
- **Make CI a gate.** CI reports results but doesn't block anything. I would require it to pass before merging and deploying, add the e2e tests and a production build to CI, using their own Convex deployment, deploy Convex from CI, and cover the full borrowing flow with two users.
