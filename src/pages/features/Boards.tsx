import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, LayoutGrid, Loader2, Plus, Printer, ScanLine, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import type { BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";
import { BoardReminderPanel } from "@/components/boards/BoardReminderPanel";
import { BoardDesktopGrid } from "@/components/boards/BoardDesktopGrid";
import { BoardPlottingWorkbench } from "@/components/boards/BoardPlottingWorkbench";
import { BoardPlotKitTray } from "@/components/boards/BoardPlotKitTray";
import { BoardMobileCarousel } from "@/components/boards/BoardMobileCarousel";
import {
  addBoard,
  createWorkspaceFromTemplate,
  deleteBoard,
  fetchBoardReminders,
  fetchUserWorkspaces,
  fetchWorkspaceWithBoards,
  saveBoardLayout,
  updateBoardMeta,
} from "@/lib/boards/api";
import type { BoardReminder, BoardWorkspaceWithBoards } from "@/lib/boards/types";
import type { BoardStarterTemplate } from "@/lib/boards/starterTemplates";
import { BoardTemplatePicker } from "@/components/boards/BoardTemplatePicker";
import { BoardPrintDialog } from "@/components/boards/BoardPrintDialog";
import { BoardPhysicalScanDialog } from "@/components/boards/BoardPhysicalScanDialog";
import { BoardImportDialog } from "@/components/boards/BoardImportDialog";
import { BoardWallpaperDialog } from "@/components/boards/BoardWallpaperDialog";
import { toast } from "sonner";
import "@/styles/board-editor.css";

export default function Boards() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const editorMapRef = useRef(new Map<string, BoardCanvasHandle>());
  const activeEditorRef = useRef<BoardCanvasHandle | null>(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [needsTemplate, setNeedsTemplate] = useState(false);
  const [workspace, setWorkspace] = useState<BoardWorkspaceWithBoards | null>(null);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [reminders, setReminders] = useState<BoardReminder[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showReminders, setShowReminders] = useState(!isMobile);
  const [printOpen, setPrintOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [wallpaperOpen, setWallpaperOpen] = useState(false);

  const selectBoard = useCallback((id: string) => {
    setActiveBoardId(id);
    activeEditorRef.current = editorMapRef.current.get(id) ?? null;
  }, []);

  const registerEditor = useCallback(
    (boardId: string, handle: BoardCanvasHandle | null) => {
      if (handle) editorMapRef.current.set(boardId, handle);
      else editorMapRef.current.delete(boardId);
      if (boardId === activeBoardId) activeEditorRef.current = handle;
    },
    [activeBoardId],
  );

  const activeBoard = useMemo(
    () => workspace?.boards.find((b) => b.id === activeBoardId) ?? workspace?.boards[0] ?? null,
    [workspace, activeBoardId],
  );

  const loadWorkspace = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const workspaces = await fetchUserWorkspaces(user.id);
      if (workspaces.length === 0) {
        setNeedsTemplate(true);
        setWorkspace(null);
        setActiveBoardId(null);
        return;
      }
      const full = await fetchWorkspaceWithBoards(workspaces[0].id);
      if (!full) throw new Error("workspace missing");
      setNeedsTemplate(false);
      setWorkspace(full);
      setActiveBoardId((prev) => {
        const nextId =
          prev && full.boards.some((b) => b.id === prev) ? prev : full.boards[0]?.id ?? null;
        if (nextId) activeEditorRef.current = editorMapRef.current.get(nextId) ?? null;
        return nextId;
      });
    } catch {
      toast.error("Could not load your boards");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleCreateFromTemplate = async (template: BoardStarterTemplate) => {
    if (!user?.id) return;
    setCreating(true);
    try {
      const ws = await createWorkspaceFromTemplate(user.id, template);
      setNeedsTemplate(false);
      setWorkspace(ws);
      selectBoard(ws.boards[0]?.id ?? "");
      toast.success("Board system created");
    } catch {
      toast.error("Could not create boards");
    } finally {
      setCreating(false);
    }
  };

  const loadReminders = useCallback(async (boardId: string) => {
    try {
      const rows = await fetchBoardReminders(boardId);
      setReminders(rows);
    } catch {
      setReminders([]);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (activeBoard?.id) void loadReminders(activeBoard.id);
  }, [activeBoard?.id, loadReminders]);

  useEffect(() => {
    document.title = "Boards | Palette Plotting";
  }, []);

  const handleSaveLayoutFor = useCallback(async (boardId: string, layout: Record<string, unknown>) => {
    try {
      await saveBoardLayout(boardId, layout);
      setWorkspace((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          boards: prev.boards.map((b) => (b.id === boardId ? { ...b, layout_json: layout } : b)),
        };
      });
    } catch {
      toast.error("Could not save board");
    }
  }, []);

  const handleBoardColorFromAi = useCallback(async (boardId: string, colorKey: string) => {
    try {
      await updateBoardMeta(boardId, { color_key: colorKey });
      setWorkspace((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          boards: prev.boards.map((b) => (b.id === boardId ? { ...b, color_key: colorKey } : b)),
        };
      });
    } catch {
      toast.error("Could not update board color");
    }
  }, []);

  const handlePickImage = useCallback(async (url: string) => {
    try {
      await activeEditorRef.current?.addImageFromUrl(url);
    } catch {
      toast.error("Could not add image");
    }
  }, []);

  const handleAddBoard = async () => {
    if (!workspace || !user?.id) return;
    const n = workspace.boards.length;
    try {
      const board = await addBoard(workspace.id, user.id, `Focus ${n}`, "focus", n);
      setWorkspace({ ...workspace, boards: [...workspace.boards, board] });
      selectBoard(board.id);
    } catch {
      toast.error("Could not add board");
    }
  };

  const handleRemoveBoard = async () => {
    if (!workspace || !activeBoard || workspace.boards.length <= 1) return;
    try {
      await deleteBoard(activeBoard.id);
      const next = workspace.boards.filter((b) => b.id !== activeBoard.id);
      setWorkspace({ ...workspace, boards: next });
      selectBoard(next[0]?.id ?? "");
    } catch {
      toast.error("Could not remove board");
    }
  };

  if (!user) return null;

  const boards = workspace?.boards ?? [];

  return (
    <div className="flex min-h-screen bg-[#ebe8e3]">
      {!isMobile && (
        <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />
      )}

      <div
        className="flex min-h-0 min-h-screen flex-1 flex-col transition-all duration-300"
        style={{
          marginLeft: !isMobile ? (sidebarCollapsed ? "4rem" : "16rem") : undefined,
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            {isMobile && <MobilePWAMenu />}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <LayoutGrid className="h-5 w-5 text-neutral-700" />
            <div>
              <h1 className="text-sm font-semibold text-neutral-900">Boards</h1>
              <p className="text-[11px] text-neutral-500">{workspace?.name ?? "Your board system"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {!isMobile && (
              <>
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleAddBoard}>
                  <Plus className="h-3.5 w-3.5" />
                  Board
                </Button>
                {boards.length > 1 && (
                  <Button variant="ghost" size="sm" className="text-xs text-neutral-500" onClick={handleRemoveBoard}>
                    Remove
                  </Button>
                )}
              </>
            )}
            <Button variant="outline" size="sm" className="hidden gap-1 text-xs md:flex" onClick={() => setScanOpen(true)}>
              <ScanLine className="h-3.5 w-3.5" />
              Scan
            </Button>
            <Button variant="outline" size="sm" className="hidden gap-1 text-xs md:flex" onClick={() => setImportOpen(true)}>
              <Copy className="h-3.5 w-3.5" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => setWallpaperOpen(true)}
              title="Phone wallpaper or lock screen"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Wallpaper</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setPrintOpen(true)}>
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setShowReminders((v) => !v)}
            >
              {showReminders ? "Hide" : "Reminders"}
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : needsTemplate ? (
          <BoardTemplatePicker onSelect={handleCreateFromTemplate} loading={creating} />
        ) : !workspace || !activeBoard ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : isMobile ? (
          <div className="flex min-h-0 flex-1 flex-col pb-[4.25rem]">
            <BoardMobileCarousel
              boards={boards}
              activeId={activeBoard.id}
              onSelect={selectBoard}
              onSave={handleSaveLayoutFor}
              onAddBoard={handleAddBoard}
              registerEditor={registerEditor}
            />
            {showReminders && (
              <div className="max-h-[40vh] shrink-0 overflow-hidden border-t border-stone-300/80">
                <BoardReminderPanel
                  board={activeBoard}
                  userId={user.id}
                  reminders={reminders}
                  onRefresh={() => void loadReminders(activeBoard.id)}
                />
              </div>
            )}
            <BoardPlotKitTray
              boards={boards}
              activeBoard={activeBoard}
              activeBoardId={activeBoard.id}
              editorRef={activeEditorRef}
              userId={user.id}
              onSelectBoard={selectBoard}
              onBoardColorChange={handleBoardColorFromAi}
              onPickImage={handlePickImage}
              onScanPhysical={() => setScanOpen(true)}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-row">
            <BoardPlottingWorkbench
              boards={boards}
              activeBoard={activeBoard}
              activeBoardId={activeBoard.id}
              editorRef={activeEditorRef}
              userId={user.id}
              onSelectBoard={selectBoard}
              onBoardColorChange={handleBoardColorFromAi}
              onPickImage={handlePickImage}
              onScanPhysical={() => setScanOpen(true)}
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-row">
              <BoardDesktopGrid
                boards={boards}
                activeId={activeBoard.id}
                onSelect={selectBoard}
                onSave={handleSaveLayoutFor}
                registerEditor={registerEditor}
              />
              {showReminders && (
                <BoardReminderPanel
                  board={activeBoard}
                  userId={user.id}
                  reminders={reminders}
                  onRefresh={() => void loadReminders(activeBoard.id)}
                />
              )}
            </div>
          </div>
        )}

        {activeBoard && workspace && (
          <>
            <BoardPrintDialog
              open={printOpen}
              onOpenChange={setPrintOpen}
              layoutJson={activeBoard.layout_json}
              colorKey={activeBoard.color_key}
              boardTitle={activeBoard.title}
            />
            <BoardPhysicalScanDialog
              open={scanOpen}
              onOpenChange={setScanOpen}
              userId={user.id}
              editorRef={activeEditorRef}
            />
            <BoardImportDialog
              open={importOpen}
              onOpenChange={setImportOpen}
              boards={workspace.boards}
              activeBoardId={activeBoard.id}
              editorRef={activeEditorRef}
            />
            <BoardWallpaperDialog
              open={wallpaperOpen}
              onOpenChange={setWallpaperOpen}
              layoutJson={activeBoard.layout_json}
              colorKey={activeBoard.color_key}
              boardTitle={activeBoard.title}
            />
          </>
        )}
      </div>
    </div>
  );
}
