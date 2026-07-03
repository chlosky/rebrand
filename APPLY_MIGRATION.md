# Apply Migration: User Preferences Tables

This migration creates the necessary database tables for cloud-first data storage:
- `user_preferences` - User settings (character selection, email reminders)
- `user_double_progress` - Your Double daily progress tracking
- `user_double_action_history` - Your Double action history

## Quick Method: Supabase Dashboard (Recommended)

1. **Go to Supabase SQL Editor:**
   - Visit: https://supabase.com/dashboard/project/hyckwyjznishkjijrhcw/sql/new
   - Or: Dashboard → SQL Editor → New Query

2. **Copy the migration SQL:**
   - Open: `supabase/migrations/20250122000000_create_user_preferences_tables.sql`
   - Copy ALL the contents

3. **Paste and Run:**
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verify:**
   - Check that the tables were created in: Dashboard → Table Editor
   - You should see:
     - `user_preferences`
     - `user_double_progress`
     - `user_double_action_history`

## Alternative: Supabase CLI

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to your project
supabase link --project-ref hyckwyjznishkjijrhcw

# Push migrations
supabase db push
```

## What This Migration Does

1. **Creates `user_preferences` table:**
   - Stores user's selected character
   - Stores email reminder preferences
   - One row per user (UNIQUE constraint on user_id)

2. **Creates `user_double_progress` table:**
   - Tracks daily progress (0-100%)
   - Stores completed actions for each day
   - One row per user per day (UNIQUE constraint)

3. **Creates `user_double_action_history` table:**
   - Tracks all actions completed by date
   - Stores actions as JSONB array
   - One row per user per day (UNIQUE constraint)

4. **Security:**
   - All tables have RLS (Row Level Security) enabled
   - Users can only access their own data
   - All policies use `auth.uid() = user_id`

## After Migration

Once the migration is applied:
- ✅ All user data will sync to the cloud
- ✅ Data will persist across devices
- ✅ Existing localStorage data will be migrated automatically on first load
- ✅ No data loss when switching devices

## Troubleshooting

If you get errors:
- **"relation already exists"** - Tables may already exist, this is safe to ignore
- **"function update_updated_at() does not exist"** - This function should exist from previous migrations
- **Permission errors** - Make sure you're using the SQL Editor with proper permissions



























































