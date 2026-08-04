import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let blueprints: any[] = [];
    let essences: any[] = [];
    let workflows: any[] = [];

    if (type === 'all' || type === 'blueprint') {
      const { data, error } = await supabaseAdmin
        .from('essintelligence_templates')
        .select('*')
        .order('key', { ascending: true });
      if (!error) blueprints = (data || []).map((b: any) => ({ ...b, _template_type: 'blueprint' }));
    }

    if (type === 'all' || type === 'essence') {
      const { data, error } = await supabaseAdmin
        .from('essintelligence_templates')
        .select('*')
        .order('key', { ascending: true });
      if (!error) essences = (data || []).map((e: any) => ({ ...e, _template_type: 'essence' }));
    }

    if (type === 'all' || type === 'workflow') {
      const { data, error } = await supabaseAdmin
        .from('workflows')
        .select('id, name, description, vertical, category, stages, is_active, tags, n8n_webhook_url')
        .order('name', { ascending: true });
      if (!error) workflows = (data || []).map((w: any) => ({
        key: w.id,
        name: w.name,
        description: w.description,
        vertical_key: w.vertical,
        workflow_type: w.category,
        is_active: w.is_active,
        stages_json: w.stages || [],
        tags: w.tags,
        n8n_webhook_url: w.n8n_webhook_url,
        _template_type: 'workflow',
        sections_json: w.stages || [],
        template_json: { workflow_type: w.category, stages: w.stages },
      }));
    }

    const templates = [...blueprints, ...essences, ...workflows];

    return NextResponse.json({
      templates,
      count: templates.length,
      blueprint_count: blueprints.length,
      essence_count: essences.length,
      workflow_count: workflows.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const body = await request.json();
    const templateType = body._template_type || body.type || 'blueprint';

    if (templateType === 'essence') {
      const { data, error } = await supabaseAdmin
        .from('essintelligence_templates')
        .insert({
          key: body.key, name: body.name, description: body.description || null,
          specialty_key: body.vertical_key || null, subcategory_key: body.subcategory_key || null,
          is_active: body.is_active ?? true, sections_json: body.sections_json || [],
          template_json: body.template_json || {}, essence_json: body.essence_json || null,
          config_key: body.blueprint_key || null, mas_category: body.mas_category || null,
          mas_priority: body.mas_priority || null,
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, template: data });
    }

    const { data, error } = await supabaseAdmin
      .from('essintelligence_templates')
      .insert({
        key: body.key, name: body.name, description: body.description || null,
        vertical_key: body.vertical_key || null, subcategory_key: body.subcategory_key || null,
        is_active: body.is_active ?? true, sections_json: body.sections_json || [],
        template_json: body.template_json || {},
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, template: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
