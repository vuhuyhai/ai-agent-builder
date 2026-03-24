import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { buildSystemPrompt } from '@/lib/prompts/system'
import { TOTAL_QUESTIONS } from '@/lib/prompts/questions'
import { toSafeError } from '@/lib/apiError'
import { Message } from '@/types/chat'

// IMPORTANT: Node.js runtime required — Edge runtime blocks Prisma (Phase 3)
export const runtime = 'nodejs'

const MAX_MESSAGES = 30
// Raised from 8000 to accommodate file attachments (up to ~30K extracted chars + message)
const MAX_CONTENT_LENGTH = 35_000

interface AgentRequestBody {
  messages: Message[]
  currentQuestionIndex: number
}

function validateRequest(body: unknown): AgentRequestBody {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body')
  }
  const b = body as Record<string, unknown>

  if (!Array.isArray(b.messages)) {
    throw new Error('messages must be an array')
  }
  if (b.messages.length > MAX_MESSAGES) {
    throw new Error(`Too many messages (max ${MAX_MESSAGES})`)
  }

  // Validate each message shape + content length
  for (const m of b.messages) {
    if (!m || typeof m !== 'object') throw new Error('Invalid message object')
    const msg = m as Record<string, unknown>
    if (msg.role !== 'user' && msg.role !== 'assistant') {
      throw new Error('Message role must be "user" or "assistant"')
    }
    if (typeof msg.content !== 'string') throw new Error('Message content must be a string')
    if (msg.content.length > MAX_CONTENT_LENGTH) {
      throw new Error(`Message content too long (max ${MAX_CONTENT_LENGTH} chars)`)
    }
  }

  const index = typeof b.currentQuestionIndex === 'number'
    ? b.currentQuestionIndex
    : 0

  if (index < 0 || index > TOTAL_QUESTIONS) {
    throw new Error(`currentQuestionIndex must be 0–${TOTAL_QUESTIONS}`)
  }

  return {
    messages: b.messages as Message[],
    currentQuestionIndex: index,
  }
}


export async function POST(req: Request): Promise<Response> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'GOOGLE_GENERATIVE_AI_API_KEY is not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let body: AgentRequestBody
  try {
    const raw = await req.json()
    body = validateRequest(raw)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bad request'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const systemPrompt = buildSystemPrompt(body.currentQuestionIndex)

    const sdkMessages = body.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const result = streamText({
      model: google('gemini-2.0-flash-lite'),
      system: systemPrompt,
      messages: sdkMessages,
      onError: ({ error }) => {
        console.error('[/api/agent] stream error:', error)
      },
    })

    return result.toTextStreamResponse()
  } catch (err) {
    const { message, status } = toSafeError(err, '/api/agent')
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// TODO (Phase 4): Add rate limiting per IP / user session
