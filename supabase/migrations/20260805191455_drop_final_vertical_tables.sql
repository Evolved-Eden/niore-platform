-- Final vertical->specialty cleanup. 'verticals' and 'vertical_aliases'
-- were already dropped independently. These two remain:
DROP TABLE IF EXISTS vertical_subs;
DROP TABLE IF EXISTS vertical_to_specialty_migration_map;
