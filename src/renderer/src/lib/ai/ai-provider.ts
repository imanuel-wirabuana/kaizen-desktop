import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

export const AI_BASE_URL = 'https://imanuelcdw-dawra.hf.space/v1'
export const AI_API_KEY = 'sk-6bfffd4f7d73aaad-b8j4vt-d126e60c'
export const AI_MODEL_NAME = 'kaizen'

const customOpenAi = createOpenAI({
  baseURL: AI_BASE_URL,
  apiKey: AI_API_KEY
})

export function getLanguageModel(): LanguageModel {
  return customOpenAi(AI_MODEL_NAME)
}

export interface ChatMessageParam {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamKaizenChatOptions {
  messages: ChatMessageParam[]
  system?: string
  signal?: AbortSignal
  onDelta: (delta: string, accumulated: string) => void
}

/**
 * Robust, direct SSE streaming client for Kaizen AI.
 * Streams token-by-token chunks smoothly without proxy schema mismatch errors.
 */
export async function streamKaizenChat({
  messages,
  system,
  signal,
  onDelta
}: StreamKaizenChatOptions): Promise<string> {
  const formattedMessages: ChatMessageParam[] = []
  if (system) {
    formattedMessages.push({ role: 'system', content: system })
  }
  formattedMessages.push(...messages)

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify({
      model: AI_MODEL_NAME,
      stream: true,
      messages: formattedMessages
    }),
    signal
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`AI API error (${response.status}): ${errorText || response.statusText}`)
  }

  if (!response.body) {
    throw new Error('Response body is null')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let accumulated = ''
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(':')) continue
        if (trimmed === 'data: [DONE]') continue

        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6))
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              accumulated += delta
              onDelta(delta, accumulated)
            }
          } catch {
            // Ignore partial or non-JSON SSE lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return accumulated
}
