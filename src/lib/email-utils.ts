import { supabase } from '@/integrations/supabase/client';
import { getEmailTemplate, EMAIL_TEMPLATES, EmailTemplateVariables } from './email-templates';

export interface SendEmailOptions {
  to: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
  tag?: string;
  metadata?: Record<string, string>;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  submittedAt?: string;
  to?: string;
  error?: string;
}

/**
 * Send a transactional email via Postmark
 * 
 * @param options Email options
 * @returns Promise with email response
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email-notification', {
      body: {
        to: options.to,
        subject: options.subject,
        htmlBody: options.htmlBody,
        textBody: options.textBody,
        from: options.from,
        replyTo: options.replyTo,
        tag: options.tag,
        metadata: options.metadata,
      },
    });

    if (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    if (data?.error) {
      return {
        success: false,
        error: data.error,
      };
    }

    return {
      success: true,
      messageId: data?.messageId,
      submittedAt: data?.submittedAt,
      to: data?.to,
    };
  } catch (error: any) {
    console.error('Error in sendEmail:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
}

/**
 * Send a welcome email to a new user
 * Uses template: public/Emails/welcome.html
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName?: string,
  additionalVars?: Partial<EmailTemplateVariables>
): Promise<SendEmailResponse> {
  const name = userName || 'there';
  
  const { html, text } = await getEmailTemplate(EMAIL_TEMPLATES.WELCOME, {
    name,
    feature_image_1_url: `${window.location.origin}/placeholder.svg`, // Update with actual image URLs
    feature_image_2_url: `${window.location.origin}/placeholder.svg`,
    ...additionalVars,
  });
  
  return sendEmail({
    to: userEmail,
    subject: 'Welcome to Palette Plotting',
    htmlBody: html,
    textBody: text,
    tag: 'welcome',
    metadata: {
      email_type: 'welcome',
      user_name: name,
    },
  });
}

/**
 * Send a welcome back email
 * Uses template: public/Emails/welcome-back.html
 */
export async function sendWelcomeBackEmail(
  userEmail: string,
  userName?: string,
  additionalVars?: Partial<EmailTemplateVariables>
): Promise<SendEmailResponse> {
  const name = userName || 'there';
  
  const { html, text } = await getEmailTemplate(EMAIL_TEMPLATES.WELCOME_BACK, {
    name,
    ...additionalVars,
  });
  
  return sendEmail({
    to: userEmail,
    subject: 'Welcome back to Palette Plotting',
    htmlBody: html,
    textBody: text,
    tag: 'welcome-back',
    metadata: {
      email_type: 'welcome_back',
      user_name: name,
    },
  });
}

/**
 * Send an email verification email
 * Uses template: public/Emails/email-verification.html
 */
export async function sendEmailVerification(
  userEmail: string,
  verificationUrl: string,
  userName?: string,
  additionalVars?: Partial<EmailTemplateVariables>
): Promise<SendEmailResponse> {
  const name = userName || 'there';
  
  const { html, text } = await getEmailTemplate(EMAIL_TEMPLATES.EMAIL_VERIFICATION, {
    name,
    verification_url: verificationUrl,
    ...additionalVars,
  });
  
  return sendEmail({
    to: userEmail,
    subject: 'Verify your email address',
    htmlBody: html,
    textBody: text,
    tag: 'email-verification',
    metadata: {
      email_type: 'email_verification',
    },
  });
}

/**
 * Send a password change notification
 * Uses template: public/Emails/password-change.html
 */
export async function sendPasswordChangeEmail(
  userEmail: string,
  userName?: string,
  resetPasswordUrl?: string,
  additionalVars?: Partial<EmailTemplateVariables>
): Promise<SendEmailResponse> {
  const name = userName || 'there';
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();
  
  const { html, text } = await getEmailTemplate(EMAIL_TEMPLATES.PASSWORD_CHANGE, {
    name,
    date,
    time,
    reset_password_url: resetPasswordUrl || `${window.location.origin}/login?reset=true`,
    ...additionalVars,
  });
  
  return sendEmail({
    to: userEmail,
    subject: 'Your password was changed',
    htmlBody: html,
    textBody: text,
    tag: 'password-change',
    metadata: {
      email_type: 'password_change',
    },
  });
}

/**
 * Send a payment receipt email
 * Uses template: public/Emails/payment-receipt.html
 */
export async function sendPaymentReceiptEmail(
  userEmail: string,
  amount: string,
  planName: string,
  paymentDate: string,
  paymentMethod: string,
  nextPaymentDate: string,
  billingUrl: string,
  userName?: string,
  additionalVars?: Partial<EmailTemplateVariables>
): Promise<SendEmailResponse> {
  const name = userName || 'there';
  
  const { html, text } = await getEmailTemplate(EMAIL_TEMPLATES.PAYMENT_RECEIPT, {
    name,
    amount,
    plan_name: planName,
    payment_date: paymentDate,
    payment_method: paymentMethod,
    next_payment_date: nextPaymentDate,
    billing_url: billingUrl,
    ...additionalVars,
  });
  
  return sendEmail({
    to: userEmail,
    subject: 'Payment received',
    htmlBody: html,
    textBody: text,
    tag: 'payment-receipt',
    metadata: {
      email_type: 'payment_receipt',
      plan_name: planName,
      amount,
    },
  });
}

