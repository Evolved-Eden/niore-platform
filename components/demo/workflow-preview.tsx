'use client'

import { useState } from 'react'

type WorkflowPreviewProps = {
  verticalColor: string
  workflowIds: string[]
}

const WORKFLOWS: Record<string, {
  id: string
  name: string
  description: string
  trigger: string
  steps: string[]
  outputs: string[]
}> = {
  wf1: {
    id: 'wf1',
    name: 'Queue Poller',
    description: 'Monitors incoming queues for new leads, bookings, and client actions. Routes each event to the right agent for processing.',
    trigger: 'New record in queue table',
    steps: [
      'Poll queue table every 60 seconds',
      'Identify event type (lead, booking, request)',
      'Route to appropriate agent',
      'Execute agent action',
      'Log result and update queue status',
    ],
    outputs: ['Lead captured', 'Booking confirmed', 'Request routed', 'Notification sent'],
  },
  wf2: {
    id: 'wf2',
    name: 'Scheduler',
    description: 'Runs on cron schedules for daily intelligence briefs, retention checks, market reports, and time-based agent actions.',
    trigger: 'Cron schedule (daily, hourly, weekly)',
    steps: [
      'Calculate next run from cron expression',
      'Check conditions for execution',
      'Execute scheduled agent actions',
      'Generate reports and insights',
      'Deliver to dashboard and Essence Board',
    ],
    outputs: ['Daily Essence Board', 'Retention report', 'Market update', 'Scheduled action executed'],
  },
  wf3: {
    id: 'wf3',
    name: 'Webhook Bridge',
    description: 'Listens for real-time events from external systems — calendar bookings, form submissions, payment confirmations — and triggers agent responses.',
    trigger: 'Incoming webhook payload',
    steps: [
      'Receive webhook event',
      'Validate payload and signature',
      'Parse event data',
      'Trigger relevant agent',
      'Return confirmation response',
    ],
    outputs: ['Real-time booking sync', 'Form submission processed', 'Payment confirmed', 'External event handled'],
  },
  wf4: {
    id: 'wf4',
    name: 'Memory Sync',
    description: 'Synchronizes intelligence across all agents — sharing context, updating profiles, and maintaining cross-platform memory consistency.',
    trigger: 'Agent output event or schedule',
    steps: [
      'Collect agent outputs and context',
      'Update shared memory store',
      'Resolve conflicts and deduplicate',
      'Broadcast updates to relevant agents',
      'Log sync status and metrics',
    ],
    outputs: ['Cross-agent context sync', 'Profile updates', 'Memory consistency', 'Sync metrics'],
  },
  wf5: {
    id: 'wf5',
    name: 'Reply Recovery',
    description: 'Monitors disengagement signals and triggers re-engagement campaigns. Follows up on outstanding items and recovers at-risk relationships.',
    trigger: 'Disengagement signal or inactivity threshold',
    steps: [
      'Detect disengagement signal',
      'Score recovery priority',
      'Generate personalized re-engagement message',
      'Send through preferred channel',
      'Track response and update profile',
    ],
    outputs: ['Re-engagement campaign', 'Follow-up sent', 'At-risk recovery', 'Engagement score updated'],
  },
}

export default function WorkflowPreview({ verticalColor, workflowIds }: WorkflowPreviewProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const workflows = workflowIds.map(id => WORKFLOWS[id]).filter(Boolean)

  if (workflows.length === 0) return null

  return (
    <div>
      <p className="text-xs text-white/30 tracking-widest uppercase mb-3">Connected Workflows</p>
      <div className="space-y-2">
        {workflows.map((wf) => {
          const isOpen = expanded === wf.id
          return (
            <div key={wf.id} className="rounded-sm border border-white/[0.06] overflow-hidden transition-all">
              <button
                onClick={() => setExpanded(isOpen ? null : wf.id)}
                className="flex items-center justify-between w-full p-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: verticalColor }}>⚡</span>
                  <div>
                    <span className="text-xs font-medium text-white/70">{wf.name}</span>
                    <p className="text-[10px] text-white/40">{wf.trigger}</p>
                  </div>
                </div>
                <svg
                  className={`w-3 h-3 text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-white/[0.06] p-3 space-y-3 animate-fade-in">
                  <p className="text-xs text-white/50 leading-relaxed">{wf.description}</p>

                  <div>
                    <p className="text-[10px] text-white/30 mb-1.5">Steps</p>
                    <div className="space-y-1">
                      {wf.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-[9px] font-mono text-white/20 min-w-[14px]">{i + 1}.</span>
                          <span className="text-[11px] text-white/50">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-white/30 mb-1.5">Outputs</p>
                    <div className="flex flex-wrap gap-1">
                      {wf.outputs.map((out) => (
                        <span key={out} className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-white/40">
                          {out}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
