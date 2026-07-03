import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  type AdminInboxTab,
  type SupportCaseRow,
  type UserCaseGroup,
  filterCasesBySearch,
  filterCasesForTab,
  formatWhen,
  groupCasesByUser,
  messageTypeLabel,
} from "@/lib/adminSupportCases";

type InboxMessage = {
  id: string;
  sender: "user" | "support" | "system";
  body_text: string;
  attachment_storage_paths?: string[] | null;
  created_at: string;
  edited_at?: string | null;
};

type InternalNote = {
  id: string;
  body_text: string;
  created_at: string;
  admin_user_id: string;
};

type Panel = "list" | "cases" | "detail";

export default function AdminSupportInbox() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<AdminInboxTab>("open");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [allCases, setAllCases] = useState<SupportCaseRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { email?: string | null; first_name?: string | null }>>({});

  const [panel, setPanel] = useState<Panel>("list");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [sending, setSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [attachmentUrlMap, setAttachmentUrlMap] = useState<Record<string, string>>({});
  const loadDetailGenRef = useRef(0);

  const selectedCase = useMemo(
    () => allCases.find((c) => c.id === selectedCaseId) ?? null,
    [allCases, selectedCaseId],
  );

  const tabCases = useMemo(() => filterCasesForTab(allCases, tab), [allCases, tab]);

  const searchedCases = useMemo(
    () => filterCasesBySearch(tabCases, profiles, search),
    [tabCases, profiles, search],
  );

  const userGroups = useMemo(
    () => groupCasesByUser(searchedCases, profiles),
    [searchedCases, profiles],
  );

  const selectedUserGroup = useMemo(() => {
    if (!selectedUserId) return null;
    return userGroups.find((g) => g.user_id === selectedUserId) ?? null;
  }, [selectedUserId, userGroups]);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_cases")
        .select(
          "id,user_id,user_email,message_type,submission_type,tool_or_area,tool_label,subject,original_submission_text,latest_message_preview,status,admin_unread,user_unread,attachment_storage_paths,report_id,thread_id,closed_at,closed_by_admin_id,created_at,updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const rows = (data ?? []) as unknown as SupportCaseRow[];
      setAllCases(rows);

      const userIds = [...new Set(rows.map((r) => r.user_id))];
      if (userIds.length > 0) {
        const { data: profileRows, error: profileErr } = await supabase
          .from("profiles")
          .select("id,email,first_name")
          .in("id", userIds);
        if (profileErr) throw profileErr;
        const map: Record<string, { email?: string | null; first_name?: string | null }> = {};
        (profileRows ?? []).forEach((p) => {
          if (p?.id) map[String(p.id)] = { email: p.email, first_name: p.first_name };
        });
        setProfiles(map);
      } else {
        setProfiles({});
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not load cases.");
    } finally {
      setLoading(false);
    }
  }, []);

  const signAttachmentUrls = async (paths: string[]) => {
    const missing = paths.filter((p) => p && !attachmentUrlMap[p]);
    if (missing.length === 0) return;
    const { data, error } = await supabase.functions.invoke("admin-sign-support-attachments", {
      method: "POST",
      body: { paths: missing.slice(0, 12) },
    });
    if (error) throw error;
    const signed = (data as { signed?: { path: string; url: string | null }[] })?.signed;
    const out: Record<string, string> = {};
    (signed ?? []).forEach((s) => {
      if (s?.path && s?.url) out[String(s.path)] = String(s.url);
    });
    setAttachmentUrlMap((prev) => ({ ...prev, ...out }));
  };

  const loadCaseDetail = useCallback(async (caseRow: SupportCaseRow) => {
    const gen = ++loadDetailGenRef.current;
    setLoadingDetail(true);
    try {
      let msgs: InboxMessage[] = [];
      if (caseRow.thread_id) {
        const { data, error: msgErr } = await supabase
          .from("inbox_messages")
          .select("id,sender,body_text,attachment_storage_paths,created_at,edited_at,case_id")
          .eq("thread_id", caseRow.thread_id)
          .order("created_at", { ascending: true });
        if (msgErr) throw msgErr;
        msgs = ((data ?? []) as (InboxMessage & { case_id?: string | null })[]).filter(
          (m) => m.case_id === caseRow.id || m.case_id == null,
        );
      } else {
        const { data, error: msgErr } = await supabase
          .from("inbox_messages")
          .select("id,sender,body_text,attachment_storage_paths,created_at,edited_at")
          .eq("case_id", caseRow.id)
          .order("created_at", { ascending: true });
        if (msgErr) throw msgErr;
        msgs = (data ?? []) as unknown as InboxMessage[];
      }
      if (gen !== loadDetailGenRef.current) return;
      setMessages(msgs);

      const paths = (msgs ?? []).flatMap((m: InboxMessage) => m.attachment_storage_paths ?? []);
      if (paths.length) {
        try {
          await signAttachmentUrls(paths);
        } catch (signErr) {
          console.error("[AdminSupportInbox] attachment signing:", signErr);
        }
      }

      const { data: notes, error: noteErr } = await supabase
        .from("support_case_internal_notes")
        .select("id,body_text,created_at,admin_user_id")
        .eq("case_id", caseRow.id)
        .order("created_at", { ascending: true });
      if (noteErr) {
        console.error("[AdminSupportInbox] internal notes:", noteErr);
        setInternalNotes([]);
      } else {
        setInternalNotes((notes ?? []) as unknown as InternalNote[]);
      }

      await supabase
        .from("support_cases")
        .update({ admin_unread: false })
        .eq("id", caseRow.id);
      if (gen !== loadDetailGenRef.current) return;
      setAllCases((prev) =>
        prev.map((c) => (c.id === caseRow.id ? { ...c, admin_unread: false } : c)),
      );
    } catch (e) {
      console.error(e);
      if (gen === loadDetailGenRef.current) toast.error("Could not load case.");
    } finally {
      if (gen === loadDetailGenRef.current) setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (user === null) navigate("/login", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
      if (cancelled) return;
      setIsAdmin(error ? false : !!data?.user_id);
    })().catch(() => setIsAdmin(false));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (isAdmin !== true) return;
    void fetchCases();
  }, [isAdmin, fetchCases]);

  useEffect(() => {
    const caseId = searchParams.get("case");
    const userId = searchParams.get("user");
    if (!caseId && !userId) return;

    if (caseId) {
      const row = allCases.find((c) => c.id === caseId);
      if (!row) return;
      if (selectedCaseId === caseId && panel === "detail") return;
      setSelectedUserId(row.user_id);
      setSelectedCaseId(row.id);
      setPanel("detail");
      return;
    }

    if (userId) {
      const userCases = filterCasesBySearch(filterCasesForTab(allCases, tab), profiles, search).filter(
        (c) => c.user_id === userId,
      );
      if (userCases.length === 1) {
        openCase(userCases[0]);
        return;
      }
      setSelectedUserId(userId);
      setPanel("cases");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deep-link state only; avoid reload when allCases refreshes
  }, [searchParams, allCases, tab, search, profiles]);

  useEffect(() => {
    if (panel !== "detail" || !selectedCaseId) return;
    const row = allCases.find((c) => c.id === selectedCaseId);
    if (!row) return;
    void loadCaseDetail(row);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- do not reload when allCases refreshes (e.g. admin_unread)
  }, [panel, selectedCaseId, loadCaseDetail]);

  useEffect(() => {
    setEditingMessageId(null);
    setEditingBody("");
  }, [selectedCaseId]);

  const openUser = (group: UserCaseGroup) => {
    if (group.cases.length === 1) {
      openCase(group.cases[0]);
      return;
    }
    setSelectedUserId(group.user_id);
    setSelectedCaseId(null);
    setPanel("cases");
    setSearchParams({});
  };

  const openCase = (caseRow: SupportCaseRow) => {
    setSelectedUserId(caseRow.user_id);
    setSelectedCaseId(caseRow.id);
    setPanel("detail");
    setSearchParams({ case: caseRow.id });
    void loadCaseDetail(caseRow);
  };

  const setCaseStatus = async (caseId: string, status: "open" | "closed") => {
    try {
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = { status, updated_at: now };
      if (status === "closed") {
        patch.closed_at = now;
        patch.closed_by_admin_id = user?.id ?? null;
      } else {
        patch.closed_at = null;
        patch.closed_by_admin_id = null;
      }
      const { error } = await supabase.from("support_cases").update(patch).eq("id", caseId);
      if (error) throw error;
      setAllCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                status,
                updated_at: now,
                closed_at: status === "closed" ? now : null,
                closed_by_admin_id: status === "closed" ? user?.id ?? null : null,
              }
            : c,
        ),
      );
      toast.success(status === "closed" ? "Case closed" : "Case reopened");
    } catch (e) {
      console.error(e);
      toast.error("Could not update case status.");
    }
  };

  const sendReply = async () => {
    const body = reply.trim();
    if (!body || !selectedCase) return;
    setSending(true);
    try {
      const now = new Date().toISOString();
      const { data: insertedMsg, error: msgErr } = await supabase
        .from("inbox_messages")
        .insert({
          thread_id: selectedCase.thread_id,
          case_id: selectedCase.id,
          sender: "support",
          body_text: body,
          created_at: now,
        })
        .select("id")
        .single();
      if (msgErr) throw msgErr;

      const preview = body.slice(0, 240);
      await supabase
        .from("support_cases")
        .update({
          latest_message_preview: preview,
          updated_at: now,
          user_unread: true,
          admin_unread: false,
        })
        .eq("id", selectedCase.id);

      if (selectedCase.thread_id) {
        await supabase
          .from("inbox_threads")
          .update({ last_message_at: now, updated_at: now })
          .eq("id", selectedCase.thread_id);
      }

      setReply("");
      const refreshed = allCases.find((c) => c.id === selectedCase.id) ?? selectedCase;
      await loadCaseDetail({ ...refreshed, latest_message_preview: preview });
      await fetchCases();
      void supabase.functions
        .invoke("send-help-request-reply-push", {
          body: { case_id: selectedCase.id, message_id: insertedMsg.id },
        })
        .then(({ data, error }) => {
          if (error) {
            console.warn("[AdminSupportInbox] help reply push failed:", error, data);
          }
        });
      toast.success("Reply sent");
    } catch (e) {
      console.error(e);
      toast.error("Could not send reply.");
    } finally {
      setSending(false);
    }
  };

  const startEditing = (m: InboxMessage) => {
    if (m.sender !== "support") return;
    setEditingMessageId(m.id);
    setEditingBody(m.body_text);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingBody("");
  };

  const saveEditing = async (messageId: string) => {
    const next = editingBody.trim();
    if (!next || !selectedCase) return;
    setSavingEdit(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("inbox_messages")
        .update({ body_text: next, edited_at: now })
        .eq("id", messageId);
      if (error) throw error;

      const isLatest = messages.length > 0 && messages[messages.length - 1].id === messageId;
      if (isLatest) {
        const preview = next.slice(0, 240);
        await supabase
          .from("support_cases")
          .update({ latest_message_preview: preview, updated_at: now })
          .eq("id", selectedCase.id);
      }

      toast.success("Reply updated");
      cancelEditing();
      await loadCaseDetail(selectedCase);
      await fetchCases();
    } catch (e) {
      console.error(e);
      toast.error("Could not update message.");
    } finally {
      setSavingEdit(false);
    }
  };

  const addInternalNote = async () => {
    const body = internalNote.trim();
    if (!body || !selectedCase || !user?.id) return;
    setSending(true);
    try {
      const { error } = await supabase.from("support_case_internal_notes").insert({
        case_id: selectedCase.id,
        admin_user_id: user.id,
        body_text: body,
      });
      if (error) throw error;
      setInternalNote("");
      await loadCaseDetail(selectedCase);
      toast.success("Note saved");
    } catch (e) {
      console.error(e);
      toast.error("Could not save note.");
    } finally {
      setSending(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  if (user === null) return null;

  if (isAdmin === false) {
    return (
      <div className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-20 md:pb-0")}>
        {isMobile && (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        )}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-10">
          <Card className={cn("max-w-xl", theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-5 sm:p-6") : "p-5 sm:p-6")}>
            <p className="text-base font-semibold text-foreground">Not authorized</p>
          </Card>
        </div>
      </div>
    );
  }

  const displayName = (g: UserCaseGroup) =>
    g.first_name?.trim() ? `${g.first_name.trim()} (${g.email})` : g.email || g.user_id;

  return (
    <div
      className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-20 md:pb-0")}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}
      <div
        className="min-h-screen"
        style={
          !isMobile
            ? { marginLeft: sidebarCollapsed ? "64px" : "256px", transition: "margin-left 300ms ease-in-out" }
            : {}
        }
      >
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
            style={isMobile ? (theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }) : { ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }), top: "var(--app-safe-area-top)", left: sidebarCollapsed ? "64px" : "256px", right: "0", transition: "left 300ms ease-in-out" }}
          >
            <div
              className={cn(
                "px-4 sm:px-6 w-full flex items-center justify-between",
                !isMobile ? "" : "container mx-auto",
              )}
            >
              <h1 className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"} onClick={() => navigate("/dashboard")}>
                Support Inbox
              </h1>
              {isMobile && (
                <div className="flex items-center gap-2">
                  <MobilePWAMenu />
                </div>
              )}
            </div>
          </header>

          <main
            className={cn(
              "px-4 sm:px-6 max-w-6xl pb-24 md:pb-8 relative z-10",
              !isMobile ? "pt-16" : "",
              !isMobile ? "" : "container mx-auto",
            )}
          >
            <div className="py-3 sm:py-4 space-y-4">
              <Tabs value={tab} onValueChange={(v) => setTab(v as AdminInboxTab)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="open">Open Cases</TabsTrigger>
                  <TabsTrigger value="closed">Closed Cases</TabsTrigger>
                  <TabsTrigger value="all_users">All Users</TabsTrigger>
                </TabsList>
              </Tabs>

              <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4") : "p-4")}>
                <Label htmlFor="case-search">Search</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="case-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Email, user id, title, message, type…"
                  />
                  <Button type="button" variant="outline" onClick={() => void fetchCases()} disabled={loading}>
                    Refresh
                  </Button>
                </div>
              </Card>

              {panel === "list" ? (
                <div className="space-y-3">
                  {loading ? (
                    <p className={cn("text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>Loading…</p>
                  ) : userGroups.length === 0 ? (
                    <p className={cn("text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>No cases in this view.</p>
                  ) : (
                    userGroups.map((g) => (
                      <Card
                        key={g.user_id}
                        className={cn(
                          theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 cursor-pointer transition-colors hover:bg-muted/30") : "p-4 cursor-pointer transition-colors hover:bg-muted/30",
                        )}
                        onClick={() => openUser(g)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground truncate">{displayName(g)}</p>
                            <p className={cn("text-[11px] truncate", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{g.user_id}</p>
                          </div>
                          <div className="flex shrink-0 flex-wrap justify-end gap-1">
                            <Badge variant="outline">{messageTypeLabel(g.latest_case_type)}</Badge>
                            {g.admin_needs_response ? (
                              <Badge className="bg-primary text-primary-foreground">Needs reply</Badge>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-foreground/90 line-clamp-2">{g.latest_preview}</p>
                        <p className={cn("mt-2 text-[11px]", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                          {g.open_count} open · {g.closed_count} closed · Last activity {formatWhen(g.latest_activity)}
                        </p>
                        <div className="mt-3">
                          <Button type="button" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openUser(g); }}>
                            {g.cases.length === 1 ? "Open" : `View cases (${g.cases.length})`}
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              ) : null}

              {panel === "cases" && selectedUserGroup ? (
                <div className="space-y-3">
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setPanel("list"); setSelectedUserId(null); }}>
                    ← Back to users
                  </Button>
                  <p className="text-base font-semibold text-foreground">{displayName(selectedUserGroup)}</p>
                  {selectedUserGroup.cases.map((c) => (
                    <Card
                      key={c.id}
                      className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 cursor-pointer hover:bg-muted/30") : "p-4 cursor-pointer hover:bg-muted/30")}
                      onClick={() => openCase(c)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{messageTypeLabel(c.message_type)}</Badge>
                        <Badge variant={c.status === "open" ? "default" : "secondary"}>
                          {c.status === "open" ? "Open" : "Closed"}
                        </Badge>
                        {c.admin_unread ? <Badge variant="destructive">Unread</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground">{c.subject}</p>
                      <p className="mt-1 text-sm text-foreground/85 line-clamp-2">{c.latest_message_preview}</p>
                      <p className={cn("mt-2 text-[11px]", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{formatWhen(c.updated_at)}</p>
                      <Button type="button" size="sm" className="mt-3" onClick={(e) => { e.stopPropagation(); openCase(c); }}>
                        Open
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : null}

              {panel === "detail" && selectedCase ? (
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedUserGroup && selectedUserGroup.cases.length > 1) {
                        setPanel("cases");
                        setSelectedCaseId(null);
                        setSearchParams(selectedUserId ? { user: selectedUserId } : {});
                      } else {
                        setPanel("list");
                        setSelectedUserId(null);
                        setSelectedCaseId(null);
                        setSearchParams({});
                      }
                    }}
                  >
                    ← Back to {selectedUserGroup && selectedUserGroup.cases.length > 1 ? "cases" : "users"}
                  </Button>

                  <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6") : "p-4 sm:p-6")}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-foreground">
                          {profiles[selectedCase.user_id]?.first_name ?? selectedCase.user_email}
                        </p>
                        <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{selectedCase.user_email}</p>
                        <p className={cn("text-xs font-mono", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{selectedCase.user_id}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">{messageTypeLabel(selectedCase.message_type)}</Badge>
                        <Badge variant={selectedCase.status === "open" ? "default" : "secondary"}>
                          {selectedCase.status === "open" ? "Open" : "Closed"}
                        </Badge>
                      </div>
                    </div>
                    <p className={cn("mt-2 text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                      Created {formatWhen(selectedCase.created_at)} · Updated {formatWhen(selectedCase.updated_at)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => void copyText(selectedCase.user_email, "Email")}>
                        Copy email
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => void copyText(selectedCase.user_id, "User id")}>
                        Copy user id
                      </Button>
                      {selectedCase.status === "open" ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => void setCaseStatus(selectedCase.id, "closed")}>
                          Mark closed
                        </Button>
                      ) : (
                        <Button type="button" size="sm" variant="outline" onClick={() => void setCaseStatus(selectedCase.id, "open")}>
                          Reopen
                        </Button>
                      )}
                    </div>
                  </Card>

                  <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4") : "p-4")}>
                    <p className="text-sm font-semibold text-foreground">Original submission</p>
                    {selectedCase.tool_label ? (
                      <p className={cn("mt-1 text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                        {selectedCase.tool_label}
                        {selectedCase.tool_or_area ? ` · ${selectedCase.tool_or_area}` : ""}
                      </p>
                    ) : null}
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{selectedCase.original_submission_text}</p>
                    {selectedCase.attachment_storage_paths?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedCase.attachment_storage_paths.map((p) => (
                          <a
                            key={p}
                            href={attachmentUrlMap[p]}
                            target="_blank"
                            rel="noreferrer"
                            className="h-16 w-16 overflow-hidden rounded-md border border-border bg-muted/20"
                            onMouseEnter={() => {
                              if (attachmentUrlMap[p]) return;
                              void signAttachmentUrls([p]).catch(() => {});
                            }}
                          >
                            {attachmentUrlMap[p] ? (
                              <img src={attachmentUrlMap[p]} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                Image
                              </span>
                            )}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </Card>

                  <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4") : "p-4")}>
                    <p className="text-sm font-semibold text-foreground">Messages</p>
                    {loadingDetail ? (
                      <p className={cn("mt-2 text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>Loading…</p>
                    ) : messages.length === 0 ? (
                      <p className={cn("mt-2 text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>No messages yet.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {messages.map((m) => (
                          <div
                            key={m.id}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-sm",
                              m.sender === "support" ? "border-primary/25 bg-primary/10" : "border-border bg-muted/20",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className={cn("text-[11px]", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                                {m.sender === "support" ? "Palette Plotting" : "User"} · {formatWhen(m.created_at)}
                                {m.edited_at ? " · edited" : ""}
                              </p>
                              {m.sender === "support" ? (
                                editingMessageId === m.id ? (
                                  <div className="flex shrink-0 gap-1">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => void saveEditing(m.id)}
                                      disabled={savingEdit || !editingBody.trim()}
                                    >
                                      {savingEdit ? "Saving…" : "Save"}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={cancelEditing}
                                      disabled={savingEdit}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button type="button" size="sm" variant="ghost" onClick={() => startEditing(m)}>
                                    Edit
                                  </Button>
                                )
                              ) : null}
                            </div>
                            {editingMessageId === m.id ? (
                              <Textarea
                                value={editingBody}
                                onChange={(e) => setEditingBody(e.target.value)}
                                rows={3}
                                className="min-h-[80px] resize-y text-sm"
                              />
                            ) : (
                              <p className="whitespace-pre-wrap text-foreground">{m.body_text}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4") : "p-4")}>
                    <Label htmlFor="admin-reply">Reply to user</Label>
                    <Textarea
                      id="admin-reply"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={3}
                      className="mt-2 min-h-[88px]"
                      placeholder="Write a reply…"
                    />
                    <Button type="button" className="mt-2" disabled={sending || !reply.trim()} onClick={() => void sendReply()}>
                      {sending ? "Sending…" : "Send reply"}
                    </Button>
                  </Card>

                  <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 border-dashed") : "p-4 border-dashed")}>
                    <p className="text-sm font-semibold text-foreground">Internal notes (admin only)</p>
                    {internalNotes.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {internalNotes.map((n) => (
                          <div key={n.id} className="rounded-md border border-border/60 bg-muted/15 px-3 py-2 text-sm">
                            <p className={cn("text-[11px]", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{formatWhen(n.created_at)}</p>
                            <p className="whitespace-pre-wrap text-foreground">{n.body_text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={cn("mt-2 text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>No internal notes yet.</p>
                    )}
                    <Textarea
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      rows={2}
                      className="mt-3 min-h-[72px]"
                      placeholder="Add an internal note…"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      disabled={sending || !internalNote.trim()}
                      onClick={() => void addInternalNote()}
                    >
                      Add note
                    </Button>
                  </Card>
                </div>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
