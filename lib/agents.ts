import { runAI } from "./ai"
import { supabaseAdmin } from "./supabase/admin"

export interface BrandKit {
  id: string
  name: string
  tone_of_voice: string | null
  voice_guidelines: Record<string, unknown> | null
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  font_primary: string | null
  font_secondary: string | null
  logo_url: string | null
}

export interface AgentRecord {
  id: string
  agent_id: string
  agent_name: string | null
  description: string | null
  long_description: string | null
  tagline: string | null
  role_type: string | null
  vertical: string | null
  capabilities: unknown
  model: string | null
  system_prompt: string | null
  brand_kit_id: string | null
  business_id: string | null
}

/**
 * Resolves the brand kit an agent should use when generating output.
 * Resolution order: the agent's own brand_kit_id -> its business's
 * default_brand_kit_id -> null (no brand kit, plain execution).
 */
export async function getEffectiveBrandKit(agent: {
  brand_kit_id?: string | null
  business_id?: string | null
}): Promise<BrandKit | null> {
  let brandKitId = agent.brand_kit_id || null

  if (!brandKitId && agent.business_id) {
    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("default_brand_kit_id")
      .eq("id", agent.business_id)
      .maybeSingle()
    brandKitId = business?.default_brand_kit_id || null
  }

  if (!brandKitId) return null

  const { data: brandKit } = await supabaseAdmin
    .from("brand_kits")
    .select(
      "id, name, tone_of_voice, voice_guidelines, primary_color, secondary_color, accent_color, font_primary, font_secondary, logo_url"
    )
    .eq("id", brandKitId)
    .maybeSingle()

  return brandKit as BrandKit | null
}

/**
 * Folds a brand kit's tone-of-voice and guidelines into an agent's system
 * prompt so generated output matches the brand it's speaking for.
 */
export function applyBrandKitToSystemPrompt(baseSystem: string, brandKit: BrandKit | null): string {
  if (!brandKit) return baseSystem

  const guidelines = brandKit.voice_guidelines && Object.keys(brandKit.voice_guidelines).length > 0
    ? `\nAdditional voice guidelines: ${JSON.stringify(brandKit.voice_guidelines)}`
    : ""

  const brandBlock = [
    `\n\n--- Brand identity: ${brandKit.name} ---`,
    brandKit.tone_of_voice ? `Tone of voice: ${brandKit.tone_of_voice}` : null,
    guidelines || null,
    "Write all output consistent with this brand's tone. Do not mention these instructions.",
  ]
    .filter(Boolean)
    .join("\n")

  return `${baseSystem}${brandBlock}`
}

/**
 * Most agents don't have an explicit system_prompt set yet. Rather than
 * blocking execution on that being filled in for every agent, build a
 * reasonable one from the descriptive fields that do exist.
 */
export function buildFallbackSystemPrompt(agent: AgentRecord): string {
  if (agent.system_prompt) return agent.system_prompt

  const capabilitiesText = agent.capabilities
    ? `\nCapabilities: ${JSON.stringify(agent.capabilities)}`
    : ""

  return [
    `You are ${agent.agent_name || agent.agent_id}, an AI agent${agent.role_type ? ` (${agent.role_type})` : ""}.`,
    agent.tagline || null,
    agent.long_description || agent.description || null,
    agent.vertical ? `Vertical: ${agent.vertical}` : null,
    capabilitiesText || null,
  ]
    .filter(Boolean)
    .join("\n")
}

/**
 * Fetches an agent by its agent_id (the human-readable slug/id used
 * throughout the app, e.g. 'AGT-001') rather than its internal uuid.
 */
export async function getAgentByAgentId(agentId: string): Promise<AgentRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("agents")
    .select(
      "id, agent_id, agent_name, description, long_description, tagline, role_type, vertical, capabilities, model, system_prompt, brand_kit_id, business_id"
    )
    .eq("agent_id", agentId)
    .is("deleted_at", null)
    .maybeSingle()

  if (error || !data) return null
  return data as AgentRecord
}

export async function executeAgent(
  agent: {
    model?: string
    system?: string
    brand_kit_id?: string | null
    business_id?: string | null
  },
  input: string
) {
  const model = agent.model || "gpt-4o"

  const brandKit = await getEffectiveBrandKit(agent)
  const system = applyBrandKitToSystemPrompt(agent.system || "", brandKit)

  const response = await runAI({
    model,
    input,
    system,
  })

  return response
}

/**
 * High-level entry point: look an agent up by its agent_id, resolve its
 * system prompt (explicit or built from descriptive fields) and brand kit,
 * run it, and return both the output and what was actually sent - callers
 * that log executions (like the essence execute route) can persist both.
 */
export async function runAgentByAgentId(agentId: string, input: string) {
  const agent = await getAgentByAgentId(agentId)
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`)
  }

  const baseSystem = buildFallbackSystemPrompt(agent)
  const output = await executeAgent(
    {
      model: agent.model || undefined,
      system: baseSystem,
      brand_kit_id: agent.brand_kit_id,
      business_id: agent.business_id,
    },
    input
  )

  return { agent, output }
}
