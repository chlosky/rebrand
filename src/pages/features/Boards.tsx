import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CopyPlus, Download, LayoutGrid, Loader2, Plus, Route, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { BoardToolbar } from "@/components/boards/BoardToolbar";
import type { BoardCanvasHandle, BoardDiagramType } from "@/components/boards/BoardCanvasEditor";
import { STRUCTURE_DECAL_SIZE } from "@/components/boards/BoardPlottingWorkbench";
import { BoardDesktopGrid } from "@/components/boards/BoardDesktopGrid";
import { BoardPlottingWorkbench } from "@/components/boards/BoardPlottingWorkbench";
import { BoardPlotKitTray } from "@/components/boards/BoardPlotKitTray";
import { BoardMobileCarousel } from "@/components/boards/BoardMobileCarousel";
import { usePlottingPro } from "@/hooks/usePlottingPro";
import {
  addBoard,
  deleteBoard,
  fetchUserWorkspaces,
  fetchWorkspaceWithBoards,
  loadDefaultWorkspace,
  reorderBoards,
  saveBoardLayout,
  updateBoardMeta,
} from "@/lib/boards/api";
import type { BoardWorkspaceWithBoards } from "@/lib/boards/types";
import { boardFillForKey } from "@/lib/boards/colors";
import { BoardPrintDialog } from "@/components/boards/BoardPrintDialog";
import { TrialExportUnlockDialog } from "@/components/boards/TrialExportUnlockDialog";
import { BoardImagePicker } from "@/components/boards/BoardImagePicker";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import "@/styles/board-editor.css";

const ACTIVE_WORKSPACE_KEY = "board-workspace-id";

