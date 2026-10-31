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

On every push, CI checks formatting, lint, and types, and runs the unit tests with coverage. It doesn't run the Playwright tests or a production build, so run `npm run test:e2e` locally. CI needs no repository secrets.
