'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useRouter } from 'next/navigation';

interface WorkflowStage {
  key: string;
  order: number;
  title: string;
  required: boolean;
}

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  specialty: string;
  category: string;
  run_status: string;
  is_active: boolean;
  assigned_client_id: string | null;
  assigned_agent_id: string | null;
  n8n_webhook_url: string | null;
  workflow_json: any;
  stages: any;
  tags: string[];
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RunLog {
  id: string;
  workflow_id: string;
  client_id: string | null;
  status: string;
  triggered_by: string;
  result_data: any;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface Agent {
  agent_id: string;
  name?: string;
  role_type?: string;
}

interface Client {
  id: string;
  user_name?: string;
  user_email?: string;
}

interface Specialty {
  id: string;
  name: string;
  key: string;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'intake', label: 'Intake' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'essence', label: 'Essence' },
  { value: 'agent', label: 'Agent' },
  { value: 'swarm', label: 'Swarm' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'automation', label: 'Automation' },
];

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  active: 'bg-green-500/20 text-green-300',
  running: 'bg-yellow-500/20 text-yellow-300 animate-pulse',
  paused: 'bg-amber-500/20 text-amber-300',
  completed: 'bg-blue-500/20 text-blue-300',
  failed: 'bg-red-500/20 text-red-300',
};

