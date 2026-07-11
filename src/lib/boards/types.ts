export type BoardRole = "focus" | "plan";

export type BoardLayoutMode =
  | "vision"
  | "kanban"
  | "gantt"
  | "eisenhower"
  | "okrs"
  | "five_s"
  | "checklist"
  | "gallery";

export type BoardReminderChannel = "email" | "sms" | "push";

export type BoardReminderSource = "user" | "ai_extracted" | "plan_item";

export type BoardWorkspace = {
  id: string;
  user_id: string;
  name: string;
  preset_slug: string | null;
  accountability_map_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type Board = {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  title_color: string | null;
  title_font: string | null;
  role: BoardRole;
  color_key: string;
  sort_order: number;
  layout_json: Record<string, unknown>;
  layout_mode: BoardLayoutMode;
  artboard_width: number;
  artboard_height: number;
  created_at: string;
  updated_at: string;
};

export type BoardReminder = {
  id: string;
  board_id: string;
  user_id: string;
  title: string;
  body: string | null;
  sms_content?: string | null;
  sms_attempt_count?: number | null;
  sms_sent_at?: string | null;
  sms_brevo_message_id?: string | null;
  sms_send_status?: string | null;
  sms_send_error?: string | null;
  remind_at: string;
  timezone: string | null;
  channels: string[];
  source: BoardReminderSource;
  fabric_object_id: string | null;
  status: string;
  ical_uid: string | null;
  last_sent_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type BoardImageAsset = {
  id: string;
  theme: string;
  category: string;
  url: string;
  thumbUrl?: string;
  description: string;
  tags?: string[];
};

export type BoardWorkspaceWithBoards = BoardWorkspace & { boards: Board[] };
