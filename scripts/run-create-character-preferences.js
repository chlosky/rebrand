/**
 * Script to create user_character_preferences table
 * 
 * Usage:
 *   node scripts/run-create-character-preferences.js <SUPABASE_SERVICE_ROLE_KEY>
 * 
 * Or set SUPABASE_SERVICE_ROLE_KEY as environment variable
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = "https://hyckwyjznishkjijrhcw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY is required");
  console.log("\nUsage: node scripts/run-create-character-preferences.js <SUPABASE_SERVICE_ROLE_KEY>");
  console.log("\nOr set as environment variable:");
  console.log("  export SUPABASE_SERVICE_ROLE_KEY=your_key_here");
  console.log("  node scripts/run-create-character-preferences.js");
  console.log("\nTo get your service role key:");
  console.log("1. Go to https://supabase.com/dashboard/project/hyckwyjznishkjijrhcw/settings/api");
  console.log("2. Copy the 'service_role' key (keep it secret!)");
  process.exit(1);
}

async function runSQL() {
  console.log("🚀 Creating user_character_preferences table...\n");

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, 'create_user_character_preferences_table.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log("📄 SQL file loaded");
    console.log("🔗 Supabase URL:", SUPABASE_URL);
    console.log("📊 SQL size:", sql.length, "characters\n");

    // Execute SQL using PostgREST (via REST API)
    // Note: We need to use the Postgres REST API endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (response.ok) {
      console.log("✅ Table created successfully!");
      const result = await response.json();
      console.log("📋 Result:", result);
    } else {
      // Try alternative method - execute via SQL endpoint
      console.log("⚠️  First method failed, trying alternative...\n");
      
      // Alternative: Use the SQL Editor API endpoint
      const altResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/vnd.pgjson.object+json',
        },
        body: sql,
      });

      if (altResponse.ok) {
        console.log("✅ Table created successfully (alternative method)!");
      } else {
        const errorText = await altResponse.text();
        console.error("❌ Error executing SQL:");
        console.error("Status:", altResponse.status);
        console.error("Response:", errorText);
        console.log("\n📋 Please run this SQL manually in Supabase Dashboard:");
        console.log("   https://supabase.com/dashboard/project/hyckwyjznishkjijrhcw/sql/new\n");
        console.log("SQL to run:");
        console.log("─".repeat(80));
        console.log(sql);
        console.log("─".repeat(80));
        process.exit(1);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("\n📋 Please run this SQL manually in Supabase Dashboard:");
    console.log("   https://supabase.com/dashboard/project/hyckwyjznishkjijrhcw/sql/new\n");
    
    // Show the SQL
    const sqlPath = join(__dirname, 'create_user_character_preferences_table.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    console.log("SQL to run:");
    console.log("─".repeat(80));
    console.log(sql);
    console.log("─".repeat(80));
    process.exit(1);
  }
}

runSQL();





















































