import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 500);
    const offset = (page - 1) * limit;
    const filter = searchParams.get('filter') || 'all';

    let sbQuery = supabaseAdmin
      .from('agents')
      .select('*', { count: 'exact' });

    if (filter === 'null_role') {
      sbQuery = sbQuery.is('role_type', null);
    } else if (filter !== 'all') {
      sbQuery = sbQuery.eq('role_type', filter);
    }

    const { data: agents, count, error } = await sbQuery
      .order('agent_id', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      agents: agents || [],
      count: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from('agents')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, agent_id: data?.agent_id || body.agent_id || body.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
