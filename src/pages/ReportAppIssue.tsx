import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { getSupportReportToolOptions, getBillingPurchaseChannelOptions } from "@/lib/featuresData";
import { CheckCircle2, Paperclip, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { usePlottingPro } from "@/hooks/usePlottingPro";
import { WorkspaceHeader, workspaceShellClass } from "@/components/workspace/WorkspaceHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  caseListPreview,
  caseSubmittedWhen,
  caseSubtypeLabel,
  caseTypeLabel,
  formatInboxWhen,
  type UserInboxCase,
} from "@/lib/userSupportInbox";

const DESCRIPTION_MIN = 10;
const MAX_ATTACHMENTS = 3;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const TOOL_BILLING = "billing";

const darkFieldClass =
  "border-white/12 bg-transparent text-white placeholder:text-white/35 focus-visible:ring-white/20";
const helpTabsListClass = "h-auto w-full p-1";
const helpTabsTriggerClass = "h-8 rounded-md border border-transparent px-2";
const darkTabsListClass = "border border-white/12 bg-transparent";
const darkTabsTriggerClass =
  "text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white/80 data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none";

function getUploadContentType(file: File): string {
  const t = (file.type || "").toLowerCase();
  if (t && t !== "application/octet-stream") return t;
  const n = file.name.toLowerCase();
  if (n.endsWith(".heic") || n.endsWith(".heif")) return "image/heic";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".avif")) return "image/avif";
  if (n.endsWith(".bmp")) return "image/bmp";
  if (n.endsWith(".tif") || n.endsWith(".tiff")) return "image/tiff";
  return "application/octet-stream";
}

function isAllowedImageFile(file: File): boolean {
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("image/")) return true;
  const n = file.name.toLowerCase();
  return /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|tiff?)$/i.test(n);
}

function sanitizeFileBaseName(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").trim() || "image";
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
}

type PendingImage = { id: string; file: File; preview: string };
type CaseMessage = {
  id: string;
  sender: "user" | "support" | "system";
  body_text: string;
  created_at: string;
};

type ReportAppIssueProps = {
  workspaceMode?: boolean;
};

