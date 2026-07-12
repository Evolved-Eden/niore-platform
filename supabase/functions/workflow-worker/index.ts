import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    execute: async (node: any) => {
      const connector = await supabase
        .from("connector_accounts")
        .select("credentials")
        .eq("id", node.config.connector_id)
        .single()

      if (connector.error) {
        throw connector.error
      }

      const webhookUrl = connector.data.credentials.webhook_url
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
    execute: async (node: any) => {
      const connector = await supabase
        .from("connector_accounts")
        .select("credentials")
        .eq("id", node.config.connector_id)
        .single()

      if (connector.error) {
        throw connector.error
      }

      const credentials = connector.data.credentials

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
