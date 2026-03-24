# Phase 04 — Polish + Deploy

## Context Links
- Parent: [plan.md](./plan.md)
- Prev phase: [phase-03-auth-history.md](./phase-03-auth-history.md)
- Research: [researcher-02-auth-db-output.md](./research/researcher-02-auth-db-output.md)

---

## Overview

- **Date:** 2026-03-24
- **Days:** 10–14
- **Priority:** P1
- **Description:** Dark mode, responsive layout, skeleton loaders, error/empty states, SEO metadata, SQLite→PostgreSQL migration, Vercel deploy, final QA.
- **Implementation Status:** [ ] Pending
- **Review Status:** [ ] Not reviewed

---

## Key Insights

- **Critical:** Vercel Serverless Functions use an ephemeral filesystem — SQLite data is lost on every cold start. Must migrate to PostgreSQL (Vercel Postgres or Neon) before deploy. This is not optional.
- **Edge Runtime is incompatible with Prisma** (Prisma requires Node.js runtime). All API routes that use Prisma must have `export const runtime = 'nodejs'`. Set this in Phase 1 for agent route and enforce for all routes.
- Changing Prisma datasource provider from `sqlite` to `postgresql` requires running `prisma migrate dev` locally to regenerate migrations — do this on a clean branch.
- `DATABASE_URL` in Vercel environment variables must use the **connection pooling** URL (not direct connection) for serverless. Neon and Vercel Postgres both provide a pooling URL.
- Dark mode: shadcn/ui uses `class` strategy with Tailwind. Set `class="dark"` on `<html>` element in `layout.tsx`. No `next-themes` needed for MVP (just default dark, no toggle).
- Next.js Metadata API: export `metadata` object from `layout.tsx` and individual page files. No separate `Head` component needed in App Router.
- Skeleton loaders: shadcn/ui provides `<Skeleton>` component. Use it in `OutputPanel` (loading state) and `ProjectCard` list (history loading state).

---

## Requirements

### Functional
- App defaults to dark mode on all pages
- All pages are usable on mobile (min 375px width)
- Skeleton loaders shown during: output generation, history page fetch
- Empty state shown on `/history` when user has no projects
- Error states shown when API calls fail (with retry where applicable)
- SEO: `<title>` and `<meta description>` set per page
- App deployed to Vercel and accessible via public URL
- PostgreSQL used in production; all migrations applied

### Non-Functional
- Lighthouse score ≥ 80 on performance, accessibility
- Build completes without TypeScript or ESLint errors
- All env vars documented in `.env.example`
- No secrets committed to git

---

## Architecture

### Dark Mode Setup
```typescript
// src/app/layout.tsx
<html lang="en" className="dark">
  <body className="bg-background text-foreground">
    {children}
    <Toaster />
  </body>
</html>
```
Tailwind `darkMode: 'class'` in `tailwind.config.ts` (shadcn/ui default).

### Responsive Layout Strategy
```
Mobile (< 768px): stack ChatInterface + OutputPanel vertically
Desktop (≥ 768px): side-by-side grid-cols-2

// src/app/chat/page.tsx
<div className="flex flex-col md:grid md:grid-cols-2 h-screen">
  <ChatInterface />
  <OutputPanel />   // shows below chat on mobile, right panel on desktop
</div>
```

### SEO Metadata
```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  title: 'AI Agent Builder',
  description: 'Build apps through AI conversation. Generate CLAUDE.md, plans, and bootstrap prompts in minutes.',
};

// src/app/chat/page.tsx
export const metadata: Metadata = { title: 'Chat — AI Agent Builder' };

// src/app/history/page.tsx
export const metadata: Metadata = { title: 'History — AI Agent Builder' };
```

### SQLite → PostgreSQL Migration Steps
```
1. Provision PostgreSQL (Vercel Postgres or Neon) → get DATABASE_URL
2. Update prisma/schema.prisma: provider = "postgresql"
3. npx prisma migrate dev --name postgres-migration  (local, with postgres DATABASE_URL)
4. Commit migrations to git
5. In Vercel: Settings → Environment Variables → set DATABASE_URL (pooling URL)
6. Vercel build runs: `prisma generate && prisma migrate deploy`
```

### Vercel Build Config (`package.json`)
```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```
`prisma generate` in `postinstall` ensures client is generated in Vercel's build environment.

### Error State Pattern (consistent across app)
```typescript
// All API call components follow this pattern:
const [error, setError] = useState<string | null>(null);

if (error) return (
  <div className="flex flex-col items-center gap-2 p-4">
    <p className="text-destructive">{error}</p>
    <Button variant="outline" onClick={retry}>Retry</Button>
  </div>
);
```

### Empty State (History Page)
```typescript
if (projects.length === 0) return (
  <div className="flex flex-col items-center gap-4 p-8 text-muted-foreground">
    <p>No projects yet.</p>
    <Link href="/chat"><Button>Start Building</Button></Link>
  </div>
);
```

---

## Related Code Files

| Action | Path | Description |
|--------|------|-------------|
| MODIFY | `src/app/layout.tsx` | Dark mode class, metadata export |
| MODIFY | `src/app/chat/page.tsx` | Responsive layout classes, page metadata |
| MODIFY | `src/app/history/page.tsx` | Empty state, page metadata |
| MODIFY | `src/app/login/page.tsx` | Page metadata |
| MODIFY | `src/app/register/page.tsx` | Page metadata |
| MODIFY | `src/components/output/OutputPanel.tsx` | Skeleton loader |
| MODIFY | `src/components/history/ProjectCard.tsx` | Skeleton loader variant |
| MODIFY | `prisma/schema.prisma` | Change provider to postgresql |
| MODIFY | `package.json` | Add build script with prisma commands |
| CREATE | `vercel.json` | (if needed) framework config |
| MODIFY | `.env.example` | Document all required env vars |

