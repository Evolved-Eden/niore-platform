// Core role type
export type UserRole = 'client' | 'creator' | 'admin'

// ris_citizens row shape (key columns used across dashboards)
export interface RisCitizen {
  id: string
  supabase_user_id: string
  role: UserRole
  display_name: string | null
  omni_score: number | null
  axis_balance: number | null
  rank: string | null
  created_at: string
}

// intelligences row
export interface Intelligence {
  id: string
  owner_id: string
  name: string
  status: string
  vertical: 'real_estate' | 'healthcare' | 'social' | 'corporate' | null
  training_status: string
  listed_on_exchange: boolean
  created_at: string
}

// zuri_memory row
export interface ZuriMemory {
  id: string
  user_id: string
  content: string
  memory_type: string
  created_at: string
}

// Minimal Database type for Supabase client generics
export type Database = {
  public: {
    Tables: {
      ris_citizens: { Row: RisCitizen; Insert: Partial<RisCitizen>; Update: Partial<RisCitizen> }
      intelligences: { Row: Intelligence; Insert: Partial<Intelligence>; Update: Partial<Intelligence> }
      zuri_memory: { Row: ZuriMemory; Insert: Partial<ZuriMemory>; Update: Partial<ZuriMemory> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: { user_role: UserRole }
  }
}