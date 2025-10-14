# Repository Guidelines

## Project Structure & Module Organization

Vibbly is a pnpm + Turborepo monorepo. The Next.js App Router lives in `apps/web` (localized routes under `app/[locale]/`, shared UI wrappers in `components/`, data access via `lib/` and Prisma schema in `prisma/` with generated client at `generated/prisma`). Reusable UI primitives and tailwind tokens live in `packages/ui/src/*`. Shared linting and TS base configs sit in `packages/eslint-config` and `packages/typescript-config`. Workspace-level configs (`turbo.json`, `pnpm-workspace.yaml`, `tsconfig.json`) define dependency graph and path aliases.

## Build, Test, and Development Commands

Bootstrap once with `pnpm install` (Node ≥20). Run `pnpm dev` to launch the monorepo watcher; by default this starts `next dev --turbopack` in `apps/web`. Use `pnpm --filter web dev` when you only need the web app. Ship builds via `pnpm build`, which compiles in dependency order and writes `.next/`. Execute `pnpm lint` for ESLint across all packages, `pnpm --filter web typecheck` for strict TS ahead of releases, and `pnpm format` to apply Prettier to `ts/tsx/md` files.

## Coding Style & Naming Conventions

Stick to TypeScript and ES modules. Prettier (no config) enforces two-space indent, double quotes, and trailing commas—let it format before committing. ESLint presets live in `@vibbly/eslint-config`; fix warnings, don’t ignore them. React components should be named in PascalCase but stored in kebab-case files (`main-nav.tsx`) to match existing layout. Keep hooks under `hooks/` and prefix with `use`. Prisma models stay singular (`User`) with lowerCamelCase fields; check migrations into `apps/web/prisma/migrations/` alongside schema changes.

## Testing Guidelines

A formal test runner is not yet wired up, so linting and type checking are the current minimum bar. When adding automated tests, colocate them next to the unit (`component.test.tsx`) or under `apps/web/__tests__/`, register the command in `package.json` ("test": "vitest run") and surface it through Turbo (`turbo.json`). Seed data lives in `prisma/seed.ts`; keep fixtures deterministic.

## Commit & Pull Request Guidelines

History follows Conventional Commits (`feat:`, `fix:`, `chore:`), optionally specify scope (`feat(locale): …`). Write present-tense subjects under 60 chars. Each PR should: link the relevant Linear/GitHub issue, summarize UI/locale/database changes, and attach before/after screenshots or recordings for visual tweaks (light + dark). Call out required env vars (`DATABASE_URL`) in the description and update `.env.example` or docs as needed. Run `pnpm lint`, typecheck, and `pnpm build` locally before requesting review.
