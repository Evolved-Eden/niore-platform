import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// ── EE Core Engine ─────────────────────────────────────────────
// Calculates the user's foundational profile from birth data.
// Uses gate/degree mathematics internally but outputs EE proprietary domains.
// Gates 1-64 map to specific degrees of the ecliptic (each ~5.625°)

const GATES: Record<number, { name: string; hexagram: number; geneKey: string; keyword: string }> = {
  1:  { name: 'Creativity', hexagram: 1, geneKey: 'The Creative', keyword: 'Self-Expression' },
  2:  { name: 'Direction', hexagram: 2, geneKey: 'Receptivity', keyword: 'Alignment' },
  3:  { name: 'Ordering', hexagram: 3, geneKey: 'Difficulty at the Beginning', keyword: 'Innovation' },
  4:  { name: 'Formula', hexagram: 4, geneKey: 'Youthful Folly', keyword: 'Understanding' },
  5:  { name: 'Rhythm', hexagram: 5, geneKey: 'Waiting', keyword: 'Patience' },
  6:  { name: 'Friction', hexagram: 6, geneKey: 'Conflict', keyword: 'Standards' },
  7:  { name: 'The Role of Self', hexagram: 7, geneKey: 'The Army', keyword: 'Leadership' },
  8:  { name: 'Contribution', hexagram: 8, geneKey: 'Holding Together', keyword: 'Authenticity' },
  9:  { name: 'Detail', hexagram: 9, geneKey: 'Small Taming Power', keyword: 'Focus' },
  10: { name: 'Self-Behavior', hexagram: 10, geneKey: 'Treading', keyword: 'Presence' },
  11: { name: 'Ideas', hexagram: 11, geneKey: 'Peace', keyword: 'Vision' },
  12: { name: 'Caution', hexagram: 12, geneKey: 'Standstill', keyword: 'Articulation' },
  13: { name: 'Listener', hexagram: 13, geneKey: 'Fellowship', keyword: 'Empathy' },
  14: { name: 'Power Skills', hexagram: 14, geneKey: 'Possession in Great Measure', keyword: 'Abundance' },
  15: { name: 'Extremes', hexagram: 15, geneKey: 'Modesty', keyword: 'Rhythm' },
  16: { name: 'Skills', hexagram: 16, geneKey: 'Enthusiasm', keyword: 'Mastery' },
  17: { name: 'Opinions', hexagram: 17, geneKey: 'Following', keyword: 'Perspective' },
  18: { name: 'Correction', hexagram: 18, geneKey: 'Work on What Has Been Spoiled', keyword: 'Improvement' },
  19: { name: 'Wanting', hexagram: 19, geneKey: 'Approach', keyword: 'Connection' },
  20: { name: 'Contemplation', hexagram: 20, geneKey: 'Contemplation', keyword: 'Awareness' },
  21: { name: 'Biting Through', hexagram: 21, geneKey: 'Biting Through', keyword: 'Control' },
  22: { name: 'Grace', hexagram: 22, geneKey: 'Grace', keyword: 'Receptivity' },
  23: { name: 'Assimilation', hexagram: 23, geneKey: 'Splitting Apart', keyword: 'Distinction' },
  24: { name: 'Return', hexagram: 24, geneKey: 'Return', keyword: 'Renewal' },
  25: { name: 'Innocence', hexagram: 25, geneKey: 'Innocence', keyword: 'Spontaneity' },
  26: { name: 'Taming Power', hexagram: 26, geneKey: 'Taming Power of the Great', keyword: 'Ego' },
  27: { name: 'Nurturing', hexagram: 27, geneKey: 'Nourishment', keyword: 'Care' },
  28: { name: 'The Game Player', hexagram: 28, geneKey: 'Preponderance of the Great', keyword: 'Purpose' },
  29: { name: 'Abyss', hexagram: 29, geneKey: 'The Abysmal', keyword: 'Commitment' },
  30: { name: 'Clinging Fire', hexagram: 30, geneKey: 'Clinging Fire', keyword: 'Desire' },
  31: { name: 'Influence', hexagram: 31, geneKey: 'Influence', keyword: 'Leadership' },
  32: { name: 'Continuity', hexagram: 32, geneKey: 'Duration', keyword: 'Consistency' },
  33: { name: 'Withdrawal', hexagram: 33, geneKey: 'Retreat', keyword: 'Privacy' },
  34: { name: 'Power', hexagram: 34, geneKey: 'The Power of the Great', keyword: 'Vitality' },
  35: { name: 'Change', hexagram: 35, geneKey: 'Progress', keyword: 'Adaptability' },
  36: { name: 'Darkening of Light', hexagram: 36, geneKey: 'Darkening of the Light', keyword: 'Crisis' },
  37: { name: 'Friendship', hexagram: 37, geneKey: 'The Family', keyword: 'Equality' },
  38: { name: 'Opposition', hexagram: 38, geneKey: 'Opposition', keyword: 'Struggle' },
  39: { name: 'Obstruction', hexagram: 39, geneKey: 'Obstruction', keyword: 'Challenge' },
  40: { name: 'Aloneness', hexagram: 40, geneKey: 'Deliverance', keyword: 'Rest' },
  41: { name: 'Contraction', hexagram: 41, geneKey: 'Decrease', keyword: 'Imagination' },
  42: { name: 'Growth', hexagram: 42, geneKey: 'Increase', keyword: 'Completion' },
  43: { name: 'Breakthrough', hexagram: 43, geneKey: 'Breakthrough', keyword: 'Insight' },
  44: { name: 'Alertness', hexagram: 44, geneKey: 'Coming to Meet', keyword: 'Pattern Recognition' },
  45: { name: 'Gathering', hexagram: 45, geneKey: 'Gathering Together', keyword: 'Leadership' },
  46: { name: 'Determination', hexagram: 46, geneKey: 'Pushing Upward', keyword: 'Luck' },
  47: { name: 'Oppression', hexagram: 47, geneKey: 'Oppression', keyword: 'Transformation' },
  48: { name: 'Depth', hexagram: 48, geneKey: 'The Well', keyword: 'Resourcefulness' },
  49: { name: 'Principles', hexagram: 49, geneKey: 'Revolution', keyword: 'Rejection' },
  50: { name: 'Values', hexagram: 50, geneKey: 'The Cauldron', keyword: 'Nourishment' },
  51: { name: 'Shock', hexagram: 51, geneKey: 'The Arousing', keyword: 'Courage' },
  52: { name: 'Stillness', hexagram: 52, geneKey: 'Keeping Still', keyword: 'Composure' },
  53: { name: 'Developments', hexagram: 53, geneKey: 'Development', keyword: 'Growth' },
  54: { name: 'Ambition', hexagram: 54, geneKey: 'The Marrying Maiden', keyword: 'Aspiration' },
  55: { name: 'Abundance', hexagram: 55, geneKey: 'Abundance', keyword: 'Spirit' },
  56: { name: 'Wandering', hexagram: 56, geneKey: 'The Wanderer', keyword: 'Communication' },
  57: { name: 'Intuition', hexagram: 57, geneKey: 'The Gentle', keyword: 'Clarity' },
  58: { name: 'Joy', hexagram: 58, geneKey: 'The Joyous', keyword: 'Vitality' },
  59: { name: 'Sexuality', hexagram: 59, geneKey: 'Dispersion', keyword: 'Intimacy' },
  60: { name: 'Limitation', hexagram: 60, geneKey: 'Limitation', keyword: 'Realism' },
  61: { name: 'Inner Truth', hexagram: 61, geneKey: 'Inner Truth', keyword: 'Mystery' },
  62: { name: 'Detail', hexagram: 62, geneKey: 'Preponderance of the Small', keyword: 'Precision' },
  63: { name: 'Doubt', hexagram: 63, geneKey: 'After Completion', keyword: 'Skepticism' },
  64: { name: 'Unfinished', hexagram: 64, geneKey: 'Before Completion', keyword: 'Confusion' },
}

