# Handoff: Settings + Manifestation routine — full code and copy (en / es-419 / pt-BR)

Updated **2026-06-09** after premium copy pass + Settings-tab locale-key fix. Paste this entire file to ChatGPT. English is reference.

## What changed in this revision

| Change | File | Detail |
|--------|------|--------|
| **Stale language fix** | `src/pages/Settings.tsx` | All four `TabsContent` panels now keyed with `localeKey`: `profile-`, `settings-`, `billing-`, `legal-`. Settings tab was the missing one — preference cards could show old language until tab switch. |
| **Premium copy pass** | `src/i18n/locales/{en,es-419,pt-BR}/settings.json` | All existing `settings` keys updated (no renames). Highlights: `Email updates`, `Allow data training`, fuller deletion/billing copy in es/pt, `Enfocada`/`Focada` intensity titles, expanded routine notification descriptions. |
| **Unchanged** | `LanguageSwitcher`, `pushLocale.ts`, `common.json` | Language names stay `English \| Español \| Português`. Routine push payload already matched spec. |

---

## Routes

| Screen | Path | Component |
|--------|------|-----------|
| Settings | `/dashboard/settings` | `src/pages/Settings.tsx` |
| Manifestation routine subpage | `/dashboard/settings/manifestation-routine` | `src/pages/ManifestationRoutineSettings.tsx` |

**i18n namespace:** `settings` (+ `common:cancel`, `common:continue` on deletion dialogs)  
**JSON files:** `src/i18n/locales/{en,es-419,pt-BR}/settings.json`

---

## Settings tabs (4) — all locale-keyed

| Tab value | English | es-419 | pt-BR | Key | TabsContent key |
|-----------|---------|--------|-------|-----|-----------------|
| profile | Profile | Perfil | Perfil | `tabs.profile` | `profile-${localeKey}` |
| settings | Settings | Ajustes | Configurações | `tabs.settings` | `settings-${localeKey}` |
| billing | Billing | Facturación | Assinatura | `tabs.billing` | `billing-${localeKey}` |
| legal | Legal | Legal | Legal | `tabs.legal` | `legal-${localeKey}` |

**Header:** `header` — Your Account / Tu cuenta / Sua conta

