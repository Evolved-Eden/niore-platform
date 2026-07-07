import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const agentsResult = await query(
      'SELECT * FROM agent_registry WHERE is_active = true ORDER BY name ASC'
    )

    // agent_verticals may not exist yet — return empty if missing
    let verticals: Record<string, string[]> = {}
    try {
      const verticalsResult = await query(
        'SELECT agent_id, vertical_name FROM agent_verticals ORDER BY agent_id, vertical_name'
      )
      for (const row of verticalsResult.rows) {
        if (!verticals[row.agent_id]) {
          verticals[row.agent_id] = []
        }
        verticals[row.agent_id].push(row.vertical_name)
      }
    } catch {
      // Table doesn't exist yet — return empty verticals
    }

    return NextResponse.json({ agents: agentsResult.rows, verticals })
  } catch (error) {
    console.error('Failed to fetch agents from local DB:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
