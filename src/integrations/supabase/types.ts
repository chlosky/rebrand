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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
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
      aesthetic_profiles: {
        Row: {
          accessories: Json | null
          accessory_ids: Json | null
          aesthetic_image_url: string | null
          background_id: string | null
          background_setting: string | null
          created_at: string
          current_photo_url: string | null
          final_composite_url: string | null
          goals: Json | null
          hair_color: string | null
          hair_style: string | null
          hairstyle_id: string | null
          hobbies: Json | null
          id: string
          is_active: boolean | null
          location_vibe: string | null
          outfit_id: string | null
          outfit_style: string | null
          skin_tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accessories?: Json | null
          accessory_ids?: Json | null
          aesthetic_image_url?: string | null
          background_id?: string | null
          background_setting?: string | null
          created_at?: string
          current_photo_url?: string | null
          final_composite_url?: string | null
          goals?: Json | null
          hair_color?: string | null
          hair_style?: string | null
          hairstyle_id?: string | null
          hobbies?: Json | null
          id?: string
          is_active?: boolean | null
          location_vibe?: string | null
          outfit_id?: string | null
          outfit_style?: string | null
          skin_tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accessories?: Json | null
          accessory_ids?: Json | null
          aesthetic_image_url?: string | null
          background_id?: string | null
          background_setting?: string | null
          created_at?: string
          current_photo_url?: string | null
          final_composite_url?: string | null
          goals?: Json | null
          hair_color?: string | null
          hair_style?: string | null
          hairstyle_id?: string | null
          hobbies?: Json | null
          id?: string
          is_active?: boolean | null
          location_vibe?: string | null
          outfit_id?: string | null
          outfit_style?: string | null
          skin_tone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chrono_entries: {
        Row: {
          ai_affirmation: string | null
          ai_best_timeline: string | null
          ai_worst_timeline: string | null
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
          ai_affirmation?: string | null
          ai_best_timeline?: string | null
          ai_worst_timeline?: string | null
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
          ai_affirmation?: string | null
          ai_best_timeline?: string | null
          ai_worst_timeline?: string | null
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
      code_redemptions: {
        Row: {
          code_id: string
          discount_applied: number | null
          id: string
          redeemed_at: string | null
          redeemed_by: string
        }
        Insert: {
          code_id: string
          discount_applied?: number | null
          id?: string
          redeemed_at?: string | null
          redeemed_by: string
        }
        Update: {
          code_id?: string
          discount_applied?: number | null
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
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
      manifestation_power_daily_signals: {
        Row: {
          created_at: string
          id: string
          signal_date: string
          signal_kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signal_date: string
          signal_kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signal_date?: string
          signal_kind?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string | null
          default_enabled: boolean | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          notification_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_enabled?: boolean | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notification_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_enabled?: boolean | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notification_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_presets: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          organization_id: string
          preset_config: Json
          preset_theme: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          organization_id: string
          preset_config?: Json
          preset_theme: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          organization_id?: string
          preset_config?: Json
          preset_theme?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_presets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_email: string | null
          created_at: string | null
          custom_settings: Json | null
          id: string
          name: string
          plan_tier: Database["public"]["Enums"]["org_plan_tier"]
          seat_count: number
          seats_used: number
          status: string
          updated_at: string | null
        }
        Insert: {
          billing_email?: string | null
          created_at?: string | null
          custom_settings?: Json | null
          id?: string
          name: string
          plan_tier?: Database["public"]["Enums"]["org_plan_tier"]
          seat_count?: number
          seats_used?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          billing_email?: string | null
          created_at?: string | null
          custom_settings?: Json | null
          id?: string
          name?: string
          plan_tier?: Database["public"]["Enums"]["org_plan_tier"]
          seat_count?: number
          seats_used?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      premade_affirmation_sets: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      premade_affirmations: {
        Row: {
          created_at: string | null
          id: string
          order_index: number | null
          set_id: string
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_index?: number | null
          set_id: string
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_index?: number | null
          set_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "premade_affirmations_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "premade_affirmation_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_activity: string | null
          onboarding_data: Json | null
          phone: string | null
          preset_theme: string | null
          signup_code: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_activity?: string | null
          onboarding_data?: Json | null
          phone?: string | null
          preset_theme?: string | null
          signup_code?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_activity?: string | null
          onboarding_data?: Json | null
          phone?: string | null
          preset_theme?: string | null
          signup_code?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          code_type: Database["public"]["Enums"]["code_type"]
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          code: string
          code_type?: Database["public"]["Enums"]["code_type"]
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          code_type?: Database["public"]["Enums"]["code_type"]
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sacred_text_bookmarks: {
        Row: {
          bookmark_type: string | null
          chapter: number | null
          created_at: string | null
          id: string
          note: string | null
          text_id: string
          user_id: string
          verse: number | null
        }
        Insert: {
          bookmark_type?: string | null
          chapter?: number | null
          created_at?: string | null
          id?: string
          note?: string | null
          text_id: string
          user_id: string
          verse?: number | null
        }
        Update: {
          bookmark_type?: string | null
          chapter?: number | null
          created_at?: string | null
          id?: string
          note?: string | null
          text_id?: string
          user_id?: string
          verse?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sacred_text_bookmarks_text_id_fkey"
            columns: ["text_id"]
            isOneToOne: false
            referencedRelation: "sacred_texts"
            referencedColumns: ["id"]
          },
        ]
      }
      sacred_texts: {
        Row: {
          author: string | null
          book_structure: Json | null
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          language: string | null
          title: string
          total_chapters: number | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          author?: string | null
          book_structure?: Json | null
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          title: string
          total_chapters?: number | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          author?: string | null
          book_structure?: Json | null
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          title?: string
          total_chapters?: number | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      story_chapters: {
        Row: {
          chapter_number: number
          content: string
          created_at: string | null
          id: string
          story_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          chapter_number: number
          content: string
          created_at?: string | null
          id?: string
          story_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          chapter_number?: number
          content?: string
          created_at?: string | null
          id?: string
          story_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_chapters_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_panels: {
        Row: {
          caption: string | null
          chapter_id: string
          created_at: string | null
          id: string
          image_prompt: string | null
          image_url: string | null
          is_generating: boolean | null
          panel_number: number
          scene_description: string
        }
        Insert: {
          caption?: string | null
          chapter_id: string
          created_at?: string | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          is_generating?: boolean | null
          panel_number: number
          scene_description: string
        }
        Update: {
          caption?: string | null
          chapter_id?: string
          created_at?: string | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          is_generating?: boolean | null
          panel_number?: number
          scene_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_panels_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "story_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      system_announcements: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      web_onboarding_sessions: {
        Row: {
          client_visit_id: string
          created_at: string
          entry_path: string
          from_tiktok: boolean | null
          id: string
          is_mobile_viewport: boolean | null
          is_paid: boolean | null
          make_my_subliminal_cta_clicked: boolean
          page_path: string | null
          referrer: string | null
          subliminal_fast_path: Json
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
          from_tiktok?: boolean | null
          id?: string
          is_mobile_viewport?: boolean | null
          is_paid?: boolean | null
          make_my_subliminal_cta_clicked?: boolean
          page_path?: string | null
          referrer?: string | null
          subliminal_fast_path?: Json
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
          from_tiktok?: boolean | null
          id?: string
          is_mobile_viewport?: boolean | null
          is_paid?: boolean | null
          make_my_subliminal_cta_clicked?: boolean
          page_path?: string | null
          referrer?: string | null
          subliminal_fast_path?: Json
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
      user_setup_path: {
        Row: {
          user_id: string
          first_name: string | null
          email: string | null
          desire_category: string | null
          desire_text: string | null
          why_it_matters: string | null
          current_friction: string | null
          desired_identity: string | null
          tool_preferences: string[]
          conditional_specificity: Json
          shell_appearance: string | null
          guide_character_id: string | null
          embody_active_practices: string[] | null
          post_paywall_provisioned_at: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          first_name?: string | null
          email?: string | null
          desire_category?: string | null
          desire_text?: string | null
          why_it_matters?: string | null
          current_friction?: string | null
          desired_identity?: string | null
          tool_preferences?: string[]
          conditional_specificity?: Json
          shell_appearance?: string | null
          guide_character_id?: string | null
          embody_active_practices?: string[] | null
          post_paywall_provisioned_at?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          first_name?: string | null
          email?: string | null
          desire_category?: string | null
          desire_text?: string | null
          why_it_matters?: string | null
          current_friction?: string | null
          desired_identity?: string | null
          tool_preferences?: string[]
          conditional_specificity?: Json
          shell_appearance?: string | null
          guide_character_id?: string | null
          embody_active_practices?: string[] | null
          post_paywall_provisioned_at?: string | null
          updated_at?: string
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
      user_activity_stats: {
        Row: {
          belief_view_sessions_total: number
          mirror_sessions_total: number
          subliminal_creation_seconds_total: number
          subliminal_listen_seconds_total: number
          subliminal_listen_sessions_total: number
          tap_in_sessions_total: number
          updated_at: string
          user_id: string
          visualize_sessions_total: number
        }
        Insert: {
          belief_view_sessions_total?: number
          mirror_sessions_total?: number
          subliminal_creation_seconds_total?: number
          subliminal_listen_seconds_total?: number
          subliminal_listen_sessions_total?: number
          tap_in_sessions_total?: number
          updated_at?: string
          user_id: string
          visualize_sessions_total?: number
        }
        Update: {
          belief_view_sessions_total?: number
          mirror_sessions_total?: number
          subliminal_creation_seconds_total?: number
          subliminal_listen_seconds_total?: number
          subliminal_listen_sessions_total?: number
          tap_in_sessions_total?: number
          updated_at?: string
          user_id?: string
          visualize_sessions_total?: number
        }
        Relationships: []
      }
      user_daily_journey_summaries: {
        Row: {
          created_at: string
          daily_power_percent: number | null
          id: string
          summary_date: string
          summary_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_power_percent?: number | null
          id?: string
          summary_date: string
          summary_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_power_percent?: number | null
          id?: string
          summary_date?: string
          summary_text?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          created_at: string | null
          email_consent: boolean | null
          enabled: boolean | null
          id: string
          inactivity_days: number | null
          notification_type: string
          sms_consent: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_consent?: boolean | null
          enabled?: boolean | null
          id?: string
          inactivity_days?: number | null
          notification_type: string
          sms_consent?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_consent?: boolean | null
          enabled?: boolean | null
          id?: string
          inactivity_days?: number | null
          notification_type?: string
          sms_consent?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          apple_customer_id: string | null
          created_at: string | null
          first_payment_source: string | null
          had_trial: boolean
          id: string
          on_trial: boolean
          last_payment_source: string | null
          plan_name: string
          review_prompt_attempted_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_customer_id_official: string | null
          tier: string
          updated_at: string | null
          user_id: string
          welcome_email_sent_at: string | null
        }
        Insert: {
          apple_customer_id?: string | null
          created_at?: string | null
          first_payment_source?: string | null
          had_trial?: boolean
          id?: string
          last_payment_source?: string | null
          on_trial?: boolean
          plan_name: string
          review_prompt_attempted_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_customer_id_official?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id: string
          welcome_email_sent_at?: string | null
        }
        Update: {
          apple_customer_id?: string | null
          created_at?: string | null
          first_payment_source?: string | null
          had_trial?: boolean
          on_trial?: boolean
          id?: string
          last_payment_source?: string | null
          plan_name?: string
          review_prompt_attempted_at?: string | null
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
      user_stories: {
        Row: {
          art_style: string | null
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          art_style?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          art_style?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_exists: {
        Args: {
          check_email: string
        }
        Returns: boolean
      }
      check_username_exists: {
        Args: {
          check_username: string
        }
        Returns: boolean
      }
      get_email_by_username: {
        Args: {
          lookup_username: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_web_onboarding_session_user: {
        Args: {
          p_client_visit_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      mark_web_onboarding_make_my_subliminal_cta_clicked: {
        Args: {
          p_client_visit_id: string
        }
        Returns: undefined
      }
      validate_and_redeem_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      bump_user_activity_stats: {
        Args: {
          p_belief_view_sessions?: number
          p_mirror_sessions?: number
          p_subliminal_creation_seconds?: number
          p_subliminal_listen_seconds?: number
          p_subliminal_listen_sessions?: number
          p_tap_in_sessions?: number
          p_visualize_sessions?: number
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      code_type: "discount" | "referral" | "group" | "enterprise"
      org_member_role: "owner" | "admin" | "member"
      org_plan_tier: "starter" | "growth" | "scale" | "custom"
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
      app_role: ["admin", "moderator", "user"],
      code_type: ["discount", "referral", "group", "enterprise"],
      org_member_role: ["owner", "admin", "member"],
      org_plan_tier: ["starter", "growth", "scale", "custom"],
    },
  },
} as const
