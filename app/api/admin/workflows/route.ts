import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const vertical = searchParams.get('vertical');

    let sbQuery = supabaseAdmin
      .from('workflows')
      .select('*', { count: 'exact' });

    if (category) sbQuery = sbQuery.eq('category', category);
    if (status) sbQuery = sbQuery.eq('run_status', status);
    if (vertical) sbQuery = sbQuery.eq('vertical', vertical);

    const { data, count, error } = await sbQuery
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ workflows: data || [], count: count ?? 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const body = await request.json();
    const { id, vertical, name, description, workflow_json, stages, category, tags, n8n_webhook_url, is_active } = body;

    if (id) {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (vertical !== undefined) updates.vertical = vertical;
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (workflow_json !== undefined) updates.workflow_json = workflow_json;
      if (stages !== undefined) updates.stages = stages;
      if (category !== undefined) updates.category = category;
      if (tags !== undefined) updates.tags = tags;
      if (n8n_webhook_url !== undefined) updates.n8n_webhook_url = n8n_webhook_url;
      if (is_active !== undefined) updates.is_active = is_active;

      const { data, error } = await supabaseAdmin
        .from('workflows')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, workflow: data });
    } else {
      const { data, error } = await supabaseAdmin
        .from('workflows')
        .insert({
          vertical: vertical || 'general',
          name,
          description: description || null,
          workflow_json: workflow_json || {},
          stages: stages || [],
          category: category || 'general',
          tags: tags || [],
          n8n_webhook_url: n8n_webhook_url || null,
          is_active: is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, workflow: data });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, run_status, is_active } = body;
    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (run_status !== undefined) updates.run_status = run_status;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('workflows')
      .update(updates)
      .eq('id', id)
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