// Approximate sun ecliptic longitude for a given date
function sunLongitude(date: Date): number {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()

  // Day of year (1 = Jan 1)
  const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let dayOfYear = day
  for (let i = 0; i < month; i++) dayOfYear += monthDays[i]
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  if (isLeap && month > 1) dayOfYear += 1

  // Vernal equinox ~ March 20 (day 79). Sun moves ~0.9856°/day.
  const daysSinceEquinox = dayOfYear - 80
  let longitude = daysSinceEquinox * (360 / 365.25)

  // Normalize to 0-360
  return ((longitude % 360) + 360) % 360
}

function gateFromLongitude(lon: number): number {
  // Each gate spans 5.625° (360/64)
  const gateNum = Math.floor(((lon + 360) % 360) / 5.625) + 1
  return Math.min(Math.max(gateNum, 1), 64)
}

function getDesignDate(birthDate: Date): Date {
  // The unconscious/design side is calculated from ~88 days before birth
  const ms = birthDate.getTime() - 88 * 24 * 60 * 60 * 1000
  return new Date(ms)
}

function getSuggestedPath(type: string, roleType: string, sellTo: string, offerType: string, personalType: string): { path: string; role: string } {
  if (roleType === 'creator') return { path: 'Creator', role: 'creator' }
  if (roleType === 'client') return { path: 'Client', role: 'client' }
  if (roleType === 'both') {
    const b2b = sellTo === 'businesses'
    return { path: b2b ? 'Client' : 'Creator', role: b2b ? 'client' : 'creator' }
  }
  const typeBased = type === 'Projector' ? 'Client' : 'Creator'
  return { path: typeBased, role: typeBased.toLowerCase() }
}

