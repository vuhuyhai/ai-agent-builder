import { Answer, OutputDocs } from '@/types/chat'
import { recommendStack } from './stackRecommender'

/** Strip XML-like closing sequences to prevent prompt injection */
function sanitizeAnswer(text: string): string {
  return text.replace(/<\//g, '< /').replace(/</g, '‹').replace(/>/g, '›')
}

export function buildGenerationPrompt(answers: Answer[]): string {
  const getAnswer = (index: number): string =>
    sanitizeAnswer(answers.find((a) => a.questionIndex === index)?.answer ?? '(không có câu trả lời)')

  const problemStatement = getAnswer(0)
  const appType         = getAnswer(1)
  const coreFeatures    = getAnswer(2)
  const authAndDb       = getAnswer(3)
  const deployAndBudget = getAnswer(4)

  // Pass sanitized answers to recommendStack to prevent injection via stack/rationale strings
  const sanitizedAnswers = answers.map((a) => ({
    ...a,
    answer: sanitizeAnswer(a.answer),
  }))
  const { stack, rationale } = recommendStack(sanitizedAnswers)
  const safeStack = sanitizeAnswer(stack)
  const safeRationale = sanitizeAnswer(rationale)

  // Derive project name from first answer — allow only alphanumeric + spaces + common Vietnamese chars
  const firstAnswer = answers.find((a) => a.questionIndex === 0)?.answer ?? 'My App'
  const projectName = firstAnswer
    .split(' ')
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/[^\p{L}\p{N} ]/gu, '') // Unicode-safe: allow all letters/numbers
    .trim() || 'My Project'

  return `You are an expert software architect. Generate 3 technical documents for a new project based on the discovery answers below.

<context>
Project working title: "${projectName}"

Discovery answers:
Q1 (Problem & Target Users): ${problemStatement}
Q2 (App Type): ${appType}
Q3 (Top 3 Features): ${coreFeatures}
Q4 (Auth & Database Needs): ${authAndDb}
Q5 (Deploy Target & Budget): ${deployAndBudget}

Recommended tech stack: ${safeStack}
Stack rationale: ${safeRationale}
</context>

<task>
Generate exactly 3 documents. Each document must be wrapped in its XML tag.
Write in Vietnamese where instructed, English for code/technical terms.
Be specific and actionable — a developer should be able to start coding immediately after reading these.
</task>

<output_format>
<CLAUDE_MD>
# ${projectName} — CLAUDE.md

## Project Overview

[2-3 câu mô tả app, vấn đề giải quyết, đối tượng người dùng. Viết bằng tiếng Việt.]

---

## Tech Stack

| Layer | Technology |
|---|---|
[Fill each layer from recommended stack above. Format: | Layer name | Technology name |]

---

## Core Principles

- **YAGNI**: Chỉ build những gì MVP thực sự cần
- **KISS**: Giải pháp đơn giản nhất có thể
- **DRY**: Không lặp code, tái sử dụng components
- Sau mỗi file thay đổi: chạy \`npm run type-check\`

---

## MVP Features (theo thứ tự ưu tiên)

[Numbered list of 3-5 features derived from Q3 answer. Each feature: bold name + 1 line description.]

---

## File Structure

\`\`\`
src/
├── app/
│   ├── [key routes based on features]
│   └── api/
│       └── [API routes needed]
├── components/
│   └── [key component files]
├── lib/
│   └── [utility files]
└── types/
    └── index.ts
\`\`\`

---

## Development Rules

- Luôn chạy \`npm run type-check\` sau khi code
- Mỗi tính năng = 1 Git commit riêng, message rõ ràng
- Không hardcode API keys, dùng \`.env.local\`
- Không dùng \`any\` trong TypeScript
- Dark mode mặc định cho toàn bộ UI

---

## Environment Variables (.env.local)

\`\`\`env
[List required env vars based on tech stack: DATABASE_URL, API keys, auth secrets, etc.]
\`\`\`
</CLAUDE_MD>

<PLAN_MD>
# ${projectName} — Implementation Plan

**Date:** ${new Date().toISOString().split('T')[0]} | **Status:** In Progress | **Target:** 14 days

---

## Overview

[1-2 câu mô tả mục tiêu kế hoạch.]

**Stack:** [one-line summary of stack]

---

## Phases

| # | Phase | Days | Priority | Status |
|---|-------|------|----------|--------|
| 1 | [Phase name] | 1–3 | P0 | [ ] Pending |
| 2 | [Phase name] | 4–6 | P0 | [ ] Pending |
| 3 | [Phase name] | 7–9 | P1 | [ ] Pending |
| 4 | Polish + Deploy | 10–14 | P1 | [ ] Pending |

[Generate 3-4 meaningful phases based on the features in Q3. Phase names should reflect actual features, not generic names.]

---

## Phase 1 — [Name] (Days 1–3)

### Requirements
[3-5 specific functional requirements]

### Key Files to Create
\`\`\`
[list file paths]
\`\`\`

### Implementation Steps
[5-8 numbered, specific steps. Include exact npm commands, file names.]

### Todo
- [ ] [specific task 1]
- [ ] [specific task 2]
- [ ] [continue for 5-8 tasks]

### Success Criteria
- [ ] [measurable outcome 1]
- [ ] [measurable outcome 2]

---

## Phase 2 — [Name] (Days 4–6)

### Requirements
[3-5 requirements]

### Key Files to Create/Modify
\`\`\`
[file paths]
\`\`\`

### Implementation Steps
[5-8 steps]

### Todo
- [ ] [tasks]

### Success Criteria
- [ ] [outcomes]

---

## Phase 3 — [Name] (Days 7–9)

### Requirements
[requirements]

### Todo
- [ ] [tasks]

### Success Criteria
- [ ] [outcomes]

---

## Phase 4 — Polish + Deploy (Days 10–14)

### Requirements
- Dark mode + responsive mobile
- Skeleton loading, error states
- SEO metadata
- Deploy to [target from Q5]

### Todo
- [ ] Dark mode CSS variables
- [ ] Mobile responsive layout (≥ 375px)
- [ ] Next.js metadata API
- [ ] Production environment variables
- [ ] Deploy and smoke test

### Success Criteria
- [ ] Lighthouse score ≥ 80
- [ ] App accessible on production URL
- [ ] All features work on mobile
</PLAN_MD>

<BOOTSTRAP_PROMPT>
# Bootstrap Prompt — ${projectName}
# Sử dụng với Cursor + ClaudeSuperKit

---

## Lệnh khởi động (paste vào Cursor chat)

Implement **${projectName}** theo kế hoạch dưới đây.

Đọc \`CLAUDE.md\` trước khi bắt đầu.
Tạo thư mục \`plans/\` với \`plan.md\` và các \`phase-XX.md\`.

---

## Project Summary

**Vấn đề:** ${problemStatement}
**Loại app:** ${appType}
**Tính năng chính:** ${coreFeatures}
**Auth & DB:** ${authAndDb}
**Deploy:** ${deployAndBudget}

---

## Tech Stack

${stack}

**Lý do chọn stack này:** ${rationale}

---

## MVP Features (theo thứ tự ưu tiên)

[Numbered list of features from Q3, with clear acceptance criteria for each]

---

## Constraints

- Không dùng \`any\` trong TypeScript
- Không hardcode API keys (dùng \`.env.local\`)
- Chạy \`npm run type-check\` sau mỗi file thay đổi
- Dark mode mặc định
- Mỗi feature = 1 Git commit

---

## Bước đầu tiên

1. Chạy: \`npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"\`
2. Điền \`.env.local\` với các API keys cần thiết
3. Bắt đầu với Phase 1 trong \`plans/phase-01.md\`

---

## Câu hỏi cần trả lời trước khi code

- [ ] Đã có API key cho các services chưa?
- [ ] Domain name đã chọn chưa?
- [ ] Design mockup có không, hay dùng shadcn/ui mặc định?
</BOOTSTRAP_PROMPT>
</output_format>`
}

/**
 * Parse Claude's response into 3 separate documents.
 * Tolerant of extra text outside XML tags.
 */
export function parseOutputDocs(text: string): OutputDocs {
  const extract = (tag: string): string => {
    const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
    return match?.[1]?.trim() ?? ''
  }

  return {
    claudeMd: extract('CLAUDE_MD'),
    planMd: extract('PLAN_MD'),
    bootstrapPrompt: extract('BOOTSTRAP_PROMPT'),
  }
}
