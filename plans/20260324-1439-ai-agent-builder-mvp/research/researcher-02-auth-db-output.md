# AI Agent Builder MVP: Auth & Database Research

**Date:** 2026-03-24 | **Topics:** Better-Auth, Prisma, AI Output Generation, Vercel Deployment

---

## 1. Better-Auth with Next.js 14 App Router

**Setup Pattern:**
- Create `lib/auth.ts` with `betterAuth` config + Database instance
- Create `app/api/auth/[...all]/route.ts` with `toNextJsHandler` helper
- Use better-sqlite3 or built-in Node 22.5+ `node:sqlite` module

**Dev Database:**
```typescript
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database("database.sqlite"),
  emailAndPassword: { enabled: true }
});
```

**Session Management:**
- Server Components: Use `headers()` to extract session cookie, pass to auth client
- Route Handlers: Directly access session via Better-Auth middleware
- Cookie Config: Max-age 7-30 days, httpOnly, sameSite strict

**Production:** Swap SQLite for PostgreSQL adapter (handled via DATABASE_URL env var).

---

## 2. Prisma ORM + SQLite

**Schema Pattern (User, Project, Message):**
```prisma
model User {
  id String @id @default(cuid())
  email String @unique
  name String?
  projects Project[]
}

model Project {
  id String @id @default(cuid())
  userId String
  name String
  user User @relation(fields: [userId] references: [id])
}

model Message {
  id String @id @default(cuid())
  projectId String
  role String
  content String
}
```

**Singleton Client (`lib/db.ts`):**
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = prisma;
```

**Migration Workflow:**
- `prisma migrate dev --name add_users` (creates & applies)
- Auto-generates `prisma/migrations/` versioned SQL
- For prod: `prisma migrate deploy` in CI/CD

**Vercel Migration Trigger:**
- SQLite fails on Vercel (ephemeral filesystem)
- Change `DATABASE_URL=postgres://...` in Vercel env
- Prisma detects provider change, generates new migrations
- Use Vercel Postgres or Neon Serverless

---

## 3. AI Output Generation (CLAUDE.md + Plans/)

**Structured Markdown Generation:**
- Use XML-tagged prompts: `<instructions>`, `<context>`, `<task>`, `<output_format>`
- Provide 3-5 examples in `<examples>` tags for consistency
- Specify markdown structure upfront (headings, code blocks, sections)

**Single API Call Pattern:**
```typescript
const response = await client.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 4000,
  messages: [{
    role: "user",
    content: `Generate CLAUDE.md, plan.md, and phase files from this chat history: ${JSON.stringify(history)}`
  }]
});
```

**Streaming vs Non-Streaming:**
- Non-streaming: Better for document gen (wait for full output, parse structure)
- Streaming: Use for real-time UI updates if chunking output into sections

**Clipboard Pattern (React):**
```typescript
await navigator.clipboard.writeText(markdown);
```

Verify `"clipboard"` permission in Vercel deployment config if needed.

---

## 4. Vercel Deployment Considerations

**Environment Variables:**
- Store in Vercel Settings → Environment Variables
- Set `ANTHROPIC_API_KEY` (API requests), `DATABASE_URL` (Prisma connection)
- Never commit `.env.local` or secrets to git

**SQLite Limitations:**
- **Ephemeral Storage:** Vercel Functions can't persist files between invocations
- **No Shared State:** Each lambda instance has isolated filesystem
- **Solution:** Migrate to Vercel Postgres (fully managed, HTTP API) or Neon Serverless

**Edge Runtime:**
- **Supported:** HTTP/WSS connections (Prisma Postgres, Neon, PlanetScale)
- **Not Supported:** Node-postgres (pg), file system I/O
- **Recommendation:** Use Node.js Runtime for Prisma + SQLite → PostgreSQL (streaming responses work fine)

---

## Sources

- [Better Auth Installation](https://better-auth.com/docs/installation)
- [Better Auth SQLite Adapter](https://better-auth.com/docs/adapters/sqlite)
- [Better Auth Next.js Integration](https://better-auth.com/docs/integrations/next)
- [Prisma + Better Auth + Next.js Guide](https://www.prisma.io/docs/guides/authentication/better-auth/nextjs)
- [Prisma Singleton Pattern](https://www.robinwieruch.de/next-prisma-sqlite/)
- [Prisma SQLite Quickstart](https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/sqlite)
- [Claude Prompt Engineering Overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview)
- [Claude Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Vercel SQLite Limitations](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel)
- [Vercel Storage Guide](https://vercel.com/guides/using-databases-with-vercel)
- [Prisma Vercel Deployment](https://www.prisma.io/docs/guides/deployment/serverless/deploy-to-vercel)
- [Prisma Edge Functions](https://www.prisma.io/docs/orm/prisma-client/deployment/edge/deploy-to-vercel)

---

## Unresolved Questions

1. Should we use Turso (libSQL) as SQLite alternative for Vercel, or jump straight to PostgreSQL?
2. Does Better-Auth support OAuth/GitHub login out-of-box, or requires custom integration?
3. How to handle session invalidation on logout across tabs (service worker or polling)?
4. Rate limiting strategy for Claude API calls in streaming routes?
