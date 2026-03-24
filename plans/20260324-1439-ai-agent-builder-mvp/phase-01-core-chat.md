# Phase 01 — Core Chat

## Context Links
- Parent: [plan.md](./plan.md)
- Next phase: [phase-02-output-generation.md](./phase-02-output-generation.md)
- Research: [researcher-01-streaming-api.md](./research/researcher-01-streaming-api.md)

---

## Overview

- **Date:** 2026-03-24
- **Days:** 1–3
- **Priority:** P0 (blocker for all other phases)
- **Description:** Bootstrap Next.js project, implement streaming chat with Anthropic, build 5-question agent logic, wire Zustand store.
- **Implementation Status:** [ ] Pending
- **Review Status:** [ ] Not reviewed

---

## Key Insights

- Use **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) rather than raw `@anthropic-ai/sdk` — abstracts SSE/streaming boilerplate, `toDataStreamResponse()` handles headers automatically.
- `appendToLastAssistant(chunk)` pattern in Zustand avoids creating new message objects on every chunk — critical for render performance.
- Use `persist` middleware with `partialize` to exclude `isStreaming` flag from localStorage (transient state should not survive page reload).
- Agent phase transitions must be tracked in store (`phase: 'questioning' | 'generation' | 'complete'`) — do NOT derive from message count alone (user may retry/edit).
- Two API calls exist: streaming chat (`/api/agent`) and non-streaming generation (`/api/generate`). Keep them separate from Day 1.

---

## Requirements

### Functional
- Project scaffolds and runs locally with `npm run dev`
- Chat UI renders user + assistant messages with streaming text
- Agent asks exactly 5 sequential questions (no skipping, no repeating)
- Each user answer stored in Zustand `answers[]` indexed by question number
- After 5th answer, store transitions to `generation` phase (no auto-redirect yet — Phase 2 handles that)
- `.env.local` with `ANTHROPIC_API_KEY` required to start

### Non-Functional
- First message renders within 1s of user submit
- No re-renders of entire message list on each streaming chunk (only last message re-renders)
- Works in Chrome, Firefox, Safari
- TypeScript strict mode; no `any` types

---

## Architecture

### File Structure
```
src/
├── app/
│   ├── layout.tsx                  # Root layout, Sonner <Toaster />
│   ├── page.tsx                    # Root → redirects to /chat
│   ├── chat/
│   │   └── page.tsx                # Chat page, renders <ChatInterface />
│   └── api/
│       └── agent/
│           └── route.ts            # POST — streaming chat endpoint
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx       # Container: input + message list
│   │   └── MessageBubble.tsx       # Single message (user/assistant)
│   └── ui/                         # shadcn/ui auto-generated components
├── store/
│   └── chatStore.ts                # Zustand store
├── lib/
│   └── agentPrompt.ts              # System prompt + question definitions
└── types/
    └── chat.ts                     # Message, ChatStore interfaces
```

### Data Flow
```
User types → ChatInterface.tsx
  → addMessage(userMsg) → chatStore
  → POST /api/agent  { messages: Message[] }
       ↓
  route.ts: streamText({ model, system, messages })
       ↓ SSE chunks
  ChatInterface: reader.read() loop
  → appendToLastAssistant(chunk) → chatStore
  → MessageBubble re-renders (last msg only)
       ↓ stream ends
  → setStreaming(false)
  → if answers.length === 5 → setPhase('generation')
```

### Agent Prompt Structure (`lib/agentPrompt.ts`)
```typescript
// 5 questions (hardcoded array, not AI-generated)
export const QUESTIONS = [
  { id: 'q1', label: 'Product Goal',     text: 'What problem does your app solve?' },
  { id: 'q2', label: 'User Profile',     text: 'Who are the primary users?' },
  { id: 'q3', label: 'Integrations',     text: 'What external systems or APIs are needed?' },
  { id: 'q4', label: 'Tone & Constraints', text: 'Any brand voice, legal, or regulatory constraints?' },
  { id: 'q5', label: 'Output Format',    text: 'What should the finished app look like?' },
];

export const SYSTEM_PROMPT = `You are an AI Agent Builder assistant...
Currently on question {currentIndex} of 5.
Ask ONLY this question: {currentQuestion}
...`
```

### Streaming Route (`app/api/agent/route.ts`)
```typescript
// Pseudocode — use Vercel AI SDK
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export const runtime = 'nodejs'; // NOT edge — edge blocks later Prisma usage

export async function POST(req: Request) {
  const { messages, currentQuestionIndex } = await req.json();
  const result = streamText({
    model: anthropic('claude-opus-4-6'),
    system: buildSystemPrompt(currentQuestionIndex),
    messages,
  });
  return result.toDataStreamResponse();
}
```

---

