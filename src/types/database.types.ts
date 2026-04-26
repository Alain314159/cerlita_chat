// Database types for Supabase - Updated to match strict 1-on-1 schema

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
          last_seen_at: string | null;
          is_typing: boolean;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string;
          photo_url?: string | null;
          is_online?: boolean;
          last_seen_at?: string | null;
          is_typing?: boolean;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          photo_url?: string | null;
          is_online?: boolean;
          last_seen_at?: string | null;
          is_typing?: boolean;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chats: {
        Row: {
          id: string;
          participant_ids: string[];
          last_message_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          participant_ids: string[];
          last_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          participant_ids?: string[];
          last_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_participants: {
        Row: {
          id: string;
          chat_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          message_type: string;
          content: string | null;
          media_url: string | null;
          thumbnail_url: string | null;
          status: string;
          is_edited: boolean;
          read_at: string | null;
          reply_to_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          message_type?: string;
          content?: string | null;
          media_url?: string | null;
          thumbnail_url?: string | null;
          status?: string;
          is_edited?: boolean;
          read_at?: string | null;
          reply_to_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          sender_id?: string;
          message_type?: string;
          content?: string | null;
          media_url?: string | null;
          thumbnail_url?: string | null;
          status?: string;
          is_edited?: boolean;
          read_at?: string | null;
          reply_to_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      message_reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          data: any;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          data?: any;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          data?: any;
          status?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      get_or_create_direct_chat: {
        Args: {
          user1_id: string;
          user2_id: string;
        };
        Returns: string;
      };
    };
    Enums: {};
  };
}
