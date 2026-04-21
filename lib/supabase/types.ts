export type UserRole = 'client' | 'creator' | 'admin'

export type Database = {
  public: {
    Tables: {
      ris_citizens: {
        Row: {
          id: string
          supabase_user_id: string
          display_name: string | null
          role: UserRole
          omni_score: number | null
          axis_balance: number | null
          created_at: string
        }
        Insert: {
          supabase_user_id: string
          display_name?: string | null
          role?: UserRole
        }
        Update: {
          display_name?: string | null
          role?: UserRole
        }
      }
      intelligences: {
        Row: {
          id: string
          owner_id: string
          created_at: string
        }
        Insert: {
          owner_id: string
        }
        Update: {}
      }
    }
  }
}