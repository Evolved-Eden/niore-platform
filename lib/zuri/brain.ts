import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function runZuriBrain(input: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
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