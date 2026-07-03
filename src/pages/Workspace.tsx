import { useEffect, useState, type ReactNode } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import {

  BookOpen,

  ChevronRight,

  FolderKanban,

  LayoutGrid,

  Lock,

  Sparkles,

} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

import { usePlottingPro } from "@/hooks/usePlottingPro";

import { useTheme } from "@/contexts/ThemeContext";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { useTranslation } from "react-i18next";

import { fetchUserWorkspaces } from "@/lib/boards/api";

import type { BoardWorkspace } from "@/lib/boards/types";

import { SETUP_PRIMARY_CTA_CLASS } from "@/lib/onboardingSetupTheme";
import { COMMUNITY_IN_APP_ENABLED } from "@/lib/communityRelease";

import { WorkspaceHeader, workspaceShellClass } from "@/components/workspace/WorkspaceHeader";

import { LibraryReader } from "@/components/workspace/LibraryReader";

import {

  FREE_LIBRARY_GUIDES,

  getFreeLibraryGuide,

} from "@/pages/workspace/freeLibraryGuides";



type WorkspaceTab = "library" | "create" | "projects";



const CREATE_STARTERS = [

  { labelKey: "workspace.create.starters.vision", path: "/dashboard/boards" },

  { labelKey: "workspace.create.starters.home", path: "/dashboard/boards" },

  { labelKey: "workspace.create.starters.kanban", path: "/dashboard/boards" },

  { labelKey: "workspace.create.starters.mood", path: "/dashboard/boards" },

] as const;



const CATEGORY_LABEL_KEYS: Record<string, string> = {

  life_rebranding: "workspace.library.categories.lifeRebrand",

  moodboarding: "workspace.library.categories.moodboard",

  home_organization: "workspace.library.categories.homeOrg",

  office_work: "workspace.library.categories.office",

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

        dark ? "bg-black/88" : "bg-[#faf8f5]/88",

      )}

    >

      <div className="max-w-sm text-center">

        <div

          className={cn(

            "mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full",

            dark ? "bg-white/10 text-white/70" : "bg-zinc-100 text-zinc-500",

          )}

        >

          <Lock className="h-5 w-5" strokeWidth={1.75} aria-hidden />

        </div>

        <h3 className={cn("font-welcome-serif text-xl", dark ? "text-white" : "text-zinc-900")}>{title}</h3>

        <p className={cn("mt-2 text-sm leading-relaxed", dark ? "text-white/55" : "text-zinc-500")}>{body}</p>

        <Button onClick={onUpgrade} className={cn("mt-5 w-full", SETUP_PRIMARY_CTA_CLASS)}>

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

            ? "border-transparent text-white/50 hover:text-white/75"

            : "border-transparent text-zinc-500 hover:text-zinc-700",

      )}

    >

      {label}

      {locked ? <Lock className={cn("h-3 w-3", dark ? "text-white/35" : "text-zinc-400")} aria-hidden /> : null}

    </button>

  );

}



