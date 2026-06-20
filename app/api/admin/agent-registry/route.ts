import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let sbQuery = supabaseAdmin
      .from('agents')
      .select('*');

    if (category) {
      sbQuery = sbQuery.eq('mas_category', category);
    }

    const { data, error } = await sbQuery.order('agent_name', { ascending: true });

    if (error) throw error;

    const agents = (data || []).map((a: Record<string, unknown>) => {
      const meta = (a.metadata || {}) as Record<string, unknown>;
      return {
        id: a.id,
        agent_id: a.agent_id,
        name: a.agent_name,
        tagline: a.tagline || null,
        description: a.description || null,
        long_description: (meta.long_description as string) || null,
        icon: (a.icon as any)?.emoji || (a.icon as any)?.url || a.icon || null,
        color: (meta.color as string) || null,
        capabilities: a.capabilities || [],
        triggers: a.triggers || [],
        data_sources: (meta.data_sources as string[]) || [],
        outputs: a.outputs || [],
        workflow_ids: (meta.workflow_ids as string[]) || [],
        agent_type: a.agent_type || 'ai',
        category: (meta.category as string) || a.mas_category || a.vertical || null,
        is_active: (a as any).status === 'active',
        metadata: meta,
      };
    });

    return NextResponse.json({ agents, count: agents.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
