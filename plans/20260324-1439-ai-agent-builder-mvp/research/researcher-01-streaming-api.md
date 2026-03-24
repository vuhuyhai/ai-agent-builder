# AI Agent Builder MVP: Streaming API & State Management Research

**Research Date:** 2026-03-24 | **Report ID:** researcher-01

---

## 1. Next.js 14 App Router + Anthropic API Streaming

### Best Pattern for Route Handler Streaming

**Route Handler (`app/api/agent/route.ts`) Pattern:**
- Use Route Handlers (not Pages API) for streaming in Next.js 14 App Router
- Recommended: Use Vercel AI SDK (`ai/core`) instead of raw `ReadableStream` for abstraction
- Alternative: Custom `Response` subclass with `ReadableStream` (note: `StreamingTextResponse` is deprecated)

**Implementation with Anthropic SDK:**
```typescript
// Recommended approach: Vercel AI SDK
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: anthropic('claude-opus-4-6'),
    messages,
  });
  return result.toDataStreamResponse();
}
```

### Claude-Opus-4-6 Streaming Specifics
- Supports `stream: true` parameter in messages API
- SDK provides `.stream()` method with `.finalMessage()` (TypeScript) for complete accumulation
- Speed option available: `speed: 'fast'` (2.5x faster output) or `standard` (default)
- Adaptive thinking: Claude auto-determines reasoning depth per prompt

### Error Handling Patterns
- Stream errors throw exceptions; wrap stream creation in try-catch
- Network drops: Implement client-side SSE reconnection logic (EventSource API)
- Token limits: Handle via API error responses before stream starts
- Use `request.clone()` for error scenario body re-reads

**Sources:** [Vercel AI SDK Streaming](https://ai-sdk.dev/docs/ai-sdk-core/stream-text), [Anthropic Streaming Docs](https://docs.anthropic.com/en/api/messages-streaming), [LogRocket Next.js Streaming](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/)

---

## 2. Zustand State Management for Chat

### Message Store Pattern

**Recommended Structure:**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message { id: string; role: 'user' | 'assistant'; content: string; }

interface ChatStore {
  messages: Message[];
  addMessage: (msg: Message) => void;
  appendToLastAssistant: (chunk: string) => void;
  resetChat: () => void;
  isStreaming: boolean;
  setStreaming: (val: boolean) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (msg) => set(state => ({ messages: [...state.messages, msg] })),
      appendToLastAssistant: (chunk) => set(state => {
        const updated = [...state.messages];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'assistant') {
          updated[lastIdx].content += chunk;
        }
        return { messages: updated };
      }),
      resetChat: () => set({ messages: [], isStreaming: false }),
      isStreaming: false,
      setStreaming: (val) => set({ isStreaming: val }),
    }),
    {
      name: 'chat-store',
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      partialize: (state) => ({ messages: state.messages }), // Only persist messages
    }
  )
);
```

### Persistence Strategy
- **localStorage:** For permanent session storage across browser sessions (chat history)
- **sessionStorage:** For temporary UI state, reset on tab close
- Use `persist` middleware with `partialize` to exclude streaming flags
- Note: Zustand does not sync across tabs by default; add custom listener if needed

### Streaming Chunk Handling
- Track `isStreaming` boolean in store
- Append chunks to last assistant message via `appendToLastAssistant()`
- Batch updates every 50-100ms to avoid excessive renders
- Clear streaming state when stream completes

**Sources:** [Zustand Persist Middleware](https://medium.com/@jalish.dev/how-to-use-zustand-in-react-with-local-storage-persistence-fd67ab0cc5a0), [Zustand NPM](https://www.npmjs.com/package/@anthropic-ai/sdk), [GitHub Zustand](https://github.com/pmndrs/zustand)

---

## 3. Multi-Turn Agent Logic (5 Qualifying Questions)

### Sequential Question Flow Architecture

**Phase Management Pattern:**
```typescript
interface AgentState {
  phase: 'questioning' | 'generation' | 'complete';
  currentQuestionIndex: number; // 0-4 for 5 questions
  answers: Record<string, string>; // indexed by question_id
  isAnswerComplete: boolean;
}

// Transition logic
const shouldMoveToGeneration = (answers: Record<string, string>) =>
  Object.keys(answers).length === 5 && Object.values(answers).every(a => a.length > 0);
```

### System Prompt Design (Dual Persona)
**Structure for PM + Developer dual agent:**
```
You are an AI Agent Builder Assistant with dual expertise:
1. Product Manager: Analyzes requirements, asks clarifying Qs about goals/users/scope
2. Developer: Translates specs into technical implementation guidance

Your task: Conduct 5 sequential qualifying questions:
Q1: [Product Goal] - What problem does this agent solve?
Q2: [User Profile] - Who are the primary users?
Q3: [Integration Scope] - What external systems/APIs?
Q4: [Tone & Constraints] - Brand voice and regulatory needs?
Q5: [Output Format] - Desired deliverables/UI components?

AFTER ALL 5 ANSWERED: Transition to generation phase with full context.
```

### Question → Generation Phase Transition
1. **Questioning Phase:** Agent asks sequential questions, stores answers in state
2. **Validation:** On user's 5th answer, validate completion via `shouldMoveToGeneration()`
3. **Generation Phase:** Combine all answers into comprehensive output (architecture doc, code templates, etc.)
4. System prompt switches from "ask questions" to "synthesize and generate"

### Context & Memory Management
- Persist all answers to Zustand store (with localStorage backup)
- Pass accumulated context in next API call message history
- Include earlier answers as context in follow-up prompts
- Two-tier memory: session memory (immediate) + persistent (between visits)

**Sources:** [Anthropic Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices), [Multi-Turn Conversations - Azure Learn](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-dialog-manage-conversation-flow?view=azure-bot-service-4.0), [Multi-Turn Agent Survey](https://arxiv.org/pdf/2503.22458)

---

## Unresolved Questions

1. **Streaming Backpressure:** How to handle client-side backpressure if user's network can't keep pace with stream? Should we buffer server-side?
2. **Concurrent Requests:** If user submits a new question before previous stream completes, should we cancel the stream or queue?
3. **Persistence Scope:** Should we persist full message history (answers + agent responses) or only answers? Size trade-offs?
4. **Model Selection:** Is `claude-opus-4-6` final model name or should we support model switching in future?

---

**Report Complete.** Use this research to build `app/api/agent/route.ts`, `store/chatStore.ts`, and agent logic components.
