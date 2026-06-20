import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return NextResponse.json({ error: 'workflowId is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('workflow_run_logs')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ logs: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    const body = await request.json();
    const { workflowId, triggeredBy, clientId } = body;

    if (!workflowId) {
      return NextResponse.json({ error: 'workflowId is required' }, { status: 400 });
    }

    const { data: workflow, error: fetchError } = await supabaseAdmin
      .from('workflow_demos')
      .select('*')
      .eq('id', workflowId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const { data: runLog, error: logError } = await supabaseAdmin
      .from('workflow_run_logs')
      .insert({
        workflow_id: workflowId,
        client_id: clientId || null,
        status: 'running',
        triggered_by: triggeredBy || 'manual',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) throw logError;

    await supabaseAdmin
      .from('workflow_demos')
      .update({ run_status: 'running', last_run_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', workflowId);

    let n8nResult = null;
    if (workflow.n8n_webhook_url) {
      try {
        const n8nResponse = await fetch(workflow.n8n_webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId,
            workflowName: workflow.name,
            workflowJson: workflow.workflow_json,
            stages: workflow.stages,
            category: workflow.category,
            vertical: workflow.vertical,
            tags: workflow.tags,
            triggeredBy: triggeredBy || 'manual',
            runLogId: runLog.id,
            timestamp: new Date().toISOString(),
          }),
        });

        if (n8nResponse.ok) {
          const n8nData = await n8nResponse.text();
          n8nResult = { status: 'success', response: n8nData };

          try {
            const parsed = JSON.parse(n8nData);
            await supabaseAdmin
              .from('workflow_run_logs')
              .update({ result_data: parsed })
              .eq('id', runLog.id);
          } catch {
            await supabaseAdmin
              .from('workflow_run_logs')
              .update({ result_data: { raw: n8nData } })
              .eq('id', runLog.id);
          }
        } else {
          const errorText = await n8nResponse.text();
          n8nResult = { status: 'error', code: n8nResponse.status, message: errorText };
          await supabaseAdmin
            .from('workflow_run_logs')
            .update({ status: 'failed', error_message: errorText, completed_at: new Date().toISOString() })
            .eq('id', runLog.id);
          await supabaseAdmin
            .from('workflow_demos')
            .update({ run_status: 'failed', updated_at: new Date().toISOString() })
            .eq('id', workflowId);
        }
      } catch (fetchError: any) {
        n8nResult = { status: 'error', message: fetchError.message };
        await supabaseAdmin
          .from('workflow_run_logs')
          .update({ status: 'failed', error_message: fetchError.message, completed_at: new Date().toISOString() })
          .eq('id', runLog.id);
        await supabaseAdmin
          .from('workflow_demos')
          .update({ run_status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', workflowId);
      }
    } else {
      await supabaseAdmin
        .from('workflow_run_logs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', runLog.id);
      await supabaseAdmin
        .from('workflow_demos')
        .update({ run_status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', workflowId);
    }

    return NextResponse.json({
      success: true,
      runLog,
      n8n: n8nResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
