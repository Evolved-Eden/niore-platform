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
