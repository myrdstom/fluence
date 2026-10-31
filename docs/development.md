# Development

These are the commands and CI setup for working on LendLoop. The [architecture doc](architecture.md#testing) explains what the tests cover.

## Commands

| Command                 | What it does                                |
| ----------------------- | ------------------------------------------- |
| `npm run check`         | Checks formatting and lint, then typechecks |
| `npm run format`        | Formats everything with Prettier            |
| `npm run lint:fix`      | Fixes what ESLint can                       |
| `npm test`              | Runs the unit tests once                    |
| `npm run test:watch`    | Runs the unit tests on each change          |
| `npm run test:coverage` | Runs the unit tests and reports coverage    |
| `npm run test:e2e`      | Runs the Playwright tests                   |

Install the Playwright browser once with `npx playwright install chromium`. The signed-in test creates and deletes a tool on your dev deployment, using the Clerk user in `E2E_USER_EMAIL`, and is skipped if that isn't set.

## CI

The Playwright job needs a Clerk app and a Convex deployment, so it needs these repository secrets. Without them it passes with a warning and tests nothing. `E2E_USER_EMAIL` is optional, as it is locally.

```bash
gh secret set NEXT_PUBLIC_CONVEX_URL
gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
gh secret set CLERK_SECRET_KEY
gh secret set E2E_USER_EMAIL
```

Each command prompts for its value. CI doesn't deploy Convex, so the tests run against whatever that deployment is running.
