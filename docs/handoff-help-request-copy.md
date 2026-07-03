# Handoff: Help Request area — full copy (en / es-419 / pt-BR)

Updated 2026-06-09. **English is reference.** Propose edits to es-419 and pt-BR unless English is wrong.

**Route:** `/dashboard/report-issue`  
**Deep link (push):** `paletteplotting://help-request/{caseId}` → opens Inbox tab with case  
**Query params:** `?tab=inbox` · `?tab=inbox&case={uuid}`

**Main UI:** `src/pages/ReportAppIssue.tsx`  
**i18n namespace:** `support` (+ `dashboard` for tool/billing dropdowns, `common` for Cancel)  
**Source files:** `src/i18n/locales/{en,es-419,pt-BR}/support.json`

---

## Tabs (3)

| Tab key | Route state | English tab label | es-419 | pt-BR | i18n key |
|---------|-------------|-------------------|--------|-------|----------|
| `create` | default | Help Me Create | Ayúdame a crear | Ajude-me a criar | `tabs.create` |
| `support` | | App Support & Feedback | Soporte | Suporte | `tabs.support` |
| `inbox` | | Inbox | Bandeja | Caixa | `tabs.inbox` |

**Page chrome**

| Key | English | es-419 | pt-BR |
|-----|---------|--------|-------|
| `pageTitle` | Help Request | Solicitud de ayuda | Pedido de ajuda |
| `supportInbox` | Support Inbox | Bandeja de soporte | Caixa de suporte |

`supportInbox` button shown only to admin users → navigates to `/dashboard/admin/support`.

**Dashboard entry (aria only):** `dashboard:nav.help` — Help / Ayuda / Ajuda (icon button on dashboard header).

**Shared button:** `common:cancel` — Cancel / Cancelar / Cancelar

---

## Tab 1: Help Me Create (`create`)

**No prefilled values** — `createManifestingFocus` and `createHelpType` start empty. Only placeholders below.

### Intro + form labels

| Key | English | es-419 | pt-BR |
|-----|---------|--------|-------|
| `create.intro` | Share only what feels relevant. Palette Plotting will turn this into app-ready prompts, affirmations, or a routine. | Comparte solo lo relevante. Palette Plotting crea prompts, afirmaciones o rutina. | Compartilhe só o relevante. Palette Plotting cria prompts, afirmações ou rotina. |
| `create.focusLabel` | What are you manifesting right now? | ¿Qué estás manifestando ahora? | O que você está manifestando agora? |
| `create.focusPlaceholder` | Let us know what you are manifesting and what difficulties you're facing. | Cuéntanos qué estás manifestando y qué dificultades enfrentas. | Conte o que você está manifestando e quais dificuldades está enfrentando. |
| `create.helpTypeLabel` | What do you need help with? | ¿Con qué necesitas ayuda? | Com o que você precisa de ajuda? |
| `create.chooseOne` | Choose one | Elige una opción | Escolha uma opção |
| `create.footer` | Please submit what feels most relevant. Palette Plotting will aim to reply within 24 to 48 hours of your request. You may also reach out to us at support@paletteplot.com. | Envía lo que sientas más relevante. Palette Plotting intentará responder en 24 a 48 horas. También puedes escribirnos a support@paletteplot.com. | Envie o que parecer mais relevante. A Palette Plotting tentará responder em 24 a 48 horas. Você também pode nos contatar em support@paletteplot.com. |
| `create.submit` | Submit | Enviar | Enviar |
| `create.submitting` | Submitting… | Enviando… | Enviando… |

**Character limit:** focus field max **1000** chars (counter shown). Min **10** chars to submit.

### Help type dropdown (`createHelpOptions`)

Persisted `tool_value` → localized `tool_label` sent to API.

