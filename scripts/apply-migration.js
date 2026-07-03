import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get service role key from command line argument
const SUPABASE_SERVICE_ROLE_KEY = process.argv[2];
const SUPABASE_URL = "https://hyckwyjznishkjijrhcw.supabase.co";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY is required");
  console.log("\nUsage: node scripts/apply-migration.js <SUPABASE_SERVICE_ROLE_KEY>");
  console.log("\nTo get your service role key:");
  console.log("1. Go to https://supabase.com/dashboard/project/hyckwyjznishkjijrhcw/settings/api");
  console.log("2. Copy the 'service_role' key (keep it secret!)");
  console.log("3. Run: node scripts/apply-migration.js <your_service_role_key>");
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

async function applyMigration() {
  console.log("🚀 Applying migration: user_preferences tables...\n");

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20250122000000_create_user_preferences_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by semicolons to execute statements one by one
    // Note: Supabase REST API doesn't support multi-statement queries directly
    // We'll need to use the Postgres REST API or execute via SQL Editor
    
    console.log("⚠️  Note: This script reads the migration file.");
    console.log("📋 To apply the migration, you have two options:\n");
    console.log("Option 1: Use Supabase Dashboard (Recommended)");
    console.log("1. Go to: https://supabase.com/dashboard/project/hyckwyjznishkjijrhcw/sql/new");
    console.log("2. Copy and paste the contents of:");
    console.log("   supabase/migrations/20250122000000_create_user_preferences_tables.sql");
    console.log("3. Click 'Run' to execute\n");
    
    console.log("Option 2: Use Supabase CLI");
    console.log("1. Install Supabase CLI: npm install -g supabase");
    console.log("2. Link project: supabase link --project-ref hyckwyjznishkjijrhcw");
    console.log("3. Push migrations: supabase db push\n");

    // Try to execute via Postgres REST API
    console.log("🔄 Attempting to apply migration via API...\n");
    
    // Execute the SQL using the Postgres REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: migrationSQL }),
    });

    if (response.ok) {
      console.log("✅ Migration applied successfully!");
    } else {
      const errorText = await response.text();
      console.log("⚠️  API execution not available or failed.");
      console.log("📋 Please use Option 1 (Supabase Dashboard) instead.\n");
      console.log("Error details:", errorText);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("\n📋 Please apply the migration manually using the Supabase Dashboard:");
    console.log("   https://supabase.com/dashboard/project/hyckwyjznishkjijrhcw/sql/new");
  }
}

applyMigration();



























































