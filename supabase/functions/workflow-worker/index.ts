import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// connector_accounts (the old table these node executors used to read from)
// was dropped -- it stored plaintext credentials in a column that didn't
// even match this code's query (`.select("credentials")` against a table
// whose real columns were access_token/refresh_token/metadata, so this was
// already broken before the table was removed). The real store now is
// `connector_credentials.encrypted_credentials`, written by the client
// dashboard (/dashboard/client/connectors) and encrypted at rest with
// AES-256-GCM (see lib/connector-encryption.ts in the Next.js app).
//
// Deno can't import that Node `crypto`-based helper directly, so this is a
// separate but interoperable implementation using Web Crypto (crypto.subtle).
// It decrypts the exact same payload shape ({iv, authTag, ciphertext}, all
// base64) produced by the Node encryptor. Requires the SAME
// CONNECTOR_ENCRYPTION_KEY value set as a secret on this Edge Function
// (`supabase secrets set CONNECTOR_ENCRYPTION_KEY=...`) as is set in the
// Next.js app's env -- if the keys differ, decryption will fail with an
// OperationError, not silently return garbage.
async function decryptConnectorCredentials(payload: { iv: string; authTag: string; ciphertext: string }): Promise<Record<string, any>> {
  const keyB64 = Deno.env.get("CONNECTOR_ENCRYPTION_KEY")
  if (!keyB64) {
    throw new Error("CONNECTOR_ENCRYPTION_KEY is not set on this Edge Function -- cannot decrypt connector credentials.")
  }

  const b64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  const keyBytes = b64ToBytes(keyB64)
  const iv = b64ToBytes(payload.iv)
  const authTag = b64ToBytes(payload.authTag)
  const ciphertext = b64ToBytes(payload.ciphertext)

  // Node's createCipheriv keeps ciphertext and the GCM auth tag separate;
  // Web Crypto's AES-GCM expects them concatenated (ciphertext || tag).
  const combined = new Uint8Array(ciphertext.length + authTag.length)
  combined.set(ciphertext, 0)
  combined.set(authTag, ciphertext.length)

  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"])
  const plaintextBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, combined)
  return JSON.parse(new TextDecoder().decode(plaintextBuf))
}

/** Fetch and decrypt a connector's credentials by connector_credentials.id */
async function getConnectorCredentials(supabase: any, connectorCredentialId: string): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from("connector_credentials")
    .select("encrypted_credentials")
    .eq("id", connectorCredentialId)
    .single()

  if (error) throw error
  return decryptConnectorCredentials(data.encrypted_credentials)
}

// Fixed this pass: the http executor previously required secrets (auth
// headers, tokens) to be embedded as literal plaintext in workflow_nodes.config,
// which is stored in a normal jsonb column readable by anyone with DB access --
// unlike n8n, which references `$env.VAR` and never stores the actual secret
// value in its workflow JSON. resolveTemplateRefs adds two template forms:
// "$env.NAME" (resolved from Deno.env at execution time, so real credentials
// never sit in the DB) and "$input.field" (resolved from this node run's own
// input, so a node can act on the specific record -- e.g. a workflow_id -- the
// run was triggered for, instead of a hardcoded value).

function resolveTemplateRefs(value: any, input: any): any {
  if (typeof value === "string") {
    const envMatch = value.match(/^\$env\.([A-Z0-9_]+)$/)
    if (envMatch) {
      return Deno.env.get(envMatch[1]) ?? value
    }
    // $input.foo -- top-level lookup into this node run's input, so a node
    // (e.g. Workflow Publisher/Version Bump) can act on the specific record
    // the workflow was triggered for instead of a hardcoded value.
    const inputMatch = value.match(/^\$input\.([A-Za-z0-9_]+)$/)
    if (inputMatch) {
      return input?.[inputMatch[1]] ?? value
    }
    return value
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolveTemplateRefs(v, input))
  }
  if (value && typeof value === "object") {
    const out: Record<string, any> = {}
    for (const key of Object.keys(value)) {
      out[key] = resolveTemplateRefs(value[key], input)
    }
    return out
  }
  return value
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

/**
 * Check + increment a client's DM usage against their tier's included
 * allotment (tier_entitlements.max_dms_per_month) plus any Connector Packs
 * they own (clients.connector_pack_quantity), via the atomic Postgres
 * function. Throws if the limit is reached or the client can't be
 * resolved -- callers should let that error surface as a failed node run,
 * not silently skip the send.
 */
