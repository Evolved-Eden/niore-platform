-- MAS model and score tables for Evolved Eden
-- Run via node scripts/seed-mas.mjs <SUPABASE_DB_PASSWORD> or set SUPABASE_DB_PASSWORD

CREATE TABLE IF NOT EXISTS public.mas_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  weights jsonb NOT NULL,
  components jsonb NOT NULL,
  thresholds jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mas_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key text NOT NULL,
  agent_id text,
  component_scores jsonb NOT NULL,
  mas numeric(5,2) NOT NULL,
  status text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, model_key)
);

-- Seed the Evolved Eden MAS model
INSERT INTO public.mas_models (key, name, description, weights, components, thresholds)
VALUES (
  'evolved_eden_mas',
  'Evolved Eden Master Agent Score',
  'MAS model for routing, escalation, evolution, and health monitoring for Evolved Eden agents.',
  '{"cap": 0.25, "tru": 0.20, "syn": 0.20, "act": 0.15, "evo": 0.10, "risk": -0.10}'::jsonb,
  '{
    "cap": {"skill": 0.30, "knowledge": 0.25, "taskSuccess": 0.20, "speed": 0.15, "complexity": 0.10},
    "tru": {"accuracy": 0.35, "consistency": 0.25, "feedback": 0.20, "safety": 0.20},
    "syn": {"handoff": 0.30, "contextShare": 0.25, "routeEfficiency": 0.25, "collaboration": 0.20},
    "act": {"utilization": 0.30, "responseFrequency": 0.25, "engagement": 0.25, "uptime": 0.20},
    "evo": {"learningRate": 0.40, "adaptation": 0.30, "memoryGrowth": 0.20, "innovation": 0.10},
    "risk": {"errorRate": 0.25, "hallucinationRisk": 0.25, "escalationRate": 0.20, "conflictRate": 0.15, "instability": 0.15}
  }'::jsonb,
  '[
    {"min": 95, "max": 100, "status": "Elite", "action": "Primary orchestration authority"},
    {"min": 85, "max": 94, "status": "High", "action": "Preferred routing"},
    {"min": 70, "max": 84, "status": "Stable", "action": "Standard routing"},
    {"min": 55, "max": 69, "status": "Monitor", "action": "Reduced priority"},
    {"min": 40, "max": 54, "status": "Degraded", "action": "Restrict responsibilities"},
    {"min": 0, "max": 39, "status": "Critical", "action": "Escalate or deactivate"}
  ]'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    weights = EXCLUDED.weights,
    components = EXCLUDED.components,
    thresholds = EXCLUDED.thresholds,
    updated_at = now();

-- Seed a sample MAS score row using the provided example values
INSERT INTO public.mas_scores (model_key, agent_id, component_scores, mas, status, notes)
VALUES (
  'evolved_eden_mas',
  'mas_example_agent',
  '{
    "cap": 89.4,
    "tru": 91.05,
    "syn": 86.5,
    "act": 86.35,
    "evo": 79.7,
    "risk": 10.15,
    "capDetails": {"skill": 92, "knowledge": 88, "taskSuccess": 94, "speed": 80, "complexity": 90},
    "truDetails": {"accuracy": 95, "consistency": 90, "feedback": 84, "safety": 96},
    "synDetails": {"handoff": 88, "contextShare": 85, "routeEfficiency": 92, "collaboration": 80},
    "actDetails": {"utilization": 82, "responseFrequency": 76, "engagement": 91, "uptime": 99},
    "evoDetails": {"learningRate": 75, "adaptation": 88, "memoryGrowth": 82, "innovation": 71},
    "riskDetails": {"errorRate": 15, "hallucinationRisk": 12, "escalationRate": 8, "conflictRate": 5, "instability": 10}
  }'::jsonb,
  77.77,
  'Stable',
  'Sample MAS score based on the provided Evolved Eden MAS example.'
)
ON CONFLICT (agent_id, model_key) DO UPDATE
SET component_scores = EXCLUDED.component_scores,
    mas = EXCLUDED.mas,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    updated_at = now();
