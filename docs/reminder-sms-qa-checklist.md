# Reminder SMS — manual QA checklist

1. User chooses email only → reminder sends email, no SMS.
2. User chooses calendar only → iCal/export path works, no email/SMS unless selected.
3. User chooses SMS with no phone → app asks for phone.
4. User chooses SMS with no consent → app asks for consent.
5. User tries SMS content over 70 chars → blocked at send (server validation).
6. User creates 5 SMS reminders due same day → all can send.
7. User creates 6th SMS reminder due same day → 6th is `skipped_limit`; email still sends if enabled.
8. SMS failure does not stop email reminder.
9. Email failure does not stop SMS reminder.
10. User opts out of SMS → future SMS reminders skip (`skipped_no_consent`).
11. `BREVO_API_KEY` missing → server logs clear error, cron does not crash.
12. Brevo returns non-200 → reminder records failed SMS status in `board_reminders` and `palette_sms_send_log`.
13. Existing email reminders still work.
14. Existing iCal export still works.
15. No promotional SMS is sent (transactional tag `palette_plan_reminder` only).

## Onboarding

- Attribution → Reminder channels screen uses follow-through copy.
- Default selection: Email + Calendar; Text unchecked.
- Text selection requires phone + transactional consent (not marketing language).

## Deploy

```bash
supabase db push   # or apply migration 20260707140000_reminder_sms_channels.sql
supabase secrets set BREVO_API_KEY=... BREVO_SMS_SENDER=Palette
supabase functions deploy send-sms-notification process-board-reminders
```
