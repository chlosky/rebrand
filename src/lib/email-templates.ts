/**
 * Email Template System
 * 
 * This module loads HTML email templates from /Emails/ folder and replaces placeholders.
 * Templates use {{variable_name}} syntax for dynamic content.
 * 
 * To edit templates, modify the HTML files in public/Emails/ folder.
 */

export interface EmailTemplateVariables {
  // Common variables
  name?: string;
  app_url?: string;
  privacy_policy_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  instagram_url?: string;
  
  // Email verification
  verification_url?: string;
  
  // Password
  reset_password_url?: string;
  date?: string;
  time?: string;
  
  // Payment
  amount?: string;
  plan_name?: string;
  payment_date?: string;
  payment_method?: string;
  next_payment_date?: string;
  billing_url?: string;
  
  // Subscription
  new_plan_name?: string;
  effective_date?: string;
  is_upgrade?: boolean;
  is_downgrade?: boolean;
  
  // Failed payment
  expiry_date?: string;
  payment_update_url?: string;
  
  // Welcome
  feature_image_1_url?: string;
  feature_image_2_url?: string;
  
  // Email change
  new_email?: string;
  confirmation_url?: string;
  
  // Phone change
  new_phone?: string;
  support_url?: string;
  
  // Cancellation
  reactivate_url?: string;
  
  // Custom variables (for any additional placeholders)
  [key: string]: string | boolean | undefined;
}

/**
 * Load an HTML email template from the public/Emails folder
 */
async function loadEmailTemplate(templateName: string): Promise<string> {
  try {
    const response = await fetch(`/Emails/${templateName}.html`);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${templateName}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error loading email template ${templateName}:`, error);
    throw error;
  }
}

/**
 * Replace placeholders in HTML template with actual values
 * Supports {{variable}} syntax
 */
function replaceTemplateVariables(template: string, variables: EmailTemplateVariables): string {
  let result = template;
  
  // Default values for common variables
  const defaults: Partial<EmailTemplateVariables> = {
    app_url: window.location.origin,
    privacy_policy_url: `${window.location.origin}/privacy`,
    tiktok_url: 'https://tiktok.com/@paletteplotting',
    youtube_url: 'https://youtube.com/@paletteplotting',
    instagram_url: 'https://instagram.com/paletteplotting',
  };
  
  // Merge defaults with provided variables
  const allVariables = { ...defaults, ...variables };
  
  // Replace all {{variable}} placeholders
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = allVariables[key];
    if (value === undefined || value === null) {
      console.warn(`Template variable ${key} is undefined`);
      return match; // Keep placeholder if value not found
    }
    return String(value);
  });
  
  // Handle conditional blocks (simple {{#if variable}}...{{/if}} syntax)
  // Note: This is a simple implementation. For complex logic, consider a template engine.
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, conditionKey, content) => {
    const conditionValue = allVariables[conditionKey];
    if (conditionValue === true || conditionValue === 'true') {
      return content;
    }
    return '';
  });
  
  return result;
}

/**
 * Generate plain text version from HTML (simple extraction)
 */
function htmlToText(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Replace common HTML elements with text equivalents
  text = text.replace(/<h[1-6][^>]*>/gi, '\n\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n');
  text = text.replace(/<p[^>]*>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi, '$2 ($1)');
  text = text.replace(/<[^>]+>/g, ''); // Remove all remaining HTML tags
  
  // Clean up whitespace
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  text = text.trim();
  
  return text;
}

/**
 * Get email template with variables replaced
 */
export async function getEmailTemplate(
  templateName: string,
  variables: EmailTemplateVariables
): Promise<{ html: string; text: string }> {
  const htmlTemplate = await loadEmailTemplate(templateName);
  const html = replaceTemplateVariables(htmlTemplate, variables);
  const text = htmlToText(html);
  
  return { html, text };
}

/**
 * Email template names (matching files in public/Emails/)
 */
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  WELCOME_BACK: 'welcome-back',
  EMAIL_VERIFICATION: 'email-verification',
  PASSWORD_CHANGE: 'password-change',
  PASSWORD_RESET: 'password-reset',
  PAYMENT_RECEIPT: 'payment-receipt',
  FAILED_PAYMENT: 'failed-payment',
  SUBSCRIPTION_CHANGE: 'subscription-change',
  CANCELLATION: 'cancellation',
  ACCOUNT_DELETION: 'account-deletion',
  EMAIL_CHANGE: 'email-change',
  PHONE_CHANGE: 'phone-change',
} as const;

