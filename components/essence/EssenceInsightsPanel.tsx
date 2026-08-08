import Link from 'next/link'

// ─────────────────────────────────────────────
// Shared type -- exported so the main essence page (and future
// role-specific pages) import from here instead of redefining it,
// which is how these things drift apart.
// ─────────────────────────────────────────────
export type EssenceRange = 'daily' | 'weekly' | 'monthly'

export type EssenceExtras = {
  topFive: string[]
  numerology: { number: number; label: string; range: EssenceRange } | null
  color: { name: string; hex: string; reason: string } | null
  modality: { type: 'cardinal' | 'fixed' | 'mutable'; sign?: string; reason: string } | null
  crystals: { name: string; reason: string }[]
  postingTime: { window: string; reason: string } | null
  businessMove: { action: string; hdType: string | null } | null
  personality: string
  blueprintTile: { tier: 'base' | 'enhanced' | 'expanded'; agentsUsed: string[]; content: string; upgradeMessage?: string } | null
  domainTiles: { domain: string; label: string; score: number; insight: string | null }[]
}

/**
 * First section extracted from the ~1300-line client/essence/page.tsx as a
 * proof of the "sections vs one large page" pattern. Chosen deliberately as
 * the safest extraction candidate: this block is pure display, reads only
 * from `extras`, and has exactly one interactive element (a single Link) --
 * no shared state with the deploy modal, matrix toggle, or range switching
 * that make the rest of that file risky to split apart without a build to
 * verify against.
 */
export default function EssenceInsightsPanel({ extras, prefix = '' }: { extras: EssenceExtras; prefix?: string }) {
  return (
    <>
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {extras.numerology && (
          <div className="glass rounded-sm border border-white/[0.06] p-3">
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Numerology</div>
            <div className="text-lg font-bold text-[#C6A664]">{extras.numerology.number}</div>
            <div className="text-[11px] text-white/40">{extras.numerology.label}</div>
          </div>
        )}
        {extras.color && (
          <div className="glass rounded-sm border border-white/[0.06] p-3">
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Your Color</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: extras.color.hex }} />
              <span className="text-sm font-semibold">{extras.color.name}</span>
            </div>
            <div className="text-[11px] text-white/40 mt-1">{extras.color.reason}</div>
          </div>
        )}
        {extras.modality && (
          <div className="glass rounded-sm border border-white/[0.06] p-3">
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Modality</div>
            <div className="text-sm font-semibold capitalize">{extras.modality.type}{extras.modality.sign ? ` (${extras.modality.sign})` : ''}</div>
            <div className="text-[11px] text-white/40 mt-1">{extras.modality.reason}</div>
          </div>
        )}
        {extras.crystals.length > 0 && (
          <div className="glass rounded-sm border border-white/[0.06] p-3">
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Crystal{extras.crystals.length > 1 ? 's' : ''}</div>
            <div className="text-sm font-semibold">{extras.crystals.map((c) => c.name).join(', ')}</div>
            <div className="text-[11px] text-white/40 mt-1">{extras.crystals[0]?.reason}</div>
          </div>
        )}
        {extras.postingTime && (
          <div className="glass rounded-sm border border-white/[0.06] p-3">
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Best Time to Post</div>
            <div className="text-sm font-semibold">{extras.postingTime.window}</div>
            <div className="text-[11px] text-white/40 mt-1">{extras.postingTime.reason}</div>
          </div>
        )}
        {extras.businessMove && (
          <div className="glass rounded-sm border border-white/[0.06] p-3">
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
              Business Move{extras.businessMove.hdType ? ` \u2014 ${extras.businessMove.hdType}` : ''}
            </div>
            <div className="text-[11px] text-white/60">{extras.businessMove.action}</div>
          </div>
        )}
        {extras.personality && (
          <div className="glass rounded-sm border border-white/[0.06] p-3 col-span-2">
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Personality</div>
            <div className="text-[11px] text-white/60">{extras.personality}</div>
          </div>
        )}
        {extras.topFive.length > 0 && (
          <div className="glass rounded-sm border border-white/[0.06] p-3 col-span-2 sm:col-span-3 lg:col-span-4">
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Your Top 5 Today</div>
            <ol className="space-y-1 list-decimal list-inside">
              {extras.topFive.map((t, i) => (
                <li key={i} className="text-[11px] text-white/60">{t}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* ── Purchased Domain Modules — permanent recurring categories ── */}
      {extras.domainTiles.length > 0 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {extras.domainTiles.map((d) => (
            <div key={d.domain} className="glass rounded-sm border border-white/[0.06] p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-widest text-white/30">{d.label} Module</span>
                <span className="text-[10px] text-[#C6A664] font-semibold">{d.score}/100</span>
              </div>
              {d.insight && <p className="text-[11px] text-white/60">{d.insight}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── Essence Engine tile (calls the Essence Engine agent(s), tier-gated) ── */}
      {extras.blueprintTile && (
        <div className="mb-6 glass rounded-sm border border-white/[0.06] p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[#C6A664] font-medium">Essence Engine</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 uppercase">{extras.blueprintTile.tier}</span>
            </div>
            {extras.blueprintTile.agentsUsed.length > 0 && (
              <span className="text-[10px] text-white/30">{extras.blueprintTile.agentsUsed.join(' + ')}</span>
            )}
          </div>
          <p className="text-sm text-white/70 whitespace-pre-line">{extras.blueprintTile.content}</p>
          {extras.blueprintTile.upgradeMessage && (
            <Link
              href={`${prefix}/profile`}
              className="inline-block mt-3 text-xs font-medium text-[#C6A664] hover:underline"
            >
              {extras.blueprintTile.upgradeMessage} →
            </Link>
          )}
        </div>
      )}
    </>
  )
}
