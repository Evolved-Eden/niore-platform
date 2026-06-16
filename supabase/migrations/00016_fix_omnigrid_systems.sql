-- ============================================================
-- Migration 00016: Fix OmniGrid system data
-- ============================================================

-- 1. Remove redundant Business Burnout Prediction (152)
--    — Burnout Detection (54) + Burnout Prediction Engine (125) already cover this
DELETE FROM public.omnigrid_intelligence_system
WHERE system_number = 152;

-- 2. Merge Focus Window Prediction (48) into Peak Productivity Windows (49)
--    Keep Peak Productivity Windows, add focus detection to its description
UPDATE public.omnigrid_intelligence_system
SET description = 'Identifies your top productivity windows and focus periods so you can schedule high-value work.',
    tagline = 'Your best hours for creative, analytical, and execution work'
WHERE system_number = 49;

-- 3. Move Chakra Constitution (14) from Core Blueprint to Spiritual + Energetic
UPDATE public.omnigrid_intelligence_system
SET domain_key = 'spiritual_energetic',
    domain_name = 'Spiritual + Energetic',
    lens_key = 'spiritual',
    lens_name = 'Spiritual + Energetic Systems'
WHERE system_number = 14;
