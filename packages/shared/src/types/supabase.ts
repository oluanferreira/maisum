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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      benefit_rules: {
        Row: {
          available_days: number[] | null
          available_hours_end: string | null
          available_hours_start: string | null
          created_at: string | null
          daily_limit: number | null
          id: string
          is_active: boolean | null
          restaurant_id: string
        }
        Insert: {
          available_days?: number[] | null
          available_hours_end?: string | null
          available_hours_start?: string | null
          created_at?: string | null
          daily_limit?: number | null
          id?: string
          is_active?: boolean | null
          restaurant_id: string
        }
        Update: {
          available_days?: number[] | null
          available_hours_end?: string | null
          available_hours_start?: string | null
          created_at?: string | null
          daily_limit?: number | null
          id?: string
          is_active?: boolean | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_rules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits: {
        Row: {
          category: Database["public"]["Enums"]["benefit_category"]
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          restaurant_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["benefit_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          restaurant_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["benefit_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefits_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          state: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          state: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          state?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          restaurant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          restaurant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          created_at: string | null
          expires_at: string
          hmac_signature: string
          id: string
          restaurant_id: string | null
          source: Database["public"]["Enums"]["coupon_source"] | null
          status: Database["public"]["Enums"]["coupon_status"] | null
          subscription_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          hmac_signature?: string
          id?: string
          restaurant_id?: string | null
          source?: Database["public"]["Enums"]["coupon_source"] | null
          status?: Database["public"]["Enums"]["coupon_status"] | null
          subscription_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          hmac_signature?: string
          id?: string
          restaurant_id?: string | null
          source?: Database["public"]["Enums"]["coupon_source"] | null
          status?: Database["public"]["Enums"]["coupon_status"] | null
          subscription_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          abacatepay_payment_id: string | null
          amount: number
          created_at: string | null
          id: string
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["payment_status"] | null
          subscription_id: string
        }
        Insert: {
          abacatepay_payment_id?: string | null
          amount: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["payment_status"] | null
          subscription_id: string
        }
        Update: {
          abacatepay_payment_id?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["payment_status"] | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city_id: string | null
          created_at: string | null
          extra_coupons_this_month: number | null
          full_name: string
          id: string
          referral_code: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          avatar_url?: string | null
          city_id?: string | null
          created_at?: string | null
          extra_coupons_this_month?: number | null
          full_name: string
          id: string
          referral_code?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          avatar_url?: string | null
          city_id?: string | null
          created_at?: string | null
          extra_coupons_this_month?: number | null
          full_name?: string
          id?: string
          referral_code?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_granted: boolean | null
          created_at: string | null
          id: string
          referred_id: string | null
          referrer_id: string
          status: Database["public"]["Enums"]["referral_status"] | null
        }
        Insert: {
          bonus_granted?: boolean | null
          created_at?: string | null
          id?: string
          referred_id?: string | null
          referrer_id: string
          status?: Database["public"]["Enums"]["referral_status"] | null
        }
        Update: {
          bonus_granted?: boolean | null
          created_at?: string | null
          id?: string
          referred_id?: string | null
          referrer_id?: string
          status?: Database["public"]["Enums"]["referral_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_invites: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          restaurant_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          restaurant_id: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          restaurant_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_invites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string
          admin_user_id: string | null
          city_id: string
          created_at: string | null
          cuisine_type: string | null
          description: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          phone: string | null
          photos: string[] | null
        }
        Insert: {
          address: string
          admin_user_id?: string | null
          city_id: string
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          phone?: string | null
          photos?: string[] | null
        }
        Update: {
          address?: string
          admin_user_id?: string | null
          city_id?: string
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          phone?: string | null
          photos?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          coupon_id: string | null
          created_at: string | null
          id: string
          rating: number
          restaurant_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          coupon_id?: string | null
          created_at?: string | null
          id?: string
          rating: number
          restaurant_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          coupon_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_proofs: {
        Row: {
          coupon_id: string | null
          created_at: string | null
          id: string
          proof_type: Database["public"]["Enums"]["social_proof_type"]
          proof_url: string
          restaurant_id: string
          reviewed_by: string | null
          status: Database["public"]["Enums"]["social_proof_status"] | null
          user_id: string
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string | null
          id?: string
          proof_type: Database["public"]["Enums"]["social_proof_type"]
          proof_url: string
          restaurant_id: string
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["social_proof_status"] | null
          user_id: string
        }
        Update: {
          coupon_id?: string | null
          created_at?: string | null
          id?: string
          proof_type?: Database["public"]["Enums"]["social_proof_type"]
          proof_url?: string
          restaurant_id?: string
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["social_proof_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_proofs_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_proofs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_proofs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_proofs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          abacatepay_subscription_id: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          status: Database["public"]["Enums"]["subscription_status"] | null
          user_id: string
        }
        Insert: {
          abacatepay_subscription_id?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["subscription_status"] | null
          user_id: string
        }
        Update: {
          abacatepay_subscription_id?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_type?: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["subscription_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allocate_coupons: {
        Args: {
          p_plan: Database["public"]["Enums"]["plan_type"]
          p_subscription_id: string
          p_user_id: string
        }
        Returns: number
      }
      get_admin_metrics: { Args: never; Returns: Json }
      get_my_restaurant_id: { Args: never; Returns: string }
      get_nearby_restaurants: {
        Args: { p_lat: number; p_lng: number; p_radius_km?: number }
        Returns: {
          address: string
          admin_user_id: string | null
          city_id: string
          created_at: string | null
          cuisine_type: string | null
          description: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          phone: string | null
          photos: string[] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "restaurants"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_restaurant_detail: {
        Args: { p_restaurant_id: string }
        Returns: Json
      }
      get_restaurant_metrics: {
        Args: { p_days?: number; p_restaurant_id: string }
        Returns: Json
      }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      grant_extra_coupons: {
        Args: {
          p_count: number
          p_source: Database["public"]["Enums"]["coupon_source"]
          p_user_id: string
        }
        Returns: boolean
      }
      promote_to_restaurant_admin: {
        Args: { p_restaurant_id: string; p_user_id: string }
        Returns: boolean
      }
      validate_coupon: {
        Args: { p_coupon_id: string; p_restaurant_id: string }
        Returns: Json
      }
    }
    Enums: {
      benefit_category: "prato" | "drink" | "sobremesa" | "combo"
      coupon_source: "subscription" | "referral" | "review" | "social"
      coupon_status: "available" | "used" | "expired"
      payment_method: "pix" | "credit_card" | "boleto"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      plan_type: "monthly" | "annual"
      referral_status: "pending" | "completed"
      social_proof_status: "pending" | "approved" | "rejected"
      social_proof_type: "screenshot" | "link"
      subscription_status: "active" | "cancelled" | "past_due" | "expired"
      user_role: "user" | "restaurant_admin" | "super_admin"
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
      benefit_category: ["prato", "drink", "sobremesa", "combo"],
      coupon_source: ["subscription", "referral", "review", "social"],
      coupon_status: ["available", "used", "expired"],
      payment_method: ["pix", "credit_card", "boleto"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      plan_type: ["monthly", "annual"],
      referral_status: ["pending", "completed"],
      social_proof_status: ["pending", "approved", "rejected"],
      social_proof_type: ["screenshot", "link"],
      subscription_status: ["active", "cancelled", "past_due", "expired"],
      user_role: ["user", "restaurant_admin", "super_admin"],
    },
  },
} as const