function determineType(sunGate: number, designGate: number): string {
  // Simplified type determination based on gate combinations
  // Generator types: gates 3, 5, 9, 14, 27, 29, 34, 39, 41, 42, 59
  const generatorGates = [3, 5, 9, 14, 27, 29, 34, 39, 41, 42, 59]
  // Projector types: gates 1, 2, 4, 7, 8, 10, 11, 13, 15, 16, 17, 18, 20, 22, 23, 24, 26, 28, 30, 31, 32, 33, 35, 36, 37, 38, 40, 43, 44, 45, 46, 47, 48, 49, 50, 52, 53, 54, 55, 56, 57, 58, 60, 61, 62, 63, 64
  const projectorGates = [1, 2, 4, 7, 8, 10, 11, 13, 15, 16, 17, 18, 20, 22, 23, 24, 26, 28, 30, 31, 32, 33, 35, 36, 37, 38, 40, 43, 44, 45, 46, 47, 48, 49, 50, 52, 53, 54, 55, 56, 57, 58, 60, 61, 62, 63, 64]
  // Manifestor types: gates 21, 25, 35, 38, 39, 45, 51
  const manifestorGates = [21, 25, 35, 38, 39, 45, 51]

  if (generatorGates.includes(sunGate) || generatorGates.includes(designGate)) return 'Generator'
  if (manifestorGates.includes(sunGate) || manifestorGates.includes(designGate)) return 'Manifestor'
  if (projectorGates.includes(sunGate) || projectorGates.includes(designGate)) return 'Projector'
  return 'Generator' // Default — most common
}

function getStrategy(type: string): string {
  const strategies: Record<string, string> = {
    'Generator': 'Wait to respond. Your energy is a force of nature — let life bring opportunities to you before investing your energy.',
    'Manifesting Generator': 'Respond then inform. You have explosive energy — wait for the spark, then move with lightning speed while keeping others in the loop.',
    'Manifestor': 'Inform before you act. Your impact on others is powerful — give them the courtesy of knowing your moves in advance.',
    'Projector': 'Wait for the invitation. Your gift is seeing deeply into others — wait to be recognized and invited before offering your insights.',
    'Reflector': 'Wait a lunar cycle. You reflect the world around you — give yourself a full 28 days before making major decisions.',
  }
  return strategies[type] ?? strategies['Generator']
}

function getAuthority(type: string): string {
  const authorities: Record<string, string> = {
    'Generator': 'Sacral Authority — trust your gut response. You have a visceral yes/no. Practice noticing the subtle bodily signals.',
    'Manifesting Generator': 'Sacral Authority — same as Generator. Your gut is your compass. Respond before you act.',
    'Manifestor': 'Emotional Authority — clarity comes with time. Don\'t rush decisions. Let the emotional wave settle before committing.',
    'Projector': 'Splenic Authority — intuitive knowing. You get hunches in the moment. Trust your first instinct before your mind analyzes.',
    'Reflector': 'Lunar Authority — time is your ally. Give yourself a full moon cycle before deciding anything major.',
  }
  return authorities[type] ?? authorities['Generator']
}

