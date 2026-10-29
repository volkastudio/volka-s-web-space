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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      project_inquiries: {
        Row: {
          budget_range: string
          challenge: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          offer: string
          phone: string | null
          preferred_channel: string
          referral_source: string | null
          timeline: string
          vision: string
          internal_notes: string | null
          ip_hash: string | null
          locale: string | null
          notified_at: string | null
          notify_error: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          budget_range: string
          challenge?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          offer: string
          phone?: string | null
          preferred_channel?: string
          referral_source?: string | null
          timeline: string
          vision: string
          internal_notes?: string | null
          ip_hash?: string | null
          locale?: string | null
          notified_at?: string | null
          notify_error?: string | null
          status?: string
          user_agent?: string | null
        }
        Update: {
          budget_range?: string
          challenge?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          offer?: string
          phone?: string | null
          preferred_channel?: string
          referral_source?: string | null
          timeline?: string
          vision?: string
          internal_notes?: string | null
          ip_hash?: string | null
          locale?: string | null
          notified_at?: string | null
          notify_error?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          user_id: string
          role: 'owner' | 'sales' | 'editor'
          created_at: string
        }
        Insert: {
          user_id: string
          role?: 'owner' | 'sales' | 'editor'
          created_at?: string
        }
        Update: {
          user_id?: string
          role?: 'owner' | 'sales' | 'editor'
          created_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          value: Json
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_events: {
        Row: {
          id: string
          event_name: string
          path: string
          entity_type: string | null
          entity_id: string | null
          visitor_hash: string
          session_id: string | null
          source: string | null
          referrer: string | null
          referrer_host: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          country: string | null
          device_class: string | null
          browser_family: string | null
          locale: string | null
          duration_seconds: number
          scroll_depth: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_name: string
          path: string
          entity_type?: string | null
          entity_id?: string | null
          visitor_hash: string
          session_id?: string | null
          source?: string | null
          referrer?: string | null
          referrer_host?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          country?: string | null
          device_class?: string | null
          browser_family?: string | null
          locale?: string | null
          duration_seconds?: number
          scroll_depth?: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          event_name?: string
          path?: string
          entity_type?: string | null
          entity_id?: string | null
          visitor_hash?: string
          session_id?: string | null
          source?: string | null
          referrer?: string | null
          referrer_host?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          country?: string | null
          device_class?: string | null
          browser_family?: string | null
          locale?: string | null
          duration_seconds?: number
          scroll_depth?: number
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          date: string
          views: number
          visitors: number
          reads: number
          bounces: number
          avg_duration_seconds: number
          updated_at: string
        }
        Insert: {
          date: string
          views?: number
          visitors?: number
          reads?: number
          bounces?: number
          avg_duration_seconds?: number
          updated_at?: string
        }
        Update: {
          date?: string
          views?: number
          visitors?: number
          reads?: number
          bounces?: number
          avg_duration_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      daily_sources: {
        Row: {
          id: number
          date: string
          source: string
          referrer_host: string
          utm_campaign: string
          views: number
          visitors: number
          reads: number
          updated_at: string
        }
        Insert: {
          id?: number
          date: string
          source: string
          referrer_host?: string
          utm_campaign?: string
          views?: number
          visitors?: number
          reads?: number
          updated_at?: string
        }
        Update: {
          id?: number
          date?: string
          source?: string
          referrer_host?: string
          utm_campaign?: string
          views?: number
          visitors?: number
          reads?: number
          updated_at?: string
        }
        Relationships: []
      }
      daily_entity_stats: {
        Row: {
          id: number
          date: string
          entity_type: string
          entity_id: string
          views: number
          visitors: number
          reads: number
          total_reading_time_seconds: number
          cta_clicks: number
          social_clicks: number
          updated_at: string
        }
        Insert: {
          id?: number
          date: string
          entity_type: string
          entity_id: string
          views?: number
          visitors?: number
          reads?: number
          total_reading_time_seconds?: number
          cta_clicks?: number
          social_clicks?: number
          updated_at?: string
        }
        Update: {
          id?: number
          date?: string
          entity_type?: string
          entity_id?: string
          views?: number
          visitors?: number
          reads?: number
          total_reading_time_seconds?: number
          cta_clicks?: number
          social_clicks?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          entity: string
          entity_id: string | null
          diff: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          entity: string
          entity_id?: string | null
          diff?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          action?: string
          entity?: string
          entity_id?: string | null
          diff?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      case_studies: {
        Row: {
          id: string
          slug: string
          kind: 'concept' | 'client'
          status: 'draft' | 'published'
          sort_order: number
          featured: boolean
          client: string
          year: string
          location: string
          offer: string | null
          cover_path: string | null
          gallery: Json
          translations: Json
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          kind?: 'concept' | 'client'
          status?: 'draft' | 'published'
          sort_order?: number
          featured?: boolean
          client: string
          year: string
          location: string
          offer?: string | null
          cover_path?: string | null
          gallery?: Json
          translations: Json
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          kind?: 'concept' | 'client'
          status?: 'draft' | 'published'
          sort_order?: number
          featured?: boolean
          client?: string
          year?: string
          location?: string
          offer?: string | null
          cover_path?: string | null
          gallery?: Json
          translations?: Json
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          slug: string
          status: 'draft' | 'published'
          published_at: string | null
          cover_path: string | null
          tags: string[]
          reading_time_minutes: number
          social_links: Json
          translations: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          status?: 'draft' | 'published'
          published_at?: string | null
          cover_path?: string | null
          tags?: string[]
          reading_time_minutes?: number
          social_links?: Json
          translations: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          status?: 'draft' | 'published'
          published_at?: string | null
          cover_path?: string | null
          tags?: string[]
          reading_time_minutes?: number
          social_links?: Json
          translations?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          id: number
          ts: string
          type: string
          severity: 'info' | 'warning' | 'critical'
          actor_id: string | null
          ip_hash: string | null
          path: string | null
          details: Json | null
        }
        Insert: {
          id?: number
          ts?: string
          type: string
          severity: 'info' | 'warning' | 'critical'
          actor_id?: string | null
          ip_hash?: string | null
          path?: string | null
          details?: Json | null
        }
        Update: {
          id?: number
          ts?: string
          type?: string
          severity?: 'info' | 'warning' | 'critical'
          actor_id?: string | null
          ip_hash?: string | null
          path?: string | null
          details?: Json | null
        }
        Relationships: []
      }
      health_checks: {
        Row: {
          key: string
          group_name: string
          status: 'ok' | 'warning' | 'error'
          detail: string
          hint: string | null
          checked_at: string
        }
        Insert: {
          key: string
          group_name?: string
          status: 'ok' | 'warning' | 'error'
          detail: string
          hint?: string | null
          checked_at?: string
        }
        Update: {
          key?: string
          group_name?: string
          status?: 'ok' | 'warning' | 'error'
          detail?: string
          hint?: string | null
          checked_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          id: number
          ts: string
          email_hash: string
          ip_hash: string
          success: boolean
        }
        Insert: {
          id?: number
          ts?: string
          email_hash: string
          ip_hash: string
          success?: boolean
        }
        Update: {
          id?: number
          ts?: string
          email_hash?: string
          ip_hash?: string
          success?: boolean
        }
        Relationships: []
      }
      audit_requests: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          status: 'pending_verification' | 'queued' | 'waitlist' | 'reviewing' | 'completed' | 'rejected'
          track: 'website' | 'marketing' | 'sales' | 'general'
          contact_name: string
          contact_email: string
          contact_phone: string
          company_name: string
          activity_sector: string
          country: string
          team_size: string
          website_url: string | null
          specific_answers: Json
          verification_token: string
          verification_token_expires_at: string
          verified_at: string | null
          is_entitled: boolean
          privacy_consent: boolean
          admin_notes: string | null
          sent_at: string | null
          due_at: string | null
          hashed_ip: string | null
          assigned_to: string | null
          minutes_spent: number | null
          locale: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          status?: 'pending_verification' | 'queued' | 'waitlist' | 'reviewing' | 'completed' | 'rejected'
          track?: 'website' | 'marketing' | 'sales' | 'general'
          contact_name: string
          contact_email: string
          contact_phone: string
          company_name: string
          activity_sector: string
          country: string
          team_size: string
          website_url?: string | null
          specific_answers?: Json
          verification_token: string
          verification_token_expires_at: string
          verified_at?: string | null
          is_entitled?: boolean
          privacy_consent?: boolean
          admin_notes?: string | null
          sent_at?: string | null
          due_at?: string | null
          hashed_ip?: string | null
          assigned_to?: string | null
          minutes_spent?: number | null
          locale?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          status?: 'pending_verification' | 'queued' | 'waitlist' | 'reviewing' | 'completed' | 'rejected'
          track?: 'website' | 'marketing' | 'sales' | 'general'
          contact_name?: string
          contact_email?: string
          contact_phone?: string
          company_name?: string
          activity_sector?: string
          country?: string
          team_size?: string
          website_url?: string | null
          specific_answers?: Json
          verification_token?: string
          verification_token_expires_at?: string
          verified_at?: string | null
          is_entitled?: boolean
          privacy_consent?: boolean
          admin_notes?: string | null
          sent_at?: string | null
          due_at?: string | null
          hashed_ip?: string | null
          assigned_to?: string | null
          minutes_spent?: number | null
          locale?: string | null
        }
        Relationships: []
      }
      digital_products: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          slug: string
          title: string
          headline: string
          cover_image: string | null
          description: string
          features: Json
          faq: Json
          status: 'draft' | 'published' | 'archived'
          trigger_keyword: string | null
          views_count: number
          cta_clicks_count: number
          outbound_clicks_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          slug: string
          title: string
          headline: string
          cover_image?: string | null
          description: string
          features?: Json
          faq?: Json
          status?: 'draft' | 'published' | 'archived'
          trigger_keyword?: string | null
          views_count?: number
          cta_clicks_count?: number
          outbound_clicks_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          slug?: string
          title?: string
          headline?: string
          cover_image?: string | null
          description?: string
          features?: Json
          faq?: Json
          status?: 'draft' | 'published' | 'archived'
          trigger_keyword?: string | null
          views_count?: number
          cta_clicks_count?: number
          outbound_clicks_count?: number
        }
        Relationships: []
      }
      product_regions: {
        Row: {
          id: string
          product_id: string
          region_key: string
          label_fr: string
          label_en: string
          checkout_url: string
          platform_name: string
          sort_order: number
          is_active: boolean
        }
        Insert: {
          id?: string
          product_id: string
          region_key: string
          label_fr: string
          label_en: string
          checkout_url: string
          platform_name?: string
          sort_order?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          product_id?: string
          region_key?: string
          label_fr?: string
          label_en?: string
          checkout_url?: string
          platform_name?: string
          sort_order?: number
          is_active?: boolean
        }
        Relationships: []
      }
      buyers: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string | null
          country: string | null
          product_id: string | null
          product_title: string
          platform: string
          platform_order_ref: string | null
          amount_cents: number | null
          currency: string | null
          marketing_consent: 'yes' | 'no' | 'unknown'
          consent_note: string | null
          source_tag: string | null
          lead_id: string | null
          import_batch_id: string | null
          purchased_at: string | null
          region_key: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          name?: string | null
          country?: string | null
          product_id?: string | null
          product_title: string
          platform: string
          platform_order_ref?: string | null
          amount_cents?: number | null
          currency?: string | null
          marketing_consent?: 'yes' | 'no' | 'unknown'
          consent_note?: string | null
          source_tag?: string | null
          lead_id?: string | null
          import_batch_id?: string | null
          purchased_at?: string | null
          region_key?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string | null
          country?: string | null
          product_id?: string | null
          product_title?: string
          platform?: string
          platform_order_ref?: string | null
          amount_cents?: number | null
          currency?: string | null
          marketing_consent?: 'yes' | 'no' | 'unknown'
          consent_note?: string | null
          source_tag?: string | null
          lead_id?: string | null
          import_batch_id?: string | null
          purchased_at?: string | null
          region_key?: string | null
        }
        Relationships: []
      }
      email_suppressions: {
        Row: {
          email: string
          reason: 'unsubscribe' | 'bounce' | 'complaint' | 'manual'
          suppressed_at: string
        }
        Insert: {
          email: string
          reason: 'unsubscribe' | 'bounce' | 'complaint' | 'manual'
          suppressed_at?: string
        }
        Update: {
          email?: string
          reason?: 'unsubscribe' | 'bounce' | 'complaint' | 'manual'
          suppressed_at?: string
        }
        Relationships: []
      }
      audit_findings_library: {
        Row: {
          id: string
          track: 'website' | 'marketing' | 'sales' | 'general'
          pillar: string | null
          title_fr: string
          title_en: string
          why_fr: string
          why_en: string
          fix_fr: string
          fix_en: string
          impact: number
          effort: number
          suggested_offer: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          track: 'website' | 'marketing' | 'sales' | 'general'
          pillar?: string | null
          title_fr: string
          title_en?: string
          why_fr?: string
          why_en?: string
          fix_fr?: string
          fix_en?: string
          impact?: number
          effort?: number
          suggested_offer?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          track?: 'website' | 'marketing' | 'sales' | 'general'
          pillar?: string | null
          title_fr?: string
          title_en?: string
          why_fr?: string
          why_en?: string
          fix_fr?: string
          fix_en?: string
          impact?: number
          effort?: number
          suggested_offer?: string | null
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      audit_reports: {
        Row: {
          id: string
          audit_request_id: string
          token_hash: string
          expires_at: string
          revoked_at: string | null
          locale: string
          scorecard: Json
          findings: Json
          quick_wins: Json
          recommendation: Json
          sent_at: string | null
          first_viewed_at: string | null
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          audit_request_id: string
          token_hash: string
          expires_at?: string
          revoked_at?: string | null
          locale?: string
          scorecard?: Json
          findings?: Json
          quick_wins?: Json
          recommendation?: Json
          sent_at?: string | null
          first_viewed_at?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          audit_request_id?: string
          token_hash?: string
          expires_at?: string
          revoked_at?: string | null
          locale?: string
          scorecard?: Json
          findings?: Json
          quick_wins?: Json
          recommendation?: Json
          sent_at?: string | null
          first_viewed_at?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      import_batches: {
        Row: {
          id: string
          filename: string
          platform: string
          row_count: number
          imported_count: number
          skipped_count: number
          created_by: string | null
          created_at: string
          undone_at: string | null
        }
        Insert: {
          id?: string
          filename: string
          platform: string
          row_count?: number
          imported_count?: number
          skipped_count?: number
          created_by?: string | null
          created_at?: string
          undone_at?: string | null
        }
        Update: {
          id?: string
          filename?: string
          platform?: string
          row_count?: number
          imported_count?: number
          skipped_count?: number
          created_by?: string | null
          created_at?: string
          undone_at?: string | null
        }
        Relationships: []
      }
      email_sequences: {
        Row: {
          id: string
          key: string
          name: string
          scope: Json
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          name: string
          scope?: Json
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          name?: string
          scope?: Json
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_sequence_steps: {
        Row: {
          id: string
          sequence_id: string
          position: number
          delay_days: number
          subject_fr: string
          subject_en: string
          body_fr: string
          body_en: string
          stop_on_reply: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sequence_id: string
          position?: number
          delay_days?: number
          subject_fr: string
          subject_en?: string
          body_fr: string
          body_en?: string
          stop_on_reply?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sequence_id?: string
          position?: number
          delay_days?: number
          subject_fr?: string
          subject_en?: string
          body_fr?: string
          body_en?: string
          stop_on_reply?: boolean
          created_at?: string
        }
        Relationships: []
      }
      email_sends: {
        Row: {
          id: string
          sequence_step_id: string
          buyer_id: string
          status: 'scheduled' | 'sent' | 'failed' | 'skipped' | 'cancelled'
          scheduled_at: string
          sent_at: string | null
          error: string | null
          message_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sequence_step_id: string
          buyer_id: string
          status?: 'scheduled' | 'sent' | 'failed' | 'skipped' | 'cancelled'
          scheduled_at: string
          sent_at?: string | null
          error?: string | null
          message_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sequence_step_id?: string
          buyer_id?: string
          status?: 'scheduled' | 'sent' | 'failed' | 'skipped' | 'cancelled'
          scheduled_at?: string
          sent_at?: string | null
          error?: string | null
          message_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          id: string
          platform: string
          received_at: string
          signature_ok: boolean
          processed_at: string | null
          payload: Json
        }
        Insert: {
          id: string
          platform: string
          received_at?: string
          signature_ok?: boolean
          processed_at?: string | null
          payload?: Json
        }
        Update: {
          id?: string
          platform?: string
          received_at?: string
          signature_ok?: boolean
          processed_at?: string | null
          payload?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
