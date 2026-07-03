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

// Get today's date in PT timezone
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

async function checkDates() {
  const todayPT = getTodayInPT();
  console.log(`📅 Today in PT: ${todayPT}\n`);
  
  try {
    // Check action history
    const { data: actionHistory, error: actionError } = await supabaseAdmin
      .from('user_double_action_history')
      .select('*')
      .order('action_date', { ascending: false })
      .limit(10);
    
    if (actionError) {
      console.error('❌ Error loading action history:', actionError);
      return;
    }
    
    console.log('📊 Action History (last 10 entries):');
    if (actionHistory && actionHistory.length > 0) {
      actionHistory.forEach(entry => {
        const isToday = entry.action_date === todayPT;
        const isFuture = entry.action_date > todayPT;
        const marker = isToday ? '✅ TODAY' : isFuture ? '⚠️  FUTURE' : '📅 PAST';
        console.log(`   ${marker} ${entry.action_date}: ${JSON.stringify(entry.actions)}`);
      });
    } else {
      console.log('   No entries found');
    }
    
    // Check daily progress
    const { data: progress, error: progressError } = await supabaseAdmin
      .from('user_double_progress')
      .select('*')
      .order('progress_date', { ascending: false })
      .limit(10);
    
    if (progressError) {
      console.error('❌ Error loading progress:', progressError);
      return;
    }
    
    console.log('\n📊 Daily Progress (last 10 entries):');
    if (progress && progress.length > 0) {
      progress.forEach(entry => {
        const isToday = entry.progress_date === todayPT;
        const isFuture = entry.progress_date > todayPT;
        const marker = isToday ? '✅ TODAY' : isFuture ? '⚠️  FUTURE' : '📅 PAST';
        console.log(`   ${marker} ${entry.progress_date}: ${entry.progress}% (${JSON.stringify(entry.completed_actions)})`);
      });
    } else {
      console.log('   No entries found');
    }
    
    // Check for future dates
    const futureActions = actionHistory?.filter(e => e.action_date > todayPT) || [];
    const futureProgress = progress?.filter(e => e.progress_date > todayPT) || [];
    
    if (futureActions.length > 0 || futureProgress.length > 0) {
      console.log('\n⚠️  Found future-dated entries! These should be cleaned up.');
      console.log(`   Future action entries: ${futureActions.length}`);
      console.log(`   Future progress entries: ${futureProgress.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDates();



























































