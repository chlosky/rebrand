import { useState } from "react";
import { CheckCircle2, Download, Loader2, MessageCircleHeart, ScanSearch } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BoardGuideChatPanel } from "@/components/boards/BoardCompanionPanel";
import type { AccountabilityMap } from "@/lib/boards/accountabilityMap";
import { cn } from "@/lib/utils";

type BoardActionKitTrayProps = {
  workspaceId: string;
  actionMap: AccountabilityMap | null;
  onActionMapChange: (map: AccountabilityMap) => void;
  analyzing: boolean;
  loading: boolean;
  onAnalyze: () => void;
  exportingIcal: boolean;
  remindersDisabled: boolean;
  hasCalendarReminders: boolean;
  onExportIcal: () => void;
  finalizing: boolean;
  hasDraft: boolean;
  finalized: boolean;
  onFinalize: () => void;
};

export function BoardActionKitTray({
  workspaceId,
  actionMap,
  onActionMapChange,
  analyzing,
  loading,
  onAnalyze,
  exportingIcal,
  remindersDisabled,
  hasCalendarReminders,
  onExportIcal,
  finalizing,
  hasDraft,
  finalized,
  onFinalize,
}: BoardActionKitTrayProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[39] bg-[#f3f0eb]"
        style={{ height: "env(safe-area-inset-bottom, 0px)" }}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-stone-300/80 bg-[#f3f0eb] px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5"
        role="toolbar"
        aria-label="Action kit"
      >
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium",
            guideOpen ? "text-stone-900" : "text-stone-600",
          )}
        >
          <MessageCircleHeart className="h-5 w-5" strokeWidth={1.75} />
          <span className="truncate">Guide</span>
        </button>

        <button
          type="button"
          disabled={analyzing || loading}
          onClick={() => void onAnalyze()}
          className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium text-stone-600 disabled:opacity-50"
        >
          {analyzing ? (
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} />
          ) : (
            <ScanSearch className="h-5 w-5" strokeWidth={1.75} />
          )}
          <span className="truncate">Analyze</span>
        </button>

        <button
          type="button"
          disabled={exportingIcal || remindersDisabled || !hasCalendarReminders}
          onClick={() => onExportIcal()}
          className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium text-stone-600 disabled:opacity-50"
        >
          {exportingIcal ? (
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} />
          ) : (
            <Download className="h-5 w-5" strokeWidth={1.75} />
          )}
          <span className="truncate">Calendar</span>
        </button>

        <button
          type="button"
          disabled={!hasDraft || finalizing || finalized}
          onClick={() => void onFinalize()}
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium disabled:opacity-50",
            finalized ? "text-emerald-700" : "text-stone-600",
          )}
        >
          {finalizing ? (
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} />
          ) : (
            <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
          )}
          <span className="truncate">Finalize</span>
        </button>
      </div>

      <Sheet open={guideOpen} onOpenChange={setGuideOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[min(70vh,520px)] rounded-t-2xl border-stone-300 bg-[#f3f0eb] p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <SheetHeader className="border-b border-stone-300/60 px-4 py-3 text-left">
            <SheetTitle className="font-welcome-serif text-base font-normal text-stone-900">Guide</SheetTitle>
          </SheetHeader>

          <div
            className="flex min-h-0 flex-col overflow-hidden"
            style={{ maxHeight: "calc(min(70vh, 520px) - 3.5rem)" }}
          >
            <BoardGuideChatPanel
              mode="action"
              workspaceId={workspaceId}
              actionMap={actionMap}
              onActionMapChange={onActionMapChange}
              compact
              inSheet
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
