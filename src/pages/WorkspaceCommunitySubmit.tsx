/**
 * Setup submissions — separate from feed; team reviews before featuring.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ImagePlus, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { WorkspaceHeader, workspaceShellClass } from "@/components/workspace/WorkspaceHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BODY_MIN = 10;
const BODY_MAX = 2000;
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Submission = {
  id: string;
  category: string;
  setup_medium: string;
  title: string | null;
  body_text: string;
  image_paths: string[];
  feature_opt_in: boolean;
  status: string;
  created_at: string;
};

const CATEGORIES = [
  "vision_board_rebrand",
  "moodboard",
  "home_organization",
  "office_organization",
] as const;

const MEDIUMS = ["in_app", "off_app", "both"] as const;

function publicImageUrl(path: string): string {
  return supabase.storage.from("community-posts").getPublicUrl(path).data.publicUrl;
}

function isAllowedImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp)$/i.test(file.name);
}

export default function WorkspaceCommunitySubmit() {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const dark = theme === "dark";
  const fileRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [medium, setMedium] = useState<string>("off_app");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [featureOptIn, setFeatureOptIn] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ id: string; file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [mine, setMine] = useState<Submission[]>([]);
  const [loadingMine, setLoadingMine] = useState(true);

  useEffect(() => {
    document.title = t("workspace.community.submitPageTitle");
  }, [t]);

  useEffect(() => {
    const fromUrl = searchParams.get("category");
    if (fromUrl && CATEGORIES.includes(fromUrl as (typeof CATEGORIES)[number])) {
      setCategory(fromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setLoadingMine(true);
      const { data } = await supabase
        .from("community_setup_submissions")
        .select("id, category, setup_medium, title, body_text, image_paths, feature_opt_in, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setMine((data ?? []) as Submission[]);
      setLoadingMine(false);
    })();
  }, [user]);

  useEffect(() => {
    return () => {
      pendingFiles.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, [pendingFiles]);

  const onPickImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const next = [...pendingFiles];
    for (let i = 0; i < list.length; i++) {
      if (next.length >= MAX_IMAGES) break;
      const file = list[i];
      if (!isAllowedImage(file)) {
        toast.error(t("workspace.community.imageTypeError"));
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(t("workspace.community.imageSizeError"));
        continue;
      }
      next.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) });
    }
    setPendingFiles(next);
    e.target.value = "";
  };

  const removeImage = (id: string) => {
    setPendingFiles((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const submit = async () => {
    if (!user) return;
    const trimmed = body.trim();
    if (trimmed.length < BODY_MIN) {
      toast.error(t("workspace.community.bodyTooShort"));
      return;
    }
    if (!pendingFiles.length) {
      toast.error(t("workspace.community.needPhoto"));
      return;
    }

    setSubmitting(true);
    const uploaded: string[] = [];
    try {
      for (const item of pendingFiles) {
        const safe = item.file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
        const path = `${user.id}/submissions/${crypto.randomUUID()}_${safe}`;
        const { error } = await supabase.storage
          .from("community-posts")
          .upload(path, item.file, { contentType: item.file.type || "image/jpeg" });
        if (error) throw error;
        uploaded.push(path);
      }

      const { data, error } = await supabase
        .from("community_setup_submissions")
        .insert({
          user_id: user.id,
          category,
          setup_medium: medium,
          title: title.trim() || null,
          body_text: trimmed,
          image_paths: uploaded,
          feature_opt_in: featureOptIn,
          status: "pending",
        })
        .select("id, category, setup_medium, title, body_text, image_paths, feature_opt_in, status, created_at")
        .single();

      if (error) throw error;

      pendingFiles.forEach((p) => URL.revokeObjectURL(p.preview));
      setPendingFiles([]);
      setBody("");
      setTitle("");
      setFeatureOptIn(false);
      if (data) setMine((prev) => [data as Submission, ...prev]);
      toast.success(t("workspace.community.submitted"));
    } catch {
      for (const p of uploaded) {
        await supabase.storage.from("community-posts").remove([p]).catch(() => {});
      }
      toast.error(t("workspace.community.postError"));
    } finally {
      setSubmitting(false);
    }
  };

  const card = dark ? "border-white/10 bg-white/[0.04]" : "border-zinc-200 bg-white";
  const muted = dark ? "text-white/55" : "text-zinc-500";
  const field = dark ? "border-white/12 bg-transparent text-white" : "";

  return (
    <div className={cn(workspaceShellClass(dark), "flex min-h-screen flex-col")}>
      <WorkspaceHeader />

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
        <Link
          to="/workspace/community"
          className={cn("mb-5 inline-flex items-center gap-1 text-sm font-medium", muted)}
        >
          <ChevronLeft className="h-4 w-4" />
          {t("workspace.community.title")}
        </Link>

        <h1 className={cn("font-welcome-serif text-2xl", dark ? "text-white" : "text-zinc-900")}>
          {t("workspace.community.submitTitle")}
        </h1>
        <p className={cn("mt-2 text-sm leading-relaxed", muted)}>{t("workspace.community.submitLead")}</p>

        <div className={cn("mt-6 rounded-2xl border p-4 sm:p-5", card)}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("workspace.community.categoryLabel")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className={field}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`workspace.community.submitCategories.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("workspace.community.mediumLabel")}</Label>
              <Select value={medium} onValueChange={setMedium}>
                <SelectTrigger className={field}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDIUMS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {t(`workspace.community.submitMediums.${m}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup-title">{t("workspace.community.titleLabel")}</Label>
              <input
                id="setup-title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                className={cn("flex h-10 w-full rounded-md border px-3 text-sm", field, dark ? "border-white/12" : "border-input")}
                placeholder={t("workspace.community.titlePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup-body">{t("workspace.community.storyLabel")}</Label>
              <Textarea
                id="setup-body"
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
                rows={5}
                className={cn("resize-y", field)}
                placeholder={t("workspace.community.storyPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("workspace.community.photosLabel")}</Label>
              <input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple className="sr-only" onChange={onPickImages} />
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((p) => (
                  <div key={p.id} className="relative">
                    <img src={p.preview} alt="" className="h-20 w-20 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(p.id)}
                      className={cn("absolute -right-1 -top-1 rounded-full border p-0.5", dark ? "border-white/20 bg-black" : "bg-white")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {pendingFiles.length < MAX_IMAGES ? (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={cn(
                      "flex h-20 w-20 items-center justify-center rounded-lg border border-dashed",
                      dark ? "border-white/20 text-white/50" : "border-zinc-300 text-zinc-400",
                    )}
                  >
                    <ImagePlus className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
            </div>

            <label className={cn("flex items-start gap-3 rounded-xl border p-3", dark ? "border-white/10" : "border-zinc-200")}>
              <Checkbox checked={featureOptIn} onCheckedChange={(v) => setFeatureOptIn(v === true)} className="mt-0.5" />
              <span className="text-sm leading-relaxed">
                <span className={cn("font-medium", dark ? "text-white" : "text-zinc-900")}>
                  {t("workspace.community.featureOptInLabel")}
                </span>
                <span className={cn("mt-1 block text-xs", muted)}>{t("workspace.community.featureOptInHint")}</span>
              </span>
            </label>

            <Button className="w-full" disabled={submitting} onClick={() => void submit()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("workspace.community.sendSubmission")}
            </Button>
          </div>
        </div>

        <section className="mt-8">
          <h2 className={cn("text-sm font-semibold", dark ? "text-white" : "text-zinc-900")}>
            {t("workspace.community.yourSubmissions")}
          </h2>
          {loadingMine ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className={cn("h-5 w-5 animate-spin", muted)} />
            </div>
          ) : mine.length === 0 ? (
            <p className={cn("mt-2 text-sm", muted)}>{t("workspace.community.noSubmissionsYet")}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {mine.map((row) => (
                <li key={row.id} className={cn("rounded-xl border p-3", card)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("text-xs font-semibold uppercase tracking-wide", muted)}>
                      {t(`workspace.community.submitCategories.${row.category}`)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                        row.status === "featured"
                          ? "bg-[#a87c84]/20 text-[#a87c84]"
                          : dark
                            ? "bg-white/10 text-white/60"
                            : "bg-zinc-100 text-zinc-600",
                      )}
                    >
                      {t(`workspace.community.submissionStatus.${row.status}`)}
                    </span>
                  </div>
                  {row.title ? <p className={cn("mt-1 text-sm font-medium", dark ? "text-white" : "text-zinc-900")}>{row.title}</p> : null}
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                    {row.image_paths.map((path) => (
                      <img key={path} src={publicImageUrl(path)} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

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
