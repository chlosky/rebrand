import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

import { ChronoTimeline } from '@/components/ChronoTimeline';
import { ChronoEntryForm } from '@/components/ChronoEntryForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobilePWAMenu } from '@/components/MobilePWAMenu';
import { cn } from '@/lib/utils';
import { useTheme } from "@/contexts/ThemeContext";

export type JournalMoodRating = 'negative' | 'neutral' | 'positive';

export interface ChronoEntry {
  id: string;
  user_id: string;
  entry_date: string;
  entry_time: string;
  title?: string | null;
  entry_text: string;
  photo_url?: string;
  location_name?: string;
  location_type?: string;
  latitude?: number;
  longitude?: number;
  ai_best_timeline?: string;
  ai_worst_timeline?: string;
  has_wins?: boolean | null;
  journal_env_3d_rating?: JournalMoodRating | null;
  journal_day_experience_rating?: JournalMoodRating | null;
  created_at: string;
  updated_at: string;
}

export default function Chrono() {
  const { t } = useTranslation('tools');
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [entries, setEntries] = useState<ChronoEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ChronoEntry | null>(null);

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchEntries();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchEntries = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Refresh session to ensure auth.uid() works correctly in RLS
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !freshSession || !freshSession.access_token) {
        console.error('No valid session found:', sessionError);
        setEntries([]);
        setIsLoading(false);
        return;
      }

      // Load entries - RLS will automatically filter by auth.uid() = user_id
      // Don't filter by user_id manually - let RLS handle it for security
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('entry_date', { ascending: false })
        .order('entry_time', { ascending: false });

      if (error) {
        // Check if it's an RLS policy error
        if (error.message?.includes('row-level security') || error.message?.includes('RLS') || error.code === '42501' || error.code === 'PGRST301') {
          console.error('RLS Policy Violation: Please ensure you are logged in and try again.');
        }
        throw error;
      }
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntryCreated = () => {
    setShowEntryForm(false);
    setEditingEntry(null);
    fetchEntries();
  };

  const handleEditEntry = (entry: ChronoEntry) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleCancelForm = () => {
    setShowEntryForm(false);
    setEditingEntry(null);
  };

  return (
    <div
      className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-20")}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none", ...{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" } }}
    >
      <div className="min-h-screen">
        {isMobile && (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        )}

        <div className="relative z-10">
        <header
          className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), isMobile ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]" : "fixed top-0 left-0 right-0")}
          style={isMobile ? (theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }) : { ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }), top: "var(--app-safe-area-top)", right: "0" }}
        >
        <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
          <div className="flex items-center justify-between">
          <h1 className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"} onClick={() => navigate("/dashboard/boards")}>
            {t('chrono.title')}
          </h1>
          {isMobile && <MobilePWAMenu />}
          </div>
        </div>
      </header>

      <main className={cn("px-4 sm:px-6 max-w-4xl", !isMobile ? "pt-16" : "", !isMobile ? "" : "container mx-auto")}>
        <div className="pb-3 sm:pb-4">
          {/* Entry Form */}
          {showEntryForm && (
            <div className="pt-4 sm:pt-6">
              <ChronoEntryForm 
                entry={editingEntry}
                onCancel={handleCancelForm}
                onSuccess={handleEntryCreated}
              />
            </div>
          )}

          {/* Timeline - Only show when form is not open */}
          {!showEntryForm && (
            <>
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  {t('chrono.loadingTimeline')}
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {t('chrono.emptyTimeline')}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowEntryForm(true)}
                    className={theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground")}
                  >
                    {t('chrono.createFirstEntry')}
                  </Button>
                </div>
              ) : (
                <ChronoTimeline 
                  entries={entries} 
                  onRefresh={fetchEntries}
                  onEditEntry={handleEditEntry}
                  onNewEntry={() => setShowEntryForm(true)}
                />
              )}
            </>
          )}
        </div>
      </main>
        </div>
      </div>
    </div>
  );
}
