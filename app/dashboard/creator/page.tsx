import { createAdminClient, createServiceClient } from '@/lib/supabase/server'
import EssenceBoard from '@/components/EssenceBoard'
import UpgradePanel from '@/components/UpgradePanel'
import Link from 'next/link'

// Essence profile data lives in client_twins.metadata.lenses.humanDesign (set by intake/calculate)
function extractEssenceProfile(clientTwin: any) {
  const blueprint = clientTwin?.metadata?.lenses?.humanDesign?.data ?? null
  if (!blueprint) return null
  return {
    version: 1,
    confidence_score: blueprint.overallScore != null ? `${blueprint.overallScore}%` : '—',
    daily_essence: blueprint.archetype || null,
    profile_kind: 'active',
    identity_summary: blueprint.summary || null,
    personality_traits: blueprint.scores || null,
  }
}

export default async function CreatorDashboard() {
  // 1. Verify identity via cookie-based admin client
  const auth = await createAdminClient()
  const { data: { user: _user } } = await auth.auth.getUser()
  const user = _user!

  // 2. All DB work goes through the service-role client (bypasses RLS)
  const svc = createServiceClient()
  const { data: twin } = await svc
    .from('client_twins')
    .select('metadata')
    .eq('client_id', user.id)
    .maybeSingle()

  const profile = extractEssenceProfile(twin)

  // ── Creator layer: courses, audience, revenue ──
  // courses/course_enrollments existed in the schema but were never
  // surfaced on the Creator dashboard -- same pattern as the Business
  // pipeline last pass. Revenue here is list-price x enrollments (no
  // payments/payouts table exists yet to pull actual collected revenue --
  // flagged honestly below rather than shown as if it were real payout data).
  const { data: courses } = await svc
    .from('courses')
    .select('id, title, price, is_published, lesson_count')
    .eq('creator_client_id', user.id)

  const courseIds = (courses ?? []).map((c) => c.id)
  const { data: enrollments } = courseIds.length
    ? await svc.from('course_enrollments').select('course_id, completed_at').in('course_id', courseIds)
    : { data: [] }

  const publishedCount = (courses ?? []).filter((c) => c.is_published).length
  const totalEnrollments = enrollments?.length ?? 0
  const completions = (enrollments ?? []).filter((e) => e.completed_at).length
  const estimatedRevenue = (courses ?? []).reduce((sum, c) => {
    const courseEnrollments = (enrollments ?? []).filter((e) => e.course_id === c.id).length
    return sum + (Number(c.price) || 0) * courseEnrollments
  }, 0)

  const stats = [
    { label: 'Published Courses', value: publishedCount,                          color: '#5E8B84' },
    { label: 'Total Enrollments', value: totalEnrollments,                        color: '#C6A664' },
    { label: 'Completion Rate',   value: totalEnrollments ? `${Math.round((completions / totalEnrollments) * 100)}%` : '—', color: '#8B7AA8' },
    { label: 'Est. Revenue',      value: `$${estimatedRevenue.toLocaleString()}`, color: '#B5764A' },
  ]

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">Creator Studio</h1>
        <p className="text-white/30 text-sm">Build, deploy, and monetize your intelligence</p>
      </div>

      {/* Essence Board — center stage, same as every other dashboard */}
      <div className="mb-8">
        <div className="text-xs text-[#5E8B84] tracking-widest uppercase font-medium mb-3">
          Zuri's Direction For You
        </div>
        <EssenceBoard userId={user.id} userRole="creator" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
        {stats.map(s => (
          <div key={s.label} className="glass rounded-sm p-5">
            <div className="text-xs text-white/30 tracking-widest uppercase mb-3">{s.label}</div>
            <div className="text-2xl font-light" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-white/20 mb-8">
        Est. Revenue is list price × enrollments -- no payments/payouts table exists yet to show actual collected revenue.
      </p>

      {/* Courses list */}
      <div className="glass rounded-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-white/30 tracking-widest uppercase">Your Courses</span>
          <Link href="/dashboard/creator/intelligences" className="text-[11px] text-[#5E8B84] hover:text-white transition-colors">
            Content Studio →
          </Link>
        </div>
        {courses && courses.length > 0 ? (
          <div className="divide-y divide-white/[0.04]">
            {courses.map((c) => {
              const enrolled = (enrollments ?? []).filter((e) => e.course_id === c.id).length
              return (
                <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/80">{c.title}</div>
                    <div className="text-[11px] text-white/30 mt-0.5">{c.lesson_count ?? 0} lessons · {enrolled} enrolled</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.is_published ? 'bg-[#5E8B84]/10 text-[#5E8B84] border border-[#5E8B84]/20' : 'bg-white/5 text-white/30 border border-white/10'
                    }`}>
                      {c.is_published ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-sm text-[#C6A664]">${Number(c.price ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-white/20 text-sm">
            No courses yet.{' '}
            <Link href="/dashboard/creator/intelligences" className="text-[#5E8B84] hover:underline">
              Build your first course →
            </Link>
          </div>
        )}
      </div>

      {/* Profile section */}
      <div className="glass rounded-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-white/30 tracking-widest uppercase">Your Intelligence Profile</span>
        </div>

        {profile ? (
          <div className="p-6 space-y-4">
            <div className="text-sm text-white/60">{profile.identity_summary ?? 'No identity summary yet.'}</div>
            {profile.personality_traits && (
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(profile.personality_traits as Record<string, number>).map(([trait, score]) => (
                  <div key={trait} className="glass rounded-sm p-3">
                    <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{trait}</div>
                    <div className="text-lg text-[#C6A664]">{(score * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-white/20 text-sm">
            No intelligence profile yet.{' '}
            <span className="text-[#5E8B84] cursor-pointer hover:underline">
              Complete your onboarding →
            </span>
          </div>
        )}
      </div>

      <UpgradePanel currentRole="creator" />
    </div>
  )
}
