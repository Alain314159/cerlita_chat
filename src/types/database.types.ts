// Database types for Supabase

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          photo_url: string | null;
          is_online: boolean;
          last_seen: number | null;
          is_typing: boolean;
          push_token: string | null;
          created_at: number;
          updated_at: number;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string;
          photo_url?: string | null;
          is_online?: boolean;
          last_seen?: number | null;
          is_typing?: boolean;
          push_token?: string | null;
          created_at?: number;
          updated_at?: number;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          photo_url?: string | null;
          is_online?: boolean;
          last_seen?: number | null;
          is_typing?: boolean;
          push_token?: string | null;
          created_at?: number;
          updated_at?: number;
        };
      };
      chats: {
        Row: {
          id: string;
          type: string;
          participant_ids: string[];
          last_message: string | null;
          last_message_at: number | null;
          created_at: number;
          updated_at: number;
        };
        Insert: {
          id?: string;
          type?: string;
          participant_ids: string[];
          last_message?: string | null;
          last_message_at?: number | null;
          created_at?: number;
          updated_at?: number;
        };
        Update: {
          id?: string;
          type?: string;
          participant_ids?: string[];
          last_message?: string | null;
          last_message_at?: number | null;
          created_at?: number;
          updated_at?: number;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          type: string;
          text: string | null;
          media_url: string | null;
          thumbnail_url: string | null;
          status: string;
          delivered_at: number | null;
          read_at: number | null;
          created_at: number;
          edited_at: number | null;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          type?: string;
          text?: string | null;
          media_url?: string | null;
          thumbnail_url?: string | null;
          status?: string;
          delivered_at?: number | null;
          read_at?: number | null;
          created_at?: number;
          edited_at?: number | null;
        };
        Update: {
          id?: string;
          chat_id?: string;
          sender_id?: string;
          type?: string;
          text?: string | null;
          media_url?: string | null;
          thumbnail_url?: string | null;
          status?: string;
          delivered_at?: number | null;
          read_at?: number | null;
          created_at?: number;
          edited_at?: number | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
