-- ============================================================
-- Migration 00009: Seed agent_registry with comprehensive catalog
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ── Hospitality & Concierge Agents ──
INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('client_concierge', 'Client Concierge', 'Your front desk never sleeps',
   'Handles bookings, rescheduling, cancellations, and automated follow-ups. Syncs with your calendar and sends smart reminders.',
   ARRAY['booking', 'scheduling', 'reminders', 'calendar_sync'],
   ARRAY['booking_request', 'cancellation', 'reschedule_request'],
   ARRAY['calendar', 'crm', 'email'],
   ARRAY['confirmed_booking', 'reminder_sent', 'rescheduled_appointment'],
   'concierge_booking', 'concierge', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('vip_experience_manager', 'VIP Experience Manager', 'Every guest feels like a VIP',
   'Manages VIP guest profiles, preferences, and special requests across all touchpoints. Ensures consistent white-glove service.',
   ARRAY['vip_profiling', 'preference_tracking', 'special_request_handling', 'gift_coordination'],
   ARRAY['vip_checkin', 'preference_update', 'special_request', 'anniversary'],
   ARRAY['guest_profiles', 'purchase_history', 'preferences'],
   ARRAY['vip_itinerary', 'guest_bio', 'upgrade_recommendation'],
   'concierge_booking', 'concierge', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('hospitality_operations', 'Hospitality Operations', 'Behind the scenes, effortlessly',
   'Coordinates housekeeping, maintenance, inventory, and vendor logistics so your property runs like clockwork.',
   ARRAY['inventory_tracking', 'staff_scheduling', 'maintenance_requests', 'vendor_management'],
   ARRAY['low_inventory', 'maintenance_alert', 'staff_shortage'],
   ARRAY['pms', 'inventory_system', 'hr_system'],
   ARRAY['restock_order', 'maintenance_ticket', 'staff_schedule'],
   'enterprise_infrastructure', 'operations', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('review_reputation_manager', 'Review & Reputation Manager', 'Your brand, always protected',
   'Monitors reviews across Google, Yelp, TripAdvisor, and social media. Flags negative reviews and drafts response templates.',
   ARRAY['review_monitoring', 'sentiment_analysis', 'response_drafting', 'trend_alerting'],
   ARRAY['new_review', 'negative_review', 'rating_drop'],
   ARRAY['google_business', 'yelp', 'tripadvisor', 'social_media'],
   ARRAY['review_alert', 'response_draft', 'reputation_report'],
   'marketing_intelligence', 'marketing', true)
ON CONFLICT (agent_id) DO NOTHING;

-- ── Sales & Lead Agents ──
INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('lead_qualifier', 'Lead Qualifier', 'Find the signal in the noise',
   'Scores and qualifies incoming leads based on intent, fit, and readiness. Routes hot leads to sales and nurtures cold leads.',
   ARRAY['lead_scoring', 'intent_analysis', 'lead_routing', 'enrichment'],
   ARRAY['lead_captured', 'website_visit', 'form_submission'],
   ARRAY['crm', 'website_analytics', 'enrichment_apis'],
   ARRAY['qualified_lead', 'lead_score', 'nurture_sequence'],
   'lead_sales', 'sales', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('sales_outreach_agent', 'Sales Outreach Agent', 'The follow-up that closes',
   'Automates personalized email and SMS outreach sequences. Tracks opens, replies, and optimizes send timing for max conversion.',
   ARRAY['email_outreach', 'sms_campaigns', 'a_b_testing', 'followup_automation'],
   ARRAY['lead_qualified', 'deal_stage_change', 'meeting_completed'],
   ARRAY['crm', 'email_platform', 'sms_gateway'],
   ARRAY['outreach_email', 'sms_sent', 'meeting_booked'],
   'lead_sales', 'sales', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('deal_room_agent', 'Deal Room Agent', 'Close faster with intelligence',
   'Coordinates deal documentation, approvals, and stakeholder communication in a structured deal pipeline.',
   ARRAY['document_management', 'approval_workflows', 'stakeholder_communication', 'timeline_tracking'],
   ARRAY['new_deal', 'deal_stage_update', 'document_needed'],
   ARRAY['crm', 'document_storage', 'calendar'],
   ARRAY['deal_summary', 'approval_request', 'closing_documents'],
   'lead_sales', 'sales', true)
ON CONFLICT (agent_id) DO NOTHING;

-- ── Marketing & Intelligence Agents ──
INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('marketing_intelligence', 'Marketing Intelligence Agent', 'Campaigns that actually work',
   'Optimizes ad spend, tracks ROI, and generates campaign recommendations based on real-time client data.',
   ARRAY['campaign_optimization', 'roi_tracking', 'audience_segmentation', 'budget_allocation'],
   ARRAY['campaign_start', 'budget_threshold', 'performance_drop'],
   ARRAY['ad_platforms', 'analytics', 'crm'],
   ARRAY['campaign_report', 'budget_recommendation', 'audience_insight'],
   'marketing_intelligence', 'marketing', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('content_strategy_agent', 'Content Strategy Agent', 'Content that connects',
   'Plans, generates, and schedules content across channels. Analyzes engagement to refine messaging for each audience segment.',
   ARRAY['content_planning', 'generation', 'scheduling', 'performance_analysis'],
   ARRAY['content_calendar_start', 'campaign_launch', 'engagement_drop'],
   ARRAY['social_platforms', 'blog_analytics', 'brand_guidelines'],
   ARRAY['content_calendar', 'post_draft', 'engagement_report'],
   'creator_commerce', 'marketing', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('seo_optimization_agent', 'SEO Optimization Agent', 'Get found, stay found',
   'Analyzes search rankings, identifies keyword opportunities, and generates on-page optimization recommendations.',
   ARRAY['keyword_research', 'rank_tracking', 'competitor_analysis', 'onpage_optimization'],
   ARRAY['ranking_change', 'content_publish', 'algorithm_update'],
   ARRAY['search_console', 'analytics', 'competitor_tools'],
   ARRAY['keyword_opportunities', 'seo_audit', 'optimization_tasks'],
   'marketing_intelligence', 'marketing', true)
ON CONFLICT (agent_id) DO NOTHING;

-- ── Retention & Growth Agents ──
INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('retention_sentinel', 'Retention Sentinel', 'Never lose a client again',
   'Monitors engagement patterns, flags at-risk clients before they churn, and triggers re-engagement campaigns automatically.',
   ARRAY['churn_prediction', 'engagement_monitoring', 'reengagement_campaigns', 'sentiment_tracking'],
   ARRAY['engagement_drop', 'churn_risk_flag', 'last_purchase_age'],
   ARRAY['crm', 'transaction_history', 'support_tickets', 'analytics'],
   ARRAY['churn_alert', 'reengagement_campaign', 'retention_report'],
   'marketing_intelligence', 'retention', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('loyalty_architect', 'Loyalty Architect', 'Turn customers into advocates',
   'Designs and manages loyalty programs, tracks rewards, and identifies top advocates for referral campaigns.',
   ARRAY['loyalty_design', 'reward_tracking', 'referral_management', 'advocate_identification'],
   ARRAY['program_launch', 'reward_milestone', 'referral_completed'],
   ARRAY['crm', 'transaction_data', 'referral_tracking'],
   ARRAY['loyalty_program', 'reward_notification', 'referral_report'],
   'marketing_intelligence', 'retention', true)
ON CONFLICT (agent_id) DO NOTHING;

-- ── Operations & Infrastructure Agents ──
INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('operations_orchestrator', 'Operations Orchestrator', 'Everything runs itself',
   'Coordinates staff schedules, inventory, supply orders, and daily workflows so you focus on clients, not logistics.',
   ARRAY['workflow_automation', 'staff_scheduling', 'inventory_management', 'supply_ordering'],
   ARRAY['daily_start', 'low_inventory', 'staff_change'],
   ARRAY['scheduling_system', 'inventory_db', 'vendor_portals'],
   ARRAY['staff_schedule', 'restock_order', 'daily_brief'],
   'enterprise_infrastructure', 'operations', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('compliance_monitor', 'Compliance Monitor', 'Stay compliant, automatically',
   'Monitors regulatory requirements, flags compliance gaps, and generates audit-ready reports for your industry.',
   ARRAY['regulation_tracking', 'gap_analysis', 'audit_reporting', 'policy_enforcement'],
   ARRAY['regulation_change', 'audit_upcoming', 'policy_violation'],
   ARRAY['regulatory_db', 'internal_policies', 'audit_logs'],
   ARRAY['compliance_report', 'gap_alert', 'policy_update'],
   'enterprise_infrastructure', 'compliance', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('data_analytics_agent', 'Data Analytics Agent', 'Your numbers tell a story',
   'Connects to your data sources, builds dashboards, and surfaces actionable insights. No SQL required.',
   ARRAY['data_connection', 'dashboard_building', 'insight_generation', 'trend_spotting'],
   ARRAY['data_connected', 'scheduled_report', 'anomaly_detected'],
   ARRAY['database', 'analytics_platform', 'business_apps'],
   ARRAY['dashboard', 'insight_report', 'anomaly_alert'],
   'enterprise_infrastructure', 'analytics', true)
ON CONFLICT (agent_id) DO NOTHING;

-- ── Real Estate Agents ──
INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('real_estate_buyer_agent', 'Buyer Qualification Agent', 'Match buyers to their dream property',
   'Qualifies buyer leads, matches preferences to inventory, and schedules viewings. Tracks buying stage and intent.',
   ARRAY['buyer_qualification', 'property_matching', 'viewing_scheduling', 'offer_coordination'],
   ARRAY['buyer_inquiry', 'property_favorite', 'offer_submitted'],
   ARRAY['mls', 'crm', 'calendar'],
   ARRAY['qualified_buyer', 'property_shortlist', 'viewing_scheduled'],
   'lead_sales', 'real_estate', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('property_listing_optimizer', 'Listing Optimizer', 'Listings that sell themselves',
   'Optimizes property listings with SEO descriptions, virtual tour scheduling, and multi-platform syndication.',
   ARRAY['listing_creation', 'virtual_tour_scheduling', 'platform_syndication', 'price_analysis'],
   ARRAY['new_listing', 'price_change', 'market_shift'],
   ARRAY['mls', 'photography_system', 'market_data'],
   ARRAY['optimized_listing', 'tour_scheduled', 'market_analysis'],
   'marketing_intelligence', 'real_estate', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('market_intel_agent', 'Market Intel Agent', 'Know your market, win your market',
   'Tracks market trends, comparable sales, and neighborhood data to provide real-time pricing recommendations.',
   ARRAY['market_tracking', 'comparable_analysis', 'pricing_recommendations', 'neighborhood_insights'],
   ARRAY['market_update', 'new_comparable', 'client_question'],
   ARRAY['mls', 'public_records', 'market_reports'],
   ARRAY['market_report', 'cma', 'pricing_guidance'],
   'enterprise_infrastructure', 'real_estate', true)
ON CONFLICT (agent_id) DO NOTHING;

-- ── Wealth & Capital Agents ──
INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('wealth_advisory_agent', 'Wealth Advisory Agent', 'Intelligence for your portfolio',
   'Consolidates portfolio data, tracks performance, and generates personalized wealth reports and rebalancing recommendations.',
   ARRAY['portfolio_tracking', 'performance_reporting', 'rebalancing_alerts', 'risk_assessment'],
   ARRAY['market_event', 'portfolio_change', 'rebalance_due'],
   ARRAY['brokerage_apis', 'market_data', 'client_profile'],
   ARRAY['portfolio_report', 'rebalance_recommendation', 'risk_alert'],
   'lead_sales', 'wealth', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('tax_optimization_agent', 'Tax Optimization Agent', 'Keep more of what you earn',
   'Identifies tax-saving opportunities, tracks deductibles, and prepares tax-optimized financial strategies.',
   ARRAY['deduction_tracking', 'tax_strategy', 'deadline_management', 'document_organization'],
   ARRAY['tax_season', 'major_purchase', 'investment_event'],
   ARRAY['financial_accounts', 'transaction_history', 'tax_codes'],
   ARRAY['tax_report', 'strategy_recommendation', 'deadline_reminder'],
   'enterprise_infrastructure', 'wealth', true)
ON CONFLICT (agent_id) DO NOTHING;

-- ── Creator & Digital Commerce Agents ──
INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('content_scheduler', 'Content Scheduler', 'Post. Promote. Profit.',
   'Schedules and publishes content across social platforms, tracks performance, and optimizes posting cadence.',
   ARRAY['cross_platform_publishing', 'content_calendar', 'performance_tracking', 'optimal_timing'],
   ARRAY['content_ready', 'campaign_start', 'engagement_drop'],
   ARRAY['social_apis', 'content_library', 'analytics'],
   ARRAY['published_post', 'content_report', 'timing_recommendation'],
   'creator_commerce', 'creator', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('audience_growth_agent', 'Audience Growth Agent', 'Grow your tribe',
   'Analyzes audience demographics, identifies growth opportunities, and recommends content strategies to expand reach.',
   ARRAY['demographic_analysis', 'growth_opportunities', 'content_recommendations', 'collaboration_finder'],
   ARRAY['growth_plateau', 'new_content_format', 'collaboration_opportunity'],
   ARRAY['social_analytics', 'audience_tools', 'trending_content'],
   ARRAY['growth_report', 'content_strategy', 'collaboration_suggestion'],
   'creator_commerce', 'creator', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('digital_product_agent', 'Digital Product Agent', 'Smarter commerce, bigger revenue',
   'Manage digital product listings, optimize pricing, and automate delivery of digital goods and memberships.',
   ARRAY['product_listing', 'pricing_optimization', 'digital_delivery', 'subscription_management'],
   ARRAY['new_product', 'order_received', 'subscription_renewal'],
   ARRAY['ecommerce_platform', 'payment_processor', 'digital_assets'],
   ARRAY['product_published', 'order_fulfilled', 'revenue_report'],
   'creator_commerce', 'commerce', true)
ON CONFLICT (agent_id) DO NOTHING;

-- ── AI & Automation Agents ──
INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('workflow_automation_agent', 'Workflow Automation Agent', 'Automate everything',
   'Designs and manages multi-step automation workflows connecting your apps, data, and AI models.',
   ARRAY['workflow_design', 'app_integration', 'condition_routing', 'error_handling'],
   ARRAY['trigger_event', 'scheduled_time', 'webhook_received'],
   ARRAY['connected_apps', 'database', 'webhooks'],
   ARRAY['completed_workflow', 'error_report', 'integration_map'],
   'enterprise_infrastructure', 'automation', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('ai_twin_manager', 'AI Twin Manager', 'Your AI, your clone',
   'Manages AI twin profiles including personality, memory, and knowledge base. Ensures the twin stays synced with your real-world data.',
   ARRAY['twin_profiling', 'memory_management', 'knowledge_syncing', 'personality_configuration'],
   ARRAY['twin_created', 'data_updated', 'sync_needed'],
   ARRAY['user_profile', 'knowledge_base', 'interaction_history'],
   ARRAY['twin_profile', 'sync_report', 'personality_update'],
   'concierge_booking', 'ai', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('intelligence_analyst', 'Intelligence Analyst', 'Patterns become predictions',
   'Analyzes business data to surface patterns, predict trends, and generate strategic recommendations across all verticals.',
   ARRAY['pattern_recognition', 'trend_prediction', 'strategic_recommendations', 'cross_vertical_analysis'],
   ARRAY['data_threshold', 'trend_identified', 'strategic_review'],
   ARRAY['business_data', 'market_intel', 'historical_trends'],
   ARRAY['intelligence_report', 'prediction_alert', 'strategy_document'],
   'enterprise_infrastructure', 'analytics', true)
ON CONFLICT (agent_id) DO NOTHING;

-- ── Treatment & Wellness Agents ──
INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('treatment_intelligence', 'Treatment Intelligence Engine', 'Recommendations that convert',
   'Analyzes client history, preferences, and purchase patterns to recommend the right treatments and products.',
   ARRAY['treatment_recommendation', 'product_matching', 'history_analysis', 'cross_sell_optimization'],
   ARRAY['consultation_completed', 'purchase_made', 'client_checkin'],
   ARRAY['client_history', 'treatment_catalog', 'preferences'],
   ARRAY['treatment_plan', 'product_recommendation', 'follow_up_schedule'],
   'intake_consultation', 'wellness', true)
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_registry (agent_id, name, tagline, description, capabilities, triggers, data_sources, outputs, agent_type, category, is_active)
VALUES
  ('wellness_coach_agent', 'Wellness Coach Agent', 'Your clients'' wellness journey, guided',
   'Creates personalized wellness plans, tracks client progress, and sends motivational check-ins between appointments.',
   ARRAY['wellness_planning', 'progress_tracking', 'checkin_messaging', 'goal_setting'],
   ARRAY['plan_created', 'appointment_completed', 'checkin_due'],
   ARRAY['client_health_data', 'treatment_history', 'preferences'],
   ARRAY['wellness_plan', 'progress_report', 'checkin_message'],
   'intake_consultation', 'wellness', true)
ON CONFLICT (agent_id) DO NOTHING;

-- Update counts
SELECT 'agent_registry seeded: ' || count(*) || ' agents' as result FROM public.agent_registry WHERE is_active = true;
