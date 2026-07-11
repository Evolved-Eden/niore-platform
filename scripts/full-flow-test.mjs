import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'dotenv'
import { spawn } from 'child_process'

const env = parse(readFileSync('.env.local', 'utf-8'))
const port = 3459
const url = `http://localhost:${port}`
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const svcKey = env.SUPABASE_SERVICE_ROLE_KEY
const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
const admin = createClient(supabaseUrl, svcKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function waitForServer(maxWait = 20) {
  for (let i = 0; i < maxWait; i++) {
    try {
      await fetch(`http://localhost:${port}/api/me`, { signal: AbortSignal.timeout(2000) })
      return true
    } catch {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  return false
}

async function buildSessionCookie(userId) {
  // Create a session using admin API
  // Use the access token directly from admin API
  // The admin createUser with email_confirm:true creates a user but no session
  // We need to generate a session
  
  // Alternative: Create the session cookie manually
  // The session object stored in the cookie looks like:
  // base64-<base64url(JSON.stringify({
  //   access_token: "...",
  //   token_type: "bearer", 
  //   expires_in: 3600,
  //   expires_at: 1234567890,
  //   refresh_token: "...",
  //   user: { id: "...", ... }
  // }))>
  
  // We need a valid access_token. Let's sign in with password (using service key)
  // But we don't know the password for existing users...
  
  // Actually, we can create a new user and sign in
  const email = `test-flow-${Date.now()}@test.com`
  const pw = 'TestFlow123!'
  
  const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
    email, password: pw, email_confirm: true,
  })
  if (createErr) { console.log('Create user failed:', createErr.message); return null }
  
  // Sign in using service key (this works!)
  const signInRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: svcKey },
    body: JSON.stringify({ email, password: pw }),
  })
  const session = await signInRes.json()
  if (!session.access_token) { 
    console.log('Sign in failed:', JSON.stringify(session))
    await admin.auth.admin.deleteUser(newUser.user.id)
    return null 
  }
  
  // Build the cookie value
  const sessionObj = {
    access_token: session.access_token,
    token_type: session.token_type,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    refresh_token: session.refresh_token,
    user: { id: newUser.user.id, email },
  }
  
  const sessionJson = JSON.stringify(sessionObj)
  const b64 = Buffer.from(sessionJson).toString('base64url')
  const cookieValue = `base64-${b64}`
  const cookieName = `sb-${projectRef}-auth-token`
  
  return {
    cookieName,
    cookieValue,
    userId: newUser.user.id,
    userEmail: email,
    cleanup: () => admin.auth.admin.deleteUser(newUser.user.id),
  }
}

async function run() {
  // Start dev server
  console.log(`Starting dev server on port ${port}...`)
  const server = spawn('npx', ['next', 'dev', '--port', String(port)], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  })
  
  server.stderr.on('data', d => process.stderr.write(d))
  
  if (!await waitForServer()) {
    console.log('Server failed to start')
    server.kill()
    process.exit(1)
  }
  console.log('Dev server is running!\n')
  
  // Build session cookie
  console.log('Creating test user and building session cookie...')
  const sessionInfo = await buildSessionCookie()
  if (!sessionInfo) { server.kill(); process.exit(1) }
  
  const cookie = `${sessionInfo.cookieName}=${encodeURIComponent(sessionInfo.cookieValue)}`
  console.log(`User: ${sessionInfo.userId.substring(0,8)}...`)

  // Test /api/me
  console.log('\n=== Test 1: /api/me (with session cookie) ===')
  const meRes = await fetch(`${url}/api/me`, { headers: { Cookie: cookie } })
  const meData = await meRes.json()
  console.log(`Status: ${meRes.status}`)
  console.log(`Response: ${JSON.stringify(meData)}`)

  // Test /api/intake/save
  console.log('\n=== Test 2: /api/intake/save (with session cookie) ===')
  const saveRes = await fetch(`${url}/api/intake/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      section: 'personal',
      data: { name: 'Flow Test', email: sessionInfo.userEmail, dob: '1990-01-01' }
    }),
  })
  const saveData = await saveRes.json()
  console.log(`Status: ${saveRes.status}`)
  console.log(`Response: ${JSON.stringify(saveData)}`)

  // Test /api/intake/results
  console.log('\n=== Test 3: /api/intake/results (with session cookie) ===')
  const resultsRes = await fetch(`${url}/api/intake/results`, { headers: { Cookie: cookie } })
  const resultsData = await resultsRes.json()
  console.log(`Status: ${resultsRes.status}`)
  console.log(`Response: ${JSON.stringify(resultsData).substring(0, 200)}`)

  // If save worked, verify in database
  if (saveRes.ok) {
    console.log('\n=== Test 4: Verify in database ===')
    const { data: client } = await admin
      .from('clients')
      .select('metadata')
      .eq('id', sessionInfo.userId)
      .maybeSingle()
    const hasIntake = !!(client?.metadata?.intake?.sections)
    console.log(`Intake data in DB: ${hasIntake ? 'YES' : 'NO'}`)
    if (hasIntake) {
      console.log(`Sections: ${Object.keys(client.metadata.intake.sections).join(', ')}`)
    }
  }

  // Cleanup
  console.log('\n=== Cleanup ===')
  await sessionInfo.cleanup()
  server.kill()
  console.log('Done!')
}

run().catch(err => { console.error('Error:', err); process.exit(1) })
