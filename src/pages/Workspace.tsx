import { useEffect, useState, type ReactNode } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import {

  ChevronRight,

  Lock,

  MoreVertical,

  Plus,

} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

import { usePlottingPro } from "@/hooks/usePlottingPro";

import { useTheme } from "@/contexts/ThemeContext";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";

import { useTranslation } from "react-i18next";

import { MobileBottomInlet } from "@/components/MobileBottomInlet";

import { supabase } from "@/integrations/supabase/client";
import { fetchUserWorkspaces, createWorkspaceFromTemplate, updateWorkspaceName, deleteWorkspace } from "@/lib/boards/api";
import { DEFAULT_FOUR_BOARD_TEMPLATE, type BoardStarterTemplate } from "@/lib/boards/starterTemplates";

import type { BoardWorkspace } from "@/lib/boards/types";

import { SETUP_PRIMARY_CTA_CLASS } from "@/lib/onboardingSetupTheme";
import { COMMUNITY_IN_APP_ENABLED } from "@/lib/communityRelease";
import { toast } from "sonner";

import { WorkspaceHeader, workspaceShellClass } from "@/components/workspace/WorkspaceHeader";

import { LibraryReader } from "@/components/workspace/LibraryReader";
import { BoardImagePicker } from "@/components/boards/BoardImagePicker";

import {

  FREE_LIBRARY_GUIDES,

  getFreeLibraryGuide,

} from "@/pages/workspace/freeLibraryGuides";



type WorkspaceTab = "library" | "images" | "projects" | "orders";

const WORKSPACE_TABS: WorkspaceTab[] = ["library", "images", "projects", "orders"];

type BoardOrderLine = { title: string; quantity: number; unit_amount: number };
type BoardOrderRow = {
  id: string;
  status: string;
  currency: string;
  amount_total: number | null;
  amount_subtotal: number;
  lines: BoardOrderLine[];
  created_at: string;
};

type NewSetOrientation = "portrait" | "landscape";

const LANDSCAPE_ARTBOARD = { width: 1350, height: 1080 };

function templateWithOrientation(
  template: BoardStarterTemplate,
  orientation: NewSetOrientation,
): BoardStarterTemplate {
  if (orientation === "portrait") return template;
  return {
    ...template,
    boards: template.boards.map((board) => ({
      ...board,
      artboard_width: LANDSCAPE_ARTBOARD.width,
      artboard_height: LANDSCAPE_ARTBOARD.height,
    })),
  };
}



const GUIDE_CATEGORY_LABEL_KEYS: Record<string, string> = {

  "life-rebrand": "workspace.library.categories.lifeRebrand",

  "home-organization": "workspace.library.categories.homeOrg",

  "office-optimization": "workspace.library.categories.office",

};



function LockedOverlay({

  title,

  body,

  onUpgrade,

  upgradeLabel,

  dark,

}: {

  title: string;

  body: string;

  onUpgrade: () => void;

  upgradeLabel: string;

  dark: boolean;

}) {

  return (

    <div

      className={cn(

        "absolute inset-0 z-20 flex items-center justify-center rounded-2xl p-6 backdrop-blur-[2px]",

        dark ? "bg-black" : "bg-[#faf8f5]/88",

      )}

    >

      <div className="max-w-sm text-center">

        <div

          className={cn(

            "mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full",

            dark ? "border border-white bg-black text-white" : "bg-zinc-100 text-zinc-500",

          )}

        >

          <Lock className="h-5 w-5" strokeWidth={1.75} aria-hidden />

        </div>

        <h3 className={cn("font-welcome-serif text-xl", dark ? "text-white" : "text-zinc-900")}>{title}</h3>

        <p className={cn("mt-2 text-sm leading-relaxed", dark ? "text-white" : "text-zinc-500")}>{body}</p>

        <Button onClick={onUpgrade} className={cn("mt-5 w-full", dark ? "h-12 rounded-xl border border-white bg-white font-semibold text-black hover:bg-white" : SETUP_PRIMARY_CTA_CLASS)}>

          {upgradeLabel}

        </Button>

      </div>

    </div>

  );

}



