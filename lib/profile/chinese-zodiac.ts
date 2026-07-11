// ───────────────────────────────────────────────────────
// Chinese Zodiac Calculator
// Based on birth year with element and yin/yang
// ───────────────────────────────────────────────────────

import { ChineseZodiacProfile } from './types'

// ── Animal Data ────────────────────────────────────────

const ANIMALS = [
  { name: 'Rat',     pinyin: 'Shǔ',   fixedElement: 'Water',  season: 'Winter', personality: 'Quick-witted, resourceful, versatile', strengths: ['Adaptability', 'Intelligence', 'Charm', 'Resourcefulness'], weaknesses: ['Opportunistic', 'Stingy', 'Critical'], compatibility: ['Dragon', 'Monkey'], opposing: 'Horse' },
  { name: 'Ox',      pinyin: 'Niú',   fixedElement: 'Earth',  season: 'Winter', personality: 'Diligent, dependable, strong-willed', strengths: ['Patience', 'Reliability', 'Discipline', 'Honesty'], weaknesses: ['Stubborn', 'Conservative', 'Judgmental'], compatibility: ['Snake', 'Rooster'], opposing: 'Goat' },
  { name: 'Tiger',   pinyin: 'Hǔ',    fixedElement: 'Wood',   season: 'Spring', personality: 'Brave, competitive, confident', strengths: ['Courage', 'Charisma', 'Confidence', 'Passion'], weaknesses: ['Reckless', 'Impulsive', 'Arrogant'], compatibility: ['Horse', 'Dog'], opposing: 'Monkey' },
  { name: 'Rabbit',  pinyin: 'Tù',    fixedElement: 'Wood',   season: 'Spring', personality: 'Gentle, elegant, compassionate', strengths: ['Kindness', 'Diplomacy', 'Creativity', 'Sensitivity'], weaknesses: ['Overly cautious', 'Indecisive', 'Possessive'], compatibility: ['Goat', 'Pig'], opposing: 'Rooster' },
  { name: 'Dragon',  pinyin: 'Lóng',  fixedElement: 'Earth',  season: 'Spring', personality: 'Confident, intelligent, enthusiastic', strengths: ['Leadership', 'Vision', 'Confidence', 'Generosity'], weaknesses: ['Arrogant', 'Impatient', 'Demanding'], compatibility: ['Rat', 'Monkey'], opposing: 'Dog' },
  { name: 'Snake',   pinyin: 'Shé',   fixedElement: 'Fire',   season: 'Summer', personality: 'Wise, mysterious, intuitive', strengths: ['Wisdom', 'Intuition', 'Elegance', 'Focus'], weaknesses: ['Secretive', 'Possessive', 'Suspicious'], compatibility: ['Ox', 'Rooster'], opposing: 'Pig' },
  { name: 'Horse',   pinyin: 'Mǎ',    fixedElement: 'Fire',   season: 'Summer', personality: 'Energetic, independent, adventurous', strengths: ['Energy', 'Independence', 'Optimism', 'Talent'], weaknesses: ['Impatient', 'Impulsive', 'Stubborn'], compatibility: ['Tiger', 'Dog'], opposing: 'Rat' },
  { name: 'Goat',    pinyin: 'Yáng',  fixedElement: 'Earth',  season: 'Summer', personality: 'Calm, gentle, creative', strengths: ['Creativity', 'Empathy', 'Resilience', 'Artistic'], weaknesses: ['Pessimistic', 'Indecisive', 'Overly dependent'], compatibility: ['Rabbit', 'Pig'], opposing: 'Ox' },
  { name: 'Monkey',  pinyin: 'Hóu',   fixedElement: 'Metal',  season: 'Autumn', personality: 'Witty, inventive, curious', strengths: ['Intelligence', 'Innovation', 'Humor', 'Versatility'], weaknesses: ['Mischievous', 'Arrogant', 'Deceitful'], compatibility: ['Rat', 'Dragon'], opposing: 'Tiger' },
  { name: 'Rooster', pinyin: 'Jī',    fixedElement: 'Metal',  season: 'Autumn', personality: 'Observant, hardworking, courageous', strengths: ['Precision', 'Honesty', 'Courage', 'Confidence'], weaknesses: ['Blunt', 'Critical', 'Perfectionist'], compatibility: ['Ox', 'Snake'], opposing: 'Rabbit' },
  { name: 'Dog',     pinyin: 'Gǒu',   fixedElement: 'Earth',  season: 'Autumn', personality: 'Loyal, honest, dependable', strengths: ['Loyalty', 'Honesty', 'Responsibility', 'Protectiveness'], weaknesses: ['Anxious', 'Critical', 'Stubborn'], compatibility: ['Tiger', 'Horse'], opposing: 'Dragon' },
  { name: 'Pig',     pinyin: 'Zhū',   fixedElement: 'Water',  season: 'Winter', personality: 'Compassionate, generous, diligent', strengths: ['Generosity', 'Patience', 'Compassion', 'Sincerity'], weaknesses: ['Naive', 'Overindulgent', 'Materialistic'], compatibility: ['Rabbit', 'Goat'], opposing: 'Snake' },
]

