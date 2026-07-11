-- Add unique constraint on intelligence_profiles for upsert support
-- First check for any duplicates that would prevent the constraint
SELECT entity_type, entity_id, COUNT(*)
FROM intelligence_profiles
GROUP BY entity_type, entity_id
HAVING COUNT(*) > 1;

-- Add the unique constraint (only if no duplicates exist)
ALTER TABLE intelligence_profiles
ADD CONSTRAINT intelligence_profiles_entity_unique
UNIQUE (entity_type, entity_id);
