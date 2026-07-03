import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActivityTracker } from './useActivityTracker';

interface GamificationStats {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  tools_used_this_week: string[];
  milestones_achieved: string[];
  total_tools_used: number;
}

export const useGamification = () => {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState(7);
  const { trackActivity } = useActivityTracker();
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day; // Sunday as start of week
    date.setHours(0, 0, 0, 0);
    date.setDate(diff);
    return date;
  };

  const isNewWeek = (lastDate: string | null) => {
    const weekStart = getStartOfWeek(new Date());
    if (!lastDate) return true;
    const last = new Date(lastDate);
    last.setHours(0, 0, 0, 0);
    return last < weekStart;
  };

  useEffect(() => {
    fetchStats();
    fetchWeeklyGoal();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_gamification_stats')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching gamification stats:', error);
    } else if (data) {
      const needsReset = isNewWeek(data.last_activity_date);
      if (needsReset && Array.isArray(data.tools_used_this_week) && (data.tools_used_this_week as any[]).length > 0) {
        const { error: resetErr } = await supabase
          .from('user_gamification_stats')
          .update({ tools_used_this_week: [] })
          .eq('user_id', user.id);

        if (resetErr) {
          console.error('Error resetting weekly tools:', resetErr);
        }

        setStats({
          current_streak: data.current_streak,
          longest_streak: data.longest_streak,
          last_activity_date: data.last_activity_date,
          tools_used_this_week: [],
          milestones_achieved: Array.isArray(data.milestones_achieved) ? data.milestones_achieved as string[] : [],
          total_tools_used: data.total_tools_used,
        });
      } else {
        setStats({
          current_streak: data.current_streak,
          longest_streak: data.longest_streak,
          last_activity_date: data.last_activity_date,
          tools_used_this_week: Array.isArray(data.tools_used_this_week) ? data.tools_used_this_week as string[] : [],
          milestones_achieved: Array.isArray(data.milestones_achieved) ? data.milestones_achieved as string[] : [],
          total_tools_used: data.total_tools_used,
        });
      }
    }
  };

  const fetchWeeklyGoal = async () => {
    const { data } = await supabase
      .from('gamification_settings')
      .select('setting_value')
      .eq('setting_key', 'weekly_tool_goal')
      .single();

    if (data) {
      const value = data.setting_value as { target?: number };
      setWeeklyGoal(value.target || 7);
    }
  };

  const trackToolUsage = async (toolName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await trackActivity({
      action: 'tool_used',
      details: { tool: toolName }
    });

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // If new week started, start fresh for weekly meter
    const baseTools = isNewWeek(stats?.last_activity_date || null)
      ? []
      : (stats?.tools_used_this_week || []);

    const updatedTools = [...baseTools, toolName];
    const newStreak = calculateStreak(stats?.last_activity_date, todayStr);
    const newTotal = (stats?.total_tools_used || 0) + 1;

    // Optimistic update for instant UI feedback
    setStats({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, stats?.longest_streak || 0),
      last_activity_date: todayStr,
      tools_used_this_week: updatedTools,
      milestones_achieved: stats?.milestones_achieved || [],
      total_tools_used: newTotal,
    });

    const { error } = await supabase
      .from('user_gamification_stats')
      .upsert({
        user_id: user.id,
        tools_used_this_week: updatedTools,
        last_activity_date: todayStr,
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, stats?.longest_streak || 0),
        total_tools_used: newTotal,
      });

    if (error) {
      console.error('Error updating gamification stats:', error);
      await fetchStats();
    }
  };

  const calculateStreak = (lastActivityDate: string | null, today: string): number => {
    if (!lastActivityDate) return 1;

    const last = new Date(lastActivityDate);
    const current = new Date(today);
    const diffTime = current.getTime() - last.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return stats?.current_streak || 1;
    if (diffDays === 1) return (stats?.current_streak || 0) + 1;
    return 1; // Streak broken
  };

  return {
    stats,
    weeklyGoal,
    trackToolUsage,
    refreshStats: fetchStats,
  };
};
