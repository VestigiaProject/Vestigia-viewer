export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      historical_figures: {
        Row: {
          id: string
          name: string
          title: string | null
          biography: string | null
          profile_image: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          title?: string | null
          biography?: string | null
          profile_image?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          title?: string | null
          biography?: string | null
          profile_image?: string | null
          created_at?: string
        }
      }
      historical_posts: {
        Row: {
          id: string
          figure_id: string
          original_date: string
          content: string
          media_url: string | null
          is_significant: boolean
          created_at: string
        }
        Insert: {
          id?: string
          figure_id: string
          original_date: string
          content: string
          media_url?: string | null
          is_significant?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          figure_id?: string
          original_date?: string
          content?: string
          media_url?: string | null
          is_significant?: boolean
          created_at?: string
        }
      }
      user_interactions: {
        Row: {
          id: string
          user_id: string
          post_id: string
          type: 'comment' | 'like'
          content: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          type: 'comment' | 'like'
          content?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          type?: 'comment' | 'like'
          content?: string | null
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          username: string | null
          start_date: string
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          start_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          start_date?: string
          created_at?: string
        }
      }
    }
  }
}