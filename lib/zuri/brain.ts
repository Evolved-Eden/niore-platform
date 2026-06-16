import OpenAI from "openai";

const useOpenRouter = !!process.env.OPENROUTER_API_KEY

const client = new OpenAI({
  apiKey: useOpenRouter ? process.env.OPENROUTER_API_KEY! : process.env.OPENAI_API_KEY!,
  ...(useOpenRouter ? { baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1' } : {}),
})

export async function runZuriBrain(input: string) {
  const response = await client.chat.completions.create({
    model: useOpenRouter
      ? (process.env.OPENROUTER_ZURI_MODEL || 'anthropic/claude-sonnet-4-20250514')
      : (process.env.ZURI_MODEL || 'gpt-4.1-mini'),
    messages: [
      {
        role: "system",
        content:
          "You are Zuri, a high-level executive AI operating system. Strategic, precise, powerful.",
      },
      {
        role: "user",
        content: input,
      },
    ],
  });

  return response.choices[0].message.content;
}