| Persisted value | English | es-419 | pt-BR |
|-----------------|---------|--------|-------|
| `affirmations_or_scripting` | Affirmations or scripting | Afirmaciones o scripting | Afirmações ou scripting |
| `strong_subliminal` | Make a strong subliminal | Crear un subliminal potente | Criar um subliminar forte |
| `mirror_work_guidance` | Mirror work guidance | Guía de espejo | Guia de espelho |
| `build_weekly_routine` | Build a weekly routine | Armar una rutina semanal | Montar uma rotina semanal |
| `not_sure_help_me_choose` | Not sure — help me choose | No sé — ayúdame | Não sei — me ajude |

**API:** `submission_type: "help_me_create"` via `submit-app-support-report` edge function.

### Success state (Help Me Create)

| Key | English | es-419 | pt-BR |
|-----|---------|--------|-------|
| `create.successTitle` | Submitted. | Enviado. | Enviado. |
| `create.successBody` | We'll reply by email. If you need something urgently, you can also email | Responderemos por correo. ¿Urgente? Escribe a | Responderemos por e-mail. Urgente? Escreva para |
| `create.successBodySuffix` | . | . | . |
| `create.backToDashboard` | Back to dashboard | Volver al panel | Voltar ao painel |
| `create.submitAnother` | Submit another | Enviar otro | Enviar outro |

Email link between body and suffix: `support@paletteplot.com` (hardcoded href, not i18n).

---

## Tab 2: App Support & Feedback (`support`)

**No prefilled values** — all fields start empty.

### Submission type dropdown

| Persisted value | English | es-419 | pt-BR |
|-----------------|---------|--------|-------|
| `report` | Report an issue | Reportar un problema | Reportar um problema |
| `ai_flag` | Flag AI-generated content | Marcar contenido generado por IA | Sinalizar conteúdo gerado por IA |
| `feature_request` | Feature request | Solicitud de función | Pedido de recurso |

i18n keys: `submissionTypes.report` · `submissionTypes.aiFlag` · `submissionTypes.featureRequest`

(`helpMeCreate` / `submissionTypes.helpMeCreate` used in inbox labels only — not in this tab’s dropdown.)

### Tool or area dropdown

Labels from `dashboard` namespace via `getSupportReportToolOptions()` in `src/lib/featuresData.ts`.

| Persisted `tool_value` | English label | es-419 | pt-BR |
|------------------------|---------------|--------|-------|
| `/dashboard` | Dashboard (home) | Panel (inicio) | Painel (início) |
| `/dashboard/affirmations-builder` | Affirm & Script | Afirmar y Escribir | Afirmar e Escrever |
| `/dashboard/subliminal` | Subliminal Maker | Subliminales | Subliminares |
| `/dashboard/mirror` | Mirror Work | Espejo | Espelho |
| `/dashboard/refactor` | Belief Work | Creencias | Crenças |
| `/dashboard/double` | Embody | Encarnar | Encarnar |
| `/dashboard/your-journey` | Your Journey | Tu Camino | Sua Jornada |
| `/dashboard/affirmation-viewer` | Affirmation Visualizer | Visualizador de afirmaciones | Visualizador de afirmações |
| `/dashboard/your-journey/chat` | Talk to Guide (Chat) | Hablar con Tu Guía (Chat) | Falar com o Guia (Chat) |
| `/dashboard/music-composer` | Music Composer | Compositor musical | Compositor musical |
| `/dashboard/tap-in` | Tap-in / Piano | Tap-in / Piano | Tap-in / Piano |
| `/dashboard/activity-tracking` | Activity tracking | Actividad | Atividade |
| `/dashboard/timeline` | Manifestation journal | Diario de manifestación | Diário de manifestação |
| `settings` | Settings / Account | Ajustes / Cuenta | Configurações / Conta |
| `billing` | Billing / subscriptions | Facturación / suscripciones | Assinatura / pagamentos |
| `other` | Other (new tool or not listed) | Otro | Outro |

Form keys: `supportForm.toolOrAreaLabel` · `supportForm.toolPlaceholder`

### Billing purchase channel (shown only when tool = `billing`)

| Persisted value | English | es-419 | pt-BR |
|-----------------|---------|--------|-------|
| `apple_app_store` | Apple App Store | Apple App Store | Apple App Store |
| `google_play` | Google Play | Google Play | Google Play |
| `web` | Web (card / checkout) | Web (tarjeta / pago) | Web (cartão / pagamento) |

