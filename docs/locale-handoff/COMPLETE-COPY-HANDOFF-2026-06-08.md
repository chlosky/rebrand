# Palette Plotting — Complete i18n handoff (EN + es-419 + pt-BR)

Generated: 2026-06-08. Micromanagement handoff for ChatGPT translation QA.

## Document map

1. **Section 1** — All 1994 i18n keys (every namespace).
2. **Section 2** — Onboarding read-aloud affirmations (12 categories × 10 lines).
3. **Section 3** — Premade affirmation sets (`tools.affirmations.premade.*`).
4. **Section 4** — Subliminal maker tour steps (`tools.subliminal.tour.*`).
5. **Section 5** — Copy still hardcoded in TypeScript.
6. **Section 6** — Namespace index (key counts).

---

# Section 1 — All locale keys

| Key | English | es-419 | pt-BR |
|-----|---------|--------|-------|
| `auth.activate.accountCreatedBody` | Check your email to set your password. Once you've set your password, you can sign in to access your account. | Revisa tu correo para establecer tu contraseña. Luego inicia sesión. | Verifique seu e-mail para definir sua senha. Depois, entre na conta. |
| `auth.activate.accountCreatedTitle` | Account created successfully! | ¡Cuenta creada con éxito! | Conta criada com sucesso! |
| `auth.activate.billingMonthly` | monthly | mensual | mensal |
| `auth.activate.goToSignIn` | Go to Sign In | Ir a iniciar sesión | Ir para entrar |
| `auth.activate.goToSubscriptions` | Go to subscriptions | Ir a suscripciones | Ir para assinaturas |
| `auth.activate.missingInfo` | Missing activation info. Please restart onboarding. | Falta información de activación. Reinicia el registro. | Informações de ativação ausentes. Reinicie o cadastro. |
| `auth.activate.paymentNotConfirmed` | Payment not confirmed. Please ensure your payment was successful. | Pago no confirmado. Asegúrate de que tu pago se haya completado. | Pagamento não confirmado. Verifique se seu pagamento foi concluído. |
| `auth.activate.restart` | Restart | Reiniciar | Reiniciar |
| `auth.activate.subtitleDefault` | Complete setup to activate your subscription. | Completa para activar tu suscripción. | Conclua para ativar sua assinatura. |
| `auth.activate.subtitleWithTier` | You chose the {{tier}} plan ({{billing}}). | Elegiste el plan {{tier}} ({{billing}}). | Você escolheu o plano {{tier}} ({{billing}}). |
| `auth.activate.title` | Activate your plan | Activa tu plan | Ative seu plano |
| `auth.activate.waitingForAccount` | Waiting for account creation... | Esperando la creación de la cuenta... | Aguardando criação da conta... |
| `auth.forgotPassword.backToSignIn` | Back to Sign In | Volver a iniciar sesión | Voltar para entrar |
| `auth.forgotPassword.checkEmailBody` | Check your email for a password reset link. Click the link to reset your password. | Revisa tu correo para restablecer tu contraseña. | Verifique seu e-mail para redefinir a senha. |
| `auth.forgotPassword.checkEmailTitle` | Check your email | Revisa tu correo | Verifique seu e-mail |
| `auth.forgotPassword.sendResetLink` | Send Reset Link | Enviar enlace | Enviar link |
| `auth.forgotPassword.sending` | Sending... | Enviando... | Enviando... |
| `auth.notFound.message` | Page not found | Página no encontrada | Página não encontrada |
| `auth.notFound.redirecting` | Redirecting to home... | Redirigiendo al inicio... | Redirecionando para o início... |
| `auth.notFound.title` | 404 | 404 | 404 |
| `auth.resetPassword.backToSignIn` | Back to Sign In | Volver a iniciar sesión | Voltar para entrar |
| `auth.resetPassword.confirmPasswordLabel` | Confirm New Password | Confirmar nueva contraseña | Confirmar nova senha |
| `auth.resetPassword.confirmPasswordPlaceholder` | Confirm new password | Confirma la contraseña | Confirme a senha |
| `auth.resetPassword.description` | Enter your new password | Ingresa tu nueva contraseña | Digite sua nova senha |
| `auth.resetPassword.newPasswordLabel` | New Password | Nueva contraseña | Nova senha |
| `auth.resetPassword.newPasswordPlaceholder` | Enter new password | Nueva contraseña | Nova senha |
| `auth.resetPassword.noSessionDescription` | Please click the link in your email to reset your password. | Haz clic en el enlace de tu correo para restablecer tu contraseña. | Clique no link do seu e-mail para redefinir sua senha. |
| `auth.resetPassword.submit` | Reset Password | Restablecer contraseña | Redefinir senha |
| `auth.resetPassword.submitting` | Resetting... | Restableciendo... | Redefinindo... |
| `auth.resetPassword.title` | Reset Password | Restablecer contraseña | Redefinir senha |
| `auth.resetPassword.validatingPassword` | Validating password... | Validando contraseña... | Validando senha... |
| `auth.signIn.description` | Sign in to Continue | Inicia sesión para continuar | Entre para continuar |
| `auth.signIn.emailOrUsernameLabel` | Email or Username | Correo o usuario | E-mail ou usuário |
| `auth.signIn.emailOrUsernamePlaceholder` | you@example.com or username | tu@correo.com o usuario | voce@email.com ou usuário |
| `auth.signIn.forgotPasswordLink` | Forgot password? | ¿Olvidaste tu clave? | Esqueceu a senha? |
| `auth.signIn.noAccount` | Don't have an account? | ¿No tienes cuenta? | Não tem uma conta? |
| `auth.signIn.pageTitle` | Sign In \| Palette Plotting | Iniciar sesión \| Palette Plotting | Entrar \| Palette Plotting |
| `auth.signIn.passwordLabel` | Password | Contraseña | Senha |
| `auth.signIn.passwordPlaceholder` | •••••••• | •••••••• | •••••••• |
| `auth.signIn.signUp` | Sign Up | Regístrate | Cadastre-se |
| `auth.signIn.submit` | Sign In | Iniciar sesión | Entrar |
| `auth.signIn.submitting` | Signing In... | Iniciando sesión... | Entrando... |
| `auth.signIn.title` | Sign In | Iniciar sesión | Entrar |
| `auth.toasts.accountCreated` | Account created! Check your email to set your password. | ¡Cuenta creada! Revisa tu correo para establecer tu contraseña. | Conta criada! Verifique seu e-mail para definir sua senha. |
| `auth.toasts.accountCreationSlow` | Account creation is taking longer than expected. Please check your email or contact support. | La creación de la cuenta está tardando más de lo esperado. Revisa tu correo o contacta a soporte. | A criação da conta está demorando mais do que o esperado. Verifique seu e-mail ou entre em contato com o suporte. |
| `auth.toasts.activationLoadFailed` | Unable to load activation session. Please restart onboarding. | No se pudo cargar la sesión de activación. Reinicia el registro. | Não foi possível carregar a sessão de ativação. Reinicie o cadastro. |
| `auth.toasts.passwordResetFailed` | Failed to reset password. Please try again. | No se pudo restablecer la contraseña. Inténtalo de nuevo. | Não foi possível redefinir a senha. Tente novamente. |
| `auth.toasts.passwordResetSuccess` | Password reset successfully. Please sign in. | Contraseña restablecida correctamente. Inicia sesión. | Senha redefinida com sucesso. Entre na sua conta. |
| `auth.toasts.resetLinkFailed` | Failed to send reset link. Please try again. | No se pudo enviar el enlace. | Não foi possível enviar o link. |
| `auth.toasts.resetLinkSent` | Password reset link sent to your email | Enlace de restablecimiento enviado a tu correo | Link de redefinição enviado para seu e-mail |
| `auth.toasts.usernameNotFound` | Username not found | Nombre de usuario no encontrado | Nome de usuário não encontrado |
| `auth.verifyEmail.errorTitle` | Verification failed | Verificación fallida | Verificação falhou |
| `auth.verifyEmail.goToDashboard` | Go to dashboard | Ir al panel | Ir para o painel |
| `auth.verifyEmail.missingToken` | Missing token. | Falta el token. | Token ausente. |
| `auth.verifyEmail.requestNewEmail` | Please request a new verification email. | Solicita un nuevo correo de verificación. | Solicite um novo e-mail de verificação. |
| `auth.verifyEmail.successBody` | You're all set. | Todo listo. | Tudo pronto. |
| `auth.verifyEmail.successTitle` | Email verified | Correo verificado | E-mail verificado |
| `auth.verifyEmail.verificationFailed` | Verification failed. | Verificación fallida. | Verificação falhou. |
| `auth.verifyEmail.verifying` | Verifying… | Verificando… | Verificando… |
| `common.back` | Back | Atrás | Voltar |
| `common.cancel` | Cancel | Cancelar | Cancelar |
| `common.close` | Close | Cerrar | Fechar |
| `common.continue` | Continue | Continuar | Continuar |
| `common.edgeErrors.connectionError` | Connection error. Check your network and try again. | Error de conexión. Revisa tu red e intenta de nuevo. | Erro de conexão. Verifique sua rede e tente novamente. |
| `common.edgeErrors.dailyMessageLimit` | You've reached your daily message limit ({{limit}} messages). Resets at midnight. | Alcanzaste tu límite diario de mensajes ({{limit}}). Se reinicia a medianoche. | Você atingiu seu limite diário de mensagens ({{limit}}). O limite reinicia à meia-noite. |
| `common.edgeErrors.databaseError` | Database error. Please try again. | Error de base de datos. Intenta de nuevo. | Erro no banco. Tente de novo. |
| `common.edgeErrors.failedToGenerateMessage` | Failed to generate message | No se pudo generar el mensaje | Falha ao gerar mensagem |
| `common.edgeErrors.genericRetry` | An error occurred. Please try again. | Ocurrió un error. Inténtalo de nuevo. | Ocorreu um erro. Tente novamente. |
| `common.edgeErrors.invalidRequest` | Invalid request. Please try again. | Solicitud inválida. Intenta de nuevo. | Solicitação inválida. Tente novamente. |
| `common.edgeErrors.noCharacterSelected` | No character selected. Please select a character first. | Selecciona un personaje primero. | Selecione um personagem primeiro. |
| `common.edgeErrors.noMessageGenerated` | No message generated | No se generó ningún mensaje | Nenhuma mensagem gerada |
| `common.edgeErrors.permissionDenied` | Permission denied. Please ensure you're logged in and try again. | Permiso denegado. Inicia sesión e inténtalo de nuevo. | Permissão negada. Entre e tente de novo. |
| `common.edgeErrors.serviceUnavailable` | Service temporarily unavailable. Please try again. | Servicio temporalmente no disponible. Inténtalo de nuevo. | Serviço temporariamente indisponível. Tente novamente. |
| `common.edgeErrors.unauthorized` | You are not authorized. Please sign in and try again. | No estás autorizado. Inicia sesión e intenta de nuevo. | Você não está autorizado. Entre e tente novamente. |
| `common.edgeErrors.unknownError` | Unknown error | Error desconocido | Erro desconhecido |
| `common.edgeErrors.userIdAndMessageRequired` | User ID and message are required. | Se requieren el ID de usuario y el mensaje. | ID do usuário e mensagem são obrigatórios. |
| `common.error` | Something went wrong | Algo salió mal | Algo deu errado |
| `common.legalEnglishDisclaimer` |  |  |  |
| `common.loading` | Loading… | Cargando… | Carregando… |
| `common.save` | Save | Guardar | Salvar |
| `dashboard.appearance.dark` | Dark | Oscuro | Escuro |
| `dashboard.appearance.light` | Light | Claro | Claro |
| `dashboard.billingChannels.apple` | Apple App Store | Apple App Store | Apple App Store |
| `dashboard.billingChannels.googlePlay` | Google Play | Google Play | Google Play |
| `dashboard.billingChannels.web` | Web (card / checkout) | Web (tarjeta / pago) | Web (cartão / pagamento) |
| `dashboard.greeting.afternoon` | Good afternoon | Buenas tardes | Boa tarde |
| `dashboard.greeting.evening` | Good evening | Buenas noches | Boa noite |
| `dashboard.greeting.morning` | Good morning | Buenos días | Bom dia |
| `dashboard.home.defaultName` | there |  |  |
| `dashboard.home.pageTitle` | Dashboard \| Palette Plotting | Panel \| Palette Plotting | Painel \| Palette Plotting |
| `dashboard.home.subtitle` | Everything you need to manifest, in one place. | Todo lo que necesitas para manifestar. | Tudo que você precisa para manifestar. |
| `dashboard.inspiredActions.footer` | Affirm daily & embody the new story for coherence and alignment. | Afirma y encarna la nueva historia a diario. | Afirme e encarne a nova história diariamente. |
| `dashboard.manifestationCharge.aligned` | Aligned | Alineado | Alinhado |
| `dashboard.manifestationCharge.lockedIn` | Locked In | Enfocado | Focado |
| `dashboard.manifestationCharge.needsPersistence` | Needs Persistence | Necesita constancia | Precisa de constância |
| `dashboard.manifestationCharge.percentToday` | {{pct}}% aligned today | {{pct}}% alineado hoy | {{pct}}% alinhado hoje |
| `dashboard.mobileMenu.dashboard` | Dashboard | Panel | Painel |
| `dashboard.mobileMenu.getApp` | Get App | Descargar app | Baixar app |
| `dashboard.mobileMenu.getTheApp` | Get the App | Descargar la app | Baixar o app |
| `dashboard.mobileMenu.toggleAria` | Toggle menu | Abrir menú | Abrir menu |
| `dashboard.nav.affirmScript` | Affirm & Script | Afirmar y Escribir | Afirmar e Escrever |
| `dashboard.nav.appearance` | Appearance | Apariencia | Aparência |
| `dashboard.nav.help` | Help | Ayuda | Ajuda |
| `dashboard.nav.home` | Home | Inicio | Início |
| `dashboard.nav.settings` | Settings | Ajustes | Configurações |
| `dashboard.nav.signOut` | Sign out | Cerrar sesión | Sair |
| `dashboard.nav.signOutError` | Error signing out | Error al cerrar sesión | Erro ao sair |
| `dashboard.nav.talkToGuide` | Talk to Guide | Hablar con Tu Guía | Falar com o Guia |
| `dashboard.nav.yourJourney` | Your Journey | Tu Camino | Sua Jornada |
| `dashboard.profile.defaultUser` | User | Usuario | Usuário |
| `dashboard.profile.yourAccount` | Your Account | Tu Cuenta | Sua Conta |
| `dashboard.sections.dailyPractice` | Inspired Actions | Acciones inspiradas | Ações inspiradas |
| `dashboard.sections.inspiredActions` | Inspired Actions | Acciones inspiradas | Ações inspiradas |
| `dashboard.sections.manifestationCharge` | Manifestation Charge | Energía de manifestación | Energia de manifestação |
| `dashboard.sections.tools` | Tools | Herramientas | Ferramentas |
| `dashboard.supportTools.activityTracking` | Activity tracking | Actividad | Atividade |
| `dashboard.supportTools.affirmationVisualizer` | Affirmation Visualizer | Visualizador de afirmaciones | Visualizador de afirmações |
| `dashboard.supportTools.billing` | Billing / subscriptions | Facturación / suscripciones | Assinatura / pagamentos |
| `dashboard.supportTools.dashboard` | Dashboard (home) | Panel (inicio) | Painel (início) |
| `dashboard.supportTools.journal` | Manifestation journal | Diario de manifestación | Diário de manifestação |
| `dashboard.supportTools.musicComposer` | Music Composer | Compositor musical | Compositor musical |
| `dashboard.supportTools.other` | Other (new tool or not listed) | Otro | Outro |
| `dashboard.supportTools.settingsAccount` | Settings / Account | Ajustes / Cuenta | Configurações / Conta |
| `dashboard.supportTools.talkToGuide` | Talk to Guide (Chat) | Hablar con Tu Guía (Chat) | Falar com o Guia (Chat) |
| `dashboard.supportTools.tapIn` | Tap-in / Piano | Tap-in / Piano | Tap-in / Piano |
| `dashboard.tools.affirmScript.description` | Build affirmation sequences and visual goals | Crea afirmaciones y metas visuales | Crie afirmações e metas visuais |
| `dashboard.tools.affirmScript.title` | Affirm & Script | Afirmar y Escribir | Afirmar e Escrever |
| `dashboard.tools.beliefWork.description` | Explore beliefs you want to release or integrate | Suelta o integra creencias | Libere ou integre crenças |
| `dashboard.tools.beliefWork.title` | Belief Work | Creencias | Crenças |
| `dashboard.tools.embody.description` | Track daily progress in your new story | Sigue tu nueva historia | Acompanhe sua nova história |
| `dashboard.tools.embody.title` | Embody | Encarnar | Encarnar |
| `dashboard.tools.mirrorWork.description` | Practice affirmations with real-time reflection | Afirma con tu reflejo | Afirme com seu reflexo |
| `dashboard.tools.mirrorWork.title` | Mirror Work | Espejo | Espelho |
| `dashboard.tools.subliminalMaker.description` | Create custom audio for daily listening | Crea audios para escuchar a diario | Crie áudios para ouvir diariamente |
| `dashboard.tools.subliminalMaker.title` | Subliminal Maker | Subliminales | Subliminares |
| `dashboard.tools.yourJourney.description` | Journal, reflections, and guide chat | Diario, reflexiones y guía | Diário, reflexões e guia |
| `dashboard.tools.yourJourney.title` | Your Journey | Tu Camino | Sua Jornada |
| `marketing.contact.address` | Address | Dirección | Endereço |
| `marketing.contact.addressLine1` | 1 North State Street Ste 1500 | 1 North State Street Ste 1500 | 1 North State Street Ste 1500 |
| `marketing.contact.addressLine2` | Chicago, IL 60602 | Chicago, IL 60602 | Chicago, IL 60602 |
| `marketing.contact.email` | Email | Correo | E-mail |
| `marketing.contact.getInTouch` | Get in Touch | Ponte en contacto | Entre em contato |
| `marketing.contact.phone` | Phone | Teléfono | Telefone |
| `marketing.contact.subtitle` | We'd love to hear from you. Send us an email and we'll respond as soon as possible. | Nos encantaría saber de ti. Envíanos un correo y responderemos lo antes posible. | Gostaríamos de ouvir de você. Envie um e-mail e responderemos o mais rápido possível. |
| `marketing.contact.title` | Contact Us | Contáctanos | Fale conosco |
| `marketing.faq.items.acceptableUse.answer` | We may limit or suspend your access to maintain a safe and respectful environment. | Podemos limitar o suspender tu acceso para mantener un entorno seguro y respetuoso. | Podemos limitar ou suspender seu acesso para manter um ambiente seguro e respeitoso. |
| `marketing.faq.items.acceptableUse.question` | What happens if I violate the Acceptable Use Policy? | ¿Qué pasa si violo la Política de uso aceptable? | O que acontece se eu violar a Política de uso aceitável? |
| `marketing.faq.items.automated.answer` | Some features may use automated or system-generated responses to support your reflection, prompts, or audio creation. These are supplemental tools, not professional advice. | Algunas funciones usan respuestas automáticas para reflexión, prompts o audio. Son herramientas extra, no asesoramiento profesional. | Alguns recursos usam respostas automáticas para reflexão, prompts ou áudio. São ferramentas extras, não aconselhamento profissional. |
| `marketing.faq.items.automated.question` | Does Palette Plotting use automated features? | ¿Palette Plotting usa funciones automatizadas? | O Palette Plotting usa recursos automatizados? |
| `marketing.faq.items.cancel.answer` | Yes. You may cancel anytime through your account settings. Your plan remains active until the end of the billing period. | Sí. Cancela cuando quieras en ajustes. Tu plan sigue activo hasta el fin del período. | Sim. Cancele quando quiser nas configurações. Seu plano fica ativo até o fim do período. |
| `marketing.faq.items.cancel.question` | Can I cancel my subscription? | ¿Puedo cancelar mi suscripción? | Posso cancelar minha assinatura? |
| `marketing.faq.items.deleteAccount.answer` | You may request deletion through the app or by contacting: support@paletteplot.com | Puedes solicitar la eliminación desde la app o contactando a: support@paletteplot.com | Você pode solicitar a exclusão pelo app ou entrando em contato: support@paletteplot.com |
| `marketing.faq.items.deleteAccount.question` | How do I delete my account? | ¿Cómo elimino mi cuenta? | Como excluo minha conta? |
| `marketing.faq.items.legalTerms.answer` | Links to the Terms of Use, Privacy Policy, and Acceptable Use Policy appear in the app and on our website. For copyright concerns, please see our DMCA Notice & Takedown Policy. | Los enlaces a Términos, Privacidad y Uso aceptable están en la app y el sitio. Para copyright, ve la política DMCA. | Links para Termos, Privacidade e Uso aceitável aparecem no app e no site. Para copyright, veja a política DMCA. |
| `marketing.faq.items.legalTerms.linkAcceptableUse` | Acceptable Use Policy | Política de uso aceptable | Política de uso aceitável |
| `marketing.faq.items.legalTerms.linkDmca` | DMCA Notice & Takedown Policy | Política de aviso y retiro DMCA | Política de aviso e remoção DMCA |
| `marketing.faq.items.legalTerms.linkPrivacy` | Privacy Policy | Política de privacidad | Política de privacidade |
| `marketing.faq.items.legalTerms.linkTerms` | Terms of Use | Términos de uso | Termos de uso |
| `marketing.faq.items.legalTerms.question` | Where can I read the legal terms? | ¿Dónde puedo leer los términos legales? | Onde posso ler os termos legais? |
| `marketing.faq.items.notTherapy.answer` | No. Palette Plotting is not a provider of mental-health, medical, psychological, legal, or financial advice. If you need clinical or emergency support, contact appropriate services. | No. Palette Plotting no ofrece asesoramiento médico, psicológico, legal ni financiero. En emergencia, contacta servicios adecuados. | Não. Palette Plotting não oferece aconselhamento médico, psicológico, legal ou financeiro. Em emergência, procure serviços adequados. |
| `marketing.faq.items.notTherapy.question` | Is Palette Plotting therapy or medical support? | ¿Palette Plotting es terapia o apoyo médico? | O Palette Plotting é terapia ou suporte médico? |
| `marketing.faq.items.plans.answer` | Palette Plotting offers monthly and annual subscription options. Refunds for iOS in-app purchases are at Apple's discretion. Refunds for all non-Apple purchases are at Palette Plotting's discretion. See Billing & Refund Policy for details. | Palette Plotting ofrece planes mensual y anual. Reembolsos de compras iOS dependen de Apple; otros, de Palette Plotting. Consulta la política de reembolsos. | Palette Plotting oferece planos mensal e anual. Reembolsos de compras iOS ficam com a Apple; outros, com Palette Plotting. Veja a política de reembolsos. |
| `marketing.faq.items.plans.linkBilling` | Billing & Refund Policy | Pagos y reembolsos | Pagamentos e reembolsos |
| `marketing.faq.items.plans.question` | What subscription plans are available? | ¿Qué planes de suscripción hay disponibles? | Quais planos de assinatura estão disponíveis? |
| `marketing.faq.items.privacy.answer` | Yes. Your journals, reflections, audio creations, and notes are private. | Sí. Tus diarios, reflexiones, creaciones de audio y notas son privados. | Sim. Seus diários, reflexões, criações de áudio e notas são privados. |
| `marketing.faq.items.privacy.question` | Is my content private? | ¿Mi contenido es privado? | Meu conteúdo é privado? |
| `marketing.faq.items.sellData.answer` | No. We do not sell your personal data. | No. No vendemos tus datos personales. | Não. Não vendemos seus dados pessoais. |
| `marketing.faq.items.sellData.question` | Will you sell my information? | ¿Venderán mi información? | Vocês venderão minhas informações? |
| `marketing.faq.items.whatIs.answer` | Palette Plotting is a digital personal growth platform that helps you build momentum, reflect through journaling, create audio-based tools, explore mindset patterns, and work with guided suggestions designed for clarity and progress. For a concise tour of each tool in the context of manifestation practice, read What is Palette Plotting?. | Palette Plotting es una plataforma digital de crecimiento personal que te ayuda a ganar impulso, reflexionar con un diario, crear herramientas de audio, explorar patrones de mentalidad y trabajar con sugerencias guiadas diseñadas para claridad y progreso. Para un recorrido breve de cada herramienta en el contexto de la práctica de manifestación, lee ¿Qué es Palette Plotting?. | O Palette Plotting é uma plataforma digital de crescimento pessoal que ajuda você a ganhar impulso, refletir por meio do diário, criar ferramentas em áudio, explorar padrões de mentalidade e usar orientações guiadas para ter mais clareza e progresso. Para uma visão geral rápida de cada ferramenta no contexto da prática de manifestação, leia O que é o Palette Plotting?. |
| `marketing.faq.items.whatIs.linkWhatIs` | What is Palette Plotting? | ¿Qué es Palette Plotting? | O que é o Palette Plotting? |
| `marketing.faq.items.whatIs.question` | What is Palette Plotting? | ¿Qué es Palette Plotting? | O que é o Palette Plotting? |
| `marketing.faq.items.whoCanUse.answer` | Users must be 18 years or older. | Los usuarios deben tener 18 años o más. | Os usuários devem ter 18 anos ou mais. |
| `marketing.faq.items.whoCanUse.question` | Who can use Palette Plotting? | ¿Quién puede usar Palette Plotting? | Quem pode usar o Palette Plotting? |
| `marketing.faq.subtitle` | Find answers to common questions about Palette Plotting | Respuestas sobre Palette Plotting | Respostas sobre Palette Plotting |
| `marketing.faq.title` | Frequently Asked Questions | Preguntas frecuentes | Perguntas frequentes |
| `marketing.home.download.appleStore` | Apple App Store | Apple App Store | Apple App Store |
| `marketing.home.download.googlePlay` | Google Play | Google Play | Google Play |
| `marketing.home.download.headingDesktop` | Download the app & start free trial | Descarga la app y empieza tu prueba gratis | Baixe o app e comece seu teste grátis |
| `marketing.home.download.headingMobile` | Download the app | Descarga la app | Baixe o app |
| `marketing.home.download.qrAltAppStore` | QR code to open Palette Plotting on the App Store | Código QR para abrir Palette Plotting en el App Store | QR code para abrir o Palette Plotting na App Store |
| `marketing.home.download.qrAltGooglePlay` | QR code to open Palette Plotting on Google Play | Código QR para abrir Palette Plotting en Google Play | QR code para abrir o Palette Plotting no Google Play |
| `marketing.home.download.qrError` | QR codes unavailable. Use the store badges below. | QR no disponible. Usa los badges abajo. | QR indisponível. Use os badges abaixo. |
| `marketing.home.download.qrUnavailable` | Unavailable | No disponible | Indisponível |
| `marketing.home.download.scanPhone` | Scan with your phone. | Escanea con tu teléfono. | Escaneie com seu celular. |
| `marketing.home.download.tapInstall` | Tap to install on your phone. | Toca para instalar en tu teléfono. | Toque para instalar no seu celular. |
| `marketing.home.featureStripKeys.0` | subliminal | subliminal | subliminal |
| `marketing.home.featureStripKeys.1` | mirror | mirror | mirror |
| `marketing.home.featureStripKeys.2` | affirmations | affirmations | affirmations |
| `marketing.home.featureStripKeys.3` | beliefs | beliefs | beliefs |
| `marketing.home.featureStripKeys.4` | journal | journal | journal |
| `marketing.home.featureStripKeys.5` | coach | coach | coach |
| `marketing.home.footer.acceptableUse` | Acceptable Use Policy | Uso aceptable | Uso aceitável |
| `marketing.home.footer.billing` | Billing | Facturación | Assinatura |
| `marketing.home.footer.community` | Community | Comunidad | Comunidade |
| `marketing.home.footer.company` | PALETTE PLOTTING LLC | PALETTE PLOTTING LLC | PALETTE PLOTTING LLC |
| `marketing.home.footer.contact` | Contact | Contacto | Contato |
| `marketing.home.footer.copyright` | © {{year}} Palette Plotting LLC. All rights reserved. | © {{year}} Palette Plotting LLC. Todos los derechos reservados. | © {{year}} Palette Plotting LLC. Todos os direitos reservados. |
| `marketing.home.footer.faq` | FAQ | FAQ | FAQ |
| `marketing.home.footer.footerNav` | Footer | Pie de página | Rodapé |
| `marketing.home.footer.privacy` | Privacy Policy | Privacidad | Privacidade |
| `marketing.home.footer.terms` | Terms of Use | Términos de uso | Termos de uso |
| `marketing.home.footer.whatIs` | What is Palette Plotting? | ¿Qué es Palette Plotting? | O que é o Palette Plotting? |
| `marketing.home.header.blog` | Blog | Blog | Blog |
| `marketing.home.header.community` | Community | Comunidad | Comunidade |
| `marketing.home.header.dashboard` | Dashboard | Panel | Painel |
| `marketing.home.header.downloadApp` | Download app | Descargar app | Baixar app |
| `marketing.home.header.faq` | FAQ | FAQ | FAQ |
| `marketing.home.header.logOut` | Log out | Cerrar sesión | Sair |
| `marketing.home.header.mainNav` | Main | Principal | Principal |
| `marketing.home.header.signIn` | Sign in | Iniciar sesión | Entrar |
| `marketing.home.header.user` | User | Usuario | Usuário |
| `marketing.home.header.yourAccount` | Your Account | Tu cuenta | Sua conta |
| `marketing.home.hero.abundance` | Abundance | abundancia | abundância |
| `marketing.home.hero.awardLine` | The most comprehensive manifesting app | La app de manifestación más completa | O app de manifestação mais completo |
| `marketing.home.hero.ctaDownload` | Download the app & start free trial | Descarga la app y empieza tu prueba gratis | Baixe o app e comece seu teste grátis |
| `marketing.home.hero.ctaHeroMobile` | Start your free trial | Empieza tu prueba gratis | Comece seu teste grátis |
| `marketing.home.hero.exploreApp` | Explore the app | Explora la app | Explore o app |
| `marketing.home.hero.fitness` | Fitness | fitness | fitness |
| `marketing.home.hero.freeTrialLine` | Start Your Free Trial Now | Empieza tu prueba gratis ahora | Comece seu teste grátis agora |
| `marketing.home.hero.freeTrialUnderBadges` | Start your free trial in the App Store | Empieza tu prueba gratis en el App Store | Comece seu teste grátis na App Store |
| `marketing.home.hero.joy` | Joy | alegría | alegria |
| `marketing.home.hero.loveSp` | Love & SP | amor y SP | amor e SP |
| `marketing.home.hero.manifestEverything` | Manifest Everything | Manifiesta todo | Manifeste tudo |
| `marketing.home.hero.manifestPrefix` | Manifest | Manifiesta | Manifeste |
| `marketing.home.hero.subhead1` | Subliminals + Robotic Affirming & Scripting | Subliminales + afirmación robótica y scripting | Subliminares + afirmação robótica e scripting |
| `marketing.home.hero.subhead2` | Mirror Work + Belief Work | Espejo + creencias | Espelho + crenças |
| `marketing.home.hero.subhead3` | Digital Manifesting Coach + More | Coach digital de manifestación y más | Coach digital de manifestação e mais |
| `marketing.home.manifestPanel.headlineLine1` | One app for manifesting | Una app para manifestar | Um app para manifestar |
| `marketing.home.manifestPanel.headlineLine2` | what you want | lo que quieres | o que você quer |
| `marketing.home.manifestPanel.manifestListAria` | What you can manifest | Lo que puedes manifestar | O que você pode manifestar |
| `marketing.home.manifestPanel.rows.0.0` | love & sp | amor y sp | amor e sp |
| `marketing.home.manifestPanel.rows.0.1` | dream body | cuerpo soñado | corpo dos sonhos |
| `marketing.home.manifestPanel.rows.1.0` | glow up | glow up | glow up |
| `marketing.home.manifestPanel.rows.1.1` | wellness | bienestar | bem-estar |
| `marketing.home.manifestPanel.rows.2.0` | self-concept | autoconcepto | autoconceito |
| `marketing.home.manifestPanel.rows.2.1` | discipline | disciplina | disciplina |
| `marketing.home.manifestPanel.rows.3.0` | money | dinero | dinheiro |
| `marketing.home.manifestPanel.rows.3.1` | focus | enfoque | foco |
| `marketing.home.manifestPanel.rows.4.0` | education | educación | educação |
| `marketing.home.manifestPanel.rows.4.1` | life reset | reinicio de vida | recomeço |
| `marketing.home.meta.description` | Palette Plotting helps you create subliminals, affirmations, mirror work, scripting, and manifesting routines in one place. | Palette Plotting te ayuda a crear subliminales, afirmaciones, trabajo con espejo, scripting y rutinas de manifestación en un solo lugar. | O Palette Plotting ajuda você a criar subliminares, afirmações, trabalho com espelho, scripting e rotinas de manifestação em um só lugar. |
| `marketing.home.meta.ogDescription` | Create subliminals, affirmations, mirror work, scripting, and manifesting routines with Palette Plotting. | Crea subliminales, afirmaciones, trabajo con espejo, scripting y rutinas de manifestación con Palette Plotting. | Crie subliminares, afirmações, trabalho com espelho, scripting e rotinas de manifestação com o Palette Plotting. |
| `marketing.home.meta.title` | Home \| Palette Plotting | Inicio \| Palette Plotting | Início \| Palette Plotting |
| `marketing.home.meta.twitterDescription` | Create subliminals, affirmations, mirror work, scripting, and manifesting routines with Palette Plotting. | Crea subliminales, afirmaciones, trabajo con espejo, scripting y rutinas de manifestación con Palette Plotting. | Crie subliminares, afirmações, trabalho com espelho, scripting e rotinas de manifestação com o Palette Plotting. |
| `marketing.home.newsletter.consent` | By subscribing you agree to receive marketing emails from Palette Plotting. Unsubscribe anytime. | Al suscribirte aceptas recibir correos de marketing de Palette Plotting. Cancela cuando quieras. | Ao se inscrever, você concorda em receber e-mails de marketing do Palette Plotting. Cancele quando quiser. |
| `marketing.home.newsletter.errorEmpty` | Please enter your email address. | Ingresa tu correo electrónico. | Digite seu e-mail. |
| `marketing.home.newsletter.errorGeneric` | Something went wrong. Please try again. | Algo salió mal. Inténtalo de nuevo. | Algo deu errado. Tente novamente. |
| `marketing.home.newsletter.errorInvalid` | Please enter a valid email address. | Ingresa un correo electrónico válido. | Digite um e-mail válido. |
| `marketing.home.newsletter.heading` | Tips in your inbox | Tips en tu bandeja | Dicas na sua caixa de entrada |
| `marketing.home.newsletter.placeholder` | Email address | Correo electrónico | E-mail |
| `marketing.home.newsletter.subscribe` | Subscribe | Suscribirme | Inscrever-se |
| `marketing.home.newsletter.subscribing` | Subscribing… | Suscribiendo… | Inscrevendo… |
| `marketing.home.newsletter.subtitle` | Stay consistent, hear about new features, and get special promotions. | Recibe consejos, novedades y promos. | Receba dicas, novidades e promoções. |
| `marketing.home.newsletter.successBody` | Thanks for subscribing. Watch your inbox for manifestation tips, new features, and special promotions. | Suscripción lista. Recibe tips, novedades y promociones en tu correo. | Inscrição feita. Veja dicas, novidades e promoções no seu e-mail. |
| `marketing.home.newsletter.successHeading` | You're on the list | Ya estás en la lista | Você está na lista |
| `marketing.home.practiceSection.body` | Palette Plotting brings your manifestation into one place — so you are not juggling notes, random subliminal playlists, screenshots, voice memos, journals, and scattered methods when doubt shows up. Use it to write the story, hear it, see it, repeat it, and live in the end. | Palette Plotting reúne tu manifestación en un solo lugar — para que no estés manejando notas, listas subliminales al azar, capturas, notas de voz, diarios y métodos dispersos cuando aparece la duda. Úsala para escribir la historia, escucharla, verla, repetirla y vivir en el final. | O Palette Plotting reúne sua manifestação em um só lugar — para você não ficar alternando entre notas, playlists subliminares aleatórias, prints, memos de voz, diários e métodos espalhados quando a dúvida aparece. Use para escrever a história, ouvir, ver, repetir e viver no final. |
| `marketing.home.practiceSection.focusAreasAria` | Focus areas | Áreas de enfoque | Áreas de foco |
| `marketing.home.practiceSection.headlineLine1` | Everything you need for | Todo lo que necesitas para | Tudo que você precisa para |
| `marketing.home.practiceSection.headlineLine2` | the new story | la nueva historia | a nova história |
| `marketing.home.practiceSection.pills.0.category` | Self Concept | Autoconcepto | Autoconceito |
| `marketing.home.practiceSection.pills.0.color` | pink | pink | pink |
| `marketing.home.practiceSection.pills.0.label` | Love, SP, Self-Concept | Amor, SP, autoconcepto | Amor, SP, autoconceito |
| `marketing.home.practiceSection.pills.1.category` | Law of Assumption | Ley de la asunción | Lei da assunção |
| `marketing.home.practiceSection.pills.1.color` | green | green | green |
| `marketing.home.practiceSection.pills.1.label` | Abundance | Abundancia | Abundância |
| `marketing.home.practiceSection.pills.2.category` | Self Concept | Autoconcepto | Autoconceito |
| `marketing.home.practiceSection.pills.2.color` | blue | blue | blue |
| `marketing.home.practiceSection.pills.2.label` | Confidence | Confianza | Confiança |
| `marketing.home.practiceSection.pills.3.category` | Self Concept | Autoconcepto | Autoconceito |
| `marketing.home.practiceSection.pills.3.color` | yellow | yellow | yellow |
| `marketing.home.practiceSection.pills.3.label` | Peace | Paz | Paz |
| `marketing.home.stats.0.label` | manifestation tools | herramientas | ferramentas |
| `marketing.home.stats.0.value` | 10+ | 10+ | 10+ |
| `marketing.home.stats.1.label` | subliminals per month | subliminales al mes | subliminares por mês |
| `marketing.home.stats.1.value` | 30 | 30 | 30 |
| `marketing.home.stats.2.label` | mirror work scenes | escenas con espejo | cenas com espelho |
| `marketing.home.stats.2.value` | 5 | 5 | 5 |
| `marketing.home.stats.3.label` | AI guide options | opciones de guía IA | opções de guia IA |
| `marketing.home.stats.3.value` | 4 | 4 | 4 |
| `marketing.home.stickyBarAria` | Download Palette Plotting | Descargar Palette Plotting | Baixar Palette Plotting |
| `marketing.home.testimonials.carouselAria` | User testimonials | Testimonios de usuarios | Depoimentos de usuários |
| `marketing.home.testimonials.headlineLine1` | Results from our | Resultados de nuestros | Resultados dos nossos |
| `marketing.home.testimonials.headlineLine2` | Users & Testers | usuarios y testers | usuários e testadores |
| `marketing.home.testimonials.items.0.name` | Maya T. | Maya T. | Maya T. |
| `marketing.home.testimonials.items.0.quote` | When I waver and the 3D gets loud af I would ditch my whole SP routine and go hunt for a new method or crashout. Now I script and do mirror work here and actually stay on my storyline instead of scrolling manifest TikTok at 2am. | Cuando dudo y el 3D pesa, antes dejaba mi rutina de SP. Ahora hago scripting y espejo aquí y sigo en mi historia. | Quando vacilo e o 3D pesa, eu abandonava minha rotina de SP. Agora faço scripting e espelho aqui e fico na minha história. |
| `marketing.home.testimonials.items.0.role` | SP & self-concept | SP y autoconcepto | SP e autoconceito |
| `marketing.home.testimonials.items.1.name` | Devon K. | Devon K. | Devon K. |
| `marketing.home.testimonials.items.1.quote` | My brain still wants to argue before I even start my robotic affirming. But this app, the teleprompter, and reps counter help me finish my session instead of struggling alone. | Mi cerebro todavía quiere discutir antes de empezar mi afirmación robótica. Pero esta app, la pantalla de lectura y el contador de repeticiones me ayudan a terminar la sesión en lugar de luchar sola. | Meu cérebro ainda quer discutir antes de começar a afirmação robótica. Mas este app, a tela de leitura e o contador de repetições me ajudam a terminar a sessão em vez de lutar sozinha. |
| `marketing.home.testimonials.items.1.role` | Law of Assumption · scripting | Ley de la asunción · scripting | Lei da assunção · scripting |
| `marketing.home.testimonials.items.2.name` | Jade L. | Jade L. | Jade L. |
| `marketing.home.testimonials.items.2.quote` | YouTube subliminals never hit because it's not my voice or my exact words. I made one here with my affirmations + binaural beats and it's the only one I loop without getting bored in 2 days. | Los subliminales de YouTube nunca funcionaban porque no era mi voz ni mis palabras exactas. Hice uno aquí con mis afirmaciones + binaurales y es el único que repito sin aburrirme en 2 días. | Subliminares do YouTube nunca funcionavam porque não era minha voz nem minhas palavras exatas. Fiz um aqui com minhas afirmações + batidas binaurais e é o único que repito sem enjoar em 2 dias. |
| `marketing.home.testimonials.items.2.role` | Subliminals · affirming | Subliminales · afirmación | Subliminares · afirmação |
| `marketing.home.testimonials.next` | Next testimonial | Siguiente testimonio | Próximo depoimento |
| `marketing.home.testimonials.pageN` | Testimonial {{n}} | Testimonio {{n}} | Depoimento {{n}} |
| `marketing.home.testimonials.pagesAria` | Testimonial pages | Páginas de testimonios | Páginas de depoimentos |
| `marketing.home.testimonials.previous` | Previous testimonial | Testimonio anterior | Depoimento anterior |
| `marketing.home.testimonials.starsAria` | 5 out of 5 stars | 5 de 5 estrellas | 5 de 5 estrelas |
| `marketing.manifestationQuiz.email.consent` | By continuing you agree to receive your quiz result and occasional manifestation tips from Palette Plotting. Unsubscribe anytime. | Al continuar, aceptas recibir tu resultado del quiz y consejos ocasionales de manifestación de Palette Plotting. Cancela la suscripción cuando quieras. | Ao continuar, você concorda em receber seu resultado do quiz e dicas ocasionais de manifestação da Palette Plotting. Cancele a assinatura quando quiser. |
| `marketing.manifestationQuiz.email.emailInvalid` | Please enter a valid email address. | Ingresa un correo electrónico válido. | Digite um e-mail válido. |
| `marketing.manifestationQuiz.email.emailPlaceholder` | Email | Correo | E-mail |
| `marketing.manifestationQuiz.email.emailRequired` | Please enter your email address. | Ingresa tu correo electrónico. | Digite seu e-mail. |
| `marketing.manifestationQuiz.email.firstNamePlaceholder` | First name (optional) | Nombre (opcional) | Nome (opcional) |
| `marketing.manifestationQuiz.email.genericError` | Something went wrong. Please try again. | Algo salió mal. Intenta de nuevo. | Algo deu errado. Tente novamente. |
| `marketing.manifestationQuiz.email.submit` | Show My Result | Ver mi resultado | Ver meu resultado |
| `marketing.manifestationQuiz.email.submitting` | Saving… | Guardando… | Salvando… |
| `marketing.manifestationQuiz.email.subtitle` | We'll save your result and give you a personalized recommendation. | Guardaremos tu resultado y te daremos una recomendación personalizada. | Vamos salvar seu resultado e dar uma recomendação personalizada. |
| `marketing.manifestationQuiz.email.title` | Get Your Manifestation Diagnosis | Recibe tu diagnóstico de manifestación | Receba seu diagnóstico de manifestação |
| `marketing.manifestationQuiz.intro.eyebrow` | Palette Plotting Quiz | Quiz Palette Plotting | Quiz Palette Plotting |
| `marketing.manifestationQuiz.intro.meta` | Five questions · about two minutes · one clear next step | Cinco preguntas · unos dos minutos · un siguiente paso claro | Cinco perguntas · cerca de dois minutos · um próximo passo claro |
| `marketing.manifestationQuiz.intro.startCta` | Start the Quiz | Empezar el quiz | Começar o quiz |
| `marketing.manifestationQuiz.intro.subtitle` | A short diagnostic to identify the biggest pattern interfering with your manifestation results. | Un diagnóstico breve para identificar el patrón que más interfiere con tus resultados de manifestación. | Um diagnóstico rápido para identificar o padrão que mais interfere nos seus resultados de manifestação. |
| `marketing.manifestationQuiz.intro.title` | What's Blocking Your Manifestation Right Now? | ¿Qué está bloqueando tu manifestación ahora? | O que está bloqueando sua manifestação agora? |
| `marketing.manifestationQuiz.nav.back` | Back | Atrás | Voltar |
| `marketing.manifestationQuiz.nav.questionProgress` | Question {{current}} of {{total}} | Pregunta {{current}} de {{total}} | Pergunta {{current}} de {{total}} |
| `marketing.manifestationQuiz.questions.q1.options.check_signs` | Check for signs or movement. | Buscar señales o movimiento. | Buscar sinais ou movimento. |
| `marketing.manifestationQuiz.questions.q1.options.rewrite` | Rewrite affirmations or scripts. | Reescribir afirmaciones o guiones. | Reescrever afirmações ou roteiros. |
| `marketing.manifestationQuiz.questions.q1.options.spiral` | Spiral and assume it isn't working. | Entrar en espiral y asumir que no funciona. | Entrar em espiral e assumir que não está funcionando. |
| `marketing.manifestationQuiz.questions.q1.options.stop` | Stop practicing altogether. | Dejar de practicar por completo. | Parar de praticar completamente. |
| `marketing.manifestationQuiz.questions.q1.prompt` | When your manifestation feels delayed, what do you usually do? | Cuando tu manifestación se siente retrasada, ¿qué sueles hacer? | Quando sua manifestação parece atrasada, o que você geralmente faz? |
| `marketing.manifestationQuiz.questions.q2.options.intrusive` | Intrusive thoughts. | Pensamientos intrusivos. | Pensamentos intrusivos. |
| `marketing.manifestationQuiz.questions.q2.options.old_assumptions` | Falling back into old assumptions. | Volver a viejas suposiciones. | Voltar a suposições antigas. |
| `marketing.manifestationQuiz.questions.q2.options.opposite_3d` | Seeing the opposite in the 3D. | Ver lo opuesto en el 3D. | Ver o oposto no 3D. |
| `marketing.manifestationQuiz.questions.q2.options.starting_over` | Starting over constantly. | Empezar de nuevo constantemente. | Começar de novo constantemente. |
| `marketing.manifestationQuiz.questions.q2.prompt` | What frustrates you most? | ¿Qué te frustra más? | O que mais te frustra? |
| `marketing.manifestationQuiz.questions.q3.options.checking` | I keep checking for evidence. | Sigo buscando evidencia. | Fico buscando evidências. |
| `marketing.manifestationQuiz.questions.q3.options.confident_panic` | I feel confident and then panic. | Me siento segura y luego entro en pánico. | Me sinto confiante e depois entro em pânico. |
| `marketing.manifestationQuiz.questions.q3.options.every_method` | I've tried almost every method. | He probado casi todos los métodos. | Já tentei quase todos os métodos. |
| `marketing.manifestationQuiz.questions.q3.options.replaying` | I keep replaying old situations. | Sigo repasando situaciones viejas. | Fico repassando situações antigas. |
| `marketing.manifestationQuiz.questions.q3.prompt` | Which statement sounds most like you? | ¿Cuál suena más como tú? | Qual soa mais como você? |
| `marketing.manifestationQuiz.questions.q4.options.daily_practice` | Maintaining a daily practice. | Mantener una rutina diaria. | Manter uma rotina diária. |
| `marketing.manifestationQuiz.questions.q4.options.ignoring_3d` | Ignoring current circumstances. | Ignorar las circunstancias actuales. | Ignorar as circunstâncias atuais. |
| `marketing.manifestationQuiz.questions.q4.options.one_approach` | Committing to one approach. | Comprometerse con un solo enfoque. | Comprometer-se com um único enfoque. |
| `marketing.manifestationQuiz.questions.q4.options.steady` | Staying emotionally steady. | Mantener la estabilidad emocional. | Manter a estabilidade emocional. |
| `marketing.manifestationQuiz.questions.q4.prompt` | What is hardest for you? | ¿Qué es lo más difícil para ti? | O que é mais difícil para você? |
| `marketing.manifestationQuiz.questions.q5.options.daily_routine` | A daily routine that keeps me consistent. | Una rutina diaria que me mantenga constante. | Uma rotina diária que me mantenha consistente. |
| `marketing.manifestationQuiz.questions.q5.options.detachment` | A detachment reset. | Un reinicio de desapego. | Um reset de desapego. |
| `marketing.manifestationQuiz.questions.q5.options.simple_system` | A simple manifestation system. | Un sistema simple de manifestación. | Um sistema simples de manifestação. |
| `marketing.manifestationQuiz.questions.q5.options.stabilize` | Stabilizing my mindset. | Estabilizar mi mentalidad. | Estabilizar minha mentalidade. |
| `marketing.manifestationQuiz.questions.q5.prompt` | Which sounds most helpful right now? | ¿Qué te suena más útil ahora? | O que parece mais útil agora? |
| `marketing.manifestationQuiz.result.actionStepHeading` | One free action step | Un paso de acción gratis | Um passo de ação gratuito |
| `marketing.manifestationQuiz.result.buildPractice` | Build your personalized manifestation practice in Palette Plotting. | Construye tu práctica de manifestación personalizada en Palette Plotting. | Construa sua prática de manifestação personalizada na Palette Plotting. |
| `marketing.manifestationQuiz.result.eyebrow` | Your diagnosis | Tu diagnóstico | Seu diagnóstico |
| `marketing.manifestationQuiz.result.readOnBlog` | Read on the Palette Plotting blog → | Leer en el blog de Palette Plotting → | Ler no blog da Palette Plotting → |
| `marketing.manifestationQuiz.result.recommended` | Recommended for you | Recomendado para ti | Recomendado para você |
| `marketing.manifestationQuiz.result.relatedGuide` | Related guide | Guía relacionada | Guia relacionado |
| `marketing.manifestationQuiz.result.retake` | Retake the quiz | Repetir el quiz | Fazer o quiz novamente |
| `marketing.manifestationQuiz.result.startTrial` | Start Free Trial | Empezar prueba gratis | Começar teste grátis |
| `marketing.manifestationQuiz.result.whatThisMeans` | What this means | Qué significa esto | O que isso significa |
| `marketing.manifestationQuiz.results.method_hopper.actionStep` | Commit to one tool for seven days. No new scripts, no new creator, no new "secret method." Same assumption, same format, daily. | Comprométete con una herramienta por siete días. Sin guiones nuevos, sin creadores nuevos, sin "método secreto". Misma suposición, mismo formato, cada día. | Comprometa-se com uma ferramenta por sete dias. Sem roteiros novos, sem criadores novos, sem "método secreto". Mesma suposição, mesmo formato, todos os dias. |
| `marketing.manifestationQuiz.results.method_hopper.explanation` | You switch techniques, affirmations, coaches, and routines before any of them have time to work. It can look like progress, but the pattern is distrust — starting fresh instead of staying with one assumption. | Cambias técnicas, afirmaciones, coaches y rutinas antes de que cualquiera tenga tiempo de funcionar. Puede parecer progreso, pero el patrón es desconfianza — empezar de nuevo en lugar de sostener una suposición. | Você troca técnicas, afirmações, coaches e rotinas antes de qualquer uma ter tempo de funcionar. Pode parecer progresso, mas o padrão é desconfiança — começar de novo em vez de sustentar uma suposição. |
| `marketing.manifestationQuiz.results.method_hopper.guideTitle` | Why More Techniques Are Not Always Better | Por qué más técnicas no siempre son mejor | Por que mais técnicas não são sempre melhores |
| `marketing.manifestationQuiz.results.method_hopper.paletteplottingPitch` | Palette Plotting keeps subliminals, scripting, mirror work, and belief work in one place — so you build one system instead of collecting ten half-started ones. | Palette Plotting mantiene subliminales, scripting, trabajo con espejo y trabajo de creencias en un solo lugar — para construir un sistema en lugar de acumular diez a medias. | A Palette Plotting mantém subliminares, scripting, trabalho com espelho e trabalho de crenças em um só lugar — para construir um sistema em vez de acumular dez pela metade. |
| `marketing.manifestationQuiz.results.method_hopper.title` | The Method Hopper | La que salta de método | A que pula de método |
| `marketing.manifestationQuiz.results.no_routine_manifestor.actionStep` | Choose one 5-minute slot (morning coffee, commute, before bed) and one action: listen to a subliminal, read three affirmations, or one mirror round. Same time, same action, seven days. | Elige un bloque de 5 minutos (café de la mañana, viaje, antes de dormir) y una acción: escuchar un subliminal, leer tres afirmaciones o una ronda de trabajo con espejo. Mismo tiempo, misma acción, siete días. | Escolha um bloco de 5 minutos (café da manhã, deslocamento, antes de dormir) e uma ação: ouvir um subliminal, ler três afirmações ou uma rodada de trabalho com espelho. Mesmo horário, mesma ação, sete dias. |
| `marketing.manifestationQuiz.results.no_routine_manifestor.explanation` | You have desire and belief, but no repeatable practice. Inspiration hits, then life takes over — and manifestation becomes something you think about instead of something you do daily. | Tienes deseo y creencia, pero no una práctica repetible. La inspiración llega, luego la vida toma el control — y manifestar se vuelve algo que piensas en lugar de algo que haces cada día. | Você tem desejo e crença, mas não uma prática repetível. A inspiração chega, depois a vida toma conta — e manifestar vira algo que você pensa em vez de algo que faz todos os dias. |
| `marketing.manifestationQuiz.results.no_routine_manifestor.guideTitle` | The Simplest Manifestation Routine Possible | La rutina de manifestación más simple posible | A rotina de manifestação mais simples possível |
| `marketing.manifestationQuiz.results.no_routine_manifestor.paletteplottingPitch` | Palette Plotting is built for a daily rhythm — subliminals, affirmations, mirror work, and progress tracking — without turning manifestation into a full-time project. | Palette Plotting está hecho para un ritmo diario — subliminales, afirmaciones, trabajo con espejo y seguimiento de progreso — sin convertir la manifestación en un proyecto de tiempo completo. | A Palette Plotting é feita para um ritmo diário — subliminares, afirmações, trabalho com espelho e acompanhamento de progresso — sem transformar manifestação em um projeto em tempo integral. |
| `marketing.manifestationQuiz.results.no_routine_manifestor.title` | The No-Routine Manifestor | La manifestadora sin rutina | A manifestadora sem rotina |
| `marketing.manifestationQuiz.results.old_story_repeater.actionStep` | When an old scene replays, interrupt with one revision line: "That was the old version." Do not debate it — redirect once and move on. | Cuando una escena vieja se repite, interrumpe con una línea de revisión: "Esa era la versión vieja." No debátelo — redirige una vez y sigue. | Quando uma cena antiga se repete, interrompa com uma linha de revisão: "Essa era a versão antiga." Não debata — redirecione uma vez e siga. |
| `marketing.manifestationQuiz.results.old_story_repeater.explanation` | You keep rehearsing old assumptions while trying to create a new reality. Inner conversations, mental replays, and "what if it happens again" loops keep the past active — even when you are doing the "right" techniques. | Sigues ensayando viejas suposiciones mientras intentas crear una nueva realidad. Conversaciones internas, repasos mentales y bucles de "¿y si pasa otra vez?" mantienen el pasado activo — incluso cuando haces las técnicas "correctas". | Você continua ensaiando suposições antigas enquanto tenta criar uma nova realidade. Conversas internas, repassos mentais e loops de "e se acontece de novo?" mantêm o passado ativo — mesmo quando faz as técnicas "certas". |
| `marketing.manifestationQuiz.results.old_story_repeater.guideTitle` | How to Stop Rehearsing the Past | Cómo dejar de ensayar el pasado | Como parar de ensaiar o passado |
| `marketing.manifestationQuiz.results.old_story_repeater.paletteplottingPitch` | Palette Plotting supports belief work and scripting so you can replace the old storyline with language you actually want to live in — not just overlay affirmations on top of it. | Palette Plotting apoya el trabajo de creencias y scripting para reemplazar la vieja historia con un lenguaje con el que realmente quieres vivir — no solo afirmaciones encima. | A Palette Plotting apoia trabalho de crenças e scripting para substituir a história antiga por uma linguagem com que você realmente quer viver — não só afirmações por cima. |
| `marketing.manifestationQuiz.results.old_story_repeater.title` | The Old Story Repeater | La que repite la vieja historia | A que repete a história antiga |
| `marketing.manifestationQuiz.results.three_d_checker.actionStep` | Pick one return line for this week: "Quiet is not the final answer." Say it once when you catch yourself scanning for proof — then go back to your day. | Elige una línea de retorno para esta semana: "Lo quieto no es la respuesta final." Dila una vez cuando notes que buscas pruebas — y vuelve a tu día. | Escolha uma linha de retorno para esta semana: "Quietude não é a resposta final." Diga uma vez quando perceber que está buscando provas — e volte ao seu dia. |
| `marketing.manifestationQuiz.results.three_d_checker.explanation` | You react strongly to current circumstances and use them to decide whether your manifestation is working. When the 3D looks quiet or opposite, your assumption gets renegotiated — even if you already chose the end. | Reaccionas con fuerza a las circunstancias actuales y las usas para decidir si tu manifestación está funcionando. Cuando el 3D se ve quieto u opuesto, tu suposición se renegocia — incluso si ya elegiste el final. | Você reage fortemente às circunstâncias atuais e usa isso para decidir se sua manifestação está funcionando. Quando o 3D parece quieto ou oposto, sua suposição é renegociada — mesmo se você já escolheu o final. |
| `marketing.manifestationQuiz.results.three_d_checker.guideTitle` | How to Stop Reacting to the 3D | Cómo dejar de reaccionar al 3D | Como parar de reagir ao 3D |
| `marketing.manifestationQuiz.results.three_d_checker.paletteplottingPitch` | Palette Plotting helps you repeat the end-state on loop — subliminals, affirmations, and mirror work — so the 3D stops acting like the boss of your assumption. | Palette Plotting te ayuda a repetir el estado final en loop — subliminales, afirmaciones y trabajo con espejo — para que el 3D deje de mandar sobre tu suposición. | A Palette Plotting ajuda você a repetir o estado final em loop — subliminares, afirmações e trabalho com espelho — para que o 3D deixe de mandar na sua suposição. |
| `marketing.manifestationQuiz.results.three_d_checker.title` | The 3D Checker | La que revisa el 3D | A que checa o 3D |
| `marketing.manifestationQuiz.results.waver.actionStep` | Write one sentence you will return to when you waver: "I already chose this." Put it on your lock screen or notes app — use it before you rewrite the whole story. | Escribe una frase a la que volverás cuando dudes: "Ya elegí esto." Ponla en tu pantalla de bloqueo o en notas — úsala antes de reescribir toda la historia. | Escreva uma frase para voltar quando oscilar: "Eu já escolhi isso." Coloque na tela de bloqueio ou nas notas — use antes de reescrever a história inteira. |
| `marketing.manifestationQuiz.results.waver.explanation` | You believe one day and doubt the next. Your desire is not always the problem — consistency is. The old story gets loud when the 3D pauses, and you abandon the decision you already made. | Crees un día y dudas al siguiente. Tu deseo no siempre es el problema — la constancia sí. La vieja historia se vuelve fuerte cuando el 3D se pausa, y abandonas la decisión que ya tomaste. | Você acredita um dia e duvida no outro. Seu desejo não é sempre o problema — a consistência é. A história antiga fica forte quando o 3D pausa, e você abandona a decisão que já tomou. |
| `marketing.manifestationQuiz.results.waver.guideTitle` | Why Manifestation Feels Easy One Day and Impossible the Next | Por qué manifestar se siente fácil un día e imposible al siguiente | Por que manifestar parece fácil um dia e impossível no outro |
| `marketing.manifestationQuiz.results.waver.paletteplottingPitch` | Palette Plotting gives you a repeatable practice — not another method to hop to — so your mindset has somewhere stable to land when doubt shows up. | Palette Plotting te da una práctica repetible — no otro método al que saltar — para que tu mentalidad tenga un lugar estable cuando aparece la duda. | A Palette Plotting oferece uma prática repetível — não outro método para pular — para que sua mentalidade tenha um lugar estável quando a dúvida aparece. |
| `marketing.manifestationQuiz.results.waver.title` | The Waver | La que duda | A que oscila |
| `marketing.pricing.billingPolicy` | Billing & Refund Policy | Pagos y reembolsos | Pagamentos e reembolsos |
| `marketing.pricing.features.affirmations.description` | Have your custom affirmations shown on a teleprompter-like screen, count your reps, and visualize. | Muestra tus afirmaciones en una pantalla de lectura, cuenta tus repeticiones y visualiza. | Veja suas afirmações em uma tela de leitura, conte repetições e visualize. |
| `marketing.pricing.features.affirmations.title` | Robotic Affirm & Script Your Life | Afirmar y escribir | Afirmar e escrever |
| `marketing.pricing.features.beliefs.description` | Deconstruct self-limiting beliefs and integrate expansionary beliefs. | Desconstruye creencias limitantes e integra creencias expansivas. | Desconstrua crenças limitantes e integre crenças expansivas. |
| `marketing.pricing.features.beliefs.title` | Address Self-Limiting Beliefs | Aborda creencias limitantes | Abordar crenças limitantes |
| `marketing.pricing.features.coach.description` | Ask questions you're scared to ask anyone else, and get advice when you're wavering due to 3D circumstances. | Pregunta lo que temes decir y recibe apoyo cuando el 3D pese. | Pergunte o que teme dizer e receba apoio quando o 3D pesar. |
| `marketing.pricing.features.coach.title` | Digital Manifesting Coach | Coach digital de manifestación | Coach digital de manifestação |
| `marketing.pricing.features.journal.description` | Journal, document inspired action, and track your progress with manifesting lists. | Diario, acciones inspiradas y listas de manifestación. | Diário, ações inspiradas e listas de manifestação. |
| `marketing.pricing.features.journal.title` | Journal & Track | Diario y progreso | Diário e progresso |
| `marketing.pricing.features.mirror.description` | Immerse yourself into digital mirror work's scenes and sounds, as you build self-concept with your affirmations. | Sumérgete en escenas y sonidos de trabajo con espejo digital mientras fortaleces tu autoconcepto con tus afirmaciones. | Mergulhe em cenas e sons de trabalho com espelho digital enquanto fortalece seu autoconceito com suas afirmações. |
| `marketing.pricing.features.mirror.title` | Mirror Work | Espejo | Espelho |
| `marketing.pricing.features.subliminal.description` | Make subliminals with your own voice, binaural beats, background sounds, and layered vocals. | Crea subliminales con tu propia voz, beats binaurales, sonidos de fondo y voces en capas. | Crie subliminares com sua própria voz, batidas binaurais, sons de fundo e vocais em camadas. |
| `marketing.pricing.features.subliminal.title` | Subliminal Maker | Creador de subliminales | Criador de subliminares |
| `marketing.pricing.legalAnd` | and | y los | e os |
| `marketing.pricing.legalPrefix` | See our | Consulta nuestra | Veja nossa |
| `marketing.pricing.planHeader` | Plan | Plan | Plano |
| `marketing.pricing.plans.annual.cadence` | per year | por año | por ano |
| `marketing.pricing.plans.annual.label` | Annual | Anual | Anual |
| `marketing.pricing.plans.monthly.cadence` | per month | por mes | por mês |
| `marketing.pricing.plans.monthly.label` | Monthly | Mensual | Mensal |
| `marketing.pricing.plans.weekly.cadence` | per week | por semana | por semana |
| `marketing.pricing.plans.weekly.label` | Weekly | Semanal | Semanal |
| `marketing.pricing.priceHeader` | Price | Precio | Preço |
| `marketing.pricing.prices.annual` | $149.99 | $149.99 | $149.99 |
| `marketing.pricing.prices.monthly` | $19.99 | $19.99 | $19.99 |
| `marketing.pricing.prices.weekly` | $5.99 | $5.99 | $5.99 |
| `marketing.pricing.pricesSubjectToChange` | Prices subject to change. | Los precios pueden cambiar. | Preços podem mudar. |
| `marketing.pricing.subtitle` | One membership with full access to every Palette Plotting tool on web and mobile. | Una membresía con acceso total en web y app. | Uma assinatura com acesso total na web e no app. |
| `marketing.pricing.termsOfService` | Terms of Service | Términos de servicio | Termos de serviço |
| `marketing.pricing.title` | Pricing | Precios | Preços |
| `marketing.pricing.whatsIncluded` | What's included | Qué incluye | O que está incluído |
| `marketing.whatIsPalettePlotting.back` | Back | Atrás | Voltar |
| `marketing.whatIsPalettePlotting.blog` | blog | blog | blog |
| `marketing.whatIsPalettePlotting.faq` | FAQ | FAQ | FAQ |
| `marketing.whatIsPalettePlotting.footerMiddle` | and our | y nuestro | e nosso |
| `marketing.whatIsPalettePlotting.footerPrefix` | Palette Plotting is a self-guided toolkit, not therapy or medical care. For clinical or emergency support, contact appropriate professionals. For more on policies and billing, see | Palette Plotting es un conjunto de herramientas de autoayuda, no terapia ni atención médica. Para apoyo clínico o de emergencia, contacta a profesionales adecuados. Para más sobre políticas y facturación, consulta | A Palette Plotting é um conjunto de ferramentas de autoajuda, não terapia nem atendimento médico. Para suporte clínico ou de emergência, contate profissionais adequados. Para mais sobre políticas e cobrança, veja |
| `marketing.whatIsPalettePlotting.footerSuffix` | . | . | . |
| `marketing.whatIsPalettePlotting.intro` | Palette Plotting brings your manifestation into one place — so you are not juggling notes, random subliminal playlists, screenshots, voice memos, journals, and scattered methods when doubt shows up. Use it to write the story, hear it, see it, repeat it, and live in the end. | Palette Plotting concentra tu manifestación en un solo lugar — para que no estés manejando notas, playlists aleatorias de subliminales, capturas, notas de voz, diarios y métodos dispersos cuando la duda aparece. Úsalo para escribir la historia, escucharla, verla, repetirla y vivir en el final. | A Palette Plotting concentra sua manifestação em um só lugar — para você não ficar gerenciando notas, playlists aleatórias de subliminares, capturas de tela, notas de voz, diários e métodos dispersos quando a dúvida aparece. Use para escrever a história, ouvir, ver, repetir e viver no final. |
| `marketing.whatIsPalettePlotting.title` | What is Palette Plotting? | ¿Qué es Palette Plotting? | O que é Palette Plotting? |
| `onboarding.legacy.digitalMirror.imageAlt` | Mirror Work | Trabajo con espejo | Trabalho com espelho |
| `onboarding.legacy.digitalMirror.subtitle` | Guided sessions meant to grow self-confidence | Sesiones guiadas para autoconfianza | Sessões guiadas para autoconfiança |
| `onboarding.legacy.digitalMirror.title` | Mirror Work | Trabajo con espejo | Trabalho com espelho |
| `onboarding.legacy.double.characters.oliver.name` | Oliver | Oliver | Oliver |
| `onboarding.legacy.double.characters.oliver.themes.0` | Self Image | Autoimagen | Autoimagem |
| `onboarding.legacy.double.characters.oliver.themes.1` | Fitness | Fitness | Fitness |
| `onboarding.legacy.double.characters.river.name` | River | River | River |
| `onboarding.legacy.double.characters.river.themes.0` | Transitions | Transiciones | Transições |
| `onboarding.legacy.double.characters.river.themes.1` | Career | Carrera | Carreira |
| `onboarding.legacy.double.characters.rose.name` | Rose | Rose | Rose |
| `onboarding.legacy.double.characters.rose.themes.0` | Love | Amor | Amor |
| `onboarding.legacy.double.characters.rose.themes.1` | Self Concept | Autoconcepto | Autoconceito |
| `onboarding.legacy.double.characters.sage.name` | Sage | Sage | Sage |
| `onboarding.legacy.double.characters.sage.themes.0` | Finance | Finanzas | Finanças |
| `onboarding.legacy.double.characters.sage.themes.1` | Identity | Identidad | Identidade |
| `onboarding.legacy.double.subtitle` | An AI companion to help fuel momentum through chats | Tu guía de IA en los chats | Um guia de IA nos chats |
| `onboarding.legacy.double.title` | Choose a Guide | Elige tu guía | Escolha um guia |
| `onboarding.legacy.habitTracking.imageAlt` | Habit & Momentum Tracking | Hábitos y progreso | Hábitos e progresso |
| `onboarding.legacy.habitTracking.subtitle` | Track your progress and build lasting habits | Sigue progreso y hábitos | Acompanhe progresso e hábitos |
| `onboarding.legacy.habitTracking.title` | Habit & Momentum Tracking | Hábitos y progreso | Hábitos e progresso |
| `onboarding.legacy.manifestationTools.imageAlt` | Interactive Manifestation Tools | Herramientas de manifestación | Ferramentas de manifestação |
| `onboarding.legacy.manifestationTools.subtitle` | Use experimental techniques for manifestation | Usa técnicas experimentales para manifestar | Use técnicas experimentais para manifestar |
| `onboarding.legacy.manifestationTools.title` | Interactive Manifestation Tools | Herramientas de manifestación | Ferramentas de manifestação |
| `onboarding.legacy.onboardingQuestions.options.Business` | Business | Negocios | Negócios |
| `onboarding.legacy.onboardingQuestions.options.Career` | Career | Carrera | Carreira |
| `onboarding.legacy.onboardingQuestions.options.Confidence` | Self-Concept | Autoconcepto | Autoconceito |
| `onboarding.legacy.onboardingQuestions.options.Connections` | Love / SP | Amor | Amor |
| `onboarding.legacy.onboardingQuestions.options.Discipline` | Discipline | Disciplina | Disciplina |
| `onboarding.legacy.onboardingQuestions.options.Finances` | Money | Dinero | Dinheiro |
| `onboarding.legacy.onboardingQuestions.options.Fitness` | Body / Fitness | Cuerpo / Fitness | Corpo / Fitness |
| `onboarding.legacy.onboardingQuestions.options.Learning` | School / Exams | Escuela / Exámenes | Escola / Provas |
| `onboarding.legacy.onboardingQuestions.options.Nutrition` | Wellness | Bienestar | Bem-estar |
| `onboarding.legacy.onboardingQuestions.options.Organization` | Life Reset | Reinicio de vida | Recomeço de vida |
| `onboarding.legacy.onboardingQuestions.options.Productivity` | Focus | Enfoque | Foco |
| `onboarding.legacy.onboardingQuestions.options.Self-Love` | Beauty / Glow Up | Belleza / Glow Up | Beleza / Glow Up |
| `onboarding.legacy.onboardingQuestions.question` | What do you want to shift? | ¿Qué quieres cambiar? | O que você quer mudar? |
| `onboarding.legacy.onboardingQuestions.selectUpTo3` | Select up to 3 options | Selecciona hasta 3 opciones | Selecione até 3 opções |
| `onboarding.legacy.onboardingQuestions.title` | Manifestation Focus | Enfoque de manifestación | Foco de manifestação |
| `onboarding.legacy.subliminalMaker.imageAlt` | Subliminal Maker | Creador de subliminales | Criador de subliminares |
| `onboarding.legacy.subliminalMaker.subtitle` | Create custom subliminal audio tracks | Crea audios subliminales | Crie áudios subliminares |
| `onboarding.legacy.subliminalMaker.title` | Subliminal Maker | Creador de subliminales | Criador de subliminares |
| `onboarding.legacy.threeActs.subtitle` | A flexible framework for quantum leaps | Un marco para saltos cuánticos | Uma estrutura para saltos quânticos |
| `onboarding.legacy.threeActs.title` | Your Self-Concept Suite | Tu suite de autoconcepto | Sua suíte de autoconceito |
| `onboarding.legacy.threeActs.tools.affirmScript.description` | Custom affirmations and visuals | Afirmaciones y visuales personalizados | Afirmações e visuais personalizados |
| `onboarding.legacy.threeActs.tools.affirmScript.title` | Affirm & Script | Afirmar y escribir | Afirmar e escrever |
| `onboarding.legacy.threeActs.tools.beliefWork.description` | Deconstruct self-limiting beliefs | Desarma creencias limitantes | Desconstrua crenças limitantes |
| `onboarding.legacy.threeActs.tools.beliefWork.title` | Belief Work | Trabajo de creencias | Trabalho de crenças |
| `onboarding.legacy.threeActs.tools.habitTracking.description` | Track daily progress on goals | Progreso diario en tus metas | Progresso diário nas metas |
| `onboarding.legacy.threeActs.tools.habitTracking.title` | Habit Tracking | Hábitos | Hábitos |
| `onboarding.legacy.threeActs.tools.manifestationJournal.description` | Daily journaling and notes | Diario y notas diarias | Diário e notas diárias |
| `onboarding.legacy.threeActs.tools.manifestationJournal.title` | Manifestation Journal | Diario de manifestación | Diário de manifestação |
| `onboarding.legacy.threeActs.tools.mirrorWork.description` | Immersive Mirror Work | Espejo inmersivo | Espelho imersivo |
| `onboarding.legacy.threeActs.tools.mirrorWork.title` | Mirror Work | Trabajo con espejo | Trabalho com espelho |
| `onboarding.legacy.threeActs.tools.pianoTapping.description` | Tactile integration of goals | Integración táctil de metas | Integração tátil de metas |
| `onboarding.legacy.threeActs.tools.pianoTapping.title` | Piano Tapping | Piano | Piano |
| `onboarding.legacy.threeActs.tools.subliminalMaker.description` | Custom subliminals with binaural beats | Subliminales con beats binaurales | Subliminares com batidas binaurais |
| `onboarding.legacy.threeActs.tools.subliminalMaker.title` | Subliminal Maker | Creador de subliminales | Criador de subliminares |
| `onboarding.setup.affirmationRead.subtitle` | Speak & internalize these personalized affirmations | Di e internaliza tus afirmaciones | Fale e internalize suas afirmações |
| `onboarding.setup.affirmationRead.title` | Confidently affirm your desires out loud | Afirma en voz alta con confianza | Afirme em voz alta com confiança |
| `onboarding.setup.beginJourney.lead` | Palette Plotting helps you practice manifestation methods & embody your desires, fostering coherence at each step. | Palette Plotting te ayuda a practicar manifestación y encarnar tus deseos. | Palette Plotting ajuda você a praticar manifestação e encarnar seus desejos. |
| `onboarding.setup.beginJourney.subtitle` | Let's begin your journey. | Comencemos tu camino. | Vamos começar sua jornada. |
| `onboarding.setup.conditionalSpecificity.categories.Business.headline` | What business result do you want most? | ¿Qué resultado de negocio quieres? | Que resultado de negócio você quer? |
| `onboarding.setup.conditionalSpecificity.categories.Business.options.audienceGrowth` | Audience growth | Más audiencia | Mais audiência |
| `onboarding.setup.conditionalSpecificity.categories.Business.options.launchSuccess` | Launch success | Lanzamiento exitoso | Lançamento de sucesso |
| `onboarding.setup.conditionalSpecificity.categories.Business.options.moreCustomersClients` | More customers/clients | Más clientes | Mais clientes |
| `onboarding.setup.conditionalSpecificity.categories.Business.options.moreSales` | More sales | Más ventas | Mais vendas |
| `onboarding.setup.conditionalSpecificity.categories.Career.headline` | What career outcome are you calling in? | ¿Qué resultado profesional quieres? | Que resultado de carreira você quer? |
| `onboarding.setup.conditionalSpecificity.categories.Career.options.dreamOpportunity` | Dream opportunity | Oportunidad ideal | Oportunidade ideal |
| `onboarding.setup.conditionalSpecificity.categories.Career.options.higherPay` | Higher pay | Mejor salario | Salário maior |
| `onboarding.setup.conditionalSpecificity.categories.Career.options.newJob` | New job | Nuevo trabajo | Novo emprego |
| `onboarding.setup.conditionalSpecificity.categories.Career.options.promotion` | Promotion | Ascenso | Promoção |
| `onboarding.setup.conditionalSpecificity.categories.Confidence.headline` | Which self-concept focus fits best? | ¿Qué enfoque de autoconcepto encaja? | Qual foco de autoconceito combina? |
| `onboarding.setup.conditionalSpecificity.categories.Confidence.options.confidence` | Confidence | Confianza | Confiança |
| `onboarding.setup.conditionalSpecificity.categories.Confidence.options.magnetism` | Magnetism | Magnetismo | Magnetismo |
| `onboarding.setup.conditionalSpecificity.categories.Confidence.options.selfTrust` | Self-trust | Autoconfianza | Autoconfiança |
| `onboarding.setup.conditionalSpecificity.categories.Confidence.options.visibility` | Visibility | Visibilidad | Visibilidade |
| `onboarding.setup.conditionalSpecificity.categories.Discipline.headline` | What are you building consistency around? | ¿Dónde quieres más constancia? | Onde quer mais constância? |
| `onboarding.setup.conditionalSpecificity.categories.Discipline.options.fitness` | Fitness | Fitness | Fitness |
| `onboarding.setup.conditionalSpecificity.categories.Discipline.options.morningRoutine` | Morning routine | Rutina matutina | Rotina matinal |
| `onboarding.setup.conditionalSpecificity.categories.Discipline.options.selfCare` | Self-care | Autocuidado | Autocuidado |
| `onboarding.setup.conditionalSpecificity.categories.Discipline.options.studying` | Studying | Estudiar | Estudar |
| `onboarding.setup.conditionalSpecificity.categories.Discipline.options.work` | Work | Trabajo | Trabalho |
| `onboarding.setup.conditionalSpecificity.categories.Finances.headline` | What kind of money shift are you calling in? | ¿Qué cambio financiero quieres? | Que mudança financeira você quer? |
| `onboarding.setup.conditionalSpecificity.categories.Finances.options.consistentIncome` | Consistent income | Ingresos constantes | Renda consistente |
| `onboarding.setup.conditionalSpecificity.categories.Finances.options.debtFreedom` | Debt freedom | Sin deudas | Sem dívidas |
| `onboarding.setup.conditionalSpecificity.categories.Finances.options.financialSafety` | Financial safety | Seguridad financiera | Segurança |
| `onboarding.setup.conditionalSpecificity.categories.Finances.options.luxuryEase` | Luxury & ease | Lujo y facilidad | Luxo e facilidade |
| `onboarding.setup.conditionalSpecificity.categories.Finances.options.moreSales` | More sales | Más ventas | Mais vendas |
| `onboarding.setup.conditionalSpecificity.categories.Fitness.headline` | What body or fitness shift are you calling in? | ¿Qué cambio físico quieres? | Que mudança física você quer? |
| `onboarding.setup.conditionalSpecificity.categories.Fitness.options.confidence` | Confidence | Confianza | Confiança |
| `onboarding.setup.conditionalSpecificity.categories.Fitness.options.consistentWorkouts` | Consistent workouts | Entrenos constantes | Treinos constantes |
| `onboarding.setup.conditionalSpecificity.categories.Fitness.options.energy` | Energy | Energía | Energia |
| `onboarding.setup.conditionalSpecificity.categories.Fitness.options.shapeTone` | Shape & tone | Forma y tono | Forma e tônus |
| `onboarding.setup.conditionalSpecificity.categories.Fitness.options.strength` | Strength | Fuerza | Força |
| `onboarding.setup.conditionalSpecificity.categories.Learning.headline` | What education outcome are you calling in? | ¿Qué resultado educativo quieres? | Que resultado escolar você quer? |
| `onboarding.setup.conditionalSpecificity.categories.Learning.options.betterGrades` | Better grades | Mejores notas | Notas melhores |
| `onboarding.setup.conditionalSpecificity.categories.Learning.options.collegeAcceptance` | College acceptance | Aceptación | Aprovação |
| `onboarding.setup.conditionalSpecificity.categories.Learning.options.examSuccess` | Exam success | Éxito en exámenes | Sucesso em provas |
| `onboarding.setup.conditionalSpecificity.categories.Learning.options.focusStudying` | Focus studying | Foco al estudiar | Foco nos estudos |
| `onboarding.setup.conditionalSpecificity.categories.Learning.options.scholarship` | Scholarship | Beca | Bolsa de estudos |
| `onboarding.setup.conditionalSpecificity.categories.Nutrition.headline` | What kind of wellness shift do you want? | ¿Qué cambio de bienestar quieres? | Que mudança de bem-estar você quer? |
| `onboarding.setup.conditionalSpecificity.categories.Nutrition.options.balance` | Balance | Equilibrio | Equilíbrio |
| `onboarding.setup.conditionalSpecificity.categories.Nutrition.options.betterRest` | Better rest | Mejor descanso | Melhor descanso |
| `onboarding.setup.conditionalSpecificity.categories.Nutrition.options.emotionalEase` | Emotional ease | Calma emocional | Calma emocional |
| `onboarding.setup.conditionalSpecificity.categories.Nutrition.options.moreEnergy` | More energy | Más energía | Mais energia |
| `onboarding.setup.conditionalSpecificity.categories.Nutrition.options.softerRoutines` | Softer routines | Rutinas más suaves | Rotinas mais leves |
| `onboarding.setup.conditionalSpecificity.categories.Organization.headline` | What part of your life are you resetting? | ¿Qué parte quieres reiniciar? | Que parte da vida quer reiniciar? |
| `onboarding.setup.conditionalSpecificity.categories.Organization.options.myEnvironment` | My environment | Mi entorno | Meu ambiente |
| `onboarding.setup.conditionalSpecificity.categories.Organization.options.myPriorities` | My priorities | Mis prioridades | Minhas prioridades |
| `onboarding.setup.conditionalSpecificity.categories.Organization.options.myRoutines` | My routines | Mis rutinas | Minhas rotinas |
| `onboarding.setup.conditionalSpecificity.categories.Organization.options.mySchedule` | My schedule | Mi agenda | Minha agenda |
| `onboarding.setup.conditionalSpecificity.categories.Organization.options.mySpace` | My space | Mi espacio | Meu espaço |
| `onboarding.setup.conditionalSpecificity.categories.Productivity.headline` | Where do you want more focus? | ¿Dónde quieres más enfoque? | Onde você quer mais foco? |
| `onboarding.setup.conditionalSpecificity.categories.Productivity.options.contentCreation` | Content creation | Creación de contenido | Criação de conteúdo |
| `onboarding.setup.conditionalSpecificity.categories.Productivity.options.creativeWork` | Creative work | Trabajo creativo | Trabalho criativo |
| `onboarding.setup.conditionalSpecificity.categories.Productivity.options.dailyRoutine` | Daily routine | Rutina diaria | Rotina diária |
| `onboarding.setup.conditionalSpecificity.categories.Productivity.options.studying` | Studying | Estudiar | Estudar |
| `onboarding.setup.conditionalSpecificity.categories.Productivity.options.workProjects` | Work projects | Proyectos de trabajo | Projetos de trabalho |
| `onboarding.setup.conditionalSpecificity.categories.Self-Love.headline` | What do you want to feel when you see yourself? | ¿Qué quieres sentir cuando te ves? | O que você quer sentir quando se vê? |
| `onboarding.setup.conditionalSpecificity.categories.Self-Love.options.beautiful` | Beautiful | Bella | Bonita |
| `onboarding.setup.conditionalSpecificity.categories.Self-Love.options.desired` | Desired | Deseada | Desejada |
| `onboarding.setup.conditionalSpecificity.categories.Self-Love.options.expensive` | Expensive | Valiosa | Valiosa |
| `onboarding.setup.conditionalSpecificity.categories.Self-Love.options.radiant` | Radiant | Radiante | Radiante |
| `onboarding.setup.conditionalSpecificity.categories.Self-Love.options.seen` | Seen | Vista | Vista |
| `onboarding.setup.conditionalSpecificity.customLabel` | Describe your focus | Describe tu enfoque | Descreva seu foco |
| `onboarding.setup.conditionalSpecificity.customPlaceholder` | e.g., Launching my online business | p. ej., Lanzar mi negocio en línea | p. ex., Lançar meu negócio online |
| `onboarding.setup.conditionalSpecificity.fallbackHeadline` | A quick detail | Un detalle rápido | Um detalhe rápido |
| `onboarding.setup.conditionalSpecificity.fallbackMessage` | Go back and pick one of the twelve focus areas to unlock this step. | Regresa y elige un área de enfoque. | Volte e escolha uma área de foco. |
| `onboarding.setup.conditionalSpecificity.spPerson.choices.complicated` | It's complicated | Es complicado | É complicado |
| `onboarding.setup.conditionalSpecificity.spPerson.choices.no` | No | No | Não |
| `onboarding.setup.conditionalSpecificity.spPerson.choices.prefer_not` | Prefer not to say | Prefiero no decirlo | Prefiro não dizer |
| `onboarding.setup.conditionalSpecificity.spPerson.choices.yes` | Yes | Sí | Sim |
| `onboarding.setup.conditionalSpecificity.spPerson.headline` | Is there a specific person connected to this desire? | ¿Hay una persona específica ligada a este deseo? | Há uma pessoa específica ligada a este desejo? |
| `onboarding.setup.conditionalSpecificity.spPerson.nameLabel` | What should we call them? | ¿Qué nombre usamos? | Que nome usamos? |
| `onboarding.setup.conditionalSpecificity.spPerson.namePlaceholder` | e.g., Alex | p. ej., Alex | p. ex., Alex |
| `onboarding.setup.conditionalSpecificity.subtitle` | We'll use this to shape your guidance in the app. | Esto define tu guía en la app. | Isso define sua orientação no app. |
| `onboarding.setup.currentFriction.placeholder` | Describe the belief you want to change… | Describe la creencia que quieres cambiar… | Descreva a crença que quer mudar… |
| `onboarding.setup.currentFriction.subtitle` | What limiting belief blocks your manifestation? | ¿Qué creencia bloquea tu manifestación? | Que crença bloqueia sua manifestação? |
| `onboarding.setup.currentFriction.title` | What limiting belief do you want to change? | ¿Qué creencia quieres cambiar? | Que crença quer mudar? |
| `onboarding.setup.desireCategory.subtitle` | Select one focus area. | Elige un enfoque. | Escolha um foco. |
| `onboarding.setup.desireCategory.title` | What do you want to manifest most? | ¿Qué quieres manifestar más? | O que você mais quer manifestar? |
| `onboarding.setup.email.acceptTerms` | Please accept the Terms of Service and Privacy Policy | Acepta los Términos y la Privacidad | Aceite os Termos e a Privacidade |
| `onboarding.setup.email.checkingAvailability` | Checking availability… | Comprobando disponibilidad… | Verificando disponibilidade… |
| `onboarding.setup.email.emailLabel` | Email | Correo | E-mail |
| `onboarding.setup.email.emailMarketingConsent` | Send me manifestation tips and updates. By checking this box, you consent to marketing communications. You can opt out anytime. | Envíame tips de manifestación y novedades. Al marcar esto, aceptas comunicaciones de marketing. Puedes cancelar cuando quieras. | Envie tips de manifestação e novidades. Ao marcar, você consente com comunicações de marketing. Você pode cancelar quando quiser. |
| `onboarding.setup.email.emailPlaceholder` | you@email.com | tu@correo.com | voce@email.com |
| `onboarding.setup.email.hidePassword` | Hide password | Ocultar contraseña | Ocultar senha |
| `onboarding.setup.email.invalidEmail` | Please enter a valid email address | Ingresa un correo válido | Digite um e-mail válido |
| `onboarding.setup.email.needFirstName` | We need your first name from earlier in setup. | Necesitamos tu nombre. | Precisamos do seu nome. |
| `onboarding.setup.email.passwordLabel` | Password | Contraseña | Senha |
| `onboarding.setup.email.passwordLength` | Please enter a password with at least 8 characters | Ingresa una contraseña de 8+ caracteres | Digite uma senha de 8+ caracteres |
| `onboarding.setup.email.passwordPlaceholder` | 8+ characters | 8+ caracteres | 8+ caracteres |
| `onboarding.setup.email.privacyPolicy` | Privacy Policy | Política de privacidad | Política de privacidade |
| `onboarding.setup.email.showPassword` | Show password | Mostrar contraseña | Mostrar senha |
| `onboarding.setup.email.subscriptionError` | Could not open subscription options. Try again in a moment. | No pudimos abrir suscripciones. Intenta de nuevo. | Não foi possível abrir assinaturas. Tente de novo. |
| `onboarding.setup.email.subtitle` | Create your account to lock in your path. All of your progress is saved to this email. | Crea tu cuenta para guardar tu camino. Tu progreso queda en este correo. | Crie sua conta para salvar seu caminho. Seu progresso fica neste e-mail. |
| `onboarding.setup.email.termsAcceptPrefix` | I accept the | Acepto los | Aceito os |
| `onboarding.setup.email.termsAnd` | and | y la | e a |
| `onboarding.setup.email.termsOfService` | Terms of Service | Términos de servicio | Termos de serviço |
| `onboarding.setup.email.title` | Save your path | Guarda tu camino | Salve seu caminho |
| `onboarding.setup.email.titleLine1` | Save your path & | Guarda tu camino y | Salve seu caminho e |
| `onboarding.setup.email.titleLine2` | start your free trial | comienza tu prueba gratis | comece seu teste grátis |
| `onboarding.setup.email.tryAgain` | Try again | Intentar de nuevo | Tentar de novo |
| `onboarding.setup.embody.subtitle` | Choose exactly five—they become your Inspired Actions on your dashboard. ({{count}} of {{required}} selected) | Elige cinco—serán tus Acciones inspiradas. ({{count}} de {{required}}) | Escolha cinco — elas viram Ações inspiradas. ({{count}} de {{required}}) |
| `onboarding.setup.embody.title` | How will you embody your new identity each day? | ¿Cómo encarnarás tu nueva identidad? | Como encarnar sua nova identidade? |
| `onboarding.setup.embodyOptions.embody_clean_environment` | Clean & organize environment | Ordenar tu entorno | Organizar o ambiente |
| `onboarding.setup.embodyOptions.embody_connect` | Connect with others | Conectar con otros | Conectar com outros |
| `onboarding.setup.embodyOptions.embody_glam_up` | Glam Up | Arreglarse | Caprichar |
| `onboarding.setup.embodyOptions.embody_have_fun` | Have fun | Divertirse | Divertir-se |
| `onboarding.setup.embodyOptions.embody_move` | Exercise | Ejercicio | Exercício |
| `onboarding.setup.embodyOptions.embody_nutrition` | Nutrition | Nutrición | Nutrição |
| `onboarding.setup.embodyOptions.embody_rest` | Rest & Relax | Descansar | Descansar |
| `onboarding.setup.embodyOptions.embody_seen` | Be seen & visible. | Ser visto y visible | Ser visto e visível |
| `onboarding.setup.embodyOptions.embody_self_care` | Self-care | Autocuidado | Autocuidado |
| `onboarding.setup.embodyOptions.embody_work_or_study` | Work or study | Trabajar o estudiar | Trabalhar ou estudar |
| `onboarding.setup.guide.subtitle` | An AI companion to answer manifesting questions. | Tu guía de IA para tus dudas. | Um guia de IA para suas dúvidas. |
| `onboarding.setup.guide.title` | Choose a guide | Elige tu guía | Escolha um guia |
| `onboarding.setup.manifestationIntensity.alerts.alert` | Alert | Alerta | Alerta |
| `onboarding.setup.manifestationIntensity.alerts.first` | 1st Alert | 1.ª alerta | 1.º alerta |
| `onboarding.setup.manifestationIntensity.alerts.second` | 2nd Alert | 2.ª alerta | 2.º alerta |
| `onboarding.setup.manifestationIntensity.alerts.third` | 3rd Alert | 3.ª alerta | 3.º alerta |
| `onboarding.setup.manifestationIntensity.consistent.description` | More moderate manifesting intensity. 2x daily notifications, if selected. | Intensidad moderada. 2 notificaciones diarias. | Intensidade moderada. 2 notificações diárias. |
| `onboarding.setup.manifestationIntensity.consistent.tagline` | For experienced manifestors. | Para manifestadores con experiencia. | Para manifestadores experientes. |
| `onboarding.setup.manifestationIntensity.consistent.title` | Consistent | Constante | Consistente |
| `onboarding.setup.manifestationIntensity.customizeInSettings` | You can customize your routine further in Settings. | Personalízala después en Ajustes. | Personalize depois em Configurações. |
| `onboarding.setup.manifestationIntensity.dailyTime` | Daily notifications time | Hora diaria | Horário diário |
| `onboarding.setup.manifestationIntensity.light.description` | Light integration of manifesting, with daily notifications, if opted into. | Manifestación ligera, con notificaciones si quieres. | Manifestação leve, com notificações diárias se quiser. |
| `onboarding.setup.manifestationIntensity.light.tagline` | The recommended routine. | La rutina recomendada. | A rotina recomendada. |
| `onboarding.setup.manifestationIntensity.light.title` | Light | Ligera | Leve |
| `onboarding.setup.manifestationIntensity.lockedIn.description` | For more intense manifesting goals. 3x daily notifications, if opted into. | Metas intensas. 3 notificaciones diarias. | Metas intensas. 3 notificações diárias. |
| `onboarding.setup.manifestationIntensity.lockedIn.tagline` | The highest-intensity routine. | La rutina más intensa. | A rotina mais intensa. |
| `onboarding.setup.manifestationIntensity.lockedIn.title` | Locked In | Enfocado | Focado |
| `onboarding.setup.manifestationIntensity.notNow` | Not now | Ahora no | Agora não |
| `onboarding.setup.manifestationIntensity.notificationsHint` | Notifications support your routine — they nudge you back to your inspired actions at the intensity you choose. | Te recuerdan volver a tus acciones inspiradas. | Elas te lembram de voltar às ações inspiradas. |
| `onboarding.setup.manifestationIntensity.notificationsQuestion` | Do you want in-app & push notifications to bring you back to the app for your routine? | ¿Quieres notificaciones para retomar tu rutina? | Quer notificações para voltar à rotina? |
| `onboarding.setup.manifestationIntensity.setRoutine` | Set my routine | Configurar rutina | Definir rotina |
| `onboarding.setup.manifestationIntensity.subtitle` | Set your routine intensity and optional notifications. | Configura rutina y notificaciones. | Defina rotina e notificações opcionais. |
| `onboarding.setup.manifestationIntensity.title` | Choose your manifesting intensity | Elige tu intensidad | Escolha sua intensidade |
| `onboarding.setup.manifestationIntensity.yes` | Yes | Sí | Sim |
| `onboarding.setup.name.firstNameLabel` | First name | Nombre | Nome |
| `onboarding.setup.name.firstNamePlaceholder` | Your first name | Tu nombre | Seu nome |
| `onboarding.setup.name.saveError` | Could not save your name. Check your connection and try again. | No pudimos guardarlo. Intenta de nuevo. | Não foi possível salvar. Tente de novo. |
| `onboarding.setup.name.title` | Welcome! What should Palette Plotting call you? | ¿Cómo quieres que te llamemos? | Como devemos te chamar? |
| `onboarding.setup.notifications.subtitle` | Help us improve Palette Plotting. | Ayúdanos a mejorar Palette Plotting. | Ajude-nos a melhorar o Palette Plotting. |
| `onboarding.setup.notifications.title` | Turn on additional permissions | Activa permisos | Ative permissões |
| `onboarding.setup.plotLoading.hint` | You're not starting from zero—your path is already taking shape. | Tu camino ya está tomando forma. | Seu caminho já está tomando forma. |
| `onboarding.setup.plotLoading.loading` | Loading | Cargando | Carregando |
| `onboarding.setup.plotLoading.subtitle` | Personalizing your starting stack. | Personalizando tu configuración. | Personalizando sua configuração. |
| `onboarding.setup.plotLoading.testimonials.row1.0.author` | Jordan M. | Jordan M. | Jordan M. |
| `onboarding.setup.plotLoading.testimonials.row1.0.quote` | This finally made my new story feel normal. | Por fin mi nueva historia se siente normal. | Finalmente minha nova história parece normal. |
| `onboarding.setup.plotLoading.testimonials.row1.1.author` | Riley T. | Riley T. | Riley T. |
| `onboarding.setup.plotLoading.testimonials.row1.1.quote` | I stopped checking the 3D and stayed consistent—finally. | Dejé de revisar el 3D y mantuve la constancia—por fin. | Parei de checar o 3D e mantive constância—finalmente. |
| `onboarding.setup.plotLoading.testimonials.row1.2.author` | Casey L. | Casey L. | Casey L. |
| `onboarding.setup.plotLoading.testimonials.row1.2.quote` | The tool path was exactly what I needed. | La ruta de herramientas era justo lo que necesitaba. | O caminho de ferramentas era exatamente o que eu precisava. |
| `onboarding.setup.plotLoading.testimonials.row1.3.author` | Morgan P. | Morgan P. | Morgan P. |
| `onboarding.setup.plotLoading.testimonials.row1.3.quote` | The affirmations actually sounded like me, not generic fluff. | Las afirmaciones sonaban como yo, no genéricas. | As afirmações pareciam comigo, não genéricas. |
| `onboarding.setup.plotLoading.testimonials.row2.0.author` | Dev S. | Dev S. | Dev S. |
| `onboarding.setup.plotLoading.testimonials.row2.0.quote` | My self-concept shifted fast once I had structure. | Mi autoconcepto cambió rápido cuando tuve estructura. | Meu autoconceito mudou rápido quando tive estrutura. |
| `onboarding.setup.plotLoading.testimonials.row2.1.author` | Avery K. | Avery K. | Avery K. |
| `onboarding.setup.plotLoading.testimonials.row2.1.quote` | Having one place for mirror work and subliminals kept me honest. | Un solo lugar para espejo y subliminales me mantuvo honesta. | Ter um lugar para espelho e subliminares me manteve firme. |
| `onboarding.setup.plotLoading.testimonials.row2.2.author` | Quinn R. | Quinn R. | Quinn R. |
| `onboarding.setup.plotLoading.testimonials.row2.2.quote` | Small daily wins added up quicker than I expected. | Las victorias pequeñas se sumaron más rápido de lo que esperaba. | Pequenas vitórias somaram mais rápido do que eu esperava. |
| `onboarding.setup.plotLoading.testimonials.row2.3.author` | Jamie H. | Jamie H. | Jamie H. |
| `onboarding.setup.plotLoading.testimonials.row2.3.quote` | I actually finish sessions now instead of doom-scrolling. | Ahora termino las sesiones en lugar de perder tiempo en el scroll. | Agora termino as sessões em vez de ficar no scroll. |
| `onboarding.setup.plotLoading.title` | Building your path… | Construyendo tu camino… | Construindo seu caminho… |
| `onboarding.setup.plotSynthesis.items.affirmations` | Affirmations for the new you. | Afirmaciones para el nuevo tú. | Afirmações para o novo você. |
| `onboarding.setup.plotSynthesis.items.beliefs` | Beliefs ready for reframing. | Creencias listas. | Crenças prontas. |
| `onboarding.setup.plotSynthesis.items.guideReady` | {{name}} is ready to coach you. | {{name}} está listo para guiarte. | {{name}} está pronto para te guiar. |
| `onboarding.setup.plotSynthesis.items.guideReadyGeneric` | Your guide is ready to coach you. | Tu guía está lista. | Seu guia está pronto. |
| `onboarding.setup.plotSynthesis.items.journal` | Journal ready for reflection. | Diario listo. | Diário pronto. |
| `onboarding.setup.plotSynthesis.items.mirror` | Mirror work for self concept. | Espejo para autoconcepto. | Espelho para autoconceito. |
| `onboarding.setup.plotSynthesis.items.subliminals` | Customized subliminals. | Subliminales personalizados. | Subliminares personalizados. |
| `onboarding.setup.plotSynthesis.subtitle` | Everything below is ready the moment you unlock Palette Plotting. | Todo estará listo al desbloquear Palette Plotting. | Tudo fica pronto ao desbloquear o Palette Plotting. |
| `onboarding.setup.plotSynthesis.title` | Your path is ready. | Tu camino está listo. | Seu caminho está pronto. |
| `onboarding.setup.readAffirmations.Business.0` | My products reach the right people. | Mis productos llegan a las personas correctas. | Meus produtos chegam às pessoas certas. |
| `onboarding.setup.readAffirmations.Business.1` | People understand the value quickly. | La gente entiende el valor rápidamente. | As pessoas entendem o valor rapidamente. |
| `onboarding.setup.readAffirmations.Business.2` | My work creates desire, trust, and action. | Mi trabajo crea deseo, confianza y acción. | Meu trabalho cria desejo, confiança e ação. |
| `onboarding.setup.readAffirmations.Business.3` | Sales are consistent in my business. | Las ventas son constantes en mi negocio. | As vendas são consistentes no meu negócio. |
| `onboarding.setup.readAffirmations.Business.4` | My audience grows with momentum. | Mi audiencia crece con momentum. | Minha audiência cresce com momentum. |
| `onboarding.setup.readAffirmations.Business.5` | My products are chosen, shared, and remembered. | Mis productos son elegidos, compartidos y recordados. | Meus produtos são escolhidos, compartilhados e lembrados. |
| `onboarding.setup.readAffirmations.Business.6` | I trust what I built because it solves something real. | Confío en lo que construí porque resuelve algo real. | Confio no que construí porque resolve algo real. |
| `onboarding.setup.readAffirmations.Business.7` | Revenue reflects the strength of my vision. | Los ingresos reflejan la fuerza de mi visión. | A receita reflete a força da minha visão. |
| `onboarding.setup.readAffirmations.Business.8` | My business has gravity. | Mi negocio tiene gravedad. | Meu negócio tem gravidade. |
| `onboarding.setup.readAffirmations.Business.9` | I am the founder of something people want. | Soy la fundadora de algo que la gente quiere. | Sou a fundadora de algo que as pessoas querem. |
| `onboarding.setup.readAffirmations.Career.0` | I am intelligent, capable, and highly valued. | Soy inteligente, capaz y muy valorada. | Sou inteligente, capaz e muito valorizada. |
| `onboarding.setup.readAffirmations.Career.1` | The right rooms recognize my name. | Los espacios correctos reconocen mi nombre. | Os espaços certos reconhecem meu nome. |
| `onboarding.setup.readAffirmations.Career.2` | My work carries authority and real impact. | Mi trabajo tiene autoridad e impacto real. | Meu trabalho tem autoridade e impacto real. |
| `onboarding.setup.readAffirmations.Career.3` | I am selected for opportunities that match my level. | Soy seleccionada para oportunidades que coinciden con mi nivel. | Sou selecionada para oportunidades que coincidem com meu nível. |
| `onboarding.setup.readAffirmations.Career.4` | I am paid well for my skill and judgment. | Me pagan bien por mi talento y criterio. | Sou bem paga pelo meu talento e critério. |
| `onboarding.setup.readAffirmations.Career.5` | Decision-makers see my value quickly. | Quienes deciden ven mi valor rápidamente. | Quem decide vê meu valor rapidamente. |
| `onboarding.setup.readAffirmations.Career.6` | My career moves with favor and momentum. | Mi carrera avanza con favor y momentum. | Minha carreira avança com favor e momentum. |
| `onboarding.setup.readAffirmations.Career.7` | I speak about my work with confidence. | Hablo de mi trabajo con confianza. | Falo do meu trabalho com confiança. |
| `onboarding.setup.readAffirmations.Career.8` | My reputation grows in the places that matter. | Mi reputación crece en los lugares que importan. | Minha reputação cresce nos lugares que importam. |
| `onboarding.setup.readAffirmations.Career.9` | I receive the role, pay, and recognition I deserve. | Recibo el rol, el pago y el reconocimiento que merezco. | Recebo o cargo, o pagamento e o reconhecimento que mereço. |
| `onboarding.setup.readAffirmations.Confidence.0` | I am the version of me who already has it. | Soy la versión de mí que ya lo tiene. | Sou a versão de mim que já tem isso. |
| `onboarding.setup.readAffirmations.Confidence.1` | I am chosen, respected, and remembered. | Soy elegida, respetada y recordada. | Sou escolhida, respeitada e lembrada. |
| `onboarding.setup.readAffirmations.Confidence.2` | My presence is magnetic and undeniable. | Mi presencia es magnética e innegable. | Minha presença é magnética e inegável. |
| `onboarding.setup.readAffirmations.Confidence.3` | I trust myself completely. | Confío en mí por completo. | Confio em mim completamente. |
| `onboarding.setup.readAffirmations.Confidence.4` | I move like someone who knows their worth. | Actúo como alguien que sabe su valor. | Ajo como alguém que sabe seu valor. |
| `onboarding.setup.readAffirmations.Confidence.5` | My identity leads everything around me. | Mi identidad guía todo a mi alrededor. | Minha identidade lidera tudo ao meu redor. |
| `onboarding.setup.readAffirmations.Confidence.6` | People respond to my certainty. | La gente responde a mi certeza. | As pessoas respondem à minha certeza. |
| `onboarding.setup.readAffirmations.Confidence.7` | I carry standards that match my desire. | Llevo estándares que coinciden con mi deseo. | Carrego padrões que coincidem com meu desejo. |
| `onboarding.setup.readAffirmations.Confidence.8` | I am powerful without needing to explain. | Soy poderosa sin necesidad de explicar. | Sou poderosa sem precisar explicar. |
| `onboarding.setup.readAffirmations.Confidence.9` | My life reflects who I decide I am. | Mi vida refleja a quien decido ser. | Minha vida reflete quem eu decido ser. |
| `onboarding.setup.readAffirmations.Connections.0` | I am deeply loved and fully chosen. | Soy profundamente amada y plenamente elegida. | Sou profundamente amada e plenamente escolhida. |
| `onboarding.setup.readAffirmations.Connections.1` | I am prioritized with care, devotion, and certainty. | Soy priorizada con cuidado, devoción y certeza. | Sou priorizada com cuidado, devoção e certeza. |
| `onboarding.setup.readAffirmations.Connections.2` | Love with me is natural, easy, and undeniable. | El amor conmigo es natural, fácil e innegable. | O amor comigo é natural, fácil e inegável. |
| `onboarding.setup.readAffirmations.Connections.3` | I am adored in private and claimed in the open. | Soy adorada en privado y elegida en público. | Sou adorada em privado e assumida em público. |
| `onboarding.setup.readAffirmations.Connections.4` | Communication with me is warm, consistent, and intentional. | La comunicación conmigo es cálida, constante e intencional. | A comunicação comigo é calorosa, consistente e intencional. |
| `onboarding.setup.readAffirmations.Connections.5` | I am the person they think of with tenderness and desire. | Soy la persona en quien piensan con ternura y deseo. | Sou a pessoa em quem pensam com ternura e desejo. |
| `onboarding.setup.readAffirmations.Connections.6` | My relationships are loyal, soft, and emotionally secure. | Mis relaciones son leales, suaves y emocionalmente seguras. | Minhas relações são leais, suaves e emocionalmente seguras. |
| `onboarding.setup.readAffirmations.Connections.7` | I am treated like someone rare, precious, and unforgettable. | Soy tratada como alguien única, valiosa e inolvidable. | Sou tratada como alguém única, valiosa e inesquecível. |
| `onboarding.setup.readAffirmations.Connections.8` | The love I want is already aligned with who I am. | El amor que quiero ya está alineado con quien soy. | O amor que quero já está alinhado com quem eu sou. |
| `onboarding.setup.readAffirmations.Connections.9` | I receive devotion as a natural part of my life. | Recibo devoción como parte natural de mi vida. | Recebo devoção como parte natural da minha vida. |
| `onboarding.setup.readAffirmations.Discipline.0` | I keep promises to myself. | Cumplo las promesas que me hago. | Cumpro as promessas que faço a mim. |
| `onboarding.setup.readAffirmations.Discipline.1` | My actions match my future. | Mis acciones coinciden con mi futuro. | Minhas ações coincidem com meu futuro. |
| `onboarding.setup.readAffirmations.Discipline.2` | Consistency is part of who I am. | La constancia es parte de quien soy. | A consistência é parte de quem eu sou. |
| `onboarding.setup.readAffirmations.Discipline.3` | I follow through with power and self-respect. | Cumplo con poder y autorrespeto. | Cumpro com poder e autorrespeito. |
| `onboarding.setup.readAffirmations.Discipline.4` | Small actions create visible results. | Las acciones pequeñas crean resultados visibles. | Ações pequenas criam resultados visíveis. |
| `onboarding.setup.readAffirmations.Discipline.5` | My habits match my standards. | Mis hábitos coinciden con mis estándares. | Meus hábitos coincidem com meus padrões. |
| `onboarding.setup.readAffirmations.Discipline.6` | I choose what supports the life I want. | Elijo lo que sostiene la vida que quiero. | Escolho o que sustenta a vida que quero. |
| `onboarding.setup.readAffirmations.Discipline.7` | I trust myself because I prove myself daily. | Confío en mí porque me demuestro cada día. | Confio em mim porque me provo todos os dias. |
| `onboarding.setup.readAffirmations.Discipline.8` | I finish what matters. | Termino lo que importa. | Termino o que importa. |
| `onboarding.setup.readAffirmations.Discipline.9` | I am disciplined because my desire matters. | Soy disciplinada porque mi deseo importa. | Sou disciplinada porque meu desejo importa. |
| `onboarding.setup.readAffirmations.Finances.0` | I am wealthy in identity, action, and expectation. | Soy rica en identidad, acción y expectativa. | Sou rica em identidade, ação e expectativa. |
| `onboarding.setup.readAffirmations.Finances.1` | Money is natural in my life. | El dinero es natural en mi vida. | O dinheiro é natural na minha vida. |
| `onboarding.setup.readAffirmations.Finances.2` | I receive large payments with ease. | Recibo pagos grandes con facilidad. | Recebo pagamentos grandes com facilidade. |
| `onboarding.setup.readAffirmations.Finances.3` | My products, ideas, and presence create real demand. | Mis productos, ideas y presencia generan demanda real. | Meus produtos, ideias e presença geram demanda real. |
| `onboarding.setup.readAffirmations.Finances.4` | People happily pay for what I create. | La gente paga con gusto por lo que creo. | As pessoas pagam com gosto pelo que eu crio. |
| `onboarding.setup.readAffirmations.Finances.5` | My income expands because my standard expands. | Mi ingreso crece porque mi estándar crece. | Minha renda cresce porque meu padrão cresce. |
| `onboarding.setup.readAffirmations.Finances.6` | I make powerful decisions with money. | Tomo decisiones poderosas con el dinero. | Tomo decisões poderosas com o dinheiro. |
| `onboarding.setup.readAffirmations.Finances.7` | I hold wealth with confidence and intelligence. | Manejo la riqueza con confianza e inteligencia. | Lido com riqueza com confiança e inteligência. |
| `onboarding.setup.readAffirmations.Finances.8` | My numbers reflect the value I create. | Mis números reflejan el valor que creo. | Meus números refletem o valor que eu crio. |
| `onboarding.setup.readAffirmations.Finances.9` | Abundance is normal for me. | La abundancia es normal para mí. | A abundância é normal para mim. |
| `onboarding.setup.readAffirmations.Fitness.0` | My body reflects strength, care, and consistency. | Mi cuerpo refleja fuerza, cuidado y constancia. | Meu corpo reflete força, cuidado e consistência. |
| `onboarding.setup.readAffirmations.Fitness.1` | I move with confidence and power. | Muevo con confianza y poder. | Me movo com confiança e poder. |
| `onboarding.setup.readAffirmations.Fitness.2` | My choices support the body I claim. | Mis elecciones sostienen el cuerpo que reclamo. | Minhas escolhas sustentam o corpo que declaro. |
| `onboarding.setup.readAffirmations.Fitness.3` | Strength looks beautiful on me. | La fuerza se ve hermosa en mí. | A força fica linda em mim. |
| `onboarding.setup.readAffirmations.Fitness.4` | I carry myself with pride. | Me porto con orgullo. | Me porto com orgulho. |
| `onboarding.setup.readAffirmations.Fitness.5` | My energy supports movement and discipline. | Mi energía sostiene el movimiento y la disciplina. | Minha energia sustenta movimento e disciplina. |
| `onboarding.setup.readAffirmations.Fitness.6` | My body responds to aligned action. | Mi cuerpo responde a la acción alineada. | Meu corpo responde à ação alinhada. |
| `onboarding.setup.readAffirmations.Fitness.7` | Progress is visible in how I move and choose. | El progreso es visible en cómo muevo y elijo. | O progresso é visível em como me movo e escolho. |
| `onboarding.setup.readAffirmations.Fitness.8` | I respect my body through what I do daily. | Respeto mi cuerpo con lo que hago cada día. | Respeito meu corpo com o que faço todos os dias. |
| `onboarding.setup.readAffirmations.Fitness.9` | I am strong, beautiful, and fully in command. | Soy fuerte, hermosa y plenamente en control. | Sou forte, linda e plenamente no controle. |
| `onboarding.setup.readAffirmations.Learning.0` | I am intelligent, prepared, and capable. | Soy inteligente, preparada y capaz. | Sou inteligente, preparada e capaz. |
| `onboarding.setup.readAffirmations.Learning.1` | I learn quickly and remember what matters. | Aprendo rápido y recuerdo lo que importa. | Aprendo rápido e lembro do que importa. |
| `onboarding.setup.readAffirmations.Learning.2` | I study with focus and confidence. | Estudio con enfoque y confianza. | Estudo com foco e confiança. |
| `onboarding.setup.readAffirmations.Learning.3` | The right answers are familiar to me. | Las respuestas correctas me son familiares. | As respostas certas me são familiares. |
| `onboarding.setup.readAffirmations.Learning.4` | My preparation shows in my results. | Mi preparación se ve en mis resultados. | Minha preparação aparece nos meus resultados. |
| `onboarding.setup.readAffirmations.Learning.5` | I perform well under pressure. | Rindo bien bajo presión. | Rendo bem sob pressão. |
| `onboarding.setup.readAffirmations.Learning.6` | My name belongs on the acceptance list. | Mi nombre pertenece a la lista de aceptación. | Meu nome pertence à lista de aceitação. |
| `onboarding.setup.readAffirmations.Learning.7` | I receive strong grades, strong outcomes, and strong opportunities. | Recibo buenas notas, buenos resultados y buenas oportunidades. | Recebo boas notas, bons resultados e boas oportunidades. |
| `onboarding.setup.readAffirmations.Learning.8` | My mind is sharp when it matters most. | Mi mente es clara cuando más importa. | Minha mente é clara quando mais importa. |
| `onboarding.setup.readAffirmations.Learning.9` | I succeed because success matches who I am. | Tengo éxito porque el éxito coincide con quien soy. | Tenho sucesso porque o sucesso coincide com quem eu sou. |
| `onboarding.setup.readAffirmations.Nutrition.0` | My life supports my energy. | Mi vida sostiene mi energía. | Minha vida sustenta minha energia. |
| `onboarding.setup.readAffirmations.Nutrition.1` | My routines nourish me. | Mis rutinas me nutren. | Minhas rotinas me nutrem. |
| `onboarding.setup.readAffirmations.Nutrition.2` | Rest, care, and renewal are part of my standard. | El descanso, el cuidado y la renovación son parte de mi estándar. | Descanso, cuidado e renovação fazem parte do meu padrão. |
| `onboarding.setup.readAffirmations.Nutrition.3` | My body and mind receive what supports them. | Mi cuerpo y mi mente reciben lo que los sostiene. | Meu corpo e minha mente recebem o que os sustenta. |
| `onboarding.setup.readAffirmations.Nutrition.4` | Peace is normal in my daily life. | La paz es normal en mi vida diaria. | A paz é normal na minha vida diária. |
| `onboarding.setup.readAffirmations.Nutrition.5` | I choose what makes me feel steady and whole. | Elijo lo que me hace sentir firme y completa. | Escolho o que me faz sentir firme e completa. |
| `onboarding.setup.readAffirmations.Nutrition.6` | My days have ease, order, and softness. | Mis días tienen facilidad, orden y suavidad. | Meus dias têm facilidade, ordem e suavidade. |
| `onboarding.setup.readAffirmations.Nutrition.7` | I care for myself with consistency. | Cuido de mí con constancia. | Cuido de mim com consistência. |
| `onboarding.setup.readAffirmations.Nutrition.8` | My energy is protected by my choices. | Mi energía está protegida por mis elecciones. | Minha energia é protegida pelas minhas escolhas. |
| `onboarding.setup.readAffirmations.Nutrition.9` | I am restored, supported, and well. | Estoy restaurada, sostenida y bien. | Estou restaurada, sustentada e bem. |
| `onboarding.setup.readAffirmations.Organization.0` | My life reflects the person I choose to be. | Mi vida refleja a la persona que elijo ser. | Minha vida reflete a pessoa que escolho ser. |
| `onboarding.setup.readAffirmations.Organization.1` | My space is clean, beautiful, and supportive. | Mi espacio es limpio, hermoso y que me sostiene. | Meu espaço é limpo, lindo e que me sustenta. |
| `onboarding.setup.readAffirmations.Organization.2` | My routines match my standards. | Mis rutinas coinciden con mis estándares. | Minhas rotinas coincidem com meus padrões. |
| `onboarding.setup.readAffirmations.Organization.3` | My choices create order. | Mis elecciones crean orden. | Minhas escolhas criam ordem. |
| `onboarding.setup.readAffirmations.Organization.4` | My environment supports my next level. | Mi entorno sostiene mi siguiente nivel. | Meu ambiente sustenta meu próximo nível. |
| `onboarding.setup.readAffirmations.Organization.5` | My days are intentional and powerful. | Mis días son intencionales y poderosos. | Meus dias são intencionais e poderosos. |
| `onboarding.setup.readAffirmations.Organization.6` | I make room for what belongs in my life. | Hago espacio para lo que pertenece a mi vida. | Faço espaço para o que pertence à minha vida. |
| `onboarding.setup.readAffirmations.Organization.7` | I take the next step with confidence. | Doy el siguiente paso con confianza. | Dou o próximo passo com confiança. |
| `onboarding.setup.readAffirmations.Organization.8` | My home, schedule, and habits support my desire. | Mi hogar, mi agenda y mis hábitos sostienen mi deseo. | Minha casa, agenda e hábitos sustentam meu desejo. |
| `onboarding.setup.readAffirmations.Organization.9` | My life matches the identity I claim. | Mi vida coincide con la identidad que reclamo. | Minha vida coincide com a identidade que declaro. |
| `onboarding.setup.readAffirmations.Productivity.0` | My attention belongs to what matters. | Mi atención pertenece a lo que importa. | Minha atenção pertence ao que importa. |
| `onboarding.setup.readAffirmations.Productivity.1` | I start quickly and continue with force. | Empiezo rápido y continúo con fuerza. | Começo rápido e continuo com força. |
| `onboarding.setup.readAffirmations.Productivity.2` | My mind is sharp, directed, and steady. | Mi mente es clara, dirigida y firme. | Minha mente é clara, direcionada e firme. |
| `onboarding.setup.readAffirmations.Productivity.3` | I give my best energy to the right work. | Doy mi mejor energía al trabajo correcto. | Dou minha melhor energia ao trabalho certo. |
| `onboarding.setup.readAffirmations.Productivity.4` | I complete important tasks with pace. | Completo tareas importantes con ritmo. | Completo tarefas importantes com ritmo. |
| `onboarding.setup.readAffirmations.Productivity.5` | Momentum is natural for me. | El momentum es natural para mí. | O momentum é natural para mim. |
| `onboarding.setup.readAffirmations.Productivity.6` | I make decisions without spiraling. | Tomo decisiones sin caer en espirales. | Tomo decisões sem cair em espirais. |
| `onboarding.setup.readAffirmations.Productivity.7` | I use my time with power. | Uso mi tiempo con poder. | Uso meu tempo com poder. |
| `onboarding.setup.readAffirmations.Productivity.8` | My focus matches my ambition. | Mi enfoque coincide con mi ambición. | Meu foco coincide com minha ambição. |
| `onboarding.setup.readAffirmations.Productivity.9` | I finish what I start. | Termino lo que empiezo. | Termino o que começo. |
| `onboarding.setup.readAffirmations.Self-Love.0` | I am beautiful, magnetic, and unforgettable. | Soy hermosa, magnética e inolvidable. | Sou linda, magnética e inesquecível. |
| `onboarding.setup.readAffirmations.Self-Love.1` | My face, body, and presence carry real power. | Mi rostro, mi cuerpo y mi presencia tienen poder real. | Meu rosto, meu corpo e minha presença têm poder real. |
| `onboarding.setup.readAffirmations.Self-Love.2` | I am admired naturally. | Soy admirada de forma natural. | Sou admirada naturalmente. |
| `onboarding.setup.readAffirmations.Self-Love.3` | I am desired with certainty. | Soy deseada con certeza. | Sou desejada com certeza. |
| `onboarding.setup.readAffirmations.Self-Love.4` | My glow is obvious in every room I enter. | Mi brillo es evidente en cada espacio que entro. | Meu brilho é evidente em cada espaço que entro. |
| `onboarding.setup.readAffirmations.Self-Love.5` | I carry myself like beauty belongs to me. | Me porto como si la belleza me perteneciera. | Me porto como se a beleza me pertencesse. |
| `onboarding.setup.readAffirmations.Self-Love.6` | My reflection matches the way I claim myself. | Mi reflejo coincide con cómo me reclamo. | Meu reflexo coincide com como eu me declaro. |
| `onboarding.setup.readAffirmations.Self-Love.7` | I take care of myself like someone precious. | Cuido de mí como a alguien preciosa. | Cuido de mim como alguém preciosa. |
| `onboarding.setup.readAffirmations.Self-Love.8` | My beauty has softness, force, and presence. | Mi belleza tiene suavidad, fuerza y presencia. | Minha beleza tem suavidade, força e presença. |
| `onboarding.setup.readAffirmations.Self-Love.9` | I am radiant in a way people remember. | Soy radiante de una forma que la gente recuerda. | Sou radiante de um jeito que as pessoas lembram. |
| `onboarding.setup.toolPreference.subtitle` | Choose the tools you want to start with. | Elige las herramientas para empezar. | Escolha as ferramentas para começar. |
| `onboarding.setup.toolPreference.title` | How do you want support? | ¿Cómo quieres recibir apoyo? | Como você quer receber apoio? |
| `onboarding.setup.toolPreferenceOptions.ai_manifestation_guidance` | AI Manifestation Guidance | Guía con IA | Guia com IA |
| `onboarding.setup.toolPreferenceOptions.belief_restructuring` | Belief Work | Creencias | Crenças |
| `onboarding.setup.toolPreferenceOptions.custom_subliminals` | Custom Subliminals | Subliminales | Subliminares |
| `onboarding.setup.toolPreferenceOptions.daily_wins_progress` | Track Consistency & Progress | Constancia y progreso | Constância e progresso |
| `onboarding.setup.toolPreferenceOptions.mirror_work_reset` | Mirror Work | Espejo | Espelho |
| `onboarding.setup.toolPreferenceOptions.powerful_affirmations` | Powerful affirmations | Afirmaciones poderosas | Afirmações poderosas |
| `onboarding.setup.tracking.body` | Palette Plotting uses app activity data to measure ad performance and improve experience. Will you help us improve Palette Plotting? | Usamos datos de actividad para medir anuncios y mejorar la app. ¿Nos ayudas? | Usamos dados de atividade para medir anúncios e melhorar o app. Você ajuda? |
| `onboarding.setup.tracking.no` | No | No | Não |
| `onboarding.setup.tracking.title` | Help us improve Palette Plotting (optional) | Ayúdanos a mejorar (opcional) | Ajude-nos a melhorar (opcional) |
| `onboarding.setup.tracking.yes` | Yes | Sí | Sim |
| `onboarding.welcome.awardLine1` | One of the most | Una de las apps | Um dos apps |
| `onboarding.welcome.awardLine2` | comprehensive | de manifestación | de manifestação |
| `onboarding.welcome.awardLine3` | manifesting apps | más completas | mais completos |
| `onboarding.welcome.ctaSubtext` | Personalize your first subliminal in less than 3 minutes | Crea tu primer subliminal en 3 minutos | Crie seu primeiro subliminar em 3 minutos |
| `onboarding.welcome.freeTrialLine` | Start your free trial | Comienza tu prueba gratis | Comece seu teste grátis |
| `onboarding.welcome.nativeDescription` | Manifest on easy mode with one solution for all core techniques. Make your own subliminals, customize your affirmations, do mirror work, and more. | Manifiesta con facilidad. Crea subliminales, personaliza afirmaciones, haz trabajo con espejo y más. | Manifeste com facilidade. Crie subliminares, personalize afirmações, faça trabalho com espelho e mais. |
| `onboarding.welcome.nativeTitle` | Your manifesting methods, in one place | Tus métodos de manifestación | Seus métodos de manifestação |
| `onboarding.welcome.signUp` | Sign Up | Registrarse | Cadastrar |
| `onboarding.welcome.toolRows.row1.0` | Subliminal Maker | Subliminales | Subliminares |
| `onboarding.welcome.toolRows.row1.1` | Robotic Affirming | Afirmaciones robóticas | Afirmações robóticas |
| `onboarding.welcome.toolRows.row1.2` | Scripting | Scripting | Scripting |
| `onboarding.welcome.toolRows.row2.0` | Mirror Work | Trabajo con espejo | Trabalho com espelho |
| `onboarding.welcome.toolRows.row2.1` | Belief Work | Creencias | Crenças |
| `onboarding.welcome.toolRows.row2.2` | Inspired Action | Acción inspirada | Ação inspirada |
| `onboarding.welcome.toolRows.row3.0` | Manifestation Lists | Listas | Listas |
| `onboarding.welcome.toolRows.row3.1` | AI Manifesting Guide | Guía con IA | Guia com IA |
| `onboarding.welcome.webHeadline1` | Manifest your desires now, | Manifiesta tus deseos ahora, | Manifeste seus desejos agora, |
| `onboarding.welcome.webHeadlineAccent` | Make your own subliminals | Crea tus subliminales | Crie seus subliminares |
| `onboarding.welcome.webSteps.desire.subtitle` | Love · SP · Beauty · Abundance · Self-concept | Amor · Belleza · Abundancia | Amor · Beleza · Abundância |
| `onboarding.welcome.webSteps.desire.title` | Choose your desire | Elige tu deseo | Escolha seu desejo |
| `onboarding.welcome.webSteps.listen.subtitle` | Your subliminals, ready to play daily | Subliminales listos para escuchar | Subliminares prontos para ouvir |
| `onboarding.welcome.webSteps.listen.title` | Listen & repeat | Escucha y repite | Ouça e repita |
| `onboarding.welcome.webSteps.makeYours.subtitle` | Your affirmations, your voice, your sounds | Tus afirmaciones, tu voz, tus sonidos | Suas afirmações, sua voz, seus sons |
| `onboarding.welcome.webSteps.makeYours.title` | Make it yours | Hazlo tuyo | Faça do seu jeito |
| `onboarding.welcome.webToolbar.mirror` | Mirror Work | Espejo | Espelho |
| `onboarding.welcome.webToolbar.more` | & More | Y más | E mais |
| `onboarding.welcome.webToolbar.robotic` | Robotic Affirming | Afirmaciones robóticas | Afirmações robóticas |
| `onboarding.welcome.webToolbar.scripting` | Scripting | Scripting | Scripting |
| `paywall.emailCollection.acceptTerms` | Please accept the Terms of Service and Privacy Policy | Acepta los Términos de servicio y la Política de privacidad | Aceite os Termos de serviço e a Política de privacidade |
| `paywall.emailCollection.appNotificationsConsent` | I consent to app notifications (optional). New tools, promotions and app news. Opt out in Settings → Notification preferences. | Acepto notificaciones de la app (opcional). Cancela en Ajustes. | Aceito notificações do app (opcional). Cancele em Configurações. |
| `paywall.emailCollection.checkingEmail` | Checking availability... | Comprobando disponibilidad... | Verificando disponibilidade... |
| `paywall.emailCollection.checkingUsername` | Checking... | Comprobando... | Verificando... |
| `paywall.emailCollection.confirmLabel` | Confirm | Confirmar | Confirmar |
| `paywall.emailCollection.confirmPlaceholder` | Re-enter | Repetir | Digite novamente |
| `paywall.emailCollection.emailLabel` | Email | Correo | E-mail |
| `paywall.emailCollection.emailMarketingConsent` | I consent to email marketing communications (optional, separate from transactional emails minimally required). Opt out in settings. | Acepto marketing por correo (opcional). Cancela en ajustes. | Aceito marketing por e-mail (opcional). Cancele nas configurações. |
| `paywall.emailCollection.emailPlaceholder` | your@email.com | tu@correo.com | seu@email.com |
| `paywall.emailCollection.emailTaken` | This email is already registered. Please sign in instead. | Este correo ya está registrado. Inicia sesión en su lugar. | Este e-mail já está cadastrado. Entre em vez disso. |
| `paywall.emailCollection.firstNameLabel` | First Name | Nombre | Nome |
| `paywall.emailCollection.firstNamePlaceholder` | First name | Nombre | Nome |
| `paywall.emailCollection.invalidEmail` | Please enter a valid email address | Ingresa un correo válido | Digite um e-mail válido |
| `paywall.emailCollection.needFirstName` | Please enter your first name | Ingresa tu nombre | Digite seu nome |
| `paywall.emailCollection.needPassword` | Please enter a password with at least 8 characters | Ingresa una contraseña de al menos 8 caracteres | Digite uma senha com pelo menos 8 caracteres |
| `paywall.emailCollection.needUsername` | Please enter a username | Ingresa un nombre de usuario | Digite um nome de usuário |
| `paywall.emailCollection.passwordLabel` | Password | Contraseña | Senha |
| `paywall.emailCollection.passwordMinLength` | Password must be at least 8 characters. | La contraseña debe tener al menos 8 caracteres. | A senha deve ter pelo menos 8 caracteres. |
| `paywall.emailCollection.passwordMismatch` | Passwords do not match. | Las contraseñas no coinciden. | As senhas não coincidem. |
| `paywall.emailCollection.passwordMismatchToast` | Passwords do not match | Las contraseñas no coinciden | As senhas não coincidem |
| `paywall.emailCollection.passwordPlaceholder` | 8+ characters | 8+ caracteres | 8+ caracteres |
| `paywall.emailCollection.privacyPolicy` | Privacy Policy | Privacidad | Privacidade |
| `paywall.emailCollection.saveFailed` | Failed to save. Please try again. | No se pudo guardar. Inténtalo de nuevo. | Falha ao salvar. Tente novamente. |
| `paywall.emailCollection.smsMarketingConsent` | I consent to SMS marketing communications (optional). Opt out in settings. Message and data rates may apply. | Acepto marketing por SMS (opcional). Cancela en ajustes. | Aceito marketing por SMS (opcional). Cancele nas configurações. |
| `paywall.emailCollection.subscriptionError` | Could not open subscription options. Try again in a moment. | No pudimos abrir las opciones de suscripción. Inténtalo en un momento. | Não foi possível abrir as opções de assinatura. Tente novamente em instantes. |
| `paywall.emailCollection.termsAcceptPrefix` | I accept the | Acepto los | Aceito os |
| `paywall.emailCollection.termsAnd` | and | y la | e a |
| `paywall.emailCollection.termsOfService` | Terms of Service | Términos de servicio | Termos de serviço |
| `paywall.emailCollection.title` | Let's Get Started | Empecemos | Vamos começar |
| `paywall.emailCollection.tryAgain` | Try again | Intentar de nuevo | Tentar novamente |
| `paywall.emailCollection.usernameLabel` | Username | Usuario | Usuário |
| `paywall.emailCollection.usernamePlaceholder` | Username | Usuario | Usuário |
| `paywall.emailCollection.usernameTaken` | This username is already taken. Please choose another. | Este usuario ya está en uso. Elige otro. | Este usuário já está em uso. Escolha outro. |
| `paywall.emailCollection.verifyEmailBlocked` | Account created, but sign-in is blocked. Please verify your email, then sign in. | Cuenta creada, pero el inicio de sesión está bloqueado. Verifica tu correo e inicia sesión. | Conta criada, mas o login está bloqueado. Verifique seu e-mail e entre. |
| `paywall.errors.billingUnavailable` | Billing unavailable; RevenueCat paywall UI is not used on this iOS version. | Facturación no disponible; la UI de paywall de RevenueCat no se usa en esta versión de iOS. | Cobrança indisponível; a UI de paywall do RevenueCat não é usada nesta versão do iOS. |
| `paywall.errors.cancelled` | Cancelled | Cancelado | Cancelado |
| `paywall.errors.checkoutFailed` | Could not complete checkout. | No se pudo completar el pago. | Não foi possível concluir o pagamento. |
| `paywall.errors.noApiKey` | No RevenueCat API key configured. | No hay clave API de RevenueCat configurada. | Nenhuma chave API do RevenueCat configurada. |
| `paywall.errors.noOfferings` | No offerings in RevenueCat. Add a default offering and paywall in the dashboard. | No hay ofertas en RevenueCat. Agrega una oferta predeterminada y paywall en el panel. | Nenhuma oferta no RevenueCat. Adicione uma oferta padrão e paywall no painel. |
| `paywall.errors.notConfigured` | RevenueCat could not be configured. | RevenueCat no se pudo configurar. | O RevenueCat não pôde ser configurado. |
| `paywall.errors.notPresented` | Not presented | No se mostró | Não exibido |
| `paywall.errors.paywallError` | Paywall error | Error de paywall | Erro no paywall |
| `paywall.errors.purchaseNotCompleted` | Purchase was not completed. | La compra no se completó. | A compra não foi concluída. |
| `paywall.errors.subscriptionNotCompleted` | Subscription was not completed. | La suscripción no se completó. | A assinatura não foi concluída. |
| `paywall.errors.unknownResultDetail` | Unknown result: {{detail}} | Resultado desconocido: {{detail}} | Resultado desconhecido: {{detail}} |
| `paywall.errors.webNotConfigured` | RevenueCat Web is not configured (missing API key). | RevenueCat Web no está configurado (falta la clave API). | RevenueCat Web não está configurado (chave API ausente). |
| `paywall.flow.couldNotOpenSubscription` | Could not open subscription options. | No se pudieron abrir las opciones de suscripción. | Não foi possível abrir as opções de assinatura. |
| `paywall.flow.openingSubscriptionsTimedOut` | Opening subscriptions timed out. Force-quit the app, reopen, and tap Continue again. | La suscripción tardó en abrir. Reinicia la app e inténtalo de nuevo. | A assinatura demorou para abrir. Reinicie a app e tente de novo. |
| `paywall.flow.paymentNotCompleted` | Payment was not completed. | El pago no se completó. | O pagamento não foi concluído. |
| `paywall.flow.signInRequiredBeforeSubscribing` | Sign in is required before subscribing. | Debes iniciar sesión antes de suscribirte. | É necessário entrar antes de assinar. |
| `paywall.flow.subscriptionAlreadyOpening` | Subscription is already opening — wait a few seconds, then try again. | La suscripción ya se está abriendo — espera unos segundos e inténtalo de nuevo. | A assinatura já está abrindo — aguarde alguns segundos e tente novamente. |
| `paywall.flow.subscriptionScreenMayBeOpening` | A subscription screen may still be opening. Wait a few seconds, then try again. If nothing changes, force-quit the app and reopen. | La pantalla de suscripción puede estar abriéndose. Espera e inténtalo de nuevo. | A tela de assinatura pode estar abrindo. Aguarde e tente de novo. |
| `paywall.legacyAndroid.closeAria` | Close | Cerrar | Fechar |
| `paywall.legacyAndroid.errorGeneric` | Something went wrong. | Algo salió mal. | Algo deu errado. |
| `paywall.legacyAndroid.errorNoSession` | No active session. Sign out, sign in, then tap Continue. | No hay sesión activa. Cierra sesión, inicia sesión y toca Continuar. | Nenhuma sessão ativa. Saia, entre novamente e toque em Continuar. |
| `paywall.legacyAndroid.errorNotAndroidApp` | Subscriptions are only available in the Android app. | Suscripciones solo en la app Android. | Assinaturas só no app Android. |
| `paywall.legacyAndroid.errorOpenFromSignup` | Open subscription from the app after sign up. | Abre la suscripción en la app tras registrarte. | Abra a assinatura no app após cadastro. |
| `paywall.legacyAndroid.errorSignInAgain` | Sign in again, then open subscription. | Inicia sesión de nuevo y abre la suscripción. | Entre novamente e abra a assinatura. |
| `paywall.legacyAndroid.errorSkippedDetail` | Use Continue on the sign-up screen, or open Account from Settings. | Usa Continuar en la pantalla de registro o abre Cuenta desde Ajustes. | Use Continuar na tela de cadastro ou abra Conta em Configurações. |
| `paywall.legacyAndroid.fallbackBody` | Tap Try again, or go back to sign up and tap Continue. | Toca Intentar de nuevo o vuelve y toca Continuar. | Toque em Tentar de novo ou volte e toque em Continuar. |
| `paywall.legacyAndroid.fallbackTitle` | We couldn't finish that step | No pudimos completar ese paso | Não conseguimos concluir essa etapa |
| `paywall.legacyAndroid.opening` | Opening… | Abriendo… | Abrindo… |
| `paywall.legacyAndroid.privacy` | Privacy | Privacidad | Privacidade |
| `paywall.legacyAndroid.subtitle` | Tap Continue to confirm your plan. | Toca Continuar para confirmar. | Toque em Continuar para confirmar. |
| `paywall.legacyAndroid.terms` | Terms / EULA | Términos / EULA | Termos / EULA |
| `paywall.legacyAndroid.title` | Unlock Your Manifestation Stack Today. | Desbloquea herramientas de manifestación. | Desbloqueie ferramentas de manifestação. |
| `paywall.legacyAndroid.tryAgain` | Try again | Intentar de nuevo | Tentar de novo |
| `paywall.legacyIos.bestAnnualValue` | Best annual value | Mejor valor anual | Melhor valor anual |
| `paywall.legacyIos.closeAria` | Close | Cerrar | Fechar |
| `paywall.legacyIos.errorGeneric` | Something went wrong. | Algo salió mal. | Algo deu errado. |
| `paywall.legacyIos.errorNoSession` | No active session. Sign out, sign in, then tap Continue. | No hay sesión activa. Cierra sesión, inicia sesión y toca Continuar. | Nenhuma sessão ativa. Saia, entre novamente e toque em Continuar. |
| `paywall.legacyIos.errorNotIosApp` | Subscriptions are only available in the iOS app. | Suscripciones solo en la app iOS. | Assinaturas só no app iOS. |
| `paywall.legacyIos.errorOpenFromSignup` | Open subscription from the app after sign up. | Abre la suscripción en la app tras registrarte. | Abra a assinatura no app após cadastro. |
| `paywall.legacyIos.errorPersist` | Something went wrong. Copy debug log from Safari if this persists. | Algo salió mal. Copia el registro de depuración desde Safari si persiste. | Algo deu errado. Copie o log de depuração do Safari se persistir. |
| `paywall.legacyIos.errorSignInAgain` | Sign in again, then open subscription. | Inicia sesión de nuevo y abre la suscripción. | Entre novamente e abra a assinatura. |
| `paywall.legacyIos.errorSkippedDetail` | Use Continue on the sign-up screen, or open Account from Settings. | Usa Continuar en registro o Cuenta en Ajustes. | Use Continuar no cadastro ou Conta em Ajustes. |
| `paywall.legacyIos.fallbackBody` | Tap Try again, or go back to sign up and tap Continue. | Toca Intentar de nuevo o vuelve y toca Continuar. | Toque em Tentar de novo ou volte e toque em Continuar. |
| `paywall.legacyIos.fallbackTitle` | We couldn't finish that step | No pudimos completar ese paso | Não conseguimos concluir essa etapa |
| `paywall.legacyIos.loadingOptions` | Loading subscription options… | Cargando opciones de suscripción… | Carregando opções de assinatura… |
| `paywall.legacyIos.monthly` | Monthly | Mensual | Mensal |
| `paywall.legacyIos.nothingToRestore` | Nothing to restore. | Nada que restaurar. | Nada para restaurar. |
| `paywall.legacyIos.onlyPerMonth` | Only {{amount}}/mo | Solo {{amount}}/mes | Apenas {{amount}}/mês |
| `paywall.legacyIos.opening` | Opening… | Abriendo… | Abrindo… |
| `paywall.legacyIos.perMonth` | {{price}}/month | {{price}}/mes | {{price}}/mês |
| `paywall.legacyIos.perWeek` | {{price}}/week | {{price}}/semana | {{price}}/semana |
| `paywall.legacyIos.perYear` | {{price}}/year | {{price}}/año | {{price}}/ano |
| `paywall.legacyIos.privacy` | Privacy | Privacidad | Privacidade |
| `paywall.legacyIos.restore` | Restore | Restaurar | Restaurar |
| `paywall.legacyIos.restoreCancelled` | Restore cancelled. | Restauración cancelada. | Restauração cancelada. |
| `paywall.legacyIos.restoreOnlyIos` | Restore is only available in the iOS app. | Restaurar solo está disponible en la app de iOS. | Restaurar está disponível apenas no app iOS. |
| `paywall.legacyIos.restorePurchases` | Restore purchases | Restaurar compras | Restaurar compras |
| `paywall.legacyIos.restoredSuccess` | Subscription restored. Welcome back! | Suscripción restaurada. ¡Bienvenido! | Assinatura restaurada. Bem-vindo! |
| `paywall.legacyIos.restoring` | Restoring… | Restaurando… | Restaurando… |
| `paywall.legacyIos.subtitle` | Choose a weekly plan to claim your free trial. | Elige el plan semanal para empezar. | Escolha o plano semanal para começar. |
| `paywall.legacyIos.terms` | Terms / EULA | Términos / EULA | Termos / EULA |
| `paywall.legacyIos.titleLine1` | Unlock your free trial | Desbloquea tu prueba gratis | Desbloqueie o teste grátis |
| `paywall.legacyIos.titleLine2` | Start manifesting | Empieza a manifestar | Comece a manifestar |
| `paywall.legacyIos.tryAgain` | Try again | Intentar de nuevo | Tentar de novo |
| `paywall.legacyIos.weekly` | Weekly | Semanal | Semanal |
| `paywall.legacyIos.yearly` | Yearly | Anual | Anual |
| `paywall.paymentProcessing.missingInfo` | Missing payment information. Please restart onboarding. | Falta información de pago. Reinicia el onboarding. | Informações de pagamento ausentes. Reinicie o onboarding. |
| `paywall.paymentProcessing.subtitle` | Please wait while we confirm your payment. This usually takes a few seconds. | Espera mientras confirmamos tu pago. Esto suele tardar unos segundos. | Aguarde enquanto confirmamos seu pagamento. Isso geralmente leva alguns segundos. |
| `paywall.paymentProcessing.title` | Processing Payment | Procesando pago | Processando pagamento |
| `paywall.paymentProcessing.verificationFailed` | Unable to verify payment. Please contact support. | No se pudo verificar el pago. Contacta a soporte. | Não foi possível verificar o pagamento. Entre em contato com o suporte. |
| `paywall.paymentProcessing.verificationSlow` | Payment verification is taking longer than expected. Please contact support. | La verificación del pago está tardando más de lo esperado. Contacta a soporte. | A verificação do pagamento está demorando mais do que o esperado. Entre em contato com o suporte. |
| `paywall.postPaywall.buildingDashboard` | Building your dashboard… | Construyendo tu panel… | Montando seu painel… |
| `paywall.postPaywall.commitmentLabel` | Say this once, out loud: | Di esto una vez, en voz alta: | Diga isto uma vez, em voz alta: |
| `paywall.postPaywall.commitmentText` | I have named what I want, and I will not abandon it when doubt shows up. I commit to giving my desire my voice, my attention, and my follow-through. I will not wait to feel ready — I will act like the person who is already on this path. What I want deserves more than a passing thought; it deserves my full yes. | He nombrado lo que quiero y no lo abandonaré cuando aparezca la duda. Le doy mi voz, atención y constancia. Actuaré como quien ya está en este camino. Lo que quiero merece mi sí completo. | Eu nomeei o que quero e não vou abandonar quando a dúvida aparecer. Dou ao meu desejo minha voz, atenção e constância. Vou agir como quem já está neste caminho. O que quero merece meu sim completo. |
| `paywall.postPaywall.finishingSubtitle` | Almost there — finishing your dashboard. | Casi listo — terminando tu panel. | Quase lá — finalizando painel. |
| `paywall.postPaywall.loadingStatusAria` | Loading status | Carga | Carregamento |
| `paywall.postPaywall.simsLines.0` | Making it official — membership locked in, overthinking not required. | Membresía confirmada — oficial. | Assinatura confirmada — oficial. |
| `paywall.postPaywall.simsLines.1` | Writing affirmations from your setup — we actually used your answers. | Creando afirmaciones con tus respuestas. | Criando afirmações com suas respostas. |
| `paywall.postPaywall.simsLines.2` | Giving your affirmations a voice — loop-friendly by design. | Dando voz a tus afirmaciones. | Dando voz às suas afirmações. |
| `paywall.postPaywall.simsLines.3` | Layering sound, whispers & theta into your starter track… | Mezclando sonido, susurros y theta… | Misturando som, sussurros e theta… |
| `paywall.postPaywall.simsLines.4` | Unlocking your dashboard — built from everything you shared, almost there. | Desbloqueando tu panel… | Desbloqueando seu painel… |
| `paywall.postPaywall.title` | Your path is ready | Tu camino está listo | Seu caminho está pronto |
| `paywall.postPaywall.toastActivateFailedAndroid` | Purchase completed, but we could not activate your plan yet. Please try again. | Compra completada, pero no pudimos activar tu plan aún. Inténtalo de nuevo. | Compra concluída, mas não conseguimos ativar seu plano ainda. Tente novamente. |
| `paywall.postPaywall.toastActivateFailedIos` | Purchase completed, but we could not activate your plan yet. Try again from subscriptions. | Compra completada, pero no pudimos activar tu plan aún. Inténtalo de nuevo desde suscripciones. | Compra concluída, mas não conseguimos ativar seu plano ainda. Tente novamente em assinaturas. |
| `paywall.postPaywall.toastSetupSnag` | We hit a snag finishing setup. Taking you to the dashboard… | Tuvimos un problema al terminar la configuración. Te llevamos al panel… | Tivemos um problema ao finalizar a configuração. Indo para o painel… |
| `paywall.webWrapper.checkoutClosed` | Checkout closed. You can subscribe anytime. | Pago cerrado. Suscríbete cuando quieras. | Pagamento cancelado. Assine quando quiser. |
| `paywall.webWrapper.checkoutFailed` | We could not open checkout. | No pudimos abrir el pago. | Não foi possível abrir o pagamento. |
| `paywall.webWrapper.close` | Close | Cerrar | Fechar |
| `paywall.webWrapper.notConfigured` | Web checkout is not configured yet. Please try again later. | Pago web no disponible. Inténtalo más tarde. | Pagamento web indisponível. Tente mais tarde. |
| `paywall.webWrapper.subscriptionNotCompleted` | Subscription not completed. | Suscripción no completada. | Assinatura não concluída. |
| `paywall.webWrapper.viewPlans` | View plans | Ver planes | Ver planos |
| `settings.billing.billingDescription` | Manage your subscription and payment methods | Administra suscripción y pagos | Gerencie assinatura e pagamentos |
| `settings.billing.billingHeading` | Billing | Facturación | Assinatura |
| `settings.billing.currentPlan` | Current Plan | Plan actual | Plano atual |
| `settings.billing.loadingOptions` | Loading billing options… | Cargando suscripciones… | Carregando assinaturas… |
| `settings.billing.manageBilling` | Manage Billing | Administrar facturación | Gerenciar assinatura |
| `settings.billing.openingPortal` | Opening billing portal… | Abriendo facturación… | Abrindo assinatura… |
| `settings.billing.planAnnual` | Annual | Anual | Anual |
| `settings.billing.planMonthly` | Monthly | Mensual | Mensal |
| `settings.billing.planWeekly` | Weekly | Semanal | Semanal |
| `settings.billing.portalHint` | Opens the customer portal to update payment or cancel your subscription. | Abre el portal para actualizar el pago o cancelar. | Abra o portal para atualizar pagamento ou cancelar. |
| `settings.billing.subscriptionHeading` | Subscription | Suscripción | Assinatura |
| `settings.deletion.cancelRequest` | Cancel deletion request | Cancelar solicitud de eliminación | Cancelar solicitação de exclusão |
| `settings.deletion.confirm1Body` | Your account and all associated data (profile, preferences, content) will be permanently deleted. You will not be able to retrieve or recover this data. This is a final decision. Do you want to continue? | Tu cuenta y datos se eliminarán permanentemente. No podrás recuperarlos. ¿Continuar? | Sua conta e dados serão excluídos permanentemente. Não será possível recuperar. Continuar? |
| `settings.deletion.confirm1Title` | Delete your account? | ¿Eliminar tu cuenta? | Excluir sua conta? |
| `settings.deletion.confirm2Body` | This is your last chance to cancel. Your account and all data will be permanently deleted and cannot be recovered. Are you sure you want to delete your account? | Última oportunidad para cancelar. Tu cuenta y datos se eliminarán. ¿Seguro? | Última chance para cancelar. Sua conta e dados serão excluídos. Tem certeza? |
| `settings.deletion.confirm2Title` | Final confirmation | Confirmación final | Confirmação final |
| `settings.deletion.deleteButton` | Delete my account | Eliminar mi cuenta | Excluir minha conta |
| `settings.deletion.deleting` | Deleting… | Eliminando… | Excluindo… |
| `settings.deletion.description` | Permanently delete your account and all associated data. This cannot be undone and your data cannot be retrieved. Deletion is scheduled 30 days after you confirm. | Elimina tu cuenta y datos. La eliminación se programa para 30 días después. | Exclui sua conta e dados. A exclusão é agendada para 30 dias depois. |
| `settings.deletion.heading` | Delete account | Eliminar cuenta | Excluir conta |
| `settings.deletion.scheduledFallback` | in 30 days | en 30 días | em 30 dias |
| `settings.deletion.scheduledPrefix` | Your account is scheduled for deletion on | Tu cuenta está programada para eliminarse el | Sua conta está programada para exclusão em |
| `settings.deletion.scheduledSuffix` | You can cancel before then. | Puedes cancelar antes de esa fecha. | Você pode cancelar antes dessa data. |
| `settings.deletion.scheduledToast` | Your account is scheduled for deletion on {{date}}. You can log in before then to cancel in Settings. | Tu cuenta está programada para eliminarse el {{date}}. Puedes iniciar sesión antes de esa fecha para cancelar en Ajustes. | Sua conta está programada para exclusão em {{date}}. Você pode entrar antes dessa data para cancelar em Configurações. |
| `settings.header` | Your Account | Tu cuenta | Sua conta |
| `settings.language.description` | Choose your app language. | Elige el idioma de la app. | Escolha o idioma do app. |
| `settings.language.heading` | Language | Idioma | Idioma |
| `settings.legal.acceptableUse` | Acceptable Use Policy | Política de uso aceptable | Política de uso aceitável |
| `settings.legal.billingRefunds` | Billing & Refunds | Facturación y reembolsos | Pagamento e reembolsos |
| `settings.legal.contact` | Contact Us | Contáctanos | Fale conosco |
| `settings.legal.dmca` | DMCA Notice & Takedown Policy | Aviso y política de retirada DMCA | Aviso e política de remoção DMCA |
| `settings.legal.eula` | End User License Agreement | Acuerdo de licencia de usuario final | Contrato de licença de usuário final |
| `settings.legal.faq` | FAQ | Preguntas frecuentes | Perguntas frequentes |
| `settings.legal.heading` | Legal & Information | Legal e información | Legal e informações |
| `settings.legal.privacy` | Privacy Policy | Política de privacidad | Política de privacidade |
| `settings.legal.terms` | Terms of Use | Términos de uso | Termos de uso |
| `settings.legalDisclaimer` |  |  |  |
| `settings.passwordValidation.digit` | Password must contain at least one digit | Incluye un número | Inclua um número |
| `settings.passwordValidation.lowercase` | Password must contain at least one lowercase letter | Incluye una minúscula | Inclua uma letra minúscula |
| `settings.passwordValidation.minLength` | Password must be at least 8 characters long | Mínimo 8 caracteres | Mínimo de 8 caracteres |
| `settings.passwordValidation.mismatch` | Passwords do not match | Las contraseñas no coinciden | As senhas não coincidem |
| `settings.passwordValidation.uppercase` | Password must contain at least one uppercase letter | Incluye una mayúscula | Inclua uma letra maiúscula |
| `settings.preferences.dataTrainingDescription` | Help improve the experience by allowing anonymized usage to be used for model training. Default is off. | Ayuda a mejorar usando datos anónimos para entrenar modelos. | Ajude a melhorar usando dados anônimos para treinar modelos. |
| `settings.preferences.dataTrainingHeading` | Data Training | Entrenamiento de datos | Treinamento de dados |
| `settings.preferences.dataTrainingLabel` | Data Training Opt-In | Permitir entrenar datos | Permitir treino de dados |
| `settings.preferences.emailDescription` | Manifestation tips, product updates, and app news by email. | Consejos, novedades y actualizaciones por correo. | Dicas, novidades e atualizações por e-mail. |
| `settings.preferences.emailHeading` | Email preferences | Preferencias de correo | Preferências de e-mail |
| `settings.preferences.emailMarketingLabel` | Email marketing | Marketing por correo | Marketing por e-mail |
| `settings.preferences.routineButtonSubtitle` | Set routine intensity & notifications | Intensidad y notificaciones | Intensidade e notificações |
| `settings.preferences.routineButtonTitle` | Routine & intensity | Rutina e intensidad | Rotina e intensidade |
| `settings.preferences.routineDescription` | Adjust your manifestation intensity, routine expectations, and routine notifications. | Ajusta intensidad, rutina y notificaciones. | Ajuste intensidade, rotina e notificações. |
| `settings.preferences.routineHeading` | Manifestation routine | Rutina de manifestación | Rotina de manifestação |
| `settings.preferences.textMarketingLabel` | Text Marketing | Marketing por SMS | Marketing por SMS |
| `settings.preferences.timeZoneLabel` | Time zone | Zona horaria | Fuso horário |
| `settings.profile.changePasswordButton` | Change Password | Cambiar contraseña | Alterar senha |
| `settings.profile.changePasswordHeading` | Change Password | Cambiar contraseña | Alterar senha |
| `settings.profile.codePlaceholder` | Enter 6-digit code | Código de 6 dígitos | Código de 6 dígitos |
| `settings.profile.confirmPasswordLabel` | Confirm New Password | Confirmar nueva contraseña | Confirmar nova senha |
| `settings.profile.confirmPasswordPlaceholder` | Confirm new password | Confirma la nueva contraseña | Confirme a nova senha |
| `settings.profile.currentPasswordLabel` | Current Password | Contraseña actual | Senha atual |
| `settings.profile.currentPasswordPlaceholder` | Enter current password | Contraseña actual | Senha atual |
| `settings.profile.emailCannotChange` | Email cannot be changed | El correo no se puede cambiar | E-mail não alterável |
| `settings.profile.emailLabel` | Email | Correo electrónico | E-mail |
| `settings.profile.nameLabel` | Name | Nombre | Nome |
| `settings.profile.namePlaceholder` | Enter your name | Ingresa tu nombre | Digite seu nome |
| `settings.profile.newPasswordLabel` | New Password | Nueva contraseña | Nova senha |
| `settings.profile.newPasswordPlaceholder` | Enter new password | Nueva contraseña | Nova senha |
| `settings.profile.newPhoneVerified` | ✓ New phone number verified | ✓ Nuevo teléfono verificado | ✓ Novo telefone verificado |
| `settings.profile.phoneLabel` | Phone Number | Número de teléfono | Número de telefone |
| `settings.profile.phonePlaceholder` | +1 (555) 123-4567 | +52 55 1234 5678 | +55 (11) 91234-5678 |
| `settings.profile.phoneVerified` | ✓ Phone number verified | ✓ Teléfono verificado | ✓ Telefone verificado |
| `settings.profile.sendCode` | Send Code | Enviar código | Enviar código |
| `settings.profile.sendingCode` | Sending... | Enviando... | Enviando... |
| `settings.profile.smsVerificationMessage` | Your verification code is: {{code}} | Tu código de verificación es: {{code}} | Seu código de verificação é: {{code}} |
| `settings.profile.updateButton` | Update Profile | Actualizar perfil | Atualizar perfil |
| `settings.profile.usernameLabel` | Username | Usuario | Nome de usuário |
| `settings.profile.usernamePlaceholder` | Enter your username | Ingresa tu usuario | Digite seu nome de usuário |
| `settings.profile.validatingPassword` | Validating password... | Validando contraseña... | Validando senha... |
| `settings.profile.verify` | Verify | Verificar | Verificar |
| `settings.profile.verifyPhoneHint` | Please verify your phone number to update it | Verifica tu número de teléfono para actualizarlo | Verifique seu número de telefone para atualizá-lo |
| `settings.routine.alerts.first` | 1st Alert | 1.ª alerta | 1.º alerta |
| `settings.routine.alerts.second` | 2nd Alert | 2.ª alerta | 2.º alerta |
| `settings.routine.alerts.single` | Alert | Alerta | Alerta |
| `settings.routine.alerts.third` | 3rd Alert | 3.ª alerta | 3.º alerta |
| `settings.routine.backAria` | Back to settings | Volver a ajustes | Voltar para configurações |
| `settings.routine.dailyTimeHeading` | Daily notifications time | Hora diaria | Horário diário |
| `settings.routine.deviceDeniedHint` | Notifications are off at the device level. Your routine and charge will still work. | Notificaciones desactivadas. Tu rutina continúa. | Notificações desativadas. Sua rotina continua. |
| `settings.routine.intensity.consistent.description` | More moderate manifesting intensity. 2x daily notifications, if selected. | Intensidad de manifestación más moderada. 2 notificaciones diarias, si las seleccionas. | Intensidade de manifestação mais moderada. 2 notificações diárias, se selecionadas. |
| `settings.routine.intensity.consistent.tagline` | For experienced manifestors. | Para manifestadores con experiencia. | Para manifestadores experientes. |
| `settings.routine.intensity.consistent.title` | Consistent | Constante | Consistente |
| `settings.routine.intensity.light.description` | Light integration of manifesting, with daily notifications, if opted into. | Integración ligera de manifestación, con notificaciones diarias, si optas por ellas. | Integração leve de manifestação, com notificações diárias, se você optar. |
| `settings.routine.intensity.light.tagline` | The recommended routine. | La rutina recomendada. | A rotina recomendada. |
| `settings.routine.intensity.light.title` | Light | Ligera | Leve |
| `settings.routine.intensity.locked_in.description` | For more intense manifesting goals. 3x daily notifications, if opted into. | Para metas de manifestación más intensas. 3 notificaciones diarias, si optas por ellas. | Para metas de manifestação mais intensas. 3 notificações diárias, se você optar. |
| `settings.routine.intensity.locked_in.tagline` | The highest-intensity routine. | La rutina de mayor intensidad. | A rotina de maior intensidade. |
| `settings.routine.intensity.locked_in.title` | Locked In | Enfocado | Focado |
| `settings.routine.intensityDescription` | Adjust your manifesting intensity | Ajusta tu intensidad de manifestación | Ajuste sua intensidade de manifestação |
| `settings.routine.intensityHeading` | Manifesting intensity | Intensidad de manifestación | Intensidade de manifestação |
| `settings.routine.itemLabels.affirmations` | Affirmations | Afirmaciones | Afirmações |
| `settings.routine.itemLabels.belief_work` | Belief work | Trabajo de creencias | Trabalho de crenças |
| `settings.routine.itemLabels.guide_check_in` | Guide check-in | Check-in con guía | Check-in com guia |
| `settings.routine.itemLabels.mirror_work` | Mirror work | Trabajo con espejo | Trabalho com espelho |
| `settings.routine.itemLabels.progress_review` | Progress review | Revisión de progreso | Revisão de progresso |
| `settings.routine.itemLabels.subliminals` | Subliminal listening | Escucha de subliminales | Escuta de subliminares |
| `settings.routine.loading` | Loading your routine… | Cargando tu rutina… | Carregando sua rotina… |
| `settings.routine.notificationsDescription` | Notifications support your routine — they nudge you back to your inspired actions at the intensity you choose. | Las notificaciones te recuerdan volver a tus acciones inspiradas. | As notificações lembram você de voltar às ações inspiradas. |
| `settings.routine.notificationsHeading` | Routine notifications | Notificaciones de rutina | Notificações de rotina |
| `settings.routine.pushRemindersLabel` | In-app & push reminders | Recordatorios y push | Lembretes e push |
| `settings.routine.saveIntensity` | Save intensity | Guardar intensidad | Salvar intensidade |
| `settings.routine.saving` | Saving… | Guardando… | Salvando… |
| `settings.routine.subtitle` | Manifesting intensity and routine notifications | Intensidad de manifestación y notificaciones de rutina | Intensidade de manifestação e notificações de rotina |
| `settings.routine.title` | Manifestation routine | Rutina de manifestación | Rotina de manifestação |
| `settings.tabs.billing` | Billing | Facturación | Assinatura |
| `settings.tabs.legal` | Legal | Legal | Legal |
| `settings.tabs.profile` | Profile | Perfil | Perfil |
| `settings.tabs.settings` | Settings | Ajustes | Configurações |
| `settings.title` | Settings | Ajustes | Configurações |
| `settings.toasts.billingLoginRequired` | Please log in to manage billing | Inicia sesión para administrar la facturación | Entre para gerenciar sua assinatura |
| `settings.toasts.codeSendFailed` | Failed to send verification code. Please try again. | No se pudo enviar el código. | Não foi possível enviar o código. |
| `settings.toasts.codeSent` | Verification code sent! | ¡Código de verificación enviado! | Código de verificação enviado! |
| `settings.toasts.dataTrainingDisabled` | Data training opt-in disabled | Entrenamiento de datos desactivado | Treinamento de dados desativado |
| `settings.toasts.dataTrainingEnabled` | Data training opt-in enabled | Entrenamiento de datos activado | Treinamento de dados ativado |
| `settings.toasts.dataTrainingError` | Error updating data training preference | Error al actualizar datos | Erro ao atualizar treino de dados |
| `settings.toasts.deletionCancelFailed` | Could not cancel. Please try again or contact support@paletteplot.com. | No se pudo cancelar. Intenta de nuevo o escribe a soporte. | Não foi possível cancelar. Tente de novo ou escreva ao suporte. |
| `settings.toasts.deletionCancelled` | Account deletion cancelled. Your account will not be deleted. | Eliminación de cuenta cancelada. Tu cuenta no se eliminará. | Exclusão da conta cancelada. Sua conta não será excluída. |
| `settings.toasts.deletionFailed` | Could not schedule account deletion. Please try again or contact support@paletteplot.com. | No se pudo programar la eliminación. Intenta de nuevo o escribe a soporte. | Não foi possível agendar a exclusão. Tente de novo ou escreva ao suporte. |
| `settings.toasts.deletionScheduled` | Your account is scheduled for deletion on {{date}}. You can log in before then to cancel in Settings. | Tu cuenta está programada para eliminarse el {{date}}. Puedes iniciar sesión antes de esa fecha para cancelar en Ajustes. | Sua conta está programada para exclusão em {{date}}. Você pode entrar antes dessa data para cancelar em Configurações. |
| `settings.toasts.emailDisabled` | Email notifications disabled | Notificaciones por correo desactivadas | Notificações por e-mail desativadas |
| `settings.toasts.emailEnabled` | Email notifications enabled | Notificaciones por correo activadas | Notificações por e-mail ativadas |
| `settings.toasts.emailPrefError` | Error: {{message}} | Error: {{message}} | Erro: {{message}} |
| `settings.toasts.enterPhone` | Please enter a phone number | Ingresa un número de teléfono | Digite um número de telefone |
| `settings.toasts.invalidCode` | Invalid code. Please try again. | Código inválido. Inténtalo de nuevo. | Código inválido. Tente novamente. |
| `settings.toasts.invalidPassword` | Invalid password | Contraseña inválida | Senha inválida |
| `settings.toasts.iosSubscriptionsHint` | Manage billing is available from your iPhone in Settings > Apple ID > Subscriptions. | Administra en iPhone: Ajustes > ID de Apple > Suscripciones. | Gerencie no iPhone: Ajustes > ID Apple > Assinaturas. |
| `settings.toasts.loginRequired` | Please log in to update preferences | Inicia sesión para actualizar las preferencias | Entre para atualizar as preferências |
| `settings.toasts.passwordUpdateError` | Error updating password | Error al actualizar la contraseña | Erro ao atualizar a senha |
| `settings.toasts.passwordUpdated` | Password updated successfully | Contraseña actualizada correctamente | Senha atualizada com sucesso |
| `settings.toasts.phoneVerified` | Phone number verified and saved! | ¡Número de teléfono verificado y guardado! | Número de telefone verificado e salvo! |
| `settings.toasts.playSubscriptionsFailed` | Could not open Google Play subscriptions. | No se pudo abrir la pantalla de suscripciones de Google Play. | Não foi possível abrir as assinaturas do Google Play. |
| `settings.toasts.portalFailed` | Could not open billing portal. Please try again. | No se pudo abrir el portal de facturación. Inténtalo de nuevo. | Não foi possível abrir o portal de assinatura. Tente novamente. |
| `settings.toasts.portalFailedFallback` | Could not open billing portal. Please try again or use the link in your subscription email. | No se pudo abrir el portal. Intenta de nuevo o usa el enlace del correo. | Não foi possível abrir o portal. Tente de novo ou use o link do e-mail. |
| `settings.toasts.profileUpdateError` | Error updating profile | Error al actualizar el perfil | Erro ao atualizar o perfil |
| `settings.toasts.profileUpdated` | Profile updated successfully | Perfil actualizado correctamente | Perfil atualizado com sucesso |
| `settings.toasts.routineIntensitySaveFailed` | Could not save your routine intensity. | No se pudo guardar tu intensidad de rutina. | Não foi possível salvar sua intensidade de rotina. |
| `settings.toasts.routineIntensitySaved` | Manifesting intensity updated | Intensidad de manifestación actualizada | Intensidade de manifestação atualizada |
| `settings.toasts.routineLoadFailed` | Could not load your routine settings. | No se pudieron cargar los ajustes de tu rutina. | Não foi possível carregar as configurações da sua rotina. |
| `settings.toasts.routineNotifDenied` | Notification permission was denied. | Se denegó el permiso de notificaciones. | A permissão de notificações foi negada. |
| `settings.toasts.routineNotifDeniedIos` | Notifications are off in iOS Settings. Enable them there, then try again. | Las notificaciones están desactivadas en Ajustes de iOS. Actívalas en Ajustes e inténtalo de nuevo. | As notificações estão desativadas nas Configurações do iOS. Ative-as lá e tente novamente. |
| `settings.toasts.routineNotifOff` | Routine notifications turned off | Notificaciones de rutina desactivadas | Notificações de rotina desativadas |
| `settings.toasts.routineNotifOn` | Routine notifications enabled | Notificaciones de rutina activadas | Notificações de rotina ativadas |
| `settings.toasts.routineNotifPermissionFailed` | Could not request notification permission. | No se pudo solicitar el permiso de notificaciones. | Não foi possível solicitar a permissão de notificações. |
| `settings.toasts.routineNotifUpdateFailed` | Could not update notification preference. | No se pudo actualizar la preferencia de notificaciones. | Não foi possível atualizar a preferência de notificações. |
| `settings.toasts.smsDisabled` | Text notifications disabled | Notificaciones por SMS desactivadas | Notificações por SMS desativadas |
| `settings.toasts.smsEnabled` | Text notifications enabled | Notificaciones por SMS activadas | Notificações por SMS ativadas |
| `settings.toasts.smsUpdateError` | Error updating SMS notification preference | Error al actualizar SMS | Erro ao atualizar SMS |
| `settings.toasts.userNotFound` | User not found | Usuario no encontrado | Usuário não encontrado |
| `settings.toasts.usernameEmpty` | Username cannot be empty | El usuario no puede estar vacío | O nome de usuário não pode estar vazio |
| `settings.toasts.usernameTaken` | Username is already taken. Please choose another. | El usuario ya está en uso. Elige otro. | O nome de usuário já está em uso. Escolha outro. |
| `settings.toasts.verifyPhoneFirst` | Please verify your new phone number before updating | Verifica tu nuevo número de teléfono antes de actualizar | Verifique seu novo número de telefone antes de atualizar |
| `support.create.backToDashboard` | Back to dashboard | Volver al panel | Voltar ao painel |
| `support.create.chooseOne` | Choose one | Elige una opción | Escolha uma opção |
| `support.create.focusLabel` | What are you manifesting right now? | ¿Qué estás manifestando ahora? | O que você está manifestando agora? |
| `support.create.focusPlaceholder` | Let us know what you are manifesting and what difficulties you're facing. | Cuéntanos qué estás manifestando y qué dificultades enfrentas. | Conte o que você está manifestando e quais dificuldades está enfrentando. |
| `support.create.footer` | Please submit what feels most relevant. Palette Plotting will aim to reply within 24 to 48 hours of your request. You may also reach out to us at support@paletteplot.com. | Envía lo que sientas más relevante. Palette Plotting intentará responder en 24 a 48 horas. También puedes escribirnos a support@paletteplot.com. | Envie o que parecer mais relevante. A Palette Plotting tentará responder em 24 a 48 horas. Você também pode nos contatar em support@paletteplot.com. |
| `support.create.helpTypeLabel` | What do you need help with? | ¿Con qué necesitas ayuda? | Com o que você precisa de ajuda? |
| `support.create.intro` | Share only what feels relevant. Palette Plotting will turn this into app-ready prompts, affirmations, or a routine. | Comparte solo lo relevante. Palette Plotting crea prompts, afirmaciones o rutina. | Compartilhe só o relevante. Palette Plotting cria prompts, afirmações ou rotina. |
| `support.create.submit` | Submit | Enviar | Enviar |
| `support.create.submitAnother` | Submit another | Enviar otro | Enviar outro |
| `support.create.submitting` | Submitting… | Enviando… | Enviando… |
| `support.create.successBody` | We'll reply by email. If you need something urgently, you can also email | Responderemos por correo. ¿Urgente? Escribe a | Responderemos por e-mail. Urgente? Escreva para |
| `support.create.successBodySuffix` | . | . | . |
| `support.create.successTitle` | Submitted. | Enviado. | Enviado. |
| `support.createHelpOptions.affirmationsOrScripting` | Affirmations or scripting | Afirmaciones o scripting | Afirmações ou scripting |
| `support.createHelpOptions.buildWeeklyRoutine` | Build a weekly routine | Armar una rutina semanal | Montar uma rotina semanal |
| `support.createHelpOptions.mirrorWorkGuidance` | Mirror work guidance | Guía de espejo | Guia de espelho |
| `support.createHelpOptions.notSureHelpMeChoose` | Not sure — help me choose | No sé — ayúdame | Não sei — me ajude |
| `support.createHelpOptions.strongSubliminal` | Make a strong subliminal | Crear un subliminal potente | Criar um subliminar forte |
| `support.inbox.backToRequests` | ← Back to requests | ← Volver a solicitudes | ← Voltar aos pedidos |
| `support.inbox.caseTypes.appSupportFeedback` | App Support & Feedback | Soporte de app | Suporte do app |
| `support.inbox.caseTypes.helpMeCreate` | Help Me Create | Ayúdame a crear | Ajude-me a criar |
| `support.inbox.description` | Your submitted requests and replies from Palette Plotting. New requests start on the other tabs. | Tus solicitudes enviadas y respuestas de Palette Plotting. Las nuevas solicitudes empiezan en las otras pestañas. | Seus pedidos enviados e respostas da Palette Plotting. Novos pedidos começam nas outras abas. |
| `support.inbox.empty` | No requests yet. Submit on Help Me Create or App Support & Feedback — replies will show up here. | Aún no hay solicitudes. Envía en otras pestañas; las respuestas aparecerán aquí. | Nenhum pedido ainda. Envie em outras abas; respostas aparecem aqui. |
| `support.inbox.loading` | Loading… | Cargando… | Carregando… |
| `support.inbox.newReplyAria` | New reply | Nueva respuesta | Nova resposta |
| `support.inbox.noMessages` | No messages yet. | Aún no hay mensajes. | Ainda não há mensagens. |
| `support.inbox.refresh` | Refresh | Actualizar | Atualizar |
| `support.inbox.replyPlaceholder` | Reply in this conversation… | Responder en esta conversación… | Responder nesta conversa… |
| `support.inbox.sendReply` | Send reply | Enviar respuesta | Enviar resposta |
| `support.inbox.senderSupport` | Palette Plotting | Palette Plotting | Palette Plotting |
| `support.inbox.senderYou` | You | Tú | Você |
| `support.inbox.sending` | Sending… | Enviando… | Enviando… |
| `support.inbox.submittedPrefix` | Submitted {{when}} | Enviado {{when}} | Enviado {{when}} |
| `support.inbox.subtypes.request` | Request | Solicitud | Pedido |
| `support.inbox.subtypes.supportRequest` | Support request | Solicitud de soporte | Pedido de suporte |
| `support.inbox.supportRepliedPrefix` | Palette Plotting replied ·  | Palette Plotting respondió ·  | Palette Plotting respondeu ·  |
| `support.inbox.title` | Inbox | Bandeja de entrada | Caixa de entrada |
| `support.inbox.todayAt` | Today at {{time}} | Hoy a las {{time}} | Hoje às {{time}} |
| `support.inbox.yesterdayAt` | Yesterday at {{time}} | Ayer a las {{time}} | Ontem às {{time}} |
| `support.inbox.yourReply` | Your reply | Tu respuesta | Sua resposta |
| `support.pageTitle` | Help Request | Solicitud de ayuda | Pedido de ajuda |
| `support.submissionTypes.aiFlag` | Flag AI-generated content | Marcar contenido generado por IA | Sinalizar conteúdo gerado por IA |
| `support.submissionTypes.featureRequest` | Feature request | Solicitud de función | Pedido de recurso |
| `support.submissionTypes.helpMeCreate` | Help Me Create | Ayúdame a crear | Ajude-me a criar |
| `support.submissionTypes.report` | Report an issue | Reportar un problema | Reportar um problema |
| `support.supportForm.appleRefundNote` | Apple ultimately controls payments and refunds; however we will try our best to help you. | Apple controla en última instancia los pagos y reembolsos; aun así haremos lo posible por ayudarte. | A Apple controla pagamentos e reembolsos; mesmo assim faremos o possível para ajudar. |
| `support.supportForm.chooseFiles` | Choose files | Elegir archivos | Escolher arquivos |
| `support.supportForm.contactFooter` | You may also reach out to us at support@paletteplot.com. | También puedes escribirnos a support@paletteplot.com. | Você também pode nos contatar em support@paletteplot.com. |
| `support.supportForm.descriptionLabel` | Describe the issue or request | Describe el problema o la solicitud | Descreva o problema ou pedido |
| `support.supportForm.descriptionPlaceholder` | What happened, what should change, or what would help? | ¿Qué pasó, qué debería cambiar o qué ayudaría? | O que aconteceu, o que deveria mudar ou o que ajudaria? |
| `support.supportForm.filesSelected_one` | {{count}} file selected | {{count}} archivo seleccionado | {{count}} arquivo selecionado |
| `support.supportForm.filesSelected_other` | {{count}} files selected | {{count}} archivos seleccionados | {{count}} arquivos selecionados |
| `support.supportForm.noFilesSelected` | No files selected | Ningún archivo seleccionado | Nenhum arquivo selecionado |
| `support.supportForm.purchaseChannelLabel` | Where did you purchase? | ¿Dónde compraste? | Onde você comprou? |
| `support.supportForm.purchaseChannelPlaceholder` | Apple App Store, Google Play, or Web | Apple App Store, Google Play o Web | Apple App Store, Google Play ou Web |
| `support.supportForm.removeFileAria` | Remove {{name}} | Quitar {{name}} | Remover {{name}} |
| `support.supportForm.screenshotsHint` | Up to {{max}} files · HEIC, JPG, PNG, WebP, etc. · max 5 MB each | Hasta {{max}} archivos · HEIC, JPG, PNG, WebP, etc. · máx. 5 MB c/u | Até {{max}} arquivos · HEIC, JPG, PNG, WebP, etc. · máx. 5 MB cada |
| `support.supportForm.screenshotsLabel` | Screenshots (optional) | Capturas (opcional) | Prints (opcional) |
| `support.supportForm.submissionTypeLabel` | Submission type | Tipo de envío | Tipo de envio |
| `support.supportForm.successBody` | We aim to respond within 24–48 hours. If you need something urgently, you can also email | Buscamos responder en 24–48 horas. Si necesitas algo con urgencia, también puedes escribir a | Buscamos responder em 24–48 horas. Se precisar de algo com urgência, você também pode escrever para |
| `support.supportForm.successBodySuffix` | . | . | . |
| `support.supportForm.successTitle` | Thanks — we received your submission. | Gracias — recibimos tu envío. | Obrigado — recebemos seu envio. |
| `support.supportForm.toolOrAreaLabel` | Tool or area | Herramienta o área | Ferramenta ou área |
| `support.supportForm.toolPlaceholder` | Where does this apply? | ¿Dónde aplica esto? | Onde isso se aplica? |
| `support.supportInbox` | Support Inbox | Bandeja de soporte | Caixa de suporte |
| `support.tabs.create` | Help Me Create | Ayúdame a crear | Ajude-me a criar |
| `support.tabs.inbox` | Inbox | Bandeja | Caixa |
| `support.tabs.support` | App Support & Feedback | Soporte | Suporte |
| `support.toasts.addMoreDetail` | Please add a bit more detail. | Agrega un poco más de detalle. | Adicione um pouco mais de detalhe. |
| `support.toasts.chooseHelpType` | Please choose what you need help with. | Elige con qué necesitas ayuda. | Escolha com o que você precisa de ajuda. |
| `support.toasts.choosePurchaseChannel` | Please select where you purchased (Apple App Store, Google Play, or Web). | Selecciona dónde compraste (Apple App Store, Google Play o Web). | Selecione onde você comprou (Apple App Store, Google Play ou Web). |
| `support.toasts.chooseSubmissionType` | Please choose a submission type. | Elige un tipo de envío. | Escolha um tipo de envio. |
| `support.toasts.chooseToolOrArea` | Please choose where this applies. | Elige dónde aplica esto. | Escolha onde isso se aplica. |
| `support.toasts.descriptionMinLength` | Please enter at least {{min}} characters in the description. | Escribe al menos {{min}} caracteres en la descripción. | Digite pelo menos {{min}} caracteres na descrição. |
| `support.toasts.fileTooLarge` | {{name}} is too large (max 5 MB per file). | {{name}} es demasiado grande (máx. 5 MB por archivo). | {{name}} é grande demais (máx. 5 MB por arquivo). |
| `support.toasts.loadConversationFailed` | Could not load conversation. | No se pudo cargar la conversación. | Não foi possível carregar a conversa. |
| `support.toasts.loadInboxFailed` | Could not load inbox. | No se pudo cargar la bandeja. | Não foi possível carregar a caixa de entrada. |
| `support.toasts.maxAttachments` | You can add up to {{max}} images. | Puedes agregar hasta {{max}} imágenes. | Você pode adicionar até {{max}} imagens. |
| `support.toasts.replySent` | Reply sent | Respuesta enviada | Resposta enviada |
| `support.toasts.requestFailed` | Request failed | La solicitud falló | Falha na solicitação |
| `support.toasts.sendReplyFailed` | Could not send reply. | No se pudo enviar la respuesta. | Não foi possível enviar a resposta. |
| `support.toasts.shareManifestationFocus` | Please share what you're trying to manifest or shift. | Comparte qué estás intentando manifestar o cambiar. | Compartilhe o que você está tentando manifestar ou mudar. |
| `support.toasts.submitted` | Submitted | Enviado | Enviado |
| `support.toasts.unsupportedImage` | {{name}} is not a supported image type. | {{name}} no es un tipo de imagen compatible. | {{name}} não é um tipo de imagem compatível. |
| `support.toasts.uploadFailed` | Image upload failed | Error al subir la imagen | Falha ao enviar a imagem |
| `tools.activity.milestones.aria.completed` | Completed | Completado | Concluído |
| `tools.activity.milestones.aria.notCompleted` | Not completed | No completado | Não concluído |
| `tools.activity.milestones.goals.addButton` | Add | Agregar | Adicionar |
| `tools.activity.milestones.goals.addPlaceholder` | Add | Agregar | Adicionar |
| `tools.activity.milestones.goals.category` | Category | Categoría | Categoria |
| `tools.activity.milestones.goals.emptyHint` | Add a desire above to get started. | Agrega un deseo arriba para empezar. | Adicione um desejo acima para começar. |
| `tools.activity.milestones.goals.emptyTitle` | No desires set for this week. | No hay deseos para esta semana. | Nenhum desejo definido para esta semana. |
| `tools.activity.milestones.goals.loading` | Loading desires... | Cargando deseos... | Carregando desejos... |
| `tools.activity.milestones.review.byCategoryTitle` | Desires by Category | Deseos por categoría | Desejos por categoria |
| `tools.activity.milestones.review.categoryCompleted` | {{completed}}/{{total}} completed | {{completed}}/{{total}} completados | {{completed}}/{{total}} concluídos |
| `tools.activity.milestones.review.completionRate` | {{pct}}% completion rate | {{pct}}% de cumplimiento | {{pct}}% de conclusão |
| `tools.activity.milestones.review.desiresAttained` | Desires Attained | Deseos alcanzados | Desejos alcançados |
| `tools.activity.milestones.review.desiresSet` | Desires Set | Deseos definidos | Desejos definidos |
| `tools.activity.milestones.review.desiresTitle` | Desires | Deseos | Desejos |
| `tools.activity.milestones.review.emptyHint` | Start your inspired actions and desire setting to see your progress here. | Empieza tus acciones inspiradas y define deseos para ver tu progreso aquí. | Comece suas ações inspiradas e defina desejos para ver seu progresso aqui. |
| `tools.activity.milestones.review.emptyTitle` | No activity recorded for this week. | No hay actividad registrada para esta semana. | Nenhuma atividade registrada para esta semana. |
| `tools.activity.milestones.review.inspiredActionsCount` | Inspired Actions completed this week | Acciones inspiradas completadas esta semana | Ações inspiradas concluídas nesta semana |
| `tools.activity.milestones.review.inspiredActionsTitle` | Inspired Actions | Acciones inspiradas | Ações inspiradas |
| `tools.activity.milestones.review.loading` | Loading weekly wins... | Cargando victorias semanales... | Carregando vitórias semanais... |
| `tools.activity.milestones.tabs.desires` | Desires | Deseos | Desejos |
| `tools.activity.milestones.tabs.inspiredActions` | Inspired Actions | Acciones | Ações |
| `tools.activity.milestones.tabs.weeklyWins` | Weekly Wins | Victorias | Vitórias |
| `tools.activity.milestones.toasts.categoryRequired` | Category Required | Categoría obligatoria | Categoria obrigatória |
| `tools.activity.milestones.toasts.deleteGoalFailed` | Failed to delete goal | No se pudo eliminar el deseo | Falha ao excluir o desejo |
| `tools.activity.milestones.toasts.error` | Error | Error | Erro |
| `tools.activity.milestones.toasts.loadGoalsFailed` | Failed to load weekly goals | No se pudieron cargar los deseos semanales | Falha ao carregar os desejos semanais |
| `tools.activity.milestones.toasts.loadHistoryFailed` | Failed to load action history. Please try again. | No se pudo cargar el historial de acciones. Inténtalo de nuevo. | Falha ao carregar o histórico de ações. Tente novamente. |
| `tools.activity.milestones.toasts.loadReviewFailed` | Failed to load week review | No se pudo cargar la revisión semanal | Falha ao carregar a revisão semanal |
| `tools.activity.milestones.toasts.saveGoalFailed` | Failed to save goal | No se pudo guardar el deseo | Falha ao salvar o desejo |
| `tools.activity.milestones.toasts.selectCategoryForGoal` | Please select a category for your goal | Selecciona una categoría para tu deseo | Selecione uma categoria para seu desejo |
| `tools.activity.milestones.toasts.updateGoalFailed` | Failed to update goal | No se pudo actualizar el deseo | Falha ao atualizar o desejo |
| `tools.activity.title` | Manifestation Milestones | Hitos de Manifestación | Marcos de Manifestação |
| `tools.affirmationViewer.autoPlay` | Auto-play | Reproducción automática | Reprodução automática |
| `tools.affirmationViewer.goToAffirmations` | Go to Affirmations | Ir a Afirmaciones | Ir para Afirmações |
| `tools.affirmationViewer.loading` | Loading affirmation set... | Cargando set... | Carregando conjunto... |
| `tools.affirmationViewer.notFound` | Affirmation set not found | Set no encontrado | Conjunto não encontrado |
| `tools.affirmationViewer.pause` | Pause | Pausar | Pausar |
| `tools.affirmationViewer.progress` | {{current}} of {{total}} | {{current}} de {{total}} | {{current}} de {{total}} |
| `tools.affirmationViewer.speed` | Speed: | Velocidad: | Velocidade: |
| `tools.affirmationVisualizer.autoplayImages` | Autoplay images | Reproducir imágenes automáticamente | Reproduzir imagens automaticamente |
| `tools.affirmationVisualizer.backToAffirmScript` | Back to Affirm & Script | Volver a Afirmar y Escribir | Voltar para Afirmar e Escrever |
| `tools.affirmationVisualizer.collapseSettings` | Collapse settings | Contraer ajustes | Recolher configurações |
| `tools.affirmationVisualizer.expandSettings` | Expand settings | Expandir ajustes | Expandir configurações |
| `tools.affirmationVisualizer.imageRhythm` | Image rhythm | Ritmo de imágenes | Ritmo das imagens |
| `tools.affirmationVisualizer.imageRhythmHint` | Time between image changes (independent of scripting). | Tiempo entre imágenes. | Tempo entre imagens. |
| `tools.affirmationVisualizer.loading` | Loading… | Cargando… | Carregando… |
| `tools.affirmationVisualizer.loadingSet` | Loading affirmation set… | Cargando set… | Carregando conjunto… |
| `tools.affirmationVisualizer.loopCounter` | Loop counter | Contador de bucles | Contador de loops |
| `tools.affirmationVisualizer.loopCounterHint` | Shows how many times this set has looped since you tapped Start. | Muestra repeticiones desde Empezar. | Mostra quantas repetições desde Começar. |
| `tools.affirmationVisualizer.loopText` | Loop text | Repetir texto | Repetir texto |
| `tools.affirmationVisualizer.loopTextHint` | When enabled, the script automatically restarts when finished. | Reinicia el guion al terminar. | Reinicia o roteiro ao terminar. |
| `tools.affirmationVisualizer.loopedAriaMany` | Looped {{count}} times this session | Se repitió {{count}} veces en esta sesión | Repetiu {{count}} vezes nesta sessão |
| `tools.affirmationVisualizer.loopedAriaOne` | Looped 1 time this session | Se repitió 1 vez en esta sesión | Repetiu 1 vez nesta sessão |
| `tools.affirmationVisualizer.loopsTitle` | Loops this session: {{count}} | Bucles en esta sesión: {{count}} | Loops nesta sessão: {{count}} |
| `tools.affirmationVisualizer.msPerChar` | {{ms}} ms/char | {{ms}} ms/car | {{ms}} ms/car |
| `tools.affirmationVisualizer.noAffirmations` | This set has no affirmations to display. | Este set no tiene afirmaciones para mostrar. | Este conjunto não tem afirmações para exibir. |
| `tools.affirmationVisualizer.notFound` | Affirmation set not found. | Set no encontrado. | Conjunto não encontrado. |
| `tools.affirmationVisualizer.scriptingSpeed` | Scripting speed | Velocidad de escritura | Velocidade da escrita |
| `tools.affirmationVisualizer.scriptingSpeedHint` | Lower = faster reveal; only affects typewriter pacing. | Menor = más rápido | Menor = mais rápido |
| `tools.affirmationVisualizer.seconds` | {{seconds}}s | {{seconds}}s | {{seconds}}s |
| `tools.affirmationVisualizer.setNotFound` | Set not found | Set no encontrado | Conjunto não encontrado |
| `tools.affirmationVisualizer.settings` | Settings | Ajustes | Configurações |
| `tools.affirmationVisualizer.settingsSubtitle` | Scripting speed, backgrounds, loops | Velocidad, fondos, bucles | Velocidade, fundos, loops |
| `tools.affirmationVisualizer.start` | Start | Empezar | Começar |
| `tools.affirmationVisualizer.subtitle` | Affirm and script your desires. | Afirma y escribe tus deseos. | Afirme e escreva seus desejos. |
| `tools.affirmationVisualizer.tapStartAfter` | to start. | para empezar. | para começar. |
| `tools.affirmationVisualizer.tapStartBefore` | Tap | Toca | Toque em |
| `tools.affirmationVisualizer.title` | Affirm & Script | Afirmar y Escribir | Afirmar e Escrever |
| `tools.affirmations.addAffirmationsFirst` | Add affirmations first to unlock image selection (max {{max}} images, one per affirmation) | Agrega afirmaciones para elegir imágenes (máx. {{max}}). | Adicione afirmações para escolher imagens (máx. {{max}}). |
| `tools.affirmations.addImages` | Add Images | Agregar imágenes | Adicionar imagens |
| `tools.affirmations.addImagesButton_one` | Add {{count}} Image | Agregar {{count}} imagen | Adicionar {{count}} imagem |
| `tools.affirmations.addImagesButton_other` | Add {{count}} Images | Agregar {{count}} imágenes | Adicionar {{count}} imagens |
| `tools.affirmations.affirmationCount_one` | {{count}} affirmation | {{count}} afirmación | {{count}} afirmação |
| `tools.affirmations.affirmationCount_other` | {{count}} affirmations | {{count}} afirmaciones | {{count}} afirmações |
| `tools.affirmations.affirmationInputPlaceholder` | Type affirmation and press Enter... | Escribe la afirmación y presiona Enter... | Digite a afirmação e pressione Enter... |
| `tools.affirmations.affirmationLimitHint` | {{current}}/10 affirmations • Press Enter to add • {{max}} characters max per line | {{current}}/10 afirmaciones • Enter para agregar • {{max}} caracteres | {{current}}/10 afirmações • Enter para adicionar • {{max}} caracteres |
| `tools.affirmations.cancel` | Cancel | Cancelar | Cancelar |
| `tools.affirmations.closeImages` | Close Images | Cerrar imágenes | Fechar imagens |
| `tools.affirmations.createNewSet` | Create New Affirmation Set | Crear set | Criar conjunto |
| `tools.affirmations.createSet` | Create set | Crear set | Criar conjunto |
| `tools.affirmations.delete` | Delete | Eliminar | Excluir |
| `tools.affirmations.deleteAffirmation` | Delete affirmation | Eliminar afirmación | Excluir afirmação |
| `tools.affirmations.deleteDialogDescription` | Are you sure you want to delete "{{name}}"? This action cannot be undone. | ¿Seguro que quieres eliminar "{{name}}"? Esta acción no se puede deshacer. | Tem certeza de que deseja excluir "{{name}}"? Esta ação não pode ser desfeita. |
| `tools.affirmations.deleteDialogTitle` | Delete Affirmation Set? | ¿Eliminar set de afirmaciones? | Excluir conjunto de afirmações? |
| `tools.affirmations.deleteSet` | Delete set | Eliminar set | Excluir conjunto |
| `tools.affirmations.editSet` | Edit Set | Editar set | Editar conjunto |
| `tools.affirmations.generateAffirmations` | Generate affirmations | Generar afirmaciones | Gerar afirmações |
| `tools.affirmations.generateAffirmationsAria` | Generate affirmations | Generar afirmaciones | Gerar afirmações |
| `tools.affirmations.generateHint` | ✨ Generate 5 affirmations based on your set name | ✨ Genera 5 afirmaciones según el nombre de tu set | ✨ Gere 5 afirmações com base no nome do seu conjunto |
| `tools.affirmations.generateSet` | Generate set | Generar set | Gerar conjunto |
| `tools.affirmations.generating` | Generating... | Generando... | Gerando... |
| `tools.affirmations.imageAlt` | Image | Imagen | Imagem |
| `tools.affirmations.imageCategories.Education` | Education | Educación | Educação |
| `tools.affirmations.imageCategories.Home` | Home | Hogar | Casa |
| `tools.affirmations.imageCategories.Mentality` | Mentality | Mentalidad | Mentalidade |
| `tools.affirmations.imageCategories.Relationships` | Relationships | Relaciones | Relacionamentos |
| `tools.affirmations.imageCategories.Travel` | Travel | Viajes | Viagem |
| `tools.affirmations.imageCategories.Uncategorized` | Uncategorized | Sin categoría | Sem categoria |
| `tools.affirmations.imageCategories.Wealth` | Wealth | Riqueza | Riqueza |
| `tools.affirmations.imageCategories.Wellness & Beauty` | Wellness & Beauty | Bienestar y belleza | Bem-estar e beleza |
| `tools.affirmations.imageCount_one` | {{count}} Image | {{count}} imagen | {{count}} imagem |
| `tools.affirmations.imageCount_other` | {{count}} Images | {{count}} imágenes | {{count}} imagens |
| `tools.affirmations.inCategory` |  in {{category}} |  en {{category}} |  em {{category}} |
| `tools.affirmations.loadMore` | Load More ({{remaining}} remaining) | Cargar más ({{remaining}} restantes) | Carregar mais ({{remaining}} restantes) |
| `tools.affirmations.loading` | Loading... | Cargando... | Carregando... |
| `tools.affirmations.loadingImages` | Loading images... | Cargando imágenes... | Carregando imagens... |
| `tools.affirmations.loadingLibrary` | Loading library... | Cargando biblioteca... | Carregando biblioteca... |
| `tools.affirmations.newSet` | New Set | Nuevo set | Novo conjunto |
| `tools.affirmations.noCustomSets` | No custom sets yet | Aún no hay sets personalizados | Nenhum conjunto personalizado ainda |
| `tools.affirmations.noImagesFound` | No images found matching your filters. | No se encontraron imágenes con tus filtros. | Nenhuma imagem encontrada com seus filtros. |
| `tools.affirmations.pageTitle` | Affirm & Script \| Palette Plotting | Afirmar y Escribir \| Palette Plotting | Afirmar e Escrever \| Palette Plotting |
| `tools.affirmations.playAffirmations` | Play Affirmations | Reproducir afirmaciones | Reproduzir afirmações |
| `tools.affirmations.premade.career.affirmations.0` | I excel in my chosen career path | Destaco en el camino profesional que elegí | Me destaco no caminho profissional que escolhi |
| `tools.affirmations.premade.career.affirmations.1` | Opportunities for growth come to me easily | Las oportunidades de crecimiento llegan a mí con facilidad | Oportunidades de crescimento chegam até mim com facilidade |
| `tools.affirmations.premade.career.affirmations.2` | I am valued and respected in my work | Mi trabajo es valorado y respetado | Meu trabalho é valorizado e respeitado |
| `tools.affirmations.premade.career.affirmations.3` | I achieve my goals with focus and determination | Logro mis metas con enfoque y determinación | Alcanço minhas metas com foco e determinação |
| `tools.affirmations.premade.career.affirmations.4` | I am a problem-solver and innovator | Resuelvo problemas e innovo con facilidad | Resolvo problemas e inovo com facilidade |
| `tools.affirmations.premade.career.affirmations.5` | Success flows from my consistent actions | El éxito fluye de mis acciones constantes | O sucesso flui das minhas ações consistentes |
| `tools.affirmations.premade.career.affirmations.6` | I lead with confidence and integrity | Lidero con confianza e integridad | Lidero com confiança e integridade |
| `tools.affirmations.premade.career.affirmations.7` | I create meaningful impact through my work | Genero un impacto significativo a través de mi trabajo | Crio impacto significativo através do meu trabalho |
| `tools.affirmations.premade.career.name` | Career & Success | Carrera y éxito | Carreira e sucesso |
| `tools.affirmations.premade.confidence.affirmations.0` | I trust myself to make good decisions | Confío en mí para tomar buenas decisiones | Confio em mim para tomar boas decisões |
| `tools.affirmations.premade.confidence.affirmations.1` | I am confident and capable in all that I do | Confío en mí y soy capaz en todo lo que hago | Sou confiante e capaz em tudo que faço |
| `tools.affirmations.premade.confidence.affirmations.2` | I embrace challenges as opportunities to grow | Abrazo los retos como oportunidades de crecer | Abraço desafios como oportunidades de crescer |
| `tools.affirmations.premade.confidence.affirmations.3` | My self-worth is inherent and unshakeable | Mi autoestima es innata e inquebrantable | Minha autoestima é inerente e inabalável |
| `tools.affirmations.premade.confidence.affirmations.4` | I speak with confidence and clarity | Hablo con confianza y claridad | Falo com confiança e clareza |
| `tools.affirmations.premade.confidence.affirmations.5` | I believe in my abilities and talents | Creo en mis habilidades y talentos | Acredito nas minhas habilidades e talentos |
| `tools.affirmations.premade.confidence.affirmations.6` | I am proud of who I am becoming | Tengo orgullo de la persona en la que me convierto | Tenho orgulho de quem estou me tornando |
| `tools.affirmations.premade.confidence.affirmations.7` | I show up as my authentic self every day | Me muestro auténticamente cada día | Me mostro autenticamente todos os dias |
| `tools.affirmations.premade.confidence.name` | Confidence & Self-Worth | Confianza y autoestima | Confiança e autoestima |
| `tools.affirmations.premade.health.affirmations.0` | I honor my body with nourishing choices | Honro mi cuerpo con decisiones nutritivas | Honro meu corpo com escolhas nutritivas |
| `tools.affirmations.premade.health.affirmations.1` | I am energetic, strong, and vibrant | Tengo energía, fuerza y vitalidad | Tenho energia, força e vitalidade |
| `tools.affirmations.premade.health.affirmations.2` | Every day I become healthier and fitter | Cada día estoy más sano y en mejor forma | A cada dia fico mais saudável e em forma |
| `tools.affirmations.premade.health.affirmations.3` | I prioritize rest and recovery | Priorizo el descanso y la recuperación | Priorizo descanso e recuperação |
| `tools.affirmations.premade.health.affirmations.4` | My mind and body are in harmony | Mi mente y mi cuerpo están en armonía | Minha mente e meu corpo estão em harmonia |
| `tools.affirmations.premade.health.affirmations.5` | I listen to my body and give it what it needs | Escucho mi cuerpo y le doy lo que necesita | Escuto meu corpo e dou o que ele precisa |
| `tools.affirmations.premade.health.affirmations.6` | I enjoy moving my body regularly | Disfruto mover mi cuerpo con regularidad | Gosto de mover meu corpo regularmente |
| `tools.affirmations.premade.health.affirmations.7` | I am grateful for my health and vitality | Agradezco mi salud y vitalidad | Sou grato pela minha saúde e vitalidade |
| `tools.affirmations.premade.health.name` | Health & Wellness | Salud y bienestar | Saúde e bem-estar |
| `tools.affirmations.premade.learning.affirmations.0` | I learn quickly and effectively | Aprendo con rapidez y eficacia | Aprendo com rapidez e eficácia |
| `tools.affirmations.premade.learning.affirmations.1` | I enjoy mastering new skills | Disfruto dominar nuevas habilidades | Gosto de dominar novas habilidades |
| `tools.affirmations.premade.learning.affirmations.2` | I turn mistakes into lessons | Convierto los errores en lecciones | Transformo erros em lições |
| `tools.affirmations.premade.learning.affirmations.3` | My curiosity drives my growth | Mi curiosidad impulsa mi crecimiento | Minha curiosidade impulsiona meu crescimento |
| `tools.affirmations.premade.learning.affirmations.4` | I retain information with ease | Retengo la información con facilidad | Retenho informações com facilidade |
| `tools.affirmations.premade.learning.affirmations.5` | I ask great questions and seek answers | Hago buenas preguntas y busco respuestas | Faço boas perguntas e busco respostas |
| `tools.affirmations.premade.learning.affirmations.6` | I am persistent and patient with learning | Soy persistente y paciente al aprender | Sou persistente e paciente ao aprender |
| `tools.affirmations.premade.learning.affirmations.7` | Learning is enjoyable and rewarding for me | Aprender es agradable y gratificante para mí | Aprender é prazeroso e gratificante para mim |
| `tools.affirmations.premade.learning.name` | Learning & Growth | Aprendizaje y crecimiento | Aprendizado e crescimento |
| `tools.affirmations.premade.love.affirmations.0` | I am worthy of deep, authentic love | Merezco un amor profundo y auténtico | Mereço um amor profundo e autêntico |
| `tools.affirmations.premade.love.affirmations.1` | I attract healthy and fulfilling relationships | Atraigo relaciones sanas y plenas | Atraio relacionamentos saudáveis e plenos |
| `tools.affirmations.premade.love.affirmations.2` | Love flows freely to and from me | El amor fluye libremente hacia mí y desde mí | O amor flui livremente para mim e de mim |
| `tools.affirmations.premade.love.affirmations.3` | I communicate my needs with kindness and clarity | Comunico mis necesidades con amabilidad y claridad | Comunico minhas necessidades com gentileza e clareza |
| `tools.affirmations.premade.love.affirmations.4` | I am surrounded by supportive, loving people | Me rodean personas amorosas que me apoyan | Estou com pessoas amorosas que me apoiam |
| `tools.affirmations.premade.love.affirmations.5` | My heart is open to give and receive love | Mi corazón está abierto para dar y recibir amor | Meu coração está aberto para dar e receber amor |
| `tools.affirmations.premade.love.affirmations.6` | I deserve respect and kindness in all relationships | Merezco respeto y amabilidad en todas mis relaciones | Mereço respeito e gentileza em todos os relacionamentos |
| `tools.affirmations.premade.love.affirmations.7` | I cultivate genuine connections every day | Cultivo conexiones genuinas cada día | Cultivo conexões genuínas todos os dias |
| `tools.affirmations.premade.love.name` | Love & Relationships | Amor y relaciones | Amor e relacionamentos |
| `tools.affirmations.premade.productivity.affirmations.0` | I focus on what matters most each day | Me enfoco en lo que más importa cada día | Foco no que mais importa a cada dia |
| `tools.affirmations.premade.productivity.affirmations.1` | I plan my work and work my plan | Planifico mi trabajo y cumplo mi plan | Planejo meu trabalho e executo meu plano |
| `tools.affirmations.premade.productivity.affirmations.2` | I make steady progress toward my goals | Avanzo de forma constante hacia mis metas | Faço progresso constante em direção às minhas metas |
| `tools.affirmations.premade.productivity.affirmations.3` | I minimize distractions and stay present | Minimizo distracciones y permanezco presente | Minimizo distrações e permaneço presente |
| `tools.affirmations.premade.productivity.affirmations.4` | I am disciplined and consistent | Soy disciplinado y constante | Sou disciplinado e consistente |
| `tools.affirmations.premade.productivity.affirmations.5` | I use my time wisely and intentionally | Uso mi tiempo con sabiduría e intención | Uso meu tempo com sabedoria e intenção |
| `tools.affirmations.premade.productivity.affirmations.6` | I finish what I start | Termino lo que empiezo | Termino o que começo |
| `tools.affirmations.premade.productivity.affirmations.7` | I celebrate small wins along the way | Celebro los pequeños logros en el camino | Celebro pequenas vitórias ao longo do caminho |
| `tools.affirmations.premade.productivity.name` | Productivity & Focus | Productividad y enfoque | Produtividade e foco |
| `tools.affirmations.premade.spiritual.affirmations.0` | I am connected to my higher purpose | Me conecto con mi propósito superior | Me conecto ao meu propósito superior |
| `tools.affirmations.premade.spiritual.affirmations.1` | I trust the guidance of my intuition | Confío en la guía de mi intuición | Confio na orientação da minha intuição |
| `tools.affirmations.premade.spiritual.affirmations.2` | I am aligned with peace and clarity | Vivo en paz y claridad | Vivo em paz e clareza |
| `tools.affirmations.premade.spiritual.affirmations.3` | I release what no longer serves me | Suelto lo que ya no me sirve | Libero o que não me serve mais |
| `tools.affirmations.premade.spiritual.affirmations.4` | I welcome growth and transformation | Recibo el crecimiento y la transformación | Recebo crescimento e transformação |
| `tools.affirmations.premade.spiritual.affirmations.5` | My spirit is grounded and expansive | Mi espíritu está arraigado y expansivo | Meu espírito está enraizado e expansivo |
| `tools.affirmations.premade.spiritual.affirmations.6` | I am open to wisdom and insight | Recibo sabiduría y perspectiva | Recebo sabedoria e insight |
| `tools.affirmations.premade.spiritual.affirmations.7` | I radiate love and compassion | Irradio amor y compasión | Irradio amor e compaixão |
| `tools.affirmations.premade.spiritual.name` | Spiritual Growth | Crecimiento espiritual | Crescimento espiritual |
| `tools.affirmations.premade.wealth.affirmations.0` | I am a money magnet and attract wealth effortlessly | Soy un imán del dinero y atraigo riqueza con facilidad | Sou um ímã de dinheiro e atraio riqueza com facilidade |
| `tools.affirmations.premade.wealth.affirmations.1` | Abundance flows to me from multiple sources | La abundancia fluye hacia mí desde múltiples fuentes | A abundância flui para mim de várias fontes |
| `tools.affirmations.premade.wealth.affirmations.2` | I am worthy of financial prosperity and success | Merezco prosperidad financiera y éxito | Mereço prosperidade financeira e sucesso |
| `tools.affirmations.premade.wealth.affirmations.3` | Money comes to me easily and frequently | El dinero llega a mí con facilidad y frecuencia | O dinheiro chega até mim com facilidade e frequência |
| `tools.affirmations.premade.wealth.affirmations.4` | I am financially free and secure | Confío en mi estabilidad financiera | Confio na minha estabilidade financeira |
| `tools.affirmations.premade.wealth.affirmations.5` | I create wealth through my talents and abilities | Creo riqueza con mis talentos y habilidades | Crio riqueza com meus talentos e habilidades |
| `tools.affirmations.premade.wealth.affirmations.6` | My income exceeds my expenses consistently | Mis ingresos superan mis gastos de forma constante | Minha renda supera minhas despesas de forma consistente |
| `tools.affirmations.premade.wealth.affirmations.7` | I make smart financial decisions with confidence | Tomo decisiones financieras inteligentes con confianza | Tomo decisões financeiras inteligentes com confiança |
| `tools.affirmations.premade.wealth.name` | Wealth & Abundance | Riqueza y abundancia | Riqueza e abundância |
| `tools.affirmations.premadeSets` | Premade Sets | Sets prediseñados | Conjuntos prontos |
| `tools.affirmations.premadeSetsSubtitle` | Ready-to-use affirmation collections for common goals | Afirmaciones listas para metas comunes | Afirmações prontas para metas comuns |
| `tools.affirmations.selectCategory` | Select Category | Seleccionar categoría | Selecionar categoria |
| `tools.affirmations.selectCategoryPlaceholder` | Select category | Seleccionar categoría | Selecionar categoria |
| `tools.affirmations.selectUpToImages_one` | Select up to {{count}} image (one per affirmation) | Selecciona hasta {{count}} imagen (una por afirmación) | Selecione até {{count}} imagem (uma por afirmação) |
| `tools.affirmations.selectUpToImages_other` | Select up to {{count}} images (one per affirmation) | Selecciona hasta {{count}} imágenes (una por afirmación) | Selecione até {{count}} imagens (uma por afirmação) |
| `tools.affirmations.selected` | Selected | Seleccionada | Selecionada |
| `tools.affirmations.selectedCount` |  • {{selected}}/{{max}} selected |  • {{selected}}/{{max}} seleccionadas |  • {{selected}}/{{max}} selecionadas |
| `tools.affirmations.setNamePlaceholder` | Enter set name (e.g., Wealth, Confidence, Love)... | Nombre del set (p. ej., Riqueza, Confianza, Amor)... | Nome do conjunto (p. ex., Riqueza, Confiança, Amor)... |
| `tools.affirmations.showingImages_one` | Showing {{visible}} of {{total}} image | Mostrando {{visible}} de {{total}} imagen | Mostrando {{visible}} de {{total}} imagem |
| `tools.affirmations.showingImages_other` | Showing {{visible}} of {{total}} images | Mostrando {{visible}} de {{total}} imágenes | Mostrando {{visible}} de {{total}} imagens |
| `tools.affirmations.storingSets` | Storing {{current}}/{{limit}} Affirmation sets | Guardando {{current}}/{{limit}} sets de afirmaciones | Armazenando {{current}}/{{limit}} conjuntos de afirmações |
| `tools.affirmations.subtitle` | Create custom affirmations or use our premade sets. | Crea afirmaciones o usa sets listos. | Crie afirmações ou use conjuntos prontos. |
| `tools.affirmations.thisSet` | this set | este set | este conjunto |
| `tools.affirmations.title` | Affirm & Script | Afirmar y Escribir | Afirmar e Escrever |
| `tools.affirmations.toasts.affirmationAdded` | Affirmation added | Afirmación agregada | Afirmação adicionada |
| `tools.affirmations.toasts.affirmationRemoved` | Affirmation removed | Afirmación eliminada | Afirmação removida |
| `tools.affirmations.toasts.blockedDefault` | This tool is temporarily unavailable due to repeated guideline violations. Access will be restored in 24 hours. | Esta herramienta no está disponible temporalmente por violaciones repetidas de las normas. El acceso se restablecerá en 24 horas. | Esta ferramenta está temporariamente indisponível devido a violações repetidas das diretrizes. O acesso será restaurado em 24 horas. |
| `tools.affirmations.toasts.cannotDeletePremade` | Cannot delete premade sets | No se pueden eliminar sets prediseñados | Não é possível excluir conjuntos prontos |
| `tools.affirmations.toasts.connectFailed` | Failed to connect to the affirmation generation service. | No se pudo conectar al servicio de generación de afirmaciones. | Falha ao conectar ao serviço de geração de afirmações. |
| `tools.affirmations.toasts.createFailed` | Failed to create set: {{message}} | No se pudo crear el set: {{message}} | Falha ao criar o conjunto: {{message}} |
| `tools.affirmations.toasts.creditsDepleted` | Credits depleted. | Créditos agotados. | Créditos esgotados. |
| `tools.affirmations.toasts.enterAffirmation` | Please enter an affirmation | Ingresa una afirmación | Digite uma afirmação |
| `tools.affirmations.toasts.enterSetName` | Please enter a set name | Ingresa un nombre para el set | Digite um nome para o conjunto |
| `tools.affirmations.toasts.generateFailed` | Failed to generate affirmations: {{message}} | No se pudieron generar afirmaciones: {{message}} | Falha ao gerar afirmações: {{message}} |
| `tools.affirmations.toasts.generatedCount` | Generated {{count}} affirmations! | ¡{{count}} afirmaciones generadas! | {{count}} afirmações geradas! |
| `tools.affirmations.toasts.genericError` | Error. Please try again. | Error. Inténtalo de nuevo. | Erro. Tente novamente. |
| `tools.affirmations.toasts.imageLibraryFailed` | Failed to load image library. Please try again. | No se pudo cargar la biblioteca de imágenes. Inténtalo de nuevo. | Falha ao carregar a biblioteca de imagens. Tente novamente. |
| `tools.affirmations.toasts.imageRemoved` | Image removed | Imagen eliminada | Imagem removida |
| `tools.affirmations.toasts.imagesAdded_one` | {{count}} image added! | ¡{{count}} imagen agregada! | {{count}} imagem adicionada! |
| `tools.affirmations.toasts.imagesAdded_other` | {{count}} images added! | ¡{{count}} imágenes agregadas! | {{count}} imagens adicionadas! |
| `tools.affirmations.toasts.loadFailed` | Failed to load affirmation sets. Please try again. | No se pudieron cargar los sets de afirmaciones. Inténtalo de nuevo. | Falha ao carregar os conjuntos de afirmações. Tente novamente. |
| `tools.affirmations.toasts.manifestLoadFailed` | Failed to load image manifest | No se pudo cargar el manifiesto de imágenes | Falha ao carregar o manifesto de imagens |
| `tools.affirmations.toasts.maxAffirmations` | Maximum 10 affirmations per set | Máximo 10 afirmaciones por set | Máximo de 10 afirmações por conjunto |
| `tools.affirmations.toasts.maxImages_one` | Maximum {{max}} image can be selected (one per affirmation) | Máximo {{max}} imagen (una por afirmación) | Máximo de {{max}} imagem (uma por afirmação) |
| `tools.affirmations.toasts.maxImages_other` | Maximum {{max}} images can be selected (one per affirmation) | Máximo {{max}} imágenes (una por afirmación) | Máximo de {{max}} imagens (uma por afirmação) |
| `tools.affirmations.toasts.migrationNeeded` | Database migration needed. Please contact support. | Se necesita una migración de base de datos. Contacta a soporte. | É necessária uma migração do banco de dados. Entre em contato com o suporte. |
| `tools.affirmations.toasts.noAffirmationsInSet` | This set has no affirmations yet | Este set aún no tiene afirmaciones | Este conjunto ainda não tem afirmações |
| `tools.affirmations.toasts.noAffirmationsReceived` | No affirmations received. Please try again. | No se recibieron afirmaciones. Inténtalo de nuevo. | Nenhuma afirmação recebida. Tente novamente. |
| `tools.affirmations.toasts.noSession` | No valid session found. Please log in and try again. | No se encontró una sesión válida. Inicia sesión e inténtalo de nuevo. | Nenhuma sessão válida encontrada. Faça login e tente novamente. |
| `tools.affirmations.toasts.permissionDenied` | Permission denied. Please ensure you are logged in and try again. | Permiso denegado. Asegúrate de haber iniciado sesión e inténtalo de nuevo. | Permissão negada. Certifique-se de estar logado e tente novamente. |
| `tools.affirmations.toasts.rateLimit` | Rate limit exceeded. Please try again in a moment. | Límite de solicitudes excedido. Inténtalo de nuevo en un momento. | Limite de solicitações excedido. Tente novamente em instantes. |
| `tools.affirmations.toasts.saveFailed` | Failed to save affirmation sets. Please try again. | No se pudieron guardar los sets de afirmaciones. Inténtalo de nuevo. | Falha ao salvar os conjuntos de afirmações. Tente novamente. |
| `tools.affirmations.toasts.selectCategory` | Please select a category | Selecciona una categoría | Selecione uma categoria |
| `tools.affirmations.toasts.setCreated` | Set created successfully | Set creado correctamente | Conjunto criado com sucesso |
| `tools.affirmations.toasts.setDeleted` | Set deleted | Set eliminado | Conjunto excluído |
| `tools.affirmations.toasts.setLimitReached` | You've reached your limit of {{limit}} custom sets for your tier. Please delete a set or upgrade to create more. | Alcanzaste el límite de {{limit}} sets personalizados de tu plan. Elimina un set o mejora tu plan para crear más. | Você atingiu o limite de {{limit}} conjuntos personalizados do seu plano. Exclua um conjunto ou faça upgrade para criar mais. |
| `tools.affirmations.toasts.unknownError` | Unknown error | Error desconocido | Erro desconhecido |
| `tools.affirmations.toasts.updateFailed` | Failed to update set: {{message}} | No se pudo actualizar el set: {{message}} | Falha ao atualizar o conjunto: {{message}} |
| `tools.affirmations.toasts.weeklyLimit` | You've reached your weekly limit of {{limit}} generated sets. Please try again next week. | Alcanzaste tu límite semanal de {{limit}} sets generados. Inténtalo la próxima semana. | Você atingiu seu limite semanal de {{limit}} conjuntos gerados. Tente novamente na próxima semana. |
| `tools.affirmations.toasts.weeklyLimitUpgrade` | You've reached your weekly limit of {{limit}} generated sets. Please try again next week or upgrade your tier. | Alcanzaste tu límite semanal de {{limit}} sets generados. Inténtalo la próxima semana o mejora tu plan. | Você atingiu seu limite semanal de {{limit}} conjuntos gerados. Tente novamente na próxima semana ou faça upgrade do seu plano. |
| `tools.affirmations.viewAffirmations` | View Affirmations | Ver afirmaciones | Ver afirmações |
| `tools.affirmations.viewTerms` | View Terms of Service | Ver Términos de servicio | Ver Termos de serviço |
| `tools.affirmations.visionBoardImageAlt` | Vision board image | Imagen de tablero de visión | Imagem do quadro de visão |
| `tools.affirmations.weeklyCount` | ({{current}}/{{limit}} this week) | ({{current}}/{{limit}} esta semana) | ({{current}}/{{limit}} esta semana) |
| `tools.affirmations.weeklyLimitReached` | You've reached your weekly limit of {{limit}} generated sets. | Alcanzaste tu límite semanal de {{limit}} sets generados. | Você atingiu seu limite semanal de {{limit}} conjuntos gerados. |
| `tools.affirmations.yourCustomSets` | Your Custom Sets | Tus sets personalizados | Seus conjuntos personalizados |
| `tools.chat.dailyLimitReached` | Daily limit reached. Your limit resets tomorrow. | Límite diario alcanzado. Tu límite se reinicia mañana. | Limite diário atingido. Seu limite reinicia amanhã. |
| `tools.chat.disclaimer` | Your Guide is an AI manifestation companion, not therapy or emergency support. If you are in crisis, contact local emergency services. | Tu Guía es un compañero de manifestación con IA, no es terapia ni apoyo de emergencia. Si estás en crisis, contacta los servicios de emergencia locales. | Seu Guia é um companheiro de manifestação com IA, não é terapia nem suporte de emergência. Se estiver em crise, contate os serviços de emergência locais. |
| `tools.chat.errors.connection` | Connection error. Check your internet and try again. | Error de conexión. Revisa tu internet e inténtalo de nuevo. | Erro de conexão. Verifique sua internet e tente novamente. |
| `tools.chat.errors.forbidden` | You do not have permission to send messages. Check your account status. | No tienes permiso para enviar mensajes. Revisa el estado de tu cuenta. | Você não tem permissão para enviar mensagens. Verifique o status da sua conta. |
| `tools.chat.errors.loadHistory` | Failed to load chat history | No se pudo cargar el historial del chat | Falha ao carregar o histórico do chat |
| `tools.chat.errors.rateLimit` | Too many requests. Wait a moment and try again. | Demasiadas solicitudes. Espera un momento e inténtalo de nuevo. | Muitas solicitações. Aguarde um momento e tente novamente. |
| `tools.chat.errors.sendFailed` | Failed to send message. Please try again. | No se pudo enviar el mensaje. Inténtalo de nuevo. | Falha ao enviar a mensagem. Tente novamente. |
| `tools.chat.errors.sessionExpired` | Your session has expired. Refresh the page and try again. | Tu sesión ha expirado. Actualiza la página e inténtalo de nuevo. | Sua sessão expirou. Atualize a página e tente novamente. |
| `tools.chat.errors.timeout` | Request timed out. Please try again. | La solicitud expiró. Inténtalo de nuevo. | A solicitação expirou. Tente novamente. |
| `tools.chat.goToEmbody` | Go to Embody | Ir a Encarnar | Ir para Encarnar |
| `tools.chat.messagesToday` | {{count}} / {{limit}} messages today | {{count}} / {{limit}} mensajes hoy | {{count}} / {{limit}} mensagens hoje |
| `tools.chat.pageTitle` | Guide Chat \| Palette Plotting | Chat con tu Guía \| Palette Plotting | Chat com seu Guia \| Palette Plotting |
| `tools.chat.placeholder` | Type your message... | Escribe tu mensaje... | Digite sua mensagem... |
| `tools.chat.selectCharacterFirst` | Select a character first to start chatting. | Selecciona un personaje primero para empezar a chatear. | Selecione um personagem primeiro para começar a conversar. |
| `tools.chat.startConversation` | Start a conversation with {{name}} | Inicia una conversación con {{name}} | Comece uma conversa com {{name}} |
| `tools.chat.system` | System | Sistema | Sistema |
| `tools.chrono.createFirstEntry` | Create your first entry | Crea tu primera entrada | Crie sua primeira entrada |
| `tools.chrono.emptyTimeline` | Your timeline is waiting to be written. | Tu línea de tiempo está esperando ser escrita. | Sua linha do tempo está esperando ser escrita. |
| `tools.chrono.form.addEntry` | Add entry | Agregar entrada | Adicionar entrada |
| `tools.chrono.form.creating` | Creating... | Creando... | Criando... |
| `tools.chrono.form.date` | Date | Fecha | Data |
| `tools.chrono.form.dayExperienceQuestion` | (2) How did you experience the day? * | (2) ¿Cómo viviste el día? * | (2) Como você viveu o dia? * |
| `tools.chrono.form.delete` | Delete | Eliminar | Excluir |
| `tools.chrono.form.deleteDescription` | Are you sure you want to delete this entry? This action cannot be undone. | ¿Seguro que quieres eliminar esta entrada? Esta acción no se puede deshacer. | Tem certeza de que deseja excluir esta entrada? Esta ação não pode ser desfeita. |
| `tools.chrono.form.deleteEntry` | Delete entry | Eliminar entrada | Excluir entrada |
| `tools.chrono.form.deleteTitle` | Delete entry | Eliminar entrada | Excluir entrada |
| `tools.chrono.form.deleting` | Deleting... | Eliminando... | Excluindo... |
| `tools.chrono.form.editEntry` | Edit entry | Editar entrada | Editar entrada |
| `tools.chrono.form.env3dQuestion` | (1) How was the 3D (external environment) today? * | (1) ¿Cómo estuvo el 3D (entorno externo) hoy? * | (1) Como estava o 3D (ambiente externo) hoje? * |
| `tools.chrono.form.mood.good` | Good | Bien | Bom |
| `tools.chrono.form.mood.neutral` | Neutral | Neutro | Neutro |
| `tools.chrono.form.mood.rough` | Rough or heavy | Difícil o pesado | Difícil ou pesado |
| `tools.chrono.form.newEntry` | New entry | Nueva entrada | Nova entrada |
| `tools.chrono.form.pickDate` | Pick a date | Elige una fecha | Escolha uma data |
| `tools.chrono.form.textPlaceholder` | Tell your timeline what happened today... | Cuéntale a tu línea de tiempo qué pasó hoy... | Conte à sua linha do tempo o que aconteceu hoje... |
| `tools.chrono.form.titleLabel` | Title * | Título * | Título * |
| `tools.chrono.form.titlePlaceholder` | Give your entry a title... | Ponle un título a tu entrada... | Dê um título à sua entrada... |
| `tools.chrono.form.toast.authRequired` | Authentication required | Autenticación requerida | Autenticação necessária |
| `tools.chrono.form.toast.authRequiredDesc` | Please log in to create entries. | Inicia sesión para crear entradas. | Faça login para criar entradas. |
| `tools.chrono.form.toast.createFailed` | Failed to create entry. Please try again. | No se pudo crear la entrada. Inténtalo de nuevo. | Falha ao criar a entrada. Tente novamente. |
| `tools.chrono.form.toast.deleteFailed` | Failed to delete entry. Please try again. | No se pudo eliminar la entrada. Inténtalo de nuevo. | Falha ao excluir a entrada. Tente novamente. |
| `tools.chrono.form.toast.entryRequired` | Entry required | Entrada obligatoria | Entrada obrigatória |
| `tools.chrono.form.toast.entryRequiredDesc` | Write something for your timeline. | Escribe algo para tu línea de tiempo. | Escreva algo para sua linha do tempo. |
| `tools.chrono.form.toast.error` | Error | Error | Erro |
| `tools.chrono.form.toast.noSession` | No valid session found. Please log in and try again. | No se encontró una sesión válida. Inicia sesión e inténtalo de nuevo. | Nenhuma sessão válida encontrada. Faça login e tente novamente. |
| `tools.chrono.form.toast.permissionDenied` | Permission denied | Permiso denegado | Permissão negada |
| `tools.chrono.form.toast.permissionDeniedDesc` | Please ensure you are logged in and try again. | Asegúrate de haber iniciado sesión e inténtalo de nuevo. | Certifique-se de estar logado e tente novamente. |
| `tools.chrono.form.toast.reflectionIncomplete` | Reflection incomplete | Reflexión incompleta | Reflexão incompleta |
| `tools.chrono.form.toast.reflectionIncompleteDesc` | Answer both questions using the faces below. | Responde ambas preguntas usando las caras de abajo. | Responda às duas perguntas usando as carinhas abaixo. |
| `tools.chrono.form.toast.titleRequired` | Title required | Título obligatorio | Título obrigatório |
| `tools.chrono.form.toast.titleRequiredDesc` | Give your entry a title. | Ponle un título a tu entrada. | Dê um título à sua entrada. |
| `tools.chrono.form.update` | Update | Actualizar | Atualizar |
| `tools.chrono.form.updating` | Updating... | Actualizando... | Atualizando... |
| `tools.chrono.form.whatHappened` | What happened? * | ¿Qué pasó? * | O que aconteceu? * |
| `tools.chrono.loadingTimeline` | Loading your timeline... | Cargando tu línea de tiempo... | Carregando sua linha do tempo... |
| `tools.chrono.timeline.dayExperience` | How you experienced the day: | Cómo viviste el día: | Como você viveu o dia: |
| `tools.chrono.timeline.dayExperienceAria` | Day was experienced as {{rating}} | El día se vivió como {{rating}} | O dia foi vivido como {{rating}} |
| `tools.chrono.timeline.description` | Reflect on your growth and development. | Reflexiona sobre tu crecimiento y desarrollo. | Reflita sobre seu crescimento e desenvolvimento. |
| `tools.chrono.timeline.editEntry` | Edit entry | Editar entrada | Editar entrada |
| `tools.chrono.timeline.env3d` | 3D (environment): | 3D (entorno): | 3D (ambiente): |
| `tools.chrono.timeline.env3dAria` | 3D environment felt {{rating}} | El entorno 3D se sintió {{rating}} | O ambiente 3D pareceu {{rating}} |
| `tools.chrono.timeline.newEntry` | New entry | Nueva entrada | Nova entrada |
| `tools.chrono.timeline.no` | No | No | Não |
| `tools.chrono.timeline.showLess` | Show less | Mostrar menos | Mostrar menos |
| `tools.chrono.timeline.showMore` | Show more | Mostrar más | Mostrar mais |
| `tools.chrono.timeline.winToday` | Win today: | Victoria hoy: | Vitória hoje: |
| `tools.chrono.timeline.yes` | Yes | Sí | Sim |
| `tools.chrono.title` | Manifestation Journal | Diario de Manifestación | Diário de Manifestação |
| `tools.demo.affirmations.maxAffirmations` | Maximum 5 affirmations for this demo | Máximo 5 afirmaciones para esta demo | Máximo de 5 afirmações para esta demo |
| `tools.demo.affirmations.walkthrough.chooseImages.message` | Click the image button to select images for your affirmations. Choose 5 images from the 10 available options. Subscriber library has 50+ images. | Toca el botón de imagen para seleccionar imágenes para tus afirmaciones. Elige 5 imágenes de las 10 opciones disponibles. La biblioteca de suscriptores tiene más de 50 imágenes. | Toque no botão de imagem para selecionar imagens para suas afirmações. Escolha 5 imagens das 10 opções disponíveis. A biblioteca de assinantes tem mais de 50 imagens. |
| `tools.demo.affirmations.walkthrough.chooseImages.title` | Choose Your Vision Board Images | Elige imágenes del tablero | Escolha imagens do quadro |
| `tools.demo.affirmations.walkthrough.createSet.message` | Click 'New Set' to create your affirmation set. Name it and select a category. | Toca "Nuevo set" para crear tu set de afirmaciones. Ponle nombre y selecciona una categoría. | Toque em "Novo conjunto" para criar seu conjunto de afirmações. Dê um nome e selecione uma categoria. |
| `tools.demo.affirmations.walkthrough.createSet.title` | Create Your First Set | Crea tu primer set | Crie seu primeiro conjunto |
| `tools.demo.affirmations.walkthrough.play.message` | Click the Play button to view your affirmation set with images. | Toca Reproducir para ver tu set de afirmaciones con imágenes. | Toque em Reproduzir para ver seu conjunto de afirmações com imagens. |
| `tools.demo.affirmations.walkthrough.play.title` | View Your Set | Mira tu set | Veja seu conjunto |
| `tools.demo.affirmations.walkthrough.saveImages.message` | Click the Save button to add your selected images to your affirmation set. | Toca Guardar para agregar las imágenes seleccionadas a tu set de afirmaciones. | Toque em Salvar para adicionar as imagens selecionadas ao seu conjunto de afirmações. |
| `tools.demo.affirmations.walkthrough.saveImages.title` | Save Your Images | Guarda tus imágenes | Salve suas imagens |
| `tools.demo.affirmations.walkthrough.writeAffirmations.message` | Click the edit button and type your affirmations. Press Enter to add each one. You can add up to 5 affirmations. | Toca el botón de editar y escribe tus afirmaciones. Presiona Enter para agregar cada una. Puedes agregar hasta 5 afirmaciones. | Toque no botão de editar e digite suas afirmações. Pressione Enter para adicionar cada uma. Você pode adicionar até 5 afirmações. |
| `tools.demo.affirmations.walkthrough.writeAffirmations.title` | Write Your Affirmations | Escribe tus afirmaciones | Escreva suas afirmações |
| `tools.demo.subliminal.emailNotFoundForFeedback` | We couldn't find your email for this feedback. | No encontramos tu correo para este comentario. | Não encontramos seu e-mail para este feedback. |
| `tools.demo.subliminal.feedbackSubmitFailed` | Failed to submit feedback. Please try again. | No se pudo enviar el comentario. Inténtalo de nuevo. | Falha ao enviar feedback. Tente novamente. |
| `tools.demo.subliminal.generateTrackFailed` | Failed to generate track | No se pudo generar la pista | Falha ao gerar a faixa |
| `tools.demo.subliminal.maxTrackLengthDemo` | Maximum track length is 1 minute for the demo. | La duración máxima de pista es 1 minuto para la demo. | A duração máxima da faixa é 1 minuto para a demo. |
| `tools.demo.subliminal.micAccessFailed` | Failed to access microphone. Please check permissions. | No se pudo acceder al micrófono. Revisa los permisos. | Falha ao acessar o microfone. Verifique as permissões. |
| `tools.demo.subliminal.playTrackFailed` | Failed to play track | No se pudo reproducir la pista | Falha ao reproduzir a faixa |
| `tools.demo.subliminal.recordingSavedCustomize` | Recording saved! Now customize your track settings below. | ¡Grabación guardada! Ahora personaliza los ajustes de tu pista abajo. | Gravação salva! Agora personalize as configurações da sua faixa abaixo. |
| `tools.demo.subliminal.trackGenerated` | Track generated successfully! | ¡Pista generada correctamente! | Faixa gerada com sucesso! |
| `tools.demo.subliminal.walkthrough.customize.message` | Now customize your subliminal track settings. Theta wave and Ocean sound are pre-selected for this demo. Adjust volumes, layers, and track length, then click 'Create Track' to generate your audio. | Personaliza tu pista subliminal. Theta y Ocean vienen preseleccionados. Ajusta volumen, capas y duración, luego toca Crear pista. | Personalize sua faixa subliminar. Theta e Ocean vêm pré-selecionados. Ajuste volumes, camadas e duração, depois toque em Criar faixa. |
| `tools.demo.subliminal.walkthrough.customize.title` | Customize Your Track | Personaliza tu pista | Personalize sua faixa |
| `tools.demo.subliminal.walkthrough.feedback.message` | What stopped you from signing up today? | ¿Qué te impidió registrarte hoy? | O que impediu você de se cadastrar hoje? |
| `tools.demo.subliminal.walkthrough.feedback.title` | Share Your Feedback | Comparte tu opinión | Compartilhe seu feedback |
| `tools.demo.subliminal.walkthrough.play.message` | Your track is ready! Click the Play button to listen to your subliminal audio. | ¡Tu pista está lista! Toca Reproducir para escuchar tu audio subliminal. | Sua faixa está pronta! Toque em Reproduzir para ouvir seu áudio subliminar. |
| `tools.demo.subliminal.walkthrough.play.title` | Play Track | Reproducir pista | Reproduzir faixa |
| `tools.demo.subliminal.walkthrough.record.message` | Choose Freestyle or Karaoke mode to record your affirmations. Text-to-Speech is available for paid subscribers. | Elige el modo Freestyle o Karaoke para grabar tus afirmaciones. La función de texto a voz está disponible para suscriptores de pago. | Escolha o modo Freestyle ou Karaoke para gravar suas afirmações. A função de texto para fala está disponível para assinantes pagos. |
| `tools.demo.subliminal.walkthrough.record.title` | Record Your Affirmations | Graba tus afirmaciones | Grave suas afirmações |
| `tools.demo.subliminal.walkthrough.signup.actionText` | Sign Up | Registrarse | Cadastrar-se |
| `tools.demo.subliminal.walkthrough.signup.message` | You're seeing less than 15% of the app in this demo. Get enhanced access to the subliminal maker, Mirror Work, momentum/goal & habit tracking, and other interactive manifestation tools. | En esta demo ves menos del 15% de la app. Desbloquea subliminales, espejo, metas, hábitos y más herramientas. | Nesta demo você vê menos de 15% do app. Desbloqueie subliminares, espelho, metas, hábitos e outras ferramentas. |
| `tools.demo.subliminal.walkthrough.signup.secondaryActionText` | Not ready yet, share feedback | Aún no, dar feedback | Ainda não, dar feedback |
| `tools.demo.subliminal.walkthrough.signup.title` | Enjoying it? Get Access to More. | ¿Te gusta? Accede a más. | Gostou? Tenha acesso a mais. |
| `tools.demo.subliminal.walkthrough.thankYou.message` | We appreciate your feedback and will use it to improve Palette Plotting. | Agradecemos tu comentario y lo usaremos para mejorar Palette Plotting. | Agradecemos seu feedback e vamos usá-lo para melhorar o Palette Plotting. |
| `tools.demo.subliminal.walkthrough.thankYou.title` | Thank you! | ¡Gracias! | Obrigado! |
| `tools.double.choose.addToCalendar` | Add to calendar | Agregar al calendario | Adicionar ao calendário |
| `tools.double.choose.addToCalendarDesc` | Weekly start and close alerts using your calendar. | Alertas semanales de inicio y cierre usando tu calendario. | Alertas semanais de início e encerramento usando seu calendário. |
| `tools.double.choose.advanced` | Advanced | Avanzado | Avançado |
| `tools.double.choose.ariaNotSelected` | {{label}}, not selected | {{label}}, no seleccionado | {{label}}, não selecionado |
| `tools.double.choose.ariaSelected` | {{label}}, selected | {{label}}, seleccionado | {{label}}, selecionado |
| `tools.double.choose.changeDoubleDescription` | Change from {{from}} to {{to}}? | ¿Cambiar de {{from}} a {{to}}? | Mudar de {{from}} para {{to}}? |
| `tools.double.choose.changeDoubleTitle` | Change your double? | ¿Cambiar tu doble? | Mudar seu duplo? |
| `tools.double.choose.chooseGuide` | Choose your guide | Elige tu guía | Escolha um guia |
| `tools.double.choose.chooseGuideSubtitle` | Select a character to be your daily guide | Elige quién te acompaña cada día | Escolha quem te acompanha todo dia |
| `tools.double.choose.confirm` | Confirm | Confirmar | Confirmar |
| `tools.double.choose.dailyPracticeChoices` | Inspired Action choices | Acciones inspiradas | Ações inspiradas |
| `tools.double.choose.dailyPracticeSubtitle` | Choose exactly five—they become your Inspired Actions on your dashboard. | Elige cinco. Cámbialas cuando quieras. | Escolha cinco. Troque quando quiser. |
| `tools.double.choose.deviceAutomation` | Device automation | Automatización del dispositivo | Automação do dispositivo |
| `tools.double.choose.deviceAutomationDesc` | Use iPhone Shortcuts or Android routines to open your weekly summary. | Usa Atajos de iPhone o rutinas de Android para abrir tu resumen semanal. | Use Atalhos do iPhone ou rotinas do Android para abrir seu resumo semanal. |
| `tools.double.choose.practices.clean` | Clean and organize environment | Limpiar y organizar el entorno | Limpar e organizar o ambiente |
| `tools.double.choose.practices.connect` | Connect with others | Conectar con otros | Conectar com outros |
| `tools.double.choose.practices.drinkWater` | Nutrition | Nutrición | Nutrição |
| `tools.double.choose.practices.exercise` | Exercise | Ejercicio | Exercício |
| `tools.double.choose.practices.glamUp` | Glam up | Arreglarse | Caprichar |
| `tools.double.choose.practices.haveFun` | Have fun | Divertirse | Divertir-se |
| `tools.double.choose.practices.rest` | Rest and relax | Descansar y relajarse | Descansar e relaxar |
| `tools.double.choose.practices.seen` | Be seen and visible. | Ser visto y visible | Ser visto e visível |
| `tools.double.choose.practices.selfCare` | Self-care | Autocuidado | Autocuidado |
| `tools.double.choose.practices.work` | Work or study | Trabajar o estudiar | Trabalhar ou estudar |
| `tools.double.choose.practicesShort.clean` | Clean | Orden | Limpo |
| `tools.double.choose.practicesShort.connect` | Connect | Gente | Gente |
| `tools.double.choose.practicesShort.drinkWater` | Water | Agua | Água |
| `tools.double.choose.practicesShort.exercise` | Move | Mover | Mover |
| `tools.double.choose.practicesShort.glamUp` | Glam Up | Glam | Glam |
| `tools.double.choose.practicesShort.haveFun` | Fun | Juego | Lazer |
| `tools.double.choose.practicesShort.rest` | Rest | Pausa | Pausa |
| `tools.double.choose.practicesShort.seen` | Seen | Visto | Visto |
| `tools.double.choose.practicesShort.selfCare` | Care | Cuida | Cuida |
| `tools.double.choose.practicesShort.work` | Work | Metas | Metas |
| `tools.double.choose.recommended` | Recommended | Recomendado | Recomendado |
| `tools.double.choose.selectedCount` | {{count}} of 5 selected | {{count}} de 5 seleccionadas | {{count}} de 5 selecionadas |
| `tools.double.choose.settings` | Settings | Ajustes | Configurações |
| `tools.double.choose.themes.career` | Career | Carrera | Carreira |
| `tools.double.choose.themes.finance` | Finance | Finanzas | Finanças |
| `tools.double.choose.themes.fitness` | Fitness | Fitness | Fitness |
| `tools.double.choose.themes.identity` | Identity | Identidad | Identidade |
| `tools.double.choose.themes.love` | Love | Amor | Amor |
| `tools.double.choose.themes.selfConcept` | Self-concept | Autoconcepto | Autoconceito |
| `tools.double.choose.themes.selfImage` | Self-image | Autoimagen | Autoimagem |
| `tools.double.choose.themes.transitions` | Transitions | Transiciones | Transições |
| `tools.double.choose.toast.calendarDownloaded` | Calendar file downloaded. Import it in your calendar app. | Archivo de calendario descargado. Impórtalo en tu app de calendario. | Arquivo de calendário baixado. Importe-o no seu app de calendário. |
| `tools.double.choose.toast.calendarFailed` | Failed to generate calendar file. Please try again. | No se pudo generar el archivo de calendario. Inténtalo de nuevo. | Falha ao gerar o arquivo de calendário. Tente novamente. |
| `tools.double.choose.toast.downloaded` | Downloaded | Descargado | Baixado |
| `tools.double.choose.toast.error` | Error | Error | Erro |
| `tools.double.choose.toast.saveFailed` | Failed to save choices. Please try again. | No se pudieron guardar las elecciones. Inténtalo de nuevo. | Não foi possível salvar as escolhas. Tente novamente. |
| `tools.double.choose.viewSetupSteps` | View setup steps | Ver pasos de configuración | Ver passos de configuração |
| `tools.double.choose.weeklyCheckIn` | Weekly check-in | Revisión semanal | Check-in semanal |
| `tools.double.choose.weeklyCheckInSubtitle` | Choose how you want to reach your weekly check-in. You can change it anytime. | Elige cómo quieres llegar a tu revisión semanal. Puedes cambiarlo cuando quieras. | Escolha como quer chegar ao seu check-in semanal. Você pode mudar isso a qualquer momento. |
| `tools.double.choose.yourCurrentCharacter` | your current character | tu personaje actual | seu personagem atual |
| `tools.double.embody.changeCharacter` | Change character | Cambiar personaje | Mudar personagem |
| `tools.double.embody.confirmAction` | Confirm action | Confirmar acción | Confirmar ação |
| `tools.double.embody.confirmQuestions.clean` | Did you clean a space today? | ¿Limpiaste u organizaste un espacio hoy? | Você limpou ou organizou um espaço hoje? |
| `tools.double.embody.confirmQuestions.connect` | Did you connect with people, nature, or animals today? | ¿Te conectaste con personas, la naturaleza o animales hoy? | Você se conectou com pessoas, a natureza ou animais hoje? |
| `tools.double.embody.confirmQuestions.drinkWater` | Did you drink water? | ¿Bebiste agua? | Você bebeu água? |
| `tools.double.embody.confirmQuestions.exercise` | Did you exercise? | ¿Hiciste ejercicio? | Você se exercitou? |
| `tools.double.embody.confirmQuestions.glamUp` | Did you glam up or celebrate your beauty today? | ¿Te arreglaste o celebraste tu belleza hoy? | Você se arrumou ou celebrou sua beleza hoje? |
| `tools.double.embody.confirmQuestions.haveFun` | Did you do something fun today? | ¿Hiciste algo divertido hoy? | Você fez algo divertido hoje? |
| `tools.double.embody.confirmQuestions.rest` | Did you rest? | ¿Descansaste? | Você descansou? |
| `tools.double.embody.confirmQuestions.seen` | Did you practice being seen (online or in person) today? | ¿Practicaste ser visto/a (en línea o en persona) hoy? | Você praticou ser visto/a (online ou pessoalmente) hoje? |
| `tools.double.embody.confirmQuestions.selfCare` | Did you do some self-care? | ¿Hiciste algo de autocuidado? | Você fez algum autocuidado? |
| `tools.double.embody.confirmQuestions.work` | Did you make career or academic progress today? | ¿Avanzaste en tu carrera o estudios hoy? | Você progrediu na carreira ou nos estudos hoje? |
| `tools.double.embody.dailyPower` | Daily power: {{percent}}% | Poder diario: {{percent}}% | Poder diário: {{percent}}% |
| `tools.double.embody.dailyPracticeTracking` | Inspired Actions & weekly wins | Acciones y victorias semanales | Ações e vitórias semanais |
| `tools.double.embody.metaDescription` | Track daily progress as you embody your new story and get your desires. | Sigue el progreso diario al encarnar tu nueva historia y obtener tus deseos. | Acompanhe o progresso diário ao encarnar sua nova história e obter seus desejos. |
| `tools.double.embody.no` | No | No | Não |
| `tools.double.embody.pageTitle` | Embody \| Palette Plotting | Encarnar \| Palette Plotting | Encarnar \| Palette Plotting |
| `tools.double.embody.subtitle` | Track daily progress as you embody your new story. | Sigue el progreso diario al encarnar tu nueva historia. | Acompanhe o progresso diário ao encarnar sua nova história. |
| `tools.double.embody.title` | Embody | Encarnar | Encarnar |
| `tools.double.embody.toast.authRequired` | Authentication required | Autenticación requerida | Autenticação necessária |
| `tools.double.embody.toast.error` | Error | Error | Erro |
| `tools.double.embody.toast.loadHistoryFailed` | Failed to load action history. Please try again. | No se pudo cargar el historial de acciones. Inténtalo de nuevo. | Falha ao carregar o histórico de ações. Tente novamente. |
| `tools.double.embody.toast.loadProgressFailed` | Failed to load daily progress. Please try again. | No se pudo cargar el progreso diario. Inténtalo de nuevo. | Falha ao carregar o progresso diário. Tente novamente. |
| `tools.double.embody.toast.mustBeLoggedInActions` | You must be logged in to save actions. | Debes iniciar sesión para guardar acciones. | Você precisa estar logado para salvar ações. |
| `tools.double.embody.toast.mustBeLoggedInProgress` | You must be logged in to save progress. | Debes iniciar sesión para guardar el progreso. | Você precisa estar logado para salvar o progresso. |
| `tools.double.embody.toast.noSession` | No valid session found. Please log in and try again. | No se encontró una sesión válida. Inicia sesión e inténtalo de nuevo. | Nenhuma sessão válida encontrada. Faça login e tente novamente. |
| `tools.double.embody.toast.permissionDenied` | Permission denied | Permiso denegado | Permissão negada |
| `tools.double.embody.toast.permissionDeniedDesc` | Please ensure you are logged in and try again. | Asegúrate de haber iniciado sesión e inténtalo de nuevo. | Certifique-se de estar logado e tente novamente. |
| `tools.double.embody.toast.saveActionFailed` | Failed to save action. Please try again. | No se pudo guardar la acción. Inténtalo de nuevo. | Falha ao salvar a ação. Tente novamente. |
| `tools.double.embody.toast.saveProgressFailed` | Failed to save progress. Please try again. | No se pudo guardar el progreso. Inténtalo de nuevo. | Falha ao salvar o progresso. Tente novamente. |
| `tools.double.embody.yes` | Yes | Sí | Sim |
| `tools.freeplay.affirmationSetOptional` | Affirmation Set (Optional) | Set de afirmaciones (opcional) | Conjunto de afirmações (opcional) |
| `tools.freeplay.colorFeedback` | Color feedback | Color | Cor |
| `tools.freeplay.iphoneAudioHint` | If you can't hear the piano on iPhone, leave the app, turn OFF Silent Mode and turn your volume up. | Si no escuchas el piano en iPhone, sal de la app, desactiva el modo silencio y sube el volumen. | Se você não ouvir o piano no iPhone, saia do app, desative o Modo Silencioso e aumente o volume. |
| `tools.freeplay.none` | None | Ninguno | Nenhum |
| `tools.freeplay.pageTitle` | Piano Tapping \| Palette Plotting | Piano \| Palette Plotting | Piano \| Palette Plotting |
| `tools.freeplay.start` | Start | Empezar | Começar |
| `tools.freeplay.subtitleDesktop` | Immerse in your affirmations with music and color | Sumérgete en tus afirmaciones con música y color | Mergulhe nas suas afirmações com música e cor |
| `tools.freeplay.subtitleMobile` | Immerse in your affirmation with music and color | Sumérgete en tu afirmación con música y color | Mergulhe na sua afirmação com música e cor |
| `tools.freeplay.title` | Piano Tapping | Piano | Piano |
| `tools.journey.changeCharacter` | Change character | Cambiar personaje | Mudar personagem |
| `tools.journey.coherenceHint` | Affirm daily & embody the new story for coherence and alignment. | Afirma a diario y encarna la nueva historia para coherencia y alineación. | Afirme diariamente e encarne a nova história para coerência e alinhamento. |
| `tools.journey.dailySnapshot` | Daily Snapshot | Resumen diario | Resumo diário |
| `tools.journey.journalDescription` | Daily reflections and intentions in one place. | Reflexiones e intenciones diarias. | Reflexões e intenções diárias. |
| `tools.journey.journalTitle` | Manifestation Journal | Diario de Manifestación | Diário de Manifestação |
| `tools.journey.pageTitle` | Your Journey \| Palette Plotting | Tu Camino \| Palette Plotting | Sua Jornada \| Palette Plotting |
| `tools.journey.statusAligned` | Aligned | Alineado | Alinhado |
| `tools.journey.subtitle` | Reflect on your daily progress. | Reflexiona sobre tu progreso diario. | Reflita sobre seu progresso diário. |
| `tools.journey.title` | Your Journey | Tu Camino | Sua Jornada |
| `tools.journey.yourProgress` | Your Progress | Tu progreso | Seu progresso |
| `tools.mirror.affirmationSet` | Affirmation Set | Set de afirmaciones | Conjunto de afirmações |
| `tools.mirror.bestInApp` | Best experienced in app. | Mejor experiencia en la app. | Melhor experiência no app. |
| `tools.mirror.displaySpeed` | Display Speed | Velocidad de visualización | Velocidade de exibição |
| `tools.mirror.enable` | Enable | Activar | Ativar |
| `tools.mirror.errors.apiNotAvailable` | Camera API not available. Please use a modern browser that supports camera access. | La API de cámara no está disponible. Usa un navegador moderno que admita acceso a la cámara. | A API de câmera não está disponível. Use um navegador moderno que suporte acesso à câmera. |
| `tools.mirror.errors.cameraInUse` | Camera is being used by another application. Please close other apps using the camera. | La cámara está en uso por otra aplicación. Cierra otras apps que usen la cámara. | A câmera está sendo usada por outro aplicativo. Feche outros apps que usam a câmera. |
| `tools.mirror.errors.cameraOffAndroid` | Camera is turned off for Palette Plotting. Open Settings → Apps → Palette Plotting → Permissions → Camera → Allow, then try again. | La cámara está desactivada para Palette Plotting. Abre Ajustes → Apps → Palette Plotting → Permisos → Cámara → Permitir e inténtalo de nuevo. | A câmera está desativada para o Palette Plotting. Abra Configurações → Apps → Palette Plotting → Permissões → Câmera → Permitir e tente novamente. |
| `tools.mirror.errors.checkDeviceSettings` | Unable to access camera. Please check your device settings. | No se puede acceder a la cámara. Revisa la configuración de tu dispositivo. | Não foi possível acessar a câmera. Verifique as configurações do dispositivo. |
| `tools.mirror.errors.httpsRequired` | Camera access requires a secure connection (HTTPS). Please use HTTPS or localhost. | El acceso a la cámara requiere una conexión segura (HTTPS). Usa HTTPS o localhost. | O acesso à câmera requer uma conexão segura (HTTPS). Use HTTPS ou localhost. |
| `tools.mirror.errors.noCameraFound` | No camera found on this device. | No se encontró cámara en este dispositivo. | Nenhuma câmera encontrada neste dispositivo. |
| `tools.mirror.errors.noVideoTrack` | No video track available from camera. | No hay pista de video disponible en la cámara. | Nenhuma faixa de vídeo disponível na câmera. |
| `tools.mirror.errors.notSupported` | Camera access is not supported on this device or browser. Please use a modern browser like Chrome, Safari, or Firefox. | El acceso a la cámara no es compatible con este dispositivo o navegador. Usa un navegador moderno como Chrome, Safari o Firefox. | O acesso à câmera não é compatível com este dispositivo ou navegador. Use um navegador moderno como Chrome, Safari ou Firefox. |
| `tools.mirror.errors.permissionDeniedAndroid` | Camera permission denied. Open Settings → Apps → Palette Plotting → Permissions → Camera → Allow, then return here and tap Start again. | Permiso de cámara denegado. Abre Ajustes → Apps → Palette Plotting → Permisos → Cámara → Permitir, regresa aquí y toca Iniciar de nuevo. | Permissão de câmera negada. Abra Configurações → Apps → Palette Plotting → Permissões → Câmera → Permitir, volte aqui e toque em Iniciar novamente. |
| `tools.mirror.errors.permissionDeniedBrowser` | Camera permission denied. Please enable it in your browser settings. | Permiso de cámara denegado. Actívalo en la configuración de tu navegador. | Permissão de câmera negada. Ative nas configurações do navegador. |
| `tools.mirror.errors.permissionDeniedIosNative` | Camera permission denied. Tap 'Allow' when prompted, or go to Settings > Palette Plotting > Camera. | Permiso de cámara denegado. Toca "Permitir" cuando aparezca el aviso, o ve a Ajustes > Palette Plotting > Cámara. | Permissão de câmera negada. Toque em "Permitir" quando solicitado, ou vá em Ajustes > Palette Plotting > Câmera. |
| `tools.mirror.errors.permissionDeniedIosSafari` | Camera permission denied. Tap 'Allow' when prompted, or go to Settings > Safari > Camera and enable it for this site. | Permiso de cámara denegado. Toca "Permitir" cuando aparezca el aviso, o ve a Ajustes > Safari > Cámara y actívalo para este sitio. | Permissão de câmera negada. Toque em "Permitir" quando solicitado, ou vá em Ajustes > Safari > Câmera e ative para este site. |
| `tools.mirror.errors.permissionDeniedNative` | Camera permission denied. Please enable it in Settings > Palette Plotting > Camera. | Permiso de cámara denegado. Actívalo en Ajustes > Palette Plotting > Cámara. | Permissão de câmera negada. Ative em Ajustes > Palette Plotting > Câmera. |
| `tools.mirror.errors.permissionDeniedSafari` | Camera permission denied. Please enable it in Settings > Safari > Camera. | Permiso de cámara denegado. Actívalo en Ajustes > Safari > Cámara. | Permissão de câmera negada. Ative em Ajustes > Safari > Câmera. |
| `tools.mirror.errors.securityBlocked` | Camera access blocked for security reasons. Please ensure you're using HTTPS or localhost. | Acceso a la cámara bloqueado por seguridad. Asegúrate de usar HTTPS o localhost. | Acesso à câmera bloqueado por segurança. Certifique-se de usar HTTPS ou localhost. |
| `tools.mirror.errors.unableAccess` | Unable to access camera. | No se puede acceder a la cámara. | Não foi possível acessar a câmera. |
| `tools.mirror.errors.unableAccessAllow` | Unable to access camera. Please allow camera permissions. | No se puede acceder a la cámara. Permite el acceso a la cámara. | Não foi possível acessar a câmera. Permita o acesso à câmera. |
| `tools.mirror.feedback` | Feedback | Retroalimentación | Feedback |
| `tools.mirror.feedbackMessages.high.0` | That's it. | Eso es. | É isso. |
| `tools.mirror.feedbackMessages.high.1` | Perfect! | ¡Perfecto! | Perfeito! |
| `tools.mirror.feedbackMessages.high.2` | Great energy! | ¡Gran energía! | Ótima energia! |
| `tools.mirror.feedbackMessages.high.3` | Carry that forward. | Llévalo contigo. | Leve isso adiante. |
| `tools.mirror.feedbackMessages.low.0` | A little louder! | ¡Un poco más fuerte! | Um pouco mais alto! |
| `tools.mirror.feedbackMessages.low.1` | Speak it into existence! | ¡Hazlo realidad! | Fale para manifestar! |
| `tools.mirror.feedbackMessages.low.2` | Speak Up! | ¡Levanta la voz! | Fale mais alto! |
| `tools.mirror.feedbackMessages.low.3` | Affirm it! | ¡Afírmalo! | Afirme! |
| `tools.mirror.feedbackMessages.mid.0` | That's better. | Así está mejor. | Assim está melhor. |
| `tools.mirror.feedbackMessages.mid.1` | Keep going! | ¡Sigue! | Continue! |
| `tools.mirror.feedbackMessages.mid.2` | You can do it! | ¡Tú puedes! | Você consegue! |
| `tools.mirror.feedbackMessages.mid.3` | You've got this! | ¡Tú lo logras! | Você tem isso! |
| `tools.mirror.initializingCamera` | Initializing camera... | Iniciando cámara... | Iniciando câmera... |
| `tools.mirror.metaDescription` | Mirror Work — turn on your camera and practice confident affirmations. | Trabajo con Espejo — enciende tu cámara y practica afirmaciones con confianza. | Trabalho com Espelho — ligue sua câmera e pratique afirmações com confiança. |
| `tools.mirror.metaDescriptionWeb` | Mirror camera view. Turn on your camera and practice confident affirmations. | Vista de cámara tipo espejo. Enciende tu cámara y practica afirmaciones con confianza. | Visualização de câmera espelho. Ligue sua câmera e pratique afirmações com confiança. |
| `tools.mirror.noSetsAvailable` | No sets available | No hay sets disponibles | Nenhum conjunto disponível |
| `tools.mirror.pageTitle` | Mirror Work \| Palette Plotting | Trabajo con Espejo \| Palette Plotting | Trabalho com Espelho \| Palette Plotting |
| `tools.mirror.permissionHints.native` | If the prompt didn't appear, go to Settings → Palette Plotting → Camera and enable it. | Si no apareció el aviso, ve a Ajustes → Palette Plotting → Cámara y actívalo. | Se o aviso não apareceu, vá em Ajustes → Palette Plotting → Câmera e ative. |
| `tools.mirror.permissionHints.safari` | If the prompt didn't appear, go to Settings → Safari → Camera and enable it for this site. | Si no apareció el aviso, ve a Ajustes → Safari → Cámara y actívalo para este sitio. | Se o aviso não apareceu, vá em Ajustes → Safari → Câmera e ative para este site. |
| `tools.mirror.scenes` | Scenes | Escenas | Cenas |
| `tools.mirror.scenesOptions.coins` | Coins | Monedas | Moedas |
| `tools.mirror.scenesOptions.hearts` | Hearts | Corazones | Corações |
| `tools.mirror.scenesOptions.naturePark` | Nature Park | Parque natural | Parque natural |
| `tools.mirror.scenesOptions.none` | None | Ninguna | Nenhuma |
| `tools.mirror.scenesOptions.rain` | Rain | Lluvia | Chuva |
| `tools.mirror.scenesOptions.summit` | Summit | Cumbre | Cume |
| `tools.mirror.seeYourself` | See Yourself | Mírate | Veja-se |
| `tools.mirror.selectPlaceholder` | Select | Seleccionar | Selecionar |
| `tools.mirror.stop` | Stop | Detener | Parar |
| `tools.mirror.subtitle` | Practice affirmations with your reflection | Practica afirmaciones con tu reflejo | Pratique afirmações com seu reflexo |
| `tools.mirror.title` | Mirror Work | Trabajo con Espejo | Trabalho com Espelho |
| `tools.musicComposer.affirmationSetOptional` | Affirmation Set (Optional) | Set de afirmaciones (opcional) | Conjunto de afirmações (opcional) |
| `tools.musicComposer.autoCorrect` | Auto-Correct | Autocorrección | Autocorreção |
| `tools.musicComposer.cancel` | Cancel | Cancelar | Cancelar |
| `tools.musicComposer.clear` | Clear | Borrar | Limpar |
| `tools.musicComposer.confirmOriginal` | I confirm this is original music | Confirmo que esta es música original | Confirmo que esta é música original |
| `tools.musicComposer.copyrightDisclaimer` | Only create original music. You are responsible for ensuring your compositions don't infringe on existing copyrights. | Crea solo música original. Eres responsable de asegurarte de que tus composiciones no infrinjan derechos de autor existentes. | Crie apenas música original. Você é responsável por garantir que suas composições não infrinjam direitos autorais existentes. |
| `tools.musicComposer.createFirstBackground` | Create your first subliminal background | Crea tu primer fondo subliminal | Crie seu primeiro fundo subliminar |
| `tools.musicComposer.deleteConfirm` | Are you sure you want to delete "{{name}}"? | ¿Seguro que quieres eliminar "{{name}}"? | Tem certeza de que deseja excluir "{{name}}"? |
| `tools.musicComposer.dialogDescription` | Choose your session type and settings | Elige el tipo de sesión y la configuración | Escolha o tipo de sessão e as configurações |
| `tools.musicComposer.dialogTitle` | New Session | Nueva sesión | Nova sessão |
| `tools.musicComposer.durationMin` | {{minutes}} min | {{minutes}} min | {{minutes}} min |
| `tools.musicComposer.enterMusicNotes` | Enter Music Notes | Ingresar notas musicales | Inserir notas musicais |
| `tools.musicComposer.iphonePianoHint` | If you can't hear the piano on iPhone, leave the app, turn OFF Silent Mode and turn your volume up. | Si no escuchas el piano en iPhone, sal de la app, desactiva el modo silencio y sube el volumen. | Se você não ouvir o piano no iPhone, saia do app, desative o Modo Silencioso e aumente o volume. |
| `tools.musicComposer.maxOneMin` | Max 1 min | Máx. 1 min | Máx. 1 min |
| `tools.musicComposer.newSession` | New Session | Nueva sesión | Nova sessão |
| `tools.musicComposer.noTracksYet` | No tracks yet | Aún no hay pistas | Nenhuma faixa ainda |
| `tools.musicComposer.none` | None | Ninguno | Nenhum |
| `tools.musicComposer.notes` | Notes | Notas | Notas |
| `tools.musicComposer.notesCount` | {{count}} notes | {{count}} notas | {{count}} notas |
| `tools.musicComposer.notesFormatHint` | Type notes in format: C4, D#5, E3, etc. (one per line or comma-separated) | Escribe notas en formato: C4, D#5, E3, etc. (una por línea o separadas por comas) | Digite notas no formato: C4, D#5, E3, etc. (uma por linha ou separadas por vírgula) |
| `tools.musicComposer.notesParsed` | {{count}} notes parsed | {{count}} notas analizadas | {{count}} notas analisadas |
| `tools.musicComposer.notesPlaceholder` | C4, D4, E4, F4, G4, A4, B4, C5 | C4, D4, E4, F4, G4, A4, B4, C5 | C4, D4, E4, F4, G4, A4, B4, C5 |
| `tools.musicComposer.notesRecorded` | {{count}} notes recorded | {{count}} notas grabadas | {{count}} notas gravadas |
| `tools.musicComposer.originalMusicOnly` | Original Music Only | Solo música original | Somente música original |
| `tools.musicComposer.pageTitle` | Subliminal Backgrounds \| Palette Plotting | Fondos Subliminales \| Palette Plotting | Fundos Subliminares \| Palette Plotting |
| `tools.musicComposer.parseNotes` | Parse Notes | Analizar notas | Analisar notas |
| `tools.musicComposer.piano` | Piano | Piano | Piano |
| `tools.musicComposer.pianoTapping` | Piano Tapping | Piano | Piano |
| `tools.musicComposer.play` | Play | Reproducir | Reproduzir |
| `tools.musicComposer.quantizeFast` | Fast (1/8) | Rápido (1/8) | Rápido (1/8) |
| `tools.musicComposer.quantizeMedium` | Medium (1/4) | Medio (1/4) | Médio (1/4) |
| `tools.musicComposer.quantizeSlow` | Slow (1/2) | Lento (1/2) | Lento (1/2) |
| `tools.musicComposer.quantizeVerySlow` | Very Slow | Muy lento | Muito lento |
| `tools.musicComposer.record` | Record | Grabar | Gravar |
| `tools.musicComposer.recordMode` | Record Mode | Modo grabación | Modo gravação |
| `tools.musicComposer.recordingSession` | Recording Session | Sesión de grabación | Sessão de gravação |
| `tools.musicComposer.save` | Save | Guardar | Salvar |
| `tools.musicComposer.sessionType` | Session Type | Tipo de sesión | Tipo de sessão |
| `tools.musicComposer.songNamePlaceholder` | Song name... | Nombre de la canción... | Nome da música... |
| `tools.musicComposer.speed` | Speed: | Velocidad: | Velocidade: |
| `tools.musicComposer.startSession` | Start Session | Iniciar sesión | Iniciar sessão |
| `tools.musicComposer.stop` | Stop | Detener | Parar |
| `tools.musicComposer.subtitle` | Create custom subliminal backgrounds. | Crea fondos subliminales personalizados. | Crie fundos sonoros subliminares personalizados. |
| `tools.musicComposer.title` | Subliminal Backgrounds | Fondos Subliminales | Fundos Subliminares |
| `tools.musicComposer.toasts.bucketNotFound` | Storage bucket 'background-tracks' not found. Please create it in Supabase Dashboard > Storage > Buckets. | Bucket de almacenamiento 'background-tracks' no encontrado. Créalo en Supabase Dashboard > Storage > Buckets. | Bucket de armazenamento 'background-tracks' não encontrado. Crie-o em Supabase Dashboard > Storage > Buckets. |
| `tools.musicComposer.toasts.confirmOriginal` | Please confirm that your music is original | Confirma que tu música es original | Confirme que sua música é original |
| `tools.musicComposer.toasts.deleteTrackFailed` | Failed to delete track | No se pudo eliminar la pista | Falha ao excluir a faixa |
| `tools.musicComposer.toasts.duplicateName` | A track with this name already exists. Please choose a different name. | Ya existe una pista con este nombre. Elige otro nombre. | Já existe uma faixa com este nome. Escolha outro nome. |
| `tools.musicComposer.toasts.enterSongName` | Please enter a song name | Ingresa un nombre para la canción | Digite um nome para a música |
| `tools.musicComposer.toasts.enterTrackName` | Please enter a track name for recording sessions | Ingresa un nombre de pista para sesiones de grabación | Digite um nome de faixa para sessões de gravação |
| `tools.musicComposer.toasts.generateAudioFailed` | Failed to generate audio: {{message}} | No se pudo generar el audio: {{message}} | Falha ao gerar o áudio: {{message}} |
| `tools.musicComposer.toasts.generatingAudio` | Generating audio... | Generando audio... | Gerando áudio... |
| `tools.musicComposer.toasts.loadTracksFailed` | Failed to load tracks | No se pudieron cargar las pistas | Falha ao carregar as faixas |
| `tools.musicComposer.toasts.loginToSave` | Please log in to save tracks | Inicia sesión para guardar pistas | Faça login para salvar faixas |
| `tools.musicComposer.toasts.noNotesToPlay` | No notes to play | No hay notas para reproducir | Nenhuma nota para reproduzir |
| `tools.musicComposer.toasts.noNotesToSave` | No notes to save | No hay notas para guardar | Nenhuma nota para salvar |
| `tools.musicComposer.toasts.noValidNotes` | No valid notes to save. Please record some notes first. | No hay notas válidas para guardar. Graba algunas notas primero. | Nenhuma nota válida para salvar. Grave algumas notas primeiro. |
| `tools.musicComposer.toasts.parseFailed` | Failed to parse notes: {{message}} | No se pudieron analizar las notas: {{message}} | Falha ao analisar as notas: {{message}} |
| `tools.musicComposer.toasts.parsedNotes` | Parsed {{count}} notes | {{count}} notas analizadas | {{count}} notas analisadas |
| `tools.musicComposer.toasts.saveDbFailed` | Failed to save track to database | No se pudo guardar la pista en la base de datos | Falha ao salvar a faixa no banco de dados |
| `tools.musicComposer.toasts.saveFailed` | Failed to save track: {{message}} | No se pudo guardar la pista: {{message}} | Falha ao salvar a faixa: {{message}} |
| `tools.musicComposer.toasts.songTrimmed` | Song trimmed to 1 minute limit ({{count}} notes) | Canción recortada al límite de 1 minuto ({{count}} notas) | Música cortada para o limite de 1 minuto ({{count}} notas) |
| `tools.musicComposer.toasts.subscribersOnly` | Subliminal Backgrounds is for subscribers only. Subscribe to access this feature. | Los fondos subliminales son exclusivos para suscriptores. Suscríbete para acceder. | Fundos subliminares são exclusivos para assinantes. Assine para acessar este recurso. |
| `tools.musicComposer.toasts.trackDeleted` | Track deleted | Pista eliminada | Faixa excluída |
| `tools.musicComposer.toasts.trackLimitReached` | You've reached the limit of 5 background tracks. Please delete one to save a new track. | Alcanzaste el límite de 5 pistas de fondo. Elimina una para guardar una nueva. | Você atingiu o limite de 5 faixas de fundo. Exclua uma para salvar uma nova. |
| `tools.musicComposer.toasts.trackSaved` | Track saved successfully! It's now available as a background sound. | ¡Pista guardada! Ya está disponible como sonido de fondo. | Faixa salva com sucesso! Já está disponível como som de fundo. |
| `tools.musicComposer.toasts.trackTrimmed` | Track trimmed to 1 minute limit ({{count}} notes) | Pista recortada al límite de 1 minuto ({{count}} notas) | Faixa cortada para o limite de 1 minuto ({{count}} notas) |
| `tools.musicComposer.toasts.unknownError` | Unknown error | Error desconocido | Erro desconhecido |
| `tools.musicComposer.toasts.uploadFailed` | Failed to upload audio file: {{message}} | No se pudo subir el archivo de audio: {{message}} | Falha ao enviar o arquivo de áudio: {{message}} |
| `tools.musicComposer.trackMeta` | {{minutes}} min • {{size}} MB | {{minutes}} min • {{size}} MB | {{minutes}} min • {{size}} MB |
| `tools.musicComposer.trackName` | Track Name | Nombre de la pista | Nome da faixa |
| `tools.musicComposer.trackNamePlaceholder` | Enter track name... | Ingresa el nombre de la pista... | Digite o nome da faixa... |
| `tools.musicComposer.tracksStored` | {{current}}/5 tracks stored | {{current}}/5 pistas guardadas | {{current}}/5 faixas armazenadas |
| `tools.musicComposer.yourTracks` | Your Tracks | Tus pistas | Suas faixas |
| `tools.refactor.analyzeBelief` | Analyze Belief | Analizar creencia | Analisar crença |
| `tools.refactor.analyzing` | Analyzing... | Analizando... | Analisando... |
| `tools.refactor.assumption` | Assumption {{number}} | Supuesto {{number}} | Suposição {{number}} |
| `tools.refactor.beliefLabel` | Belief: | Creencia: | Crença: |
| `tools.refactor.beliefNode` | Belief | Creencia | Crença |
| `tools.refactor.beliefPlaceholderEliminate` | e.g., 'If I don't get an A on my Physics Exam my life is ruined' | p. ej., 'Si no saco A en mi examen de física, mi vida está arruinada' | p. ex., 'Se eu não tirar A na prova de física, minha vida está arruinada' |
| `tools.refactor.beliefPlaceholderIntegrate` | e.g., 'I am capable of achieving my goals' | p. ej., 'Soy capaz de lograr mis metas' | p. ex., 'Sou capaz de alcançar minhas metas' |
| `tools.refactor.cancel` | Cancel | Cancelar | Cancelar |
| `tools.refactor.charactersCount` | {{count}}/250 characters | {{count}}/250 caracteres | {{count}}/250 caracteres |
| `tools.refactor.createNew` | Create New | Crear nuevo | Criar novo |
| `tools.refactor.dateCreatedLabel` | Date Created: | Fecha de creación: | Data de criação: |
| `tools.refactor.disclaimer` | Belief Work can make mistakes and is not a therapeutic tool. It is meant to analyze beliefs using structure and logic. It is not a tool for emotional and psychological support. | Trabajo de creencias puede cometer errores y no es una herramienta terapéutica. Está pensado para analizar creencias con estructura y lógica. No es una herramienta de apoyo emocional ni psicológico. | Trabalho de crenças pode cometer erros e não é uma ferramenta terapêutica. Foi feito para analisar crenças com estrutura e lógica. Não é uma ferramenta de apoio emocional ou psicológico. |
| `tools.refactor.eliminate` | Eliminate | Eliminar | Eliminar |
| `tools.refactor.eliminateBelief` | Eliminate Belief | Eliminar Creencia | Eliminar Crença |
| `tools.refactor.eliminateTooltip` | Eliminate a limiting belief | Eliminar una creencia limitante | Eliminar uma crença limitante |
| `tools.refactor.enterYourBelief` | Enter Your Belief | Ingresa tu creencia | Digite sua crença |
| `tools.refactor.hideWeeklyLimit` | Hide weekly generation limit | Ocultar límite semanal de generaciones | Ocultar limite semanal de gerações |
| `tools.refactor.integrate` | Integrate | Integrar | Integrar |
| `tools.refactor.integrateBelief` | Integrate Belief | Integrar Creencia | Integrar Crença |
| `tools.refactor.integrateTooltip` | Integrate an expansionary belief | Integrar una creencia expansiva | Integrar uma crença expansiva |
| `tools.refactor.modeEliminate` | Eliminate Limiting Belief | Eliminar Creencia Limitante | Eliminar Crença Limitante |
| `tools.refactor.modeIntegrate` | Integrate Expansionary Belief | Integrar Creencia Expansiva | Integrar Crença Expansiva |
| `tools.refactor.modeLabel` | Mode: | Modo: | Modo: |
| `tools.refactor.noSavedBeliefs` | No saved beliefs yet | Aún no hay creencias guardadas | Nenhuma crença salva ainda |
| `tools.refactor.pageTitle` | Belief Work \| Palette Plotting | Trabajo de Creencias \| Palette Plotting | Trabalho de Crenças \| Palette Plotting |
| `tools.refactor.png` | PNG | PNG | PNG |
| `tools.refactor.save` | Save | Guardar | Salvar |
| `tools.refactor.showWeeklyLimit` | Show weekly generation limit | Mostrar límite semanal de generaciones | Mostrar limite semanal de gerações |
| `tools.refactor.subtitle` | Explore beliefs you want to release or integrate. | Explora creencias que quieres liberar o integrar. | Explore crenças que você quer liberar ou integrar. |
| `tools.refactor.title` | Belief Work | Trabajo de Creencias | Trabalho de Crenças |
| `tools.refactor.titlePlaceholder` | e.g., Physics Exam Anxiety | p. ej., Ansiedad por examen de física | p. ex., Ansiedade com prova de física |
| `tools.refactor.toasts.analyzeFailed` | Failed to analyze belief. Please try again. | No se pudo analizar la creencia. Inténtalo de nuevo. | Falha ao analisar a crença. Tente novamente. |
| `tools.refactor.toasts.analyzedSuccess` | Belief analyzed successfully! | ¡Creencia analizada correctamente! | Crença analisada com sucesso! |
| `tools.refactor.toasts.blockedDefault` | This tool is temporarily unavailable due to repeated guideline violations. Access will be restored in 24 hours. | Esta herramienta no está disponible temporalmente por violaciones repetidas de las normas. El acceso se restablecerá en 24 horas. | Esta ferramenta está temporariamente indisponível devido a violações repetidas das diretrizes. O acesso será restaurado em 24 horas. |
| `tools.refactor.toasts.connectionError` | Connection error. Please check your internet and try again. | Error de conexión. Revisa tu internet e inténtalo de nuevo. | Erro de conexão. Verifique sua internet e tente novamente. |
| `tools.refactor.toasts.deleteFailed` | Failed to delete. Please try again. | No se pudo eliminar. Inténtalo de nuevo. | Falha ao excluir. Tente novamente. |
| `tools.refactor.toasts.deleted` | Deleted | Eliminado | Excluído |
| `tools.refactor.toasts.eliminationSubscribers` | Belief Elimination is for subscribers only. Subscribe to access this feature. | Eliminar creencias es solo para suscriptores. Suscríbete para acceder. | Eliminar crenças é apenas para assinantes. Assine para acessar este recurso. |
| `tools.refactor.toasts.enterBelief` | Please enter a belief | Ingresa una creencia | Digite uma crença |
| `tools.refactor.toasts.entryExists` | Entry already exists. Please try again. | La entrada ya existe. Inténtalo de nuevo. | A entrada já existe. Tente novamente. |
| `tools.refactor.toasts.exportPngFailed` | Failed to export PNG | No se pudo exportar el PNG | Falha ao exportar PNG |
| `tools.refactor.toasts.exportedPng` | Exported as PNG! | ¡Exportado como PNG! | Exportado como PNG! |
| `tools.refactor.toasts.genericError` | Error. | Error. | Erro. |
| `tools.refactor.toasts.integrationSubscribers` | Belief Integration is for subscribers only. Subscribe to access this feature. | Integrar creencias es solo para suscriptores. Suscríbete para acceder. | Integrar crenças é apenas para assinantes. Assine para acessar este recurso. |
| `tools.refactor.toasts.invalidAnalysis` | Invalid analysis data. Please try analyzing again. | Datos de análisis inválidos. Intenta analizar de nuevo. | Dados de análise inválidos. Tente analisar novamente. |
| `tools.refactor.toasts.loadFailed` | Failed to load saved refactors. Please try again. | No se pudieron cargar las creencias guardadas. Inténtalo de nuevo. | Falha ao carregar crenças salvas. Tente novamente. |
| `tools.refactor.toasts.logFailed` | Failed to log generation. Weekly count may be inaccurate. | No se pudo registrar la generación. El conteo semanal puede ser inexacto. | Falha ao registrar a geração. A contagem semanal pode estar imprecisa. |
| `tools.refactor.toasts.loginToDelete` | You must be logged in to delete refactors. | Debes iniciar sesión para eliminar creencias. | Você precisa estar logado para excluir crenças. |
| `tools.refactor.toasts.loginToSave` | You must be logged in to save refactors. | Debes iniciar sesión para guardar creencias. | Você precisa estar logado para salvar crenças. |
| `tools.refactor.toasts.missingField` | Missing required field. Please try again. | Falta un campo obligatorio. Inténtalo de nuevo. | Campo obrigatório ausente. Tente novamente. |
| `tools.refactor.toasts.moderationFailed` | Content safety check failed. Please try again. | Falló la verificación de seguridad de contenido. Inténtalo de nuevo. | Falha na verificação de segurança de conteúdo. Tente novamente. |
| `tools.refactor.toasts.moderationFailedDetail` | Content safety check failed. Please try again or contact support if the issue persists. | Falló la verificación de seguridad de contenido. Inténtalo de nuevo o contacta a soporte si el problema continúa. | Falha na verificação de segurança de conteúdo. Tente novamente ou entre em contato com o suporte se o problema continuar. |
| `tools.refactor.toasts.moderationUnavailable` | Content safety check unavailable. Please try again. | Verificación de seguridad de contenido no disponible. Inténtalo de nuevo. | Verificação de segurança de conteúdo indisponível. Tente novamente. |
| `tools.refactor.toasts.moderationUnavailableDetail` | Content safety check unavailable. Please try again or contact support if the issue persists. | Verificación de seguridad de contenido no disponible. Inténtalo de nuevo o contacta a soporte si el problema continúa. | Verificação de segurança de conteúdo indisponível. Tente novamente ou entre em contato com o suporte se o problema continuar. |
| `tools.refactor.toasts.noAnalysisData` | No data received from analysis | No se recibieron datos del análisis | Nenhum dado recebido da análise |
| `tools.refactor.toasts.noSession` | No valid session found. Please log in and try again. | No se encontró una sesión válida. Inicia sesión e inténtalo de nuevo. | Nenhuma sessão válida encontrada. Faça login e tente novamente. |
| `tools.refactor.toasts.permissionDenied` | Permission denied. Please ensure you are logged in and try again. | Permiso denegado. Asegúrate de haber iniciado sesión e inténtalo de nuevo. | Permissão negada. Certifique-se de estar logado e tente novamente. |
| `tools.refactor.toasts.preparingDownload` | Preparing download... | Preparando descarga... | Preparando download... |
| `tools.refactor.toasts.saveFailed` | Failed to save: {{message}} | No se pudo guardar: {{message}} | Falha ao salvar: {{message}} |
| `tools.refactor.toasts.saveGenericFailed` | Failed to save | No se pudo guardar | Falha ao salvar |
| `tools.refactor.toasts.saved` | Saved! | ¡Guardado! | Salvo! |
| `tools.refactor.toasts.schemaError` | Database schema error. Please contact support. | Error de esquema de base de datos. Contacta a soporte. | Erro de esquema do banco de dados. Entre em contato com o suporte. |
| `tools.refactor.toasts.selectMode` | Please select a mode (Eliminate or Integrate) | Selecciona un modo (Eliminar o Integrar) | Selecione um modo (Eliminar ou Integrar) |
| `tools.refactor.toasts.statementNotSupported` | This tool isn't designed to process this type of statement. | Esta herramienta no está diseñada para procesar este tipo de declaración. | Esta ferramenta não foi feita para processar este tipo de declaração. |
| `tools.refactor.toasts.tableNotFound` | Database table not found. Please contact support. | Tabla de base de datos no encontrada. Contacta a soporte. | Tabela do banco de dados não encontrada. Entre em contato com o suporte. |
| `tools.refactor.toasts.tryAgain` | Error. Please try again. | Error. Inténtalo de nuevo. | Erro. Tente novamente. |
| `tools.refactor.toasts.weeklyCheckFailed` | Unable to check weekly limit. Please try again. | No se pudo verificar el límite semanal. Inténtalo de nuevo. | Não foi possível verificar o limite semanal. Tente novamente. |
| `tools.refactor.toasts.weeklyLimitReached` | Weekly generation limit reached ({{current}}/{{limit}}). Your limit resets on Monday. | Límite semanal de generaciones alcanzado ({{current}}/{{limit}}). Tu límite se reinicia el lunes. | Limite semanal de gerações atingido ({{current}}/{{limit}}). Seu limite reinicia na segunda-feira. |
| `tools.refactor.typeLabel` | Type: | Tipo: | Tipo: |
| `tools.refactor.view` | View | Ver | Ver |
| `tools.refactor.viewTerms` | View Terms of Service | Ver Términos de servicio | Ver Termos de serviço |
| `tools.refactor.visualizationPlaceholder` | Visualization will appear here after analysis | La visualización aparecerá aquí después del análisis | A visualização aparecerá aqui após a análise |
| `tools.refactor.weeklyGenerations` | Weekly Generations: | Generaciones semanales: | Gerações semanais: |
| `tools.refactor.yourBeliefs` | Your Beliefs ({{count}}) | Tus creencias ({{count}}) | Suas crenças ({{count}}) |
| `tools.subliminal.affirmationLayers` | Affirmation Layers: {{count}} | Capas de afirmaciones: {{count}} | Camadas de afirmações: {{count}} |
| `tools.subliminal.affirmationVolume` | Affirmation volume | Volumen de afirmaciones | Volume das afirmações |
| `tools.subliminal.back` | Back | Atrás | Voltar |
| `tools.subliminal.backgroundSound` | Background Sound | Sonido de fondo | Som de fundo |
| `tools.subliminal.backgroundSounds.cityCorner` | City Corner | Esquina urbana | Esquina urbana |
| `tools.subliminal.backgroundSounds.fireplace` | Fireplace | Chimenea | Lareira |
| `tools.subliminal.backgroundSounds.goldCoins` | Gold Coins | Monedas de oro | Moedas de ouro |
| `tools.subliminal.backgroundSounds.naturePark` | Nature Park | Parque natural | Parque natural |
| `tools.subliminal.backgroundSounds.none` | No background sound | Sin sonido de fondo | Sem som de fundo |
| `tools.subliminal.backgroundSounds.ocean` | Ocean | Océano | Oceano |
| `tools.subliminal.backgroundSounds.rain` | Rain | Lluvia | Chuva |
| `tools.subliminal.backgroundVolume` | Background Volume: {{percent}}% | Volumen de fondo: {{percent}}% | Volume de fundo: {{percent}}% |
| `tools.subliminal.binauralBeats` | Binaural Beats | Beats binaurales | Batidas binaurais |
| `tools.subliminal.binauralBeatsOptions.alpha.desc` | Relaxation, learning, light meditation | Relajación, aprendizaje, meditación ligera | Relaxamento, aprendizado, meditação leve |
| `tools.subliminal.binauralBeatsOptions.alpha.label` | Alpha (8-13 Hz beat, ~250 Hz carrier) | Alpha (beat 8-13 Hz, portadora ~250 Hz) | Alpha (batida 8–13 Hz, portadora ~250 Hz) |
| `tools.subliminal.binauralBeatsOptions.beta.desc` | Focus, concentration, alertness | Enfoque, concentración, alerta | Foco, concentração, alerta |
| `tools.subliminal.binauralBeatsOptions.beta.label` | Beta (13-30 Hz beat, ~300 Hz carrier) | Beta (beat 13-30 Hz, portadora ~300 Hz) | Beta (batida 13–30 Hz, portadora ~300 Hz) |
| `tools.subliminal.binauralBeatsOptions.delta.desc` | Deep sleep, healing, regeneration | Sueño profundo, sanación, regeneración | Sono profundo, cura, regeneração |
| `tools.subliminal.binauralBeatsOptions.delta.label` | Delta (0.5-4 Hz beat, ~200 Hz carrier) | Delta (beat 0,5-4 Hz, portadora ~200 Hz) | Delta (batida 0,5–4 Hz, portadora ~200 Hz) |
| `tools.subliminal.binauralBeatsOptions.gamma.desc` | Peak awareness, cognitive enhancement | Máxima conciencia, mejora cognitiva | Máxima consciência, aprimoramento cognitivo |
| `tools.subliminal.binauralBeatsOptions.gamma.label` | Gamma (30-100 Hz beat, ~400 Hz carrier) | Gamma (beat 30-100 Hz, portadora ~400 Hz) | Gamma (batida 30–100 Hz, portadora ~400 Hz) |
| `tools.subliminal.binauralBeatsOptions.none.desc` | Affirmations and background only; no binaural tones in the mix. | Solo afirmaciones y fondo; sin tonos binaurales en la mezcla. | Somente afirmações e fundo; sem tons binaurais na mixagem. |
| `tools.subliminal.binauralBeatsOptions.none.label` | No binaural beat | Sin beat binaural | Sem batida binaural |
| `tools.subliminal.binauralBeatsOptions.theta.desc` | Meditation, deep focus, deep relaxation | Meditación, enfoque profundo, relajación profunda | Meditação, foco profundo, relaxamento profundo |
| `tools.subliminal.binauralBeatsOptions.theta.label` | Theta (4-8 Hz beat, ~200 Hz carrier) | Theta (beat 4-8 Hz, portadora ~200 Hz) | Theta (batida 4–8 Hz, portadora ~200 Hz) |
| `tools.subliminal.binauralShort.alpha` | Alpha | Alpha | Alpha |
| `tools.subliminal.binauralShort.beta` | Beta | Beta | Beta |
| `tools.subliminal.binauralShort.delta` | Delta | Delta | Delta |
| `tools.subliminal.binauralShort.gamma` | Gamma | Gamma | Gamma |
| `tools.subliminal.binauralShort.none` | No beat | Sin beat | Sem beat |
| `tools.subliminal.binauralShort.theta` | Theta | Theta | Theta |
| `tools.subliminal.binauralVolume` | Binaural volume | Volumen binaural | Volume binaural |
| `tools.subliminal.cancel` | Cancel | Cancelar | Cancelar |
| `tools.subliminal.chooseAffirmationSet` | Choose an affirmation set | Elige un set de afirmaciones | Escolha um conjunto de afirmações |
| `tools.subliminal.create` | Create | Crear | Criar |
| `tools.subliminal.createOwnBackground` | (Want to create your own? | (¿Quieres crear el tuyo? | (Quer criar o seu? |
| `tools.subliminal.createTrack` | Create Track | Crear pista | Criar faixa |
| `tools.subliminal.customSound` | {{name}} (Custom Sound) | {{name}} (sonido personalizado) | {{name}} (som personalizado) |
| `tools.subliminal.delete` | Delete | Eliminar | Excluir |
| `tools.subliminal.deleteDescription` | Are you sure you want to delete "{{name}}"? This action cannot be undone and will free up storage space. | ¿Seguro que quieres eliminar "{{name}}"? Esta acción no se puede deshacer y liberará espacio de almacenamiento. | Tem certeza de que deseja excluir "{{name}}"? Esta ação não pode ser desfeita e liberará espaço de armazenamento. |
| `tools.subliminal.deleteTrack` | Delete Track | Eliminar pista | Excluir faixa |
| `tools.subliminal.dismissPlayer` | Dismiss player | Cerrar reproductor | Fechar player |
| `tools.subliminal.durationMin` | {{minutes}} min | {{minutes}} min | {{minutes}} min |
| `tools.subliminal.freestyle` | Freestyle | Libre | Livre |
| `tools.subliminal.frequenciesNote` | Note: Frequencies are approximations. | Nota: Las frecuencias son aproximaciones. | Nota: as frequências são aproximações. |
| `tools.subliminal.frequencyType` | Frequency Type | Tipo de frecuencia | Tipo de frequência |
| `tools.subliminal.generateAudio` | Generate Audio | Generar audio | Gerar áudio |
| `tools.subliminal.generateVoiceHint` | Generate a voice reading of your affirmations. | Genera una voz leyendo tus afirmaciones. | Gere uma voz lendo suas afirmações. |
| `tools.subliminal.generating` | Generating... | Generando... | Gerando... |
| `tools.subliminal.hideLimits` | Hide storage and weekly limits | Ocultar límites de almacenamiento y semanales | Ocultar limites de armazenamento e semanais |
| `tools.subliminal.karaoke` | Karaoke | Cante | Cante |
| `tools.subliminal.layersRecommended` | 3–5 recommended | 3–5 recomendadas | 3–5 recomendadas |
| `tools.subliminal.loading` | Loading... | Cargando... | Carregando... |
| `tools.subliminal.loop` | Loop | Repetir | Repetir |
| `tools.subliminal.loopPlayback` | Loop playback | Repetir reproducción | Repetir reprodução |
| `tools.subliminal.loseProgress` | . You will lose your current progress.) | . Perderás tu progreso actual.) | . Você perderá seu progresso atual.) |
| `tools.subliminal.nameYourTrack` | Name Your Track | Nombra tu pista | Nomeie sua faixa |
| `tools.subliminal.next` | Next | Siguiente | Próximo |
| `tools.subliminal.noTracksYet` | No tracks yet | Aún no hay pistas | Nenhuma faixa ainda |
| `tools.subliminal.openBackgroundsConfirm` | Open Subliminal Backgrounds? You will lose your current progress. | ¿Abrir Fondos subliminales? Perderás tu progreso actual. | Abrir Fundos Subliminares? Você perderá seu progresso atual. |
| `tools.subliminal.openSubliminalBackgrounds` | Open Subliminal Backgrounds | Abrir Fondos subliminales | Abrir Fundos Subliminares |
| `tools.subliminal.pageTitle` | Subliminal Maker \| Palette Plotting | Creador de Subliminales \| Palette Plotting | Criador de Subliminares \| Palette Plotting |
| `tools.subliminal.pause` | Pause | Pausar | Pausar |
| `tools.subliminal.pianoTapping` | Piano Tapping | Piano | Piano |
| `tools.subliminal.play` | Play | Reproducir | Reproduzir |
| `tools.subliminal.readAndRecord` | Read & Record: | Lee y graba: | Leia e grave: |
| `tools.subliminal.selectAffirmationSet` | Select Affirmation Set | Seleccionar set de afirmaciones | Selecionar conjunto de afirmações |
| `tools.subliminal.selectBackgroundSound` | Select background sound... | Seleccionar sonido de fondo... | Selecionar som de fundo... |
| `tools.subliminal.showLimits` | Show storage and weekly limits | Mostrar límites de almacenamiento y semanales | Mostrar limites de armazenamento e semanais |
| `tools.subliminal.step1Disclaimer` | Only use audio you're allowed to use. Recordings can be looped—you don't need to fill the full track. Karaoke: read the on-screen affirmations while you record. | Usa solo audio que tengas permitido usar. Las grabaciones pueden repetirse—no necesitas llenar toda la pista. Karaoke: lee las afirmaciones en pantalla mientras grabas. | Use apenas áudio que você tem permissão para usar. As gravações podem ser repetidas — você não precisa preencher a faixa inteira. Karaoke: leia as afirmações na tela enquanto grava. |
| `tools.subliminal.storage` | Storage: | Almacenamiento: | Armazenamento: |
| `tools.subliminal.subliminalBackgrounds` | Subliminal Backgrounds | Fondos subliminales | Fundos Subliminares |
| `tools.subliminal.subliminalSettings` | Subliminal Settings | Ajustes subliminales | Configurações subliminares |
| `tools.subliminal.subliminalTrack` | Subliminal Track | Pista subliminal | Faixa subliminar |
| `tools.subliminal.subtitle` | Create tracks with background and binaural beats | Crea pistas con fondo y beats binaurales | Crie faixas com fundo e batidas binaurais |
| `tools.subliminal.textToSpeech` | Text-to-Speech | Texto a voz | Texto para fala |
| `tools.subliminal.thetaRecommended` | Recommended for deep focus and relaxation | Recomendado para enfoque profundo y relajación | Recomendado para foco profundo e relaxamento |
| `tools.subliminal.title` | Subliminal Maker | Creador de Subliminales | Criador de Subliminares |
| `tools.subliminal.toasts.audioEmpty` | Audio file is empty. Please record again. | El archivo de audio está vacío. Graba de nuevo. | O arquivo de áudio está vazio. Grave novamente. |
| `tools.subliminal.toasts.audioError` | Audio error: {{code}} - {{message}} | Error de audio: {{code}} - {{message}} | Erro de áudio: {{code}} - {{message}} |
| `tools.subliminal.toasts.audioLoadFailed` | Audio failed to load. The file may be corrupted. Please record again. | No se pudo cargar el audio. El archivo puede estar dañado. Graba de nuevo. | Falha ao carregar o áudio. O arquivo pode estar corrompido. Grave novamente. |
| `tools.subliminal.toasts.audioProcessorLoadFailed` | Audio processor failed to load. Please refresh the page. If the issue persists, contact support. | No se pudo cargar el procesador de audio. Actualiza la página. Si el problema continúa, contacta a soporte. | Falha ao carregar o processador de áudio. Atualize a página. Se o problema continuar, entre em contato com o suporte. |
| `tools.subliminal.toasts.audioUnsupported` | Failed to play audio. The file format may not be supported. | No se pudo reproducir el audio. El formato puede no ser compatible. | Falha ao reproduzir o áudio. O formato do arquivo pode não ser compatível. |
| `tools.subliminal.toasts.backgroundTracksNotLoaded` | User background tracks not loaded. Please refresh the page. | No se cargaron tus pistas de fondo. Actualiza la página. | As faixas de fundo do usuário não foram carregadas. Atualize a página. |
| `tools.subliminal.toasts.bucketNotFound` | Storage bucket 'subliminal-tracks' not found. | Bucket de almacenamiento 'subliminal-tracks' no encontrado. | Bucket de armazenamento 'subliminal-tracks' não encontrado. |
| `tools.subliminal.toasts.bucketSizeLimit` | File is too large ({{size}} MB). The storage bucket has a maximum file size limit (typically 50 MB per file). Please try a shorter track length (current: {{minutes}} minutes). | El archivo es muy grande ({{size}} MB). El bucket tiene un límite máximo (típicamente 50 MB por archivo). Prueba con una pista más corta (actual: {{minutes}} minutos). | O arquivo é muito grande ({{size}} MB). O bucket tem limite máximo de tamanho (geralmente 50 MB por arquivo). Tente uma faixa mais curta (atual: {{minutes}} minutos). |
| `tools.subliminal.toasts.deleteStorageFailed` | Failed to delete audio file from storage. | No se pudo eliminar el archivo de audio del almacenamiento. | Falha ao excluir o arquivo de áudio do armazenamento. |
| `tools.subliminal.toasts.deleteTrackFailed` | Failed to delete track | No se pudo eliminar la pista | Falha ao excluir a faixa |
| `tools.subliminal.toasts.enterTrackName` | Please enter a track name | Ingresa un nombre para la pista | Digite um nome para a faixa |
| `tools.subliminal.toasts.fileLargeWarning` | File is large ({{size}} MB). Upload may take a while. | El archivo es grande ({{size}} MB). La subida puede tardar un poco. | O arquivo é grande ({{size}} MB). O envio pode demorar um pouco. |
| `tools.subliminal.toasts.fileTooLargeMax` | File is too large ({{size}} MB). Maximum file size is {{max}} MB for your tier. Try a shorter track length. | El archivo es muy grande ({{size}} MB). El tamaño máximo es {{max}} MB para tu plan. Prueba con una pista más corta. | O arquivo é muito grande ({{size}} MB). O tamanho máximo é {{max}} MB para o seu plano. Tente uma faixa mais curta. |
| `tools.subliminal.toasts.fileTooLargeRemaining` | File is too large ({{size}} MB). You have {{remaining}} MB remaining. Try a shorter track length. | El archivo es muy grande ({{size}} MB). Te quedan {{remaining}} MB. Prueba con una pista más corta. | O arquivo é muito grande ({{size}} MB). Você tem {{remaining}} MB restantes. Tente uma faixa mais curta. |
| `tools.subliminal.toasts.generateAudioFailed` | Failed to generate audio. Please try again. | No se pudo generar el audio. Inténtalo de nuevo. | Falha ao gerar o áudio. Tente novamente. |
| `tools.subliminal.toasts.generateTrackFailed` | Failed to generate track. Please try again. | No se pudo generar la pista. Inténtalo de nuevo. | Falha ao gerar a faixa. Tente novamente. |
| `tools.subliminal.toasts.generationTimeout` | Track generation timed out. Please try again with a shorter duration. | La generación de la pista expiró. Inténtalo de nuevo con una duración más corta. | A geração da faixa expirou. Tente novamente com uma duração menor. |
| `tools.subliminal.toasts.genericError` | Error. Please try again. | Error. Inténtalo de nuevo. | Erro. Tente novamente. |
| `tools.subliminal.toasts.interactFirst` | Please interact with the page first. | Interactúa con la página primero. | Interaja com a página primeiro. |
| `tools.subliminal.toasts.loadFailed` | Failed to load tracks: {{message}} | No se pudieron cargar las pistas: {{message}} | Falha ao carregar as faixas: {{message}} |
| `tools.subliminal.toasts.loadTimeout` | Audio took too long to load. Please try again. | El audio tardó demasiado en cargar. Inténtalo de nuevo. | O áudio demorou demais para carregar. Tente novamente. |
| `tools.subliminal.toasts.loadTrackFailed` | Failed to load track. Please try again. | No se pudo cargar la pista. Inténtalo de nuevo. | Falha ao carregar a faixa. Tente novamente. |
| `tools.subliminal.toasts.loginAgain` | Session expired. Please log in again. | Sesión expirada. Inicia sesión de nuevo. | Sessão expirada. Faça login novamente. |
| `tools.subliminal.toasts.loginToDelete` | You must be logged in to delete tracks. | Debes iniciar sesión para eliminar pistas. | Você precisa estar logado para excluir faixas. |
| `tools.subliminal.toasts.loginToGenerate` | Please log in to generate audio | Inicia sesión para generar audio | Faça login para gerar áudio |
| `tools.subliminal.toasts.loginToGenerateTrack` | You must be logged in to generate tracks. | Debes iniciar sesión para generar pistas. | Você precisa estar logado para gerar faixas. |
| `tools.subliminal.toasts.loginToGenerateTracks` | You must be logged in to generate tracks. Please refresh the page and try again. | Debes iniciar sesión para generar pistas. Actualiza la página e inténtalo de nuevo. | Você precisa estar logado para gerar faixas. Atualize a página e tente novamente. |
| `tools.subliminal.toasts.maxTrackLength` | Maximum track length is {{max}} minutes for your tier. Upgrade to access longer tracks. | La duración máxima de pista es {{max}} minutos para tu plan. Mejora tu plan para pistas más largas. | A duração máxima da faixa é {{max}} minutos para o seu plano. Faça upgrade para faixas mais longas. |
| `tools.subliminal.toasts.micAccessPrefix` | Could not access microphone.  | No se pudo acceder al micrófono.  | Não foi possível acessar o microfone.  |
| `tools.subliminal.toasts.micAndroidSettings` | Open Android Settings → Apps → Palette Plotting → Permissions → Microphone, then allow. | Abre Ajustes de Android → Apps → Palette Plotting → Permisos → Micrófono y permite el acceso. | Abra Configurações do Android → Apps → Palette Plotting → Permissões → Microfone e permita o acesso. |
| `tools.subliminal.toasts.micBrowserSettings` | Please allow microphone access in your browser settings. | Permite el acceso al micrófono en la configuración de tu navegador. | Permita o acesso ao microfone nas configurações do navegador. |
| `tools.subliminal.toasts.micCheckSettings` | Please check your microphone settings. | Revisa la configuración de tu micrófono. | Verifique as configurações do microfone. |
| `tools.subliminal.toasts.micInUse` | Microphone is being used by another application. | El micrófono está siendo usado por otra aplicación. | O microfone está sendo usado por outro aplicativo. |
| `tools.subliminal.toasts.noAudioContent` | No audio content received from server | No se recibió contenido de audio del servidor | Nenhum conteúdo de áudio recebido do servidor |
| `tools.subliminal.toasts.noAudioToPlay` | No audio to play. Please record audio first. | No hay audio para reproducir. Graba audio primero. | Nenhum áudio para reproduzir. Grave áudio primeiro. |
| `tools.subliminal.toasts.noMicrophone` | No microphone found on this device. | No se encontró micrófono en este dispositivo. | Nenhum microfone encontrado neste dispositivo. |
| `tools.subliminal.toasts.permissionDenied` | Permission denied. Please ensure you're logged in and try again. | Permiso denegado. Asegúrate de haber iniciado sesión e inténtalo de nuevo. | Permissão negada. Certifique-se de estar logado e tente novamente. |
| `tools.subliminal.toasts.playFailedPrefix` | Failed to play audio.  | No se pudo reproducir el audio.  | Falha ao reproduzir o áudio.  |
| `tools.subliminal.toasts.playTrackFailed` | Failed to play track. Please try again. | No se pudo reproducir la pista. Inténtalo de nuevo. | Falha ao reproduzir a faixa. Tente novamente. |
| `tools.subliminal.toasts.playTrackFailedPrefix` | Failed to play track.  | No se pudo reproducir la pista.  | Falha ao reproduzir a faixa.  |
| `tools.subliminal.toasts.playingAudio` | Playing audio | Reproduciendo audio | Reproduzindo áudio |
| `tools.subliminal.toasts.playingTrack` | Playing: {{name}} | Reproduciendo: {{name}} | Reproduzindo: {{name}} |
| `tools.subliminal.toasts.processAudioFailed` | Failed to process audio data. Please try again. | No se pudieron procesar los datos de audio. Inténtalo de nuevo. | Falha ao processar os dados de áudio. Tente novamente. |
| `tools.subliminal.toasts.recordAffirmationsFirst` | Please record affirmations first | Graba las afirmaciones primero | Grave as afirmações primeiro |
| `tools.subliminal.toasts.recordingEmpty` | Recording failed. Audio file is empty. | Falló la grabación. El archivo de audio está vacío. | Falha na gravação. O arquivo de áudio está vazio. |
| `tools.subliminal.toasts.recordingError` | Recording error occurred. Please try again. | Ocurrió un error de grabación. Inténtalo de nuevo. | Ocorreu um erro de gravação. Tente novamente. |
| `tools.subliminal.toasts.recordingNoData` | Recording failed. No audio data captured. | Falló la grabación. No se capturaron datos de audio. | Falha na gravação. Nenhum dado de áudio capturado. |
| `tools.subliminal.toasts.recordingSaved` | Recording saved! | ¡Grabación guardada! | Gravação salva! |
| `tools.subliminal.toasts.recordingStarted` | Recording started | Grabación iniciada | Gravação iniciada |
| `tools.subliminal.toasts.recordingStopped` | Recording stopped | Grabación detenida | Gravação interrompida |
| `tools.subliminal.toasts.selectAffirmationSetFirst` | Please select an affirmation set first | Selecciona un set de afirmaciones primero | Selecione um conjunto de afirmações primeiro |
| `tools.subliminal.toasts.selectBackgroundSound` | Please select a background sound | Selecciona un sonido de fondo | Selecione um som de fundo |
| `tools.subliminal.toasts.serverError` | Server error ({{status}}). | Error del servidor ({{status}}). | Erro do servidor ({{status}}). |
| `tools.subliminal.toasts.sessionExpired` | Session expired. Please refresh the page and log in again. | Sesión expirada. Actualiza la página e inicia sesión de nuevo. | Sessão expirada. Atualize a página e faça login novamente. |
| `tools.subliminal.toasts.sessionMismatch` | Session mismatch detected. Please refresh the page and try again. | Se detectó un desajuste de sesión. Actualiza la página e inténtalo de nuevo. | Incompatibilidade de sessão detectada. Atualize a página e tente novamente. |
| `tools.subliminal.toasts.sessionVerificationFailed` | Session verification failed. Please log in again. | Falló la verificación de sesión. Inicia sesión de nuevo. | Falha na verificação da sessão. Faça login novamente. |
| `tools.subliminal.toasts.storagePermissionDenied` | Storage permission denied. Please contact support. | Permiso de almacenamiento denegado. Contacta a soporte. | Permissão de armazenamento negada. Entre em contato com o suporte. |
| `tools.subliminal.toasts.tapAgain` | Please try tapping the play button again. | Intenta tocar el botón de reproducir de nuevo. | Tente tocar no botão de reproduzir novamente. |
| `tools.subliminal.toasts.tapPlayAgain` | Please tap the play button again. Mobile browsers require direct user interaction. | Toca el botón de reproducir de nuevo. Los navegadores móviles requieren interacción directa. | Toque no botão de reproduzir novamente. Navegadores móveis exigem interação direta do usuário. |
| `tools.subliminal.toasts.tierStorageLimit` | File is too large ({{size}} MB). You have {{remaining}} MB remaining. Please try a shorter track length (current: {{minutes}} minutes). | El archivo es muy grande ({{size}} MB). Te quedan {{remaining}} MB. Prueba con una pista más corta (actual: {{minutes}} minutos). | O arquivo é muito grande ({{size}} MB). Você tem {{remaining}} MB restantes. Tente uma faixa mais curta (atual: {{minutes}} minutos). |
| `tools.subliminal.toasts.trackDeleted` | Track deleted | Pista eliminada | Faixa excluída |
| `tools.subliminal.toasts.trackGenerated` | Subliminal track "{{name}}" generated and saved! | ¡Pista subliminal "{{name}}" generada y guardada! | Faixa subliminar "{{name}}" gerada e salva! |
| `tools.subliminal.toasts.trackGeneratedSaved` | Track "{{name}}" generated and saved! | ¡Pista "{{name}}" generada y guardada! | Faixa "{{name}}" gerada e salva! |
| `tools.subliminal.toasts.ttsCharLimit` | Text-to-Speech has a 480 character limit. Your text is {{length}} characters. Please shorten your affirmations. | Texto a voz tiene un límite de 480 caracteres. Tu texto tiene {{length}} caracteres. Acorta tus afirmaciones. | Texto para fala tem limite de 480 caracteres. Seu texto tem {{length}} caracteres. Encurte suas afirmações. |
| `tools.subliminal.toasts.ttsUpgrade` | Text-to-Speech requires an upgrade. Please upgrade to access this feature. | Texto a voz requiere una mejora de plan. Mejora tu plan para acceder. | Texto para fala requer upgrade de plano. Faça upgrade para acessar este recurso. |
| `tools.subliminal.toasts.unknownError` | Unknown error | Error desconocido | Erro desconhecido |
| `tools.subliminal.toasts.uploadFailed` | Failed to upload file. | No se pudo subir el archivo. | Falha ao enviar o arquivo. |
| `tools.subliminal.toasts.userTrackMissingUrl` | This background track has no audio file. It may have been deleted. | Esta pista de fondo no tiene archivo de audio. Puede haber sido eliminada. | Esta faixa de fundo não tem arquivo de áudio. Ela pode ter sido excluída. |
| `tools.subliminal.toasts.userTrackNotFound` | User track not found. Please select a different background sound. | No se encontró la pista de fondo. Selecciona otro sonido de fondo. | Faixa de fundo não encontrada. Selecione outro som de fundo. |
| `tools.subliminal.toasts.voiceGenerated` | Voice generated successfully! | ¡Voz generada correctamente! | Voz gerada com sucesso! |
| `tools.subliminal.toasts.weeklyCheckFailed` | Unable to check weekly limit. Please try again. | No se pudo verificar el límite semanal. Inténtalo de nuevo. | Não foi possível verificar o limite semanal. Tente novamente. |
| `tools.subliminal.toasts.weeklyLimitReached` | Weekly generation limit reached ({{current}}/{{limit}}). Your limit resets on Monday. | Límite semanal de generaciones alcanzado ({{current}}/{{limit}}). Tu límite se reinicia el lunes. | Limite semanal de gerações atingido ({{current}}/{{limit}}). Seu limite reinicia na segunda-feira. |
| `tools.subliminal.trackLength` | Track Length: {{minutes}} minutes | Duración de la pista: {{minutes}} minutos | Duração da faixa: {{minutes}} minutos |
| `tools.subliminal.trackNamePlaceholder` | e.g., Morning Motivation | p. ej., Motivación matutina | p. ex., Motivação matinal |
| `tools.subliminal.trackOptions` | Track options | Opciones de pista | Opções da faixa |
| `tools.subliminal.turnOffLoop` | Turn off loop | Desactivar repetición | Desativar repetição |
| `tools.subliminal.vocalBase` | Vocal Base | Base vocal | Base vocal |
| `tools.subliminal.voiceNotAudible` | Voice present but not well audible below 20% | La voz está presente pero poco audible por debajo del 20% | A voz está presente, mas pouco audível abaixo de 20% |
| `tools.subliminal.weeklyCreations` | Weekly Creations: | Creaciones semanales: | Criações semanais: |
| `tools.subliminal.willGenerate` | Will generate: {{count}} affirmations | Se generarán: {{count}} afirmaciones | Serão geradas: {{count}} afirmações |
| `tools.subliminal.yourTracks` | Your Tracks | Tus pistas | Suas faixas |
| `tools.supportCategories.Business` | Business | Negocios | Negócios |
| `tools.supportCategories.Career` | Career | Carrera | Carreira |
| `tools.supportCategories.Confidence` | Self-Concept | Autoconcepto | Autoconceito |
| `tools.supportCategories.Connections` | Love / SP | Amor | Amor |
| `tools.supportCategories.Discipline` | Discipline | Disciplina | Disciplina |
| `tools.supportCategories.Finances` | Money | Dinero | Dinheiro |
| `tools.supportCategories.Fitness` | Body / Fitness | Cuerpo / Fitness | Corpo / Fitness |
| `tools.supportCategories.Learning` | School / Exams | Escuela / Exámenes | Escola / Provas |
| `tools.supportCategories.Nutrition` | Wellness | Bienestar | Bem-estar |
| `tools.supportCategories.Organization` | Life Reset | Reinicio de vida | Recomeço de vida |
| `tools.supportCategories.Productivity` | Focus | Enfoque | Foco |
| `tools.supportCategories.Self-Love` | Beauty / Glow Up | Belleza / Glow Up | Beleza / Glow Up |
| `tools.supportCategoryTiles.Self-Love` | Glow Up | Glow Up | Glow Up |

---

# Section 2 — Onboarding read-aloud affirmations

Keys: `onboarding.setup.readAffirmations.{CategoryName}` — AffirmationRead typewriter.

## Connections

1. **EN:** I am deeply loved and fully chosen.
   **es-419:** Soy profundamente amada y plenamente elegida.
   **pt-BR:** Sou profundamente amada e plenamente escolhida.

2. **EN:** I am prioritized with care, devotion, and certainty.
   **es-419:** Soy priorizada con cuidado, devoción y certeza.
   **pt-BR:** Sou priorizada com cuidado, devoção e certeza.

3. **EN:** Love with me is natural, easy, and undeniable.
   **es-419:** El amor conmigo es natural, fácil e innegable.
   **pt-BR:** O amor comigo é natural, fácil e inegável.

4. **EN:** I am adored in private and claimed in the open.
   **es-419:** Soy adorada en privado y elegida en público.
   **pt-BR:** Sou adorada em privado e assumida em público.

5. **EN:** Communication with me is warm, consistent, and intentional.
   **es-419:** La comunicación conmigo es cálida, constante e intencional.
   **pt-BR:** A comunicação comigo é calorosa, consistente e intencional.

6. **EN:** I am the person they think of with tenderness and desire.
   **es-419:** Soy la persona en quien piensan con ternura y deseo.
   **pt-BR:** Sou a pessoa em quem pensam com ternura e desejo.

7. **EN:** My relationships are loyal, soft, and emotionally secure.
   **es-419:** Mis relaciones son leales, suaves y emocionalmente seguras.
   **pt-BR:** Minhas relações são leais, suaves e emocionalmente seguras.

8. **EN:** I am treated like someone rare, precious, and unforgettable.
   **es-419:** Soy tratada como alguien única, valiosa e inolvidable.
   **pt-BR:** Sou tratada como alguém única, valiosa e inesquecível.

9. **EN:** The love I want is already aligned with who I am.
   **es-419:** El amor que quiero ya está alineado con quien soy.
   **pt-BR:** O amor que quero já está alinhado com quem eu sou.

10. **EN:** I receive devotion as a natural part of my life.
   **es-419:** Recibo devoción como parte natural de mi vida.
   **pt-BR:** Recebo devoção como parte natural da minha vida.

## Finances

1. **EN:** I am wealthy in identity, action, and expectation.
   **es-419:** Soy rica en identidad, acción y expectativa.
   **pt-BR:** Sou rica em identidade, ação e expectativa.

2. **EN:** Money is natural in my life.
   **es-419:** El dinero es natural en mi vida.
   **pt-BR:** O dinheiro é natural na minha vida.

3. **EN:** I receive large payments with ease.
   **es-419:** Recibo pagos grandes con facilidad.
   **pt-BR:** Recebo pagamentos grandes com facilidade.

4. **EN:** My products, ideas, and presence create real demand.
   **es-419:** Mis productos, ideas y presencia generan demanda real.
   **pt-BR:** Meus produtos, ideias e presença geram demanda real.

5. **EN:** People happily pay for what I create.
   **es-419:** La gente paga con gusto por lo que creo.
   **pt-BR:** As pessoas pagam com gosto pelo que eu crio.

6. **EN:** My income expands because my standard expands.
   **es-419:** Mi ingreso crece porque mi estándar crece.
   **pt-BR:** Minha renda cresce porque meu padrão cresce.

7. **EN:** I make powerful decisions with money.
   **es-419:** Tomo decisiones poderosas con el dinero.
   **pt-BR:** Tomo decisões poderosas com o dinheiro.

8. **EN:** I hold wealth with confidence and intelligence.
   **es-419:** Manejo la riqueza con confianza e inteligencia.
   **pt-BR:** Lido com riqueza com confiança e inteligência.

9. **EN:** My numbers reflect the value I create.
   **es-419:** Mis números reflejan el valor que creo.
   **pt-BR:** Meus números refletem o valor que eu crio.

10. **EN:** Abundance is normal for me.
   **es-419:** La abundancia es normal para mí.
   **pt-BR:** A abundância é normal para mim.

## Confidence

1. **EN:** I am the version of me who already has it.
   **es-419:** Soy la versión de mí que ya lo tiene.
   **pt-BR:** Sou a versão de mim que já tem isso.

2. **EN:** I am chosen, respected, and remembered.
   **es-419:** Soy elegida, respetada y recordada.
   **pt-BR:** Sou escolhida, respeitada e lembrada.

3. **EN:** My presence is magnetic and undeniable.
   **es-419:** Mi presencia es magnética e innegable.
   **pt-BR:** Minha presença é magnética e inegável.

4. **EN:** I trust myself completely.
   **es-419:** Confío en mí por completo.
   **pt-BR:** Confio em mim completamente.

5. **EN:** I move like someone who knows their worth.
   **es-419:** Actúo como alguien que sabe su valor.
   **pt-BR:** Ajo como alguém que sabe seu valor.

6. **EN:** My identity leads everything around me.
   **es-419:** Mi identidad guía todo a mi alrededor.
   **pt-BR:** Minha identidade lidera tudo ao meu redor.

7. **EN:** People respond to my certainty.
   **es-419:** La gente responde a mi certeza.
   **pt-BR:** As pessoas respondem à minha certeza.

8. **EN:** I carry standards that match my desire.
   **es-419:** Llevo estándares que coinciden con mi deseo.
   **pt-BR:** Carrego padrões que coincidem com meu desejo.

9. **EN:** I am powerful without needing to explain.
   **es-419:** Soy poderosa sin necesidad de explicar.
   **pt-BR:** Sou poderosa sem precisar explicar.

10. **EN:** My life reflects who I decide I am.
   **es-419:** Mi vida refleja a quien decido ser.
   **pt-BR:** Minha vida reflete quem eu decido ser.

## Self-Love

1. **EN:** I am beautiful, magnetic, and unforgettable.
   **es-419:** Soy hermosa, magnética e inolvidable.
   **pt-BR:** Sou linda, magnética e inesquecível.

2. **EN:** My face, body, and presence carry real power.
   **es-419:** Mi rostro, mi cuerpo y mi presencia tienen poder real.
   **pt-BR:** Meu rosto, meu corpo e minha presença têm poder real.

3. **EN:** I am admired naturally.
   **es-419:** Soy admirada de forma natural.
   **pt-BR:** Sou admirada naturalmente.

4. **EN:** I am desired with certainty.
   **es-419:** Soy deseada con certeza.
   **pt-BR:** Sou desejada com certeza.

5. **EN:** My glow is obvious in every room I enter.
   **es-419:** Mi brillo es evidente en cada espacio que entro.
   **pt-BR:** Meu brilho é evidente em cada espaço que entro.

6. **EN:** I carry myself like beauty belongs to me.
   **es-419:** Me porto como si la belleza me perteneciera.
   **pt-BR:** Me porto como se a beleza me pertencesse.

7. **EN:** My reflection matches the way I claim myself.
   **es-419:** Mi reflejo coincide con cómo me reclamo.
   **pt-BR:** Meu reflexo coincide com como eu me declaro.

8. **EN:** I take care of myself like someone precious.
   **es-419:** Cuido de mí como a alguien preciosa.
   **pt-BR:** Cuido de mim como alguém preciosa.

9. **EN:** My beauty has softness, force, and presence.
   **es-419:** Mi belleza tiene suavidad, fuerza y presencia.
   **pt-BR:** Minha beleza tem suavidade, força e presença.

10. **EN:** I am radiant in a way people remember.
   **es-419:** Soy radiante de una forma que la gente recuerda.
   **pt-BR:** Sou radiante de um jeito que as pessoas lembram.

## Career

1. **EN:** I am intelligent, capable, and highly valued.
   **es-419:** Soy inteligente, capaz y muy valorada.
   **pt-BR:** Sou inteligente, capaz e muito valorizada.

2. **EN:** The right rooms recognize my name.
   **es-419:** Los espacios correctos reconocen mi nombre.
   **pt-BR:** Os espaços certos reconhecem meu nome.

3. **EN:** My work carries authority and real impact.
   **es-419:** Mi trabajo tiene autoridad e impacto real.
   **pt-BR:** Meu trabalho tem autoridade e impacto real.

4. **EN:** I am selected for opportunities that match my level.
   **es-419:** Soy seleccionada para oportunidades que coinciden con mi nivel.
   **pt-BR:** Sou selecionada para oportunidades que coincidem com meu nível.

5. **EN:** I am paid well for my skill and judgment.
   **es-419:** Me pagan bien por mi talento y criterio.
   **pt-BR:** Sou bem paga pelo meu talento e critério.

6. **EN:** Decision-makers see my value quickly.
   **es-419:** Quienes deciden ven mi valor rápidamente.
   **pt-BR:** Quem decide vê meu valor rapidamente.

7. **EN:** My career moves with favor and momentum.
   **es-419:** Mi carrera avanza con favor y momentum.
   **pt-BR:** Minha carreira avança com favor e momentum.

8. **EN:** I speak about my work with confidence.
   **es-419:** Hablo de mi trabajo con confianza.
   **pt-BR:** Falo do meu trabalho com confiança.

9. **EN:** My reputation grows in the places that matter.
   **es-419:** Mi reputación crece en los lugares que importan.
   **pt-BR:** Minha reputação cresce nos lugares que importam.

10. **EN:** I receive the role, pay, and recognition I deserve.
   **es-419:** Recibo el rol, el pago y el reconocimiento que merezco.
   **pt-BR:** Recebo o cargo, o pagamento e o reconhecimento que mereço.

## Business

1. **EN:** My products reach the right people.
   **es-419:** Mis productos llegan a las personas correctas.
   **pt-BR:** Meus produtos chegam às pessoas certas.

2. **EN:** People understand the value quickly.
   **es-419:** La gente entiende el valor rápidamente.
   **pt-BR:** As pessoas entendem o valor rapidamente.

3. **EN:** My work creates desire, trust, and action.
   **es-419:** Mi trabajo crea deseo, confianza y acción.
   **pt-BR:** Meu trabalho cria desejo, confiança e ação.

4. **EN:** Sales are consistent in my business.
   **es-419:** Las ventas son constantes en mi negocio.
   **pt-BR:** As vendas são consistentes no meu negócio.

5. **EN:** My audience grows with momentum.
   **es-419:** Mi audiencia crece con momentum.
   **pt-BR:** Minha audiência cresce com momentum.

6. **EN:** My products are chosen, shared, and remembered.
   **es-419:** Mis productos son elegidos, compartidos y recordados.
   **pt-BR:** Meus produtos são escolhidos, compartilhados e lembrados.

7. **EN:** I trust what I built because it solves something real.
   **es-419:** Confío en lo que construí porque resuelve algo real.
   **pt-BR:** Confio no que construí porque resolve algo real.

8. **EN:** Revenue reflects the strength of my vision.
   **es-419:** Los ingresos reflejan la fuerza de mi visión.
   **pt-BR:** A receita reflete a força da minha visão.

9. **EN:** My business has gravity.
   **es-419:** Mi negocio tiene gravedad.
   **pt-BR:** Meu negócio tem gravidade.

10. **EN:** I am the founder of something people want.
   **es-419:** Soy la fundadora de algo que la gente quiere.
   **pt-BR:** Sou a fundadora de algo que as pessoas querem.

## Learning

1. **EN:** I am intelligent, prepared, and capable.
   **es-419:** Soy inteligente, preparada y capaz.
   **pt-BR:** Sou inteligente, preparada e capaz.

2. **EN:** I learn quickly and remember what matters.
   **es-419:** Aprendo rápido y recuerdo lo que importa.
   **pt-BR:** Aprendo rápido e lembro do que importa.

3. **EN:** I study with focus and confidence.
   **es-419:** Estudio con enfoque y confianza.
   **pt-BR:** Estudo com foco e confiança.

4. **EN:** The right answers are familiar to me.
   **es-419:** Las respuestas correctas me son familiares.
   **pt-BR:** As respostas certas me são familiares.

5. **EN:** My preparation shows in my results.
   **es-419:** Mi preparación se ve en mis resultados.
   **pt-BR:** Minha preparação aparece nos meus resultados.

6. **EN:** I perform well under pressure.
   **es-419:** Rindo bien bajo presión.
   **pt-BR:** Rendo bem sob pressão.

7. **EN:** My name belongs on the acceptance list.
   **es-419:** Mi nombre pertenece a la lista de aceptación.
   **pt-BR:** Meu nome pertence à lista de aceitação.

8. **EN:** I receive strong grades, strong outcomes, and strong opportunities.
   **es-419:** Recibo buenas notas, buenos resultados y buenas oportunidades.
   **pt-BR:** Recebo boas notas, bons resultados e boas oportunidades.

9. **EN:** My mind is sharp when it matters most.
   **es-419:** Mi mente es clara cuando más importa.
   **pt-BR:** Minha mente é clara quando mais importa.

10. **EN:** I succeed because success matches who I am.
   **es-419:** Tengo éxito porque el éxito coincide con quien soy.
   **pt-BR:** Tenho sucesso porque o sucesso coincide com quem eu sou.

## Discipline

1. **EN:** I keep promises to myself.
   **es-419:** Cumplo las promesas que me hago.
   **pt-BR:** Cumpro as promessas que faço a mim.

2. **EN:** My actions match my future.
   **es-419:** Mis acciones coinciden con mi futuro.
   **pt-BR:** Minhas ações coincidem com meu futuro.

3. **EN:** Consistency is part of who I am.
   **es-419:** La constancia es parte de quien soy.
   **pt-BR:** A consistência é parte de quem eu sou.

4. **EN:** I follow through with power and self-respect.
   **es-419:** Cumplo con poder y autorrespeto.
   **pt-BR:** Cumpro com poder e autorrespeito.

5. **EN:** Small actions create visible results.
   **es-419:** Las acciones pequeñas crean resultados visibles.
   **pt-BR:** Ações pequenas criam resultados visíveis.

6. **EN:** My habits match my standards.
   **es-419:** Mis hábitos coinciden con mis estándares.
   **pt-BR:** Meus hábitos coincidem com meus padrões.

7. **EN:** I choose what supports the life I want.
   **es-419:** Elijo lo que sostiene la vida que quiero.
   **pt-BR:** Escolho o que sustenta a vida que quero.

8. **EN:** I trust myself because I prove myself daily.
   **es-419:** Confío en mí porque me demuestro cada día.
   **pt-BR:** Confio em mim porque me provo todos os dias.

9. **EN:** I finish what matters.
   **es-419:** Termino lo que importa.
   **pt-BR:** Termino o que importa.

10. **EN:** I am disciplined because my desire matters.
   **es-419:** Soy disciplinada porque mi deseo importa.
   **pt-BR:** Sou disciplinada porque meu desejo importa.

## Productivity

1. **EN:** My attention belongs to what matters.
   **es-419:** Mi atención pertenece a lo que importa.
   **pt-BR:** Minha atenção pertence ao que importa.

2. **EN:** I start quickly and continue with force.
   **es-419:** Empiezo rápido y continúo con fuerza.
   **pt-BR:** Começo rápido e continuo com força.

3. **EN:** My mind is sharp, directed, and steady.
   **es-419:** Mi mente es clara, dirigida y firme.
   **pt-BR:** Minha mente é clara, direcionada e firme.

4. **EN:** I give my best energy to the right work.
   **es-419:** Doy mi mejor energía al trabajo correcto.
   **pt-BR:** Dou minha melhor energia ao trabalho certo.

5. **EN:** I complete important tasks with pace.
   **es-419:** Completo tareas importantes con ritmo.
   **pt-BR:** Completo tarefas importantes com ritmo.

6. **EN:** Momentum is natural for me.
   **es-419:** El momentum es natural para mí.
   **pt-BR:** O momentum é natural para mim.

7. **EN:** I make decisions without spiraling.
   **es-419:** Tomo decisiones sin caer en espirales.
   **pt-BR:** Tomo decisões sem cair em espirais.

8. **EN:** I use my time with power.
   **es-419:** Uso mi tiempo con poder.
   **pt-BR:** Uso meu tempo com poder.

9. **EN:** My focus matches my ambition.
   **es-419:** Mi enfoque coincide con mi ambición.
   **pt-BR:** Meu foco coincide com minha ambição.

10. **EN:** I finish what I start.
   **es-419:** Termino lo que empiezo.
   **pt-BR:** Termino o que começo.

## Fitness

1. **EN:** My body reflects strength, care, and consistency.
   **es-419:** Mi cuerpo refleja fuerza, cuidado y constancia.
   **pt-BR:** Meu corpo reflete força, cuidado e consistência.

2. **EN:** I move with confidence and power.
   **es-419:** Muevo con confianza y poder.
   **pt-BR:** Me movo com confiança e poder.

3. **EN:** My choices support the body I claim.
   **es-419:** Mis elecciones sostienen el cuerpo que reclamo.
   **pt-BR:** Minhas escolhas sustentam o corpo que declaro.

4. **EN:** Strength looks beautiful on me.
   **es-419:** La fuerza se ve hermosa en mí.
   **pt-BR:** A força fica linda em mim.

5. **EN:** I carry myself with pride.
   **es-419:** Me porto con orgullo.
   **pt-BR:** Me porto com orgulho.

6. **EN:** My energy supports movement and discipline.
   **es-419:** Mi energía sostiene el movimiento y la disciplina.
   **pt-BR:** Minha energia sustenta movimento e disciplina.

7. **EN:** My body responds to aligned action.
   **es-419:** Mi cuerpo responde a la acción alineada.
   **pt-BR:** Meu corpo responde à ação alinhada.

8. **EN:** Progress is visible in how I move and choose.
   **es-419:** El progreso es visible en cómo muevo y elijo.
   **pt-BR:** O progresso é visível em como me movo e escolho.

9. **EN:** I respect my body through what I do daily.
   **es-419:** Respeto mi cuerpo con lo que hago cada día.
   **pt-BR:** Respeito meu corpo com o que faço todos os dias.

10. **EN:** I am strong, beautiful, and fully in command.
   **es-419:** Soy fuerte, hermosa y plenamente en control.
   **pt-BR:** Sou forte, linda e plenamente no controle.

## Nutrition

1. **EN:** My life supports my energy.
   **es-419:** Mi vida sostiene mi energía.
   **pt-BR:** Minha vida sustenta minha energia.

2. **EN:** My routines nourish me.
   **es-419:** Mis rutinas me nutren.
   **pt-BR:** Minhas rotinas me nutrem.

3. **EN:** Rest, care, and renewal are part of my standard.
   **es-419:** El descanso, el cuidado y la renovación son parte de mi estándar.
   **pt-BR:** Descanso, cuidado e renovação fazem parte do meu padrão.

4. **EN:** My body and mind receive what supports them.
   **es-419:** Mi cuerpo y mi mente reciben lo que los sostiene.
   **pt-BR:** Meu corpo e minha mente recebem o que os sustenta.

5. **EN:** Peace is normal in my daily life.
   **es-419:** La paz es normal en mi vida diaria.
   **pt-BR:** A paz é normal na minha vida diária.

6. **EN:** I choose what makes me feel steady and whole.
   **es-419:** Elijo lo que me hace sentir firme y completa.
   **pt-BR:** Escolho o que me faz sentir firme e completa.

7. **EN:** My days have ease, order, and softness.
   **es-419:** Mis días tienen facilidad, orden y suavidad.
   **pt-BR:** Meus dias têm facilidade, ordem e suavidade.

8. **EN:** I care for myself with consistency.
   **es-419:** Cuido de mí con constancia.
   **pt-BR:** Cuido de mim com consistência.

9. **EN:** My energy is protected by my choices.
   **es-419:** Mi energía está protegida por mis elecciones.
   **pt-BR:** Minha energia é protegida pelas minhas escolhas.

10. **EN:** I am restored, supported, and well.
   **es-419:** Estoy restaurada, sostenida y bien.
   **pt-BR:** Estou restaurada, sustentada e bem.

## Organization

1. **EN:** My life reflects the person I choose to be.
   **es-419:** Mi vida refleja a la persona que elijo ser.
   **pt-BR:** Minha vida reflete a pessoa que escolho ser.

2. **EN:** My space is clean, beautiful, and supportive.
   **es-419:** Mi espacio es limpio, hermoso y que me sostiene.
   **pt-BR:** Meu espaço é limpo, lindo e que me sustenta.

3. **EN:** My routines match my standards.
   **es-419:** Mis rutinas coinciden con mis estándares.
   **pt-BR:** Minhas rotinas coincidem com meus padrões.

4. **EN:** My choices create order.
   **es-419:** Mis elecciones crean orden.
   **pt-BR:** Minhas escolhas criam ordem.

5. **EN:** My environment supports my next level.
   **es-419:** Mi entorno sostiene mi siguiente nivel.
   **pt-BR:** Meu ambiente sustenta meu próximo nível.

6. **EN:** My days are intentional and powerful.
   **es-419:** Mis días son intencionales y poderosos.
   **pt-BR:** Meus dias são intencionais e poderosos.

7. **EN:** I make room for what belongs in my life.
   **es-419:** Hago espacio para lo que pertenece a mi vida.
   **pt-BR:** Faço espaço para o que pertence à minha vida.

8. **EN:** I take the next step with confidence.
   **es-419:** Doy el siguiente paso con confianza.
   **pt-BR:** Dou o próximo passo com confiança.

9. **EN:** My home, schedule, and habits support my desire.
   **es-419:** Mi hogar, mi agenda y mis hábitos sostienen mi deseo.
   **pt-BR:** Minha casa, agenda e hábitos sustentam meu desejo.

10. **EN:** My life matches the identity I claim.
   **es-419:** Mi vida coincide con la identidad que reclamo.
   **pt-BR:** Minha vida coincide com a identidade que declaro.


---

# Section 3 — Premade affirmation sets

## wealth

- **Name EN:** Wealth & Abundance
- **Name es-419:** Riqueza y abundancia
- **Name pt-BR:** Riqueza e abundância

1. **EN:** I am a money magnet and attract wealth effortlessly
   **es-419:** Soy un imán del dinero y atraigo riqueza con facilidad
   **pt-BR:** Sou um ímã de dinheiro e atraio riqueza com facilidade

2. **EN:** Abundance flows to me from multiple sources
   **es-419:** La abundancia fluye hacia mí desde múltiples fuentes
   **pt-BR:** A abundância flui para mim de várias fontes

3. **EN:** I am worthy of financial prosperity and success
   **es-419:** Merezco prosperidad financiera y éxito
   **pt-BR:** Mereço prosperidade financeira e sucesso

4. **EN:** Money comes to me easily and frequently
   **es-419:** El dinero llega a mí con facilidad y frecuencia
   **pt-BR:** O dinheiro chega até mim com facilidade e frequência

5. **EN:** I am financially free and secure
   **es-419:** Confío en mi estabilidad financiera
   **pt-BR:** Confio na minha estabilidade financeira

6. **EN:** I create wealth through my talents and abilities
   **es-419:** Creo riqueza con mis talentos y habilidades
   **pt-BR:** Crio riqueza com meus talentos e habilidades

7. **EN:** My income exceeds my expenses consistently
   **es-419:** Mis ingresos superan mis gastos de forma constante
   **pt-BR:** Minha renda supera minhas despesas de forma consistente

8. **EN:** I make smart financial decisions with confidence
   **es-419:** Tomo decisiones financieras inteligentes con confianza
   **pt-BR:** Tomo decisões financeiras inteligentes com confiança

## love

- **Name EN:** Love & Relationships
- **Name es-419:** Amor y relaciones
- **Name pt-BR:** Amor e relacionamentos

1. **EN:** I am worthy of deep, authentic love
   **es-419:** Merezco un amor profundo y auténtico
   **pt-BR:** Mereço um amor profundo e autêntico

2. **EN:** I attract healthy and fulfilling relationships
   **es-419:** Atraigo relaciones sanas y plenas
   **pt-BR:** Atraio relacionamentos saudáveis e plenos

3. **EN:** Love flows freely to and from me
   **es-419:** El amor fluye libremente hacia mí y desde mí
   **pt-BR:** O amor flui livremente para mim e de mim

4. **EN:** I communicate my needs with kindness and clarity
   **es-419:** Comunico mis necesidades con amabilidad y claridad
   **pt-BR:** Comunico minhas necessidades com gentileza e clareza

5. **EN:** I am surrounded by supportive, loving people
   **es-419:** Me rodean personas amorosas que me apoyan
   **pt-BR:** Estou com pessoas amorosas que me apoiam

6. **EN:** My heart is open to give and receive love
   **es-419:** Mi corazón está abierto para dar y recibir amor
   **pt-BR:** Meu coração está aberto para dar e receber amor

7. **EN:** I deserve respect and kindness in all relationships
   **es-419:** Merezco respeto y amabilidad en todas mis relaciones
   **pt-BR:** Mereço respeito e gentileza em todos os relacionamentos

8. **EN:** I cultivate genuine connections every day
   **es-419:** Cultivo conexiones genuinas cada día
   **pt-BR:** Cultivo conexões genuínas todos os dias

## confidence

- **Name EN:** Confidence & Self-Worth
- **Name es-419:** Confianza y autoestima
- **Name pt-BR:** Confiança e autoestima

1. **EN:** I trust myself to make good decisions
   **es-419:** Confío en mí para tomar buenas decisiones
   **pt-BR:** Confio em mim para tomar boas decisões

2. **EN:** I am confident and capable in all that I do
   **es-419:** Confío en mí y soy capaz en todo lo que hago
   **pt-BR:** Sou confiante e capaz em tudo que faço

3. **EN:** I embrace challenges as opportunities to grow
   **es-419:** Abrazo los retos como oportunidades de crecer
   **pt-BR:** Abraço desafios como oportunidades de crescer

4. **EN:** My self-worth is inherent and unshakeable
   **es-419:** Mi autoestima es innata e inquebrantable
   **pt-BR:** Minha autoestima é inerente e inabalável

5. **EN:** I speak with confidence and clarity
   **es-419:** Hablo con confianza y claridad
   **pt-BR:** Falo com confiança e clareza

6. **EN:** I believe in my abilities and talents
   **es-419:** Creo en mis habilidades y talentos
   **pt-BR:** Acredito nas minhas habilidades e talentos

7. **EN:** I am proud of who I am becoming
   **es-419:** Tengo orgullo de la persona en la que me convierto
   **pt-BR:** Tenho orgulho de quem estou me tornando

8. **EN:** I show up as my authentic self every day
   **es-419:** Me muestro auténticamente cada día
   **pt-BR:** Me mostro autenticamente todos os dias

## health

- **Name EN:** Health & Wellness
- **Name es-419:** Salud y bienestar
- **Name pt-BR:** Saúde e bem-estar

1. **EN:** I honor my body with nourishing choices
   **es-419:** Honro mi cuerpo con decisiones nutritivas
   **pt-BR:** Honro meu corpo com escolhas nutritivas

2. **EN:** I am energetic, strong, and vibrant
   **es-419:** Tengo energía, fuerza y vitalidad
   **pt-BR:** Tenho energia, força e vitalidade

3. **EN:** Every day I become healthier and fitter
   **es-419:** Cada día estoy más sano y en mejor forma
   **pt-BR:** A cada dia fico mais saudável e em forma

4. **EN:** I prioritize rest and recovery
   **es-419:** Priorizo el descanso y la recuperación
   **pt-BR:** Priorizo descanso e recuperação

5. **EN:** My mind and body are in harmony
   **es-419:** Mi mente y mi cuerpo están en armonía
   **pt-BR:** Minha mente e meu corpo estão em harmonia

6. **EN:** I listen to my body and give it what it needs
   **es-419:** Escucho mi cuerpo y le doy lo que necesita
   **pt-BR:** Escuto meu corpo e dou o que ele precisa

7. **EN:** I enjoy moving my body regularly
   **es-419:** Disfruto mover mi cuerpo con regularidad
   **pt-BR:** Gosto de mover meu corpo regularmente

8. **EN:** I am grateful for my health and vitality
   **es-419:** Agradezco mi salud y vitalidad
   **pt-BR:** Sou grato pela minha saúde e vitalidade

## career

- **Name EN:** Career & Success
- **Name es-419:** Carrera y éxito
- **Name pt-BR:** Carreira e sucesso

1. **EN:** I excel in my chosen career path
   **es-419:** Destaco en el camino profesional que elegí
   **pt-BR:** Me destaco no caminho profissional que escolhi

2. **EN:** Opportunities for growth come to me easily
   **es-419:** Las oportunidades de crecimiento llegan a mí con facilidad
   **pt-BR:** Oportunidades de crescimento chegam até mim com facilidade

3. **EN:** I am valued and respected in my work
   **es-419:** Mi trabajo es valorado y respetado
   **pt-BR:** Meu trabalho é valorizado e respeitado

4. **EN:** I achieve my goals with focus and determination
   **es-419:** Logro mis metas con enfoque y determinación
   **pt-BR:** Alcanço minhas metas com foco e determinação

5. **EN:** I am a problem-solver and innovator
   **es-419:** Resuelvo problemas e innovo con facilidad
   **pt-BR:** Resolvo problemas e inovo com facilidade

6. **EN:** Success flows from my consistent actions
   **es-419:** El éxito fluye de mis acciones constantes
   **pt-BR:** O sucesso flui das minhas ações consistentes

7. **EN:** I lead with confidence and integrity
   **es-419:** Lidero con confianza e integridad
   **pt-BR:** Lidero com confiança e integridade

8. **EN:** I create meaningful impact through my work
   **es-419:** Genero un impacto significativo a través de mi trabajo
   **pt-BR:** Crio impacto significativo através do meu trabalho

## spiritual

- **Name EN:** Spiritual Growth
- **Name es-419:** Crecimiento espiritual
- **Name pt-BR:** Crescimento espiritual

1. **EN:** I am connected to my higher purpose
   **es-419:** Me conecto con mi propósito superior
   **pt-BR:** Me conecto ao meu propósito superior

2. **EN:** I trust the guidance of my intuition
   **es-419:** Confío en la guía de mi intuición
   **pt-BR:** Confio na orientação da minha intuição

3. **EN:** I am aligned with peace and clarity
   **es-419:** Vivo en paz y claridad
   **pt-BR:** Vivo em paz e clareza

4. **EN:** I release what no longer serves me
   **es-419:** Suelto lo que ya no me sirve
   **pt-BR:** Libero o que não me serve mais

5. **EN:** I welcome growth and transformation
   **es-419:** Recibo el crecimiento y la transformación
   **pt-BR:** Recebo crescimento e transformação

6. **EN:** My spirit is grounded and expansive
   **es-419:** Mi espíritu está arraigado y expansivo
   **pt-BR:** Meu espírito está enraizado e expansivo

7. **EN:** I am open to wisdom and insight
   **es-419:** Recibo sabiduría y perspectiva
   **pt-BR:** Recebo sabedoria e insight

8. **EN:** I radiate love and compassion
   **es-419:** Irradio amor y compasión
   **pt-BR:** Irradio amor e compaixão

## productivity

- **Name EN:** Productivity & Focus
- **Name es-419:** Productividad y enfoque
- **Name pt-BR:** Produtividade e foco

1. **EN:** I focus on what matters most each day
   **es-419:** Me enfoco en lo que más importa cada día
   **pt-BR:** Foco no que mais importa a cada dia

2. **EN:** I plan my work and work my plan
   **es-419:** Planifico mi trabajo y cumplo mi plan
   **pt-BR:** Planejo meu trabalho e executo meu plano

3. **EN:** I make steady progress toward my goals
   **es-419:** Avanzo de forma constante hacia mis metas
   **pt-BR:** Faço progresso constante em direção às minhas metas

4. **EN:** I minimize distractions and stay present
   **es-419:** Minimizo distracciones y permanezco presente
   **pt-BR:** Minimizo distrações e permaneço presente

5. **EN:** I am disciplined and consistent
   **es-419:** Soy disciplinado y constante
   **pt-BR:** Sou disciplinado e consistente

6. **EN:** I use my time wisely and intentionally
   **es-419:** Uso mi tiempo con sabiduría e intención
   **pt-BR:** Uso meu tempo com sabedoria e intenção

7. **EN:** I finish what I start
   **es-419:** Termino lo que empiezo
   **pt-BR:** Termino o que começo

8. **EN:** I celebrate small wins along the way
   **es-419:** Celebro los pequeños logros en el camino
   **pt-BR:** Celebro pequenas vitórias ao longo do caminho

## learning

- **Name EN:** Learning & Growth
- **Name es-419:** Aprendizaje y crecimiento
- **Name pt-BR:** Aprendizado e crescimento

1. **EN:** I learn quickly and effectively
   **es-419:** Aprendo con rapidez y eficacia
   **pt-BR:** Aprendo com rapidez e eficácia

2. **EN:** I enjoy mastering new skills
   **es-419:** Disfruto dominar nuevas habilidades
   **pt-BR:** Gosto de dominar novas habilidades

3. **EN:** I turn mistakes into lessons
   **es-419:** Convierto los errores en lecciones
   **pt-BR:** Transformo erros em lições

4. **EN:** My curiosity drives my growth
   **es-419:** Mi curiosidad impulsa mi crecimiento
   **pt-BR:** Minha curiosidade impulsiona meu crescimento

5. **EN:** I retain information with ease
   **es-419:** Retengo la información con facilidad
   **pt-BR:** Retenho informações com facilidade

6. **EN:** I ask great questions and seek answers
   **es-419:** Hago buenas preguntas y busco respuestas
   **pt-BR:** Faço boas perguntas e busco respostas

7. **EN:** I am persistent and patient with learning
   **es-419:** Soy persistente y paciente al aprender
   **pt-BR:** Sou persistente e paciente ao aprender

8. **EN:** Learning is enjoyable and rewarding for me
   **es-419:** Aprender es agradable y gratificante para mí
   **pt-BR:** Aprender é prazeroso e gratificante para mim


---

# Section 4 — Subliminal maker (all tools.subliminal.* + tools.demo.subliminal.*)

### tools.demo.subliminal.emailNotFoundForFeedback

- **EN:** We couldn't find your email for this feedback.
- **es-419:** No encontramos tu correo para este comentario.
- **pt-BR:** Não encontramos seu e-mail para este feedback.

### tools.demo.subliminal.feedbackSubmitFailed

- **EN:** Failed to submit feedback. Please try again.
- **es-419:** No se pudo enviar el comentario. Inténtalo de nuevo.
- **pt-BR:** Falha ao enviar feedback. Tente novamente.

### tools.demo.subliminal.generateTrackFailed

- **EN:** Failed to generate track
- **es-419:** No se pudo generar la pista
- **pt-BR:** Falha ao gerar a faixa

### tools.demo.subliminal.maxTrackLengthDemo

- **EN:** Maximum track length is 1 minute for the demo.
- **es-419:** La duración máxima de pista es 1 minuto para la demo.
- **pt-BR:** A duração máxima da faixa é 1 minuto para a demo.

### tools.demo.subliminal.micAccessFailed

- **EN:** Failed to access microphone. Please check permissions.
- **es-419:** No se pudo acceder al micrófono. Revisa los permisos.
- **pt-BR:** Falha ao acessar o microfone. Verifique as permissões.

### tools.demo.subliminal.playTrackFailed

- **EN:** Failed to play track
- **es-419:** No se pudo reproducir la pista
- **pt-BR:** Falha ao reproduzir a faixa

### tools.demo.subliminal.recordingSavedCustomize

- **EN:** Recording saved! Now customize your track settings below.
- **es-419:** ¡Grabación guardada! Ahora personaliza los ajustes de tu pista abajo.
- **pt-BR:** Gravação salva! Agora personalize as configurações da sua faixa abaixo.

### tools.demo.subliminal.trackGenerated

- **EN:** Track generated successfully!
- **es-419:** ¡Pista generada correctamente!
- **pt-BR:** Faixa gerada com sucesso!

### tools.demo.subliminal.walkthrough.customize.message

- **EN:** Now customize your subliminal track settings. Theta wave and Ocean sound are pre-selected for this demo. Adjust volumes, layers, and track length, then click 'Create Track' to generate your audio.
- **es-419:** Personaliza tu pista subliminal. Theta y Ocean vienen preseleccionados. Ajusta volumen, capas y duración, luego toca Crear pista.
- **pt-BR:** Personalize sua faixa subliminar. Theta e Ocean vêm pré-selecionados. Ajuste volumes, camadas e duração, depois toque em Criar faixa.

### tools.demo.subliminal.walkthrough.customize.title

- **EN:** Customize Your Track
- **es-419:** Personaliza tu pista
- **pt-BR:** Personalize sua faixa

### tools.demo.subliminal.walkthrough.feedback.message

- **EN:** What stopped you from signing up today?
- **es-419:** ¿Qué te impidió registrarte hoy?
- **pt-BR:** O que impediu você de se cadastrar hoje?

### tools.demo.subliminal.walkthrough.feedback.title

- **EN:** Share Your Feedback
- **es-419:** Comparte tu opinión
- **pt-BR:** Compartilhe seu feedback

### tools.demo.subliminal.walkthrough.play.message

- **EN:** Your track is ready! Click the Play button to listen to your subliminal audio.
- **es-419:** ¡Tu pista está lista! Toca Reproducir para escuchar tu audio subliminal.
- **pt-BR:** Sua faixa está pronta! Toque em Reproduzir para ouvir seu áudio subliminar.

### tools.demo.subliminal.walkthrough.play.title

- **EN:** Play Track
- **es-419:** Reproducir pista
- **pt-BR:** Reproduzir faixa

### tools.demo.subliminal.walkthrough.record.message

- **EN:** Choose Freestyle or Karaoke mode to record your affirmations. Text-to-Speech is available for paid subscribers.
- **es-419:** Elige el modo Freestyle o Karaoke para grabar tus afirmaciones. La función de texto a voz está disponible para suscriptores de pago.
- **pt-BR:** Escolha o modo Freestyle ou Karaoke para gravar suas afirmações. A função de texto para fala está disponível para assinantes pagos.

### tools.demo.subliminal.walkthrough.record.title

- **EN:** Record Your Affirmations
- **es-419:** Graba tus afirmaciones
- **pt-BR:** Grave suas afirmações

### tools.demo.subliminal.walkthrough.signup.actionText

- **EN:** Sign Up
- **es-419:** Registrarse
- **pt-BR:** Cadastrar-se

### tools.demo.subliminal.walkthrough.signup.message

- **EN:** You're seeing less than 15% of the app in this demo. Get enhanced access to the subliminal maker, Mirror Work, momentum/goal & habit tracking, and other interactive manifestation tools.
- **es-419:** En esta demo ves menos del 15% de la app. Desbloquea subliminales, espejo, metas, hábitos y más herramientas.
- **pt-BR:** Nesta demo você vê menos de 15% do app. Desbloqueie subliminares, espelho, metas, hábitos e outras ferramentas.

### tools.demo.subliminal.walkthrough.signup.secondaryActionText

- **EN:** Not ready yet, share feedback
- **es-419:** Aún no, dar feedback
- **pt-BR:** Ainda não, dar feedback

### tools.demo.subliminal.walkthrough.signup.title

- **EN:** Enjoying it? Get Access to More.
- **es-419:** ¿Te gusta? Accede a más.
- **pt-BR:** Gostou? Tenha acesso a mais.

### tools.demo.subliminal.walkthrough.thankYou.message

- **EN:** We appreciate your feedback and will use it to improve Palette Plotting.
- **es-419:** Agradecemos tu comentario y lo usaremos para mejorar Palette Plotting.
- **pt-BR:** Agradecemos seu feedback e vamos usá-lo para melhorar o Palette Plotting.

### tools.demo.subliminal.walkthrough.thankYou.title

- **EN:** Thank you!
- **es-419:** ¡Gracias!
- **pt-BR:** Obrigado!

### tools.subliminal.affirmationLayers

- **EN:** Affirmation Layers: {{count}}
- **es-419:** Capas de afirmaciones: {{count}}
- **pt-BR:** Camadas de afirmações: {{count}}

### tools.subliminal.affirmationVolume

- **EN:** Affirmation volume
- **es-419:** Volumen de afirmaciones
- **pt-BR:** Volume das afirmações

### tools.subliminal.back

- **EN:** Back
- **es-419:** Atrás
- **pt-BR:** Voltar

### tools.subliminal.backgroundSound

- **EN:** Background Sound
- **es-419:** Sonido de fondo
- **pt-BR:** Som de fundo

### tools.subliminal.backgroundSounds.cityCorner

- **EN:** City Corner
- **es-419:** Esquina urbana
- **pt-BR:** Esquina urbana

### tools.subliminal.backgroundSounds.fireplace

- **EN:** Fireplace
- **es-419:** Chimenea
- **pt-BR:** Lareira

### tools.subliminal.backgroundSounds.goldCoins

- **EN:** Gold Coins
- **es-419:** Monedas de oro
- **pt-BR:** Moedas de ouro

### tools.subliminal.backgroundSounds.naturePark

- **EN:** Nature Park
- **es-419:** Parque natural
- **pt-BR:** Parque natural

### tools.subliminal.backgroundSounds.none

- **EN:** No background sound
- **es-419:** Sin sonido de fondo
- **pt-BR:** Sem som de fundo

### tools.subliminal.backgroundSounds.ocean

- **EN:** Ocean
- **es-419:** Océano
- **pt-BR:** Oceano

### tools.subliminal.backgroundSounds.rain

- **EN:** Rain
- **es-419:** Lluvia
- **pt-BR:** Chuva

### tools.subliminal.backgroundVolume

- **EN:** Background Volume: {{percent}}%
- **es-419:** Volumen de fondo: {{percent}}%
- **pt-BR:** Volume de fundo: {{percent}}%

### tools.subliminal.binauralBeats

- **EN:** Binaural Beats
- **es-419:** Beats binaurales
- **pt-BR:** Batidas binaurais

### tools.subliminal.binauralBeatsOptions.alpha.desc

- **EN:** Relaxation, learning, light meditation
- **es-419:** Relajación, aprendizaje, meditación ligera
- **pt-BR:** Relaxamento, aprendizado, meditação leve

### tools.subliminal.binauralBeatsOptions.alpha.label

- **EN:** Alpha (8-13 Hz beat, ~250 Hz carrier)
- **es-419:** Alpha (beat 8-13 Hz, portadora ~250 Hz)
- **pt-BR:** Alpha (batida 8–13 Hz, portadora ~250 Hz)

### tools.subliminal.binauralBeatsOptions.beta.desc

- **EN:** Focus, concentration, alertness
- **es-419:** Enfoque, concentración, alerta
- **pt-BR:** Foco, concentração, alerta

### tools.subliminal.binauralBeatsOptions.beta.label

- **EN:** Beta (13-30 Hz beat, ~300 Hz carrier)
- **es-419:** Beta (beat 13-30 Hz, portadora ~300 Hz)
- **pt-BR:** Beta (batida 13–30 Hz, portadora ~300 Hz)

### tools.subliminal.binauralBeatsOptions.delta.desc

- **EN:** Deep sleep, healing, regeneration
- **es-419:** Sueño profundo, sanación, regeneración
- **pt-BR:** Sono profundo, cura, regeneração

### tools.subliminal.binauralBeatsOptions.delta.label

- **EN:** Delta (0.5-4 Hz beat, ~200 Hz carrier)
- **es-419:** Delta (beat 0,5-4 Hz, portadora ~200 Hz)
- **pt-BR:** Delta (batida 0,5–4 Hz, portadora ~200 Hz)

### tools.subliminal.binauralBeatsOptions.gamma.desc

- **EN:** Peak awareness, cognitive enhancement
- **es-419:** Máxima conciencia, mejora cognitiva
- **pt-BR:** Máxima consciência, aprimoramento cognitivo

### tools.subliminal.binauralBeatsOptions.gamma.label

- **EN:** Gamma (30-100 Hz beat, ~400 Hz carrier)
- **es-419:** Gamma (beat 30-100 Hz, portadora ~400 Hz)
- **pt-BR:** Gamma (batida 30–100 Hz, portadora ~400 Hz)

### tools.subliminal.binauralBeatsOptions.none.desc

- **EN:** Affirmations and background only; no binaural tones in the mix.
- **es-419:** Solo afirmaciones y fondo; sin tonos binaurales en la mezcla.
- **pt-BR:** Somente afirmações e fundo; sem tons binaurais na mixagem.

### tools.subliminal.binauralBeatsOptions.none.label

- **EN:** No binaural beat
- **es-419:** Sin beat binaural
- **pt-BR:** Sem batida binaural

### tools.subliminal.binauralBeatsOptions.theta.desc

- **EN:** Meditation, deep focus, deep relaxation
- **es-419:** Meditación, enfoque profundo, relajación profunda
- **pt-BR:** Meditação, foco profundo, relaxamento profundo

### tools.subliminal.binauralBeatsOptions.theta.label

- **EN:** Theta (4-8 Hz beat, ~200 Hz carrier)
- **es-419:** Theta (beat 4-8 Hz, portadora ~200 Hz)
- **pt-BR:** Theta (batida 4–8 Hz, portadora ~200 Hz)

### tools.subliminal.binauralShort.alpha

- **EN:** Alpha
- **es-419:** Alpha
- **pt-BR:** Alpha

### tools.subliminal.binauralShort.beta

- **EN:** Beta
- **es-419:** Beta
- **pt-BR:** Beta

### tools.subliminal.binauralShort.delta

- **EN:** Delta
- **es-419:** Delta
- **pt-BR:** Delta

### tools.subliminal.binauralShort.gamma

- **EN:** Gamma
- **es-419:** Gamma
- **pt-BR:** Gamma

### tools.subliminal.binauralShort.none

- **EN:** No beat
- **es-419:** Sin beat
- **pt-BR:** Sem beat

### tools.subliminal.binauralShort.theta

- **EN:** Theta
- **es-419:** Theta
- **pt-BR:** Theta

### tools.subliminal.binauralVolume

- **EN:** Binaural volume
- **es-419:** Volumen binaural
- **pt-BR:** Volume binaural

### tools.subliminal.cancel

- **EN:** Cancel
- **es-419:** Cancelar
- **pt-BR:** Cancelar

### tools.subliminal.chooseAffirmationSet

- **EN:** Choose an affirmation set
- **es-419:** Elige un set de afirmaciones
- **pt-BR:** Escolha um conjunto de afirmações

### tools.subliminal.create

- **EN:** Create
- **es-419:** Crear
- **pt-BR:** Criar

### tools.subliminal.createOwnBackground

- **EN:** (Want to create your own?
- **es-419:** (¿Quieres crear el tuyo?
- **pt-BR:** (Quer criar o seu?

### tools.subliminal.createTrack

- **EN:** Create Track
- **es-419:** Crear pista
- **pt-BR:** Criar faixa

### tools.subliminal.customSound

- **EN:** {{name}} (Custom Sound)
- **es-419:** {{name}} (sonido personalizado)
- **pt-BR:** {{name}} (som personalizado)

### tools.subliminal.delete

- **EN:** Delete
- **es-419:** Eliminar
- **pt-BR:** Excluir

### tools.subliminal.deleteDescription

- **EN:** Are you sure you want to delete "{{name}}"? This action cannot be undone and will free up storage space.
- **es-419:** ¿Seguro que quieres eliminar "{{name}}"? Esta acción no se puede deshacer y liberará espacio de almacenamiento.
- **pt-BR:** Tem certeza de que deseja excluir "{{name}}"? Esta ação não pode ser desfeita e liberará espaço de armazenamento.

### tools.subliminal.deleteTrack

- **EN:** Delete Track
- **es-419:** Eliminar pista
- **pt-BR:** Excluir faixa

### tools.subliminal.dismissPlayer

- **EN:** Dismiss player
- **es-419:** Cerrar reproductor
- **pt-BR:** Fechar player

### tools.subliminal.durationMin

- **EN:** {{minutes}} min
- **es-419:** {{minutes}} min
- **pt-BR:** {{minutes}} min

### tools.subliminal.freestyle

- **EN:** Freestyle
- **es-419:** Libre
- **pt-BR:** Livre

### tools.subliminal.frequenciesNote

- **EN:** Note: Frequencies are approximations.
- **es-419:** Nota: Las frecuencias son aproximaciones.
- **pt-BR:** Nota: as frequências são aproximações.

### tools.subliminal.frequencyType

- **EN:** Frequency Type
- **es-419:** Tipo de frecuencia
- **pt-BR:** Tipo de frequência

### tools.subliminal.generateAudio

- **EN:** Generate Audio
- **es-419:** Generar audio
- **pt-BR:** Gerar áudio

### tools.subliminal.generateVoiceHint

- **EN:** Generate a voice reading of your affirmations.
- **es-419:** Genera una voz leyendo tus afirmaciones.
- **pt-BR:** Gere uma voz lendo suas afirmações.

### tools.subliminal.generating

- **EN:** Generating...
- **es-419:** Generando...
- **pt-BR:** Gerando...

### tools.subliminal.hideLimits

- **EN:** Hide storage and weekly limits
- **es-419:** Ocultar límites de almacenamiento y semanales
- **pt-BR:** Ocultar limites de armazenamento e semanais

### tools.subliminal.karaoke

- **EN:** Karaoke
- **es-419:** Cante
- **pt-BR:** Cante

### tools.subliminal.layersRecommended

- **EN:** 3–5 recommended
- **es-419:** 3–5 recomendadas
- **pt-BR:** 3–5 recomendadas

### tools.subliminal.loading

- **EN:** Loading...
- **es-419:** Cargando...
- **pt-BR:** Carregando...

### tools.subliminal.loop

- **EN:** Loop
- **es-419:** Repetir
- **pt-BR:** Repetir

### tools.subliminal.loopPlayback

- **EN:** Loop playback
- **es-419:** Repetir reproducción
- **pt-BR:** Repetir reprodução

### tools.subliminal.loseProgress

- **EN:** . You will lose your current progress.)
- **es-419:** . Perderás tu progreso actual.)
- **pt-BR:** . Você perderá seu progresso atual.)

### tools.subliminal.nameYourTrack

- **EN:** Name Your Track
- **es-419:** Nombra tu pista
- **pt-BR:** Nomeie sua faixa

### tools.subliminal.next

- **EN:** Next
- **es-419:** Siguiente
- **pt-BR:** Próximo

### tools.subliminal.noTracksYet

- **EN:** No tracks yet
- **es-419:** Aún no hay pistas
- **pt-BR:** Nenhuma faixa ainda

### tools.subliminal.openBackgroundsConfirm

- **EN:** Open Subliminal Backgrounds? You will lose your current progress.
- **es-419:** ¿Abrir Fondos subliminales? Perderás tu progreso actual.
- **pt-BR:** Abrir Fundos Subliminares? Você perderá seu progresso atual.

### tools.subliminal.openSubliminalBackgrounds

- **EN:** Open Subliminal Backgrounds
- **es-419:** Abrir Fondos subliminales
- **pt-BR:** Abrir Fundos Subliminares

### tools.subliminal.pageTitle

- **EN:** Subliminal Maker | Palette Plotting
- **es-419:** Creador de Subliminales | Palette Plotting
- **pt-BR:** Criador de Subliminares | Palette Plotting

### tools.subliminal.pause

- **EN:** Pause
- **es-419:** Pausar
- **pt-BR:** Pausar

### tools.subliminal.pianoTapping

- **EN:** Piano Tapping
- **es-419:** Piano
- **pt-BR:** Piano

### tools.subliminal.play

- **EN:** Play
- **es-419:** Reproducir
- **pt-BR:** Reproduzir

### tools.subliminal.readAndRecord

- **EN:** Read & Record:
- **es-419:** Lee y graba:
- **pt-BR:** Leia e grave:

### tools.subliminal.selectAffirmationSet

- **EN:** Select Affirmation Set
- **es-419:** Seleccionar set de afirmaciones
- **pt-BR:** Selecionar conjunto de afirmações

### tools.subliminal.selectBackgroundSound

- **EN:** Select background sound...
- **es-419:** Seleccionar sonido de fondo...
- **pt-BR:** Selecionar som de fundo...

### tools.subliminal.showLimits

- **EN:** Show storage and weekly limits
- **es-419:** Mostrar límites de almacenamiento y semanales
- **pt-BR:** Mostrar limites de armazenamento e semanais

### tools.subliminal.step1Disclaimer

- **EN:** Only use audio you're allowed to use. Recordings can be looped—you don't need to fill the full track. Karaoke: read the on-screen affirmations while you record.
- **es-419:** Usa solo audio que tengas permitido usar. Las grabaciones pueden repetirse—no necesitas llenar toda la pista. Karaoke: lee las afirmaciones en pantalla mientras grabas.
- **pt-BR:** Use apenas áudio que você tem permissão para usar. As gravações podem ser repetidas — você não precisa preencher a faixa inteira. Karaoke: leia as afirmações na tela enquanto grava.

### tools.subliminal.storage

- **EN:** Storage:
- **es-419:** Almacenamiento:
- **pt-BR:** Armazenamento:

### tools.subliminal.subliminalBackgrounds

- **EN:** Subliminal Backgrounds
- **es-419:** Fondos subliminales
- **pt-BR:** Fundos Subliminares

### tools.subliminal.subliminalSettings

- **EN:** Subliminal Settings
- **es-419:** Ajustes subliminales
- **pt-BR:** Configurações subliminares

### tools.subliminal.subliminalTrack

- **EN:** Subliminal Track
- **es-419:** Pista subliminal
- **pt-BR:** Faixa subliminar

### tools.subliminal.subtitle

- **EN:** Create tracks with background and binaural beats
- **es-419:** Crea pistas con fondo y beats binaurales
- **pt-BR:** Crie faixas com fundo e batidas binaurais

### tools.subliminal.textToSpeech

- **EN:** Text-to-Speech
- **es-419:** Texto a voz
- **pt-BR:** Texto para fala

### tools.subliminal.thetaRecommended

- **EN:** Recommended for deep focus and relaxation
- **es-419:** Recomendado para enfoque profundo y relajación
- **pt-BR:** Recomendado para foco profundo e relaxamento

### tools.subliminal.title

- **EN:** Subliminal Maker
- **es-419:** Creador de Subliminales
- **pt-BR:** Criador de Subliminares

### tools.subliminal.toasts.audioEmpty

- **EN:** Audio file is empty. Please record again.
- **es-419:** El archivo de audio está vacío. Graba de nuevo.
- **pt-BR:** O arquivo de áudio está vazio. Grave novamente.

### tools.subliminal.toasts.audioError

- **EN:** Audio error: {{code}} - {{message}}
- **es-419:** Error de audio: {{code}} - {{message}}
- **pt-BR:** Erro de áudio: {{code}} - {{message}}

### tools.subliminal.toasts.audioLoadFailed

- **EN:** Audio failed to load. The file may be corrupted. Please record again.
- **es-419:** No se pudo cargar el audio. El archivo puede estar dañado. Graba de nuevo.
- **pt-BR:** Falha ao carregar o áudio. O arquivo pode estar corrompido. Grave novamente.

### tools.subliminal.toasts.audioProcessorLoadFailed

- **EN:** Audio processor failed to load. Please refresh the page. If the issue persists, contact support.
- **es-419:** No se pudo cargar el procesador de audio. Actualiza la página. Si el problema continúa, contacta a soporte.
- **pt-BR:** Falha ao carregar o processador de áudio. Atualize a página. Se o problema continuar, entre em contato com o suporte.

### tools.subliminal.toasts.audioUnsupported

- **EN:** Failed to play audio. The file format may not be supported.
- **es-419:** No se pudo reproducir el audio. El formato puede no ser compatible.
- **pt-BR:** Falha ao reproduzir o áudio. O formato do arquivo pode não ser compatível.

### tools.subliminal.toasts.backgroundTracksNotLoaded

- **EN:** User background tracks not loaded. Please refresh the page.
- **es-419:** No se cargaron tus pistas de fondo. Actualiza la página.
- **pt-BR:** As faixas de fundo do usuário não foram carregadas. Atualize a página.

### tools.subliminal.toasts.bucketNotFound

- **EN:** Storage bucket 'subliminal-tracks' not found.
- **es-419:** Bucket de almacenamiento 'subliminal-tracks' no encontrado.
- **pt-BR:** Bucket de armazenamento 'subliminal-tracks' não encontrado.

### tools.subliminal.toasts.bucketSizeLimit

- **EN:** File is too large ({{size}} MB). The storage bucket has a maximum file size limit (typically 50 MB per file). Please try a shorter track length (current: {{minutes}} minutes).
- **es-419:** El archivo es muy grande ({{size}} MB). El bucket tiene un límite máximo (típicamente 50 MB por archivo). Prueba con una pista más corta (actual: {{minutes}} minutos).
- **pt-BR:** O arquivo é muito grande ({{size}} MB). O bucket tem limite máximo de tamanho (geralmente 50 MB por arquivo). Tente uma faixa mais curta (atual: {{minutes}} minutos).

### tools.subliminal.toasts.deleteStorageFailed

- **EN:** Failed to delete audio file from storage.
- **es-419:** No se pudo eliminar el archivo de audio del almacenamiento.
- **pt-BR:** Falha ao excluir o arquivo de áudio do armazenamento.

### tools.subliminal.toasts.deleteTrackFailed

- **EN:** Failed to delete track
- **es-419:** No se pudo eliminar la pista
- **pt-BR:** Falha ao excluir a faixa

### tools.subliminal.toasts.enterTrackName

- **EN:** Please enter a track name
- **es-419:** Ingresa un nombre para la pista
- **pt-BR:** Digite um nome para a faixa

### tools.subliminal.toasts.fileLargeWarning

- **EN:** File is large ({{size}} MB). Upload may take a while.
- **es-419:** El archivo es grande ({{size}} MB). La subida puede tardar un poco.
- **pt-BR:** O arquivo é grande ({{size}} MB). O envio pode demorar um pouco.

### tools.subliminal.toasts.fileTooLargeMax

- **EN:** File is too large ({{size}} MB). Maximum file size is {{max}} MB for your tier. Try a shorter track length.
- **es-419:** El archivo es muy grande ({{size}} MB). El tamaño máximo es {{max}} MB para tu plan. Prueba con una pista más corta.
- **pt-BR:** O arquivo é muito grande ({{size}} MB). O tamanho máximo é {{max}} MB para o seu plano. Tente uma faixa mais curta.

### tools.subliminal.toasts.fileTooLargeRemaining

- **EN:** File is too large ({{size}} MB). You have {{remaining}} MB remaining. Try a shorter track length.
- **es-419:** El archivo es muy grande ({{size}} MB). Te quedan {{remaining}} MB. Prueba con una pista más corta.
- **pt-BR:** O arquivo é muito grande ({{size}} MB). Você tem {{remaining}} MB restantes. Tente uma faixa mais curta.

### tools.subliminal.toasts.generateAudioFailed

- **EN:** Failed to generate audio. Please try again.
- **es-419:** No se pudo generar el audio. Inténtalo de nuevo.
- **pt-BR:** Falha ao gerar o áudio. Tente novamente.

### tools.subliminal.toasts.generateTrackFailed

- **EN:** Failed to generate track. Please try again.
- **es-419:** No se pudo generar la pista. Inténtalo de nuevo.
- **pt-BR:** Falha ao gerar a faixa. Tente novamente.

### tools.subliminal.toasts.generationTimeout

- **EN:** Track generation timed out. Please try again with a shorter duration.
- **es-419:** La generación de la pista expiró. Inténtalo de nuevo con una duración más corta.
- **pt-BR:** A geração da faixa expirou. Tente novamente com uma duração menor.

### tools.subliminal.toasts.genericError

- **EN:** Error. Please try again.
- **es-419:** Error. Inténtalo de nuevo.
- **pt-BR:** Erro. Tente novamente.

### tools.subliminal.toasts.interactFirst

- **EN:** Please interact with the page first.
- **es-419:** Interactúa con la página primero.
- **pt-BR:** Interaja com a página primeiro.

### tools.subliminal.toasts.loadFailed

- **EN:** Failed to load tracks: {{message}}
- **es-419:** No se pudieron cargar las pistas: {{message}}
- **pt-BR:** Falha ao carregar as faixas: {{message}}

### tools.subliminal.toasts.loadTimeout

- **EN:** Audio took too long to load. Please try again.
- **es-419:** El audio tardó demasiado en cargar. Inténtalo de nuevo.
- **pt-BR:** O áudio demorou demais para carregar. Tente novamente.

### tools.subliminal.toasts.loadTrackFailed

- **EN:** Failed to load track. Please try again.
- **es-419:** No se pudo cargar la pista. Inténtalo de nuevo.
- **pt-BR:** Falha ao carregar a faixa. Tente novamente.

### tools.subliminal.toasts.loginAgain

- **EN:** Session expired. Please log in again.
- **es-419:** Sesión expirada. Inicia sesión de nuevo.
- **pt-BR:** Sessão expirada. Faça login novamente.

### tools.subliminal.toasts.loginToDelete

- **EN:** You must be logged in to delete tracks.
- **es-419:** Debes iniciar sesión para eliminar pistas.
- **pt-BR:** Você precisa estar logado para excluir faixas.

### tools.subliminal.toasts.loginToGenerate

- **EN:** Please log in to generate audio
- **es-419:** Inicia sesión para generar audio
- **pt-BR:** Faça login para gerar áudio

### tools.subliminal.toasts.loginToGenerateTrack

- **EN:** You must be logged in to generate tracks.
- **es-419:** Debes iniciar sesión para generar pistas.
- **pt-BR:** Você precisa estar logado para gerar faixas.

### tools.subliminal.toasts.loginToGenerateTracks

- **EN:** You must be logged in to generate tracks. Please refresh the page and try again.
- **es-419:** Debes iniciar sesión para generar pistas. Actualiza la página e inténtalo de nuevo.
- **pt-BR:** Você precisa estar logado para gerar faixas. Atualize a página e tente novamente.

### tools.subliminal.toasts.maxTrackLength

- **EN:** Maximum track length is {{max}} minutes for your tier. Upgrade to access longer tracks.
- **es-419:** La duración máxima de pista es {{max}} minutos para tu plan. Mejora tu plan para pistas más largas.
- **pt-BR:** A duração máxima da faixa é {{max}} minutos para o seu plano. Faça upgrade para faixas mais longas.

### tools.subliminal.toasts.micAccessPrefix

- **EN:** Could not access microphone. 
- **es-419:** No se pudo acceder al micrófono. 
- **pt-BR:** Não foi possível acessar o microfone. 

### tools.subliminal.toasts.micAndroidSettings

- **EN:** Open Android Settings → Apps → Palette Plotting → Permissions → Microphone, then allow.
- **es-419:** Abre Ajustes de Android → Apps → Palette Plotting → Permisos → Micrófono y permite el acceso.
- **pt-BR:** Abra Configurações do Android → Apps → Palette Plotting → Permissões → Microfone e permita o acesso.

### tools.subliminal.toasts.micBrowserSettings

- **EN:** Please allow microphone access in your browser settings.
- **es-419:** Permite el acceso al micrófono en la configuración de tu navegador.
- **pt-BR:** Permita o acesso ao microfone nas configurações do navegador.

### tools.subliminal.toasts.micCheckSettings

- **EN:** Please check your microphone settings.
- **es-419:** Revisa la configuración de tu micrófono.
- **pt-BR:** Verifique as configurações do microfone.

### tools.subliminal.toasts.micInUse

- **EN:** Microphone is being used by another application.
- **es-419:** El micrófono está siendo usado por otra aplicación.
- **pt-BR:** O microfone está sendo usado por outro aplicativo.

### tools.subliminal.toasts.noAudioContent

- **EN:** No audio content received from server
- **es-419:** No se recibió contenido de audio del servidor
- **pt-BR:** Nenhum conteúdo de áudio recebido do servidor

### tools.subliminal.toasts.noAudioToPlay

- **EN:** No audio to play. Please record audio first.
- **es-419:** No hay audio para reproducir. Graba audio primero.
- **pt-BR:** Nenhum áudio para reproduzir. Grave áudio primeiro.

### tools.subliminal.toasts.noMicrophone

- **EN:** No microphone found on this device.
- **es-419:** No se encontró micrófono en este dispositivo.
- **pt-BR:** Nenhum microfone encontrado neste dispositivo.

### tools.subliminal.toasts.permissionDenied

- **EN:** Permission denied. Please ensure you're logged in and try again.
- **es-419:** Permiso denegado. Asegúrate de haber iniciado sesión e inténtalo de nuevo.
- **pt-BR:** Permissão negada. Certifique-se de estar logado e tente novamente.

### tools.subliminal.toasts.playFailedPrefix

- **EN:** Failed to play audio. 
- **es-419:** No se pudo reproducir el audio. 
- **pt-BR:** Falha ao reproduzir o áudio. 

### tools.subliminal.toasts.playTrackFailed

- **EN:** Failed to play track. Please try again.
- **es-419:** No se pudo reproducir la pista. Inténtalo de nuevo.
- **pt-BR:** Falha ao reproduzir a faixa. Tente novamente.

### tools.subliminal.toasts.playTrackFailedPrefix

- **EN:** Failed to play track. 
- **es-419:** No se pudo reproducir la pista. 
- **pt-BR:** Falha ao reproduzir a faixa. 

### tools.subliminal.toasts.playingAudio

- **EN:** Playing audio
- **es-419:** Reproduciendo audio
- **pt-BR:** Reproduzindo áudio

### tools.subliminal.toasts.playingTrack

- **EN:** Playing: {{name}}
- **es-419:** Reproduciendo: {{name}}
- **pt-BR:** Reproduzindo: {{name}}

### tools.subliminal.toasts.processAudioFailed

- **EN:** Failed to process audio data. Please try again.
- **es-419:** No se pudieron procesar los datos de audio. Inténtalo de nuevo.
- **pt-BR:** Falha ao processar os dados de áudio. Tente novamente.

### tools.subliminal.toasts.recordAffirmationsFirst

- **EN:** Please record affirmations first
- **es-419:** Graba las afirmaciones primero
- **pt-BR:** Grave as afirmações primeiro

### tools.subliminal.toasts.recordingEmpty

- **EN:** Recording failed. Audio file is empty.
- **es-419:** Falló la grabación. El archivo de audio está vacío.
- **pt-BR:** Falha na gravação. O arquivo de áudio está vazio.

### tools.subliminal.toasts.recordingError

- **EN:** Recording error occurred. Please try again.
- **es-419:** Ocurrió un error de grabación. Inténtalo de nuevo.
- **pt-BR:** Ocorreu um erro de gravação. Tente novamente.

### tools.subliminal.toasts.recordingNoData

- **EN:** Recording failed. No audio data captured.
- **es-419:** Falló la grabación. No se capturaron datos de audio.
- **pt-BR:** Falha na gravação. Nenhum dado de áudio capturado.

### tools.subliminal.toasts.recordingSaved

- **EN:** Recording saved!
- **es-419:** ¡Grabación guardada!
- **pt-BR:** Gravação salva!

### tools.subliminal.toasts.recordingStarted

- **EN:** Recording started
- **es-419:** Grabación iniciada
- **pt-BR:** Gravação iniciada

### tools.subliminal.toasts.recordingStopped

- **EN:** Recording stopped
- **es-419:** Grabación detenida
- **pt-BR:** Gravação interrompida

### tools.subliminal.toasts.selectAffirmationSetFirst

- **EN:** Please select an affirmation set first
- **es-419:** Selecciona un set de afirmaciones primero
- **pt-BR:** Selecione um conjunto de afirmações primeiro

### tools.subliminal.toasts.selectBackgroundSound

- **EN:** Please select a background sound
- **es-419:** Selecciona un sonido de fondo
- **pt-BR:** Selecione um som de fundo

### tools.subliminal.toasts.serverError

- **EN:** Server error ({{status}}).
- **es-419:** Error del servidor ({{status}}).
- **pt-BR:** Erro do servidor ({{status}}).

### tools.subliminal.toasts.sessionExpired

- **EN:** Session expired. Please refresh the page and log in again.
- **es-419:** Sesión expirada. Actualiza la página e inicia sesión de nuevo.
- **pt-BR:** Sessão expirada. Atualize a página e faça login novamente.

### tools.subliminal.toasts.sessionMismatch

- **EN:** Session mismatch detected. Please refresh the page and try again.
- **es-419:** Se detectó un desajuste de sesión. Actualiza la página e inténtalo de nuevo.
- **pt-BR:** Incompatibilidade de sessão detectada. Atualize a página e tente novamente.

### tools.subliminal.toasts.sessionVerificationFailed

- **EN:** Session verification failed. Please log in again.
- **es-419:** Falló la verificación de sesión. Inicia sesión de nuevo.
- **pt-BR:** Falha na verificação da sessão. Faça login novamente.

### tools.subliminal.toasts.storagePermissionDenied

- **EN:** Storage permission denied. Please contact support.
- **es-419:** Permiso de almacenamiento denegado. Contacta a soporte.
- **pt-BR:** Permissão de armazenamento negada. Entre em contato com o suporte.

### tools.subliminal.toasts.tapAgain

- **EN:** Please try tapping the play button again.
- **es-419:** Intenta tocar el botón de reproducir de nuevo.
- **pt-BR:** Tente tocar no botão de reproduzir novamente.

### tools.subliminal.toasts.tapPlayAgain

- **EN:** Please tap the play button again. Mobile browsers require direct user interaction.
- **es-419:** Toca el botón de reproducir de nuevo. Los navegadores móviles requieren interacción directa.
- **pt-BR:** Toque no botão de reproduzir novamente. Navegadores móveis exigem interação direta do usuário.

### tools.subliminal.toasts.tierStorageLimit

- **EN:** File is too large ({{size}} MB). You have {{remaining}} MB remaining. Please try a shorter track length (current: {{minutes}} minutes).
- **es-419:** El archivo es muy grande ({{size}} MB). Te quedan {{remaining}} MB. Prueba con una pista más corta (actual: {{minutes}} minutos).
- **pt-BR:** O arquivo é muito grande ({{size}} MB). Você tem {{remaining}} MB restantes. Tente uma faixa mais curta (atual: {{minutes}} minutos).

### tools.subliminal.toasts.trackDeleted

- **EN:** Track deleted
- **es-419:** Pista eliminada
- **pt-BR:** Faixa excluída

### tools.subliminal.toasts.trackGenerated

- **EN:** Subliminal track "{{name}}" generated and saved!
- **es-419:** ¡Pista subliminal "{{name}}" generada y guardada!
- **pt-BR:** Faixa subliminar "{{name}}" gerada e salva!

### tools.subliminal.toasts.trackGeneratedSaved

- **EN:** Track "{{name}}" generated and saved!
- **es-419:** ¡Pista "{{name}}" generada y guardada!
- **pt-BR:** Faixa "{{name}}" gerada e salva!

### tools.subliminal.toasts.ttsCharLimit

- **EN:** Text-to-Speech has a 480 character limit. Your text is {{length}} characters. Please shorten your affirmations.
- **es-419:** Texto a voz tiene un límite de 480 caracteres. Tu texto tiene {{length}} caracteres. Acorta tus afirmaciones.
- **pt-BR:** Texto para fala tem limite de 480 caracteres. Seu texto tem {{length}} caracteres. Encurte suas afirmações.

### tools.subliminal.toasts.ttsUpgrade

- **EN:** Text-to-Speech requires an upgrade. Please upgrade to access this feature.
- **es-419:** Texto a voz requiere una mejora de plan. Mejora tu plan para acceder.
- **pt-BR:** Texto para fala requer upgrade de plano. Faça upgrade para acessar este recurso.

### tools.subliminal.toasts.unknownError

- **EN:** Unknown error
- **es-419:** Error desconocido
- **pt-BR:** Erro desconhecido

### tools.subliminal.toasts.uploadFailed

- **EN:** Failed to upload file.
- **es-419:** No se pudo subir el archivo.
- **pt-BR:** Falha ao enviar o arquivo.

### tools.subliminal.toasts.userTrackMissingUrl

- **EN:** This background track has no audio file. It may have been deleted.
- **es-419:** Esta pista de fondo no tiene archivo de audio. Puede haber sido eliminada.
- **pt-BR:** Esta faixa de fundo não tem arquivo de áudio. Ela pode ter sido excluída.

### tools.subliminal.toasts.userTrackNotFound

- **EN:** User track not found. Please select a different background sound.
- **es-419:** No se encontró la pista de fondo. Selecciona otro sonido de fondo.
- **pt-BR:** Faixa de fundo não encontrada. Selecione outro som de fundo.

### tools.subliminal.toasts.voiceGenerated

- **EN:** Voice generated successfully!
- **es-419:** ¡Voz generada correctamente!
- **pt-BR:** Voz gerada com sucesso!

### tools.subliminal.toasts.weeklyCheckFailed

- **EN:** Unable to check weekly limit. Please try again.
- **es-419:** No se pudo verificar el límite semanal. Inténtalo de nuevo.
- **pt-BR:** Não foi possível verificar o limite semanal. Tente novamente.

### tools.subliminal.toasts.weeklyLimitReached

- **EN:** Weekly generation limit reached ({{current}}/{{limit}}). Your limit resets on Monday.
- **es-419:** Límite semanal de generaciones alcanzado ({{current}}/{{limit}}). Tu límite se reinicia el lunes.
- **pt-BR:** Limite semanal de gerações atingido ({{current}}/{{limit}}). Seu limite reinicia na segunda-feira.

### tools.subliminal.trackLength

- **EN:** Track Length: {{minutes}} minutes
- **es-419:** Duración de la pista: {{minutes}} minutos
- **pt-BR:** Duração da faixa: {{minutes}} minutos

### tools.subliminal.trackNamePlaceholder

- **EN:** e.g., Morning Motivation
- **es-419:** p. ej., Motivación matutina
- **pt-BR:** p. ex., Motivação matinal

### tools.subliminal.trackOptions

- **EN:** Track options
- **es-419:** Opciones de pista
- **pt-BR:** Opções da faixa

### tools.subliminal.turnOffLoop

- **EN:** Turn off loop
- **es-419:** Desactivar repetición
- **pt-BR:** Desativar repetição

### tools.subliminal.vocalBase

- **EN:** Vocal Base
- **es-419:** Base vocal
- **pt-BR:** Base vocal

### tools.subliminal.voiceNotAudible

- **EN:** Voice present but not well audible below 20%
- **es-419:** La voz está presente pero poco audible por debajo del 20%
- **pt-BR:** A voz está presente, mas pouco audível abaixo de 20%

### tools.subliminal.weeklyCreations

- **EN:** Weekly Creations:
- **es-419:** Creaciones semanales:
- **pt-BR:** Criações semanais:

### tools.subliminal.willGenerate

- **EN:** Will generate: {{count}} affirmations
- **es-419:** Se generarán: {{count}} afirmaciones
- **pt-BR:** Serão geradas: {{count}} afirmações

### tools.subliminal.yourTracks

- **EN:** Your Tracks
- **es-419:** Tus pistas
- **pt-BR:** Suas faixas


---

# Section 5 — Still hardcoded in source

## affirmations-data.ts SUPPORT_CATEGORIES fallback labels (only if tools.supportCategories key missing)

- Love / SP
- Beauty / Glow Up
- Self-Concept
- Money
- Focus
- Life Reset
- Body / Fitness
- Wellness
- Discipline
- Career
- Business
- School / Exams

## Guide.tsx character names (display only, English)

- River, Sage, Rose, Oliver

## Legal page bodies

- Terms, Privacy, EULA, Billing, DMCA, Acceptable Use — English HTML pages only

## Wired to i18n (no longer hardcoded)

- Routine item labels → `settings.routine.itemLabels.*` (ManifestationIntensity + ManifestationRoutineSettings)
- SMS verification → `settings.profile.smsVerificationMessage`

---

# Section 6 — Namespace key counts

- auth: 59 keys
- common: 21 keys
- dashboard: 57 keys
- marketing: 275 keys
- onboarding: 394 keys
- paywall: 125 keys
- settings: 159 keys
- support: 85 keys
- tools: 819 keys
