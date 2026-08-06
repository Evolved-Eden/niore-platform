// ───────────────────────────────────────────────────────
// Human Design Reference Data (Rave Mandala)
// Wheel: 64 gates, each 360/64 = 5.625°, starting with
// Gate 41 at 302.0° (Aquarius 2°). Gates run in I Ching
// sequence around the wheel (41 → 19 → 13 → ... → 60 → 41).
// Validated against a reference chart (all 25 personality +
// design activations matched exactly).
// ───────────────────────────────────────────────────────

export const GATE_START = 302.0 // degrees: start of Gate 41
export const GATE_SPAN = 360 / 64 // 5.625°

/** Gates in wheel order, starting at GATE_START. index 0 = gate 41. */
export const GATE_ORDER: number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36,
  25, 17, 21, 51, 42, 3, 27, 24, 2, 23,
  8, 20, 16, 35, 45, 12, 15, 52, 39, 53,
  62, 56, 31, 33, 7, 4, 29, 59, 40, 64,
  47, 6, 46, 18, 48, 57, 32, 50, 28, 44,
  1, 43, 14, 34, 9, 5, 26, 11, 10, 58,
  38, 54, 61, 60,
]

export type CenterName =
  | 'Head'
  | 'Ajna'
  | 'Throat'
  | 'G'
  | 'Heart'
  | 'Sacral'
  | 'Spleen'
  | 'Solar Plexus'
  | 'Root'

/** Gate → center mapping (all 64 gates). Cross-checked across 10 sources. */
export const GATE_CENTERS: Record<number, CenterName> = {
  1: 'G', 2: 'G', 3: 'Sacral', 4: 'Ajna', 5: 'Sacral',
  6: 'Solar Plexus', 7: 'G', 8: 'Throat', 9: 'Sacral', 10: 'G',
  11: 'Ajna', 12: 'Throat', 13: 'G', 14: 'Sacral', 15: 'G',
  16: 'Throat', 17: 'Ajna', 18: 'Spleen', 19: 'Root', 20: 'Throat',
  21: 'Heart', 22: 'Solar Plexus', 23: 'Throat', 24: 'Ajna', 25: 'G',
  26: 'Heart', 27: 'Sacral', 28: 'Spleen', 29: 'Sacral', 30: 'Solar Plexus',
  31: 'Throat', 32: 'Spleen', 33: 'Throat', 34: 'Sacral', 35: 'Throat',
  36: 'Solar Plexus', 37: 'Solar Plexus', 38: 'Root', 39: 'Root', 40: 'Heart',
  41: 'Root', 42: 'Sacral', 43: 'Ajna', 44: 'Spleen', 45: 'Throat',
  46: 'G', 47: 'Ajna', 48: 'Spleen', 49: 'Solar Plexus', 50: 'Spleen',
  51: 'Heart', 52: 'Root', 53: 'Root', 54: 'Root', 55: 'Solar Plexus',
  56: 'Throat', 57: 'Spleen', 58: 'Root', 59: 'Sacral', 60: 'Root',
  61: 'Head', 62: 'Throat', 63: 'Head', 64: 'Head',
}

export interface ChannelDef {
  gates: [number, number]
  name: string
  centers: [CenterName, CenterName]
}

