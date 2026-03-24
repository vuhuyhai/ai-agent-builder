# Release Notes

## v1.0.0 — 2026-03-24

### First production release of AI Agent Builder.

#### What's included

**Core Chat**
- Streaming chat UI powered by Claude claude-opus-4-6 (Anthropic API)
- 5 sequential qualifying questions (problem → app type → features → auth/DB → deploy/budget)
- Real-time typing indicator and auto-scroll

**Output Generation**
- Automatic tech stack recommendation based on answers
- Generates `CLAUDE.md` — ready-to-use project instructions
- Generates `plans/plan.md` — phased implementation plan
- Generates `/bootstrap` prompt — optimized for Cursor + ClaudeSuperKit
- Copy-to-clipboard for all output documents

**UI / UX**
- Dark / light mode with OS-preference detection and localStorage persistence
- FOUC-free theme initialization via inline script
- Responsive layout: mobile bottom sheet, tablet/desktop two-column split
- Skeleton loading states during generation
- Micro-interactions: button scale, message fade-in, copy checkmark feedback
- WCAG AA color contrast across both themes

**Accessibility**
- `role="log"` + `aria-live` on chat container
- `role="progressbar"` on question progress bar
- `aria-label` on all interactive elements
- `role="dialog"` + `aria-modal` on mobile bottom sheet

**Developer Experience**
- Zustand v5 with `persist` middleware (hydration-safe)
- AbortController for cancellable streams
- Shared `toSafeError` utility across API routes
- TypeScript strict mode — zero `any`
- `npm run type-check` integrated into dev workflow

#### Not included in v1.0.0 (Phase 3+)
- User authentication (Better-auth)
- Project history (Prisma + SQLite/PostgreSQL)
- `/history` page

---

## Upcoming: v1.1.0
- Better-auth sign-up / sign-in
- Prisma schema: User, Session, Project
- Project history with resume and delete