export default function WorkflowDesigner() {
  const router = useRouter();

  // Workflow fields
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowType, setWorkflowType] = useState('INTAKE');
  const [specialty, setSpecialty] = useState('');
  const [category, setCategory] = useState('general');

  // Suggest a descriptive name when type, specialty, or category changes
  const suggestName = useCallback((type: string, spec: string, cat: string) => {
    if (workflowId) return; // Don't overwrite existing workflow names
    const parts = [type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())];
    if (cat && cat !== 'general') parts.push(cat.charAt(0).toUpperCase() + cat.slice(1));
    if (spec && spec !== 'general') parts.push(spec.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()));
    parts.push('Workflow');
    setWorkflowName(parts.join(' '));
  }, [workflowId]);
  const [tagsInput, setTagsInput] = useState('');
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('');
  const [runStatus, setRunStatus] = useState('draft');
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<WorkflowStage[]>([
    { key: 'identify_business', order: 1, title: 'Business Identification', required: true },
  ]);

  // Specialties
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [specialtiesLoading, setSpecialtiesLoading] = useState(true);

  // Agents & Clients for assignment
  const [agents, setAgents] = useState<Agent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);

  // Run History
  const [runLogs, setRunLogs] = useState<RunLog[]>([]);
  const [runLogsLoading, setRunLogsLoading] = useState(false);

  // Current workflow for editing
  const [currentWorkflowData, setCurrentWorkflowData] = useState<any>(null);

  // Suggest name when type/specialty/category change (initial + subsequent)
  useEffect(() => {
    suggestName(workflowType, specialty, category);
  }, [workflowType, specialty, category, suggestName]);

  // Fetch specialties on mount
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const res = await fetch('/api/admin/specialties');
        if (res.ok) {
          const data = await res.json();
          setSpecialties(data.specialties || []);
        }
      } catch (err) {
        console.error('Failed to load specialties:', err);
      } finally {
        setSpecialtiesLoading(false);
      }
    };
    loadSpecialties();
  }, []);

  // Fetch agents and clients for assignment selectors
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await fetch('/api/admin/agents?limit=500');
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents || []);
        }
      } catch (err) {
        console.error('Failed to load agents:', err);
      } finally {
        setAgentsLoading(false);
      }
    };
    const loadClients = async () => {
      try {
        const res = await fetch('/api/admin/clients');
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
        }
      } catch (err) {
        console.error('Failed to load clients:', err);
      } finally {
        setClientsLoading(false);
      }
    };
    loadAgents();
    loadClients();
  }, []);

  // Drag and drop
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setStages(items.map((item, index) => ({ ...item, order: index + 1 })));
  }, [stages]);

  const addStage = () => {
    setStages([...stages, {
      key: `stage_${stages.length + 1}`,
      order: stages.length + 1,
      title: `New Stage ${stages.length + 1}`,
      required: true,
    }]);
  };

  const updateStage = (index: number, updates: Partial<WorkflowStage>) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], ...updates };
    setStages(updated);
  };

  const removeStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  // Load existing workflow data from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      loadWorkflow(id);
    }
  }, []);

  const loadWorkflow = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/workflows`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const wf = (data.workflows || []).find((w: Workflow) => w.id === id);
      if (wf) populateFromWorkflow(wf);
    } catch (err: any) {
      console.error('Error loading workflow:', err);
    }
  };

  const populateFromWorkflow = (wf: Workflow) => {
    setWorkflowId(wf.id);
    setWorkflowName(wf.name);
    setWorkflowDescription(wf.description || '');
    setSpecialty(wf.specialty);
    setCategory(wf.category || 'general');
    setTagsInput((wf.tags || []).join(', '));
    setN8nWebhookUrl(wf.n8n_webhook_url || '');
    setRunStatus(wf.run_status || 'draft');
    setSelectedClientId(wf.assigned_client_id || '');
    setSelectedAgentId(wf.assigned_agent_id || '');
    setCurrentWorkflowData(wf.workflow_json || null);

    if (Array.isArray(wf.stages) && wf.stages.length > 0) {
      setStages(wf.stages);
    }

    // Fetch run logs for this workflow
    fetchRunLogs(wf.id);
  };

  const fetchRunLogs = async (wfId: string) => {
    setRunLogsLoading(true);
    try {
      const res = await fetch(`/api/admin/workflows/run?workflowId=${wfId}`);
      if (res.ok) {
        const data = await res.json();
        setRunLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load run logs:', err);
    } finally {
      setRunLogsLoading(false);
    }
  };

  // Save workflow
  const handleSave = async () => {
    if (!workflowName) return;
    setLoading(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const workflowJson = {
        key: workflowName.toLowerCase().replace(/\s+/g, '_'),
        name: workflowName,
        description: workflowDescription || null,
        type: workflowType,
        specialty,
        category,
        tags,
        stages,
        n8n_webhook_url: n8nWebhookUrl || null,
      };

      const payload: any = {
        name: workflowName,
        description: workflowDescription || null,
        specialty: specialty || 'general',
        workflow_json: workflowJson,
        stages: stages,
        category,
        tags,
        n8n_webhook_url: n8nWebhookUrl || null,
      };

      if (workflowId) {
        payload.id = workflowId;
      }

      const res = await fetch('/api/admin/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save workflow');
      const data = await res.json();
      alert('Workflow saved!');

      if (data.workflow) {
        setWorkflowId(data.workflow.id);
        setRunStatus(data.workflow.run_status || 'draft');
        populateFromWorkflow(data.workflow);
      }
      router.refresh();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Run workflow
  const handleRun = async () => {
    if (!workflowId) {
      alert('Save the workflow first before running.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, triggeredBy: 'manual' }),
      });
      if (!res.ok) throw new Error('Failed to run workflow');
      const data = await res.json();
      alert('Workflow triggered!');
      setRunStatus('running');
      fetchRunLogs(workflowId);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Assign workflow
  const handleAssign = async () => {
    if (!workflowId) {
      alert('Save the workflow first before assigning.');
      return;
    }
    setLoading(true);
    try {
      const payload: any = { workflowId };
      if (selectedClientId) payload.clientId = selectedClientId;
      if (selectedAgentId) payload.agentId = selectedAgentId;

      const res = await fetch('/api/admin/workflows/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to assign workflow');
      alert('Workflow assigned!');
      router.refresh();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runLogStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-yellow-300';
      case 'completed': return 'text-green-300';
      case 'failed': return 'text-red-300';
      case 'pending': return 'text-gray-400';
      default: return 'text-white/50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Workflow Designer</h1>
          <p className="text-white/40 text-sm mt-1">Design, assign, and run your workflow</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard/admin/workflows/list')}
            className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors"
          >
            All Workflows
          </button>
          <button
            onClick={() => {
              setWorkflowId(null);
            setWorkflowName('');
            setWorkflowDescription('');
            setWorkflowType('INTAKE');
            setSpecialty('');
              setCategory('general');
              setTagsInput('');
              setN8nWebhookUrl('');
              setRunStatus('draft');
              setSelectedClientId('');
              setSelectedAgentId('');
              setCurrentWorkflowData(null);
              setStages([{ key: 'identify_business', order: 1, title: 'Business Identification', required: true }]);
              setRunLogs([]);
            }}
            className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors"
          >
            New
          </button>
        </div>
      </div>

      {/* Row 1: Workflow Name | Description | Type | Category | Specialty */}
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <h2 className="text-lg font-bold text-white/80 mb-4">Workflow Configuration</h2>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Workflow Name</label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="e.g., Luxury Tier Intake"
              className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
            <input
              type="text"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="Brief workflow description"
              className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Type</label>
            <select
              value={workflowType}
              onChange={(e) => { setWorkflowType(e.target.value); }}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
            >
              <option value="INTAKE">Intake</option>
              <option value="ASSESSMENT">Assessment</option>
              <option value="ESSENCE_GENERATION">Essence Generation</option>
              <option value="DAILY_BRIEFING">Daily Briefing</option>
              <option value="RIS_ANALYSIS">RIS Analysis</option>
              <option value="AGENT_DEPLOY">Agent Deploy</option>
              <option value="SWARM">Swarm</option>
              <option value="CONSULTING">Consulting</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Specialty</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
              disabled={specialtiesLoading}
            >
              <option value="">{specialtiesLoading ? 'Loading...' : 'None (Universal)'}</option>
              {specialties.length === 0 && !specialtiesLoading && (
                <>
                  <option value="real_estate">Real Estate</option>
                  <option value="hospitality">Hospitality</option>
                  <option value="medspa">Med Spa</option>
                  <option value="wellness">Wellness</option>
                  <option value="beauty">Beauty</option>
                </>
              )}
              {specialties.map((v) => (
                <option key={v.id} value={v.key || v.name.toLowerCase()}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Row 2: Tags | n8n Webhook URL | Run Status badge */}
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="intake, luxury, automation"
              className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">n8n Webhook URL</label>
            <input
              type="url"
              value={n8nWebhookUrl}
              onChange={(e) => setN8nWebhookUrl(e.target.value)}
              placeholder="https://n8n.example.com/webhook/..."
              className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70 placeholder-white/30 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Run Status</label>
            <div className="flex items-center gap-3">
              <span className={`inline-block px-3 py-1.5 rounded-sm text-xs font-medium ${STATUS_STYLES[runStatus] || STATUS_STYLES.draft}`}>
                {runStatus}
              </span>
              {workflowId && (
                <span className="text-xs text-white/30">ID: {workflowId.slice(0, 8)}...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Assign / Run buttons */}
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <h2 className="text-lg font-bold text-white/80 mb-4">Assignment & Execution</h2>
        <div className="grid grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Assign to Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
              disabled={clientsLoading}
            >
              <option value="">{clientsLoading ? 'Loading clients...' : 'None'}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.user_name || c.user_email || c.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Assign to Agent</label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white/70"
              disabled={agentsLoading}
            >
              <option value="">{agentsLoading ? 'Loading agents...' : 'None'}</option>
              {agents.map((a) => (
                <option key={a.agent_id} value={a.agent_id}>
                  {a.name || a.role_type || a.agent_id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={handleAssign}
              disabled={loading || !workflowId}
              className="w-full px-4 py-2 text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-sm hover:bg-blue-500/30 transition-colors disabled:opacity-40 font-bold"
            >
              {loading ? 'Saving...' : 'Assign'}
            </button>
          </div>
          <div>
            <button
              onClick={handleRun}
              disabled={loading || !workflowId || runStatus === 'running'}
              className="w-full px-4 py-2 text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30 rounded-sm hover:bg-green-500/30 transition-colors disabled:opacity-40 font-bold"
            >
              {loading ? 'Running...' : runStatus === 'running' ? 'Running...' : 'Run Workflow'}
            </button>
          </div>
        </div>
      </div>

      {/* Row 4: Stage Designer */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="glass rounded-sm p-6 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white/80">Workflow Stages (Drag to reorder)</h2>
            <button
              onClick={addStage}
              className="px-4 py-2 text-sm font-medium bg-[#C6A664] text-black rounded-sm hover:bg-white transition-colors font-bold"
            >
              + Add Stage
            </button>
          </div>

          <Droppable droppableId="stages">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {stages.map((stage, index) => (
                  <Draggable key={stage.key} draggableId={stage.key} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border rounded-sm p-4 ${snapshot.isDragging ? 'bg-white/10 shadow-lg border-blue-500/30' : 'bg-white/5 border-white/[0.06]'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div {...provided.dragHandleProps} className="cursor-grab text-white/30">⋮⋮</div>
                          <div className="flex-1 grid grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs text-white/40">Stage Key</label>
                              <input
                                type="text"
                                value={stage.key}
                                onChange={(e) => updateStage(index, { key: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-sm text-white/70 font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-white/40">Title</label>
                              <input
                                type="text"
                                value={stage.title}
                                onChange={(e) => updateStage(index, { title: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-sm text-white/70"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-white/40">Required</label>
                              <input
                                type="checkbox"
                                checked={stage.required}
                                onChange={(e) => updateStage(index, { required: e.target.checked })}
                                className="w-4 h-4"
                              />
                            </div>
                          </div>
                          <button onClick={() => removeStage(index)} className="text-red-400 hover:text-red-300">✕</button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      {/* Row 5: JSON Preview */}
      <div className="bg-black/30 border border-white/[0.06] rounded-sm p-6">
        <h2 className="text-lg font-bold text-white/80 mb-4">Workflow Preview (JSON)</h2>
        <pre className="text-xs text-white/40 bg-black/30 p-4 rounded-sm border border-white/[0.06] overflow-auto max-h-64">
          {JSON.stringify({
            key: workflowName.toLowerCase().replace(/\s+/g, '_'),
            name: workflowName,
            description: workflowDescription || null,
            type: workflowType,
            specialty,
            category,
            tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
            n8n_webhook_url: n8nWebhookUrl || null,
            stages,
          }, null, 2)}
        </pre>
      </div>

      {/* Row 6: Run History */}
      <div className="glass rounded-sm p-6 border border-white/[0.06]">
        <h2 className="text-lg font-bold text-white/80 mb-4">Run History</h2>
        {!workflowId ? (
          <p className="text-white/30 text-sm">Save the workflow to see run history.</p>
        ) : runLogsLoading ? (
          <p className="text-white/30 text-sm">Loading run history...</p>
        ) : runLogs.length === 0 ? (
          <p className="text-white/30 text-sm">No runs yet. Click &quot;Run Workflow&quot; to trigger.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-white/40 text-xs uppercase tracking-wider">
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                  <th className="text-left px-3 py-2 font-medium">Triggered By</th>
                  <th className="text-left px-3 py-2 font-medium">Started At</th>
                  <th className="text-left px-3 py-2 font-medium">Completed At</th>
                  <th className="text-left px-3 py-2 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {runLogs.map((log) => (
                  <tr key={log.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                    <td className="px-3 py-2">
                      <span className={`font-medium ${runLogStatusColor(log.status)}`}>{log.status}</span>
                    </td>
                    <td className="px-3 py-2 text-white/50">{log.triggered_by}</td>
                    <td className="px-3 py-2 text-white/50 text-xs">
                      {log.started_at ? new Date(log.started_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2 text-white/50 text-xs">
                      {log.completed_at ? new Date(log.completed_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2 text-red-400 text-xs max-w-[200px] truncate">
                      {log.error_message || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save / Cancel */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!workflowName || loading}
          className="px-4 py-2 text-sm font-medium bg-[#C6A664] text-black rounded-sm hover:bg-white transition-colors font-bold flex-1 disabled:opacity-40"
        >
          {loading ? 'Saving...' : workflowId ? 'Update Workflow' : 'Save Workflow'}
        </button>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-sm hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
