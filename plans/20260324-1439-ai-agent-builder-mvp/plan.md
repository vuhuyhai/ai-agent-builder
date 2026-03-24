# AI Agent Builder MVP — Master Plan

**Date:** 2026-03-24 | **Status:** In Progress | **Target:** 14 days

---

## Overview

Web app that helps non-technical users build apps via AI conversation. Agent asks 5 qualifying questions, then auto-generates CLAUDE.md + plans/ + bootstrap prompt ready for Cursor + ClaudeSuperKit.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · shadcn/ui · Better-auth · Prisma · SQLite→PostgreSQL · Zustand · Anthropic claude-opus-4-6 · Vercel

---

## Phases

| # | Phase | Days | Priority | Status | File |
|---|-------|------|----------|--------|------|
| 1 | Core Chat | 1–3 | P0 | [ ] Pending | [phase-01](./phase-01-core-chat.md) |
| 2 | Output Generation | 4–6 | P0 | [ ] Pending | [phase-02](./phase-02-output-generation.md) |
| 3 | Auth + History | 7–9 | P1 | [ ] Pending | [phase-03](./phase-03-auth-history.md) |
| 4 | Polish + Deploy | 10–14 | P1 | [ ] Pending | [phase-04](./phase-04-polish-deploy.md) |

---

## Key Dependencies

- Phase 2 requires Phase 1 (chat + answers store must exist before output generation)
- Phase 3 requires Phase 1+2 (DB saves project after output is generated)
- Phase 4 requires all phases (deploys final product)
- `ANTHROPIC_API_KEY` must be provisioned before Day 1
- PostgreSQL instance (Vercel Postgres / Neon) needed before Phase 4 deploy

---

## Tech Risks Summary

| Risk | Phase | Severity |
|------|-------|----------|
| SQLite → PostgreSQL migration on Vercel | 3→4 | High |
| Vercel Edge Runtime incompatible with Prisma/sqlite | 4 | High |
| Streaming errors / network drops mid-response | 1 | Medium |
| `claude-opus-4-6` token limits on output generation | 2 | Medium |
| Better-auth session sync across tabs | 3 | Low |
| Clipboard API permission denied on some browsers | 2 | Low |

---

## Research Reports

- [Streaming API & State](./research/researcher-01-streaming-api.md)
- [Auth, DB & Output Generation](./research/researcher-02-auth-db-output.md)
