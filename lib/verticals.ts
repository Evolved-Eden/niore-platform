'use client'

import { useState, useEffect } from 'react'

let cachedVerticals: any[] | null = null

export async function fetchVerticals(): Promise<any[]> {
  if (cachedVerticals) return cachedVerticals
  try {
    const res = await fetch('/api/admin/verticals')
    if (!res.ok) throw new Error('Failed to fetch')
    const data = await res.json()
    cachedVerticals = data.verticals || []
    return cachedVerticals!
  } catch {
    return getDefaultVerticals()
  }
}

export function getDefaultVerticals() {
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

export function useVerticals() {
  const [verticals, setVerticals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVerticals().then(v => {
      setVerticals(v)
      setLoading(false)
    })
  }, [])

  return { verticals, loading }
}
