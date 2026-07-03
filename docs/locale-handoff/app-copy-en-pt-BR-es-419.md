# Palette Plotting app copy — en (reference) · pt-BR · es-419

**Status:** All three locales are wired in production (`src/i18n/locales/en/`, `pt-BR/`, `es-419/`). Regenerated from runtime JSON so this matches what users see.

**Last synced:** 2026-06-09

## For ChatGPT

**English (`en`) is the reference copy.** Use it to judge meaning, tone, and length. Propose edits to **pt-BR** and **es-419** only unless English itself is wrong.

### Default rules (unless you override in your prompt)

- **Do not** change i18n keys, namespaces, or JSON structure — copy only
- **Keep placeholders exactly:** `{{name}}`, `{{pct}}`, `{{limit}}`, `{{year}}`, etc.
- **Keep product terms:** Scripting, Tap-in, SP (specific person), Palette Plotting, River, Sage, Rose, Oliver
- **es-419 settings nav:** **Ajustes** — intentional; do not switch globally to Configuración
- **Language switcher labels (never translate):** English · Español · Português
- **pt-BR optional polish (non-blocker):** some toasts use “Falha ao…” vs “Não foi possível…”
- **es-419 paywall title:** “Desbloquea tus herramientas de manifestación hoy.” (no “stack”)

### Suggested reply format

Only list strings you would change:

```
namespace > key
pt-BR: "proposed text"
es-419: "proposed text"
reason: one line
```

### Your special instructions

_Paste your task below when you open this in ChatGPT, e.g. focus area, tone, or locale priority._

---

## Review status

| Locale | Role | Runtime |
|--------|------|---------|
| **en** | Reference / source | Complete (9 namespaces) |
| **pt-BR** | Target locale | Complete — directionally approved |
| **es-419** | Target locale | Complete — approved after fix pass |

## Shared conventions

- **Namespaces:** `common`, `dashboard`, `onboarding`, `settings`, `auth`, `paywall`, `tools`, `support`, `marketing`
- **home.defaultName:** blank in pt-BR and es-419 (no fallback “there/allí”)
- **Manifestation intensity locked-in:** pt-BR **Focado** · es-419 **Enfocado**
- **Inspired actions section:** pt-BR **Ações inspiradas** · es-419 **Acciones inspiradas**
- **TTS:** pt-BR **texto para fala** · es-419 **texto a voz**

---

## Common — shared buttons & labels

Namespace: `common`

- **continue**
  - **en:** Continue
  - **pt-BR:** Continuar
  - **es-419:** Continuar

- **back**
  - **en:** Back
  - **pt-BR:** Voltar
  - **es-419:** Atrás

- **save**
  - **en:** Save
  - **pt-BR:** Salvar
  - **es-419:** Guardar

- **cancel**
  - **en:** Cancel
  - **pt-BR:** Cancelar
  - **es-419:** Cancelar

- **close**
  - **en:** Close
  - **pt-BR:** Fechar
  - **es-419:** Cerrar

- **loading**
  - **en:** Loading…
  - **pt-BR:** Carregando…
  - **es-419:** Cargando…

- **error**
  - **en:** Something went wrong
  - **pt-BR:** Algo deu errado
  - **es-419:** Algo salió mal

- **legalEnglishDisclaimer**
  - **en:** Terms and Privacy are currently provided in English.
  - **pt-BR:** Termos e Privacidade estão em inglês.
  - **es-419:** Términos y Privacidad están en inglés.

- **edgeErrors > permissionDenied**
  - **en:** Permission denied. Please ensure you're logged in and try again.
  - **pt-BR:** Permissão negada. Entre e tente de novo.
  - **es-419:** Permiso denegado. Inicia sesión e inténtalo de nuevo.

- **edgeErrors > genericRetry**
  - **en:** An error occurred. Please try again.
  - **pt-BR:** Ocorreu um erro. Tente novamente.
  - **es-419:** Ocurrió un error. Inténtalo de nuevo.

- **edgeErrors > databaseError**
  - **en:** Database error. Please try again.
  - **pt-BR:** Erro no banco. Tente de novo.
  - **es-419:** Error de base de datos. Intenta de nuevo.

- **edgeErrors > serviceUnavailable**
  - **en:** Service temporarily unavailable. Please try again.
  - **pt-BR:** Serviço temporariamente indisponível. Tente novamente.
  - **es-419:** Servicio temporalmente no disponible. Inténtalo de nuevo.

- **edgeErrors > unknownError**
  - **en:** Unknown error
  - **pt-BR:** Erro desconhecido
  - **es-419:** Error desconocido

- **edgeErrors > noCharacterSelected**
  - **en:** No character selected. Please select a character first.
  - **pt-BR:** Selecione um personagem primeiro.
  - **es-419:** Selecciona un personaje primero.

- **edgeErrors > failedToGenerateMessage**
  - **en:** Failed to generate message
  - **pt-BR:** Falha ao gerar mensagem
  - **es-419:** No se pudo generar el mensaje

- **edgeErrors > noMessageGenerated**
  - **en:** No message generated
  - **pt-BR:** Nenhuma mensagem gerada
  - **es-419:** No se generó ningún mensaje

- **edgeErrors > dailyMessageLimit**
  - **en:** You've reached your daily message limit ({{limit}} messages). Resets at midnight.
  - **pt-BR:** Você atingiu seu limite diário de mensagens ({{limit}}). O limite reinicia à meia-noite.
  - **es-419:** Alcanzaste tu límite diario de mensajes ({{limit}}). Se reinicia a medianoche.

## Dashboard & navigation

Namespace: `dashboard`

- **greeting > morning**
  - **en:** Good morning
  - **pt-BR:** Bom dia
  - **es-419:** Buenos días

- **greeting > afternoon**
  - **en:** Good afternoon
  - **pt-BR:** Boa tarde
  - **es-419:** Buenas tardes

- **greeting > evening**
  - **en:** Good evening
  - **pt-BR:** Boa noite
  - **es-419:** Buenas noches

- **manifestationCharge > needsPersistence**
  - **en:** Needs Persistence
  - **pt-BR:** Precisa de constância
  - **es-419:** Necesita constancia

- **manifestationCharge > lockedIn**
  - **en:** Locked In
  - **pt-BR:** Focado
  - **es-419:** Enfocado

- **manifestationCharge > aligned**
  - **en:** Aligned
  - **pt-BR:** Alinhado
  - **es-419:** Alineado

- **manifestationCharge > percentToday**
  - **en:** {{pct}}% aligned today
  - **pt-BR:** {{pct}}% alinhado hoje
  - **es-419:** {{pct}}% alineado hoy

- **sections > inspiredActions**
  - **en:** Inspired Actions
  - **pt-BR:** Ações inspiradas
  - **es-419:** Acciones inspiradas

- **sections > manifestationCharge**
  - **en:** Manifestation Charge
  - **pt-BR:** Energia de manifestação
  - **es-419:** Energía de manifestación

- **sections > tools**
  - **en:** Tools
  - **pt-BR:** Ferramentas
  - **es-419:** Herramientas

- **sections > dailyPractice**
  - **en:** Inspired Actions
  - **pt-BR:** Ações inspiradas
  - **es-419:** Acciones inspiradas

- **home > subtitle**
  - **en:** Everything you need to manifest, in one place.
  - **pt-BR:** Tudo que você precisa para manifestar.
  - **es-419:** Todo lo que necesitas para manifestar.

- **home > pageTitle**
  - **en:** Dashboard | Palette Plotting
  - **pt-BR:** Painel | Palette Plotting
  - **es-419:** Panel | Palette Plotting

- **home > defaultName**
  - **en:** there
  - **pt-BR:** 
  - **es-419:** 

- **inspiredActions > footer**
  - **en:** Affirm daily & embody the new story for coherence and alignment.
  - **pt-BR:** Afirme e encarne a nova história diariamente.
  - **es-419:** Afirma y encarna la nueva historia a diario.

- **appearance > light**
  - **en:** Light
  - **pt-BR:** Claro
  - **es-419:** Claro

- **appearance > dark**
  - **en:** Dark
  - **pt-BR:** Escuro
  - **es-419:** Oscuro

- **profile > defaultUser**
  - **en:** User
  - **pt-BR:** Usuário
  - **es-419:** Usuario

- **profile > yourAccount**
  - **en:** Your Account
  - **pt-BR:** Sua conta
  - **es-419:** Tu cuenta

- **nav > home**
  - **en:** Home
  - **pt-BR:** Início
  - **es-419:** Inicio

- **nav > affirmScript**
  - **en:** Affirm & Script
  - **pt-BR:** Afirmar e escrever
  - **es-419:** Afirmar y escribir

- **nav > yourJourney**
  - **en:** Your Journey
  - **pt-BR:** Sua jornada
  - **es-419:** Tu camino

- **nav > settings**
  - **en:** Settings
  - **pt-BR:** Configurações
  - **es-419:** Ajustes

- **nav > appearance**
  - **en:** Appearance
  - **pt-BR:** Aparência
  - **es-419:** Apariencia

- **nav > talkToGuide**
  - **en:** Talk to Guide
  - **pt-BR:** Falar com o guia
  - **es-419:** Hablar con tu guía

- **nav > help**
  - **en:** Help
  - **pt-BR:** Ajuda
  - **es-419:** Ayuda

- **nav > signOut**
  - **en:** Sign out
  - **pt-BR:** Sair
  - **es-419:** Cerrar sesión

- **nav > signOutError**
  - **en:** Error signing out
  - **pt-BR:** Erro ao sair
  - **es-419:** Error al cerrar sesión

- **tools > affirmScript > title**
  - **en:** Affirm & Script
  - **pt-BR:** Afirmar e escrever
  - **es-419:** Afirmar y escribir

- **tools > affirmScript > description**
  - **en:** Build affirmation sequences and visual goals
  - **pt-BR:** Crie afirmações e metas visuais
  - **es-419:** Crea afirmaciones y metas visuales

- **tools > subliminalMaker > title**
  - **en:** Subliminal Maker
  - **pt-BR:** Criador de subliminares
  - **es-419:** Creador de subliminales

- **tools > subliminalMaker > description**
  - **en:** Create custom audio for daily listening
  - **pt-BR:** Crie áudios para ouvir diariamente
  - **es-419:** Crea audios para escuchar a diario

- **tools > mirrorWork > title**
  - **en:** Mirror Work
  - **pt-BR:** Trabalho com espelho
  - **es-419:** Trabajo con espejo

- **tools > mirrorWork > description**
  - **en:** Practice affirmations with real-time reflection
  - **pt-BR:** Afirme com seu reflexo
  - **es-419:** Afirma con tu reflejo

- **tools > beliefWork > title**
  - **en:** Belief Work
  - **pt-BR:** Trabalho de crenças
  - **es-419:** Trabajo de creencias

- **tools > beliefWork > description**
  - **en:** Explore beliefs you want to release or integrate
  - **pt-BR:** Libere ou integre crenças
  - **es-419:** Suelta o integra creencias

- **tools > embody > title**
  - **en:** Embody
  - **pt-BR:** Encarnar
  - **es-419:** Encarnar

- **tools > embody > description**
  - **en:** Track daily progress in your new story
  - **pt-BR:** Acompanhe sua nova história
  - **es-419:** Sigue tu nueva historia

- **tools > yourJourney > title**
  - **en:** Your Journey
  - **pt-BR:** Sua jornada
  - **es-419:** Tu camino

- **tools > yourJourney > description**
  - **en:** Journal, reflections, and guide chat
  - **pt-BR:** Diário, reflexões e guia
  - **es-419:** Diario, reflexiones y guía

- **supportTools > dashboard**
  - **en:** Dashboard (home)
  - **pt-BR:** Painel (início)
  - **es-419:** Panel (inicio)

- **supportTools > affirmationVisualizer**
  - **en:** Affirmation Visualizer
  - **pt-BR:** Visualizador de afirmações
  - **es-419:** Visualizador de afirmaciones

- **supportTools > talkToGuide**
  - **en:** Talk to Guide (Chat)
  - **pt-BR:** Falar com o guia (chat)
  - **es-419:** Hablar con tu guía (chat)

- **supportTools > musicComposer**
  - **en:** Music Composer
  - **pt-BR:** Compositor musical
  - **es-419:** Compositor musical

- **supportTools > tapIn**
  - **en:** Tap-in / Piano
  - **pt-BR:** Tap-in / Piano
  - **es-419:** Tap-in / Piano

- **supportTools > activityTracking**
  - **en:** Activity tracking
  - **pt-BR:** Atividade
  - **es-419:** Actividad

- **supportTools > journal**
  - **en:** Manifestation journal
  - **pt-BR:** Diário de manifestação
  - **es-419:** Diario de manifestación

- **supportTools > settingsAccount**
  - **en:** Settings / Account
  - **pt-BR:** Configurações / Conta
  - **es-419:** Ajustes / Cuenta

- **supportTools > billing**
  - **en:** Billing / subscriptions
  - **pt-BR:** Assinatura / pagamentos
  - **es-419:** Facturación / suscripciones

- **supportTools > other**
  - **en:** Other (new tool or not listed)
  - **pt-BR:** Outro
  - **es-419:** Otro

- **billingChannels > apple**
  - **en:** Apple App Store
  - **pt-BR:** Apple App Store
  - **es-419:** Apple App Store

- **billingChannels > googlePlay**
  - **en:** Google Play
  - **pt-BR:** Google Play
  - **es-419:** Google Play

- **billingChannels > web**
  - **en:** Web (card / checkout)
  - **pt-BR:** Web (cartão / pagamento)
  - **es-419:** Web (tarjeta / pago)

## Onboarding & setup funnel

Namespace: `onboarding`

- **welcome > signUp**
  - **en:** Sign Up
  - **pt-BR:** Cadastrar
  - **es-419:** Registrarse

- **welcome > ctaSubtext**
  - **en:** Personalize your first subliminal in less than 3 minutes
  - **pt-BR:** Crie seu primeiro subliminar em 3 minutos
  - **es-419:** Crea tu primer subliminal en 3 minutos

- **welcome > freeTrialLine**
  - **en:** Start your free trial
  - **pt-BR:** Comece seu teste grátis
  - **es-419:** Comienza tu prueba gratis

- **welcome > nativeTitle**
  - **en:** Your manifesting methods, in one place
  - **pt-BR:** Seus métodos de manifestação
  - **es-419:** Tus métodos de manifestación

- **welcome > nativeDescription**
  - **en:** Manifest on easy mode with one solution for all core techniques. Make your own subliminals, customize your affirmations, do mirror work, and more.
  - **pt-BR:** Manifeste com facilidade. Crie subliminares, personalize afirmações, faça trabalho com espelho e mais.
  - **es-419:** Manifiesta con facilidad. Crea subliminales, personaliza afirmaciones, haz trabajo con espejo y más.

- **welcome > awardLine1**
  - **en:** One of the most
  - **pt-BR:** Um dos apps
  - **es-419:** Una de las apps

- **welcome > awardLine2**
  - **en:** comprehensive
  - **pt-BR:** de manifestação
  - **es-419:** de manifestación

- **welcome > awardLine3**
  - **en:** manifesting apps
  - **pt-BR:** mais completos
  - **es-419:** más completas

- **welcome > webHeadline1**
  - **en:** Manifest your desires now,
  - **pt-BR:** Manifeste seus desejos agora,
  - **es-419:** Manifiesta tus deseos ahora,

- **welcome > webHeadlineAccent**
  - **en:** Make your own subliminals
  - **pt-BR:** Crie seus subliminares
  - **es-419:** Crea tus subliminales

- **welcome > toolRows > row1 (line 1)**
  - **en:** Subliminal Maker
  - **pt-BR:** Subliminares
  - **es-419:** Subliminales

- **welcome > toolRows > row1 (line 2)**
  - **en:** Robotic Affirming
  - **pt-BR:** Afirmações robóticas
  - **es-419:** Afirmaciones robóticas

- **welcome > toolRows > row1 (line 3)**
  - **en:** Scripting
  - **pt-BR:** Scripting
  - **es-419:** Scripting

- **welcome > toolRows > row2 (line 1)**
  - **en:** Mirror Work
  - **pt-BR:** Trabalho com espelho
  - **es-419:** Trabajo con espejo

- **welcome > toolRows > row2 (line 2)**
  - **en:** Belief Work
  - **pt-BR:** Crenças
  - **es-419:** Creencias

- **welcome > toolRows > row2 (line 3)**
  - **en:** Inspired Action
  - **pt-BR:** Ação inspirada
  - **es-419:** Acción inspirada

- **welcome > toolRows > row3 (line 1)**
  - **en:** Manifestation Lists
  - **pt-BR:** Listas
  - **es-419:** Listas

- **welcome > toolRows > row3 (line 2)**
  - **en:** AI Manifesting Guide
  - **pt-BR:** Guia com IA
  - **es-419:** Guía con IA

- **welcome > webSteps > desire > title**
  - **en:** Choose your desire
  - **pt-BR:** Escolha seu desejo
  - **es-419:** Elige tu deseo

- **welcome > webSteps > desire > subtitle**
  - **en:** Love · SP · Beauty · Abundance · Self-concept
  - **pt-BR:** Amor · SP · Beleza · Abundância
  - **es-419:** Amor · SP · Belleza · Abundancia

- **welcome > webSteps > makeYours > title**
  - **en:** Make it yours
  - **pt-BR:** Faça do seu jeito
  - **es-419:** Hazlo tuyo

- **welcome > webSteps > makeYours > subtitle**
  - **en:** Your affirmations, your voice, your sounds
  - **pt-BR:** Suas afirmações, sua voz, seus sons
  - **es-419:** Tus afirmaciones, tu voz, tus sonidos

- **welcome > webSteps > listen > title**
  - **en:** Listen & repeat
  - **pt-BR:** Ouça e repita
  - **es-419:** Escucha y repite

- **welcome > webSteps > listen > subtitle**
  - **en:** Your subliminals, ready to play daily
  - **pt-BR:** Subliminares prontos para ouvir
  - **es-419:** Subliminales listos para escuchar

- **welcome > webToolbar > robotic**
  - **en:** Robotic Affirming
  - **pt-BR:** Afirmações robóticas
  - **es-419:** Afirmaciones robóticas

- **welcome > webToolbar > scripting**
  - **en:** Scripting
  - **pt-BR:** Scripting
  - **es-419:** Scripting

- **welcome > webToolbar > mirror**
  - **en:** Mirror Work
  - **pt-BR:** Espelho
  - **es-419:** Espejo

- **welcome > webToolbar > more**
  - **en:** & More
  - **pt-BR:** E mais
  - **es-419:** Y más

- **setup > name > title**
  - **en:** Welcome! What should Palette Plotting call you?
  - **pt-BR:** Como devemos te chamar?
  - **es-419:** ¿Cómo quieres que te llamemos?

- **setup > name > firstNameLabel**
  - **en:** First name
  - **pt-BR:** Nome
  - **es-419:** Nombre

- **setup > name > firstNamePlaceholder**
  - **en:** Your first name
  - **pt-BR:** Seu nome
  - **es-419:** Tu nombre

- **setup > name > saveError**
  - **en:** Could not save your name. Check your connection and try again.
  - **pt-BR:** Não foi possível salvar. Tente de novo.
  - **es-419:** No pudimos guardarlo. Intenta de nuevo.

- **setup > desireCategory > title**
  - **en:** What do you want to manifest most?
  - **pt-BR:** O que você mais quer manifestar?
  - **es-419:** ¿Qué quieres manifestar más?

- **setup > desireCategory > subtitle**
  - **en:** Select one focus area.
  - **pt-BR:** Escolha um foco.
  - **es-419:** Elige un enfoque.

- **setup > conditionalSpecificity > subtitle**
  - **en:** We'll use this to shape your guidance in the app.
  - **pt-BR:** Isso define sua orientação no app.
  - **es-419:** Esto define tu guía en la app.

- **setup > conditionalSpecificity > fallbackHeadline**
  - **en:** A quick detail
  - **pt-BR:** Um detalhe rápido
  - **es-419:** Un detalle rápido

- **setup > conditionalSpecificity > fallbackMessage**
  - **en:** Go back and pick one of the twelve focus areas to unlock this step.
  - **pt-BR:** Volte e escolha uma área de foco.
  - **es-419:** Regresa y elige un área de enfoque.

- **setup > conditionalSpecificity > customLabel**
  - **en:** Describe your focus
  - **pt-BR:** Descreva seu foco
  - **es-419:** Describe tu enfoque

- **setup > conditionalSpecificity > spPerson > headline**
  - **en:** Is there a specific person connected to this desire?
  - **pt-BR:** Há uma pessoa específica ligada a este desejo?
  - **es-419:** ¿Hay una persona específica ligada a este deseo?

- **setup > conditionalSpecificity > spPerson > nameLabel**
  - **en:** What should we call them?
  - **pt-BR:** Que nome usamos?
  - **es-419:** ¿Qué nombre usamos?

- **setup > conditionalSpecificity > spPerson > choices > yes**
  - **en:** Yes
  - **pt-BR:** Sim
  - **es-419:** Sí

- **setup > conditionalSpecificity > spPerson > choices > no**
  - **en:** No
  - **pt-BR:** Não
  - **es-419:** No

- **setup > conditionalSpecificity > spPerson > choices > complicated**
  - **en:** It's complicated
  - **pt-BR:** É complicado
  - **es-419:** Es complicado

- **setup > conditionalSpecificity > spPerson > choices > prefer_not**
  - **en:** Prefer not to say
  - **pt-BR:** Prefiro não dizer
  - **es-419:** Prefiero no decirlo

- **setup > conditionalSpecificity > categories > Finances > headline**
  - **en:** What kind of money shift are you calling in?
  - **pt-BR:** Que mudança financeira você quer?
  - **es-419:** ¿Qué cambio financiero quieres?

- **setup > conditionalSpecificity > categories > Finances > options > consistentIncome**
  - **en:** Consistent income
  - **pt-BR:** Renda consistente
  - **es-419:** Ingresos constantes

- **setup > conditionalSpecificity > categories > Finances > options > debtFreedom**
  - **en:** Debt freedom
  - **pt-BR:** Sem dívidas
  - **es-419:** Sin deudas

- **setup > conditionalSpecificity > categories > Finances > options > moreSales**
  - **en:** More sales
  - **pt-BR:** Mais vendas
  - **es-419:** Más ventas

- **setup > conditionalSpecificity > categories > Finances > options > luxuryEase**
  - **en:** Luxury & ease
  - **pt-BR:** Luxo e facilidade
  - **es-419:** Lujo y facilidad

- **setup > conditionalSpecificity > categories > Finances > options > financialSafety**
  - **en:** Financial safety
  - **pt-BR:** Segurança
  - **es-419:** Seguridad financiera

- **setup > conditionalSpecificity > categories > Self-Love > headline**
  - **en:** What do you want to feel when you see yourself?
  - **pt-BR:** O que você quer sentir quando se vê?
  - **es-419:** ¿Qué quieres sentir cuando te ves?

- **setup > conditionalSpecificity > categories > Self-Love > options > beautiful**
  - **en:** Beautiful
  - **pt-BR:** Bonita
  - **es-419:** Bella

- **setup > conditionalSpecificity > categories > Self-Love > options > desired**
  - **en:** Desired
  - **pt-BR:** Desejada
  - **es-419:** Deseada

- **setup > conditionalSpecificity > categories > Self-Love > options > radiant**
  - **en:** Radiant
  - **pt-BR:** Radiante
  - **es-419:** Radiante

- **setup > conditionalSpecificity > categories > Self-Love > options > expensive**
  - **en:** Expensive
  - **pt-BR:** Valiosa
  - **es-419:** Valiosa

- **setup > conditionalSpecificity > categories > Self-Love > options > seen**
  - **en:** Seen
  - **pt-BR:** Vista
  - **es-419:** Vista

- **setup > conditionalSpecificity > categories > Career > headline**
  - **en:** What career outcome are you calling in?
  - **pt-BR:** Que resultado de carreira você quer?
  - **es-419:** ¿Qué resultado profesional quieres?

- **setup > conditionalSpecificity > categories > Career > options > newJob**
  - **en:** New job
  - **pt-BR:** Novo emprego
  - **es-419:** Nuevo trabajo

- **setup > conditionalSpecificity > categories > Career > options > promotion**
  - **en:** Promotion
  - **pt-BR:** Promoção
  - **es-419:** Ascenso

- **setup > conditionalSpecificity > categories > Career > options > higherPay**
  - **en:** Higher pay
  - **pt-BR:** Salário maior
  - **es-419:** Mejor salario

- **setup > conditionalSpecificity > categories > Career > options > dreamOpportunity**
  - **en:** Dream opportunity
  - **pt-BR:** Oportunidade ideal
  - **es-419:** Oportunidad ideal

- **setup > conditionalSpecificity > categories > Business > headline**
  - **en:** What business result do you want most?
  - **pt-BR:** Que resultado de negócio você quer?
  - **es-419:** ¿Qué resultado de negocio quieres?

- **setup > conditionalSpecificity > categories > Business > options > moreSales**
  - **en:** More sales
  - **pt-BR:** Mais vendas
  - **es-419:** Más ventas

- **setup > conditionalSpecificity > categories > Business > options > moreCustomersClients**
  - **en:** More customers/clients
  - **pt-BR:** Mais clientes
  - **es-419:** Más clientes

- **setup > conditionalSpecificity > categories > Business > options > launchSuccess**
  - **en:** Launch success
  - **pt-BR:** Lançamento de sucesso
  - **es-419:** Lanzamiento exitoso

- **setup > conditionalSpecificity > categories > Business > options > audienceGrowth**
  - **en:** Audience growth
  - **pt-BR:** Mais audiência
  - **es-419:** Más audiencia

- **setup > conditionalSpecificity > categories > Confidence > headline**
  - **en:** Which self-concept focus fits best?
  - **pt-BR:** Qual foco de autoconceito combina?
  - **es-419:** ¿Qué enfoque de autoconcepto encaja?

- **setup > conditionalSpecificity > categories > Confidence > options > confidence**
  - **en:** Confidence
  - **pt-BR:** Confiança
  - **es-419:** Confianza

- **setup > conditionalSpecificity > categories > Confidence > options > visibility**
  - **en:** Visibility
  - **pt-BR:** Visibilidade
  - **es-419:** Visibilidad

- **setup > conditionalSpecificity > categories > Confidence > options > selfTrust**
  - **en:** Self-trust
  - **pt-BR:** Autoconfiança
  - **es-419:** Autoconfianza

- **setup > conditionalSpecificity > categories > Confidence > options > magnetism**
  - **en:** Magnetism
  - **pt-BR:** Magnetismo
  - **es-419:** Magnetismo

- **setup > conditionalSpecificity > categories > Learning > headline**
  - **en:** What education outcome are you calling in?
  - **pt-BR:** Que resultado escolar você quer?
  - **es-419:** ¿Qué resultado educativo quieres?

- **setup > conditionalSpecificity > categories > Learning > options > betterGrades**
  - **en:** Better grades
  - **pt-BR:** Notas melhores
  - **es-419:** Mejores notas

- **setup > conditionalSpecificity > categories > Learning > options > examSuccess**
  - **en:** Exam success
  - **pt-BR:** Sucesso em provas
  - **es-419:** Éxito en exámenes

- **setup > conditionalSpecificity > categories > Learning > options > collegeAcceptance**
  - **en:** College acceptance
  - **pt-BR:** Aprovação
  - **es-419:** Aceptación

- **setup > conditionalSpecificity > categories > Learning > options > scholarship**
  - **en:** Scholarship
  - **pt-BR:** Bolsa de estudos
  - **es-419:** Beca

- **setup > conditionalSpecificity > categories > Learning > options > focusStudying**
  - **en:** Focus studying
  - **pt-BR:** Foco nos estudos
  - **es-419:** Foco al estudiar

- **setup > conditionalSpecificity > categories > Discipline > headline**
  - **en:** What are you building consistency around?
  - **pt-BR:** Onde quer mais constância?
  - **es-419:** ¿Dónde quieres más constancia?

- **setup > conditionalSpecificity > categories > Discipline > options > morningRoutine**
  - **en:** Morning routine
  - **pt-BR:** Rotina matinal
  - **es-419:** Rutina matutina

- **setup > conditionalSpecificity > categories > Discipline > options > fitness**
  - **en:** Fitness
  - **pt-BR:** Fitness
  - **es-419:** Fitness

- **setup > conditionalSpecificity > categories > Discipline > options > studying**
  - **en:** Studying
  - **pt-BR:** Estudar
  - **es-419:** Estudiar

- **setup > conditionalSpecificity > categories > Discipline > options > work**
  - **en:** Work
  - **pt-BR:** Trabalho
  - **es-419:** Trabajo

- **setup > conditionalSpecificity > categories > Discipline > options > selfCare**
  - **en:** Self-care
  - **pt-BR:** Autocuidado
  - **es-419:** Autocuidado

- **setup > conditionalSpecificity > categories > Productivity > headline**
  - **en:** Where do you want more focus?
  - **pt-BR:** Onde você quer mais foco?
  - **es-419:** ¿Dónde quieres más enfoque?

- **setup > conditionalSpecificity > categories > Productivity > options > workProjects**
  - **en:** Work projects
  - **pt-BR:** Projetos de trabalho
  - **es-419:** Proyectos de trabajo

- **setup > conditionalSpecificity > categories > Productivity > options > studying**
  - **en:** Studying
  - **pt-BR:** Estudar
  - **es-419:** Estudiar

- **setup > conditionalSpecificity > categories > Productivity > options > creativeWork**
  - **en:** Creative work
  - **pt-BR:** Trabalho criativo
  - **es-419:** Trabajo creativo

- **setup > conditionalSpecificity > categories > Productivity > options > contentCreation**
  - **en:** Content creation
  - **pt-BR:** Criação de conteúdo
  - **es-419:** Creación de contenido

- **setup > conditionalSpecificity > categories > Productivity > options > dailyRoutine**
  - **en:** Daily routine
  - **pt-BR:** Rotina diária
  - **es-419:** Rutina diaria

- **setup > conditionalSpecificity > categories > Fitness > headline**
  - **en:** What body or fitness shift are you calling in?
  - **pt-BR:** Que mudança física você quer?
  - **es-419:** ¿Qué cambio físico quieres?

- **setup > conditionalSpecificity > categories > Fitness > options > strength**
  - **en:** Strength
  - **pt-BR:** Força
  - **es-419:** Fuerza

- **setup > conditionalSpecificity > categories > Fitness > options > shapeTone**
  - **en:** Shape & tone
  - **pt-BR:** Forma e tônus
  - **es-419:** Forma y tono

- **setup > conditionalSpecificity > categories > Fitness > options > energy**
  - **en:** Energy
  - **pt-BR:** Energia
  - **es-419:** Energía

- **setup > conditionalSpecificity > categories > Fitness > options > confidence**
  - **en:** Confidence
  - **pt-BR:** Confiança
  - **es-419:** Confianza

- **setup > conditionalSpecificity > categories > Fitness > options > consistentWorkouts**
  - **en:** Consistent workouts
  - **pt-BR:** Treinos constantes
  - **es-419:** Entrenos constantes

- **setup > conditionalSpecificity > categories > Nutrition > headline**
  - **en:** What kind of wellness shift do you want?
  - **pt-BR:** Que mudança de bem-estar você quer?
  - **es-419:** ¿Qué cambio de bienestar quieres?

- **setup > conditionalSpecificity > categories > Nutrition > options > moreEnergy**
  - **en:** More energy
  - **pt-BR:** Mais energia
  - **es-419:** Más energía

- **setup > conditionalSpecificity > categories > Nutrition > options > betterRest**
  - **en:** Better rest
  - **pt-BR:** Melhor descanso
  - **es-419:** Mejor descanso

- **setup > conditionalSpecificity > categories > Nutrition > options > emotionalEase**
  - **en:** Emotional ease
  - **pt-BR:** Calma emocional
  - **es-419:** Calma emocional

- **setup > conditionalSpecificity > categories > Nutrition > options > balance**
  - **en:** Balance
  - **pt-BR:** Equilíbrio
  - **es-419:** Equilibrio

- **setup > conditionalSpecificity > categories > Nutrition > options > softerRoutines**
  - **en:** Softer routines
  - **pt-BR:** Rotinas mais leves
  - **es-419:** Rutinas más suaves

- **setup > conditionalSpecificity > categories > Organization > headline**
  - **en:** What part of your life are you resetting?
  - **pt-BR:** Que parte da vida quer reiniciar?
  - **es-419:** ¿Qué parte quieres reiniciar?

- **setup > conditionalSpecificity > categories > Organization > options > mySpace**
  - **en:** My space
  - **pt-BR:** Meu espaço
  - **es-419:** Mi espacio

- **setup > conditionalSpecificity > categories > Organization > options > mySchedule**
  - **en:** My schedule
  - **pt-BR:** Minha agenda
  - **es-419:** Mi agenda

- **setup > conditionalSpecificity > categories > Organization > options > myRoutines**
  - **en:** My routines
  - **pt-BR:** Minhas rotinas
  - **es-419:** Mis rutinas

- **setup > conditionalSpecificity > categories > Organization > options > myEnvironment**
  - **en:** My environment
  - **pt-BR:** Meu ambiente
  - **es-419:** Mi entorno

- **setup > conditionalSpecificity > categories > Organization > options > myPriorities**
  - **en:** My priorities
  - **pt-BR:** Minhas prioridades
  - **es-419:** Mis prioridades

- **setup > currentFriction > title**
  - **en:** What limiting belief do you want to change?
  - **pt-BR:** Que crença quer mudar?
  - **es-419:** ¿Qué creencia quieres cambiar?

- **setup > currentFriction > subtitle**
  - **en:** What limiting belief blocks your manifestation?
  - **pt-BR:** Que crença bloqueia sua manifestação?
  - **es-419:** ¿Qué creencia bloquea tu manifestación?

- **setup > currentFriction > placeholder**
  - **en:** Describe the belief you want to change…
  - **pt-BR:** Descreva a crença que quer mudar…
  - **es-419:** Describe la creencia que quieres cambiar…

- **setup > toolPreference > title**
  - **en:** How do you want support?
  - **pt-BR:** Como você quer receber apoio?
  - **es-419:** ¿Cómo quieres recibir apoyo?

- **setup > toolPreference > subtitle**
  - **en:** Choose the tools you want to start with.
  - **pt-BR:** Escolha as ferramentas para começar.
  - **es-419:** Elige las herramientas para empezar.

- **setup > toolPreferenceOptions > powerful_affirmations**
  - **en:** Powerful affirmations
  - **pt-BR:** Afirmações poderosas
  - **es-419:** Afirmaciones poderosas

- **setup > toolPreferenceOptions > custom_subliminals**
  - **en:** Custom Subliminals
  - **pt-BR:** Subliminares
  - **es-419:** Subliminales

- **setup > toolPreferenceOptions > mirror_work_reset**
  - **en:** Mirror Work
  - **pt-BR:** Espelho
  - **es-419:** Espejo

- **setup > toolPreferenceOptions > belief_restructuring**
  - **en:** Belief Work
  - **pt-BR:** Crenças
  - **es-419:** Creencias

- **setup > toolPreferenceOptions > ai_manifestation_guidance**
  - **en:** AI Manifestation Guidance
  - **pt-BR:** Guia com IA
  - **es-419:** Guía con IA

- **setup > toolPreferenceOptions > daily_wins_progress**
  - **en:** Track Consistency & Progress
  - **pt-BR:** Constância e progresso
  - **es-419:** Constancia y progreso

- **setup > guide > title**
  - **en:** Choose a guide
  - **pt-BR:** Escolha um guia
  - **es-419:** Elige tu guía

- **setup > guide > subtitle**
  - **en:** An AI companion to answer manifesting questions.
  - **pt-BR:** Um guia de IA para suas dúvidas.
  - **es-419:** Tu guía de IA para tus dudas.

- **setup > manifestationIntensity > title**
  - **en:** Choose your manifesting intensity
  - **pt-BR:** Escolha sua intensidade
  - **es-419:** Elige tu intensidad

- **setup > manifestationIntensity > subtitle**
  - **en:** Set your routine intensity and optional notifications.
  - **pt-BR:** Defina rotina e notificações opcionais.
  - **es-419:** Configura rutina y notificaciones.

- **setup > manifestationIntensity > setRoutine**
  - **en:** Set my routine
  - **pt-BR:** Definir rotina
  - **es-419:** Configurar rutina

- **setup > manifestationIntensity > notificationsQuestion**
  - **en:** Do you want in-app & push notifications to bring you back to the app for your routine?
  - **pt-BR:** Quer notificações para voltar à rotina?
  - **es-419:** ¿Quieres notificaciones para retomar tu rutina?

- **setup > manifestationIntensity > notificationsHint**
  - **en:** Notifications support your routine — they nudge you back to your inspired actions at the intensity you choose.
  - **pt-BR:** Elas te lembram de voltar às ações inspiradas.
  - **es-419:** Te recuerdan volver a tus acciones inspiradas.

- **setup > manifestationIntensity > yes**
  - **en:** Yes
  - **pt-BR:** Sim
  - **es-419:** Sí

- **setup > manifestationIntensity > notNow**
  - **en:** Not now
  - **pt-BR:** Agora não
  - **es-419:** Ahora no

- **setup > manifestationIntensity > dailyTime**
  - **en:** Daily notifications time
  - **pt-BR:** Horário diário
  - **es-419:** Hora diaria

- **setup > manifestationIntensity > customizeInSettings**
  - **en:** You can customize your routine further in Settings.
  - **pt-BR:** Personalize depois em Configurações.
  - **es-419:** Personalízala después en Ajustes.

- **setup > manifestationIntensity > light > title**
  - **en:** Light
  - **pt-BR:** Leve
  - **es-419:** Ligera

- **setup > manifestationIntensity > light > tagline**
  - **en:** The recommended routine.
  - **pt-BR:** A rotina recomendada.
  - **es-419:** La rutina recomendada.

- **setup > manifestationIntensity > light > description**
  - **en:** Light integration of manifesting, with daily notifications, if opted into.
  - **pt-BR:** Manifestação leve, com notificações diárias se quiser.
  - **es-419:** Manifestación ligera, con notificaciones si quieres.

- **setup > manifestationIntensity > consistent > title**
  - **en:** Consistent
  - **pt-BR:** Consistente
  - **es-419:** Constante

- **setup > manifestationIntensity > consistent > tagline**
  - **en:** For experienced manifestors.
  - **pt-BR:** Para manifestadores experientes.
  - **es-419:** Para manifestadores con experiencia.

- **setup > manifestationIntensity > consistent > description**
  - **en:** More moderate manifesting intensity. 2x daily notifications, if selected.
  - **pt-BR:** Intensidade moderada. 2 notificações diárias.
  - **es-419:** Intensidad moderada. 2 notificaciones diarias.

- **setup > manifestationIntensity > lockedIn > title**
  - **en:** Locked In
  - **pt-BR:** Focado
  - **es-419:** Enfocado

- **setup > manifestationIntensity > lockedIn > tagline**
  - **en:** The highest-intensity routine.
  - **pt-BR:** A rotina mais intensa.
  - **es-419:** La rutina más intensa.

- **setup > manifestationIntensity > lockedIn > description**
  - **en:** For more intense manifesting goals. 3x daily notifications, if opted into.
  - **pt-BR:** Metas intensas. 3 notificações diárias.
  - **es-419:** Metas intensas. 3 notificaciones diarias.

- **setup > manifestationIntensity > alerts > alert**
  - **en:** Alert
  - **pt-BR:** Alerta
  - **es-419:** Alerta

- **setup > manifestationIntensity > alerts > first**
  - **en:** 1st Alert
  - **pt-BR:** 1.º alerta
  - **es-419:** 1.ª alerta

- **setup > manifestationIntensity > alerts > second**
  - **en:** 2nd Alert
  - **pt-BR:** 2.º alerta
  - **es-419:** 2.ª alerta

- **setup > manifestationIntensity > alerts > third**
  - **en:** 3rd Alert
  - **pt-BR:** 3.º alerta
  - **es-419:** 3.ª alerta

- **setup > notifications > title**
  - **en:** Turn on additional permissions
  - **pt-BR:** Ative permissões
  - **es-419:** Activa permisos

- **setup > notifications > subtitle**
  - **en:** Help us improve Palette Plotting.
  - **pt-BR:** Ajude-nos a melhorar o Palette Plotting.
  - **es-419:** Ayúdanos a mejorar Palette Plotting.

- **setup > tracking > title**
  - **en:** Help us improve Palette Plotting (optional)
  - **pt-BR:** Ajude-nos a melhorar (opcional)
  - **es-419:** Ayúdanos a mejorar (opcional)

- **setup > tracking > body**
  - **en:** Palette Plotting uses app activity data to measure ad performance and improve experience. Will you help us improve Palette Plotting?
  - **pt-BR:** Usamos dados de atividade para medir anúncios e melhorar o app. Você ajuda?
  - **es-419:** Usamos datos de actividad para medir anuncios y mejorar la app. ¿Nos ayudas?

- **setup > tracking > yes**
  - **en:** Yes
  - **pt-BR:** Sim
  - **es-419:** Sí

- **setup > tracking > no**
  - **en:** No
  - **pt-BR:** Não
  - **es-419:** No

- **setup > email > title**
  - **en:** Save your path
  - **pt-BR:** Salve seu caminho
  - **es-419:** Guarda tu camino

- **setup > email > titleLine1**
  - **en:** Save your path &
  - **pt-BR:** Salve seu caminho e
  - **es-419:** Guarda tu camino y

- **setup > email > titleLine2**
  - **en:** start your free trial
  - **pt-BR:** comece seu teste grátis
  - **es-419:** comienza tu prueba gratis

- **setup > email > subtitle**
  - **en:** Create your account to lock in your path. All of your progress is saved to this email.
  - **pt-BR:** Crie sua conta para salvar seu caminho. Seu progresso fica neste e-mail.
  - **es-419:** Crea tu cuenta para guardar tu camino. Tu progreso queda en este correo.

- **setup > email > emailLabel**
  - **en:** Email
  - **pt-BR:** E-mail
  - **es-419:** Correo

- **setup > email > passwordLabel**
  - **en:** Password
  - **pt-BR:** Senha
  - **es-419:** Contraseña

- **setup > email > emailPlaceholder**
  - **en:** you@email.com
  - **pt-BR:** voce@email.com
  - **es-419:** tu@correo.com

- **setup > email > passwordPlaceholder**
  - **en:** 8+ characters
  - **pt-BR:** 8+ caracteres
  - **es-419:** 8+ caracteres

- **setup > email > invalidEmail**
  - **en:** Please enter a valid email address
  - **pt-BR:** Digite um e-mail válido
  - **es-419:** Ingresa un correo válido

- **setup > email > needFirstName**
  - **en:** We need your first name from earlier in setup.
  - **pt-BR:** Precisamos do seu nome.
  - **es-419:** Necesitamos tu nombre.

- **setup > email > passwordLength**
  - **en:** Please enter a password with at least 8 characters
  - **pt-BR:** Digite uma senha de 8+ caracteres
  - **es-419:** Ingresa una contraseña de 8+ caracteres

- **setup > email > acceptTerms**
  - **en:** Please accept the Terms of Service and Privacy Policy
  - **pt-BR:** Aceite os Termos e a Privacidade
  - **es-419:** Acepta los Términos y la Privacidad

- **setup > email > subscriptionError**
  - **en:** Could not open subscription options. Try again in a moment.
  - **pt-BR:** Não foi possível abrir assinaturas. Tente de novo.
  - **es-419:** No pudimos abrir suscripciones. Intenta de nuevo.

- **setup > email > tryAgain**
  - **en:** Try again
  - **pt-BR:** Tentar de novo
  - **es-419:** Intentar de nuevo

- **setup > email > checkingAvailability**
  - **en:** Checking availability…
  - **pt-BR:** Verificando disponibilidade…
  - **es-419:** Comprobando disponibilidad…

- **setup > email > hidePassword**
  - **en:** Hide password
  - **pt-BR:** Ocultar senha
  - **es-419:** Ocultar contraseña

- **setup > email > showPassword**
  - **en:** Show password
  - **pt-BR:** Mostrar senha
  - **es-419:** Mostrar contraseña

- **setup > affirmationRead > title**
  - **en:** Confidently affirm your desires out loud
  - **pt-BR:** Afirme seus desejos em voz alta
  - **es-419:** Afirma tus deseos en voz alta

- **setup > affirmationRead > subtitle**
  - **en:** Speak & internalize these personalized affirmations
  - **pt-BR:** Fale e internalize suas afirmações
  - **es-419:** Di e internaliza tus afirmaciones

- **setup > embody > title**
  - **en:** How will you embody your new identity each day?
  - **pt-BR:** Como encarnar sua nova identidade?
  - **es-419:** ¿Cómo encarnarás tu nueva identidad?

- **setup > embody > subtitle**
  - **en:** Choose exactly five—they become your Inspired Actions on your dashboard. ({{count}} of {{required}} selected)
  - **pt-BR:** Escolha cinco — elas viram Ações inspiradas. ({{count}} de {{required}})
  - **es-419:** Elige cinco—serán tus Acciones inspiradas. ({{count}} de {{required}})

- **setup > embodyOptions > embody_rest**
  - **en:** Rest & Relax
  - **pt-BR:** Descansar
  - **es-419:** Descansar

- **setup > embodyOptions > embody_self_care**
  - **en:** Self-care
  - **pt-BR:** Autocuidado
  - **es-419:** Autocuidado

- **setup > embodyOptions > embody_clean_environment**
  - **en:** Clean & organize environment
  - **pt-BR:** Organizar o ambiente
  - **es-419:** Ordenar tu entorno

- **setup > embodyOptions > embody_nutrition**
  - **en:** Nutrition
  - **pt-BR:** Nutrição
  - **es-419:** Nutrición

- **setup > embodyOptions > embody_have_fun**
  - **en:** Have fun
  - **pt-BR:** Divertir-se
  - **es-419:** Divertirse

- **setup > embodyOptions > embody_move**
  - **en:** Exercise
  - **pt-BR:** Exercício
  - **es-419:** Ejercicio

- **setup > embodyOptions > embody_glam_up**
  - **en:** Glam Up
  - **pt-BR:** Caprichar
  - **es-419:** Arreglarse

- **setup > embodyOptions > embody_connect**
  - **en:** Connect with others
  - **pt-BR:** Conectar com outros
  - **es-419:** Conectar con otros

- **setup > embodyOptions > embody_seen**
  - **en:** Be seen & visible.
  - **pt-BR:** Ser visto e visível
  - **es-419:** Ser visto y visible

- **setup > embodyOptions > embody_work_or_study**
  - **en:** Work or study
  - **pt-BR:** Trabalhar ou estudar
  - **es-419:** Trabajar o estudiar

- **setup > pathSynthesis > title**
  - **en:** Your path is ready.
  - **pt-BR:** Seu caminho está pronto.
  - **es-419:** Tu camino está listo.

- **setup > pathSynthesis > subtitle**
  - **en:** Everything below is ready the moment you unlock Palette Plotting.
  - **pt-BR:** Tudo fica pronto ao desbloquear o Palette Plotting.
  - **es-419:** Todo estará listo al desbloquear Palette Plotting.

- **setup > pathSynthesis > items > subliminals**
  - **en:** Customized subliminals.
  - **pt-BR:** Subliminares personalizados.
  - **es-419:** Subliminales personalizados.

- **setup > pathSynthesis > items > mirror**
  - **en:** Mirror work for self concept.
  - **pt-BR:** Espelho para autoconceito.
  - **es-419:** Espejo para autoconcepto.

- **setup > pathSynthesis > items > guideReady**
  - **en:** {{name}} is ready to coach you.
  - **pt-BR:** {{name}} está pronto para te guiar.
  - **es-419:** {{name}} está listo para guiarte.

- **setup > pathSynthesis > items > guideReadyGeneric**
  - **en:** Your guide is ready to coach you.
  - **pt-BR:** Seu guia está pronto.
  - **es-419:** Tu guía está lista.

- **setup > pathSynthesis > items > affirmations**
  - **en:** Affirmations for the new you.
  - **pt-BR:** Afirmações para o novo você.
  - **es-419:** Afirmaciones para el nuevo tú.

- **setup > pathSynthesis > items > beliefs**
  - **en:** Beliefs ready for reframing.
  - **pt-BR:** Crenças prontas.
  - **es-419:** Creencias listas.

- **setup > pathSynthesis > items > journal**
  - **en:** Journal ready for reflection.
  - **pt-BR:** Diário pronto.
  - **es-419:** Diario listo.

- **setup > pathLoading > title**
  - **en:** Building your path…
  - **pt-BR:** Construindo seu caminho…
  - **es-419:** Construyendo tu camino…

- **setup > pathLoading > subtitle**
  - **en:** Personalizing your starting stack.
  - **pt-BR:** Personalizando sua configuração.
  - **es-419:** Personalizando tu configuración.

- **setup > pathLoading > loading**
  - **en:** Loading
  - **pt-BR:** Carregando
  - **es-419:** Cargando

- **setup > pathLoading > hint**
  - **en:** You're not starting from zero—your path is already taking shape.
  - **pt-BR:** Seu caminho já está tomando forma.
  - **es-419:** Tu camino ya está tomando forma.

- **setup > beginJourney > lead**
  - **en:** Palette Plotting helps you practice manifestation methods & embody your desires, fostering coherence at each step.
  - **pt-BR:** Palette Plotting ajuda você a praticar manifestação e encarnar seus desejos.
  - **es-419:** Palette Plotting te ayuda a practicar manifestación y encarnar tus deseos.

- **setup > beginJourney > subtitle**
  - **en:** Let's begin your journey.
  - **pt-BR:** Vamos começar sua jornada.
  - **es-419:** Comencemos tu camino.

- **legacy > threeActs > title**
  - **en:** Your Self-Concept Suite
  - **pt-BR:** Sua suíte de autoconceito
  - **es-419:** Tu suite de autoconcepto

- **legacy > threeActs > subtitle**
  - **en:** A flexible framework for quantum leaps
  - **pt-BR:** Uma estrutura para saltos quânticos
  - **es-419:** Un marco para saltos cuánticos

- **legacy > threeActs > tools > subliminalMaker > title**
  - **en:** Subliminal Maker
  - **pt-BR:** Criador de subliminares
  - **es-419:** Creador de subliminales

- **legacy > threeActs > tools > subliminalMaker > description**
  - **en:** Custom subliminals with binaural beats
  - **pt-BR:** Subliminares com batidas binaurais
  - **es-419:** Subliminales con beats binaurales

- **legacy > threeActs > tools > mirrorWork > title**
  - **en:** Mirror Work
  - **pt-BR:** Trabalho com espelho
  - **es-419:** Trabajo con espejo

- **legacy > threeActs > tools > mirrorWork > description**
  - **en:** Immersive Mirror Work
  - **pt-BR:** Espelho imersivo
  - **es-419:** Espejo inmersivo

- **legacy > threeActs > tools > affirmScript > title**
  - **en:** Affirm & Script
  - **pt-BR:** Afirmar e escrever
  - **es-419:** Afirmar y escribir

- **legacy > threeActs > tools > affirmScript > description**
  - **en:** Custom affirmations and visuals
  - **pt-BR:** Afirmações e visuais personalizados
  - **es-419:** Afirmaciones y visuales personalizados

- **legacy > threeActs > tools > beliefWork > title**
  - **en:** Belief Work
  - **pt-BR:** Trabalho de crenças
  - **es-419:** Trabajo de creencias

- **legacy > threeActs > tools > beliefWork > description**
  - **en:** Deconstruct self-limiting beliefs
  - **pt-BR:** Desconstrua crenças limitantes
  - **es-419:** Desarma creencias limitantes

- **legacy > threeActs > tools > habitTracking > title**
  - **en:** Habit Tracking
  - **pt-BR:** Hábitos
  - **es-419:** Hábitos

- **legacy > threeActs > tools > habitTracking > description**
  - **en:** Track daily progress on goals
  - **pt-BR:** Progresso diário nas metas
  - **es-419:** Progreso diario en tus metas

- **legacy > threeActs > tools > manifestationJournal > title**
  - **en:** Manifestation Journal
  - **pt-BR:** Diário de manifestação
  - **es-419:** Diario de manifestación

- **legacy > threeActs > tools > manifestationJournal > description**
  - **en:** Daily journaling and notes
  - **pt-BR:** Diário e notas diárias
  - **es-419:** Diario y notas diarias

- **legacy > threeActs > tools > pianoTapping > title**
  - **en:** Piano Tapping
  - **pt-BR:** Tapping no piano
  - **es-419:** Piano Tapping

- **legacy > threeActs > tools > pianoTapping > description**
  - **en:** Tactile integration of goals
  - **pt-BR:** Integração tátil de metas
  - **es-419:** Integración táctil de metas

- **legacy > double > title**
  - **en:** Choose a Guide
  - **pt-BR:** Escolha um guia
  - **es-419:** Elige tu guía

- **legacy > double > subtitle**
  - **en:** An AI companion to help fuel momentum through chats
  - **pt-BR:** Um guia de IA nos chats
  - **es-419:** Tu guía de IA en los chats

- **legacy > double > characters > river > name**
  - **en:** River
  - **pt-BR:** River
  - **es-419:** River

- **legacy > double > characters > river > themes (line 1)**
  - **en:** Transitions
  - **pt-BR:** Transições
  - **es-419:** Transiciones

- **legacy > double > characters > river > themes (line 2)**
  - **en:** Career
  - **pt-BR:** Carreira
  - **es-419:** Carrera

- **legacy > double > characters > sage > name**
  - **en:** Sage
  - **pt-BR:** Sage
  - **es-419:** Sage

- **legacy > double > characters > sage > themes (line 1)**
  - **en:** Finance
  - **pt-BR:** Finanças
  - **es-419:** Finanzas

- **legacy > double > characters > sage > themes (line 2)**
  - **en:** Identity
  - **pt-BR:** Identidade
  - **es-419:** Identidad

- **legacy > double > characters > rose > name**
  - **en:** Rose
  - **pt-BR:** Rose
  - **es-419:** Rose

- **legacy > double > characters > rose > themes (line 1)**
  - **en:** Love
  - **pt-BR:** Amor
  - **es-419:** Amor

- **legacy > double > characters > rose > themes (line 2)**
  - **en:** Self Concept
  - **pt-BR:** Autoconceito
  - **es-419:** Autoconcepto

- **legacy > double > characters > oliver > name**
  - **en:** Oliver
  - **pt-BR:** Oliver
  - **es-419:** Oliver

- **legacy > double > characters > oliver > themes (line 1)**
  - **en:** Self Image
  - **pt-BR:** Autoimagem
  - **es-419:** Autoimagen

- **legacy > double > characters > oliver > themes (line 2)**
  - **en:** Fitness
  - **pt-BR:** Fitness
  - **es-419:** Fitness

- **legacy > digitalMirror > title**
  - **en:** Mirror Work
  - **pt-BR:** Trabalho com espelho
  - **es-419:** Trabajo con espejo

- **legacy > digitalMirror > subtitle**
  - **en:** Guided sessions meant to grow self-confidence
  - **pt-BR:** Sessões guiadas para autoconfiança
  - **es-419:** Sesiones guiadas para autoconfianza

- **legacy > digitalMirror > imageAlt**
  - **en:** Mirror Work
  - **pt-BR:** Trabalho com espelho
  - **es-419:** Trabajo con espejo

- **legacy > subliminalMaker > title**
  - **en:** Subliminal Maker
  - **pt-BR:** Criador de subliminares
  - **es-419:** Creador de subliminales

- **legacy > subliminalMaker > subtitle**
  - **en:** Create custom subliminal audio tracks
  - **pt-BR:** Crie áudios subliminares
  - **es-419:** Crea audios subliminales

- **legacy > subliminalMaker > imageAlt**
  - **en:** Subliminal Maker
  - **pt-BR:** Criador de subliminares
  - **es-419:** Creador de subliminales

- **legacy > manifestationTools > title**
  - **en:** Interactive Manifestation Tools
  - **pt-BR:** Ferramentas de manifestação
  - **es-419:** Herramientas de manifestación

- **legacy > manifestationTools > subtitle**
  - **en:** Use experimental techniques for manifestation
  - **pt-BR:** Use técnicas experimentais para manifestar
  - **es-419:** Usa técnicas experimentales para manifestar

- **legacy > manifestationTools > imageAlt**
  - **en:** Interactive Manifestation Tools
  - **pt-BR:** Ferramentas de manifestação
  - **es-419:** Herramientas de manifestación

- **legacy > habitTracking > title**
  - **en:** Habit & Momentum Tracking
  - **pt-BR:** Hábitos e progresso
  - **es-419:** Hábitos y progreso

- **legacy > habitTracking > subtitle**
  - **en:** Track your progress and build lasting habits
  - **pt-BR:** Acompanhe progresso e hábitos
  - **es-419:** Sigue progreso y hábitos

- **legacy > habitTracking > imageAlt**
  - **en:** Habit & Momentum Tracking
  - **pt-BR:** Hábitos e progresso
  - **es-419:** Hábitos y progreso

- **legacy > onboardingQuestions > title**
  - **en:** Manifestation Focus
  - **pt-BR:** Foco de manifestação
  - **es-419:** Enfoque de manifestación

- **legacy > onboardingQuestions > question**
  - **en:** What do you want to shift?
  - **pt-BR:** O que você quer mudar?
  - **es-419:** ¿Qué quieres cambiar?

- **legacy > onboardingQuestions > selectUpTo3**
  - **en:** Select up to 3 options
  - **pt-BR:** Selecione até 3 opções
  - **es-419:** Selecciona hasta 3 opciones

- **legacy > onboardingQuestions > options > Career**
  - **en:** Career
  - **pt-BR:** Carreira
  - **es-419:** Carrera

- **legacy > onboardingQuestions > options > Business**
  - **en:** Business
  - **pt-BR:** Negócios
  - **es-419:** Negocios

- **legacy > onboardingQuestions > options > Learning**
  - **en:** School / Exams
  - **pt-BR:** Escola / Provas
  - **es-419:** Escuela / Exámenes

- **legacy > onboardingQuestions > options > Finances**
  - **en:** Money
  - **pt-BR:** Dinheiro
  - **es-419:** Dinero

- **legacy > onboardingQuestions > options > Productivity**
  - **en:** Focus
  - **pt-BR:** Foco
  - **es-419:** Enfoque

- **legacy > onboardingQuestions > options > Organization**
  - **en:** Life Reset
  - **pt-BR:** Recomeço de vida
  - **es-419:** Reinicio de vida

- **legacy > onboardingQuestions > options > Confidence**
  - **en:** Self-Concept
  - **pt-BR:** Autoconceito
  - **es-419:** Autoconcepto

- **legacy > onboardingQuestions > options > Self-Love**
  - **en:** Beauty / Glow Up
  - **pt-BR:** Beleza / Glow Up
  - **es-419:** Belleza / Glow Up

- **legacy > onboardingQuestions > options > Connections**
  - **en:** Love / SP
  - **pt-BR:** Amor / SP
  - **es-419:** Amor / SP

- **legacy > onboardingQuestions > options > Fitness**
  - **en:** Body / Fitness
  - **pt-BR:** Corpo / Fitness
  - **es-419:** Cuerpo / Fitness

- **legacy > onboardingQuestions > options > Nutrition**
  - **en:** Wellness
  - **pt-BR:** Bem-estar
  - **es-419:** Bienestar

- **legacy > onboardingQuestions > options > Discipline**
  - **en:** Discipline
  - **pt-BR:** Disciplina
  - **es-419:** Disciplina

## Settings & manifestation routine

Namespace: `settings`

- **title**
  - **en:** Settings
  - **pt-BR:** Configurações
  - **es-419:** Ajustes

- **header**
  - **en:** Your Account
  - **pt-BR:** Sua conta
  - **es-419:** Tu cuenta

- **tabs > profile**
  - **en:** Profile
  - **pt-BR:** Perfil
  - **es-419:** Perfil

- **tabs > settings**
  - **en:** Settings
  - **pt-BR:** Configurações
  - **es-419:** Ajustes

- **tabs > billing**
  - **en:** Billing
  - **pt-BR:** Assinatura
  - **es-419:** Facturación

- **tabs > legal**
  - **en:** Legal
  - **pt-BR:** Legal
  - **es-419:** Legal

- **language > heading**
  - **en:** Language
  - **pt-BR:** Idioma
  - **es-419:** Idioma

- **language > description**
  - **en:** Choose your app language.
  - **pt-BR:** Escolha o idioma do app.
  - **es-419:** Elige el idioma de la app.

- **profile > nameLabel**
  - **en:** Name
  - **pt-BR:** Nome
  - **es-419:** Nombre

- **profile > usernameLabel**
  - **en:** Username
  - **pt-BR:** Nome de usuário
  - **es-419:** Usuario

- **profile > emailLabel**
  - **en:** Email
  - **pt-BR:** E-mail
  - **es-419:** Correo electrónico

- **profile > emailCannotChange**
  - **en:** Email cannot be changed
  - **pt-BR:** E-mail não alterável
  - **es-419:** El correo no se puede cambiar

- **profile > phoneLabel**
  - **en:** Phone Number
  - **pt-BR:** Número de telefone
  - **es-419:** Número de teléfono

- **profile > updateButton**
  - **en:** Update Profile
  - **pt-BR:** Atualizar perfil
  - **es-419:** Actualizar perfil

- **profile > namePlaceholder**
  - **en:** Enter your name
  - **pt-BR:** Digite seu nome
  - **es-419:** Ingresa tu nombre

- **profile > usernamePlaceholder**
  - **en:** Enter your username
  - **pt-BR:** Digite seu nome de usuário
  - **es-419:** Ingresa tu usuario

- **profile > phonePlaceholder**
  - **en:** +1 (555) 123-4567
  - **pt-BR:** +55 (11) 91234-5678
  - **es-419:** +1 (555) 123-4567

- **profile > codePlaceholder**
  - **en:** Enter 6-digit code
  - **pt-BR:** Código de 6 dígitos
  - **es-419:** Código de 6 dígitos

- **profile > sendCode**
  - **en:** Send Code
  - **pt-BR:** Enviar código
  - **es-419:** Enviar código

- **profile > sendingCode**
  - **en:** Sending...
  - **pt-BR:** Enviando...
  - **es-419:** Enviando...

- **profile > verify**
  - **en:** Verify
  - **pt-BR:** Verificar
  - **es-419:** Verificar

- **profile > verifyPhoneHint**
  - **en:** Please verify your phone number to update it
  - **pt-BR:** Verifique seu número de telefone para atualizá-lo
  - **es-419:** Verifica tu número de teléfono para actualizarlo

- **profile > phoneVerified**
  - **en:** ✓ Phone number verified
  - **pt-BR:** ✓ Telefone verificado
  - **es-419:** ✓ Teléfono verificado

- **profile > newPhoneVerified**
  - **en:** ✓ New phone number verified
  - **pt-BR:** ✓ Novo telefone verificado
  - **es-419:** ✓ Nuevo teléfono verificado

- **profile > changePasswordHeading**
  - **en:** Change Password
  - **pt-BR:** Alterar senha
  - **es-419:** Cambiar contraseña

- **profile > currentPasswordLabel**
  - **en:** Current Password
  - **pt-BR:** Senha atual
  - **es-419:** Contraseña actual

- **profile > newPasswordLabel**
  - **en:** New Password
  - **pt-BR:** Nova senha
  - **es-419:** Nueva contraseña

- **profile > confirmPasswordLabel**
  - **en:** Confirm New Password
  - **pt-BR:** Confirmar nova senha
  - **es-419:** Confirmar nueva contraseña

- **profile > changePasswordButton**
  - **en:** Change Password
  - **pt-BR:** Alterar senha
  - **es-419:** Cambiar contraseña

- **profile > validatingPassword**
  - **en:** Validating password...
  - **pt-BR:** Validando senha...
  - **es-419:** Validando contraseña...

- **profile > currentPasswordPlaceholder**
  - **en:** Enter current password
  - **pt-BR:** Senha atual
  - **es-419:** Contraseña actual

- **profile > newPasswordPlaceholder**
  - **en:** Enter new password
  - **pt-BR:** Nova senha
  - **es-419:** Nueva contraseña

- **profile > confirmPasswordPlaceholder**
  - **en:** Confirm new password
  - **pt-BR:** Confirme a nova senha
  - **es-419:** Confirma la nueva contraseña

- **passwordValidation > minLength**
  - **en:** Password must be at least 8 characters long
  - **pt-BR:** Mínimo de 8 caracteres
  - **es-419:** Mínimo 8 caracteres

- **passwordValidation > lowercase**
  - **en:** Password must contain at least one lowercase letter
  - **pt-BR:** Inclua uma letra minúscula
  - **es-419:** Incluye una minúscula

- **passwordValidation > uppercase**
  - **en:** Password must contain at least one uppercase letter
  - **pt-BR:** Inclua uma letra maiúscula
  - **es-419:** Incluye una mayúscula

- **passwordValidation > digit**
  - **en:** Password must contain at least one digit
  - **pt-BR:** Inclua um número
  - **es-419:** Incluye un número

- **passwordValidation > mismatch**
  - **en:** Passwords do not match
  - **pt-BR:** As senhas não coincidem
  - **es-419:** Las contraseñas no coinciden

- **preferences > routineHeading**
  - **en:** Manifestation routine
  - **pt-BR:** Rotina de manifestação
  - **es-419:** Rutina de manifestación

- **preferences > routineDescription**
  - **en:** Adjust your manifestation intensity, routine expectations, and routine notifications.
  - **pt-BR:** Ajuste intensidade, rotina e notificações.
  - **es-419:** Ajusta intensidad, rutina y notificaciones.

- **preferences > routineButtonTitle**
  - **en:** Routine & intensity
  - **pt-BR:** Rotina e intensidade
  - **es-419:** Rutina e intensidad

- **preferences > routineButtonSubtitle**
  - **en:** Set routine intensity & notifications
  - **pt-BR:** Intensidade e notificações
  - **es-419:** Intensidad y notificaciones

- **preferences > emailHeading**
  - **en:** Email preferences
  - **pt-BR:** Preferências de e-mail
  - **es-419:** Preferencias de correo

- **preferences > emailDescription**
  - **en:** Manifestation tips, product updates, and app news by email.
  - **pt-BR:** Dicas, novidades e atualizações por e-mail.
  - **es-419:** Consejos, novedades y actualizaciones por correo.

- **preferences > emailMarketingLabel**
  - **en:** Email marketing
  - **pt-BR:** Marketing por e-mail
  - **es-419:** Marketing por correo

- **preferences > textMarketingLabel**
  - **en:** Text Marketing
  - **pt-BR:** Marketing por SMS
  - **es-419:** Marketing por SMS

- **preferences > dataTrainingHeading**
  - **en:** Data Training
  - **pt-BR:** Treinamento de dados
  - **es-419:** Entrenamiento de datos

- **preferences > dataTrainingDescription**
  - **en:** Help improve the experience by allowing anonymized usage to be used for model training. Default is off.
  - **pt-BR:** Ajude a melhorar usando dados anônimos para treinar modelos.
  - **es-419:** Ayuda a mejorar usando datos anónimos para entrenar modelos.

- **preferences > dataTrainingLabel**
  - **en:** Data Training Opt-In
  - **pt-BR:** Permitir treino de dados
  - **es-419:** Permitir entrenar datos

- **preferences > timeZoneLabel**
  - **en:** Time zone
  - **pt-BR:** Fuso horário
  - **es-419:** Zona horaria

- **deletion > heading**
  - **en:** Delete account
  - **pt-BR:** Excluir conta
  - **es-419:** Eliminar cuenta

- **deletion > scheduledPrefix**
  - **en:** Your account is scheduled for deletion on
  - **pt-BR:** Sua conta está programada para exclusão em
  - **es-419:** Tu cuenta está programada para eliminarse el

- **deletion > scheduledSuffix**
  - **en:** You can cancel before then.
  - **pt-BR:** Você pode cancelar antes dessa data.
  - **es-419:** Puedes cancelar antes de esa fecha.

- **deletion > description**
  - **en:** Permanently delete your account and all associated data. This cannot be undone and your data cannot be retrieved. Deletion is scheduled 30 days after you confirm.
  - **pt-BR:** Exclui sua conta e dados. A exclusão é agendada para 30 dias depois.
  - **es-419:** Elimina tu cuenta y datos. La eliminación se programa para 30 días después.

- **deletion > cancelRequest**
  - **en:** Cancel deletion request
  - **pt-BR:** Cancelar solicitação de exclusão
  - **es-419:** Cancelar solicitud de eliminación

- **deletion > deleteButton**
  - **en:** Delete my account
  - **pt-BR:** Excluir minha conta
  - **es-419:** Eliminar mi cuenta

- **deletion > confirm1Title**
  - **en:** Delete your account?
  - **pt-BR:** Excluir sua conta?
  - **es-419:** ¿Eliminar tu cuenta?

- **deletion > confirm1Body**
  - **en:** Your account and all associated data (profile, preferences, content) will be permanently deleted. You will not be able to retrieve or recover this data. This is a final decision. Do you want to continue?
  - **pt-BR:** Sua conta e dados serão excluídos permanentemente. Não será possível recuperar. Continuar?
  - **es-419:** Tu cuenta y datos se eliminarán permanentemente. No podrás recuperarlos. ¿Continuar?

- **deletion > confirm2Title**
  - **en:** Final confirmation
  - **pt-BR:** Confirmação final
  - **es-419:** Confirmación final

- **deletion > confirm2Body**
  - **en:** This is your last chance to cancel. Your account and all data will be permanently deleted and cannot be recovered. Are you sure you want to delete your account?
  - **pt-BR:** Última chance para cancelar. Sua conta e dados serão excluídos. Tem certeza?
  - **es-419:** Última oportunidad para cancelar. Tu cuenta y datos se eliminarán. ¿Seguro?

- **deletion > deleting**
  - **en:** Deleting…
  - **pt-BR:** Excluindo…
  - **es-419:** Eliminando…

- **deletion > scheduledFallback**
  - **en:** in 30 days
  - **pt-BR:** em 30 dias
  - **es-419:** en 30 días

- **deletion > scheduledToast**
  - **en:** Your account is scheduled for deletion on {{date}}. You can log in before then to cancel in Settings.
  - **pt-BR:** Sua conta está programada para exclusão em {{date}}. Você pode entrar antes dessa data para cancelar em Configurações.
  - **es-419:** Tu cuenta está programada para eliminarse el {{date}}. Puedes iniciar sesión antes de esa fecha para cancelar en Ajustes.

- **billing > subscriptionHeading**
  - **en:** Subscription
  - **pt-BR:** Assinatura
  - **es-419:** Suscripción

- **billing > currentPlan**
  - **en:** Current Plan
  - **pt-BR:** Plano atual
  - **es-419:** Plan actual

- **billing > billingHeading**
  - **en:** Billing
  - **pt-BR:** Assinatura
  - **es-419:** Facturación

- **billing > billingDescription**
  - **en:** Manage your subscription and payment methods
  - **pt-BR:** Gerencie assinatura e pagamentos
  - **es-419:** Administra suscripción y pagos

- **billing > manageBilling**
  - **en:** Manage Billing
  - **pt-BR:** Gerenciar assinatura
  - **es-419:** Administrar facturación

- **billing > loadingOptions**
  - **en:** Loading billing options…
  - **pt-BR:** Carregando assinaturas…
  - **es-419:** Cargando suscripciones…

- **billing > portalHint**
  - **en:** Opens the customer portal to update payment or cancel your subscription.
  - **pt-BR:** Abra o portal para atualizar pagamento ou cancelar.
  - **es-419:** Abre el portal para actualizar el pago o cancelar.

- **billing > planMonthly**
  - **en:** Monthly
  - **pt-BR:** Mensal
  - **es-419:** Mensual

- **billing > planAnnual**
  - **en:** Annual
  - **pt-BR:** Anual
  - **es-419:** Anual

- **billing > planWeekly**
  - **en:** Weekly
  - **pt-BR:** Semanal
  - **es-419:** Semanal

- **billing > openingPortal**
  - **en:** Opening billing portal…
  - **pt-BR:** Abrindo assinatura…
  - **es-419:** Abriendo facturación…

- **legal > heading**
  - **en:** Legal & Information
  - **pt-BR:** Legal e informações
  - **es-419:** Legal e información

- **legal > faq**
  - **en:** FAQ
  - **pt-BR:** Perguntas frequentes
  - **es-419:** Preguntas frecuentes

- **legal > terms**
  - **en:** Terms of Use
  - **pt-BR:** Termos de uso
  - **es-419:** Términos de uso

- **legal > privacy**
  - **en:** Privacy Policy
  - **pt-BR:** Política de privacidade
  - **es-419:** Política de privacidad

- **legal > acceptableUse**
  - **en:** Acceptable Use Policy
  - **pt-BR:** Política de uso aceitável
  - **es-419:** Política de uso aceptable

- **legal > billingRefunds**
  - **en:** Billing & Refunds
  - **pt-BR:** Pagamento e reembolsos
  - **es-419:** Facturación y reembolsos

- **legal > dmca**
  - **en:** DMCA Notice & Takedown Policy
  - **pt-BR:** Aviso e política de remoção DMCA
  - **es-419:** Aviso y política de retirada DMCA

- **legal > eula**
  - **en:** End User License Agreement
  - **pt-BR:** Contrato de licença de usuário final
  - **es-419:** Acuerdo de licencia de usuario final

- **legal > contact**
  - **en:** Contact Us
  - **pt-BR:** Fale conosco
  - **es-419:** Contáctanos

- **routine > title**
  - **en:** Manifestation routine
  - **pt-BR:** Rotina de manifestação
  - **es-419:** Rutina de manifestación

- **routine > subtitle**
  - **en:** Manifesting intensity and routine notifications
  - **pt-BR:** Intensidade de manifestação e notificações de rotina
  - **es-419:** Intensidad de manifestación y notificaciones de rutina

- **routine > backAria**
  - **en:** Back to settings
  - **pt-BR:** Voltar para configurações
  - **es-419:** Volver a ajustes

- **routine > loading**
  - **en:** Loading your routine…
  - **pt-BR:** Carregando sua rotina…
  - **es-419:** Cargando tu rutina…

- **routine > intensityHeading**
  - **en:** Manifesting intensity
  - **pt-BR:** Intensidade de manifestação
  - **es-419:** Intensidad de manifestación

- **routine > intensityDescription**
  - **en:** Adjust your manifesting intensity
  - **pt-BR:** Ajuste sua intensidade de manifestação
  - **es-419:** Ajusta tu intensidad de manifestación

- **routine > saveIntensity**
  - **en:** Save intensity
  - **pt-BR:** Salvar intensidade
  - **es-419:** Guardar intensidad

- **routine > saving**
  - **en:** Saving…
  - **pt-BR:** Salvando…
  - **es-419:** Guardando…

- **routine > notificationsHeading**
  - **en:** Routine notifications
  - **pt-BR:** Notificações de rotina
  - **es-419:** Notificaciones de rutina

- **routine > notificationsDescription**
  - **en:** Notifications support your routine — they nudge you back to your inspired actions at the intensity you choose. This is separate from email marketing in Settings.
  - **pt-BR:** As notificações lembram você de voltar às ações inspiradas.
  - **es-419:** Las notificaciones te recuerdan volver a tus acciones inspiradas.

- **routine > pushRemindersLabel**
  - **en:** In-app & push reminders
  - **pt-BR:** Lembretes e push
  - **es-419:** Recordatorios y push

- **routine > dailyTimeHeading**
  - **en:** Daily notifications time
  - **pt-BR:** Horário diário
  - **es-419:** Hora diaria

- **routine > deviceDeniedHint**
  - **en:** Notifications are off at the device level. Your routine and charge will still work.
  - **pt-BR:** Notificações desativadas. Sua rotina continua.
  - **es-419:** Notificaciones desactivadas. Tu rutina continúa.

- **routine > intensity > light > title**
  - **en:** Light
  - **pt-BR:** Leve
  - **es-419:** Ligera

- **routine > intensity > light > tagline**
  - **en:** The recommended routine.
  - **pt-BR:** A rotina recomendada.
  - **es-419:** La rutina recomendada.

- **routine > intensity > light > description**
  - **en:** Light integration of manifesting, with daily notifications, if opted into.
  - **pt-BR:** Integração leve de manifestação, com notificações diárias, se você optar.
  - **es-419:** Integración ligera de manifestación, con notificaciones diarias, si optas por ellas.

- **routine > intensity > consistent > title**
  - **en:** Consistent
  - **pt-BR:** Consistente
  - **es-419:** Constante

- **routine > intensity > consistent > tagline**
  - **en:** For experienced manifestors.
  - **pt-BR:** Para manifestadores experientes.
  - **es-419:** Para manifestadores con experiencia.

- **routine > intensity > consistent > description**
  - **en:** More moderate manifesting intensity. 2x daily notifications, if selected.
  - **pt-BR:** Intensidade de manifestação mais moderada. 2 notificações diárias, se selecionadas.
  - **es-419:** Intensidad de manifestación más moderada. 2 notificaciones diarias, si las seleccionas.

- **routine > intensity > locked_in > title**
  - **en:** Locked In
  - **pt-BR:** Focado
  - **es-419:** Enfocado

- **routine > intensity > locked_in > tagline**
  - **en:** The highest-intensity routine.
  - **pt-BR:** A rotina de maior intensidade.
  - **es-419:** La rutina de mayor intensidad.

- **routine > intensity > locked_in > description**
  - **en:** For more intense manifesting goals. 3x daily notifications, if opted into.
  - **pt-BR:** Para metas de manifestação mais intensas. 3 notificações diárias, se você optar.
  - **es-419:** Para metas de manifestación más intensas. 3 notificaciones diarias, si optas por ellas.

- **routine > alerts > single**
  - **en:** Alert
  - **pt-BR:** Alerta
  - **es-419:** Alerta

- **routine > alerts > first**
  - **en:** 1st Alert
  - **pt-BR:** 1.º alerta
  - **es-419:** 1.ª alerta

- **routine > alerts > second**
  - **en:** 2nd Alert
  - **pt-BR:** 2.º alerta
  - **es-419:** 2.ª alerta

- **routine > alerts > third**
  - **en:** 3rd Alert
  - **pt-BR:** 3.º alerta
  - **es-419:** 3.ª alerta

- **toasts > profileUpdated**
  - **en:** Profile updated successfully
  - **pt-BR:** Perfil atualizado com sucesso
  - **es-419:** Perfil actualizado correctamente

- **toasts > passwordUpdated**
  - **en:** Password updated successfully
  - **pt-BR:** Senha atualizada com sucesso
  - **es-419:** Contraseña actualizada correctamente

- **toasts > enterPhone**
  - **en:** Please enter a phone number
  - **pt-BR:** Digite um número de telefone
  - **es-419:** Ingresa un número de teléfono

- **toasts > codeSent**
  - **en:** Verification code sent!
  - **pt-BR:** Código de verificação enviado!
  - **es-419:** ¡Código de verificación enviado!

- **toasts > codeSendFailed**
  - **en:** Failed to send verification code. Please try again.
  - **pt-BR:** Não foi possível enviar o código.
  - **es-419:** No se pudo enviar el código.

- **toasts > phoneVerified**
  - **en:** Phone number verified and saved!
  - **pt-BR:** Número de telefone verificado e salvo!
  - **es-419:** ¡Número de teléfono verificado y guardado!

- **toasts > invalidCode**
  - **en:** Invalid code. Please try again.
  - **pt-BR:** Código inválido. Tente novamente.
  - **es-419:** Código inválido. Inténtalo de nuevo.

- **toasts > usernameEmpty**
  - **en:** Username cannot be empty
  - **pt-BR:** O nome de usuário não pode estar vazio
  - **es-419:** El usuario no puede estar vacío

- **toasts > verifyPhoneFirst**
  - **en:** Please verify your new phone number before updating
  - **pt-BR:** Verifique seu novo número de telefone antes de atualizar
  - **es-419:** Verifica tu nuevo número de teléfono antes de actualizar

- **toasts > userNotFound**
  - **en:** User not found
  - **pt-BR:** Usuário não encontrado
  - **es-419:** Usuario no encontrado

- **toasts > usernameTaken**
  - **en:** Username is already taken. Please choose another.
  - **pt-BR:** O nome de usuário já está em uso. Escolha outro.
  - **es-419:** El usuario ya está en uso. Elige otro.

- **toasts > profileUpdateError**
  - **en:** Error updating profile
  - **pt-BR:** Erro ao atualizar o perfil
  - **es-419:** Error al actualizar el perfil

- **toasts > invalidPassword**
  - **en:** Invalid password
  - **pt-BR:** Senha inválida
  - **es-419:** Contraseña inválida

- **toasts > passwordUpdateError**
  - **en:** Error updating password
  - **pt-BR:** Erro ao atualizar a senha
  - **es-419:** Error al actualizar la contraseña

- **toasts > smsEnabled**
  - **en:** Text notifications enabled
  - **pt-BR:** Notificações por SMS ativadas
  - **es-419:** Notificaciones por SMS activadas

- **toasts > smsDisabled**
  - **en:** Text notifications disabled
  - **pt-BR:** Notificações por SMS desativadas
  - **es-419:** Notificaciones por SMS desactivadas

- **toasts > smsUpdateError**
  - **en:** Error updating SMS notification preference
  - **pt-BR:** Erro ao atualizar SMS
  - **es-419:** Error al actualizar SMS

- **toasts > loginRequired**
  - **en:** Please log in to update preferences
  - **pt-BR:** Entre para atualizar as preferências
  - **es-419:** Inicia sesión para actualizar las preferencias

- **toasts > dataTrainingEnabled**
  - **en:** Data training opt-in enabled
  - **pt-BR:** Treinamento de dados ativado
  - **es-419:** Entrenamiento de datos activado

- **toasts > dataTrainingDisabled**
  - **en:** Data training opt-in disabled
  - **pt-BR:** Treinamento de dados desativado
  - **es-419:** Entrenamiento de datos desactivado

- **toasts > dataTrainingError**
  - **en:** Error updating data training preference
  - **pt-BR:** Erro ao atualizar treino de dados
  - **es-419:** Error al actualizar datos

- **toasts > deletionScheduled**
  - **en:** Your account is scheduled for deletion on {{date}}. You can log in before then to cancel in Settings.
  - **pt-BR:** Sua conta está programada para exclusão em {{date}}. Você pode entrar antes dessa data para cancelar em Configurações.
  - **es-419:** Tu cuenta está programada para eliminarse el {{date}}. Puedes iniciar sesión antes de esa fecha para cancelar en Ajustes.

- **toasts > deletionFailed**
  - **en:** Could not schedule account deletion. Please try again or contact support@paletteplot.com.
  - **pt-BR:** Não foi possível agendar a exclusão. Tente de novo ou escreva ao suporte.
  - **es-419:** No se pudo programar la eliminación. Intenta de nuevo o escribe a soporte.

- **toasts > deletionCancelled**
  - **en:** Account deletion cancelled. Your account will not be deleted.
  - **pt-BR:** Exclusão da conta cancelada. Sua conta não será excluída.
  - **es-419:** Eliminación de cuenta cancelada. Tu cuenta no se eliminará.

- **toasts > deletionCancelFailed**
  - **en:** Could not cancel. Please try again or contact support@paletteplot.com.
  - **pt-BR:** Não foi possível cancelar. Tente de novo ou escreva ao suporte.
  - **es-419:** No se pudo cancelar. Intenta de nuevo o escribe a soporte.

- **toasts > emailPrefError**
  - **en:** Error: {{message}}
  - **pt-BR:** Erro: {{message}}
  - **es-419:** Error: {{message}}

- **toasts > emailEnabled**
  - **en:** Email notifications enabled
  - **pt-BR:** Notificações por e-mail ativadas
  - **es-419:** Notificaciones por correo activadas

- **toasts > emailDisabled**
  - **en:** Email notifications disabled
  - **pt-BR:** Notificações por e-mail desativadas
  - **es-419:** Notificaciones por correo desactivadas

- **toasts > billingLoginRequired**
  - **en:** Please log in to manage billing
  - **pt-BR:** Entre para gerenciar sua assinatura
  - **es-419:** Inicia sesión para administrar la facturación

- **toasts > playSubscriptionsFailed**
  - **en:** Could not open Google Play subscriptions.
  - **pt-BR:** Não foi possível abrir as assinaturas do Google Play.
  - **es-419:** No se pudo abrir la pantalla de suscripciones de Google Play.

- **toasts > iosSubscriptionsHint**
  - **en:** Manage billing is available from your iPhone in Settings > Apple ID > Subscriptions.
  - **pt-BR:** Gerencie no iPhone: Ajustes > ID Apple > Assinaturas.
  - **es-419:** Administra en iPhone: Ajustes > ID de Apple > Suscripciones.

- **toasts > portalFailed**
  - **en:** Could not open billing portal. Please try again.
  - **pt-BR:** Não foi possível abrir o portal de assinatura. Tente novamente.
  - **es-419:** No se pudo abrir el portal de facturación. Inténtalo de nuevo.

- **toasts > portalFailedFallback**
  - **en:** Could not open billing portal. Please try again or use the link in your subscription email.
  - **pt-BR:** Não foi possível abrir o portal. Tente de novo ou use o link do e-mail.
  - **es-419:** No se pudo abrir el portal. Intenta de nuevo o usa el enlace del correo.

- **toasts > routineLoadFailed**
  - **en:** Could not load your routine settings.
  - **pt-BR:** Não foi possível carregar as configurações da sua rotina.
  - **es-419:** No se pudieron cargar los ajustes de tu rutina.

- **toasts > routineNotifUpdateFailed**
  - **en:** Could not update notification preference.
  - **pt-BR:** Não foi possível atualizar a preferência de notificações.
  - **es-419:** No se pudo actualizar la preferencia de notificaciones.

- **toasts > routineNotifOff**
  - **en:** Routine notifications turned off
  - **pt-BR:** Notificações de rotina desativadas
  - **es-419:** Notificaciones de rutina desactivadas

- **toasts > routineNotifDenied**
  - **en:** Notification permission was denied.
  - **pt-BR:** A permissão de notificações foi negada.
  - **es-419:** Se denegó el permiso de notificaciones.

- **toasts > routineNotifDeniedIos**
  - **en:** Notifications are off in iOS Settings. Enable them there, then try again.
  - **pt-BR:** As notificações estão desativadas nas Configurações do iOS. Ative-as lá e tente novamente.
  - **es-419:** Las notificaciones están desactivadas en Ajustes de iOS. Actívalas allí e inténtalo de nuevo.

- **toasts > routineNotifPermissionFailed**
  - **en:** Could not request notification permission.
  - **pt-BR:** Não foi possível solicitar a permissão de notificações.
  - **es-419:** No se pudo solicitar el permiso de notificaciones.

- **toasts > routineNotifOn**
  - **en:** Routine notifications enabled
  - **pt-BR:** Notificações de rotina ativadas
  - **es-419:** Notificaciones de rutina activadas

- **toasts > routineIntensitySaved**
  - **en:** Manifesting intensity updated
  - **pt-BR:** Intensidade de manifestação atualizada
  - **es-419:** Intensidad de manifestación actualizada

- **toasts > routineIntensitySaveFailed**
  - **en:** Could not save your routine intensity.
  - **pt-BR:** Não foi possível salvar sua intensidade de rotina.
  - **es-419:** No se pudo guardar tu intensidad de rutina.

- **legalDisclaimer**
  - **en:** Terms and Privacy are currently provided in English.
  - **pt-BR:** Os Termos e a Privacidade estão disponíveis atualmente em inglês.
  - **es-419:** Los Términos y la Privacidad están disponibles actualmente en inglés.

## Sign in, password reset & activation

Namespace: `auth`

- **notFound > title**
  - **en:** 404
  - **pt-BR:** 404
  - **es-419:** 404

- **notFound > message**
  - **en:** Page not found
  - **pt-BR:** Página não encontrada
  - **es-419:** Página no encontrada

- **notFound > redirecting**
  - **en:** Redirecting to home...
  - **pt-BR:** Redirecionando para o início...
  - **es-419:** Redirigiendo al inicio...

- **signIn > pageTitle**
  - **en:** Sign In | Palette Plotting
  - **pt-BR:** Entrar | Palette Plotting
  - **es-419:** Iniciar sesión | Palette Plotting

- **signIn > title**
  - **en:** Sign In
  - **pt-BR:** Entrar
  - **es-419:** Iniciar sesión

- **signIn > description**
  - **en:** Sign in to Continue
  - **pt-BR:** Entre para continuar
  - **es-419:** Inicia sesión para continuar

- **signIn > emailOrUsernameLabel**
  - **en:** Email or Username
  - **pt-BR:** E-mail ou usuário
  - **es-419:** Correo o usuario

- **signIn > emailOrUsernamePlaceholder**
  - **en:** you@example.com or username
  - **pt-BR:** voce@email.com ou usuário
  - **es-419:** tu@correo.com o usuario

- **signIn > passwordLabel**
  - **en:** Password
  - **pt-BR:** Senha
  - **es-419:** Contraseña

- **signIn > passwordPlaceholder**
  - **en:** ••••••••
  - **pt-BR:** ••••••••
  - **es-419:** ••••••••

- **signIn > forgotPasswordLink**
  - **en:** Forgot password?
  - **pt-BR:** Esqueceu a senha?
  - **es-419:** ¿Olvidaste tu clave?

- **signIn > submit**
  - **en:** Sign In
  - **pt-BR:** Entrar
  - **es-419:** Iniciar sesión

- **signIn > submitting**
  - **en:** Signing In...
  - **pt-BR:** Entrando...
  - **es-419:** Iniciando sesión...

- **signIn > noAccount**
  - **en:** Don't have an account?
  - **pt-BR:** Não tem uma conta?
  - **es-419:** ¿No tienes cuenta?

- **signIn > signUp**
  - **en:** Sign Up
  - **pt-BR:** Cadastre-se
  - **es-419:** Regístrate

- **forgotPassword > checkEmailTitle**
  - **en:** Check your email
  - **pt-BR:** Verifique seu e-mail
  - **es-419:** Revisa tu correo

- **forgotPassword > checkEmailBody**
  - **en:** Check your email for a password reset link. Click the link to reset your password.
  - **pt-BR:** Verifique seu e-mail para redefinir a senha.
  - **es-419:** Revisa tu correo para restablecer tu contraseña.

- **forgotPassword > backToSignIn**
  - **en:** Back to Sign In
  - **pt-BR:** Voltar para entrar
  - **es-419:** Volver a iniciar sesión

- **forgotPassword > sendResetLink**
  - **en:** Send Reset Link
  - **pt-BR:** Enviar link
  - **es-419:** Enviar enlace

- **forgotPassword > sending**
  - **en:** Sending...
  - **pt-BR:** Enviando...
  - **es-419:** Enviando...

- **resetPassword > title**
  - **en:** Reset Password
  - **pt-BR:** Redefinir senha
  - **es-419:** Restablecer contraseña

- **resetPassword > noSessionDescription**
  - **en:** Please click the link in your email to reset your password.
  - **pt-BR:** Clique no link do seu e-mail para redefinir sua senha.
  - **es-419:** Haz clic en el enlace de tu correo para restablecer tu contraseña.

- **resetPassword > description**
  - **en:** Enter your new password
  - **pt-BR:** Digite sua nova senha
  - **es-419:** Ingresa tu nueva contraseña

- **resetPassword > newPasswordLabel**
  - **en:** New Password
  - **pt-BR:** Nova senha
  - **es-419:** Nueva contraseña

- **resetPassword > newPasswordPlaceholder**
  - **en:** Enter new password
  - **pt-BR:** Nova senha
  - **es-419:** Nueva contraseña

- **resetPassword > confirmPasswordLabel**
  - **en:** Confirm New Password
  - **pt-BR:** Confirmar nova senha
  - **es-419:** Confirmar nueva contraseña

- **resetPassword > confirmPasswordPlaceholder**
  - **en:** Confirm new password
  - **pt-BR:** Confirme a senha
  - **es-419:** Confirma la contraseña

- **resetPassword > validatingPassword**
  - **en:** Validating password...
  - **pt-BR:** Validando senha...
  - **es-419:** Validando contraseña...

- **resetPassword > submit**
  - **en:** Reset Password
  - **pt-BR:** Redefinir senha
  - **es-419:** Restablecer contraseña

- **resetPassword > submitting**
  - **en:** Resetting...
  - **pt-BR:** Redefinindo...
  - **es-419:** Restableciendo...

- **resetPassword > backToSignIn**
  - **en:** Back to Sign In
  - **pt-BR:** Voltar para entrar
  - **es-419:** Volver a iniciar sesión

- **activate > title**
  - **en:** Activate your plan
  - **pt-BR:** Ative seu plano
  - **es-419:** Activa tu plan

- **activate > subtitleWithTier**
  - **en:** You chose the {{tier}} plan ({{billing}}).
  - **pt-BR:** Você escolheu o plano {{tier}} ({{billing}}).
  - **es-419:** Elegiste el plan {{tier}} ({{billing}}).

- **activate > subtitleDefault**
  - **en:** Complete setup to activate your subscription.
  - **pt-BR:** Conclua para ativar sua assinatura.
  - **es-419:** Completa para activar tu suscripción.

- **activate > billingMonthly**
  - **en:** monthly
  - **pt-BR:** mensal
  - **es-419:** mensual

- **activate > missingInfo**
  - **en:** Missing activation info. Please restart onboarding.
  - **pt-BR:** Informações de ativação ausentes. Reinicie o cadastro.
  - **es-419:** Falta información de activación. Reinicia el registro.

- **activate > restart**
  - **en:** Restart
  - **pt-BR:** Reiniciar
  - **es-419:** Reiniciar

- **activate > paymentNotConfirmed**
  - **en:** Payment not confirmed. Please ensure your payment was successful.
  - **pt-BR:** Pagamento não confirmado. Verifique se seu pagamento foi concluído.
  - **es-419:** Pago no confirmado. Asegúrate de que tu pago se haya completado.

- **activate > goToSubscriptions**
  - **en:** Go to subscriptions
  - **pt-BR:** Ir para assinaturas
  - **es-419:** Ir a suscripciones

- **activate > accountCreatedTitle**
  - **en:** Account created successfully!
  - **pt-BR:** Conta criada com sucesso!
  - **es-419:** ¡Cuenta creada con éxito!

- **activate > accountCreatedBody**
  - **en:** Check your email to set your password. Once you've set your password, you can sign in to access your account.
  - **pt-BR:** Verifique seu e-mail para definir sua senha. Depois, entre na conta.
  - **es-419:** Revisa tu correo para establecer tu contraseña. Luego inicia sesión.

- **activate > goToSignIn**
  - **en:** Go to Sign In
  - **pt-BR:** Ir para entrar
  - **es-419:** Ir a iniciar sesión

- **activate > waitingForAccount**
  - **en:** Waiting for account creation...
  - **pt-BR:** Aguardando criação da conta...
  - **es-419:** Esperando la creación de la cuenta...

- **verifyEmail > verifying**
  - **en:** Verifying…
  - **pt-BR:** Verificando…
  - **es-419:** Verificando…

- **verifyEmail > successTitle**
  - **en:** Email verified
  - **pt-BR:** E-mail verificado
  - **es-419:** Correo verificado

- **verifyEmail > successBody**
  - **en:** You're all set.
  - **pt-BR:** Tudo pronto.
  - **es-419:** Todo listo.

- **verifyEmail > errorTitle**
  - **en:** Verification failed
  - **pt-BR:** Verificação falhou
  - **es-419:** Verificación fallida

- **verifyEmail > missingToken**
  - **en:** Missing token.
  - **pt-BR:** Token ausente.
  - **es-419:** Falta el token.

- **verifyEmail > verificationFailed**
  - **en:** Verification failed.
  - **pt-BR:** Verificação falhou.
  - **es-419:** Verificación fallida.

- **verifyEmail > requestNewEmail**
  - **en:** Please request a new verification email.
  - **pt-BR:** Solicite um novo e-mail de verificação.
  - **es-419:** Solicita un nuevo correo de verificación.

- **verifyEmail > goToDashboard**
  - **en:** Go to dashboard
  - **pt-BR:** Ir para o painel
  - **es-419:** Ir al panel

- **toasts > usernameNotFound**
  - **en:** Username not found
  - **pt-BR:** Nome de usuário não encontrado
  - **es-419:** Nombre de usuario no encontrado

- **toasts > resetLinkSent**
  - **en:** Password reset link sent to your email
  - **pt-BR:** Link de redefinição enviado para seu e-mail
  - **es-419:** Enlace de restablecimiento enviado a tu correo

- **toasts > resetLinkFailed**
  - **en:** Failed to send reset link. Please try again.
  - **pt-BR:** Não foi possível enviar o link.
  - **es-419:** No se pudo enviar el enlace.

- **toasts > passwordResetSuccess**
  - **en:** Password reset successfully. Please sign in.
  - **pt-BR:** Senha redefinida com sucesso. Entre na sua conta.
  - **es-419:** Contraseña restablecida correctamente. Inicia sesión.

- **toasts > passwordResetFailed**
  - **en:** Failed to reset password. Please try again.
  - **pt-BR:** Não foi possível redefinir a senha. Tente novamente.
  - **es-419:** No se pudo restablecer la contraseña. Inténtalo de nuevo.

- **toasts > accountCreated**
  - **en:** Account created! Check your email to set your password.
  - **pt-BR:** Conta criada! Verifique seu e-mail para definir sua senha.
  - **es-419:** ¡Cuenta creada! Revisa tu correo para establecer tu contraseña.

- **toasts > activationLoadFailed**
  - **en:** Unable to load activation session. Please restart onboarding.
  - **pt-BR:** Não foi possível carregar a sessão de ativação. Reinicie o cadastro.
  - **es-419:** No se pudo cargar la sesión de activación. Reinicia el registro.

- **toasts > accountCreationSlow**
  - **en:** Account creation is taking longer than expected. Please check your email or contact support.
  - **pt-BR:** A criação da conta está demorando mais do que o esperado. Verifique seu e-mail ou entre em contato com o suporte.
  - **es-419:** La creación de la cuenta está tardando más de lo esperado. Revisa tu correo o contacta a soporte.

## Paywall & post-purchase

Namespace: `paywall`

- **postPaywall > title**
  - **en:** Your path is ready
  - **pt-BR:** Seu caminho está pronto
  - **es-419:** Tu camino está listo

- **postPaywall > buildingDashboard**
  - **en:** Building your dashboard…
  - **pt-BR:** Montando seu painel…
  - **es-419:** Construyendo tu panel…

- **postPaywall > finishingSubtitle**
  - **en:** Almost there — finishing your dashboard.
  - **pt-BR:** Quase lá — finalizando painel.
  - **es-419:** Casi listo — terminando tu panel.

- **postPaywall > loadingStatusAria**
  - **en:** Loading status
  - **pt-BR:** Carregamento
  - **es-419:** Carga

- **postPaywall > commitmentLabel**
  - **en:** Say this once, out loud:
  - **pt-BR:** Diga isto uma vez, em voz alta:
  - **es-419:** Di esto una vez, en voz alta:

- **postPaywall > commitmentText**
  - **en:** I have named what I want, and I will not abandon it when doubt shows up. I commit to giving my desire my voice, my attention, and my follow-through. I will not wait to feel ready — I will act like the person who is already on this path. What I want deserves more than a passing thought; it deserves my full yes.
  - **pt-BR:** Eu nomeei o que quero e não vou abandonar quando a dúvida aparecer. Dou ao meu desejo minha voz, atenção e constância. Vou agir como quem já está neste caminho. O que quero merece meu sim completo.
  - **es-419:** He nombrado lo que quiero y no lo abandonaré cuando aparezca la duda. Le doy mi voz, atención y constancia. Actuaré como quien ya está en este camino. Lo que quiero merece mi sí completo.

- **postPaywall > simsLines (line 1)**
  - **en:** Making it official — membership locked in, overthinking not required.
  - **pt-BR:** Assinatura confirmada — oficial.
  - **es-419:** Membresía confirmada — oficial.

- **postPaywall > simsLines (line 2)**
  - **en:** Writing affirmations from your setup — we actually used your answers.
  - **pt-BR:** Criando afirmações com suas respostas.
  - **es-419:** Creando afirmaciones con tus respuestas.

- **postPaywall > simsLines (line 3)**
  - **en:** Giving your affirmations a voice — loop-friendly by design.
  - **pt-BR:** Dando voz às suas afirmações.
  - **es-419:** Dando voz a tus afirmaciones.

- **postPaywall > simsLines (line 4)**
  - **en:** Layering sound, whispers & theta into your starter track…
  - **pt-BR:** Misturando som, sussurros e theta…
  - **es-419:** Mezclando sonido, susurros y theta…

- **postPaywall > simsLines (line 5)**
  - **en:** Unlocking your dashboard — built from everything you shared, almost there.
  - **pt-BR:** Desbloqueando seu painel…
  - **es-419:** Desbloqueando tu panel…

- **postPaywall > toastActivateFailedIos**
  - **en:** Purchase completed, but we could not activate your plan yet. Try again from subscriptions.
  - **pt-BR:** Compra concluída, mas não conseguimos ativar seu plano ainda. Tente novamente em assinaturas.
  - **es-419:** Compra completada, pero no pudimos activar tu plan aún. Inténtalo de nuevo desde suscripciones.

- **postPaywall > toastActivateFailedAndroid**
  - **en:** Purchase completed, but we could not activate your plan yet. Please try again.
  - **pt-BR:** Compra concluída, mas não conseguimos ativar seu plano ainda. Tente novamente.
  - **es-419:** Compra completada, pero no pudimos activar tu plan aún. Inténtalo de nuevo.

- **postPaywall > toastSetupSnag**
  - **en:** We hit a snag finishing setup. Taking you to the dashboard…
  - **pt-BR:** Tivemos um problema ao finalizar a configuração. Indo para o painel…
  - **es-419:** Tuvimos un problema al terminar la configuración. Te llevamos al panel…

- **legacyIos > titleLine1**
  - **en:** Unlock your free trial
  - **pt-BR:** Desbloqueie o teste grátis
  - **es-419:** Desbloquea tu prueba gratis

- **legacyIos > titleLine2**
  - **en:** Start manifesting
  - **pt-BR:** Comece a manifestar
  - **es-419:** Empieza a manifestar

- **legacyIos > subtitle**
  - **en:** Choose a weekly plan to claim your free trial.
  - **pt-BR:** Escolha o plano semanal para começar.
  - **es-419:** Elige el plan semanal para empezar.

- **legacyIos > loadingOptions**
  - **en:** Loading subscription options…
  - **pt-BR:** Carregando opções de assinatura…
  - **es-419:** Cargando opciones de suscripción…

- **legacyIos > weekly**
  - **en:** Weekly
  - **pt-BR:** Semanal
  - **es-419:** Semanal

- **legacyIos > monthly**
  - **en:** Monthly
  - **pt-BR:** Mensal
  - **es-419:** Mensual

- **legacyIos > yearly**
  - **en:** Yearly
  - **pt-BR:** Anual
  - **es-419:** Anual

- **legacyIos > bestAnnualValue**
  - **en:** Best annual value
  - **pt-BR:** Melhor valor anual
  - **es-419:** Mejor valor anual

- **legacyIos > onlyPerMonth**
  - **en:** Only {{amount}}/mo
  - **pt-BR:** Apenas {{amount}}/mês
  - **es-419:** Solo {{amount}}/mes

- **legacyIos > perWeek**
  - **en:** {{price}}/week
  - **pt-BR:** {{price}}/semana
  - **es-419:** {{price}}/semana

- **legacyIos > perMonth**
  - **en:** {{price}}/month
  - **pt-BR:** {{price}}/mês
  - **es-419:** {{price}}/mes

- **legacyIos > perYear**
  - **en:** {{price}}/year
  - **pt-BR:** {{price}}/ano
  - **es-419:** {{price}}/año

- **legacyIos > opening**
  - **en:** Opening…
  - **pt-BR:** Abrindo…
  - **es-419:** Abriendo…

- **legacyIos > tryAgain**
  - **en:** Try again
  - **pt-BR:** Tentar de novo
  - **es-419:** Intentar de nuevo

- **legacyIos > fallbackTitle**
  - **en:** We couldn't finish that step
  - **pt-BR:** Não conseguimos concluir essa etapa
  - **es-419:** No pudimos completar ese paso

- **legacyIos > fallbackBody**
  - **en:** Tap Try again, or go back to sign up and tap Continue.
  - **pt-BR:** Toque em Tentar de novo ou volte e toque em Continuar.
  - **es-419:** Toca Intentar de nuevo o vuelve y toca Continuar.

- **legacyIos > terms**
  - **en:** Terms / EULA
  - **pt-BR:** Termos / EULA
  - **es-419:** Términos / EULA

- **legacyIos > privacy**
  - **en:** Privacy
  - **pt-BR:** Privacidade
  - **es-419:** Privacidad

- **legacyIos > restorePurchases**
  - **en:** Restore purchases
  - **pt-BR:** Restaurar compras
  - **es-419:** Restaurar compras

- **legacyIos > restoring**
  - **en:** Restoring…
  - **pt-BR:** Restaurando…
  - **es-419:** Restaurando…

- **legacyIos > restore**
  - **en:** Restore
  - **pt-BR:** Restaurar
  - **es-419:** Restaurar

- **legacyIos > closeAria**
  - **en:** Close
  - **pt-BR:** Fechar
  - **es-419:** Cerrar

- **legacyIos > errorNotIosApp**
  - **en:** Subscriptions are only available in the iOS app.
  - **pt-BR:** Assinaturas só no app iOS.
  - **es-419:** Suscripciones solo en la app iOS.

- **legacyIos > errorSignInAgain**
  - **en:** Sign in again, then open subscription.
  - **pt-BR:** Entre novamente e abra a assinatura.
  - **es-419:** Inicia sesión de nuevo y abre la suscripción.

- **legacyIos > errorNoSession**
  - **en:** No active session. Sign out, sign in, then tap Continue.
  - **pt-BR:** Nenhuma sessão ativa. Saia, entre novamente e toque em Continuar.
  - **es-419:** No hay sesión activa. Cierra sesión, inicia sesión y toca Continuar.

- **legacyIos > errorOpenFromSignup**
  - **en:** Open subscription from the app after sign up.
  - **pt-BR:** Abra a assinatura no app após cadastro.
  - **es-419:** Abre la suscripción en la app tras registrarte.

- **legacyIos > errorSkippedDetail**
  - **en:** Use Continue on the sign-up screen, or open Account from Settings.
  - **pt-BR:** Use Continuar no cadastro ou Conta em Ajustes.
  - **es-419:** Usa Continuar en registro o Cuenta en Ajustes.

- **legacyIos > errorGeneric**
  - **en:** Something went wrong.
  - **pt-BR:** Algo deu errado.
  - **es-419:** Algo salió mal.

- **legacyIos > errorPersist**
  - **en:** Something went wrong. Copy debug log from Safari if this persists.
  - **pt-BR:** Algo deu errado. Copie o log de depuração do Safari se persistir.
  - **es-419:** Algo salió mal. Copia el registro de depuración desde Safari si persiste.

- **legacyIos > restoreOnlyIos**
  - **en:** Restore is only available in the iOS app.
  - **pt-BR:** Restaurar está disponível apenas no app iOS.
  - **es-419:** Restaurar solo está disponible en la app de iOS.

- **legacyIos > restoredSuccess**
  - **en:** Subscription restored. Welcome back!
  - **pt-BR:** Assinatura restaurada. Bem-vindo!
  - **es-419:** Suscripción restaurada. ¡Bienvenido!

- **legacyIos > restoreCancelled**
  - **en:** Restore cancelled.
  - **pt-BR:** Restauração cancelada.
  - **es-419:** Restauración cancelada.

- **legacyIos > nothingToRestore**
  - **en:** Nothing to restore.
  - **pt-BR:** Nada para restaurar.
  - **es-419:** Nada que restaurar.

- **legacyAndroid > title**
  - **en:** Unlock Your Manifestation Stack Today.
  - **pt-BR:** Desbloqueie ferramentas de manifestação.
  - **es-419:** Desbloquea herramientas de manifestación.

- **legacyAndroid > subtitle**
  - **en:** Tap Continue to confirm your plan.
  - **pt-BR:** Toque em Continuar para confirmar.
  - **es-419:** Toca Continuar para confirmar.

- **legacyAndroid > opening**
  - **en:** Opening…
  - **pt-BR:** Abrindo…
  - **es-419:** Abriendo…

- **legacyAndroid > tryAgain**
  - **en:** Try again
  - **pt-BR:** Tentar de novo
  - **es-419:** Intentar de nuevo

- **legacyAndroid > fallbackTitle**
  - **en:** We couldn't finish that step
  - **pt-BR:** Não conseguimos concluir essa etapa
  - **es-419:** No pudimos completar ese paso

- **legacyAndroid > fallbackBody**
  - **en:** Tap Try again, or go back to sign up and tap Continue.
  - **pt-BR:** Toque em Tentar de novo ou volte e toque em Continuar.
  - **es-419:** Toca Intentar de nuevo o vuelve y toca Continuar.

- **legacyAndroid > terms**
  - **en:** Terms / EULA
  - **pt-BR:** Termos / EULA
  - **es-419:** Términos / EULA

- **legacyAndroid > privacy**
  - **en:** Privacy
  - **pt-BR:** Privacidade
  - **es-419:** Privacidad

- **legacyAndroid > closeAria**
  - **en:** Close
  - **pt-BR:** Fechar
  - **es-419:** Cerrar

- **legacyAndroid > errorNotAndroidApp**
  - **en:** Subscriptions are only available in the Android app.
  - **pt-BR:** Assinaturas só no app Android.
  - **es-419:** Suscripciones solo en la app Android.

- **legacyAndroid > errorSignInAgain**
  - **en:** Sign in again, then open subscription.
  - **pt-BR:** Entre novamente e abra a assinatura.
  - **es-419:** Inicia sesión de nuevo y abre la suscripción.

- **legacyAndroid > errorNoSession**
  - **en:** No active session. Sign out, sign in, then tap Continue.
  - **pt-BR:** Nenhuma sessão ativa. Saia, entre novamente e toque em Continuar.
  - **es-419:** No hay sesión activa. Cierra sesión, inicia sesión y toca Continuar.

- **legacyAndroid > errorOpenFromSignup**
  - **en:** Open subscription from the app after sign up.
  - **pt-BR:** Abra a assinatura no app após cadastro.
  - **es-419:** Abre la suscripción en la app tras registrarte.

- **legacyAndroid > errorSkippedDetail**
  - **en:** Use Continue on the sign-up screen, or open Account from Settings.
  - **pt-BR:** Use Continuar na tela de cadastro ou abra Conta em Configurações.
  - **es-419:** Usa Continuar en la pantalla de registro o abre Cuenta desde Ajustes.

- **legacyAndroid > errorGeneric**
  - **en:** Something went wrong.
  - **pt-BR:** Algo deu errado.
  - **es-419:** Algo salió mal.

- **flow > subscriptionAlreadyOpening**
  - **en:** Subscription is already opening — wait a few seconds, then try again.
  - **pt-BR:** A assinatura já está abrindo — aguarde alguns segundos e tente novamente.
  - **es-419:** La suscripción ya se está abriendo — espera unos segundos e inténtalo de nuevo.

- **flow > subscriptionScreenMayBeOpening**
  - **en:** A subscription screen may still be opening. Wait a few seconds, then try again. If nothing changes, force-quit the app and reopen.
  - **pt-BR:** A tela de assinatura pode estar abrindo. Aguarde e tente de novo.
  - **es-419:** La pantalla de suscripción puede estar abriéndose. Espera e inténtalo de nuevo.

- **flow > openingSubscriptionsTimedOut**
  - **en:** Opening subscriptions timed out. Force-quit the app, reopen, and tap Continue again.
  - **pt-BR:** A assinatura demorou para abrir. Reinicie a app e tente de novo.
  - **es-419:** La suscripción tardó en abrir. Reinicia la app e inténtalo de nuevo.

- **flow > paymentNotCompleted**
  - **en:** Payment was not completed.
  - **pt-BR:** O pagamento não foi concluído.
  - **es-419:** El pago no se completó.

- **flow > couldNotOpenSubscription**
  - **en:** Could not open subscription options.
  - **pt-BR:** Não foi possível abrir as opções de assinatura.
  - **es-419:** No se pudieron abrir las opciones de suscripción.

- **flow > signInRequiredBeforeSubscribing**
  - **en:** Sign in is required before subscribing.
  - **pt-BR:** É necessário entrar antes de assinar.
  - **es-419:** Debes iniciar sesión antes de suscribirte.

- **webWrapper > checkoutFailed**
  - **en:** We could not open checkout.
  - **pt-BR:** Não foi possível abrir o pagamento.
  - **es-419:** No pudimos abrir el pago.

- **webWrapper > checkoutClosed**
  - **en:** Checkout closed. You can subscribe anytime.
  - **pt-BR:** Pagamento cancelado. Assine quando quiser.
  - **es-419:** Pago cerrado. Suscríbete cuando quieras.

- **webWrapper > viewPlans**
  - **en:** View plans
  - **pt-BR:** Ver planos
  - **es-419:** Ver planes

- **webWrapper > close**
  - **en:** Close
  - **pt-BR:** Fechar
  - **es-419:** Cerrar

- **webWrapper > notConfigured**
  - **en:** Web checkout is not configured yet. Please try again later.
  - **pt-BR:** Pagamento web indisponível. Tente mais tarde.
  - **es-419:** Pago web no disponible. Inténtalo más tarde.

- **webWrapper > subscriptionNotCompleted**
  - **en:** Subscription not completed.
  - **pt-BR:** Assinatura não concluída.
  - **es-419:** Suscripción no completada.

- **emailCollection > title**
  - **en:** Let's Get Started
  - **pt-BR:** Vamos começar
  - **es-419:** Empecemos

- **emailCollection > emailLabel**
  - **en:** Email
  - **pt-BR:** E-mail
  - **es-419:** Correo

- **emailCollection > firstNameLabel**
  - **en:** First Name
  - **pt-BR:** Nome
  - **es-419:** Nombre

- **emailCollection > usernameLabel**
  - **en:** Username
  - **pt-BR:** Usuário
  - **es-419:** Usuario

- **emailCollection > passwordLabel**
  - **en:** Password
  - **pt-BR:** Senha
  - **es-419:** Contraseña

- **emailCollection > confirmLabel**
  - **en:** Confirm
  - **pt-BR:** Confirmar
  - **es-419:** Confirmar

- **emailCollection > emailPlaceholder**
  - **en:** your@email.com
  - **pt-BR:** seu@email.com
  - **es-419:** tu@correo.com

- **emailCollection > firstNamePlaceholder**
  - **en:** First name
  - **pt-BR:** Nome
  - **es-419:** Nombre

- **emailCollection > usernamePlaceholder**
  - **en:** Username
  - **pt-BR:** Usuário
  - **es-419:** Usuario

- **emailCollection > passwordPlaceholder**
  - **en:** 8+ characters
  - **pt-BR:** 8+ caracteres
  - **es-419:** 8+ caracteres

- **emailCollection > confirmPlaceholder**
  - **en:** Re-enter
  - **pt-BR:** Digite novamente
  - **es-419:** Repetir

- **emailCollection > checkingEmail**
  - **en:** Checking availability...
  - **pt-BR:** Verificando disponibilidade...
  - **es-419:** Comprobando disponibilidad...

- **emailCollection > checkingUsername**
  - **en:** Checking...
  - **pt-BR:** Verificando...
  - **es-419:** Comprobando...

- **emailCollection > emailTaken**
  - **en:** This email is already registered. Please sign in instead.
  - **pt-BR:** Este e-mail já está cadastrado. Entre em vez disso.
  - **es-419:** Este correo ya está registrado. Inicia sesión en su lugar.

- **emailCollection > usernameTaken**
  - **en:** This username is already taken. Please choose another.
  - **pt-BR:** Este usuário já está em uso. Escolha outro.
  - **es-419:** Este usuario ya está en uso. Elige otro.

- **emailCollection > passwordMinLength**
  - **en:** Password must be at least 8 characters.
  - **pt-BR:** A senha deve ter pelo menos 8 caracteres.
  - **es-419:** La contraseña debe tener al menos 8 caracteres.

- **emailCollection > passwordMismatch**
  - **en:** Passwords do not match.
  - **pt-BR:** As senhas não coincidem.
  - **es-419:** Las contraseñas no coinciden.

- **emailCollection > passwordMismatchToast**
  - **en:** Passwords do not match
  - **pt-BR:** As senhas não coincidem
  - **es-419:** Las contraseñas no coinciden

- **emailCollection > invalidEmail**
  - **en:** Please enter a valid email address
  - **pt-BR:** Digite um e-mail válido
  - **es-419:** Ingresa un correo válido

- **emailCollection > needUsername**
  - **en:** Please enter a username
  - **pt-BR:** Digite um nome de usuário
  - **es-419:** Ingresa un nombre de usuario

- **emailCollection > needPassword**
  - **en:** Please enter a password with at least 8 characters
  - **pt-BR:** Digite uma senha com pelo menos 8 caracteres
  - **es-419:** Ingresa una contraseña de al menos 8 caracteres

- **emailCollection > needFirstName**
  - **en:** Please enter your first name
  - **pt-BR:** Digite seu nome
  - **es-419:** Ingresa tu nombre

- **emailCollection > acceptTerms**
  - **en:** Please accept the Terms of Service and Privacy Policy
  - **pt-BR:** Aceite os Termos de serviço e a Política de privacidade
  - **es-419:** Acepta los Términos de servicio y la Política de privacidad

- **emailCollection > verifyEmailBlocked**
  - **en:** Account created, but sign-in is blocked. Please verify your email, then sign in.
  - **pt-BR:** Conta criada, mas o login está bloqueado. Verifique seu e-mail e entre.
  - **es-419:** Cuenta creada, pero el inicio de sesión está bloqueado. Verifica tu correo e inicia sesión.

- **emailCollection > subscriptionError**
  - **en:** Could not open subscription options. Try again in a moment.
  - **pt-BR:** Não foi possível abrir as opções de assinatura. Tente novamente em instantes.
  - **es-419:** No pudimos abrir las opciones de suscripción. Inténtalo en un momento.

- **emailCollection > saveFailed**
  - **en:** Failed to save. Please try again.
  - **pt-BR:** Falha ao salvar. Tente novamente.
  - **es-419:** No se pudo guardar. Inténtalo de nuevo.

- **emailCollection > tryAgain**
  - **en:** Try again
  - **pt-BR:** Tentar novamente
  - **es-419:** Intentar de nuevo

- **emailCollection > termsAcceptPrefix**
  - **en:** I accept the
  - **pt-BR:** Aceito os
  - **es-419:** Acepto los

- **emailCollection > termsOfService**
  - **en:** Terms of Service
  - **pt-BR:** Termos de serviço
  - **es-419:** Términos de servicio

- **emailCollection > termsAnd**
  - **en:** and
  - **pt-BR:** e a
  - **es-419:** y la

- **emailCollection > privacyPolicy**
  - **en:** Privacy Policy
  - **pt-BR:** Privacidade
  - **es-419:** Privacidad

- **emailCollection > appNotificationsConsent**
  - **en:** I consent to app notifications (optional). New tools, promotions and app news. Opt out in Settings → Notification preferences.
  - **pt-BR:** Aceito notificações do app (opcional). Cancele em Configurações.
  - **es-419:** Acepto notificaciones de la app (opcional). Cancela en Ajustes.

- **emailCollection > emailMarketingConsent**
  - **en:** I consent to email marketing communications (optional, separate from transactional emails minimally required). Opt out in settings.
  - **pt-BR:** Aceito marketing por e-mail (opcional). Cancele nas configurações.
  - **es-419:** Acepto marketing por correo (opcional). Cancela en ajustes.

- **emailCollection > smsMarketingConsent**
  - **en:** I consent to SMS marketing communications (optional). Opt out in settings. Message and data rates may apply.
  - **pt-BR:** Aceito marketing por SMS (opcional). Cancele nas configurações.
  - **es-419:** Acepto marketing por SMS (opcional). Cancela en ajustes.

- **paymentProcessing > title**
  - **en:** Processing Payment
  - **pt-BR:** Processando pagamento
  - **es-419:** Procesando pago

- **paymentProcessing > subtitle**
  - **en:** Please wait while we confirm your payment. This usually takes a few seconds.
  - **pt-BR:** Aguarde enquanto confirmamos seu pagamento. Isso geralmente leva alguns segundos.
  - **es-419:** Espera mientras confirmamos tu pago. Esto suele tardar unos segundos.

- **paymentProcessing > missingInfo**
  - **en:** Missing payment information. Please restart onboarding.
  - **pt-BR:** Informações de pagamento ausentes. Reinicie o onboarding.
  - **es-419:** Falta información de pago. Reinicia el onboarding.

- **paymentProcessing > verificationSlow**
  - **en:** Payment verification is taking longer than expected. Please contact support.
  - **pt-BR:** A verificação do pagamento está demorando mais do que o esperado. Entre em contato com o suporte.
  - **es-419:** La verificación del pago está tardando más de lo esperado. Contacta a soporte.

- **paymentProcessing > verificationFailed**
  - **en:** Unable to verify payment. Please contact support.
  - **pt-BR:** Não foi possível verificar o pagamento. Entre em contato com o suporte.
  - **es-419:** No se pudo verificar el pago. Contacta a soporte.

## App tools

Namespace: `tools`

- **demo > affirmations > maxAffirmations**
  - **en:** Maximum 5 affirmations for this demo
  - **pt-BR:** Máximo de 5 afirmações para esta demo
  - **es-419:** Máximo 5 afirmaciones para esta demo

- **demo > affirmations > walkthrough > createSet > title**
  - **en:** Create Your First Set
  - **pt-BR:** Crie seu primeiro conjunto
  - **es-419:** Crea tu primer set

- **demo > affirmations > walkthrough > createSet > message**
  - **en:** Click 'New Set' to create your affirmation set. Name it and select a category.
  - **pt-BR:** Toque em "Novo conjunto" para criar seu conjunto de afirmações. Dê um nome e selecione uma categoria.
  - **es-419:** Toca "Nuevo set" para crear tu set de afirmaciones. Ponle nombre y selecciona una categoría.

- **demo > affirmations > walkthrough > writeAffirmations > title**
  - **en:** Write Your Affirmations
  - **pt-BR:** Escreva suas afirmações
  - **es-419:** Escribe tus afirmaciones

- **demo > affirmations > walkthrough > writeAffirmations > message**
  - **en:** Click the edit button and type your affirmations. Press Enter to add each one. You can add up to 5 affirmations.
  - **pt-BR:** Toque no botão de editar e digite suas afirmações. Pressione Enter para adicionar cada uma. Você pode adicionar até 5 afirmações.
  - **es-419:** Toca el botón de editar y escribe tus afirmaciones. Presiona Enter para agregar cada una. Puedes agregar hasta 5 afirmaciones.

- **demo > affirmations > walkthrough > chooseImages > title**
  - **en:** Choose Your Vision Board Images
  - **pt-BR:** Escolha imagens do quadro
  - **es-419:** Elige imágenes del tablero

- **demo > affirmations > walkthrough > chooseImages > message**
  - **en:** Click the image button to select images for your affirmations. Choose 5 images from the 10 available options. Subscriber library has 50+ images.
  - **pt-BR:** Toque no botão de imagem para selecionar imagens para suas afirmações. Escolha 5 imagens das 10 opções disponíveis. A biblioteca de assinantes tem mais de 50 imagens.
  - **es-419:** Toca el botón de imagen para seleccionar imágenes para tus afirmaciones. Elige 5 imágenes de las 10 opciones disponibles. La biblioteca de suscriptores tiene más de 50 imágenes.

- **demo > affirmations > walkthrough > saveImages > title**
  - **en:** Save Your Images
  - **pt-BR:** Salve suas imagens
  - **es-419:** Guarda tus imágenes

- **demo > affirmations > walkthrough > saveImages > message**
  - **en:** Click the Save button to add your selected images to your affirmation set.
  - **pt-BR:** Toque em Salvar para adicionar as imagens selecionadas ao seu conjunto de afirmações.
  - **es-419:** Toca Guardar para agregar las imágenes seleccionadas a tu set de afirmaciones.

- **demo > affirmations > walkthrough > play > title**
  - **en:** View Your Set
  - **pt-BR:** Veja seu conjunto
  - **es-419:** Mira tu set

- **demo > affirmations > walkthrough > play > message**
  - **en:** Click the Play button to view your affirmation set with images.
  - **pt-BR:** Toque em Reproduzir para ver seu conjunto de afirmações com imagens.
  - **es-419:** Toca Reproducir para ver tu set de afirmaciones con imágenes.

- **demo > subliminal > recordingSavedCustomize**
  - **en:** Recording saved! Now customize your track settings below.
  - **pt-BR:** Gravação salva! Agora personalize as configurações da sua faixa abaixo.
  - **es-419:** ¡Grabación guardada! Ahora personaliza los ajustes de tu pista abajo.

- **demo > subliminal > trackGenerated**
  - **en:** Track generated successfully!
  - **pt-BR:** Faixa gerada com sucesso!
  - **es-419:** ¡Pista generada correctamente!

- **demo > subliminal > generateTrackFailed**
  - **en:** Failed to generate track
  - **pt-BR:** Falha ao gerar a faixa
  - **es-419:** No se pudo generar la pista

- **demo > subliminal > playTrackFailed**
  - **en:** Failed to play track
  - **pt-BR:** Falha ao reproduzir a faixa
  - **es-419:** No se pudo reproducir la pista

- **demo > subliminal > maxTrackLengthDemo**
  - **en:** Maximum track length is 1 minute for the demo.
  - **pt-BR:** A duração máxima da faixa é 1 minuto para a demo.
  - **es-419:** La duración máxima de pista es 1 minuto para la demo.

- **demo > subliminal > emailNotFoundForFeedback**
  - **en:** We couldn't find your email for this feedback.
  - **pt-BR:** Não encontramos seu e-mail para este feedback.
  - **es-419:** No encontramos tu correo para este comentario.

- **demo > subliminal > feedbackSubmitFailed**
  - **en:** Failed to submit feedback. Please try again.
  - **pt-BR:** Falha ao enviar feedback. Tente novamente.
  - **es-419:** No se pudo enviar el comentario. Inténtalo de nuevo.

- **demo > subliminal > micAccessFailed**
  - **en:** Failed to access microphone. Please check permissions.
  - **pt-BR:** Falha ao acessar o microfone. Verifique as permissões.
  - **es-419:** No se pudo acceder al micrófono. Revisa los permisos.

- **demo > subliminal > walkthrough > record > title**
  - **en:** Record Your Affirmations
  - **pt-BR:** Grave suas afirmações
  - **es-419:** Graba tus afirmaciones

- **demo > subliminal > walkthrough > record > message**
  - **en:** Choose Freestyle or Karaoke mode to record your affirmations. Text-to-Speech is available for paid subscribers.
  - **pt-BR:** Escolha o modo Freestyle ou Karaoke para gravar suas afirmações. A função de texto para fala está disponível para assinantes pagos.
  - **es-419:** Elige el modo Freestyle o Karaoke para grabar tus afirmaciones. La función de texto a voz está disponible para suscriptores de pago.

- **demo > subliminal > walkthrough > customize > title**
  - **en:** Customize Your Track
  - **pt-BR:** Personalize sua faixa
  - **es-419:** Personaliza tu pista

- **demo > subliminal > walkthrough > customize > message**
  - **en:** Now customize your subliminal track settings. Theta wave and Ocean sound are pre-selected for this demo. Adjust volumes, layers, and track length, then click 'Create Track' to generate your audio.
  - **pt-BR:** Personalize sua faixa subliminar. Theta e Ocean vêm pré-selecionados. Ajuste volumes, camadas e duração, depois toque em Criar faixa.
  - **es-419:** Personaliza tu pista subliminal. Theta y Ocean vienen preseleccionados. Ajusta volumen, capas y duración, luego toca Crear pista.

- **demo > subliminal > walkthrough > play > title**
  - **en:** Play Track
  - **pt-BR:** Reproduzir faixa
  - **es-419:** Reproducir pista

- **demo > subliminal > walkthrough > play > message**
  - **en:** Your track is ready! Click the Play button to listen to your subliminal audio.
  - **pt-BR:** Sua faixa está pronta! Toque em Reproduzir para ouvir seu áudio subliminar.
  - **es-419:** ¡Tu pista está lista! Toca Reproducir para escuchar tu audio subliminal.

- **demo > subliminal > walkthrough > signup > title**
  - **en:** Enjoying it? Get Access to More.
  - **pt-BR:** Gostou? Tenha acesso a mais.
  - **es-419:** ¿Te gusta? Accede a más.

- **demo > subliminal > walkthrough > signup > message**
  - **en:** You're seeing less than 15% of the app in this demo. Get enhanced access to the subliminal maker, Mirror Work, momentum/goal & habit tracking, and other interactive manifestation tools.
  - **pt-BR:** Nesta demo você vê menos de 15% do app. Desbloqueie subliminares, espelho, metas, hábitos e outras ferramentas.
  - **es-419:** En esta demo ves menos del 15% de la app. Desbloquea subliminales, espejo, metas, hábitos y más herramientas.

- **demo > subliminal > walkthrough > signup > actionText**
  - **en:** Sign Up
  - **pt-BR:** Cadastrar-se
  - **es-419:** Registrarse

- **demo > subliminal > walkthrough > signup > secondaryActionText**
  - **en:** Not ready yet, share feedback
  - **pt-BR:** Ainda não, dar feedback
  - **es-419:** Aún no, dar feedback

- **demo > subliminal > walkthrough > feedback > title**
  - **en:** Share Your Feedback
  - **pt-BR:** Compartilhe seu feedback
  - **es-419:** Comparte tu opinión

- **demo > subliminal > walkthrough > feedback > message**
  - **en:** What stopped you from signing up today?
  - **pt-BR:** O que impediu você de se cadastrar hoje?
  - **es-419:** ¿Qué te impidió registrarte hoy?

- **demo > subliminal > walkthrough > thankYou > title**
  - **en:** Thank you!
  - **pt-BR:** Obrigado!
  - **es-419:** ¡Gracias!

- **demo > subliminal > walkthrough > thankYou > message**
  - **en:** We appreciate your feedback and will use it to improve Palette Plotting.
  - **pt-BR:** Agradecemos seu feedback e vamos usá-lo para melhorar o Palette Plotting.
  - **es-419:** Agradecemos tu comentario y lo usaremos para mejorar Palette Plotting.

- **chat > selectCharacterFirst**
  - **en:** Select a character first to start chatting.
  - **pt-BR:** Selecione um personagem primeiro para começar a conversar.
  - **es-419:** Selecciona un personaje primero para empezar a chatear.

- **chat > goToEmbody**
  - **en:** Go to Embody
  - **pt-BR:** Ir para Encarnar
  - **es-419:** Ir a Encarnar

- **chat > messagesToday**
  - **en:** {{count}} / {{limit}} messages today
  - **pt-BR:** {{count}} / {{limit}} mensagens hoje
  - **es-419:** {{count}} / {{limit}} mensajes hoy

- **chat > startConversation**
  - **en:** Start a conversation with {{name}}
  - **pt-BR:** Comece uma conversa com {{name}}
  - **es-419:** Inicia una conversación con {{name}}

- **chat > system**
  - **en:** System
  - **pt-BR:** Sistema
  - **es-419:** Sistema

- **chat > placeholder**
  - **en:** Type your message...
  - **pt-BR:** Digite sua mensagem...
  - **es-419:** Escribe tu mensaje...

- **chat > dailyLimitReached**
  - **en:** Daily limit reached. Your limit resets tomorrow.
  - **pt-BR:** Limite diário atingido. Seu limite reinicia amanhã.
  - **es-419:** Límite diario alcanzado. Tu límite se reinicia mañana.

- **chat > errors > loadHistory**
  - **en:** Failed to load chat history
  - **pt-BR:** Falha ao carregar o histórico do chat
  - **es-419:** No se pudo cargar el historial del chat

- **chat > errors > sendFailed**
  - **en:** Failed to send message. Please try again.
  - **pt-BR:** Falha ao enviar a mensagem. Tente novamente.
  - **es-419:** No se pudo enviar el mensaje. Inténtalo de nuevo.

- **chat > errors > sessionExpired**
  - **en:** Your session has expired. Refresh the page and try again.
  - **pt-BR:** Sua sessão expirou. Atualize a página e tente novamente.
  - **es-419:** Tu sesión ha expirado. Actualiza la página e inténtalo de nuevo.

- **chat > errors > forbidden**
  - **en:** You do not have permission to send messages. Check your account status.
  - **pt-BR:** Você não tem permissão para enviar mensagens. Verifique o status da sua conta.
  - **es-419:** No tienes permiso para enviar mensajes. Revisa el estado de tu cuenta.

- **chat > errors > rateLimit**
  - **en:** Too many requests. Wait a moment and try again.
  - **pt-BR:** Muitas solicitações. Aguarde um momento e tente novamente.
  - **es-419:** Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.

- **chat > errors > connection**
  - **en:** Connection error. Check your internet and try again.
  - **pt-BR:** Erro de conexão. Verifique sua internet e tente novamente.
  - **es-419:** Error de conexión. Revisa tu internet e inténtalo de nuevo.

- **chat > errors > timeout**
  - **en:** Request timed out. Please try again.
  - **pt-BR:** A solicitação expirou. Tente novamente.
  - **es-419:** La solicitud expiró. Inténtalo de nuevo.

- **activity > title**
  - **en:** Manifestation Milestones
  - **pt-BR:** Marcos de manifestação
  - **es-419:** Hitos de manifestación

- **activity > milestones > tabs > inspiredActions**
  - **en:** Inspired Actions
  - **pt-BR:** Ações inspiradas
  - **es-419:** Acciones inspiradas

- **activity > milestones > tabs > desires**
  - **en:** Desires
  - **pt-BR:** Desejos
  - **es-419:** Deseos

- **activity > milestones > tabs > weeklyWins**
  - **en:** Weekly Wins
  - **pt-BR:** Vitórias semanais
  - **es-419:** Victorias semanales

- **activity > milestones > toasts > error**
  - **en:** Error
  - **pt-BR:** Erro
  - **es-419:** Error

- **activity > milestones > toasts > loadHistoryFailed**
  - **en:** Failed to load action history. Please try again.
  - **pt-BR:** Falha ao carregar o histórico de ações. Tente novamente.
  - **es-419:** No se pudo cargar el historial de acciones. Inténtalo de nuevo.

- **activity > milestones > toasts > loadGoalsFailed**
  - **en:** Failed to load weekly goals
  - **pt-BR:** Falha ao carregar os desejos semanais
  - **es-419:** No se pudieron cargar los deseos semanales

- **activity > milestones > toasts > categoryRequired**
  - **en:** Category Required
  - **pt-BR:** Categoria obrigatória
  - **es-419:** Categoría obligatoria

- **activity > milestones > toasts > selectCategoryForGoal**
  - **en:** Please select a category for your goal
  - **pt-BR:** Selecione uma categoria para seu desejo
  - **es-419:** Selecciona una categoría para tu deseo

- **activity > milestones > toasts > saveGoalFailed**
  - **en:** Failed to save goal
  - **pt-BR:** Falha ao salvar o desejo
  - **es-419:** No se pudo guardar el deseo

- **activity > milestones > toasts > updateGoalFailed**
  - **en:** Failed to update goal
  - **pt-BR:** Falha ao atualizar o desejo
  - **es-419:** No se pudo actualizar el deseo

- **activity > milestones > toasts > deleteGoalFailed**
  - **en:** Failed to delete goal
  - **pt-BR:** Falha ao excluir o desejo
  - **es-419:** No se pudo eliminar el deseo

- **activity > milestones > toasts > loadReviewFailed**
  - **en:** Failed to load week review
  - **pt-BR:** Falha ao carregar a revisão semanal
  - **es-419:** No se pudo cargar la revisión semanal

- **activity > milestones > aria > completed**
  - **en:** Completed
  - **pt-BR:** Concluído
  - **es-419:** Completado

- **activity > milestones > aria > notCompleted**
  - **en:** Not completed
  - **pt-BR:** Não concluído
  - **es-419:** No completado

- **activity > milestones > goals > addPlaceholder**
  - **en:** Add
  - **pt-BR:** Adicionar
  - **es-419:** Agregar

- **activity > milestones > goals > category**
  - **en:** Category
  - **pt-BR:** Categoria
  - **es-419:** Categoría

- **activity > milestones > goals > addButton**
  - **en:** Add
  - **pt-BR:** Adicionar
  - **es-419:** Agregar

- **activity > milestones > goals > loading**
  - **en:** Loading desires...
  - **pt-BR:** Carregando desejos...
  - **es-419:** Cargando deseos...

- **activity > milestones > goals > emptyTitle**
  - **en:** No desires set for this week.
  - **pt-BR:** Nenhum desejo definido para esta semana.
  - **es-419:** No hay deseos para esta semana.

- **activity > milestones > goals > emptyHint**
  - **en:** Add a desire above to get started.
  - **pt-BR:** Adicione um desejo acima para começar.
  - **es-419:** Agrega un deseo arriba para empezar.

- **activity > milestones > review > loading**
  - **en:** Loading weekly wins...
  - **pt-BR:** Carregando vitórias semanais...
  - **es-419:** Cargando victorias semanales...

- **activity > milestones > review > inspiredActionsTitle**
  - **en:** Inspired Actions
  - **pt-BR:** Ações inspiradas
  - **es-419:** Acciones inspiradas

- **activity > milestones > review > inspiredActionsCount**
  - **en:** Inspired Actions completed this week
  - **pt-BR:** Ações inspiradas concluídas nesta semana
  - **es-419:** Acciones inspiradas completadas esta semana

- **activity > milestones > review > desiresTitle**
  - **en:** Desires
  - **pt-BR:** Desejos
  - **es-419:** Deseos

- **activity > milestones > review > desiresSet**
  - **en:** Desires Set
  - **pt-BR:** Desejos definidos
  - **es-419:** Deseos definidos

- **activity > milestones > review > desiresAttained**
  - **en:** Desires Attained
  - **pt-BR:** Desejos alcançados
  - **es-419:** Deseos alcanzados

- **activity > milestones > review > completionRate**
  - **en:** {{pct}}% completion rate
  - **pt-BR:** {{pct}}% de conclusão
  - **es-419:** {{pct}}% de cumplimiento

- **activity > milestones > review > byCategoryTitle**
  - **en:** Desires by Category
  - **pt-BR:** Desejos por categoria
  - **es-419:** Deseos por categoría

- **activity > milestones > review > categoryCompleted**
  - **en:** {{completed}}/{{total}} completed
  - **pt-BR:** {{completed}}/{{total}} concluídos
  - **es-419:** {{completed}}/{{total}} completados

- **activity > milestones > review > emptyTitle**
  - **en:** No activity recorded for this week.
  - **pt-BR:** Nenhuma atividade registrada para esta semana.
  - **es-419:** No hay actividad registrada para esta semana.

- **activity > milestones > review > emptyHint**
  - **en:** Start your inspired actions and desire setting to see your progress here.
  - **pt-BR:** Comece suas ações inspiradas e defina desejos para ver seu progresso aqui.
  - **es-419:** Empieza tus acciones inspiradas y define deseos para ver tu progreso aquí.

- **chrono > title**
  - **en:** Manifestation Journal
  - **pt-BR:** Diário de manifestação
  - **es-419:** Diario de manifestación

- **chrono > loadingTimeline**
  - **en:** Loading your timeline...
  - **pt-BR:** Carregando sua linha do tempo...
  - **es-419:** Cargando tu línea de tiempo...

- **chrono > emptyTimeline**
  - **en:** Your timeline is waiting to be written.
  - **pt-BR:** Sua linha do tempo está esperando ser escrita.
  - **es-419:** Tu línea de tiempo está esperando ser escrita.

- **chrono > createFirstEntry**
  - **en:** Create your first entry
  - **pt-BR:** Crie sua primeira entrada
  - **es-419:** Crea tu primera entrada

- **chrono > timeline > description**
  - **en:** Reflect on your growth and development.
  - **pt-BR:** Reflita sobre seu crescimento e desenvolvimento.
  - **es-419:** Reflexiona sobre tu crecimiento y desarrollo.

- **chrono > timeline > newEntry**
  - **en:** New entry
  - **pt-BR:** Nova entrada
  - **es-419:** Nueva entrada

- **chrono > timeline > editEntry**
  - **en:** Edit entry
  - **pt-BR:** Editar entrada
  - **es-419:** Editar entrada

- **chrono > timeline > showLess**
  - **en:** Show less
  - **pt-BR:** Mostrar menos
  - **es-419:** Mostrar menos

- **chrono > timeline > showMore**
  - **en:** Show more
  - **pt-BR:** Mostrar mais
  - **es-419:** Mostrar más

- **chrono > timeline > env3d**
  - **en:** 3D (environment):
  - **pt-BR:** 3D (ambiente):
  - **es-419:** 3D (entorno):

- **chrono > timeline > dayExperience**
  - **en:** How you experienced the day:
  - **pt-BR:** Como você viveu o dia:
  - **es-419:** Cómo viviste el día:

- **chrono > timeline > winToday**
  - **en:** Win today:
  - **pt-BR:** Vitória hoje:
  - **es-419:** Victoria hoy:

- **chrono > timeline > yes**
  - **en:** Yes
  - **pt-BR:** Sim
  - **es-419:** Sí

- **chrono > timeline > no**
  - **en:** No
  - **pt-BR:** Não
  - **es-419:** No

- **chrono > timeline > env3dAria**
  - **en:** 3D environment felt {{rating}}
  - **pt-BR:** O ambiente 3D pareceu {{rating}}
  - **es-419:** El entorno 3D se sintió {{rating}}

- **chrono > timeline > dayExperienceAria**
  - **en:** Day was experienced as {{rating}}
  - **pt-BR:** O dia foi vivido como {{rating}}
  - **es-419:** El día se vivió como {{rating}}

- **chrono > form > editEntry**
  - **en:** Edit entry
  - **pt-BR:** Editar entrada
  - **es-419:** Editar entrada

- **chrono > form > newEntry**
  - **en:** New entry
  - **pt-BR:** Nova entrada
  - **es-419:** Nueva entrada

- **chrono > form > deleteEntry**
  - **en:** Delete entry
  - **pt-BR:** Excluir entrada
  - **es-419:** Eliminar entrada

- **chrono > form > date**
  - **en:** Date
  - **pt-BR:** Data
  - **es-419:** Fecha

- **chrono > form > pickDate**
  - **en:** Pick a date
  - **pt-BR:** Escolha uma data
  - **es-419:** Elige una fecha

- **chrono > form > titleLabel**
  - **en:** Title *
  - **pt-BR:** Título *
  - **es-419:** Título *

- **chrono > form > titlePlaceholder**
  - **en:** Give your entry a title...
  - **pt-BR:** Dê um título à sua entrada...
  - **es-419:** Ponle un título a tu entrada...

- **chrono > form > whatHappened**
  - **en:** What happened? *
  - **pt-BR:** O que aconteceu? *
  - **es-419:** ¿Qué pasó? *

- **chrono > form > textPlaceholder**
  - **en:** Tell your timeline what happened today...
  - **pt-BR:** Conte à sua linha do tempo o que aconteceu hoje...
  - **es-419:** Cuéntale a tu línea de tiempo qué pasó hoy...

- **chrono > form > env3dQuestion**
  - **en:** (1) How was the 3D (external environment) today? *
  - **pt-BR:** (1) Como estava o 3D (ambiente externo) hoje? *
  - **es-419:** (1) ¿Cómo estuvo el 3D (entorno externo) hoy? *

- **chrono > form > dayExperienceQuestion**
  - **en:** (2) How did you experience the day? *
  - **pt-BR:** (2) Como você viveu o dia? *
  - **es-419:** (2) ¿Cómo viviste el día? *

- **chrono > form > updating**
  - **en:** Updating...
  - **pt-BR:** Atualizando...
  - **es-419:** Actualizando...

- **chrono > form > creating**
  - **en:** Creating...
  - **pt-BR:** Criando...
  - **es-419:** Creando...

- **chrono > form > update**
  - **en:** Update
  - **pt-BR:** Atualizar
  - **es-419:** Actualizar

- **chrono > form > addEntry**
  - **en:** Add entry
  - **pt-BR:** Adicionar entrada
  - **es-419:** Agregar entrada

- **chrono > form > deleteTitle**
  - **en:** Delete entry
  - **pt-BR:** Excluir entrada
  - **es-419:** Eliminar entrada

- **chrono > form > deleteDescription**
  - **en:** Are you sure you want to delete this entry? This action cannot be undone.
  - **pt-BR:** Tem certeza de que deseja excluir esta entrada? Esta ação não pode ser desfeita.
  - **es-419:** ¿Seguro que quieres eliminar esta entrada? Esta acción no se puede deshacer.

- **chrono > form > deleting**
  - **en:** Deleting...
  - **pt-BR:** Excluindo...
  - **es-419:** Eliminando...

- **chrono > form > delete**
  - **en:** Delete
  - **pt-BR:** Excluir
  - **es-419:** Eliminar

- **chrono > form > mood > rough**
  - **en:** Rough or heavy
  - **pt-BR:** Difícil ou pesado
  - **es-419:** Difícil o pesado

- **chrono > form > mood > neutral**
  - **en:** Neutral
  - **pt-BR:** Neutro
  - **es-419:** Neutro

- **chrono > form > mood > good**
  - **en:** Good
  - **pt-BR:** Bom
  - **es-419:** Bien

- **chrono > form > toast > titleRequired**
  - **en:** Title required
  - **pt-BR:** Título obrigatório
  - **es-419:** Título obligatorio

- **chrono > form > toast > titleRequiredDesc**
  - **en:** Give your entry a title.
  - **pt-BR:** Dê um título à sua entrada.
  - **es-419:** Ponle un título a tu entrada.

- **chrono > form > toast > entryRequired**
  - **en:** Entry required
  - **pt-BR:** Entrada obrigatória
  - **es-419:** Entrada obligatoria

- **chrono > form > toast > entryRequiredDesc**
  - **en:** Write something for your timeline.
  - **pt-BR:** Escreva algo para sua linha do tempo.
  - **es-419:** Escribe algo para tu línea de tiempo.

- **chrono > form > toast > authRequired**
  - **en:** Authentication required
  - **pt-BR:** Autenticação necessária
  - **es-419:** Autenticación requerida

- **chrono > form > toast > authRequiredDesc**
  - **en:** Please log in to create entries.
  - **pt-BR:** Faça login para criar entradas.
  - **es-419:** Inicia sesión para crear entradas.

- **chrono > form > toast > reflectionIncomplete**
  - **en:** Reflection incomplete
  - **pt-BR:** Reflexão incompleta
  - **es-419:** Reflexión incompleta

- **chrono > form > toast > reflectionIncompleteDesc**
  - **en:** Answer both questions using the faces below.
  - **pt-BR:** Responda às duas perguntas usando as carinhas abaixo.
  - **es-419:** Responde ambas preguntas usando las caras de abajo.

- **chrono > form > toast > permissionDenied**
  - **en:** Permission denied
  - **pt-BR:** Permissão negada
  - **es-419:** Permiso denegado

- **chrono > form > toast > permissionDeniedDesc**
  - **en:** Please ensure you are logged in and try again.
  - **pt-BR:** Certifique-se de estar logado e tente novamente.
  - **es-419:** Asegúrate de haber iniciado sesión e inténtalo de nuevo.

- **chrono > form > toast > error**
  - **en:** Error
  - **pt-BR:** Erro
  - **es-419:** Error

- **chrono > form > toast > createFailed**
  - **en:** Failed to create entry. Please try again.
  - **pt-BR:** Falha ao criar a entrada. Tente novamente.
  - **es-419:** No se pudo crear la entrada. Inténtalo de nuevo.

- **chrono > form > toast > deleteFailed**
  - **en:** Failed to delete entry. Please try again.
  - **pt-BR:** Falha ao excluir a entrada. Tente novamente.
  - **es-419:** No se pudo eliminar la entrada. Inténtalo de nuevo.

- **chrono > form > toast > noSession**
  - **en:** No valid session found. Please log in and try again.
  - **pt-BR:** Nenhuma sessão válida encontrada. Faça login e tente novamente.
  - **es-419:** No se encontró una sesión válida. Inicia sesión e inténtalo de nuevo.

- **double > choose > settings**
  - **en:** Settings
  - **pt-BR:** Configurações
  - **es-419:** Ajustes

- **double > choose > chooseGuide**
  - **en:** Choose your guide
  - **pt-BR:** Escolha um guia
  - **es-419:** Elige tu guía

- **double > choose > chooseGuideSubtitle**
  - **en:** Select a character to be your daily guide
  - **pt-BR:** Escolha quem te acompanha todo dia
  - **es-419:** Elige quién te acompaña cada día

- **double > choose > dailyPracticeChoices**
  - **en:** Inspired Action choices
  - **pt-BR:** Ações inspiradas
  - **es-419:** Acciones inspiradas

- **double > choose > dailyPracticeSubtitle**
  - **en:** Choose exactly five—they become your Inspired Actions on your dashboard.
  - **pt-BR:** Escolha cinco. Troque quando quiser.
  - **es-419:** Elige cinco. Cámbialas cuando quieras.

- **double > choose > selectedCount**
  - **en:** {{count}} of 5 selected
  - **pt-BR:** {{count}} de 5 selecionadas
  - **es-419:** {{count}} de 5 seleccionadas

- **double > choose > practices > rest**
  - **en:** Rest and relax
  - **pt-BR:** Descansar e relaxar
  - **es-419:** Descansar y relajarse

- **double > choose > practices > selfCare**
  - **en:** Self-care
  - **pt-BR:** Autocuidado
  - **es-419:** Autocuidado

- **double > choose > practices > clean**
  - **en:** Clean and organize environment
  - **pt-BR:** Limpar e organizar o ambiente
  - **es-419:** Limpiar y organizar el entorno

- **double > choose > practices > drinkWater**
  - **en:** Nutrition
  - **pt-BR:** Nutrição
  - **es-419:** Nutrición

- **double > choose > practices > haveFun**
  - **en:** Have fun
  - **pt-BR:** Divertir-se
  - **es-419:** Divertirse

- **double > choose > practices > exercise**
  - **en:** Exercise
  - **pt-BR:** Exercício
  - **es-419:** Ejercicio

- **double > choose > practices > glamUp**
  - **en:** Glam up
  - **pt-BR:** Caprichar
  - **es-419:** Arreglarse

- **double > choose > practices > connect**
  - **en:** Connect with others
  - **pt-BR:** Conectar com outros
  - **es-419:** Conectar con otros

- **double > choose > practices > seen**
  - **en:** Be seen and visible.
  - **pt-BR:** Ser visto e visível
  - **es-419:** Ser visto y visible

- **double > choose > practices > work**
  - **en:** Work or study
  - **pt-BR:** Trabalhar ou estudar
  - **es-419:** Trabajar o estudiar

- **double > choose > ariaSelected**
  - **en:** {{label}}, selected
  - **pt-BR:** {{label}}, selecionado
  - **es-419:** {{label}}, seleccionado

- **double > choose > ariaNotSelected**
  - **en:** {{label}}, not selected
  - **pt-BR:** {{label}}, não selecionado
  - **es-419:** {{label}}, no seleccionado

- **double > choose > weeklyCheckIn**
  - **en:** Weekly check-in
  - **pt-BR:** Check-in semanal
  - **es-419:** Revisión semanal

- **double > choose > weeklyCheckInSubtitle**
  - **en:** Choose how you want to reach your weekly check-in. You can change it anytime.
  - **pt-BR:** Escolha como quer chegar ao seu check-in semanal. Você pode mudar isso a qualquer momento.
  - **es-419:** Elige cómo quieres llegar a tu revisión semanal. Puedes cambiarlo cuando quieras.

- **double > choose > addToCalendar**
  - **en:** Add to calendar
  - **pt-BR:** Adicionar ao calendário
  - **es-419:** Agregar al calendario

- **double > choose > addToCalendarDesc**
  - **en:** Weekly start and close alerts using your calendar.
  - **pt-BR:** Alertas semanais de início e encerramento usando seu calendário.
  - **es-419:** Alertas semanales de inicio y cierre usando tu calendario.

- **double > choose > recommended**
  - **en:** Recommended
  - **pt-BR:** Recomendado
  - **es-419:** Recomendado

- **double > choose > deviceAutomation**
  - **en:** Device automation
  - **pt-BR:** Automação do dispositivo
  - **es-419:** Automatización del dispositivo

- **double > choose > deviceAutomationDesc**
  - **en:** Use iPhone Shortcuts or Android routines to open your weekly summary.
  - **pt-BR:** Use Atalhos do iPhone ou rotinas do Android para abrir seu resumo semanal.
  - **es-419:** Usa Atajos de iPhone o rutinas de Android para abrir tu resumen semanal.

- **double > choose > viewSetupSteps**
  - **en:** View setup steps
  - **pt-BR:** Ver passos de configuração
  - **es-419:** Ver pasos de configuración

- **double > choose > advanced**
  - **en:** Advanced
  - **pt-BR:** Avançado
  - **es-419:** Avanzado

- **double > choose > changeDoubleTitle**
  - **en:** Change your double?
  - **pt-BR:** Mudar seu duplo?
  - **es-419:** ¿Cambiar tu doble?

- **double > choose > changeDoubleDescription**
  - **en:** Change from {{from}} to {{to}}?
  - **pt-BR:** Mudar de {{from}} para {{to}}?
  - **es-419:** ¿Cambiar de {{from}} a {{to}}?

- **double > choose > yourCurrentCharacter**
  - **en:** your current character
  - **pt-BR:** seu personagem atual
  - **es-419:** tu personaje actual

- **double > choose > confirm**
  - **en:** Confirm
  - **pt-BR:** Confirmar
  - **es-419:** Confirmar

- **double > choose > toast > error**
  - **en:** Error
  - **pt-BR:** Erro
  - **es-419:** Error

- **double > choose > toast > saveFailed**
  - **en:** Failed to save choices. Please try again.
  - **pt-BR:** Não foi possível salvar as escolhas. Tente novamente.
  - **es-419:** No se pudieron guardar las elecciones. Inténtalo de nuevo.

- **double > choose > toast > downloaded**
  - **en:** Downloaded
  - **pt-BR:** Baixado
  - **es-419:** Descargado

- **double > choose > toast > calendarDownloaded**
  - **en:** Calendar file downloaded. Import it in your calendar app.
  - **pt-BR:** Arquivo de calendário baixado. Importe-o no seu app de calendário.
  - **es-419:** Archivo de calendario descargado. Impórtalo en tu app de calendario.

- **double > choose > toast > calendarFailed**
  - **en:** Failed to generate calendar file. Please try again.
  - **pt-BR:** Falha ao gerar o arquivo de calendário. Tente novamente.
  - **es-419:** No se pudo generar el archivo de calendario. Inténtalo de nuevo.

- **double > choose > themes > transitions**
  - **en:** Transitions
  - **pt-BR:** Transições
  - **es-419:** Transiciones

- **double > choose > themes > career**
  - **en:** Career
  - **pt-BR:** Carreira
  - **es-419:** Carrera

- **double > choose > themes > finance**
  - **en:** Finance
  - **pt-BR:** Finanças
  - **es-419:** Finanzas

- **double > choose > themes > identity**
  - **en:** Identity
  - **pt-BR:** Identidade
  - **es-419:** Identidad

- **double > choose > themes > love**
  - **en:** Love
  - **pt-BR:** Amor
  - **es-419:** Amor

- **double > choose > themes > selfConcept**
  - **en:** Self-concept
  - **pt-BR:** Autoconceito
  - **es-419:** Autoconcepto

- **double > choose > themes > selfImage**
  - **en:** Self-image
  - **pt-BR:** Autoimagem
  - **es-419:** Autoimagen

- **double > choose > themes > fitness**
  - **en:** Fitness
  - **pt-BR:** Fitness
  - **es-419:** Fitness

- **double > embody > title**
  - **en:** Embody
  - **pt-BR:** Encarnar
  - **es-419:** Encarnar

- **double > embody > subtitle**
  - **en:** Track daily progress as you embody your new story.
  - **pt-BR:** Acompanhe o progresso diário ao encarnar sua nova história.
  - **es-419:** Sigue el progreso diario al encarnar tu nueva historia.

- **double > embody > pageTitle**
  - **en:** Embody | Palette Plotting
  - **pt-BR:** Encarnar | Palette Plotting
  - **es-419:** Encarnar | Palette Plotting

- **double > embody > metaDescription**
  - **en:** Track daily progress as you embody your new story and get your desires.
  - **pt-BR:** Acompanhe o progresso diário ao encarnar sua nova história e obter seus desejos.
  - **es-419:** Sigue el progreso diario al encarnar tu nueva historia y obtener tus deseos.

- **double > embody > dailyPracticeTracking**
  - **en:** Inspired Actions & weekly wins
  - **pt-BR:** Ações e vitórias semanais
  - **es-419:** Acciones y victorias semanales

- **double > embody > changeCharacter**
  - **en:** Change character
  - **pt-BR:** Mudar personagem
  - **es-419:** Cambiar personaje

- **double > embody > dailyPower**
  - **en:** Daily power: {{percent}}%
  - **pt-BR:** Poder diário: {{percent}}%
  - **es-419:** Poder diario: {{percent}}%

- **double > embody > confirmAction**
  - **en:** Confirm action
  - **pt-BR:** Confirmar ação
  - **es-419:** Confirmar acción

- **double > embody > yes**
  - **en:** Yes
  - **pt-BR:** Sim
  - **es-419:** Sí

- **double > embody > no**
  - **en:** No
  - **pt-BR:** Não
  - **es-419:** No

- **double > embody > toast > permissionDenied**
  - **en:** Permission denied
  - **pt-BR:** Permissão negada
  - **es-419:** Permiso denegado

- **double > embody > toast > permissionDeniedDesc**
  - **en:** Please ensure you are logged in and try again.
  - **pt-BR:** Certifique-se de estar logado e tente novamente.
  - **es-419:** Asegúrate de haber iniciado sesión e inténtalo de nuevo.

- **double > embody > toast > error**
  - **en:** Error
  - **pt-BR:** Erro
  - **es-419:** Error

- **double > embody > toast > loadProgressFailed**
  - **en:** Failed to load daily progress. Please try again.
  - **pt-BR:** Falha ao carregar o progresso diário. Tente novamente.
  - **es-419:** No se pudo cargar el progreso diario. Inténtalo de nuevo.

- **double > embody > toast > authRequired**
  - **en:** Authentication required
  - **pt-BR:** Autenticação necessária
  - **es-419:** Autenticación requerida

- **double > embody > toast > mustBeLoggedInProgress**
  - **en:** You must be logged in to save progress.
  - **pt-BR:** Você precisa estar logado para salvar o progresso.
  - **es-419:** Debes iniciar sesión para guardar el progreso.

- **double > embody > toast > saveProgressFailed**
  - **en:** Failed to save progress. Please try again.
  - **pt-BR:** Falha ao salvar o progresso. Tente novamente.
  - **es-419:** No se pudo guardar el progreso. Inténtalo de nuevo.

- **double > embody > toast > mustBeLoggedInActions**
  - **en:** You must be logged in to save actions.
  - **pt-BR:** Você precisa estar logado para salvar ações.
  - **es-419:** Debes iniciar sesión para guardar acciones.

- **double > embody > toast > saveActionFailed**
  - **en:** Failed to save action. Please try again.
  - **pt-BR:** Falha ao salvar a ação. Tente novamente.
  - **es-419:** No se pudo guardar la acción. Inténtalo de nuevo.

- **double > embody > toast > loadHistoryFailed**
  - **en:** Failed to load action history. Please try again.
  - **pt-BR:** Falha ao carregar o histórico de ações. Tente novamente.
  - **es-419:** No se pudo cargar el historial de acciones. Inténtalo de nuevo.

- **journey > pageTitle**
  - **en:** Your Journey | Palette Plotting
  - **pt-BR:** Sua jornada | Palette Plotting
  - **es-419:** Tu camino | Palette Plotting

- **journey > title**
  - **en:** Your Journey
  - **pt-BR:** Sua jornada
  - **es-419:** Tu camino

- **journey > subtitle**
  - **en:** Reflect on your daily progress.
  - **pt-BR:** Reflita sobre seu progresso diário.
  - **es-419:** Reflexiona sobre tu progreso diario.

- **journey > dailySnapshot**
  - **en:** Daily Snapshot
  - **pt-BR:** Resumo diário
  - **es-419:** Resumen diario

- **journey > statusAligned**
  - **en:** Aligned
  - **pt-BR:** Alinhado
  - **es-419:** Alineado

- **journey > coherenceHint**
  - **en:** Affirm daily & embody the new story for coherence and alignment.
  - **pt-BR:** Afirme diariamente e encarne a nova história para coerência e alinhamento.
  - **es-419:** Afirma a diario y encarna la nueva historia para coherencia y alineación.

- **journey > yourProgress**
  - **en:** Your Progress
  - **pt-BR:** Seu progresso
  - **es-419:** Tu progreso

- **journey > journalTitle**
  - **en:** Manifestation Journal
  - **pt-BR:** Diário de manifestação
  - **es-419:** Diario de manifestación

- **journey > journalDescription**
  - **en:** Daily reflections and intentions in one place.
  - **pt-BR:** Reflexões e intenções diárias.
  - **es-419:** Reflexiones e intenciones diarias.

- **journey > changeCharacter**
  - **en:** Change character
  - **pt-BR:** Mudar personagem
  - **es-419:** Cambiar personaje

- **freeplay > pageTitle**
  - **en:** Piano Tapping | Palette Plotting
  - **pt-BR:** Piano Tapping | Palette Plotting
  - **es-419:** Piano Tapping | Palette Plotting

- **freeplay > title**
  - **en:** Piano Tapping
  - **pt-BR:** Piano Tapping
  - **es-419:** Piano Tapping

- **freeplay > subtitleMobile**
  - **en:** Immerse in your affirmation with music and color
  - **pt-BR:** Mergulhe na sua afirmação com música e cor
  - **es-419:** Sumérgete en tu afirmación con música y color

- **freeplay > subtitleDesktop**
  - **en:** Immerse in your affirmations with music and color
  - **pt-BR:** Mergulhe nas suas afirmações com música e cor
  - **es-419:** Sumérgete en tus afirmaciones con música y color

- **freeplay > affirmationSetOptional**
  - **en:** Affirmation Set (Optional)
  - **pt-BR:** Conjunto de afirmações (opcional)
  - **es-419:** Set de afirmaciones (opcional)

- **freeplay > none**
  - **en:** None
  - **pt-BR:** Nenhum
  - **es-419:** Ninguno

- **freeplay > colorFeedback**
  - **en:** Color feedback
  - **pt-BR:** Cor
  - **es-419:** Color

- **freeplay > start**
  - **en:** Start
  - **pt-BR:** Começar
  - **es-419:** Empezar

- **freeplay > iphoneAudioHint**
  - **en:** If you can't hear the piano on iPhone, leave the app, turn OFF Silent Mode and turn your volume up.
  - **pt-BR:** Se você não ouvir o piano no iPhone, saia do app, desative o Modo Silencioso e aumente o volume.
  - **es-419:** Si no escuchas el piano en iPhone, sal de la app, desactiva el modo silencio y sube el volumen.

- **affirmationViewer > loading**
  - **en:** Loading affirmation set...
  - **pt-BR:** Carregando conjunto...
  - **es-419:** Cargando set...

- **affirmationViewer > notFound**
  - **en:** Affirmation set not found
  - **pt-BR:** Conjunto não encontrado
  - **es-419:** Set no encontrado

- **affirmationViewer > goToAffirmations**
  - **en:** Go to Affirmations
  - **pt-BR:** Ir para Afirmações
  - **es-419:** Ir a Afirmaciones

- **affirmationViewer > progress**
  - **en:** {{current}} of {{total}}
  - **pt-BR:** {{current}} de {{total}}
  - **es-419:** {{current}} de {{total}}

- **affirmationViewer > pause**
  - **en:** Pause
  - **pt-BR:** Pausar
  - **es-419:** Pausar

- **affirmationViewer > autoPlay**
  - **en:** Auto-play
  - **pt-BR:** Reprodução automática
  - **es-419:** Reproducción automática

- **affirmationViewer > speed**
  - **en:** Speed:
  - **pt-BR:** Velocidade:
  - **es-419:** Velocidad:

- **affirmationVisualizer > title**
  - **en:** Affirm & Script
  - **pt-BR:** Afirmar e escrever
  - **es-419:** Afirmar y escribir

- **affirmationVisualizer > loading**
  - **en:** Loading…
  - **pt-BR:** Carregando…
  - **es-419:** Cargando…

- **affirmationVisualizer > setNotFound**
  - **en:** Set not found
  - **pt-BR:** Conjunto não encontrado
  - **es-419:** Set no encontrado

- **affirmationVisualizer > loadingSet**
  - **en:** Loading affirmation set…
  - **pt-BR:** Carregando conjunto…
  - **es-419:** Cargando set…

- **affirmationVisualizer > notFound**
  - **en:** Affirmation set not found.
  - **pt-BR:** Conjunto não encontrado.
  - **es-419:** Set no encontrado.

- **affirmationVisualizer > backToAffirmScript**
  - **en:** Back to Affirm & Script
  - **pt-BR:** Voltar para Afirmar e escrever
  - **es-419:** Volver a Afirmar y escribir

- **affirmationVisualizer > subtitle**
  - **en:** Affirm and script your desires.
  - **pt-BR:** Afirme e escreva seus desejos.
  - **es-419:** Afirma y escribe tus deseos.

- **affirmationVisualizer > start**
  - **en:** Start
  - **pt-BR:** Começar
  - **es-419:** Empezar

- **affirmationVisualizer > tapStartBefore**
  - **en:** Tap
  - **pt-BR:** Toque em
  - **es-419:** Toca

- **affirmationVisualizer > tapStartAfter**
  - **en:** to start.
  - **pt-BR:** para começar.
  - **es-419:** para empezar.

- **affirmationVisualizer > noAffirmations**
  - **en:** This set has no affirmations to display.
  - **pt-BR:** Este conjunto não tem afirmações para exibir.
  - **es-419:** Este set no tiene afirmaciones para mostrar.

- **affirmationVisualizer > settings**
  - **en:** Settings
  - **pt-BR:** Configurações
  - **es-419:** Ajustes

- **affirmationVisualizer > settingsSubtitle**
  - **en:** Scripting speed, backgrounds, loops
  - **pt-BR:** Velocidade, fundos, loops
  - **es-419:** Velocidad, fondos, bucles

- **affirmationVisualizer > collapseSettings**
  - **en:** Collapse settings
  - **pt-BR:** Recolher configurações
  - **es-419:** Contraer ajustes

- **affirmationVisualizer > expandSettings**
  - **en:** Expand settings
  - **pt-BR:** Expandir configurações
  - **es-419:** Expandir ajustes

- **affirmationVisualizer > autoplayImages**
  - **en:** Autoplay images
  - **pt-BR:** Reproduzir imagens automaticamente
  - **es-419:** Reproducir imágenes automáticamente

- **affirmationVisualizer > loopText**
  - **en:** Loop text
  - **pt-BR:** Repetir texto
  - **es-419:** Repetir texto

- **affirmationVisualizer > loopTextHint**
  - **en:** When enabled, the script automatically restarts when finished.
  - **pt-BR:** Reinicia o roteiro ao terminar.
  - **es-419:** Reinicia el guion al terminar.

- **affirmationVisualizer > loopCounter**
  - **en:** Loop counter
  - **pt-BR:** Contador de loops
  - **es-419:** Contador de bucles

- **affirmationVisualizer > loopCounterHint**
  - **en:** Shows how many times this set has looped since you tapped Start.
  - **pt-BR:** Mostra quantas repetições desde Começar.
  - **es-419:** Muestra repeticiones desde Empezar.

- **affirmationVisualizer > imageRhythm**
  - **en:** Image rhythm
  - **pt-BR:** Ritmo das imagens
  - **es-419:** Ritmo de imágenes

- **affirmationVisualizer > imageRhythmHint**
  - **en:** Time between image changes (independent of scripting).
  - **pt-BR:** Tempo entre imagens.
  - **es-419:** Tiempo entre imágenes.

- **affirmationVisualizer > scriptingSpeed**
  - **en:** Scripting speed
  - **pt-BR:** Velocidade da escrita
  - **es-419:** Velocidad de escritura

- **affirmationVisualizer > scriptingSpeedHint**
  - **en:** Lower = faster reveal; only affects typewriter pacing.
  - **pt-BR:** Menor = mais rápido
  - **es-419:** Menor = más rápido

- **affirmationVisualizer > msPerChar**
  - **en:** {{ms}} ms/char
  - **pt-BR:** {{ms}} ms/car
  - **es-419:** {{ms}} ms/car

- **affirmationVisualizer > seconds**
  - **en:** {{seconds}}s
  - **pt-BR:** {{seconds}}s
  - **es-419:** {{seconds}}s

- **affirmationVisualizer > loopedAriaOne**
  - **en:** Looped 1 time this session
  - **pt-BR:** Repetiu 1 vez nesta sessão
  - **es-419:** Se repitió 1 vez en esta sesión

- **affirmationVisualizer > loopedAriaMany**
  - **en:** Looped {{count}} times this session
  - **pt-BR:** Repetiu {{count}} vezes nesta sessão
  - **es-419:** Se repitió {{count}} veces en esta sesión

- **affirmationVisualizer > loopsTitle**
  - **en:** Loops this session: {{count}}
  - **pt-BR:** Loops nesta sessão: {{count}}
  - **es-419:** Bucles en esta sesión: {{count}}

- **affirmations > pageTitle**
  - **en:** Affirm & Script | Palette Plotting
  - **pt-BR:** Afirmar e escrever | Palette Plotting
  - **es-419:** Afirmar y escribir | Palette Plotting

- **affirmations > title**
  - **en:** Affirm & Script
  - **pt-BR:** Afirmar e escrever
  - **es-419:** Afirmar y escribir

- **affirmations > subtitle**
  - **en:** Create custom affirmations or use our premade sets.
  - **pt-BR:** Crie afirmações ou use conjuntos prontos.
  - **es-419:** Crea afirmaciones o usa sets listos.

- **affirmations > yourCustomSets**
  - **en:** Your Custom Sets
  - **pt-BR:** Seus conjuntos personalizados
  - **es-419:** Tus sets personalizados

- **affirmations > storingSets**
  - **en:** Storing {{current}}/{{limit}} Affirmation sets
  - **pt-BR:** Armazenando {{current}}/{{limit}} conjuntos de afirmações
  - **es-419:** Guardando {{current}}/{{limit}} sets de afirmaciones

- **affirmations > newSet**
  - **en:** New Set
  - **pt-BR:** Novo conjunto
  - **es-419:** Nuevo set

- **affirmations > createNewSet**
  - **en:** Create New Affirmation Set
  - **pt-BR:** Criar conjunto
  - **es-419:** Crear set

- **affirmations > setNamePlaceholder**
  - **en:** Enter set name (e.g., Wealth, Confidence, Love)...
  - **pt-BR:** Nome do conjunto (Riqueza, Amor...)
  - **es-419:** Nombre del set (Riqueza, Amor...)

- **affirmations > selectCategory**
  - **en:** Select Category
  - **pt-BR:** Selecionar categoria
  - **es-419:** Seleccionar categoría

- **affirmations > generateAffirmations**
  - **en:** Generate affirmations
  - **pt-BR:** Gerar afirmações
  - **es-419:** Generar afirmaciones

- **affirmations > loading**
  - **en:** Loading...
  - **pt-BR:** Carregando...
  - **es-419:** Cargando...

- **affirmations > weeklyCount**
  - **en:** ({{current}}/{{limit}} this week)
  - **pt-BR:** ({{current}}/{{limit}} esta semana)
  - **es-419:** ({{current}}/{{limit}} esta semana)

- **affirmations > generateAffirmationsAria**
  - **en:** Generate affirmations
  - **pt-BR:** Gerar afirmações
  - **es-419:** Generar afirmaciones

- **affirmations > generateHint**
  - **en:** ✨ Generate 5 affirmations based on your set name
  - **pt-BR:** ✨ Gere 5 afirmações com base no nome do seu conjunto
  - **es-419:** ✨ Genera 5 afirmaciones según el nombre de tu set

- **affirmations > weeklyLimitReached**
  - **en:** You've reached your weekly limit of {{limit}} generated sets.
  - **pt-BR:** Você atingiu seu limite semanal de {{limit}} conjuntos gerados.
  - **es-419:** Alcanzaste tu límite semanal de {{limit}} sets generados.

- **affirmations > generating**
  - **en:** Generating...
  - **pt-BR:** Gerando...
  - **es-419:** Generando...

- **affirmations > generateSet**
  - **en:** Generate set
  - **pt-BR:** Gerar conjunto
  - **es-419:** Generar set

- **affirmations > createSet**
  - **en:** Create set
  - **pt-BR:** Criar conjunto
  - **es-419:** Crear set

- **affirmations > noCustomSets**
  - **en:** No custom sets yet
  - **pt-BR:** Nenhum conjunto personalizado ainda
  - **es-419:** Aún no hay sets personalizados

- **affirmations > affirmationCount_one**
  - **en:** {{count}} affirmation
  - **pt-BR:** {{count}} afirmação
  - **es-419:** {{count}} afirmación

- **affirmations > affirmationCount_other**
  - **en:** {{count}} affirmations
  - **pt-BR:** {{count}} afirmações
  - **es-419:** {{count}} afirmaciones

- **affirmations > editSet**
  - **en:** Edit Set
  - **pt-BR:** Editar conjunto
  - **es-419:** Editar set

- **affirmations > closeImages**
  - **en:** Close Images
  - **pt-BR:** Fechar imagens
  - **es-419:** Cerrar imágenes

- **affirmations > addImages**
  - **en:** Add Images
  - **pt-BR:** Adicionar imagens
  - **es-419:** Agregar imágenes

- **affirmations > playAffirmations**
  - **en:** Play Affirmations
  - **pt-BR:** Reproduzir afirmações
  - **es-419:** Reproducir afirmaciones

- **affirmations > deleteSet**
  - **en:** Delete set
  - **pt-BR:** Excluir conjunto
  - **es-419:** Eliminar set

- **affirmations > addAffirmationsFirst**
  - **en:** Add affirmations first to unlock image selection (max {{max}} images, one per affirmation)
  - **pt-BR:** Adicione afirmações para escolher imagens (máx. {{max}}).
  - **es-419:** Agrega afirmaciones para elegir imágenes (máx. {{max}}).

- **affirmations > selectUpToImages_one**
  - **en:** Select up to {{count}} image (one per affirmation)
  - **pt-BR:** Selecione até {{count}} imagem (uma por afirmação)
  - **es-419:** Selecciona hasta {{count}} imagen (una por afirmación)

- **affirmations > selectUpToImages_other**
  - **en:** Select up to {{count}} images (one per affirmation)
  - **pt-BR:** Selecione até {{count}} imagens (uma por afirmação)
  - **es-419:** Selecciona hasta {{count}} imágenes (una por afirmación)

- **affirmations > selectCategoryPlaceholder**
  - **en:** Select category
  - **pt-BR:** Selecionar categoria
  - **es-419:** Seleccionar categoría

- **affirmations > loadingLibrary**
  - **en:** Loading library...
  - **pt-BR:** Carregando biblioteca...
  - **es-419:** Cargando biblioteca...

- **affirmations > loadingImages**
  - **en:** Loading images...
  - **pt-BR:** Carregando imagens...
  - **es-419:** Cargando imágenes...

- **affirmations > showingImages_one**
  - **en:** Showing {{visible}} of {{total}} image
  - **pt-BR:** Mostrando {{visible}} de {{total}} imagem
  - **es-419:** Mostrando {{visible}} de {{total}} imagen

- **affirmations > showingImages_other**
  - **en:** Showing {{visible}} of {{total}} images
  - **pt-BR:** Mostrando {{visible}} de {{total}} imagens
  - **es-419:** Mostrando {{visible}} de {{total}} imágenes

- **affirmations > inCategory**
  - **en:**  in {{category}}
  - **pt-BR:**  em {{category}}
  - **es-419:**  en {{category}}

- **affirmations > selectedCount**
  - **en:**  • {{selected}}/{{max}} selected
  - **pt-BR:**  • {{selected}}/{{max}} selecionadas
  - **es-419:**  • {{selected}}/{{max}} seleccionadas

- **affirmations > addImagesButton_one**
  - **en:** Add {{count}} Image
  - **pt-BR:** Adicionar {{count}} imagem
  - **es-419:** Agregar {{count}} imagen

- **affirmations > addImagesButton_other**
  - **en:** Add {{count}} Images
  - **pt-BR:** Adicionar {{count}} imagens
  - **es-419:** Agregar {{count}} imágenes

- **affirmations > imageAlt**
  - **en:** Image
  - **pt-BR:** Imagem
  - **es-419:** Imagen

- **affirmations > selected**
  - **en:** Selected
  - **pt-BR:** Selecionada
  - **es-419:** Seleccionada

- **affirmations > loadMore**
  - **en:** Load More ({{remaining}} remaining)
  - **pt-BR:** Carregar mais ({{remaining}} restantes)
  - **es-419:** Cargar más ({{remaining}} restantes)

- **affirmations > noImagesFound**
  - **en:** No images found matching your filters.
  - **pt-BR:** Nenhuma imagem encontrada com seus filtros.
  - **es-419:** No se encontraron imágenes con tus filtros.

- **affirmations > imageCount_one**
  - **en:** {{count}} Image
  - **pt-BR:** {{count}} imagem
  - **es-419:** {{count}} imagen

- **affirmations > imageCount_other**
  - **en:** {{count}} Images
  - **pt-BR:** {{count}} imagens
  - **es-419:** {{count}} imágenes

- **affirmations > visionBoardImageAlt**
  - **en:** Vision board image
  - **pt-BR:** Imagem do quadro de visão
  - **es-419:** Imagen de tablero de visión

- **affirmations > affirmationInputPlaceholder**
  - **en:** Type affirmation and press Enter...
  - **pt-BR:** Digite a afirmação e pressione Enter...
  - **es-419:** Escribe la afirmación y presiona Enter...

- **affirmations > affirmationLimitHint**
  - **en:** {{current}}/10 affirmations • Press Enter to add • {{max}} characters max per line
  - **pt-BR:** {{current}}/10 afirmações • Enter para adicionar • {{max}} caracteres
  - **es-419:** {{current}}/10 afirmaciones • Enter para agregar • {{max}} caracteres

- **affirmations > deleteAffirmation**
  - **en:** Delete affirmation
  - **pt-BR:** Excluir afirmação
  - **es-419:** Eliminar afirmación

- **affirmations > premadeSets**
  - **en:** Premade Sets
  - **pt-BR:** Conjuntos prontos
  - **es-419:** Sets prediseñados

- **affirmations > premadeSetsSubtitle**
  - **en:** Ready-to-use affirmation collections for common goals
  - **pt-BR:** Afirmações prontas para metas comuns
  - **es-419:** Afirmaciones listas para metas comunes

- **affirmations > viewAffirmations**
  - **en:** View Affirmations
  - **pt-BR:** Ver afirmações
  - **es-419:** Ver afirmaciones

- **affirmations > deleteDialogTitle**
  - **en:** Delete Affirmation Set?
  - **pt-BR:** Excluir conjunto de afirmações?
  - **es-419:** ¿Eliminar set de afirmaciones?

- **affirmations > deleteDialogDescription**
  - **en:** Are you sure you want to delete "{{name}}"? This action cannot be undone.
  - **pt-BR:** Tem certeza de que deseja excluir "{{name}}"? Esta ação não pode ser desfeita.
  - **es-419:** ¿Seguro que quieres eliminar "{{name}}"? Esta acción no se puede deshacer.

- **affirmations > thisSet**
  - **en:** this set
  - **pt-BR:** este conjunto
  - **es-419:** este set

- **affirmations > cancel**
  - **en:** Cancel
  - **pt-BR:** Cancelar
  - **es-419:** Cancelar

- **affirmations > delete**
  - **en:** Delete
  - **pt-BR:** Excluir
  - **es-419:** Eliminar

- **affirmations > viewTerms**
  - **en:** View Terms of Service
  - **pt-BR:** Ver Termos de serviço
  - **es-419:** Ver Términos de servicio

- **affirmations > toasts > loadFailed**
  - **en:** Failed to load affirmation sets. Please try again.
  - **pt-BR:** Falha ao carregar os conjuntos de afirmações. Tente novamente.
  - **es-419:** No se pudieron cargar los sets de afirmaciones. Inténtalo de nuevo.

- **affirmations > toasts > noSession**
  - **en:** No valid session found. Please log in and try again.
  - **pt-BR:** Nenhuma sessão válida encontrada. Faça login e tente novamente.
  - **es-419:** No se encontró una sesión válida. Inicia sesión e inténtalo de nuevo.

- **affirmations > toasts > permissionDenied**
  - **en:** Permission denied. Please ensure you are logged in and try again.
  - **pt-BR:** Permissão negada. Certifique-se de estar logado e tente novamente.
  - **es-419:** Permiso denegado. Asegúrate de haber iniciado sesión e inténtalo de nuevo.

- **affirmations > toasts > migrationNeeded**
  - **en:** Database migration needed. Please contact support.
  - **pt-BR:** É necessária uma migração do banco de dados. Entre em contato com o suporte.
  - **es-419:** Se necesita una migración de base de datos. Contacta a soporte.

- **affirmations > toasts > updateFailed**
  - **en:** Failed to update set: {{message}}
  - **pt-BR:** Falha ao atualizar o conjunto: {{message}}
  - **es-419:** No se pudo actualizar el set: {{message}}

- **affirmations > toasts > createFailed**
  - **en:** Failed to create set: {{message}}
  - **pt-BR:** Falha ao criar o conjunto: {{message}}
  - **es-419:** No se pudo crear el set: {{message}}

- **affirmations > toasts > saveFailed**
  - **en:** Failed to save affirmation sets. Please try again.
  - **pt-BR:** Falha ao salvar os conjuntos de afirmações. Tente novamente.
  - **es-419:** No se pudieron guardar los sets de afirmaciones. Inténtalo de nuevo.

- **affirmations > toasts > imageLibraryFailed**
  - **en:** Failed to load image library. Please try again.
  - **pt-BR:** Falha ao carregar a biblioteca de imagens. Tente novamente.
  - **es-419:** No se pudo cargar la biblioteca de imágenes. Inténtalo de nuevo.

- **affirmations > toasts > maxImages_one**
  - **en:** Maximum {{max}} image can be selected (one per affirmation)
  - **pt-BR:** Máximo de {{max}} imagem (uma por afirmação)
  - **es-419:** Máximo {{max}} imagen (una por afirmación)

- **affirmations > toasts > maxImages_other**
  - **en:** Maximum {{max}} images can be selected (one per affirmation)
  - **pt-BR:** Máximo de {{max}} imagens (uma por afirmação)
  - **es-419:** Máximo {{max}} imágenes (una por afirmación)

- **affirmations > toasts > imagesAdded_one**
  - **en:** {{count}} image added!
  - **pt-BR:** {{count}} imagem adicionada!
  - **es-419:** ¡{{count}} imagen agregada!

- **affirmations > toasts > imagesAdded_other**
  - **en:** {{count}} images added!
  - **pt-BR:** {{count}} imagens adicionadas!
  - **es-419:** ¡{{count}} imágenes agregadas!

- **affirmations > toasts > imageRemoved**
  - **en:** Image removed
  - **pt-BR:** Imagem removida
  - **es-419:** Imagen eliminada

- **affirmations > toasts > enterSetName**
  - **en:** Please enter a set name
  - **pt-BR:** Digite um nome para o conjunto
  - **es-419:** Ingresa un nombre para el set

- **affirmations > toasts > selectCategory**
  - **en:** Please select a category
  - **pt-BR:** Selecione uma categoria
  - **es-419:** Selecciona una categoría

- **affirmations > toasts > setLimitReached**
  - **en:** You've reached your limit of {{limit}} custom sets for your tier. Please delete a set or upgrade to create more.
  - **pt-BR:** Você atingiu o limite de {{limit}} conjuntos personalizados do seu plano. Exclua um conjunto ou faça upgrade para criar mais.
  - **es-419:** Alcanzaste el límite de {{limit}} sets personalizados de tu plan. Elimina un set o mejora tu plan para crear más.

- **affirmations > toasts > weeklyLimitUpgrade**
  - **en:** You've reached your weekly limit of {{limit}} generated sets. Please try again next week or upgrade your tier.
  - **pt-BR:** Você atingiu seu limite semanal de {{limit}} conjuntos gerados. Tente novamente na próxima semana ou faça upgrade do seu plano.
  - **es-419:** Alcanzaste tu límite semanal de {{limit}} sets generados. Inténtalo la próxima semana o mejora tu plan.

- **affirmations > toasts > weeklyLimit**
  - **en:** You've reached your weekly limit of {{limit}} generated sets. Please try again next week.
  - **pt-BR:** Você atingiu seu limite semanal de {{limit}} conjuntos gerados. Tente novamente na próxima semana.
  - **es-419:** Alcanzaste tu límite semanal de {{limit}} sets generados. Inténtalo la próxima semana.

- **affirmations > toasts > blockedDefault**
  - **en:** This tool is temporarily unavailable due to repeated guideline violations. Access will be restored in 24 hours.
  - **pt-BR:** Esta ferramenta está temporariamente indisponível devido a violações repetidas das diretrizes. O acesso será restaurado em 24 horas.
  - **es-419:** Esta herramienta no está disponible temporalmente por violaciones repetidas de las normas. El acceso se restablecerá en 24 horas.

- **affirmations > toasts > connectFailed**
  - **en:** Failed to connect to the affirmation generation service.
  - **pt-BR:** Falha ao conectar ao serviço de geração de afirmações.
  - **es-419:** No se pudo conectar al servicio de generación de afirmaciones.

- **affirmations > toasts > rateLimit**
  - **en:** Rate limit exceeded. Please try again in a moment.
  - **pt-BR:** Limite de solicitações excedido. Tente novamente em instantes.
  - **es-419:** Límite de solicitudes excedido. Inténtalo de nuevo en un momento.

- **affirmations > toasts > creditsDepleted**
  - **en:** Credits depleted.
  - **pt-BR:** Créditos esgotados.
  - **es-419:** Créditos agotados.

- **affirmations > toasts > genericError**
  - **en:** Error. Please try again.
  - **pt-BR:** Erro. Tente novamente.
  - **es-419:** Error. Inténtalo de nuevo.

- **affirmations > toasts > noAffirmationsReceived**
  - **en:** No affirmations received. Please try again.
  - **pt-BR:** Nenhuma afirmação recebida. Tente novamente.
  - **es-419:** No se recibieron afirmaciones. Inténtalo de nuevo.

- **affirmations > toasts > generatedCount**
  - **en:** Generated {{count}} affirmations!
  - **pt-BR:** {{count}} afirmações geradas!
  - **es-419:** ¡{{count}} afirmaciones generadas!

- **affirmations > toasts > generateFailed**
  - **en:** Failed to generate affirmations: {{message}}
  - **pt-BR:** Falha ao gerar afirmações: {{message}}
  - **es-419:** No se pudieron generar afirmaciones: {{message}}

- **affirmations > toasts > setCreated**
  - **en:** Set created successfully
  - **pt-BR:** Conjunto criado com sucesso
  - **es-419:** Set creado correctamente

- **affirmations > toasts > enterAffirmation**
  - **en:** Please enter an affirmation
  - **pt-BR:** Digite uma afirmação
  - **es-419:** Ingresa una afirmación

- **affirmations > toasts > maxAffirmations**
  - **en:** Maximum 10 affirmations per set
  - **pt-BR:** Máximo de 10 afirmações por conjunto
  - **es-419:** Máximo 10 afirmaciones por set

- **affirmations > toasts > affirmationAdded**
  - **en:** Affirmation added
  - **pt-BR:** Afirmação adicionada
  - **es-419:** Afirmación agregada

- **affirmations > toasts > affirmationRemoved**
  - **en:** Affirmation removed
  - **pt-BR:** Afirmação removida
  - **es-419:** Afirmación eliminada

- **affirmations > toasts > cannotDeletePremade**
  - **en:** Cannot delete premade sets
  - **pt-BR:** Não é possível excluir conjuntos prontos
  - **es-419:** No se pueden eliminar sets prediseñados

- **affirmations > toasts > setDeleted**
  - **en:** Set deleted
  - **pt-BR:** Conjunto excluído
  - **es-419:** Set eliminado

- **affirmations > toasts > noAffirmationsInSet**
  - **en:** This set has no affirmations yet
  - **pt-BR:** Este conjunto ainda não tem afirmações
  - **es-419:** Este set aún no tiene afirmaciones

- **affirmations > toasts > unknownError**
  - **en:** Unknown error
  - **pt-BR:** Erro desconhecido
  - **es-419:** Error desconocido

- **refactor > pageTitle**
  - **en:** Belief Work | Palette Plotting
  - **pt-BR:** Trabalho de crenças | Palette Plotting
  - **es-419:** Trabajo de creencias | Palette Plotting

- **refactor > title**
  - **en:** Belief Work
  - **pt-BR:** Trabalho de crenças
  - **es-419:** Trabajo de creencias

- **refactor > subtitle**
  - **en:** Explore beliefs you want to release or integrate.
  - **pt-BR:** Explore crenças que você quer liberar ou integrar.
  - **es-419:** Explora creencias que quieres liberar o integrar.

- **refactor > hideWeeklyLimit**
  - **en:** Hide weekly generation limit
  - **pt-BR:** Ocultar limite semanal de gerações
  - **es-419:** Ocultar límite semanal de generaciones

- **refactor > showWeeklyLimit**
  - **en:** Show weekly generation limit
  - **pt-BR:** Mostrar limite semanal de gerações
  - **es-419:** Mostrar límite semanal de generaciones

- **refactor > weeklyGenerations**
  - **en:** Weekly Generations:
  - **pt-BR:** Gerações semanais:
  - **es-419:** Generaciones semanales:

- **refactor > yourBeliefs**
  - **en:** Your Beliefs ({{count}})
  - **pt-BR:** Suas crenças ({{count}})
  - **es-419:** Tus creencias ({{count}})

- **refactor > createNew**
  - **en:** Create New
  - **pt-BR:** Criar novo
  - **es-419:** Crear nuevo

- **refactor > noSavedBeliefs**
  - **en:** No saved beliefs yet
  - **pt-BR:** Nenhuma crença salva ainda
  - **es-419:** Aún no hay creencias guardadas

- **refactor > eliminate**
  - **en:** Eliminate
  - **pt-BR:** Eliminar
  - **es-419:** Eliminar

- **refactor > integrate**
  - **en:** Integrate
  - **pt-BR:** Integrar
  - **es-419:** Integrar

- **refactor > beliefLabel**
  - **en:** Belief:
  - **pt-BR:** Crença:
  - **es-419:** Creencia:

- **refactor > typeLabel**
  - **en:** Type:
  - **pt-BR:** Tipo:
  - **es-419:** Tipo:

- **refactor > dateCreatedLabel**
  - **en:** Date Created:
  - **pt-BR:** Data de criação:
  - **es-419:** Fecha de creación:

- **refactor > view**
  - **en:** View
  - **pt-BR:** Ver
  - **es-419:** Ver

- **refactor > enterYourBelief**
  - **en:** Enter Your Belief
  - **pt-BR:** Digite sua crença
  - **es-419:** Ingresa tu creencia

- **refactor > cancel**
  - **en:** Cancel
  - **pt-BR:** Cancelar
  - **es-419:** Cancelar

- **refactor > titlePlaceholder**
  - **en:** e.g., Physics Exam Anxiety
  - **pt-BR:** p. ex., Ansiedade com prova de física
  - **es-419:** p. ej., Ansiedad por examen de física

- **refactor > beliefPlaceholderEliminate**
  - **en:** e.g., 'If I don't get an A on my Physics Exam my life is ruined'
  - **pt-BR:** p. ex., 'Se eu não tirar A na prova de física, minha vida está arruinada'
  - **es-419:** p. ej., 'Si no saco A en mi examen de física, mi vida está arruinada'

- **refactor > beliefPlaceholderIntegrate**
  - **en:** e.g., 'I am capable of achieving my goals'
  - **pt-BR:** p. ex., 'Sou capaz de alcançar minhas metas'
  - **es-419:** p. ej., 'Soy capaz de lograr mis metas'

- **refactor > charactersCount**
  - **en:** {{count}}/250 characters
  - **pt-BR:** {{count}}/250 caracteres
  - **es-419:** {{count}}/250 caracteres

- **refactor > eliminateTooltip**
  - **en:** Eliminate a limiting belief
  - **pt-BR:** Eliminar uma crença limitante
  - **es-419:** Eliminar una creencia limitante

- **refactor > integrateTooltip**
  - **en:** Integrate an expansionary belief
  - **pt-BR:** Integrar uma crença expansiva
  - **es-419:** Integrar una creencia expansiva

- **refactor > analyzing**
  - **en:** Analyzing...
  - **pt-BR:** Analisando...
  - **es-419:** Analizando...

- **refactor > analyzeBelief**
  - **en:** Analyze Belief
  - **pt-BR:** Analisar crença
  - **es-419:** Analizar creencia

- **refactor > disclaimer**
  - **en:** Belief Work can make mistakes and is not a therapeutic tool. It is meant to analyze beliefs using structure and logic. It is not a tool for emotional and psychological support.
  - **pt-BR:** Trabalho de crenças pode cometer erros e não é uma ferramenta terapêutica. Foi feito para analisar crenças com estrutura e lógica. Não é uma ferramenta de apoio emocional ou psicológico.
  - **es-419:** Trabajo de creencias puede cometer errores y no es una herramienta terapéutica. Está pensado para analizar creencias con estructura y lógica. No es una herramienta de apoyo emocional ni psicológico.

- **refactor > eliminateBelief**
  - **en:** Eliminate Belief
  - **pt-BR:** Eliminar crença
  - **es-419:** Eliminar creencia

- **refactor > integrateBelief**
  - **en:** Integrate Belief
  - **pt-BR:** Integrar crença
  - **es-419:** Integrar creencia

- **refactor > png**
  - **en:** PNG
  - **pt-BR:** PNG
  - **es-419:** PNG

- **refactor > save**
  - **en:** Save
  - **pt-BR:** Salvar
  - **es-419:** Guardar

- **refactor > beliefNode**
  - **en:** Belief
  - **pt-BR:** Crença
  - **es-419:** Creencia

- **refactor > modeEliminate**
  - **en:** Eliminate Limiting Belief
  - **pt-BR:** Eliminar crença limitante
  - **es-419:** Eliminar creencia limitante

- **refactor > modeIntegrate**
  - **en:** Integrate Expansionary Belief
  - **pt-BR:** Integrar crença expansiva
  - **es-419:** Integrar creencia expansiva

- **refactor > assumption**
  - **en:** Assumption {{number}}
  - **pt-BR:** Suposição {{number}}
  - **es-419:** Supuesto {{number}}

- **refactor > visualizationPlaceholder**
  - **en:** Visualization will appear here after analysis
  - **pt-BR:** A visualização aparecerá aqui após a análise
  - **es-419:** La visualización aparecerá aquí después del análisis

- **refactor > viewTerms**
  - **en:** View Terms of Service
  - **pt-BR:** Ver Termos de serviço
  - **es-419:** Ver Términos de servicio

- **refactor > toasts > enterBelief**
  - **en:** Please enter a belief
  - **pt-BR:** Digite uma crença
  - **es-419:** Ingresa una creencia

- **refactor > toasts > selectMode**
  - **en:** Please select a mode (Eliminate or Integrate)
  - **pt-BR:** Selecione um modo (Eliminar ou Integrar)
  - **es-419:** Selecciona un modo (Eliminar o Integrar)

- **refactor > toasts > eliminationSubscribers**
  - **en:** Belief Elimination is for subscribers only. Subscribe to access this feature.
  - **pt-BR:** Eliminar crenças é apenas para assinantes. Assine para acessar este recurso.
  - **es-419:** Eliminar creencias es solo para suscriptores. Suscríbete para acceder.

- **refactor > toasts > integrationSubscribers**
  - **en:** Belief Integration is for subscribers only. Subscribe to access this feature.
  - **pt-BR:** Integrar crenças é apenas para assinantes. Assine para acessar este recurso.
  - **es-419:** Integrar creencias es solo para suscriptores. Suscríbete para acceder.

- **refactor > toasts > weeklyCheckFailed**
  - **en:** Unable to check weekly limit. Please try again.
  - **pt-BR:** Não foi possível verificar o limite semanal. Tente novamente.
  - **es-419:** No se pudo verificar el límite semanal. Inténtalo de nuevo.

- **refactor > toasts > weeklyLimitReached**
  - **en:** Weekly generation limit reached ({{current}}/{{limit}}). Your limit resets on Monday.
  - **pt-BR:** Limite semanal de gerações atingido ({{current}}/{{limit}}). Seu limite reinicia na segunda-feira.
  - **es-419:** Límite semanal de generaciones alcanzado ({{current}}/{{limit}}). Tu límite se reinicia el lunes.

- **refactor > toasts > moderationUnavailable**
  - **en:** Content safety check unavailable. Please try again.
  - **pt-BR:** Verificação de segurança de conteúdo indisponível. Tente novamente.
  - **es-419:** Verificación de seguridad de contenido no disponible. Inténtalo de nuevo.

- **refactor > toasts > moderationUnavailableDetail**
  - **en:** Content safety check unavailable. Please try again or contact support if the issue persists.
  - **pt-BR:** Verificação de segurança de conteúdo indisponível. Tente novamente ou entre em contato com o suporte se o problema continuar.
  - **es-419:** Verificación de seguridad de contenido no disponible. Inténtalo de nuevo o contacta a soporte si el problema continúa.

- **refactor > toasts > statementNotSupported**
  - **en:** This tool isn't designed to process this type of statement.
  - **pt-BR:** Esta ferramenta não foi feita para processar este tipo de declaração.
  - **es-419:** Esta herramienta no está diseñada para procesar este tipo de declaración.

- **refactor > toasts > moderationFailed**
  - **en:** Content safety check failed. Please try again.
  - **pt-BR:** Falha na verificação de segurança de conteúdo. Tente novamente.
  - **es-419:** Falló la verificación de seguridad de contenido. Inténtalo de nuevo.

- **refactor > toasts > moderationFailedDetail**
  - **en:** Content safety check failed. Please try again or contact support if the issue persists.
  - **pt-BR:** Falha na verificação de segurança de conteúdo. Tente novamente ou entre em contato com o suporte se o problema continuar.
  - **es-419:** Falló la verificación de seguridad de contenido. Inténtalo de nuevo o contacta a soporte si el problema continúa.

- **refactor > toasts > blockedDefault**
  - **en:** This tool is temporarily unavailable due to repeated guideline violations. Access will be restored in 24 hours.
  - **pt-BR:** Esta ferramenta está temporariamente indisponível devido a violações repetidas das diretrizes. O acesso será restaurado em 24 horas.
  - **es-419:** Esta herramienta no está disponible temporalmente por violaciones repetidas de las normas. El acceso se restablecerá en 24 horas.

- **refactor > toasts > genericError**
  - **en:** Error.
  - **pt-BR:** Erro.
  - **es-419:** Error.

- **refactor > toasts > connectionError**
  - **en:** Connection error. Please check your internet and try again.
  - **pt-BR:** Erro de conexão. Verifique sua internet e tente novamente.
  - **es-419:** Error de conexión. Revisa tu internet e inténtalo de nuevo.

- **refactor > toasts > tryAgain**
  - **en:** Error. Please try again.
  - **pt-BR:** Erro. Tente novamente.
  - **es-419:** Error. Inténtalo de nuevo.

- **refactor > toasts > logFailed**
  - **en:** Failed to log generation. Weekly count may be inaccurate.
  - **pt-BR:** Falha ao registrar a geração. A contagem semanal pode estar imprecisa.
  - **es-419:** No se pudo registrar la generación. El conteo semanal puede ser inexacto.

- **refactor > toasts > analyzedSuccess**
  - **en:** Belief analyzed successfully!
  - **pt-BR:** Crença analisada com sucesso!
  - **es-419:** ¡Creencia analizada correctamente!

- **refactor > toasts > analyzeFailed**
  - **en:** Failed to analyze belief. Please try again.
  - **pt-BR:** Falha ao analisar a crença. Tente novamente.
  - **es-419:** No se pudo analizar la creencia. Inténtalo de nuevo.

- **refactor > toasts > preparingDownload**
  - **en:** Preparing download...
  - **pt-BR:** Preparando download...
  - **es-419:** Preparando descarga...

- **refactor > toasts > exportedPng**
  - **en:** Exported as PNG!
  - **pt-BR:** Exportado como PNG!
  - **es-419:** ¡Exportado como PNG!

- **refactor > toasts > exportPngFailed**
  - **en:** Failed to export PNG
  - **pt-BR:** Falha ao exportar PNG
  - **es-419:** No se pudo exportar el PNG

- **refactor > toasts > permissionDenied**
  - **en:** Permission denied. Please ensure you are logged in and try again.
  - **pt-BR:** Permissão negada. Certifique-se de estar logado e tente novamente.
  - **es-419:** Permiso denegado. Asegúrate de haber iniciado sesión e inténtalo de nuevo.

- **refactor > toasts > loadFailed**
  - **en:** Failed to load saved refactors. Please try again.
  - **pt-BR:** Falha ao carregar crenças salvas. Tente novamente.
  - **es-419:** No se pudieron cargar las creencias guardadas. Inténtalo de nuevo.

- **refactor > toasts > loginToSave**
  - **en:** You must be logged in to save refactors.
  - **pt-BR:** Você precisa estar logado para salvar crenças.
  - **es-419:** Debes iniciar sesión para guardar creencias.

- **refactor > toasts > invalidAnalysis**
  - **en:** Invalid analysis data. Please try analyzing again.
  - **pt-BR:** Dados de análise inválidos. Tente analisar novamente.
  - **es-419:** Datos de análisis inválidos. Intenta analizar de nuevo.

- **refactor > toasts > missingField**
  - **en:** Missing required field. Please try again.
  - **pt-BR:** Campo obrigatório ausente. Tente novamente.
  - **es-419:** Falta un campo obligatorio. Inténtalo de nuevo.

- **refactor > toasts > entryExists**
  - **en:** Entry already exists. Please try again.
  - **pt-BR:** A entrada já existe. Tente novamente.
  - **es-419:** La entrada ya existe. Inténtalo de nuevo.

- **refactor > toasts > tableNotFound**
  - **en:** Database table not found. Please contact support.
  - **pt-BR:** Tabela do banco de dados não encontrada. Entre em contato com o suporte.
  - **es-419:** Tabla de base de datos no encontrada. Contacta a soporte.

- **refactor > toasts > schemaError**
  - **en:** Database schema error. Please contact support.
  - **pt-BR:** Erro de esquema do banco de dados. Entre em contato com o suporte.
  - **es-419:** Error de esquema de base de datos. Contacta a soporte.

- **refactor > toasts > saveFailed**
  - **en:** Failed to save: {{message}}
  - **pt-BR:** Falha ao salvar: {{message}}
  - **es-419:** No se pudo guardar: {{message}}

- **refactor > toasts > saved**
  - **en:** Saved!
  - **pt-BR:** Salvo!
  - **es-419:** ¡Guardado!

- **refactor > toasts > saveGenericFailed**
  - **en:** Failed to save
  - **pt-BR:** Falha ao salvar
  - **es-419:** No se pudo guardar

- **refactor > toasts > loginToDelete**
  - **en:** You must be logged in to delete refactors.
  - **pt-BR:** Você precisa estar logado para excluir crenças.
  - **es-419:** Debes iniciar sesión para eliminar creencias.

- **refactor > toasts > deleteFailed**
  - **en:** Failed to delete. Please try again.
  - **pt-BR:** Falha ao excluir. Tente novamente.
  - **es-419:** No se pudo eliminar. Inténtalo de nuevo.

- **refactor > toasts > deleted**
  - **en:** Deleted
  - **pt-BR:** Excluído
  - **es-419:** Eliminado

- **musicComposer > pageTitle**
  - **en:** Subliminal Backgrounds | Palette Plotting
  - **pt-BR:** Fundos subliminares | Palette Plotting
  - **es-419:** Fondos subliminales | Palette Plotting

- **musicComposer > title**
  - **en:** Subliminal Backgrounds
  - **pt-BR:** Fundos subliminares
  - **es-419:** Fondos subliminales

- **musicComposer > subtitle**
  - **en:** Create custom subliminal backgrounds.
  - **pt-BR:** Crie fundos sonoros subliminares personalizados.
  - **es-419:** Crea fondos subliminales personalizados.

- **musicComposer > yourTracks**
  - **en:** Your Tracks
  - **pt-BR:** Suas faixas
  - **es-419:** Tus pistas

- **musicComposer > tracksStored**
  - **en:** {{current}}/5 tracks stored
  - **pt-BR:** {{current}}/5 faixas armazenadas
  - **es-419:** {{current}}/5 pistas guardadas

- **musicComposer > newSession**
  - **en:** New Session
  - **pt-BR:** Nova sessão
  - **es-419:** Nueva sesión

- **musicComposer > noTracksYet**
  - **en:** No tracks yet
  - **pt-BR:** Nenhuma faixa ainda
  - **es-419:** Aún no hay pistas

- **musicComposer > createFirstBackground**
  - **en:** Create your first subliminal background
  - **pt-BR:** Crie seu primeiro fundo subliminar
  - **es-419:** Crea tu primer fondo subliminal

- **musicComposer > iphonePianoHint**
  - **en:** If you can't hear the piano on iPhone, leave the app, turn OFF Silent Mode and turn your volume up.
  - **pt-BR:** Se você não ouvir o piano no iPhone, saia do app, desative o Modo Silencioso e aumente o volume.
  - **es-419:** Si no escuchas el piano en iPhone, sal de la app, desactiva el modo silencio y sube el volumen.

- **musicComposer > piano**
  - **en:** Piano
  - **pt-BR:** Piano
  - **es-419:** Piano

- **musicComposer > notes**
  - **en:** Notes
  - **pt-BR:** Notas
  - **es-419:** Notas

- **musicComposer > record**
  - **en:** Record
  - **pt-BR:** Gravar
  - **es-419:** Grabar

- **musicComposer > autoCorrect**
  - **en:** Auto-Correct
  - **pt-BR:** Autocorreção
  - **es-419:** Autocorrección

- **musicComposer > quantizeFast**
  - **en:** Fast (1/8)
  - **pt-BR:** Rápido (1/8)
  - **es-419:** Rápido (1/8)

- **musicComposer > quantizeMedium**
  - **en:** Medium (1/4)
  - **pt-BR:** Médio (1/4)
  - **es-419:** Medio (1/4)

- **musicComposer > quantizeSlow**
  - **en:** Slow (1/2)
  - **pt-BR:** Lento (1/2)
  - **es-419:** Lento (1/2)

- **musicComposer > quantizeVerySlow**
  - **en:** Very Slow
  - **pt-BR:** Muito lento
  - **es-419:** Muy lento

- **musicComposer > maxOneMin**
  - **en:** Max 1 min
  - **pt-BR:** Máx. 1 min
  - **es-419:** Máx. 1 min

- **musicComposer > notesCount**
  - **en:** {{count}} notes
  - **pt-BR:** {{count}} notas
  - **es-419:** {{count}} notas

- **musicComposer > notesRecorded**
  - **en:** {{count}} notes recorded
  - **pt-BR:** {{count}} notas gravadas
  - **es-419:** {{count}} notas grabadas

- **musicComposer > enterMusicNotes**
  - **en:** Enter Music Notes
  - **pt-BR:** Inserir notas musicais
  - **es-419:** Ingresar notas musicales

- **musicComposer > notesFormatHint**
  - **en:** Type notes in format: C4, D#5, E3, etc. (one per line or comma-separated)
  - **pt-BR:** Digite notas no formato: C4, D#5, E3, etc. (uma por linha ou separadas por vírgula)
  - **es-419:** Escribe notas en formato: C4, D#5, E3, etc. (una por línea o separadas por comas)

- **musicComposer > notesPlaceholder**
  - **en:** C4, D4, E4, F4, G4, A4, B4, C5
  - **pt-BR:** C4, D4, E4, F4, G4, A4, B4, C5
  - **es-419:** C4, D4, E4, F4, G4, A4, B4, C5

- **musicComposer > parseNotes**
  - **en:** Parse Notes
  - **pt-BR:** Analisar notas
  - **es-419:** Analizar notas

- **musicComposer > notesParsed**
  - **en:** {{count}} notes parsed
  - **pt-BR:** {{count}} notas analisadas
  - **es-419:** {{count}} notas analizadas

- **musicComposer > stop**
  - **en:** Stop
  - **pt-BR:** Parar
  - **es-419:** Detener

- **musicComposer > play**
  - **en:** Play
  - **pt-BR:** Reproduzir
  - **es-419:** Reproducir

- **musicComposer > clear**
  - **en:** Clear
  - **pt-BR:** Limpar
  - **es-419:** Borrar

- **musicComposer > songNamePlaceholder**
  - **en:** Song name...
  - **pt-BR:** Nome da música...
  - **es-419:** Nombre de la canción...

- **musicComposer > save**
  - **en:** Save
  - **pt-BR:** Salvar
  - **es-419:** Guardar

- **musicComposer > confirmOriginal**
  - **en:** I confirm this is original music
  - **pt-BR:** Confirmo que esta é música original
  - **es-419:** Confirmo que esta es música original

- **musicComposer > originalMusicOnly**
  - **en:** Original Music Only
  - **pt-BR:** Somente música original
  - **es-419:** Solo música original

- **musicComposer > copyrightDisclaimer**
  - **en:** Only create original music. You are responsible for ensuring your compositions don't infringe on existing copyrights.
  - **pt-BR:** Crie apenas música original. Você é responsável por garantir que suas composições não infrinjam direitos autorais existentes.
  - **es-419:** Crea solo música original. Eres responsable de asegurarte de que tus composiciones no infrinjan derechos de autor existentes.

- **musicComposer > recordMode**
  - **en:** Record Mode
  - **pt-BR:** Modo gravação
  - **es-419:** Modo grabación

- **musicComposer > speed**
  - **en:** Speed:
  - **pt-BR:** Velocidade:
  - **es-419:** Velocidad:

- **musicComposer > affirmationSetOptional**
  - **en:** Affirmation Set (Optional)
  - **pt-BR:** Conjunto de afirmações (opcional)
  - **es-419:** Set de afirmaciones (opcional)

- **musicComposer > none**
  - **en:** None
  - **pt-BR:** Nenhum
  - **es-419:** Ninguno

- **musicComposer > dialogTitle**
  - **en:** New Session
  - **pt-BR:** Nova sessão
  - **es-419:** Nueva sesión

- **musicComposer > dialogDescription**
  - **en:** Choose your session type and settings
  - **pt-BR:** Escolha o tipo de sessão e as configurações
  - **es-419:** Elige el tipo de sesión y la configuración

- **musicComposer > sessionType**
  - **en:** Session Type
  - **pt-BR:** Tipo de sessão
  - **es-419:** Tipo de sesión

- **musicComposer > pianoTapping**
  - **en:** Piano Tapping
  - **pt-BR:** Piano Tapping
  - **es-419:** Piano Tapping

- **musicComposer > recordingSession**
  - **en:** Recording Session
  - **pt-BR:** Sessão de gravação
  - **es-419:** Sesión de grabación

- **musicComposer > trackName**
  - **en:** Track Name
  - **pt-BR:** Nome da faixa
  - **es-419:** Nombre de la pista

- **musicComposer > trackNamePlaceholder**
  - **en:** Enter track name...
  - **pt-BR:** Digite o nome da faixa...
  - **es-419:** Ingresa el nombre de la pista...

- **musicComposer > cancel**
  - **en:** Cancel
  - **pt-BR:** Cancelar
  - **es-419:** Cancelar

- **musicComposer > startSession**
  - **en:** Start Session
  - **pt-BR:** Iniciar sessão
  - **es-419:** Iniciar sesión

- **musicComposer > deleteConfirm**
  - **en:** Are you sure you want to delete "{{name}}"?
  - **pt-BR:** Tem certeza de que deseja excluir "{{name}}"?
  - **es-419:** ¿Seguro que quieres eliminar "{{name}}"?

- **musicComposer > durationMin**
  - **en:** {{minutes}} min
  - **pt-BR:** {{minutes}} min
  - **es-419:** {{minutes}} min

- **musicComposer > toasts > loadTracksFailed**
  - **en:** Failed to load tracks
  - **pt-BR:** Falha ao carregar as faixas
  - **es-419:** No se pudieron cargar las pistas

- **musicComposer > toasts > subscribersOnly**
  - **en:** Subliminal Backgrounds is for subscribers only. Subscribe to access this feature.
  - **pt-BR:** Fundos subliminares são exclusivos para assinantes. Assine para acessar este recurso.
  - **es-419:** Los fondos subliminales son exclusivos para suscriptores. Suscríbete para acceder.

- **musicComposer > toasts > trackDeleted**
  - **en:** Track deleted
  - **pt-BR:** Faixa excluída
  - **es-419:** Pista eliminada

- **musicComposer > toasts > deleteTrackFailed**
  - **en:** Failed to delete track
  - **pt-BR:** Falha ao excluir a faixa
  - **es-419:** No se pudo eliminar la pista

- **musicComposer > toasts > songTrimmed**
  - **en:** Song trimmed to 1 minute limit ({{count}} notes)
  - **pt-BR:** Música cortada para o limite de 1 minuto ({{count}} notas)
  - **es-419:** Canción recortada al límite de 1 minuto ({{count}} notas)

- **musicComposer > toasts > parsedNotes**
  - **en:** Parsed {{count}} notes
  - **pt-BR:** {{count}} notas analisadas
  - **es-419:** {{count}} notas analizadas

- **musicComposer > toasts > parseFailed**
  - **en:** Failed to parse notes: {{message}}
  - **pt-BR:** Falha ao analisar as notas: {{message}}
  - **es-419:** No se pudieron analizar las notas: {{message}}

- **musicComposer > toasts > noNotesToPlay**
  - **en:** No notes to play
  - **pt-BR:** Nenhuma nota para reproduzir
  - **es-419:** No hay notas para reproducir

- **musicComposer > toasts > enterSongName**
  - **en:** Please enter a song name
  - **pt-BR:** Digite um nome para a música
  - **es-419:** Ingresa un nombre para la canción

- **musicComposer > toasts > noNotesToSave**
  - **en:** No notes to save
  - **pt-BR:** Nenhuma nota para salvar
  - **es-419:** No hay notas para guardar

- **musicComposer > toasts > confirmOriginal**
  - **en:** Please confirm that your music is original
  - **pt-BR:** Confirme que sua música é original
  - **es-419:** Confirma que tu música es original

- **musicComposer > toasts > loginToSave**
  - **en:** Please log in to save tracks
  - **pt-BR:** Faça login para salvar faixas
  - **es-419:** Inicia sesión para guardar pistas

- **musicComposer > toasts > trackLimitReached**
  - **en:** You've reached the limit of 5 background tracks. Please delete one to save a new track.
  - **pt-BR:** Você atingiu o limite de 5 faixas de fundo. Exclua uma para salvar uma nova.
  - **es-419:** Alcanzaste el límite de 5 pistas de fondo. Elimina una para guardar una nueva.

- **musicComposer > toasts > trackTrimmed**
  - **en:** Track trimmed to 1 minute limit ({{count}} notes)
  - **pt-BR:** Faixa cortada para o limite de 1 minuto ({{count}} notas)
  - **es-419:** Pista recortada al límite de 1 minuto ({{count}} notas)

- **musicComposer > toasts > noValidNotes**
  - **en:** No valid notes to save. Please record some notes first.
  - **pt-BR:** Nenhuma nota válida para salvar. Grave algumas notas primeiro.
  - **es-419:** No hay notas válidas para guardar. Graba algunas notas primero.

- **musicComposer > toasts > duplicateName**
  - **en:** A track with this name already exists. Please choose a different name.
  - **pt-BR:** Já existe uma faixa com este nome. Escolha outro nome.
  - **es-419:** Ya existe una pista con este nombre. Elige otro nombre.

- **musicComposer > toasts > generatingAudio**
  - **en:** Generating audio...
  - **pt-BR:** Gerando áudio...
  - **es-419:** Generando audio...

- **musicComposer > toasts > generateAudioFailed**
  - **en:** Failed to generate audio: {{message}}
  - **pt-BR:** Falha ao gerar o áudio: {{message}}
  - **es-419:** No se pudo generar el audio: {{message}}

- **musicComposer > toasts > bucketNotFound**
  - **en:** Storage bucket 'background-tracks' not found. Please create it in Supabase Dashboard > Storage > Buckets.
  - **pt-BR:** Bucket de armazenamento 'background-tracks' não encontrado. Crie-o em Supabase Dashboard > Storage > Buckets.
  - **es-419:** Bucket de almacenamiento 'background-tracks' no encontrado. Créalo en Supabase Dashboard > Storage > Buckets.

- **musicComposer > toasts > uploadFailed**
  - **en:** Failed to upload audio file: {{message}}
  - **pt-BR:** Falha ao enviar o arquivo de áudio: {{message}}
  - **es-419:** No se pudo subir el archivo de audio: {{message}}

- **musicComposer > toasts > saveDbFailed**
  - **en:** Failed to save track to database
  - **pt-BR:** Falha ao salvar a faixa no banco de dados
  - **es-419:** No se pudo guardar la pista en la base de datos

- **musicComposer > toasts > trackSaved**
  - **en:** Track saved successfully! It's now available as a background sound.
  - **pt-BR:** Faixa salva com sucesso! Já está disponível como som de fundo.
  - **es-419:** ¡Pista guardada! Ya está disponible como sonido de fondo.

- **musicComposer > toasts > saveFailed**
  - **en:** Failed to save track: {{message}}
  - **pt-BR:** Falha ao salvar a faixa: {{message}}
  - **es-419:** No se pudo guardar la pista: {{message}}

- **musicComposer > toasts > enterTrackName**
  - **en:** Please enter a track name for recording sessions
  - **pt-BR:** Digite um nome de faixa para sessões de gravação
  - **es-419:** Ingresa un nombre de pista para sesiones de grabación

- **musicComposer > toasts > unknownError**
  - **en:** Unknown error
  - **pt-BR:** Erro desconhecido
  - **es-419:** Error desconocido

- **subliminal > pageTitle**
  - **en:** Subliminal Maker | Palette Plotting
  - **pt-BR:** Criador de subliminares | Palette Plotting
  - **es-419:** Creador de subliminales | Palette Plotting

- **subliminal > title**
  - **en:** Subliminal Maker
  - **pt-BR:** Criador de subliminares
  - **es-419:** Creador de subliminales

- **subliminal > subtitle**
  - **en:** Create tracks with background and binaural beats
  - **pt-BR:** Crie faixas com fundo e batidas binaurais
  - **es-419:** Crea pistas con fondo y beats binaurales

- **subliminal > hideLimits**
  - **en:** Hide storage and weekly limits
  - **pt-BR:** Ocultar limites de armazenamento e semanais
  - **es-419:** Ocultar límites de almacenamiento y semanales

- **subliminal > showLimits**
  - **en:** Show storage and weekly limits
  - **pt-BR:** Mostrar limites de armazenamento e semanais
  - **es-419:** Mostrar límites de almacenamiento y semanales

- **subliminal > storage**
  - **en:** Storage:
  - **pt-BR:** Armazenamento:
  - **es-419:** Almacenamiento:

- **subliminal > weeklyCreations**
  - **en:** Weekly Creations:
  - **pt-BR:** Criações semanais:
  - **es-419:** Creaciones semanales:

- **subliminal > loading**
  - **en:** Loading...
  - **pt-BR:** Carregando...
  - **es-419:** Cargando...

- **subliminal > deleteTrack**
  - **en:** Delete Track
  - **pt-BR:** Excluir faixa
  - **es-419:** Eliminar pista

- **subliminal > deleteDescription**
  - **en:** Are you sure you want to delete "{{name}}"? This action cannot be undone and will free up storage space.
  - **pt-BR:** Tem certeza de que deseja excluir "{{name}}"? Esta ação não pode ser desfeita e liberará espaço de armazenamento.
  - **es-419:** ¿Seguro que quieres eliminar "{{name}}"? Esta acción no se puede deshacer y liberará espacio de almacenamiento.

- **subliminal > cancel**
  - **en:** Cancel
  - **pt-BR:** Cancelar
  - **es-419:** Cancelar

- **subliminal > delete**
  - **en:** Delete
  - **pt-BR:** Excluir
  - **es-419:** Eliminar

- **subliminal > yourTracks**
  - **en:** Your Tracks
  - **pt-BR:** Suas faixas
  - **es-419:** Tus pistas

- **subliminal > create**
  - **en:** Create
  - **pt-BR:** Criar
  - **es-419:** Crear

- **subliminal > subliminalTrack**
  - **en:** Subliminal Track
  - **pt-BR:** Faixa subliminar
  - **es-419:** Pista subliminal

- **subliminal > subliminalBackgrounds**
  - **en:** Subliminal Backgrounds
  - **pt-BR:** Fundos subliminares
  - **es-419:** Fondos subliminales

- **subliminal > pianoTapping**
  - **en:** Piano Tapping
  - **pt-BR:** Piano Tapping
  - **es-419:** Piano Tapping

- **subliminal > noTracksYet**
  - **en:** No tracks yet
  - **pt-BR:** Nenhuma faixa ainda
  - **es-419:** Aún no hay pistas

- **subliminal > trackOptions**
  - **en:** Track options
  - **pt-BR:** Opções da faixa
  - **es-419:** Opciones de pista

- **subliminal > pause**
  - **en:** Pause
  - **pt-BR:** Pausar
  - **es-419:** Pausar

- **subliminal > play**
  - **en:** Play
  - **pt-BR:** Reproduzir
  - **es-419:** Reproducir

- **subliminal > turnOffLoop**
  - **en:** Turn off loop
  - **pt-BR:** Desativar repetição
  - **es-419:** Desactivar repetición

- **subliminal > loopPlayback**
  - **en:** Loop playback
  - **pt-BR:** Repetir reprodução
  - **es-419:** Repetir reproducción

- **subliminal > dismissPlayer**
  - **en:** Dismiss player
  - **pt-BR:** Fechar player
  - **es-419:** Cerrar reproductor

- **subliminal > loop**
  - **en:** Loop
  - **pt-BR:** Repetir
  - **es-419:** Repetir

- **subliminal > vocalBase**
  - **en:** Vocal Base
  - **pt-BR:** Base vocal
  - **es-419:** Base vocal

- **subliminal > nameYourTrack**
  - **en:** Name Your Track
  - **pt-BR:** Nomeie sua faixa
  - **es-419:** Nombra tu pista

- **subliminal > trackNamePlaceholder**
  - **en:** e.g., Morning Motivation
  - **pt-BR:** p. ex., Motivação matinal
  - **es-419:** p. ej., Motivación matutina

- **subliminal > freestyle**
  - **en:** Freestyle
  - **pt-BR:** Freestyle
  - **es-419:** Freestyle

- **subliminal > karaoke**
  - **en:** Karaoke
  - **pt-BR:** Karaoke
  - **es-419:** Karaoke

- **subliminal > textToSpeech**
  - **en:** Text-to-Speech
  - **pt-BR:** Texto para fala
  - **es-419:** Texto a voz

- **subliminal > selectAffirmationSet**
  - **en:** Select Affirmation Set
  - **pt-BR:** Selecionar conjunto de afirmações
  - **es-419:** Seleccionar set de afirmaciones

- **subliminal > chooseAffirmationSet**
  - **en:** Choose an affirmation set
  - **pt-BR:** Escolha um conjunto de afirmações
  - **es-419:** Elige un set de afirmaciones

- **subliminal > readAndRecord**
  - **en:** Read & Record:
  - **pt-BR:** Leia e grave:
  - **es-419:** Lee y graba:

- **subliminal > generateVoiceHint**
  - **en:** Generate a voice reading of your affirmations.
  - **pt-BR:** Gere uma voz lendo suas afirmações.
  - **es-419:** Genera una voz leyendo tus afirmaciones.

- **subliminal > willGenerate**
  - **en:** Will generate: {{count}} affirmations
  - **pt-BR:** Serão geradas: {{count}} afirmações
  - **es-419:** Se generarán: {{count}} afirmaciones

- **subliminal > generating**
  - **en:** Generating...
  - **pt-BR:** Gerando...
  - **es-419:** Generando...

- **subliminal > generateAudio**
  - **en:** Generate Audio
  - **pt-BR:** Gerar áudio
  - **es-419:** Generar audio

- **subliminal > next**
  - **en:** Next
  - **pt-BR:** Próximo
  - **es-419:** Siguiente

- **subliminal > step1Disclaimer**
  - **en:** Only use audio you're allowed to use. Recordings can be looped—you don't need to fill the full track. Karaoke: read the on-screen affirmations while you record.
  - **pt-BR:** Use apenas áudio que você tem permissão para usar. As gravações podem ser repetidas — você não precisa preencher a faixa inteira. Karaoke: leia as afirmações na tela enquanto grava.
  - **es-419:** Usa solo audio que tengas permitido usar. Las grabaciones pueden repetirse—no necesitas llenar toda la pista. Karaoke: lee las afirmaciones en pantalla mientras grabas.

- **subliminal > binauralBeats**
  - **en:** Binaural Beats
  - **pt-BR:** Batidas binaurais
  - **es-419:** Beats binaurales

- **subliminal > frequencyType**
  - **en:** Frequency Type
  - **pt-BR:** Tipo de frequência
  - **es-419:** Tipo de frecuencia

- **subliminal > thetaRecommended**
  - **en:** Recommended for deep focus and relaxation
  - **pt-BR:** Recomendado para foco profundo e relaxamento
  - **es-419:** Recomendado para enfoque profundo y relajación

- **subliminal > frequenciesNote**
  - **en:** Note: Frequencies are approximations.
  - **pt-BR:** Nota: as frequências são aproximações.
  - **es-419:** Nota: Las frecuencias son aproximaciones.

- **subliminal > back**
  - **en:** Back
  - **pt-BR:** Voltar
  - **es-419:** Atrás

- **subliminal > subliminalSettings**
  - **en:** Subliminal Settings
  - **pt-BR:** Configurações subliminares
  - **es-419:** Ajustes subliminales

- **subliminal > affirmationVolume**
  - **en:** Affirmation volume
  - **pt-BR:** Volume das afirmações
  - **es-419:** Volumen de afirmaciones

- **subliminal > voiceNotAudible**
  - **en:** Voice present but not well audible below 20%
  - **pt-BR:** A voz está presente, mas pouco audível abaixo de 20%
  - **es-419:** La voz está presente pero poco audible por debajo del 20%

- **subliminal > binauralVolume**
  - **en:** Binaural volume
  - **pt-BR:** Volume binaural
  - **es-419:** Volumen binaural

- **subliminal > backgroundVolume**
  - **en:** Background Volume: {{percent}}%
  - **pt-BR:** Volume de fundo: {{percent}}%
  - **es-419:** Volumen de fondo: {{percent}}%

- **subliminal > backgroundSound**
  - **en:** Background Sound
  - **pt-BR:** Som de fundo
  - **es-419:** Sonido de fondo

- **subliminal > selectBackgroundSound**
  - **en:** Select background sound...
  - **pt-BR:** Selecionar som de fundo...
  - **es-419:** Seleccionar sonido de fondo...

- **subliminal > createOwnBackground**
  - **en:** (Want to create your own?
  - **pt-BR:** (Quer criar o seu?
  - **es-419:** (¿Quieres crear el tuyo?

- **subliminal > openSubliminalBackgrounds**
  - **en:** Open Subliminal Backgrounds
  - **pt-BR:** Abrir Fundos subliminares
  - **es-419:** Abrir Fondos subliminales

- **subliminal > loseProgress**
  - **en:** . You will lose your current progress.)
  - **pt-BR:** . Você perderá seu progresso atual.)
  - **es-419:** . Perderás tu progreso actual.)

- **subliminal > openBackgroundsConfirm**
  - **en:** Open Subliminal Backgrounds? You will lose your current progress.
  - **pt-BR:** Abrir Fundos subliminares? Você perderá seu progresso atual.
  - **es-419:** ¿Abrir Fondos subliminales? Perderás tu progreso actual.

- **subliminal > affirmationLayers**
  - **en:** Affirmation Layers: {{count}}
  - **pt-BR:** Camadas de afirmações: {{count}}
  - **es-419:** Capas de afirmaciones: {{count}}

- **subliminal > layersRecommended**
  - **en:** 3–5 recommended
  - **pt-BR:** 3–5 recomendadas
  - **es-419:** 3–5 recomendadas

- **subliminal > trackLength**
  - **en:** Track Length: {{minutes}} minutes
  - **pt-BR:** Duração da faixa: {{minutes}} minutos
  - **es-419:** Duración de la pista: {{minutes}} minutos

- **subliminal > createTrack**
  - **en:** Create Track
  - **pt-BR:** Criar faixa
  - **es-419:** Crear pista

- **subliminal > customSound**
  - **en:** {{name}} (Custom Sound)
  - **pt-BR:** {{name}} (som personalizado)
  - **es-419:** {{name}} (sonido personalizado)

- **subliminal > binauralShort > none**
  - **en:** No beat
  - **pt-BR:** Sem beat
  - **es-419:** Sin beat

- **subliminal > binauralShort > delta**
  - **en:** Delta
  - **pt-BR:** Delta
  - **es-419:** Delta

- **subliminal > binauralShort > theta**
  - **en:** Theta
  - **pt-BR:** Theta
  - **es-419:** Theta

- **subliminal > binauralShort > alpha**
  - **en:** Alpha
  - **pt-BR:** Alpha
  - **es-419:** Alpha

- **subliminal > binauralShort > beta**
  - **en:** Beta
  - **pt-BR:** Beta
  - **es-419:** Beta

- **subliminal > binauralShort > gamma**
  - **en:** Gamma
  - **pt-BR:** Gamma
  - **es-419:** Gamma

- **subliminal > binauralBeatsOptions > none > label**
  - **en:** No binaural beat
  - **pt-BR:** Sem batida binaural
  - **es-419:** Sin beat binaural

- **subliminal > binauralBeatsOptions > none > desc**
  - **en:** Affirmations and background only; no binaural tones in the mix.
  - **pt-BR:** Somente afirmações e fundo; sem tons binaurais na mixagem.
  - **es-419:** Solo afirmaciones y fondo; sin tonos binaurales en la mezcla.

- **subliminal > binauralBeatsOptions > delta > label**
  - **en:** Delta (0.5-4 Hz beat, ~200 Hz carrier)
  - **pt-BR:** Delta (batida 0,5–4 Hz, portadora ~200 Hz)
  - **es-419:** Delta (beat 0,5-4 Hz, portadora ~200 Hz)

- **subliminal > binauralBeatsOptions > delta > desc**
  - **en:** Deep sleep, healing, regeneration
  - **pt-BR:** Sono profundo, cura, regeneração
  - **es-419:** Sueño profundo, sanación, regeneración

- **subliminal > binauralBeatsOptions > theta > label**
  - **en:** Theta (4-8 Hz beat, ~200 Hz carrier)
  - **pt-BR:** Theta (batida 4–8 Hz, portadora ~200 Hz)
  - **es-419:** Theta (beat 4-8 Hz, portadora ~200 Hz)

- **subliminal > binauralBeatsOptions > theta > desc**
  - **en:** Meditation, deep focus, deep relaxation
  - **pt-BR:** Meditação, foco profundo, relaxamento profundo
  - **es-419:** Meditación, enfoque profundo, relajación profunda

- **subliminal > binauralBeatsOptions > alpha > label**
  - **en:** Alpha (8-13 Hz beat, ~250 Hz carrier)
  - **pt-BR:** Alpha (batida 8–13 Hz, portadora ~250 Hz)
  - **es-419:** Alpha (beat 8-13 Hz, portadora ~250 Hz)

- **subliminal > binauralBeatsOptions > alpha > desc**
  - **en:** Relaxation, learning, light meditation
  - **pt-BR:** Relaxamento, aprendizado, meditação leve
  - **es-419:** Relajación, aprendizaje, meditación ligera

- **subliminal > binauralBeatsOptions > beta > label**
  - **en:** Beta (13-30 Hz beat, ~300 Hz carrier)
  - **pt-BR:** Beta (batida 13–30 Hz, portadora ~300 Hz)
  - **es-419:** Beta (beat 13-30 Hz, portadora ~300 Hz)

- **subliminal > binauralBeatsOptions > beta > desc**
  - **en:** Focus, concentration, alertness
  - **pt-BR:** Foco, concentração, alerta
  - **es-419:** Enfoque, concentración, alerta

- **subliminal > binauralBeatsOptions > gamma > label**
  - **en:** Gamma (30-100 Hz beat, ~400 Hz carrier)
  - **pt-BR:** Gamma (batida 30–100 Hz, portadora ~400 Hz)
  - **es-419:** Gamma (beat 30-100 Hz, portadora ~400 Hz)

- **subliminal > binauralBeatsOptions > gamma > desc**
  - **en:** Peak awareness, cognitive enhancement
  - **pt-BR:** Máxima consciência, aprimoramento cognitivo
  - **es-419:** Máxima conciencia, mejora cognitiva

- **subliminal > backgroundSounds > none**
  - **en:** No background sound
  - **pt-BR:** Sem som de fundo
  - **es-419:** Sin sonido de fondo

- **subliminal > backgroundSounds > cityCorner**
  - **en:** City Corner
  - **pt-BR:** Esquina urbana
  - **es-419:** Esquina urbana

- **subliminal > backgroundSounds > fireplace**
  - **en:** Fireplace
  - **pt-BR:** Lareira
  - **es-419:** Chimenea

- **subliminal > backgroundSounds > goldCoins**
  - **en:** Gold Coins
  - **pt-BR:** Moedas de ouro
  - **es-419:** Monedas de oro

- **subliminal > backgroundSounds > naturePark**
  - **en:** Nature Park
  - **pt-BR:** Parque natural
  - **es-419:** Parque natural

- **subliminal > backgroundSounds > ocean**
  - **en:** Ocean
  - **pt-BR:** Oceano
  - **es-419:** Océano

- **subliminal > backgroundSounds > rain**
  - **en:** Rain
  - **pt-BR:** Chuva
  - **es-419:** Lluvia

- **subliminal > toasts > permissionDenied**
  - **en:** Permission denied. Please ensure you're logged in and try again.
  - **pt-BR:** Permissão negada. Certifique-se de estar logado e tente novamente.
  - **es-419:** Permiso denegado. Asegúrate de haber iniciado sesión e inténtalo de nuevo.

- **subliminal > toasts > genericError**
  - **en:** Error. Please try again.
  - **pt-BR:** Erro. Tente novamente.
  - **es-419:** Error. Inténtalo de nuevo.

- **subliminal > toasts > loadFailed**
  - **en:** Failed to load tracks: {{message}}
  - **pt-BR:** Falha ao carregar as faixas: {{message}}
  - **es-419:** No se pudieron cargar las pistas: {{message}}

- **subliminal > toasts > enterTrackName**
  - **en:** Please enter a track name
  - **pt-BR:** Digite um nome para a faixa
  - **es-419:** Ingresa un nombre para la pista

- **subliminal > toasts > recordAffirmationsFirst**
  - **en:** Please record affirmations first
  - **pt-BR:** Grave as afirmações primeiro
  - **es-419:** Graba las afirmaciones primero

- **subliminal > toasts > selectBackgroundSound**
  - **en:** Please select a background sound
  - **pt-BR:** Selecione um som de fundo
  - **es-419:** Selecciona un sonido de fondo

- **subliminal > toasts > ttsUpgrade**
  - **en:** Text-to-Speech requires an upgrade. Please upgrade to access this feature.
  - **pt-BR:** Texto para fala requer upgrade de plano. Faça upgrade para acessar este recurso.
  - **es-419:** Texto a voz requiere una mejora de plan. Mejora tu plan para acceder.

- **subliminal > toasts > ttsCharLimit**
  - **en:** Text-to-Speech has a 480 character limit. Your text is {{length}} characters. Please shorten your affirmations.
  - **pt-BR:** Texto para fala tem limite de 480 caracteres. Seu texto tem {{length}} caracteres. Encurte suas afirmações.
  - **es-419:** Texto a voz tiene un límite de 480 caracteres. Tu texto tiene {{length}} caracteres. Acorta tus afirmaciones.

- **subliminal > toasts > loginToGenerate**
  - **en:** Please log in to generate audio
  - **pt-BR:** Faça login para gerar áudio
  - **es-419:** Inicia sesión para generar audio

- **subliminal > toasts > voiceGenerated**
  - **en:** Voice generated successfully!
  - **pt-BR:** Voz gerada com sucesso!
  - **es-419:** ¡Voz generada correctamente!

- **subliminal > toasts > processAudioFailed**
  - **en:** Failed to process audio data. Please try again.
  - **pt-BR:** Falha ao processar os dados de áudio. Tente novamente.
  - **es-419:** No se pudieron procesar los datos de audio. Inténtalo de nuevo.

- **subliminal > toasts > noAudioContent**
  - **en:** No audio content received from server
  - **pt-BR:** Nenhum conteúdo de áudio recebido do servidor
  - **es-419:** No se recibió contenido de audio del servidor

- **subliminal > toasts > generateAudioFailed**
  - **en:** Failed to generate audio. Please try again.
  - **pt-BR:** Falha ao gerar o áudio. Tente novamente.
  - **es-419:** No se pudo generar el audio. Inténtalo de nuevo.

- **subliminal > toasts > recordingNoData**
  - **en:** Recording failed. No audio data captured.
  - **pt-BR:** Falha na gravação. Nenhum dado de áudio capturado.
  - **es-419:** Falló la grabación. No se capturaron datos de audio.

- **subliminal > toasts > recordingEmpty**
  - **en:** Recording failed. Audio file is empty.
  - **pt-BR:** Falha na gravação. O arquivo de áudio está vazio.
  - **es-419:** Falló la grabación. El archivo de audio está vacío.

- **subliminal > toasts > recordingError**
  - **en:** Recording error occurred. Please try again.
  - **pt-BR:** Ocorreu um erro de gravação. Tente novamente.
  - **es-419:** Ocurrió un error de grabación. Inténtalo de nuevo.

- **subliminal > toasts > recordingStarted**
  - **en:** Recording started
  - **pt-BR:** Gravação iniciada
  - **es-419:** Grabación iniciada

- **subliminal > toasts > micAccessPrefix**
  - **en:** Could not access microphone. 
  - **pt-BR:** Não foi possível acessar o microfone. 
  - **es-419:** No se pudo acceder al micrófono. 

- **subliminal > toasts > micAndroidSettings**
  - **en:** Open Android Settings → Apps → Palette Plotting → Permissions → Microphone, then allow.
  - **pt-BR:** Abra Configurações do Android → Apps → Palette Plotting → Permissões → Microfone e permita o acesso.
  - **es-419:** Abre Ajustes de Android → Apps → Palette Plotting → Permisos → Micrófono y permite el acceso.

- **subliminal > toasts > micBrowserSettings**
  - **en:** Please allow microphone access in your browser settings.
  - **pt-BR:** Permita o acesso ao microfone nas configurações do navegador.
  - **es-419:** Permite el acceso al micrófono en la configuración de tu navegador.

- **subliminal > toasts > noMicrophone**
  - **en:** No microphone found on this device.
  - **pt-BR:** Nenhum microfone encontrado neste dispositivo.
  - **es-419:** No se encontró micrófono en este dispositivo.

- **subliminal > toasts > micInUse**
  - **en:** Microphone is being used by another application.
  - **pt-BR:** O microfone está sendo usado por outro aplicativo.
  - **es-419:** El micrófono está siendo usado por otra aplicación.

- **subliminal > toasts > micCheckSettings**
  - **en:** Please check your microphone settings.
  - **pt-BR:** Verifique as configurações do microfone.
  - **es-419:** Revisa la configuración de tu micrófono.

- **subliminal > toasts > recordingStopped**
  - **en:** Recording stopped
  - **pt-BR:** Gravação interrompida
  - **es-419:** Grabación detenida

- **subliminal > toasts > recordingSaved**
  - **en:** Recording saved!
  - **pt-BR:** Gravação salva!
  - **es-419:** ¡Grabación guardada!

- **subliminal > toasts > noAudioToPlay**
  - **en:** No audio to play. Please record audio first.
  - **pt-BR:** Nenhum áudio para reproduzir. Grave áudio primeiro.
  - **es-419:** No hay audio para reproducir. Graba audio primero.

- **subliminal > toasts > audioEmpty**
  - **en:** Audio file is empty. Please record again.
  - **pt-BR:** O arquivo de áudio está vazio. Grave novamente.
  - **es-419:** El archivo de audio está vacío. Graba de nuevo.

- **subliminal > toasts > audioError**
  - **en:** Audio error: {{code}} - {{message}}
  - **pt-BR:** Erro de áudio: {{code}} - {{message}}
  - **es-419:** Error de audio: {{code}} - {{message}}

- **subliminal > toasts > audioUnsupported**
  - **en:** Failed to play audio. The file format may not be supported.
  - **pt-BR:** Falha ao reproduzir o áudio. O formato do arquivo pode não ser compatível.
  - **es-419:** No se pudo reproducir el audio. El formato puede no ser compatible.

- **subliminal > toasts > playingAudio**
  - **en:** Playing audio
  - **pt-BR:** Reproduzindo áudio
  - **es-419:** Reproduciendo audio

- **subliminal > toasts > playFailedPrefix**
  - **en:** Failed to play audio. 
  - **pt-BR:** Falha ao reproduzir o áudio. 
  - **es-419:** No se pudo reproducir el audio. 

- **subliminal > toasts > tapPlayAgain**
  - **en:** Please tap the play button again. Mobile browsers require direct user interaction.
  - **pt-BR:** Toque no botão de reproduzir novamente. Navegadores móveis exigem interação direta do usuário.
  - **es-419:** Toca el botón de reproducir de nuevo. Los navegadores móviles requieren interacción directa.

- **subliminal > toasts > loadTimeout**
  - **en:** Audio took too long to load. Please try again.
  - **pt-BR:** O áudio demorou demais para carregar. Tente novamente.
  - **es-419:** El audio tardó demasiado en cargar. Inténtalo de nuevo.

- **subliminal > toasts > audioLoadFailed**
  - **en:** Audio failed to load. The file may be corrupted. Please record again.
  - **pt-BR:** Falha ao carregar o áudio. O arquivo pode estar corrompido. Grave novamente.
  - **es-419:** No se pudo cargar el audio. El archivo puede estar dañado. Graba de nuevo.

- **subliminal > toasts > tapAgain**
  - **en:** Please try tapping the play button again.
  - **pt-BR:** Tente tocar no botão de reproduzir novamente.
  - **es-419:** Intenta tocar el botón de reproducir de nuevo.

- **subliminal > toasts > playingTrack**
  - **en:** Playing: {{name}}
  - **pt-BR:** Reproduzindo: {{name}}
  - **es-419:** Reproduciendo: {{name}}

- **subliminal > toasts > playTrackFailedPrefix**
  - **en:** Failed to play track. 
  - **pt-BR:** Falha ao reproduzir a faixa. 
  - **es-419:** No se pudo reproducir la pista. 

- **subliminal > toasts > interactFirst**
  - **en:** Please interact with the page first.
  - **pt-BR:** Interaja com a página primeiro.
  - **es-419:** Interactúa con la página primero.

- **subliminal > toasts > playTrackFailed**
  - **en:** Failed to play track. Please try again.
  - **pt-BR:** Falha ao reproduzir a faixa. Tente novamente.
  - **es-419:** No se pudo reproducir la pista. Inténtalo de nuevo.

- **subliminal > toasts > loginToDelete**
  - **en:** You must be logged in to delete tracks.
  - **pt-BR:** Você precisa estar logado para excluir faixas.
  - **es-419:** Debes iniciar sesión para eliminar pistas.

- **subliminal > toasts > trackDeleted**
  - **en:** Track deleted
  - **pt-BR:** Faixa excluída
  - **es-419:** Pista eliminada

- **subliminal > toasts > deleteTrackFailed**
  - **en:** Failed to delete track
  - **pt-BR:** Falha ao excluir a faixa
  - **es-419:** No se pudo eliminar la pista

- **subliminal > toasts > loginToGenerateTrack**
  - **en:** You must be logged in to generate tracks.
  - **pt-BR:** Você precisa estar logado para gerar faixas.
  - **es-419:** Debes iniciar sesión para generar pistas.

- **subliminal > toasts > sessionExpired**
  - **en:** Session expired. Please refresh the page and log in again.
  - **pt-BR:** Sessão expirada. Atualize a página e faça login novamente.
  - **es-419:** Sesión expirada. Actualiza la página e inicia sesión de nuevo.

- **subliminal > toasts > weeklyCheckFailed**
  - **en:** Unable to check weekly limit. Please try again.
  - **pt-BR:** Não foi possível verificar o limite semanal. Tente novamente.
  - **es-419:** No se pudo verificar el límite semanal. Inténtalo de nuevo.

- **subliminal > toasts > weeklyLimitReached**
  - **en:** Weekly generation limit reached ({{current}}/{{limit}}). Your limit resets on Monday.
  - **pt-BR:** Limite semanal de gerações atingido ({{current}}/{{limit}}). Seu limite reinicia na segunda-feira.
  - **es-419:** Límite semanal de generaciones alcanzado ({{current}}/{{limit}}). Tu límite se reinicia el lunes.

- **subliminal > toasts > fileTooLargeRemaining**
  - **en:** File is too large ({{size}} MB). You have {{remaining}} MB remaining. Try a shorter track length.
  - **pt-BR:** O arquivo é muito grande ({{size}} MB). Você tem {{remaining}} MB restantes. Tente uma faixa mais curta.
  - **es-419:** El archivo es muy grande ({{size}} MB). Te quedan {{remaining}} MB. Prueba con una pista más corta.

- **subliminal > toasts > fileTooLargeMax**
  - **en:** File is too large ({{size}} MB). Maximum file size is {{max}} MB for your tier. Try a shorter track length.
  - **pt-BR:** O arquivo é muito grande ({{size}} MB). O tamanho máximo é {{max}} MB para o seu plano. Tente uma faixa mais curta.
  - **es-419:** El archivo es muy grande ({{size}} MB). El tamaño máximo es {{max}} MB para tu plan. Prueba con una pista más corta.

- **subliminal > toasts > fileLargeWarning**
  - **en:** File is large ({{size}} MB). Upload may take a while.
  - **pt-BR:** O arquivo é grande ({{size}} MB). O envio pode demorar um pouco.
  - **es-419:** El archivo es grande ({{size}} MB). La subida puede tardar un poco.

- **subliminal > toasts > bucketNotFound**
  - **en:** Storage bucket 'subliminal-tracks' not found.
  - **pt-BR:** Bucket de armazenamento 'subliminal-tracks' não encontrado.
  - **es-419:** Bucket de almacenamiento 'subliminal-tracks' no encontrado.

- **subliminal > toasts > storagePermissionDenied**
  - **en:** Storage permission denied. Please contact support.
  - **pt-BR:** Permissão de armazenamento negada. Entre em contato com o suporte.
  - **es-419:** Permiso de almacenamiento denegado. Contacta a soporte.

- **subliminal > toasts > bucketSizeLimit**
  - **en:** File is too large ({{size}} MB). The storage bucket has a maximum file size limit (typically 50 MB per file). Please try a shorter track length (current: {{minutes}} minutes).
  - **pt-BR:** O arquivo é muito grande ({{size}} MB). O bucket tem limite máximo de tamanho (geralmente 50 MB por arquivo). Tente uma faixa mais curta (atual: {{minutes}} minutos).
  - **es-419:** El archivo es muy grande ({{size}} MB). El bucket tiene un límite máximo (típicamente 50 MB por archivo). Prueba con una pista más corta (actual: {{minutes}} minutos).

- **subliminal > toasts > tierStorageLimit**
  - **en:** File is too large ({{size}} MB). You have {{remaining}} MB remaining. Please try a shorter track length (current: {{minutes}} minutes).
  - **pt-BR:** O arquivo é muito grande ({{size}} MB). Você tem {{remaining}} MB restantes. Tente uma faixa mais curta (atual: {{minutes}} minutos).
  - **es-419:** El archivo es muy grande ({{size}} MB). Te quedan {{remaining}} MB. Prueba con una pista más corta (actual: {{minutes}} minutos).

- **subliminal > toasts > uploadFailed**
  - **en:** Failed to upload file.
  - **pt-BR:** Falha ao enviar o arquivo.
  - **es-419:** No se pudo subir el archivo.

- **subliminal > toasts > loginAgain**
  - **en:** Session expired. Please log in again.
  - **pt-BR:** Sessão expirada. Faça login novamente.
  - **es-419:** Sesión expirada. Inicia sesión de nuevo.

- **subliminal > toasts > sessionMismatch**
  - **en:** Session mismatch detected. Please refresh the page and try again.
  - **pt-BR:** Incompatibilidade de sessão detectada. Atualize a página e tente novamente.
  - **es-419:** Se detectó un desajuste de sesión. Actualiza la página e inténtalo de nuevo.

- **subliminal > toasts > trackGenerated**
  - **en:** Subliminal track "{{name}}" generated and saved!
  - **pt-BR:** Faixa subliminar "{{name}}" gerada e salva!
  - **es-419:** ¡Pista subliminal "{{name}}" generada y guardada!

- **subliminal > toasts > generateTrackFailed**
  - **en:** Failed to generate track. Please try again.
  - **pt-BR:** Falha ao gerar a faixa. Tente novamente.
  - **es-419:** No se pudo generar la pista. Inténtalo de nuevo.

- **subliminal > toasts > selectAffirmationSetFirst**
  - **en:** Please select an affirmation set first
  - **pt-BR:** Selecione um conjunto de afirmações primeiro
  - **es-419:** Selecciona un set de afirmaciones primero

- **subliminal > toasts > trackGeneratedSaved**
  - **en:** Track "{{name}}" generated and saved!
  - **pt-BR:** Faixa "{{name}}" gerada e salva!
  - **es-419:** ¡Pista "{{name}}" generada y guardada!

- **subliminal > toasts > loadTrackFailed**
  - **en:** Failed to load track. Please try again.
  - **pt-BR:** Falha ao carregar a faixa. Tente novamente.
  - **es-419:** No se pudo cargar la pista. Inténtalo de nuevo.

- **subliminal > toasts > maxTrackLength**
  - **en:** Maximum track length is {{max}} minutes for your tier. Upgrade to access longer tracks.
  - **pt-BR:** A duração máxima da faixa é {{max}} minutos para o seu plano. Faça upgrade para faixas mais longas.
  - **es-419:** La duración máxima de pista es {{max}} minutos para tu plan. Mejora tu plan para pistas más largas.

- **subliminal > toasts > generationTimeout**
  - **en:** Track generation timed out. Please try again with a shorter duration.
  - **pt-BR:** A geração da faixa expirou. Tente novamente com uma duração menor.
  - **es-419:** La generación de la pista expiró. Inténtalo de nuevo con una duración más corta.

- **subliminal > toasts > sessionVerificationFailed**
  - **en:** Session verification failed. Please log in again.
  - **pt-BR:** Falha na verificação da sessão. Faça login novamente.
  - **es-419:** Falló la verificación de sesión. Inicia sesión de nuevo.

- **subliminal > toasts > loginToGenerateTracks**
  - **en:** You must be logged in to generate tracks. Please refresh the page and try again.
  - **pt-BR:** Você precisa estar logado para gerar faixas. Atualize a página e tente novamente.
  - **es-419:** Debes iniciar sesión para generar pistas. Actualiza la página e inténtalo de nuevo.

- **subliminal > toasts > serverError**
  - **en:** Server error ({{status}}).
  - **pt-BR:** Erro do servidor ({{status}}).
  - **es-419:** Error del servidor ({{status}}).

- **subliminal > toasts > unknownError**
  - **en:** Unknown error
  - **pt-BR:** Erro desconhecido
  - **es-419:** Error desconocido

- **mirror > pageTitle**
  - **en:** Mirror Work | Palette Plotting
  - **pt-BR:** Trabalho com espelho | Palette Plotting
  - **es-419:** Trabajo con espejo | Palette Plotting

- **mirror > metaDescription**
  - **en:** Mirror Work — turn on your camera and practice confident affirmations.
  - **pt-BR:** Trabalho com espelho — ligue sua câmera e pratique afirmações com confiança.
  - **es-419:** Trabajo con espejo — enciende tu cámara y practica afirmaciones con confianza.

- **mirror > metaDescriptionWeb**
  - **en:** Mirror camera view. Turn on your camera and practice confident affirmations.
  - **pt-BR:** Visualização de câmera espelho. Ligue sua câmera e pratique afirmações com confiança.
  - **es-419:** Vista de cámara tipo espejo. Enciende tu cámara y practica afirmaciones con confianza.

- **mirror > title**
  - **en:** Mirror Work
  - **pt-BR:** Trabalho com espelho
  - **es-419:** Trabajo con espejo

- **mirror > subtitle**
  - **en:** Practice affirmations with your reflection
  - **pt-BR:** Pratique afirmações com seu reflexo
  - **es-419:** Practica afirmaciones con tu reflejo

- **mirror > bestInApp**
  - **en:** Best experienced in app.
  - **pt-BR:** Melhor experiência no app.
  - **es-419:** Mejor experiencia en la app.

- **mirror > seeYourself**
  - **en:** See Yourself
  - **pt-BR:** Veja-se
  - **es-419:** Mírate

- **mirror > stop**
  - **en:** Stop
  - **pt-BR:** Parar
  - **es-419:** Detener

- **mirror > affirmationSet**
  - **en:** Affirmation Set
  - **pt-BR:** Conjunto de afirmações
  - **es-419:** Set de afirmaciones

- **mirror > scenes**
  - **en:** Scenes
  - **pt-BR:** Cenas
  - **es-419:** Escenas

- **mirror > feedback**
  - **en:** Feedback
  - **pt-BR:** Feedback
  - **es-419:** Retroalimentación

- **mirror > enable**
  - **en:** Enable
  - **pt-BR:** Ativar
  - **es-419:** Activar

- **mirror > displaySpeed**
  - **en:** Display Speed
  - **pt-BR:** Velocidade de exibição
  - **es-419:** Velocidad de visualización

- **mirror > selectPlaceholder**
  - **en:** Select
  - **pt-BR:** Selecionar
  - **es-419:** Seleccionar

- **mirror > noSetsAvailable**
  - **en:** No sets available
  - **pt-BR:** Nenhum conjunto disponível
  - **es-419:** No hay sets disponibles

- **mirror > initializingCamera**
  - **en:** Initializing camera...
  - **pt-BR:** Iniciando câmera...
  - **es-419:** Iniciando cámara...

- **mirror > scenesOptions > none**
  - **en:** None
  - **pt-BR:** Nenhuma
  - **es-419:** Ninguna

- **mirror > scenesOptions > hearts**
  - **en:** Hearts
  - **pt-BR:** Corações
  - **es-419:** Corazones

- **mirror > scenesOptions > coins**
  - **en:** Coins
  - **pt-BR:** Moedas
  - **es-419:** Monedas

- **mirror > scenesOptions > naturePark**
  - **en:** Nature Park
  - **pt-BR:** Parque natural
  - **es-419:** Parque natural

- **mirror > scenesOptions > rain**
  - **en:** Rain
  - **pt-BR:** Chuva
  - **es-419:** Lluvia

- **mirror > scenesOptions > summit**
  - **en:** Summit
  - **pt-BR:** Cume
  - **es-419:** Cumbre

- **mirror > errors > httpsRequired**
  - **en:** Camera access requires a secure connection (HTTPS). Please use HTTPS or localhost.
  - **pt-BR:** O acesso à câmera requer uma conexão segura (HTTPS). Use HTTPS ou localhost.
  - **es-419:** El acceso a la cámara requiere una conexión segura (HTTPS). Usa HTTPS o localhost.

- **mirror > errors > notSupported**
  - **en:** Camera access is not supported on this device or browser. Please use a modern browser like Chrome, Safari, or Firefox.
  - **pt-BR:** O acesso à câmera não é compatível com este dispositivo ou navegador. Use um navegador moderno como Chrome, Safari ou Firefox.
  - **es-419:** El acceso a la cámara no es compatible con este dispositivo o navegador. Usa un navegador moderno como Chrome, Safari o Firefox.

- **mirror > errors > permissionDeniedSafari**
  - **en:** Camera permission denied. Please enable it in Settings > Safari > Camera.
  - **pt-BR:** Permissão de câmera negada. Ative em Ajustes > Safari > Câmera.
  - **es-419:** Permiso de cámara denegado. Actívalo en Ajustes > Safari > Cámara.

- **mirror > errors > permissionDeniedNative**
  - **en:** Camera permission denied. Please enable it in Settings > Palette Plotting > Camera.
  - **pt-BR:** Permissão de câmera negada. Ative em Ajustes > Palette Plotting > Câmera.
  - **es-419:** Permiso de cámara denegado. Actívalo en Ajustes > Palette Plotting > Cámara.

- **mirror > errors > noVideoTrack**
  - **en:** No video track available from camera.
  - **pt-BR:** Nenhuma faixa de vídeo disponível na câmera.
  - **es-419:** No hay pista de video disponible en la cámara.

- **mirror > errors > unableAccess**
  - **en:** Unable to access camera.
  - **pt-BR:** Não foi possível acessar a câmera.
  - **es-419:** No se puede acceder a la cámara.

- **mirror > errors > unableAccessAllow**
  - **en:** Unable to access camera. Please allow camera permissions.
  - **pt-BR:** Não foi possível acessar a câmera. Permita o acesso à câmera.
  - **es-419:** No se puede acceder a la cámara. Permite el acceso a la cámara.

- **mirror > errors > permissionDeniedIosSafari**
  - **en:** Camera permission denied. Tap 'Allow' when prompted, or go to Settings > Safari > Camera and enable it for this site.
  - **pt-BR:** Permissão de câmera negada. Toque em "Permitir" quando solicitado, ou vá em Ajustes > Safari > Câmera e ative para este site.
  - **es-419:** Permiso de cámara denegado. Toca "Permitir" cuando aparezca el aviso, o ve a Ajustes > Safari > Cámara y actívalo para este sitio.

- **mirror > errors > permissionDeniedIosNative**
  - **en:** Camera permission denied. Tap 'Allow' when prompted, or go to Settings > Palette Plotting > Camera.
  - **pt-BR:** Permissão de câmera negada. Toque em "Permitir" quando solicitado, ou vá em Ajustes > Palette Plotting > Câmera.
  - **es-419:** Permiso de cámara denegado. Toca "Permitir" cuando aparezca el aviso, o ve a Ajustes > Palette Plotting > Cámara.

- **mirror > errors > permissionDeniedBrowser**
  - **en:** Camera permission denied. Please enable it in your browser settings.
  - **pt-BR:** Permissão de câmera negada. Ative nas configurações do navegador.
  - **es-419:** Permiso de cámara denegado. Actívalo en la configuración de tu navegador.

- **mirror > errors > noCameraFound**
  - **en:** No camera found on this device.
  - **pt-BR:** Nenhuma câmera encontrada neste dispositivo.
  - **es-419:** No se encontró cámara en este dispositivo.

- **mirror > errors > cameraInUse**
  - **en:** Camera is being used by another application. Please close other apps using the camera.
  - **pt-BR:** A câmera está sendo usada por outro aplicativo. Feche outros apps que usam a câmera.
  - **es-419:** La cámara está en uso por otra aplicación. Cierra otras apps que usen la cámara.

- **mirror > errors > securityBlocked**
  - **en:** Camera access blocked for security reasons. Please ensure you're using HTTPS or localhost.
  - **pt-BR:** Acesso à câmera bloqueado por segurança. Certifique-se de usar HTTPS ou localhost.
  - **es-419:** Acceso a la cámara bloqueado por seguridad. Asegúrate de usar HTTPS o localhost.

- **mirror > errors > apiNotAvailable**
  - **en:** Camera API not available. Please use a modern browser that supports camera access.
  - **pt-BR:** A API de câmera não está disponível. Use um navegador moderno que suporte acesso à câmera.
  - **es-419:** La API de cámara no está disponible. Usa un navegador moderno que admita acceso a la cámara.

- **mirror > errors > checkDeviceSettings**
  - **en:** Unable to access camera. Please check your device settings.
  - **pt-BR:** Não foi possível acessar a câmera. Verifique as configurações do dispositivo.
  - **es-419:** No se puede acceder a la cámara. Revisa la configuración de tu dispositivo.

- **mirror > errors > cameraOffAndroid**
  - **en:** Camera is turned off for Palette Plotting. Open Settings → Apps → Palette Plotting → Permissions → Camera → Allow, then try again.
  - **pt-BR:** A câmera está desativada para o Palette Plotting. Abra Configurações → Apps → Palette Plotting → Permissões → Câmera → Permitir e tente novamente.
  - **es-419:** La cámara está desactivada para Palette Plotting. Abre Ajustes → Apps → Palette Plotting → Permisos → Cámara → Permitir e inténtalo de nuevo.

- **mirror > errors > permissionDeniedAndroid**
  - **en:** Camera permission denied. Open Settings → Apps → Palette Plotting → Permissions → Camera → Allow, then return here and tap Start again.
  - **pt-BR:** Permissão de câmera negada. Abra Configurações → Apps → Palette Plotting → Permissões → Câmera → Permitir, volte aqui e toque em Iniciar novamente.
  - **es-419:** Permiso de cámara denegado. Abre Ajustes → Apps → Palette Plotting → Permisos → Cámara → Permitir, regresa aquí y toca Iniciar de nuevo.

- **mirror > permissionHints > native**
  - **en:** If the prompt didn't appear, go to Settings → Palette Plotting → Camera and enable it.
  - **pt-BR:** Se o aviso não apareceu, vá em Ajustes → Palette Plotting → Câmera e ative.
  - **es-419:** Si no apareció el aviso, ve a Ajustes → Palette Plotting → Cámara y actívalo.

- **mirror > permissionHints > safari**
  - **en:** If the prompt didn't appear, go to Settings → Safari → Camera and enable it for this site.
  - **pt-BR:** Se o aviso não apareceu, vá em Ajustes → Safari → Câmera e ative para este site.
  - **es-419:** Si no apareció el aviso, ve a Ajustes → Safari → Cámara y actívalo para este sitio.

- **mirror > feedbackMessages > low (line 1)**
  - **en:** A little louder!
  - **pt-BR:** Um pouco mais alto!
  - **es-419:** ¡Un poco más fuerte!

- **mirror > feedbackMessages > low (line 2)**
  - **en:** Speak it into existence!
  - **pt-BR:** Fale para manifestar!
  - **es-419:** ¡Hazlo realidad!

- **mirror > feedbackMessages > low (line 3)**
  - **en:** Speak Up!
  - **pt-BR:** Fale mais alto!
  - **es-419:** ¡Levanta la voz!

- **mirror > feedbackMessages > low (line 4)**
  - **en:** Affirm it!
  - **pt-BR:** Afirme!
  - **es-419:** ¡Afírmalo!

- **mirror > feedbackMessages > mid (line 1)**
  - **en:** That's better.
  - **pt-BR:** Assim está melhor.
  - **es-419:** Así está mejor.

- **mirror > feedbackMessages > mid (line 2)**
  - **en:** Keep going!
  - **pt-BR:** Continue!
  - **es-419:** ¡Sigue!

- **mirror > feedbackMessages > mid (line 3)**
  - **en:** You can do it!
  - **pt-BR:** Você consegue!
  - **es-419:** ¡Tú puedes!

- **mirror > feedbackMessages > mid (line 4)**
  - **en:** You've got this!
  - **pt-BR:** Você tem isso!
  - **es-419:** ¡Tú lo logras!

- **mirror > feedbackMessages > high (line 1)**
  - **en:** That's it.
  - **pt-BR:** É isso.
  - **es-419:** Eso es.

- **mirror > feedbackMessages > high (line 2)**
  - **en:** Perfect!
  - **pt-BR:** Perfeito!
  - **es-419:** ¡Perfecto!

- **mirror > feedbackMessages > high (line 3)**
  - **en:** Great energy!
  - **pt-BR:** Ótima energia!
  - **es-419:** ¡Gran energía!

- **mirror > feedbackMessages > high (line 4)**
  - **en:** Carry that forward.
  - **pt-BR:** Leve isso adiante.
  - **es-419:** Llévalo contigo.

## Report issue & support inbox

Namespace: `support`

- **pageTitle**
  - **en:** Help Request
  - **pt-BR:** Pedido de ajuda
  - **es-419:** Solicitud de ayuda

- **supportInbox**
  - **en:** Support Inbox
  - **pt-BR:** Caixa de suporte
  - **es-419:** Bandeja de soporte

- **tabs > create**
  - **en:** Help Me Create
  - **pt-BR:** Ajude-me a criar
  - **es-419:** Ayúdame a crear

- **tabs > support**
  - **en:** App Support & Feedback
  - **pt-BR:** Suporte do app
  - **es-419:** Soporte de app

- **tabs > inbox**
  - **en:** Inbox
  - **pt-BR:** Caixa de entrada
  - **es-419:** Bandeja de entrada

- **create > intro**
  - **en:** Share only what feels relevant. Palette Plotting will turn this into app-ready prompts, affirmations, or a routine.
  - **pt-BR:** Compartilhe só o relevante. Palette Plotting cria prompts, afirmações ou rotina.
  - **es-419:** Comparte solo lo relevante. Palette Plotting crea prompts, afirmaciones o rutina.

- **create > successTitle**
  - **en:** Submitted.
  - **pt-BR:** Enviado.
  - **es-419:** Enviado.

- **create > successBody**
  - **en:** We'll reply by email. If you need something urgently, you can also email
  - **pt-BR:** Responderemos por e-mail. Urgente? Escreva para
  - **es-419:** Responderemos por correo. ¿Urgente? Escribe a

- **create > successBodySuffix**
  - **en:** .
  - **pt-BR:** .
  - **es-419:** .

- **create > backToDashboard**
  - **en:** Back to dashboard
  - **pt-BR:** Voltar ao painel
  - **es-419:** Volver al panel

- **create > submitAnother**
  - **en:** Submit another
  - **pt-BR:** Enviar outro
  - **es-419:** Enviar otro

- **create > focusLabel**
  - **en:** What are you manifesting right now?
  - **pt-BR:** O que você está manifestando agora?
  - **es-419:** ¿Qué estás manifestando ahora?

- **create > focusPlaceholder**
  - **en:** Let us know what you are manifesting and what difficulties you're facing.
  - **pt-BR:** Conte o que você está manifestando e quais dificuldades está enfrentando.
  - **es-419:** Cuéntanos qué estás manifestando y qué dificultades enfrentas.

- **create > helpTypeLabel**
  - **en:** What do you need help with?
  - **pt-BR:** Com o que você precisa de ajuda?
  - **es-419:** ¿Con qué necesitas ayuda?

- **create > chooseOne**
  - **en:** Choose one
  - **pt-BR:** Escolha uma opção
  - **es-419:** Elige una opción

- **create > footer**
  - **en:** Please submit what feels most relevant. Palette Plotting will aim to reply within 24 to 48 hours of your request. You may also reach out to us at support@paletteplot.com.
  - **pt-BR:** Envie o que parecer mais relevante. A Palette Plotting tentará responder em 24 a 48 horas. Você também pode nos contatar em support@paletteplot.com.
  - **es-419:** Envía lo que sientas más relevante. Palette Plotting intentará responder en 24 a 48 horas. También puedes escribirnos a support@paletteplot.com.

- **create > submit**
  - **en:** Submit
  - **pt-BR:** Enviar
  - **es-419:** Enviar

- **create > submitting**
  - **en:** Submitting…
  - **pt-BR:** Enviando…
  - **es-419:** Enviando…

- **createHelpOptions > affirmationsOrScripting**
  - **en:** Affirmations or scripting
  - **pt-BR:** Afirmações ou scripting
  - **es-419:** Afirmaciones o scripting

- **createHelpOptions > strongSubliminal**
  - **en:** Make a strong subliminal
  - **pt-BR:** Criar um subliminar forte
  - **es-419:** Crear un subliminal potente

- **createHelpOptions > mirrorWorkGuidance**
  - **en:** Mirror work guidance
  - **pt-BR:** Guia de espelho
  - **es-419:** Guía de espejo

- **createHelpOptions > buildWeeklyRoutine**
  - **en:** Build a weekly routine
  - **pt-BR:** Montar uma rotina semanal
  - **es-419:** Armar una rutina semanal

- **createHelpOptions > notSureHelpMeChoose**
  - **en:** Not sure — help me choose
  - **pt-BR:** Não sei — me ajude
  - **es-419:** No sé — ayúdame

- **submissionTypes > report**
  - **en:** Report an issue
  - **pt-BR:** Reportar um problema
  - **es-419:** Reportar un problema

- **submissionTypes > aiFlag**
  - **en:** Flag AI-generated content
  - **pt-BR:** Sinalizar conteúdo gerado por IA
  - **es-419:** Marcar contenido generado por IA

- **submissionTypes > featureRequest**
  - **en:** Feature request
  - **pt-BR:** Pedido de recurso
  - **es-419:** Solicitud de función

- **submissionTypes > helpMeCreate**
  - **en:** Help Me Create
  - **pt-BR:** Ajude-me a criar
  - **es-419:** Ayúdame a crear

- **supportForm > successTitle**
  - **en:** Thanks — we received your submission.
  - **pt-BR:** Obrigado — recebemos seu envio.
  - **es-419:** Gracias — recibimos tu envío.

- **supportForm > successBody**
  - **en:** We aim to respond within 24–48 hours. If you need something urgently, you can also email
  - **pt-BR:** Buscamos responder em 24–48 horas. Se precisar de algo com urgência, você também pode escrever para
  - **es-419:** Buscamos responder en 24–48 horas. Si necesitas algo con urgencia, también puedes escribir a

- **supportForm > successBodySuffix**
  - **en:** .
  - **pt-BR:** .
  - **es-419:** .

- **supportForm > submissionTypeLabel**
  - **en:** Submission type
  - **pt-BR:** Tipo de envio
  - **es-419:** Tipo de envío

- **supportForm > toolOrAreaLabel**
  - **en:** Tool or area
  - **pt-BR:** Ferramenta ou área
  - **es-419:** Herramienta o área

- **supportForm > toolPlaceholder**
  - **en:** Where does this apply?
  - **pt-BR:** Onde isso se aplica?
  - **es-419:** ¿Dónde aplica esto?

- **supportForm > purchaseChannelLabel**
  - **en:** Where did you purchase?
  - **pt-BR:** Onde você comprou?
  - **es-419:** ¿Dónde compraste?

- **supportForm > purchaseChannelPlaceholder**
  - **en:** Apple App Store, Google Play, or Web
  - **pt-BR:** Apple App Store, Google Play ou Web
  - **es-419:** Apple App Store, Google Play o Web

- **supportForm > descriptionLabel**
  - **en:** Describe the issue or request
  - **pt-BR:** Descreva o problema ou pedido
  - **es-419:** Describe el problema o la solicitud

- **supportForm > descriptionPlaceholder**
  - **en:** What happened, what should change, or what would help?
  - **pt-BR:** O que aconteceu, o que deveria mudar ou o que ajudaria?
  - **es-419:** ¿Qué pasó, qué debería cambiar o qué ayudaría?

- **supportForm > appleRefundNote**
  - **en:** Apple ultimately controls payments and refunds; however we will try our best to help you.
  - **pt-BR:** A Apple controla pagamentos e reembolsos; mesmo assim faremos o possível para ajudar.
  - **es-419:** Apple controla en última instancia los pagos y reembolsos; aun así haremos lo posible por ayudarte.

- **supportForm > screenshotsLabel**
  - **en:** Screenshots (optional)
  - **pt-BR:** Prints (opcional)
  - **es-419:** Capturas (opcional)

- **supportForm > screenshotsHint**
  - **en:** Up to {{max}} files · HEIC, JPG, PNG, WebP, etc. · max 5 MB each
  - **pt-BR:** Até {{max}} arquivos · HEIC, JPG, PNG, WebP, etc. · máx. 5 MB cada
  - **es-419:** Hasta {{max}} archivos · HEIC, JPG, PNG, WebP, etc. · máx. 5 MB c/u

- **supportForm > chooseFiles**
  - **en:** Choose files
  - **pt-BR:** Escolher arquivos
  - **es-419:** Elegir archivos

- **supportForm > filesSelected_one**
  - **en:** {{count}} file selected
  - **pt-BR:** {{count}} arquivo selecionado
  - **es-419:** {{count}} archivo seleccionado

- **supportForm > filesSelected_other**
  - **en:** {{count}} files selected
  - **pt-BR:** {{count}} arquivos selecionados
  - **es-419:** {{count}} archivos seleccionados

- **supportForm > noFilesSelected**
  - **en:** No files selected
  - **pt-BR:** Nenhum arquivo selecionado
  - **es-419:** Ningún archivo seleccionado

- **supportForm > removeFileAria**
  - **en:** Remove {{name}}
  - **pt-BR:** Remover {{name}}
  - **es-419:** Quitar {{name}}

- **supportForm > contactFooter**
  - **en:** You may also reach out to us at support@paletteplot.com.
  - **pt-BR:** Você também pode nos contatar em support@paletteplot.com.
  - **es-419:** También puedes escribirnos a support@paletteplot.com.

- **inbox > title**
  - **en:** Inbox
  - **pt-BR:** Caixa de entrada
  - **es-419:** Bandeja de entrada

- **inbox > description**
  - **en:** Your submitted requests and replies from Palette Plotting. New requests start on the other tabs.
  - **pt-BR:** Seus pedidos enviados e respostas da Palette Plotting. Novos pedidos começam nas outras abas.
  - **es-419:** Tus solicitudes enviadas y respuestas de Palette Plotting. Las nuevas solicitudes empiezan en las otras pestañas.

- **inbox > refresh**
  - **en:** Refresh
  - **pt-BR:** Atualizar
  - **es-419:** Actualizar

- **inbox > backToRequests**
  - **en:** ← Back to requests
  - **pt-BR:** ← Voltar aos pedidos
  - **es-419:** ← Volver a solicitudes

- **inbox > loading**
  - **en:** Loading…
  - **pt-BR:** Carregando…
  - **es-419:** Cargando…

- **inbox > noMessages**
  - **en:** No messages yet.
  - **pt-BR:** Ainda não há mensagens.
  - **es-419:** Aún no hay mensajes.

- **inbox > senderSupport**
  - **en:** Palette Plotting
  - **pt-BR:** Palette Plotting
  - **es-419:** Palette Plotting

- **inbox > senderYou**
  - **en:** You
  - **pt-BR:** Você
  - **es-419:** Tú

- **inbox > yourReply**
  - **en:** Your reply
  - **pt-BR:** Sua resposta
  - **es-419:** Tu respuesta

- **inbox > replyPlaceholder**
  - **en:** Reply in this conversation…
  - **pt-BR:** Responder nesta conversa…
  - **es-419:** Responder en esta conversación…

- **inbox > sending**
  - **en:** Sending…
  - **pt-BR:** Enviando…
  - **es-419:** Enviando…

- **inbox > sendReply**
  - **en:** Send reply
  - **pt-BR:** Enviar resposta
  - **es-419:** Enviar respuesta

- **inbox > empty**
  - **en:** No requests yet. Submit on Help Me Create or App Support & Feedback — replies will show up here.
  - **pt-BR:** Nenhum pedido ainda. Envie em outras abas; respostas aparecem aqui.
  - **es-419:** Aún no hay solicitudes. Envía en otras pestañas; las respuestas aparecerán aquí.

- **inbox > newReplyAria**
  - **en:** New reply
  - **pt-BR:** Nova resposta
  - **es-419:** Nueva respuesta

- **inbox > supportRepliedPrefix**
  - **en:** Palette Plotting replied · 
  - **pt-BR:** Palette Plotting respondeu · 
  - **es-419:** Palette Plotting respondió · 

- **inbox > submittedPrefix**
  - **en:** Submitted {{when}}
  - **pt-BR:** Enviado {{when}}
  - **es-419:** Enviado {{when}}

- **inbox > todayAt**
  - **en:** Today at {{time}}
  - **pt-BR:** Hoje às {{time}}
  - **es-419:** Hoy a las {{time}}

- **inbox > yesterdayAt**
  - **en:** Yesterday at {{time}}
  - **pt-BR:** Ontem às {{time}}
  - **es-419:** Ayer a las {{time}}

- **inbox > caseTypes > helpMeCreate**
  - **en:** Help Me Create
  - **pt-BR:** Ajude-me a criar
  - **es-419:** Ayúdame a crear

- **inbox > caseTypes > appSupportFeedback**
  - **en:** App Support & Feedback
  - **pt-BR:** Suporte do app
  - **es-419:** Soporte de app

- **inbox > subtypes > request**
  - **en:** Request
  - **pt-BR:** Pedido
  - **es-419:** Solicitud

- **inbox > subtypes > supportRequest**
  - **en:** Support request
  - **pt-BR:** Pedido de suporte
  - **es-419:** Solicitud de soporte

- **toasts > maxAttachments**
  - **en:** You can add up to {{max}} images.
  - **pt-BR:** Você pode adicionar até {{max}} imagens.
  - **es-419:** Puedes agregar hasta {{max}} imágenes.

- **toasts > unsupportedImage**
  - **en:** {{name}} is not a supported image type.
  - **pt-BR:** {{name}} não é um tipo de imagem compatível.
  - **es-419:** {{name}} no es un tipo de imagen compatible.

- **toasts > fileTooLarge**
  - **en:** {{name}} is too large (max 5 MB per file).
  - **pt-BR:** {{name}} é grande demais (máx. 5 MB por arquivo).
  - **es-419:** {{name}} es demasiado grande (máx. 5 MB por archivo).

- **toasts > chooseSubmissionType**
  - **en:** Please choose a submission type.
  - **pt-BR:** Escolha um tipo de envio.
  - **es-419:** Elige un tipo de envío.

- **toasts > chooseToolOrArea**
  - **en:** Please choose where this applies.
  - **pt-BR:** Escolha onde isso se aplica.
  - **es-419:** Elige dónde aplica esto.

- **toasts > choosePurchaseChannel**
  - **en:** Please select where you purchased (Apple App Store, Google Play, or Web).
  - **pt-BR:** Selecione onde você comprou (Apple App Store, Google Play ou Web).
  - **es-419:** Selecciona dónde compraste (Apple App Store, Google Play o Web).

- **toasts > descriptionMinLength**
  - **en:** Please enter at least {{min}} characters in the description.
  - **pt-BR:** Digite pelo menos {{min}} caracteres na descrição.
  - **es-419:** Escribe al menos {{min}} caracteres en la descripción.

- **toasts > uploadFailed**
  - **en:** Image upload failed
  - **pt-BR:** Falha ao enviar a imagem
  - **es-419:** Error al subir la imagen

- **toasts > requestFailed**
  - **en:** Request failed
  - **pt-BR:** Falha na solicitação
  - **es-419:** La solicitud falló

- **toasts > submitted**
  - **en:** Submitted
  - **pt-BR:** Enviado
  - **es-419:** Enviado

- **toasts > shareManifestationFocus**
  - **en:** Please share what you're trying to manifest or shift.
  - **pt-BR:** Compartilhe o que você está tentando manifestar ou mudar.
  - **es-419:** Comparte qué estás intentando manifestar o cambiar.

- **toasts > chooseHelpType**
  - **en:** Please choose what you need help with.
  - **pt-BR:** Escolha com o que você precisa de ajuda.
  - **es-419:** Elige con qué necesitas ayuda.

- **toasts > addMoreDetail**
  - **en:** Please add a bit more detail.
  - **pt-BR:** Adicione um pouco mais de detalhe.
  - **es-419:** Agrega un poco más de detalle.

- **toasts > loadInboxFailed**
  - **en:** Could not load inbox.
  - **pt-BR:** Não foi possível carregar a caixa de entrada.
  - **es-419:** No se pudo cargar la bandeja.

- **toasts > loadConversationFailed**
  - **en:** Could not load conversation.
  - **pt-BR:** Não foi possível carregar a conversa.
  - **es-419:** No se pudo cargar la conversación.

- **toasts > replySent**
  - **en:** Reply sent
  - **pt-BR:** Resposta enviada
  - **es-419:** Respuesta enviada

- **toasts > sendReplyFailed**
  - **en:** Could not send reply.
  - **pt-BR:** Não foi possível enviar a resposta.
  - **es-419:** No se pudo enviar la respuesta.

## FAQ, contact & pricing

Namespace: `marketing`

- **pricing > title**
  - **en:** Pricing
  - **pt-BR:** Preços
  - **es-419:** Precios

- **pricing > subtitle**
  - **en:** One membership with full access to every Palette Plotting tool on web and mobile.
  - **pt-BR:** Uma assinatura com acesso total na web e no app.
  - **es-419:** Una membresía con acceso total en web y app.

- **pricing > planHeader**
  - **en:** Plan
  - **pt-BR:** Plano
  - **es-419:** Plan

- **pricing > priceHeader**
  - **en:** Price
  - **pt-BR:** Preço
  - **es-419:** Precio

- **pricing > plans > weekly > label**
  - **en:** Weekly
  - **pt-BR:** Semanal
  - **es-419:** Semanal

- **pricing > plans > weekly > cadence**
  - **en:** per week
  - **pt-BR:** por semana
  - **es-419:** por semana

- **pricing > plans > monthly > label**
  - **en:** Monthly
  - **pt-BR:** Mensal
  - **es-419:** Mensual

- **pricing > plans > monthly > cadence**
  - **en:** per month
  - **pt-BR:** por mês
  - **es-419:** por mes

- **pricing > plans > annual > label**
  - **en:** Annual
  - **pt-BR:** Anual
  - **es-419:** Anual

- **pricing > plans > annual > cadence**
  - **en:** per year
  - **pt-BR:** por ano
  - **es-419:** por año

- **pricing > prices > weekly**
  - **en:** $5.99
  - **pt-BR:** $5.99
  - **es-419:** $5.99

- **pricing > prices > monthly**
  - **en:** $19.99
  - **pt-BR:** $19.99
  - **es-419:** $19.99

- **pricing > prices > annual**
  - **en:** $149.99
  - **pt-BR:** $149.99
  - **es-419:** $149.99

- **pricing > pricesSubjectToChange**
  - **en:** Prices subject to change.
  - **pt-BR:** Preços podem mudar.
  - **es-419:** Los precios pueden cambiar.

- **pricing > legalPrefix**
  - **en:** See our
  - **pt-BR:** Veja nossa
  - **es-419:** Consulta nuestra

- **pricing > billingPolicy**
  - **en:** Billing & Refund Policy
  - **pt-BR:** Pagamentos e reembolsos
  - **es-419:** Pagos y reembolsos

- **pricing > legalAnd**
  - **en:** and
  - **pt-BR:** e os
  - **es-419:** y los

- **pricing > termsOfService**
  - **en:** Terms of Service
  - **pt-BR:** Termos de serviço
  - **es-419:** Términos de servicio

- **pricing > whatsIncluded**
  - **en:** What's included
  - **pt-BR:** O que está incluído
  - **es-419:** Qué incluye

- **pricing > features > subliminal > title**
  - **en:** Subliminal Maker
  - **pt-BR:** Criador de subliminares
  - **es-419:** Creador de subliminales

- **pricing > features > subliminal > description**
  - **en:** Make subliminals with your own voice, binaural beats, background sounds, and layered vocals.
  - **pt-BR:** Crie subliminares com sua própria voz, batidas binaurais, sons de fundo e vocais em camadas.
  - **es-419:** Crea subliminales con tu propia voz, beats binaurales, sonidos de fondo y voces en capas.

- **pricing > features > mirror > title**
  - **en:** Mirror Work
  - **pt-BR:** Espelho
  - **es-419:** Espejo

- **pricing > features > mirror > description**
  - **en:** Immerse yourself into digital mirror work's scenes and sounds, as you build self-concept with your affirmations.
  - **pt-BR:** Mergulhe em cenas e sons de trabalho com espelho digital enquanto fortalece seu autoconceito com suas afirmações.
  - **es-419:** Sumérgete en escenas y sonidos de trabajo con espejo digital mientras fortaleces tu autoconcepto con tus afirmaciones.

- **pricing > features > affirmations > title**
  - **en:** Robotic Affirm & Script Your Life
  - **pt-BR:** Afirmar e escrever
  - **es-419:** Afirmar y escribir

- **pricing > features > affirmations > description**
  - **en:** Have your custom affirmations shown on a teleprompter-like screen, count your reps, and visualize.
  - **pt-BR:** Mostre suas afirmações personalizadas em uma tela tipo teleprompter, conte suas repetições e visualize.
  - **es-419:** Muestra tus afirmaciones personalizadas en una pantalla tipo teleprompter, cuenta tus repeticiones y visualiza.

- **pricing > features > beliefs > title**
  - **en:** Address Self-Limiting Beliefs
  - **pt-BR:** Abordar crenças limitantes
  - **es-419:** Aborda creencias limitantes

- **pricing > features > beliefs > description**
  - **en:** Deconstruct self-limiting beliefs and integrate expansionary beliefs.
  - **pt-BR:** Desconstrua crenças limitantes e integre crenças expansivas.
  - **es-419:** Desconstruye creencias limitantes e integra creencias expansivas.

- **pricing > features > journal > title**
  - **en:** Journal & Track
  - **pt-BR:** Diário e progresso
  - **es-419:** Diario y progreso

- **pricing > features > journal > description**
  - **en:** Journal, document inspired action, and track your progress with manifesting lists.
  - **pt-BR:** Diário, ações inspiradas e listas de manifestação.
  - **es-419:** Diario, acciones inspiradas y listas de manifestación.

- **pricing > features > coach > title**
  - **en:** Digital Manifesting Coach
  - **pt-BR:** Coach digital de manifestação
  - **es-419:** Coach digital de manifestación

- **pricing > features > coach > description**
  - **en:** Ask questions you're scared to ask anyone else, and get advice when you're wavering due to 3D circumstances.
  - **pt-BR:** Pergunte o que teme dizer e receba apoio quando o 3D pesar.
  - **es-419:** Pregunta lo que temes decir y recibe apoyo cuando el 3D pese.

- **contact > title**
  - **en:** Contact Us
  - **pt-BR:** Fale conosco
  - **es-419:** Contáctanos

- **contact > subtitle**
  - **en:** We'd love to hear from you. Send us an email and we'll respond as soon as possible.
  - **pt-BR:** Gostaríamos de ouvir de você. Envie um e-mail e responderemos o mais rápido possível.
  - **es-419:** Nos encantaría saber de ti. Envíanos un correo y responderemos lo antes posible.

- **contact > getInTouch**
  - **en:** Get in Touch
  - **pt-BR:** Entre em contato
  - **es-419:** Ponte en contacto

- **contact > email**
  - **en:** Email
  - **pt-BR:** E-mail
  - **es-419:** Correo

- **contact > phone**
  - **en:** Phone
  - **pt-BR:** Telefone
  - **es-419:** Teléfono

- **contact > address**
  - **en:** Address
  - **pt-BR:** Endereço
  - **es-419:** Dirección

- **contact > addressLine1**
  - **en:** 1 North State Street Ste 1500
  - **pt-BR:** 1 North State Street Ste 1500
  - **es-419:** 1 North State Street Ste 1500

- **contact > addressLine2**
  - **en:** Chicago, IL 60602
  - **pt-BR:** Chicago, IL 60602
  - **es-419:** Chicago, IL 60602

- **faq > title**
  - **en:** Frequently Asked Questions
  - **pt-BR:** Perguntas frequentes
  - **es-419:** Preguntas frecuentes

- **faq > subtitle**
  - **en:** Find answers to common questions about Palette Plotting
  - **pt-BR:** Respostas sobre Palette Plotting
  - **es-419:** Respuestas sobre Palette Plotting

- **faq > items > whatIs > question**
  - **en:** What is Palette Plotting?
  - **pt-BR:** O que é o Palette Plotting?
  - **es-419:** ¿Qué es Palette Plotting?

- **faq > items > whatIs > answer**
  - **en:** Palette Plotting is a digital personal growth platform that helps you build momentum, reflect through journaling, create audio-based tools, explore mindset patterns, and work with guided suggestions designed for clarity and progress. For a concise tour of each tool in the context of manifestation practice, read What is Palette Plotting?.
  - **pt-BR:** O Palette Plotting é uma plataforma digital de crescimento pessoal que ajuda você a ganhar impulso, refletir por meio do diário, criar ferramentas em áudio, explorar padrões de mentalidade e usar orientações guiadas para ter mais clareza e progresso. Para uma visão geral rápida de cada ferramenta no contexto da prática de manifestação, leia O que é o Palette Plotting?.
  - **es-419:** Palette Plotting es una plataforma digital de crecimiento personal que te ayuda a ganar impulso, reflexionar con un diario, crear herramientas de audio, explorar patrones de mentalidad y trabajar con sugerencias guiadas diseñadas para claridad y progreso. Para un recorrido breve de cada herramienta en el contexto de la práctica de manifestación, lee ¿Qué es Palette Plotting?.

- **faq > items > whatIs > linkWhatIs**
  - **en:** What is Palette Plotting?
  - **pt-BR:** O que é o Palette Plotting?
  - **es-419:** ¿Qué es Palette Plotting?

- **faq > items > notTherapy > question**
  - **en:** Is Palette Plotting therapy or medical support?
  - **pt-BR:** O Palette Plotting é terapia ou suporte médico?
  - **es-419:** ¿Palette Plotting es terapia o apoyo médico?

- **faq > items > notTherapy > answer**
  - **en:** No. Palette Plotting is not a provider of mental-health, medical, psychological, legal, or financial advice. If you need clinical or emergency support, contact appropriate services.
  - **pt-BR:** Não. Palette Plotting não oferece aconselhamento médico, psicológico, legal ou financeiro. Em emergência, procure serviços adequados.
  - **es-419:** No. Palette Plotting no ofrece asesoramiento médico, psicológico, legal ni financiero. En emergencia, contacta servicios adecuados.

- **faq > items > whoCanUse > question**
  - **en:** Who can use Palette Plotting?
  - **pt-BR:** Quem pode usar o Palette Plotting?
  - **es-419:** ¿Quién puede usar Palette Plotting?

- **faq > items > whoCanUse > answer**
  - **en:** Users must be 18 years or older.
  - **pt-BR:** Os usuários devem ter 18 anos ou mais.
  - **es-419:** Los usuarios deben tener 18 años o más.

- **faq > items > automated > question**
  - **en:** Does Palette Plotting use automated features?
  - **pt-BR:** O Palette Plotting usa recursos automatizados?
  - **es-419:** ¿Palette Plotting usa funciones automatizadas?

- **faq > items > automated > answer**
  - **en:** Some features may use automated or system-generated responses to support your reflection, prompts, or audio creation. These are supplemental tools, not professional advice.
  - **pt-BR:** Alguns recursos usam respostas automáticas para reflexão, prompts ou áudio. São ferramentas extras, não aconselhamento profissional.
  - **es-419:** Algunas funciones usan respuestas automáticas para reflexión, prompts o audio. Son herramientas extra, no asesoramiento profesional.

- **faq > items > privacy > question**
  - **en:** Is my content private?
  - **pt-BR:** Meu conteúdo é privado?
  - **es-419:** ¿Mi contenido es privado?

- **faq > items > privacy > answer**
  - **en:** Yes. Your journals, reflections, audio creations, and notes are private.
  - **pt-BR:** Sim. Seus diários, reflexões, criações de áudio e notas são privados.
  - **es-419:** Sí. Tus diarios, reflexiones, creaciones de audio y notas son privados.

- **faq > items > plans > question**
  - **en:** What subscription plans are available?
  - **pt-BR:** Quais planos de assinatura estão disponíveis?
  - **es-419:** ¿Qué planes de suscripción hay disponibles?

- **faq > items > plans > answer**
  - **en:** Palette Plotting offers monthly and annual subscription options. Refunds for iOS in-app purchases are at Apple's discretion. Refunds for all non-Apple purchases are at Palette Plotting's discretion. See Billing & Refund Policy for details.
  - **pt-BR:** Palette Plotting oferece planos mensal e anual. Reembolsos de compras iOS ficam com a Apple; outros, com Palette Plotting. Veja a política de reembolsos.
  - **es-419:** Palette Plotting ofrece planes mensual y anual. Reembolsos de compras iOS dependen de Apple; otros, de Palette Plotting. Consulta la política de reembolsos.

- **faq > items > plans > linkBilling**
  - **en:** Billing & Refund Policy
  - **pt-BR:** Pagamentos e reembolsos
  - **es-419:** Pagos y reembolsos

- **faq > items > cancel > question**
  - **en:** Can I cancel my subscription?
  - **pt-BR:** Posso cancelar minha assinatura?
  - **es-419:** ¿Puedo cancelar mi suscripción?

- **faq > items > cancel > answer**
  - **en:** Yes. You may cancel anytime through your account settings. Your plan remains active until the end of the billing period.
  - **pt-BR:** Sim. Cancele quando quiser nas configurações. Seu plano fica ativo até o fim do período.
  - **es-419:** Sí. Cancela cuando quieras en ajustes. Tu plan sigue activo hasta el fin del período.

- **faq > items > sellData > question**
  - **en:** Will you sell my information?
  - **pt-BR:** Vocês venderão minhas informações?
  - **es-419:** ¿Venderán mi información?

- **faq > items > sellData > answer**
  - **en:** No. We do not sell your personal data.
  - **pt-BR:** Não. Não vendemos seus dados pessoais.
  - **es-419:** No. No vendemos tus datos personales.

- **faq > items > deleteAccount > question**
  - **en:** How do I delete my account?
  - **pt-BR:** Como excluo minha conta?
  - **es-419:** ¿Cómo elimino mi cuenta?

- **faq > items > deleteAccount > answer**
  - **en:** You may request deletion through the app or by contacting: support@paletteplot.com
  - **pt-BR:** Você pode solicitar a exclusão pelo app ou entrando em contato: support@paletteplot.com
  - **es-419:** Puedes solicitar la eliminación desde la app o contactando a: support@paletteplot.com

- **faq > items > acceptableUse > question**
  - **en:** What happens if I violate the Acceptable Use Policy?
  - **pt-BR:** O que acontece se eu violar a Política de uso aceitável?
  - **es-419:** ¿Qué pasa si violo la Política de uso aceptable?

- **faq > items > acceptableUse > answer**
  - **en:** We may limit or suspend your access to maintain a safe and respectful environment.
  - **pt-BR:** Podemos limitar ou suspender seu acesso para manter um ambiente seguro e respeitoso.
  - **es-419:** Podemos limitar o suspender tu acceso para mantener un entorno seguro y respetuoso.

- **faq > items > legalTerms > question**
  - **en:** Where can I read the legal terms?
  - **pt-BR:** Onde posso ler os termos legais?
  - **es-419:** ¿Dónde puedo leer los términos legales?

- **faq > items > legalTerms > answer**
  - **en:** Links to the Terms of Use, Privacy Policy, and Acceptable Use Policy appear in the app and on our website. For copyright concerns, please see our DMCA Notice & Takedown Policy.
  - **pt-BR:** Links para Termos, Privacidade e Uso aceitável aparecem no app e no site. Para copyright, veja a política DMCA.
  - **es-419:** Los enlaces a Términos, Privacidad y Uso aceptable están en la app y el sitio. Para copyright, ve la política DMCA.

- **faq > items > legalTerms > linkTerms**
  - **en:** Terms of Use
  - **pt-BR:** Termos de uso
  - **es-419:** Términos de uso

- **faq > items > legalTerms > linkPrivacy**
  - **en:** Privacy Policy
  - **pt-BR:** Política de privacidade
  - **es-419:** Política de privacidad

- **faq > items > legalTerms > linkAcceptableUse**
  - **en:** Acceptable Use Policy
  - **pt-BR:** Política de uso aceitável
  - **es-419:** Política de uso aceptable

- **faq > items > legalTerms > linkDmca**
  - **en:** DMCA Notice & Takedown Policy
  - **pt-BR:** Política de aviso e remoção DMCA
  - **es-419:** Política de aviso y retiro DMCA

- **home > meta > title**
  - **en:** Home | Palette Plotting
  - **pt-BR:** Início | Palette Plotting
  - **es-419:** Inicio | Palette Plotting

- **home > meta > description**
  - **en:** Palette Plotting helps you create subliminals, affirmations, mirror work, scripting, and manifesting routines in one place.
  - **pt-BR:** O Palette Plotting ajuda você a criar subliminares, afirmações, trabalho com espelho, scripting e rotinas de manifestação em um só lugar.
  - **es-419:** Palette Plotting te ayuda a crear subliminales, afirmaciones, trabajo con espejo, scripting y rutinas de manifestación en un solo lugar.

- **home > meta > ogDescription**
  - **en:** Create subliminals, affirmations, mirror work, scripting, and manifesting routines with Palette Plotting.
  - **pt-BR:** Crie subliminares, afirmações, trabalho com espelho, scripting e rotinas de manifestação com o Palette Plotting.
  - **es-419:** Crea subliminales, afirmaciones, trabajo con espejo, scripting y rutinas de manifestación con Palette Plotting.

- **home > meta > twitterDescription**
  - **en:** Create subliminals, affirmations, mirror work, scripting, and manifesting routines with Palette Plotting.
  - **pt-BR:** Crie subliminares, afirmações, trabalho com espelho, scripting e rotinas de manifestação com o Palette Plotting.
  - **es-419:** Crea subliminales, afirmaciones, trabajo con espejo, scripting y rutinas de manifestación con Palette Plotting.

- **home > header > community**
  - **en:** Community
  - **pt-BR:** Comunidade
  - **es-419:** Comunidad

- **home > header > faq**
  - **en:** FAQ
  - **pt-BR:** FAQ
  - **es-419:** FAQ

- **home > header > blog**
  - **en:** Blog
  - **pt-BR:** Blog
  - **es-419:** Blog

- **home > header > signIn**
  - **en:** Sign in
  - **pt-BR:** Entrar
  - **es-419:** Iniciar sesión

- **home > header > downloadApp**
  - **en:** Download app
  - **pt-BR:** Baixar app
  - **es-419:** Descargar app

- **home > header > yourAccount**
  - **en:** Your Account
  - **pt-BR:** Sua conta
  - **es-419:** Tu cuenta

- **home > header > dashboard**
  - **en:** Dashboard
  - **pt-BR:** Painel
  - **es-419:** Panel

- **home > header > logOut**
  - **en:** Log out
  - **pt-BR:** Sair
  - **es-419:** Cerrar sesión

- **home > header > user**
  - **en:** User
  - **pt-BR:** Usuário
  - **es-419:** Usuario

- **home > header > mainNav**
  - **en:** Main
  - **pt-BR:** Principal
  - **es-419:** Principal

- **home > hero > manifestEverything**
  - **en:** Manifest Everything
  - **pt-BR:** Manifeste tudo
  - **es-419:** Manifiesta todo

- **home > hero > manifestPrefix**
  - **en:** Manifest
  - **pt-BR:** Manifeste
  - **es-419:** Manifiesta

- **home > hero > loveSp**
  - **en:** Love & SP
  - **pt-BR:** amor e SP
  - **es-419:** amor y SP

- **home > hero > abundance**
  - **en:** Abundance
  - **pt-BR:** abundância
  - **es-419:** abundancia

- **home > hero > fitness**
  - **en:** Fitness
  - **pt-BR:** fitness
  - **es-419:** fitness

- **home > hero > joy**
  - **en:** Joy
  - **pt-BR:** alegria
  - **es-419:** alegría

- **home > hero > freeTrialLine**
  - **en:** Start Your Free Trial Now
  - **pt-BR:** Comece seu teste grátis agora
  - **es-419:** Empieza tu prueba gratis ahora

- **home > hero > subhead1**
  - **en:** Subliminals + Robotic Affirming & Scripting
  - **pt-BR:** Subliminares + afirmação robótica e scripting
  - **es-419:** Subliminales + afirmación robótica y scripting

- **home > hero > subhead2**
  - **en:** Mirror Work + Belief Work
  - **pt-BR:** Espelho + crenças
  - **es-419:** Espejo + creencias

- **home > hero > subhead3**
  - **en:** Digital Manifesting Coach + More
  - **pt-BR:** Coach digital de manifestação e mais
  - **es-419:** Coach digital de manifestación y más

- **home > hero > awardLine**
  - **en:** The most comprehensive manifesting app
  - **pt-BR:** O app de manifestação mais completo
  - **es-419:** La app de manifestación más completa

- **home > hero > ctaHeroMobile**
  - **en:** Start your free trial
  - **pt-BR:** Comece seu teste grátis
  - **es-419:** Empieza tu prueba gratis

- **home > hero > ctaDownload**
  - **en:** Download the app & start free trial
  - **pt-BR:** Baixe o app e comece seu teste grátis
  - **es-419:** Descarga la app y empieza tu prueba gratis

- **home > hero > exploreApp**
  - **en:** Explore the app
  - **pt-BR:** Explore o app
  - **es-419:** Explora la app

- **home > hero > freeTrialUnderBadges**
  - **en:** Start your free trial in the App Store
  - **pt-BR:** Comece seu teste grátis na App Store
  - **es-419:** Empieza tu prueba gratis en el App Store

- **home > manifestPanel > headlineLine1**
  - **en:** One app for manifesting
  - **pt-BR:** Um app para manifestar
  - **es-419:** Una app para manifestar

- **home > manifestPanel > headlineLine2**
  - **en:** what you want
  - **pt-BR:** o que você quer
  - **es-419:** lo que quieres

- **home > manifestPanel > manifestListAria**
  - **en:** What you can manifest
  - **pt-BR:** O que você pode manifestar
  - **es-419:** Lo que puedes manifestar

- **home > manifestPanel > rows (line 1) (line 1)**
  - **en:** love & sp
  - **pt-BR:** amor e sp
  - **es-419:** amor y sp

- **home > manifestPanel > rows (line 1) (line 2)**
  - **en:** dream body
  - **pt-BR:** corpo dos sonhos
  - **es-419:** cuerpo soñado

- **home > manifestPanel > rows (line 2) (line 1)**
  - **en:** glow up
  - **pt-BR:** glow up
  - **es-419:** glow up

- **home > manifestPanel > rows (line 2) (line 2)**
  - **en:** wellness
  - **pt-BR:** bem-estar
  - **es-419:** bienestar

- **home > manifestPanel > rows (line 3) (line 1)**
  - **en:** self-concept
  - **pt-BR:** autoconceito
  - **es-419:** autoconcepto

- **home > manifestPanel > rows (line 3) (line 2)**
  - **en:** discipline
  - **pt-BR:** disciplina
  - **es-419:** disciplina

- **home > manifestPanel > rows (line 4) (line 1)**
  - **en:** money
  - **pt-BR:** dinheiro
  - **es-419:** dinero

- **home > manifestPanel > rows (line 4) (line 2)**
  - **en:** focus
  - **pt-BR:** foco
  - **es-419:** enfoque

- **home > manifestPanel > rows (line 5) (line 1)**
  - **en:** education
  - **pt-BR:** educação
  - **es-419:** educación

- **home > manifestPanel > rows (line 5) (line 2)**
  - **en:** life reset
  - **pt-BR:** recomeço
  - **es-419:** reinicio de vida

- **home > featureStripKeys (line 1)**
  - **en:** subliminal
  - **pt-BR:** subliminal
  - **es-419:** subliminal

- **home > featureStripKeys (line 2)**
  - **en:** mirror
  - **pt-BR:** mirror
  - **es-419:** mirror

- **home > featureStripKeys (line 3)**
  - **en:** affirmations
  - **pt-BR:** affirmations
  - **es-419:** affirmations

- **home > featureStripKeys (line 4)**
  - **en:** beliefs
  - **pt-BR:** beliefs
  - **es-419:** beliefs

- **home > featureStripKeys (line 5)**
  - **en:** journal
  - **pt-BR:** journal
  - **es-419:** journal

- **home > featureStripKeys (line 6)**
  - **en:** coach
  - **pt-BR:** coach
  - **es-419:** coach

- **home > practiceSection > headlineLine1**
  - **en:** Everything you need for
  - **pt-BR:** Tudo que você precisa para
  - **es-419:** Todo lo que necesitas para

- **home > practiceSection > headlineLine2**
  - **en:** the new story
  - **pt-BR:** a nova história
  - **es-419:** la nueva historia

- **home > practiceSection > body**
  - **en:** Palette Plotting brings your manifestation into one place — so you are not juggling notes, random subliminal playlists, screenshots, voice memos, journals, and scattered methods when doubt shows up. Use it to write the story, hear it, see it, repeat it, and live in the end.
  - **pt-BR:** O Palette Plotting reúne sua manifestação em um só lugar — para você não ficar alternando entre notas, playlists subliminares aleatórias, prints, memos de voz, diários e métodos espalhados quando a dúvida aparece. Use para escrever a história, ouvir, ver, repetir e viver no final.
  - **es-419:** Palette Plotting reúne tu manifestación en un solo lugar — para que no estés manejando notas, listas subliminales al azar, capturas, notas de voz, diarios y métodos dispersos cuando aparece la duda. Úsala para escribir la historia, escucharla, verla, repetirla y vivir en el final.

- **home > practiceSection > focusAreasAria**
  - **en:** Focus areas
  - **pt-BR:** Áreas de foco
  - **es-419:** Áreas de enfoque

- **home > practiceSection > pills (line 1) > label**
  - **en:** Love, SP, Self-Concept
  - **pt-BR:** Amor, SP, autoconceito
  - **es-419:** Amor, SP, autoconcepto

- **home > practiceSection > pills (line 1) > category**
  - **en:** Self Concept
  - **pt-BR:** Autoconceito
  - **es-419:** Autoconcepto

- **home > practiceSection > pills (line 1) > color**
  - **en:** pink
  - **pt-BR:** pink
  - **es-419:** pink

- **home > practiceSection > pills (line 2) > label**
  - **en:** Abundance
  - **pt-BR:** Abundância
  - **es-419:** Abundancia

- **home > practiceSection > pills (line 2) > category**
  - **en:** Law of Assumption
  - **pt-BR:** Lei da assunção
  - **es-419:** Ley de la asunción

- **home > practiceSection > pills (line 2) > color**
  - **en:** green
  - **pt-BR:** green
  - **es-419:** green

- **home > practiceSection > pills (line 3) > label**
  - **en:** Confidence
  - **pt-BR:** Confiança
  - **es-419:** Confianza

- **home > practiceSection > pills (line 3) > category**
  - **en:** Self Concept
  - **pt-BR:** Autoconceito
  - **es-419:** Autoconcepto

- **home > practiceSection > pills (line 3) > color**
  - **en:** blue
  - **pt-BR:** blue
  - **es-419:** blue

- **home > practiceSection > pills (line 4) > label**
  - **en:** Peace
  - **pt-BR:** Paz
  - **es-419:** Paz

- **home > practiceSection > pills (line 4) > category**
  - **en:** Self Concept
  - **pt-BR:** Autoconceito
  - **es-419:** Autoconcepto

- **home > practiceSection > pills (line 4) > color**
  - **en:** yellow
  - **pt-BR:** yellow
  - **es-419:** yellow

- **home > stats (line 1) > value**
  - **en:** 10+
  - **pt-BR:** 10+
  - **es-419:** 10+

- **home > stats (line 1) > label**
  - **en:** manifestation tools
  - **pt-BR:** ferramentas
  - **es-419:** herramientas

- **home > stats (line 2) > value**
  - **en:** 30
  - **pt-BR:** 30
  - **es-419:** 30

- **home > stats (line 2) > label**
  - **en:** subliminals per month
  - **pt-BR:** subliminares por mês
  - **es-419:** subliminales al mes

- **home > stats (line 3) > value**
  - **en:** 5
  - **pt-BR:** 5
  - **es-419:** 5

- **home > stats (line 3) > label**
  - **en:** mirror work scenes
  - **pt-BR:** cenas com espelho
  - **es-419:** escenas con espejo

- **home > stats (line 4) > value**
  - **en:** 4
  - **pt-BR:** 4
  - **es-419:** 4

- **home > stats (line 4) > label**
  - **en:** AI guide options
  - **pt-BR:** opções de guia IA
  - **es-419:** opciones de guía IA

- **home > testimonials > headlineLine1**
  - **en:** Results from our
  - **pt-BR:** Resultados dos nossos
  - **es-419:** Resultados de nuestros

- **home > testimonials > headlineLine2**
  - **en:** Users & Testers
  - **pt-BR:** usuários e testadores
  - **es-419:** usuarios y testers

- **home > testimonials > carouselAria**
  - **en:** User testimonials
  - **pt-BR:** Depoimentos de usuários
  - **es-419:** Testimonios de usuarios

- **home > testimonials > previous**
  - **en:** Previous testimonial
  - **pt-BR:** Depoimento anterior
  - **es-419:** Testimonio anterior

- **home > testimonials > next**
  - **en:** Next testimonial
  - **pt-BR:** Próximo depoimento
  - **es-419:** Siguiente testimonio

- **home > testimonials > pagesAria**
  - **en:** Testimonial pages
  - **pt-BR:** Páginas de depoimentos
  - **es-419:** Páginas de testimonios

- **home > testimonials > pageN**
  - **en:** Testimonial {{n}}
  - **pt-BR:** Depoimento {{n}}
  - **es-419:** Testimonio {{n}}

- **home > testimonials > starsAria**
  - **en:** 5 out of 5 stars
  - **pt-BR:** 5 de 5 estrelas
  - **es-419:** 5 de 5 estrellas

- **home > testimonials > items (line 1) > quote**
  - **en:** When I waver and the 3D gets loud af I would ditch my whole SP routine and go hunt for a new method or crashout. Now I script and do mirror work here and actually stay on my storyline instead of scrolling manifest TikTok at 2am.
  - **pt-BR:** Quando vacilo e o 3D pesa, eu abandonava minha rotina de SP. Agora faço scripting e espelho aqui e fico na minha história.
  - **es-419:** Cuando dudo y el 3D pesa, antes dejaba mi rutina de SP. Ahora hago scripting y espejo aquí y sigo en mi historia.

- **home > testimonials > items (line 1) > name**
  - **en:** Maya T.
  - **pt-BR:** Maya T.
  - **es-419:** Maya T.

- **home > testimonials > items (line 1) > role**
  - **en:** SP & self-concept
  - **pt-BR:** SP e autoconceito
  - **es-419:** SP y autoconcepto

- **home > testimonials > items (line 2) > quote**
  - **en:** My brain still wants to argue before I even start my robotic affirming. But this app, the teleprompter, and reps counter help me finish my session instead of struggling alone.
  - **pt-BR:** Meu cérebro ainda quer discutir antes de começar a afirmação robótica. Mas este app, o teleprompter e o contador de repetições me ajudam a terminar a sessão em vez de lutar sozinha.
  - **es-419:** Mi cerebro todavía quiere discutir antes de empezar mi afirmación robótica. Pero esta app, el teleprompter y el contador de repeticiones me ayudan a terminar la sesión en lugar de luchar sola.

- **home > testimonials > items (line 2) > name**
  - **en:** Devon K.
  - **pt-BR:** Devon K.
  - **es-419:** Devon K.

- **home > testimonials > items (line 2) > role**
  - **en:** Law of Assumption · scripting
  - **pt-BR:** Lei da assunção · scripting
  - **es-419:** Ley de la asunción · scripting

- **home > testimonials > items (line 3) > quote**
  - **en:** YouTube subliminals never hit because it's not my voice or my exact words. I made one here with my affirmations + binaural beats and it's the only one I loop without getting bored in 2 days.
  - **pt-BR:** Subliminares do YouTube nunca funcionavam porque não era minha voz nem minhas palavras exatas. Fiz um aqui com minhas afirmações + batidas binaurais e é o único que repito sem enjoar em 2 dias.
  - **es-419:** Los subliminales de YouTube nunca funcionaban porque no era mi voz ni mis palabras exactas. Hice uno aquí con mis afirmaciones + binaurales y es el único que repito sin aburrirme en 2 días.

- **home > testimonials > items (line 3) > name**
  - **en:** Jade L.
  - **pt-BR:** Jade L.
  - **es-419:** Jade L.

- **home > testimonials > items (line 3) > role**
  - **en:** Subliminals · affirming
  - **pt-BR:** Subliminais · afirmação
  - **es-419:** Subliminales · afirmación

- **home > download > headingMobile**
  - **en:** Download the app
  - **pt-BR:** Baixe o app
  - **es-419:** Descarga la app

- **home > download > headingDesktop**
  - **en:** Download the app & start free trial
  - **pt-BR:** Baixe o app e comece seu teste grátis
  - **es-419:** Descarga la app y empieza tu prueba gratis

- **home > download > scanPhone**
  - **en:** Scan with your phone.
  - **pt-BR:** Escaneie com seu celular.
  - **es-419:** Escanea con tu teléfono.

- **home > download > tapInstall**
  - **en:** Tap to install on your phone.
  - **pt-BR:** Toque para instalar no seu celular.
  - **es-419:** Toca para instalar en tu teléfono.

- **home > download > qrUnavailable**
  - **en:** Unavailable
  - **pt-BR:** Indisponível
  - **es-419:** No disponible

- **home > download > qrError**
  - **en:** QR codes unavailable. Use the store badges below.
  - **pt-BR:** QR indisponível. Use os badges abaixo.
  - **es-419:** QR no disponible. Usa los badges abajo.

- **home > download > appleStore**
  - **en:** Apple App Store
  - **pt-BR:** Apple App Store
  - **es-419:** Apple App Store

- **home > download > googlePlay**
  - **en:** Google Play
  - **pt-BR:** Google Play
  - **es-419:** Google Play

- **home > download > qrAltAppStore**
  - **en:** QR code to open Palette Plotting on the App Store
  - **pt-BR:** QR code para abrir o Palette Plotting na App Store
  - **es-419:** Código QR para abrir Palette Plotting en el App Store

- **home > download > qrAltGooglePlay**
  - **en:** QR code to open Palette Plotting on Google Play
  - **pt-BR:** QR code para abrir o Palette Plotting no Google Play
  - **es-419:** Código QR para abrir Palette Plotting en Google Play

- **home > newsletter > heading**
  - **en:** Tips in your inbox
  - **pt-BR:** Dicas na sua caixa de entrada
  - **es-419:** Tips en tu bandeja

- **home > newsletter > subtitle**
  - **en:** Stay consistent, hear about new features, and get special promotions.
  - **pt-BR:** Receba dicas, novidades e promoções.
  - **es-419:** Recibe consejos, novedades y promos.

- **home > newsletter > placeholder**
  - **en:** Email address
  - **pt-BR:** E-mail
  - **es-419:** Correo electrónico

- **home > newsletter > subscribe**
  - **en:** Subscribe
  - **pt-BR:** Inscrever-se
  - **es-419:** Suscribirme

- **home > newsletter > subscribing**
  - **en:** Subscribing…
  - **pt-BR:** Inscrevendo…
  - **es-419:** Suscribiendo…

- **home > newsletter > successHeading**
  - **en:** You're on the list
  - **pt-BR:** Você está na lista
  - **es-419:** Ya estás en la lista

- **home > newsletter > successBody**
  - **en:** Thanks for subscribing. Watch your inbox for manifestation tips, new features, and special promotions.
  - **pt-BR:** Inscrição feita. Veja dicas, novidades e promoções no seu e-mail.
  - **es-419:** Suscripción lista. Recibe tips, novedades y promociones en tu correo.

- **home > newsletter > consent**
  - **en:** By subscribing you agree to receive marketing emails from Palette Plotting. Unsubscribe anytime.
  - **pt-BR:** Ao se inscrever, você concorda em receber e-mails de marketing do Palette Plotting. Cancele quando quiser.
  - **es-419:** Al suscribirte aceptas recibir correos de marketing de Palette Plotting. Cancela cuando quieras.

- **home > newsletter > errorEmpty**
  - **en:** Please enter your email address.
  - **pt-BR:** Digite seu e-mail.
  - **es-419:** Ingresa tu correo electrónico.

- **home > newsletter > errorInvalid**
  - **en:** Please enter a valid email address.
  - **pt-BR:** Digite um e-mail válido.
  - **es-419:** Ingresa un correo electrónico válido.

- **home > newsletter > errorGeneric**
  - **en:** Something went wrong. Please try again.
  - **pt-BR:** Algo deu errado. Tente novamente.
  - **es-419:** Algo salió mal. Inténtalo de nuevo.

- **home > footer > company**
  - **en:** PALETTE PLOTTING LLC
  - **pt-BR:** PALETTE PLOTTING LLC
  - **es-419:** PALETTE PLOTTING LLC

- **home > footer > copyright**
  - **en:** © {{year}} Palette Plotting LLC. All rights reserved.
  - **pt-BR:** © {{year}} Palette Plotting LLC. Todos os direitos reservados.
  - **es-419:** © {{year}} Palette Plotting LLC. Todos los derechos reservados.

- **home > footer > whatIs**
  - **en:** What is Palette Plotting?
  - **pt-BR:** O que é o Palette Plotting?
  - **es-419:** ¿Qué es Palette Plotting?

- **home > footer > faq**
  - **en:** FAQ
  - **pt-BR:** FAQ
  - **es-419:** FAQ

- **home > footer > community**
  - **en:** Community
  - **pt-BR:** Comunidade
  - **es-419:** Comunidad

- **home > footer > billing**
  - **en:** Billing
  - **pt-BR:** Assinatura
  - **es-419:** Facturación

- **home > footer > contact**
  - **en:** Contact
  - **pt-BR:** Contato
  - **es-419:** Contacto

- **home > footer > terms**
  - **en:** Terms of Use
  - **pt-BR:** Termos de uso
  - **es-419:** Términos de uso

- **home > footer > privacy**
  - **en:** Privacy Policy
  - **pt-BR:** Privacidade
  - **es-419:** Privacidad

- **home > footer > acceptableUse**
  - **en:** Acceptable Use Policy
  - **pt-BR:** Uso aceitável
  - **es-419:** Uso aceptable

- **home > footer > footerNav**
  - **en:** Footer
  - **pt-BR:** Rodapé
  - **es-419:** Pie de página

- **home > stickyBarAria**
  - **en:** Download Palette Plotting
  - **pt-BR:** Baixar Palette Plotting
  - **es-419:** Descargar Palette Plotting

## Push notifications (server-sent, not in locale JSON)

### Manifestation routine reminder

- **en title:** Time to manifest!
- **pt-BR title:** Hora de manifestar!
- **es-419 title:** ¡Es hora de manifestar!

- **en subtitle:** Get back into the app to do your manifesting routine.
- **pt-BR subtitle:** Volte ao app para fazer sua rotina de manifestação.
- **es-419 subtitle:** Vuelve a la app para hacer tu rutina de manifestación.

- **en body:** Your dreams are waiting. Let's return to your manifesting practice now.
- **pt-BR body:** Seus sonhos estão esperando. Vamos voltar à sua prática de manifestação agora.
- **es-419 body:** Tus sueños te esperan. Volvamos a tu práctica de manifestación ahora.

### Support request reply

- **en:** We replied to your help request.
- **pt-BR:** Respondemos à sua solicitação de ajuda.
- **es-419:** Respondimos a tu solicitud de ayuda.

---

**Total keyed strings (en reference):** 1613
