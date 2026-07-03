/**
 * Account Deletion Utilities
 * 
 * This module provides utilities for cleaning up user data before account deletion.
 * Storage cleanup is best-effort: errors are logged but don't block account deletion.
 * 
 * IMPORTANT: This should be called BEFORE deleting the user from auth.users.
 * The database rows will be automatically deleted via ON DELETE CASCADE.
 * 
 * Usage example (in account deletion flow):
 * ```typescript
 * import { cleanupUserData } from '@/lib/accountDeletion';
 * 
 * // Before deleting user account:
 * await cleanupUserData(userId);
 * 
 * // Then delete user from auth.users (via Admin API or database function)
 * // Database rows will cascade delete automatically
 * ```
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Delete all audio files for a user from the subliminal-tracks bucket
 * Uses the {user_id}/... prefix to find all files for that user
 * 
 * This is a best-effort cleanup: logs errors but doesn't throw
 * 
 * @param userId - The user ID whose files should be deleted
 * @returns Promise that resolves when cleanup is complete (even if some files fail)
 */
export async function cleanupUserSubliminalTracks(userId: string): Promise<void> {
  try {
    // List all files in the user's folder
    const { data: files, error: listError } = await supabase.storage
      .from('subliminal-tracks')
      .list(userId, {
        limit: 1000, // Adjust if users can have more than 1000 tracks
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error(`[Account Deletion] Error listing files for user ${userId}:`, listError);
      return; // Best-effort: continue even if listing fails
    }

    if (!files || files.length === 0) {
      console.log(`[Account Deletion] No files found for user ${userId}`);
      return;
    }

    // Build list of file paths to delete
    const filePaths = files.map(file => `${userId}/${file.name}`);

    // Delete all files
    const { error: deleteError } = await supabase.storage
      .from('subliminal-tracks')
      .remove(filePaths);

    if (deleteError) {
      console.error(`[Account Deletion] Error deleting files for user ${userId}:`, deleteError);
      // Best-effort: log but don't throw
    } else {
      console.log(`[Account Deletion] Successfully deleted ${filePaths.length} file(s) for user ${userId}`);
    }
  } catch (error) {
    // Catch any unexpected errors and log them, but don't throw
    console.error(`[Account Deletion] Unexpected error cleaning up files for user ${userId}:`, error);
  }
}

/**
 * Complete account deletion cleanup
 * Cleans up all user data from storage before account deletion
 * 
 * This should be called BEFORE deleting the user from auth.users
 * The database rows will be automatically deleted via ON DELETE CASCADE
 * 
 * @param userId - The user ID whose data should be cleaned up
 */
export async function cleanupUserData(userId: string): Promise<void> {
  console.log(`[Account Deletion] Starting cleanup for user ${userId}`);
  
  // Clean up subliminal tracks storage
  await cleanupUserSubliminalTracks(userId);
  
  // Add other storage cleanup here as needed:
  // - cleanupUserAffirmations(userId);
  // - cleanupUserRefactors(userId);
  // etc.
  
  console.log(`[Account Deletion] Cleanup complete for user ${userId}`);
}

