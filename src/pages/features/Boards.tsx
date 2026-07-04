import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Download, LayoutGrid, Loader2, Plus, ScanLine, Trash2 } from "lucide-react";
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
  saveBoardLayout,
  updateBoardMeta,
} from "@/lib/boards/api";
import type { BoardWorkspaceWithBoards } from "@/lib/boards/types";
import { BoardPrintDialog } from "@/components/boards/BoardPrintDialog";
import { BoardPhysicalScanDialog } from "@/components/boards/BoardPhysicalScanDialog";
import { BoardImportDialog } from "@/components/boards/BoardImportDialog";
import { BoardImagePicker } from "@/components/boards/BoardImagePicker";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import "@/styles/board-editor.css";

export default function Boards() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const editorMapRef = useRef(new Map<string, BoardCanvasHandle>());
  const activeEditorRef = useRef<BoardCanvasHandle | null>(null);
  const [imagePickOpen, setImagePickOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<BoardWorkspaceWithBoards | null>(null);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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
      const full =
        workspaces.length === 0
          ? await ensureDefaultWorkspace(user.id)
          : await fetchWorkspaceWithBoards(workspaces[0].id);
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
  }, [user?.id]);

  useEffect(() => {
    void loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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

  const handleRemoveBoard = async () => {
    if (!workspace || !activeBoard) return;
    if (activeBoard.role === "plan") {
      toast.message("The Plan stays in every workspace");
      return;
    }
    const label = activeBoard.title;
    if (!window.confirm(`Remove “${label}” from your workspace? This cannot be undone.`)) return;
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
              <h1 className="text-sm font-semibold text-neutral-900">Boards</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleAddBoard}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add board</span>
            </Button>
            {canRemoveBoard && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleRemoveBoard}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Remove</span>
              </Button>
            )}
            <Button variant="outline" size="sm" className="hidden gap-1 text-xs md:flex" onClick={() => setScanOpen(true)}>
              <ScanLine className="h-3.5 w-3.5" />
              Scan
            </Button>
            <Button variant="outline" size="sm" className="hidden gap-1 text-xs md:flex" onClick={() => setImportOpen(true)}>
              <Copy className="h-3.5 w-3.5" />
              Import
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setDownloadOpen(true)}>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </header>

        {!loading && workspace && activeBoard && (
          <BoardToolbar
            editorRef={activeEditorRef}
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
            />
            <BoardPlotKitTray
              activeBoard={activeBoard}
              activeBoardId={activeBoard.id}
              editorRef={activeEditorRef}
              userId={user.id}
              onBoardColorChange={handleBoardColorFromAi}
              onPickImage={handlePickImage}
              onScanPhysical={() => setScanOpen(true)}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
            <BoardPlottingWorkbench
              activeBoard={activeBoard}
              activeBoardId={activeBoard.id}
              editorRef={activeEditorRef}
              userId={user.id}
              onBoardColorChange={handleBoardColorFromAi}
              onPickImage={handlePickImage}
              onScanPhysical={() => setScanOpen(true)}
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
          </>
        )}
      </div>
    </div>
  );
}
