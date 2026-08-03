import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

type SystemInfo = {
  slug: string
  name: string
  tagline: string | null
  description: string | null
  domain_key: string
  domain_name: string | null
  lens_key: string
  system_number: number | null
}

type BlueprintInfo = {
  key: string
  name: string
  description: string | null | undefined
  system_count: number
}

type SystemMatrixEntry = {
  system: SystemInfo
  blueprints: string[]            // which blueprint keys include this system
  overlap_count: number           // how many blueprints
}

type DomainGroup = {
  domain_key: string
  domain_name: string | null
  system_count: number            // unique systems in this domain
  systems: SystemMatrixEntry[]
}

type MatrixResponse = {
  blueprints: BlueprintInfo[]
  domains: DomainGroup[]
  summary: {
    total_unique_systems: number
    total_system_mappings: number   // sum of all system×blueprint combos
    total_blueprints: number
    average_overlap: number
    most_shared_system: { slug: string; name: string; overlap_count: number } | null
  }
}

const BP_KEYS = [
  'blueprint_core',
  'essence_profile',
  'rhythm_state',
  'alignment_purpose',
  'momentum_execution',
  'connections_relationships',
  'evolution_intelligence',
]

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // Fetch all blueprint templates
    const { data: bps } = await supabase
      .from('essintelligence_templates')
      .select('key, name, description, sections_json, template_json')
      .in('key', BP_KEYS)

    if (!bps || bps.length === 0) {
      return NextResponse.json({ error: 'No blueprint templates found' }, { status: 404 })
    }

    // Fetch all omnigrid intelligence systems
    const { data: allSystems } = await supabase
      .from('essence_engines')
      .select('slug, name, tagline, description, domain_key, domain_name, lens_key, system_number')
      .order('domain_key')
      .order('system_number')

    if (!allSystems) {
      return NextResponse.json({ error: 'No systems found' }, { status: 404 })
    }

    const sysMap = new Map<string, SystemInfo>()
    for (const sys of allSystems as SystemInfo[]) {
      sysMap.set(sys.slug, sys)
    }

    // Build system→blueprints mapping
    const systemToBlueprints = new Map<string, Set<string>>()

    for (const bp of bps) {
      const sections = (bp.sections_json || {}) as Record<string, { key: string }>
      for (const entry of Object.values(sections)) {
        if (!entry.key) continue
        if (!systemToBlueprints.has(entry.key)) {
          systemToBlueprints.set(entry.key, new Set())
        }
        systemToBlueprints.get(entry.key)!.add(bp.key)
      }
    }

    // Build domain groups
    const domainGroups = new Map<string, SystemMatrixEntry[]>()

    for (const [slug, bpSet] of systemToBlueprints) {
      const sys = sysMap.get(slug)
      if (!sys) continue

      const entry: SystemMatrixEntry = {
        system: sys,
        blueprints: Array.from(bpSet).sort(),
        overlap_count: bpSet.size,
      }

      const domain = sys.domain_key || 'uncategorized'
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, [])
      }
      domainGroups.get(domain)!.push(entry)
    }

    // Sort domains and their systems
    const domains: DomainGroup[] = Array.from(domainGroups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([domain_key, systems]) => {
        const firstSys = systems[0]?.system
        return {
          domain_key,
          domain_name: firstSys?.domain_name || null,
          system_count: systems.length,
          systems: systems.sort((a, b) => (a.system.system_number ?? 0) - (b.system.system_number ?? 0)),
        }
      })

    // Blueprint info
    const blueprints: BlueprintInfo[] = bps.map(bp => ({
      key: bp.key,
      name: bp.name || bp.key,
      description: bp.description,
      system_count: (bp.template_json as any)?.total_systems ?? Object.keys(bp.sections_json || {}).length,
    }))

    // Summary
    const totalUniqueSystems = systemToBlueprints.size
    let totalMappings = 0
    let mostShared: { slug: string; name: string; overlap_count: number } | null = null

    for (const [slug, bpSet] of systemToBlueprints) {
      const count = bpSet.size
      totalMappings += count
      const sys = sysMap.get(slug)
      if (!mostShared || count > mostShared.overlap_count) {
        mostShared = {
          slug,
          name: sys?.name || slug,
          overlap_count: count,
        }
      }
    }

    const summary = {
      total_unique_systems: totalUniqueSystems,
      total_system_mappings: totalMappings,
      total_blueprints: blueprints.length,
      average_overlap: totalUniqueSystems > 0 ? Number((totalMappings / totalUniqueSystems).toFixed(2)) : 0,
      most_shared_system: mostShared,
    }

    return NextResponse.json({ blueprints, domains, summary } satisfies MatrixResponse)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