/**
 * Send a failed payment notification
 * Uses template: public/Emails/failed-payment.html
 */
export async function sendFailedPaymentEmail(
  userEmail: string,
  planName: string,
  expiryDate: string,
  paymentUpdateUrl: string,
  userName?: string,
  additionalVars?: Partial<EmailTemplateVariables>
): Promise<SendEmailResponse> {
  const name = userName || 'there';
  
  const { html, text } = await getEmailTemplate(EMAIL_TEMPLATES.FAILED_PAYMENT, {
    name,
    plan_name: planName,
    expiry_date: expiryDate,
    payment_update_url: paymentUpdateUrl,
    ...additionalVars,
  });
  
  return sendEmail({
    to: userEmail,
    subject: 'Payment failed',
    htmlBody: html,
    textBody: text,
    tag: 'failed-payment',
    metadata: {
      email_type: 'failed_payment',
      plan_name: planName,
    },
  });
}

/**
 * Send a subscription change notification
 * Uses template: public/Emails/subscription-change.html
 */
export async function sendSubscriptionChangeEmail(
  userEmail: string,
  newPlanName: string,
  effectiveDate: string,
  isUpgrade: boolean,
  billingUrl: string,
  userName?: string,
  additionalVars?: Partial<EmailTemplateVariables>
): Promise<SendEmailResponse> {
  const name = userName || 'there';
  
  // Build subscription message based on upgrade/downgrade
  const subscriptionMessage = isUpgrade
    ? 'Your new features are available now.'
    : `Your current features will remain active until ${effectiveDate}.`;

  const { html, text } = await getEmailTemplate(EMAIL_TEMPLATES.SUBSCRIPTION_CHANGE, {
    name,
    new_plan_name: newPlanName,
    effective_date: effectiveDate,
    subscription_message: subscriptionMessage,
    billing_url: billingUrl,
    ...additionalVars,
  });
  
  return sendEmail({
    to: userEmail,
    subject: 'Your subscription has been updated',
    htmlBody: html,
    textBody: text,
    tag: 'subscription-change',
    metadata: {
      email_type: 'subscription_change',
      new_plan_name: newPlanName,
    },
  });
}

/**
 * Send a cancellation email
 * Uses template: public/Emails/cancellation.html
 */
export async function sendCancellationEmail(
  userEmail: string,
  expiryDate: string,
  reactivateUrl: string,
  userName?: string,
  additionalVars?: Partial<EmailTemplateVariables>
): Promise<SendEmailResponse> {
  const name = userName || 'there';
  
  const { html, text } = await getEmailTemplate(EMAIL_TEMPLATES.CANCELLATION, {
    name,
    expiry_date: expiryDate,
    reactivate_url: reactivateUrl,
    ...additionalVars,
  });
  
  return sendEmail({
    to: userEmail,
    subject: 'Your subscription has been cancelled',
    htmlBody: html,
    textBody: text,
    tag: 'cancellation',
    metadata: {
      email_type: 'cancellation',
    },
  });
}

/**
 * Send an account deletion email
 * Uses template: public/Emails/account-deletion.html
 */
export async function sendAccountDeletionEmail(
  userEmail: string,
  userName?: string,
  additionalVars?: Partial<EmailTemplateVariables>
): Promise<SendEmailResponse> {
  const name = userName || 'there';
  
  const { html, text } = await getEmailTemplate(EMAIL_TEMPLATES.ACCOUNT_DELETION, {
    name,
    ...additionalVars,
  });
  
  return sendEmail({
    to: userEmail,
    subject: 'Your account has been deleted',
    htmlBody: html,
    textBody: text,
    tag: 'account-deletion',
    metadata: {
      email_type: 'account_deletion',
    },
  });
}

/**
 * Send an email change notification
 * Uses template: public/Emails/email-change.html
 */
export async function sendEmailChangeEmail(
  userEmail: string,
  newEmail: string,
  confirmationUrl: string,
  userName?: string,
  additionalVars?: Partial<EmailTemplateVariables>
): Promise<SendEmailResponse> {
  const name = userName || 'there';
  
  const { html, text } = await getEmailTemplate(EMAIL_TEMPLATES.EMAIL_CHANGE, {
    name,
    new_email: newEmail,
    confirmation_url: confirmationUrl,
    ...additionalVars,
  });
  
  return sendEmail({
    to: userEmail,
    subject: 'Confirm your new email address',
    htmlBody: html,
    textBody: text,
    tag: 'email-change',
    metadata: {
      email_type: 'email_change',
    },
  });
}

/**
 * Send a phone change notification
 * Uses template: public/Emails/phone-change.html
 */
export async function sendPhoneChangeEmail(
  userEmail: string,
  newPhone: string,
  userName?: string,
  supportUrl?: string,
  additionalVars?: Partial<EmailTemplateVariables>
): Promise<SendEmailResponse> {
  const name = userName || 'there';
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();
  
  const { html, text } = await getEmailTemplate(EMAIL_TEMPLATES.PHONE_CHANGE, {
    name,
    new_phone: newPhone,
    date,
    time,
    support_url: supportUrl || `mailto:support@paletteplot.com`,
    ...additionalVars,
  });
  
  return sendEmail({
    to: userEmail,
    subject: 'Your phone number was updated',
    htmlBody: html,
    textBody: text,
    tag: 'phone-change',
    metadata: {
      email_type: 'phone_change',
    },
  });
}
