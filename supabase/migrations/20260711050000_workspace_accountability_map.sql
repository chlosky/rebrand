-- Persist Action diagram (accountability map) per workspace for cross-device sync.
ALTER TABLE public.board_workspaces
  ADD COLUMN IF NOT EXISTS accountability_map_json jsonb;

COMMENT ON COLUMN public.board_workspaces.accountability_map_json IS
  'Action page diagram (focus/plan/action map) synced across devices for the workspace owner.';