function getProfile(sunGate: number): { profile: string; name: string; desc: string } {
  // Simplified profile from sun gate
  const profiles = [
    { profile: '1/3', name: 'Investigative Martyr', desc: 'You learn through deep research and trial & error. Trust your process of experimentation.' },
    { profile: '1/4', name: 'Investigative Opportunist', desc: 'You research deeply and share with your network. Your curiosity builds community.' },
    { profile: '2/4', name: 'Hermit Opportunist', desc: 'You need solitude to recharge but thrive when sharing your gifts. Natural teacher.' },
    { profile: '2/5', name: 'Hermit Heretic', desc: 'You have natural gifts that, when shared, can be profoundly influential. Lead by example.' },
    { profile: '3/5', name: 'Martyr Heretic', desc: 'You learn through trial & error and have a practical wisdom that others need. Keep experimenting.' },
    { profile: '3/6', name: 'Martyr Role Model', desc: 'You learn through experience and eventually become a wise elder others look up to.' },
    { profile: '4/6', name: 'Opportunist Role Model', desc: 'You build networks and eventually become an authority figure. Your reputation precedes you.' },
    { profile: '5/1', name: 'Heretic Investigator', desc: 'You have practical solutions that others need, backed by deep research. Trust your findings.' },
    { profile: '6/2', name: 'Role Model Hermit', desc: 'You\'re here to eventually become a wise leader. In the meantime, honor your need for solitude.' },
    { profile: '6/3', name: 'Role Model Martyr', desc: 'Your wisdom comes from lived experience. You\'ll make mistakes, but they\'ll become your greatest teachings.' },
  ]
  return profiles[(sunGate - 1) % profiles.length]
}

function getGateInsights(gate: number): string[] {
  const insights: Record<number, string[]> = {
    1:  ['Your gift is creativity — you bring new forms into existence.', 'Shadow: Chaos when your creative energy has no outlet.', 'Siddhi: Pure self-expression that inspires others.'],
    2:  ['You have a natural magnetism that draws the right resources.', 'Shadow: Withdrawal when you feel unsupported.', 'Siddhi: Unshakeable alignment with your path.'],
    3:  ['Innovation is your superpower — everything can be improved.', 'Shadow: Restlessness from constantly changing direction.', 'Siddhi: The ability to bring heaven to earth through innovation.'],
    4:  ['You understand deeply and can explain complex things simply.', 'Shadow: Intolerance for those who don\'t see what you see.', 'Siddhi: Universal understanding — you see the patterns in everything.'],
    5:  ['Patience is your path — timing is everything for you.', 'Shadow: Impatience that leads to poor decisions.', 'Siddhi: Perfect timing — you know exactly when to act.'],
    6:  ['You have high standards and a natural sense of quality.', 'Shadow: Conflict from being too critical.', 'Siddhi: True diplomacy — you create peace through integrity.'],
    7:  ['You are a natural leader — others look to you for direction.', 'Shadow: Arrogance in your leadership.', 'Siddhi: Humble leadership that empowers everyone.'],
    8:  ['Your contribution is unique — only you can give what you have.', 'Shadow: People-pleasing to be accepted.', 'Siddhi: Pure authentic contribution that transforms.'],
    10: ['Presence is your gift — you inspire others just by being yourself.', 'Shadow: Self-absorption.', 'Siddhi: Being the change you wish to see in the world.'],
    13: ['You are a natural listener — people feel heard by you.', 'Shadow: Gossip when not honoring the trust.', 'Siddhi: Empathy that heals and connects.'],
    20: ['You are highly aware and see what others miss.', 'Shadow: Overwhelm from seeing too much.', 'Siddhi: Pure awareness that brings clarity.'],
    25: ['Spontaneity is your nature — you are naturally innocent and open.', 'Shadow: Naivety that gets taken advantage of.', 'Siddhi: The innocence of a child that sees magic everywhere.'],
    28: ['You have a deep sense of purpose — life is a game worth playing.', 'Shadow: Fear of meaninglessness.', 'Siddhi: Total commitment to your purpose.'],
    30: ['Desire fuels your evolution — you want deeply.', 'Shadow: Unfulfilled longing.', 'Siddhi: Pure desire that aligns with destiny.'],
    34: ['You have tremendous vitality and power when you\'re doing what you love.', 'Shadow: Misuse of personal power.', 'Siddhi: Power in service of the greater good.'],
    41: ['Your imagination is vast — you can dream entire worlds.', 'Shadow: Fantasy that disconnects from reality.', 'Siddhi: Imagination that manifests reality.'],
    51: ['Courage is your path — you\'re meant to shake things up.', 'Shadow: Recklessness from fear.', 'Siddhi: The courage to awaken others.'],
    55: ['You are deeply connected to spirit and abundance.', 'Shadow: Victim consciousness.', 'Siddhi: Freedom of spirit that liberates everyone.'],
    57: ['Your intuition is razor-sharp — you know things without knowing how.', 'Shadow: Anxiety from not trusting your gut.', 'Siddhi: Crystal clear intuition that guides perfectly.'],
    61: ['You are drawn to the mysteries — truth is your obsession.', 'Shadow: Overthinking that clouds the truth.', 'Siddhi: Inner knowing of universal truths.'],
  }
  return insights[gate] ?? [
    'You have a unique perspective that only you can bring.',
    'Trust your inner knowing — it knows the way.',
    'Your presence alone is a contribution to everyone around you.',
  ]
}

