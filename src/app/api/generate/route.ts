import Anthropic from '@anthropic-ai/sdk'
import { buildGenerationPrompt, parseOutputDocs } from '@/lib/generatePrompt'
import { toSafeError } from '@/lib/apiError'
import { Answer, OutputDocs } from '@/types/chat'
import { TOTAL_QUESTIONS } from '@/lib/prompts/questions'

// Node.js runtime required — Edge runtime blocks Anthropic SDK + Prisma (Phase 3)
export const runtime = 'nodejs'

const MAX_ANSWER_LENGTH = 2000

interface GenerateRequestBody {
  answers: Answer[]
}

function validateRequest(body: unknown): GenerateRequestBody {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body')
  }
  const b = body as Record<string, unknown>

  if (!Array.isArray(b.answers)) {
    throw new Error('answers must be an array')
  }
  if (b.answers.length !== TOTAL_QUESTIONS) {
    throw new Error(`Expected exactly ${TOTAL_QUESTIONS} answers, got ${b.answers.length}`)
  }

  for (const a of b.answers) {
    if (!a || typeof a !== 'object') throw new Error('Invalid answer object')
    const ans = a as Record<string, unknown>
    if (typeof ans.questionIndex !== 'number') throw new Error('answer.questionIndex must be a number')
    if (typeof ans.question !== 'string') throw new Error('answer.question must be a string')
    if (typeof ans.answer !== 'string') throw new Error('answer.answer must be a string')
    if (ans.answer.length > MAX_ANSWER_LENGTH) {
      throw new Error(`Answer too long (max ${MAX_ANSWER_LENGTH} chars)`)
    }
  }

  return { answers: b.answers as Answer[] }
}


export async function POST(req: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY is not configured' },
      { status: 500 }
    )
  }

  let body: GenerateRequestBody
  try {
    const raw = await req.json()
    body = validateRequest(raw)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bad request'
    return Response.json({ error: message }, { status: 400 })
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const prompt = buildGenerationPrompt(body.answers)

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8192, // 3 full markdown docs need room; 4096 frequently truncates
      messages: [{ role: 'user', content: prompt }],
    })

    // Extract text from response
    const firstBlock = response.content[0]
    if (!firstBlock || firstBlock.type !== 'text') {
      throw new Error('Unexpected response format from Anthropic API')
    }

    const docs: OutputDocs = parseOutputDocs(firstBlock.text)

    // If ALL three docs are empty, parsing failed — return a clear error
    if (!docs.claudeMd && !docs.planMd && !docs.bootstrapPrompt) {
      console.error('[/api/generate] All docs empty — stop_reason:', response.stop_reason)
      throw new Error('Document generation produced no output. Please try again.')
    }

    // Log partial output for debugging (at least one doc missing)
    if (!docs.claudeMd || !docs.planMd || !docs.bootstrapPrompt) {
      console.warn('[/api/generate] Partial output — stop_reason:', response.stop_reason)
    }

    return Response.json(docs)
  } catch (err) {
    const { message, status } = toSafeError(err, '/api/generate')
    return Response.json({ error: message }, { status })
  }
}
