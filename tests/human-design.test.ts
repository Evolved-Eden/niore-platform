import { describe, it, expect } from 'vitest'
import { calculateHumanDesign } from '@/lib/profile/human-design'

// Shemeca Erica Bennett — F, 1980-04-07 23:14 EST, Queens NY.
// 23:14 EST = 04:14 UTC on Apr 8. Queens NY ≈ lat 40.7282, lon -73.7949.
const SHEMECA = {
  birthDate: new Date(Date.UTC(1980, 3, 8, 4, 14, 0)),
  latitude: 40.7282,
  longitude: -73.7949,
}

// Reference chart facts (user-provided chart data, Rave Mandala rebuild):
// - Personality Sun 51.4, Personality Earth 57, Design Sun 54.6, Design Earth 53
// - Defined channels: 6-59 Mating, 20-57 The Brainwave, 28-38 Struggle,
//   32-54 Transformation, 47-64 Abstraction
// - Defined centers: Solar Plexus, Sacral, Throat, Spleen, Root, Ajna, Head
// - Profile 4/6, Emotional authority, triple split, RAX Penetration.
// - Canonical type: Generator (her chart software's "Manifesting Generator"
//   label is a known mislabel — no motor connects to the Throat).

describe('calculateHumanDesign — Shemeca reference chart', () => {
  const hd = calculateHumanDesign(SHEMECA)!

  it('computes a chart', () => {
    expect(hd).not.toBeNull()
  })

  it('maps the four cross gates from longitudes', () => {
    expect(hd.personalitySun.gate).toBe(51)
    expect(hd.personalitySun.line).toBe(4)
    expect(hd.personalityPlanets['Earth'].gate).toBe(57)
    expect(hd.designSun.gate).toBe(54)
    expect(hd.designSun.line).toBe(6)
    expect(hd.designPlanets['Earth'].gate).toBe(53)
  })

  it('profile is 4/6', () => {
    expect(hd.profile).toBe('4/6')
  })

  it('type is Generator (canonical, not the software mislabel)', () => {
    expect(hd.type).toBe('Generator')
  })

  it('authority is Emotional', () => {
    expect(hd.authority).toBe('Emotional')
  })

  it('definition is Triple Split', () => {
    expect(hd.definition).toBe('Triple Split')
  })

  it('incarnation cross is RAX of Penetration', () => {
    expect(hd.incarnationCross).toContain('Right Angle Cross of Penetration')
  })

  it('strategy / signature / not-self match Generator', () => {
    expect(hd.strategy).toBe('To Respond')
    expect(hd.signature).toBe('Satisfaction')
    expect(hd.notSelf).toBe('Frustration')
  })

  it('finds exactly the 5 reference channels', () => {
    expect([...(hd.channels ?? [])].sort()).toEqual([
      'Mating',
      'The Brainwave',
      'Struggle',
      'Transformation',
      'Abstraction',
    ].sort())
  })

  it('defines the 7 expected centers and no others', () => {
    expect([...(hd.centers ?? [])].sort()).toEqual([
      'Ajna', 'Head', 'Root', 'Sacral', 'Solar Plexus', 'Spleen', 'Throat',
    ].sort())
    expect(hd.centers).not.toContain('G')
    expect(hd.centers).not.toContain('Heart')
  })

  it('defined gates match the reference activation set', () => {
    const gates = hd.gates.map(g => g.gate).sort((a, b) => a - b)
    expect(gates).toEqual([
      5, 6, 14, 20, 22, 26, 28, 29, 30, 32,
      38, 40, 47, 49, 51, 53, 54, 57, 59, 64,
    ])
  })
})
