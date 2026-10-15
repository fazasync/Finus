<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Finus — Personal Finance Tracker (IDR/MYR)

Next.js 16 App Router + React 19 + Tailwind v4 + TypeScript (strict). Target deploy: Vercel, backend Supabase (not yet wired up).

## Commands

- `npm run dev` — dev server (Turbopack) on :3000
- `npm run build` — production build
- `npm run lint` — ESLint (`eslint` flat config)
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — Vitest (`lib/__tests__/*.test.ts`); `npm run test:watch` for watch mode

## Stack conflicts — read before coding

`.agents/task-instruction.md` and `.agents/prd.md` describe the intended product, but their suggested stack (Vite, React Router, `src/`, `VITE_*` env vars) does NOT match this repo. The repo is already Next.js App Router. Rule from the task file: keep existing project conventions. So:

- Routes live in `app/` (App Router), not React Router. Suggested `/app/*` routes map to `app/...` route segments.
- Supabase env vars must be `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, never `VITE_*`.
- Import alias `@/*` maps to the repo root (`./*`), not `src/`.
- Never expose the Supabase `service_role` key in client code; RLS is required on all user tables.

## Next.js 16 quirks in this repo

- `next.config.ts` enables `experimental.agentFeedback`, `cacheComponents: true`, and `partialPrefetching: true`. These change caching/rendering semantics — consult `node_modules/next/dist/docs/` before assuming classic App Router behavior.
- Route-aware global types are generated (e.g. `LayoutProps<"/">`) and included via `.next/types` / `.next/dev/types` in `tsconfig.json`. Do not hand-write these or remove those `include` entries.
- Tailwind is v4, configured CSS-first in `app/globals.css` (`@import "tailwindcss"` + `@theme inline`) with the `@tailwindcss/turbopack` loader in `next.config.ts`. There is no `tailwind.config.*` or `postcss.config.*`; do not add one.

## Specs

Product requirements, design system, and the staged build plan live in `.agents/` (`prd.md`, `design.md`, `task-instruction.md`). Treat them as the source of truth for scope, business rules (currency/exchange-rate math), and acceptance criteria.
