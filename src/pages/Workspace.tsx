import { useEffect, useState, type ReactNode } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import {

  BookOpen,

  ChevronRight,

  FolderKanban,

  LayoutGrid,

  Lock,

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

import { ProgressMilestonesTabs } from "@/components/ProgressMilestonesTabs";
import { LibraryReader } from "@/components/workspace/LibraryReader";
import { BoardImagePicker } from "@/components/boards/BoardImagePicker";

import {

  FREE_LIBRARY_GUIDES,

  getFreeLibraryGuide,

} from "@/pages/workspace/freeLibraryGuides";



type WorkspaceTab = "library" | "journey" | "new-board" | "create" | "images" | "projects";

const WORKSPACE_TABS: WorkspaceTab[] = ["library", "journey", "new-board", "create", "images", "projects"];



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



  const tabParam = searchParams.get("tab");

  const tab: WorkspaceTab =
    tabParam === "tips"
      ? "library"
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

        active={tab === "journey"}

        locked={!hasPro}

        label={t("workspace.tabs.yourJourney")}

        onClick={() => setTab("journey")}

        dark={dark}

      />

      <TabButton

        active={tab === "new-board"}

        locked={!hasPro}

        label={t("workspace.tabs.newBoard")}

        onClick={() => setTab("new-board")}

        dark={dark}

      />

      <TabButton

        active={tab === "create"}

        locked={!hasPro}

        label={t("workspace.tabs.create")}

        onClick={() => setTab("create")}

        dark={dark}

      />

      <TabButton

        active={tab === "images"}

        locked={!hasPro}

        label={t("workspace.tabs.imageLibrary")}

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

              {guide.coverImage ? (

                <div className={cn("relative w-24 shrink-0 border-r sm:w-28", dark ? "border-white bg-black" : "bg-zinc-100")}>

                  <img

                    src={guide.coverImage}

                    alt={guide.title}

                    className="h-full min-h-[5.5rem] w-full object-cover"

                    loading="lazy"

                    decoding="async"

                  />

                </div>

              ) : (

                <span

                  className={cn(

                    "flex w-24 shrink-0 items-center justify-center sm:w-28",

                    dark ? "border-r border-white bg-black text-white" : "bg-[#f3f0eb] text-zinc-600",

                  )}

                >

                  <BookOpen className="h-5 w-5" strokeWidth={1.75} />

                </span>

              )}

              <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-4">

                <span className={cn("text-[11px] font-semibold uppercase tracking-wider", dark ? "text-white" : "text-zinc-400")}>

                  {t(CATEGORY_LABEL_KEYS[guide.category])}

                </span>

                <span className={cn("mt-0.5 block text-sm font-semibold", dark ? "text-white" : "text-zinc-900")}>

                  {guide.title}

                </span>

                <span className={cn("mt-1 block text-xs leading-relaxed", dark ? "text-white" : "text-zinc-500")}>

                  {guide.tagline} · {guide.readMinutes} min

                </span>

              </span>

              <ChevronRight className={cn("my-auto mr-4 h-4 w-4 shrink-0", dark ? "text-white" : "text-zinc-400")} />

            </button>

          ))}

          <p className={cn("pt-2 text-center text-xs leading-relaxed", dark ? "text-white" : "text-zinc-400")}>

            {t("workspace.library.marketingNote")}

          </p>

        </div>

      );

    }

  }



  if (tab === "journey") {

    panel = (

      <div className="relative min-h-[22rem]">

        <div className="space-y-4">

          <div>

            <p className={cn("text-sm leading-snug", dark ? "text-white" : "text-zinc-500")}>

              {t("tools:journey.subtitle")}

            </p>

            <h2 className={cn("mt-2 font-welcome-serif text-xl", dark ? "text-white" : "text-zinc-900")}>

              {t("tools:journey.yourProgress")}

            </h2>

          </div>

          {hasPro ? (

            <>

              <div className={cn("rounded-xl border p-4", cardClass)}>

                <ProgressMilestonesTabs syncHash={false} />

              </div>

              <button

                type="button"

                onClick={() => navigate("/dashboard/chrono")}

                className={cn("flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition-colors", cardClass)}

              >

                <span

                  className={cn(

                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",

                    dark ? "border-white bg-black text-white" : "border-zinc-200 bg-zinc-50 text-zinc-900",

                  )}

                >

                  <BookOpen className="h-4 w-4" />

                </span>

                <span className="min-w-0 flex-1">

                  <span className={cn("block text-sm font-semibold", dark ? "text-white" : "text-zinc-900")}>

                    {t("workspace.journey.journalTitle")}

                  </span>

                  <span className={cn("mt-0.5 block text-xs", dark ? "text-white" : "text-zinc-500")}>

                    {t("workspace.journey.journalDescription")}

                  </span>

                </span>

                <ChevronRight className={cn("h-4 w-4 shrink-0", dark ? "text-white" : "text-zinc-400")} />

              </button>

            </>

          ) : null}

        </div>

        {!hasPro && !loading ? (

          <LockedOverlay

            dark={dark}

            title={t("workspace.locked.journeyTitle")}

            body={t("workspace.locked.journeyBody")}

            onUpgrade={goUpgrade}

            upgradeLabel={t("workspace.locked.upgrade")}

          />

        ) : null}

      </div>

    );

  }



  if (tab === "new-board") {

    panel = (

      <div className="relative min-h-[22rem]">

        <div

          className={cn(

            "flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border px-6 py-10 shadow-sm",

            dark ? "border-white bg-black" : "border-zinc-200/80 bg-white",

          )}

        >

          <h2 className={cn("text-center font-welcome-serif text-2xl leading-snug sm:text-[1.65rem]", dark ? "text-white" : "text-zinc-900")}>

            {t("workspace.newBoard.title")}

          </h2>

          <p className={cn("mt-3 max-w-md text-center text-sm leading-relaxed", dark ? "text-white" : "text-zinc-500")}>

            {t("workspace.newBoard.subtitle")}

          </p>

          {hasPro ? (

            <Button

              className={cn(

                "mt-8",

                dark

                  ? "h-12 rounded-xl border border-white bg-white font-semibold text-black hover:bg-white"

                  : SETUP_PRIMARY_CTA_CLASS,

              )}

              onClick={() => navigate("/dashboard/boards")}

            >

              {t("workspace.newBoard.openBoards")}

            </Button>

          ) : null}

        </div>

        {!hasPro && !loading ? (

          <LockedOverlay

            dark={dark}

            title={t("workspace.locked.newBoardTitle")}

            body={t("workspace.locked.newBoardBody")}

            onUpgrade={goUpgrade}

            upgradeLabel={t("workspace.locked.upgrade")}

          />

        ) : null}

      </div>

    );

  }



  if (tab === "create") {

    panel = (

      <div className="relative min-h-[22rem]">

        <div

          className={cn(

            "flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border px-6 py-10 shadow-sm",

            dark ? "border-white bg-black" : "border-zinc-200/80 bg-white",

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

              dark ? "border-white bg-black text-white" : "border-zinc-200 bg-[#faf8f5] text-zinc-400",

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

                    ? "border-white bg-black text-white hover:bg-white hover:text-black"

                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",

                )}

              >

                {t(starter.labelKey)}

              </button>

            ))}

          </div>

          {hasPro ? (

            <Button

              className={cn("mt-8", dark ? "h-12 rounded-xl border border-white bg-white font-semibold text-black hover:bg-white" : SETUP_PRIMARY_CTA_CLASS)}

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

            <h2 className={cn("font-welcome-serif text-xl", dark ? "text-white" : "text-zinc-900")}>

              {t("workspace.imageLibrary.title")}

            </h2>

            <p className={cn("mt-1 text-sm leading-relaxed", dark ? "text-white" : "text-zinc-500")}>

              {t("workspace.imageLibrary.subtitle")}

            </p>

          </div>

          {hasPro && user?.id ? (

            <div className="h-[min(52vh,28rem)]">

              <BoardImagePicker embedded userId={user.id} />

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

          <div className="mb-4 flex items-center justify-between gap-3">

            <div>

              <h2 className={cn("font-welcome-serif text-xl", dark ? "text-white" : "text-zinc-900")}>

                {t("workspace.projects.title")}

              </h2>

              <p className={cn("mt-1 text-sm", dark ? "text-white" : "text-zinc-500")}>

                {t("workspace.projects.subtitle")}

              </p>

            </div>

            {hasPro ? (

              <Button

                variant="outline"

                size="sm"

                className={cn("rounded-lg", dark ? "border-white text-white hover:bg-white hover:text-black" : "border-zinc-200")}

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

                          ? "border-white bg-black hover:border-white"

                          : "border-zinc-200/80 bg-[#faf8f5] hover:border-zinc-300",

                      )}

                    >

                      <FolderKanban className={cn("h-4 w-4 shrink-0", dark ? "text-white" : "text-zinc-500")} />

                      <span className={cn("min-w-0 flex-1 truncate text-sm font-medium", dark ? "text-white" : "text-zinc-900")}>

                        {ws.name}

                      </span>

                      <ChevronRight className={cn("h-4 w-4 shrink-0", dark ? "text-white" : "text-zinc-400")} />

                    </button>

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



  return (

    <div className={workspaceShellClass(dark)}>

      <WorkspaceHeader tabs={activeGuide ? undefined : tabs} />



      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">

        {tab === "library" && !activeGuide ? (
          <h1 className={cn("mb-2 font-welcome-serif text-2xl", dark ? "text-white" : "text-zinc-900")}>
            {t("workspace.library.heading")}
          </h1>
        ) : null}

        {tab === "images" && hasPro ? (
          <h1 className={cn("mb-2 font-welcome-serif text-2xl", dark ? "text-white" : "text-zinc-900")}>
            {t("workspace.tabs.imageLibrary")}
          </h1>
        ) : null}

        {loading && tab !== "library" && tab !== "journey" && tab !== "new-board" ? (

          <div

            className={cn("min-h-[22rem] rounded-2xl border", dark ? "border-white bg-black" : "border-zinc-200/80 bg-white")}

            aria-busy="true"

          />

        ) : (

          panel

        )}


      </main>

    </div>

  );

}


