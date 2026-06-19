// ============================================================
// Core Types — Evolved Eden
// ============================================================

// ── Blueprint System ─────────────────────────────────────────
export type BlueprintQuestionType = 'select' | 'multi_select' | 'scale' | 'text' | 'boolean'

export type BlueprintQuestionOption = {
  value: string
  label: string
  description?: string
  weight?: number
  followUpSection?: string
}

export type BlueprintQuestion = {
  key: string
  type: BlueprintQuestionType
  label: string
  description?: string
  required?: boolean
  options?: BlueprintQuestionOption[]
  dependency?: { questionKey: string; operator: 'equals' | 'not_equals' | 'contains' | 'gte' | 'lte'; value: unknown }
  domain?: string
  weight?: number
  scaleMin?: number
  scaleMax?: number
}

export type BlueprintSection = {
  key: string
  title: string
  description?: string
  order: number
  questions: BlueprintQuestion[]
}

export type ScoringDomain = {
  key: string
  name: string
  weight: number
  thresholds: { min: number; label?: string; agents?: string[]; swarms?: string[] }[]
}

export type BlueprintTemplateContent = {
  version: string
  sections: BlueprintSection[]
  scoring: { domains: ScoringDomain[] }
  recommendations: {
    agents: string[]
    swarms: string[]
    essenceTemplate?: string
    risTemplate?: string
  }
}

export type BlueprintDeployment = {
  id: string
  organization_id: string
  client_id?: string | null
  blueprint_template_id: string
  vertical_key: string
  subcategory_key?: string | null
  status: string
  assessment_scores: Record<string, number>
  assessment_answers: Record<string, unknown>
  selected_agents: string[]
  selected_swarms: string[]
  blueprint_summary?: string | null
  n8n_workflow_id?: string | null
  created_at: string
  updated_at: string
  deployed_at?: string | null
}

// ── Schema-backed types for generic query support ────────────
export type BlueprintTemplateRow = {
  id: string
  key: string
  name?: string | null
  description?: string | null
  vertical_id?: string | null
  vertical_key?: string | null
  subcategory_key?: string | null
  is_active?: boolean | null
  sections_json?: unknown
  template_json?: unknown
  created_at?: string
  updated_at?: string
}

export type EssenceTemplateRow = {
  id: string
  key: string
  name?: string | null
  description?: string | null
  vertical_id?: string | null
  vertical_key?: string | null
  sections_json?: unknown
  template_json?: unknown
  is_active?: boolean | null
  created_at?: string
  updated_at?: string
}

export type RISTemplateRow = {
  id: string
  key: string
  name?: string | null
  description?: string | null
  vertical_id?: string | null
  vertical_key?: string | null
  signal_weights_json?: unknown
  template_json?: unknown
  is_active?: boolean | null
  created_at?: string
  updated_at?: string
}

export type VerticalRow = {
  id: string
  key?: string | null
  name?: string | null
  slug?: string | null
  icon?: string | null
  description?: string | null
  metadata?: unknown
  is_active?: boolean | null
  created_at?: string
  updated_at?: string
}

export type VerticalSubRow = {
  id: string
  key?: string | null
  vertical_id?: string | null
  vertical_key?: string | null
  name?: string | null
  description?: string | null
  slug?: string | null
  is_active?: boolean | null
  created_at?: string
  updated_at?: string
}

export type AgentTypeRow = {
  id: string
  key?: string | null
  name?: string | null
  category?: string | null
  description?: string | null
  capabilities?: unknown
  runtime_type?: string | null
  canonical_vertical_slug?: string | null
  canonical_template?: string | null
  is_active?: boolean | null
  created_at?: string
}

export type SwarmTemplateRow = {
  id: string
  key?: string | null
  swarm_key?: string | null
  name?: string | null
  swarm_name?: string | null
  description?: string | null
  orchestration_rules?: unknown
  template_json?: unknown
  is_active?: boolean | null
  metadata?: unknown
  vertical_key?: string | null
  created_at?: string
  updated_at?: string
}

export type UserRole = 'admin' | 'client' | 'creator' | 'personal' | 'affiliate'

