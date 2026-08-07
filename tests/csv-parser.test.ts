import { describe, it, expect } from 'vitest'
import {
  parseCsvLine,
  isNumericField,
  fixColumnShift,
  normalizeFieldCount,
  parseGenerators,
  parseRange,
  parseCsv,
} from '@/lib/csv-parser'

describe('isNumericField', () => {
  it('returns true for numeric strings', () => {
    expect(isNumericField('123')).toBe(true)
    expect(isNumericField('0')).toBe(true)
  })

  it('returns false for non-numeric strings', () => {
    expect(isNumericField('abc')).toBe(false)
    expect(isNumericField('CORE')).toBe(false)
    expect(isNumericField('')).toBe(false)
    expect(isNumericField('12a')).toBe(false)
  })
})

describe('parseCsvLine', () => {
  it('splits simple comma-separated values', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('handles quoted values', () => {
    expect(parseCsvLine('a,"b,c",d')).toEqual(['a', 'b,c', 'd'])
  })

  it('trims whitespace', () => {
    expect(parseCsvLine(' a , b , c ')).toEqual(['a', 'b', 'c'])
  })
})

describe('fixColumnShift', () => {
  it('inserts empty role_type when position 4 is numeric', () => {
    const row = ['AGT-001', 'Agent Name', 'general', 'sub', '5', 'something', 'more']
    const result = fixColumnShift([...row])
    expect(result[4]).toBe('')        // inserted empty Role_Type
    expect(result[5]).toBe('5')       // shifted Archetype_ID
    expect(result[6]).toBe('something')
  })

  it('does nothing when role_type is already a string', () => {
    const row = ['AGT-001', 'Agent Name', 'general', 'sub', 'CORE', '5', 'Archetype']
    const result = fixColumnShift([...row])
    expect(result).toEqual(row)
  })
})

describe('normalizeFieldCount', () => {
  it('handles a full 22-field row', () => {
    const row = Array.from({ length: 22 }, (_, i) => `f${i}`)
    const result = normalizeFieldCount(row)
    expect(result).toHaveLength(22)
  })

  it('handles rows with missing tertiary_system_range', () => {
    // 21 fields — missing tertiary_system_range
    const row = Array.from({ length: 21 }, (_, i) => `f${i}`)
    const result = normalizeFieldCount(row)
    expect(result).toHaveLength(22)
    // Generator_Models[13] should be empty since tertiary was omitted
  })

  it('handles generator_models with internal commas', () => {
    // 21 fields where position 13 starts with [GEN- and has unquoted commas
    const row = Array.from({ length: 13 }, (_, i) => `f${i}`)
    row.push('[GEN-001,GEN-002,GEN-003]')
    // Add remaining score cols
    for (let i = 0; i < 8; i++) row.push(`score${i}`)
    // This creates a 22-field row but with unquoted commas we'd have more
    // Actually, test the case where afterSecondary has [GEN- at 0
    const sliced = row.slice(0, 12)
    const afterSec = ['[GEN-001', 'GEN-002]']
    const scores = row.slice(-8)
    const result = normalizeFieldCount([...sliced, ...afterSec, ...scores])
    expect(result).toHaveLength(22)
    expect(result[13]).toBe('[GEN-001,GEN-002]') // rejoined
  })
})

describe('parseGenerators', () => {
  it('parses a list of generators', () => {
    expect(parseGenerators('[GEN-001,GEN-002]')).toEqual(['GEN-001', 'GEN-002'])
  })

  it('returns empty for empty input', () => {
    expect(parseGenerators('')).toEqual([])
    expect(parseGenerators('[]')).toEqual([])
  })

  it('handles single generator', () => {
    expect(parseGenerators('[GEN-001]')).toEqual(['GEN-001'])
  })
})

describe('parseRange', () => {
  it('parses a valid range', () => {
    expect(parseRange('141-155')).toBe('141-155')
  })

  it('returns null for empty', () => {
    expect(parseRange('')).toBeNull()
    expect(parseRange('  ')).toBeNull()
  })
})

describe('parseCsv', () => {
  const csv = `Agent_ID,Agent_Name,Agent_Specialty,Sub_Specialty,Role_Type,Archetype_ID,Archetype_Name,Avatar,Primary_Template,Secondary_Template,Primary_System_Range,Secondary_System_Range,Tertiary_System_Range,Generator_Models,Capability,Trust,Activation,Synergy,Evolution,Risk,MAS,Health_Status
AGT-001,Test Agent,general,sub,CORE,1,Archetype 1,avatar1,t1,t2,1-30,31-60,,,85,72,90,68,45,30,65.0,ACTIVE
AGT-002,Shifted Agent,general,sub,5,Archetype Alpha,avatar2,t1,t2,1-30,31-60,,,78,65,82,70,50,35,63.3,ACTIVE`

  it('parses a complete CSV', () => {
    const result = parseCsv(csv)
    expect(result.header).toHaveLength(22)
    expect(result.rows).toHaveLength(2)
  })

  it('correctly reads a normal row', () => {
    const result = parseCsv(csv)
    const normalRow = result.rows[0]
    expect(normalRow['Agent_ID']).toBe('AGT-001')
    expect(normalRow['Role_Type']).toBe('CORE')
    expect(normalRow['Archetype_ID']).toBe('1')
  })

  it('handles a shifted row', () => {
    const result = parseCsv(csv)
    const shiftedRow = result.rows[1]
    expect(shiftedRow['Agent_ID']).toBe('AGT-002')
    // Role_Type was empty (shifted), Archetype_ID should be "5"
    expect(shiftedRow['Role_Type']).toBe('')
    expect(shiftedRow['Archetype_ID']).toBe('5')
    expect(shiftedRow['Archetype_Name']).toBe('Archetype Alpha')
  })
})
