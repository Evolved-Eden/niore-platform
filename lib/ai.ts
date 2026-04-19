export async function runAI({
  model,
  input,
}: {
  model: string;
  input: string;
}) {
  if (model === "gemini") {
    return fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: input }] }],
      }),
    }).then(res => res.json());
  }

  if (model === "ollama") {
    return fetch(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      body: JSON.stringify({
        model: "llama3",
        prompt: input,
      }),
    }).then(res => res.json());
  }

  return `Zuri fallback: ${input}`;
}