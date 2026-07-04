/**
 * Account deletion utilities.
 * Database rows cascade on auth.users delete; storage cleanup is best-effort.
 */

import { supabase } from "@/integrations/supabase/client";

async function cleanupUserBoardUploads(userId: string): Promise<void> {
  try {
    const { data: files, error: listError } = await supabase.storage
      .from("board-uploads")
      .list(userId, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });

    if (listError) {
      console.error(`[Account Deletion] Error listing board uploads for user ${userId}:`, listError);
      return;
    }

    if (!files?.length) return;

    const filePaths = files.map((file) => `${userId}/${file.name}`);
    const { error: deleteError } = await supabase.storage.from("board-uploads").remove(filePaths);
    if (deleteError) {
      console.error(`[Account Deletion] Error deleting board uploads for user ${userId}:`, deleteError);
    }
  } catch (error) {
    console.error(`[Account Deletion] Unexpected error cleaning board uploads for user ${userId}:`, error);
  }
}

export async function cleanupUserData(userId: string): Promise<void> {
  console.log(`[Account Deletion] Starting cleanup for user ${userId}`);
  await cleanupUserBoardUploads(userId);
  console.log(`[Account Deletion] Cleanup complete for user ${userId}`);
}
