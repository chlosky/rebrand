/**
 * Simple script to run Supabase migrations using the Supabase client
 * 
 * Usage:
 *   node scripts/run-migration-simple.js <migration-file-path>
 * 
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY environment variables
 * Or set them in a .env file
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env if it exists
try {
  const envFile = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  // Ignore if .env doesn't exist
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMigration(migrationPath) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('   Required environment variables:');
    console.error('   - VITE_SUPABASE_URL or SUPABASE_URL');
    console.error('   - VITE_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY');
    console.error('\n   You can set these in a .env file or as environment variables');
    process.exit(1);
  }

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Error: Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  const migrationName = path.basename(migrationPath);

  console.log(`📄 Reading migration: ${migrationName}`);
  console.log(`📊 SQL size: ${sql.length} characters`);
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);

  try {
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🚀 Executing migration...');
    
    // Execute SQL using RPC or direct query
    // Note: Supabase JS client doesn't have a direct SQL execution method
    // We need to use the REST API or Management API
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements`);

    // For now, we'll need to use the Management API or provide instructions
    console.log('\n⚠️  Note: The Supabase JS client cannot execute arbitrary SQL directly.');
    console.log('   Please run this migration in the Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/hyckwyjznishkjijrhcw/sql/new\n');
    console.log('   Or use the Supabase CLI:');
    console.log('   supabase db push\n');
    
    // Show the SQL for easy copy-paste
    console.log('📋 Migration SQL:');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('❌ Error:');
    console.error(error.message);
    process.exit(1);
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Error: Migration file path required');
  console.error('   Usage: node scripts/run-migration-simple.js <migration-file-path>');
  console.error('   Example: node scripts/run-migration-simple.js supabase/migrations/20250123000004_fix_advanced_rls_optimizations.sql');
  process.exit(1);
}

runMigration(migrationFile);


























































