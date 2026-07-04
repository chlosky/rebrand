import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, X, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "@/hooks/use-toast";
import { useEmbodyActivePractices } from "@/hooks/useEmbodyActivePractices";
import { cn } from "@/lib/utils";
import { FOCUS_CATEGORIES, getFocusCategoryLabel } from "@/lib/focusCategories";
import {
  INSPIRED_ACTION_HISTORY_REFRESH_EVENT,
  loadInspiredActionHistory,
  syncTodayProgressIntoActionHistory,
} from "@/lib/inspiredActionHistory";
import { EMBODY_PRACTICE_SHORT_I18N_KEY } from "@/lib/embodyPracticesCatalog";

const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(12, 0, 0, 0);
  return monday;
};

const getTodayLocal = (date?: Date): string => {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface WeeklyGoal {
  id: string;
  text: string;
  completed: boolean;
  category: string | null;
}

export type ProgressMilestonesTabsProps = {
  /** When false (e.g. Reminders page), tab state is local only — no `location.hash` reads/writes. */
  syncHash?: boolean;
};

export function ProgressMilestonesTabs({ syncHash = true }: ProgressMilestonesTabsProps) {
  const { t, i18n } = useTranslation("tools");
  const { user } = useAuth();
  const { theme } = useTheme();
  const { activePractices } = useEmbodyActivePractices();
  const dateLocale = useMemo(
    () => (i18n.language.startsWith("es") ? "es" : "en-US"),
    [i18n.language],
  );
  const compactWeekdayDates = i18n.language.startsWith("es");

  const milestonePanelClass = theme === "dark" ? "w-full rounded-xl bg-transparent text-white" : cn("w-full rounded-xl border bg-card text-card-foreground backdrop-blur-sm shadow-sm", "border-zinc-200/75");
  const milestoneInnerSurfaceClass = theme === "dark" ? "rounded-lg border border-white/12 bg-transparent" : "rounded-lg border border-border/70 bg-card shadow-sm";
  const milestoneTabsListClass = theme === "dark" ? "flex w-full h-12 gap-1 p-1 rounded-lg border border-white/12 bg-transparent mb-2" : "flex w-full h-12 gap-1 p-1 rounded-lg border border-zinc-200/70 bg-muted mb-2";
  const milestoneTabsTriggerClass = theme === "dark" ? cn("h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-white/55", "border border-transparent hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white") : cn("h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-muted-foreground data-[state=active]:shadow-sm", "data-[state=active]:bg-background data-[state=active]:text-foreground");

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (!syncHash) return "tracking";
    return window.location.hash === "#review" ? "review" : "tracking";
  });

  useEffect(() => {
    if (!syncHash) return;
    const handleHashChange = () => {
      if (window.location.hash === "#review") {
        setActiveTab("review");
      } else if (window.location.hash === "#goals") {
        setActiveTab("goals");
      } else {
        setActiveTab("tracking");
      }
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [syncHash]);

  const [trackingDateRange, setTrackingDateRange] = useState(() => {
    const today = new Date();
    return getMondayOfWeek(today);
  });
  const [actionHistory, setActionHistory] = useState<Record<string, string[]>>({});

  const [goalsDateRange, setGoalsDateRange] = useState(() => {
    const today = new Date();
    return getMondayOfWeek(today);
  });
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [newGoalText, setNewGoalText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [categoryButtonWidth, setCategoryButtonWidth] = useState<number | null>(null);
  const categoryButtonRef = React.useRef<HTMLButtonElement>(null);

  const [reviewDateRange, setReviewDateRange] = useState(() => {
    const today = new Date();
    return getMondayOfWeek(today);
  });
  const [weekStats, setWeekStats] = useState({
    totalMicrogoals: 0,
    weeklyGoalsCreated: 0,
    weeklyGoalsCompleted: 0,
    categoryBreakdown: {} as Record<string, { total: number; completed: number }>,
  });
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  useEffect(() => {
    if (isCategoryOpen && categoryButtonRef.current) {
      setCategoryButtonWidth(categoryButtonRef.current.offsetWidth);
    }
  }, [isCategoryOpen]);

  const loadActionHistory = useCallback(async (): Promise<Record<string, string[]>> => {
    if (!user) {
      return {};
    }

    try {
      const {
        data: { session: freshSession },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !freshSession || !freshSession.access_token) {
        if (import.meta.env.DEV) {
          console.warn("No valid session found, cannot load action history");
        }
        return {};
      }

      await syncTodayProgressIntoActionHistory();
      return await loadInspiredActionHistory();
    } catch (error) {
      console.error("Error loading action history from database:", error);
      toast({
        title: t("activity.milestones.toasts.error"),
        description: t("activity.milestones.toasts.loadHistoryFailed"),
        variant: "destructive",
      });
      return {};
    }
  }, [user, t]);

  const loadWeeklyGoals = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingGoals(true);
      const monday = getMondayOfWeek(goalsDateRange);
      const weekStartDate = getTodayLocal(monday);

      const { data, error } = await supabase
        .from("weekly_goals")
        .select("id, goal_text, completed, category")
        .eq("user_id", user.id)
        .eq("week_start_date", weekStartDate)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const goals = (data || []).map((goal) => ({
        id: goal.id,
        text: goal.goal_text,
        completed: goal.completed,
        category: goal.category || null,
      }));

      setWeeklyGoals(goals);
    } catch (error) {
      console.error("Error loading weekly goals:", error);
      toast({
        title: t("activity.milestones.toasts.error"),
        description: t("activity.milestones.toasts.loadGoalsFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoadingGoals(false);
    }
  }, [user, goalsDateRange, t]);

  const saveWeeklyGoal = useCallback(
    async (goalText: string, category: string | null) => {
      if (!user) return null;

      if (!category) {
        toast({
          title: t("activity.milestones.toasts.categoryRequired"),
          description: t("activity.milestones.toasts.selectCategoryForGoal"),
          variant: "destructive",
        });
        return null;
      }

      try {
        const monday = getMondayOfWeek(goalsDateRange);
        const weekStartDate = getTodayLocal(monday);

        const { data, error } = await supabase
          .from("weekly_goals")
          .insert({
            user_id: user.id,
            week_start_date: weekStartDate,
            goal_text: goalText,
            category: category,
            completed: false,
          })
          .select("id")
          .single();

        if (error) throw error;
        return data.id;
      } catch (error) {
        console.error("Error saving weekly goal:", error);
        toast({
          title: t("activity.milestones.toasts.error"),
          description: t("activity.milestones.toasts.saveGoalFailed"),
          variant: "destructive",
        });
        throw error;
      }
    },
    [user, goalsDateRange, t],
  );

  const updateWeeklyGoal = useCallback(
    async (goalId: string, completed: boolean) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("weekly_goals")
          .update({ completed, updated_at: new Date().toISOString() })
          .eq("id", goalId)
          .eq("user_id", user.id);

        if (error) throw error;
      } catch (error) {
        console.error("Error updating weekly goal:", error);
        toast({
          title: t("activity.milestones.toasts.error"),
          description: t("activity.milestones.toasts.updateGoalFailed"),
          variant: "destructive",
        });
      }
    },
    [user, t],
  );

  const deleteWeeklyGoal = useCallback(
    async (goalId: string) => {
      if (!user) return;

      try {
        const { error } = await supabase.from("weekly_goals").delete().eq("id", goalId).eq("user_id", user.id);

        if (error) throw error;
      } catch (error) {
        console.error("Error deleting weekly goal:", error);
        toast({
          title: t("activity.milestones.toasts.error"),
          description: t("activity.milestones.toasts.deleteGoalFailed"),
          variant: "destructive",
        });
      }
    },
    [user, t],
  );

  useEffect(() => {
    if (user) {
      loadActionHistory().then(setActionHistory);
    }
  }, [user, trackingDateRange, loadActionHistory]);

  useEffect(() => {
    if (user) {
      loadWeeklyGoals();
    }
  }, [user, goalsDateRange, loadWeeklyGoals]);

  const loadWeekReview = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingReview(true);
      const monday = getMondayOfWeek(reviewDateRange);
      const weekStartDate = getTodayLocal(monday);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      const weekEndDate = getTodayLocal(sunday);

      const { data: actionData } = await supabase
        .from("user_action_history")
        .select("action_date, actions")
        .eq("user_id", user.id)
        .gte("action_date", weekStartDate)
        .lte("action_date", weekEndDate);

      let totalMicrogoals = 0;
      if (actionData) {
        actionData.forEach((entry) => {
          totalMicrogoals += ((entry.actions as string[]) || []).length;
        });
      }

      const { data: goalsData } = await supabase
        .from("weekly_goals")
        .select("id, goal_text, completed, category")
        .eq("user_id", user.id)
        .eq("week_start_date", weekStartDate);

      const weeklyGoalsCreated = goalsData?.length || 0;
      const weeklyGoalsCompleted = goalsData?.filter((g) => g.completed).length || 0;

      const categoryBreakdown: Record<string, { total: number; completed: number }> = {};
      if (goalsData) {
        goalsData.forEach((goal) => {
          if (goal.category) {
            if (!categoryBreakdown[goal.category]) {
              categoryBreakdown[goal.category] = { total: 0, completed: 0 };
            }
            categoryBreakdown[goal.category].total++;
            if (goal.completed) {
              categoryBreakdown[goal.category].completed++;
            }
          }
        });
      }

      setWeekStats({
        totalMicrogoals,
        weeklyGoalsCreated,
        weeklyGoalsCompleted,
        categoryBreakdown,
      });
    } catch (error) {
      console.error("Error loading week review:", error);
      toast({
        title: t("activity.milestones.toasts.error"),
        description: t("activity.milestones.toasts.loadReviewFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoadingReview(false);
    }
  }, [user, reviewDateRange, t]);

  useEffect(() => {
    if (user) {
      loadWeekReview();
    }
  }, [user, reviewDateRange, loadWeekReview]);

  useEffect(() => {
    if (!user) return;
    const refresh = () => {
      void loadActionHistory().then(setActionHistory);
    };
    refresh();
    window.addEventListener(INSPIRED_ACTION_HISTORY_REFRESH_EVENT, refresh);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener(INSPIRED_ACTION_HISTORY_REFRESH_EVENT, refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user, loadActionHistory]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        setActiveTab(value);
        if (!syncHash) return;
        if (value === "review") {
          window.location.hash = "review";
        } else {
          window.location.hash = "";
        }
      }}
      className="w-full"
    >
      <TabsList className={milestoneTabsListClass}>
        <TabsTrigger value="tracking" className={cn(milestoneTabsTriggerClass, "flex-1")}>
          {t("activity.milestones.tabs.inspiredActions")}
        </TabsTrigger>
        <TabsTrigger value="goals" className={cn(milestoneTabsTriggerClass, "flex-1")}>
          {t("activity.milestones.tabs.desires")}
        </TabsTrigger>
        <TabsTrigger value="review" className={cn(milestoneTabsTriggerClass, "flex-1")}>
          {t("activity.milestones.tabs.weeklyWins")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tracking" className="mt-0">
        <div className={cn("flex flex-col gap-1 p-3 sm:p-4", milestonePanelClass)}>
          <div className="flex items-center justify-between border-b pb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const monday = getMondayOfWeek(trackingDateRange);
                const newMonday = new Date(monday);
                newMonday.setDate(newMonday.getDate() - 7);
                setTrackingDateRange(newMonday);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <div className="font-semibold">
                {(() => {
                  const monday = getMondayOfWeek(trackingDateRange);
                  return monday.toLocaleDateString(dateLocale, { month: "long", year: "numeric" });
                })()}
              </div>
              <div className="text-sm text-muted-foreground">
                {(() => {
                  const monday = getMondayOfWeek(trackingDateRange);
                  const sunday = new Date(monday);
                  sunday.setDate(sunday.getDate() + 6);
                  if (monday.getMonth() === sunday.getMonth()) {
                    const month = sunday.toLocaleDateString(dateLocale, { month: "short" });
                    return `${monday.toLocaleDateString(dateLocale, { day: "numeric" })}–${sunday.toLocaleDateString(dateLocale, { day: "numeric" })} ${month}`;
                  }
                  return `${monday.toLocaleDateString(dateLocale, { month: "short", day: "numeric" })}–${sunday.toLocaleDateString(dateLocale, { month: "short", day: "numeric" })}`;
                })()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const monday = getMondayOfWeek(trackingDateRange);
                const newMonday = new Date(monday);
                newMonday.setDate(newMonday.getDate() + 7);
                const today = new Date();
                const thisWeekMonday = getMondayOfWeek(today);
                if (newMonday <= thisWeekMonday) {
                  setTrackingDateRange(newMonday);
                }
              }}
              disabled={(() => {
                const monday = getMondayOfWeek(trackingDateRange);
                const nextMonday = new Date(monday);
                nextMonday.setDate(nextMonday.getDate() + 7);
                const today = new Date();
                const thisWeekMonday = getMondayOfWeek(today);
                return nextMonday > thisWeekMonday;
              })()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {(() => {
              const history = actionHistory;
              const microGoalGridTemplateColumns = `6rem repeat(${activePractices.length}, minmax(0, 1fr))`;
              const monday = getMondayOfWeek(trackingDateRange);
              const days: { date: Date; dateString: string }[] = [];
              for (let i = 0; i < 7; i++) {
                const date = new Date(monday);
                date.setDate(date.getDate() + i);
                const dateString = getTodayLocal(date);
                days.push({ date, dateString });
              }

              const headerRow = (
                <div
                  className={cn(
                    "grid items-end overflow-visible min-h-[2.5rem] sm:min-h-[3.25rem]",
                    "pb-2.5 sm:pb-2",
                    "gap-x-1.5 sm:gap-x-2",
                    "px-0.5",
                  )}
                  style={{ gridTemplateColumns: microGoalGridTemplateColumns }}
                >
                  <div aria-hidden />
                  {activePractices.map((practice) => {
                    if (!practice) return null;
                    const columnLabel = t(EMBODY_PRACTICE_SHORT_I18N_KEY[practice.key]);
                    return (
                      <div key={practice.key} className="flex min-w-0 justify-center items-end overflow-visible h-10 sm:h-11">
                        <span
                          className={cn(
                            "inline-block origin-bottom select-none pointer-events-none whitespace-nowrap",
                            "text-[9px] sm:text-[10px] font-medium leading-none text-muted-foreground",
                            "-translate-y-1 sm:-translate-y-0.5",
                            "-rotate-[60deg]",
                          )}
                          aria-hidden
                        >
                          {columnLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );

              const rows = days.map((dayData) => {
                const dateStr = dayData.dateString;
                const dayActions = history[dateStr] || [];

                return (
                  <div
                    key={dateStr}
                    className={cn("grid items-center", "gap-x-1.5 sm:gap-x-2", "px-0.5")}
                    style={{ gridTemplateColumns: microGoalGridTemplateColumns }}
                  >
                    <div className="text-sm sm:text-sm font-medium leading-snug">
                      {compactWeekdayDates
                        ? `${dayData.date.toLocaleDateString(dateLocale, { weekday: "short" })} ${dayData.date.getDate()}`
                        : dayData.date.toLocaleDateString(dateLocale, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                    </div>
                    {activePractices.map((practice) => {
                      if (!practice) return null;
                      const key = practice.key;
                      const isCompleted = dayActions.includes(key);
                      const label = t(EMBODY_PRACTICE_SHORT_I18N_KEY[key]);
                      const incompleteFill = theme === "dark" ? "border border-white/12 bg-transparent" : "bg-zinc-100/90 border-neutral-300/85";
                      const completedStyle = isCompleted
                        ? theme === "dark"
                          ? { backgroundColor: "#ffffff", borderColor: "#ffffff" }
                          : { backgroundColor: "#000000", borderColor: "#000000" }
                        : undefined;
                      return (
                        <div key={key} className="flex justify-center items-center">
                          <div
                            aria-label={`${label}: ${isCompleted ? t("activity.milestones.aria.completed") : t("activity.milestones.aria.notCompleted")}`}
                            title={`${label}: ${isCompleted ? t("activity.milestones.aria.completed") : t("activity.milestones.aria.notCompleted")}`}
                            className={cn(
                              "size-9 sm:size-10 shrink-0 rounded-md border transition-colors",
                              !isCompleted && incompleteFill,
                            )}
                            style={completedStyle}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              });

              return (
                <>
                  {headerRow}
                  {rows}
                </>
              );
            })()}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="goals" className="mt-0">
        <div className={cn("space-y-4 p-3 sm:p-4", milestonePanelClass)}>
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const monday = getMondayOfWeek(goalsDateRange);
                const newMonday = new Date(monday);
                newMonday.setDate(newMonday.getDate() - 7);
                setGoalsDateRange(newMonday);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <div className="font-semibold">
                {(() => {
                  const monday = getMondayOfWeek(goalsDateRange);
                  return monday.toLocaleDateString(dateLocale, { month: "long", year: "numeric" });
                })()}
              </div>
              <div className="text-sm text-muted-foreground">
                {(() => {
                  const monday = getMondayOfWeek(goalsDateRange);
                  const sunday = new Date(monday);
                  sunday.setDate(sunday.getDate() + 6);
                  if (monday.getMonth() === sunday.getMonth()) {
                    const month = sunday.toLocaleDateString(dateLocale, { month: "short" });
                    return `${monday.toLocaleDateString(dateLocale, { day: "numeric" })}–${sunday.toLocaleDateString(dateLocale, { day: "numeric" })} ${month}`;
                  }
                  return `${monday.toLocaleDateString(dateLocale, { month: "short", day: "numeric" })}–${sunday.toLocaleDateString(dateLocale, { month: "short", day: "numeric" })}`;
                })()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const monday = getMondayOfWeek(goalsDateRange);
                const newMonday = new Date(monday);
                newMonday.setDate(newMonday.getDate() + 7);
                setGoalsDateRange(newMonday);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder={t("activity.milestones.goals.addPlaceholder")}
              className="flex-1 border-border/80 bg-card"
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              onKeyPress={async (e) => {
                if (e.key === "Enter" && newGoalText.trim() && selectedCategory && !isLoadingGoals) {
                  try {
                    const goalId = await saveWeeklyGoal(newGoalText.trim(), selectedCategory);
                    if (goalId) {
                      const newGoal = {
                        id: goalId,
                        text: newGoalText.trim(),
                        completed: false,
                        category: selectedCategory,
                      };
                      setWeeklyGoals([...weeklyGoals, newGoal]);
                      setNewGoalText("");
                      setSelectedCategory(null);
                      loadWeekReview();
                    }
                  } catch {
                    /* handled in saveWeeklyGoal */
                  }
                }
              }}
              disabled={isLoadingGoals}
            />
            <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  ref={categoryButtonRef}
                  variant="outline"
                  className={cn(
                    "h-10 shrink-0 px-3 font-normal shadow-none border-border/80 bg-card hover:bg-accent/40",
                    !selectedCategory && "text-muted-foreground",
                  )}
                  style={
                    selectedCategory
                      ? {
                          borderColor: FOCUS_CATEGORIES.find((c) => c.name === selectedCategory)?.color,
                          backgroundColor: `${FOCUS_CATEGORIES.find((c) => c.name === selectedCategory)?.color}20`,
                          color: FOCUS_CATEGORIES.find((c) => c.name === selectedCategory)?.color,
                        }
                      : undefined
                  }
                >
                  {selectedCategory ? getFocusCategoryLabel(selectedCategory) : t("activity.milestones.goals.category")}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2" align="start" style={categoryButtonWidth ? { width: `${categoryButtonWidth}px` } : {}}>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {FOCUS_CATEGORIES.map((category) => (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category.name);
                        setIsCategoryOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                        selectedCategory === category.name ? "font-semibold" : "hover:opacity-80"
                      }`}
                      style={{
                        borderColor: selectedCategory === category.name ? category.color : `${category.color}80`,
                        backgroundColor:
                          selectedCategory === category.name ? `${category.color}20` : `${category.color}10`,
                        color: selectedCategory === category.name ? category.color : "inherit",
                      }}
                    >
                      {getFocusCategoryLabel(category.name)}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              onClick={async () => {
                if (newGoalText.trim() && selectedCategory && !isLoadingGoals) {
                  try {
                    const goalId = await saveWeeklyGoal(newGoalText.trim(), selectedCategory);
                    if (goalId) {
                      const newGoal = {
                        id: goalId,
                        text: newGoalText.trim(),
                        completed: false,
                        category: selectedCategory,
                      };
                      setWeeklyGoals([...weeklyGoals, newGoal]);
                      setNewGoalText("");
                      setSelectedCategory(null);
                      loadWeekReview();
                    }
                  } catch {
                    /* handled in saveWeeklyGoal */
                  }
                }
              }}
              disabled={!newGoalText.trim() || !selectedCategory || isLoadingGoals}
            >
              {t("activity.milestones.goals.addButton")}
            </Button>
          </div>

          <div className="space-y-2">
            {isLoadingGoals ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t("activity.milestones.goals.loading")}</p>
              </div>
            ) : weeklyGoals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t("activity.milestones.goals.emptyTitle")}</p>
                <p className="text-sm mt-1">{t("activity.milestones.goals.emptyHint")}</p>
              </div>
            ) : (
              weeklyGoals.map((goal) => {
                const categoryInfo = goal.category ? FOCUS_CATEGORIES.find((c) => c.name === goal.category) : null;

                return (
                  <div
                    key={goal.id}
                    className={cn(
                      milestoneInnerSurfaceClass,
                      "flex items-center gap-3 p-3 transition-colors",
                      theme === "dark" ? "hover:bg-white/8 hover:text-white/80" : "hover:bg-zinc-50/90",
                    )}
                  >
                    <button
                      type="button"
                      onClick={async () => {
                        const newCompleted = !goal.completed;
                        setWeeklyGoals(weeklyGoals.map((g) => (g.id === goal.id ? { ...g, completed: newCompleted } : g)));
                        await updateWeeklyGoal(goal.id, newCompleted);
                        loadWeekReview();
                      }}
                      className="flex-shrink-0"
                      disabled={isLoadingGoals}
                    >
                      {goal.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 flex items-center gap-2">
                      <span className={`text-sm ${goal.completed ? "line-through text-muted-foreground" : ""}`}>{goal.text}</span>
                      {categoryInfo && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${categoryInfo.color}20`,
                            color: categoryInfo.color,
                          }}
                        >
                          {getFocusCategoryLabel(categoryInfo.name)}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={async () => {
                        setWeeklyGoals(weeklyGoals.filter((g) => g.id !== goal.id));
                        await deleteWeeklyGoal(goal.id);
                        loadWeekReview();
                      }}
                      disabled={isLoadingGoals}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="review" className="mt-0">
        <div className={cn("space-y-4 p-3 sm:p-4", milestonePanelClass)}>
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const monday = getMondayOfWeek(reviewDateRange);
                const newMonday = new Date(monday);
                newMonday.setDate(newMonday.getDate() - 7);
                setReviewDateRange(newMonday);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <div className="font-semibold">
                {(() => {
                  const monday = getMondayOfWeek(reviewDateRange);
                  return monday.toLocaleDateString(dateLocale, { month: "long", year: "numeric" });
                })()}
              </div>
              <div className="text-sm text-muted-foreground">
                {(() => {
                  const monday = getMondayOfWeek(reviewDateRange);
                  const sunday = new Date(monday);
                  sunday.setDate(sunday.getDate() + 6);
                  if (monday.getMonth() === sunday.getMonth()) {
                    const month = sunday.toLocaleDateString(dateLocale, { month: "short" });
                    return `${monday.toLocaleDateString(dateLocale, { day: "numeric" })}–${sunday.toLocaleDateString(dateLocale, { day: "numeric" })} ${month}`;
                  }
                  return `${monday.toLocaleDateString(dateLocale, { month: "short", day: "numeric" })}–${sunday.toLocaleDateString(dateLocale, { month: "short", day: "numeric" })}`;
                })()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const monday = getMondayOfWeek(reviewDateRange);
                const newMonday = new Date(monday);
                newMonday.setDate(newMonday.getDate() + 7);
                const today = new Date();
                const thisWeekMonday = getMondayOfWeek(today);
                if (newMonday <= thisWeekMonday) {
                  setReviewDateRange(newMonday);
                }
              }}
              disabled={(() => {
                const monday = getMondayOfWeek(reviewDateRange);
                const nextMonday = new Date(monday);
                nextMonday.setDate(nextMonday.getDate() + 7);
                const today = new Date();
                const thisWeekMonday = getMondayOfWeek(today);
                return nextMonday > thisWeekMonday;
              })()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {isLoadingReview ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("activity.milestones.review.loading")}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className={cn(milestoneInnerSurfaceClass, "p-4")}>
                <h3 className="font-semibold mb-2 text-sm">{t("activity.milestones.review.inspiredActionsTitle")}</h3>
                <div className="text-2xl font-bold">{weekStats.totalMicrogoals}</div>
                <p className="text-sm text-muted-foreground">{t("activity.milestones.review.inspiredActionsCount")}</p>
              </div>

              <div className={cn(milestoneInnerSurfaceClass, "p-4")}>
                <h3 className="font-semibold mb-3 text-sm">{t("activity.milestones.review.desiresTitle")}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("activity.milestones.review.desiresSet")}</span>
                    <span className="font-semibold">{weekStats.weeklyGoalsCreated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("activity.milestones.review.desiresAttained")}</span>
                    <span className="font-semibold">{weekStats.weeklyGoalsCompleted}</span>
                  </div>
                  {weekStats.weeklyGoalsCreated > 0 && (
                    <div className="mt-3">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${(weekStats.weeklyGoalsCompleted / weekStats.weeklyGoalsCreated) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("activity.milestones.review.completionRate", {
                          pct: Math.round((weekStats.weeklyGoalsCompleted / weekStats.weeklyGoalsCreated) * 100),
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {Object.keys(weekStats.categoryBreakdown).length > 0 && (
                <div className={cn(milestoneInnerSurfaceClass, "p-4")}>
                  <h3 className="font-semibold mb-3 text-sm">{t("activity.milestones.review.byCategoryTitle")}</h3>
                  <div className="space-y-3">
                    {Object.entries(weekStats.categoryBreakdown)
                      .sort((a, b) => b[1].completed - a[1].completed)
                      .map(([category, stats]) => {
                        const categoryInfo = FOCUS_CATEGORIES.find((c) => c.name === category);
                        const percentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
                        return (
                          <div key={category} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    backgroundColor: categoryInfo ? `${categoryInfo.color}20` : "hsl(var(--muted))",
                                    color: categoryInfo ? categoryInfo.color : "inherit",
                                  }}
                                >
                                  {getFocusCategoryLabel(category)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {t("activity.milestones.review.categoryCompleted", {
                                    completed: stats.completed,
                                    total: stats.total,
                                  })}
                                </span>
                              </div>
                              <span className="text-xs font-semibold">{Math.round(percentage)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: categoryInfo ? categoryInfo.color : "hsl(var(--primary))",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {weekStats.totalMicrogoals === 0 && weekStats.weeklyGoalsCreated === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t("activity.milestones.review.emptyTitle")}</p>
                  <p className="text-sm mt-1">{t("activity.milestones.review.emptyHint")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
