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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          requested_at: string
          user_id: string
        }
        Insert: {
          requested_at?: string
          user_id: string
        }
        Update: {
          requested_at?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          call_name: string
          characters: number | null
          created_at: string
          id: string
          input_cost_usd: number | null
          input_tokens: number | null
          meta: Json | null
          model: string
          output_cost_usd: number | null
          output_tokens: number | null
          route: string | null
          total_cost_usd: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          call_name: string
          characters?: number | null
          created_at?: string
          id?: string
          input_cost_usd?: number | null
          input_tokens?: number | null
          meta?: Json | null
          model: string
          output_cost_usd?: number | null
          output_tokens?: number | null
          route?: string | null
          total_cost_usd?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          call_name?: string
          characters?: number | null
          created_at?: string
          id?: string
          input_cost_usd?: number | null
          input_tokens?: number | null
          meta?: Json | null
          model?: string
          output_cost_usd?: number | null
          output_tokens?: number | null
          route?: string | null
          total_cost_usd?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_support_reports: {
        Row: {
          attachment_storage_paths: string[]
          billing_purchase_channel: string | null
          created_at: string
          description: string
          id: string
          submission_type: string
          tool_label: string
          tool_value: string
          user_email: string
          user_first_name: string | null
          user_id: string
        }
        Insert: {
          attachment_storage_paths?: string[]
          billing_purchase_channel?: string | null
          created_at?: string
          description: string
          id?: string
          submission_type: string
          tool_label: string
          tool_value: string
          user_email: string
          user_first_name?: string | null
          user_id: string
        }
        Update: {
          attachment_storage_paths?: string[]
          billing_purchase_channel?: string | null
          created_at?: string
          description?: string
          id?: string
          submission_type?: string
          tool_label?: string
          tool_value?: string
          user_email?: string
          user_first_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      board_reminder_deliveries: {
        Row: {
          channel: string
          created_at: string
          error: string | null
          id: string
          provider_message_id: string | null
          reminder_id: string
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          provider_message_id?: string | null
          reminder_id: string
          status: string
        }
        Update: {
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          provider_message_id?: string | null
          reminder_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_reminder_deliveries_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "board_reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      board_reminders: {
        Row: {
          board_id: string
          body: string | null
          channels: string[]
          created_at: string
          fabric_object_id: string | null
          ical_uid: string | null
          id: string
          last_sent_at: string | null
          remind_at: string
          source: string
          status: string
          timezone: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_id: string
          body?: string | null
          channels?: string[]
          created_at?: string
          fabric_object_id?: string | null
          ical_uid?: string | null
          id?: string
          last_sent_at?: string | null
          remind_at: string
          source?: string
          status?: string
          timezone?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_id?: string
          body?: string | null
          channels?: string[]
          created_at?: string
          fabric_object_id?: string | null
          ical_uid?: string | null
          id?: string
          last_sent_at?: string | null
          remind_at?: string
          source?: string
          status?: string
          timezone?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_reminders_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_workspaces: {
        Row: {
          accountability_map_json: Json | null
          created_at: string
          id: string
          name: string
          preset_slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accountability_map_json?: Json | null
          created_at?: string
          id?: string
          name?: string
          preset_slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accountability_map_json?: Json | null
          created_at?: string
          id?: string
          name?: string
          preset_slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      boards: {
        Row: {
          artboard_height: number
          artboard_width: number
          color_key: string
          created_at: string
          id: string
          layout_json: Json
          layout_mode: string
          role: Database["public"]["Enums"]["board_role"]
          sort_order: number
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          artboard_height?: number
          artboard_width?: number
          color_key?: string
          created_at?: string
          id?: string
          layout_json?: Json
          layout_mode?: string
          role?: Database["public"]["Enums"]["board_role"]
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          artboard_height?: number
          artboard_width?: number
          color_key?: string
          created_at?: string
          id?: string
          layout_json?: Json
          layout_mode?: string
          role?: Database["public"]["Enums"]["board_role"]
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "board_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      community_daily_prompts: {
        Row: {
          category: string
          day_index: number
          prompt_text: string
        }
        Insert: {
          category: string
          day_index: number
          prompt_text: string
        }
        Update: {
          category?: string
          day_index?: number
          prompt_text?: string
        }
        Relationships: []
      }
      community_feed_posts: {
        Row: {
          body_text: string
          category: string
          created_at: string
          id: string
          image_path: string | null
          post_kind: string
          published: boolean
          published_at: string
          title: string | null
        }
        Insert: {
          body_text: string
          category?: string
          created_at?: string
          id?: string
          image_path?: string | null
          post_kind?: string
          published?: boolean
          published_at?: string
          title?: string | null
        }
        Update: {
          body_text?: string
          category?: string
          created_at?: string
          id?: string
          image_path?: string | null
          post_kind?: string
          published?: boolean
          published_at?: string
          title?: string | null
        }
        Relationships: []
      }
      community_poll_options: {
        Row: {
          id: string
          image_path: string | null
          label: string
          poll_id: string
          sort_order: number
          submission_id: string | null
        }
        Insert: {
          id?: string
          image_path?: string | null
          label: string
          poll_id: string
          sort_order?: number
          submission_id?: string | null
        }
        Update: {
          id?: string
          image_path?: string | null
          label?: string
          poll_id?: string
          sort_order?: number
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_poll_options_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "community_setup_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "community_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      community_polls: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          reward_note: string | null
          starts_at: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          reward_note?: string | null
          starts_at?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          reward_note?: string | null
          starts_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      community_setup_submissions: {
        Row: {
          body_text: string
          category: string
          created_at: string
          feature_opt_in: boolean
          id: string
          image_paths: string[]
          setup_medium: string
          status: string
          title: string | null
          user_id: string
        }
        Insert: {
          body_text: string
          category: string
          created_at?: string
          feature_opt_in?: boolean
          id?: string
          image_paths?: string[]
          setup_medium?: string
          status?: string
          title?: string | null
          user_id: string
        }
        Update: {
          body_text?: string
          category?: string
          created_at?: string
          feature_opt_in?: boolean
          id?: string
          image_paths?: string[]
          setup_medium?: string
          status?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      demo_access_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      email_captures: {
        Row: {
          created_at: string
          email: string
          feedback: string | null
          first_name: string | null
          id: string
          marketing_consent: boolean
          page_path: string | null
          referrer: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          feedback?: string | null
          first_name?: string | null
          id?: string
          marketing_consent?: boolean
          page_path?: string | null
          referrer?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          feedback?: string | null
          first_name?: string | null
          id?: string
          marketing_consent?: boolean
          page_path?: string | null
          referrer?: string | null
          source?: string | null
        }
        Relationships: []
      }
      email_verification_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          config: Json | null
          description: string | null
          feature_name: string
          id: string
          is_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          description?: string | null
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          description?: string | null
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gamification_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      inbox_messages: {
        Row: {
          attachment_storage_paths: string[]
          body_text: string
          case_id: string | null
          created_at: string
          edited_at: string | null
          id: string
          sender: string
          thread_id: string
        }
        Insert: {
          attachment_storage_paths?: string[]
          body_text: string
          case_id?: string | null
          created_at?: string
          edited_at?: string | null
          id?: string
          sender: string
          thread_id: string
        }
        Update: {
          attachment_storage_paths?: string[]
          body_text?: string
          case_id?: string | null
          created_at?: string
          edited_at?: string | null
          id?: string
          sender?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "support_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "inbox_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          source: string
          status: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          source: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          source?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          entry_date: string
          entry_text: string
          entry_time: string
          has_wins: boolean | null
          id: string
          journal_day_experience_rating: string | null
          journal_env_3d_rating: string | null
          latitude: number | null
          location_name: string | null
          location_type: string | null
          longitude: number | null
          photo_url: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date: string
          entry_text: string
          entry_time?: string
          has_wins?: boolean | null
          id?: string
          journal_day_experience_rating?: string | null
          journal_env_3d_rating?: string | null
          latitude?: number | null
          location_name?: string | null
          location_type?: string | null
          longitude?: number | null
          photo_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          entry_text?: string
          entry_time?: string
          has_wins?: boolean | null
          id?: string
          journal_day_experience_rating?: string | null
          journal_env_3d_rating?: string | null
          latitude?: number | null
          location_name?: string | null
          location_type?: string | null
          longitude?: number | null
          photo_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_homepage_events: {
        Row: {
          browser_language: string | null
          city: string | null
          click_source: string | null
          country_code: string | null
          created_at: string
          device_os: string | null
          event_type: string
          id: string
          in_app_browser: string | null
          is_from_tiktok: boolean | null
          is_mobile_viewport: boolean | null
          landing_query: string | null
          page_path: string | null
          pixel_ratio: number | null
          referrer: string | null
          region: string | null
          routed_store_url: string | null
          screen_height: number | null
          screen_width: number | null
          store_target: string | null
          timezone: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visit_id: string
        }
        Insert: {
          browser_language?: string | null
          city?: string | null
          click_source?: string | null
          country_code?: string | null
          created_at?: string
          device_os?: string | null
          event_type: string
          id?: string
          in_app_browser?: string | null
          is_from_tiktok?: boolean | null
          is_mobile_viewport?: boolean | null
          landing_query?: string | null
          page_path?: string | null
          pixel_ratio?: number | null
          referrer?: string | null
          region?: string | null
          routed_store_url?: string | null
          screen_height?: number | null
          screen_width?: number | null
          store_target?: string | null
          timezone?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visit_id: string
        }
        Update: {
          browser_language?: string | null
          city?: string | null
          click_source?: string | null
          country_code?: string | null
          created_at?: string
          device_os?: string | null
          event_type?: string
          id?: string
          in_app_browser?: string | null
          is_from_tiktok?: boolean | null
          is_mobile_viewport?: boolean | null
          landing_query?: string | null
          page_path?: string | null
          pixel_ratio?: number | null
          referrer?: string | null
          region?: string | null
          routed_store_url?: string | null
          screen_height?: number | null
          screen_width?: number | null
          store_target?: string | null
          timezone?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visit_id?: string
        }
        Relationships: []
      }
      onboarding_session_setup: {
        Row: {
          conditional_specificity: Json
          current_friction: string | null
          desire_category: string | null
          desire_text: string | null
          desired_identity: string | null
          email: string | null
          first_name: string | null
          onboarding_session_id: string
          tool_preferences: string[]
          updated_at: string
          why_it_matters: string | null
        }
        Insert: {
          conditional_specificity?: Json
          current_friction?: string | null
          desire_category?: string | null
          desire_text?: string | null
          desired_identity?: string | null
          email?: string | null
          first_name?: string | null
          onboarding_session_id: string
          tool_preferences?: string[]
          updated_at?: string
          why_it_matters?: string | null
        }
        Update: {
          conditional_specificity?: Json
          current_friction?: string | null
          desire_category?: string | null
          desire_text?: string | null
          desired_identity?: string | null
          email?: string | null
          first_name?: string | null
          onboarding_session_id?: string
          tool_preferences?: string[]
          updated_at?: string
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_session_setup_onboarding_session_id_fkey"
            columns: ["onboarding_session_id"]
            isOneToOne: true
            referencedRelation: "onboarding_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_sessions: {
        Row: {
          app_notifications_consent: boolean | null
          attribution_payload: Json | null
          billing: string | null
          created_at: string
          email: string | null
          email_consent: boolean | null
          expires_at: string | null
          first_name: string | null
          first_touch_ad_id: string | null
          first_touch_adset_id: string | null
          first_touch_at: string | null
          first_touch_campaign: string | null
          first_touch_campaign_id: string | null
          first_touch_click_id_type: string | null
          first_touch_click_id_value: string | null
          first_touch_content: string | null
          first_touch_creative_id: string | null
          first_touch_landing_page: string | null
          first_touch_medium: string | null
          first_touch_referrer: string | null
          first_touch_source: string | null
          first_touch_term: string | null
          id: string
          last_touch_ad_id: string | null
          last_touch_adset_id: string | null
          last_touch_at: string | null
          last_touch_campaign: string | null
          last_touch_campaign_id: string | null
          last_touch_click_id_type: string | null
          last_touch_click_id_value: string | null
          last_touch_content: string | null
          last_touch_creative_id: string | null
          last_touch_landing_page: string | null
          last_touch_medium: string | null
          last_touch_referrer: string | null
          last_touch_source: string | null
          last_touch_term: string | null
          offering_id: string | null
          onboarding_answers: Json
          package_id: string | null
          paid_at: string | null
          paywall_id: string | null
          paywall_variant: string | null
          product_id: string | null
          resume_token_hash: string
          revenuecat_app_user_id: string | null
          revenuecat_attributes_synced_at: string | null
          selected_tier: string | null
          shell_appearance: string | null
          sms_consent: boolean | null
          status: Database["public"]["Enums"]["onboarding_session_status"]
          stripe_checkout_session_id: string | null
          stripe_customer_email: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tracking_authorization_status: string | null
          tracking_permission_asked_at: string | null
          tracking_pre_permission_choice: string | null
          updated_at: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          app_notifications_consent?: boolean | null
          attribution_payload?: Json | null
          billing?: string | null
          created_at?: string
          email?: string | null
          email_consent?: boolean | null
          expires_at?: string | null
          first_name?: string | null
          first_touch_ad_id?: string | null
          first_touch_adset_id?: string | null
          first_touch_at?: string | null
          first_touch_campaign?: string | null
          first_touch_campaign_id?: string | null
          first_touch_click_id_type?: string | null
          first_touch_click_id_value?: string | null
          first_touch_content?: string | null
          first_touch_creative_id?: string | null
          first_touch_landing_page?: string | null
          first_touch_medium?: string | null
          first_touch_referrer?: string | null
          first_touch_source?: string | null
          first_touch_term?: string | null
          id?: string
          last_touch_ad_id?: string | null
          last_touch_adset_id?: string | null
          last_touch_at?: string | null
          last_touch_campaign?: string | null
          last_touch_campaign_id?: string | null
          last_touch_click_id_type?: string | null
          last_touch_click_id_value?: string | null
          last_touch_content?: string | null
          last_touch_creative_id?: string | null
          last_touch_landing_page?: string | null
          last_touch_medium?: string | null
          last_touch_referrer?: string | null
          last_touch_source?: string | null
          last_touch_term?: string | null
          offering_id?: string | null
          onboarding_answers?: Json
          package_id?: string | null
          paid_at?: string | null
          paywall_id?: string | null
          paywall_variant?: string | null
          product_id?: string | null
          resume_token_hash: string
          revenuecat_app_user_id?: string | null
          revenuecat_attributes_synced_at?: string | null
          selected_tier?: string | null
          shell_appearance?: string | null
          sms_consent?: boolean | null
          status?: Database["public"]["Enums"]["onboarding_session_status"]
          stripe_checkout_session_id?: string | null
          stripe_customer_email?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tracking_authorization_status?: string | null
          tracking_permission_asked_at?: string | null
          tracking_pre_permission_choice?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          app_notifications_consent?: boolean | null
          attribution_payload?: Json | null
          billing?: string | null
          created_at?: string
          email?: string | null
          email_consent?: boolean | null
          expires_at?: string | null
          first_name?: string | null
          first_touch_ad_id?: string | null
          first_touch_adset_id?: string | null
          first_touch_at?: string | null
          first_touch_campaign?: string | null
          first_touch_campaign_id?: string | null
          first_touch_click_id_type?: string | null
          first_touch_click_id_value?: string | null
          first_touch_content?: string | null
          first_touch_creative_id?: string | null
          first_touch_landing_page?: string | null
          first_touch_medium?: string | null
          first_touch_referrer?: string | null
          first_touch_source?: string | null
          first_touch_term?: string | null
          id?: string
          last_touch_ad_id?: string | null
          last_touch_adset_id?: string | null
          last_touch_at?: string | null
          last_touch_campaign?: string | null
          last_touch_campaign_id?: string | null
          last_touch_click_id_type?: string | null
          last_touch_click_id_value?: string | null
          last_touch_content?: string | null
          last_touch_creative_id?: string | null
          last_touch_landing_page?: string | null
          last_touch_medium?: string | null
          last_touch_referrer?: string | null
          last_touch_source?: string | null
          last_touch_term?: string | null
          offering_id?: string | null
          onboarding_answers?: Json
          package_id?: string | null
          paid_at?: string | null
          paywall_id?: string | null
          paywall_variant?: string | null
          product_id?: string | null
          resume_token_hash?: string
          revenuecat_app_user_id?: string | null
          revenuecat_attributes_synced_at?: string | null
          selected_tier?: string | null
          shell_appearance?: string | null
          sms_consent?: boolean | null
          status?: Database["public"]["Enums"]["onboarding_session_status"]
          stripe_checkout_session_id?: string | null
          stripe_customer_email?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tracking_authorization_status?: string | null
          tracking_permission_asked_at?: string | null
          tracking_pre_permission_choice?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          app_notifications_enabled: boolean
          avatar_url: string | null
          created_at: string | null
          email: string | null
          email_verified_at: string | null
          first_name: string | null
          id: string
          last_activity: string | null
          notification_permission_status: string | null
          onboarding_answers: Json | null
          onboarding_data: Json | null
          phone: string | null
          preferred_locale: string | null
          preset_theme: string | null
          routine_intensity: string | null
          routine_items: Json
          routine_notification_times: Json
          signup_code: string | null
          timezone: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          app_notifications_enabled?: boolean
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_verified_at?: string | null
          first_name?: string | null
          id: string
          last_activity?: string | null
          notification_permission_status?: string | null
          onboarding_answers?: Json | null
          onboarding_data?: Json | null
          phone?: string | null
          preferred_locale?: string | null
          preset_theme?: string | null
          routine_intensity?: string | null
          routine_items?: Json
          routine_notification_times?: Json
          signup_code?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          app_notifications_enabled?: boolean
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_verified_at?: string | null
          first_name?: string | null
          id?: string
          last_activity?: string | null
          notification_permission_status?: string | null
          onboarding_answers?: Json | null
          onboarding_data?: Json | null
          phone?: string | null
          preferred_locale?: string | null
          preset_theme?: string | null
          routine_intensity?: string | null
          routine_items?: Json
          routine_notification_times?: Json
          signup_code?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      routine_push_delivery_log: {
        Row: {
          alert_slot: number
          id: string
          onesignal_response: Json | null
          scheduled_for_date: string
          scheduled_time: string
          sent_at: string
          user_id: string
        }
        Insert: {
          alert_slot: number
          id?: string
          onesignal_response?: Json | null
          scheduled_for_date: string
          scheduled_time: string
          sent_at?: string
          user_id: string
        }
        Update: {
          alert_slot?: number
          id?: string
          onesignal_response?: Json | null
          scheduled_for_date?: string
          scheduled_time?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_case_internal_notes: {
        Row: {
          admin_user_id: string
          body_text: string
          case_id: string
          created_at: string
          id: string
        }
        Insert: {
          admin_user_id: string
          body_text: string
          case_id: string
          created_at?: string
          id?: string
        }
        Update: {
          admin_user_id?: string
          body_text?: string
          case_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_case_internal_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "support_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      support_cases: {
        Row: {
          admin_unread: boolean
          attachment_storage_paths: string[]
          closed_at: string | null
          closed_by_admin_id: string | null
          created_at: string
          id: string
          latest_message_preview: string
          message_type: string
          original_submission_text: string
          report_id: string | null
          status: string
          subject: string
          submission_type: string | null
          thread_id: string | null
          tool_label: string | null
          tool_or_area: string | null
          updated_at: string
          user_email: string
          user_first_name: string | null
          user_id: string
          user_unread: boolean
        }
        Insert: {
          admin_unread?: boolean
          attachment_storage_paths?: string[]
          closed_at?: string | null
          closed_by_admin_id?: string | null
          created_at?: string
          id?: string
          latest_message_preview?: string
          message_type: string
          original_submission_text?: string
          report_id?: string | null
          status?: string
          subject?: string
          submission_type?: string | null
          thread_id?: string | null
          tool_label?: string | null
          tool_or_area?: string | null
          updated_at?: string
          user_email?: string
          user_first_name?: string | null
          user_id: string
          user_unread?: boolean
        }
        Update: {
          admin_unread?: boolean
          attachment_storage_paths?: string[]
          closed_at?: string | null
          closed_by_admin_id?: string | null
          created_at?: string
          id?: string
          latest_message_preview?: string
          message_type?: string
          original_submission_text?: string
          report_id?: string | null
          status?: string
          subject?: string
          submission_type?: string | null
          thread_id?: string | null
          tool_label?: string | null
          tool_or_area?: string | null
          updated_at?: string
          user_email?: string
          user_first_name?: string | null
          user_id?: string
          user_unread?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "support_cases_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "app_support_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_cases_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "inbox_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_action_history: {
        Row: {
          action_date: string
          actions: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_date: string
          actions?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_date?: string
          actions?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_daily_progress: {
        Row: {
          completed_actions: Json
          created_at: string
          id: string
          progress: number
          progress_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_actions?: Json
          created_at?: string
          id?: string
          progress?: number
          progress_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_actions?: Json
          created_at?: string
          id?: string
          progress?: number
          progress_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_gamification_stats: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          milestones_achieved: Json | null
          tools_used_this_week: Json | null
          total_tools_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          milestones_achieved?: Json | null
          tools_used_this_week?: Json | null
          total_tools_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          milestones_achieved?: Json | null
          tools_used_this_week?: Json | null
          total_tools_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_plan_brevo_cancellation_queue: {
        Row: {
          created_at: string
          preferred_locale: string | null
          send_after: string
          user_id: string
        }
        Insert: {
          created_at?: string
          preferred_locale?: string | null
          send_after: string
          user_id: string
        }
        Update: {
          created_at?: string
          preferred_locale?: string | null
          send_after?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plan_brevo_cancellation_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_plans"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_plan_brevo_welcome_queue: {
        Row: {
          created_at: string
          preferred_locale: string | null
          send_after: string
          user_id: string
        }
        Insert: {
          created_at?: string
          preferred_locale?: string | null
          send_after: string
          user_id: string
        }
        Update: {
          created_at?: string
          preferred_locale?: string | null
          send_after?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plan_brevo_welcome_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_plans"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_plans: {
        Row: {
          apple_customer_id: string | null
          billing_period: string | null
          brevo_cancellation_list_synced_at: string | null
          created_at: string | null
          current_period_end: string | null
          first_payment_source: string | null
          google_play_customer_id: string | null
          had_trial: boolean
          id: string
          last_payment_source: string | null
          on_trial: boolean
          review_prompt_attempted_at: string | null
          starter_provisioned: boolean
          status: string
          stripe_customer_id: string | null
          stripe_customer_id_official: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
          user_id: string
          welcome_email_sent_at: string | null
        }
        Insert: {
          apple_customer_id?: string | null
          billing_period?: string | null
          brevo_cancellation_list_synced_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          first_payment_source?: string | null
          google_play_customer_id?: string | null
          had_trial?: boolean
          id?: string
          last_payment_source?: string | null
          on_trial?: boolean
          review_prompt_attempted_at?: string | null
          starter_provisioned?: boolean
          status?: string
          stripe_customer_id?: string | null
          stripe_customer_id_official?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string | null
          user_id: string
          welcome_email_sent_at?: string | null
        }
        Update: {
          apple_customer_id?: string | null
          billing_period?: string | null
          brevo_cancellation_list_synced_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          first_payment_source?: string | null
          google_play_customer_id?: string | null
          had_trial?: boolean
          id?: string
          last_payment_source?: string | null
          on_trial?: boolean
          review_prompt_attempted_at?: string | null
          starter_provisioned?: boolean
          status?: string
          stripe_customer_id?: string | null
          stripe_customer_id_official?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
          welcome_email_sent_at?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          app_notifications_enabled: boolean
          avatar_url: string | null
          created_at: string
          data_training_opt_in: boolean
          email_marketing: boolean | null
          embody_active_practices: string[] | null
          first_name: string | null
          first_tutorial_shown: boolean | null
          id: string
          last_name: string | null
          marketing_sms_enabled: boolean | null
          notification_permission_status: string | null
          phone: string | null
          preferred_locale: string | null
          preferred_send_window: string | null
          preset_theme: string | null
          routine_intensity: string | null
          routine_items: Json
          routine_notification_times: Json
          texts_enabled: boolean | null
          timezone: string | null
          tutorial_completed: Json | null
          tutorial_last_slide: number | null
          updated_at: string
          user_id: string
          weekly_checkin_enabled: boolean | null
          weekly_goals_sms: boolean | null
        }
        Insert: {
          app_notifications_enabled?: boolean
          avatar_url?: string | null
          created_at?: string
          data_training_opt_in?: boolean
          email_marketing?: boolean | null
          embody_active_practices?: string[] | null
          first_name?: string | null
          first_tutorial_shown?: boolean | null
          id?: string
          last_name?: string | null
          marketing_sms_enabled?: boolean | null
          notification_permission_status?: string | null
          phone?: string | null
          preferred_locale?: string | null
          preferred_send_window?: string | null
          preset_theme?: string | null
          routine_intensity?: string | null
          routine_items?: Json
          routine_notification_times?: Json
          texts_enabled?: boolean | null
          timezone?: string | null
          tutorial_completed?: Json | null
          tutorial_last_slide?: number | null
          updated_at?: string
          user_id: string
          weekly_checkin_enabled?: boolean | null
          weekly_goals_sms?: boolean | null
        }
        Update: {
          app_notifications_enabled?: boolean
          avatar_url?: string | null
          created_at?: string
          data_training_opt_in?: boolean
          email_marketing?: boolean | null
          embody_active_practices?: string[] | null
          first_name?: string | null
          first_tutorial_shown?: boolean | null
          id?: string
          last_name?: string | null
          marketing_sms_enabled?: boolean | null
          notification_permission_status?: string | null
          phone?: string | null
          preferred_locale?: string | null
          preferred_send_window?: string | null
          preset_theme?: string | null
          routine_intensity?: string | null
          routine_items?: Json
          routine_notification_times?: Json
          texts_enabled?: boolean | null
          timezone?: string | null
          tutorial_completed?: Json | null
          tutorial_last_slide?: number | null
          updated_at?: string
          user_id?: string
          weekly_checkin_enabled?: boolean | null
          weekly_goals_sms?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_setup_path: {
        Row: {
          conditional_specificity: Json
          current_friction: string | null
          desire_category: string | null
          desire_text: string | null
          desired_identity: string | null
          email: string | null
          embody_active_practices: string[] | null
          first_name: string | null
          post_paywall_provisioned_at: string | null
          tool_preferences: string[]
          updated_at: string
          user_id: string
          why_it_matters: string | null
        }
        Insert: {
          conditional_specificity?: Json
          current_friction?: string | null
          desire_category?: string | null
          desire_text?: string | null
          desired_identity?: string | null
          email?: string | null
          embody_active_practices?: string[] | null
          first_name?: string | null
          post_paywall_provisioned_at?: string | null
          tool_preferences?: string[]
          updated_at?: string
          user_id: string
          why_it_matters?: string | null
        }
        Update: {
          conditional_specificity?: Json
          current_friction?: string | null
          desire_category?: string | null
          desire_text?: string | null
          desired_identity?: string | null
          email?: string | null
          embody_active_practices?: string[] | null
          first_name?: string | null
          post_paywall_provisioned_at?: string | null
          tool_preferences?: string[]
          updated_at?: string
          user_id?: string
          why_it_matters?: string | null
        }
        Relationships: []
      }
      web_onboarding_sessions: {
        Row: {
          client_visit_id: string
          created_at: string
          entry_path: string
          fast_path: Json
          from_tiktok: boolean | null
          id: string
          is_mobile_viewport: boolean | null
          is_paid: boolean | null
          make_my_board_cta_clicked: boolean
          page_path: string | null
          referrer: string | null
          ttclid: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          client_visit_id: string
          created_at?: string
          entry_path?: string
          fast_path?: Json
          from_tiktok?: boolean | null
          id?: string
          is_mobile_viewport?: boolean | null
          is_paid?: boolean | null
          make_my_board_cta_clicked?: boolean
          page_path?: string | null
          referrer?: string | null
          ttclid?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          client_visit_id?: string
          created_at?: string
          entry_path?: string
          fast_path?: Json
          from_tiktok?: boolean | null
          id?: string
          is_mobile_viewport?: boolean | null
          is_paid?: boolean | null
          make_my_board_cta_clicked?: boolean
          page_path?: string | null
          referrer?: string | null
          ttclid?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      weekly_goals: {
        Row: {
          category: string | null
          completed: boolean
          created_at: string
          goal_text: string
          id: string
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          category?: string | null
          completed?: boolean
          created_at?: string
          goal_text: string
          id?: string
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          category?: string | null
          completed?: boolean
          created_at?: string
          goal_text?: string
          id?: string
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_exists: { Args: { check_email: string }; Returns: boolean }
      check_username_exists: {
        Args: { check_username: string }
        Returns: boolean
      }
      get_email_by_username: {
        Args: { lookup_username: string }
        Returns: string
      }
      has_active_plotting_subscription: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_web_onboarding_session_user: {
        Args: { p_client_visit_id: string; p_user_id: string }
        Returns: undefined
      }
      mark_web_onboarding_make_my_board_cta_clicked: {
        Args: { p_client_visit_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      board_role: "focus" | "plan"
      onboarding_session_status:
        | "started"
        | "checkout_created"
        | "paid"
        | "account_created"
        | "active"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      board_role: ["focus", "plan"],
      onboarding_session_status: [
        "started",
        "checkout_created",
        "paid",
        "account_created",
        "active",
      ],
    },
  },
} as const
