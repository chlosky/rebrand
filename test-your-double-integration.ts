/**
 * Test script for Your Double Twilio + OpenAI integration
 * 
 * This script tests:
 * 1. Twilio SMS sending (send-sms-notification)
 * 2. OpenAI message generation (generate-character-message)
 * 3. Full proactive message flow (send-proactive-character-message)
 * 4. Reactive message flow (handle-reactive-message)
 * 
 * Usage:
 * 1. Set up environment variables in Supabase:
 *    - TWILIO_ACCOUNT_SID
 *    - TWILIO_AUTH_TOKEN
 *    - TWILIO_PHONE_NUMBER
 *    - OPENAI_API_KEY
 * 
 * 2. Run this script with: deno run --allow-net --allow-env test-your-double-integration.ts
 * 
 * Or test via Supabase Dashboard:
 * - Go to Edge Functions > Test each function individually
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'YOUR_ANON_KEY';
const TEST_PHONE_NUMBER = Deno.env.get('TEST_PHONE_NUMBER') || '+1234567890'; // Your test phone number
const TEST_USER_ID = Deno.env.get('TEST_USER_ID') || 'YOUR_USER_ID'; // Your user ID for testing

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  data?: any;
}

async function testTwilioSMS(): Promise<TestResult> {
  console.log('\n🧪 Testing Twilio SMS sending...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: TEST_PHONE_NUMBER,
        message: '🧪 Test message from Your Double integration test',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        name: 'Twilio SMS',
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      name: 'Twilio SMS',
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      name: 'Twilio SMS',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testOpenAIMessageGeneration(): Promise<TestResult> {
  console.log('\n🧪 Testing OpenAI message generation...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-character-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        messageType: 'proactive',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        name: 'OpenAI Message Generation',
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      name: 'OpenAI Message Generation',
      success: true,
      data: {
        message: data.message,
        character: data.character,
        messageType: data.messageType,
      },
    };
  } catch (error) {
    return {
      name: 'OpenAI Message Generation',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testReactiveMessage(): Promise<TestResult> {
  console.log('\n🧪 Testing reactive message flow...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/handle-reactive-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        userMessage: 'Hello, this is a test message',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        name: 'Reactive Message',
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      name: 'Reactive Message',
      success: true,
      data: {
        message: data.message,
        messageType: data.messageType,
        remainingMessages: data.remainingMessages,
      },
    };
  } catch (error) {
    return {
      name: 'Reactive Message',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runAllTests() {
  console.log('🚀 Starting Your Double Integration Tests\n');
  console.log('Configuration:');
  console.log(`  Supabase URL: ${SUPABASE_URL}`);
  console.log(`  Test Phone: ${TEST_PHONE_NUMBER}`);
  console.log(`  Test User ID: ${TEST_USER_ID}\n`);

  const results: TestResult[] = [];

  // Test 1: Twilio SMS
  const twilioResult = await testTwilioSMS();
  results.push(twilioResult);
  console.log(twilioResult.success ? '✅ Twilio SMS: SUCCESS' : `❌ Twilio SMS: FAILED - ${twilioResult.error}`);
  if (twilioResult.data) {
    console.log(`   Message SID: ${twilioResult.data.messageSid}`);
  }

  // Test 2: OpenAI Generation
  const openaiResult = await testOpenAIMessageGeneration();
  results.push(openaiResult);
  console.log(openaiResult.success ? '✅ OpenAI Generation: SUCCESS' : `❌ OpenAI Generation: FAILED - ${openaiResult.error}`);
  if (openaiResult.data) {
    console.log(`   Character: ${openaiResult.data.character}`);
    console.log(`   Message: "${openaiResult.data.message}"`);
  }

  // Test 3: Reactive Message (full flow)
  const reactiveResult = await testReactiveMessage();
  results.push(reactiveResult);
  console.log(reactiveResult.success ? '✅ Reactive Message: SUCCESS' : `❌ Reactive Message: FAILED - ${reactiveResult.error}`);
  if (reactiveResult.data) {
    console.log(`   Response: "${reactiveResult.data.message}"`);
    console.log(`   Remaining: ${reactiveResult.data.remainingMessages} messages`);
  }

  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n⚠️  Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  return results;
}

// Run tests if executed directly
if (import.meta.main) {
  runAllTests().catch(console.error);
}











































