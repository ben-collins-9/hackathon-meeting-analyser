export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          title: string;
          platform: string;
          participants: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string;
          platform?: string;
          participants?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          platform?: string;
          participants?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          author: string;
          content: string;
          sent_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          author?: string;
          content?: string;
          sent_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          author?: string;
          content?: string;
          sent_at?: string;
          created_at?: string;
        };
      };
      meeting_proposals: {
        Row: {
          id: string;
          conversation_id: string;
          title: string;
          summary: string;
          urgency: 'low' | 'medium' | 'high';
          suggested_duration_mins: number;
          agenda_items: Json;
          participants: Json;
          status: 'pending' | 'accepted' | 'declined' | 'scheduled';
          scheduled_at: string | null;
          triggered_signals: Json;
          analysis_score: number;
          confidence: 'low' | 'medium' | 'high';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          title?: string;
          summary?: string;
          urgency?: 'low' | 'medium' | 'high';
          suggested_duration_mins?: number;
          agenda_items?: Json;
          participants?: Json;
          status?: 'pending' | 'accepted' | 'declined' | 'scheduled';
          scheduled_at?: string | null;
          triggered_signals?: Json;
          analysis_score?: number;
          confidence?: 'low' | 'medium' | 'high';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          title?: string;
          summary?: string;
          urgency?: 'low' | 'medium' | 'high';
          suggested_duration_mins?: number;
          agenda_items?: Json;
          participants?: Json;
          status?: 'pending' | 'accepted' | 'declined' | 'scheduled';
          scheduled_at?: string | null;
          triggered_signals?: Json;
          analysis_score?: number;
          confidence?: 'low' | 'medium' | 'high';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type MeetingProposal = Database['public']['Tables']['meeting_proposals']['Row'];

export interface SignalHit {
  category: string;
  label: string;
  matches: string[];
  count: number;
  weight: number;
}
