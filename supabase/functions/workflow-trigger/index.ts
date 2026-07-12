import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Entry point for the native workflow execution runtime.
// POST { workflow_id, organization_id?, client_id?, business_id?, input?, idempotency_key? }
//
// Fixed this pass: this used to check workflowResult.data.status, but `workflows`
// has no `status` column -- only `lifecycle_status` -- so the check always failed
// and every trigger request was rejected with "workflow inactive". Now checks
// lifecycle_status === 'active', matching the real column and the framework's
// documented -> built -> active -> deprecated lifecycle.

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

serve(async (req) => {
  let run: any = null

  try {
    const body = await req.json()

    const {
      workflow_id,
      organization_id = null,
      client_id = null,
      business_id = null,
      input = {},
      idempotency_key = null,
    } = body

    if (!workflow_id || typeof workflow_id !== "string") {
      return Response.json({ success: false, error: "workflow_id required" }, { status: 400 })
    }

    // Verify workflow exists and is active
    const workflowResult = await supabase
      .from("workflows")
      .select("id,lifecycle_status")
      .eq("id", workflow_id)
      .maybeSingle()

    if (workflowResult.error) {
      throw workflowResult.error
    }

    if (!workflowResult.data) {
      return Response.json({ success: false, error: "workflow not found" }, { status: 404 })
    }

    if (workflowResult.data.lifecycle_status !== "active") {
      return Response.json({ success: false, error: "workflow inactive" }, { status: 400 })
    }

    // Request metadata
    const traceId = crypto.randomUUID()
    const idempotencyKey = idempotency_key || req.headers.get("x-idempotency-key") || crypto.randomUUID()

    const runtimeContext = {
      workflow_run_id: null as string | null,
      input,
      memory: {},
      variables: {},
      execution_path: [],
      retry_count: 0,
      started_at: new Date().toISOString(),
      trace_id: traceId,
    }

    // Create workflow run
    try {
      const runResult = await supabase
        .from("workflow_runs")
        .insert({
          workflow_id,
          organization_id,
          client_id,
          business_id,
          status: "running",
          started_at: new Date().toISOString(),
          idempotency_key: idempotencyKey,
          context: runtimeContext,
        })
        .select()
        .single()

      if (runResult.error) {
        throw runResult.error
      }

      run = runResult.data
    } catch (error: any) {
      // Handle duplicate request
      if (error?.code === "23505") {
        const duplicate = await supabase
          .from("workflow_runs")
          .select("id,status")
          .eq("workflow_id", workflow_id)
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle()

        if (duplicate.data) {
          return Response.json({
            success: true,
            existing: true,
            workflow_run_id: duplicate.data.id,
          })
        }
      }

      throw error
    }

    // Attach generated ID
    runtimeContext.workflow_run_id = run.id

    await supabase.from("workflow_runs").update({ context: runtimeContext }).eq("id", run.id)

    // Find start node
    const startNodeResult = await supabase
      .from("workflow_nodes")
      .select("id, node_type, name")
      .eq("workflow_id", workflow_id)
      .eq("is_start", true)
      .single()

    if (startNodeResult.error || !startNodeResult.data) {
      throw new Error("No start node found")
    }

    const startNode = startNodeResult.data

    // Create node execution
    const nodeRunResult = await supabase
      .from("workflow_node_runs")
      .insert({
        workflow_run_id: run.id,
        node_id: startNode.id,
        status: "pending",
        attempt: 0,
        input,
        memory: runtimeContext.memory,
        variables: runtimeContext.variables,
        execution_path: runtimeContext.execution_path,
      })
      .select()
      .single()

    if (nodeRunResult.error) {
      throw nodeRunResult.error
    }

    const nodeRun = nodeRunResult.data

    // Queue worker job
    await supabase.from("queue_jobs").insert({
      queue_name: "workflow",
      workflow_run_id: run.id,
      node_run_id: nodeRun.id,
      worker_id: null,
      attempt: 0,
      max_attempts: 3,
      locked_at: null,
      status: "pending",
      scheduled_at: new Date().toISOString(),
    })

    // Emit event
    await supabase.from("workflow_execution_events").insert({
      workflow_run_id: run.id,
      event_type: "workflow_started",
      payload: {
        workflow_id,
        trace_id: traceId,
        node_run_id: nodeRun.id,
      },
    })

    return Response.json({
      success: true,
      workflow_run_id: run.id,
      node_run_id: nodeRun.id,
      trace_id: traceId,
    })
  } catch (error) {
    // Cleanup failed runs
    if (run?.id) {
      await supabase
        .from("workflow_runs")
        .update({ status: "failed", ended_at: new Date().toISOString() })
        .eq("id", run.id)

      await supabase.from("workflow_execution_events").insert({
        workflow_run_id: run.id,
        event_type: "workflow_failed",
        payload: { error: error instanceof Error ? error.message : String(error) },
      })
    }

    return Response.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
})
