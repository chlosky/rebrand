/**
 * Community home — admin-curated feed + active poll. Gated by COMMUNITY_IN_APP_ENABLED.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Loader2, Sparkles, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { WorkspaceHeader, workspaceShellClass } from "@/components/workspace/WorkspaceHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type FeedPost = {
  id: string;
  title: string | null;
  body_text: string;
  image_path: string | null;
  post_kind: string;
  category: string;
  published_at: string;
};

type Poll = {
  id: string;
  title: string;
  description: string | null;
  reward_note: string | null;
  status: string;
};

type PollOption = {
  id: string;
  poll_id: string;
  label: string;
  image_path: string | null;
  sort_order: number;
};

function publicImageUrl(path: string): string {
  return supabase.storage.from("community-posts").getPublicUrl(path).data.publicUrl;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function kindLabel(kind: string, t: (k: string) => string): string {
  const key = `workspace.community.feedKinds.${kind}`;
  const out = t(key);
  return out === key ? kind : out;
}

const PROMPT_ACCENT: Record<string, string> = {
  vision_board_rebrand: "#E8B4B8",
  moodboard: "#FF4DA6",
  home_organization: "#98FB98",
  office_organization: "#2563EB",
};

function communityDayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000) % 7;
}

type DailyPrompt = {
  category: string;
  prompt_text: string;
};

export default function WorkspaceCommunity() {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [dailyPrompts, setDailyPrompts] = useState<DailyPrompt[]>([]);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [myVoteOptionId, setMyVoteOptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    document.title = t("workspace.community.pageTitle");
  }, [t]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const dayIndex = communityDayIndex();

        const { data: prompts } = await supabase
          .from("community_daily_prompts")
          .select("category, prompt_text")
          .eq("day_index", dayIndex)
          .order("category");

        if (!cancelled) setDailyPrompts((prompts ?? []) as DailyPrompt[]);

        const { data: feed } = await supabase
          .from("community_feed_posts")
          .select("id, title, body_text, image_path, post_kind, category, published_at")
          .eq("published", true)
          .order("published_at", { ascending: false })
          .limit(40);

        if (!cancelled) setPosts((feed ?? []) as FeedPost[]);

        const { data: activePoll } = await supabase
          .from("community_polls")
          .select("id, title, description, reward_note, status")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!activePoll) {
          if (!cancelled) {
            setPoll(null);
            setOptions([]);
          }
          return;
        }

        const p = activePoll as Poll;
        if (!cancelled) setPoll(p);

        const { data: opts } = await supabase
          .from("community_poll_options")
          .select("id, poll_id, label, image_path, sort_order")
          .eq("poll_id", p.id)
          .order("sort_order");

        if (!cancelled) setOptions((opts ?? []) as PollOption[]);

        const { data: votes } = await supabase
          .from("community_poll_votes")
          .select("option_id, user_id")
          .eq("poll_id", p.id);

        if (votes && !cancelled) {
          const counts: Record<string, number> = {};
          for (const v of votes) {
            counts[v.option_id] = (counts[v.option_id] ?? 0) + 1;
          }
          setVoteCounts(counts);
          const mine = votes.find((v) => v.user_id === user.id);
          setMyVoteOptionId(mine?.option_id ?? null);
        }
      } catch {
        if (!cancelled) toast.error(t("workspace.community.loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, t]);

  const castVote = async (optionId: string) => {
    if (!user || !poll || myVoteOptionId) return;
    setVoting(true);
    try {
      const { error } = await supabase.from("community_poll_votes").insert({
        poll_id: poll.id,
        option_id: optionId,
        user_id: user.id,
      });
      if (error) throw error;
      setMyVoteOptionId(optionId);
      setVoteCounts((prev) => ({ ...prev, [optionId]: (prev[optionId] ?? 0) + 1 }));
      toast.success(t("workspace.community.voteRecorded"));
    } catch {
      toast.error(t("workspace.community.voteError"));
    } finally {
      setVoting(false);
    }
  };

  const card = dark ? "border-white bg-black" : "border-zinc-200 bg-white";
  const muted = dark ? "text-white/55" : "text-zinc-500";
  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  return (
    <div className={cn(workspaceShellClass(dark), "flex min-h-screen flex-col")}>
      <WorkspaceHeader />

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#a87c84]" aria-hidden />
              <h1 className={cn("font-welcome-serif text-2xl", dark ? "text-white" : "text-zinc-900")}>
                {t("workspace.community.title")}
              </h1>
            </div>
            <p className={cn("text-sm", muted)}>{t("workspace.community.feedSubtitle")}</p>
          </div>
          <Button asChild variant="outline" className={cn("gap-2", dark && "border-white text-white hover:bg-white hover:text-black")}>
            <Link to="/workspace/community/submit">
              <Upload className="h-4 w-4" />
              {t("workspace.community.submitSetup")}
            </Link>
          </Button>
        </div>

        {dailyPrompts.length > 0 ? (
          <section className="mb-6">
            <p className={cn("mb-3 text-[10px] font-bold uppercase tracking-wider", dark ? "text-[#d4a8ae]" : "text-[#a87c84]")}>
              {t("workspace.community.dailyPrompts")}
            </p>
            <p className={cn("mb-3 text-xs", muted)}>{t("workspace.community.dailyPromptsHint")}</p>
            <ul className="space-y-2">
              {dailyPrompts.map((row) => (
                <li key={row.category}>
                  <Link
                    to={`/workspace/community/submit?category=${row.category}`}
                    className={cn(
                      "block rounded-xl border p-3 transition-colors",
                      dark
                        ? "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                        : "border-zinc-200 bg-white hover:border-zinc-300",
                    )}
                  >
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: PROMPT_ACCENT[row.category] ?? "#a87c84" }}
                    >
                      {t(`workspace.community.submitCategories.${row.category}`)}
                    </span>
                    <p className={cn("mt-1 text-sm leading-relaxed", dark ? "text-white/88" : "text-zinc-700")}>
                      {row.prompt_text}
                    </p>
                    <span className={cn("mt-2 block text-[11px] font-medium", muted)}>
                      {t("workspace.community.promptSubmitCta")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {poll && options.length > 0 ? (
          <section className={cn("mb-6 rounded-2xl border p-4 sm:p-5", card)}>
            <p className={cn("text-[10px] font-bold uppercase tracking-wider", dark ? "text-[#d4a8ae]" : "text-[#a87c84]")}>
              {t("workspace.community.activePoll")}
            </p>
            <h2 className={cn("mt-1 font-welcome-serif text-lg", dark ? "text-white" : "text-zinc-900")}>{poll.title}</h2>
            {poll.description ? <p className={cn("mt-2 text-sm", muted)}>{poll.description}</p> : null}
            {poll.reward_note ? (
              <p className={cn("mt-2 rounded-lg border px-3 py-2 text-xs", dark ? "border-white/10 bg-white/[0.03]" : "border-zinc-200 bg-[#faf8f5]")}>
                {poll.reward_note}
              </p>
            ) : null}
            <ul className="mt-4 space-y-2">
              {options.map((opt) => {
                const count = voteCounts[opt.id] ?? 0;
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const voted = myVoteOptionId === opt.id;
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      disabled={!!myVoteOptionId || voting}
                      onClick={() => void castVote(opt.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:cursor-default",
                        voted
                          ? dark
                            ? "border-white/25 bg-white/[0.08]"
                            : "border-zinc-400 bg-zinc-50"
                          : dark
                            ? "border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                            : "border-zinc-200 hover:border-zinc-300",
                      )}
                    >
                      {opt.image_path ? (
                        <img src={publicImageUrl(opt.image_path)} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-lg font-semibold", dark ? "bg-white/10" : "bg-zinc-100")}>
                          {opt.label[0]}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm font-medium", dark ? "text-white" : "text-zinc-900")}>{opt.label}</span>
                        {myVoteOptionId ? (
                          <span className={cn("mt-1 block text-xs", muted)}>
                            {count} {t("workspace.community.votes")} · {pct}%
                          </span>
                        ) : (
                          <span className={cn("mt-1 block text-xs", muted)}>{t("workspace.community.tapToVote")}</span>
                        )}
                      </span>
                      {voted ? <Check className="h-4 w-4 shrink-0 text-[#a87c84]" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className={cn("h-6 w-6 animate-spin", muted)} />
          </div>
        ) : posts.length === 0 ? (
          <p className={cn("text-center text-sm", muted)}>{t("workspace.community.emptyFeed")}</p>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id} className={cn("rounded-2xl border p-4 sm:p-5", card)}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      dark ? "bg-white/10 text-white/70" : "bg-zinc-100 text-zinc-600",
                    )}
                  >
                    {kindLabel(post.post_kind, t)}
                  </span>
                  <span className={cn("text-[11px]", muted)}>{formatWhen(post.published_at)}</span>
                </div>
                {post.title ? (
                  <h3 className={cn("font-welcome-serif text-lg", dark ? "text-white" : "text-zinc-900")}>{post.title}</h3>
                ) : null}
                <p className={cn("mt-2 whitespace-pre-wrap text-sm leading-relaxed", dark ? "text-white/88" : "text-zinc-700")}>
                  {post.body_text}
                </p>
                {post.image_path ? (
                  <img
                    src={publicImageUrl(post.image_path)}
                    alt=""
                    className="mt-4 max-h-80 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => navigate("/workspace")}
          className={cn("mt-8 block w-full text-center text-xs underline-offset-2 hover:underline", muted)}
        >
          {t("workspace.community.backToWorkspace")}
        </button>
      </div>
    </div>
  );
}