## Related Code Files

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `src/app/layout.tsx` | Root layout with Sonner Toaster |
| CREATE | `src/app/page.tsx` | Redirect to /chat |
| CREATE | `src/app/chat/page.tsx` | Chat page |
| CREATE | `src/app/api/agent/route.ts` | Streaming API route |
| CREATE | `src/components/chat/ChatInterface.tsx` | Main chat container |
| CREATE | `src/components/chat/MessageBubble.tsx` | Message renderer |
| CREATE | `src/store/chatStore.ts` | Zustand store |
| CREATE | `src/lib/agentPrompt.ts` | System prompt builder |
| CREATE | `src/types/chat.ts` | TypeScript interfaces |
| CREATE | `.env.local` | API key (gitignored) |
| CREATE | `.env.example` | Template for contributors |

---

## Implementation Steps

1. Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` in project root.
2. Install deps: `npm install ai @ai-sdk/anthropic zustand sonner`.
3. Run `npx shadcn@latest init` — select dark theme, CSS variables yes.
4. Add shadcn components: `npx shadcn@latest add button input textarea card`.
5. Create `src/types/chat.ts` — define `Message`, `ChatPhase`, `ChatStore` interfaces.
6. Create `src/store/chatStore.ts` — implement Zustand store with `persist` middleware (partialize excludes `isStreaming`, `phase`).
7. Create `src/lib/agentPrompt.ts` — define `QUESTIONS` array and `buildSystemPrompt(index)` function.
8. Create `src/app/api/agent/route.ts` — implement POST handler using `streamText`, add `export const runtime = 'nodejs'`.
9. Create `src/components/chat/MessageBubble.tsx` — renders user (right-aligned) and assistant (left-aligned) messages. Use `React.memo` to prevent unnecessary re-renders.
10. Create `src/components/chat/ChatInterface.tsx` — textarea + submit button, reads from store, calls `/api/agent`, streams response via `ReadableStream` reader loop.
11. Create `src/app/chat/page.tsx` — renders `<ChatInterface />`.
12. Create `src/app/page.tsx` — `redirect('/chat')`.
13. Update `src/app/layout.tsx` — add `<Toaster />` from sonner, set dark mode class on `<html>`.
14. Add `.env.local` with `ANTHROPIC_API_KEY=sk-ant-...` and commit `.env.example` with placeholder.
15. Test: `npm run dev`, open `/chat`, verify streaming works through all 5 questions.

---

## Todo List

- [ ] Scaffold Next.js project with correct flags
- [ ] Install ai, @ai-sdk/anthropic, zustand, sonner
- [ ] Init shadcn/ui, install button/input/textarea/card
- [ ] Define TypeScript interfaces in `types/chat.ts`
- [ ] Implement Zustand store with persist middleware
- [ ] Write `buildSystemPrompt(index)` in `agentPrompt.ts`
- [ ] Implement `/api/agent` route with `streamText`
- [ ] Set `export const runtime = 'nodejs'` on route
- [ ] Build `MessageBubble` with React.memo
- [ ] Build `ChatInterface` with streaming reader loop
- [ ] Wire phase transition: after 5 answers → `setPhase('generation')`
- [ ] Add Toaster to root layout
- [ ] Create `.env.local` and `.env.example`
- [ ] Manual test: full 5-question flow end-to-end
- [ ] Verify no TypeScript errors (`npm run build`)

---

## Success Criteria

- `npm run dev` starts without errors
- Streaming chat works: assistant response appears word-by-word
- All 5 questions asked in order; answers stored in `chatStore.answers`
- After question 5, `phase === 'generation'` in store
- `npm run build` passes TypeScript and ESLint checks
- No full message list re-render on chunk (verify via React DevTools)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Vercel AI SDK version incompatibility with claude-opus-4-6 | Low | High | Pin `ai@^3` and `@ai-sdk/anthropic@^0.0` in package.json; test immediately |
| Edge runtime blocks Node APIs later | Medium | High | Set `runtime = 'nodejs'` on ALL API routes from Day 1 |
| Stream silently drops (network timeout) | Medium | Medium | Add `try/catch` in reader loop; show error toast via Sonner |
| User submits before previous stream ends | Medium | Low | Disable submit button when `isStreaming === true` |
| localStorage quota exceeded (large conversations) | Low | Low | `partialize` only persists `messages[]`, not full store |

---

## Security Considerations

- `ANTHROPIC_API_KEY` must only be read server-side (in route handler); never expose to client bundle.
- Validate `messages` array shape and `currentQuestionIndex` range (0–4) in route handler before calling Anthropic.
- Rate limit not needed in Phase 1 (MVP), but add TODO comment in route for Phase 4.
- No user-generated content stored to DB yet (Phase 3 handles that).

---

## Next Steps

- Phase 2: Build `OutputPanel.tsx` and `/api/generate` route that consumes `chatStore.answers`.
- Ensure `chatStore.answers` shape is finalized here — Phase 2 depends on it.
- Consider adding a "restart conversation" button to reset store (useful for testing Phase 2).
