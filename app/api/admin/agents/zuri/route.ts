import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { agentId, agentName, tagline, vertical, autonomyLevel, authorityLevel, riskLevel, primaryTemplate, secondaryTemplate, metadata } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (agentName !== undefined) updates.agent_name = agentName;
    if (tagline !== undefined) updates.tagline = tagline;
    if (vertical !== undefined) updates.vertical = vertical;
    if (autonomyLevel !== undefined) updates.autonomy_level = autonomyLevel;
    if (authorityLevel !== undefined) updates.authority_level = authorityLevel;
    if (riskLevel !== undefined) updates.risk_level = riskLevel;
    if (primaryTemplate !== undefined && primaryTemplate !== '') updates.primary_template = primaryTemplate;
    if (secondaryTemplate !== undefined && secondaryTemplate !== '') updates.secondary_template = secondaryTemplate;
    if (metadata !== undefined) updates.metadata = metadata;

    const { data, error } = await supabaseAdmin
      .from('agents')
      .update(updates)
      .or(`agent_id.eq.${agentId},id.eq.${agentId}`)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Zuri configuration saved' });
  } catch (error: any) {
    console.error('Zuri save error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