i18n: `dashboard:billingChannels.apple` · `.googlePlay` · `.web`  
Form keys: `supportForm.purchaseChannelLabel` · `supportForm.purchaseChannelPlaceholder`

### Description + screenshots

| Key | English | es-419 | pt-BR |
|-----|---------|--------|-------|
| `supportForm.descriptionLabel` | Describe the issue or request | Describe el problema o la solicitud | Descreva o problema ou pedido |
| `supportForm.descriptionPlaceholder` | What happened, what should change, or what would help? | ¿Qué pasó, qué debería cambiar o qué ayudaría? | O que aconteceu, o que deveria mudar ou o que ajudaria? |
| `supportForm.appleRefundNote` | Apple ultimately controls payments and refunds; however we will try our best to help you. | Apple controla en última instancia los pagos y reembolsos; aun así haremos lo posible por ayudarte. | A Apple controla pagamentos e reembolsos; mesmo assim faremos o possível para ajudar. |

`appleRefundNote` shown only when tool = `billing` AND channel = `apple_app_store`.

| Key | English | es-419 | pt-BR |
|-----|---------|--------|-------|
| `supportForm.screenshotsLabel` | Screenshots (optional) | Capturas (opcional) | Prints (opcional) |
| `supportForm.screenshotsHint` | Up to {{max}} files · HEIC, JPG, PNG, WebP, etc. · max 5 MB each | Hasta {{max}} archivos · HEIC, JPG, PNG, WebP, etc. · máx. 5 MB c/u | Até {{max}} arquivos · HEIC, JPG, PNG, WebP, etc. · máx. 5 MB cada |
| `supportForm.chooseFiles` | Choose files | Elegir archivos | Escolher arquivos |
| `supportForm.filesSelected_one` | {{count}} file selected | {{count}} archivo seleccionado | {{count}} arquivo selecionado |
| `supportForm.filesSelected_other` | {{count}} files selected | {{count}} archivos seleccionados | {{count}} arquivos selecionados |
| `supportForm.noFilesSelected` | No files selected | Ningún archivo seleccionado | Nenhum arquivo selecionado |
| `supportForm.removeFileAria` | Remove {{name}} | Quitar {{name}} | Remover {{name}} |
| `supportForm.contactFooter` | You may also reach out to us at support@paletteplot.com. | También puedes escribirnos a support@paletteplot.com. | Você também pode nos contatar em support@paletteplot.com. |

**Limits:** description min **10** chars · max **3** attachments · **5 MB** each.

### Success state (App Support)

| Key | English | es-419 | pt-BR |
|-----|---------|--------|-------|
| `supportForm.successTitle` | Thanks — we received your submission. | Gracias — recibimos tu envío. | Obrigado — recebemos seu envio. |
| `supportForm.successBody` | We aim to respond within 24–48 hours. If you need something urgently, you can also email | Buscamos responder en 24–48 horas. Si necesitas algo con urgencia, también puedes escribir a | Buscamos responder em 24–48 horas. Se precisar de algo com urgência, você também pode escrever para |
| `supportForm.successBodySuffix` | . | . | . |
| `supportForm.submissionTypeLabel` | Submission type | Tipo de envío | Tipo de envio |

Reuses `create.backToDashboard` and `create.submitAnother` on success.

---

## Tab 3: Inbox (`inbox`)

