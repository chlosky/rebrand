import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hyckwyjznishkjijrhcw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = "subliminal-tracks";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function verifyBucket() {
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    const bucket = buckets?.find(b => b.name === BUCKET_NAME);
    
    if (!bucket) {
      console.log('❌ Bucket not found');
      return;
    }
    
    console.log('✅ Bucket found!');
    console.log(`   Name: ${bucket.name}`);
    console.log(`   Public: ${bucket.public ? '⚠️  Yes (should be private)' : '✅ No (private - correct)'}`);
    console.log(`   ID: ${bucket.id}`);
    console.log(`   Created: ${bucket.created_at}`);
    
    if (bucket.public) {
      console.log('\n⚠️  Bucket is public. Consider making it private for better security.');
      console.log('   RLS policies will still work, but private bucket is more secure.');
      console.log('   To make it private: Go to Supabase Dashboard > Storage > Buckets > subliminal-tracks > Settings > Make Private');
    } else {
      console.log('\n✅ Bucket is private - RLS policies will control access.');
      console.log('🎉 Bucket is ready to use!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyBucket();



























































