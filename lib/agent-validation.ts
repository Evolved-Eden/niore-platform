// Shared by the bulk-import route (WF-202: validate on insert) and the
// admin agent PATCH route (WF-203: validate before allowing is_published=true).
// Automates the exact regression class found and fixed earlier this session:
// published agents with a null system_prompt, placeholder icon, or missing
// category.
// Field names here match the real agents table columns, not the
// agent_catalog view (which renames mas_category -> category and takes
// icon[1] as "icon").
export type AgentValidationInput = {
  system_prompt?: string | null
  icon?: string[] | null
  mas_category?: string | null
}

export function validateAgentForPublish(agent: AgentValidationInput): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  if (!agent.system_prompt || agent.system_prompt.trim().length === 0) {
    issues.push('missing_system_prompt')
  }

  const icon = Array.isArray(agent.icon) && agent.icon.length > 0 ? agent.icon[0] : null
  if (!icon || String(icon).trim().length === 0) {
    issues.push('placeholder_icon')
  }

  if (!agent.mas_category || agent.mas_category.trim().length === 0) {
    issues.push('missing_category')
  }

  return { valid: issues.length === 0, issues }
}
