'use client'

import { useState, useEffect } from 'react'

let cachedSpecialties: any[] | null = null

export async function fetchSpecialties(): Promise<any[]> {
  if (cachedSpecialties) return cachedSpecialties
  try {
    const res = await fetch('/api/admin/specialties')
    if (!res.ok) throw new Error('Failed to fetch')
    const data = await res.json()
    cachedSpecialties = data.specialties || []
    return cachedSpecialties!
  } catch {
    return getDefaultSpecialties()
  }
}

export function getDefaultSpecialties() {
  return [
    { key: 'real_estate', name: 'Real Estate' },
    { key: 'hospitality', name: 'Hospitality' },
    { key: 'medspa', name: 'Med Spa' },
    { key: 'wellness', name: 'Wellness' },
    { key: 'beauty', name: 'Beauty' },
    { key: 'luxury_concierge', name: 'Luxury Concierge' },
    { key: 'commerce', name: 'Commerce' },
    { key: 'creator', name: 'Creator' },
    { key: 'automation', name: 'Automation' },
    { key: 'finance', name: 'Finance' },
    { key: 'tech', name: 'Tech' },
    { key: 'corporate', name: 'Corporate' },
    { key: 'crisis', name: 'Crisis Management' },
    { key: 'core', name: 'Core' },
    { key: 'health', name: 'Health' },
  ]
}

export function useSpecialties() {
  const [specialties, setSpecialties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSpecialties().then(s => {
      setSpecialties(s)
      setLoading(false)
    })
  }, [])

  return { specialties, loading }
}
