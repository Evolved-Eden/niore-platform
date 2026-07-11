import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'dotenv'

// Load from both files to see if keys differ
const envLocal = parse(readFileSync('.env.local', 'utf-8'))
const env = parse(readFileSync('.env', 'utf-8'))

const url = envLocal.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL

console.log('=== Key comparison ===')
const localAnon = (envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
const localSvc = (envLocal.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const envSvc = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const envAnon = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

console.log(`.env.local ANON: ${localAnon.substring(0,25)}... (len: ${localAnon.length})`)
console.log(`.env.local SVC:  ${localSvc.substring(0,25)}... (len: ${localSvc.length})`)
console.log(`.env ANON:       ${envAnon?.substring(0,25) || '(missing)'}... (len: ${envAnon?.length || 0})`)
console.log(`.env SVC:        ${envSvc.substring(0,25)}... (len: ${envSvc.length})`)

// Compare service keys
console.log(`\nSvc keys match: ${localSvc === envSvc ? 'YES' : 'NO'}`)

// Test service key directly (we know this works)
const svc = createClient(url, localSvc, { auth: { autoRefreshToken: false, persistSession: false } })
const { data: clients } = await svc.from('clients').select('count').limit(1)
console.log(`\nService key test: ${clients ? 'OK' : 'FAIL'}`)

// Test service key against auth endpoint directly via REST
console.log(`\nTesting auth endpoint directly...`)
const authUrl = `${url}/auth/v1/user`
const testRes = await fetch(authUrl, {
  headers: { apikey: localAnon, Authorization: `Bearer ${localAnon}` }
})
const testBody = await testRes.text()
console.log(`Auth endpoint response (${testRes.status}): ${testBody.substring(0,100)}`)

// The anon key might have 'undefined' or extra whitespace  
console.log(`\nAnon key clean check:`)
console.log(`  First char code: ${localAnon.charCodeAt(0)}`)
console.log(`  Last char code: ${localAnon.charCodeAt(localAnon.length - 1)}`)
console.log(`  Includes whitespace: ${/\s/.test(localAnon)}`)
console.log(`  Line breaks: ${localAnon.includes('\n') || localAnon.includes('\r')}`)
