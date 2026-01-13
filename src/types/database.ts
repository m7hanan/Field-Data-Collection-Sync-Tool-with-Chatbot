export interface Database {
  public: {
    Tables: {
      field_records: {
        Row: {
          id: string
          field: string
          value: string
          location: string
          timestamp: string
          user_id: string
        }
        Insert: {
          id?: string
          field: string
          value: string
          location: string
          timestamp?: string
          user_id: string
        }
        Update: {
          id?: string
          field?: string
          value?: string
          location?: string
          timestamp?: string
          user_id?: string
        }
      }
      users: {
        Row: {
          id: string
          username: string
          password_hash: string
          role: 'admin' | 'user'
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          password_hash: string
          role?: 'admin' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          password_hash?: string
          role?: 'admin' | 'user'
          created_at?: string
        }
      }
      chatbot_logs: {
        Row: {
          id: string
          user_id: string
          message: string
          response: string
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          response: string
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          response?: string
          timestamp?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          details: string
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          details: string
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          details?: string
          timestamp?: string
        }
      }
    }
  }
}