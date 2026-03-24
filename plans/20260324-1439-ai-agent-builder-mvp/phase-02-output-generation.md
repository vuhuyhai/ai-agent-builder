# Phase 02 — Output Generation

## Context Links
- Parent: [plan.md](./plan.md)
- Prev phase: [phase-01-core-chat.md](./phase-01-core-chat.md)
- Next phase: [phase-03-auth-history.md](./phase-03-auth-history.md)
- Research: [researcher-02-auth-db-output.md](./research/researcher-02-auth-db-output.md)

---

## Overview

- **Date:** 2026-03-24
- **Days:** 4–6
- **Priority:** P0
- **Description:** After 5 answers collected, call `/api/generate` to produce CLAUDE.md, plan.md, and bootstrap prompt. Display in tabbed `OutputPanel.tsx` with copy-to-clipboard per tab.
- **Implementation Status:** [ ] Pending
- **Review Status:** [ ] Not reviewed

---

## Key Insights

- Use **non-streaming** for output generation — wait for full document before rendering. Streaming a 2000-word markdown file chunk-by-chunk offers poor UX and complicates tab parsing.
- Use XML-tagged prompts (`<context>`, `<task>`, `<output_format>`) — researcher confirmed this produces consistent structure from Claude.
- Generate all 3 documents in **one API call** using XML section markers in the response. Parse client-side by splitting on markers. Single call = fewer tokens, lower latency.
- `max_tokens: 4000` is the safe ceiling for all 3 docs combined. If outputs are consistently truncated, split into 2 calls (CLAUDE.md first, then plan+bootstrap).
- Tech stack recommender: derive from `answers.q3` (integrations) + `answers.q5` (output format). Do this in a `lib/stackRecommender.ts` helper — pure function, no API call needed.
- `navigator.clipboard.writeText()` requires HTTPS or localhost. Will fail on non-secure origins. Handle gracefully with a fallback textarea selection.

---

## Requirements

### Functional
- When `phase === 'generation'`, show a "Generate" button in the chat UI
- Clicking Generate calls `POST /api/generate` with all 5 answers
- Response contains 3 documents: CLAUDE.md, plan.md, bootstrap prompt
- `OutputPanel` shows 3 tabs; each tab has full document text + "Copy" button
- Copy button copies content to clipboard, shows success toast
- Loading state shown while generation is in progress (skeleton or spinner)
- Error state shown if generation fails (toast + retry button)

### Non-Functional
- Generation API call completes within 15s (claude-opus-4-6 non-streaming)
- Output panel is scrollable; no layout overflow
- Documents render as plain text (not parsed markdown) to preserve copy fidelity
- Tab state persists within session (user can switch tabs without losing content)

---

## Architecture

### File Structure
```
src/
├── app/
│   ├── chat/
│   │   └── page.tsx                # Updated: renders ChatInterface + OutputPanel side-by-side
│   └── api/
│       └── generate/
│           └── route.ts            # POST — non-streaming generation endpoint
├── components/
│   ├── chat/
│   │   └── ChatInterface.tsx       # Updated: shows "Generate" button when phase=generation
│   └── output/
│       ├── OutputPanel.tsx         # Tabbed panel: CLAUDE.md / plan.md / bootstrap
│       └── CopyButton.tsx          # Reusable copy-to-clipboard button
├── lib/
│   ├── generatePrompt.ts           # Prompt builder for /api/generate
│   └── stackRecommender.ts         # Pure fn: answers → recommended tech stack string
└── store/
    └── chatStore.ts                # Updated: add outputDocs state + setOutputDocs action
```

### Layout: Chat + Output Panel (2-column)
```
┌─────────────────────────┬────────────────────────────┐
│     ChatInterface        │       OutputPanel           │
│  (left, ~50% width)      │   (right, ~50% width)       │
│                          │  [ CLAUDE.md | plan | boot ]│
│  [messages...]           │                             │
│                          │  <textarea readonly>        │
│  [Generate ▶ button]     │  [Copy to clipboard]        │
│  (visible after Q5)      │                             │
└─────────────────────────┴────────────────────────────┘
```

### Generation API (`app/api/generate/route.ts`)
```typescript
// Pseudocode
export async function POST(req: Request) {
  const { answers } = await req.json();
  // validate: answers must be object with q1-q5 keys

  const prompt = buildGenerationPrompt(answers); // from lib/generatePrompt.ts
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text;
  const docs = parseOutputDocs(text); // split on XML markers
  return Response.json(docs);
}
```

### Prompt Structure (`lib/generatePrompt.ts`)
```
<context>
User answers to 5 qualifying questions:
Q1 (Product Goal): {answers.q1}
Q2 (User Profile): {answers.q2}
Q3 (Integrations): {answers.q3}
Q4 (Tone & Constraints): {answers.q4}
Q5 (Output Format): {answers.q5}
Recommended stack: {stackRecommender(answers)}
</context>

<task>
Generate 3 documents separated by XML markers.
</task>

<output_format>
<CLAUDE_MD>
[Full CLAUDE.md content]
</CLAUDE_MD>
<PLAN_MD>
[Full plan.md content]
</PLAN_MD>
<BOOTSTRAP_PROMPT>
[Full bootstrap prompt]
</BOOTSTRAP_PROMPT>
</output_format>
```

