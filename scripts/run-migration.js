/**
 * Script to run Supabase migrations via Management API
 * 
 * Usage:
 *   node scripts/run-migration.js <migration-file-path>
 * 
 * Requires SUPABASE_ACCESS_TOKEN environment variable
 * Get it from: https://supabase.com/dashboard/account/tokens
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

const PROJECT_ID = 'hyckwyjznishkjijrhcw';
const SUPABASE_URL = `https://api.supabase.com/v1/projects/${PROJECT_ID}`;

async function runMigration(migrationPath) {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ Error: SUPABASE_ACCESS_TOKEN environment variable is required');
    console.error('   Get your access token from: https://supabase.com/dashboard/account/tokens');
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

  try {
    console.log('🚀 Executing migration...');
    const result = await executeSQL(sql, accessToken);
    
    if (result.error) {
      console.error('❌ Migration failed:');
      console.error(JSON.stringify(result.error, null, 2));
      process.exit(1);
    }

    console.log('✅ Migration executed successfully!');
    if (result.data) {
      console.log('📋 Result:', JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error executing migration:');
    console.error(error.message);
    process.exit(1);
  }
}

function executeSQL(sql, accessToken) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_ID}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          // If response is not JSON, it might be an error
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve({ data: data });
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Error: Migration file path required');
  console.error('   Usage: node scripts/run-migration.js <migration-file-path>');
  console.error('   Example: node scripts/run-migration.js supabase/migrations/20250123000004_fix_advanced_rls_optimizations.sql');
  process.exit(1);
}

runMigration(migrationFile);

