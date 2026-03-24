import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { buildGenerationPrompt, parseOutputDocs } from '@/lib/generatePrompt'
import { toSafeError } from '@/lib/apiError'
import { Answer, OutputDocs } from '@/types/chat'
import { TOTAL_QUESTIONS } from '@/lib/prompts/questions'

// Node.js runtime required — Edge runtime blocks Prisma (Phase 3)
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
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      { error: 'GOOGLE_GENERATIVE_AI_API_KEY is not configured' },
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
    const prompt = buildGenerationPrompt(body.answers)

    const response = await generateText({
      model: google('gemini-2.0-flash'),
      maxOutputTokens: 8192,
      prompt,
    })

    const docs: OutputDocs = parseOutputDocs(response.text)

    // If ALL three docs are empty, parsing failed — return a clear error
    if (!docs.claudeMd && !docs.planMd && !docs.bootstrapPrompt) {
      console.error('[/api/generate] All docs empty — finish_reason:', response.finishReason)
      throw new Error('Document generation produced no output. Please try again.')
    }

    // Log partial output for debugging (at least one doc missing)
    if (!docs.claudeMd || !docs.planMd || !docs.bootstrapPrompt) {
      console.warn('[/api/generate] Partial output — finish_reason:', response.finishReason)
    }

    return Response.json(docs)
  } catch (err) {
    const { message, status } = toSafeError(err, '/api/generate')
    return Response.json({ error: message }, { status })
  }
}