| Key | English | es-419 | pt-BR |
|-----|---------|--------|-------|
| `inbox.title` | Inbox | Bandeja de entrada | Caixa de entrada |
| `inbox.description` | Your submitted requests and replies from Palette Plotting. New requests start on the other tabs. | Tus solicitudes enviadas y respuestas de Palette Plotting. Las nuevas solicitudes empiezan en las otras pestañas. | Seus pedidos enviados e respostas da Palette Plotting. Novos pedidos começam nas outras abas. |
| `inbox.refresh` | Refresh | Actualizar | Atualizar |
| `inbox.backToRequests` | ← Back to requests | ← Volver a solicitudes | ← Voltar aos pedidos |
| `inbox.loading` | Loading… | Cargando… | Carregando… |
| `inbox.noMessages` | No messages yet. | Aún no hay mensajes. | Ainda não há mensagens. |
| `inbox.empty` | No requests yet. Submit on Help Me Create or App Support & Feedback — replies will show up here. | Aún no hay solicitudes. Envía en otras pestañas; las respuestas aparecerán aquí. | Nenhum pedido ainda. Envie em outras abas; respostas aparecem aqui. |
| `inbox.senderSupport` | Palette Plotting | Palette Plotting | Palette Plotting |
| `inbox.senderYou` | You | Tú | Você |
| `inbox.yourReply` | Your reply | Tu respuesta | Sua resposta |
| `inbox.replyPlaceholder` | Reply in this conversation… | Responder en esta conversación… | Responder nesta conversa… |
| `inbox.sending` | Sending… | Enviando… | Enviando… |
| `inbox.sendReply` | Send reply | Enviar respuesta | Enviar resposta |
| `inbox.newReplyAria` | New reply | Nueva respuesta | Nova resposta |
| `inbox.supportRepliedPrefix` | Palette Plotting replied ·  | Palette Plotting respondió ·  | Palette Plotting respondeu ·  |
| `inbox.submittedPrefix` | Submitted {{when}} | Enviado {{when}} | Enviado {{when}} |
| `inbox.todayAt` | Today at {{time}} | Hoy a las {{time}} | Hoje às {{time}} |
| `inbox.yesterdayAt` | Yesterday at {{time}} | Ayer a las {{time}} | Ontem às {{time}} |

### Inbox case type labels

| Key | English | es-419 | pt-BR |
|-----|---------|--------|-------|
| `inbox.caseTypes.helpMeCreate` | Help Me Create | Ayúdame a crear | Ajude-me a criar |
| `inbox.caseTypes.appSupportFeedback` | App Support & Feedback | Soporte de app | Suporte do app |
| `inbox.subtypes.request` | Request | Solicitud | Pedido |
| `inbox.subtypes.supportRequest` | Support request | Solicitud de soporte | Pedido de suporte |

**Dynamic inbox preview:** unread cases show `supportRepliedPrefix` + `latest_message_preview`; read cases show `"${preview}"` quoted. Subtype line combines submission type + tool label when applicable (`userSupportInbox.ts`).

---

## Toasts (`support:toasts.*`)

| Key | English | es-419 | pt-BR |
|-----|---------|--------|-------|
| `toasts.maxAttachments` | You can add up to {{max}} images. | Puedes agregar hasta {{max}} imágenes. | Você pode adicionar até {{max}} imagens. |
| `toasts.unsupportedImage` | {{name}} is not a supported image type. | {{name}} no es un tipo de imagen compatible. | {{name}} não é um tipo de imagem compatível. |
| `toasts.fileTooLarge` | {{name}} is too large (max 5 MB per file). | {{name}} es demasiado grande (máx. 5 MB por archivo). | {{name}} é grande demais (máx. 5 MB por arquivo). |
| `toasts.chooseSubmissionType` | Please choose a submission type. | Elige un tipo de envío. | Escolha um tipo de envio. |
| `toasts.chooseToolOrArea` | Please choose where this applies. | Elige dónde aplica esto. | Escolha onde isso se aplica. |
| `toasts.choosePurchaseChannel` | Please select where you purchased (Apple App Store, Google Play, or Web). | Selecciona dónde compraste (Apple App Store, Google Play o Web). | Selecione onde você comprou (Apple App Store, Google Play ou Web). |
| `toasts.descriptionMinLength` | Please enter at least {{min}} characters in the description. | Escribe al menos {{min}} caracteres en la descripción. | Digite pelo menos {{min}} caracteres na descrição. |
| `toasts.uploadFailed` | Image upload failed | Error al subir la imagen | Falha ao enviar a imagem |
| `toasts.requestFailed` | Request failed | La solicitud falló | Falha na solicitação |
| `toasts.submitted` | Submitted | Enviado | Enviado |
| `toasts.shareManifestationFocus` | Please share what you're trying to manifest or shift. | Comparte qué estás intentando manifestar o cambiar. | Compartilhe o que você está tentando manifestar ou mudar. |
| `toasts.chooseHelpType` | Please choose what you need help with. | Elige con qué necesitas ayuda. | Escolha com o que você precisa de ajuda. |
| `toasts.addMoreDetail` | Please add a bit more detail. | Agrega un poco más de detalle. | Adicione um pouco mais de detalhe. |
| `toasts.loadInboxFailed` | Could not load inbox. | No se pudo cargar la bandeja. | Não foi possível carregar a caixa de entrada. |
| `toasts.loadConversationFailed` | Could not load conversation. | No se pudo cargar la conversación. | Não foi possível carregar a conversa. |
| `toasts.replySent` | Reply sent | Respuesta enviada | Resposta enviada |
| `toasts.sendReplyFailed` | Could not send reply. | No se pudo enviar la respuesta. | Não foi possível enviar a resposta. |