export default function Boards() {
  const { user } = useAuth();
  const { hasPro, onTrial, loading: proLoading, refreshPlan } = usePlottingPro();
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
  const [showTrialUnlock, setShowTrialUnlock] = useState(false);
  const trialBlocksExports = hasPro && onTrial;
  const [undoRedo, setUndoRedo] = useState({ canUndo: false, canRedo: false });
  const [isPortraitViewport, setIsPortraitViewport] = useState(() =>
    typeof window === "undefined" ? true : window.innerHeight > window.innerWidth,
  );

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
      activeBoardIdRef.current = id;
      setActiveBoardId(id);
      const handle = editorMapRef.current.get(id) ?? null;
      activeEditorRef.current = handle;
      syncUndoRedoFromEditor(handle);
    },
    [syncUndoRedoFromEditor],
  );

  const getActiveBoardEditor = useCallback(() => {
    const id = activeBoardIdRef.current;
    if (!id) return activeEditorRef.current;
    return editorMapRef.current.get(id) ?? activeEditorRef.current;
  }, []);

  const getBoardEditor = useCallback((boardId: string) => {
    const direct = editorMapRef.current.get(boardId);
    if (direct) return direct;
    for (const handle of editorMapRef.current.values()) {
      if (handle.boardId === boardId) return handle;
    }
    return null;
  }, []);

  const getActiveBoardId = useCallback(() => activeBoardIdRef.current, []);

  const placeStructureOnActiveBoard = useCallback((type: BoardDiagramType, items?: string[]) => {
    const boardId = activeBoardIdRef.current;
    if (!boardId) return;
    const placement = STRUCTURE_DECAL_SIZE[type] ?? { x: 0.12, y: 0.28, w: 0.72, h: 0.22 };
    const x = Math.max(0, Math.min(1 - placement.w, 0.5 - placement.w / 2));
    const y = Math.max(0, Math.min(1 - placement.h, 0.5 - placement.h / 2));
    getActiveBoardEditor()?.addDiagramOverlay(type, x, y, placement.w, placement.h, items);
  }, [getActiveBoardEditor]);

  const registerEditor = useCallback((boardId: string, handle: BoardCanvasHandle | null) => {
    if (handle) {
      editorMapRef.current.set(boardId, handle);
      if (handle.boardId !== boardId) {
        editorMapRef.current.set(handle.boardId, handle);
      }
      if (boardId === activeBoardIdRef.current) {
        activeEditorRef.current = handle;
      }
      return;
    }
    editorMapRef.current.delete(boardId);
    if (boardId === activeBoardIdRef.current) {
      activeEditorRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!activeBoardId) return;
    const handle = editorMapRef.current.get(activeBoardId) ?? null;
    activeEditorRef.current = handle;
    syncUndoRedoFromEditor(handle);
  }, [activeBoardId, syncUndoRedoFromEditor]);

  const workspaceBoards = useMemo(
    () => (workspace?.boards ?? []).map((b) => ({ id: b.id, title: b.title, role: b.role })),
    [workspace?.boards],
  );
  const activeBoard = useMemo(
    () => workspace?.boards.find((b) => b.id === activeBoardId) ?? workspace?.boards[0] ?? null,
    [workspace, activeBoardId],
  );
  const workspacePresentation = useMemo(() => {
    const firstBoard = workspace?.boards[0];
    return firstBoard && firstBoard.artboard_width > firstBoard.artboard_height ? "matrix" : "row";
  }, [workspace?.boards]);
  const isLandscapeSet = workspacePresentation === "matrix";
  const activeWorkspaceId = workspaceParam ?? workspace?.id ?? null;

  const handleUndo = useCallback(async () => {
    const editor = getActiveBoardEditor();
    if (!editor) return;
    await editor.undo();
    syncUndoRedoFromEditor(getActiveBoardEditor());
  }, [getActiveBoardEditor, syncUndoRedoFromEditor]);

  const handleRedo = useCallback(async () => {
    const editor = getActiveBoardEditor();
    if (!editor) return;
    await editor.redo();
    syncUndoRedoFromEditor(getActiveBoardEditor());
  }, [getActiveBoardEditor, syncUndoRedoFromEditor]);

  const loadWorkspace = useCallback(async () => {
    if (!user?.id || proLoading) return;
    setLoading(true);
    try {
      let workspaces = await fetchUserWorkspaces(user.id);
      if (workspaces.length === 0 && hasPro) {
        await new Promise((resolve) => window.setTimeout(resolve, 350));
        workspaces = await fetchUserWorkspaces(user.id);
      }

      const remembered =
        !workspaceParam && isMobile ? sessionStorage.getItem(ACTIVE_WORKSPACE_KEY) : null;

      let full: BoardWorkspaceWithBoards | null = null;
      if (workspaceParam) {
        full = await fetchWorkspaceWithBoards(workspaceParam);
      } else if (remembered) {
        full = await fetchWorkspaceWithBoards(remembered);
      } else if (workspaces.length > 0) {
        full = await loadDefaultWorkspace(user.id);
      }

      if (!full) {
        if (!hasPro) {
          navigate("/resubscribe", { replace: true });
          return;
        }
        navigate("/workspace?tab=projects", { replace: true });
        return;
      }

      sessionStorage.setItem(ACTIVE_WORKSPACE_KEY, full.id);
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
  }, [hasPro, isMobile, navigate, proLoading, user?.id, workspaceParam]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!isMobile || workspaceParam || !workspace?.id) return;
    navigate(`/dashboard/boards?workspace=${workspace.id}`, { replace: true });
  }, [isMobile, navigate, workspace?.id, workspaceParam]);

  useEffect(() => {
    document.title = "Vision | Palette Plotting";
  }, []);

  useEffect(() => {
    const update = () => setIsPortraitViewport(window.innerHeight > window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
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

  const handleAddBoardFromAi = useCallback(
    async (title?: string) => {
      if (!workspace || !user?.id) return;
      const focusCount = workspace.boards.filter((b) => b.role === "focus").length;
      const n = workspace.boards.length;
      const boardTitle = title?.trim() || `Focus Board ${focusCount + 1}`;
      try {
        const board = await addBoard(
          workspace.id,
          user.id,
          boardTitle,
          "focus",
          n,
          activeBoard
            ? {
                artboard_width: activeBoard.artboard_width,
                artboard_height: activeBoard.artboard_height,
              }
            : undefined,
        );
        setWorkspace({ ...workspace, boards: [...workspace.boards, board] });
        selectBoard(board.id);
      } catch {
        toast.error("Could not add board");
      }
    },
    [workspace, user?.id, activeBoard, selectBoard],
  );

  const handleDeleteBoardFromAi = useCallback(
    async (boardId: string) => {
      if (!workspace) return;
      const board = workspace.boards.find((b) => b.id === boardId);
      if (!board || board.role === "plan") return;
      try {
        await deleteBoard(boardId);
        const next = workspace.boards.filter((b) => b.id !== boardId);
        setWorkspace({ ...workspace, boards: next });
        if (activeBoardId === boardId) selectBoard(next[0]?.id ?? "");
      } catch {
        toast.error("Could not remove board");
      }
    },
    [workspace, activeBoardId, selectBoard],
  );

  const handleDuplicateBoardFromAi = useCallback(
    async (sourceBoardId: string, title?: string) => {
      if (!workspace || !user?.id) return;
      const source = workspace.boards.find((b) => b.id === sourceBoardId);
      if (!source) return;
      const layout =
        editorMapRef.current.get(source.id)?.getLayoutJson() ?? source.layout_json;
      const baseTitle = source.title.replace(/ \(copy( \d+)?\)$/i, "");
      const nextTitle = title?.trim() || `${baseTitle} (copy)`;
      try {
        const board = await addBoard(
          workspace.id,
          user.id,
          nextTitle,
          "focus",
          workspace.boards.length,
          {
            artboard_width: source.artboard_width,
            artboard_height: source.artboard_height,
          },
        );
        await saveBoardLayout(board.id, layout);
        await updateBoardMeta(board.id, {
          color_key: source.color_key,
          title_color: source.title_color,
          title_font: source.title_font,
          layout_mode: source.layout_mode,
        });
        const duplicated: typeof board = {
          ...board,
          layout_json: layout,
          color_key: source.color_key,
          title_color: source.title_color,
          title_font: source.title_font,
          layout_mode: source.layout_mode,
        };
        setWorkspace({ ...workspace, boards: [...workspace.boards, duplicated] });
        selectBoard(board.id);
      } catch {
        toast.error("Could not duplicate board");
      }
    },
    [workspace, user?.id, selectBoard],
  );

  const handleAddBoard = async () => {
    if (!workspace) return;
    const focusCount = workspace.boards.filter((b) => b.role === "focus").length;
    if (focusCount >= 3) {
      toast.message("Each set includes three focus boards plus The Plan");
      return;
    }
    await handleAddBoardFromAi();
    toast.success("Focus board added");
  };

  const handleDuplicateBoard = async () => {
    if (!activeBoard) return;
    await handleDuplicateBoardFromAi(activeBoard.id);
    toast.success("Board duplicated");
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
        <header className="flex shrink-0 items-center justify-between gap-1 border-b border-neutral-200 bg-white px-4 py-3 max-md:px-2 max-md:py-1.5">
          <div className="flex min-w-0 shrink-0 items-center gap-2 max-md:gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 max-md:h-7 max-md:w-7"
              onClick={() => navigate("/workspace")}
            >
              <ArrowLeft className="h-4 w-4 max-md:h-3.5 max-md:w-3.5" />
            </Button>
            <LayoutGrid className="h-5 w-5 text-neutral-700 max-md:h-3.5 max-md:w-3.5" />
            <h1 className="text-sm font-semibold text-neutral-900 max-md:text-xs max-md:font-medium">Vision</h1>
          </div>
          <div className="flex min-w-0 items-center gap-1.5 max-md:gap-0.5 max-md:overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs max-md:h-7 max-md:w-7 max-md:shrink-0 max-md:p-0"
              onClick={handleAddBoard}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add board</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs max-md:h-7 max-md:w-7 max-md:shrink-0 max-md:p-0"
              onClick={() => void handleDuplicateBoard()}
            >
              <CopyPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Duplicate Board</span>
            </Button>
            {canRemoveBoard && !isMobile && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 max-md:h-7 max-md:w-7 max-md:shrink-0 max-md:p-0"
                onClick={handleRemoveBoard}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete Board</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs max-md:h-7 max-md:w-7 max-md:shrink-0 max-md:p-0"
              onClick={() => {
                if (trialBlocksExports) {
                  setShowTrialUnlock(true);
                  return;
                }
                setDownloadOpen(true);
              }}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <div className="ml-1 flex shrink-0 items-center gap-2 border-l border-neutral-200 pl-2 max-md:ml-0.5 max-md:gap-1 max-md:pl-1.5">
              <Route className="h-5 w-5 shrink-0 text-neutral-700 max-md:h-3.5 max-md:w-3.5" />
              <h2 className="text-sm font-semibold text-neutral-900 max-md:text-xs max-md:font-medium">Action</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 max-md:h-7 max-md:w-7"
                onClick={() =>
                  navigate(
                    activeWorkspaceId
                      ? `/dashboard/boards/accountability?workspace=${activeWorkspaceId}`
                      : "/dashboard/boards/accountability",
                  )
                }
              >
                <ArrowRight className="h-4 w-4 max-md:h-3.5 max-md:w-3.5" />
              </Button>
            </div>
          </div>
        </header>

        {!loading && workspace && activeBoard && (
          <BoardToolbar
            editorRef={activeEditorRef}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onResetBoard={() => {
              const id = activeBoard.id;
              editorMapRef.current.get(id)?.resetBoard();
            }}
            orientation="horizontal"
            className="shrink-0"
            compact={isMobile}
            onDeleteBoard={isMobile && canRemoveBoard ? handleRemoveBoard : undefined}
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
            {isLandscapeSet && isPortraitViewport ? (
              <p className="mx-4 mt-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1 text-center text-[11px] text-neutral-600">
                Landscape set selected. Rotate your phone for more room.
              </p>
            ) : null}
            <BoardMobileCarousel
              boards={boards}
              activeId={activeBoard.id}
              onSelect={selectBoard}
              onSave={handleSaveLayoutFor}
              registerEditor={registerEditor}
              onRenameBoard={handleRenameBoard}
              onHistoryChange={handleHistoryChange}
              onBoardColorChange={handleBoardColorFromAi}
              onRequestImagePick={openQuickImagePicker}
            />
            <BoardPlotKitTray
              workspaceId={workspace.id}
              activeBoard={activeBoard}
              activeBoardId={activeBoard.id}
              workspaceBoards={workspaceBoards}
              editorRef={activeEditorRef}
              getEditor={getActiveBoardEditor}
              getEditorForBoard={getBoardEditor}
              getActiveBoardId={getActiveBoardId}
              onSelectBoard={selectBoard}
              onPlaceStructure={placeStructureOnActiveBoard}
              userId={user.id}
              onBoardColorChange={handleBoardColorFromAi}
              onRenameBoard={handleRenameBoard}
              onPickImage={handlePickImage}
              onAddBoard={handleAddBoardFromAi}
              onDeleteBoard={handleDeleteBoardFromAi}
              onDuplicateBoard={handleDuplicateBoardFromAi}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
            <BoardPlottingWorkbench
              workspaceId={workspace.id}
              activeBoard={activeBoard}
              activeBoardId={activeBoard.id}
              workspaceBoards={workspaceBoards}
              editorRef={activeEditorRef}
              getEditor={getActiveBoardEditor}
              getEditorForBoard={getBoardEditor}
              getActiveBoardId={getActiveBoardId}
              onSelectBoard={selectBoard}
              userId={user.id}
              onBoardColorChange={handleBoardColorFromAi}
              onRenameBoard={handleRenameBoard}
              onPickImage={handlePickImage}
              onAddBoard={handleAddBoardFromAi}
              onDeleteBoard={handleDeleteBoardFromAi}
              onDuplicateBoard={handleDuplicateBoardFromAi}
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
                presentationMode={workspacePresentation}
                onHistoryChange={handleHistoryChange}
                onReorderBoards={boards.length > 1 ? handleReorderBoards : undefined}
                onBoardColorChange={handleBoardColorFromAi}
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
            <TrialExportUnlockDialog
              open={showTrialUnlock}
              onOpenChange={setShowTrialUnlock}
              refreshPlan={refreshPlan}
              onUnlocked={() => setDownloadOpen(true)}
            />
          </>
        )}
      </div>
    </div>
  );
}
