import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Frown, Meh, Smile, Trash2, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { dateFnsLocaleForApp, isAppLocale, type AppLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type { ChronoEntry, JournalMoodRating } from '@/pages/features/Chrono';

const MOOD_OPTION_KEYS: {
  value: JournalMoodRating;
  Icon: typeof Frown;
  labelKey: 'rough' | 'neutral' | 'good';
}[] = [
  { value: 'negative', Icon: Frown, labelKey: 'rough' },
  { value: 'neutral', Icon: Meh, labelKey: 'neutral' },
  { value: 'positive', Icon: Smile, labelKey: 'good' },
];

function MoodChoiceRow({
  question,
  value,
  onChange,
  isCosmic,
  moodLabel,
}: {
  question: string;
  value: JournalMoodRating | null;
  onChange: (v: JournalMoodRating) => void;
  isCosmic?: boolean;
  moodLabel: (key: 'rough' | 'neutral' | 'good') => string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{question}</p>
      <div className="flex gap-3" role="radiogroup" aria-label={question}>
        {MOOD_OPTION_KEYS.map(({ value: v, Icon, labelKey }) => {
          const label = moodLabel(labelKey);
          const selected = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              onClick={() => onChange(v)}
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors',
                isCosmic
                  ? selected
                    ? 'border-white/40 bg-transparent text-foreground'
                    : 'border-white/12 bg-transparent text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
                  : selected
                    ? 'border-primary bg-primary/15 text-foreground shadow-sm'
                    : 'border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/45 hover:text-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5', selected && 'stroke-[2.25]')} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ChronoEntryFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  entry?: ChronoEntry | null; // Optional entry for editing
}

export function ChronoEntryForm({ onCancel, onSuccess, entry }: ChronoEntryFormProps) {
  const { t, i18n } = useTranslation(['tools', 'common']);
  const appLocale: AppLocale = isAppLocale(i18n.language) ? i18n.language : 'en';
  const dateLocale = dateFnsLocaleForApp(appLocale);
  const { theme } = useTheme();
  const isCosmic = theme === "dark";
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [entryTitle, setEntryTitle] = useState('');
  const [entryText, setEntryText] = useState('');
  const [env3dRating, setEnv3dRating] = useState<JournalMoodRating | null>(null);
  const [dayExperienceRating, setDayExperienceRating] = useState<JournalMoodRating | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load entry data if editing
  useEffect(() => {
    if (entry) {
      // Parse date in local timezone to avoid timezone issues
      // entry_date is in format 'YYYY-MM-DD', add time to ensure local timezone
      const dateParts = entry.entry_date.split('-');
      const localDate = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1, // Month is 0-indexed
        parseInt(dateParts[2])
      );
      setEntryDate(localDate);
      setEntryTitle(entry.title || '');
      setEntryText(entry.entry_text);
      setEnv3dRating(entry.journal_env_3d_rating ?? null);
      setDayExperienceRating(entry.journal_day_experience_rating ?? null);
    } else {
      // Reset form for new entry
      setEntryTitle('');
      setEntryText('');
      setEnv3dRating(null);
      setDayExperienceRating(null);
      setEntryDate(new Date()); // Today's date in local timezone
    }
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      return;
    }
    
    if (!entryTitle.trim()) {
      toast({
        title: t('tools:chrono.form.toast.titleRequired'),
        description: t('tools:chrono.form.toast.titleRequiredDesc'),
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (!entryText.trim()) {
      toast({
        title: t('tools:chrono.form.toast.entryRequired'),
        description: t('tools:chrono.form.toast.entryRequiredDesc'),
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (!user) {
      toast({
        title: t('tools:chrono.form.toast.authRequired'),
        description: t('tools:chrono.form.toast.authRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    if (env3dRating === null || dayExperienceRating === null) {
      toast({
        title: t('tools:chrono.form.toast.reflectionIncomplete'),
        description: t('tools:chrono.form.toast.reflectionIncompleteDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Refresh session to ensure auth.uid() works correctly in RLS
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !freshSession || !freshSession.access_token) {
        throw new Error(t('tools:chrono.form.toast.noSession'));
      }

      // Verify user ID matches session
      const sessionUserId = freshSession.user.id;
      if (sessionUserId !== user.id) {
        if (import.meta.env.DEV) {
          console.warn('User ID mismatch:', { contextUserId: user.id, sessionUserId });
        }
      }

      if (entry) {
        // Format date in local timezone (YYYY-MM-DD)
        const year = entryDate.getFullYear();
        const month = String(entryDate.getMonth() + 1).padStart(2, '0');
        const day = String(entryDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        // Update existing entry
        const { data: updatedEntry, error: updateError } = await supabase
          .from('journal_entries')
          .update({
            entry_date: formattedDate,
            title: entryTitle.trim(),
            entry_text: entryText.trim(),
            journal_env_3d_rating: env3dRating,
            journal_day_experience_rating: dayExperienceRating,
          })
          .eq('id', entry.id)
          .select()
          .single();

        if (updateError) {
          // Check if it's an RLS policy error
          if (updateError.message?.includes('row-level security') || updateError.message?.includes('RLS') || updateError.code === '42501' || updateError.code === 'PGRST301') {
            console.error('RLS Policy Violation:', {
              code: updateError.code,
              message: updateError.message,
              sessionUserId,
              contextUserId: user.id,
            });
            toast({
              title: t('tools:chrono.form.toast.permissionDenied'),
              description: t('tools:chrono.form.toast.permissionDeniedDesc'),
              variant: 'destructive',
            });
            return;
          }
          throw updateError;
        }

        // Entry updated - no notification needed, UI is intuitive
      } else {
        // Format date in local timezone (YYYY-MM-DD) to avoid timezone conversion issues
        // Use the selected date directly to ensure backdated entries save to the correct date
        const year = entryDate.getFullYear();
        const month = String(entryDate.getMonth() + 1).padStart(2, '0');
        const day = String(entryDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        console.log('Creating entry with date:', formattedDate, 'Selected date:', entryDate);

        // Create new entry - users can create multiple entries per day
        const { data: newEntry, error: insertError } = await supabase
          .from('journal_entries')
          .insert({
            user_id: sessionUserId, // Use session user ID to match auth.uid()
            entry_date: formattedDate,
            entry_time: new Date().toISOString(), // Current timestamp
            title: entryTitle.trim(),
            entry_text: entryText.trim(),
            journal_env_3d_rating: env3dRating,
            journal_day_experience_rating: dayExperienceRating,
          })
          .select()
          .single();

        if (insertError) {
          // Check if it's an RLS policy error
          if (insertError.message?.includes('row-level security') || insertError.message?.includes('RLS') || insertError.code === '42501' || insertError.code === 'PGRST301') {
            console.error('RLS Policy Violation:', {
              code: insertError.code,
              message: insertError.message,
              sessionUserId,
              contextUserId: user.id,
            });
            toast({
              title: t('tools:chrono.form.toast.permissionDenied'),
              description: t('tools:chrono.form.toast.permissionDeniedDesc'),
              variant: 'destructive',
            });
            setIsSubmitting(false);
            return;
          }
          throw insertError;
        }

          // Entry created - no notification needed, UI is intuitive
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error creating entry:', error);
      toast({
        title: t('tools:chrono.form.toast.error'),
        description: error.message || t('tools:chrono.form.toast.createFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!entry || !user) {
      return;
    }

    setIsDeleting(true);

    try {
      // Refresh session to ensure auth.uid() works correctly in RLS
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !freshSession || !freshSession.access_token) {
        throw new Error(t('tools:chrono.form.toast.noSession'));
      }

      const { error: deleteError } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entry.id);

      if (deleteError) {
        // Check if it's an RLS policy error
        if (deleteError.message?.includes('row-level security') || deleteError.message?.includes('RLS') || deleteError.code === '42501' || deleteError.code === 'PGRST301') {
          console.error('RLS Policy Violation:', deleteError);
          toast({
            title: 'Permission Denied',
            description: 'Please ensure you are logged in and try again.',
            variant: 'destructive',
          });
          setIsDeleting(false);
          return;
        }
        throw deleteError;
      }

      setShowDeleteDialog(false);
      onSuccess(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      toast({
        title: t('tools:chrono.form.toast.error'),
        description: error.message || t('tools:chrono.form.toast.deleteFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card
      className={cn(
        theme === "dark" ? "rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm" : "border border-zinc-200/75 bg-card/75 backdrop-blur-sm",
        isCosmic && cn("border border-white/12 bg-transparent text-white backdrop-blur-sm", "!bg-transparent !shadow-none"),
        "p-4 sm:p-5",
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-foreground">
            {entry ? t('tools:chrono.form.editEntry') : t('tools:chrono.form.newEntry')}
          </h3>
          <div className="flex items-center gap-2">
            {entry && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                title={t('tools:chrono.form.deleteEntry')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Date Picker */}
        <div className="space-y-1.5">
          <Label className="text-sm">{t('tools:chrono.form.date')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "",
                  isCosmic && theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"),
                  !entryDate && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {entryDate ? format(entryDate, 'PPP', { locale: dateLocale }) : <span>{t('tools:chrono.form.pickDate')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={entryDate}
                onSelect={(date) => date && setEntryDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Entry Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-sm">{t('tools:chrono.form.titleLabel')}</Label>
          <Input
            id="title"
            placeholder={t('tools:chrono.form.titlePlaceholder')}
            value={entryTitle}
            onChange={(e) => setEntryTitle(e.target.value)}
            className={cn("text-sm", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
            required
          />
        </div>

        {/* Entry Text (required) */}
        <div className="space-y-1.5">
          <Label htmlFor="text" className="text-sm">{t('tools:chrono.form.whatHappened')}</Label>
          <Textarea
            id="text"
            placeholder={t('tools:chrono.form.textPlaceholder')}
            value={entryText}
            onChange={(e) => setEntryText(e.target.value)}
            rows={4}
            className={cn("text-sm", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
            required
          />
        </div>

        {/* Daily reflection (3D + subjective experience) */}
        <div
          className={cn(
            "space-y-4 rounded-lg border p-3 sm:p-4",
            isCosmic ? "border-white/12 bg-transparent" : "border-border/60 bg-muted/20",
          )}
        >
          <MoodChoiceRow
            question={t('tools:chrono.form.env3dQuestion')}
            value={env3dRating}
            onChange={setEnv3dRating}
            isCosmic={isCosmic}
            moodLabel={(key) => t(`tools:chrono.form.mood.${key}`)}
          />
          <MoodChoiceRow
            question={t('tools:chrono.form.dayExperienceQuestion')}
            value={dayExperienceRating}
            onChange={setDayExperienceRating}
            isCosmic={isCosmic}
            moodLabel={(key) => t(`tools:chrono.form.mood.${key}`)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            size="sm"
            className={theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground")}
          >
            {t('common:cancel')}
          </Button>
          <Button
            type="submit"
            variant="ghost"
            disabled={isSubmitting}
            size="sm"
            className={theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground")}
          >
            {isSubmitting 
              ? (entry ? t('tools:chrono.form.updating') : t('tools:chrono.form.creating')) 
              : (entry ? t('tools:chrono.form.update') : t('tools:chrono.form.addEntry'))}
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tools:chrono.form.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tools:chrono.form.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('tools:chrono.form.deleting') : t('tools:chrono.form.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