Generic fallback: `common:error` — Something went wrong / Algo salió mal (es-419) / Something went wrong (en) — check `common.json` per locale.

---

## Help reply push notification

**File:** `supabase/functions/_shared/pushLocale.ts`  
**Trigger:** `send-help-request-reply-push` when admin replies  
**Deep link:** `paletteplotting://help-request/{caseId}`

| Field | English | es-419 | pt-BR |
|-------|---------|--------|-------|
| Heading (`headings.en` only) | Palette Plotting | — | — |
| Body (`contents`) | We replied to your help request. | Ya respondimos tu solicitud. | Já respondemos sua solicitação. |

---

## English-only strings (not i18n)

| Location | String |
|----------|--------|
| `submit-app-support-report/index.ts` | Email/report assembly uses English labels: `Help Me Create`, `What are you manifesting right now?`, `What do you need help with?`, `Report issue`, `Flag AI-generated content`, `Feature request`, `Purchase channel: …` |
| `submit-app-support-report/index.ts` | API validation errors (English): `Invalid submission type`, `Description must be at least 10 characters`, etc. |
| `ReportAppIssue.tsx` | `support@paletteplot.com` mailto href (same in all locales) |
| Case subject line (server) | `Help Me Create — {toolLabel}` or `{typeLabel} — {toolLabel}` |

---

## Source code index

| File | Role |
|------|------|
| `src/pages/ReportAppIssue.tsx` | Full UI — 3 tabs, forms, inbox, uploads |
| `src/lib/userSupportInbox.ts` | Inbox case labels, date formatting, preview text |
| `src/lib/featuresData.ts` | `getSupportReportToolOptions`, `getBillingPurchaseChannelOptions` |
| `src/i18n/locales/{en,es-419,pt-BR}/support.json` | Primary copy |
| `src/i18n/locales/{en,es-419,pt-BR}/dashboard.json` | Tool dropdown + billing channel labels |
| `src/i18n/locales/{en,es-419,pt-BR}/common.json` | Cancel, generic error |
| `supabase/functions/submit-app-support-report/index.ts` | Submit + inbox thread creation |
| `supabase/functions/send-help-request-reply-push/index.ts` | Push on admin reply |
| `supabase/functions/_shared/pushLocale.ts` | Push body copy |
| `src/services/oneSignal.ts` | Deep link → `/dashboard/report-issue?tab=inbox&case=…` |

---

## Notes for review

- **Do not** change i18n keys or persisted `tool_value` / `submission_type` values — copy only.
- **Keep:** `support@paletteplot.com`, `Scripting`, `Tap-in`, product tool names where intentional.
- **pt-BR subliminal term:** `subliminares` (not subliminais) in tool dropdown.
- **es-419 settings nav elsewhere:** Ajustes — billing dropdown uses `Ajustes / Cuenta`.
- **No prefilled form text** — only placeholders; user must fill fields before submit.
