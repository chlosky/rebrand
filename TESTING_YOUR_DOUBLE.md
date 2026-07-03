# Testing Your Double Integration (Twilio SMS + In-App Chat + OpenAI)

This guide helps you test the Twilio SMS, in-app chat, and OpenAI message generation integration for Your Double.

## Message Limits

### SMS Limits (via Twilio)
- **Basic tier**: 4 messages/day (1 proactive + up to 3 reactive)
- **Plus tier**: 8 messages/day (1 proactive + up to 7 reactive)
- **Premium tier**: 10 messages/day (1 proactive + up to 9 reactive)

### In-App Chat Limits (Frequency Model)
- **Basic tier (Tier 1)**: 15 messages/day (max)
- **Plus tier (Tier 2)**: 30 messages/day (max)
- **Premium tier (Tier 3)**: 60 messages/day (max)

**Note**: SMS and in-app chat have separate limits. Chat messages are simple back-and-forth conversations with no proactive/reactive split. The system sends 1 message per day without user initiation (usually good morning or good night).

## Prerequisites

1. **Environment Variables** (set in Supabase Dashboard > Project Settings > Edge Functions > Secrets):
   - `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
   - `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
   - `TWILIO_PHONE_NUMBER` - Your Twilio phone number (format: +1234567890)
   - `OPENAI_API_KEY` - Your OpenAI API key

2. **Database Setup**:
   - User must have a `phone` number in `profiles` table
   - User must have `texts_enabled = true` in `user_preferences`
   - User must have a `selected_character` in `user_preferences` (river, sage, rose, or oliver)

## Testing Methods

### Method 1: Manual Testing via Supabase Dashboard (Recommended)

#### Test 1: Twilio SMS Sending
1. Go to **Supabase Dashboard** > **Edge Functions** > **send-sms-notification**
2. Click **"Invoke function"**
3. Use this test payload:
```json
{
  "phoneNumber": "+1234567890",
  "message": "Test message from Your Double"
}
```
4. Check your phone for the SMS message
5. ✅ **Success**: You receive the SMS

#### Test 2: OpenAI Message Generation
1. Go to **Edge Functions** > **generate-character-message**
2. Click **"Invoke function"**
3. Use this test payload (for SMS):
```json
{
  "userId": "YOUR_USER_ID",
  "messageType": "proactive"
}
```
Or for in-app chat:
```json
{
  "userId": "YOUR_USER_ID",
  "messageType": "chat",
  "userMessage": "Hello, how are you?"
}
```
4. Check the response for a generated message
5. ✅ **Success**: Response contains a `message` field with character-appropriate text

#### Test 3: Full Reactive Message Flow
1. Go to **Edge Functions** > **handle-reactive-message**
2. Click **"Invoke function"**
3. Use this test payload:
```json
{
  "userId": "YOUR_USER_ID",
  "userMessage": "Hello, this is a test"
}
```
4. Check your phone for the SMS response
5. ✅ **Success**: You receive an SMS response from your character

#### Test 4: Full Proactive Message Flow
1. Go to **Edge Functions** > **send-proactive-character-message**
2. Click **"Invoke function"**
3. Use this test payload (empty body is fine, or):
```json
{}
```
4. Check your phone for the proactive message
5. ✅ **Success**: You receive a proactive SMS from your character

### Method 2: Testing via Your Double UI

#### Test Phone Verification
1. Go to **Your Double** page in the app
2. Click **Settings** (gear icon)
3. Enter your phone number
4. Click **"Send Verification Code"**
5. ✅ **Success**: You receive a verification code via SMS
6. Enter the code and verify

#### Test Reactive Messages (SMS - if webhook is set up)
1. Send an SMS to your Twilio phone number
2. ✅ **Success**: You receive an automated response from your character

#### Test In-App Chat
1. Go to **Your Double** page in the app
2. Click the chat button (top right)
3. Send a message to your character
4. ✅ **Success**: You receive a response in the chat interface
5. Verify chat limits are tracked separately from SMS limits

### Method 3: Using the Test Script

1. Install Deno (if not already installed)
2. Set environment variables:
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export TEST_PHONE_NUMBER="+1234567890"
export TEST_USER_ID="your-user-id"
```

3. Run the test script:
```bash
deno run --allow-net --allow-env test-your-double-integration.ts
```

## Common Issues & Solutions

### Issue: "Twilio credentials not configured"
**Solution**: Check that all Twilio environment variables are set in Supabase Edge Functions secrets.

### Issue: "No phone number found"
**Solution**: 
- Ensure user has `phone` field set in `profiles` table
- Check that phone number is in E.164 format (+1234567890)

### Issue: "Texts are disabled for this user"
**Solution**: 
- Set `texts_enabled = true` in `user_preferences` table
- Or enable texts via the Your Double SMS Settings UI

### Issue: "Failed to generate message" (OpenAI)
**Solution**:
- Check that `OPENAI_API_KEY` is set correctly
- Verify OpenAI API key has sufficient credits
- Check Supabase Edge Functions logs for detailed error

### Issue: SMS not received
**Solution**:
- Verify Twilio phone number is correct
- Check Twilio console for message status
- Ensure phone number is verified in Twilio (for trial accounts)
- Check Supabase Edge Functions logs for errors

## Verification Checklist

- [ ] Twilio SMS sending works (verification code received)
- [ ] OpenAI message generation works (character-appropriate message generated)
- [ ] Reactive message flow works (SMS response received)
- [ ] Proactive message flow works (scheduled message received)
- [ ] In-app chat works (messages sent and received)
- [ ] Messages are saved to `character_messages` table with correct `message_type` ('chat', 'reactive', 'proactive')
- [ ] SMS message limits are tracked in `user_message_limits` table (total_messages, reactive_count)
- [ ] Chat message limits are tracked separately in `user_message_limits` table (chat_count)
- [ ] SMS limits (4/8/10) are enforced correctly
- [ ] Chat limits (15/30/60) are enforced correctly
- [ ] Character persona is correctly applied (tone matches character)

## Database Verification

After testing, verify data was saved correctly:

```sql
-- Check recent messages
SELECT * FROM character_messages 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY sent_at DESC 
LIMIT 10;

-- Check message limits (SMS and chat tracked separately)
SELECT 
  date,
  tier,
  total_messages as sms_total,
  reactive_count as sms_reactive,
  chat_count,
  proactive_sent
FROM user_message_limits 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY date DESC;

-- Check user preferences
SELECT texts_enabled, selected_character, phone 
FROM user_preferences 
WHERE user_id = 'YOUR_USER_ID';
```

## Next Steps

Once basic functionality is verified:
1. Test with different characters (river, sage, rose, oliver)
2. Test SMS message limits (send multiple SMS to verify counting - should hit limit at 4/8/10)
3. Test chat message limits (send multiple chat messages - should hit limit at 15/30/60)
4. Verify SMS and chat limits are tracked separately (chat_count vs total_messages)
5. Test boundary messages (send messages with dangerous keywords)
6. Test proactive scheduling (set up cron job or manual trigger)
7. Test webhook for incoming SMS (if implemented)
8. Verify chat messages don't count toward SMS limits and vice versa


