export type Database = {
  public: {
    Tables: {
      ideas: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          content?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: 'draft' | 'active' | 'archived';
          channels: string[] | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: 'draft' | 'active' | 'archived';
          channels?: string[] | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          status?: 'draft' | 'active' | 'archived';
          channels?: string[] | null;
          start_date?: string | null;
          end_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ideas_plans: {
        Row: {
          id: string;
          idea_id: string;
          plan_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          plan_id: string;
          created_at?: string;
        };
        Update: {
          idea_id?: string;
          plan_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      plan_sections: {
        Row: {
          id: string;
          plan_id: string;
          user_id: string;
          title: string;
          content: Record<string, unknown> | null;
          section_type: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          user_id: string;
          title: string;
          content?: Record<string, unknown> | null;
          section_type?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: Record<string, unknown> | null;
          section_type?: string | null;
          order_index?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      calendar_runs: {
        Row: {
          id: string;
          calendar_id: string;
          user_id: string;
          plan_id: string | null;
          status: 'completed' | 'timeout' | 'failed';
          started_at: string;
          completed_at: string | null;
          tokens: number | null;
          model: string | null;
          latency_ms: number | null;
          piece_count: number;
          diff: Record<string, unknown> | null;
          constraints: Record<string, unknown> | null;
          cadence: string;
          channels: string[];
          start_date: string;
          end_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          calendar_id: string;
          user_id: string;
          plan_id?: string | null;
          status: 'completed' | 'timeout' | 'failed';
          started_at?: string;
          completed_at?: string | null;
          tokens?: number | null;
          model?: string | null;
          latency_ms?: number | null;
          piece_count?: number;
          diff?: Record<string, unknown> | null;
          constraints?: Record<string, unknown> | null;
          cadence: string;
          channels?: string[];
          start_date: string;
          end_date: string;
          created_at?: string;
        };
        Update: {
          plan_id?: string | null;
          status?: 'completed' | 'timeout' | 'failed';
          started_at?: string;
          completed_at?: string | null;
          tokens?: number | null;
          model?: string | null;
          latency_ms?: number | null;
          piece_count?: number;
          diff?: Record<string, unknown> | null;
          constraints?: Record<string, unknown> | null;
          cadence?: string;
          channels?: string[];
          start_date?: string;
          end_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      calendar_entries: {
        Row: {
          id: string;
          run_id: string;
          calendar_id: string;
          user_id: string;
          plan_id: string | null;
          entry_key: string;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          calendar_id: string;
          user_id: string;
          plan_id?: string | null;
          entry_key: string;
          payload: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          plan_id?: string | null;
          entry_key?: string;
          payload?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