function getBirthMonthInsight(month: number): string {
  const birthInsights: Record<number, string> = {
    1: 'January-born — You have a natural leadership quality. You\'re an initiator who isn\'t afraid to start things.',
    2: 'February-born — You have deep intuition and a poetic soul. You see the beauty that others miss.',
    3: 'March-born — You\'re a natural visionary with the ability to dream big and make it real.',
    4: 'April-born — You have raw determination. Once you set your mind to something, nothing can stop you.',
    5: 'May-born — You\'re a natural communicator with a gift for expressing complex ideas simply.',
    6: 'June-born — You have a gift for connection and relationship-building. People are drawn to your warmth.',
    7: 'July-born — You\'re fiercely independent with a strong sense of self. Your confidence is magnetic.',
    8: 'August-born — You have natural leadership ability and a drive to build something lasting.',
    9: 'September-born — You have a sharp analytical mind. You see through to the truth of any situation.',
    10: 'October-born — You have natural diplomacy. You bring balance wherever you go.',
    11: 'November-born — You\'re a natural philosopher with deep insights about life and human nature.',
    12: 'December-born — You have a gift for vision and big-picture thinking. You see the future.',
  }
  return birthInsights[month] ?? 'You are uniquely positioned to bring something new into the world.'
}

function getArchetypeRecommendation(gate: number): string {
  const archetypes = ['Innovator', 'Builder', 'Mentor', 'Explorer', 'Empire', 'Academy', 'Visionary', 'Alchemist']
  return archetypes[(gate - 1) % archetypes.length]
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, dob, birthTime, birthLocation, birthTimezone, sellTo, roleType, offerType, personalType } = await req.json()

    if (!name || !dob) {
      return NextResponse.json({ error: 'Name and date of birth are required' }, { status: 400 })
    }

    // Parse birth date
    const birthDate = new Date(dob + 'T' + (birthTime || '12:00') + ':00' + (birthTimezone || '+00:00'))

    // Calculate sun gate (conscious/personality)
    const sunLon = sunLongitude(birthDate)
    const sunGate = gateFromLongitude(sunLon)

    // Calculate design gate (unconscious — 88 days before birth)
    const designDate = getDesignDate(birthDate)
    const designLon = sunLongitude(designDate)
    const designGate = gateFromLongitude(designLon)

    // Determine type
    const type = determineType(sunGate, designGate)

    // Get additional layered insights
    const sunGateInfo = GATES[sunGate]
    const designGateInfo = GATES[designGate]
    const strategy = getStrategy(type)
    const authority = getAuthority(type)
    const profile = getProfile(sunGate)
    const archetype = getArchetypeRecommendation(sunGate)
    const birthMonthInsight = getBirthMonthInsight(birthDate.getUTCMonth() + 1)

    // ── Calculate EE domain scores from gate data ──
    const visionaryScore   = Math.min(100, Math.round(50 + (sunGate * 0.8)))
    const buildingScore    = Math.min(100, Math.round(50 + (designGate * 0.7)))
    const connectingScore  = Math.min(100, Math.round(40 + ((64 - sunGate) * 0.9)))
    const analyzingScore   = Math.min(100, Math.round(45 + (Math.abs(sunGate - designGate) * 1.2)))
    const leadingScore     = Math.min(100, Math.round(50 + ((sunGate + designGate) * 0.4)))
    const creatingScore    = Math.min(100, Math.round(55 + ((64 - designGate) * 0.6)))

    const summary = `Your profile reveals a ${profile.name} operating pattern with a natural gift for ${sunGateInfo.keyword}. Your growth edge lies in ${designGateInfo.name}. As a ${archetype}, you thrive when you follow your ${type.toLowerCase()} energy rhythm.`

    const result = {
      blueprint: {
        archetype,
        completeness: 65,
        foundation: {
          coreArch: profile.name,
          naturalGift: sunGateInfo.keyword,
          growthEdge: designGateInfo.name,
          energyType: type,
          operatingRhythm: strategy,
        },
        scores: {
          visionary: visionaryScore,
          building: buildingScore,
          connecting: connectingScore,
          analyzing: analyzingScore,
          leading: leadingScore,
          creating: creatingScore,
        },
        summary,
      },
      essence: {
        mindArchitecture: profile.name,
        decisionStyle: authority.split('—')[0].trim(),
        communicationStyle: sunGateInfo.name,
        emotionalPattern: designGateInfo.geneKey,
        creativityStyle: sunGateInfo.keyword,
        summary: profile.desc,
      },
      archetype: {
        primary: archetype,
        avatar: archetype.toLowerCase().replace(/\s+/g, '_'),
        description: profile.desc,
        domains: [archetype.toLowerCase(), 'growth', 'creation', 'connection'],
      },
      rhythm: {
        energyType: type,
        peakTimes: sunGate <= 32 ? 'Late morning, early evening' : 'Afternoon, late night',
        recoveryNeed: designGate <= 32 ? 'Solitude and quiet reflection' : 'Social connection and movement',
      },
      timing: {
        personalYear: ((sunGate % 9) + 9) % 9 + 1,
        currentCycle: (['New Beginnings', 'Growth', 'Expansion', 'Integration', 'Transformation', 'Re-evaluation', 'Depth', 'Harvest', 'Completion'])[((sunGate % 9) + 9) % 9],
      },
      recommendation: {
        archetype,
        suggestedPath: getSuggestedPath(type, roleType, sellTo, offerType, personalType).path,
        reason: `Based on your ${archetype} profile and your ${roleType === 'creator' ? 'builder' : roleType === 'client' ? 'strategic' : 'balanced'} orientation, the path best aligned with your natural rhythm is the ${archetype} archetype.`,
      },
    }

    // ── Persist results to DB ──
    try {
      const supabase = await createAdminClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existing } = await supabase
          .from('clients')
          .select('metadata')
          .eq('id', user.id)
          .maybeSingle()
        const existingMeta = (existing?.metadata as Record<string, any>) ?? {}
        const intake = {
          ...(existingMeta.intake || {}),
          sections: {
            ...((existingMeta.intake as any)?.sections || {}),
            results: {
              ...result,
              saved_at: new Date().toISOString(),
            },
          },
          last_section: 'results',
          updated_at: new Date().toISOString(),
        }

        await supabase
          .from('clients')
          .upsert({
            id: user.id,
            metadata: { ...existingMeta, intake },
            updated_at: new Date().toISOString(),
          } as any, { onConflict: 'id' })
      }
    } catch (dbErr) {
      console.error('Failed to persist intake results:', dbErr)
    }

    return NextResponse.json(result)

  } catch (err) {
    console.error('Intake calculation error:', err)
    return NextResponse.json({
      error: 'Failed to calculate intelligence profile',
      fallback: {
        blueprint: {
          archetype: 'Innovator',
          completeness: 35,
          foundation: { coreArch: 'Explorer', naturalGift: 'Spontaneity', growthEdge: 'Patience', energyType: 'Generator', operatingRhythm: 'Respond and Build' },
          scores: { visionary: 65, building: 58, connecting: 62, analyzing: 55, leading: 60, creating: 68 },
          summary: 'Your profile reveals an Explorer operating pattern with a gift for spontaneity.',
        },
        essence: {
          mindArchitecture: 'Explorer', decisionStyle: 'Sacral Authority', communicationStyle: 'Creativity',
          emotionalPattern: 'Innocence', creativityStyle: 'Self-Expression',
          summary: 'You learn through deep exploration and active engagement.',
        },
        archetype: {
          primary: 'Innovator', avatar: 'innovator', description: 'You learn through deep exploration.',
          domains: ['innovator', 'growth', 'creation', 'connection'],
        },
        rhythm: { energyType: 'Generator', peakTimes: 'Late morning, early evening', recoveryNeed: 'Solitude and quiet' },
        timing: { personalYear: 7, currentCycle: 'Growth' },
        recommendation: { archetype: 'Innovator', suggestedPath: 'Client', reason: 'Based on your Innovator profile and balanced orientation...' },
      },
    }, { status: 200 })
  }
}
