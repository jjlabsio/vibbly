# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibbly is a YouTube spam comment detection and automated moderation platform built as a pnpm + Turborepo monorepo with Next.js 15 (App Router), Prisma, and next-intl for internationalization.

## Development Commands

### Setup and Development
```bash
# Initial setup (Node ≥20 required)
pnpm install

# Start development server with Turbopack
pnpm dev
# or filter to web app only
pnpm --filter web dev

# Type checking
pnpm --filter web typecheck

# Linting
pnpm lint
# or with auto-fix
pnpm --filter web lint:fix

# Format code
pnpm format
```

### Database Operations
```bash
# Generate Prisma client (after schema changes)
pnpm --filter web db:generate

# Push schema to database
pnpm --filter web db:push

# Reset/regenerate client
pnpm --filter web db:reset

# Seed database
pnpm --filter web db:seed
```

### Build and Production
```bash
# Build entire monorepo
pnpm build

# Start production server
pnpm --filter web start
```

## Architecture

### Monorepo Structure
- **apps/web**: Main Next.js application
  - **app/[locale]/(app)**: Authenticated app routes (dashboard, comments, settings, etc.)
  - **app/[locale]/(auth)**: Public authentication routes (sign-in)
  - **app/api**: API routes including YouTube integration and cron jobs
  - **lib/**: Server-side utilities, YouTube API clients, Prisma client, OAuth helpers
  - **lib/actions/**: Next.js server actions
  - **lib/youtube/**: YouTube API wrappers (comment-threads, pagination, me)
  - **prisma/**: Database schema and migrations
    - **models/**: Split schema files (user.prisma, social-account.prisma, comment.prisma, etc.)
    - **schema.prisma**: Main schema file that imports models
    - **migrations/**: Database migrations
    - **seed/**: Seed data scripts
  - **generated/prisma**: Generated Prisma client (import from `@/generated/prisma`)

- **packages/ui**: Shared UI components built with shadcn/ui
  - **src/components**: Reusable UI primitives
  - **src/styles**: Tailwind configuration and globals

- **packages/eslint-config**: Shared ESLint configuration
- **packages/typescript-config**: Shared TypeScript base configurations

### Database Schema Architecture

The Prisma schema is modular with separate model files:

- **User**: Core user model with Google OAuth authentication
- **SocialAccount**: Multi-platform social accounts (YouTube, Instagram) linked to users
- **SocialToken**: OAuth tokens (access_token, refresh_token, expiry) per social account
- **Comment**: Detected comments with status tracking (Active, SpamPendingDelete, Deleted, SpamExcluded)
- **Keyword**: User-defined spam detection keywords
- **AutomationRunLog**: Automation job execution logs (DETECT, DELETE) with metrics
- **AutomationRunAccountMetric**: Per-account metrics for each automation run

Key relationships:
- Comments link to AutomationRunLog via `detectRunId` and `deleteRunId` for audit trail
- SocialAccount has 1:1 with SocialToken and 1:many with Comments
- Cascading deletes configured on critical relationships

### Authentication & Authorization

**NextAuth v5 (beta.29)** with Google OAuth provider:
- JWT session strategy with 24-hour expiry
- Automatic OAuth token refresh for YouTube API access
- Tokens stored in `SocialToken` table per social account
- Custom session extends user with `id` field
- JWT extends with `userId`, `access_token`, `expires_at`, `refresh_token`
- Internal API routes protected with `x-admin-key` header (uses `INTERNAL_SECRET` env var)

**Middleware chain**:
1. Public routes bypass auth (/, /sign-in)
2. Protected routes require NextAuth session
3. next-intl middleware handles locale routing
4. Session token refresh happens automatically in JWT callback

### YouTube API Integration

**YouTube API Client** (`lib/youtube-account.ts`):
- `getYouTubeClient(channel: SocialAccount)` creates authenticated YouTube API client
- Retrieves OAuth tokens from `SocialToken` table
- Automatic token refresh via googleapis OAuth2Client event listener
- Updates `SocialToken` on refresh with new access_token and expiry

**YouTube API Wrappers**:
- `lib/youtube/me.ts`: Get channel information
- `lib/youtube/comment-threads.ts`: Fetch comment threads
- `lib/youtube/pagination.ts`: Handle YouTube API pagination

### Automation System

**Cron Jobs** (`app/api/cron/`):
- **detect**: Spam detection job that scans comments and marks as `SpamPendingDelete`
- **delete**: Automated deletion job that removes `SpamPendingDelete` comments via YouTube API

**Authorization**: Production cron endpoints require `Bearer ${CRON_SECRET}` header

**Execution Flow**:
1. Create `AutomationRunLog` with job type and plan
2. Process comments/accounts (create metrics per account)
3. Create `AutomationRunAccountMetric` records
4. Update `AutomationRunLog` with completion status and metrics
5. Comments track which run detected/deleted them via foreign keys

**Transaction Pattern**: All automation runs use Prisma transactions with:
- `maxWait: 5000ms` (5 seconds)
- `timeout: 600000ms` (10 minutes)

### Internationalization

**next-intl** setup:
- Localized routes under `app/[locale]/`
- Routing config in `i18n/routing.ts`
- Middleware handles locale detection and redirection
- Messages/translations loaded per locale

### Common Patterns

**API Route Structure**:
- Export GET/POST/PUT/DELETE named functions
- Use `Request`/`Response` objects (not NextRequest/NextResponse in most cases)
- Internal endpoints check `x-admin-key` header
- Cron endpoints check `authorization` header in production

**Database Query Optimization**:
- Avoid N+1 queries - use `findMany` with `where: { in: [] }` instead of multiple `findUnique` calls
- Use `select` to limit returned fields
- Use `include` for relations when needed
- Be cautious with parallel DB operations in `Promise.all` - consider race conditions

**Error Handling**:
- YouTube API operations wrapped in try/catch
- Return appropriate HTTP status codes
- Log errors with context before throwing

**Component Organization**:
- React components use PascalCase names but kebab-case files (e.g., `main-nav.tsx`)
- Hooks in `hooks/` directory with `use` prefix
- Server actions in `lib/actions/`
- Client components marked with `"use client"` directive

## Adding shadcn/ui Components

Run from repository root:
```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This places components in `packages/ui/src/components` for shared use across the monorepo.

## Environment Variables

Required environment variables (based on code analysis):
- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_GOOGLE_ID`: Google OAuth client ID
- `AUTH_GOOGLE_SECRET`: Google OAuth client secret
- `INTERNAL_SECRET`: Internal API authentication key
- `CRON_SECRET`: Cron job authorization secret
- `NODE_ENV`: Environment (development/production)

## Coding Conventions

- **Language**: TypeScript with strict mode
- **Formatting**: Prettier (2-space indent, double quotes, trailing commas)
- **Naming**:
  - Components: PascalCase (files in kebab-case)
  - Hooks: camelCase with `use` prefix
  - Prisma models: Singular PascalCase (User, Comment)
  - Prisma fields: lowerCamelCase
  - Database tables: snake_case plural via `@@map("table_name")`
- **Imports**: Use `@/` alias for absolute imports from `apps/web`
- **Commits**: Conventional Commits format (`feat:`, `fix:`, `chore:`)

## Key Implementation Notes

1. **Prisma Client Location**: Always import from `@/generated/prisma` not `@prisma/client`
2. **Schema Changes**: After modifying any `.prisma` file in `prisma/models/`, run `pnpm --filter web db:generate`
3. **Migrations**: Check migrations into `apps/web/prisma/migrations/` with schema changes
4. **YouTube API Quota**: Be mindful of YouTube API quota limits in automation jobs
5. **OAuth Token Management**: Never manually manage YouTube tokens - use `getYouTubeClient()` helper
6. **Transaction Patterns**: Use Prisma transactions for multi-step operations (logs + metrics + updates)
7. **Cron Job Pattern**: Always create log → process → create metrics → update log in transaction
8. **Race Conditions**: Avoid parallel database operations on shared resources (use sequential or proper locking)
