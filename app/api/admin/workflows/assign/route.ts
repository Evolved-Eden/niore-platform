import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const body = await request.json();
    const { workflowId, clientId, agentId } = body;

    if (!workflowId) {
      return NextResponse.json({ error: 'workflowId is required' }, { status: 400 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (clientId !== undefined) updates.assigned_client_id = clientId || null;
    if (agentId !== undefined) updates.assigned_agent_id = agentId || null;

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No assignments provided' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('workflows')
      .update(updates)
      .eq('id', workflowId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, workflow: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
