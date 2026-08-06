-- The FK constraint kept its old name after the column rename
-- (clients.vertical_sub_id -> specialty_sub_id). Drop it, then the table.
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_vertical_sub_id_fkey;

DROP TABLE IF EXISTS vertical_subs;
DROP TABLE IF EXISTS vertical_to_specialty_migration_map;