async function checkDmUsage(clientId: string | undefined): Promise<void> {
  if (!clientId) {
    throw new Error("No client_id on this workflow run -- cannot meter DM usage")
  }
  const { data, error } = await supabase.rpc("check_and_increment_connector_usage", {
    p_client_id: clientId,
    p_metric: "dm",
  })
  if (error) throw error
  if (!data?.allowed) {
    throw new Error(
      data?.reason === "limit_reached"
        ? `DM limit reached for this month (${data.used}/${data.limit}). Buy a Connector Pack for more capacity.`
        : `DM not sent: ${data?.reason ?? "usage check failed"}`
    )
  }
}

async function checkEmailUsage(clientId: string | undefined): Promise<void> {
  if (!clientId) {
    throw new Error("No client_id on this workflow run -- cannot meter email usage")
  }
  const { data, error } = await supabase.rpc("check_and_increment_connector_usage", {
    p_client_id: clientId,
    p_metric: "email",
  })
  if (error) throw error
  if (!data?.allowed) {
    throw new Error(
      data?.reason === "limit_reached"
        ? `Email limit reached for this month (${data.used}/${data.limit}). Buy a Connector Pack for more capacity.`
        : `Email not sent: ${data?.reason ?? "usage check failed"}`
    )
  }
}

const registry: Record<string, { execute: (node: any, context?: any) => Promise<any> }> = {
  http: {
    execute: async (node: any, context: any) => {
      const url = resolveTemplateRefs(node.config.url, context?.input)
      const headers = resolveTemplateRefs(node.config.headers || {}, context?.input)
      const body = resolveTemplateRefs(node.config.body, context?.input)

      const response = await fetch(url, {
        method: node.config.method || "GET",
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      return await response.json()
    },
  },

  ai: {
    execute: async (node: any, context: any) => {
      return { response: "AI output", input: context.input }
    },
  },

  condition: {
    execute: async (node: any, context: any) => {
      const value = context.input?.[node.config.field]
      return { result: value === node.config.value }
    },
  },

  delay: {
    execute: async (node: any) => {
      await new Promise((resolve) => setTimeout(resolve, node.config.ms || 1000))
      return { delayed: true }
    },
  },

  discord: {
    execute: async (node: any, context: any) => {
      await checkDmUsage(context?.clientId)

      const credentials = await getConnectorCredentials(supabase, node.config.connector_id)

      const webhookUrl = credentials.webhook_url
      const message = node.config.message

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      })

      if (!response.ok) {
        throw new Error("Discord send failed")
      }

      return { sent: true, channel: "discord" }
    },
  },

  telegram: {
    execute: async (node: any, context: any) => {
      await checkDmUsage(context?.clientId)

      const credentials = await getConnectorCredentials(supabase, node.config.connector_id)

      const response = await fetch(`https://api.telegram.org/bot${credentials.bot_token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: credentials.chat_id, text: node.config.message }),
      })

      const result = await response.json()

      if (!result.ok) {
        throw new Error("Telegram send failed")
      }

      return { sent: true, channel: "telegram", message_id: result.result.message_id }
    },
  },

  gmail: {
    execute: async (node: any, context: any) => {
      await checkEmailUsage(context?.clientId)

      const credentials = await getConnectorCredentials(supabase, node.config.connector_id)
      const { client_id, client_secret, refresh_token } = credentials

      if (!client_id || !client_secret || !refresh_token) {
        throw new Error("Gmail connector is missing client_id, client_secret, or refresh_token")
      }

      // Exchange the stored refresh token for a short-lived access token.
      // Not cached across invocations -- each send does its own exchange,
      // which is fine at expected send volumes (well under Google's OAuth
      // token endpoint rate limits) and avoids the complexity of a shared
      // token cache in a stateless Edge Function.
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id,
          client_secret,
          refresh_token,
          grant_type: "refresh_token",
        }),
      })
      const tokenData = await tokenResponse.json()
      if (!tokenResponse.ok || !tokenData.access_token) {
        throw new Error(`Gmail OAuth token refresh failed: ${tokenData.error_description ?? tokenData.error ?? "unknown error"}`)
      }

      const to = node.config.to
      const subject = node.config.subject ?? "(no subject)"
      const body = node.config.message ?? ""

      if (!to) {
        throw new Error("Gmail node config is missing 'to'")
      }

      // Build a minimal RFC 2822 MIME message and base64url-encode it, per
      // the Gmail API's messages.send format.
      const mimeMessage =
        `To: ${to}\r\n` +
        `Subject: ${subject}\r\n` +
        `Content-Type: text/plain; charset="UTF-8"\r\n\r\n` +
        body

      const encoder = new TextEncoder()
      const bytes = encoder.encode(mimeMessage)
      let binary = ""
      for (const b of bytes) binary += String.fromCharCode(b)
      const raw = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

      const sendResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      })

      const sendResult = await sendResponse.json()
      if (!sendResponse.ok) {
        throw new Error(`Gmail send failed: ${sendResult.error?.message ?? "unknown error"}`)
      }

      return { sent: true, channel: "email", message_id: sendResult.id }
    },
  },
}

serve(async () => {
  let currentJob: any = null
  let workflowRun: any = null
  let nodeRun: any = null

  try {
    const workerId = crypto.randomUUID()

    const claim = await supabase.rpc("claim_workflow_job", { worker: workerId })

    if (claim.error) {
      throw claim.error
    }

    if (!claim.data || claim.data.length === 0) {
      return Response.json({ success: true, message: "no jobs" })
    }

    currentJob = claim.data[0]

    const nodeResult = await supabase
      .from("workflow_node_runs")
      .select(`*, workflow_nodes(*), workflow_runs(*)`)
      .eq("id", currentJob.node_run_id)
      .single()

    if (nodeResult.error) {
      throw nodeResult.error
    }

    nodeRun = nodeResult.data
    workflowRun = nodeRun.workflow_runs

    await supabase
      .from("workflow_node_runs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", nodeRun.id)

    const executor = registry[nodeRun.workflow_nodes.node_type]

    if (!executor) {
      throw new Error(`No executor found for ${nodeRun.workflow_nodes.node_type}`)
    }

    const output = await executor.execute(nodeRun.workflow_nodes, {
      input: nodeRun.input,
      memory: nodeRun.memory,
      variables: nodeRun.variables,
      clientId: workflowRun.client_id,
    })

    await supabase.from("workflow_run_checkpoints").upsert(
      { workflow_run_id: workflowRun.id, node_run_id: nodeRun.id, checkpoint_data: output },
      { onConflict: "workflow_run_id,node_run_id" }
    )

    await supabase
      .from("workflow_node_runs")
      .update({ status: "completed", output, completed_at: new Date().toISOString() })
      .eq("id", nodeRun.id)

    await supabase.from("workflow_execution_events").insert({
      workflow_run_id: workflowRun.id,
      event_type: "node_completed",
      payload: { node_run_id: nodeRun.id, output },
    })

    const routeResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/workflow-router`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workflow_run_id: workflowRun.id, node_run_id: nodeRun.id, output }),
    })

    if (!routeResponse.ok) {
      throw new Error("workflow-router failed")
    }

    await supabase
      .from("queue_jobs")
      .update({ status: "completed", worker_id: null, locked_at: null, completed_at: new Date().toISOString() })
      .eq("id", currentJob.id)

    const remaining = await supabase
      .from("queue_jobs")
      .select("id", { count: "exact", head: true })
      .eq("workflow_run_id", workflowRun.id)
      .in("status", ["pending", "running"])

    if (remaining.count === 0) {
      await supabase
        .from("workflow_runs")
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("id", workflowRun.id)

      await supabase.from("workflow_execution_events").insert({
        workflow_run_id: workflowRun.id,
        event_type: "workflow_completed",
        payload: {},
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("worker", error)

    const attempts = (currentJob?.attempt || 0) + 1

    if (currentJob) {
      if (attempts >= (currentJob.max_attempts || 3)) {
        await supabase
          .from("workflow_node_runs")
          .update({
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
            completed_at: new Date().toISOString(),
          })
          .eq("id", currentJob.node_run_id)

        await supabase.from("workflow_dead_letters").insert({
          workflow_run_id: currentJob.workflow_run_id,
          error: error instanceof Error ? error.message : String(error),
        })
      } else {
        await supabase.from("workflow_node_runs").update({ status: "pending" }).eq("id", currentJob.node_run_id)

        await supabase
          .from("queue_jobs")
          .update({
            status: "pending",
            attempt: attempts,
            worker_id: null,
            locked_at: null,
            scheduled_at: new Date(Date.now() + 5000).toISOString(),
          })
          .eq("id", currentJob.id)
      }
    }

    return Response.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
})