/** All 36 Human Design channels (gate pair, name, connected centers). */
export const CHANNELS: ChannelDef[] = [
  { gates: [1, 8], name: 'Inspiration', centers: ['G', 'Throat'] },
  { gates: [2, 14], name: 'The Beat', centers: ['G', 'Sacral'] },
  { gates: [3, 60], name: 'Mutation', centers: ['Sacral', 'Root'] },
  { gates: [4, 63], name: 'Logic', centers: ['Ajna', 'Head'] },
  { gates: [5, 15], name: 'Rhythm', centers: ['Sacral', 'G'] },
  { gates: [6, 59], name: 'Mating', centers: ['Solar Plexus', 'Sacral'] },
  { gates: [7, 31], name: 'The Alpha', centers: ['G', 'Throat'] },
  { gates: [9, 52], name: 'Concentration', centers: ['Sacral', 'Root'] },
  { gates: [10, 20], name: 'Awakening', centers: ['G', 'Throat'] },
  { gates: [10, 34], name: 'Exploration', centers: ['G', 'Sacral'] },
  { gates: [10, 57], name: 'Perfected Form', centers: ['G', 'Spleen'] },
  { gates: [11, 56], name: 'Curiosity', centers: ['Ajna', 'Throat'] },
  { gates: [12, 22], name: 'Openness', centers: ['Throat', 'Solar Plexus'] },
  { gates: [13, 33], name: 'The Prodigal', centers: ['G', 'Throat'] },
  { gates: [16, 48], name: 'The Wavelength', centers: ['Throat', 'Spleen'] },
  { gates: [17, 62], name: 'Acceptance', centers: ['Ajna', 'Throat'] },
  { gates: [18, 58], name: 'Judgment', centers: ['Spleen', 'Root'] },
  { gates: [19, 49], name: 'Synthesis', centers: ['Root', 'Solar Plexus'] },
  { gates: [20, 34], name: 'Charisma', centers: ['Throat', 'Sacral'] },
  { gates: [20, 57], name: 'The Brainwave', centers: ['Throat', 'Spleen'] },
  { gates: [21, 45], name: 'The Money Line', centers: ['Heart', 'Throat'] },
  { gates: [23, 43], name: 'Structuring', centers: ['Throat', 'Ajna'] },
  { gates: [24, 61], name: 'Awareness', centers: ['Ajna', 'Head'] },
  { gates: [25, 51], name: 'Initiation', centers: ['G', 'Heart'] },
  { gates: [26, 44], name: 'Surrender', centers: ['Heart', 'Spleen'] },
  { gates: [27, 50], name: 'Preservation', centers: ['Sacral', 'Spleen'] },
  { gates: [28, 38], name: 'Struggle', centers: ['Spleen', 'Root'] },
  { gates: [29, 46], name: 'Discovery', centers: ['Sacral', 'G'] },
  { gates: [30, 41], name: 'Recognition', centers: ['Solar Plexus', 'Root'] },
  { gates: [32, 54], name: 'Transformation', centers: ['Spleen', 'Root'] },
  { gates: [34, 57], name: 'Power', centers: ['Sacral', 'Spleen'] },
  { gates: [35, 36], name: 'Transitoriness', centers: ['Throat', 'Solar Plexus'] },
  { gates: [37, 40], name: 'Community', centers: ['Solar Plexus', 'Heart'] },
  { gates: [39, 55], name: 'Emoting', centers: ['Root', 'Solar Plexus'] },
  { gates: [42, 53], name: 'Maturation', centers: ['Sacral', 'Root'] },
  { gates: [47, 64], name: 'Abstraction', centers: ['Ajna', 'Head'] },
]

