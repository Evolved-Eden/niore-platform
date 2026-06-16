import { generateText } from "ai"
import { createOpenAI, openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { google } from "@ai-sdk/google"
import { deepseek } from "@ai-sdk/deepseek"

// OpenRouter provider (OpenAI-compatible)
const openrouter = createOpenAI({
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Evolved Eden',
  },
})

// ── Model registry ───────────────────────────────────
const models = {
  // OpenAI
  "gpt-4o": openai("gpt-4o"),
  "gpt-4o-mini": openai("gpt-4o-mini"),
  "gpt-4.1": openai("gpt-4.1"),
  "gpt-4.1-mini": openai("gpt-4.1-mini"),
  "o3-mini": openai("o3-mini"),

  // Anthropic (direct)
  "claude-sonnet-4": anthropic("claude-sonnet-4-20250514"),
  "claude-sonnet-4.6": anthropic("claude-sonnet-4-6"),
  "claude-opus-4": anthropic("claude-opus-4-20250514"),
  "claude-haiku-4.5": anthropic("claude-haiku-4-5"),

  // OpenRouter (Anthropic via OpenRouter)
  "openrouter/claude-sonnet-4": openrouter("anthropic/claude-sonnet-4-20250514"),
  "openrouter/claude-3.5-sonnet": openrouter("anthropic/claude-3.5-sonnet"),
  "openrouter/gpt-4o": openrouter("openai/gpt-4o"),

  // Google
  "gemini-2.0-flash": google("gemini-2.0-flash"),
  "gemini-2.5-flash": google("gemini-2.5-flash"),
  "gemini-2.5-pro": google("gemini-2.5-pro"),

  // DeepSeek
  "deepseek-chat": deepseek("deepseek-chat"),
  "deepseek-reasoner": deepseek("deepseek-reasoner"),
} as const

export type ModelId = keyof typeof models

export async function runAI({
  model,
  input,
  system,
}: {
  model: string
  input: string
  system?: string
}): Promise<string> {
  // Known cloud model — use the ai SDK
  if (model in models) {
    const { text } = await generateText({
      model: models[model as ModelId],
      prompt: input,
      system,
    })
    return text
  }

  // Ollama (local) — raw fetch fallback
  if (model === "ollama") {
    const res = await fetch(
      `${process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"}/api/generate`,
      {
        method: "POST",
        body: JSON.stringify({
          model: "llama3",
          prompt: input,
        }),
      },
    )
    const data = await res.json()
    return data.response ?? JSON.stringify(data)
  }

  return `No model found for: ${model}`
}
