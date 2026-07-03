# Postmark Email Setup Guide

This guide will help you set up Postmark for sending transactional emails in Belief Craft Nexus.

## Prerequisites

1. A Postmark account (sign up at https://postmarkapp.com)
2. Access to your Supabase project dashboard

## Step 1: Create a Postmark Account

1. Go to https://postmarkapp.com and sign up for an account
2. Postmark offers a free tier with 100 emails/month for testing

## Step 2: Create a Server

1. In your Postmark dashboard, go to **Servers**
2. Click **"Add Server"** or **"Create Server"**
3. Give it a name (e.g., "Belief Craft Nexus Production")
4. Choose your server type (usually "Transactional" for app emails)
5. Note your **Server API Token** - you'll need this in the next step

## Step 3: Verify Your Sender Signature

1. In Postmark, go to **Sending** > **Signatures**
2. Click **"Add Signature"**
3. Add your email address (e.g., `noreply@yourdomain.com` or `hello@yourdomain.com`)
4. Verify the email address by clicking the verification link sent to that email
5. Once verified, you can use this email as the "From" address

**Note**: For production, you should use a domain you own. For testing, you can use Postmark's test email addresses.

## Step 4: Configure Supabase Environment Variables

1. Go to your **Supabase Dashboard** > **Project Settings** > **Edge Functions** > **Secrets**
2. Add the following secrets:

   - **`POSTMARK_SERVER_TOKEN`**: Your Postmark Server API Token (from Step 2)
   - **`POSTMARK_FROM_EMAIL`** (optional): The verified sender email address (from Step 3)

   Example:
   ```
   POSTMARK_SERVER_TOKEN=your-server-api-token-here
   POSTMARK_FROM_EMAIL=noreply@yourdomain.com
   ```

## Step 5: Deploy the Edge Function

The `send-email-notification` edge function is already created. Deploy it using:

```bash
supabase functions deploy send-email-notification
```

Or if you're using the Supabase CLI:

```bash
npx supabase functions deploy send-email-notification
```

## Step 6: Test the Integration

You can test the email function in several ways:

### Option 1: Test via Supabase Dashboard

1. Go to **Supabase Dashboard** > **Edge Functions** > **send-email-notification**
2. Click **"Invoke function"**
3. Use this test payload:

```json
{
  "to": "your-email@example.com",
  "subject": "Test Email",
  "htmlBody": "<h1>Hello!</h1><p>This is a test email from Postmark.</p>",
  "textBody": "Hello!\n\nThis is a test email from Postmark.",
  "tag": "test"
}
```

4. Check your email inbox

### Option 2: Test via Frontend Code

```typescript
import { sendEmail } from '@/lib/email-utils';

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Test Email',
  htmlBody: '<h1>Hello!</h1><p>This is a test.</p>',
  textBody: 'Hello!\n\nThis is a test.',
  tag: 'test'
});

if (result.success) {
  console.log('Email sent!', result.messageId);
} else {
  console.error('Error:', result.error);
}
```

## Usage Examples

### Send a Welcome Email

```typescript
import { sendWelcomeEmail } from '@/lib/email-utils';

await sendWelcomeEmail('user@example.com', 'John');
```

### Send a Password Reset Email

```typescript
import { sendPasswordResetEmail } from '@/lib/email-utils';

const resetLink = 'https://yourapp.com/reset-password?token=abc123';
await sendPasswordResetEmail('user@example.com', resetLink);
```

### Send a Custom Email

```typescript
import { sendEmail } from '@/lib/email-utils';

await sendEmail({
  to: 'user@example.com',
  subject: 'Weekly Check-In',
  htmlBody: '<h1>Time for your weekly check-in!</h1>',
  textBody: 'Time for your weekly check-in!',
  tag: 'weekly-checkin',
  metadata: {
    user_id: '123',
    checkin_type: 'weekly'
  }
});
```

## Email Function Parameters

The `send-email-notification` function accepts:

- **`to`** (required): Recipient email address
- **`subject`** (required): Email subject line
- **`htmlBody`** (optional): HTML email body
- **`textBody`** (optional): Plain text email body
- **`from`** (optional): Sender email (defaults to POSTMARK_FROM_EMAIL or sender signature)
- **`replyTo`** (optional): Reply-to email address
- **`tag`** (optional): Tag for tracking/analytics
- **`metadata`** (optional): Key-value pairs for additional tracking

## Postmark Limits

- **Free Tier**: 100 emails/month
- **Paid Plans**: Start at $15/month for 10,000 emails

Check Postmark's pricing page for current limits: https://postmarkapp.com/pricing

## Troubleshooting

### "Postmark server token not configured"
- Make sure you've added `POSTMARK_SERVER_TOKEN` to Supabase Edge Function secrets
- Verify the token is correct (check for typos)

### "Failed to send email"
- Check Postmark dashboard for error details
- Verify your sender signature is verified
- Check that you haven't exceeded your email limit

### Emails going to spam
- Make sure you're using a verified sender signature
- For production, use a domain you own and set up SPF/DKIM records
- Postmark provides instructions for setting up these records

## Additional Resources

- [Postmark Documentation](https://postmarkapp.com/developer)
- [Postmark API Reference](https://postmarkapp.com/developer/api/email-api)
- [Setting up SPF/DKIM](https://postmarkapp.com/support/article/910-getting-started-with-spf)