const ReportAppIssue = ({ workspaceMode = false }: ReportAppIssueProps) => {
  const { t } = useTranslation(["support", "dashboard", "common"]);
  const tDashboard = ((key: string, options?: Record<string, unknown>) =>
    t(`dashboard:${key}`, options)) as TFunction<"dashboard">;
  const supportReportToolOptions = useMemo(() => getSupportReportToolOptions(tDashboard), [t]);
  const billingPurchaseChannelOptions = useMemo(() => getBillingPurchaseChannelOptions(tDashboard), [t]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { hasPro } = usePlottingPro();
  const workspaceFree = workspaceMode && !hasPro;
  const submissionOptions = useMemo(() => {
    const all = [
      { value: "report" as const, label: t("submissionTypes.report") },
      { value: "ai_flag" as const, label: t("submissionTypes.aiFlag") },
      { value: "feature_request" as const, label: t("submissionTypes.featureRequest") },
    ];
    if (workspaceFree) {
      return all.filter((o) => o.value === "feature_request");
    }
    return all;
  }, [t, workspaceFree]);
  const homePath = workspaceMode ? "/workspace" : "/dashboard/boards";
  const shellDark = theme === "dark";
  const workspaceDarkBg = "#000000";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submissionType, setSubmissionType] = useState<string>("");
  const [tool, setTool] = useState<string>("");
  const [billingPurchaseChannel, setBillingPurchaseChannel] = useState<string>("");
  const [description, setDescription] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [activeTab, setActiveTab] = useState<"support" | "inbox">("support");

  const [inboxCases, setInboxCases] = useState<UserInboxCase[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseMessages, setCaseMessages] = useState<CaseMessage[]>([]);
  const [caseLoading, setCaseLoading] = useState(false);
  const [caseReply, setCaseReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const pendingRef = useRef(pendingImages);
  pendingRef.current = pendingImages;

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error(error);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(!!data?.user_id);
    })().catch(() => setIsAdmin(false));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    return () => {
      pendingRef.current.forEach((i) => URL.revokeObjectURL(i.preview));
    };
  }, []);

  const toolLabelFor = (value: string) =>
    supportReportToolOptions.find((o) => o.value === value)?.label ?? value;

  const removePending = (id: string) => {
    setPendingImages((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;

    const next: PendingImage[] = [...pendingImages];
    for (let i = 0; i < list.length; i++) {
      if (next.length >= MAX_ATTACHMENTS) {
        toast.error(t("toasts.maxAttachments", { max: MAX_ATTACHMENTS }));
        break;
      }
      const file = list[i];
      if (!isAllowedImageFile(file)) {
        toast.error(t("toasts.unsupportedImage", { name: file.name }));
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(t("toasts.fileTooLarge", { name: file.name }));
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      });
    }
    setPendingImages(next);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!submissionType) {
      toast.error(t("toasts.chooseSubmissionType"));
      return;
    }
    if (!tool) {
      toast.error(t("toasts.chooseToolOrArea"));
      return;
    }
    if (tool === TOOL_BILLING && !billingPurchaseChannel) {
      toast.error(t("toasts.choosePurchaseChannel"));
      return;
    }
    const trimmed = description.trim();
    if (trimmed.length < DESCRIPTION_MIN) {
      toast.error(t("toasts.descriptionMinLength", { min: DESCRIPTION_MIN }));
      return;
    }

    setSubmitting(true);
    const uploadedPaths: string[] = [];
    try {
      for (const item of pendingImages) {
        let uploadFile = item.file;
        if (
          item.file.type.startsWith("image/") &&
          item.file.type !== "image/svg+xml" &&
          item.file.type !== "image/gif"
        ) {
          const bitmap = await createImageBitmap(item.file);
          try {
            const canvas = document.createElement("canvas");
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(bitmap, 0, 0);
              const outType = item.file.type === "image/png" ? "image/png" : "image/jpeg";
              const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, outType, outType === "image/jpeg" ? 0.92 : undefined);
              });
              if (blob) {
                const ext = outType === "image/png" ? "png" : "jpg";
                const base = item.file.name.replace(/\.[^.]+$/, "") || "upload";
                uploadFile = new File([blob], `${base}.${ext}`, { type: outType });
              }
            }
          } finally {
            bitmap.close();
          }
        }
        const safe = sanitizeFileBaseName(uploadFile.name);
        const objectPath = `${user.id}/${crypto.randomUUID()}_${safe}`;
        const contentType = getUploadContentType(uploadFile);
        const { error: upErr } = await supabase.storage
          .from("support-reports")
          .upload(objectPath, uploadFile, {
            contentType,
            upsert: false,
          });
        if (upErr) {
          console.error(upErr);
          throw new Error(upErr.message || t("toasts.uploadFailed"));
        }
        uploadedPaths.push(objectPath);
      }

      const { data, error } = await supabase.functions.invoke("submit-app-support-report", {
        method: "POST",
        body: {
          submission_type: submissionType,
          tool_value: tool,
          tool_label: toolLabelFor(tool),
          description: trimmed,
          attachment_storage_paths: uploadedPaths,
          ...(tool === TOOL_BILLING ? { billing_purchase_channel: billingPurchaseChannel } : {}),
        },
      });
      if (error) {
        const body = data as { error?: string; detail?: string } | null;
        const msg =
          body?.error && body?.detail
            ? `${body.error}: ${body.detail}`
            : body?.error ?? (error instanceof Error ? error.message : t("toasts.requestFailed"));
        throw new Error(msg);
      }
      const res = data as { error?: string; detail?: string; success?: boolean };
      if (res?.error) {
        throw new Error(res.detail ? `${res.error}: ${res.detail}` : res.error);
      }
      pendingImages.forEach((i) => URL.revokeObjectURL(i.preview));
      setPendingImages([]);
      setDone(true);
      toast.success(t("toasts.submitted"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common:error");
      toast.error(msg);
      for (const p of uploadedPaths) {
        await supabase.storage.from("support-reports").remove([p]).catch(() => {});
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedInboxCase = useMemo(
    () => inboxCases.find((c) => c.id === selectedCaseId) ?? null,
    [inboxCases, selectedCaseId],
  );

  const fetchInboxCases = async () => {
    if (!user) return;
    setInboxLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_cases")
        .select(
          "id,message_type,submission_type,tool_label,tool_or_area,latest_message_preview,original_submission_text,user_unread,thread_id,created_at,updated_at",
        )
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setInboxCases((data ?? []) as unknown as UserInboxCase[]);
    } catch (e) {
      console.error(e);
      toast.error(t("toasts.loadInboxFailed"));
    } finally {
      setInboxLoading(false);
    }
  };

  const openInboxCase = async (caseRow: UserInboxCase) => {
    setSelectedCaseId(caseRow.id);
    setCaseReply("");
    setCaseLoading(true);
    try {
      let msgQuery = supabase
        .from("inbox_messages")
        .select("id,sender,body_text,created_at")
        .order("created_at", { ascending: true });

      if (caseRow.thread_id) {
        msgQuery = msgQuery.or(
          `case_id.eq.${caseRow.id},and(thread_id.eq.${caseRow.thread_id},case_id.is.null)`,
        );
      } else {
        msgQuery = msgQuery.eq("case_id", caseRow.id);
      }

      const { data: messages, error } = await msgQuery;
      if (error) throw error;
      setCaseMessages((messages ?? []) as unknown as CaseMessage[]);

      const { error: readErr } = await supabase
        .from("support_cases")
        .update({ user_unread: false })
        .eq("id", caseRow.id);
      if (readErr) console.error(readErr);
      setInboxCases((prev) =>
        prev.map((c) => (c.id === caseRow.id ? { ...c, user_unread: false } : c)),
      );
    } catch (e) {
      console.error(e);
      toast.error(t("toasts.loadConversationFailed"));
    } finally {
      setCaseLoading(false);
    }
  };

  const sendCaseReply = async () => {
    const body = caseReply.trim();
    if (!body || !selectedInboxCase?.thread_id) return;
    setSendingReply(true);
    try {
      const now = new Date().toISOString();
      const { error: msgErr } = await supabase.from("inbox_messages").insert({
        thread_id: selectedInboxCase.thread_id,
        case_id: selectedInboxCase.id,
        sender: "user",
        body_text: body,
        created_at: now,
      });
      if (msgErr) throw msgErr;

      await supabase
        .from("inbox_threads")
        .update({ last_message_at: now, updated_at: now })
        .eq("id", selectedInboxCase.thread_id);

      setCaseReply("");
      await openInboxCase({ ...selectedInboxCase, user_unread: false });
      await fetchInboxCases();
      toast.success(t("toasts.replySent"));
    } catch (e) {
      console.error(e);
      toast.error(t("toasts.sendReplyFailed"));
    } finally {
      setSendingReply(false);
    }
  };

  useEffect(() => {
    if (workspaceFree) {
      setSubmissionType("feature_request");
    }
  }, [workspaceFree]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const caseId = searchParams.get("case");
    if (tab === "inbox" || caseId) {
      setActiveTab("inbox");
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab !== "inbox") return;
    setSelectedCaseId(null);
    setCaseMessages([]);
    void fetchInboxCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.id]);

  useEffect(() => {
    const caseId = searchParams.get("case");
    if (activeTab !== "inbox" || !caseId || inboxLoading) return;
    const row = inboxCases.find((c) => c.id === caseId);
    if (row && selectedCaseId !== caseId) {
      void openInboxCase(row);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchParams, inboxCases, inboxLoading, selectedCaseId]);

  if (user === null) {
    return null;
  }

  const pageBg = workspaceMode
    ? shellDark
      ? workspaceDarkBg
      : "#faf8f5"
    : shellDark
      ? "#0f0d14"
      : "#ffffff";

  const helpShell = (
    <div
      className={cn(
        workspaceMode ? workspaceShellClass(shellDark) : cn("tool-page-shell relative overflow-x-hidden", shellDark ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"),
        "min-h-screen pb-20 md:pb-0",
      )}
      style={{ backgroundColor: pageBg }}
    >
      <div className="min-h-screen">
        {!workspaceMode && isMobile && (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              shellDark ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        )}

        <div className="relative z-10">
          {workspaceMode ? (
            <WorkspaceHeader />
          ) : (
            <header
              className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", shellDark ? "py-2.5 border-white/10" : "py-3 border-primary/10", shellDark ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), isMobile ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]" : "fixed top-0 left-0 right-0")}
              style={isMobile ? (shellDark ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }) : { ...(shellDark ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }), top: "var(--app-safe-area-top)", right: "0" }}
            >
              <div className={cn("px-4 sm:px-6 w-full flex items-center justify-between", !isMobile ? "" : "container mx-auto")}>
                <h1 className={shellDark ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"} onClick={() => navigate(homePath)}>
                  {t("pageTitle")}
                </h1>
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => navigate("/dashboard/admin/support")}
                    >
                      {t("supportInbox")}
                    </Button>
                  ) : null}
                </div>
              </div>
            </header>
          )}

        <main
          className={cn(
            workspaceMode ? "mx-auto max-w-3xl px-4 py-6 sm:px-6" : "px-4 sm:px-6 max-w-6xl pb-24 md:pb-8 relative z-10",
            !workspaceMode && !isMobile ? "pt-16" : "",
            !workspaceMode && !isMobile ? "" : !workspaceMode ? "container mx-auto" : "",
          )}
        >
          <div className={workspaceMode ? "" : "py-3 sm:py-4"}>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="max-w-xl">
              <TabsList className={cn(helpTabsListClass, "grid grid-cols-2", shellDark && darkTabsListClass)}>
                <TabsTrigger value="support" className={cn(helpTabsTriggerClass, shellDark && darkTabsTriggerClass)}>{t("tabs.support")}</TabsTrigger>
                <TabsTrigger value="inbox" className={cn(helpTabsTriggerClass, shellDark && darkTabsTriggerClass)}>{t("tabs.inbox")}</TabsTrigger>
              </TabsList>

              <TabsContent value="support" className="mt-4">
                {done ? (
              <Card className={cn("max-w-xl", theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-5 sm:p-6") : "p-5 sm:p-6")}>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-8 w-8 shrink-0 text-green-600 dark:text-green-500" aria-hidden />
                  <div className="space-y-2 min-w-0">
                    <p className="text-base font-semibold text-foreground">{t("supportForm.successTitle")}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("supportForm.successBody")}{" "}
                      <a className="underline text-foreground" href="mailto:support@paletteplotting.com">
                        support@paletteplotting.com
                      </a>
                      {t("supportForm.successBodySuffix")}
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => navigate("/dashboard/boards")}>
                        {t("create.backToDashboard")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setDone(false);
                          setSubmissionType("");
                          setTool("");
                          setBillingPurchaseChannel("");
                          setDescription("");
                          setPendingImages([]);
                          fileInputRef.current && (fileInputRef.current.value = "");
                        }}
                      >
                        {t("create.submitAnother")}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
                ) : (
              <Card className={cn("max-w-xl", theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6") : "p-4 sm:p-6")}>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="support-submission-type">{t("supportForm.submissionTypeLabel")}</Label>
                    <Select value={submissionType} onValueChange={setSubmissionType}>
                      <SelectTrigger id="support-submission-type" className={cn("h-10", theme === "dark" && darkFieldClass)}>
                        <SelectValue placeholder={t("create.chooseOne")} />
                      </SelectTrigger>
                      <SelectContent position="popper" className={theme === "dark" ? "z-50 border border-white/12 bg-[#0f0d14] text-white" : "bg-white z-50 border-border text-black"}>
                        {submissionOptions.map((o) => (
                          <SelectItem
                            key={o.value}
                            value={o.value}
                            className={theme === "dark" ? "text-white focus:bg-white/10 focus:text-white" : "text-black focus:bg-gray-100 focus:text-black"}
                          >
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support-tool">{t("supportForm.toolOrAreaLabel")}</Label>
                    <Select
                      value={tool}
                      onValueChange={(v) => {
                        setTool(v);
                        if (v !== TOOL_BILLING) setBillingPurchaseChannel("");
                      }}
                    >
                      <SelectTrigger id="support-tool" className={cn("h-10", theme === "dark" && darkFieldClass)}>
                        <SelectValue placeholder={t("supportForm.toolPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        className={cn("max-h-[min(60vh,320px)]", theme === "dark" ? "z-50 border border-white/12 bg-[#0f0d14] text-white" : "bg-white z-50 border-border text-black")}
                      >
                        {supportReportToolOptions.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className={theme === "dark" ? "text-white focus:bg-white/10 focus:text-white" : "text-black focus:bg-gray-100 focus:text-black"}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {tool === TOOL_BILLING && (
                    <div className="space-y-2">
                      <Label htmlFor="support-billing-channel">{t("supportForm.purchaseChannelLabel")}</Label>
                      <Select value={billingPurchaseChannel} onValueChange={setBillingPurchaseChannel}>
                        <SelectTrigger id="support-billing-channel" className={cn("h-10", theme === "dark" && darkFieldClass)}>
                          <SelectValue placeholder={t("supportForm.purchaseChannelPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent position="popper" className={theme === "dark" ? "z-50 border border-white/12 bg-[#0f0d14] text-white" : "bg-white z-50 border-border text-black"}>
                          {billingPurchaseChannelOptions.map((o) => (
                            <SelectItem
                              key={o.value}
                              value={o.value}
                              className={theme === "dark" ? "text-white focus:bg-white/10 focus:text-white" : "text-black focus:bg-gray-100 focus:text-black"}
                            >
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="support-description">{t("supportForm.descriptionLabel")}</Label>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {description.length}
                      </span>
                    </div>
                    <Textarea
                      id="support-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t("supportForm.descriptionPlaceholder")}
                      rows={6}
                      className={cn("min-h-[140px] resize-y text-sm", theme === "dark" && darkFieldClass)}
                      required
                    />
                    {tool === TOOL_BILLING && billingPurchaseChannel === "apple_app_store" && (
                      <p className="text-xs leading-relaxed text-destructive">
                        {t("supportForm.appleRefundNote")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <Label htmlFor="support-screenshots">{t("supportForm.screenshotsLabel")}</Label>
                      <span className="text-[11px] text-muted-foreground">
                        {t("supportForm.screenshotsHint", { max: MAX_ATTACHMENTS })}
                      </span>
                    </div>
                    <Input
                      ref={fileInputRef}
                      id="support-screenshots"
                      type="file"
                      accept="image/*,.heic,.heif,.HEIC,.HEIF,.avif,.AVIF"
                      multiple
                      className="sr-only"
                      onChange={onPickFiles}
                      disabled={pendingImages.length >= MAX_ATTACHMENTS}
                    />
                    <div
                      className={cn(
                        "flex min-h-10 items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm",
                        theme === "dark" ? darkFieldClass : "border-input bg-background",
                      )}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 gap-2 px-2",
                          theme === "dark" && "text-white hover:bg-white/[0.06] hover:text-white",
                        )}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={pendingImages.length >= MAX_ATTACHMENTS}
                      >
                        <Paperclip className="h-4 w-4" aria-hidden />
                        {t("supportForm.chooseFiles")}
                      </Button>
                      <span className={cn("truncate text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                        {pendingImages.length > 0
                          ? t("supportForm.filesSelected", { count: pendingImages.length })
                          : t("supportForm.noFilesSelected")}
                      </span>
                    </div>
                    {pendingImages.length > 0 && (
                      <ul className="flex flex-wrap gap-2 pt-1">
                        {pendingImages.map((item) => (
                          <li
                            key={item.id}
                            className="relative h-16 w-16 overflow-hidden rounded-md border border-border bg-muted/20"
                          >
                            <img src={item.preview} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow border border-border"
                              onClick={() => removePending(item.id)}
                              aria-label={t("supportForm.removeFileAria", { name: item.file.name })}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <p className={cn("text-xs leading-relaxed", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                    {t("supportForm.contactFooter")}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? t("create.submitting") : t("create.submit")}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => navigate("/dashboard/boards")}>
                          {t("common:cancel")}
                        </Button>
                  </div>
                </form>
              </Card>
                )}
              </TabsContent>

              <TabsContent value="inbox" className="mt-4">
                <div className="max-w-3xl">
                  <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6") : "p-4 sm:p-6")}>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-foreground">{t("inbox.title")}</p>
                        <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                          {t("inbox.description")}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={theme === "dark" ? "border-white/12 bg-transparent text-white hover:bg-white/[0.06] hover:text-white" : undefined}
                        onClick={() => {
                          if (selectedCaseId && selectedInboxCase) {
                            void openInboxCase(selectedInboxCase);
                          } else {
                            void fetchInboxCases();
                          }
                        }}
                        disabled={inboxLoading || caseLoading}
                      >{t("inbox.refresh")}</Button>
                    </div>

                    {selectedCaseId && selectedInboxCase ? (
                      <div className="space-y-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="px-0"
                          onClick={() => {
                            setSelectedCaseId(null);
                            setCaseMessages([]);
                            setCaseReply("");
                          }}
                        >
                          {t("inbox.backToRequests")}
                        </Button>

                        <div>
                          <p className="text-sm font-semibold text-foreground">{caseTypeLabel(selectedInboxCase)}</p>
                          <p className={cn("text-xs mt-0.5", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                            {caseSubtypeLabel(selectedInboxCase)}
                          </p>
                          <p className={cn("text-[11px] mt-1", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                            {caseSubmittedWhen(selectedInboxCase)}
                          </p>
                        </div>

                        {caseLoading ? (
                          <p className={cn("text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{t("inbox.loading")}</p>
                        ) : caseMessages.length === 0 ? (
                          <p className={cn("text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{t("inbox.noMessages")}</p>
                        ) : (
                          <div className="space-y-2">
                            {caseMessages.map((m) => (
                              <div
                                key={m.id}
                                className={cn(
                                  "rounded-lg border px-3 py-2 text-sm leading-relaxed",
                                  m.sender === "support"
                                    ? "border-primary/25 bg-primary/10"
                                    : "border-border bg-muted/20",
                                )}
                              >
                                <p className={cn("text-[11px] mb-1", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                                  {m.sender === "support" ? t("inbox.senderSupport") : t("inbox.senderYou")} · {formatInboxWhen(m.created_at)}
                                </p>
                                <p className="whitespace-pre-wrap text-foreground">{m.body_text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2 pt-2 border-t border-border">
                          <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="case-reply">{t("inbox.yourReply")}</Label>
                            <span className="text-[11px] tabular-nums text-muted-foreground">
                              {caseReply.length}
                            </span>
                          </div>
                          <Textarea
                            id="case-reply"
                            value={caseReply}
                            onChange={(e) => setCaseReply(e.target.value)}
                            rows={3}
                            className={cn("min-h-[88px] resize-y text-sm", theme === "dark" && darkFieldClass)}
                            placeholder={t("inbox.replyPlaceholder")}
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={sendingReply || !caseReply.trim()}
                            onClick={() => void sendCaseReply()}
                          >
                            {sendingReply ? t("inbox.sending") : t("inbox.sendReply")}
                          </Button>
                        </div>
                      </div>
                    ) : inboxLoading ? (
                      <p className={cn("text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{t("inbox.loading")}</p>
                    ) : inboxCases.length === 0 ? (
                      <p className={cn("text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                        {t("inbox.empty")}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {inboxCases.map((c) => {
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => void openInboxCase(c)}
                              className={cn(
                                "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                                "border-border hover:bg-muted/30",
                                c.user_unread ? "border-primary/30 bg-primary/5" : "",
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-foreground">{caseTypeLabel(c)}</p>
                                {c.user_unread ? (
                                  <span
                                    className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5"
                                    aria-label={t("inbox.newReplyAria")}
                                  />
                                ) : null}
                              </div>
                              <p className={cn("text-xs mt-0.5", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                                {caseSubtypeLabel(c)}
                              </p>
                              <p className="mt-2 text-sm text-foreground/90 line-clamp-2">
                                {c.user_unread ? (
                                  <>
                                    <span className="font-medium text-foreground">{t("inbox.supportRepliedPrefix")}</span>
                                    {caseListPreview(c)}
                                  </>
                                ) : (
                                  `"${caseListPreview(c)}"`
                                )}
                              </p>
                              <p className={cn("text-[11px] mt-2", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                                {caseSubmittedWhen(c)}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        </div>
      </div>
    </div>
  );

  return helpShell;
};

export default ReportAppIssue;