### Parsing Function
```typescript
function parseOutputDocs(text: string): OutputDocs {
  const extract = (tag: string) => {
    const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return match?.[1]?.trim() ?? '';
  };
  return {
    claudeMd: extract('CLAUDE_MD'),
    planMd: extract('PLAN_MD'),
    bootstrapPrompt: extract('BOOTSTRAP_PROMPT'),
  };
}
```

---

## Related Code Files

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `src/app/api/generate/route.ts` | Non-streaming generation endpoint |
| CREATE | `src/components/output/OutputPanel.tsx` | Tabbed output display |
| CREATE | `src/components/output/CopyButton.tsx` | Clipboard copy with toast feedback |
| CREATE | `src/lib/generatePrompt.ts` | Prompt builder + doc parser |
| CREATE | `src/lib/stackRecommender.ts` | Pure fn: answers → stack string |
| MODIFY | `src/store/chatStore.ts` | Add `outputDocs`, `setOutputDocs`, `isGenerating` |
| MODIFY | `src/app/chat/page.tsx` | 2-column layout, render OutputPanel |
| MODIFY | `src/components/chat/ChatInterface.tsx` | Add Generate button + loading state |

---

## Implementation Steps

1. Add `outputDocs: OutputDocs | null`, `isGenerating: boolean`, `setOutputDocs`, `setGenerating` to `chatStore.ts`.
2. Create `src/lib/stackRecommender.ts` — simple keyword matching on `answers.q3`/`answers.q5` to return a stack string (e.g., "Next.js + Prisma + Stripe").
3. Create `src/lib/generatePrompt.ts` — `buildGenerationPrompt(answers)` and `parseOutputDocs(text)` functions.
4. Create `src/app/api/generate/route.ts` — validate input, call Anthropic non-streaming, parse and return `OutputDocs`.
5. Create `src/components/output/CopyButton.tsx` — button that calls `navigator.clipboard.writeText`, shows Sonner toast on success/failure, fallback for insecure contexts.
6. Create `src/components/output/OutputPanel.tsx` — shadcn `Tabs` component with 3 tabs; each tab renders `<pre>` + `<CopyButton>`.
7. Update `src/app/chat/page.tsx` — wrap in `grid grid-cols-2` layout; render `<OutputPanel>` in second column (hidden until `outputDocs` exists).
8. Update `src/components/chat/ChatInterface.tsx` — show "Generate Documents" button when `phase === 'generation'`; on click, `setGenerating(true)`, call `/api/generate`, `setOutputDocs(result)`, `setGenerating(false)`.
9. Add skeleton loader to `OutputPanel` when `isGenerating === true`.
10. Test: complete 5-question flow, click Generate, verify all 3 tabs have content, copy works.

---

## Todo List

- [ ] Extend chatStore with `outputDocs`, `isGenerating`, setters
- [ ] Implement `stackRecommender(answers)` pure function
- [ ] Implement `buildGenerationPrompt(answers)` with XML structure
- [ ] Implement `parseOutputDocs(text)` with regex extraction
- [ ] Create `/api/generate` route with input validation
- [ ] Create `CopyButton` component with toast + fallback
- [ ] Create `OutputPanel` with shadcn Tabs (3 tabs)
- [ ] Add skeleton/loading state to OutputPanel
- [ ] Update chat page to 2-column grid layout
- [ ] Add "Generate Documents" button to ChatInterface
- [ ] Wire Generate button to `/api/generate` call
- [ ] Test all 3 documents render correctly
- [ ] Test copy button in Chrome, Firefox, Safari
- [ ] Test error state when API call fails

---

## Success Criteria

- Clicking "Generate" produces all 3 documents within 15s
- All 3 tabs render non-empty content
- Copy button works and shows success toast
- Error toast + retry shown when generation fails
- `OutputPanel` hidden/collapsed until generation completes
- `npm run build` passes with no TypeScript errors

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Claude truncates at 4000 tokens (all 3 docs) | Medium | High | Monitor response; if truncated, split into 2 separate calls |
| XML parsing fails if Claude adds extra text outside tags | Medium | Medium | Regex is tolerant of extra content; test with multiple answer sets |
| `navigator.clipboard` unavailable (HTTP or old browser) | Low | Medium | Fallback: select all text in `<pre>` programmatically |
| `isGenerating` stuck true if API throws | Medium | Low | Use `finally` block to always call `setGenerating(false)` |
| Two-column layout breaks on < 1024px screens | Low | Low | Phase 4 handles responsive; note it as known issue for now |

---

## Security Considerations

- Validate `answers` shape in route handler: must be object with exactly keys q1–q5, each a non-empty string.
- Sanitize answers before embedding in prompt: strip any `</` sequences to prevent XML injection into the prompt structure.
- `ANTHROPIC_API_KEY` stays server-side only.
- No user-provided content is executed or rendered as HTML (use `<pre>` not `dangerouslySetInnerHTML`).

---

## Next Steps

- Phase 3: Save generated `outputDocs` to DB as `Project` record after generation succeeds.
- `OutputDocs` type must be serializable to JSON for DB storage — verify in this phase.
- Consider adding a project name field (auto-derived from `answers.q1`) for the history page.
