/**
 * Script to create the subliminal-tracks storage bucket in Supabase
 * 
 * Usage:
 * 1. Get your Supabase service role key from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
 * 2. Run: node scripts/create-storage-bucket.js <SERVICE_ROLE_KEY>
 * 
 * Or set as environment variable:
 * set SUPABASE_SERVICE_ROLE_KEY=your_key_here
 * node scripts/create-storage-bucket.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hyckwyjznishkjijrhcw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = "subliminal-tracks";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required');
  console.log('\nUsage: node scripts/create-storage-bucket.js <SERVICE_ROLE_KEY>');
  console.log('\nOr set as environment variable:');
  console.log('  set SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.log('  node scripts/create-storage-bucket.js');
  console.log('\nTo get your service role key:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to Settings > API');
  console.log('4. Copy the "service_role" key (keep it secret!)');
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

async function createBucket() {
  console.log(`🚀 Creating storage bucket: ${BUCKET_NAME}...\n`);

  try {
    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      throw listError;
    }

    const bucketExists = existingBuckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (bucketExists) {
      console.log(`✅ Bucket "${BUCKET_NAME}" already exists!`);
      return;
    }

    // Create the bucket using REST API (Supabase JS client doesn't have createBucket method)
    // Use simpler payload - Supabase API may not accept all parameters
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        name: BUCKET_NAME,
        public: true, // Make it public so users can access their tracks
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error creating bucket:', errorText);
      throw new Error(`Failed to create bucket: ${response.status} ${response.statusText}`);
    }

    const bucketData = await response.json();
    console.log('✅ Bucket created successfully!');
    console.log('\n📋 Bucket Details:');
    console.log(`   Name: ${bucketData.name || BUCKET_NAME}`);
    console.log(`   Public: ${bucketData.public !== undefined ? bucketData.public : 'true (default)'}`);
    console.log(`   ID: ${bucketData.id || 'N/A'}`);
    
    // Verify bucket exists and check if it's public
    const { data: verifyBuckets, error: verifyError } = await supabaseAdmin.storage.listBuckets();
    if (!verifyError && verifyBuckets) {
      const createdBucket = verifyBuckets.find(b => b.name === BUCKET_NAME);
      if (createdBucket) {
        console.log(`\n✅ Verified: Bucket "${BUCKET_NAME}" exists and is ${createdBucket.public ? 'public' : 'private'}`);
        if (createdBucket.public) {
          console.log('⚠️  Note: Bucket is public. Consider making it private for better security (RLS policies will still work).');
        } else {
          console.log('✅ Bucket is private - RLS policies will control access.');
        }
      }
    }
    
    console.log('\n🎉 Your subliminal tracks can now be saved to cloud storage!');

  } catch (error) {
    console.error('\n❌ Error creating bucket:', error.message);
    console.log('\n💡 Alternative: Create the bucket manually in Supabase Dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to Storage');
    console.log('   4. Click "New bucket"');
    console.log(`   5. Name: ${BUCKET_NAME}`);
    console.log('   6. Make it Private (RLS policies will control access)');
    console.log('   7. Click "Create bucket"');
    process.exit(1);
  }
}

createBucket();

