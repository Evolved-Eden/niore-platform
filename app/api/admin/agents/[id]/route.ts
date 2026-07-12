import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'
import { validateAgentForPublish } from '@/lib/agent-validation'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .or(`agent_id.eq.${id},id.eq.${id}`)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }
    return NextResponse.json({ agent: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// WF-203 (Agent Publish Pipeline) + WF-204 (System Prompt Change Audit Log):
// validates before allowing is_published: true, and logs every
// system_prompt/description change and every publish/unpublish to
// agent_audit_log so prompt regressions are traceable.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const body = await request.json()

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('agents')
      .select('id, system_prompt, description, icon, mas_category, is_published')
      .or(`agent_id.eq.${id},id.eq.${id}`)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    if (body.is_published === true && !existing.is_published) {
      const candidate = {
        system_prompt: body.system_prompt !== undefined ? body.system_prompt : existing.system_prompt,
        icon: body.icon !== undefined ? body.icon : existing.icon,
        mas_category: body.mas_category !== undefined ? body.mas_category : existing.mas_category,
      }
      const validation = validateAgentForPublish(candidate)
      if (!validation.valid) {
        await supabaseAdmin.from('agent_audit_log').insert({
          agent_id: existing.id,
          event_type: 'publish_rejected',
          new_value: validation.issues.join(', '),
        })
        return NextResponse.json({ error: 'Agent failed publish validation', issues: validation.issues }, { status: 400 })
      }
    }

    const { data, error } = await supabaseAdmin
      .from('agents')
      .update(body)
      .eq('id', existing.id)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const auditEvents: { agent_id: string; event_type: string; old_value?: string | null; new_value?: string | null }[] = []

    if (body.system_prompt !== undefined && body.system_prompt !== existing.system_prompt) {
      auditEvents.push({
        agent_id: existing.id,
        event_type: 'system_prompt_changed',
        old_value: existing.system_prompt,
        new_value: body.system_prompt,
      })
    }
    if (body.description !== undefined && body.description !== existing.description) {
      auditEvents.push({
        agent_id: existing.id,
        event_type: 'description_changed',
        old_value: existing.description,
        new_value: body.description,
      })
    }
    if (body.is_published === true && !existing.is_published) {
      auditEvents.push({ agent_id: existing.id, event_type: 'published' })
    } else if (body.is_published === false && existing.is_published) {
      auditEvents.push({ agent_id: existing.id, event_type: 'unpublished' })
    }

    if (auditEvents.length > 0) {
      await supabaseAdmin.from('agent_audit_log').insert(auditEvents)
    }

    return NextResponse.json({ success: true, agent: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { id } = await params
    const { error } = await supabaseAdmin
      .from('agents')
      .delete()
      .or(`agent_id.eq.${id},id.eq.${id}`)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
