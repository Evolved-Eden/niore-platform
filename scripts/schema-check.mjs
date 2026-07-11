import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'dotenv'

const env = parse(readFileSync('.env.local', 'utf-8'))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

// Check client_twins columns  
console.log('=== client_twins ===')
const { data: ct } = await admin.from('client_twins').select('*').limit(1)
if (ct?.length) {
  console.log('Columns:', Object.keys(ct[0]).join(', '))
} else {
  console.log('No rows, checking via raw query...')
  const { data: ctCols } = await admin.from('client_twins').select()
  console.log('Response:', JSON.stringify(ctCols).substring(0, 200))
}

// Check intelligence_profiles
console.log('\n=== intelligence_profiles ===')
const { data: ip, error: ipErr } = await admin.from('intelligence_profiles').select('id').limit(1)
console.log('Query result:', ipErr ? `ERROR: ${ipErr.message}` : `OK, ${ip?.length || 0} rows`)

// Try the table name the hint suggested
console.log('\n=== client_intelligence_memories ===')
const { data: cim } = await admin.from('client_intelligence_memories').select('*').limit(1)
console.log('Query result:', cim ? `OK, columns: ${Object.keys(cim[0] || {}).join(', ')}` : 'no data or error')

// Check all tables
console.log('\n=== All public tables ===')
const { data: tables } = await admin.from('pg_tables').select('tablename').eq('schemaname', 'public')
console.log('Tables:', (tables || []).map(t => t.tablename).join(', '))
