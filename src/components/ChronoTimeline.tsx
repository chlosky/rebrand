import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { dateFnsLocaleForApp, isAppLocale, type AppLocale } from '@/lib/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Frown, Meh, Pencil, Plus, Smile } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import type { ChronoEntry, JournalMoodRating } from '@/pages/features/Chrono';

function JournalMoodIcon({ rating }: { rating: JournalMoodRating }) {
  const cls = 'h-5 w-5 shrink-0 text-foreground';
  const stroke = 2.25;
  if (rating === 'negative') return <Frown className={cls} strokeWidth={stroke} aria-hidden />;
  if (rating === 'neutral') return <Meh className={cls} strokeWidth={stroke} aria-hidden />;
  return <Smile className={cls} strokeWidth={stroke} aria-hidden />;
}

interface ChronoTimelineProps {
  entries: ChronoEntry[];
  onRefresh: () => void;
  onEditEntry?: (entry: ChronoEntry) => void;
  onNewEntry?: () => void;
}

export function ChronoTimeline({ entries, onEditEntry, onNewEntry }: ChronoTimelineProps) {
  const { t, i18n } = useTranslation('tools');
  const appLocale: AppLocale = isAppLocale(i18n.language) ? i18n.language : 'en';
  const dateLocale = dateFnsLocaleForApp(appLocale);
  const { theme } = useTheme();
  const isCosmic = theme === "dark";
  const journalCardClass = cn(
    theme === "dark" ? "rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm" : "border border-zinc-200/75 bg-card/75 backdrop-blur-sm",
    isCosmic && cn("border border-white/12 bg-transparent text-white backdrop-blur-sm", "!bg-transparent !shadow-none"),
    "p-4 sm:p-5 hover:bg-transparent transition-all duration-300",
  );
  const journalInsetClass = isCosmic
    ? "mt-4 space-y-2 rounded-lg border border-white/12 bg-transparent px-3 py-2.5 text-xs"
    : "mt-4 space-y-2 rounded-lg border border-border/50 bg-muted/15 px-3 py-2.5 text-xs";
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const toggleExpand = (entryId: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const getPreview = (text: string, maxLength: number = 75): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Group entries by month/year
  // Parse dates in local timezone to avoid timezone issues
  const groupedEntries = entries.reduce((acc, entry) => {
    // Parse date string (YYYY-MM-DD) in local timezone
    const dateParts = entry.entry_date.split('-');
    const localDate = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1, // Month is 0-indexed
      parseInt(dateParts[2])
    );
    const monthYear = format(localDate, 'MMMM yyyy', { locale: dateLocale });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(entry);
    return acc;
  }, {} as Record<string, ChronoEntry[]>);

  return (
    <div className="h-[calc(100vh-12rem)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="relative pr-4 pt-3 sm:pt-4">
        {/* Descriptive Text */}
        <p className="text-sm sm:text-base text-muted-foreground mb-4">
          {t('chrono.timeline.description')}
        </p>
        
        {/* Vertical Timeline Line - starts after first month header */}
        <div className="absolute left-6 top-[68px] bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-primary/20 to-transparent" />

        {/* Timeline Entries Grouped by Month */}
        <div className="space-y-10 scroll-smooth">
          {Object.entries(groupedEntries).map(([monthYear, monthEntries], groupIndex) => (
            <div key={monthYear} className="space-y-4 relative">
              {/* Month Header */}
              <div className="relative pl-16">
                <h2 className="text-lg font-bold text-foreground">
                  {monthYear}
                </h2>
                {/* New Entry Button - positioned to the right of first month/year header */}
                {groupIndex === 0 && onNewEntry && (
                  <div className="absolute right-0 top-0 z-10 flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onNewEntry}
                      size="sm"
                      className={cn("shrink-0 flex items-center gap-2", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                    >
                      <Plus className="h-4 w-4" />
                      {t('chrono.timeline.newEntry')}
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Month's Entries */}
              {monthEntries.map((entry, index) => (
                <div key={entry.id} className="relative pl-16 snap-start scroll-mt-8">
            {/* Timeline Node */}
            <div className="absolute left-0 top-6 w-12 h-12 flex items-center justify-center z-10">
              <div className="w-3 h-3 rounded-full bg-primary border-2 border-background" />
            </div>

              {/* Entry Content Card */}
            <Card className={journalCardClass}>
              {/* Full Date Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      // Parse date string (YYYY-MM-DD) in local timezone
                      const dateParts = entry.entry_date.split('-');
                      const localDate = new Date(
                        parseInt(dateParts[0]),
                        parseInt(dateParts[1]) - 1, // Month is 0-indexed
                        parseInt(dateParts[2])
                      );
                      return format(localDate, 'MMM d, yyyy', { locale: dateLocale });
                    })()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onEditEntry && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditEntry(entry)}
                      className={cn(
                        "h-8 w-8",
                        isCosmic &&
                          "border border-white/12 bg-transparent text-white hover:bg-white/[0.06] hover:text-white",
                      )}
                      title={t('chrono.timeline.editEntry')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Entry Title */}
              {entry.title && (
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {entry.title}
                </h3>
              )}

              {/* Entry Text - Collapsible */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {expandedEntries.has(entry.id) ? (
                  <p className="text-foreground whitespace-pre-wrap">{entry.entry_text}</p>
                ) : (
                  <p className="text-foreground">{getPreview(entry.entry_text)}</p>
                )}
              </div>

              {/* Expand/Collapse Button */}
              {entry.entry_text.length > 75 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(entry.id)}
                  className="mt-2 text-xs"
                >
                  {expandedEntries.has(entry.id) ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      {t('chrono.timeline.showLess')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      {t('chrono.timeline.showMore')}
                    </>
                  )}
                </Button>
              )}

              {/* Journal reflection (3D + experience) or legacy win flag */}
              {entry.journal_env_3d_rating && entry.journal_day_experience_rating ? (
                <div className={journalInsetClass}>
                  <div
                    className="flex items-center gap-2"
                    role="group"
                    aria-label={t('chrono.timeline.env3dAria', { rating: entry.journal_env_3d_rating })}
                  >
                    <span className="text-muted-foreground shrink-0">{t('chrono.timeline.env3d')}</span>
                    <JournalMoodIcon rating={entry.journal_env_3d_rating} />
                  </div>
                  <div
                    className="flex items-center gap-2"
                    role="group"
                    aria-label={t('chrono.timeline.dayExperienceAria', { rating: entry.journal_day_experience_rating })}
                  >
                    <span className="text-muted-foreground shrink-0">{t('chrono.timeline.dayExperience')}</span>
                    <JournalMoodIcon rating={entry.journal_day_experience_rating} />
                  </div>
                </div>
              ) : entry.has_wins !== null && entry.has_wins !== undefined ? (
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{t('chrono.timeline.winToday')}</span>
                  <span
                    className={`font-medium ${entry.has_wins ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
                  >
                    {entry.has_wins ? t('chrono.timeline.yes') : t('chrono.timeline.no')}
                  </span>
                </div>
              ) : null}
            </Card>
                </div>
              ))}
            </div>
          ))}
        
          {/* Timeline End Cap */}
          <div className="relative pl-16 pt-6">
            <div className="absolute left-0 top-6 w-12 h-12 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