/** Gate name + keyword (short) for display. */
export const GATE_NAMES: Record<number, { name: string; keyword: string }> = {
  1: { name: 'Creative Self-Expression', keyword: 'Unique creative expression' },
  2: { name: 'Direction & Receptivity', keyword: 'Guidance and receptive flow' },
  3: { name: 'Ordering / Innovation', keyword: 'Turning chaos into order' },
  4: { name: 'Mental Solutions', keyword: 'Logical problem-solving clarity' },
  5: { name: 'Fixed Rhythms', keyword: 'Consistency and natural timing' },
  6: { name: 'Conflict / Friction', keyword: 'Emotional sensitivity and mediation' },
  7: { name: 'The Role of the Self', keyword: 'Leadership with humility' },
  8: { name: 'Contribution / Influence', keyword: 'Creative contribution and influence' },
  9: { name: 'Focused Energy', keyword: 'Concentration and attention to detail' },
  10: { name: 'Behavior of Self-Love', keyword: 'Authentic self-love and integrity' },
  11: { name: 'Ideas and Peace', keyword: 'Ideas, storytelling, peaceful communication' },
  12: { name: 'Caution / Discretion', keyword: 'Selective, discerning communication' },
  13: { name: 'Listener and Witness', keyword: 'Deep listening and passing on wisdom' },
  14: { name: 'Power Skills', keyword: 'Power to generate resources' },
  15: { name: 'Extremes / Humility', keyword: 'Balance and embracing diversity' },
  16: { name: 'Skills and Enthusiasm', keyword: 'Talent development and expression' },
  17: { name: 'Opinions and Judgments', keyword: 'Forming opinions with rational analysis' },
  18: { name: 'Correction', keyword: 'Improvement and critical discernment' },
  19: { name: 'Sensitivity / Neediness', keyword: 'Attunement to needs and connection' },
  20: { name: 'The Now / Presence', keyword: 'Living fully in the present moment' },
  21: { name: 'Control / Management', keyword: 'Managing resources and life wisely' },
  22: { name: 'Openness / Grace', keyword: 'Social grace and emotional openness' },
  23: { name: 'Assimilation', keyword: 'Expressing inner knowing clearly' },
  24: { name: 'Rationalization', keyword: 'Reflection and mental processing' },
  25: { name: 'Innocence / Spirit', keyword: 'Pure love and universal spirit' },
  26: { name: 'The Egoist / Salesmanship', keyword: 'Persuasion and influence with integrity' },
  27: { name: 'Caring / Nurturing', keyword: 'Nourishment and responsibility for others' },
  28: { name: 'The Game Player', keyword: 'Challenge, risk-taking, perseverance' },
  29: { name: 'Commitment', keyword: 'Saying yes and staying committed' },
  30: { name: 'Desire / Emotions', keyword: 'Intense feelings, desires, passion' },
  31: { name: 'Leadership', keyword: 'Democratic leadership and influence' },
  32: { name: 'Continuity / Trust', keyword: 'Longevity, commitment, trustworthiness' },
  33: { name: 'Privacy / Reflection', keyword: 'Retreat, reflection, learning from the past' },
  34: { name: 'Power', keyword: 'Raw power and great energy' },
  35: { name: 'Change / Progress', keyword: 'Adventure, change, new experience' },
  36: { name: 'Crisis / Emotional Depth', keyword: 'Transformation through emotional depth' },
  37: { name: 'Friendship / Community', keyword: 'Loyalty and nurturing community' },
  38: { name: 'Opposition / Struggle', keyword: 'Standing strong through adversity' },
  39: { name: 'Provocation', keyword: 'Provoking change and stirring awareness' },
  40: { name: 'Deliverance', keyword: 'Independence and work/life balance' },
  41: { name: 'Contraction / Initiation', keyword: 'Beginning cycles and imagination' },
  42: { name: 'Growth / Completion', keyword: 'Growth through endings and completion' },
  43: { name: 'Breakthrough', keyword: 'Insight and breakthrough ideas' },
  44: { name: 'Alertness / Teamwork', keyword: 'Pattern awareness and teamwork' },
  45: { name: 'Gathering / Leadership', keyword: 'Resource gathering and distribution' },
  46: { name: 'Determination / Love', keyword: 'Physical awareness and love of the body' },
  47: { name: 'Realization / Oppression', keyword: 'Mental processing to clarity' },
  48: { name: 'Depth / Resourcefulness', keyword: 'Depth of knowledge and resourcefulness' },
  49: { name: 'Revolution / Principles', keyword: 'Principles and radical change' },
  50: { name: 'Values / Nurturing', keyword: 'Moral values and nurturing community' },
  51: { name: 'Shock / Initiation', keyword: 'Sudden awakening and courage' },
  52: { name: 'Stillness / Concentration', keyword: 'Stillness and focused center' },
  53: { name: 'Development / Beginnings', keyword: 'New cycles and development' },
  54: { name: 'Ambition / Drive', keyword: 'Ambition to rise and succeed' },
  55: { name: 'Spirit / Abundance', keyword: 'Emotional abundance and spirit' },
  56: { name: 'Wanderer / Storytelling', keyword: 'Storytelling and experiential knowledge' },
  57: { name: 'Intuition / Clarity', keyword: 'Deep inner knowing and instinct' },
  58: { name: 'Joy / Vitality', keyword: 'Joyful vitality and zest for life' },
  59: { name: 'Intimacy / Sexuality', keyword: 'Intimacy, bonding, breaking barriers' },
  60: { name: 'Acceptance / Limitation', keyword: 'Accepting limits and flowing with change' },
  61: { name: 'Inner Truth', keyword: 'Mystical knowing and inner truth' },
  62: { name: 'Detail / Organization', keyword: 'Order and precision' },
  63: { name: 'Doubt / Inquiry', keyword: 'Questioning to discover truth' },
  64: { name: 'Confusion / Transformation', keyword: 'Moving through confusion to clarity' },
}