### Profile tab
- Name, username, email (read-only), change password block
- **Phone UI is hidden** in code (`{false && (` … )}`) — copy exists in JSON but not shown

### Settings tab (preferences)
- Language card + `LanguageSwitcher` (labels English | Español | Português — hardcoded in `locale.ts`)
- Manifestation routine link card → subpage
- Email marketing toggle (`preferences.emailMarketingLabel` → "Email updates" / "Novedades por correo" / "Atualizações por e-mail")
- Data training opt-in toggle
- Delete account card + 2 confirm dialogs

### Billing tab
- Current plan (weekly/monthly/annual from DB)
- Manage Billing button (RevenueCat / App Store / Play routing)

### Legal tab
- Links: FAQ, Terms, Privacy, AUP, Billing & Refunds, DMCA, EULA, Contact
- Terms/Privacy use locale paths via `legalTermsPath` / `legalPrivacyPath`

---

## Manifestation routine subpage

Single scroll page (no tabs):
1. **Manifesting intensity** — 3 tiles: light / consistent / locked_in
2. **Routine notifications** — toggle, timezone select, 1–3 time pickers by intensity

**Default alert times (not copy — persisted):**
- light: 21:30
- consistent: 07:00, 21:30
- locked_in: 07:00, 18:30, 21:30

**Hardcoded English (not i18n):**
- `ManifestationRoutineSettings.tsx` debug toast: `Routine notification setup failed at ${step}...`

---

## Full settings namespace copy (all keys)

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `title` | Settings | Ajustes | Configurações |
| `header` | Your Account | Tu cuenta | Sua conta |
| `tabs.profile` | Profile | Perfil | Perfil |
| `tabs.settings` | Settings | Ajustes | Configurações |
| `tabs.billing` | Billing | Facturación | Assinatura |
| `tabs.legal` | Legal | Legal | Legal |
| `language.heading` | Language | Idioma | Idioma |
| `language.description` | Choose your app language. | Elige el idioma de la app. | Escolha o idioma do app. |
| `profile.nameLabel` | Name | Nombre | Nome |
| `profile.usernameLabel` | Username | Usuario | Nome de usuário |
| `profile.emailLabel` | Email | Correo electrónico | E-mail |
| `profile.emailCannotChange` | Email cannot be changed | El correo no se puede cambiar | O e-mail não pode ser alterado |
| `profile.phoneLabel` | Phone Number | Número de teléfono | Número de telefone |
| `profile.updateButton` | Update Profile | Actualizar perfil | Atualizar perfil |
| `profile.namePlaceholder` | Enter your name | Ingresa tu nombre | Digite seu nome |
| `profile.usernamePlaceholder` | Enter your username | Ingresa tu usuario | Digite seu nome de usuário |
| `profile.phonePlaceholder` | +1 (555) 123-4567 | +52 55 1234 5678 | +55 (11) 91234-5678 |
| `profile.codePlaceholder` | Enter 6-digit code | Código de 6 dígitos | Código de 6 dígitos |
| `profile.sendCode` | Send Code | Enviar código | Enviar código |
| `profile.sendingCode` | Sending… | Enviando… | Enviando… |
| `profile.verify` | Verify | Verificar | Verificar |
| `profile.verifyPhoneHint` | Please verify your phone number to update it | Verifica tu número de teléfono para actualizarlo | Verifique seu número de telefone para atualizá-lo |
| `profile.phoneVerified` | ✓ Phone number verified | ✓ Teléfono verificado | ✓ Telefone verificado |
| `profile.newPhoneVerified` | ✓ New phone number verified | ✓ Nuevo teléfono verificado | ✓ Novo telefone verificado |
| `profile.changePasswordHeading` | Change Password | Cambiar contraseña | Alterar senha |
| `profile.currentPasswordLabel` | Current Password | Contraseña actual | Senha atual |
| `profile.newPasswordLabel` | New Password | Nueva contraseña | Nova senha |
| `profile.confirmPasswordLabel` | Confirm New Password | Confirmar nueva contraseña | Confirmar nova senha |
| `profile.changePasswordButton` | Change Password | Cambiar contraseña | Alterar senha |
| `profile.validatingPassword` | Validating password… | Validando contraseña… | Validando senha… |
| `profile.currentPasswordPlaceholder` | Enter current password | Ingresa tu contraseña actual | Digite sua senha atual |
| `profile.newPasswordPlaceholder` | Enter new password | Ingresa tu nueva contraseña | Digite sua nova senha |
| `profile.confirmPasswordPlaceholder` | Confirm new password | Confirma tu nueva contraseña | Confirme sua nova senha |
| `profile.smsVerificationMessage` | Your verification code is: {{code}} | Tu código de verificación es: {{code}} | Seu código de verificação é: {{code}} |
| `passwordValidation.minLength` | Password must be at least 8 characters long | Mínimo 8 caracteres | Mínimo de 8 caracteres |
| `passwordValidation.lowercase` | Password must contain at least one lowercase letter | Incluye una minúscula | Inclua uma letra minúscula |
| `passwordValidation.uppercase` | Password must contain at least one uppercase letter | Incluye una mayúscula | Inclua uma letra maiúscula |
| `passwordValidation.digit` | Password must contain at least one digit | Incluye un número | Inclua um número |
| `passwordValidation.mismatch` | Passwords do not match | Las contraseñas no coinciden | As senhas não coincidem |
| `preferences.routineHeading` | Manifestation routine | Rutina de manifestación | Rotina de manifestação |
| `preferences.routineDescription` | Adjust your manifestation intensity, routine expectations, and routine notifications. | Ajusta tu intensidad, tu rutina y tus notificaciones. | Ajuste sua intensidade, sua rotina e suas notificações. |
| `preferences.routineButtonTitle` | Routine & intensity | Rutina e intensidad | Rotina e intensidade |
| `preferences.routineButtonSubtitle` | Set routine intensity & notifications | Intensidad y notificaciones | Intensidade e notificações |
| `preferences.emailHeading` | Email preferences | Preferencias de correo | Preferências de e-mail |
| `preferences.emailDescription` | Manifestation tips, product updates, and app news by email. | Consejos de manifestación, novedades del producto y noticias de la app por correo. | Dicas de manifestação, novidades do produto e notícias do app por e-mail. |
| `preferences.emailMarketingLabel` | Email updates | Novedades por correo | Atualizações por e-mail |
| `preferences.textMarketingLabel` | Text updates | Novedades por SMS | Atualizações por SMS |
| `preferences.dataTrainingHeading` | Data training | Entrenamiento de datos | Treinamento de dados |
| `preferences.dataTrainingDescription` | Help improve the experience by allowing anonymized usage to be used for model training. Default is off. | Ayuda a mejorar la experiencia permitiendo el uso de datos anónimos para entrenar modelos. Está desactivado por defecto. | Ajude a melhorar a experiência permitindo o uso de dados anônimos para treinar modelos. A opção vem desativada por padrão. |
| `preferences.dataTrainingLabel` | Allow data training | Permitir entrenamiento de datos | Permitir treinamento de dados |
| `preferences.timeZoneLabel` | Time zone | Zona horaria | Fuso horário |
| `deletion.heading` | Delete account | Eliminar cuenta | Excluir conta |
| `deletion.scheduledPrefix` | Your account is scheduled for deletion on | Tu cuenta está programada para eliminarse el | Sua conta está programada para exclusão em |
| `deletion.scheduledSuffix` | You can cancel before then. | Puedes cancelar antes de esa fecha. | Você pode cancelar antes dessa data. |
| `deletion.description` | Permanently delete your account and all associated data. This cannot be undone and your data cannot be retrieved. Deletion is scheduled 30 days after you confirm. | Elimina permanentemente tu cuenta y todos los datos asociados. Esta acción no se puede deshacer y tus datos no se podrán recuperar. La eliminación se programa 30 días después de confirmar. | Exclua permanentemente sua conta e todos os dados associados. Essa ação não pode ser desfeita e seus dados não poderão ser recuperados. A exclusão é agendada para 30 dias após a confirmação. |
| `deletion.cancelRequest` | Cancel deletion request | Cancelar solicitud de eliminación | Cancelar solicitação de exclusão |
| `deletion.deleteButton` | Delete my account | Eliminar mi cuenta | Excluir minha conta |
| `deletion.confirm1Title` | Delete your account? | ¿Eliminar tu cuenta? | Excluir sua conta? |
| `deletion.confirm1Body` | Your account and all associated data (profile, preferences, content) will be permanently deleted. You will not be able to retrieve or recover this data. This is a final decision. Do you want to continue? | Tu cuenta y todos los datos asociados — perfil, preferencias y contenido — se eliminarán permanentemente. No podrás recuperar estos datos. Esta decisión es final. ¿Quieres continuar? | Sua conta e todos os dados associados — perfil, preferências e conteúdo — serão excluídos permanentemente. Não será possível recuperar esses dados. Essa decisão é final. Deseja continuar? |
| `deletion.confirm2Title` | Final confirmation | Confirmación final | Confirmação final |
| `deletion.confirm2Body` | This is your last chance to cancel. Your account and all data will be permanently deleted and cannot be recovered. Are you sure you want to delete your account? | Esta es tu última oportunidad para cancelar. Tu cuenta y todos tus datos se eliminarán permanentemente y no se podrán recuperar. ¿Seguro que quieres eliminar tu cuenta? | Esta é sua última chance de cancelar. Sua conta e todos os dados serão excluídos permanentemente e não poderão ser recuperados. Tem certeza de que deseja excluir sua conta? |
| `deletion.deleting` | Deleting… | Eliminando… | Excluindo… |
| `deletion.scheduledFallback` | in 30 days | en 30 días | em 30 dias |
| `deletion.scheduledToast` | Your account is scheduled for deletion on {{date}}. You can log in before then to cancel in Settings. | Tu cuenta está programada para eliminarse el {{date}}. Puedes iniciar sesión antes de esa fecha para cancelar en Ajustes. | Sua conta está programada para exclusão em {{date}}. Você pode entrar antes dessa data para cancelar em Configurações. |
| `billing.subscriptionHeading` | Subscription | Suscripción | Assinatura |
| `billing.currentPlan` | Current Plan | Plan actual | Plano atual |
| `billing.billingHeading` | Billing | Facturación | Assinatura |
| `billing.billingDescription` | Manage your subscription and payment methods | Administra tu suscripción y tus métodos de pago | Gerencie sua assinatura e seus métodos de pagamento |
| `billing.manageBilling` | Manage Billing | Administrar facturación | Gerenciar assinatura |
| `billing.loadingOptions` | Loading billing options… | Cargando opciones de facturación… | Carregando opções de assinatura… |
| `billing.portalHint` | Opens the customer portal to update payment or cancel your subscription. | Abre el portal para actualizar el pago o cancelar tu suscripción. | Abre o portal para atualizar o pagamento ou cancelar sua assinatura. |
| `billing.planMonthly` | Monthly | Mensual | Mensal |
| `billing.planAnnual` | Annual | Anual | Anual |
| `billing.planWeekly` | Weekly | Semanal | Semanal |
| `billing.openingPortal` | Opening billing portal… | Abriendo portal de facturación… | Abrindo portal de assinatura… |
| `legal.heading` | Legal & Information | Legal e información | Legal e informações |
| `legal.faq` | FAQ | Preguntas frecuentes | Perguntas frequentes |
| `legal.terms` | Terms of Use | Términos de uso | Termos de uso |
| `legal.privacy` | Privacy Policy | Política de privacidad | Política de privacidade |
| `legal.acceptableUse` | Acceptable Use Policy | Política de uso aceptable | Política de uso aceitável |
| `legal.billingRefunds` | Billing & Refunds | Facturación y reembolsos | Pagamento e reembolsos |
| `legal.dmca` | DMCA Notice & Takedown Policy | Aviso y política de retirada DMCA | Aviso e política de remoção DMCA |
| `legal.eula` | End User License Agreement | Acuerdo de licencia de usuario final | Contrato de licença de usuário final |
| `legal.contact` | Contact Us | Contáctanos | Fale conosco |
| `routine.title` | Manifestation routine | Rutina de manifestación | Rotina de manifestação |
| `routine.subtitle` | Manifesting intensity and routine notifications | Intensidad de manifestación y notificaciones de rutina | Intensidade de manifestação e notificações de rotina |
| `routine.backAria` | Back to settings | Volver a ajustes | Voltar para configurações |
| `routine.loading` | Loading your routine… | Cargando tu rutina… | Carregando sua rotina… |
| `routine.intensityHeading` | Manifesting intensity | Intensidad de manifestación | Intensidade de manifestação |
| `routine.intensityDescription` | Adjust your manifesting intensity | Ajusta tu intensidad de manifestación | Ajuste sua intensidade de manifestação |
| `routine.saveIntensity` | Save intensity | Guardar intensidad | Salvar intensidade |
| `routine.saving` | Saving… | Guardando… | Salvando… |
| `routine.notificationsHeading` | Routine notifications | Notificaciones de rutina | Notificações de rotina |
| `routine.notificationsDescription` | Notifications support your routine — they nudge you back to the app. | Las notificaciones apoyan tu rutina: te recuerdan volver a la app. | As notificações apoiam sua rotina: elas lembram você de voltar ao app. |
| `routine.pushRemindersLabel` | In-app & push reminders | Recordatorios en la app y push | Lembretes no app e push |
| `routine.dailyTimeHeading` | Daily notification time | Hora diaria de notificación | Horário diário da notificação |
| `routine.deviceDeniedHint` | Notifications are off at the device level. Your routine and charge will still work. | Las notificaciones están desactivadas en el dispositivo. Tu rutina y tu carga seguirán funcionando. | As notificações estão desativadas no dispositivo. Sua rotina e sua carga continuarão funcionando. |
| `routine.intensity.light.title` | Light | Ligera | Leve |
| `routine.intensity.light.tagline` | The recommended routine. | La rutina recomendada. | A rotina recomendada. |
| `routine.intensity.light.description` | Light integration of manifesting, with daily notifications if opted in. | Integración ligera de manifestación, con notificaciones diarias si las activas. | Integração leve de manifestação, com notificações diárias se você ativar. |
| `routine.intensity.consistent.title` | Consistent | Constante | Consistente |
| `routine.intensity.consistent.tagline` | For experienced manifestors. | Para manifestadores con experiencia. | Para manifestadores experientes. |
| `routine.intensity.consistent.description` | A more steady manifesting rhythm, with 2 daily notifications if selected. | Un ritmo de manifestación más constante, con 2 notificaciones diarias si las seleccionas. | Um ritmo de manifestação mais constante, com 2 notificações diárias se selecionadas. |
| `routine.intensity.locked_in.title` | Locked In | Enfocada | Focada |
| `routine.intensity.locked_in.tagline` | The highest-intensity routine. | La rutina de mayor intensidad. | A rotina de maior intensidade. |
| `routine.intensity.locked_in.description` | For more intense manifesting goals, with 3 daily notifications if opted in. | Para metas de manifestación más intensas, con 3 notificaciones diarias si las activas. | Para metas de manifestação mais intensas, com 3 notificações diárias se você ativar. |
| `routine.alerts.single` | Alert | Alerta | Alerta |
| `routine.alerts.first` | 1st Alert | 1.ª alerta | 1.º alerta |
| `routine.alerts.second` | 2nd Alert | 2.ª alerta | 2.º alerta |
| `routine.alerts.third` | 3rd Alert | 3.ª alerta | 3.º alerta |
| `routine.itemLabels.affirmations` | Affirmations | Afirmaciones | Afirmações |
| `routine.itemLabels.subliminals` | Subliminal listening | Escucha de subliminales | Escuta de subliminares |
| `routine.itemLabels.mirror_work` | Mirror work | Trabajo con espejo | Trabalho com espelho |
| `routine.itemLabels.belief_work` | Belief work | Trabajo de creencias | Trabalho de crenças |
| `routine.itemLabels.guide_check_in` | Guide check-in | Check-in con guía | Check-in com guia |
| `routine.itemLabels.progress_review` | Progress review | Revisión de progreso | Revisão de progresso |
| `toasts.profileUpdated` | Profile updated successfully | Perfil actualizado correctamente | Perfil atualizado com sucesso |
| `toasts.passwordUpdated` | Password updated successfully | Contraseña actualizada correctamente | Senha atualizada com sucesso |
| `toasts.enterPhone` | Please enter a phone number | Ingresa un número de teléfono | Digite um número de telefone |
| `toasts.codeSent` | Verification code sent! | ¡Código de verificación enviado! | Código de verificação enviado! |
| `toasts.codeSendFailed` | Failed to send verification code. Please try again. | No se pudo enviar el código. Inténtalo de nuevo. | Não foi possível enviar o código. Tente novamente. |
| `toasts.phoneVerified` | Phone number verified and saved! | ¡Número de teléfono verificado y guardado! | Número de telefone verificado e salvo! |
| `toasts.invalidCode` | Invalid code. Please try again. | Código inválido. Inténtalo de nuevo. | Código inválido. Tente novamente. |
| `toasts.usernameEmpty` | Username cannot be empty | El usuario no puede estar vacío | O nome de usuário não pode estar vazio |
| `toasts.verifyPhoneFirst` | Please verify your new phone number before updating | Verifica tu nuevo número de teléfono antes de actualizar | Verifique seu novo número de telefone antes de atualizar |
| `toasts.userNotFound` | User not found | Usuario no encontrado | Usuário não encontrado |
| `toasts.usernameTaken` | Username is already taken. Please choose another. | El usuario ya está en uso. Elige otro. | O nome de usuário já está em uso. Escolha outro. |
| `toasts.profileUpdateError` | Error updating profile | Error al actualizar el perfil | Erro ao atualizar o perfil |
| `toasts.invalidPassword` | Invalid password | Contraseña inválida | Senha inválida |
| `toasts.passwordUpdateError` | Error updating password | Error al actualizar la contraseña | Erro ao atualizar a senha |
| `toasts.smsEnabled` | Text notifications enabled | Notificaciones por SMS activadas | Notificações por SMS ativadas |
| `toasts.smsDisabled` | Text notifications disabled | Notificaciones por SMS desactivadas | Notificações por SMS desativadas |
| `toasts.smsUpdateError` | Error updating SMS notification preference | Error al actualizar la preferencia de SMS | Erro ao atualizar a preferência de SMS |
| `toasts.loginRequired` | Please log in to update preferences | Inicia sesión para actualizar tus preferencias | Entre para atualizar suas preferências |
| `toasts.dataTrainingEnabled` | Data training opt-in enabled | Entrenamiento de datos activado | Treinamento de dados ativado |
| `toasts.dataTrainingDisabled` | Data training opt-in disabled | Entrenamiento de datos desactivado | Treinamento de dados desativado |
| `toasts.dataTrainingError` | Error updating data training preference | Error al actualizar la preferencia de entrenamiento de datos | Erro ao atualizar a preferência de treinamento de dados |
| `toasts.deletionScheduled` | Your account is scheduled for deletion on {{date}}. You can log in before then to cancel in Settings. | Tu cuenta está programada para eliminarse el {{date}}. Puedes iniciar sesión antes de esa fecha para cancelar en Ajustes. | Sua conta está programada para exclusão em {{date}}. Você pode entrar antes dessa data para cancelar em Configurações. |
| `toasts.deletionFailed` | Could not schedule account deletion. Please try again or contact support@paletteplot.com. | No se pudo programar la eliminación de la cuenta. Inténtalo de nuevo o escribe a support@paletteplot.com. | Não foi possível agendar a exclusão da conta. Tente novamente ou escreva para support@paletteplot.com. |
| `toasts.deletionCancelled` | Account deletion cancelled. Your account will not be deleted. | Eliminación de cuenta cancelada. Tu cuenta no se eliminará. | Exclusão da conta cancelada. Sua conta não será excluída. |
| `toasts.deletionCancelFailed` | Could not cancel. Please try again or contact support@paletteplot.com. | No se pudo cancelar. Inténtalo de nuevo o escribe a support@paletteplot.com. | Não foi possível cancelar. Tente novamente ou escreva para support@paletteplot.com. |
| `toasts.emailPrefError` | Error: {{message}} | Error: {{message}} | Erro: {{message}} |
| `toasts.emailEnabled` | Email notifications enabled | Notificaciones por correo activadas | Notificações por e-mail ativadas |
| `toasts.emailDisabled` | Email notifications disabled | Notificaciones por correo desactivadas | Notificações por e-mail desativadas |
| `toasts.billingLoginRequired` | Please log in to manage billing | Inicia sesión para administrar la facturación | Entre para gerenciar sua assinatura |
| `toasts.playSubscriptionsFailed` | Could not open Google Play subscriptions. | No se pudo abrir la pantalla de suscripciones de Google Play. | Não foi possível abrir as assinaturas do Google Play. |
| `toasts.iosSubscriptionsHint` | Manage billing is available from your iPhone in Settings > Apple ID > Subscriptions. | Administra tu suscripción desde tu iPhone en Ajustes > ID de Apple > Suscripciones. | Gerencie sua assinatura no iPhone em Ajustes > ID Apple > Assinaturas. |
| `toasts.portalFailed` | Could not open billing portal. Please try again. | No se pudo abrir el portal de facturación. Inténtalo de nuevo. | Não foi possível abrir o portal de assinatura. Tente novamente. |
| `toasts.portalFailedFallback` | Could not open billing portal. Please try again or use the link in your subscription email. | No se pudo abrir el portal. Inténtalo de nuevo o usa el enlace de tu correo de suscripción. | Não foi possível abrir o portal. Tente novamente ou use o link no e-mail da sua assinatura. |
| `toasts.routineLoadFailed` | Could not load your routine settings. | No se pudieron cargar los ajustes de tu rutina. | Não foi possível carregar as configurações da sua rotina. |
| `toasts.routineNotifUpdateFailed` | Could not update notification preference. | No se pudo actualizar la preferencia de notificaciones. | Não foi possível atualizar a preferência de notificações. |
| `toasts.routineNotifOff` | Routine notifications turned off | Notificaciones de rutina desactivadas | Notificações de rotina desativadas |
| `toasts.routineNotifDenied` | Notification permission was denied. | Se denegó el permiso de notificaciones. | A permissão de notificações foi negada. |
| `toasts.routineNotifDeniedIos` | Notifications are off in iOS Settings. Enable them there, then try again. | Las notificaciones están desactivadas en Ajustes de iOS. Actívalas allí e inténtalo de nuevo. | As notificações estão desativadas nas Configurações do iOS. Ative-as lá e tente novamente. |
| `toasts.routineNotifPermissionFailed` | Could not request notification permission. | No se pudo solicitar el permiso de notificaciones. | Não foi possível solicitar a permissão de notificações. |
| `toasts.routineNotifOn` | Routine notifications enabled | Notificaciones de rutina activadas | Notificações de rotina ativadas |
| `toasts.routineIntensitySaved` | Manifesting intensity updated | Intensidad de manifestación actualizada | Intensidade de manifestação atualizada |
| `toasts.routineIntensitySaveFailed` | Could not save your routine intensity. | No se pudo guardar tu intensidad de rutina. | Não foi possível salvar sua intensidade de rotina. |
| `legalDisclaimer` |  |  |  |

---

## Cross-namespace copy (used by Settings.tsx)

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `common:cancel` | Cancel | Cancelar | Cancelar |
| `common:continue` | Continue | Continuar | Continuar |

**File:** `src/i18n/locales/{en,es-419,pt-BR}/common.json`

---

## Routine push notification payload (edge function — not in settings.json)

Sent by `send-routine-push-notifications` via `supabase/functions/_shared/pushLocale.ts`.

| Field | en | es-419 | pt-BR |
|-------|----|--------|-------|
| heading | Time to manifest! | ¡Hora de manifestar! | Hora de manifestar! |
| subtitle | Get back into the app to manifest | Vuelve a la app | Volte para o app |
| body | Your dreams are waiting. Let's return to your manifesting practice now. | Tu deseo te espera. Entra y retoma tu rutina. | Seu desejo te espera. Entre e retome sua rotina. |

OneSignal language keys: `en`, `es`, `pt` (mapped from app locales).

```ts

