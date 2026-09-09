import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

export const AI_BASE_URL =
  import.meta.env.VITE_AI_BASE_URL || 'https://imanuelcdw-dawra.hf.space/v1'

const rawApiKeys = import.meta.env.VITE_AI_API_KEYS
const singleApiKey = import.meta.env.VITE_AI_API_KEY

export const AI_API_KEYS: readonly string[] = rawApiKeys
  ? rawApiKeys
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
  : singleApiKey
    ? [singleApiKey.trim()]
    : [
        'sk-6bfffd4f7d73aaad-b8j4vt-d126e60c',
        'sk-6bfffd4f7d73aaad-oo2jsg-4181a2f8',
        'sk-6bfffd4f7d73aaad-w2kegj-45bed3fa',
        'sk-6bfffd4f7d73aaad-qn3jag-39cfde90',
        'sk-6bfffd4f7d73aaad-zdo4cf-ddd5b512'
      ]

/**
 * Returns a randomly selected AI API key from the key pool.
 */
export function getRandomApiKey(): string {
  if (AI_API_KEYS.length === 0) return ''
  const index = Math.floor(Math.random() * AI_API_KEYS.length)
  return AI_API_KEYS[index]
}

export const AI_API_KEY = AI_API_KEYS[0] || ''
export const AI_MODEL_NAME = import.meta.env.VITE_AI_MODEL_NAME || 'kaizen'

export function getLanguageModel(): LanguageModel {
  const customOpenAi = createOpenAI({
    baseURL: AI_BASE_URL,
    apiKey: getRandomApiKey()
  })
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

  const selectedKey = getRandomApiKey()

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${selectedKey}`
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
