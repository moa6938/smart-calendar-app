// Supabase 데이터베이스 타입 정의
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
      tasks: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string | null
          text: string
          priority: 'low' | 'medium' | 'high'
          completed: boolean
          task_date: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string | null
          text: string
          priority?: 'low' | 'medium' | 'high'
          completed?: boolean
          task_date: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string | null
          text?: string
          priority?: 'low' | 'medium' | 'high'
          completed?: boolean
          task_date?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      priority_type: 'low' | 'medium' | 'high'
    }
  }
}

// 애플리케이션에서 사용할 Task 타입
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']
export type Priority = 'low' | 'medium' | 'high'
export type FilterType = 'all' | 'active' | 'completed' | 'high' | 'medium' | 'low'
