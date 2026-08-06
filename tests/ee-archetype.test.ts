import { describe, it, expect } from 'vitest'
import { synthesizeEEArchetype, archetypeNameFor, EE_ARCHETYPES } from '@/lib/profile/ee-archetype'

// Elemental engine emits lowercase primaryElement ('water'), matching
// ElementalProfile.primaryElement in types.ts.
const projectorWater = {
  humanDesign: { type: 'Projector', profile: '6/2' },
  elementalArchetype: { primaryElement: 'water' },
  numerology: { lifePath: { value: 9 } },
  astrology: { sunSign: 'Cancer' },
}

describe('synthesizeEEArchetype', () => {
  it('returns null with no signals', () => {
    expect(synthesizeEEArchetype({})).toBeNull()
  })

  it('falls back to The Seeker via archetypeNameFor with no signals', () => {
    expect(archetypeNameFor({} as any)).toBe('The Seeker')
  })

  it('always returns a canonical "The X" archetype', () => {
    const result = synthesizeEEArchetype(projectorWater)!
    expect(EE_ARCHETYPES).toContain(result.archetype)
    expect(result.archetype).toMatch(/^The /)
  })

  it('is deterministic', () => {
    const a = synthesizeEEArchetype(projectorWater)
    const b = synthesizeEEArchetype(projectorWater)
    expect(a).toEqual(b)
  })

  it('is HD-led: Projector 6/2 + water + life path 9 synthesizes to The Sage', () => {
    // Type Projector → Sage(4)/Navigator(3)/Seeker(2); line 6 → Sage(3);
    // life path 9 → Sage(1). Water (element + Cancer sun) → Navigator(2+2).
    // Sage = 4+3+1 = 8 beats Navigator = 3+2+2 = 7. Confidence 8/21 = 0.38 —
    // deliberately moderate: HD leads but other signals still temper it.
    const result = synthesizeEEArchetype(projectorWater)!
    expect(result.archetype).toBe('The Sage')
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.confidence).toBeLessThan(0.5)
    expect(result.superLayer).toBe('Purpose')
  })

  it('reports its contributing signals with HD-led weights', () => {
    const result = synthesizeEEArchetype(projectorWater)!
    const systems = result.signals.map((s) => s.system)
    expect(systems).toContain('humanDesign')
    expect(systems).toContain('elementalArchetype')
    expect(systems).toContain('numerology')
    expect(systems).toContain('astrology')
    // HD type pick set weight is the largest single signal: 4+3+2 = 9.
    const hdType = result.signals.find((s) => s.system === 'humanDesign' && s.value === 'Projector')!
    expect(hdType.weight).toBe(9)
    const numer = result.signals.find((s) => s.system === 'numerology')!
    expect(numer.weight).toBe(1)
  })

  it('builds rationale and summary wording', () => {
    const result = synthesizeEEArchetype(projectorWater)!
    expect(result.rationale.length).toBeGreaterThan(0)
    expect(result.rationale.join(' ')).toMatch(/Projector/)
    expect(result.summary.length).toBeGreaterThan(0)
  })

  it('handles partial inputs (HD only: type + line = 2 signals)', () => {
    const result = synthesizeEEArchetype({ humanDesign: { type: 'Manifestor', profile: '1/3' } })!
    expect(EE_ARCHETYPES).toContain(result.archetype)
    expect(result.signals.length).toBe(2)
  })

  it('every canonical archetype is reachable via the vote tables', () => {
    const cases: Array<[Record<string, any>, string]> = [
      [{ humanDesign: { type: 'Reflector', profile: '6/2' } }, 'The Weaver'],
      [{ humanDesign: { type: 'Generator', profile: '5/1' }, numerology: { lifePath: { value: 8 } } }, 'The Architect'],
      [{ numerology: { lifePath: { value: 9 } } }, 'The Sage'],
      [{ humanDesign: { profile: '5/1' } }, 'The Strategist'],
      [{ humanDesign: { type: 'Projector', profile: '3/5' } }, 'The Sage'],
      [{ humanDesign: { type: 'Manifesting Generator', profile: '2/4' } }, 'The Catalyst'],
      [{ humanDesign: { type: 'Projector' }, elementalArchetype: { primaryElement: 'water' } }, 'The Navigator'],
    ]
    for (const [input, expected] of cases) {
      expect(archetypeNameFor(input as any), JSON.stringify(input)).toBe(expected)
    }
  })
})
