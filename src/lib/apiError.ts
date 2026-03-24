/**
 * Map internal errors to safe client-facing messages.
 * Never leaks SDK internals, stack traces, or API key hints.
 * Full error is logged server-side only.
 */
export function toSafeError(err: unknown, logPrefix: string): { message: string; status: number } {
  if (!(err instanceof Error)) return { message: 'Internal server error', status: 500 }

  const msg = err.message.toLowerCase()

  if (msg.includes('rate') || msg.includes('429')) {
    return { message: 'Too many requests. Please wait a moment and try again.', status: 429 }
  }
  if (msg.includes('auth') || msg.includes('401') || msg.includes('api key')) {
    return { message: 'API authentication error. Please check server configuration.', status: 401 }
  }
  if (msg.includes('model') || msg.includes('not found')) {
    return { message: 'AI model unavailable. Please try again later.', status: 503 }
  }

  console.error(`[${logPrefix}] Error:`, err.message)
  return { message: 'Internal server error. Please try again.', status: 500 }
}
