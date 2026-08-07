import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let essenceboards: any[] = [];
    let essintelligences: any[] = [];
    let workflows: any[] = [];

    if (type === 'all' || type === 'essenceboard') {
      const { data, error } = await supabaseAdmin
        .from('essenceboard_templates')
        .select('*')
        .order('key', { ascending: true });
      if (!error) essenceboards = (data || []).map((b: any) => ({ ...b, _template_type: 'essenceboard' }));
    }

    if (type === 'all' || type === 'essintelligence') {
      const { data, error } = await supabaseAdmin
        .from('essintelligence_templates')
        .select('*')
        .order('key', { ascending: true });
      if (!error) essintelligences = (data || []).map((e: any) => ({ ...e, _template_type: 'essintelligence' }));
    }

    if (type === 'all' || type === 'workflow') {
      const { data, error } = await supabaseAdmin
        .from('workflow_templates')
        .select('*')
        .order('name', { ascending: true });
      if (!error) workflows = (data || []).map((w: any) => ({
        key: w.key,
        name: w.name,
        description: w.description,
        specialty_key: w.tier,
        workflow_type: w.workflow_type,
        is_active: w.is_active,
        stages_json: w.stages_json || [],
        tags: w.function_category_key ? [w.function_category_key] : [],
        n8n_webhook_url: null,
        _template_type: 'workflow',
        sections_json: w.stages_json || [],
        template_json: { workflow_type: w.workflow_type, stages: w.stages_json, frequency: w.frequency },
      }));
    }

    const templates = [...essenceboards, ...essintelligences, ...workflows];

    return NextResponse.json({
      templates,
      count: templates.length,
      essenceboard_count: essenceboards.length,
      essintelligence_count: essintelligences.length,
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
    const templateType = body._template_type || body.type || 'essintelligence';

    if (templateType === 'essenceboard') {
      const { data, error } = await supabaseAdmin
        .from('essenceboard_templates')
        .insert({
          key: body.key, name: body.name, description: body.description || null,
          specialty_key: body.specialty_key || null, subcategory_key: body.subcategory_key || null,
          is_active: body.is_active ?? true, sections_json: body.sections_json || [],
          template_json: body.template_json || {}, essence_json: body.essence_json || null,
          config_key: body.config_key || null, mas_category: body.mas_category || null,
          mas_priority: body.mas_priority || null,
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, template: data });
    }

    if (templateType === 'workflow') {
      const { data, error } = await supabaseAdmin
        .from('workflow_templates')
        .insert({
          key: body.key, name: body.name, description: body.description || null,
          workflow_type: body.workflow_type || 'GENERAL', tier: body.specialty_key || null,
          is_active: body.is_active ?? true, stages_json: body.sections_json || [],
          workflow_json: body.template_json || {},
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
        specialty_key: body.specialty_key || null, subcategory_key: body.subcategory_key || null,
        is_active: body.is_active ?? true, sections_json: body.sections_json || [],
        template_json: body.template_json || {}, essence_json: body.essence_json || null,
        config_key: body.config_key || null, mas_category: body.mas_category || null,
        mas_priority: body.mas_priority || null,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, template: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}