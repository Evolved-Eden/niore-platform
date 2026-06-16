import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let sbQuery = supabaseAdmin
      .from('agents')
      .select('*')
      .eq('metadata->>source', 'registry');

    if (category) {
      sbQuery = sbQuery.eq('category', category);
    }

    const { data, error } = await sbQuery.order('name', { ascending: true });

    if (error) throw error;

    const agents = (data || []).map((a: Record<string, unknown>) => {
      const meta = (a.metadata || {}) as Record<string, unknown>;
      return {
        id: a.id,
        agent_id: a.agent_id,
        name: a.name,
        tagline: meta.tagline || null,
        description: a.description,
        long_description: meta.long_description || null,
        icon: meta.icon || null,
        color: meta.color || null,
        capabilities: a.capabilities || [],
        triggers: meta.triggers || [],
        data_sources: meta.data_sources || [],
        outputs: meta.outputs || [],
        workflow_ids: meta.workflow_ids || [],
        agent_type: a.agent_type,
        category: a.category,
        is_active: (a as any).status === 'active',
        metadata: meta,
      };
    });

    return NextResponse.json({ agents, count: agents.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