function TabButton({

  active,

  locked,

  label,

  onClick,

  dark,

}: {

  active: boolean;

  locked: boolean;

  label: string;

  onClick: () => void;

  dark: boolean;

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      className={cn(

        "relative flex items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors",

        active

          ? dark

            ? "border-white text-white"

            : "border-zinc-900 text-zinc-900"

          : dark

            ? "border-transparent text-white hover:underline"

            : "border-transparent text-zinc-500 hover:text-zinc-700",

      )}

    >

      {label}

      {locked ? <Lock className={cn("h-3 w-3", dark ? "text-white" : "text-zinc-400")} aria-hidden /> : null}

    </button>

  );

}



export default function Workspace() {

  const { t } = useTranslation(["dashboard", "tools"]);

  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const { user } = useAuth();

  const { hasPro, loading } = usePlottingPro();

  const { theme } = useTheme();

  const dark = theme === "dark";

  const [workspaces, setWorkspaces] = useState<BoardWorkspace[]>([]);
  const [creatingSet, setCreatingSet] = useState(false);
  const [renamingWorkspace, setRenamingWorkspace] = useState<BoardWorkspace | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<BoardWorkspace | null>(null);
  const [deletingSet, setDeletingSet] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [savingRename, setSavingRename] = useState(false);
  const [orders, setOrders] = useState<BoardOrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const tabParam = searchParams.get("tab");

  const tab: WorkspaceTab =
    tabParam === "tips"
      ? "library"
      : tabParam === "new-board" || tabParam === "create"
        ? "projects"
        : WORKSPACE_TABS.includes(tabParam as WorkspaceTab)
          ? (tabParam as WorkspaceTab)
          : "library";



  const readerSlug = searchParams.get("reader");

  const activeGuide = readerSlug ? getFreeLibraryGuide(readerSlug) : undefined;



  const setTab = (next: WorkspaceTab) => {

    setSearchParams({ tab: next }, { replace: true });

  };

  const openReader = (slug: string) => {

    setSearchParams({ tab: "library", reader: slug }, { replace: false });

  };



  const closeReader = () => {

    setSearchParams({ tab: "library" }, { replace: true });

  };



  useEffect(() => {

    if (tabParam === "new-board" || tabParam === "create") {

      setSearchParams({ tab: "projects" }, { replace: true });

    }

  }, [tabParam, setSearchParams]);



  useEffect(() => {

    document.title = t("workspace.pageTitle");

  }, [t]);



  useEffect(() => {

    if (!user?.id || !hasPro) {

      setWorkspaces([]);

      return;

    }

    let cancelled = false;

    void (async () => {

      try {

        const rows = await fetchUserWorkspaces(user.id);

        if (!cancelled) setWorkspaces(rows);

      } catch {

        if (!cancelled) setWorkspaces([]);

      }

    })();

    return () => {

      cancelled = true;

    };

  }, [user?.id, hasPro]);

  useEffect(() => {
    if (!user?.id) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }
    let cancelled = false;
    setOrdersLoading(true);
    void (async () => {
      const { data, error } = await supabase
        .from("board_orders")
        .select("id,status,currency,amount_total,amount_subtotal,lines,created_at")
        .in("status", ["paid", "fulfilled"])
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setOrders(error || !data ? [] : (data as BoardOrderRow[]));
      setOrdersLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const goUpgrade = () => navigate("/resubscribe");

  const startNewSet = async (orientation: NewSetOrientation) => {
    if (!user?.id || creatingSet) return;
    setCreatingSet(true);
    try {
      const setNumber = workspaces.length + 1;
      const name = workspaces.length === 0 ? "My first set" : `Set ${setNumber}`;
      const created = await createWorkspaceFromTemplate(
        user.id,
        templateWithOrientation(DEFAULT_FOUR_BOARD_TEMPLATE, orientation),
        name,
      );
      setWorkspaces((prev) => [created, ...prev]);
      navigate(`/dashboard/boards?workspace=${created.id}`);
    } catch {
      toast.error("Could not start a new set");
    } finally {
      setCreatingSet(false);
    }
  };

  const openRenameSet = (workspace: BoardWorkspace) => {
    setRenamingWorkspace(workspace);
    setRenameDraft(workspace.name);
  };

  const closeRenameSet = () => {
    if (savingRename) return;
    setRenamingWorkspace(null);
    setRenameDraft("");
  };

  const saveRenameSet = async () => {
    if (!renamingWorkspace || savingRename) return;
    const trimmed = renameDraft.trim();
    if (!trimmed) return;
    if (trimmed === renamingWorkspace.name) {
      closeRenameSet();
      return;
    }
    setSavingRename(true);
    try {
      await updateWorkspaceName(renamingWorkspace.id, trimmed);
      setWorkspaces((prev) =>
        prev.map((ws) => (ws.id === renamingWorkspace.id ? { ...ws, name: trimmed } : ws)),
      );
      setRenamingWorkspace(null);
      setRenameDraft("");
    } catch {
      toast.error(t("workspace.projects.renameError"));
    } finally {
      setSavingRename(false);
    }
  };

  const confirmDeleteSet = async () => {
    if (!deletingWorkspace || deletingSet) return;
    setDeletingSet(true);
    try {
      await deleteWorkspace(deletingWorkspace.id);
      setWorkspaces((prev) => prev.filter((ws) => ws.id !== deletingWorkspace.id));
      sessionStorage.removeItem("board-workspace-id");
      sessionStorage.removeItem(`board-accountability-map:${deletingWorkspace.id}`);
      setDeletingWorkspace(null);
      toast.success(t("workspace.projects.deleteSuccess"));
    } catch {
      toast.error(t("workspace.projects.deleteError"));
    } finally {
      setDeletingSet(false);
    }
  };



  const tabs = (

    <>

      <TabButton

        active={tab === "library" && !activeGuide}

        locked={false}

        label={t("workspace.tabs.library")}

        onClick={() => setTab("library")}

        dark={dark}

      />

      {COMMUNITY_IN_APP_ENABLED ? (
      <TabButton

        active={false}

        locked={false}

        label={t("workspace.tabs.community")}

        onClick={() => navigate("/workspace/community")}

        dark={dark}

      />
      ) : null}

      <TabButton

        active={tab === "images"}

        locked={!hasPro}

        label={t("workspace.tabs.images")}

        onClick={() => setTab("images")}

        dark={dark}

      />

      <TabButton

        active={tab === "projects"}

        locked={!hasPro}

        label={t("workspace.tabs.projects")}

        onClick={() => setTab("projects")}

        dark={dark}

      />

      <TabButton

        active={tab === "orders"}

        locked={false}

        label={t("workspace.tabs.orders")}

        onClick={() => setTab("orders")}

        dark={dark}

      />

    </>

  );



  const cardClass = cn(

    "rounded-xl border shadow-sm transition-colors",

    dark ? "border-white bg-black hover:border-white" : "border-zinc-200/80 bg-white hover:border-zinc-300",

  );



  let panel: ReactNode = null;



  if (tab === "library") {

    if (activeGuide) {

      panel = <LibraryReader guide={activeGuide} dark={dark} onBack={closeReader} />;

    } else {

      panel = (

        <div className="space-y-3">

          <p className={cn("text-sm", dark ? "text-white" : "text-zinc-500")}>{t("workspace.library.lead")}</p>

          {FREE_LIBRARY_GUIDES.map((guide) => (

            <button

              key={guide.slug}

              type="button"

              onClick={() => openReader(guide.slug)}

              className={cn("flex w-full items-stretch gap-0 overflow-hidden text-left", cardClass)}

            >

              <span
                className={cn(
                  "relative w-24 shrink-0 overflow-hidden sm:w-28",
                  dark ? "border-r border-white" : "border-r border-zinc-200/80",
                )}
              >
                <img
                  src={guide.coverImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>

              <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-4">

                <span className={cn("text-[11px] font-semibold uppercase tracking-wider", dark ? "text-white" : "text-zinc-400")}>

                  {t(GUIDE_CATEGORY_LABEL_KEYS[guide.slug])}

                </span>

                <span className={cn("mt-0.5 block text-sm font-semibold", dark ? "text-white" : "text-zinc-900")}>

                  {guide.title}

                </span>

                <span className={cn("mt-1 block text-xs leading-relaxed", dark ? "text-white" : "text-zinc-500")}>

                  {guide.subtitle}

                </span>

              </span>

              <ChevronRight className={cn("my-auto mr-4 h-4 w-4 shrink-0", dark ? "text-white" : "text-zinc-400")} />

            </button>

          ))}

        </div>

      );

    }

  }



  if (tab === "images") {

    panel = (

      <div className="relative min-h-[22rem]">

        <div

          className={cn(

            "min-h-[22rem] overflow-hidden rounded-2xl border shadow-sm",

            dark ? "border-white bg-black" : "border-zinc-200/80 bg-white",

          )}

        >

          <div className="border-b px-5 py-4">

            <h2 className={cn("font-welcome-serif text-base font-medium", dark ? "text-white" : "text-zinc-900")}>

              {t("workspace.imageLibrary.title")}

            </h2>

            <p className={cn("mt-1 text-xs leading-relaxed", dark ? "text-white/70" : "text-zinc-500")}>

              {t("workspace.imageLibrary.subtitle")}

            </p>

          </div>

          {hasPro && user?.id ? (

            <div className="h-[min(52vh,28rem)]">

              <BoardImagePicker embedded wideGrid uploadsOnly userId={user.id} />

            </div>

          ) : null}

        </div>

        {!hasPro && !loading ? (

          <LockedOverlay

            dark={dark}

            title={t("workspace.locked.imageLibraryTitle")}

            body={t("workspace.locked.imageLibraryBody")}

            onUpgrade={goUpgrade}

            upgradeLabel={t("workspace.locked.upgrade")}

          />

        ) : null}

      </div>

    );

  }



  if (tab === "projects") {

    panel = (

      <div className="relative min-h-[22rem]">

        <div

          className={cn(

            "min-h-[22rem] rounded-2xl border p-5 shadow-sm",

            dark ? "border-white bg-black" : "border-zinc-200/80 bg-white",

          )}

        >

          <div className="mb-4 space-y-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className={cn("font-welcome-serif text-xl", dark ? "text-white" : "text-zinc-900")}>
                {t("workspace.projects.title")}
              </h2>
              {hasPro ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "shrink-0 rounded-lg",
                        dark ? "border-white text-white hover:bg-white hover:text-black" : "border-zinc-200",
                      )}
                      disabled={creatingSet}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      {creatingSet ? t("workspace.projects.creating") : t("workspace.projects.startNewSet")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={dark ? "border-white bg-black text-white" : undefined}>
                    <DropdownMenuItem onClick={() => void startNewSet("portrait")}>
                      Portrait set
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void startNewSet("landscape")}>
                      Landscape set
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
            <p className={cn("text-sm", dark ? "text-white" : "text-zinc-500")}>
              {t("workspace.projects.subtitle")}
            </p>
          </div>

          {hasPro ? (

            workspaces.length ? (

              <ul className="space-y-2">

                {workspaces.map((ws) => (

                  <li key={ws.id}>

                    <div

                      className={cn(

                        "flex w-full items-center gap-1 rounded-xl border transition-colors",

                        dark

                          ? "border-white bg-black hover:border-white"

                          : "border-zinc-200/80 bg-[#faf8f5] hover:border-zinc-300",

                      )}

                    >

                      <button

                        type="button"

                        onClick={() => navigate(`/dashboard/boards?workspace=${ws.id}`)}

                        className={cn(

                          "flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left",

                        )}

                      >

                        <span
                          className={cn(
                            "inline-block h-4 w-3 shrink-0 rounded-[2px] border-[1.5px]",
                            dark ? "border-white/90" : "border-zinc-500",
                          )}
                          aria-hidden
                        />

                        <span className={cn("min-w-0 flex-1 truncate text-sm font-medium", dark ? "text-white" : "text-zinc-900")}>

                          {ws.name}

                        </span>

                      </button>

                      <DropdownMenu>

                        <DropdownMenuTrigger asChild>

                          <button

                            type="button"

                            aria-label={t("workspace.projects.rename")}

                            className={cn(

                              "mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",

                              dark

                                ? "text-white hover:bg-white/10"

                                : "text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800",

                            )}

                            onClick={(e) => e.stopPropagation()}

                          >

                            <MoreVertical className="h-4 w-4" />

                          </button>

                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className={dark ? "border-white bg-black text-white" : undefined}>

                          <DropdownMenuItem onClick={() => openRenameSet(ws)}>

                            {t("workspace.projects.rename")}

                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeletingWorkspace(ws)}
                          >
                            {t("workspace.projects.delete")}
                          </DropdownMenuItem>

                        </DropdownMenuContent>

                      </DropdownMenu>

                    </div>

                  </li>

                ))}

              </ul>

            ) : (

              <p

                className={cn(

                  "rounded-xl border border-dashed px-4 py-8 text-center text-sm",

                  dark ? "border-white text-white" : "border-zinc-200 bg-[#faf8f5] text-zinc-500",

                )}

              >

                {t("workspace.projects.empty")}

              </p>

            )

          ) : (

            <div className="grid gap-2 opacity-40">

              {[1, 2].map((n) => (

                <div

                  key={n}

                  className={cn("h-14 rounded-xl border", dark ? "border-white bg-black" : "border-zinc-200 bg-[#faf8f5]")}

                />

              ))}

            </div>

          )}

        </div>

        {!hasPro && !loading ? (

          <LockedOverlay

            dark={dark}

            title={t("workspace.locked.projectsTitle")}

            body={t("workspace.locked.projectsBody")}

            onUpgrade={goUpgrade}

            upgradeLabel={t("workspace.locked.upgrade")}

          />

        ) : null}

      </div>

    );

  }

  if (tab === "orders") {
    const formatOrderMoney = (cents: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
    const formatOrderDate = (iso: string) =>
      new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

    panel = (
      <div
        className={cn(
          "min-h-[22rem] rounded-2xl border p-5 shadow-sm",
          dark ? "border-white bg-black" : "border-zinc-200/80 bg-white",
        )}
      >
        <div className="mb-4">
          <h2 className={cn("font-welcome-serif text-xl", dark ? "text-white" : "text-zinc-900")}>
            {t("workspace.orders.title")}
          </h2>
          <p className={cn("mt-1 text-sm", dark ? "text-white" : "text-zinc-500")}>
            {t("workspace.orders.subtitle")}
          </p>
        </div>

        {ordersLoading ? (
          <p className={cn("text-sm", dark ? "text-white" : "text-zinc-500")}>
            {t("workspace.orders.loading")}
          </p>
        ) : orders.length === 0 ? (
          <div
            className={cn(
              "rounded-xl border border-dashed px-4 py-8 text-center text-sm",
              dark ? "border-white text-white" : "border-zinc-200 bg-[#faf8f5] text-zinc-500",
            )}
          >
            <p>{t("workspace.orders.empty")}</p>
            <a
              href="/dry-erase-boards"
              className={cn(
                "mt-3 inline-flex min-h-[40px] items-center justify-center rounded-lg px-4 text-sm font-medium",
                dark ? "border border-white text-white" : "bg-zinc-900 text-white hover:bg-zinc-800",
              )}
            >
              {t("workspace.orders.shopBoards")}
            </a>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li
                key={order.id}
                className={cn(
                  "rounded-xl border px-4 py-3",
                  dark ? "border-white bg-black" : "border-zinc-200/80 bg-[#faf8f5]",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={cn("text-xs", dark ? "text-white" : "text-zinc-400")}>
                    {formatOrderDate(order.created_at)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      dark ? "border border-white text-white" : "bg-zinc-900 text-white",
                    )}
                  >
                    {t(`workspace.orders.status.${order.status}`, { defaultValue: order.status })}
                  </span>
                </div>
                <ul className={cn("mt-2 space-y-1 text-sm", dark ? "text-white" : "text-zinc-700")}>
                  {(Array.isArray(order.lines) ? order.lines : []).map((line, i) => (
                    <li key={i} className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        {line.title} × {line.quantity}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {formatOrderMoney(line.unit_amount * line.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div
                  className={cn(
                    "mt-2 flex items-center justify-between border-t pt-2 text-sm font-medium",
                    dark ? "border-white text-white" : "border-zinc-200 text-zinc-900",
                  )}
                >
                  <span>{t("workspace.orders.totalLabel")}</span>
                  <span className="tabular-nums">
                    {formatOrderMoney(order.amount_total ?? order.amount_subtotal)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className={workspaceShellClass(dark)}>
      <MobileBottomInlet />

      <WorkspaceHeader tabs={activeGuide ? undefined : tabs} />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">

        {tab === "library" && !activeGuide ? (
          <h1 className={cn("mb-2 font-welcome-serif text-2xl", dark ? "text-white" : "text-zinc-900")}>
            {t("workspace.library.heading")}
          </h1>
        ) : null}

        {loading && tab !== "library" && tab !== "images" && tab !== "orders" ? (

          <div

            className={cn("min-h-[22rem] rounded-2xl border", dark ? "border-white bg-black" : "border-zinc-200/80 bg-white")}

            aria-busy="true"

          />

        ) : (

          panel

        )}


      </main>

      <Dialog open={!!renamingWorkspace} onOpenChange={(open) => { if (!open) closeRenameSet(); }}>
        <DialogContent className={dark ? "border-white bg-black text-white" : undefined}>
          <DialogHeader>
            <DialogTitle>{t("workspace.projects.renameTitle")}</DialogTitle>
          </DialogHeader>
          <label className="block">
            <span className="sr-only">{t("workspace.projects.renameLabel")}</span>
            <Input
              value={renameDraft}
              maxLength={80}
              disabled={savingRename}
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void saveRenameSet();
                }
              }}
              className={dark ? "border-white bg-black text-white" : undefined}
              autoFocus
            />
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={closeRenameSet} disabled={savingRename}>
              {t("workspace.projects.renameCancel")}
            </Button>
            <Button onClick={() => void saveRenameSet()} disabled={savingRename || !renameDraft.trim()}>
              {t("workspace.projects.renameSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingWorkspace}
        onOpenChange={(open) => {
          if (!open && !deletingSet) setDeletingWorkspace(null);
        }}
      >
        <AlertDialogContent className={dark ? "border-white bg-black text-white" : undefined}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("workspace.projects.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription className={dark ? "text-white/70" : undefined}>
              {t("workspace.projects.deleteDescription", { name: deletingWorkspace?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingSet}>{t("workspace.projects.deleteCancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingSet}
              onClick={(e) => {
                e.preventDefault();
                void confirmDeleteSet();
              }}
            >
              {deletingSet ? t("workspace.projects.deleting") : t("workspace.projects.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );

}