```

---

## Acceptance test (locale-key fix)

1. Open `/dashboard/settings` → Settings tab
2. Change language
3. Email preferences, data training, routine link, and delete-account cards update **immediately**
4. Toggle states (`emailMarketing`, `dataTrainingOptIn`) do **not** flip or reset
5. No need to leave and return to the tab

---

## Full source: Settings.tsx

```tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Bell, KeyRound, CreditCard, AlertTriangle, Trash2, Zap, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { cn } from "@/lib/utils";
import { validatePassword, validatePasswordMatch } from "@/lib/password-validation";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useAppleIAP } from "@/hooks/useAppleIAP";
import {
  openRevenueCatWebBillingPortal,
  resolveRevenueCatWebBillingStatus,
} from "@/services/revenueCatManageBilling";
import { bootstrapRevenueCat, resolveRevenueCatUILocale, syncRevenueCatUILocale } from "@/services/revenueCat";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { resolveAppLocale, legalTermsPath, legalPrivacyPath } from "@/lib/locale";

const PLAY_SUBSCRIPTIONS_URL = "https://play.google.com/store/account/subscriptions";

const Settings = () => {
  const { t, i18n } = useTranslation("settings");
  const localeKey = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  const translatePasswordError = (error: string | null): string | null => {
    if (!error) return null;
    return t(`passwordValidation.${error}`);
  };
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const appleIAP = useAppleIAP();

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);
  
  const isStandalone = 
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) || Capacitor.isNativePlatform();
  const [userEmail, setUserEmail] = useState<string>("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [marketingSMSEnabled, setMarketingSMSEnabled] = useState(false);
  const [dataTrainingOptIn, setDataTrainingOptIn] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Password validation states
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  // Refs for debouncing
  const passwordValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  /** Cadence from `user_plans.billing_period` only (Current Plan label). */
  const [billingPeriodLabel, setBillingPeriodLabel] = useState<string | null>(null);
  /** From user_plans; routes Manage Billing (RC web / App Store / Google Play). */
  const [lastPaymentSource, setLastPaymentSource] = useState<
    "stripe" | "apple" | "google_play" | null
  >(null);
  /** RC Web Billing subscriber — checked so Settings can show a loading hint while portal status resolves. */
  const [rcWebBillingAvailable, setRcWebBillingAvailable] = useState<boolean | null>(null);
  /** Billing identity from user_plans; not used to infer RC Web Billing by placeholder prefix. */
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(true); // Start as true if phone hasn't changed
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [showDeleteAccountConfirm1, setShowDeleteAccountConfirm1] = useState(false);
  const [showDeleteAccountConfirm2, setShowDeleteAccountConfirm2] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null);
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserEmail(user.email || "");
        setUserId(user.id);

        const { data: planData, error } = await supabase
          .from("user_plans")
          .select("billing_period, last_payment_source, stripe_customer_id")
          .eq("user_id", user.id)
          .maybeSingle();

        const plan = planData as
          | {
              billing_period?: string | null;
              last_payment_source?: string | null;
              stripe_customer_id?: string | null;
            }
          | null;

        if (error) {
          console.error("Error fetching plan:", error);
          setBillingPeriodLabel(null);
        } else {
          const bp = plan?.billing_period?.trim() || null;
          setBillingPeriodLabel(bp);
        }

        if (
          plan?.last_payment_source === "stripe" ||
          plan?.last_payment_source === "apple" ||
          plan?.last_payment_source === "google_play"
        ) {
          setLastPaymentSource(plan.last_payment_source);
        } else {
          setLastPaymentSource(null);
        }

        setStripeCustomerId(plan?.stripe_customer_id?.trim() || null);

        const refreshRcWebBillingStatus = () => {
          void resolveRevenueCatWebBillingStatus(user.id)
            .then(({ webBilling }) => setRcWebBillingAvailable(webBilling))
            .catch(() => setRcWebBillingAvailable(false));
        };
        refreshRcWebBillingStatus();
        window.setTimeout(refreshRcWebBillingStatus, 1500);

        // Fetch user preferences (email reminders and text reminders)
        const { data: prefs, error: prefsError } = await (supabase as any)
          .from('user_preferences')
          .select('email_marketing, texts_enabled, data_training_opt_in')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!prefsError && prefs) {
          setEmailMarketing(prefs.email_marketing || false);
          setMarketingSMSEnabled(prefs.texts_enabled || false);
          setDataTrainingOptIn(prefs.data_training_opt_in || false);
        }

        // Fetch profile for phone number, username, and first name
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('phone, username, first_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!profileError && profile) {
          const profileData = profile as any;
          const currentPhone = profileData.phone || "";
          const currentUsername = profileData.username || "";
          const currentFirstName = profileData.first_name || "";
          setPhoneNumber(currentPhone);
          setOriginalPhoneNumber(currentPhone);
          setUsername(currentUsername);
          setOriginalUsername(currentUsername);
          setFirstName(currentFirstName);
          setOriginalFirstName(currentFirstName);
        }

        // Pending account deletion (30-day schedule)
        const { data: deletionRequest } = await supabase
          .from("account_deletion_requests")
          .select("requested_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (deletionRequest?.requested_at) {
          const d = new Date(deletionRequest.requested_at);
          d.setDate(d.getDate() + 30);
          setDeletionScheduledAt(d.toISOString());
        } else {
          setDeletionScheduledAt(null);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      toast.error(t("toasts.enterPhone"));
      return;
    }

    setIsSendingCode(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setIsPhoneVerified(false);

    try {
      const response = await supabase.functions.invoke('send-sms-notification', {
        body: {
          phoneNumber,
          message: t("profile.smsVerificationMessage", { code }),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send code');
      }

      toast.success(t("toasts.codeSent"));
    } catch (error) {
      console.error("Failed to send code:", error);
      toast.error(t("toasts.codeSendFailed"));
      setSentCode("");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode === sentCode) {
      setIsPhoneVerified(true);
      // Automatically save if phone number changed
      if (phoneNumber !== originalPhoneNumber) {
        await handleUpdateProfile();
      }
      setVerificationCode("");
      setSentCode("");
      toast.success(t("toasts.phoneVerified"));
    } else {
      toast.error(t("toasts.invalidCode"));
      setVerificationCode("");
    }
  };

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      toast.error(t("toasts.usernameEmpty"));
      return;
    }
    
    // Check if phone number changed and needs verification
    if (phoneNumber !== originalPhoneNumber && !isPhoneVerified) {
      toast.error(t("toasts.verifyPhoneFirst"));
      return;
    }
    
    if (!user) {
      toast.error(t("toasts.userNotFound"));
      return;
    }

    // Update profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: username.trim(),
        first_name: firstName.trim() || null,
        phone: phoneNumber || null // Allow clearing phone number
      })
      .eq('id', user.id);

    if (profileError) {
      // Check if it's a unique constraint violation for username
      if (profileError.code === '23505' || profileError.message?.includes('unique') || profileError.message?.includes('duplicate')) {
        toast.error(t("toasts.usernameTaken"));
      } else {
        toast.error(t("toasts.profileUpdateError"));
        console.error(profileError);
      }
      return;
    }

    // Update auth.users phone if phone number was set
    if (phoneNumber && phoneNumber.trim()) {
      try {
        const { error: authError } = await supabase.auth.updateUser({
          phone: phoneNumber
        });
        if (authError) {
          console.warn('Could not update auth.users phone:', authError);
          // Don't fail the whole update if auth update fails
        }
      } catch (e) {
        console.warn('Error updating auth phone:', e);
      }
    }

    // Reset verification state after successful update
    setOriginalPhoneNumber(phoneNumber);
    setOriginalUsername(username.trim());
    setOriginalFirstName(firstName.trim());
    setIsPhoneVerified(true);
    setVerificationCode("");
    setSentCode("");

    toast.success(t("toasts.profileUpdated"));
  };

  // Real-time password validation (debounced)
  useEffect(() => {
    if (passwordValidationTimeoutRef.current) {
      clearTimeout(passwordValidationTimeoutRef.current);
    }

    if (!newPassword) {
      setPasswordError(null);
      setIsValidatingPassword(false);
      return;
    }

    setIsValidatingPassword(true);
    setPasswordError(null);

    passwordValidationTimeoutRef.current = setTimeout(() => {
      const result = validatePassword(newPassword);
      setPasswordError(result.error);
      setIsValidatingPassword(false);
    }, 500);

    return () => {
      if (passwordValidationTimeoutRef.current) {
        clearTimeout(passwordValidationTimeoutRef.current);
      }
    };
  }, [newPassword]);

  // Real-time confirm password validation
  useEffect(() => {
    if (!confirmPassword) {
      setConfirmPasswordError(null);
      return;
    }

    const result = validatePasswordMatch(newPassword, confirmPassword);
    setConfirmPasswordError(result.error);
  }, [confirmPassword, newPassword]);

  const canChangePassword = 
    !!newPassword &&
    !!confirmPassword &&
    !passwordError &&
    !confirmPasswordError &&
    !isValidatingPassword;

  const handleChangePassword = async () => {
    // Validate password using shared validation
    const passwordResult = validatePassword(newPassword);
    if (!passwordResult.isValid) {
      toast.error(translatePasswordError(passwordResult.error) || t("toasts.invalidPassword"));
      return;
    }

    // Validate password match
    const matchResult = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchResult.isValid) {
      toast.error(translatePasswordError(matchResult.error) || t("passwordValidation.mismatch"));
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast.error(t("toasts.passwordUpdateError"));
    } else {
      toast.success(t("toasts.passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setConfirmPasswordError(null);
    }
  };


  const handleToggleMarketingSMS = async (enabled: boolean) => {
    setMarketingSMSEnabled(enabled);
    
    if (user) {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          texts_enabled: enabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating marketing SMS preference:', error);
        // Revert on error
        setMarketingSMSEnabled(!enabled);
        toast.error(t("toasts.smsUpdateError"));
      } else {
        toast.success(enabled ? t("toasts.smsEnabled") : t("toasts.smsDisabled"));
      }
    }
  };

  const handleToggleDataTraining = async (enabled: boolean) => {
    const previous = dataTrainingOptIn;
    setDataTrainingOptIn(enabled);

    if (!user) {
      toast.error(t("toasts.loginRequired"));
      setDataTrainingOptIn(previous);
      return;
    }

    const { error } = await (supabase as any)
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        data_training_opt_in: enabled,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating data training preference:', error);
      setDataTrainingOptIn(previous);
      toast.error(t("toasts.dataTrainingError"));
    } else {
      toast.success(enabled ? t("toasts.dataTrainingEnabled") : t("toasts.dataTrainingDisabled"));
    }
  };

  const handleDeleteAccountRequest = () => setShowDeleteAccountConfirm1(true);
  const handleDeleteAccountConfirm1Close = () => setShowDeleteAccountConfirm1(false);
  const handleDeleteAccountConfirm1Continue = () => {
    setShowDeleteAccountConfirm1(false);
    setShowDeleteAccountConfirm2(true);
  };
  const handleDeleteAccountConfirm2Close = () => setShowDeleteAccountConfirm2(false);
  const handleDeleteAccountFinalConfirm = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", { method: "POST" });
      if (error) throw error;
      const result = data as { error?: string; scheduled_at?: string };
      if (result?.error) throw new Error(result.error);
      const scheduledAt = result?.scheduled_at ? new Date(result.scheduled_at) : null;
      const dateStr = scheduledAt ? scheduledAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : t("deletion.scheduledFallback");
      setShowDeleteAccountConfirm2(false);
      await supabase.auth.signOut({ scope: "global" });
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) throw signOutError;
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k?.startsWith("subscription_check_")) sessionStorage.removeItem(k);
        }
      } catch {}
      navigate("/", { replace: true });
      toast.success(t("toasts.deletionScheduled", { date: dateStr }));
    } catch (e) {
      console.error("Account deletion failed:", e);
      toast.error(t("toasts.deletionFailed"));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCancelDeletionRequest = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        method: "POST",
        body: { cancel: true },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setDeletionScheduledAt(null);
      toast.success(t("toasts.deletionCancelled"));
    } catch (e) {
      console.error("Cancel deletion failed:", e);
      toast.error(t("toasts.deletionCancelFailed"));
    }
  };

  const handleToggleEmailMarketing = async (enabled: boolean) => {
    setEmailMarketing(enabled);
    
    if (user) {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_marketing: enabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating email marketing preference:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        // Revert on error
        setEmailMarketing(!enabled);
        const errorMessage = error.message || error.details || "";
        toast.error(t("toasts.emailPrefError", { message: errorMessage }));
      } else {
        toast.success(enabled ? t("toasts.emailEnabled") : t("toasts.emailDisabled"));
      }
    }
  };

  /**
   * Manage billing routing:
   *
   * - Apple keeps the original native RevenueCat subscription-management path.
   * - Android tries RevenueCat's management URL, then falls back to the Play subscriptions handoff.
   * - Stripe/RC web opens RevenueCat's management URL.
   */
  const handleManageBilling = async () => {
    if (!user) {
      toast.error(t("toasts.billingLoginRequired"));
      return;
    }

    if (Capacitor.isNativePlatform()) {
      await bootstrapRevenueCat(user.id);
    }
    await syncRevenueCatUILocale();
    console.info("[Settings][Billing] RC UI locale before manage billing", {
      locale: resolveRevenueCatUILocale(),
    });

    if (lastPaymentSource === "apple") {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios" && appleIAP.canManageBillingNatively) {
        try {
          await appleIAP.openSubscriptionManagement(user.id);
        } catch (err) {
          console.error("Manage billing:", err);
        }
        return;
      }

      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
        try {
          await Browser.open({ url: PLAY_SUBSCRIPTIONS_URL });
        } catch (err) {
          console.error("Manage billing (Play):", err);
          toast.error(t("toasts.playSubscriptionsFailed"));
        }
        return;
      }

      toast.error(t("toasts.iosSubscriptionsHint"));
      return;
    }

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
      try {
        const openedPortal = await openRevenueCatWebBillingPortal(user.id);
        if (openedPortal) {
          setRcWebBillingAvailable(true);
          return;
        }
      } catch (error) {
        console.error("Manage billing (RevenueCat portal):", error);
      }

      try {
        await Browser.open({ url: PLAY_SUBSCRIPTIONS_URL });
      } catch (err) {
        console.error("Manage billing (Play):", err);
        toast.error(t("toasts.playSubscriptionsFailed"));
      }
      return;
    }

    const isRcManagedBilling =
      lastPaymentSource === "stripe" ||
      rcWebBillingAvailable === true;

    if (isRcManagedBilling) {
      try {
        const portalToast = toast.loading(t("billing.openingPortal"));
        const openedPortal = await openRevenueCatWebBillingPortal(user.id);
        toast.dismiss(portalToast);
        if (openedPortal) {
          setRcWebBillingAvailable(true);
          return;
        }
      } catch (error) {
        console.error("Manage billing (RevenueCat portal):", error);
        toast.error(t("toasts.portalFailed"));
        return;
      }
    }

    toast.error(t("toasts.portalFailedFallback"));
  };


  // Email reminders are now loaded from database in fetchUserData
  // This useEffect is no longer needed as it's handled in fetchUserData

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const billingOptionsLoading =
    !Capacitor.isNativePlatform() &&
    rcWebBillingAvailable === null &&
    lastPaymentSource !== "stripe" &&
    lastPaymentSource !== "apple";

  return (
    <div
      className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-20 md:pb-0")}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

      <div
        className="min-h-screen"
        style={
          !isMobile
            ? {
                marginLeft: sidebarCollapsed ? "64px" : "256px",
                transition: "margin-left 300ms ease-in-out",
              }
            : {}
        }
      >
        {isMobile && (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        )}

        <div className="relative z-10">
        <header
          className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), isMobile ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]" : "fixed top-0 left-0 right-0")}
          style={isMobile ? (theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }) : { ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }), top: "var(--app-safe-area-top)", left: sidebarCollapsed ? "64px" : "256px", right: "0", transition: "left 300ms ease-in-out" }}
        >
        <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
          <div className="flex items-center justify-between">
          <div>
            <h1
              className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"}
              onClick={() => navigate("/dashboard")}
            >
              {t("header")}
            </h1>
            {isMobile && <p className="text-xs text-muted-foreground">{userEmail}</p>}
            </div>
            {/* PWA Browser Mobile Menu */}
            {isMobile && (
              <div className="md:hidden">
                {isMobile && (
              <div className="md:hidden">
                <MobilePWAMenu />
              </div>
            )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={cn(
          "px-4 sm:px-6 max-w-4xl relative z-10",
          isMobile ? "pb-4" : "pb-20",
          !isMobile ? "pt-16" : "",
          !isMobile ? "" : "container mx-auto",
          isMobile && "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
        )}
      >
        <div className="py-2 sm:py-3">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={cn(theme === "dark" ? "grid w-full gap-1 p-1 rounded-lg border border-white/12 bg-transparent text-white mb-4" : "grid w-full mb-4", !isMobile ? "grid-cols-4" : "grid-cols-4")}>
            <TabsTrigger value="profile" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.profile")}</TabsTrigger>
            <TabsTrigger value="settings" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.settings")}</TabsTrigger>
            <TabsTrigger value="billing" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.billing")}</TabsTrigger>
            <TabsTrigger value="legal" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.legal")}</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent key={`profile-${localeKey}`} value="profile" className="space-y-2">
            <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-3 sm:p-4 space-y-2") : "p-3 sm:p-4 space-y-2", theme === "dark" && "!bg-transparent")}>
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-sm">{t("profile.nameLabel")}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={cn("h-11 py-2.5 leading-6", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
                  placeholder={t("profile.namePlaceholder")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="username" className="text-sm">{t("profile.usernameLabel")}</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={cn("h-11 py-2.5 leading-6", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
                  placeholder={t("profile.usernamePlaceholder")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm">{t("profile.emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={userEmail}
                  readOnly
                  aria-readonly="true"
                  className={cn("h-11 py-2.5 leading-6", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40", "!opacity-100 cursor-default") : "bg-muted opacity-100 cursor-default")}
                />
                <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("profile.emailCannotChange")}
                </p>
              </div>

              {/* Phone number field hidden for now */}
              {false && (
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-sm">{t("profile.phoneLabel")}</Label>
                <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      // Reset verification if phone number changes
                      if (e.target.value !== originalPhoneNumber) {
                        setIsPhoneVerified(false);
                        setVerificationCode("");
                        setSentCode("");
                      } else {
                        setIsPhoneVerified(true);
                      }
                    }}
                  placeholder={t("profile.phonePlaceholder")}
                    className="flex-1 h-9"
                />
                  {phoneNumber && phoneNumber !== originalPhoneNumber && (
                    <Button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={isSendingCode || !phoneNumber.trim()}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      {isSendingCode ? t("profile.sendingCode") : t("profile.sendCode")}
                    </Button>
                  )}
                </div>

                {sentCode && !isPhoneVerified && phoneNumber !== originalPhoneNumber && (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder={t("profile.codePlaceholder")}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="flex-1 h-9"
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={verificationCode.length !== 6}
                        variant="outline"
                        className="h-9"
                      >
                        {t("profile.verify")}
                      </Button>
                    </div>
                    {!isPhoneVerified && (
                      <p className="text-xs text-muted-foreground">
                        {t("profile.verifyPhoneHint")}
                      </p>
                    )}
                  </div>
                )}

                {isPhoneVerified && phoneNumber === originalPhoneNumber && originalPhoneNumber && (
                  <p className="text-xs text-green-600">{t("profile.phoneVerified")}</p>
                )}

                {isPhoneVerified && phoneNumber !== originalPhoneNumber && (
                  <p className="text-xs text-green-600">{t("profile.newPhoneVerified")}</p>
                )}
              </div>
              )}

              {(username.trim() !== originalUsername || firstName.trim() !== originalFirstName) && (
                <Button 
                  onClick={handleUpdateProfile} 
                  className="w-full h-9"
                >
                <User className="mr-2 h-4 w-4" />
                  {t("profile.updateButton")}
              </Button>
              )}
            </Card>

            <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-3 sm:p-4 space-y-2") : "p-3 sm:p-4 space-y-2", theme === "dark" && "!bg-transparent")}>
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <KeyRound className="h-4 w-4" />
                {t("profile.changePasswordHeading")}
              </h3>
              
              <div className="space-y-1">
                <Label htmlFor="current-password" className="text-sm">{t("profile.currentPasswordLabel")}</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t("profile.currentPasswordPlaceholder")}
                  className={cn("h-9", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="new-password" className="text-sm">{t("profile.newPasswordLabel")}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("profile.newPasswordPlaceholder")}
                    className={cn("h-9", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "", passwordError && "border-destructive")}
                  />
                  {isValidatingPassword && (
                    <p className="text-xs text-muted-foreground">{t("profile.validatingPassword")}</p>
                  )}
                  {passwordError && (
                    <p className="text-xs text-destructive">{translatePasswordError(passwordError)}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirm-password" className="text-sm">{t("profile.confirmPasswordLabel")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("profile.confirmPasswordPlaceholder")}
                    className={cn("h-9", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "", confirmPasswordError && "border-destructive")}
                  />
                  {confirmPasswordError && (
                    <p className="text-xs text-destructive">{translatePasswordError(confirmPasswordError)}</p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleChangePassword}
                variant="ghost"
                className={cn("w-full h-9", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                disabled={!canChangePassword}
              >
                {t("profile.changePasswordButton")}
              </Button>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent key={`settings-${localeKey}`} value="settings" className="space-y-3">
            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold text-sm sm:text-base">{t("language.heading")}</h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("language.description")}
              </p>
              <LanguageSwitcher
                persistToAccount
                variant="default"
                className="justify-start"
              />
            </Card>

            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Zap className="h-4 w-4" />
                {t("preferences.routineHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.routineDescription")}
              </p>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between h-auto py-3",
                  theme === "dark" && "border-white/12 bg-transparent hover:bg-white/[0.06]",
                )}
                onClick={() => navigate("/dashboard/settings/manifestation-routine")}
              >
                <span className="text-left">
                  <span className="block font-medium">{t("preferences.routineButtonTitle")}</span>
                  <span
                    className={cn(
                      "block text-xs font-normal mt-0.5",
                      theme === "dark" ? "text-white/55" : "text-muted-foreground",
                    )}
                  >
                    {t("preferences.routineButtonSubtitle")}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
              </Button>
            </Card>

            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4" />
                {t("preferences.emailHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.emailDescription")}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-marketing">{t("preferences.emailMarketingLabel")}</Label>
                  <Switch 
                    id="email-marketing"
                    checked={emailMarketing}
                    onCheckedChange={handleToggleEmailMarketing}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="flex items-center justify-between hidden">
                  <Label htmlFor="text-marketing">{t("preferences.textMarketingLabel")}</Label>
                  <Switch 
                    id="text-marketing"
                    checked={marketingSMSEnabled}
                    onCheckedChange={handleToggleMarketingSMS}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
            </Card>

            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4" />
                {t("preferences.dataTrainingHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.dataTrainingDescription")}
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="data-training-opt-in">{t("preferences.dataTrainingLabel")}</Label>
                <Switch
                  id="data-training-opt-in"
                  checked={dataTrainingOptIn}
                  onCheckedChange={handleToggleDataTraining}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </Card>

            <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3", "border-destructive/30")}>
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {t("deletion.heading")}
              </h3>
              {deletionScheduledAt ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {t("deletion.scheduledPrefix")}{" "}
                    {new Date(deletionScheduledAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.{" "}
                    {t("deletion.scheduledSuffix")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelDeletionRequest}
                  >
                    {t("deletion.cancelRequest")}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {t("deletion.description")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={handleDeleteAccountRequest}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("deletion.deleteButton")}
                  </Button>
                </>
              )}
            </Card>

            <Dialog open={showDeleteAccountConfirm1} onOpenChange={setShowDeleteAccountConfirm1}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("deletion.confirm1Title")}</DialogTitle>
                  <DialogDescription>
                    {t("deletion.confirm1Body")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={handleDeleteAccountConfirm1Close}>{t("common:cancel")}</Button>
                  <Button variant="destructive" onClick={handleDeleteAccountConfirm1Continue}>{t("common:continue")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showDeleteAccountConfirm2} onOpenChange={setShowDeleteAccountConfirm2}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("deletion.confirm2Title")}</DialogTitle>
                  <DialogDescription>
                    {t("deletion.confirm2Body")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={handleDeleteAccountConfirm2Close} disabled={isDeletingAccount}>{t("common:cancel")}</Button>
                  <Button variant="destructive" onClick={handleDeleteAccountFinalConfirm} disabled={isDeletingAccount}>
                    {isDeletingAccount ? t("deletion.deleting") : t("deletion.deleteButton")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </TabsContent>

          {/* Billing Tab */}
          <TabsContent key={`billing-${localeKey}`} value="billing" className="space-y-3">
            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <CreditCard className="h-4 w-4" />
                {t("billing.subscriptionHeading")}
              </h3>
              
              <div className="space-y-4">
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    theme === "dark"
                      ? "border border-white/12 bg-transparent"
                      : "bg-muted/30",
                  )}
                >
                  <p className="text-sm font-medium mb-1">{t("billing.currentPlan")}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {billingPeriodLabel === "monthly"
                      ? t("billing.planMonthly")
                      : billingPeriodLabel === "annual"
                        ? t("billing.planAnnual")
                        : billingPeriodLabel === "weekly"
                          ? t("billing.planWeekly")
                          : billingPeriodLabel ?? ""}
                  </p>
                </div>

                <div
                  className={cn(
                    "p-3 rounded-lg",
                    theme === "dark"
                      ? "border border-white/12 bg-transparent"
                      : "bg-muted/30",
                  )}
                >
                  <p className="text-sm font-medium mb-1">{t("billing.billingHeading")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("billing.billingDescription")}
                  </p>
                </div>

                {billingOptionsLoading ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn("w-full", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                      onClick={() => void handleManageBilling()}
                    >
                      {t("billing.manageBilling")}
                    </Button>
                    <p className="text-[11px] leading-snug text-muted-foreground text-center px-1">
                      {t("billing.loadingOptions")}
                    </p>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn("w-full", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                      onClick={() => void handleManageBilling()}
                    >
                      {t("billing.manageBilling")}
                    </Button>
                    <p className="text-[11px] leading-snug text-muted-foreground text-center px-1">
                      {t("billing.portalHint")}
                    </p>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Legal Tab */}
          <TabsContent key={`legal-${localeKey}`} value="legal" className="space-y-3">
            <Card className={theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3"}>
              <h3 className="font-semibold text-sm sm:text-base mb-4">
                {t("legal.heading")}
              </h3>
              {t("legalDisclaimer") ? (
                <p className={cn("text-xs mb-4", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("legalDisclaimer")}
                </p>
              ) : null}

              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/faq")}
                >
                  {t("legal.faq")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(legalTermsPath(localeKey))}
                >
                  {t("legal.terms")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(legalPrivacyPath(localeKey))}
                >
                  {t("legal.privacy")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/acceptable-use")}
                >
                  {t("legal.acceptableUse")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/billing")}
                >
                  {t("legal.billingRefunds")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/dmca")}
                >
                  {t("legal.dmca")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/eula")}
                >
                  {t("legal.eula")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/contact")}
                >
                  {t("legal.contact")}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;

```

---

## Full source: ManifestationRoutineSettings.tsx

```tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, CheckCircle2, Circle, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { RoutineTimeZoneSelect } from "@/components/RoutineTimeZoneSelect";
import i18n from "@/i18n";
import { resolveAppLocale, type AppLocale } from "@/lib/locale";
import {
  bootstrapOneSignal,
  oneSignalLogin,
  optInOneSignalPush,
  readDeviceTimeZone,
  requestOneSignalPushPermission,
  syncManifestationRoutineOneSignalTags,
  syncOneSignalUserLanguage,
} from "@/services/oneSignal";

type IntensityId = "light" | "consistent" | "locked_in";

const INTENSITY_IDS: IntensityId[] = ["light", "consistent", "locked_in"];

type RoutineItem = {
  slug: string;
  label: string;
  cadence: string;
  target_per_week: number;
};

const ROUTINE_ALERT_DEFAULTS: Record<IntensityId, string[]> = {
  light: ["21:30"],
  consistent: ["07:00", "21:30"],
  locked_in: ["07:00", "18:30", "21:30"],
};

type RoutineDbRow = {
  manifestation_intensity?: string | null;
  manifest_routine_items?: unknown;
  app_notifications_enabled?: boolean | null;
  notification_permission_status?: string | null;
  routine_notification_times?: unknown;
  timezone?: string | null;
};

function isIntensityId(value: unknown): value is IntensityId {
  return value === "light" || value === "consistent" || value === "locked_in";
}

function parseRoutineItems(raw: unknown): RoutineItem[] {
  return Array.isArray(raw) ? (raw as RoutineItem[]) : [];
}

function parseAlertTimes(raw: unknown, intensity: IntensityId): string[] {
  const defaults = ROUTINE_ALERT_DEFAULTS[intensity];
  if (!Array.isArray(raw)) return [...defaults];
  const parsed = raw.filter(
    (t): t is string => typeof t === "string" && /^\d{2}:\d{2}$/.test(t),
  );
  return parsed.length === defaults.length ? parsed : [...defaults];
}

/** prefs ?? profile ?? default — per field, never let prefs null wipe profile. */
function mergeRoutineDbRow(
  prefs: RoutineDbRow | null | undefined,
  profile: RoutineDbRow | null | undefined,
): {
  intensity: IntensityId;
  routineItems: RoutineItem[];
  appNotificationsEnabled: boolean;
  permissionStatus: "granted" | "denied" | "skipped" | null;
  alertTimes: string[];
  timeZone: string;
} {
  const intensityRaw = prefs?.manifestation_intensity ?? profile?.manifestation_intensity;
  const intensity = isIntensityId(intensityRaw) ? intensityRaw : "consistent";

  const prefsItems = parseRoutineItems(prefs?.manifest_routine_items);
  const profileItems = parseRoutineItems(profile?.manifest_routine_items);
  const routineItems = prefsItems.length > 0 ? prefsItems : profileItems;

  const appNotificationsEnabled =
    prefs?.app_notifications_enabled ?? profile?.app_notifications_enabled ?? false;

  const permissionRaw =
    prefs?.notification_permission_status ?? profile?.notification_permission_status;
  const permissionStatus =
    permissionRaw === "granted" || permissionRaw === "denied" || permissionRaw === "skipped"
      ? permissionRaw
      : null;

  const timesRaw = prefs?.routine_notification_times ?? profile?.routine_notification_times;
  const alertTimes = parseAlertTimes(timesRaw, intensity);

  const timeZoneRaw = prefs?.timezone ?? profile?.timezone;
  const timeZone =
    typeof timeZoneRaw === "string" && timeZoneRaw.trim() ? timeZoneRaw.trim() : readDeviceTimeZone();

  return {
    intensity,
    routineItems,
    appNotificationsEnabled: !!appNotificationsEnabled,
    permissionStatus,
    alertTimes,
    timeZone,
  };
}

/** Pre-feature user: no routine fields stored in either table yet. */
function isPreFeatureRoutineUser(
  prefs: RoutineDbRow | null | undefined,
  profile: RoutineDbRow | null | undefined,
): boolean {
  const hasIntensity =
    isIntensityId(prefs?.manifestation_intensity) || isIntensityId(profile?.manifestation_intensity);
  if (hasIntensity) return false;

  const hasItems =
    parseRoutineItems(prefs?.manifest_routine_items).length > 0 ||
    parseRoutineItems(profile?.manifest_routine_items).length > 0;
  if (hasItems) return false;

  const perm = prefs?.notification_permission_status ?? profile?.notification_permission_status;
  const notifOn =
    prefs?.app_notifications_enabled === true || profile?.app_notifications_enabled === true;
  if (notifOn && perm === "granted") return false;
  if (perm === "denied") return false;

  const hasTimes =
    (Array.isArray(prefs?.routine_notification_times) &&
      (prefs!.routine_notification_times as unknown[]).length > 0) ||
    (Array.isArray(profile?.routine_notification_times) &&
      (profile!.routine_notification_times as unknown[]).length > 0);
  if (hasTimes) return false;

  return true;
}

function defaultRoutineItems(intensity: IntensityId, labelForSlug: (slug: string) => string): RoutineItem[] {
  return [
    {
      slug: "affirmations",
      label: labelForSlug("affirmations"),
      cadence: "daily",
      target_per_week: intensity === "locked_in" ? 7 : intensity === "consistent" ? 5 : 3,
    },
  ];
}

function routineItemsForIntensity(
  intensity: IntensityId,
  existing: RoutineItem[],
  labelForSlug: (slug: string) => string,
): RoutineItem[] {
  if (existing.length === 0) return defaultRoutineItems(intensity, labelForSlug);

  return existing.map((item) => {
    if (item.slug === "affirmations") {
      return {
        ...item,
        target_per_week: intensity === "locked_in" ? 7 : intensity === "consistent" ? 5 : 3,
      };
    }
    if (item.slug === "subliminals") {
      return {
        ...item,
        cadence: intensity === "light" ? "weekly" : "daily",
        target_per_week: intensity === "locked_in" ? 7 : intensity === "consistent" ? 4 : 2,
      };
    }
    if (item.slug === "mirror_work") {
      return {
        ...item,
        cadence: intensity === "light" ? "weekly" : "daily",
        target_per_week: intensity === "locked_in" ? 5 : intensity === "consistent" ? 3 : 1,
      };
    }
    return item;
  });
}

export default function ManifestationRoutineSettings() {
  const { t } = useTranslation("settings");
  const routineItemLabel = (slug: string) => t(`routine.itemLabels.${slug}`);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intensity, setIntensity] = useState<IntensityId>("consistent");
  const [savedIntensity, setSavedIntensity] = useState<IntensityId>("consistent");
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>([]);
  const [appNotificationsEnabled, setAppNotificationsEnabled] = useState(false);
  const [alertTimes, setAlertTimes] = useState<string[]>(ROUTINE_ALERT_DEFAULTS.consistent);
  const [timeZone, setTimeZone] = useState(() => readDeviceTimeZone());
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "skipped" | null>(
    null,
  );
  const preferredLocale: AppLocale = resolveAppLocale(
    i18n.resolvedLanguage || i18n.language,
  );

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;

    void (async () => {
      setLoading(true);
      try {
        const [prefsRes, profileRes] = await Promise.all([
          (supabase as any)
            .from("user_preferences")
            .select(
              "manifestation_intensity, manifest_routine_items, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone",
            )
            .eq("user_id", user.id)
            .maybeSingle(),
          (supabase as any)
            .from("profiles")
            .select(
              "manifestation_intensity, manifest_routine_items, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone",
            )
            .eq("id", user.id)
            .maybeSingle(),
        ]);

        if (prefsRes.error) throw prefsRes.error;
        if (profileRes.error) throw profileRes.error;

        const prefs = prefsRes.data as RoutineDbRow | null;
        const profile = profileRes.data as RoutineDbRow | null;
        const preFeature = isPreFeatureRoutineUser(prefs, profile);

        const merged = mergeRoutineDbRow(prefs, profile);
        const loadedIntensity = preFeature ? "light" : merged.intensity;
        const loadedItems =
          merged.routineItems.length > 0
            ? merged.routineItems
            : defaultRoutineItems(loadedIntensity, routineItemLabel);

        const hasOneSignalConsent =
          merged.appNotificationsEnabled && merged.permissionStatus === "granted";
        const legacyNotifWithoutConsent =
          !preFeature && merged.appNotificationsEnabled && merged.permissionStatus !== "granted";

        if (legacyNotifWithoutConsent) {
          void Promise.all([
            (supabase as any).from("user_preferences").upsert(
              { user_id: user.id, app_notifications_enabled: false },
              { onConflict: "user_id" },
            ),
            (supabase as any).from("profiles").upsert(
              { id: user.id, app_notifications_enabled: false },
              { onConflict: "id" },
            ),
          ]).catch((err) => {
            console.error("[ManifestationRoutineSettings] legacy notif reset failed:", err);
          });
        }

        setIntensity(loadedIntensity);
        setSavedIntensity(loadedIntensity);
        setRoutineItems(loadedItems);
        setAlertTimes(preFeature ? [...ROUTINE_ALERT_DEFAULTS.light] : merged.alertTimes);
        setTimeZone(preFeature ? readDeviceTimeZone() : merged.timeZone);
        setAppNotificationsEnabled(preFeature ? false : hasOneSignalConsent);
        setPermissionStatus(
          preFeature
            ? "skipped"
            : legacyNotifWithoutConsent
              ? "skipped"
              : (merged.permissionStatus ?? null),
        );
      } catch (e) {
        console.error("[ManifestationRoutineSettings] load failed:", e);
        toast.error(t("toasts.routineLoadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const cardClass = cn(
    "w-full min-w-0 max-w-full overflow-hidden",
    theme === "dark"
      ? "!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm p-4 sm:p-6 space-y-3"
      : "p-4 sm:p-6 space-y-3",
    theme === "dark" && "!bg-transparent",
  );

  const choiceTileClass = (active: boolean) =>
    cn(
      "flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition-[box-shadow,border-color]",
      "bg-gradient-to-b from-white/14 to-white/[0.06] backdrop-blur-md",
      active ? "border-white/30 ring-1 ring-white/20" : "border-white/12",
      theme !== "dark" && (active ? "border-primary/40 bg-primary/5" : "border-border bg-card"),
    );

  const persistTimeZone = async (tz: string) => {
    if (!user) return false;
    const [{ error: prefsError }, { error: profileError }] = await Promise.all([
      (supabase as any).from("user_preferences").upsert(
        { user_id: user.id, timezone: tz },
        { onConflict: "user_id" },
      ),
      (supabase as any).from("profiles").upsert(
        { id: user.id, timezone: tz },
        { onConflict: "id" },
      ),
    ]);
    const ok = !prefsError && !profileError;
    if (!ok) {
      console.error(
        "[ManifestationRoutineSettings] persist timezone failed:",
        prefsError ?? profileError,
      );
    }
    if (ok && Capacitor.isNativePlatform() && appNotificationsEnabled) {
      void syncManifestationRoutineOneSignalTags({
        intensity,
        preferredLocale,
        notificationsEnabled: appNotificationsEnabled,
        permissionStatus,
        alertTimes,
        timezone: tz,
      }).catch(() => {});
    }
    return ok;
  };

  const persistAlertTimes = async (times: string[]) => {
    if (!user) return false;
    const [{ error: prefsError }, { error: profileError }] = await Promise.all([
      (supabase as any).from("user_preferences").upsert(
        { user_id: user.id, routine_notification_times: times, timezone: timeZone },
        { onConflict: "user_id" },
      ),
      (supabase as any).from("profiles").upsert(
        { id: user.id, routine_notification_times: times, timezone: timeZone },
        { onConflict: "id" },
      ),
    ]);
    const ok = !prefsError && !profileError;
    if (!ok) {
      console.error(
        "[ManifestationRoutineSettings] persist alert times failed:",
        prefsError ?? profileError,
      );
    }
    if (ok && Capacitor.isNativePlatform() && appNotificationsEnabled) {
      void syncManifestationRoutineOneSignalTags({
        intensity,
        preferredLocale,
        notificationsEnabled: appNotificationsEnabled,
        permissionStatus,
        alertTimes: times,
        timezone: timeZone,
      }).catch(() => {});
    }
    return ok;
  };

  const handleToggleAppNotifications = async (enabled: boolean) => {
    if (!user) return;
    const previous = appNotificationsEnabled;
    const effectiveItems = routineItemsForIntensity(intensity, routineItems, routineItemLabel);
    const effectiveTimes = parseAlertTimes(alertTimes, intensity);
    const routineBase = {
      manifestation_intensity: intensity,
      manifest_routine_items: effectiveItems,
      routine_notification_times: effectiveTimes,
    };

    setAppNotificationsEnabled(enabled);

    if (!enabled) {
      const [{ error: prefsError }, { error: profileError }] = await Promise.all([
        (supabase as any).from("user_preferences").upsert(
          { user_id: user.id, app_notifications_enabled: false },
          { onConflict: "user_id" },
        ),
        (supabase as any).from("profiles").upsert(
          { id: user.id, app_notifications_enabled: false },
          { onConflict: "id" },
        ),
      ]);

      if (prefsError || profileError) {
        setAppNotificationsEnabled(previous);
        console.error(
          "[ManifestationRoutineSettings] toggle off upsert failed:",
          prefsError ?? profileError,
        );
        toast.error(t("toasts.routineNotifUpdateFailed"));
        return;
      }

      if (Capacitor.isNativePlatform()) {
        void syncManifestationRoutineOneSignalTags({
          intensity,
          preferredLocale,
          notificationsEnabled: false,
          permissionStatus,
          alertTimes: [],
        }).catch((err) => {
          console.error("[ManifestationRoutineSettings] OneSignal tag sync failed:", err);
        });
      }

      toast.success(t("toasts.routineNotifOff"));
      return;
    }

    const detectedTz = readDeviceTimeZone();
    setTimeZone(detectedTz);

    if (Capacitor.isNativePlatform()) {
      type RoutineNotificationStep =
        | "bootstrap_onesignal"
        | "onesignal_login"
        | "sync_language"
        | "request_permission"
        | "opt_in_push_subscription"
        | "upsert_user_preferences"
        | "upsert_profiles"
        | "sync_onesignal_tags";

      let step: RoutineNotificationStep = "bootstrap_onesignal";
      const priorPermission = permissionStatus;

      try {
        const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
        console.info("[RoutineNotifications] toggle-on start", {
          appIdPresent: !!(appId && appId.trim()),
          userId: user.id,
        });

        console.info("[RoutineNotifications] step:start", { step });
        await bootstrapOneSignal();
        console.info("[RoutineNotifications] step:success", { step });

        step = "onesignal_login";
        console.info("[RoutineNotifications] step:start", { step, userId: user.id });
        await oneSignalLogin(user.id);
        console.info("[RoutineNotifications] step:success", { step });

        step = "sync_language";
        console.info("[RoutineNotifications] step:start", { step, preferredLocale });
        await syncOneSignalUserLanguage(preferredLocale);
        console.info("[RoutineNotifications] step:success", { step });

        step = "request_permission";
        console.info("[RoutineNotifications] step:start", { step, priorPermission });
        const granted = await requestOneSignalPushPermission(true);
        console.info("[RoutineNotifications] step:success", { step, granted });

        if (!granted) {
          setAppNotificationsEnabled(false);
          setPermissionStatus("denied");
          const [{ error: prefsError }, { error: profileError }] = await Promise.all([
            (supabase as any).from("user_preferences").upsert(
              {
                user_id: user.id,
                ...routineBase,
                app_notifications_enabled: false,
                notification_permission_status: "denied",
                timezone: detectedTz,
              },
              { onConflict: "user_id" },
            ),
            (supabase as any).from("profiles").upsert(
              {
                id: user.id,
                ...routineBase,
                app_notifications_enabled: false,
                notification_permission_status: "denied",
                timezone: detectedTz,
              },
              { onConflict: "id" },
            ),
          ]);
          if (prefsError || profileError) {
            console.error("[RoutineNotifications] denied upsert failed:", prefsError ?? profileError);
          }
          void syncManifestationRoutineOneSignalTags({
            intensity,
            notificationsEnabled: false,
            permissionStatus: "denied",
            alertTimes: [],
          }).catch((err) => {
            console.error("[RoutineNotifications] denied tag sync failed:", err);
          });
          toast.error(
            priorPermission === "denied"
              ? t("toasts.routineNotifDeniedIos")
              : t("toasts.routineNotifDenied"),
          );
          return;
        }

        step = "opt_in_push_subscription";
        console.info("[RoutineNotifications] step:start", { step });
        const optedIn = await optInOneSignalPush();
        console.info("[RoutineNotifications] step:success", { step, optedIn });

        if (!optedIn) {
          setAppNotificationsEnabled(false);
          setPermissionStatus("skipped");
          toast.error(t("toasts.routineNotifPermissionFailed"));
          return;
        }

        const enabledPayload = {
          ...routineBase,
          app_notifications_enabled: true,
          notification_permission_status: "granted",
          timezone: detectedTz,
          preferred_locale: preferredLocale,
        };

        step = "upsert_user_preferences";
        console.info("[RoutineNotifications] step:start", {
          step,
          payloadKeys: Object.keys(enabledPayload),
        });
        const prefsRes = await (supabase as any).from("user_preferences").upsert(
          { user_id: user.id, ...enabledPayload },
          { onConflict: "user_id" },
        );
        if (prefsRes.error) throw prefsRes.error;
        console.info("[RoutineNotifications] step:success", { step });

        step = "upsert_profiles";
        console.info("[RoutineNotifications] step:start", {
          step,
          payloadKeys: Object.keys(enabledPayload),
        });
        const profileRes = await (supabase as any).from("profiles").upsert(
          { id: user.id, ...enabledPayload },
          { onConflict: "id" },
        );
        if (profileRes.error) throw profileRes.error;
        console.info("[RoutineNotifications] step:success", { step });

        step = "sync_onesignal_tags";
        console.info("[RoutineNotifications] step:start", { step });
        await syncManifestationRoutineOneSignalTags({
          intensity,
          notificationsEnabled: true,
          permissionStatus: "granted",
          alertTimes: effectiveTimes,
          timezone: detectedTz,
          preferredLocale,
        });
        console.info("[RoutineNotifications] step:success", { step });

        setAppNotificationsEnabled(true);
        setPermissionStatus("granted");
        setSavedIntensity(intensity);
        setRoutineItems(effectiveItems);
        setAlertTimes(effectiveTimes);
        toast.success(t("toasts.routineNotifOn"));
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[RoutineNotifications] toggle-on failed", {
          step,
          error,
          message,
        });
        setAppNotificationsEnabled(false);
        toast.error(
          step === "bootstrap_onesignal" && message
            ? `Routine notification setup failed at ${step}: ${message}`
            : `Routine notification setup failed at ${step}. Check native logs.`,
        );
        return;
      }
    }

    const [{ error: prefsError }, { error: profileError }] = await Promise.all([
      (supabase as any).from("user_preferences").upsert(
        {
          user_id: user.id,
          ...routineBase,
          app_notifications_enabled: true,
          timezone: detectedTz,
        },
        { onConflict: "user_id" },
      ),
      (supabase as any).from("profiles").upsert(
        {
          id: user.id,
          ...routineBase,
          app_notifications_enabled: true,
          timezone: detectedTz,
        },
        { onConflict: "id" },
      ),
    ]);

    if (prefsError || profileError) {
      setAppNotificationsEnabled(previous);
      console.error(
        "[ManifestationRoutineSettings] web toggle on upsert failed:",
        prefsError ?? profileError,
      );
      toast.error(t("toasts.routineNotifUpdateFailed"));
      return;
    }

    setSavedIntensity(intensity);
    setRoutineItems(effectiveItems);
    setAlertTimes(effectiveTimes);

    if (Capacitor.isNativePlatform()) {
      void syncManifestationRoutineOneSignalTags({
        intensity,
        preferredLocale,
        notificationsEnabled: true,
        permissionStatus: permissionStatus ?? "skipped",
        alertTimes: effectiveTimes,
        timezone: timeZone,
      }).catch((err) => {
        console.error("[ManifestationRoutineSettings] OneSignal tag sync failed:", err);
      });
    }

    toast.success(t("toasts.routineNotifOn"));
  };

  const handleSaveIntensity = async () => {
    if (!user || saving) return;
    setSaving(true);
    const nextRoutine = routineItemsForIntensity(intensity, routineItems, routineItemLabel);

    const routinePatch = {
      manifestation_intensity: intensity,
      manifest_routine_items: nextRoutine,
      routine_notification_times: appNotificationsEnabled ? alertTimes : [],
      preferred_locale: preferredLocale,
    };

    const [{ error: prefsError }, { error: profileError }] = await Promise.all([
      (supabase as any).from("user_preferences").upsert(
        { user_id: user.id, ...routinePatch, timezone: timeZone },
        { onConflict: "user_id" },
      ),
      (supabase as any).from("profiles").upsert(
        { id: user.id, ...routinePatch, timezone: timeZone },
        { onConflict: "id" },
      ),
    ]);

    setSaving(false);

    if (prefsError || profileError) {
      console.error("[ManifestationRoutineSettings] save intensity failed:", prefsError ?? profileError);
      toast.error(t("toasts.routineIntensitySaveFailed"));
      return;
    }

    setSavedIntensity(intensity);
    setRoutineItems(nextRoutine);

    if (Capacitor.isNativePlatform()) {
      void syncManifestationRoutineOneSignalTags({
        intensity,
        preferredLocale,
        notificationsEnabled: appNotificationsEnabled,
        permissionStatus,
        alertTimes: appNotificationsEnabled ? alertTimes : [],
        timezone: timeZone,
      }).catch(() => {});
    }

    toast.success(t("toasts.routineIntensitySaved"));
  };

  const shellBg = theme === "dark" ? "#0f0d14" : "#ffffff";

  return (
    <div
      className={cn(
        "tool-page-shell relative overflow-x-hidden min-h-screen pb-20 md:pb-0",
        theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background",
      )}
      style={{ backgroundColor: shellBg }}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

      <div
        className={cn(isMobile ? "flex-1 flex flex-col min-h-0" : "min-h-screen", "flex flex-col")}
        style={
          !isMobile
            ? {
                marginLeft: sidebarCollapsed ? "64px" : "256px",
                transition: "margin-left 300ms ease-in-out",
              }
            : {}
        }
      >
        {isMobile ? (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        ) : null}

        <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <header
          className={cn(
            "z-50 border-b flex items-center",
            theme === "dark" ? "border-white/10 bg-[#0f0d14]" : "border-primary/10 bg-background",
            isMobile
              ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)] px-4 py-2.5"
              : "fixed top-0 left-0 right-0 h-16 px-6",
          )}
          style={
            !isMobile
              ? {
                  top: "var(--app-safe-area-top)",
                  left: sidebarCollapsed ? "64px" : "256px",
                  transition: "left 300ms ease-in-out",
                  backgroundColor: shellBg,
                }
              : { backgroundColor: shellBg }
          }
        >
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => navigate("/dashboard/settings")}
                className={cn(
                  "shrink-0 rounded-full p-2 transition-colors",
                  theme === "dark" ? "hover:bg-white/10" : "hover:bg-muted",
                )}
                aria-label={t("routine.backAria")}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">{t("routine.title")}</h1>
                <p className={cn("text-xs truncate", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("routine.subtitle")}
                </p>
              </div>
            </div>
            {isMobile && <MobilePWAMenu />}
          </div>
        </header>

        <main
          className={cn(
            "relative z-10 w-full px-4 sm:px-6 max-w-4xl",
            isMobile ? "pb-4" : "pb-20",
            !isMobile ? "pt-16" : "",
            !isMobile ? "" : "container mx-auto",
            isMobile && "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
          )}
        >
          <div className={cn(isMobile ? "pt-3 pb-2" : "py-2 sm:py-3")}>
          {loading ? (
            <p className={cn("text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
              {t("routine.loading")}
            </p>
          ) : (
            <div className="w-full min-w-0 max-w-full space-y-4">
              <Card className={cardClass}>
                <h2 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <Zap className="h-4 w-4" />
                  {t("routine.intensityHeading")}
                </h2>
                <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("routine.intensityDescription")}
                </p>

                <div className="space-y-3 pt-1">
                  {INTENSITY_IDS.map((id) => {
                    const active = intensity === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          setIntensity(id);
                          setAlertTimes([...ROUTINE_ALERT_DEFAULTS[id]]);
                        }}
                        className={choiceTileClass(active)}
                      >
                        <span className="min-w-0 flex-1 space-y-1 text-left">
                          <span className="block text-base font-semibold">{t(`routine.intensity.${id}.title`)}</span>
                          <span
                            className={cn(
                              "block text-sm font-medium",
                              theme === "dark" ? "text-white/80" : "text-foreground/80",
                            )}
                          >
                            {t(`routine.intensity.${id}.tagline`)}
                          </span>
                          <span
                            className={cn(
                              "block text-xs leading-relaxed",
                              theme === "dark" ? "text-white/50" : "text-muted-foreground",
                            )}
                          >
                            {t(`routine.intensity.${id}.description`)}
                          </span>
                        </span>
                        {active ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 shrink-0 opacity-35" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {intensity !== savedIntensity && (
                  <Button onClick={() => void handleSaveIntensity()} disabled={saving} className="w-full">
                    {saving ? t("routine.saving") : t("routine.saveIntensity")}
                  </Button>
                )}
              </Card>

              <Card className={cardClass}>
                <h2 className="font-semibold text-sm sm:text-base">{t("routine.notificationsHeading")}</h2>
                <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("routine.notificationsDescription")}
                </p>

                <div className="flex min-w-0 items-center justify-between gap-3 pt-1">
                  <Label htmlFor="routine-notifications" className="min-w-0 shrink">
                    {t("routine.pushRemindersLabel")}
                  </Label>
                  <Switch
                    id="routine-notifications"
                    checked={appNotificationsEnabled}
                    onCheckedChange={(enabled) => void handleToggleAppNotifications(enabled)}
                    className="shrink-0 data-[state=checked]:bg-green-500"
                  />
                </div>

                {appNotificationsEnabled ? (
                  <div
                    className={cn(
                      "w-full min-w-0 space-y-2 border-t pt-3 overflow-hidden",
                      theme === "dark" ? "border-white/10" : "border-border",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-medium",
                        theme === "dark" ? "text-white/90" : "text-foreground",
                      )}
                    >
                      {t("routine.dailyTimeHeading")}
                    </p>
                    <RoutineTimeZoneSelect
                      value={timeZone}
                      dark={theme === "dark"}
                      onChange={(tz) => {
                        setTimeZone(tz);
                        void persistTimeZone(tz);
                      }}
                    />
                    {(intensity === "light"
                      ? [t("routine.alerts.single")]
                      : intensity === "consistent"
                        ? [t("routine.alerts.first"), t("routine.alerts.second")]
                        : [t("routine.alerts.first"), t("routine.alerts.second"), t("routine.alerts.third")]
                    ).map((label, index) => (
                      <div
                        key={label}
                        className="flex flex-wrap items-center gap-2 min-w-0 justify-between"
                      >
                        <Label className="min-w-0 shrink text-sm font-normal">{label}</Label>
                        <input
                          type="time"
                          value={alertTimes[index] ?? ROUTINE_ALERT_DEFAULTS[intensity][index]}
                          onChange={(e) => {
                            const next = [...alertTimes];
                            next[index] = e.target.value;
                            setAlertTimes(next);
                            if (appNotificationsEnabled) {
                              void persistAlertTimes(next);
                            }
                          }}
                          className={cn(
                            "min-w-0 max-w-[9.5rem] shrink-0 rounded-lg border px-2 py-1.5 text-sm",
                            theme === "dark"
                              ? "border-white/15 bg-white/10 text-white [color-scheme:dark]"
                              : "border-border bg-background text-foreground",
                          )}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}

                {permissionStatus === "denied" && (
                  <p className={cn("text-xs", theme === "dark" ? "text-white/50" : "text-muted-foreground")}>
                    {t("routine.deviceDeniedHint")}
                  </p>
                )}
              </Card>
            </div>
          )}
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}

```
