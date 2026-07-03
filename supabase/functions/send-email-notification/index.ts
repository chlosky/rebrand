import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Sanitize error messages to prevent exposing sensitive information
function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  
  if (!(error instanceof Error)) {
    return defaultMessage;
  }
  
  const message = error.message.toLowerCase();
  
  // Database errors - hide table/column names
  if (message.includes('relation') || message.includes('column') || 
      message.includes('table') || message.includes('does not exist') ||
      message.includes('syntax error') || message.includes('sql') ||
      message.includes('constraint') || message.includes('violates')) {
    return "Database error. Please try again.";
  }
  
  // RLS/security errors
  if (message.includes('row-level security') || message.includes('rls') || 
      message.includes('permission') || message.includes('unauthorized') ||
      message.includes('pgrst')) {
    return "Permission denied. Please ensure you're logged in.";
  }
  
  // API errors - hide raw responses
  if (message.includes('stripe') || message.includes('openai') || 
      message.includes('api error') || message.includes('api') ||
      message.includes('postmark')) {
    return "Service temporarily unavailable. Please try again.";
  }
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || 
      message.includes('connection') || message.includes('timeout') ||
      message.includes('econnrefused')) {
    return "Connection error. Please check your internet and try again.";
  }
  
  // Configuration errors - hide env var names
  if (message.includes('not configured') || message.includes('missing') || 
      message.includes('env') || message.includes('environment') ||
      message.includes('secret') || message.includes('key')) {
    return "Service configuration error. Please contact support.";
  }
  
  // File/module errors - hide paths
  if (message.includes('cannot find module') || message.includes('file') || 
      message.includes('path') || message.includes('import') ||
      message.includes('module')) {
    return "Internal error. Please try again.";
  }
  
  // Default safe message
  return defaultMessage;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      subject, 
      htmlBody, 
      textBody, 
      from = null, // Optional: defaults to Postmark sender signature
      replyTo = null,
      tag = null,
      metadata = null,
      templateAlias = null, // Optional: Postmark template alias
      templateModel = null, // Optional: Template variables object
      messageStream = 'outbound', // Optional: 'outbound' (transactional) or 'broadcast' (marketing)
    } = await req.json();

    if (!to) {
      throw new Error('Email address is required');
    }

    // If using template, subject is optional (can be set in template)
    // If not using template, subject and body are required
    if (!templateAlias && (!subject || (!htmlBody && !textBody))) {
      throw new Error('Subject and body (HTML or text) are required when not using a template');
    }

    // Use broadcast token if available and messageStream is 'broadcast', otherwise use default token
    const POSTMARK_BROADCAST_TOKEN = Deno.env.get('POSTMARK_BROADCAST_TOKEN');
    const POSTMARK_SERVER_TOKEN = Deno.env.get('POSTMARK_SERVER_TOKEN');
    const POSTMARK_FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL'); // Optional: can use sender signature instead

    // Determine which token to use based on message stream
    const serverToken = (messageStream === 'broadcast' && POSTMARK_BROADCAST_TOKEN) 
      ? POSTMARK_BROADCAST_TOKEN 
      : POSTMARK_SERVER_TOKEN;

    if (!serverToken) {
      throw new Error('Postmark server token not configured');
    }

    // Use environment variable or provided from address, or default to sender signature
    const fromEmail = from || POSTMARK_FROM_EMAIL;

    console.log('Sending email to:', to, templateAlias ? `(using template: ${templateAlias})` : '');
    console.log('MessageStream:', messageStream, 'Using token:', serverToken === POSTMARK_BROADCAST_TOKEN ? 'BROADCAST' : 'DEFAULT');

    // If using Postmark template
    if (templateAlias) {
      const emailPayload: any = {
        To: to,
        TemplateAlias: templateAlias,
        MessageStream: messageStream, // Use provided stream (defaults to 'outbound')
      };

      if (templateModel) {
        emailPayload.TemplateModel = templateModel;
      }
      if (subject) {
        emailPayload.Subject = subject; // Override template subject if provided
      }
      if (fromEmail) {
        emailPayload.From = fromEmail;
      }
      if (replyTo) {
        emailPayload.ReplyTo = replyTo;
      }
      if (tag) {
        emailPayload.Tag = tag;
      }
      if (metadata && typeof metadata === 'object') {
        emailPayload.Metadata = metadata;
      }

      // Send email via Postmark Template API
      const response = await fetch(
        'https://api.postmarkapp.com/email/withTemplate',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Postmark-Server-Token': serverToken,
          },
          body: JSON.stringify(emailPayload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Postmark Template API Error:', error);
        throw new Error(error.Message || `Failed to send email: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Email sent successfully via template:', data.MessageID);

      return new Response(
        JSON.stringify({ 
          success: true,
          messageId: data.MessageID,
          submittedAt: data.SubmittedAt,
          to: data.To
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Otherwise, use direct HTML/text body (backward compatibility)
    const emailPayload: any = {
      To: to,
      Subject: subject,
      MessageStream: messageStream, // Use provided stream (defaults to 'outbound')
    };

    // Add body (prefer HTML, fallback to text)
    if (htmlBody) {
      emailPayload.HtmlBody = htmlBody;
    }
    if (textBody) {
      emailPayload.TextBody = textBody;
    }
    // If only one body type provided, use it for both
    if (htmlBody && !textBody) {
      // Extract text from HTML as fallback (basic)
      emailPayload.TextBody = htmlBody.replace(/<[^>]*>/g, '').trim();
    }
    if (textBody && !htmlBody) {
      emailPayload.HtmlBody = textBody.replace(/\n/g, '<br>');
    }

    // Optional fields
    if (fromEmail) {
      emailPayload.From = fromEmail;
    }
    if (replyTo) {
      emailPayload.ReplyTo = replyTo;
    }
    if (tag) {
      emailPayload.Tag = tag;
    }
    if (metadata && typeof metadata === 'object') {
      emailPayload.Metadata = metadata;
    }

    // Send email via Postmark API
    const response = await fetch(
      'https://api.postmarkapp.com/email',
      {
        method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Postmark-Server-Token': serverToken,
          },
        body: JSON.stringify(emailPayload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Postmark API Error:', error);
      throw new Error(error.Message || `Failed to send email: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Email sent successfully:', data.MessageID);

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: data.MessageID,
        submittedAt: data.SubmittedAt,
        to: data.To
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in send-email-notification:', error);
    return new Response(
      JSON.stringify({ error: sanitizeErrorMessage(error) }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

