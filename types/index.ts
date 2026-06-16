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
  biz_name?: string | null
  client_type?: string | null
  status?: string | null
  onboarding_status?: string | null
  plan_tier_key?: string | null
  plan_tier?: string | null
  access_mode_key?: string | null
  primary_vertical?: string | null
  vertical?: string | null
  dob?: string | null
  birth_location?: string | null
  hd_type?: string | null
  archetype?: string | null
  consultation_eligible?: boolean | null
  agent_deployments?: number | null
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
  ai_profile?: Record<string, unknown> | null
  preferences?: Record<string, unknown> | null
  behavior_profile?: Record<string, unknown> | null
  demographic_profile?: Record<string, unknown> | null
  psychographic_profile?: Record<string, unknown> | null
  behavioral_profile?: Record<string, unknown> | null
  geographic_profile?: Record<string, unknown> | null
  socioeconomic_profile?: Record<string, unknown> | null
  addons?: Record<string, unknown> | null
  parent_client_id?: string | null
  preferred_provider_id?: string | null
  primary_business_id?: string | null
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
  engagement_score?: number | null
  loyalty_score?: number | null
  lifetime_value?: number | null
  risk_score?: number | null
  confidence_score?: number | null
  twin_status?: string | null
  version?: number
  blueprint_score?: number | null
  metadata?: Record<string, unknown> | null
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
      users: TableWithDefaults<User>
      identities: TableWithDefaults<Identity>
      organizations: TableWithDefaults<Organization>
      organization_memberships: TableWithDefaults<OrganizationMembership>
      businesses: TableWithDefaults<Business>
      clients: TableWithDefaults<Client>
      memberships: TableWithDefaults<Membership>
      membership_tiers: TableWithDefaults<MembershipTier>
      tier_entitlements: TableWithDefaults<TierEntitlement>
      entitlements: TableWithDefaults<Entitlement>
      intelligence_profiles: TableWithDefaults<IntelligenceProfile>
      client_twins: TableWithDefaults<ClientTwin>
      ai_memories: TableWithDefaults<AIMemory>
      canonical_agent_map: TableWithDefaults<CanonicalAgent>
      omnigrid_intelligence_system: TableWithDefaults<OmnigridSystem>
      knowledge_base: TableWithDefaults<KnowledgeBaseEntry>
      notification_logs: TableWithDefaults<NotificationLog>
      blueprint_templates: TableWithDefaults<BlueprintTemplateRow>
      essence_templates: TableWithDefaults<EssenceTemplateRow>
      ris_templates: TableWithDefaults<RISTemplateRow>
      verticals: TableWithDefaults<VerticalRow>
      vertical_subs: TableWithDefaults<VerticalSubRow>
      agent_types: TableWithDefaults<AgentTypeRow>
      swarm_templates: TableWithDefaults<SwarmTemplateRow>
      catalogs: TableWithDefaults<{ id: string; key: string; name: string; kind?: string; is_active?: boolean; metadata?: unknown; created_at?: string; updated_at?: string }>
      blueprint_deployments: TableWithDefaults<BlueprintDeployment>
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
