import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const queries: Record<string, { table: string; select: string; order: string }> = {
    role_types: { table: 'role_types', select: 'role_type_id, display_name, hierarchy_rank', order: 'hierarchy_rank' },
    avatars: { table: 'avatars', select: 'avatar_id, name, archetype', order: 'sort_order' },
    decision_modes: { table: 'decision_modes', select: 'mode_id', order: 'mode_id' },
    health_statuses: { table: 'health_statuses', select: 'status_id, priority', order: 'priority' },
    evolution_statuses: { table: 'evolution_statuses', select: 'status_id', order: 'status_id' },
    agent_types: { table: 'agent_types', select: 'key, name, description', order: 'name' },
    archetypes: { table: 'archetypes', select: 'archetype_id, archetype_name', order: 'archetype_id' },
    verticals: { table: 'verticals', select: 'key, name, description, icon', order: 'name' },
  };

  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const [key, cfg] of Object.entries(queries)) {
    try {
      const { data, error } = await supabaseAdmin
        .from(cfg.table)
        .select(cfg.select)
        .order(cfg.order as any, { ascending: true });
      if (error) throw error;
      results[key] = data || [];
    } catch (err: any) {
      errors.push(`${key}: ${err.message}`);
      results[key] = [];
    }
  }

  return NextResponse.json({
    ...results,
    _errors: errors.length > 0 ? errors : undefined,
  });
}