// ── Year Elements (Heavenly Stems cycle: 10-year) ──────────────

const YEAR_ELEMENTS = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water']
const YEAR_YIN_YANG: ('yang' | 'yin')[] = ['yang', 'yin', 'yang', 'yin', 'yang', 'yin', 'yang', 'yin', 'yang', 'yin']

// Chinese year typically starts around Feb 4
// Simplified: animal changes at Chinese New Year (late Jan - mid Feb)

function getChineseYearInfo(year: number): { animalIndex: number; elementIndex: number; element: string; yinYang: 'yin' | 'yang' } {
  // The Chinese zodiac cycle starts with Rat in year 4 (or 1900 is Rat+)
  // 1900: Rat (index 0), element: Metal (index 4)
  // 1984: Rat (index 0), element: Wood (index 0) — start of new 60-year cycle
  const baseYear = 1984 // Year of the Wood Rat, start of 60-year cycle
  const yearDiff = year - baseYear
  const animalIndex = ((yearDiff % 12) + 12) % 12
  const elementIndex = ((yearDiff % 10) + 10) % 10

  return {
    animalIndex,
    elementIndex,
    element: YEAR_ELEMENTS[elementIndex],
    yinYang: YEAR_YIN_YANG[elementIndex],
  }
}

function monthAnimalIndex(month: number): number {
  // Each month also has an animal (inner animal)
  // The month animal starts with Tiger (index 2) for month 1 (Feb-Mar)
  // Chinese months don't align perfectly with Gregorian, so this is approximate
  return ((month + 1) % 12) // Approximate mapping
}

function hourAnimalIndex(hour: number): number {
  // Each 2-hour period has an animal (Rat 11pm-1am, Ox 1-3am, etc.)
  return Math.floor(((hour + 1) % 24) / 2)
}

// ── Main Calculator ──────────────────────────────────

export function calculateChineseZodiac(
  birthDateStr: string,
  birthTime?: string
): ChineseZodiacProfile {
  const bd = new Date(birthDateStr)
  const year = bd.getUTCFullYear()
  const month = bd.getUTCMonth() + 1 // 1-12
  // const day = bd.getUTCDate()

  // Adjust for Chinese New Year (simplified: check if before Feb 4)
  // If born before Feb 4, use previous year's animal
  const isBeforeCNY = month < 2 || (month === 2 && bd.getUTCDate() < 4)
  const effectiveYear = isBeforeCNY ? year - 1 : year

  const info = getChineseYearInfo(effectiveYear)
  const animal = ANIMALS[info.animalIndex]

  // Hour animal
  let hourAnimal: string | undefined
  if (birthTime) {
    const [h] = birthTime.split(':').map(Number)
    if (!isNaN(h)) {
      hourAnimal = ANIMALS[hourAnimalIndex(h)].name
    }
  }

  return {
    animal: animal.name,
    animalIndex: info.animalIndex,
    element: info.element,
    elementIndex: info.elementIndex,
    yinYang: info.yinYang,
    fixedElement: animal.fixedElement,
    personality: animal.personality,
    strengths: animal.strengths,
    weaknesses: animal.weaknesses,
    compatibility: animal.compatibility,
    opposing: animal.opposing,
    season: animal.season,
    aspect: `Born in the Year of the ${animal.name} (${info.element} ${info.yinYang})`,
  }
}

// ── Meanings for essence generation ──────────────────

export function getChineseZodiacInsight(animal: string, element: string): string[] {
  const insights: string[] = [
    `Your ${animal} nature combines with ${element} energy — ${element.toLowerCase()} ${animal}s are known for their determination and resilience`,
  ]
  if (element === 'Wood') insights.push('Wood energy brings growth, creativity, and expansion — ideal for planting new seeds')
  if (element === 'Fire') insights.push('Fire energy brings passion, visibility, and transformation — your presence heats up any room')
  if (element === 'Earth') insights.push('Earth energy brings stability, nurture, and groundedness — you create safe foundations')
  if (element === 'Metal') insights.push('Metal energy brings precision, structure, and clarity — your cut-through quality is your edge')
  if (element === 'Water') insights.push('Water energy brings flow, wisdom, and adaptability — you move around obstacles effortlessly')
  return insights
}
