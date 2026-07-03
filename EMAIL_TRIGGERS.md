# Email Trigger Points

This document shows where email templates are triggered in the codebase. All emails use HTML templates from `public/Emails/` folder.

## ✅ Implemented Triggers

### 1. Payment Receipt
**Location:** `supabase/functions/stripe-webhook/index.ts` (handleInvoicePaymentSucceeded)
**Function:** `sendPaymentReceiptEmail()`
**Template:** `payment-receipt.html`
**Trigger:** After successful payment (invoice.payment_succeeded webhook)

### 2. Failed Payment
**Location:** `supabase/functions/stripe-webhook/index.ts` (handleInvoicePaymentFailed)
**Function:** `sendFailedPaymentEmail()`
**Template:** `failed-payment.html`
**Trigger:** After failed payment (invoice.payment_failed webhook)

### 3. Subscription Change
**Location:** `supabase/functions/stripe-webhook/index.ts` (handleSubscriptionUpdate)
**Function:** `sendSubscriptionChangeEmail()`
**Template:** `subscription-change.html`
**Trigger:** When subscription tier changes (customer.subscription.updated)

### 4. Cancellation
**Location:** `supabase/functions/stripe-webhook/index.ts` (handleSubscriptionCancellation)
**Function:** `sendCancellationEmail()`
**Template:** `cancellation.html`
**Trigger:** When subscription is cancelled (customer.subscription.deleted)

### 5. Password Change
**Location:** `src/pages/Settings.tsx` (handleChangePassword)
**Function:** `sendPasswordChangeEmail()`
**Template:** `password-change.html`
**Trigger:** After user successfully changes password

### 6. Phone Change
**Location:** `src/pages/Settings.tsx` (handleUpdateProfile)
**Function:** `sendPhoneChangeEmail()`
**Template:** `phone-change.html`
**Trigger:** After user updates phone number

## 📝 To Be Implemented

### Welcome Email
**Location:** `src/lib/email-utils.ts` (`sendWelcomeEmail`)
**Template:** `welcome.html`
**Note:** No caller in the app or edge functions currently invokes this; add one where signup should trigger welcome (legacy onboarding `SignUp` route was removed).

### Email Verification
**Location:** Supabase Auth (handled automatically, but can be customized)
**Function:** `sendEmailVerification()`
**Template:** `email-verification.html`
**Note:** Supabase handles email verification automatically. To use custom template, you'd need to customize Supabase Auth email templates in dashboard.

### Email Change
**Location:** `src/pages/Settings.tsx` (when email is changed)
**Function:** `sendEmailChangeEmail()`
**Template:** `email-change.html`
**Trigger:** When user changes email address

### Welcome Back
**Location:** `src/pages/Auth.tsx` or login flow
**Function:** `sendWelcomeBackEmail()`
**Template:** `welcome-back.html`
**Trigger:** When user logs in after extended absence (optional)

### Account Deletion
**Location:** Account deletion flow (if exists)
**Function:** `sendAccountDeletionEmail()`
**Template:** `account-deletion.html`
**Trigger:** When user requests account deletion

## 🔧 How to Edit Templates

1. Edit HTML files in `public/Emails/` folder
2. Use `{{variable_name}}` for dynamic content
3. Changes are automatically picked up (templates are loaded at runtime)
4. No code changes needed - just edit the HTML files!

## 📋 Template Variables

Common variables available in all templates:
- `{{name}}` - User's name
- `{{app_url}}` - App URL (defaults to current origin)
- `{{privacy_policy_url}}` - Privacy policy URL
- `{{tiktok_url}}`, `{{youtube_url}}`, `{{instagram_url}}` - Social media links

See `src/lib/email-templates.ts` for full list of available variables.

