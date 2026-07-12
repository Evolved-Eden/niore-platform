-- ai_memories has RLS enabled but zero policies (deny-all for non-service-role).
-- /api/memories/route.ts uses the cookie-scoped client (not admin) for
-- GET/POST/DELETE, keyed on entity_id = auth.uid() -- so every user-facing
-- memory read/write/delete was silently denied before this.
CREATE POLICY "ai_memories_select_own" ON public.ai_memories
  FOR SELECT USING (entity_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY "ai_memories_insert_own" ON public.ai_memories
  FOR INSERT WITH CHECK (entity_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY "ai_memories_update_own" ON public.ai_memories
  FOR UPDATE USING (entity_id = auth.uid() OR client_id = auth.uid())
  WITH CHECK (entity_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY "ai_memories_delete_own" ON public.ai_memories
  FOR DELETE USING (entity_id = auth.uid() OR client_id = auth.uid());
