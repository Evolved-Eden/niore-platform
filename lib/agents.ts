import { runAI } from "./ai";

export async function executeAgent(agent: any, input: string) {
  const model = agent.model || "gpt-4o";

  const response = await runAI({
    model,
    input,
    system: agent.system,
  });

  return response;
}
