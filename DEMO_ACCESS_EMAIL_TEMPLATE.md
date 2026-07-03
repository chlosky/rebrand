# Demo Access Email Template Structure

This document outlines the template variables available for the demo access email template in Postmark.

## Template Alias
**`demo-access`**

## Template Variables (TemplateModel)

The following variables are available for use in your Postmark email template:

### Required Variables

1. **`demo_url`** (string)
   - **Description**: The unique, time-limited demo access link for the user
   - **Format**: `https://paletteplot.com/demo-access?token={unique-token}`
   - **Expiration**: 15 minutes from generation
   - **Usage**: This is the main call-to-action link. Users must click this to access the demo.
   - **Example**: `https://paletteplot.com/demo-access?token=abc123-def456-ghi789-jkl012-mno345-pqr678-stu901-vwx234`

2. **`email`** (string)
   - **Description**: The user's email address
   - **Format**: Lowercase email address
   - **Example**: `user@example.com`

### Optional Variables

3. **`site_url`** (string)
   - **Description**: The base URL of the website
   - **Format**: `https://paletteplot.com`
   - **Usage**: Useful for footer links or branding

4. **`unsubscribe_url`** (string)
   - **Description**: Link to unsubscribe from marketing emails
   - **Format**: `https://paletteplot.com/unsubscribe?email={encoded-email}`
   - **Usage**: Required for marketing emails (CAN-SPAM compliance)

## Email Template Structure Example

Here's how you should structure your email template in Postmark:

```
Subject: Try Palette Plotting Demo - Your Access Link (Expires in 15 Minutes)

---

Thanks for your interest in trying Palette Plotting! 

Click the button below to access your demo. This link is unique to you and expires in 15 minutes for security.

[DEMO ACCESS BUTTON - Link to: {{demo_url}}]

Or copy and paste this link into your browser:
{{demo_url}}

---

Important Notes:
- This link expires in 15 minutes
- The link can only be used once
- If the link expires, you can request a new one from our homepage

---

Questions? Reply to this email or visit {{site_url}}/contact

---

You're receiving this because you requested demo access at {{site_url}}.
Unsubscribe: {{unsubscribe_url}}

© 2025 Palette Plotting. All rights reserved.
```

## Key Design Recommendations

1. **Prominent Demo Button**: Make the demo access button the primary CTA, large and clearly visible
2. **Expiration Notice**: Clearly state that the link expires in 15 minutes
3. **Security Message**: Mention that the link is unique and single-use
4. **Fallback Link**: Include a plain text link as backup
5. **Branding**: Use `{{site_url}}` for consistent branding
6. **Compliance**: Always include the unsubscribe link

## Variable Usage in Postmark

In your Postmark template, use these variables with double curly braces (Postmark's standard syntax):

- `{{demo_url}}` - The demo access link
- `{{email}}` - User's email
- `{{site_url}}` - Website URL
- `{{unsubscribe_url}}` - Unsubscribe link

## Testing

When testing your template, you can use these sample values:

```json
{
  "demo_url": "https://paletteplot.com/demo-access?token=test-token-12345",
  "email": "test@example.com",
  "site_url": "https://paletteplot.com",
  "unsubscribe_url": "https://paletteplot.com/unsubscribe?email=test%40example.com"
}
```

## Security Notes

- Each `demo_url` is unique and tied to a specific email address
- Tokens are cryptographically secure (UUID-based)
- Links expire after 15 minutes
- Links can only be used once (marked as used after first access)
- Old tokens are automatically invalidated
