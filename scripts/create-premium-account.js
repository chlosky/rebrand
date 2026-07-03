/**
 * Script to create a premium user account with full access
 * 
 * Usage:
 * 1. Get your Supabase service role key from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
 * 2. Set it as an environment variable: set SUPABASE_SERVICE_ROLE_KEY=your_key_here
 * 3. Run: node scripts/create-premium-account.js
 * 
 * Or pass it directly: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/create-premium-account.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hyckwyjznishkjijrhcw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('\nTo get your service role key:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to Settings > API');
  console.log('4. Copy the "service_role" key (keep it secret!)');
  console.log('\nThen run:');
  console.log('  set SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.log('  node scripts/create-premium-account.js');
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// User details - Get from environment variables or command line arguments
const userData = {
  email: process.env.USER_EMAIL || process.argv[3] || '',
  password: process.env.USER_PASSWORD || process.argv[4] || '',
  username: process.env.USER_USERNAME || process.argv[5] || '',
  phone: process.env.USER_PHONE || process.argv[6] || '',
  firstName: process.env.USER_FIRST_NAME || process.argv[7] || '',
  name: process.env.USER_NAME || process.argv[8] || ''
};

if (!userData.email || !userData.password) {
  console.error('❌ Error: User email and password are required');
  console.log('\nUsage options:');
  console.log('1. Set environment variables:');
  console.log('   USER_EMAIL=email@example.com USER_PASSWORD=password node scripts/create-premium-account.js');
  console.log('2. Pass as command line arguments:');
  console.log('   node scripts/create-premium-account.js <service_role_key> <email> <password> [username] [phone] [firstName] [name]');
  process.exit(1);
}

async function createPremiumAccount() {
  try {
    console.log('🚀 Creating premium account...\n');

    // Step 1: Check if user exists, create or update
    console.log('1. Checking/creating user in Supabase Auth...');
    let userId;
    let authData;
    
    // Try to create user first
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.firstName,
        username: userData.username,
        phone: userData.phone,
        email_consent: true,
        sms_consent: true
      }
    });
    
    if (createError) {
      if (createError.message.includes('already registered') || createError.code === 'email_exists') {
        console.log('   ℹ️  User already exists. Finding and updating existing account...');
        
        // List users to find the one with this email
        const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          throw new Error(`Failed to list users: ${listError.message}`);
        }
        
        const existingUser = usersList.users.find(u => u.email === userData.email);
        if (!existingUser) {
          throw new Error('User email exists but could not find user in list');
        }
        
        userId = existingUser.id;
        
        // Update user with new password and metadata
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: userData.password,
          user_metadata: {
            first_name: userData.firstName,
            username: userData.username,
            phone: userData.phone,
            email_consent: true,
            sms_consent: true
          }
        });
        
        if (updateError) {
          throw new Error(`Failed to update user: ${updateError.message}`);
        }
        
        authData = { user: updatedUser.user };
        console.log(`   ✅ User updated: ${userId}\n`);
      } else {
        throw createError;
      }
    } else {
      userId = newUser.user.id;
      authData = newUser;
      console.log(`   ✅ User created: ${userId}\n`);
    }

    // Step 2: Update profile with username, phone, and first_name
    console.log('2. Updating user profile...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        username: userData.username,
        phone: userData.phone,
        first_name: userData.firstName,
        email: userData.email
      })
      .eq('id', userId);

    if (profileError) {
      console.warn(`   ⚠️  Profile update warning: ${profileError.message}`);
      // Profile might be created by trigger, try to insert if update fails
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          username: userData.username,
          phone: userData.phone,
          first_name: userData.firstName,
          email: userData.email
        });
      
      if (insertError && !insertError.message.includes('duplicate')) {
        console.warn(`   ⚠️  Profile insert warning: ${insertError.message}`);
        // Profile might already exist, continue anyway
      }
    }
    console.log('   ✅ Profile updated\n');

    // Step 3: Set premium tier (user_plans is the source of truth)
    console.log('3. Creating premium subscription...');
    const now = new Date().toISOString();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const { error: planError } = await supabaseAdmin
      .from('user_plans')
      .upsert({
        user_id: userId,
        tier: 'premium',
        status: 'active',
        last_payment_source: 'stripe',
        current_period_end: oneYearFromNow.toISOString(),
        updated_at: now,
      }, {
        onConflict: 'user_id',
      });

    if (planError) {
      console.warn(`   ⚠️  user_plans upsert warning: ${planError.message}`);
      console.log('   ℹ️  You may need to add a user_plans row manually (tier = premium).');
    } else {
      console.log('   ✅ Premium tier set in user_plans\n');
    }

    // Step 4: Verify phone in auth (if possible)
    console.log('4. Setting up phone verification...');
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        phone: userData.phone,
        phone_confirmed_at: new Date().toISOString() // Mark as verified
      });
      console.log('   ✅ Phone marked as verified\n');
    } catch (phoneError) {
      console.warn(`   ⚠️  Phone verification note: ${phoneError.message}`);
      console.log('   ℹ️  Phone number is set in profile. Client-side verification may still be required.\n');
    }

    console.log('✅ Account creation complete!\n');
    console.log('📋 Account Details:');
    console.log(`   Email: ${userData.email}`);
    console.log(`   Username: ${userData.username}`);
    console.log(`   Phone: ${userData.phone}`);
    console.log(`   Name: ${userData.name}`);
    console.log(`   Password: ${userData.password}`);
    console.log(`   Plan: Premium (highest tier)`);
    console.log(`   Status: Active\n`);
    console.log('🎉 The user can now log in with these credentials!');

  } catch (error) {
    console.error('\n❌ Error creating account:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createPremiumAccount();