export interface CrossDef {
  sunGate: number
  rax: string
  lax: string
  jx: string | null
}

/**
 * Incarnation cross names keyed by Personality Sun gate.
 * Names sourced from geneticmatrix.com + ahumandesign.com (RAX validated
 * against reference chart: gate 51 → Right Angle Cross of Penetration).
 * NOTE: RAX gate notations are reliable; lax/jx gate combos were imperfect
 * in research, so the engine determines the angle geometrically and reads
 * only the matching name from this table.
 */
export const INCARNATION_CROSSES: CrossDef[] = [
  { sunGate: 1, rax: 'Right Angle Cross of The Sphinx', lax: 'Left Angle Cross of Defiance', jx: 'Juxtaposition Cross of Self-expression' },
  { sunGate: 2, rax: 'Right Angle Cross of The Sphinx', lax: 'Left Angle Cross of Defiance', jx: 'Juxtaposition Cross of The Driver' },
  { sunGate: 3, rax: 'Right Angle Cross of Laws', lax: 'Left Angle Cross of Wishes', jx: 'Juxtaposition Cross of Mutation' },
  { sunGate: 4, rax: 'Right Angle Cross of Explanation', lax: 'Left Angle Cross of Revolution', jx: 'Juxtaposition Cross of Formulization' },
  { sunGate: 5, rax: 'Right Angle Cross of Consciousness', lax: 'Left Angle Cross of Separation', jx: 'Juxtaposition Cross of Habits' },
  { sunGate: 6, rax: 'Right Angle Cross of Eden', lax: 'Left Angle Cross of The Plane', jx: 'Juxtaposition Cross of Conflict' },
  { sunGate: 7, rax: 'Right Angle Cross of The Sphinx', lax: 'Left Angle Cross of Masks', jx: 'Juxtaposition Cross of Interaction' },
  { sunGate: 8, rax: 'Right Angle Cross of Contagion', lax: 'Left Angle Cross of Uncertainty', jx: 'Juxtaposition Cross of Contribution' },
  { sunGate: 9, rax: 'Right Angle Cross of Planning', lax: 'Left Angle Cross of Identification', jx: 'Juxtaposition Cross of Focus' },
  { sunGate: 10, rax: 'Right Angle Cross of The Vessel of Love', lax: 'Left Angle Cross of Prevention', jx: 'Juxtaposition Cross of Behavior' },
  { sunGate: 11, rax: 'Right Angle Cross of Eden', lax: 'Left Angle Cross of Education', jx: 'Juxtaposition Cross of Ideas' },
  { sunGate: 12, rax: 'Right Angle Cross of Eden', lax: 'Left Angle Cross of Education', jx: 'Juxtaposition Cross of Articulation' },
  { sunGate: 13, rax: 'Right Angle Cross of The Sphinx', lax: 'Left Angle Cross of Masks', jx: 'Juxtaposition Cross of Listening' },
  { sunGate: 14, rax: 'Right Angle Cross of Contagion', lax: 'Left Angle Cross of Uncertainty', jx: 'Juxtaposition Cross of Empowering' },
  { sunGate: 15, rax: 'Right Angle Cross of The Vessel of Love', lax: 'Left Angle Cross of Prevention', jx: 'Juxtaposition Cross of Extremes' },
  { sunGate: 16, rax: 'Right Angle Cross of Planning', lax: 'Left Angle Cross of Identification', jx: 'Juxtaposition Cross of Experimentation' },
  { sunGate: 17, rax: 'Right Angle Cross of Service', lax: 'Left Angle Cross of Upheaval', jx: 'Juxtaposition Cross of Opinions' },
  { sunGate: 18, rax: 'Right Angle Cross of Service', lax: 'Left Angle Cross of Upheaval', jx: 'Juxtaposition Cross of Correction' },
  { sunGate: 19, rax: 'Right Angle Cross of The Four Ways', lax: 'Left Angle Cross of Refinement', jx: 'Juxtaposition Cross of Need' },
  { sunGate: 20, rax: 'Right Angle Cross of The Sleeping Phoenix', lax: 'Left Angle Cross of Duality', jx: 'Juxtaposition Cross of The Now' },
  { sunGate: 21, rax: 'Right Angle Cross of Tension', lax: 'Left Angle Cross of Endeavor', jx: 'Juxtaposition Cross of Control' },
  { sunGate: 22, rax: 'Right Angle Cross of Rulership', lax: 'Left Angle Cross of Informing', jx: 'Juxtaposition Cross of Grace' },
  { sunGate: 23, rax: 'Right Angle Cross of Explanation', lax: 'Left Angle Cross of Dedication', jx: 'Juxtaposition Cross of Assimilation' },
  { sunGate: 24, rax: 'Right Angle Cross of The Four Ways', lax: 'Left Angle Cross of Incarnation', jx: 'Juxtaposition Cross of Rationalization' },
  { sunGate: 25, rax: 'Right Angle Cross of The Vessel of Love', lax: 'Left Angle Cross of Healing', jx: 'Juxtaposition Cross of Innocence' },
  { sunGate: 26, rax: 'Right Angle Cross of Rulership', lax: 'Left Angle Cross of Confrontation', jx: 'Juxtaposition Cross of The Trickster' },
  { sunGate: 27, rax: 'Right Angle Cross of The Unexpected', lax: 'Left Angle Cross of Alignment', jx: 'Juxtaposition Cross of Caring' },
  { sunGate: 28, rax: 'Right Angle Cross of The Unexpected', lax: 'Left Angle Cross of Alignment', jx: 'Juxtaposition Cross of Risks' },
  { sunGate: 29, rax: 'Right Angle Cross of Contagion', lax: 'Left Angle Cross of Industry', jx: 'Juxtaposition Cross of Commitment' },
  { sunGate: 30, rax: 'Right Angle Cross of Contagion', lax: 'Left Angle Cross of Industry', jx: 'Juxtaposition Cross of Fates' },
  { sunGate: 31, rax: 'Right Angle Cross of The Unexpected', lax: 'Left Angle Cross of The Alpha', jx: 'Juxtaposition Cross of Influence' },
  { sunGate: 32, rax: 'Right Angle Cross of Maya', lax: 'Left Angle Cross of Limitation', jx: 'Juxtaposition Cross of Conservation' },
  { sunGate: 33, rax: 'Right Angle Cross of The Four Ways', lax: 'Left Angle Cross of Refinement', jx: 'Juxtaposition Cross of Retreat' },
  { sunGate: 34, rax: 'Right Angle Cross of The Sleeping Phoenix', lax: 'Left Angle Cross of Duality', jx: 'Juxtaposition Cross of Power' },
  { sunGate: 35, rax: 'Right Angle Cross of Consciousness', lax: 'Left Angle Cross of Separation', jx: 'Juxtaposition Cross of Experience' },
  { sunGate: 36, rax: 'Right Angle Cross of Eden', lax: 'Left Angle Cross of The Plane', jx: 'Juxtaposition Cross of Crisis' },
  { sunGate: 37, rax: 'Right Angle Cross of Planning', lax: 'Left Angle Cross of Migration', jx: 'Juxtaposition Cross of Bargains' },
  { sunGate: 38, rax: 'Right Angle Cross of Tension', lax: 'Left Angle Cross of Individualism', jx: 'Juxtaposition Cross of Opposition' },
  { sunGate: 39, rax: 'Right Angle Cross of Tension', lax: 'Left Angle Cross of Individualism', jx: 'Juxtaposition Cross of Provocation' },
  { sunGate: 40, rax: 'Right Angle Cross of Planning', lax: 'Left Angle Cross of Migration', jx: 'Juxtaposition Cross of Denial' },
  { sunGate: 41, rax: 'Right Angle Cross of The Unexpected', lax: 'Left Angle Cross of The Alpha', jx: 'Juxtaposition Cross of Fantasy' },
  { sunGate: 42, rax: 'Right Angle Cross of Maya', lax: 'Left Angle Cross of Limitation', jx: 'Juxtaposition Cross of Completion' },
  { sunGate: 43, rax: 'Right Angle Cross of Explanation', lax: 'Left Angle Cross of Dedication', jx: 'Juxtaposition Cross of Insight' },
  { sunGate: 44, rax: 'Right Angle Cross of The Four Ways', lax: 'Left Angle Cross of Incarnation', jx: 'Juxtaposition Cross of Alertness' },
  { sunGate: 45, rax: 'Right Angle Cross of Rulership', lax: 'Left Angle Cross of Confrontation', jx: 'Juxtaposition Cross of Possession' },
  { sunGate: 46, rax: 'Right Angle Cross of The Vessel of Love', lax: 'Left Angle Cross of Healing', jx: 'Juxtaposition Cross of Serendipity' },
  { sunGate: 47, rax: 'Right Angle Cross of Rulership', lax: 'Left Angle Cross of Informing', jx: 'Juxtaposition Cross of Oppression' },
  { sunGate: 48, rax: 'Right Angle Cross of Tension', lax: 'Left Angle Cross of Endeavor', jx: 'Juxtaposition Cross of Depth' },
  { sunGate: 49, rax: 'Right Angle Cross of Explanation', lax: 'Left Angle Cross of Revolution', jx: 'Juxtaposition Cross of Principles' },
  { sunGate: 50, rax: 'Right Angle Cross of Laws', lax: 'Left Angle Cross of Wishes', jx: 'Juxtaposition Cross of Values' },
  { sunGate: 51, rax: 'Right Angle Cross of Penetration', lax: 'Left Angle Cross of The Clarion', jx: 'Juxtaposition Cross of Shock' },
  { sunGate: 52, rax: 'Right Angle Cross of Service', lax: 'Left Angle Cross of Demands', jx: 'Juxtaposition Cross of Stillness' },
  { sunGate: 53, rax: 'Right Angle Cross of Penetration', lax: 'Left Angle Cross of Cycles', jx: 'Juxtaposition Cross of Beginnings' },
  { sunGate: 54, rax: 'Right Angle Cross of Penetration', lax: 'Left Angle Cross of Cycles', jx: 'Juxtaposition Cross of Ambition' },
  { sunGate: 55, rax: 'Right Angle Cross of The Sleeping Phoenix', lax: 'Left Angle Cross of Spirit', jx: 'Juxtaposition Cross of Moods' },
  { sunGate: 56, rax: 'Right Angle Cross of Laws', lax: 'Left Angle Cross of Distraction', jx: 'Juxtaposition Cross of Stimulation' },
  { sunGate: 57, rax: 'Right Angle Cross of Penetration', lax: 'Left Angle Cross of The Clarion', jx: 'Juxtaposition Cross of Intuition' },
  { sunGate: 58, rax: 'Right Angle Cross of Service', lax: 'Left Angle Cross of Demands', jx: 'Juxtaposition Cross of Vitality' },
  { sunGate: 59, rax: 'Right Angle Cross of The Sleeping Phoenix', lax: 'Left Angle Cross of Spirit', jx: 'Juxtaposition Cross of Strategy' },
  { sunGate: 60, rax: 'Right Angle Cross of Laws', lax: 'Left Angle Cross of Distraction', jx: 'Juxtaposition Cross of Limitation' },
  { sunGate: 61, rax: 'Right Angle Cross of Maya', lax: 'Left Angle Cross of Obscuration', jx: 'Juxtaposition Cross of Thinking' },
  { sunGate: 62, rax: 'Right Angle Cross of Maya', lax: 'Left Angle Cross of Obscuration', jx: 'Juxtaposition Cross of Detail' },
  { sunGate: 63, rax: 'Right Angle Cross of Consciousness', lax: 'Left Angle Cross of Dominion', jx: 'Juxtaposition Cross of Doubts' },
  { sunGate: 64, rax: 'Right Angle Cross of Consciousness', lax: 'Left Angle Cross of Dominion', jx: 'Juxtaposition Cross of Confusion' },
]
