/**
 * CSV parser for Evolved Eden agent imports.
 * Handles known CSV quality issues:
 *   1. Column shift — Role_Type missing in ~225 rows, Archetype_ID leaks left
 *   2. Variable field count — Generator_Models has unquoted internal commas
 *   3. Missing trailing empty fields — Tertiary_System_Range sometimes omitted
 */

export type AgentRow = Record<string, string>

const SCORE_COLS = 8  // Capability..Health_Status
const META_COLS = 14  // Agent_ID..Generator_Models
const EXP_COLS = 22   // total expected

export function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue }
    current += ch
  }
  values.push(current.trim())
  return values
}

export function isNumericField(v: string): boolean {
  return /^\d+$/.test(v?.trim())
}

export function fixColumnShift(values: string[]): string[] {
  const rawRoleType = values[4] || ''
  if (isNumericField(rawRoleType)) {
    values.splice(4, 0, '')
  }
  return values
}

export function normalizeFieldCount(values: string[]): string[] {
  const N = values.length
  const endFields = N >= SCORE_COLS ? values.slice(-SCORE_COLS) : values.slice(0).map(() => '') as string[]
  const metaBlock = N >= SCORE_COLS ? values.slice(0, N - SCORE_COLS) : values.slice(0)

  const afterSecondary = metaBlock.slice(12)
  let tertiaryRange: string, genModelsJoined: string
  if (afterSecondary.length === 0) {
    tertiaryRange = ''
    genModelsJoined = ''
  } else if (afterSecondary[0].startsWith('[GEN-')) {
    tertiaryRange = ''
    genModelsJoined = afterSecondary.join(',')
  } else {
    tertiaryRange = afterSecondary[0]
    genModelsJoined = afterSecondary.slice(1).join(',')
  }
  const beforeGen = metaBlock.slice(0, 12)
  return [...beforeGen, tertiaryRange, genModelsJoined, ...endFields]
}

export function parseHeader(headerLine: string): string[] {
  return headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''))
}

export function parseGenerators(val: string): string[] {
  if (!val || val === '[]' || val === '') return []
  return val.replace(/^\[|\]$/g, '').split(',').map(g => g.trim()).filter(Boolean)
}

export function parseRange(val: string): string | null {
  if (!val || val.trim() === '') return null
  return val.trim()
}

export function parseCsv(csvRaw: string): { header: string[]; rows: AgentRow[] } {
  const lines = csvRaw.trim().split('\n')
  const header = parseHeader(lines[0])
  const rows: AgentRow[] = []

  for (let i = 1; i < lines.length; i++) {
    let values = parseCsvLine(lines[i])
    values = fixColumnShift(values)
    values = normalizeFieldCount(values)

    const row: AgentRow = {}
    header.forEach((h, idx) => { row[h] = values[idx] || '' })
    rows.push(row)
  }

  return { header, rows }
}
