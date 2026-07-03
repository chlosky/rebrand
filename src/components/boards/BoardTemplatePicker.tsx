import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_FOUR_BOARD_TEMPLATE, templatesForIntent, type BoardStarterTemplate } from "@/lib/boards/starterTemplates";
import { boardFillForKey } from "@/lib/boards/colors";

type BoardTemplatePickerProps = {
  onSelect: (template: BoardStarterTemplate) => void;
  loading?: boolean;
};

export function BoardTemplatePicker({ onSelect, loading }: BoardTemplatePickerProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl text-center">
        <LayoutGrid className="mx-auto h-10 w-10 text-neutral-400" />
        <h2 className="mt-4 text-xl font-semibold text-neutral-900">Choose your plotting layout</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Pick a board setup that fits how you think. You can change it anytime.
        </p>
      </div>

      <div className="mt-8 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {templatesForIntent("life_rebranding").map((template) => (
          <button
            key={template.slug}
            type="button"
            disabled={loading}
            onClick={() => onSelect(template)}
            className="rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-neutral-300 hover:shadow-md disabled:opacity-60"
          >
            <p className="font-semibold text-neutral-900">{template.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">{template.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {template.boards.map((b) => (
                <span
                  key={b.title}
                  className="rounded-md px-2 py-0.5 text-[10px] font-medium text-neutral-800 ring-1 ring-neutral-200"
                  style={{ backgroundColor: boardFillForKey(b.color_key) }}
                >
                  {b.title}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-6 text-xs text-neutral-500"
        disabled={loading}
        onClick={() => onSelect(templatesForIntent("life_rebranding")[0] ?? DEFAULT_FOUR_BOARD_TEMPLATE)}
      >
        Skip — use default layout
      </Button>
    </div>
  );
}
