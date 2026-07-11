import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'dotenv'

const env = parse(readFileSync('.env', 'utf-8'))
const supabase = createClient(
  'https://jebixydqpvsegvrtfmgm.supabase.co',
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function backfill() {
  console.log('=== Backfill intelligence_profiles ===\n')

  // Step 1: Find client_twins with blueprint data
  const { data: twins, error: fetchErr } = await supabase
    .from('client_twins')
    .select('client_id, metadata')

  if (fetchErr) { console.error('Fetch error:', fetchErr); return }
  console.log(`Client twins with metadata: ${twins?.length || 0}`)

  // Step 2: Find clients with intake.blueprint data
  const { data: clients } = await supabase
    .from('clients')
    .select('id, metadata')

  const clientsWithBlueprint = (clients || []).filter(c => {
    const meta = c.metadata || {}
    return meta?.intake?.sections?.results?.blueprint?.scores
  })
  console.log(`Clients with intake blueprint: ${clientsWithBlueprint.length}`)

  let created = 0, skipped = 0, errors = 0

  // Process from client_twins
  for (const twin of twins || []) {
    const cid = twin.client_id
    if (!cid) { skipped++; continue }
    const blueprint = (twin.metadata as any)?.blueprint
    if (!blueprint?.scores) { skipped++; continue }
    await processUser(cid, blueprint)
  }

  // Process from clients.metadata (broader source)
  for (const c of clientsWithBlueprint) {
    const cid = c.id
    if (!cid) { skipped++; continue }
    const blueprint = (c.metadata as any)?.intake?.sections?.results?.blueprint
    if (!blueprint?.scores) { skipped++; continue }
    // Skip if already processed from twins
    const { data: existing } = await supabase
      .from('intelligence_profiles')
      .select('id')
      .eq('entity_type', 'user')
      .eq('entity_id', cid)
      .maybeSingle()
    if (existing) { skipped++; continue }
    await processUser(cid, blueprint)
  }

  console.log(`\n=== Done: ${created} created, ${skipped} skipped, ${errors} errors ===`)

  async function processUser(clientId: string, blueprint: any) {
    const scores = blueprint.scores
    const scoreValues = Object.values(scores)
    const overallScore = scoreValues.reduce((a: number, b: number) => a + b, 0) / scoreValues.length

    const { error: err } = await supabase.from('intelligence_profiles').insert({
      entity_type: 'user',
      entity_id: clientId,
      organization_id: clientId,
      profile_kind: 'business_intelligence',
      identity_summary: blueprint.summary || 'Intelligence profile from intake blueprint',
      personality_traits: Object.fromEntries(
        Object.entries(scores).map(([k, v]) => [k, Number(v) / 100])
      ),
      profile_type: 'intake_backfill',
      confidence_score: +((overallScore / 100).toFixed(2)),
      daily_essence: blueprint.archetype || null,
      version: 1,
    })

    if (err) {
      console.error(`  ERROR ${clientId}: ${err.message}`)
      errors++
    } else {
      created++
      if (created % 5 === 0 || created === 1) process.stdout.write('.')
    }
  }
}

backfill().catch(err => { console.error('Script failed:', err); process.exit(1) })
