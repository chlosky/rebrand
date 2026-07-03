import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hyckwyjznishkjijrhcw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function getTodayInPT() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  
  return `${year}-${month}-${day}`;
}

async function cleanupFutureDates() {
  const todayPT = getTodayInPT();
  console.log(`📅 Today in PT: ${todayPT}\n`);
  
  try {
    // Find and delete future action history entries
    const { data: futureActions, error: actionError } = await supabaseAdmin
      .from('user_double_action_history')
      .select('*')
      .gt('action_date', todayPT);
    
    if (actionError) {
      console.error('❌ Error loading future actions:', actionError);
      return;
    }
    
    if (futureActions && futureActions.length > 0) {
      console.log(`⚠️  Found ${futureActions.length} future-dated action entries:`);
      futureActions.forEach(entry => {
        console.log(`   - ${entry.action_date}: ${JSON.stringify(entry.actions)} (user: ${entry.user_id})`);
      });
      
      // Delete them
      const { error: deleteActionError } = await supabaseAdmin
        .from('user_double_action_history')
        .delete()
        .gt('action_date', todayPT);
      
      if (deleteActionError) {
        console.error('❌ Error deleting future actions:', deleteActionError);
      } else {
        console.log(`✅ Deleted ${futureActions.length} future action entries\n`);
      }
    } else {
      console.log('✅ No future-dated action entries found\n');
    }
    
    // Find and delete future progress entries
    const { data: futureProgress, error: progressError } = await supabaseAdmin
      .from('user_double_progress')
      .select('*')
      .gt('progress_date', todayPT);
    
    if (progressError) {
      console.error('❌ Error loading future progress:', progressError);
      return;
    }
    
    if (futureProgress && futureProgress.length > 0) {
      console.log(`⚠️  Found ${futureProgress.length} future-dated progress entries:`);
      futureProgress.forEach(entry => {
        console.log(`   - ${entry.progress_date}: ${entry.progress}% (user: ${entry.user_id})`);
      });
      
      // Delete them
      const { error: deleteProgressError } = await supabaseAdmin
        .from('user_double_progress')
        .delete()
        .gt('progress_date', todayPT);
      
      if (deleteProgressError) {
        console.error('❌ Error deleting future progress:', deleteProgressError);
      } else {
        console.log(`✅ Deleted ${futureProgress.length} future progress entries\n`);
      }
    } else {
      console.log('✅ No future-dated progress entries found\n');
    }
    
    console.log('🎉 Cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanupFutureDates();



























































