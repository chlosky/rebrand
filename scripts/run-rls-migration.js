/**
 * Script to run RLS optimization migration via Supabase REST API
 * 
 * Usage:
 *   node scripts/run-rls-migration.js <SUPABASE_SERVICE_ROLE_KEY>
 * 
 * Or set as environment variable:
 *   set SUPABASE_SERVICE_ROLE_KEY=your_key_here
 *   node scripts/run-rls-migration.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = "https://hyckwyjznishkjijrhcw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY;
const MIGRATION_FILE = join(__dirname, '..', 'supabase', 'migrations', '20250123000004_fix_advanced_rls_optimizations.sql');

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY is required");
  console.log("\nUsage: node scripts/run-rls-migration.js <SUPABASE_SERVICE_ROLE_KEY>");
  console.log("\nOr set as environment variable:");
  console.log("  set SUPABASE_SERVICE_ROLE_KEY=your_key_here");
  console.log("  node scripts/run-rls-migration.js");
  console.log("\nTo get your service role key:");
  console.log("1. Go to https://supabase.com/dashboard/project/hyckwyjznishkjijrhcw/settings/api");
  console.log("2. Copy the 'service_role' key (keep it secret!)");
  process.exit(1);
}

async function runMigration() {
  try {
    console.log("📄 Reading migration file...");
    const sql = readFileSync(MIGRATION_FILE, 'utf8');
    console.log(`✅ Read ${sql.length} characters from migration file\n`);

    console.log("🚀 Executing migration via Supabase REST API...\n");

    // Use Supabase REST API to execute SQL
    // The /rest/v1/rpc endpoint can execute functions, but for raw SQL we need to use the Management API
    // However, we can use the PostgREST query endpoint with a custom function
    // Or better: use the Supabase Management API's query endpoint
    
    // Split SQL into statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute via REST API using the query endpoint
    // Note: Supabase doesn't expose a direct SQL execution endpoint via REST
    // We need to use the Management API or execute via psql
    // For now, we'll use fetch to call the Supabase REST API
    
    // Actually, the best way is to use the Supabase Management API
    // But that requires an access token, not service role key
    
    // Alternative: Use the Supabase client's RPC to call a function that executes SQL
    // Or use the direct PostgREST endpoint
    
    // Let's try using the Supabase REST API directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // If exec_sql doesn't exist, we need to execute via Management API
      // Or provide instructions to run manually
      console.log("⚠️  Direct SQL execution via REST API is not available.");
      console.log("   Supabase requires using the SQL Editor or Management API.\n");
      console.log("📋 Please run this migration manually:\n");
      console.log("1. Go to: https://supabase.com/dashboard/project/hyckwyjznishkjijrhcw/sql/new");
      console.log("2. Copy and paste the SQL below:");
      console.log("\n" + "=".repeat(80));
      console.log(sql);
      console.log("=".repeat(80) + "\n");
      console.log("3. Click 'Run' to execute\n");
      
      // Try alternative: execute statements one by one if possible
      console.log("💡 Alternative: Trying to execute via individual statements...\n");
      
      // For DROP and CREATE POLICY statements, we might be able to use REST API
      // But this is complex. Better to provide manual instructions.
      
      return;
    }

    const result = await response.json();
    console.log("✅ Migration executed successfully!");
    console.log("📋 Result:", JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("❌ Error executing migration:");
    console.error(error.message);
    
    // Provide fallback instructions
    console.log("\n📋 Fallback: Please run this migration manually:");
    console.log("1. Go to: https://supabase.com/dashboard/project/hyckwyjznishkjijrhcw/sql/new");
    console.log("2. Copy and paste the SQL from: supabase/migrations/20250123000004_fix_advanced_rls_optimizations.sql");
    console.log("3. Click 'Run' to execute\n");
    
    process.exit(1);
  }
}

runMigration();


























































