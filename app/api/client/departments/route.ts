import { NextRequest, NextResponse } from 'next/server'
import { resolveApiClient } from '@/lib/client-api'
import crypto from 'crypto'
import type { DepartmentRow } from '@/types'

export const dynamic = 'force-dynamic'

// A "department" is a team of swarms (user vocabulary: agents=employees,
// swarms=teams, team-of-swarms=department). Scoped per client, same pattern
// as /api/client/agents/deploy and /api/client/swarms/deploy.

// ── GET: List the target client's departments, with team (swarm) counts ──
export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveApiClient(req)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: departments, error: fetchError } = await ctx.svc
      .from('departments')
      .select('*')
      .eq('client_id', ctx.clientId)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    const { data: swarms, error: swarmsError } = await ctx.svc
      .from('client_deployed_swarms')
      .select('id, department_id')
      .eq('client_id', ctx.clientId)

    if (swarmsError) throw swarmsError

    const teamCounts = new Map<string, number>()
    for (const s of swarms || []) {
      if (!s.department_id) continue
      teamCounts.set(s.department_id, (teamCounts.get(s.department_id) || 0) + 1)
    }

    const withCounts = (departments || []).map((d) => ({
      ...d,
      team_count: teamCounts.get(d.id) || 0,
    }))

    return NextResponse.json({ departments: withCounts })
  } catch (error: any) {
    console.error('GET /api/client/departments failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── POST: Create a new department ─────────────────────────
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveApiClient(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, departmentType, organizationId } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const { error: insertError } = await ctx.svc.from('departments').insert({
      id,
      client_id: ctx.clientId,
      organization_id: organizationId || null,
      name,
      description: description || null,
      department_type: departmentType || null,
      status: 'active',
      created_at: now,
      updated_at: now,
    })

    if (insertError) throw insertError

    const { data: inserted, error: fetchBackError } = await ctx.svc
      .from('departments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchBackError) throw fetchBackError

    return NextResponse.json({ department: inserted || null })
  } catch (error: any) {
    console.error('POST /api/client/departments failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── PATCH: Rename, edit, or archive a department ──────────
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await resolveApiClient(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, departmentType, status } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { data: existing, error: checkError } = await ctx.svc
      .from('departments')
      .select('id')
      .eq('id', id)
      .eq('client_id', ctx.clientId)
      .maybeSingle()

    if (checkError) throw checkError
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const updateData: Partial<DepartmentRow> = { updated_at: now }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (departmentType !== undefined) updateData.department_type = departmentType
    if (status !== undefined) updateData.status = status

    const { error: updateError } = await ctx.svc
      .from('departments')
      .update(updateData)
      .eq('id', id)
      .eq('client_id', ctx.clientId)

    if (updateError) throw updateError

    const { data: updated, error: fetchError } = await ctx.svc
      .from('departments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    return NextResponse.json({ department: updated || null })
  } catch (error: any) {
    console.error('PATCH /api/client/departments failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
