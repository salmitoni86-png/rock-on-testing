export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          body_md: string
          category_id: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          title: string
        }
        Insert: {
          author_id?: string | null
          body_md?: string
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          title: string
        }
        Update: {
          author_id?: string | null
          body_md?: string
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      card_balances: {
        Row: {
          balance: number
          card_id: string
          id: number
          polled_at: string
          proxy_used: string | null
        }
        Insert: {
          balance: number
          card_id: string
          id?: number
          polled_at?: string
          proxy_used?: string | null
        }
        Update: {
          balance?: number
          card_id?: string
          id?: number
          polled_at?: string
          proxy_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_balances_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_members: {
        Row: {
          accepted_at: string
          card_id: string
          role: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          card_id: string
          role: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          card_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_members_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_share_requests: {
        Row: {
          card_id: string
          created_at: string
          id: string
          requested_by: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          requested_by: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          requested_by?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_share_requests_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          card_number: string
          created_at: string
          id: string
          is_active: boolean
          last_balance: number | null
          last_polled_at: string | null
          last4: string | null
          name: string
          owner_id: string
          owner_name: string | null
          pin_hash: string | null
        }
        Insert: {
          card_number: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_balance?: number | null
          last_polled_at?: string | null
          last4?: string | null
          name?: string
          owner_id: string
          owner_name?: string | null
          pin_hash?: string | null
        }
        Update: {
          card_number?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_balance?: number | null
          last_polled_at?: string | null
          last4?: string | null
          name?: string
          owner_id?: string
          owner_name?: string | null
          pin_hash?: string | null
        }
        Relationships: []
      }
      earning_tip_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          tip_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          tip_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          tip_id?: string
        }
        Relationships: []
      }
      earning_tip_ratings: {
        Row: {
          created_at: string
          id: string
          stars: number
          tip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stars: number
          tip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stars?: number
          tip_id?: string
          user_id?: string
        }
        Relationships: []
      }
      earning_tips: {
        Row: {
          author_id: string | null
          click_count: number
          created_at: string
          description: string
          featured: boolean
          hashtag: string | null
          id: string
          kr_amount: number
          min_withdraw: number
          status: string
          title: string
          url: string
          withdraw_multiplier: number
        }
        Insert: {
          author_id?: string | null
          click_count?: number
          created_at?: string
          description?: string
          featured?: boolean
          hashtag?: string | null
          id?: string
          kr_amount?: number
          min_withdraw?: number
          status?: string
          title: string
          url: string
          withdraw_multiplier?: number
        }
        Update: {
          author_id?: string | null
          click_count?: number
          created_at?: string
          description?: string
          featured?: boolean
          hashtag?: string | null
          id?: string
          kr_amount?: number
          min_withdraw?: number
          status?: string
          title?: string
          url?: string
          withdraw_multiplier?: number
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          code: string
          created_at: string
          email: string | null
          id: string
          inviter_id: string
          manual: boolean
          note: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          inviter_id: string
          manual?: boolean
          note?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          inviter_id?: string
          manual?: boolean
          note?: string | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ban_reason: string | null
          banned: boolean
          banned_at: string | null
          contact_email: string | null
          created_at: string
          discord: string | null
          display_name: string | null
          id: string
          phone: string | null
          referred_by_code: string | null
          snapchat: string | null
          telegram: string | null
          username: string
          warning_count: number
          whatsapp: string | null
        }
        Insert: {
          ban_reason?: string | null
          banned?: boolean
          banned_at?: string | null
          contact_email?: string | null
          created_at?: string
          discord?: string | null
          display_name?: string | null
          id: string
          phone?: string | null
          referred_by_code?: string | null
          snapchat?: string | null
          telegram?: string | null
          username: string
          warning_count?: number
          whatsapp?: string | null
        }
        Update: {
          ban_reason?: string | null
          banned?: boolean
          banned_at?: string | null
          contact_email?: string | null
          created_at?: string
          discord?: string | null
          display_name?: string | null
          id?: string
          phone?: string | null
          referred_by_code?: string | null
          snapchat?: string | null
          telegram?: string | null
          username?: string
          warning_count?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      referral_tiers: {
        Row: {
          id: number
          perk: string
          threshold: number
          title: string
        }
        Insert: {
          id: number
          perk: string
          threshold: number
          title: string
        }
        Update: {
          id?: number
          perk?: string
          threshold?: number
          title?: string
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: number
          lat: number | null
          lng: number | null
          path: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: number
          lat?: number | null
          lng?: number | null
          path?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: number
          lat?: number | null
          lng?: number | null
          path?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      support_conversations: {
        Row: {
          anon_id: string | null
          closed: boolean
          created_at: string
          id: string
          needs_human: boolean
          user_id: string | null
        }
        Insert: {
          anon_id?: string | null
          closed?: boolean
          created_at?: string
          id?: string
          needs_human?: boolean
          user_id?: string | null
        }
        Update: {
          anon_id?: string | null
          closed?: boolean
          created_at?: string
          id?: string
          needs_human?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_nok: number
          card_id: string
          category: string | null
          created_at: string
          external_id: string | null
          id: string
          is_salary: boolean
          merchant: string
          posted_at: string
        }
        Insert: {
          amount_nok: number
          card_id: string
          category?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          is_salary?: boolean
          merchant: string
          posted_at: string
        }
        Update: {
          amount_nok?: number
          card_id?: string
          category?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          is_salary?: boolean
          merchant?: string
          posted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_warnings: {
        Row: {
          context: string | null
          created_at: string
          id: string
          reason: string
          severity: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          reason: string
          severity?: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          reason?: string
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _uid: string }
        Returns: boolean
      }
      increment_tip_click: { Args: { _tip_id: string }; Returns: undefined }
      is_banned: { Args: { _uid: string }; Returns: boolean }
      is_card_member: {
        Args: { _card_id: string; _user_id: string }
        Returns: boolean
      }
      is_card_owner: {
        Args: { _card_id: string; _user_id: string }
        Returns: boolean
      }
      refresh_card_transactions: {
        Args: { _card_id: string }
        Returns: {
          added: number
          new_balance: number
        }[]
      }
      seed_mock_transactions: { Args: { _card_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