// ── Users & Identity ────────────────────────────────────────
export type User = {
  id: string
  organization_id?: string | null
  full_name?: string | null
  email?: string | null
  phone?: string | null
  role?: string | null
  avatar_url?: string | null
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export type Identity = {
  id: string
  auth_user_id?: string | null
  primary_email?: string | null
  display_name?: string | null
  identity_type?: string | null
  created_at?: string
}

export type Organization = {
  id: string
  name?: string
  slug?: string
  industry?: string | null
  subindustry?: string | null
  logo_url?: string | null
  website?: string | null
  timezone?: string | null
  subscription_plan?: string | null
  subscription_status?: string | null
  plan_tier_key?: string | null
  access_mode_key?: string | null
  settings?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  addons?: Record<string, unknown> | null
  owner_id?: string | null
  tier?: string | null
  status?: string | null
  billing_email?: string | null
  phone?: string | null
  tax_id?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export type OrganizationMembership = {
  id: string
  user_id: string
  organization_id: string
  role: string
  status: string
  invited_by?: string | null
  invited_at?: string | null
  joined_at?: string | null
  created_at?: string
  updated_at?: string
}

export type Business = {
  id: string
  organization_id?: string
  name?: string
  slug?: string
  vertical_id?: string | null
  onboarding_status?: string | null
  metadata?: Record<string, unknown> | null
  specialty_ids?: string[] | null
  ai_enabled?: boolean
  orchestration_enabled?: boolean
  recommendation_enabled?: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export type Client = {
  id: string
  organization_id?: string | null
  full_name?: string | null
  email?: string | null
  phone?: string | null
  first_name?: string | null
  last_name?: string | null
  business_name?: string | null
  client_type?: string | null
  status?: string | null
  onboarding_status?: string | null
  plan_tier_key?: string | null
  access_mode_key?: string | null
  primary_vertical?: string | null
  birthday?: string | null
  agent_deployments?: number | null
  consultation_booked?: string | null
  zuri_discord_connected?: boolean | null
  zuri_whatsapp_connected?: boolean | null
  zuri_connected?: boolean | null
  specialties?: string[] | null
  tags?: string[] | null
  vip_level?: string | null
  total_spend?: number | null
  lifetime_value?: number | null
  referral_score?: number | null
  recommendation_score?: number | null
  lifecycle_stage?: string | null
  notes?: string | null
  metadata?: Record<string, unknown> | null
  client_twin?: Record<string, unknown> | null
  preferences?: Record<string, unknown> | null
  behavior_profile?: Record<string, unknown> | null
  behavioral_state?: Record<string, unknown> | null
  memory_summary?: Record<string, unknown> | null
  interaction_style?: Record<string, unknown> | null
  personalization_config?: Record<string, unknown> | null
  identity_vector?: Record<string, unknown> | null
  segment_vector?: Record<string, unknown> | null
  demographic_profile?: Record<string, unknown> | null
  psychographic_profile?: Record<string, unknown> | null
  behavioral_profile?: Record<string, unknown> | null
  geographic_profile?: Record<string, unknown> | null
  socioeconomic_profile?: Record<string, unknown> | null
  addons?: Record<string, unknown> | null
  additional_plans?: string[] | null
  parent_client_id?: string | null
  preferred_provider_id?: string | null
  primary_business_id?: string | null
  client_id?: string | null
  agent_id?: string | null
  created_by?: string | null
  updated_by?: string | null
  slug?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export type Membership = {
  id: string
  organization_id?: string
  user_id?: string | null
  membership_tier_id?: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  status?: string
  is_trial?: boolean
  starts_at?: string | null
  renews_at?: string | null
  expires_at?: string | null
  trial_ends_at?: string | null
  canceled_at?: string | null
  created_at?: string
  updated_at?: string
}

export type MembershipTier = {
  id: string
  key?: string
  name?: string
  description?: string | null
  category?: string | null
  billing_interval?: string | null
  sort_order?: number
  features?: Record<string, unknown> | null
  is_organization?: boolean
  is_creator?: boolean
  max_vertical_agents?: number
  max_custom_agents?: number
  max_swarm_capacity?: number
  max_workflows?: number
  max_memory_gbs?: number
  price_range?: string | null
  price_sweet_spot?: string | null
  status?: string | null
  created_at?: string
  updated_at?: string
}

export type TierEntitlement = {
  id: string
  plan_key?: string
  category?: string | null
  max_vertical_agents?: number
  max_custom_agents?: number
  max_agents?: number
  max_swarm_capacity?: number
  max_swarms?: number
  max_workflows?: number
  max_workflow_runs_monthly?: number
  max_api_calls_monthly?: number
  max_storage_gb?: number
  max_memory_gbs?: number
  can_use_legal_addon?: boolean
  can_use_wealth_addon?: boolean
  can_use_luxury_hospitality_addon?: boolean
  can_use_creator_commerce_addon?: boolean
  can_use_custom_branding?: boolean
  can_use_analytics?: boolean
  can_use_api_access?: boolean
  can_use_white_label?: boolean
  can_use_priority_support?: boolean
  can_use_dedicated_infrastructure?: boolean
  can_use_sla?: boolean
  status?: string | null
  created_at?: string
  updated_at?: string
}

export type Entitlement = {
  organization_id: string
  feature_key: string
  limit_value: number
  usage_count?: number
  is_enabled?: boolean
  source_type?: string | null
  updated_at?: string
}

export type IntelligenceProfile = {
  id: string
  entity_type?: string
  entity_id?: string
  organization_id?: string | null
  profile_kind?: string | null
  identity_summary?: string | null
  daily_essence?: string | null
  personality_traits?: Record<string, unknown> | null
  communication_style?: Record<string, unknown> | null
  motivators?: Record<string, unknown> | null
  goals?: Record<string, unknown> | null
  interests?: Record<string, unknown> | null
  behavior_patterns?: Record<string, unknown> | null
  emotional_patterns?: Record<string, unknown> | null
  decision_patterns?: Record<string, unknown> | null
  relationship_patterns?: Record<string, unknown> | null
  preferences?: Record<string, unknown> | null
  taxonomy_data?: Record<string, unknown> | null
  confidence_score?: number | null
  version?: number
  profile_type?: string | null
  human_profile_id?: string | null
  created_at?: string
  updated_at?: string
}

export type ClientTwin = {
  id: string
  client_id?: string | null
  organization_id?: string | null
  business_id?: string | null
  personality_summary?: string | null
  preference_summary?: string | null
  communication_style?: string | null
  luxury_profile?: string | null
  wellness_profile?: string | null
  spending_profile?: string | null
  recommendation_profile?: Record<string, unknown> | null
  personality_traits?: Record<string, unknown> | null
  lifestyle_preferences?: Record<string, unknown> | null
  wellness_preferences?: Record<string, unknown> | null
  luxury_preferences?: Record<string, unknown> | null
  spiritual_preferences?: Record<string, unknown> | null
  engagement_score?: number | null
  loyalty_score?: number | null
  lifetime_value?: number | null
  risk_score?: number | null
  confidence_score?: number | null
  twin_status?: string | null
  version?: number
  blueprint_score?: number | null
  ai_summary?: string | null
  predicted_needs?: unknown[] | null
  relationship_graph?: Record<string, unknown> | null
  learning_state?: Record<string, unknown> | null
  memory_summary?: string | null
  essence_summary?: string | null
  daily_board_summary?: string | null
  email?: string | null
  intelligence_score?: number | null
  intelligence_state?: string | null
  mas_vector?: Record<string, unknown> | null
  preferred_verticals?: string[] | null
  memory_score?: number | null
  mas_score?: Record<string, unknown> | null
  mas_state?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  life_model?: Record<string, unknown> | null
  blueprint?: Record<string, unknown> | null
  updated_at?: string
  deleted_at?: string | null
}

export type AIMemory = {
  id: string
  entity_type?: string | null
  entity_id?: string | null
  memory_type?: string | null
  content?: string | null
  title?: string | null
  content_type?: string | null
  metadata?: Record<string, unknown> | null
  organization_id?: string | null
  client_id?: string | null
  created_at?: string
}

export type CanonicalAgent = {
  slug?: string
  name?: string
  vertical?: string | null
  canonical_vertical_slug?: string | null
  canonical_template?: string | null
  is_master?: boolean
  is_bridge?: boolean
  agent_type_key?: string | null
}

export type OmnigridSystem = {
  id: string
  slug?: string
  name?: string
  system_number?: number | null
  tagline?: string | null
  description?: string | null
  system_version?: string
  lens_key?: string
  lens_name?: string | null
  domain_key?: string | null
  domain_name?: string | null
  is_active?: boolean
  requires_tier?: string
  created_at?: string
}

export type KnowledgeBaseEntry = {
  id: string
  org_id?: string | null
  title?: string | null
  content?: string | null
  vertical?: string | null
  specialty?: string | null
  source_type?: string | null
  source_id?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
}

export type NotificationLog = {
  id: string
  organization_id?: string | null
  client_id?: string | null
  business_id?: string | null
  notification_type?: string | null
  channel?: string | null
  recipient?: string | null
  subject?: string | null
  message?: string | null
  delivery_status?: string | null
  provider_response?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  created_by?: string | null
  updated_by?: string | null
  sent_at?: string | null
  created_at?: string
}

// ── Missing tables (created by migration 00019) ─────────────
export type HumanProfileRow = {
  id: string
  user_id?: string | null
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  identity_summary?: string | null
  daily_essence?: string | null
  created_at?: string
  updated_at?: string
}

export type AITwinRow = {
  id: string
  human_profile_id?: string | null
  intelligence_profile_id?: string | null
  client_id?: string | null
  twin_name?: string | null
  twin_type?: string | null
  active?: boolean | null
  created_at?: string
  updated_at?: string
}

export type ClientDeployedAgentRow = {
  id: string
  client_id?: string | null
  agent_id?: string | null
  agent_name: string
  role_type?: string | null
  vertical?: string | null
  prompt?: string | null
  intelligence_docs?: Record<string, unknown> | null
  profile_image?: string | null
  deployment_status?: string | null
  metadata?: Record<string, unknown> | null
  status?: string | null
  created_at?: string
  updated_at?: string
}

export type EssenceIntelligenceRow = {
  id: string
  client_id?: string | null
  content?: string | null
  type?: string | null
  status?: string | null
  created_at?: string
}

export type CanonicalAgentMapRow = {
  id: string
  slug?: string | null
  name?: string | null
  vertical?: string | null
  canonical_vertical_slug?: string | null
  canonical_template?: string | null
  is_master?: boolean | null
  is_bridge?: boolean | null
  agent_type_key?: string | null
  created_at?: string
}

export type WorkflowDemoRow = {
  id: string
  vertical?: string | null
  name?: string | null
  description?: string | null
  workflow_json?: Record<string, unknown> | null
  stages?: unknown[] | null
  category?: string | null
  tags?: string[] | null
  n8n_webhook_url?: string | null
  is_active?: boolean | null
  run_status?: string | null
  last_run_at?: string | null
  created_at?: string
  updated_at?: string
}

export type WorkflowRunLogRow = {
  id: string
  workflow_id?: string | null
  client_id?: string | null
  status?: string | null
  triggered_by?: string | null
  started_at?: string | null
  completed_at?: string | null
  logs?: unknown[] | null
  error_message?: string | null
  created_at?: string
}

export type AppConfigRow = {
  key: string
  value: string
  value_type?: string | null
  category?: string | null
  description?: string | null
  updated_at?: string
}

export type ClientConsultationRow = {
  id: string
  client_id?: string | null
  scheduled_at: string
  duration_min?: number | null
  consultation_type: string
  notes?: string | null
  meeting_link?: string | null
  zuri_followup?: boolean | null
  status?: string | null
  created_at?: string
  updated_at?: string
}

export type ClientZuriSessionRow = {
  id: string
  client_id?: string | null
  platform: string
  platform_id?: string | null
  session_status?: string | null
  last_interaction?: string | null
  created_at?: string
  updated_at?: string
}

// ── Additional DB table types ──────────────────────────────
export type Agent = {
  id: string
  organization_id?: string | null
  client_id?: string | null
  agent_name?: string | null
  agent_id?: string | null
  agent_type?: string | null
  role_type?: string | null
  slug?: string | null
  status?: string | null
  description?: string | null
  tagline?: string | null
  model?: string | null
  temperature?: number | null
  max_tokens?: number | null
  configuration?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  capabilities?: Record<string, unknown> | null
  specialties?: string[] | null
  vertical?: string | null
  vertical_subs?: string[] | null
  archetype_id?: string | null
  avatar_id?: string | null
  avatar?: string | null
  icon?: string[] | null
  primary_template?: string | null
  secondary_template?: string | null
  autonomy_level?: string | null
  authority_level?: string | null
  risk_level?: string | null
  decision_mode?: string | null
  decision_mode_id?: string | null
  is_platform?: string | null
  is_system_agent?: boolean | null
  orchestration_mode?: string | null
  orchestration_enabled?: boolean | null
  orchestration_config?: Record<string, unknown> | null
  memory_enabled?: boolean | null
  autonomous_enabled?: boolean | null
  health_status?: string | null
  evolution_status?: string | null
  mas_category?: string | null
  mas_priority?: string | null
  mas_score?: number | null
  mas_vector?: Record<string, unknown> | null
  mas_state?: string | null
  tools?: string | null
  connectors?: string | null
  outputs?: string[] | null
  triggers?: string[] | null
  source?: Record<string, unknown> | null
  created_by?: string | null
  updated_by?: string | null
  business_id?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export type AgentGeneratorRow = {
  generator_id: string
  generator_name: string
  generator_type: string
  config: Record<string, unknown>
  is_active?: boolean | null
  created_at?: string
  agent_id?: string | null
}

export type AgentRegistryRow = {
  id: string
  agent_id: string
  name: string
  tagline?: string | null
  description?: string | null
  long_description?: string | null
  icon?: string | null
  color?: string | null
  capabilities?: string[] | null
  vertical_ids?: string[] | null
  triggers?: string[] | null
  data_sources?: string[] | null
  outputs?: string[] | null
  workflow_ids?: string[] | null
  agent_type?: string | null
  category?: string | null
  is_active?: boolean | null
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export type AgentSwarmRow = {
  agent_swarm_id: string
  organization_id?: string | null
  swarm_name?: string | null
  swarm_slug?: string | null
  name?: string | null
  slug?: string | null
  description?: string | null
  orchestration_strategy?: string | null
  primary_objective?: string | null
  memory_enabled?: boolean | null
  autonomous_enabled?: boolean | null
  vertical_slug?: string | null
  swarm_type?: string | null
  client_id?: string | null
  active_agents?: number | null
  activation_score?: number | null
  activity_state?: string | null
  health_score?: number | null
  evolution_score?: number | null
  mas_score?: number | null
  mas_state?: string | null
  orchestration_mode?: string | null
  orchestration_config?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  swarm_state?: Record<string, unknown> | null
  swarm_meta?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export type ArchetypeRow = {
  archetype_id: string
  archetype_name: string
  description?: string | null
  base_capability?: number | null
  base_trust?: number | null
  base_synergy?: number | null
  base_activation?: number | null
  base_evolution?: number | null
  base_risk?: number | null
  category?: string | null
  default_avatar?: string | null
  default_decision_mode?: string | null
}

export type AvatarRow = {
  id: string
  name: string
  system?: string | null
  bio?: string | null
  tone_tags?: string[] | null
  keywords?: string[] | null
  is_active?: boolean | null
  sort_order?: number | null
  avatar_key?: string | null
  avatar_id?: string | null
  archetypes?: string | null
  created_at?: string
  updated_at?: string
}

export type ConnectorAccountRow = {
  id: string
  organization_id?: string | null
  business_id?: string | null
  connector_type: string
  account_name?: string | null
  access_token?: string | null
  refresh_token?: string | null
  token_expires_at?: string | null
  external_account_id?: string | null
  scopes?: string[] | null
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export type ConnectorCredentialRow = {
  id: string
  connector_id?: string | null
  organization_id?: string | null
  client_id?: string | null
  encrypted_credentials: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export type EvolvedEdenAgentRow = {
  agent_id: string
  agent_name: string
  vertical?: string | null
  subvertical?: string | null
  role_type?: string | null
  archetype_id?: number | null
  archetype_name?: string | null
  avatar?: string | null
  primary_template?: string | null
  secondary_template?: string | null
  primary_system_range?: string | null
  secondary_system_range?: string | null
  tertiary_system_range?: string | null
  generator_models?: string[] | null
  capability?: number | null
  trust?: number | null
  activation?: number | null
  synergy?: number | null
  risk?: number | null
  evolution?: number | null
  reported_mas?: number | null
  mas?: number | null
  health_status?: string | null
  imported_at?: string
  updated_at?: string
}

// ============================================================
// Database type for Supabase client — GenericSchema format
// ============================================================
type TableWithDefaults<T> = {
  Row: T
  Insert: Partial<T>
  Update: Partial<T>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      agents: TableWithDefaults<Agent>
      agent_generators: TableWithDefaults<AgentGeneratorRow>
      agent_registry: TableWithDefaults<AgentRegistryRow>
      agent_swarms: TableWithDefaults<AgentSwarmRow>
      agent_types: TableWithDefaults<AgentTypeRow>
      ai_memories: TableWithDefaults<AIMemory>
      ai_twins: TableWithDefaults<AITwinRow>
      app_config: TableWithDefaults<AppConfigRow>
      archetypes: TableWithDefaults<ArchetypeRow>
      avatars: TableWithDefaults<AvatarRow>
      blueprint_deployments: TableWithDefaults<BlueprintDeployment>
      blueprint_templates: TableWithDefaults<BlueprintTemplateRow>
      businesses: TableWithDefaults<Business>
      canonical_agent_map: TableWithDefaults<CanonicalAgentMapRow>
      catalogs: TableWithDefaults<{ id: string; key: string; name: string; kind?: string; is_active?: boolean; metadata?: unknown; created_at?: string; updated_at?: string }>
      client_consultations: TableWithDefaults<ClientConsultationRow>
      client_deployed_agents: TableWithDefaults<ClientDeployedAgentRow>
      client_twins: TableWithDefaults<ClientTwin>
      client_zuri_sessions: TableWithDefaults<ClientZuriSessionRow>
      clients: TableWithDefaults<Client>
      connector_accounts: TableWithDefaults<ConnectorAccountRow>
      connector_credentials: TableWithDefaults<ConnectorCredentialRow>
      entitlements: TableWithDefaults<Entitlement>
      essence_intelligence: TableWithDefaults<EssenceIntelligenceRow>
      essence_templates: TableWithDefaults<EssenceTemplateRow>
      evolved_eden_agents: TableWithDefaults<EvolvedEdenAgentRow>
      human_profiles: TableWithDefaults<HumanProfileRow>
      identities: TableWithDefaults<Identity>
      intelligence_profiles: TableWithDefaults<IntelligenceProfile>
      knowledge_base: TableWithDefaults<KnowledgeBaseEntry>
      membership_tiers: TableWithDefaults<MembershipTier>
      memberships: TableWithDefaults<Membership>
      notification_logs: TableWithDefaults<NotificationLog>
      omnigrid_intelligence_system: TableWithDefaults<OmnigridSystem>
      organization_memberships: TableWithDefaults<OrganizationMembership>
      organizations: TableWithDefaults<Organization>
      ris_templates: TableWithDefaults<RISTemplateRow>
      swarm_templates: TableWithDefaults<SwarmTemplateRow>
      tier_entitlements: TableWithDefaults<TierEntitlement>
      users: TableWithDefaults<User>
      vertical_subs: TableWithDefaults<VerticalSubRow>
      verticals: TableWithDefaults<VerticalRow>
      workflow_demos: TableWithDefaults<WorkflowDemoRow>
      workflow_run_logs: TableWithDefaults<WorkflowRunLogRow>
    }
    Views: Record<string, never>
    Functions: {
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      is_org_owner: { Args: { org_id: string }; Returns: boolean }
      check_entitlement: { Args: { org_uuid: string; entitlement_key_param: string }; Returns: unknown }
      increment_entitlement_usage: { Args: { org_uuid: string; entitlement_key_param: string }; Returns: unknown }
      increment_entitlement_usage_custom: { Args: { org_uuid: string; entitlement_key_param: string; increment_by: number }; Returns: unknown }
      decrement_entitlement_usage: { Args: { org_uuid: string; entitlement_key_param: string }; Returns: unknown }
      decrement_entitlement_usage_custom: { Args: { org_uuid: string; entitlement_key_param: string; decrement_by: number }; Returns: unknown }
      admin_create_user: { Args: { p_email: string; p_password: string; p_full_name?: string; p_role?: string }; Returns: string }
    }
    Enums: Record<string, never>
  }
}
