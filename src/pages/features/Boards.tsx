import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CopyPlus, Download, LayoutGrid, ListChecks, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { BoardToolbar, type BoardZoomPreset } from "@/components/boards/BoardToolbar";
import type { BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";
import { BoardDesktopGrid } from "@/components/boards/BoardDesktopGrid";
import { BoardPlottingWorkbench } from "@/components/boards/BoardPlottingWorkbench";
import { BoardPlotKitTray } from "@/components/boards/BoardPlotKitTray";
import { BoardMobileCarousel } from "@/components/boards/BoardMobileCarousel";
import {
  addBoard,
  deleteBoard,
  ensureDefaultWorkspace,
  fetchUserWorkspaces,
  fetchWorkspaceWithBoards,
  reorderBoards,
  saveBoardLayout,
  updateBoardMeta,
} from "@/lib/boards/api";
import type { BoardWorkspaceWithBoards } from "@/lib/boards/types";
import { BoardPrintDialog } from "@/components/boards/BoardPrintDialog";
import { BoardImagePicker } from "@/components/boards/BoardImagePicker";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import "@/styles/board-editor.css";

export default function Boards() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workspaceParam = searchParams.get("workspace");
  const isMobile = useIsMobile();
  const editorMapRef = useRef(new Map<string, BoardCanvasHandle>());
  const activeEditorRef = useRef<BoardCanvasHandle | null>(null);
  const saveSeqRef = useRef(new Map<string, number>());
  const [imagePickOpen, setImagePickOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<BoardWorkspaceWithBoards | null>(null);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [boardZoom, setBoardZoom] = useState<BoardZoomPreset>("fit");
  const [undoRedo, setUndoRedo] = useState({ canUndo: false, canRedo: false });

  const handleHistoryChange = useCallback((state: { canUndo: boolean; canRedo: boolean }) => {
    setUndoRedo((prev) =>
      prev.canUndo === state.canUndo && prev.canRedo === state.canRedo ? prev : state,
    );
  }, []);

  const syncUndoRedoFromEditor = useCallback((handle: BoardCanvasHandle | null) => {
    setUndoRedo((prev) => {
      const canUndo = handle?.canUndo() ?? false;
      const canRedo = handle?.canRedo() ?? false;
      if (prev.canUndo === canUndo && prev.canRedo === canRedo) return prev;
      return { canUndo, canRedo };
    });
  }, []);

  const activeBoardIdRef = useRef(activeBoardId);
  activeBoardIdRef.current = activeBoardId;

  const selectBoard = useCallback(
    (id: string) => {
      setActiveBoardId(id);
      const handle = editorMapRef.current.get(id) ?? null;
      activeEditorRef.current = handle;
      syncUndoRedoFromEditor(handle);
    },
    [syncUndoRedoFromEditor],
  );

  const registerEditor = useCallback((boardId: string, handle: BoardCanvasHandle | null) => {
    if (handle) editorMapRef.current.set(boardId, handle);
    else editorMapRef.current.delete(boardId);
    if (boardId === activeBoardIdRef.current) {
      activeEditorRef.current = handle;
    }
  }, []);

  useEffect(() => {
    if (!activeBoardId) return;
    const handle = editorMapRef.current.get(activeBoardId) ?? null;
    activeEditorRef.current = handle;
    syncUndoRedoFromEditor(handle);
  }, [activeBoardId, syncUndoRedoFromEditor]);

  const activeBoard = useMemo(
    () => workspace?.boards.find((b) => b.id === activeBoardId) ?? workspace?.boards[0] ?? null,
    [workspace, activeBoardId],
  );

  const loadWorkspace = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const workspaces = await fetchUserWorkspaces(user.id);
      let full: BoardWorkspaceWithBoards | null = null;
      if (workspaceParam) {
        full = await fetchWorkspaceWithBoards(workspaceParam);
      } else if (workspaces.length === 0) {
        full = await ensureDefaultWorkspace(user.id);
      } else {
        full = await fetchWorkspaceWithBoards(workspaces[0].id);
      }
      if (!full) throw new Error("workspace missing");
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
  }, [user?.id, workspaceParam]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    document.title = "Vision | Palette Plotting";
  }, []);

  const handleSaveLayoutFor = useCallback(async (boardId: string, layout: Record<string, unknown>) => {
    const seq = (saveSeqRef.current.get(boardId) ?? 0) + 1;
    saveSeqRef.current.set(boardId, seq);
    try {
      await saveBoardLayout(boardId, layout);
      if (saveSeqRef.current.get(boardId) !== seq) return;
      setWorkspace((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          boards: prev.boards.map((b) => (b.id === boardId ? { ...b, layout_json: layout } : b)),
        };
      });
    } catch {
      if (saveSeqRef.current.get(boardId) !== seq) return;
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

  const handleRenameBoard = useCallback(async (boardId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      await updateBoardMeta(boardId, { title: trimmed });
      setWorkspace((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          boards: prev.boards.map((b) => (b.id === boardId ? { ...b, title: trimmed } : b)),
        };
      });
    } catch {
      toast.error("Could not rename board");
    }
  }, []);

  const handleTitleStyleChange = useCallback(
    async (boardId: string, patch: { title_color?: string | null; title_font?: string | null }) => {
      try {
        await updateBoardMeta(boardId, patch);
        setWorkspace((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            boards: prev.boards.map((b) => (b.id === boardId ? { ...b, ...patch } : b)),
          };
        });
      } catch {
        toast.error("Could not update title style");
      }
    },
    [],
  );

  const handlePickImage = useCallback(async (url: string) => {
    try {
      await activeEditorRef.current?.addImageFromUrl(url);
    } catch {
      toast.error("Could not add image");
    }
  }, []);

  const openQuickImagePicker = useCallback(() => {
    setImagePickOpen(true);
  }, []);

  const handleAddBoard = async () => {
    if (!workspace || !user?.id) return;
    const focusCount = workspace.boards.filter((b) => b.role === "focus").length;
    const n = workspace.boards.length;
    try {
      const board = await addBoard(
        workspace.id,
        user.id,
        `Focus Board ${focusCount + 1}`,
        "focus",
        n,
      );
      setWorkspace({ ...workspace, boards: [...workspace.boards, board] });
      selectBoard(board.id);
      toast.success("Focus board added");
    } catch {
      toast.error("Could not add board");
    }
  };

  const handleDuplicateBoard = async () => {
    if (!workspace || !activeBoard || !user?.id) return;
    const layout =
      editorMapRef.current.get(activeBoard.id)?.getLayoutJson() ?? activeBoard.layout_json;
    const baseTitle = activeBoard.title.replace(/ \(copy( \d+)?\)$/i, "");
    const title = `${baseTitle} (copy)`;
    try {
      const board = await addBoard(
        workspace.id,
        user.id,
        title,
        "focus",
        workspace.boards.length,
      );
      await saveBoardLayout(board.id, layout);
      await updateBoardMeta(board.id, {
        color_key: activeBoard.color_key,
        title_color: activeBoard.title_color,
        title_font: activeBoard.title_font,
        layout_mode: activeBoard.layout_mode,
      });
      const duplicated: typeof board = {
        ...board,
        layout_json: layout,
        color_key: activeBoard.color_key,
        title_color: activeBoard.title_color,
        title_font: activeBoard.title_font,
        layout_mode: activeBoard.layout_mode,
      };
      setWorkspace({ ...workspace, boards: [...workspace.boards, duplicated] });
      selectBoard(board.id);
      toast.success("Board duplicated");
    } catch {
      toast.error("Could not duplicate board");
    }
  };

  const handleReorderBoards = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!workspace) return;
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      if (fromIndex >= workspace.boards.length || toIndex >= workspace.boards.length) return;

      const prev = workspace.boards;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      const withOrder = next.map((b, i) => ({ ...b, sort_order: i }));

      setWorkspace({ ...workspace, boards: withOrder });
      try {
        await reorderBoards(withOrder.map((b) => b.id));
      } catch {
        setWorkspace({ ...workspace, boards: prev });
        toast.error("Could not reorder boards");
      }
    },
    [workspace],
  );

  const handleMoveBoard = useCallback(
    (boardId: string, direction: -1 | 1) => {
      if (!workspace) return;
      const fromIndex = workspace.boards.findIndex((b) => b.id === boardId);
      if (fromIndex < 0) return;
      void handleReorderBoards(fromIndex, fromIndex + direction);
    },
    [handleReorderBoards, workspace],
  );

  const handleRemoveBoard = async () => {
    if (!workspace || !activeBoard) return;
    if (activeBoard.role === "plan") {
      toast.message("The Plan stays in every workspace");
      return;
    }
    const label = activeBoard.title;
    if (!window.confirm(`Delete “${label}” from your workspace? This cannot be undone.`)) return;
    try {
      await deleteBoard(activeBoard.id);
      const next = workspace.boards.filter((b) => b.id !== activeBoard.id);
      setWorkspace({ ...workspace, boards: next });
      selectBoard(next[0]?.id ?? "");
      toast.success("Board removed");
    } catch {
      toast.error("Could not remove board");
    }
  };

  if (!user) return null;

  const boards = workspace?.boards ?? [];
  const canRemoveBoard = activeBoard?.role !== "plan";

  return (
    <div className="flex h-screen overflow-hidden bg-[#ebe8e3]">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            {isMobile && <MobilePWAMenu />}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/workspace")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <LayoutGrid className="h-5 w-5 text-neutral-700" />
            <div>
              <h1 className="text-sm font-semibold text-neutral-900">Vision</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleAddBoard}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add board</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => void handleDuplicateBoard()}>
              <CopyPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Duplicate Board</span>
            </Button>
            {canRemoveBoard && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleRemoveBoard}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete Board</span>
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setDownloadOpen(true)}>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <div className="ml-1 flex items-center gap-2 border-l border-neutral-200 pl-2">
              <ListChecks className="h-5 w-5 shrink-0 text-neutral-700" />
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Action</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate("/dashboard/boards/accountability")}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {!loading && workspace && activeBoard && (
          <BoardToolbar
            editorRef={activeEditorRef}
            onResetBoard={() => {
              const id = activeBoard.id;
              editorMapRef.current.get(id)?.resetBoard();
            }}
            orientation="horizontal"
            className="shrink-0"
            zoomPreset={!isMobile ? boardZoom : undefined}
            onZoomPresetChange={!isMobile ? setBoardZoom : undefined}
            canUndo={undoRedo.canUndo}
            canRedo={undoRedo.canRedo}
          />
        )}

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
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
              onRemoveBoard={handleRemoveBoard}
              canRemoveBoard={canRemoveBoard}
              registerEditor={registerEditor}
              onRenameBoard={handleRenameBoard}
              onTitleStyleChange={handleTitleStyleChange}
              onHistoryChange={handleHistoryChange}
              onBoardColorChange={handleBoardColorFromAi}
              onRequestImagePick={openQuickImagePicker}
              onMoveBoard={boards.length > 1 ? handleMoveBoard : undefined}
            />
            <BoardPlotKitTray
              workspaceId={workspace.id}
              activeBoard={activeBoard}
              activeBoardId={activeBoard.id}
              editorRef={activeEditorRef}
              userId={user.id}
              onBoardColorChange={handleBoardColorFromAi}
              onPickImage={handlePickImage}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
            <BoardPlottingWorkbench
              workspaceId={workspace.id}
              activeBoard={activeBoard}
              activeBoardId={activeBoard.id}
              editorRef={activeEditorRef}
              userId={user.id}
              onBoardColorChange={handleBoardColorFromAi}
              onPickImage={handlePickImage}
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <BoardDesktopGrid
                boards={boards}
                activeId={activeBoard.id}
                onSelect={selectBoard}
                onSave={handleSaveLayoutFor}
                registerEditor={registerEditor}
                onAddBoard={handleAddBoard}
                onRenameBoard={handleRenameBoard}
                onTitleStyleChange={handleTitleStyleChange}
                zoomPreset={boardZoom}
                onHistoryChange={handleHistoryChange}
                onReorderBoards={boards.length > 1 ? handleReorderBoards : undefined}
              />
            </div>
          </div>
        )}

        {activeBoard && workspace && (
          <>
            <Sheet open={imagePickOpen} onOpenChange={setImagePickOpen}>
              <SheetContent side="bottom" className="h-[min(72vh,520px)] rounded-t-2xl p-0">
                <SheetHeader className="border-b px-4 py-3 text-left">
                  <SheetTitle className="font-welcome-serif text-base font-normal">Pick an image</SheetTitle>
                </SheetHeader>
                <div className="h-[calc(min(72vh,520px)-3.25rem)]">
                  <BoardImagePicker
                    embedded
                    userId={user.id}
                    onPickImage={(url) => {
                      void handlePickImage(url).then(() => {
                        setImagePickOpen(false);
                        toast.success("Image added to board");
                      });
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <BoardPrintDialog
              open={downloadOpen}
              onOpenChange={setDownloadOpen}
              boards={workspace.boards}
              activeBoardId={activeBoard.id}
              getLayoutJson={(boardId) => {
                const editor = editorMapRef.current.get(boardId);
                if (editor) return editor.getLayoutJson();
                return workspace.boards.find((b) => b.id === boardId)?.layout_json ?? {};
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