export default function Workspace() {

  const { t } = useTranslation("dashboard");

  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const { user } = useAuth();

  const { hasPro, loading } = usePlottingPro();

  const { theme } = useTheme();

  const dark = theme === "dark";

  const [workspaces, setWorkspaces] = useState<BoardWorkspace[]>([]);



  const tabParam = searchParams.get("tab");

  const tab: WorkspaceTab =

    tabParam === "create" || tabParam === "projects" || tabParam === "library" || tabParam === "tips"

      ? tabParam === "tips"

        ? "library"

        : tabParam

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



  const goUpgrade = () => navigate("/resubscribe");



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

        active={tab === "create"}

        locked={!hasPro}

        label={t("workspace.tabs.create")}

        onClick={() => setTab("create")}

        dark={dark}

      />

      <TabButton

        active={tab === "projects"}

        locked={!hasPro}

        label={t("workspace.tabs.projects")}

        onClick={() => setTab("projects")}

        dark={dark}

      />

    </>

  );



  const cardClass = cn(

    "rounded-xl border shadow-sm transition-colors",

    dark ? "border-white/10 bg-white/[0.04] hover:border-white/20" : "border-zinc-200/80 bg-white hover:border-zinc-300",

  );



  let panel: ReactNode = null;



  if (tab === "library") {

    if (activeGuide) {

      panel = <LibraryReader guide={activeGuide} dark={dark} onBack={closeReader} />;

    } else {

      panel = (

        <div className="space-y-3">

          <p className={cn("text-sm", dark ? "text-white/55" : "text-zinc-500")}>{t("workspace.library.lead")}</p>

          {FREE_LIBRARY_GUIDES.map((guide) => (

            <button

              key={guide.slug}

              type="button"

              onClick={() => openReader(guide.slug)}

              className={cn("flex w-full items-stretch gap-0 overflow-hidden text-left", cardClass)}

            >

              {guide.coverImage ? (

                <div className={cn("relative w-24 shrink-0 sm:w-28", dark ? "bg-white/5" : "bg-zinc-100")}>

                  <img

                    src={guide.coverImage}

                    alt=""

                    className="h-full min-h-[5.5rem] w-full object-cover"

                    loading="lazy"

                    decoding="async"

                  />

                </div>

              ) : (

                <span

                  className={cn(

                    "flex w-24 shrink-0 items-center justify-center sm:w-28",

                    dark ? "bg-white/10 text-white/80" : "bg-[#f3f0eb] text-zinc-600",

                  )}

                >

                  <BookOpen className="h-5 w-5" strokeWidth={1.75} />

                </span>

              )}

              <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-4">

                <span className={cn("text-[11px] font-semibold uppercase tracking-wider", dark ? "text-white/40" : "text-zinc-400")}>

                  {t(CATEGORY_LABEL_KEYS[guide.category])}

                </span>

                <span className={cn("mt-0.5 block text-sm font-semibold", dark ? "text-white" : "text-zinc-900")}>

                  {guide.title}

                </span>

                <span className={cn("mt-1 block text-xs leading-relaxed", dark ? "text-white/50" : "text-zinc-500")}>

                  {guide.tagline} · {guide.readMinutes} min

                </span>

              </span>

              <ChevronRight className={cn("my-auto mr-4 h-4 w-4 shrink-0", dark ? "text-white/35" : "text-zinc-400")} />

            </button>

          ))}

          <p className={cn("pt-2 text-center text-xs leading-relaxed", dark ? "text-white/40" : "text-zinc-400")}>

            {t("workspace.library.marketingNote")}

          </p>

        </div>

      );

    }

  }



  if (tab === "create") {

    panel = (

      <div className="relative min-h-[22rem]">

        <div

          className={cn(

            "flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border px-6 py-10 shadow-sm",

            dark ? "border-white/10 bg-white/[0.03]" : "border-zinc-200/80 bg-white",

          )}

        >

          <p

            className={cn(

              "mb-6 text-center font-welcome-serif text-2xl leading-snug sm:text-[1.65rem]",

              dark ? "text-white" : "text-zinc-900",

            )}

          >

            {t("workspace.create.prompt")}

          </p>

          <div

            className={cn(

              "w-full max-w-md rounded-2xl border px-4 py-3 text-sm",

              dark ? "border-white/10 bg-black text-white/35" : "border-zinc-200 bg-[#faf8f5] text-zinc-400",

            )}

          >

            {t("workspace.create.placeholder")}

          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">

            {CREATE_STARTERS.map((starter) => (

              <button

                key={starter.labelKey}

                type="button"

                onClick={() => hasPro && navigate(starter.path)}

                disabled={!hasPro}

                className={cn(

                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",

                  dark

                    ? "border-white/15 bg-white/[0.04] text-white/80 hover:border-white/25"

                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",

                )}

              >

                {t(starter.labelKey)}

              </button>

            ))}

          </div>

          {hasPro ? (

            <Button

              className={cn("mt-8", SETUP_PRIMARY_CTA_CLASS)}

              onClick={() => navigate("/dashboard/boards")}

            >

              {t("workspace.create.openBoards")}

            </Button>

          ) : null}

        </div>

        {!hasPro && !loading ? (

          <LockedOverlay

            dark={dark}

            title={t("workspace.locked.createTitle")}

            body={t("workspace.locked.createBody")}

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

            dark ? "border-white/10 bg-white/[0.03]" : "border-zinc-200/80 bg-white",

          )}

        >

          <div className="mb-4 flex items-center justify-between gap-3">

            <div>

              <h2 className={cn("font-welcome-serif text-xl", dark ? "text-white" : "text-zinc-900")}>

                {t("workspace.projects.title")}

              </h2>

              <p className={cn("mt-1 text-sm", dark ? "text-white/55" : "text-zinc-500")}>

                {t("workspace.projects.subtitle")}

              </p>

            </div>

            {hasPro ? (

              <Button

                variant="outline"

                size="sm"

                className={cn("rounded-lg", dark ? "border-white/15 text-white hover:bg-white/10" : "border-zinc-200")}

                onClick={() => navigate("/dashboard/boards")}

              >

                <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />

                {t("workspace.projects.open")}

              </Button>

            ) : null}

          </div>

          {hasPro ? (

            workspaces.length ? (

              <ul className="space-y-2">

                {workspaces.map((ws) => (

                  <li key={ws.id}>

                    <button

                      type="button"

                      onClick={() => navigate("/dashboard/boards")}

                      className={cn(

                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",

                        dark

                          ? "border-white/10 bg-white/[0.04] hover:border-white/20"

                          : "border-zinc-200/80 bg-[#faf8f5] hover:border-zinc-300",

                      )}

                    >

                      <FolderKanban className={cn("h-4 w-4 shrink-0", dark ? "text-white/50" : "text-zinc-500")} />

                      <span className={cn("min-w-0 flex-1 truncate text-sm font-medium", dark ? "text-white" : "text-zinc-900")}>

                        {ws.name}

                      </span>

                      <ChevronRight className={cn("h-4 w-4 shrink-0", dark ? "text-white/35" : "text-zinc-400")} />

                    </button>

                  </li>

                ))}

              </ul>

            ) : (

              <p

                className={cn(

                  "rounded-xl border border-dashed px-4 py-8 text-center text-sm",

                  dark ? "border-white/15 text-white/50" : "border-zinc-200 bg-[#faf8f5] text-zinc-500",

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

                  className={cn("h-14 rounded-xl border", dark ? "border-white/10 bg-white/[0.04]" : "border-zinc-200 bg-[#faf8f5]")}

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



  return (

    <div className={workspaceShellClass(dark)}>

      <WorkspaceHeader tabs={activeGuide ? undefined : tabs} />



      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">

        {tab === "library" && !activeGuide ? (

          <div className={cn("mb-5 flex items-center gap-2", dark ? "text-white/70" : "text-zinc-600")}>

            <Sparkles className="h-4 w-4 text-[#a87c84]" aria-hidden />

            <span className="text-sm font-medium">{t("workspace.library.heading")}</span>

          </div>

        ) : null}

        {loading && tab !== "library" ? (

          <div

            className={cn("min-h-[22rem] rounded-2xl border", dark ? "border-white/10 bg-white/[0.03]" : "border-zinc-200/80 bg-white")}

            aria-busy="true"

          />

        ) : (

          panel

        )}



        {hasPro ? (

          <p className={cn("mt-8 text-center text-xs", dark ? "text-white/35" : "text-zinc-400")}>

            <button

              type="button"

              onClick={() => navigate("/dashboard")}

              className="underline-offset-2 hover:underline"

            >

              {t("workspace.proDashboardLink")}

            </button>

          </p>

        ) : null}

      </main>

    </div>

  );

}


