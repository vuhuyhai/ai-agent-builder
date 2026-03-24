# Deployment Guide — AI Agent Builder

## Prerequisites

- Node.js ≥ 18 LTS
- Git
- [Vercel account](https://vercel.com) (free tier is sufficient)
- Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com)

---

## 1. Verify local build

```bash
npm run type-check   # must pass with 0 errors
npm run build        # must complete successfully
```

---

## 2. Push to GitHub

```bash
# First time — create a new repo on github.com, then:
git remote add origin https://github.com/<your-username>/ai-agent-builder.git
git branch -M main
git push -u origin main
```

---

## 3. Deploy on Vercel

### Option A — Vercel Dashboard (recommended for first deploy)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** → connect your GitHub account
3. Select the `ai-agent-builder` repository
4. Framework preset: **Next.js** (auto-detected)
5. Click **"Deploy"** — Vercel will build and deploy automatically

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 4. Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic API key |
| `DATABASE_URL` | Phase 3 | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Phase 3 | Random 32-char secret |
| `BETTER_AUTH_URL` | Phase 3 | Your production URL |

> **v1.0.0 only needs `ANTHROPIC_API_KEY`.** The others are required when Phase 3 (auth + history) is implemented.

---

## 5. Database Setup (Phase 3 — not needed for v1.0.0)

When implementing Phase 3, use [Neon](https://neon.tech) (free serverless PostgreSQL):

1. Create a Neon project → copy the connection string
2. Set `DATABASE_URL` in Vercel environment variables
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
4. Prisma schema will be added in Phase 3 — no schema exists yet.

---

## 6. Custom Domain (optional)

In Vercel Dashboard → Project → Settings → Domains:
- Add your domain
- Update DNS records as instructed by Vercel
- SSL is provisioned automatically

---

## 7. Version Bumping

```bash
# Bump patch (1.0.0 → 1.0.1)
bash scripts/version-bump.sh patch

# Bump minor (1.0.0 → 1.1.0)
bash scripts/version-bump.sh minor

# Bump major (1.0.0 → 2.0.0)
bash scripts/version-bump.sh major
```

Follow the printed instructions to commit, tag, and push.

---

## 8. Vercel Configuration

[`vercel.json`](./vercel.json) sets extended timeouts for AI routes:

| Route | Max Duration |
|---|---|
| `/api/generate` | 60s — document generation (single large request) |
| `/api/agent` | 30s — streaming chat |

---

## Troubleshooting

**Build fails with type errors**
```bash
npm run type-check
```
Fix all errors before deploying.

**`ANTHROPIC_API_KEY` not found at runtime**
- Verify the env var is set in Vercel Dashboard
- Redeploy after adding env vars (Vercel caches the build environment)

**Streaming response cuts off**
- Check Vercel function timeout — streaming routes need at least 30s
- Verify `vercel.json` is committed and pushed

**`Module not found` errors**
- Delete `.next/` locally and rebuild: `rm -rf .next && npm run build`
