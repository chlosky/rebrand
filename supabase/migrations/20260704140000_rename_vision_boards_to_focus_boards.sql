-- Rename legacy "Vision N" board titles to Focus Board naming.

UPDATE public.board_workspaces
SET name = 'Three Focus Boards and The Plan'
WHERE preset_slug = 'four-board-rebrand'
  AND name = 'Vision Board + Plan';

UPDATE public.boards SET title = 'Focus Board 1' WHERE title = 'Vision 1';
UPDATE public.boards SET title = 'Focus Board 2' WHERE title = 'Vision 2';
UPDATE public.boards SET title = 'Focus Board 3' WHERE title = 'Vision 3';
