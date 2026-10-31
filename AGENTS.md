<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Frontend conventions

- `src/components/` holds presentational components. They take props and never call Convex hooks.
- `src/features/` holds components that read or write Convex data, grouped by domain (`admin`, `auth`, `requests`, `tools`). They compose components from `src/components/`.
- `src/app/` route files stay thin: they fetch page-level data and arrange features and components.
- Write named functions and components as function declarations. Use arrow functions for callbacks and inline handlers.
- Import through the `@/` and `@convex/` aliases, never with `../` paths. ESLint enforces this in `src/`.
- Take colours from the semantic tokens in `src/app/globals.css` (`text-muted`, `border-line`, `bg-primary`, `text-danger` and so on), never from raw Tailwind palette classes such as `text-zinc-500`. The tokens define dark mode once, so components need no `dark:` variants.
- Reuse the class constants in `src/lib/styles.ts` (`pageTitle`, `sectionLabel`, `mutedText`, `card`, buttons and fields) instead of repeating their class lists.
- Show errors with `ErrorMessage`, paged lists with `PaginatedList`, toggle groups with `FilterPills` and destructive confirmations with `ConfirmAction`.
- Avoid type assertions (`as`) outside tests. Narrow with a type guard or a helper such as `findOption`.
