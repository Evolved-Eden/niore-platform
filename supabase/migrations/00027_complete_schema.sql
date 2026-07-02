-- ============================================================
-- Migration 00027: Complete Schema — create ALL tables the
-- codebase expects but no migration ever created.
--
-- This is SAFE to run on any database. Every CREATE TABLE uses
-- IF NOT EXISTS, and every column addition uses IF NOT EXISTS.
-- Tables/columns that already exist are skipped.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1. CORE BUSINESS
-- ════════════════════════════════════════════════════════════

-- 1a. organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text,
  slug                  text,
  industry              text,
  subindustry           text,
  logo_url              text,
  website               text,
  timezone              text,
  subscription_plan     text,
  subscription_status   text,
  plan_tier_key         text,
  access_mode_key       text,
  settings              jsonb DEFAULT '{}'::jsonb,
  metadata              jsonb DEFAULT '{}'::jsonb,
  addons                jsonb DEFAULT '{}'::jsonb,
  owner_id              text,
  tier                  text,
  status                text,
  billing_email         text,
  phone                 text,
  tax_id                text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  deleted_at            timestamptz
);

-- 1b. organization_memberships
CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id   uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  role              text NOT NULL DEFAULT 'member',
  status            text NOT NULL DEFAULT 'active',
  invited_by        text,
  invited_at        timestamptz,
  joined_at         timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- 1c. users (public.users mirroring auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id   uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name         text,
  email             text,
  phone             text,
  role              text DEFAULT 'client',
  avatar_url        text,
  metadata          jsonb DEFAULT '{}'::jsonb,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- 1d. clients
CREATE TABLE IF NOT EXISTS public.clients (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name               text,
  email                   text,
  phone                   text,
  first_name              text,
  last_name               text,
  business_name           text,
  client_type             text,
  status                  text DEFAULT 'active',
  onboarding_status       text,
  plan_tier_key           text,
  access_mode_key         text,
  primary_vertical        text,
  birthday                date,
  agent_deployments       integer DEFAULT 0,
  consultation_booked     timestamptz,
  zuri_discord_connected  boolean DEFAULT false,
  zuri_whatsapp_connected boolean DEFAULT false,
  zuri_connected          boolean DEFAULT false,
  specialties             text[] DEFAULT '{}',
  tags                    text[] DEFAULT '{}',
  vip_level               text,
  total_spend             numeric DEFAULT 0,
  lifetime_value          numeric DEFAULT 0,
  referral_score          numeric DEFAULT 0,
  recommendation_score    numeric DEFAULT 0,
  lifecycle_stage         text,
  notes                   text,
  metadata                jsonb DEFAULT '{}'::jsonb,
  client_twin             jsonb DEFAULT '{}'::jsonb,
  preferences             jsonb DEFAULT '{}'::jsonb,
  behavior_profile        jsonb DEFAULT '{}'::jsonb,
  behavioral_state        jsonb DEFAULT '{}'::jsonb,
  memory_summary          jsonb DEFAULT '{}'::jsonb,
  interaction_style       jsonb DEFAULT '{}'::jsonb,
  personalization_config  jsonb DEFAULT '{}'::jsonb,
  identity_vector         jsonb DEFAULT '{}'::jsonb,
  segment_vector          jsonb DEFAULT '{}'::jsonb,
  demographic_profile     jsonb DEFAULT '{}'::jsonb,
  psychographic_profile   jsonb DEFAULT '{}'::jsonb,
  behavioral_profile      jsonb DEFAULT '{}'::jsonb,
  geographic_profile      jsonb DEFAULT '{}'::jsonb,
  socioeconomic_profile   jsonb DEFAULT '{}'::jsonb,
  addons                  jsonb DEFAULT '{}'::jsonb,
  additional_plans        text[] DEFAULT '{}',
  parent_client_id        text,
  preferred_provider_id   text,
  primary_business_id     text,
  client_id               text,
  agent_id                text,
  created_by              text,
  updated_by              text,
  slug                    text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  deleted_at              timestamptz
);

-- 1e. businesses
CREATE TABLE IF NOT EXISTS public.businesses (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name                    text,
  slug                    text,
  vertical_id             text,
  onboarding_status       text,
  metadata                jsonb DEFAULT '{}'::jsonb,
  specialty_ids           text[] DEFAULT '{}',
  ai_enabled              boolean DEFAULT false,
  orchestration_enabled   boolean DEFAULT false,
  recommendation_enabled  boolean DEFAULT false,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  deleted_at              timestamptz
);

-- 1f. verticals
CREATE TABLE IF NOT EXISTS public.verticals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text,
  name        text,
  slug        text,
  icon        text,
  description text,
  metadata    jsonb DEFAULT '{}'::jsonb,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 1g. vertical_subs
CREATE TABLE IF NOT EXISTS public.vertical_subs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key           text,
  vertical_id   uuid REFERENCES public.verticals(id) ON DELETE SET NULL,
  vertical_key  text,
  name          text,
  description   text,
  slug          text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 2. AGENTS
-- ════════════════════════════════════════════════════════════

-- 2a. agents
CREATE TABLE IF NOT EXISTS public.agents (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         text,
  client_id               text,
  agent_name              text,
  agent_id                text,
  agent_type              text,
  role_type               text,
  slug                    text,
  status                  text DEFAULT 'active',
  description             text,
  tagline                 text,
  model                   text,
  temperature             numeric,
  max_tokens              integer,
  configuration           jsonb DEFAULT '{}'::jsonb,
  metadata                jsonb DEFAULT '{}'::jsonb,
  capabilities            jsonb DEFAULT '{}'::jsonb,
  specialties             text[] DEFAULT '{}',
  vertical                text,
  vertical_subs           text[] DEFAULT '{}',
  archetype_id            text,
  avatar_id               text,
  avatar                  text,
  icon                    text[] DEFAULT '{}',
  primary_template        text,
  secondary_template      text,
  autonomy_level          text,
  authority_level         text,
  risk_level              text,
  decision_mode           text,
  decision_mode_id        text,
  is_platform             text,
  is_system_agent         boolean DEFAULT false,
  is_published            boolean DEFAULT false,
  orchestration_mode      text,
  orchestration_enabled   boolean DEFAULT false,
  orchestration_config    jsonb DEFAULT '{}'::jsonb,
  memory_enabled          boolean DEFAULT false,
  autonomous_enabled      boolean DEFAULT false,
  health_status           text,
  evolution_status        text,
  mas_category            text,
  mas_priority            text,
  mas_score               numeric,
  mas_vector              jsonb DEFAULT '{}'::jsonb,
  mas_state               text,
  tools                   text,
  connectors              text,
  outputs                 text[] DEFAULT '{}',
  triggers                text[] DEFAULT '{}',
  source                  jsonb DEFAULT '{}'::jsonb,
  long_description        text,
  created_by              text,
  updated_by              text,
  business_id             text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  deleted_at              timestamptz
);

-- 2b. agent_generators
CREATE TABLE IF NOT EXISTS public.agent_generators (
  generator_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generator_name  text NOT NULL,
  generator_type  text NOT NULL,
  config          jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active       boolean DEFAULT true,
  agent_id        text,
  created_at      timestamptz DEFAULT now()
);

-- 2c. agent_registry
CREATE TABLE IF NOT EXISTS public.agent_registry (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        text NOT NULL,
  name            text NOT NULL,
  tagline         text,
  description     text,
  long_description text,
  icon            text,
  color           text,
  capabilities    text[] DEFAULT '{}',
  vertical_ids    text[] DEFAULT '{}',
  triggers        text[] DEFAULT '{}',
  data_sources    text[] DEFAULT '{}',
  outputs         text[] DEFAULT '{}',
  workflow_ids    text[] DEFAULT '{}',
  agent_type      text,
  category        text,
  is_active       boolean DEFAULT true,
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 2d. agent_types
CREATE TABLE IF NOT EXISTS public.agent_types (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key                       text,
  name                      text,
  category                  text,
  description               text,
  capabilities              jsonb DEFAULT '{}'::jsonb,
  runtime_type              text,
  canonical_vertical_slug   text,
  canonical_template        text,
  is_active                 boolean DEFAULT true,
  created_at                timestamptz DEFAULT now()
);

-- 2e. ai_memories
CREATE TABLE IF NOT EXISTS public.ai_memories (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type       text,
  entity_id         text,
  memory_type       text,
  content           text,
  title             text,
  content_type      text,
  metadata          jsonb DEFAULT '{}'::jsonb,
  organization_id   text,
  client_id         text,
  created_at        timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 3. SWARMS
-- ════════════════════════════════════════════════════════════

-- 3a. agent_swarms
CREATE TABLE IF NOT EXISTS public.agent_swarms (
  agent_swarm_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         text,
  swarm_name              text,
  swarm_slug              text,
  name                    text,
  slug                    text,
  description             text,
  orchestration_strategy  text,
  primary_objective       text,
  memory_enabled          boolean DEFAULT false,
  autonomous_enabled      boolean DEFAULT false,
  vertical_slug           text,
  swarm_type              text,
  client_id               text,
  active_agents           integer DEFAULT 0,
  activation_score        numeric,
  activity_state          text,
  health_score            numeric,
  evolution_score         numeric,
  mas_score               numeric,
  mas_state               text,
  orchestration_mode      text,
  orchestration_config    jsonb DEFAULT '{}'::jsonb,
  metadata                jsonb DEFAULT '{}'::jsonb,
  swarm_state             jsonb DEFAULT '{}'::jsonb,
  swarm_meta              jsonb DEFAULT '{}'::jsonb,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- 3b. swarm_templates
CREATE TABLE IF NOT EXISTS public.swarm_templates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key                 text,
  swarm_key           text,
  name                text,
  swarm_name          text,
  description         text,
  orchestration_rules jsonb DEFAULT '{}'::jsonb,
  template_json       jsonb DEFAULT '{}'::jsonb,
  member_agents       jsonb DEFAULT '[]'::jsonb,
  is_active           boolean DEFAULT true,
  template_type       text,
  version             integer DEFAULT 1,
  tags                text[] DEFAULT '{}',
  metadata            jsonb DEFAULT '{}'::jsonb,
  vertical_key        text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 4. ARCHETYPES & AVATARS
-- ════════════════════════════════════════════════════════════

-- 4a. archetypes
CREATE TABLE IF NOT EXISTS public.archetypes (
  archetype_id          text PRIMARY KEY,
  archetype_name        text NOT NULL,
  description           text,
  numeric_id            integer,
  base_capability       numeric DEFAULT 80,
  base_trust            numeric DEFAULT 78,
  base_synergy          numeric DEFAULT 78,
  base_activation       numeric DEFAULT 78,
  base_evolution        numeric DEFAULT 78,
  base_risk             numeric DEFAULT 20,
  category              text,
  default_avatar        text,
  default_decision_mode text,
  avatar_name           text DEFAULT 'Eden',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- 4b. avatars
CREATE TABLE IF NOT EXISTS public.avatars (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  system        text,
  bio           text,
  tone_tags     text[] DEFAULT '{}',
  keywords      text[] DEFAULT '{}',
  is_active     boolean DEFAULT true,
  sort_order    integer,
  avatar_key    text,
  avatar_id     text,
  archetypes    text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 5. BLUEPRINT / ESSENCE / RIS
-- ════════════════════════════════════════════════════════════

-- 5a. blueprint_templates
CREATE TABLE IF NOT EXISTS public.blueprint_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key             text NOT NULL,
  name            text,
  description     text,
  vertical_id     text,
  vertical_key    text,
  subcategory_key text,
  is_active       boolean DEFAULT true,
  sections_json   jsonb DEFAULT '{}'::jsonb,
  template_json   jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 5b. blueprint_deployments
CREATE TABLE IF NOT EXISTS public.blueprint_deployments (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          text NOT NULL,
  client_id               text,
  blueprint_template_id   text NOT NULL,
  vertical_key            text NOT NULL,
  subcategory_key         text,
  status                  text DEFAULT 'draft',
  assessment_scores       jsonb DEFAULT '{}'::jsonb,
  assessment_answers      jsonb DEFAULT '{}'::jsonb,
  selected_agents         text[] DEFAULT '{}',
  selected_swarms         text[] DEFAULT '{}',
  blueprint_summary       text,
  n8n_workflow_id         text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  deployed_at             timestamptz
);

-- 5c. essence_templates
CREATE TABLE IF NOT EXISTS public.essence_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key             text NOT NULL,
  name            text,
  description     text,
  vertical_id     text,
  vertical_key    text,
  sections_json   jsonb DEFAULT '{}'::jsonb,
  template_json   jsonb DEFAULT '{}'::jsonb,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 5d. ris_templates
CREATE TABLE IF NOT EXISTS public.ris_templates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key                   text NOT NULL,
  name                  text,
  description           text,
  vertical_id           text,
  vertical_key          text,
  signal_weights_json   jsonb DEFAULT '{}'::jsonb,
  template_json         jsonb DEFAULT '{}'::jsonb,
  is_active             boolean DEFAULT true,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 6. IDENTITY
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.identities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id      text,
  primary_email     text,
  display_name      text,
  identity_type     text,
  created_at        timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 7. ENTITLEMENTS & BILLING
-- ════════════════════════════════════════════════════════════

-- 7a. membership_tiers
CREATE TABLE IF NOT EXISTS public.membership_tiers (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key                     text,
  name                    text,
  description             text,
  category                text,
  billing_interval        text,
  sort_order              integer DEFAULT 0,
  features                jsonb DEFAULT '{}'::jsonb,
  is_organization         boolean DEFAULT false,
  is_creator              boolean DEFAULT false,
  max_vertical_agents     integer DEFAULT 5,
  max_custom_agents       integer DEFAULT 0,
  max_swarm_capacity      integer DEFAULT 1,
  max_workflows           integer DEFAULT 3,
  max_memory_gbs          integer DEFAULT 1,
  price_range             text,
  price_sweet_spot        text,
  status                  text DEFAULT 'active',
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- 7b. tier_entitlements
CREATE TABLE IF NOT EXISTS public.tier_entitlements (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key                        text,
  category                        text,
  max_vertical_agents             integer DEFAULT 5,
  max_custom_agents               integer DEFAULT 0,
  max_agents                      integer DEFAULT 5,
  max_swarm_capacity              integer DEFAULT 1,
  max_swarms                      integer DEFAULT 1,
  max_workflows                   integer DEFAULT 3,
  max_workflow_runs_monthly       integer DEFAULT 100,
  max_api_calls_monthly           integer DEFAULT 1000,
  max_storage_gb                  integer DEFAULT 1,
  max_memory_gbs                  integer DEFAULT 1,
  can_use_legal_addon             boolean DEFAULT false,
  can_use_wealth_addon            boolean DEFAULT false,
  can_use_luxury_hospitality_addon boolean DEFAULT false,
  can_use_creator_commerce_addon  boolean DEFAULT false,
  can_use_custom_branding         boolean DEFAULT false,
  can_use_analytics               boolean DEFAULT false,
  can_use_api_access              boolean DEFAULT false,
  can_use_white_label             boolean DEFAULT false,
  can_use_priority_support        boolean DEFAULT false,
  can_use_dedicated_infrastructure boolean DEFAULT false,
  can_use_sla                     boolean DEFAULT false,
  status                          text DEFAULT 'active',
  created_at                      timestamptz DEFAULT now(),
  updated_at                      timestamptz DEFAULT now()
);

-- 7c. memberships
CREATE TABLE IF NOT EXISTS public.memberships (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id                   text,
  membership_tier_id        uuid REFERENCES public.membership_tiers(id) ON DELETE SET NULL,
  stripe_customer_id        text,
  stripe_subscription_id    text,
  status                    text DEFAULT 'active',
  is_trial                  boolean DEFAULT false,
  starts_at                 timestamptz,
  renews_at                 timestamptz,
  expires_at                timestamptz,
  trial_ends_at             timestamptz,
  canceled_at               timestamptz,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

-- 7d. entitlements
CREATE TABLE IF NOT EXISTS public.entitlements (
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_key       text NOT NULL,
  limit_value       numeric NOT NULL DEFAULT 0,
  usage_count       numeric DEFAULT 0,
  is_enabled        boolean DEFAULT true,
  source_type       text,
  updated_at        timestamptz DEFAULT now(),
  PRIMARY KEY (organization_id, feature_key)
);

-- ════════════════════════════════════════════════════════════
-- 8. CONNECTORS
-- ════════════════════════════════════════════════════════════

-- 8a. connector_accounts
CREATE TABLE IF NOT EXISTS public.connector_accounts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  business_id         text,
  connector_type      text NOT NULL,
  account_name        text,
  access_token        text,
  refresh_token       text,
  token_expires_at    timestamptz,
  external_account_id  text,
  scopes              text[] DEFAULT '{}',
  metadata            jsonb DEFAULT '{}'::jsonb,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- 8b. connector_credentials
CREATE TABLE IF NOT EXISTS public.connector_credentials (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id            uuid REFERENCES public.connector_accounts(id) ON DELETE CASCADE,
  organization_id         text,
  client_id               text,
  encrypted_credentials   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 9. OTHER
-- ════════════════════════════════════════════════════════════

-- 9a. notification_logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     text,
  client_id           text,
  business_id         text,
  notification_type   text,
  channel             text,
  recipient           text,
  subject             text,
  message             text,
  delivery_status     text,
  provider_response   jsonb DEFAULT '{}'::jsonb,
  metadata            jsonb DEFAULT '{}'::jsonb,
  created_by          text,
  updated_by          text,
  sent_at             timestamptz,
  created_at          timestamptz DEFAULT now()
);

-- 9b. omnigrid_intelligence_system
CREATE TABLE IF NOT EXISTS public.omnigrid_intelligence_system (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text,
  name            text,
  system_number   integer,
  tagline         text,
  description     text,
  system_version  text DEFAULT '1.0.0',
  lens_key        text NOT NULL,
  lens_name       text,
  domain_key      text,
  domain_name     text,
  is_active       boolean DEFAULT true,
  requires_tier   text DEFAULT 'basic',
  created_at      timestamptz DEFAULT now()
);

-- 9c. catalogs
CREATE TABLE IF NOT EXISTS public.catalogs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL,
  name        text NOT NULL,
  kind        text,
  is_active   boolean DEFAULT true,
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 10. CLIENT-RELATED (additional columns)
-- ════════════════════════════════════════════════════════════

-- 10a. client_twins (already exists? add missing columns)
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS business_id text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS personality_summary text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS preference_summary text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS communication_style text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS luxury_profile text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS wellness_profile text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS spending_profile text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS recommendation_profile jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS personality_traits jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS lifestyle_preferences jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS wellness_preferences jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS luxury_preferences jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS spiritual_preferences jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS engagement_score numeric;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS loyalty_score numeric;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS lifetime_value numeric;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS risk_score numeric;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS confidence_score numeric;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS twin_status text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS blueprint_score numeric;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS predicted_needs jsonb DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS relationship_graph jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS learning_state jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS memory_summary text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS essence_summary text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS daily_board_summary text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS intelligence_score numeric;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS intelligence_state text;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS mas_vector jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS preferred_verticals text[] DEFAULT '{}';
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS memory_score numeric;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS mas_score jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS mas_state jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS life_model jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS blueprint jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.client_twins
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
-- Add client_twins PK/creation if the table itself doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_twins') THEN
    CREATE TABLE public.client_twins (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- 11. VIEWS (recreate safely)
-- ════════════════════════════════════════════════════════════

-- 11a. agent_catalog view (standardized agent listing)
CREATE OR REPLACE VIEW public.agent_catalog AS
SELECT
  a.id,
  a.agent_id,
  a.agent_name AS name,
  a.tagline,
  a.description,
  a.long_description,
  a.agent_type,
  a.mas_category AS category,
  a.role_type,
  a.vertical,
  a.archetype_id,
  a.avatar,
  a.icon,
  a.capabilities,
  a.triggers,
  a.outputs,
  a.tools,
  a.connectors,
  a.health_status AS status,
  a.status = 'active' AS is_active,
  a.is_system_agent,
  a.is_published,
  a.mas_score,
  a.mas_vector,
  a.metadata,
  a.created_at,
  a.updated_at
FROM public.agents a
WHERE a.deleted_at IS NULL;

-- 11b. swarm_catalog view (standardized swarm listing)
CREATE OR REPLACE VIEW public.swarm_catalog AS
SELECT
  st.id,
  COALESCE(st.swarm_key, st.key) AS swarm_key,
  COALESCE(st.swarm_name, st.name) AS name,
  st.description,
  st.vertical_key,
  st.member_agents,
  st.is_active,
  st.template_type,
  st.version,
  st.tags,
  st.metadata,
  st.created_at,
  st.updated_at
FROM public.swarm_templates st
WHERE st.is_active = true;

-- 11c. active_tables view (dashboard row counts)
CREATE OR REPLACE VIEW public.active_tables AS
SELECT
  relname::text AS table_name,
  n_live_tup AS row_estimate
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- ════════════════════════════════════════════════════════════
-- 12. RLS (enable and add basic policies for new tables)
-- ════════════════════════════════════════════════════════════

-- Enable RLS on all created tables (safe to repeat)
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vertical_subs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_generators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_swarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.swarm_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blueprint_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blueprint_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.essence_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ris_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tier_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.connector_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.connector_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.omnigrid_intelligence_system ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.catalogs ENABLE ROW LEVEL SECURITY;

-- Grant basic SELECT access
GRANT SELECT ON public.agent_catalog TO authenticated, anon, service_role;
GRANT SELECT ON public.swarm_catalog TO authenticated, anon, service_role;
GRANT SELECT ON public.active_tables TO authenticated, anon, service_role;

-- ════════════════════════════════════════════════════════════
-- 13. VERIFICATION
-- ════════════════════════════════════════════════════════════

SELECT 'Migration 00027 complete: ' || count(*)::text || ' tables now in public schema'
FROM information_schema.tables
WHERE table_schema = 'public';