---

## Implementation Steps

1. Add `darkMode: 'class'` to `tailwind.config.ts` (should already be set by shadcn init — verify).
2. Set `className="dark"` on `<html>` in `layout.tsx`. Add root `metadata` export.
3. Add per-page `metadata` exports to `/chat`, `/history`, `/login`, `/register`.
4. Update `src/app/chat/page.tsx` layout: `flex flex-col md:grid md:grid-cols-2 h-screen`.
5. Make `ChatInterface.tsx` scrollable with `overflow-y-auto` on message list; input fixed at bottom.
6. Install `npx shadcn@latest add skeleton` and add skeleton loaders to `OutputPanel` and `ProjectCard`.
7. Add error state UI to `ChatInterface` (stream error), `OutputPanel` (generation error), `ProjectCard` (delete error).
8. Add empty state to `/history` page.
9. Audit all API routes: add `export const runtime = 'nodejs'` to any route using Prisma.
10. **PostgreSQL migration:** provision Neon (free tier) or Vercel Postgres. Get `DATABASE_URL`.
11. Locally: set `DATABASE_URL` to postgres URL in `.env.local`, change `provider = "postgresql"` in schema, run `npx prisma migrate dev --name postgres-migration`.
12. Update `package.json` build script: `"build": "prisma generate && prisma migrate deploy && next build"`.
13. Add `"postinstall": "prisma generate"` to package.json scripts.
14. Push code to GitHub. Connect repo to Vercel.
15. Set Vercel env vars: `ANTHROPIC_API_KEY`, `DATABASE_URL` (pooling URL), `BETTER_AUTH_SECRET` (random string), `BETTER_AUTH_URL` (https://yourdomain.vercel.app).
16. Trigger Vercel deploy. Monitor build logs.
17. Run QA checklist (see Success Criteria).
18. Update `.env.example` with all required keys (no values).

---

## Todo List

- [ ] Verify `darkMode: 'class'` in tailwind.config.ts
- [ ] Set dark class on `<html>` in layout.tsx
- [ ] Add metadata exports to all pages
- [ ] Update chat page to responsive 2-column layout
- [ ] Fix ChatInterface scroll: message list scrollable, input sticky bottom
- [ ] Add shadcn Skeleton to OutputPanel loading state
- [ ] Add shadcn Skeleton to ProjectCard list loading state
- [ ] Add error states to ChatInterface, OutputPanel, history page
- [ ] Add empty state to /history page
- [ ] Audit all API routes for `runtime = 'nodejs'`
- [ ] Provision PostgreSQL instance (Neon or Vercel Postgres)
- [ ] Update schema.prisma provider to postgresql
- [ ] Run prisma migrate dev locally with postgres URL
- [ ] Commit migrations to git
- [ ] Update package.json build script
- [ ] Add postinstall script for prisma generate
- [ ] Push to GitHub
- [ ] Connect to Vercel, set all env vars
- [ ] Trigger deploy, verify build succeeds
- [ ] QA: register, chat, generate, save, history, delete on production URL
- [ ] Test on mobile (375px)
- [ ] Update .env.example with all keys

---

## Success Criteria

- App live on Vercel with public URL
- Dark mode renders correctly on all pages
- Mobile layout usable at 375px width (no horizontal overflow)
- Skeleton loaders appear during async operations
- Empty state shown on history page with no projects
- Error states recoverable (retry buttons work)
- PostgreSQL in use (verify via Vercel Postgres dashboard or Neon console)
- `prisma migrate deploy` ran successfully in Vercel build logs
- All SEO metadata visible in browser tab / source
- `npm run build` passes locally with postgres DATABASE_URL

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Prisma client not generated in Vercel build | High | Critical | Add `postinstall: prisma generate` to package.json |
| `prisma migrate deploy` fails on cold deploy (no DB) | Medium | Critical | Ensure DATABASE_URL is set in Vercel env vars BEFORE first deploy |
| SQLite migrations incompatible with PostgreSQL (data types) | Medium | High | Audit schema: `String` → `TEXT` is fine; avoid SQLite-specific types |
| Edge Runtime on any route crashes Prisma | Medium | High | Grep all routes for `runtime = 'edge'`; replace with `'nodejs'` |
| Better-auth needs `BETTER_AUTH_URL` set for prod cookies | Medium | High | Set `BETTER_AUTH_URL=https://yourdomain.vercel.app` in Vercel env |
| Connection pool exhausted under load (serverless) | Low | Medium | Use Neon pooling URL (port 6543, not 5432) |

---

## Security Considerations

- Never commit `.env.local` — verify `.gitignore` includes it before first push.
- `BETTER_AUTH_SECRET` must be a strong random string (32+ chars) — use `openssl rand -hex 32`.
- Set `BETTER_AUTH_URL` to production URL in Vercel for correct cookie domain/path.
- Review Vercel's automatic HTTPS — all cookies will be `Secure` in production.
- After deploy, verify no sensitive data appears in Vercel Function logs (mask API keys in logs).
- Consider adding Vercel's built-in bot protection on `/api/agent` and `/api/generate` post-launch.

---

## Next Steps

- Post-MVP: add OAuth (GitHub login) via Better-auth's OAuth plugin.
- Post-MVP: rate limiting on `/api/agent` and `/api/generate` (Upstash Redis + `@upstash/ratelimit`).
- Post-MVP: allow users to re-run generation with edited answers.
- Monitor Anthropic API costs via usage dashboard; set spend limits.
