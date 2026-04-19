import { runAI } from "./ai";

export async function executeAgent(agent: any, input: string) {
  const model = agent.model || "gemini";

  const response = await runAI({
    model,
    input,
  });

  return response;
}