// ───────────────────────────────────────────────────────
// Tarot / Oracle Draw Mechanic
// Round 32 item 1 -- approved new calculation engine
// ───────────────────────────────────────────────────────
//
// IMPORTANT METHOD NOTE: unlike the other 5 new engines in this round,
// this is NOT a calculation in the astrological/numerological sense --
// there is no "correct" tarot draw derivable from birth data. This
// implements a legitimate, standard mechanic instead: a seeded
// pseudo-random draw from the full 78-card tarot deck (22 Major
// Arcana + 56 Minor Arcana), seeded by the person's birth data plus
// the current date so the SAME person gets the SAME "card of the day"
// if drawn multiple times on the same date (a common, honest pattern
// for daily-card features), while different days produce different
// draws. Upright/reversed is also seeded, not truly random each call.

export interface TarotDraw {
  card: string
  arcana: 'Major' | 'Minor'
  orientation: 'Upright' | 'Reversed'
  meaning: string
}

export interface TarotOracleProfile {
  dailyCard: TarotDraw
  seedBasis: string
  summary: string
}

const MAJOR_ARCANA: { name: string; upright: string; reversed: string }[] = [
  { name: 'The Fool', upright: 'new beginnings, spontaneity, a leap of faith', reversed: 'recklessness, hesitation, missed opportunity' },
  { name: 'The Magician', upright: 'manifestation, resourcefulness, willpower', reversed: 'manipulation, untapped potential, poor planning' },
  { name: 'The High Priestess', upright: 'intuition, the subconscious, hidden knowledge', reversed: 'secrets withheld, disconnection from intuition' },
  { name: 'The Empress', upright: 'abundance, nurturing, creativity', reversed: 'creative block, dependence, neglect' },
  { name: 'The Emperor', upright: 'structure, authority, stability', reversed: 'rigidity, domination, lack of discipline' },
  { name: 'The Hierophant', upright: 'tradition, guidance, shared belief', reversed: 'rebellion against convention, unconventional path' },
  { name: 'The Lovers', upright: 'union, alignment of values, choice', reversed: 'misalignment, disharmony, avoidance' },
  { name: 'The Chariot', upright: 'willpower, determination, victory through control', reversed: 'lack of direction, loss of control' },
  { name: 'Strength', upright: 'inner strength, patience, compassion', reversed: 'self-doubt, weakness, forced control' },
  { name: 'The Hermit', upright: 'introspection, solitude, inner guidance', reversed: 'isolation, withdrawal, avoidance of self-reflection' },
  { name: 'Wheel of Fortune', upright: 'cycles, destiny, turning points', reversed: 'resistance to change, bad timing' },
  { name: 'Justice', upright: 'fairness, truth, cause and effect', reversed: 'unfairness, avoidance of accountability' },
  { name: 'The Hanged Man', upright: 'surrender, new perspective, pause', reversed: 'stalling, resistance to necessary release' },
  { name: 'Death', upright: 'transformation, endings that enable new beginnings', reversed: 'resistance to change, stagnation' },
  { name: 'Temperance', upright: 'balance, moderation, patience', reversed: 'excess, imbalance, lack of long-term vision' },
  { name: 'The Devil', upright: 'attachment, material pull, shadow patterns', reversed: 'breaking free, reclaiming power' },
  { name: 'The Tower', upright: 'sudden upheaval, revelation, necessary collapse', reversed: 'avoided disaster, fear of change' },
  { name: 'The Star', upright: 'hope, renewal, inspiration', reversed: 'despair, disconnection, lost faith' },
  { name: 'The Moon', upright: 'the subconscious, illusion, intuition', reversed: 'confusion clearing, releasing fear' },
  { name: 'The Sun', upright: 'joy, vitality, clarity', reversed: 'temporary gloom, delayed joy' },
  { name: 'Judgement', upright: 'reckoning, awakening, a calling', reversed: 'self-doubt, avoiding a necessary reckoning' },
  { name: 'The World', upright: 'completion, integration, fulfillment', reversed: 'incompletion, seeking closure' },
]

const SUITS = ['Wands', 'Cups', 'Swords', 'Pentacles'] as const
const RANKS = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King']
const SUIT_THEMES: Record<string, string> = {
  Wands: 'action, passion, creative drive',
  Cups: 'emotion, connection, intuition',
  Swords: 'thought, communication, conflict or clarity',
  Pentacles: 'material matters, work, the body, resources',
}

function buildMinorArcana(): { name: string; upright: string; reversed: string }[] {
  const cards: { name: string; upright: string; reversed: string }[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({
        name: `${rank} of ${suit}`,
        upright: `${SUIT_THEMES[suit]} — expressed constructively`,
        reversed: `${SUIT_THEMES[suit]} — blocked, delayed, or turned inward`,
      })
    }
  }
  return cards
}

const FULL_DECK = [...MAJOR_ARCANA, ...buildMinorArcana()] // 22 + 56 = 78 cards

// Simple deterministic string-hash (djb2), used only to seed a draw --
// not cryptographic, just needs to be stable and well-distributed.
function seededHash(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i)
  }
  return Math.abs(hash)
}

/**
 * Draw a seeded "card of the day" tarot card for a person.
 * @param birthDateISO ISO date string (YYYY-MM-DD) -- used as part of the seed
 * @param forDateISO ISO date string for the draw date (defaults to today) -- same
 *                    person + same date always yields the same card.
 */
export function drawTarotOracleCard(birthDateISO: string, forDateISO?: string): TarotOracleProfile {
  const drawDate = forDateISO || new Date().toISOString().slice(0, 10)
  const seedBasis = `${birthDateISO}|${drawDate}`
  const hash = seededHash(seedBasis)

  const cardIndex = hash % FULL_DECK.length
  const card = FULL_DECK[cardIndex]
  const isReversed = Math.floor(hash / FULL_DECK.length) % 2 === 1
  const orientation: 'Upright' | 'Reversed' = isReversed ? 'Reversed' : 'Upright'
  const meaning = isReversed ? card.reversed : card.upright
  const arcana: 'Major' | 'Minor' = cardIndex < MAJOR_ARCANA.length ? 'Major' : 'Minor'

  const dailyCard: TarotDraw = { card: card.name, arcana, orientation, meaning }

  const summary =
    `Today's card: ${card.name} (${arcana} Arcana), ${orientation} — ${meaning}. ` +
    `This is a seeded daily draw (same person + same date always yields this card), ` +
    `not an astrological calculation.`

  return { dailyCard, seedBasis, summary }
}
