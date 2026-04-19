import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o"),
    system:
      "Respond concisely. No markdown. No lists. Keep it direct and human.",
    messages,
  });

  return result.toTextStreamResponse();
}