export const STRIPE_API_VERSION = '2026-06-24.dahlia' as const

export const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const EXTERNAL_LINKS = {
  SERVICES: process.env.NEXT_PUBLIC_SERVICES_URL || 'https://evolvededen.com/services',
  EXCHANGE: process.env.NEXT_PUBLIC_EXCHANGE_URL || 'https://evolvededen.com/exchange',
} as const
