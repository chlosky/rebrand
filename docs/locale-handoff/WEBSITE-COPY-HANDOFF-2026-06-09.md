# Palette Plotting — Website copy handoff (all translated languages)

Generated: 2026-06-09. Micromanagement handoff for ChatGPT translation QA.

**English is the reference column.** Compare every locale against EN.

## Scope (website only — not in-app dashboard/onboarding)

| Area | Routes | Locales |
|------|--------|--------|
| Homepage | `/` | en, de, zh-Hans, nl, fr, it, pt-BR, es-419 |
| What is Palette Plotting | `/what-is-palette-plotting` | same |
| Manifestation quiz | `/quiz/blocking-manifestation` | same |
| Terms of Use + EULA | `/terms`, `/terms/{ES\|PT\|DE\|FR\|IT\|NL\|ZH}` | EN + 7 localized routes |
| Privacy Policy | `/privacy`, `/privacy/{ES\|PT\|DE\|FR\|IT\|NL\|ZH}` | EN + 7 localized routes |

**Not translated (stay English):** FAQ, Contact, Pricing, Billing, Blog, Community, Acceptable Use, DMCA, legal subpages other than Terms/Privacy.

**Language selector order (no English in picker):** Deutsch → 中文 → Nederlands → Français → Italiano → Português (BR) → Español

**Source files:**
- i18n: `src/i18n/locales/{locale}/marketing.json` (home + pricing.features), `marketingManifestationQuiz.json`, `marketingWhatIs.json`
- Legal: `src/pages/legal/TermsOfServiceContent{ES,PT,DE,FR,IT,NL,ZH}.tsx`, `PrivacyPolicyContent*.tsx`; English inline in `TermsOfService.tsx` / `PrivacyPolicy.tsx`

---

# Section 1 — Homepage (`marketing.home.*`)

Keys: 122

| Key | EN | de | zh-Hans | nl | fr | it | pt-BR | es-419 |
|-----|------|------|------|------|------|------|------|------|
| `marketing.home.download.appleStore` | Apple App Store | Apple App Store | Apple App Store | Apple App Store | Apple App Store | Apple App Store | Apple App Store | Apple App Store |
| `marketing.home.download.googlePlay` | Google Play | Google Play | Google Play | Google Play | Google Play | Google Play | Google Play | Google Play |
| `marketing.home.download.headingDesktop` | Download the app & start free trial | App herunterladen & kostenlose Testphase starten | 下载应用并开始免费试用 | Download de app en start je gratis proefperiode | Telecharge l'app et commence ton essai gratuit | Scarica l'app e inizia la prova gratuita | Baixe o app e comece seu teste grátis | Descarga la app y empieza tu prueba gratis |
| `marketing.home.download.headingMobile` | Download the app | App herunterladen | 下载应用 | Download de app | Telecharge l'app | Scarica l'app | Baixe o app | Descarga la app |
| `marketing.home.download.qrAltAppStore` | QR code to open Palette Plotting on the App Store | QR-Code, um Palette Plotting im App Store zu öffnen | 打开 App Store 中 Palette Plotting 的二维码 | QR-code om Palette Plotting in de App Store te openen | Code QR pour ouvrir Palette Plotting sur l'App Store | Codice QR per aprire Palette Plotting sull'App Store | QR code para abrir o Palette Plotting na App Store | Código QR para abrir Palette Plotting en el App Store |
| `marketing.home.download.qrAltGooglePlay` | QR code to open Palette Plotting on Google Play | QR-Code, um Palette Plotting bei Google Play zu öffnen | 打开 Google Play 中 Palette Plotting 的二维码 | QR-code om Palette Plotting in Google Play te openen | Code QR pour ouvrir Palette Plotting sur Google Play | Codice QR per aprire Palette Plotting su Google Play | QR code para abrir o Palette Plotting no Google Play | Código QR para abrir Palette Plotting en Google Play |
| `marketing.home.download.qrError` | QR codes unavailable. Use the store badges below. | QR-Codes nicht verfügbar. Nutze die Store-Badges unten. | 二维码不可用。请使用下方应用商店徽章。 | QR-codes niet beschikbaar. Gebruik de store-badges hieronder. | QR indisponibles. Utilise les badges des stores ci-dessous. | Codici QR non disponibili. Usa i badge degli store qui sotto. | QR indisponível. Use os badges abaixo. | QR no disponible. Usa los badges abajo. |
| `marketing.home.download.qrUnavailable` | Unavailable | Nicht verfügbar | 不可用 | Niet beschikbaar | Indisponible | Non disponibile | Indisponível | No disponible |
| `marketing.home.download.scanPhone` | Scan with your phone. | Mit dem Smartphone scannen. | 用手机扫描。 | Scan met je telefoon. | Scanne avec ton telephone. | Scansiona con il tuo telefono. | Escaneie com seu celular. | Escanea con tu teléfono. |
| `marketing.home.download.tapInstall` | Tap to install on your phone. | Tippe, um auf deinem Smartphone zu installieren. | 轻点即可安装到手机。 | Tik om op je telefoon te installeren. | Appuie pour installer sur ton telephone. | Tocca per installare sul tuo telefono. | Toque para instalar no seu celular. | Toca para instalar en tu teléfono. |
| `marketing.home.featureStripKeys.0` | subliminal | subliminal | subliminal | subliminal | subliminal | subliminal | subliminal | subliminal |
| `marketing.home.featureStripKeys.1` | mirror | mirror | mirror | mirror | mirror | mirror | mirror | mirror |
| `marketing.home.featureStripKeys.2` | affirmations | affirmations | affirmations | affirmations | affirmations | affirmations | affirmations | affirmations |
| `marketing.home.featureStripKeys.3` | beliefs | beliefs | beliefs | beliefs | beliefs | beliefs | beliefs | beliefs |
| `marketing.home.featureStripKeys.4` | journal | journal | journal | journal | journal | journal | journal | journal |
| `marketing.home.featureStripKeys.5` | coach | coach | coach | coach | coach | coach | coach | coach |
| `marketing.home.footer.acceptableUse` | Acceptable Use Policy | Richtlinie zur zulässigen Nutzung | 可接受使用政策 | Beleid voor Aanvaardbaar Gebruik | Politique d'utilisation acceptable | Policy di uso accettabile | Uso aceitável | Uso aceptable |
| `marketing.home.footer.billing` | Billing | Abrechnung | 账单 | Facturatie | Facturation | Fatturazione | Assinatura | Facturación |
| `marketing.home.footer.community` | Community | Community | 社群 | Community | Communaute | Community | Comunidade | Comunidad |
| `marketing.home.footer.company` | PALETTE PLOTTING LLC | PALETTE PLOTTING LLC | PALETTE PLOTTING LLC | PALETTE PLOTTING LLC | PALETTE PLOTTING LLC | PALETTE PLOTTING LLC | PALETTE PLOTTING LLC | PALETTE PLOTTING LLC |
| `marketing.home.footer.contact` | Contact | Kontakt | 联系我们 | Contact | Contact | Contatti | Contato | Contacto |
| `marketing.home.footer.copyright` | © {{year}} Palette Plotting LLC. All rights reserved. | © {{year}} Palette Plotting LLC. Alle Rechte vorbehalten. | © {{year}} Palette Plotting LLC. 保留所有权利。 | © {{year}} Palette Plotting LLC. Alle rechten voorbehouden. | © {{year}} Palette Plotting LLC. Tous droits reserves. | © {{year}} Palette Plotting LLC. Tutti i diritti riservati. | © {{year}} Palette Plotting LLC. Todos os direitos reservados. | © {{year}} Palette Plotting LLC. Todos los derechos reservados. |
| `marketing.home.footer.faq` | FAQ | FAQ | 常见问题 | FAQ | FAQ | FAQ | FAQ | FAQ |
| `marketing.home.footer.footerNav` | Footer | Fußnavigation | 页脚导航 | Footer | Pied de page | Piè di pagina | Rodapé | Pie de página |
| `marketing.home.footer.privacy` | Privacy Policy | Datenschutzrichtlinie | 隐私政策 | Privacybeleid | Politique de confidentialite | Informativa sulla privacy | Privacidade | Privacidad |
| `marketing.home.footer.terms` | Terms of Use | Nutzungsbedingungen | 使用条款 | Gebruiksvoorwaarden | Conditions d'utilisation | Termini di utilizzo | Termos de uso | Términos de uso |
| `marketing.home.footer.whatIs` | What is Palette Plotting? | Was ist Palette Plotting? | 什么是 Palette Plotting？ | Wat is Palette Plotting? | Qu'est-ce que Palette Plotting ? | Che cos'e Palette Plotting? | O que é o Palette Plotting? | ¿Qué es Palette Plotting? |
| `marketing.home.header.blog` | Blog | Blog | 博客 | Blog | Blog | Blog | Blog | Blog |
| `marketing.home.header.community` | Community | Community | 社群 | Community | Communaute | Community | Comunidade | Comunidad |
| `marketing.home.header.dashboard` | Dashboard | Dashboard | 控制台 | Dashboard | Tableau de bord | Dashboard | Painel | Panel |
| `marketing.home.header.downloadApp` | Download app | App herunterladen | 下载应用 | Download app | Telecharger l'app | Scarica l'app | Baixar app | Descargar app |
| `marketing.home.header.faq` | FAQ | FAQ | 常见问题 | FAQ | FAQ | FAQ | FAQ | FAQ |
| `marketing.home.header.logOut` | Log out | Abmelden | 退出登录 | Uitloggen | Se deconnecter | Esci | Sair | Cerrar sesión |
| `marketing.home.header.mainNav` | Main | Hauptnavigation | 主导航 | Hoofdmenu | Principal | Principale | Principal | Principal |
| `marketing.home.header.signIn` | Sign in | Anmelden | 登录 | Inloggen | Se connecter | Accedi | Entrar | Iniciar sesión |
| `marketing.home.header.user` | User | Benutzer | 用户 | Gebruiker | Utilisateur | Utente | Usuário | Usuario |
| `marketing.home.header.yourAccount` | Your Account | Dein Konto | 你的账户 | Je account | Ton compte | Il tuo account | Sua conta | Tu cuenta |
| `marketing.home.hero.abundance` | Abundance | Fülle | 丰盛 | Overvloed | Abondance | Abbondanza | abundância | abundancia |
| `marketing.home.hero.awardLine` | The most comprehensive manifesting app | Die umfassendste Manifestations-App | 功能最全面的显化应用 | De meest complete manifestatie-app | L'application de manifestation la plus complete | L'app di manifestazione piu completa | O app de manifestação mais completo | La app de manifestación más completa |
| `marketing.home.hero.ctaDownload` | Download the app & start free trial | App herunterladen & kostenlose Testphase starten | 下载应用并开始免费试用 | Download de app en start je gratis proefperiode | Telecharge l'app et commence ton essai gratuit | Scarica l'app e inizia la prova gratuita | Baixe o app e comece seu teste grátis | Descarga la app y empieza tu prueba gratis |
| `marketing.home.hero.ctaHeroMobile` | Start your free trial | Kostenlose Testphase starten | 开始免费试用 | Start je gratis proefperiode | Commence ton essai gratuit | Inizia la tua prova gratuita | Comece seu teste grátis | Empieza tu prueba gratis |
| `marketing.home.hero.exploreApp` | Explore the app | App entdecken | 探索应用 | Verken de app | Explorer l'app | Esplora l'app | Explore o app | Explora la app |
| `marketing.home.hero.fitness` | Fitness | Fitness | 身材与健康 | Fitness | Fitness | Forma fisica | fitness | fitness |
| `marketing.home.hero.freeTrialLine` | Start Your Free Trial Now | Starte jetzt deine kostenlose Testphase | 立即开始免费试用 | Start Nu Je Gratis Proefperiode | Commence ton essai gratuit maintenant | Inizia Ora la Tua Prova Gratuita | Comece seu teste grátis agora | Empieza tu prueba gratis ahora |
| `marketing.home.hero.freeTrialUnderBadges` | Start your free trial in the App Store | Starte deine kostenlose Testphase im App Store | 在 App Store 开始免费试用 | Start je gratis proefperiode in de App Store | Commence ton essai gratuit dans l'App Store | Inizia la tua prova gratuita nell'App Store | Comece seu teste grátis na App Store | Empieza tu prueba gratis en el App Store |
| `marketing.home.hero.joy` | Joy | Freude | 喜悦 | Vreugde | Joie | Gioia | alegria | alegría |
| `marketing.home.hero.loveSp` | Love & SP | Liebe & SP | 爱情与 SP | Liefde & SP | Amour et SP | Amore e SP | amor e SP | amor y SP |
| `marketing.home.hero.manifestEverything` | Manifest Everything | Manifestiere alles | 显化一切 | Manifesteer Alles | Manifeste tout | Manifesta Tutto | Manifeste tudo | Manifiesta todo |
| `marketing.home.hero.manifestPrefix` | Manifest | Manifestiere | 显化 | Manifesteer | Manifeste | Manifesta | Manifeste | Manifiesta |
| `marketing.home.hero.subhead1` | Subliminals + Robotic Affirming & Scripting | Subliminals + Robotic Affirming & Scripting | 潜意识音频 + 机器人式肯定与脚本书写 | Subliminals + Robotisch Affirmeren & Scripting | Subliminaux + affirmation robotique et scripting | Subliminali + Affermazioni Robotiche e Scripting | Subliminares + afirmação robótica e scripting | Subliminales + afirmación robótica y scripting |
| `marketing.home.hero.subhead2` | Mirror Work + Belief Work | Mirror Work + Glaubenssatzarbeit | 镜前练习 + 信念练习 | Mirror Work + Overtuigingswerk | Travail du miroir + travail des croyances | Mirror Work + Lavoro sulle Credenze | Espelho + crenças | Espejo + creencias |
| `marketing.home.hero.subhead3` | Digital Manifesting Coach + More | Digitaler Manifestations-Coach + mehr | 数字显化教练 + 更多功能 | Digitale Manifestatiecoach + Meer | Coach digital de manifestation + plus | Coach Digitale di Manifestazione + Altro | Coach digital de manifestação e mais | Coach digital de manifestación y más |
| `marketing.home.manifestPanel.headlineLine1` | One app for manifesting | Eine App zum Manifestieren | 一款应用显化 | Een app om te manifesteren | Une app pour manifester | Un'unica app per manifestare | Um app para manifestar | Una app para manifestar |
| `marketing.home.manifestPanel.headlineLine2` | what you want | von dem, was du willst | 你想要的一切 | wat je wilt | ce que tu veux | cio che desideri | o que você quer | lo que quieres |
| `marketing.home.manifestPanel.manifestListAria` | What you can manifest | Was du manifestieren kannst | 你可以显化的内容 | Wat je kunt manifesteren | Ce que tu peux manifester | Cosa puoi manifestare | O que você pode manifestar | Lo que puedes manifestar |
| `marketing.home.manifestPanel.rows.0.0` | love & sp | liebe & sp | 爱情与 sp | liefde & sp | amour et sp | amore e sp | amor e sp | amor y sp |
| `marketing.home.manifestPanel.rows.0.1` | dream body | wunschkörper | 理想身材 | droomlichaam | corps reve | corpo dei sogni | corpo dos sonhos | cuerpo soñado |
| `marketing.home.manifestPanel.rows.1.0` | glow up | glow up | 蜕变提升 | glow up | glow up | glow up | glow up | glow up |
| `marketing.home.manifestPanel.rows.1.1` | wellness | wellness | 身心健康 | wellness | bien-etre | benessere | bem-estar | bienestar |
| `marketing.home.manifestPanel.rows.2.0` | self-concept | selbstkonzept | 自我概念 | zelfconcept | concept de soi | concetto di se | autoconceito | autoconcepto |
| `marketing.home.manifestPanel.rows.2.1` | discipline | disziplin | 自律 | discipline | discipline | disciplina | disciplina | disciplina |
| `marketing.home.manifestPanel.rows.3.0` | money | geld | 财富 | geld | argent | denaro | dinheiro | dinero |
| `marketing.home.manifestPanel.rows.3.1` | focus | fokus | 专注力 | focus | concentration | concentrazione | foco | enfoque |
| `marketing.home.manifestPanel.rows.4.0` | education | bildung | 学业 | opleiding | etudes | istruzione | educação | educación |
| `marketing.home.manifestPanel.rows.4.1` | life reset | neustart im leben | 人生重启 | life reset | reset de vie | reset di vita | recomeço | reinicio de vida |
| `marketing.home.meta.description` | Palette Plotting helps you create subliminals, affirmations, mirror work, scripting, and manifesting routines in one place. | Palette Plotting hilft dir, Subliminals, Affirmationen, Mirror Work, Scripting und Manifestationsroutinen an einem Ort zu erstellen. | Palette Plotting 帮你在一个地方完成潜意识音频、肯定语、镜前练习、脚本书写和显化日常。 | Palette Plotting helpt je om subliminals, affirmaties, mirror work, scripting en manifestatieroutines op een plek te maken. | Palette Plotting t'aide a creer des subliminaux, des affirmations, du travail du miroir, du scripting et des routines de manifestation au meme endroit. | Palette Plotting ti aiuta a creare subliminali, affermazioni, mirror work, scripting e routine di manifestazione in un unico posto. | O Palette Plotting ajuda você a criar subliminares, afirmações, trabalho com espelho, scripting e rotinas de manifestação em um só lugar. | Palette Plotting te ayuda a crear subliminales, afirmaciones, trabajo con espejo, scripting y rutinas de manifestación en un solo lugar. |
| `marketing.home.meta.ogDescription` | Create subliminals, affirmations, mirror work, scripting, and manifesting routines with Palette Plotting. | Erstelle Subliminals, Affirmationen, Mirror Work, Scripting und Manifestationsroutinen mit Palette Plotting. | 用 Palette Plotting 完成潜意识音频、肯定语、镜前练习、脚本书写和显化日常。 | Maak subliminals, affirmaties, mirror work, scripting en manifestatieroutines met Palette Plotting. | Cree des subliminaux, des affirmations, du travail du miroir, du scripting et des routines de manifestation avec Palette Plotting. | Crea subliminali, affermazioni, mirror work, scripting e routine di manifestazione con Palette Plotting. | Crie subliminares, afirmações, trabalho com espelho, scripting e rotinas de manifestação com o Palette Plotting. | Crea subliminales, afirmaciones, trabajo con espejo, scripting y rutinas de manifestación con Palette Plotting. |
| `marketing.home.meta.title` | Home \| Palette Plotting | Startseite \| Palette Plotting | 首页 \| Palette Plotting | Home \| Palette Plotting | Accueil \| Palette Plotting | Home \| Palette Plotting | Início \| Palette Plotting | Inicio \| Palette Plotting |
| `marketing.home.meta.twitterDescription` | Create subliminals, affirmations, mirror work, scripting, and manifesting routines with Palette Plotting. | Erstelle Subliminals, Affirmationen, Mirror Work, Scripting und Manifestationsroutinen mit Palette Plotting. | 用 Palette Plotting 完成潜意识音频、肯定语、镜前练习、脚本书写和显化日常。 | Maak subliminals, affirmaties, mirror work, scripting en manifestatieroutines met Palette Plotting. | Cree des subliminaux, des affirmations, du travail du miroir, du scripting et des routines de manifestation avec Palette Plotting. | Crea subliminali, affermazioni, mirror work, scripting e routine di manifestazione con Palette Plotting. | Crie subliminares, afirmações, trabalho com espelho, scripting e rotinas de manifestação com o Palette Plotting. | Crea subliminales, afirmaciones, trabajo con espejo, scripting y rutinas de manifestación con Palette Plotting. |
| `marketing.home.newsletter.consent` | By subscribing you agree to receive marketing emails from Palette Plotting. Unsubscribe anytime. | Mit dem Abonnieren stimmst du zu, Marketing-E-Mails von Palette Plotting zu erhalten. Abmeldung jederzeit möglich. | 订阅即表示你同意接收来自 Palette Plotting 的营销邮件。可随时取消订阅。 | Door je in te schrijven ga je akkoord met het ontvangen van marketingmails van Palette Plotting. Uitschrijven kan altijd. | En t'abonnant, tu acceptes de recevoir des e-mails marketing de Palette Plotting. Desinscription a tout moment. | Iscrivendoti accetti di ricevere email marketing da Palette Plotting. Puoi annullare l'iscrizione in qualsiasi momento. | Ao se inscrever, você concorda em receber e-mails de marketing do Palette Plotting. Cancele quando quiser. | Al suscribirte aceptas recibir correos de marketing de Palette Plotting. Cancela cuando quieras. |
| `marketing.home.newsletter.errorEmpty` | Please enter your email address. | Bitte gib deine E-Mail-Adresse ein. | 请输入你的电子邮箱地址。 | Voer je e-mailadres in. | Veuillez saisir votre adresse e-mail. | Inserisci il tuo indirizzo email. | Digite seu e-mail. | Ingresa tu correo electrónico. |
| `marketing.home.newsletter.errorGeneric` | Something went wrong. Please try again. | Etwas ist schiefgelaufen. Bitte versuche es erneut. | 出了点问题。请重试。 | Er ging iets mis. Probeer het opnieuw. | Un probleme est survenu. Veuillez reessayer. | Qualcosa e andato storto. Riprova. | Algo deu errado. Tente novamente. | Algo salió mal. Inténtalo de nuevo. |
| `marketing.home.newsletter.errorInvalid` | Please enter a valid email address. | Bitte gib eine gültige E-Mail-Adresse ein. | 请输入有效的电子邮箱地址。 | Voer een geldig e-mailadres in. | Veuillez saisir une adresse e-mail valide. | Inserisci un indirizzo email valido. | Digite um e-mail válido. | Ingresa un correo electrónico válido. |
| `marketing.home.newsletter.heading` | Tips in your inbox | Tipps in deinem Postfach | 技巧直达你的收件箱 | Tips in je inbox | Conseils dans ta boite mail | Consigli nella tua casella email | Dicas na sua caixa de entrada | Tips en tu bandeja |
| `marketing.home.newsletter.placeholder` | Email address | E-Mail-Adresse | 电子邮箱地址 | E-mailadres | Adresse e-mail | Indirizzo email | E-mail | Correo electrónico |
| `marketing.home.newsletter.subscribe` | Subscribe | Abonnieren | 订阅 | Abonneren | S'abonner | Iscriviti | Inscrever-se | Suscribirme |
| `marketing.home.newsletter.subscribing` | Subscribing… | Wird abonniert... | 订阅中… | Bezig met abonneren… | Abonnement... | Iscrizione in corso… | Inscrevendo… | Suscribiendo… |
| `marketing.home.newsletter.subtitle` | Stay consistent, hear about new features, and get special promotions. | Bleib konstant, erfahre von neuen Features und erhalte besondere Aktionen. | 保持稳定练习，了解新功能，并获取专属优惠。 | Blijf consistent, hoor over nieuwe functies en ontvang speciale promoties. | Reste constante, decouvre les nouvelles fonctionnalites et recois des promotions speciales. | Rimani costante, scopri nuove funzionalita e ricevi promozioni speciali. | Receba dicas, novidades e promoções. | Recibe consejos, novedades y promos. |
| `marketing.home.newsletter.successBody` | Thanks for subscribing. Watch your inbox for manifestation tips, new features, and special promotions. | Danke für dein Abo. Schau in dein Postfach für Manifestations-Tipps, neue Features und besondere Aktionen. | 感谢订阅。请留意收件箱，获取显化技巧、新功能和专属优惠。 | Bedankt voor je inschrijving. Houd je inbox in de gaten voor manifestatietips, nieuwe functies en speciale promoties. | Merci pour ton abonnement. Surveille ta boite mail pour des conseils de manifestation, des nouveautes et des promotions speciales. | Grazie per esserti iscritta/o. Controlla la tua casella per consigli sulla manifestazione, nuove funzionalita e promozioni speciali. | Inscrição feita. Veja dicas, novidades e promoções no seu e-mail. | Suscripción lista. Recibe tips, novedades y promociones en tu correo. |
| `marketing.home.newsletter.successHeading` | You're on the list | Du stehst auf der Liste | 你已加入名单 | Je staat op de lijst | Tu es sur la liste | Sei nella lista | Você está na lista | Ya estás en la lista |
| `marketing.home.practiceSection.body` | Palette Plotting brings your manifestation into one place — so you are not juggling notes, random subliminal playlists, screenshots, voice memos, journals, and scattered methods when doubt shows up. Use it to write the story, hear it, see it, repeat it, and live in the end. | Palette Plotting bündelt deine Manifestationspraxis an einem Ort - damit du bei aufkommenden Zweifeln nicht zwischen Notizen, zufälligen Subliminal-Playlists, Screenshots, Sprachnotizen, Journalen und verstreuten Methoden hin- und herwechseln musst. Nutze es, um deine Story zu schreiben, zu hören, zu sehen, zu wiederholen und im Endzustand zu leben. | Palette Plotting 把你的显化练习集中在一个地方 - 当怀疑出现时，你不再需要在笔记、零散潜意识播放列表、截图、语音备忘录、日记和分散方法之间来回切换。用它来写下故事、听见故事、看见故事、重复故事，并活在终局里。 | Palette Plotting brengt je manifestatie samen op een plek, zodat je niet hoeft te jongleren met notities, willekeurige subliminal-playlists, screenshots, spraakmemo's, journals en losse methodes wanneer twijfel opkomt. Gebruik het om het verhaal te schrijven, te horen, te zien, te herhalen en in het eindresultaat te leven. | Palette Plotting rassemble ta manifestation au meme endroit - pour que tu ne jongles plus avec des notes, des playlists subliminales au hasard, des captures d'ecran, des memos vocaux, des journaux et des methodes eparpillees quand le doute arrive. Utilise-le pour ecrire l'histoire, l'entendre, la voir, la repeter et vivre dans la fin. | Palette Plotting riunisce la tua manifestazione in un unico posto, cosi non devi gestire note, playlist subliminali casuali, screenshot, memo vocali, diari e metodi sparsi quando arriva il dubbio. Usalo per scrivere la storia, ascoltarla, vederla, ripeterla e vivere nel risultato finale. | O Palette Plotting reúne sua manifestação em um só lugar — para você não ficar alternando entre notas, playlists subliminares aleatórias, prints, memos de voz, diários e métodos espalhados quando a dúvida aparece. Use para escrever a história, ouvir, ver, repetir e viver no final. | Palette Plotting reúne tu manifestación en un solo lugar — para que no estés manejando notas, listas subliminales al azar, capturas, notas de voz, diarios y métodos dispersos cuando aparece la duda. Úsala para escribir la historia, escucharla, verla, repetirla y vivir en el final. |
| `marketing.home.practiceSection.focusAreasAria` | Focus areas | Fokusbereiche | 重点领域 | Focusgebieden | Domaines de focus | Aree di focus | Áreas de foco | Áreas de enfoque |
| `marketing.home.practiceSection.headlineLine1` | Everything you need for | Alles, was du für | 你需要的一切，用于书写 | Alles wat je nodig hebt voor | Tout ce qu'il te faut pour | Tutto cio che ti serve per | Tudo que você precisa para | Todo lo que necesitas para |
| `marketing.home.practiceSection.headlineLine2` | the new story | deine neue Story brauchst | 你的新故事 | het nieuwe verhaal | la nouvelle histoire | la nuova storia | a nova história | la nueva historia |
| `marketing.home.practiceSection.pills.0.category` | Self Concept | Selbstkonzept | 自我概念 | Zelfconcept | Concept de soi | Concetto di se | Autoconceito | Autoconcepto |
| `marketing.home.practiceSection.pills.0.color` | pink | pink | pink | pink | pink | pink | pink | pink |
| `marketing.home.practiceSection.pills.0.label` | Love, SP, Self-Concept | Liebe, SP, Selbstkonzept | 爱情、SP、自我概念 | Liefde, SP, Zelfconcept | Amour, SP, concept de soi | Amore, SP, Concetto di se | Amor, SP, autoconceito | Amor, SP, autoconcepto |
| `marketing.home.practiceSection.pills.1.category` | Law of Assumption | Gesetz der Annahme | 假设法则 | Law of Assumption | Loi de l'assomption | Legge dell'Assunzione | Lei da assunção | Ley de la asunción |
| `marketing.home.practiceSection.pills.1.color` | green | green | green | green | green | green | green | green |
| `marketing.home.practiceSection.pills.1.label` | Abundance | Fülle | 丰盛 | Overvloed | Abondance | Abbondanza | Abundância | Abundancia |
| `marketing.home.practiceSection.pills.2.category` | Self Concept | Selbstkonzept | 自我概念 | Zelfconcept | Concept de soi | Concetto di se | Autoconceito | Autoconcepto |
| `marketing.home.practiceSection.pills.2.color` | blue | blue | blue | blue | blue | blue | blue | blue |
| `marketing.home.practiceSection.pills.2.label` | Confidence | Selbstvertrauen | 自信 | Zelfvertrouwen | Confiance | Fiducia | Confiança | Confianza |
| `marketing.home.practiceSection.pills.3.category` | Self Concept | Selbstkonzept | 自我概念 | Zelfconcept | Concept de soi | Concetto di se | Autoconceito | Autoconcepto |
| `marketing.home.practiceSection.pills.3.color` | yellow | yellow | yellow | yellow | yellow | yellow | yellow | yellow |
| `marketing.home.practiceSection.pills.3.label` | Peace | Innere Ruhe | 平和 | Rust | Paix | Pace | Paz | Paz |
| `marketing.home.stats.0.label` | manifestation tools | Manifestations-Tools | 显化工具 | manifestatietools | outils de manifestation | strumenti di manifestazione | ferramentas | herramientas |
| `marketing.home.stats.0.value` | 10+ | 10+ | 10+ | 10+ | 10+ | 10+ | 10+ | 10+ |
| `marketing.home.stats.1.label` | subliminals per month | Subliminals pro Monat | 每月潜意识音频 | subliminals per maand | subliminaux par mois | subliminali al mese | subliminares por mês | subliminales al mes |
| `marketing.home.stats.1.value` | 30 | 30 | 30 | 30 | 30 | 30 | 30 | 30 |
| `marketing.home.stats.2.label` | mirror work scenes | Mirror-Work-Szenen | 镜前练习场景 | mirror work-scenes | scenes de travail du miroir | scene di mirror work | cenas com espelho | escenas con espejo |
| `marketing.home.stats.2.value` | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 |
| `marketing.home.stats.3.label` | AI guide options | KI-Coach-Optionen | AI 指南选项 | AI-gidsopties | options de guide IA | opzioni guida AI | opções de guia IA | opciones de guía IA |
| `marketing.home.stats.3.value` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| `marketing.home.stickyBarAria` | Download Palette Plotting | Palette Plotting herunterladen | 下载 Palette Plotting | Download Palette Plotting | Telecharger Palette Plotting | Scarica Palette Plotting | Baixar Palette Plotting | Descargar Palette Plotting |
| `marketing.home.testimonials.carouselAria` | User testimonials | Nutzerbewertungen | 用户评价 | Gebruikersreviews | Temoignages utilisateurs | Testimonianze utenti | Depoimentos de usuários | Testimonios de usuarios |
| `marketing.home.testimonials.headlineLine1` | Results from our | Ergebnisse von unseren | 来自我们的 | Resultaten van onze | Resultats de nos | Risultati dei nostri | Resultados dos nossos | Resultados de nuestros |
| `marketing.home.testimonials.headlineLine2` | Users & Testers | Nutzer:innen & Tester:innen | 用户与测试者的结果 | Gebruikers & Testers | Utilisateurs et Testeurs | Utenti e Tester | usuários e testadores | usuarios y testers |
| `marketing.home.testimonials.items.0.name` | Maya T. | Maya T. | Maya T. | Maya T. | Maya T. | Maya T. | Maya T. | Maya T. |
| `marketing.home.testimonials.items.0.quote` | When I waver and the 3D gets loud af I would ditch my whole SP routine and go hunt for a new method or crashout. Now I script and do mirror work here and actually stay on my storyline instead of scrolling manifest TikTok at 2am. | Wenn ich ins Wanken gerate und die 3D richtig laut wird, habe ich meine ganze SP-Routine hingeworfen und nach der nächsten Methode gesucht oder bin komplett ausgerastet. Jetzt schreibe ich hier Scriptings und mache Mirror Work und bleibe wirklich auf meiner Storyline, statt um 2 Uhr nachts Manifestation-TikTok zu scrollen. | 当我动摇、3D 现实吵得不行时，我以前会直接放弃整套 SP 日常，去找新方法或情绪崩盘。现在我在这里做脚本和镜前练习，真的能稳住自己的故事线，不会凌晨两点刷显化 TikTok。 | Wanneer ik ging wankelen en de 3D superluid werd, liet ik mijn hele SP-routine vallen om een nieuwe methode te zoeken of compleet te crashen. Nu script ik en doe ik mirror work hier en blijf ik echt op mijn verhaallijn in plaats van om 2 uur 's nachts manifestatie-TikTok te scrollen. | Quand je vacille et que la 3D devient trop bruyante, j'abandonnais toute ma routine SP pour chercher une nouvelle methode ou craquer. Maintenant je fais du scripting et du travail du miroir ici, et je reste vraiment dans mon storyline au lieu de scroller des TikTok de manifestation a 2 h du mat. | Quando vacillo e il 3D diventa super rumoroso, lasciavo tutta la mia routine SP per cercare un nuovo metodo o andare nel panico. Ora faccio scripting e mirror work qui e resto davvero sulla mia linea narrativa invece di scorrere TikTok sulla manifestazione alle 2 del mattino. | Quando vacilo e o 3D pesa, eu abandonava minha rotina de SP. Agora faço scripting e espelho aqui e fico na minha história. | Cuando dudo y el 3D pesa, antes dejaba mi rutina de SP. Ahora hago scripting y espejo aquí y sigo en mi historia. |
| `marketing.home.testimonials.items.0.role` | SP & self-concept | SP & Selbstkonzept | SP 与自我概念 | SP & zelfconcept | SP et concept de soi | SP e concetto di se | SP e autoconceito | SP y autoconcepto |
| `marketing.home.testimonials.items.1.name` | Devon K. | Devon K. | Devon K. | Devon K. | Devon K. | Devon K. | Devon K. | Devon K. |
| `marketing.home.testimonials.items.1.quote` | My brain still wants to argue before I even start my robotic affirming. But this app, the teleprompter, and reps counter help me finish my session instead of struggling alone. | Mein Kopf will immer noch diskutieren, bevor ich überhaupt mit meinem Robotic Affirming anfange. Aber mit dieser App, dem Teleprompter und dem Wiederholungszähler beende ich meine Session, statt allein damit zu kämpfen. | 在开始机器人式肯定前，我的大脑还是会先反驳。但这个应用、提词器和次数计数器让我能完成整次练习，不再一个人硬扛。 | Mijn brein wil nog steeds discussieren voordat ik begin met robotisch affirmeren. Maar deze app, de teleprompter en de rep-counter helpen me mijn sessie af te maken in plaats van er alleen mee te worstelen. | Mon cerveau veut encore argumenter avant meme que je commence mon affirmation robotique. Mais cette app, le teleprompteur et le compteur de repetitions m'aident a finir ma session au lieu de galerer seule. | Il mio cervello vuole ancora discutere prima ancora che inizi con le affermazioni robotiche. Ma quest'app, il teleprompter e il contatore ripetizioni mi aiutano a finire la sessione invece di lottare da sola. | Meu cérebro ainda quer discutir antes de começar a afirmação robótica. Mas este app, a tela de leitura e o contador de repetições me ajudam a terminar a sessão em vez de lutar sozinha. | Mi cerebro todavía quiere discutir antes de empezar mi afirmación robótica. Pero esta app, la pantalla de lectura y el contador de repeticiones me ayudan a terminar la sesión en lugar de luchar sola. |
| `marketing.home.testimonials.items.1.role` | Law of Assumption · scripting | Gesetz der Annahme · Scripting | 假设法则 · 脚本书写 | Law of Assumption · scripting | Loi de l'assomption · scripting | Legge dell'Assunzione · scripting | Lei da assunção · scripting | Ley de la asunción · scripting |
| `marketing.home.testimonials.items.2.name` | Jade L. | Jade L. | Jade L. | Jade L. | Jade L. | Jade L. | Jade L. | Jade L. |
| `marketing.home.testimonials.items.2.quote` | YouTube subliminals never hit because it's not my voice or my exact words. I made one here with my affirmations + binaural beats and it's the only one I loop without getting bored in 2 days. | YouTube-Subliminals haben bei mir nie funktioniert, weil es weder meine Stimme noch meine exakten Worte sind. Ich habe hier eins mit meinen Affirmationen + binauralen Beats erstellt, und das ist das einzige, das ich in Schleife höre, ohne nach zwei Tagen gelangweilt zu sein. | YouTube 的潜意识音频对我没效果，因为不是我的声音，也不是我的原话。我在这里用自己的肯定语 + 双耳节拍做了一个，这是唯一一个我循环听也不会两天就腻的。 | YouTube-subliminals werkten nooit omdat het niet mijn stem of mijn exacte woorden waren. Ik maakte er hier een met mijn affirmaties + binaurale beats en dit is de enige die ik in een loop luister zonder me na 2 dagen te vervelen. | Les subliminaux YouTube ne marchaient jamais parce que ce n'etait ni ma voix ni mes mots exacts. J'en ai cree un ici avec mes affirmations + des binauraux, et c'est le seul que je peux boucler sans me lasser en 2 jours. | I subliminali su YouTube non funzionavano perche non erano la mia voce o le mie parole esatte. Ne ho creato uno qui con le mie affermazioni + battiti binaurali ed e l'unico che ripeto in loop senza annoiarmi dopo 2 giorni. | Subliminares do YouTube nunca funcionavam porque não era minha voz nem minhas palavras exatas. Fiz um aqui com minhas afirmações + batidas binaurais e é o único que repito sem enjoar em 2 dias. | Los subliminales de YouTube nunca funcionaban porque no era mi voz ni mis palabras exactas. Hice uno aquí con mis afirmaciones + binaurales y es el único que repito sin aburrirme en 2 días. |
| `marketing.home.testimonials.items.2.role` | Subliminals · affirming | Subliminals · Affirming | 潜意识音频 · 肯定 | Subliminals · affirmeren | Subliminaux · affirmations | Subliminali · affermazioni | Subliminares · afirmação | Subliminales · afirmación |
| `marketing.home.testimonials.next` | Next testimonial | Nächste Bewertung | 下一条评价 | Volgende review | Temoignage suivant | Testimonianza successiva | Próximo depoimento | Siguiente testimonio |
| `marketing.home.testimonials.pageN` | Testimonial {{n}} | Bewertung {{n}} | 评价 {{n}} | Review {{n}} | Temoignage {{n}} | Testimonianza {{n}} | Depoimento {{n}} | Testimonio {{n}} |
| `marketing.home.testimonials.pagesAria` | Testimonial pages | Bewertungsseiten | 评价分页 | Reviewpagina's | Pages des temoignages | Pagine testimonianze | Páginas de depoimentos | Páginas de testimonios |
| `marketing.home.testimonials.previous` | Previous testimonial | Vorherige Bewertung | 上一条评价 | Vorige review | Temoignage precedent | Testimonianza precedente | Depoimento anterior | Testimonio anterior |
| `marketing.home.testimonials.starsAria` | 5 out of 5 stars | 5 von 5 Sternen | 5 星满分 | 5 van 5 sterren | 5 etoiles sur 5 | 5 stelle su 5 | 5 de 5 estrelas | 5 de 5 estrellas |

---

# Section 2 — What is Palette Plotting (`marketing.whatIsPalettePlotting.*` + `marketing.pricing.features.*`)

Keys: 20

| Key | EN | de | zh-Hans | nl | fr | it | pt-BR | es-419 |
|-----|------|------|------|------|------|------|------|------|
| `marketing.pricing.features.affirmations.description` | Have your custom affirmations shown on a teleprompter-like screen, count your reps, and visualize. | Lass dir deine individuellen Affirmationen auf einem Teleprompter-ähnlichen Bildschirm anzeigen, zähle deine Wiederholungen und visualisiere. | 在提词器式界面显示你的自定义肯定语，记录重复次数，并进行可视化练习。 | Toon je aangepaste affirmaties op een teleprompter-achtig scherm, tel je herhalingen en visualiseer. | Affiche tes affirmations sur un ecran type teleprompteur, compte tes repetitions et visualise. | Visualizza le tue affermazioni personalizzate su uno schermo tipo teleprompter, conta le ripetizioni e visualizza. | Veja suas afirmações em uma tela de leitura, conte repetições e visualize. | Muestra tus afirmaciones en una pantalla de lectura, cuenta tus repeticiones y visualiza. |
| `marketing.pricing.features.affirmations.title` | Robotic Affirm & Script Your Life | Robotic Affirming & Script Your Life | 机器人式肯定与人生脚本 | Robotisch Affirmeren en Je Leven Scripten | Affirmation robotique et scripting de ta vie | Affermazioni Robotiche e Script della Tua Vita | Afirmar e escrever | Afirmar y escribir |
| `marketing.pricing.features.beliefs.description` | Deconstruct self-limiting beliefs and integrate expansionary beliefs. | Dekonstruiere selbstlimitierende Glaubenssätze und integriere förderliche, erweiternde Überzeugungen. | 拆解自我限制信念，并整合更具扩展性的信念。 | Breek zelfbeperkende overtuigingen af en integreer verruimende overtuigingen. | Deconstruis les croyances limitantes et integre des croyances expansives. | Decostruisci le credenze auto-limitanti e integra credenze espansive. | Desconstrua crenças limitantes e integre crenças expansivas. | Desconstruye creencias limitantes e integra creencias expansivas. |
| `marketing.pricing.features.beliefs.title` | Address Self-Limiting Beliefs | Selbstlimitierende Glaubenssätze lösen | 打破自我限制信念 | Pak Zelfbeperkende Overtuigingen Aan | Traiter les croyances limitantes | Affronta le Credenze Auto-Limitanti | Abordar crenças limitantes | Aborda creencias limitantes |
| `marketing.pricing.features.coach.description` | Ask questions you're scared to ask anyone else, and get advice when you're wavering due to 3D circumstances. | Stelle Fragen, die du sonst niemandem stellen würdest, und erhalte Orientierung, wenn du wegen deiner 3D-Umstände ins Wanken gerätst. | 提出你不敢问任何人的问题，并在你因 3D 现实动摇时获得建议。 | Stel vragen die je aan niemand anders durft te stellen en krijg advies wanneer je wankelt door 3D-omstandigheden. | Pose les questions que tu n'oses poser a personne et recois du soutien quand tu vacilles face aux circonstances 3D. | Fai domande che hai paura di fare a chiunque altro e ricevi consigli quando vacilli per via delle circostanze 3D. | Pergunte o que teme dizer e receba apoio quando o 3D pesar. | Pregunta lo que temes decir y recibe apoyo cuando el 3D pese. |
| `marketing.pricing.features.coach.title` | Digital Manifesting Coach | Digitaler Manifestations-Coach | 数字显化教练 | Digitale Manifestatiecoach | Coach digital de manifestation | Coach Digitale di Manifestazione | Coach digital de manifestação | Coach digital de manifestación |
| `marketing.pricing.features.journal.description` | Journal, document inspired action, and track your progress with manifesting lists. | Führe Journal, dokumentiere inspirierte Handlungen und verfolge deinen Fortschritt mit Manifestationslisten. | 写日记、记录灵感行动，并用显化清单追踪你的进度。 | Schrijf in je journal, leg inspired action vast en volg je voortgang met manifestatielijsten. | Tiens ton journal, note tes actions inspirees et suis ta progression avec des listes de manifestation. | Scrivi il tuo diario, documenta le azioni ispirate e monitora i tuoi progressi con liste di manifestazione. | Diário, ações inspiradas e listas de manifestação. | Diario, acciones inspiradas y listas de manifestación. |
| `marketing.pricing.features.journal.title` | Journal & Track | Journal führen & Fortschritt tracken | 记录与追踪 | Journalen en Tracken | Journal et suivi | Diario e Monitoraggio | Diário e progresso | Diario y progreso |
| `marketing.pricing.features.mirror.description` | Immerse yourself into digital mirror work's scenes and sounds, as you build self-concept with your affirmations. | Tauche in Szenen und Klänge des digitalen Mirror Work ein, während du mit deinen Affirmationen dein Selbstkonzept stärkst. | 沉浸在数字镜前练习的场景与声音中，用你的肯定语强化自我概念。 | Dompel jezelf onder in scenes en geluiden van digitale mirror work terwijl je je zelfconcept opbouwt met je affirmaties. | Plonge dans des scenes et ambiances de travail du miroir digital pendant que tu renforces ton concept de soi avec tes affirmations. | Immergiti in scene e suoni del mirror work digitale mentre rafforzi il tuo concetto di te con le tue affermazioni. | Mergulhe em cenas e sons de trabalho com espelho digital enquanto fortalece seu autoconceito com suas afirmações. | Sumérgete en escenas y sonidos de trabajo con espejo digital mientras fortaleces tu autoconcepto con tus afirmaciones. |
| `marketing.pricing.features.mirror.title` | Mirror Work | Mirror Work | 镜前练习 | Mirror Work | Travail du miroir | Mirror Work | Espelho | Espejo |
| `marketing.pricing.features.subliminal.description` | Make subliminals with your own voice, binaural beats, background sounds, and layered vocals. | Erstelle Subliminals mit deiner eigenen Stimme, binauralen Beats, Hintergrundsounds und geschichteten Vocals. | 用你的声音、双耳节拍、背景音和分层人声制作专属潜意识音频。 | Maak subliminals met je eigen stem, binaurale beats, achtergrondgeluiden en gelaagde vocals. | Cree des subliminaux avec ta propre voix, des battements binauraux, des sons d'ambiance et des couches vocales. | Crea subliminali con la tua voce, battiti binaurali, suoni di sottofondo e voci sovrapposte. | Crie subliminares com sua própria voz, batidas binaurais, sons de fundo e vocais em camadas. | Crea subliminales con tu propia voz, beats binaurales, sonidos de fondo y voces en capas. |
| `marketing.pricing.features.subliminal.title` | Subliminal Maker | Subliminal-Ersteller | 潜意识音频制作 | Subliminal Maker | Createur de subliminaux | Creatore di Subliminali | Criador de subliminares | Creador de subliminales |
| `marketing.whatIsPalettePlotting.back` | Back | Zurück | 返回 | Terug | Retour | Indietro | Voltar | Atrás |
| `marketing.whatIsPalettePlotting.blog` | blog | Blog | 博客 | blog | blog | blog | blog | blog |
| `marketing.whatIsPalettePlotting.faq` | FAQ | FAQ | 常见问题 | FAQ | FAQ | FAQ | FAQ | FAQ |
| `marketing.whatIsPalettePlotting.footerMiddle` | and our | und in unserem | 以及我们的 | en onze | et notre | e il nostro | e nosso | y nuestro |
| `marketing.whatIsPalettePlotting.footerPrefix` | Palette Plotting is a self-guided toolkit, not therapy or medical care. For clinical or emergency support, contact appropriate professionals. For more on policies and billing, see | Palette Plotting ist ein selbstgeführtes Toolkit, keine Therapie und keine medizinische Versorgung. Für klinische oder akute Unterstützung wende dich an passende Fachstellen. Mehr zu Richtlinien und Abrechnung findest du in den | Palette Plotting 是一套自助工具，不属于心理治疗或医疗服务。如需临床或紧急支持，请联系相应专业人士。想了解政策与账单信息，请查看 | Palette Plotting is een self-guided toolkit, geen therapie of medische zorg. Neem voor klinische of spoedeisende ondersteuning contact op met geschikte professionals. Voor meer over beleid en facturatie, zie | Palette Plotting est une boite a outils d'accompagnement personnel, pas une therapie ni un service medical. Pour un soutien clinique ou d'urgence, contacte les professionnels appropries. Pour en savoir plus sur les politiques et la facturation, consulte | Palette Plotting e un toolkit autoguidato, non una terapia o assistenza medica. Per supporto clinico o d'emergenza, contatta professionisti appropriati. Per maggiori informazioni su policy e fatturazione, vedi le | A Palette Plotting é um conjunto de ferramentas de autoajuda, não terapia nem atendimento médico. Para suporte clínico ou de emergência, contate profissionais adequados. Para mais sobre políticas e cobrança, veja | Palette Plotting es un conjunto de herramientas de autoayuda, no terapia ni atención médica. Para apoyo clínico o de emergencia, contacta a profesionales adecuados. Para más sobre políticas y facturación, consulta |
| `marketing.whatIsPalettePlotting.footerSuffix` | . | . | 。 | . | . | . | . | . |
| `marketing.whatIsPalettePlotting.intro` | Palette Plotting brings your manifestation into one place — so you are not juggling notes, random subliminal playlists, screenshots, voice memos, journals, and scattered methods when doubt shows up. Use it to write the story, hear it, see it, repeat it, and live in the end. | Palette Plotting bündelt deine Manifestationspraxis an einem Ort - damit du bei aufkommenden Zweifeln nicht zwischen Notizen, zufälligen Subliminal-Playlists, Screenshots, Sprachnotizen, Journalen und verstreuten Methoden hin- und herwechseln musst. Nutze es, um deine Story zu schreiben, zu hören, zu sehen, zu wiederholen und im Endzustand zu leben. | Palette Plotting 把你的显化练习集中在一个地方 - 当怀疑出现时，你不再需要在笔记、零散潜意识播放列表、截图、语音备忘录、日记和分散方法之间来回切换。用它来写下故事、听见故事、看见故事、重复故事，并活在终局里。 | Palette Plotting brengt je manifestatie samen op een plek, zodat je niet hoeft te jongleren met notities, willekeurige subliminal-playlists, screenshots, spraakmemo's, journals en losse methodes wanneer twijfel opkomt. Gebruik het om het verhaal te schrijven, te horen, te zien, te herhalen en in het eindresultaat te leven. | Palette Plotting rassemble ta manifestation au meme endroit - pour que tu ne jongles plus avec des notes, des playlists subliminales aleatoires, des captures d'ecran, des memos vocaux, des journaux et des methodes eparpillees quand le doute apparait. Utilise-le pour ecrire l'histoire, l'entendre, la voir, la repeter et vivre dans la fin. | Palette Plotting riunisce la tua manifestazione in un unico posto, cosi non devi gestire note, playlist subliminali casuali, screenshot, memo vocali, diari e metodi sparsi quando arriva il dubbio. Usalo per scrivere la storia, ascoltarla, vederla, ripeterla e vivere nel risultato finale. | A Palette Plotting concentra sua manifestação em um só lugar — para você não ficar gerenciando notas, playlists aleatórias de subliminares, capturas de tela, notas de voz, diários e métodos dispersos quando a dúvida aparece. Use para escrever a história, ouvir, ver, repetir e viver no final. | Palette Plotting concentra tu manifestación en un solo lugar — para que no estés manejando notas, playlists aleatorias de subliminales, capturas, notas de voz, diarios y métodos dispersos cuando la duda aparece. Úsalo para escribir la historia, escucharla, verla, repetirla y vivir en el final. |
| `marketing.whatIsPalettePlotting.title` | What is Palette Plotting? | Was ist Palette Plotting? | 什么是 Palette Plotting？ | Wat is Palette Plotting? | Qu'est-ce que Palette Plotting ? | Che cos'e Palette Plotting? | O que é Palette Plotting? | ¿Qué es Palette Plotting? |

---

# Section 3 — Manifestation quiz (`marketing.manifestationQuiz.*`)

Keys: 76

| Key | EN | de | zh-Hans | nl | fr | it | pt-BR | es-419 |
|-----|------|------|------|------|------|------|------|------|
| `marketing.manifestationQuiz.email.consent` | By continuing you agree to receive your quiz result and occasional manifestation tips from Palette Plotting. Unsubscribe anytime. | Mit dem Fortfahren stimmst du zu, dein Quiz-Ergebnis und gelegentliche Manifestations-Tipps von Palette Plotting zu erhalten. Abmeldung jederzeit möglich. | 继续即表示你同意接收测验结果，以及来自 Palette Plotting 的不定期显化技巧邮件。可随时取消订阅。 | Door verder te gaan ga je akkoord met het ontvangen van je quizresultaat en af en toe manifestatietips van Palette Plotting. Uitschrijven kan altijd. | En continuant, tu acceptes de recevoir ton resultat de quiz et des conseils occasionnels de manifestation de la part de Palette Plotting. Desinscription a tout moment. | Continuando, accetti di ricevere il risultato del quiz e consigli occasionali sulla manifestazione da Palette Plotting. Puoi annullare l'iscrizione in qualsiasi momento. | Ao continuar, você concorda em receber seu resultado do quiz e dicas ocasionais de manifestação da Palette Plotting. Cancele a assinatura quando quiser. | Al continuar, aceptas recibir tu resultado del quiz y consejos ocasionales de manifestación de Palette Plotting. Cancela la suscripción cuando quieras. |
| `marketing.manifestationQuiz.email.emailInvalid` | Please enter a valid email address. | Bitte gib eine gültige E-Mail-Adresse ein. | 请输入有效的电子邮箱地址。 | Voer een geldig e-mailadres in. | Veuillez saisir une adresse e-mail valide. | Inserisci un indirizzo email valido. | Digite um e-mail válido. | Ingresa un correo electrónico válido. |
| `marketing.manifestationQuiz.email.emailPlaceholder` | Email | E-Mail | 电子邮箱 | E-mail | E-mail | Email | E-mail | Correo |
| `marketing.manifestationQuiz.email.emailRequired` | Please enter your email address. | Bitte gib deine E-Mail-Adresse ein. | 请输入你的电子邮箱地址。 | Voer je e-mailadres in. | Veuillez saisir votre adresse e-mail. | Inserisci il tuo indirizzo email. | Digite seu e-mail. | Ingresa tu correo electrónico. |
| `marketing.manifestationQuiz.email.firstNamePlaceholder` | First name (optional) | Vorname (optional) | 名字（可选） | Voornaam (optioneel) | Prenom (optionnel) | Nome (facoltativo) | Nome (opcional) | Nombre (opcional) |
| `marketing.manifestationQuiz.email.genericError` | Something went wrong. Please try again. | Etwas ist schiefgelaufen. Bitte versuche es erneut. | 出了点问题。请重试。 | Er ging iets mis. Probeer het opnieuw. | Un probleme est survenu. Veuillez reessayer. | Qualcosa e andato storto. Riprova. | Algo deu errado. Tente novamente. | Algo salió mal. Intenta de nuevo. |
| `marketing.manifestationQuiz.email.submit` | Show My Result | Mein Ergebnis anzeigen | 查看我的结果 | Toon Mijn Resultaat | Afficher mon resultat | Mostra il Mio Risultato | Ver meu resultado | Ver mi resultado |
| `marketing.manifestationQuiz.email.submitting` | Saving… | Wird gespeichert... | 保存中… | Opslaan… | Enregistrement... | Salvataggio in corso… | Salvando… | Guardando… |
| `marketing.manifestationQuiz.email.subtitle` | We'll save your result and give you a personalized recommendation. | Wir speichern dein Ergebnis und geben dir eine personalisierte Empfehlung. | 我们会保存你的结果，并给你个性化建议。 | We slaan je resultaat op en geven je een persoonlijke aanbeveling. | On sauvegarde ton resultat et on te donne une recommandation personnalisee. | Salveremo il tuo risultato e ti daremo una raccomandazione personalizzata. | Vamos salvar seu resultado e dar uma recomendação personalizada. | Guardaremos tu resultado y te daremos una recomendación personalizada. |
| `marketing.manifestationQuiz.email.title` | Get Your Manifestation Diagnosis | Erhalte deine Manifestations-Diagnose | 获取你的显化诊断 | Ontvang Je Manifestatiediagnose | Obtiens ton diagnostic de manifestation | Ricevi la Tua Diagnosi di Manifestazione | Receba seu diagnóstico de manifestação | Recibe tu diagnóstico de manifestación |
| `marketing.manifestationQuiz.intro.eyebrow` | Palette Plotting Quiz | Palette Plotting Quiz | Palette Plotting 测验 | Palette Plotting Quiz | Quiz Palette Plotting | Quiz Palette Plotting | Quiz Palette Plotting | Quiz Palette Plotting |
| `marketing.manifestationQuiz.intro.meta` | Five questions · about two minutes · one clear next step | Fünf Fragen · etwa zwei Minuten · ein klarer nächster Schritt | 五个问题 · 约两分钟 · 一个清晰下一步 | Vijf vragen · ongeveer twee minuten · een heldere volgende stap | Cinq questions · environ deux minutes · une prochaine etape claire | Cinque domande · circa due minuti · un prossimo passo chiaro | Cinco perguntas · cerca de dois minutos · um próximo passo claro | Cinco preguntas · unos dos minutos · un siguiente paso claro |
| `marketing.manifestationQuiz.intro.startCta` | Start the Quiz | Quiz starten | 开始测验 | Start de Quiz | Commencer le quiz | Inizia il Quiz | Começar o quiz | Empezar el quiz |
| `marketing.manifestationQuiz.intro.subtitle` | A short diagnostic to identify the biggest pattern interfering with your manifestation results. | Eine kurze Analyse, um das wichtigste Muster zu erkennen, das deine Manifestationsergebnisse beeinträchtigt. | 一份简短诊断，帮你找出最影响显化结果的核心模式。 | Een korte diagnose om het grootste patroon te vinden dat je manifestatieresultaten belemmert. | Un diagnostic court pour identifier le plus grand schema qui freine tes resultats de manifestation. | Una breve diagnosi per identificare il pattern principale che sta ostacolando i tuoi risultati di manifestazione. | Um diagnóstico rápido para identificar o padrão que mais interfere nos seus resultados de manifestação. | Un diagnóstico breve para identificar el patrón que más interfiere con tus resultados de manifestación. |
| `marketing.manifestationQuiz.intro.title` | What's Blocking Your Manifestation Right Now? | Was blockiert deine Manifestation gerade? | 此刻真正阻碍你显化的是什么？ | Wat Blokkeert Je Manifestatie Op Dit Moment? | Qu'est-ce qui bloque ta manifestation en ce moment ? | Cosa Sta Bloccando la Tua Manifestazione in Questo Momento? | O que está bloqueando sua manifestação agora? | ¿Qué está bloqueando tu manifestación ahora? |
| `marketing.manifestationQuiz.nav.back` | Back | Zurück | 返回 | Terug | Retour | Indietro | Voltar | Atrás |
| `marketing.manifestationQuiz.nav.questionProgress` | Question {{current}} of {{total}} | Frage {{current}} von {{total}} | 第 {{current}} 题，共 {{total}} 题 | Vraag {{current}} van {{total}} | Question {{current}} sur {{total}} | Domanda {{current}} di {{total}} | Pergunta {{current}} de {{total}} | Pregunta {{current}} de {{total}} |
| `marketing.manifestationQuiz.questions.q1.options.check_signs` | Check for signs or movement. | Nach Zeichen oder Bewegung schauen. | 不停查看迹象或进展。 | Controleren op signalen of beweging. | Verifier les signes ou du mouvement. | Cerco segni o movimenti. | Buscar sinais ou movimento. | Buscar señales o movimiento. |
| `marketing.manifestationQuiz.questions.q1.options.rewrite` | Rewrite affirmations or scripts. | Affirmationen oder Scriptings umschreiben. | 重写肯定语或脚本。 | Affirmaties of scripts herschrijven. | Reecrire affirmations ou scripts. | Riscrivo affermazioni o script. | Reescrever afirmações ou roteiros. | Reescribir afirmaciones o guiones. |
| `marketing.manifestationQuiz.questions.q1.options.spiral` | Spiral and assume it isn't working. | Ins Grübeln geraten und annehmen, dass es nicht funktioniert. | 陷入负面循环，觉得根本没效果。 | In een spiraal raken en aannemen dat het niet werkt. | Partir en spirale et supposer que ca ne marche pas. | Vado in spirale e penso che non stia funzionando. | Entrar em espiral e assumir que não está funcionando. | Entrar en espiral y asumir que no funciona. |
| `marketing.manifestationQuiz.questions.q1.options.stop` | Stop practicing altogether. | Die Praxis komplett abbrechen. | 彻底停止练习。 | Helemaal stoppen met oefenen. | Arreter totalement la pratique. | Smetto del tutto di praticare. | Parar de praticar completamente. | Dejar de practicar por completo. |
| `marketing.manifestationQuiz.questions.q1.prompt` | When your manifestation feels delayed, what do you usually do? | Wenn sich deine Manifestation verzögert anfühlt, was tust du meistens? | 当你感觉显化迟迟未到时，你通常会怎么做？ | Wat doe je meestal wanneer je manifestatie vertraagd voelt? | Quand ta manifestation semble tarder, que fais-tu generalement ? | Quando la tua manifestazione sembra in ritardo, cosa fai di solito? | Quando sua manifestação parece atrasada, o que você geralmente faz? | Cuando tu manifestación se siente retrasada, ¿qué sueles hacer? |
| `marketing.manifestationQuiz.questions.q2.options.intrusive` | Intrusive thoughts. | Aufdringliche Gedanken. | 侵入性念头。 | Opdringerige gedachten. | Les pensees intrusives. | Pensieri intrusivi. | Pensamentos intrusivos. | Pensamientos intrusivos. |
| `marketing.manifestationQuiz.questions.q2.options.old_assumptions` | Falling back into old assumptions. | In alte Annahmen zurückzufallen. | 总是掉回旧假设。 | Terugvallen in oude aannames. | Retomber dans les anciennes assumptions. | Ricadere nelle vecchie assunzioni. | Voltar a suposições antigas. | Volver a viejas suposiciones. |
| `marketing.manifestationQuiz.questions.q2.options.opposite_3d` | Seeing the opposite in the 3D. | Das Gegenteil in der 3D zu sehen. | 在 3D 现实里看到相反结果。 | Het tegenovergestelde zien in de 3D. | Voir l'oppose dans la 3D. | Vedere l'opposto nel 3D. | Ver o oposto no 3D. | Ver lo opuesto en el 3D. |
| `marketing.manifestationQuiz.questions.q2.options.starting_over` | Starting over constantly. | Ständig von vorne anzufangen. | 不断从头开始。 | Steeds opnieuw beginnen. | Recommencer en permanence. | Ricominciare continuamente. | Começar de novo constantemente. | Empezar de nuevo constantemente. |
| `marketing.manifestationQuiz.questions.q2.prompt` | What frustrates you most? | Was frustriert dich am meisten? | 最让你挫败的是什么？ | Wat frustreert je het meest? | Qu'est-ce qui te frustre le plus ? | Cosa ti frustra di piu? | O que mais te frustra? | ¿Qué te frustra más? |
| `marketing.manifestationQuiz.questions.q3.options.checking` | I keep checking for evidence. | Ich suche ständig nach Beweisen. | 我总在找证据。 | Ik blijf zoeken naar bewijs. | Je verifie constamment les preuves. | Continuo a cercare prove. | Fico buscando evidências. | Sigo buscando evidencia. |
| `marketing.manifestationQuiz.questions.q3.options.confident_panic` | I feel confident and then panic. | Ich bin erst selbstsicher und dann plötzlich in Panik. | 我先自信，然后又恐慌。 | Ik voel me zelfverzekerd en raak daarna in paniek. | Je me sens confiante puis je panique. | Mi sento sicura/o e poi vado nel panico. | Me sinto confiante e depois entro em pânico. | Me siento segura y luego entro en pánico. |
| `marketing.manifestationQuiz.questions.q3.options.every_method` | I've tried almost every method. | Ich habe fast jede Methode ausprobiert. | 几乎所有方法我都试过。 | Ik heb bijna elke methode geprobeerd. | J'ai teste presque toutes les methodes. | Ho provato quasi ogni metodo. | Já tentei quase todos os métodos. | He probado casi todos los métodos. |
| `marketing.manifestationQuiz.questions.q3.options.replaying` | I keep replaying old situations. | Ich spiele alte Situationen immer wieder durch. | 我会反复回放过去的情境。 | Ik blijf oude situaties opnieuw afspelen. | Je rejoue sans cesse d'anciennes situations. | Continuo a ripassare vecchie situazioni. | Fico repassando situações antigas. | Sigo repasando situaciones viejas. |
| `marketing.manifestationQuiz.questions.q3.prompt` | Which statement sounds most like you? | Welche Aussage trifft am ehesten auf dich zu? | 哪句话最像你？ | Welke uitspraak klinkt het meest als jij? | Quelle phrase te ressemble le plus ? | Quale affermazione ti somiglia di piu? | Qual soa mais como você? | ¿Cuál suena más como tú? |
| `marketing.manifestationQuiz.questions.q4.options.daily_practice` | Maintaining a daily practice. | Eine tägliche Praxis beizubehalten. | 维持每日练习。 | Een dagelijkse practice volhouden. | Maintenir une pratique quotidienne. | Mantenere una pratica quotidiana. | Manter uma rotina diária. | Mantener una rutina diaria. |
| `marketing.manifestationQuiz.questions.q4.options.ignoring_3d` | Ignoring current circumstances. | Aktuelle Umstände zu ignorieren. | 无视当下现实。 | Huidige omstandigheden negeren. | Ignorer les circonstances actuelles. | Ignorare le circostanze attuali. | Ignorar as circunstâncias atuais. | Ignorar las circunstancias actuales. |
| `marketing.manifestationQuiz.questions.q4.options.one_approach` | Committing to one approach. | Mich auf einen Ansatz festzulegen. | 坚持一种方法。 | Je verbinden aan een aanpak. | M'engager sur une seule approche. | Impegnarmi in un unico approccio. | Comprometer-se com um único enfoque. | Comprometerse con un solo enfoque. |
| `marketing.manifestationQuiz.questions.q4.options.steady` | Staying emotionally steady. | Emotional stabil zu bleiben. | 保持情绪稳定。 | Emotioneel stabiel blijven. | Rester emotionnellement stable. | Restare emotivamente stabile. | Manter a estabilidade emocional. | Mantener la estabilidad emocional. |
| `marketing.manifestationQuiz.questions.q4.prompt` | What is hardest for you? | Was fällt dir am schwersten? | 你最难做到的是什么？ | Wat is het moeilijkst voor je? | Qu'est-ce qui est le plus difficile pour toi ? | Cosa ti risulta piu difficile? | O que é mais difícil para você? | ¿Qué es lo más difícil para ti? |
| `marketing.manifestationQuiz.questions.q5.options.daily_routine` | A daily routine that keeps me consistent. | Eine tägliche Routine, die mich konsequent hält. | 一个让我持续执行的日常流程。 | Een dagelijkse routine die me consistent houdt. | Une routine quotidienne qui me garde constante. | Una routine quotidiana che mi mantenga costante. | Uma rotina diária que me mantenha consistente. | Una rutina diaria que me mantenga constante. |
| `marketing.manifestationQuiz.questions.q5.options.detachment` | A detachment reset. | Ein Reset für Loslassen und Abstand. | 一次抽离重置。 | Een reset in loslaten. | Un reset de detachement. | Un reset di distacco. | Um reset de desapego. | Un reinicio de desapego. |
| `marketing.manifestationQuiz.questions.q5.options.simple_system` | A simple manifestation system. | Ein einfaches Manifestationssystem. | 一个简单的显化系统。 | Een eenvoudig manifestatiesysteem. | Un systeme de manifestation simple. | Un sistema di manifestazione semplice. | Um sistema simples de manifestação. | Un sistema simple de manifestación. |
| `marketing.manifestationQuiz.questions.q5.options.stabilize` | Stabilizing my mindset. | Meine innere Haltung zu stabilisieren. | 稳定我的心态。 | Mijn mindset stabiliseren. | Stabiliser mon etat d'esprit. | Stabilizzare il mio mindset. | Estabilizar minha mentalidade. | Estabilizar mi mentalidad. |
| `marketing.manifestationQuiz.questions.q5.prompt` | Which sounds most helpful right now? | Was wäre jetzt am hilfreichsten für dich? | 现在对你最有帮助的是哪一种？ | Wat zou nu het meest helpen? | Qu'est-ce qui te serait le plus utile maintenant ? | Cosa ti sarebbe piu utile in questo momento? | O que parece mais útil agora? | ¿Qué te suena más útil ahora? |
| `marketing.manifestationQuiz.result.actionStepHeading` | One free action step | Ein kostenloser Handlungsschritt | 一个免费行动步骤 | Een gratis actiestap | Une action gratuite | Un'azione gratuita | Um passo de ação gratuito | Un paso de acción gratis |
| `marketing.manifestationQuiz.result.buildPractice` | Build your personalized manifestation practice in Palette Plotting. | Baue deine personalisierte Manifestationspraxis in Palette Plotting auf. | 在 Palette Plotting 建立属于你的个性化显化练习。 | Bouw je persoonlijke manifestatiepraktijk in Palette Plotting. | Construis ta pratique personnalisee de manifestation dans Palette Plotting. | Costruisci la tua pratica di manifestazione personalizzata in Palette Plotting. | Construa sua prática de manifestação personalizada na Palette Plotting. | Construye tu práctica de manifestación personalizada en Palette Plotting. |
| `marketing.manifestationQuiz.result.eyebrow` | Your diagnosis | Deine Diagnose | 你的诊断结果 | Jouw diagnose | Ton diagnostic | La tua diagnosi | Seu diagnóstico | Tu diagnóstico |
| `marketing.manifestationQuiz.result.readOnBlog` | Read on the Palette Plotting blog → | Im Palette Plotting-Blog lesen -> | 前往 Palette Plotting 博客阅读 → | Lees op de Palette Plotting-blog → | Lire sur le blog Palette Plotting → | Leggi sul blog di Palette Plotting → | Ler no blog da Palette Plotting → | Leer en el blog de Palette Plotting → |
| `marketing.manifestationQuiz.result.recommended` | Recommended for you | Für dich empfohlen | 为你推荐 | Aanbevolen voor jou | Recommande pour toi | Consigliato per te | Recomendado para você | Recomendado para ti |
| `marketing.manifestationQuiz.result.relatedGuide` | Related guide | Passender Guide | 相关指南 | Gerelateerde gids | Guide associe | Guida correlata | Guia relacionado | Guía relacionada |
| `marketing.manifestationQuiz.result.retake` | Retake the quiz | Quiz erneut machen | 重新测验 | Doe de quiz opnieuw | Refaire le quiz | Rifai il quiz | Fazer o quiz novamente | Repetir el quiz |
| `marketing.manifestationQuiz.result.startTrial` | Start Free Trial | Kostenlose Testphase starten | 开始免费试用 | Start Gratis Proefperiode | Commencer l'essai gratuit | Inizia la Prova Gratuita | Começar teste grátis | Empezar prueba gratis |
| `marketing.manifestationQuiz.result.whatThisMeans` | What this means | Was das bedeutet | 这意味着什么 | Wat dit betekent | Ce que cela signifie | Cosa significa | O que isso significa | Qué significa esto |
| `marketing.manifestationQuiz.results.method_hopper.actionStep` | Commit to one tool for seven days. No new scripts, no new creator, no new "secret method." Same assumption, same format, daily. | Lege dich für sieben Tage auf ein Tool fest. Keine neuen Scriptings, kein neuer Creator, keine neue "geheime Methode". Gleiche Annahme, gleiches Format, täglich. | 连续七天只用一个工具。不加新脚本、不换新博主、不找新“秘密方法”。同一个假设，同一种形式，每天执行。 | Commit je zeven dagen aan een tool. Geen nieuwe scripts, geen nieuwe creator, geen nieuwe "geheime methode". Dezelfde aanname, hetzelfde format, dagelijks. | Engage-toi sur un seul outil pendant sept jours. Pas de nouveaux scripts, pas de nouveau createur, pas de "methode secrete". Meme assumption, meme format, tous les jours. | Impegnati con uno strumento per sette giorni. Niente nuovi script, niente nuovo creator, niente nuovo "metodo segreto". Stessa assunzione, stesso formato, ogni giorno. | Comprometa-se com uma ferramenta por sete dias. Sem roteiros novos, sem criadores novos, sem "método secreto". Mesma suposição, mesmo formato, todos os dias. | Comprométete con una herramienta por siete días. Sin guiones nuevos, sin creadores nuevos, sin "método secreto". Misma suposición, mismo formato, cada día. |
| `marketing.manifestationQuiz.results.method_hopper.explanation` | You switch techniques, affirmations, coaches, and routines before any of them have time to work. It can look like progress, but the pattern is distrust — starting fresh instead of staying with one assumption. | Du wechselst Techniken, Affirmationen, Coaches und Routinen, bevor eine davon Zeit hat zu wirken. Das kann wie Fortschritt aussehen, ist aber oft Misstrauen - immer wieder neu beginnen, statt bei einer Annahme zu bleiben. | 你会在方法、肯定语、教练和流程之间不断切换，还没来得及见效就换下一套。看起来像在进步，但背后模式是“不信任”：不断重启，而不是守住一个假设。 | Je wisselt technieken, affirmaties, coaches en routines voordat ze tijd krijgen om te werken. Het kan eruitzien als vooruitgang, maar het patroon is wantrouwen: opnieuw beginnen in plaats van bij een aanname blijven. | Tu changes de techniques, d'affirmations, de coachs et de routines avant qu'elles aient le temps de fonctionner. Cela peut ressembler a du progres, mais le schema reel est la mefiance - recommencer au lieu de rester avec une seule assumption. | Cambi tecniche, affermazioni, coach e routine prima che abbiano il tempo di funzionare. Può sembrare progresso, ma il pattern e sfiducia: ripartire da zero invece di restare con una sola assunzione. | Você troca técnicas, afirmações, coaches e rotinas antes de qualquer uma ter tempo de funcionar. Pode parecer progresso, mas o padrão é desconfiança — começar de novo em vez de sustentar uma suposição. | Cambias técnicas, afirmaciones, coaches y rutinas antes de que cualquiera tenga tiempo de funcionar. Puede parecer progreso, pero el patrón es desconfianza — empezar de nuevo en lugar de sostener una suposición. |
| `marketing.manifestationQuiz.results.method_hopper.guideTitle` | Why More Techniques Are Not Always Better | Warum mehr Techniken nicht immer besser sind | 为什么方法越多不一定越好 | Waarom Meer Technieken Niet Altijd Beter Zijn | Pourquoi plus de techniques n'est pas toujours mieux | Perche Più Tecniche Non Sono Sempre Meglio | Por que mais técnicas não são sempre melhores | Por qué más técnicas no siempre son mejor |
| `marketing.manifestationQuiz.results.method_hopper.paletteplottingPitch` | Palette Plotting keeps subliminals, scripting, mirror work, and belief work in one place — so you build one system instead of collecting ten half-started ones. | Palette Plotting vereint Subliminals, Scripting, Mirror Work und Glaubenssatzarbeit an einem Ort - damit du ein System aufbaust, statt zehn halbfertige zu sammeln. | Palette Plotting 把潜意识音频、脚本书写、镜前练习和信念练习放在同一处，让你建立一个系统，而不是收集十个半途而废的系统。 | Palette Plotting houdt subliminals, scripting, mirror work en overtuigingswerk op een plek, zodat je een systeem bouwt in plaats van tien halfgestarte systemen verzamelt. | Palette Plotting garde les subliminaux, le scripting, le travail du miroir et le travail des croyances au meme endroit - pour construire un seul systeme plutot que d'en accumuler dix a moitie commences. | Palette Plotting tiene subliminali, scripting, mirror work e belief work in un unico posto: cosi costruisci un sistema solo invece di collezionarne dieci iniziati a meta. | A Palette Plotting mantém subliminares, scripting, trabalho com espelho e trabalho de crenças em um só lugar — para construir um sistema em vez de acumular dez pela metade. | Palette Plotting mantiene subliminales, scripting, trabajo con espejo y trabajo de creencias en un solo lugar — para construir un sistema en lugar de acumular diez a medias. |
| `marketing.manifestationQuiz.results.method_hopper.title` | The Method Hopper | Der Methoden-Hopper | 方法跳跃者 | De Method Hopper | Celle qui saute de methode en methode | La/Il Saltatrice/Saltatore di Metodi | A que pula de método | La que salta de método |
| `marketing.manifestationQuiz.results.no_routine_manifestor.actionStep` | Choose one 5-minute slot (morning coffee, commute, before bed) and one action: listen to a subliminal, read three affirmations, or one mirror round. Same time, same action, seven days. | Wähle ein 5-Minuten-Zeitfenster (Morgenkaffee, Arbeitsweg, vor dem Schlafen) und eine Handlung: ein Subliminal hören, drei Affirmationen lesen oder eine Mirror-Runde. Gleiche Uhrzeit, gleiche Handlung, sieben Tage lang. | 选一个 5 分钟时段（晨间咖啡、通勤、睡前）和一个动作：听一段潜意识音频、读三句肯定语，或做一轮镜前练习。固定时间，固定动作，坚持七天。 | Kies een blok van 5 minuten (ochtendkoffie, woon-werkverkeer, voor het slapen) en een actie: luister een subliminal, lees drie affirmaties of doe een mirror-ronde. Zelfde tijd, zelfde actie, zeven dagen. | Choisis un creneau de 5 minutes (cafe du matin, trajet, avant de dormir) et une action : ecouter un subliminal, lire trois affirmations, ou faire une ronde de miroir. Meme heure, meme action, sept jours. | Scegli una fascia di 5 minuti (caffe del mattino, tragitto, prima di dormire) e un'azione: ascoltare un subliminale, leggere tre affermazioni o un giro di mirror work. Stesso orario, stessa azione, sette giorni. | Escolha um bloco de 5 minutos (café da manhã, deslocamento, antes de dormir) e uma ação: ouvir um subliminal, ler três afirmações ou uma rodada de trabalho com espelho. Mesmo horário, mesma ação, sete dias. | Elige un bloque de 5 minutos (café de la mañana, viaje, antes de dormir) y una acción: escuchar un subliminal, leer tres afirmaciones o una ronda de trabajo con espejo. Mismo tiempo, misma acción, siete días. |
| `marketing.manifestationQuiz.results.no_routine_manifestor.explanation` | You have desire and belief, but no repeatable practice. Inspiration hits, then life takes over — and manifestation becomes something you think about instead of something you do daily. | Du hast Wunsch und Glauben, aber keine wiederholbare Praxis. Inspiration kommt, dann übernimmt der Alltag - und Manifestation wird etwas, worüber du nachdenkst, statt etwas, das du täglich tust. | 你有渴望也有信念，但没有可重复流程。灵感来时会行动，生活一忙就中断，于是显化变成“想一想”，而不是“每天做”。 | Je hebt verlangen en geloof, maar geen herhaalbare practice. Inspiratie komt, dan neemt het leven over, en manifestatie wordt iets waar je aan denkt in plaats van iets wat je dagelijks doet. | Tu as le desir et la croyance, mais pas de pratique repetitive. L'inspiration arrive, puis la vie reprend le dessus - et la manifestation devient quelque chose que tu penses faire, au lieu de quelque chose que tu fais vraiment chaque jour. | Hai desiderio e fede, ma nessuna pratica ripetibile. Arriva l'ispirazione, poi la vita prende il sopravvento, e la manifestazione diventa qualcosa a cui pensi invece di qualcosa che fai ogni giorno. | Você tem desejo e crença, mas não uma prática repetível. A inspiração chega, depois a vida toma conta — e manifestar vira algo que você pensa em vez de algo que faz todos os dias. | Tienes deseo y creencia, pero no una práctica repetible. La inspiración llega, luego la vida toma el control — y manifestar se vuelve algo que piensas en lugar de algo que haces cada día. |
| `marketing.manifestationQuiz.results.no_routine_manifestor.guideTitle` | The Simplest Manifestation Routine Possible | Die einfachste Manifestationsroutine überhaupt | 最简单可执行的显化日常 | De Eenvoudigst Mogelijke Manifestatieroutine | La routine de manifestation la plus simple possible | La Routine di Manifestazione piu Semplice Possibile | A rotina de manifestação mais simples possível | La rutina de manifestación más simple posible |
| `marketing.manifestationQuiz.results.no_routine_manifestor.paletteplottingPitch` | Palette Plotting is built for a daily rhythm — subliminals, affirmations, mirror work, and progress tracking — without turning manifestation into a full-time project. | Palette Plotting ist für einen täglichen Rhythmus gebaut - Subliminals, Affirmationen, Mirror Work und Fortschrittstracking - ohne Manifestation zu einem Vollzeitprojekt zu machen. | Palette Plotting 为每日节奏而设计：潜意识音频、肯定语、镜前练习和进度追踪，一切到位，不把显化变成全职工程。 | Palette Plotting is gebouwd voor een dagelijks ritme - subliminals, affirmaties, mirror work en voortgangstracking - zonder van manifestatie een fulltime project te maken. | Palette Plotting est concu pour un rythme quotidien - subliminaux, affirmations, travail du miroir et suivi de progression - sans transformer la manifestation en projet a plein temps. | Palette Plotting e pensata per un ritmo quotidiano: subliminali, affermazioni, mirror work e monitoraggio dei progressi, senza trasformare la manifestazione in un progetto a tempo pieno. | A Palette Plotting é feita para um ritmo diário — subliminares, afirmações, trabalho com espelho e acompanhamento de progresso — sem transformar manifestação em um projeto em tempo integral. | Palette Plotting está hecho para un ritmo diario — subliminales, afirmaciones, trabajo con espejo y seguimiento de progreso — sin convertir la manifestación en un proyecto de tiempo completo. |
| `marketing.manifestationQuiz.results.no_routine_manifestor.title` | The No-Routine Manifestor | Der Manifestor ohne Routine | 无日常显化者 | De Manifesteerder Zonder Routine | La manifestatrice sans routine | La/Il Manifestatrice/Manifestatore Senza Routine | A manifestadora sem rotina | La manifestadora sin rutina |
| `marketing.manifestationQuiz.results.old_story_repeater.actionStep` | When an old scene replays, interrupt with one revision line: "That was the old version." Do not debate it — redirect once and move on. | Wenn eine alte Szene wieder hochkommt, unterbrich sie mit einem Revisionssatz: "Das war die alte Version." Nicht diskutieren - einmal umlenken und weitergehen. | 当旧场景回放时，用一句修订语打断它：“那是旧版本。”不要辩论，只重定向一次，然后继续前进。 | Wanneer een oude scene terugkomt, onderbreek die met een revisiezin: "Dat was de oude versie." Ga er niet over in discussie - stuur een keer bij en ga verder. | Quand une ancienne scene revient, interromps-la avec une phrase de revision : "C'etait l'ancienne version." Ne negocie pas avec - redirige une fois, puis avance. | Quando ritorna una vecchia scena, interrompila con una frase di revisione: "Quella era la vecchia versione." Non discuterla: reindirizza una volta e vai avanti. | Quando uma cena antiga se repete, interrompa com uma linha de revisão: "Essa era a versão antiga." Não debata — redirecione uma vez e siga. | Cuando una escena vieja se repite, interrumpe con una línea de revisión: "Esa era la versión vieja." No debátelo — redirige una vez y sigue. |
| `marketing.manifestationQuiz.results.old_story_repeater.explanation` | You keep rehearsing old assumptions while trying to create a new reality. Inner conversations, mental replays, and "what if it happens again" loops keep the past active — even when you are doing the "right" techniques. | Du probst alte Annahmen immer wieder, während du versuchst, eine neue Realität zu erschaffen. Innere Gespräche, mentale Wiederholungen und "was, wenn es wieder passiert"-Schleifen halten die Vergangenheit aktiv - selbst wenn du die "richtigen" Techniken nutzt. | 你一边想创造新现实，一边不断复述旧假设。内在对话、心理回放和“要是又发生怎么办”的循环，让过去持续生效，即便你在做“正确”的技巧。 | Je blijft oude aannames repeteren terwijl je een nieuwe realiteit probeert te maken. Innerlijke gesprekken, mentale replays en "wat als het weer gebeurt"-loops houden het verleden actief, zelfs als je de "juiste" technieken doet. | Tu continues a repeter d'anciennes assumptions tout en essayant de creer une nouvelle realite. Conversations internes, replays mentaux et boucles de "et si cela recommence ?" maintiennent le passe actif - meme quand tu fais les techniques "correctes". | Continui a ripetere vecchie assunzioni mentre cerchi di creare una nuova realta. Conversazioni interiori, replay mentali e loop del tipo "e se succede di nuovo" mantengono attivo il passato, anche quando usi le tecniche "giuste". | Você continua ensaiando suposições antigas enquanto tenta criar uma nova realidade. Conversas internas, repassos mentais e loops de "e se acontece de novo?" mantêm o passado ativo — mesmo quando faz as técnicas "certas". | Sigues ensayando viejas suposiciones mientras intentas crear una nueva realidad. Conversaciones internas, repasos mentales y bucles de "¿y si pasa otra vez?" mantienen el pasado activo — incluso cuando haces las técnicas "correctas". |
| `marketing.manifestationQuiz.results.old_story_repeater.guideTitle` | How to Stop Rehearsing the Past | Wie du aufhörst, die Vergangenheit zu proben | 如何停止反复排练过去 | Hoe Je Stopt Met Het Verleden Repeten | Comment arreter de repeter le passe | Come Smettere di Ripassare il Passato | Como parar de ensaiar o passado | Cómo dejar de ensayar el pasado |
| `marketing.manifestationQuiz.results.old_story_repeater.paletteplottingPitch` | Palette Plotting supports belief work and scripting so you can replace the old storyline with language you actually want to live in — not just overlay affirmations on top of it. | Palette Plotting unterstützt Glaubenssatzarbeit und Scripting, damit du die alte Storyline durch Sprache ersetzt, in der du wirklich leben willst - statt nur Affirmationen darüberzulegen. | Palette Plotting 支持信念练习与脚本书写，让你真正替换旧叙事，活进你想要的语言里，而不是只把肯定语叠在旧故事上。 | Palette Plotting ondersteunt overtuigingswerk en scripting zodat je de oude verhaallijn vervangt met taal waarin je echt wilt leven, in plaats van alleen affirmaties eroverheen te leggen. | Palette Plotting soutient le travail des croyances et le scripting pour remplacer l'ancienne storyline par un langage dans lequel tu veux vraiment vivre - pas seulement superposer des affirmations. | Palette Plotting supporta belief work e scripting cosi puoi sostituire la vecchia trama con un linguaggio in cui vuoi davvero vivere, non solo sovrapporre affermazioni sopra. | A Palette Plotting apoia trabalho de crenças e scripting para substituir a história antiga por uma linguagem com que você realmente quer viver — não só afirmações por cima. | Palette Plotting apoya el trabajo de creencias y scripting para reemplazar la vieja historia con un lenguaje con el que realmente quieres vivir — no solo afirmaciones encima. |
| `marketing.manifestationQuiz.results.old_story_repeater.title` | The Old Story Repeater | Der alte-Story-Wiederholer | 旧故事复读者 | De Oude-Verhaal-Herhaler | Celle qui repete l'ancienne histoire | La/Il Ripetitrice/Ripetitore della Vecchia Storia | A que repete a história antiga | La que repite la vieja historia |
| `marketing.manifestationQuiz.results.three_d_checker.actionStep` | Pick one return line for this week: "Quiet is not the final answer." Say it once when you catch yourself scanning for proof — then go back to your day. | Wähle für diese Woche einen Rückkehrsatz: "Stille ist nicht die endgültige Antwort." Sage ihn einmal, wenn du dich dabei erwischst, nach Beweisen zu suchen - und mach dann mit deinem Tag weiter. | 这周选一句“回归句”：“安静不代表最终答案。”当你发现自己又在找证据时，只说一次，然后回到日常。 | Kies een terugkeerlijn voor deze week: "Stilte is niet het eindantwoord." Zeg die een keer wanneer je merkt dat je naar bewijs zoekt en ga daarna terug naar je dag. | Choisis une phrase de retour pour cette semaine : "Le calme n'est pas la reponse finale." Dis-la une fois quand tu te surprends a scanner des preuves - puis retourne a ta journee. | Scegli una frase di rientro per questa settimana: "Il silenzio non e la risposta finale." Dilla una volta quando ti accorgi che stai cercando prove, poi torna alla tua giornata. | Escolha uma linha de retorno para esta semana: "Quietude não é a resposta final." Diga uma vez quando perceber que está buscando provas — e volte ao seu dia. | Elige una línea de retorno para esta semana: "Lo quieto no es la respuesta final." Dila una vez cuando notes que buscas pruebas — y vuelve a tu día. |
| `marketing.manifestationQuiz.results.three_d_checker.explanation` | You react strongly to current circumstances and use them to decide whether your manifestation is working. When the 3D looks quiet or opposite, your assumption gets renegotiated — even if you already chose the end. | Du reagierst stark auf aktuelle Umstände und nutzt sie als Maßstab dafür, ob deine Manifestation funktioniert. Wenn die 3D ruhig ist oder das Gegenteil zeigt, verhandelst du deine Annahme neu - selbst wenn du das Endergebnis bereits gewählt hast. | 你会强烈受当下现实影响，并用它判断显化是否有效。当 3D 看起来安静或相反时，你就会重新谈判自己的假设，即使你已经选定终局。 | Je reageert sterk op huidige omstandigheden en gebruikt die om te bepalen of je manifestatie werkt. Wanneer de 3D stil of tegenovergesteld lijkt, onderhandel je je aanname opnieuw - zelfs als je het eind al had gekozen. | Tu reagis fortement aux circonstances actuelles et tu les utilises pour decider si ta manifestation fonctionne. Quand la 3D parait calme ou opposee, ton assumption est renegociee - meme si tu as deja choisi la fin. | Reagisci con forza alle circostanze attuali e le usi per decidere se la tua manifestazione sta funzionando. Quando il 3D sembra fermo o contrario, la tua assunzione viene rinegoziata, anche se hai gia scelto il risultato finale. | Você reage fortemente às circunstâncias atuais e usa isso para decidir se sua manifestação está funcionando. Quando o 3D parece quieto ou oposto, sua suposição é renegociada — mesmo se você já escolheu o final. | Reaccionas con fuerza a las circunstancias actuales y las usas para decidir si tu manifestación está funcionando. Cuando el 3D se ve quieto u opuesto, tu suposición se renegocia — incluso si ya elegiste el final. |
| `marketing.manifestationQuiz.results.three_d_checker.guideTitle` | How to Stop Reacting to the 3D | Wie du aufhörst, auf die 3D zu reagieren | 如何停止被 3D 现实牵着走 | Hoe Je Stopt Met Reageren op de 3D | Comment arreter de reagir a la 3D | Come Smettere di Reagire al 3D | Como parar de reagir ao 3D | Cómo dejar de reaccionar al 3D |
| `marketing.manifestationQuiz.results.three_d_checker.paletteplottingPitch` | Palette Plotting helps you repeat the end-state on loop — subliminals, affirmations, and mirror work — so the 3D stops acting like the boss of your assumption. | Palette Plotting hilft dir, den Endzustand auf Wiederholung zu setzen - mit Subliminals, Affirmationen und Mirror Work - damit die 3D nicht länger wie der Boss deiner Annahme wirkt. | Palette Plotting 帮你循环强化终局状态 - 潜意识音频、肯定语、镜前练习 - 让 3D 不再像你假设的“老板”。 | Palette Plotting helpt je de eindtoestand op herhaling te zetten - subliminals, affirmaties en mirror work - zodat de 3D zich niet langer gedraagt als de baas van je aanname. | Palette Plotting t'aide a repeter l'etat final en boucle - subliminaux, affirmations et travail du miroir - pour que la 3D arrete de jouer le role de patron de ton assumption. | Palette Plotting ti aiuta a ripetere in loop lo stato finale - subliminali, affermazioni e mirror work - cosi il 3D smette di comportarsi da capo della tua assunzione. | A Palette Plotting ajuda você a repetir o estado final em loop — subliminares, afirmações e trabalho com espelho — para que o 3D deixe de mandar na sua suposição. | Palette Plotting te ayuda a repetir el estado final en loop — subliminales, afirmaciones y trabajo con espejo — para que el 3D deje de mandar sobre tu suposición. |
| `marketing.manifestationQuiz.results.three_d_checker.title` | The 3D Checker | Der 3D-Checker | 3D 检查者 | De 3D-Checker | La controleuse de la 3D | La/Il Checker del 3D | A que checa o 3D | La que revisa el 3D |
| `marketing.manifestationQuiz.results.waver.actionStep` | Write one sentence you will return to when you waver: "I already chose this." Put it on your lock screen or notes app — use it before you rewrite the whole story. | Schreibe einen Satz auf, zu dem du zurückkehrst, wenn du wankst: "Ich habe das bereits gewählt." Lege ihn auf deinen Sperrbildschirm oder in deine Notizen - nutze ihn, bevor du die ganze Story neu schreibst. | 写下一句你在动摇时要回到的话：“我已经做了这个选择。”放到锁屏或备忘录里，在你想重写整套故事前先看它。 | Schrijf een zin waar je naar terugkeert als je wankelt: "Ik heb hier al voor gekozen." Zet hem op je lockscreen of in je notities - gebruik hem voordat je het hele verhaal herschrijft. | Ecris une phrase a laquelle revenir quand tu vacilles : "J'ai deja choisi cela." Mets-la sur ton ecran verrouille ou dans ton app Notes - utilise-la avant de reecrire toute l'histoire. | Scrivi una frase a cui tornare quando vacilli: "L'ho gia scelto." Mettila sulla schermata di blocco o nelle note: usala prima di riscrivere tutta la storia. | Escreva uma frase para voltar quando oscilar: "Eu já escolhi isso." Coloque na tela de bloqueio ou nas notas — use antes de reescrever a história inteira. | Escribe una frase a la que volverás cuando dudes: "Ya elegí esto." Ponla en tu pantalla de bloqueo o en notas — úsala antes de reescribir toda la historia. |
| `marketing.manifestationQuiz.results.waver.explanation` | You believe one day and doubt the next. Your desire is not always the problem — consistency is. The old story gets loud when the 3D pauses, and you abandon the decision you already made. | An einem Tag glaubst du, am nächsten zweifelst du. Dein Wunsch ist nicht immer das Problem - Beständigkeit ist es. Die alte Story wird laut, wenn die 3D pausiert, und du gibst die Entscheidung auf, die du bereits getroffen hast. | 你今天相信，明天怀疑。问题往往不在欲望，而在稳定性。3D 一停滞，旧故事就会变得很大声，你会放弃自己早已做出的决定。 | De ene dag geloof je, de volgende dag twijfel je. Je verlangen is niet altijd het probleem - consistentie wel. Het oude verhaal wordt luid als de 3D pauzeert, en je laat de beslissing los die je al had genomen. | Tu y crois un jour, puis tu doutes le lendemain. Ton desir n'est pas toujours le probleme - la constance, si. L'ancienne histoire reprend de la place quand la 3D fait une pause, et tu abandonnes la decision que tu as deja prise. | Ci credi un giorno e dubiti quello dopo. Il desiderio non e sempre il problema: lo e la costanza. La vecchia storia diventa rumorosa quando il 3D si ferma, e abbandoni la decisione che avevi gia preso. | Você acredita um dia e duvida no outro. Seu desejo não é sempre o problema — a consistência é. A história antiga fica forte quando o 3D pausa, e você abandona a decisão que já tomou. | Crees un día y dudas al siguiente. Tu deseo no siempre es el problema — la constancia sí. La vieja historia se vuelve fuerte cuando el 3D se pausa, y abandonas la decisión que ya tomaste. |
| `marketing.manifestationQuiz.results.waver.guideTitle` | Why Manifestation Feels Easy One Day and Impossible the Next | Warum Manifestation sich an einem Tag leicht und am nächsten unmöglich anfühlt | 为什么显化有时很轻松，有时又难如登天 | Waarom Manifesteren de Ene Dag Makkelijk Voelt en de Volgende Onmogelijk | Pourquoi la manifestation semble facile un jour et impossible le lendemain | Perche la Manifestazione Sembra Facile un Giorno e Impossibile il Giorno Dopo | Por que manifestar parece fácil um dia e impossível no outro | Por qué manifestar se siente fácil un día e imposible al siguiente |
| `marketing.manifestationQuiz.results.waver.paletteplottingPitch` | Palette Plotting gives you a repeatable practice — not another method to hop to — so your mindset has somewhere stable to land when doubt shows up. | Palette Plotting gibt dir eine wiederholbare Praxis - nicht nur die nächste Methode zum Springen - damit dein Mindset einen stabilen Ort hat, wenn Zweifel auftauchen. | Palette Plotting 给你的是可重复的练习，而不是另一个要跳来跳去的方法，让你在怀疑出现时有稳定落点。 | Palette Plotting geeft je een herhaalbare practice, geen nieuwe methode om naartoe te hoppen, zodat je mindset een stabiele plek heeft wanneer twijfel opduikt. | Palette Plotting te donne une pratique repetitive - pas une methode de plus a changer - pour que ton etat d'esprit ait un point d'ancrage stable quand le doute arrive. | Palette Plotting ti offre una pratica ripetibile, non un altro metodo da cui saltare, cosi il tuo mindset ha un punto stabile dove atterrare quando arriva il dubbio. | A Palette Plotting oferece uma prática repetível — não outro método para pular — para que sua mentalidade tenha um lugar estável quando a dúvida aparece. | Palette Plotting te da una práctica repetible — no otro método al que saltar — para que tu mentalidad tenga un lugar estable cuando aparece la duda. |
| `marketing.manifestationQuiz.results.waver.title` | The Waver | Der Wankende | 动摇者 | De Twijfelaar | Celle qui vacille | La/Il Vacillante | A que oscila | La que duda |

---

# Section 4 — Terms of Use + EULA (full text per locale)

Plain text extracted from legal components. English from default branch in `TermsOfService.tsx`.

## Terms — EN

Route: /terms

```
Terms of Use and EULA

              Effective Date: Jan 13, 2025

              Company: Palette Plotting LLC ("Palette Plotting," "we," "our," "us")

            Terms of Use

                  These Terms of Use ("Terms") govern your access to and use of Palette Plotting, including all digital tools, features, content, and services offered through our website, app, or PWA (collectively, the "Service").

                  By using the Service, you agree to these Terms.

                  If you do not agree, do not use the Service.

                1. Eligibility

                  The Service is intended for individuals 18 years of age or older.

                  You may not use the Service if you are under 18.

                2. Overview of the Service

                  Palette Plotting provides digital tools intended to support personal reflection, goal-setting, journaling, audio creation, and mindset development. Certain parts of the Service may include automated features, system-generated suggestions, or technology-assisted content.

                  The Service is not medical, psychological, therapeutic, financial, or legal advice, and is not a substitute for professional support.

                  We may update or modify features of the Service at any time.

                3. Account Registration

                  To use certain features, you may need to create an account. You agree to:

                  provide accurate information

                  maintain confidentiality of your login credentials

                  notify us of any unauthorized use

                  You are responsible for activity that occurs under your account.

                4. Acceptable Use

                  You must comply with our Acceptable Use Policy, which is incorporated by reference and available separately.

                  Prohibited behavior includes, but is not limited to:

                  harassment, abuse, or hateful conduct

                  uploading or sharing unlawful or inappropriate content

                  engaging in fraud, impersonation, or misrepresentation

                  attempting to interfere with or disrupt the Service

                  using the Service for any illegal or unsafe purpose

                  attempting to bypass system safeguards

                  exploiting minors or posting content involving minors in any inappropriate context

                  uploading copyrighted content without permission

                  We may suspend or terminate your account for violations.

                5. User Content

                  "User Content" includes text, audio, notes, journal entries, affirmations, music compositions, or other material you input or generate through the Service.

                  You allow Palette Plotting and the infrastructure providers that support the Service to host, store, transmit, and technically process your User Content only as needed to save it to your account, deliver it back to you, sync it across your devices, and run features you choose to use (such as audio generation or formatting). This permission is limited, non-exclusive, and royalty-free, and applies only for as long as the content is stored for your account.

                  We do not use your private User Content for advertising, public display, or general product development unless you separately opt in (for example, optional data training in Settings). Palette Plotting does not routinely review private journals, affirmations, or audio for editorial or commercial purposes.

                  We may remove content that violates these Terms or the Acceptable Use Policy.

                5a. Music Composition & Copyright

                  When using the Music Composer feature, you acknowledge and agree that:

                  You will only create original music compositions

                  You will not recreate, copy, or imitate copyrighted melodies, songs, or musical works

                  You are solely responsible for ensuring your compositions do not infringe on any existing copyrights, trademarks, or intellectual property rights

                  You will indemnify and hold Palette Plotting harmless from any claims arising from copyright infringement in your compositions

                  Violation of these terms may result in immediate removal of content and account termination.

                6. Technology-Assisted and System-Generated Content

                  Some features may offer automated responses, suggestions, or AI-generated content to support your reflection or creative goals. You acknowledge that:

                  such content may be imperfect or incomplete

                  it is not a substitute for professional advice

                  you are responsible for how you use it

                  We may adjust or limit these features at any time.

                7. Goal Notifications

                  Goal notifications may be set up using external tools or services chosen by the user, such as calendar integrations, device automations, or operating system–level shortcuts. These tools may be used to remind users to review goals, open weekly check-ins, or access specific areas of the Service at selected times.

                  Palette Plotting does not currently send goal notifications via SMS/email and does not control, operate, or guarantee the performance of third-party calendars, device automations, or operating system features. Palette Plotting is not responsible for missed alerts, delivery failures, scheduling errors, device settings, or changes made by third-party providers.

                  Use of external notification tools is optional and managed entirely by the user.

                8. Subscriptions & Billing

                  Palette Plotting offers subscription plans (including options such as monthly or annual plans). Plan names and pricing may change.

                  Features, Access Levels, and Rate Limits: Features included in each subscription tier, access levels to specific functionality, rate limits (such as daily message limits, weekly creation limits, and storage quotas), and other subscription benefits are subject to change at any time without prior notice. We reserve the right to modify, add, or remove features, adjust rate limits, change access levels, or alter any aspect of the subscription tiers as needed to maintain service quality, prevent abuse, or adapt to operational requirements. Continued use of the Service after such changes constitutes your acceptance of the modifications.

                  All sales are final, except where required by applicable law.

                  Google Play (Android): In-app subscriptions purchased through the Android app use Google Play’s billing system. Payment, renewals, cancellations, and refund requests are handled under Google’s policies; submit refund requests through Google Play, not Palette Plotting.

                  By subscribing, you authorize recurring billing until you cancel. Cancellations take effect at the end of the current billing period.

                  We do not offer refunds for partial periods or unused time.

                  Data Retention: In the event of a subscription lapse or cancellation, your user content, including but not limited to belief structure analyses, journal entries, affirmation sets, audio created in the Service, and other media or data created through the Service, may be permanently deleted. While we may retain certain data for a limited period following cancellation, we do not guarantee data retention, and content may be lost due to system errors, technical issues, or policy changes.

                9. Intellectual Property

                  Palette Plotting and all associated content, branding, design, and materials are owned by Palette Plotting LLC or its licensors.

                  You may not:

                  copy or distribute the Service

                  reverse engineer the software

                  misuse trademarks or branding

                  create derivative works from the platform

                10. Service Changes

                  We may modify, discontinue, or update any part of the Service at any time.

                  We are not liable for changes, suspensions, or service interruptions.

                11. Disclaimers

                  The Service is provided "as is" and "as available."

                  We do not guarantee:

                  specific results

                  uninterrupted availability

                  accuracy of system-generated content

                  We disclaim all warranties to the fullest extent permitted by law.

                12. Limitation of Liability

                  To the maximum extent permitted by law, Palette Plotting LLC is not liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Service.

                  Our total liability for any claim will not exceed the amount you paid in subscription fees during the 12 months preceding the claim.

                13. Indemnification

                  You agree to indemnify and hold Palette Plotting LLC harmless from claims arising out of:

                  your misuse of the Service

                  your violation of these Terms

                  your User Content

                14. Governing Law

                  These Terms are governed by the laws of the State of Illinois, without regard to conflict-of-law rules.

                15. Changes to the Terms

                  We may update these Terms. Continued use of the Service indicates acceptance of the updated version.

                16. Contact

                  Questions may be directed to:

                  support@paletteplot.com

            EULA

              Last updated: [DATE]

                1. Agreement to Terms

                  This End User License Agreement ("EULA") is a legal agreement between you and Palette Plotting LLC ("Palette Plotting," "we," "our") only, and not with Apple, Inc. ("Apple"). Palette Plotting is solely responsible for the Licensed Application and the content thereof. This EULA may not provide for usage rules that conflict with the Apple Media Services Terms and Conditions as of the Effective Date (which you acknowledge you have had the opportunity to review). By accessing or using Palette Plotting, you agree to be bound by the terms of this EULA.

                2. Scope of License

                  Subject to your compliance with this EULA, Palette Plotting grants you a limited, non-exclusive, non-transferable, revocable license to use the Licensed Application on any Apple-branded products that you own or control, as permitted by the Usage Rules set forth in the Apple Media Services Terms and Conditions. This license allows the Licensed Application to be accessed and used by other accounts associated with you via Family Sharing or volume purchasing.

                3. Maintenance and Support

                  Palette Plotting is solely responsible for providing any maintenance and support services with respect to the Licensed Application, as specified in this EULA or as required under applicable law. You acknowledge that Apple has no obligation whatsoever to furnish any maintenance or support services with respect to the Licensed Application.

                4. Warranty

                  Palette Plotting is solely responsible for any product warranties, whether express or implied by law, to the extent not effectively disclaimed. For purchases made through the App Store (including in-app subscriptions), in the event of any failure of the Licensed Application to conform to any applicable warranty, you may notify Apple, and Apple will refund the purchase price for that App Store purchase to you. This does not apply to subscriptions or purchases made through our website or other payment methods (e.g., Stripe); those are governed by our general Terms of Use and billing policy. To the maximum extent permitted by applicable law, Apple will have no other warranty obligation whatsoever with respect to the Licensed Application, and any other claims, losses, liabilities, damages, costs or expenses attributable to any failure to conform to any warranty will be Palette Plotting's sole responsibility.

                5. Product Claims

                  You and Palette Plotting acknowledge that Palette Plotting, not Apple, is responsible for addressing any claims of yours or any third party relating to the Licensed Application or your possession and/or use of the Licensed Application, including but not limited to: (i) product liability claims; (ii) any claim that the Licensed Application fails to conform to any applicable legal or regulatory requirement; and (iii) claims arising under consumer protection, privacy, or similar legislation. This EULA may not limit Palette Plotting's liability to you beyond what is permitted by applicable law.

                6. Intellectual Property Claims

                  You and Palette Plotting acknowledge that, in the event of any third party claim that the Licensed Application or your possession and use of the Licensed Application infringes that third party's intellectual property rights, Palette Plotting, not Apple, will be solely responsible for the investigation, defense, settlement and discharge of any such intellectual property infringement claim.

                7. Legal Compliance

                  You represent and warrant that (i) you are not located in a country that is subject to a U.S. Government embargo, or that has been designated by the U.S. Government as a "terrorist supporting" country; and (ii) you are not listed on any U.S. Government list of prohibited or restricted parties.

                8. Developer Name and Contact

                  The Licensed Application is licensed by Palette Plotting LLC. Questions, complaints or claims with respect to the Licensed Application should be directed to: support@paletteplot.com. (For mailing address, contact us at the email above.)

                9. Third Party Terms

                  You must comply with applicable third party terms of agreement when using the Licensed Application (e.g., you must not be in violation of your wireless data service agreement when using the Licensed Application).

                10. Third Party Beneficiary

                  You and Palette Plotting acknowledge and agree that Apple, and Apple's subsidiaries, are third party beneficiaries of this EULA, and that, upon your acceptance of the terms and conditions of this EULA, Apple will have the right (and will be deemed to have accepted the right) to enforce this EULA against you as a third party beneficiary thereof.

                11. License Restrictions

                  You may not:

                  Copy, modify, or create derivative works of the service

                  Reverse engineer, decompile, or disassemble the service

                  Remove any proprietary notices or labels

                  Rent, lease, loan, or sell access to the service

                  Use the service for any illegal purpose

                  Interfere with or disrupt the service or servers

                12. Intellectual Property

                  The service, including all content, features, and functionality, is owned by Palette Plotting and is protected by copyright, trademark, and other intellectual property laws. This EULA does not grant you any rights to use our trademarks, logos, or other brand features.

                13. User Content

                  You allow Palette Plotting to host, store, transmit, and technically process your content only as needed to provide the Licensed Application to your account, as described in the User Content section above.

                14. Termination

                  This license is effective until terminated. We may terminate or suspend your access immediately, without prior notice, for any breach of this EULA. Upon termination, your right to use the service will cease immediately.

                15. Disclaimer of Warranties

                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

                16. Limitation of Liability

                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, PALETTE PLOTTING SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.

                17. Updates and Modifications

                  We reserve the right to modify, update, or discontinue the service at any time. We may also update this EULA from time to time. Your continued use of the service after such changes constitutes acceptance of the updated EULA.

                18. Governing Law

                  This EULA shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions.

                19. Contact Information

                  If you have questions about this EULA, please contact us at support@paletteplot.com
```

## Terms — ES

Route: /terms/ES

```
Términos de uso y EULA

      
        Fecha de vigencia: 13 de enero de 2025

        Empresa: Palette Plotting LLC ("Palette Plotting", "nosotros", "nuestro", "nos")



      Términos de uso

      
        
          
            Estos Términos de uso ("Términos") rigen tu acceso y uso de Palette Plotting, incluidas todas las herramientas digitales, funciones, contenido y servicios ofrecidos a través de nuestro sitio web, app o PWA (colectivamente, el "Servicio").


          Al usar el Servicio, aceptas estos Términos.

          Si no estás de acuerdo, no uses el Servicio.




        
          1. Elegibilidad

          El Servicio está destinado a personas de 18 años o más.

          No puedes usar el Servicio si eres menor de 18 años.




        
          2. Descripción general del Servicio

          
            Palette Plotting ofrece herramientas digitales destinadas a respaldar la reflexión personal, la definición de metas, el diario, la creación de audio y el desarrollo del estado mental. Ciertas partes del Servicio pueden incluir funciones automatizadas, sugerencias generadas por el sistema o contenido asistido por tecnología.


          
            El Servicio no es asesoramiento médico, psicológico, terapéutico, financiero ni legal, y no sustituye el apoyo profesional.


          Podemos actualizar o modificar las funciones del Servicio en cualquier momento.




        
          3. Registro de cuenta

          Para usar ciertas funciones, puedes necesitar crear una cuenta. Aceptas:

          
            proporcionar información precisa

            mantener la confidencialidad de tus credenciales de acceso

            notificarnos cualquier uso no autorizado

          
          Eres responsable de la actividad que ocurra bajo tu cuenta.




        
          4. Uso aceptable

          
            Debes cumplir nuestra Política de uso aceptable, incorporada por referencia y disponible por separado.


          El comportamiento prohibido incluye, sin limitarse a:

          
            hostigamiento, abuso o conducta de odio

            subir o compartir contenido ilegal o inapropiado

            fraude, suplantación o tergiversación

            intentar interferir o interrumpir el Servicio

            usar el Servicio para cualquier fin ilegal o inseguro

            intentar eludir las salvaguardas del sistema

            explotar menores o publicar contenido con menores en cualquier contexto inapropiado

            subir contenido con copyright sin permiso

          
          Podemos suspender o cancelar tu cuenta por violaciones.




        
          5. Contenido del usuario

          
            "Contenido del usuario" incluye texto, audio, notas, entradas de diario, afirmaciones, composiciones musicales u otro material que ingreses o generes a través del Servicio.


          
            Permites que Palette Plotting y los proveedores de infraestructura que respaldan el Servicio alojen, almacenen, transmitan y procesen técnicamente tu Contenido del usuario solo según sea necesario para guardarlo en tu cuenta, entregártelo, sincronizarlo entre tus dispositivos y ejecutar las funciones que elijas usar (como generación de audio o formato). Este permiso es limitado, no exclusivo y libre de regalías, y se aplica solo mientras el contenido esté almacenado para tu cuenta.


          
            No usamos tu Contenido del usuario privado para publicidad, exhibición pública ni desarrollo general del producto, a menos que aceptes por separado (por ejemplo, entrenamiento opcional de datos en Ajustes). Palette Plotting no revisa rutinariamente diarios, afirmaciones o audio privados con fines editoriales o comerciales.


          Podemos eliminar contenido que viole estos Términos o la Política de uso aceptable.




        
          5a. Composición musical y copyright

          Al usar la función Compositor musical, reconoces y aceptas que:

          
            Solo crearás composiciones musicales originales

            No recrearás, copiarás ni imitarás melodías, canciones u obras musicales con copyright

            Eres el único responsable de asegurar que tus composiciones no infrinjan copyrights, marcas u otros derechos de propiedad intelectual existentes

            Indemnizarás y mantendrás a Palette Plotting libre de reclamos derivados de infracción de copyright en tus composiciones

          
          
            La violación de estos términos puede resultar en la eliminación inmediata del contenido y la cancelación de la cuenta.





        
          6. Contenido asistido por tecnología y generado por el sistema

          
            Algunas funciones pueden ofrecer respuestas automatizadas, sugerencias o contenido generado por IA para respaldar tu reflexión o metas creativas. Reconoces que:


          
            dicho contenido puede ser imperfecto o incompleto

            no sustituye el asesoramiento profesional

            eres responsable de cómo lo usas

          
          Podemos ajustar o limitar estas funciones en cualquier momento.




        
          7. Notificaciones de metas

          
            Las notificaciones de metas pueden configurarse con herramientas o servicios externos elegidos por el usuario, como integraciones de calendario, automatizaciones del dispositivo o atajos del sistema operativo. Estas herramientas pueden usarse para recordar revisar metas, abrir check-ins semanales o acceder a áreas específicas del Servicio en momentos seleccionados.


          
            Palette Plotting actualmente no envía notificaciones de metas por SMS/correo y no controla, opera ni garantiza el rendimiento de calendarios de terceros, automatizaciones del dispositivo ni funciones del sistema operativo. Palette Plotting no es responsable de alertas perdidas, fallos de entrega, errores de programación, configuración del dispositivo ni cambios realizados por proveedores externos.


          El uso de herramientas de notificación externas es opcional y gestionado enteramente por el usuario.




        
          8. Suscripciones y facturación

          
            Palette Plotting ofrece planes de suscripción (incluidas opciones como planes mensuales o anuales). Los nombres y precios de los planes pueden cambiar.


          
            Funciones, niveles de acceso y límites de uso: Las funciones incluidas en cada nivel de suscripción, los niveles de acceso a funcionalidades específicas, los límites de uso (como límites diarios de mensajes, límites semanales de creación y cuotas de almacenamiento) y otros beneficios de la suscripción pueden cambiar en cualquier momento sin previo aviso. Reservamos el derecho de modificar, agregar o eliminar funciones, ajustar límites de uso, cambiar niveles de acceso o alterar cualquier aspecto de los niveles de suscripción según sea necesario para mantener la calidad del servicio, prevenir abusos o adaptarse a requisitos operativos. El uso continuado del Servicio después de dichos cambios constituye tu aceptación de las modificaciones.


          Todas las ventas son finales, excepto cuando la ley aplicable lo exija.

          
            Google Play (Android): Las suscripciones dentro de la app compradas a través de la app Android usan el sistema de facturación de Google Play. Los pagos, renovaciones, cancelaciones y solicitudes de reembolso se gestionan bajo las políticas de Google; envía solicitudes de reembolso a través de Google Play, no a Palette Plotting.


          
            Al suscribirte, autorizas la facturación recurrente hasta que canceles. Las cancelaciones entran en vigor al final del período de facturación actual.


          No ofrecemos reembolsos por períodos parciales ni tiempo no utilizado.

          
            Retención de datos: En caso de vencimiento o cancelación de la suscripción, tu contenido de usuario, incluidos pero no limitados a análisis de estructura de creencias, entradas de diario, conjuntos de afirmaciones, audio creado en el Servicio y otros medios o datos creados a través del Servicio, puede eliminarse permanentemente. Aunque podemos retener ciertos datos por un período limitado tras la cancelación, no garantizamos la retención de datos, y el contenido puede perderse por errores del sistema, problemas técnicos o cambios de política.





        
          9. Propiedad intelectual

          
            Palette Plotting y todo el contenido, branding, diseño y materiales asociados son propiedad de Palette Plotting LLC o sus licenciantes.


          No puedes:

          
            copiar o distribuir el Servicio

            hacer ingeniería inversa del software

            usar indebidamente marcas o branding

            crear obras derivadas de la plataforma

          



        
          10. Cambios en el Servicio

          Podemos modificar, discontinuar o actualizar cualquier parte del Servicio en cualquier momento.

          No somos responsables de cambios, suspensiones ni interrupciones del servicio.




        
          11. Descargos de responsabilidad

          El Servicio se proporciona "como es" y "según disponibilidad".

          No garantizamos:

          
            resultados específicos

            disponibilidad ininterrumpida

            precisión del contenido generado por el sistema

          
          Renunciamos a todas las garantías en la máxima medida permitida por la ley.




        
          12. Limitación de responsabilidad

          
            En la máxima medida permitida por la ley, Palette Plotting LLC no es responsable de daños indirectos, incidentales, especiales, consecuentes o punitivos derivados de tu uso del Servicio.


          
            Nuestra responsabilidad total por cualquier reclamo no excederá el monto que pagaste en tarifas de suscripción durante los 12 meses anteriores al reclamo.





        
          13. Indemnización

          Aceptas indemnizar y mantener a Palette Plotting LLC libre de reclamos derivados de:

          
            tu uso indebido del Servicio

            tu violación de estos Términos

            tu Contenido del usuario

          



        
          14. Ley aplicable

          
            Estos Términos se rigen por las leyes del Estado de Illinois, sin considerar normas de conflicto de leyes.





        
          15. Cambios en los Términos

          
            Podemos actualizar estos Términos. El uso continuado del Servicio indica la aceptación de la versión actualizada.





        
          16. Contacto

          Las preguntas pueden dirigirse a:

          support@paletteplot.com



      

      EULA

      Última actualización: [DATE]

      
        
          1. Aceptación de los términos

          
            Este Acuerdo de licencia de usuario final ("EULA") es un acuerdo legal entre tú y Palette Plotting LLC ("Palette Plotting", "nosotros", "nuestro") únicamente, y no con Apple, Inc. ("Apple"). Palette Plotting es el único responsable de la Aplicación con licencia y su contenido. Este EULA no puede establecer reglas de uso que entren en conflicto con los Términos y Condiciones de Apple Media Services vigentes en la Fecha de vigencia (reconoces que tuviste la oportunidad de revisarlos). Al acceder o usar Palette Plotting, aceptas los términos de este EULA.





        
          2. Alcance de la licencia

          
            Sujeto a tu cumplimiento de este EULA, Palette Plotting te otorga una licencia limitada, no exclusiva, no transferible y revocable para usar la Aplicación con licencia en cualquier producto de marca Apple que poseas o controles, según lo permitido por las Reglas de uso establecidas en los Términos y Condiciones de Apple Media Services. Esta licencia permite que la Aplicación con licencia sea accedida y usada por otras cuentas asociadas contigo mediante Compartir en familia o compras por volumen.





        
          3. Mantenimiento y soporte

          
            Palette Plotting es el único responsable de proporcionar los servicios de mantenimiento y soporte respecto de la Aplicación con licencia, según se especifica en este EULA o según exija la ley aplicable. Reconoces que Apple no tiene obligación de proporcionar mantenimiento ni soporte respecto de la Aplicación con licencia.





        
          4. Garantía

          
            Palette Plotting es el único responsable de las garantías del producto, expresas o implícitas por ley, en la medida en que no sean renunciadas efectivamente. Para compras realizadas a través de la App Store (incluidas suscripciones dentro de la app), en caso de que la Aplicación con licencia no cumpla con cualquier garantía aplicable, puedes notificar a Apple y Apple te reembolsará el precio de compra de esa compra en la App Store. Esto no aplica a suscripciones o compras realizadas a través de nuestro sitio web u otros métodos de pago (por ejemplo, Stripe); esas se rigen por nuestros Términos de uso generales y la política de facturación. En la máxima medida permitida por la ley aplicable, Apple no tendrá otra obligación de garantía respecto de la Aplicación con licencia, y cualquier otro reclamo, pérdida, responsabilidad, daño, costo o gasto atribuible a cualquier incumplimiento de garantía será responsabilidad exclusiva de Palette Plotting.





        
          5. Reclamos del producto

          
            Tú y Palette Plotting reconocen que Palette Plotting, no Apple, es responsable de atender cualquier reclamo tuyo o de terceros relacionado con la Aplicación con licencia o tu posesión y/o uso de la Aplicación con licencia, incluidos pero no limitados a: (i) reclamos de responsabilidad del producto; (ii) cualquier reclamo de que la Aplicación con licencia no cumple con cualquier requisito legal o regulatorio aplicable; y (iii) reclamos bajo protección al consumidor, privacidad o legislación similar. Este EULA no puede limitar la responsabilidad de Palette Plotting hacia ti más allá de lo permitido por la ley aplicable.





        
          6. Reclamos de propiedad intelectual

          
            Tú y Palette Plotting reconocen que, en caso de cualquier reclamo de terceros de que la Aplicación con licencia o tu posesión y uso de la Aplicación con licencia infringe los derechos de propiedad intelectual de ese tercero, Palette Plotting, no Apple, será el único responsable de investigar, defender, resolver y absolver cualquier reclamo de infracción de propiedad intelectual.





        
          7. Cumplimiento legal

          
            Declaras y garantizas que (i) no te encuentras en un país sujeto a embargo del Gobierno de EE. UU., ni en un país designado por el Gobierno de EE. UU. como país que "apoya terrorismo"; y (ii) no figuras en ninguna lista del Gobierno de EE. UU. de partes prohibidas o restringidas.





        
          8. Nombre del desarrollador y contacto

          
            La Aplicación con licencia es licenciada por Palette Plotting LLC. Las preguntas, quejas o reclamos respecto de la Aplicación con licencia deben dirigirse a: support@paletteplot.com. (Para dirección postal, contáctanos en el correo anterior.)





        
          9. Términos de terceros

          
            Debes cumplir los términos de acuerdo de terceros aplicables al usar la Aplicación con licencia (por ejemplo, no debes violar tu acuerdo de servicio de datos móviles al usar la Aplicación con licencia).





        
          10. Beneficiario tercero

          
            Tú y Palette Plotting reconocen y aceptan que Apple y las subsidiarias de Apple son beneficiarios terceros de este EULA, y que, tras tu aceptación de los términos y condiciones de este EULA, Apple tendrá el derecho (y se considerará que ha aceptado el derecho) de exigir el cumplimiento de este EULA contra ti como beneficiario tercero del mismo.





        
          11. Restricciones de la licencia

          No puedes:

          
            Copiar, modificar o crear obras derivadas del servicio

            Hacer ingeniería inversa, descompilar o desensamblar el servicio

            Eliminar avisos o etiquetas de propiedad

            Alquilar, arrendar, prestar o vender acceso al servicio

            Usar el servicio para cualquier fin ilegal

            Interferir o interrumpir el servicio o los servidores

          



        
          12. Propiedad intelectual

          
            El servicio, incluido todo el contenido, funciones y funcionalidad, es propiedad de Palette Plotting y está protegido por leyes de copyright, marcas y otras leyes de propiedad intelectual. Este EULA no te otorga derechos para usar nuestras marcas, logotipos u otros elementos de marca.





        
          13. Contenido del usuario

          
            Permites que Palette Plotting aloje, almacene, transmita y procese técnicamente tu contenido solo según sea necesario para proporcionar la Aplicación con licencia a tu cuenta, según se describe en la sección de Contenido del usuario anterior.





        
          14. Terminación

          
            Esta licencia es efectiva hasta su terminación. Podemos terminar o suspender tu acceso de inmediato, sin previo aviso, por cualquier incumplimiento de este EULA. Tras la terminación, tu derecho a usar el servicio terminará de inmediato.





        
          15. Renuncia de garantías

          
            EL SERVICIO SE PROPORCIONA "COMO ES" Y "SEGÚN DISPONIBILIDAD" SIN GARANTÍAS DE CUALQUIER TIPO, EXPRESAS O IMPLÍCITAS, INCLUIDAS PERO NO LIMITADAS A GARANTÍAS IMPLÍCITAS DE COMERCIABILIDAD, IDONEIDAD PARA UN FIN PARTICULAR O NO INFRACCIÓN.





        
          16. Limitación de responsabilidad

          
            EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, PALETTE PLOTTING NO SERÁ RESPONSABLE DE DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS, NI DE PÉRDIDA DE GANANCIAS O INGRESOS, YA SEA INCURRIDA DIRECTAMENTE O INDIRECTAMENTE.





        
          17. Actualizaciones y modificaciones

          
            Reservamos el derecho de modificar, actualizar o discontinuar el servicio en cualquier momento. También podemos actualizar este EULA periódicamente. Tu uso continuado del servicio después de dichos cambios constituye la aceptación del EULA actualizado.





        
          18. Ley aplicable

          
            Este EULA se regirá e interpretará de acuerdo con las leyes aplicables, sin considerar sus disposiciones sobre conflicto de leyes.





        
          19. Información de contacto

          
            Si tienes preguntas sobre este EULA, contáctanos en support@paletteplot.com
```

## Terms — PT

Route: /terms/PT

```
Termos de uso e EULA

      
        Data de vigência: 13 de janeiro de 2025

        Empresa: Palette Plotting LLC ("Palette Plotting", "nós", "nosso", "nos")



      Termos de uso

      
        
          
            Estes Termos de uso ("Termos") regem seu acesso e uso de Palette Plotting, incluindo todas as ferramentas digitais, recursos, conteúdo e serviços oferecidos por nosso site, app ou PWA (coletivamente, o "Serviço").


          Ao usar o Serviço, você aceita estes Termos.

          Se você não concorda, não use o Serviço.




        
          1. Elegibilidade

          O Serviço é destinado a pessoas com 18 anos ou mais.

          Você não pode usar o Serviço se for menor de 18 anos.




        
          2. Visão geral do Serviço

          
            Palette Plotting oferece ferramentas digitais destinadas a apoiar reflexão pessoal, definição de metas, diário, criação de áudio e desenvolvimento de mentalidade. Certas partes do Serviço podem incluir recursos automatizados, sugestões geradas pelo sistema ou conteúdo assistido por tecnologia.


          
            O Serviço não é aconselhamento médico, psicológico, terapêutico, financeiro ou jurídico, e não substitui suporte profissional.


          Podemos atualizar ou modificar recursos do Serviço a qualquer momento.




        
          3. Registro de conta

          Para usar certos recursos, você pode precisar criar uma conta. Você concorda em:

          
            fornecer informações precisas

            manter a confidencialidade das suas credenciais de login

            nos notificar sobre qualquer uso não autorizado

          
          Você é responsável pela atividade que ocorre sob sua conta.




        
          4. Uso aceitável

          
            Você deve cumprir nossa Política de uso aceitável, incorporada por referência e disponível separadamente.


          Comportamento proibido inclui, mas não se limita a:

          
            assédio, abuso ou conduta de ódio

            enviar ou compartilhar conteúdo ilegal ou inadequado

            fraude, falsidade ideológica ou deturpação

            tentar interferir ou interromper o Serviço

            usar o Serviço para qualquer fim ilegal ou inseguro

            tentar contornar salvaguardas do sistema

            exploitar menores ou publicar conteúdo com menores em qualquer contexto inadequado

            enviar conteúdo com copyright sem permissão

          
          Podemos suspender ou encerrar sua conta por violações.




        
          5. Conteúdo do usuário

          
            "Conteúdo do usuário" inclui texto, áudio, notas, entradas de diário, afirmações, composições musicais ou outro material que você insere ou gera através do Serviço.


          
            Você permite que Palette Plotting e os provedores de infraestrutura que suportam o Serviço hospedem, armazenem, transmitam e processem tecnicamente seu Conteúdo do usuário apenas conforme necessário para salvar em sua conta, entregar de volta a você, sincronizar entre seus dispositivos e executar recursos que você escolhe usar (como geração de áudio ou formatação). Esta permissão é limitada, não exclusiva e livre de royalties, e se aplica apenas enquanto o conteúdo está armazenado para sua conta.


          
            Não usamos seu Conteúdo do usuário privado para publicidade, exibição pública ou desenvolvimento geral do produto, a menos que você aceite separadamente (por exemplo, treinamento opcional de dados em Configurações). Palette Plotting não revisa rotineiramente diários, afirmações ou áudio privados para fins editoriais ou comerciais.


          Podemos remover conteúdo que viole estes Termos ou a Política de uso aceitável.




        
          5a. Composição musical e copyright

          Ao usar o recurso Compositor musical, você reconhece e concorda que:

          
            Você criará apenas composições musicais originais

            Você não recriará, copiará ou imitará melodias, canções ou obras musicais com copyright

            Você é o único responsável por garantir que suas composições não infrinjam copyrights, marcas ou outros direitos de propriedade intelectual existentes

            Você indenizará e manterá Palette Plotting livre de reclamações decorrentes de violação de copyright em suas composições

          
          
            A violação destes termos pode resultar na remoção imediata do conteúdo e no encerramento da conta.





        
          6. Conteúdo assistido por tecnologia e gerado pelo sistema

          
            Alguns recursos podem oferecer respostas automatizadas, sugestões ou conteúdo gerado por IA para apoiar sua reflexão ou metas criativas. Você reconhece que:


          
            tal conteúdo pode ser imperfeito ou incompleto

            não substitui aconselhamento profissional

            você é responsável por como o usa

          
          Podemos ajustar ou limitar estes recursos a qualquer momento.




        
          7. Notificações de metas

          
            Notificações de metas podem ser configuradas com ferramentas ou serviços externos escolhidos pelo usuário, como integrações de calendário, automações do dispositivo ou atalhos do sistema operacional. Essas ferramentas podem ser usadas para lembrar de revisar metas, abrir check-ins semanais ou acessar áreas específicas do Serviço em horários selecionados.


          
            Palette Plotting atualmente não envia notificações de metas por SMS/e-mail e não controla, opera nem garante o desempenho de calendários de terceiros, automações do dispositivo ou recursos do sistema operacional. Palette Plotting não é responsável por alertas perdidos, falhas de entrega, erros de agendamento, configurações do dispositivo ou alterações feitas por provedores externos.


          O uso de ferramentas de notificação externas é opcional e gerenciado inteiramente pelo usuário.




        
          8. Assinaturas e cobrança

          
            Palette Plotting oferece planos de assinatura (incluindo opções como planos mensais ou anuais). Nomes e preços dos planos podem mudar.


          
            Recursos, níveis de acesso e limites de uso: Os recursos incluídos em cada nível de assinatura, níveis de acesso a funcionalidades específicas, limites de uso (como limites diários de mensagens, limites semanais de criação e cotas de armazenamento) e outros benefícios da assinatura estão sujeitos a alterações a qualquer momento sem aviso prévio. Reservamos o direito de modificar, adicionar ou remover recursos, ajustar limites de uso, alterar níveis de acesso ou modificar qualquer aspecto dos níveis de assinatura conforme necessário para manter a qualidade do serviço, prevenir abusos ou adaptar-se a requisitos operacionais. O uso continuado do Serviço após tais alterações constitui sua aceitação das modificações.


          Todas as vendas são finais, exceto quando exigido pela lei aplicável.

          
            Google Play (Android): Assinaturas no app compradas através do app Android usam o sistema de cobrança do Google Play. Pagamentos, renovações, cancelamentos e solicitações de reembolso são tratados sob as políticas do Google; envie solicitações de reembolso pelo Google Play, não a Palette Plotting.


          
            Ao assinar, você autoriza cobrança recorrente até cancelar. Cancelamentos entram em vigor no final do período de cobrança atual.


          Não oferecemos reembolsos por períodos parciais ou tempo não utilizado.

          
            Retenção de dados: Em caso de vencimento ou cancelamento da assinatura, seu conteúdo de usuário, incluindo mas não limitado a análises de estrutura de crenças, entradas de diário, conjuntos de afirmações, áudio criado no Serviço e outros medias ou dados criados através do Serviço, pode ser permanentemente excluído. Embora possamos reter certos dados por um período limitado após o cancelamento, não garantimos retenção de dados, e o conteúdo pode ser perdido por erros do sistema, problemas técnicos ou mudanças de política.





        
          9. Propriedade intelectual

          
            Palette Plotting e todo o conteúdo, branding, design e materiais associados são propriedade de Palette Plotting LLC ou seus licenciantes.


          Você não pode:

          
            copiar ou distribuir o Serviço

            fazer engenharia reversa do software

            usar indevidamente marcas ou branding

            criar obras derivadas da plataforma

          



        
          10. Alterações no Serviço

          Podemos modificar, discontinuar ou atualizar qualquer parte do Serviço a qualquer momento.

          Não somos responsáveis por alterações, suspensões ou interrupções do serviço.




        
          11. Avisos legais

          O Serviço é fornecido "como está" e "conforme disponível".

          Não garantimos:

          
            resultados específicos

            disponibilidade ininterrupta

            precisão do conteúdo gerado pelo sistema

          
          Renunciamos a todas as garantias na máxima extensão permitida por lei.




        
          12. Limitação de responsabilidade

          
            Na máxima extensão permitida por lei, Palette Plotting LLC não é responsável por danos indiretos, incidentais, especiais, consequentes ou punitivos decorrentes do seu uso do Serviço.


          
            Nossa responsabilidade total por qualquer reclamação não excederá o valor que você pagou em taxas de assinatura durante os 12 meses anteriores à reclamação.





        
          13. Indenização

          Você concorda em indenizar e manter Palette Plotting LLC livre de reclamações decorrentes de:

          
            seu uso indevido do Serviço

            sua violação destes Termos

            seu Conteúdo do usuário

          



        
          14. Lei aplicável

          
            Estes Termos são regidos pelas leis do Estado de Illinois, sem considerar regras de conflito de leis.





        
          15. Alterações nos Termos

          
            Podemos atualizar estes Termos. O uso continuado do Serviço indica aceitação da versão atualizada.





        
          16. Contato

          Perguntas podem ser dirigidas a:

          support@paletteplot.com



      

      EULA

      Última atualização: [DATE]

      
        
          1. Aceitação dos termos

          
            Este Contrato de licença de usuário final ("EULA") é um acordo legal entre você e Palette Plotting LLC ("Palette Plotting", "nós", "nosso") apenas, e não com Apple, Inc. ("Apple"). Palette Plotting é o único responsável pelo Aplicativo licenciado e seu conteúdo. Este EULA não pode estabelecer regras de uso que conflitem com os Termos e Condições de Apple Media Services vigentes na Data de vigência (você reconhece que teve a oportunidade de revisá-los). Ao acessar ou usar Palette Plotting, você aceita os termos deste EULA.





        
          2. Escopo da licença

          
            Sujeito ao seu cumprimento deste EULA, Palette Plotting concede a você uma licença limitada, não exclusiva, não transferível e revogável para usar o Aplicativo licenciado em qualquer produto de marca Apple que você possui ou controla, conforme permitido pelas Regras de uso estabelecidas nos Termos e Condições de Apple Media Services. Esta licença permite que o Aplicativo licenciado seja acessado e usado por outras contas associadas a você via Compartilhamento familiar ou compras por volume.





        
          3. Manutenção e suporte

          
            Palette Plotting é o único responsável por fornecer serviços de manutenção e suporte em relação ao Aplicativo licenciado, conforme especificado neste EULA ou exigido pela lei aplicável. Você reconhece que Apple não tem obrigação de fornecer manutenção ou suporte em relação ao Aplicativo licenciado.





        
          4. Garantia

          
            Palette Plotting é o único responsável por quaisquer garantias do produto, expressas ou implícitas por lei, na medida em que não sejam efetivamente renunciadas. Para compras feitas através da App Store (incluindo assinaturas no app), em caso de falha do Aplicativo licenciado em conformar com qualquer garantia aplicável, você pode notificar Apple, e Apple reembolsará o preço de compra dessa compra na App Store. Isso não se aplica a assinaturas ou compras feitas através de nosso site ou outros métodos de pagamento (por exemplo, Stripe); essas são regidas por nossos Termos de uso gerais e política de cobrança. Na máxima extensão permitida pela lei aplicável, Apple não terá outra obrigação de garantia em relação ao Aplicativo licenciado, e quaisquer outras reclamações, perdas, responsabilidades, danos, custos ou despesas atribuíveis a qualquer falha em conformar com qualquer garantia serão de responsabilidade exclusiva de Palette Plotting.





        
          5. Reclamações do produto

          
            Você e Palette Plotting reconhecem que Palette Plotting, não Apple, é responsável por atender quaisquer reclamações suas ou de terceiros relacionadas ao Aplicativo licenciado ou sua posse e/ou uso do Aplicativo licenciado, incluindo mas não limitado a: (i) reclamações de responsabilidade do produto; (ii) qualquer reclamação de que o Aplicativo licenciado não conforma com qualquer requisito legal ou regulatório aplicável; e (iii) reclamações sob proteção ao consumidor, privacidade ou legislação similar. Este EULA não pode limitar a responsabilidade de Palette Plotting para você além do permitido pela lei aplicável.





        
          6. Reclamações de propriedade intelectual

          
            Você e Palette Plotting reconhecem que, em caso de qualquer reclamação de terceiros de que o Aplicativo licenciado ou sua posse e uso do Aplicativo licenciado infringe os direitos de propriedade intelectual desse terceiro, Palette Plotting, não Apple, será o único responsável pela investigação, defesa, resolução e absolvição de qualquer reclamação de violação de propriedade intelectual.





        
          7. Conformidade legal

          
            Você declara e garante que (i) não está localizado em um país sujeito a embargo do Governo dos EUA, ou que foi designado pelo Governo dos EUA como país que "apoia terrorismo"; e (ii) não está listado em qualquer lista do Governo dos EUA de partes proibidas ou restritas.





        
          8. Nome do desenvolvedor e contato

          
            O Aplicativo licenciado é licenciado por Palette Plotting LLC. Perguntas, reclamações ou claims em relação ao Aplicativo licenciado devem ser dirigidas a: support@paletteplot.com. (Para endereço postal, contate-nos no e-mail acima.)





        
          9. Termos de terceiros

          
            Você deve cumprir os termos de acordo de terceiros aplicáveis ao usar o Aplicativo licenciado (por exemplo, você não deve violar seu acordo de serviço de dados sem fio ao usar o Aplicativo licenciado).





        
          10. Beneficiário terceiro

          
            Você e Palette Plotting reconhecem e concordam que Apple e as subsidiárias de Apple são beneficiários terceiros deste EULA, e que, após sua aceitação dos termos e condições deste EULA, Apple terá o direito (e será considerada que aceitou o direito) de exigir o cumprimento deste EULA contra você como beneficiário terceiro do mesmo.





        
          11. Restrições da licença

          Você não pode:

          
            Copiar, modificar ou criar obras derivadas do serviço

            Fazer engenharia reversa, descompilar ou desmontar o serviço

            Remover avisos ou etiquetas de propriedade

            Alugar, arrendar, emprestar ou vender acesso ao serviço

            Usar o serviço para qualquer fim ilegal

            Interferir ou interromper o serviço ou servidores

          



        
          12. Propriedade intelectual

          
            O serviço, incluindo todo o conteúdo, recursos e funcionalidade, é propriedade de Palette Plotting e está protegido por leis de copyright, marcas e outras leis de propriedade intelectual. Este EULA não concede a você quaisquer direitos para usar nossas marcas, logotipos ou outros elementos de marca.





        
          13. Conteúdo do usuário

          
            Você permite que Palette Plotting hospede, armazene, transmita e processe tecnicamente seu conteúdo apenas conforme necessário para fornecer o Aplicativo licenciado à sua conta, conforme descrito na seção de Conteúdo do usuário acima.





        
          14. Rescisão

          
            Esta licença é efetiva até ser rescindida. Podemos rescindir ou suspender seu acesso imediatamente, sem aviso prévio, por qualquer violação deste EULA. Após a rescisão, seu direito de usar o serviço cessará imediatamente.





        
          15. Renúncia de garantias

          
            O SERVIÇO É FORNECIDO "COMO ESTÁ" E "CONFORME DISPONÍVEL" SEM GARANTIAS DE QUALQUER TIPO, EXPRESSAS OU IMPLÍCITAS, INCLUINDO MAS NÃO LIMITADO A GARANTIAS IMPLÍCITAS DE COMERCIABILIDADE, ADEQUAÇÃO A UM FIM ESPECÍFICO OU NÃO VIOLAÇÃO.





        
          16. Limitação de responsabilidade

          
            NA MÁXIMA EXTENSÃO PERMITIDA POR LEI, PALETTE PLOTTING NÃO SERÁ RESPONSÁVEL POR QUAISQUER DANOS INDIRETOS, INCIDENTAIS, ESPECIAIS, CONSEQUENTES OU PUNITIVOS, OU QUALQUER PERDA DE LUCROS OU RECEITAS, INCORRIDA DIRETAMENTE OU INDIRETAMENTE.





        
          17. Atualizações e modificações

          
            Reservamos o direito de modificar, atualizar ou discontinuar o serviço a qualquer momento. Também podemos atualizar este EULA periodicamente. Seu uso continuado do serviço após tais alterações constitui aceitação do EULA atualizado.





        
          18. Lei aplicável

          
            Este EULA será regido e interpretado de acordo com as leis aplicáveis, sem considerar suas disposições sobre conflito de leis.





        
          19. Informações de contato

          
            Se você tem perguntas sobre este EULA, contate-nos em support@paletteplot.com
```

## Terms — DE

Route: /terms/DE

```
Nutzungsbedingungen und EULA

      
        Effective date: Jan 13, 2025

        Company: Palette Plotting LLC ("Palette Plotting", "wir", "uns", "unser")



      Nutzungsbedingungen

      
        
          
            Diese Nutzungsbedingungen ("Bedingungen") regeln deinen Zugriff auf und deine Nutzung von Palette Plotting, einschliesslich aller digitalen Tools, Funktionen, Inhalte und Dienste, die uber unsere Website, App oder PWA angeboten werden (zusammen der "Dienst").


          Durch die Nutzung des Dienstes stimmst du diesen Bedingungen zu.

          Wenn du nicht zustimmst, nutze den Dienst nicht.




        
          1. Teilnahmeberechtigung

          Der Dienst ist fur Personen ab 18 Jahren bestimmt.

          Du darfst den Dienst nicht nutzen, wenn du unter 18 Jahre alt bist.




        
          2. Uberblick uber den Dienst

          
            Palette Plotting bietet digitale Tools zur Unterstutzung personlicher Reflexion, Zielsetzung, Tagebuchfuhrung, Audioproduktion und Mindset-Entwicklung. Bestimmte Teile des Dienstes konnen automatisierte Funktionen, systemgenerierte Vorschlage oder technologiebasiert unterstutzte Inhalte enthalten.


          
            Der Dienst stellt keine medizinische, psychologische, therapeutische, finanzielle oder rechtliche Beratung dar und ersetzt keine professionelle Unterstutzung.


          Wir konnen Funktionen des Dienstes jederzeit aktualisieren oder andern.




        
          3. Kontoregistrierung

          Um bestimmte Funktionen zu nutzen, musst du moglicherweise ein Konto erstellen. Du stimmst zu:

          
            korrekte Informationen bereitzustellen

            die Vertraulichkeit deiner Zugangsdaten zu wahren

            uns jede unbefugte Nutzung mitzuteilen

          
          Du bist fur alle Aktivitaten verantwortlich, die uber dein Konto erfolgen.




        
          4. Zulassige Nutzung

          
            Du musst unsere Richtlinie zur zulassigen Nutzung einhalten, die durch Verweis einbezogen ist und separat verfugbar gemacht wird.


          Verbotenes Verhalten umfasst unter anderem:

          
            Belastigung, Missbrauch oder Hassverhalten

            Hochladen oder Teilen illegaler oder unangemessener Inhalte

            Betrug, Identitatstauschung oder Falschdarstellung

            Versuche, den Dienst zu storen oder zu unterbrechen

            Nutzung des Dienstes fur rechtswidrige oder unsichere Zwecke

            Versuche, Systemschutzmassnahmen zu umgehen

            Ausbeutung Minderjahriger oder Veroffentlichung von Inhalten mit Minderjahrigen in unangemessenem Kontext

            Hochladen urheberrechtlich geschutzter Inhalte ohne Erlaubnis

          
          Bei Verstoessen konnen wir dein Konto sperren oder beenden.




        
          5. Nutzerinhalte

          
            "Nutzerinhalte" umfassen Text, Audio, Notizen, Tagebucheintrage, Affirmationen, musikalische Kompositionen oder anderes Material, das du uber den Dienst eingibst oder erzeugst.


          
            Du erlaubst Palette Plotting und den Infrastruktur-Anbietern, die den Dienst unterstutzen, deine Nutzerinhalte nur insoweit zu hosten, zu speichern, zu ubertragen und technisch zu verarbeiten, wie dies erforderlich ist, um sie in deinem Konto zu speichern, dir bereitzustellen, zwischen deinen Geraten zu synchronisieren und die von dir gewahlten Funktionen auszufuhren (z. B. Audiogenerierung oder Formatierung). Diese Erlaubnis ist beschrankt, nicht exklusiv und lizenzgebuhrenfrei und gilt nur solange der Inhalt fur dein Konto gespeichert wird.


          
            Wir verwenden deine privaten Nutzerinhalte nicht fur Werbung, offentliche Darstellung oder allgemeine Produktentwicklung, es sei denn, du stimmst separat zu (z. B. optionales Datentraining in den Einstellungen). Palette Plotting uberpruft private Tagebucher, Affirmationen oder Audiodateien nicht routinemassig fur redaktionelle oder kommerzielle Zwecke.


          Wir konnen Inhalte entfernen, die gegen diese Bedingungen oder die Richtlinie zur zulassigen Nutzung verstossen.




        
          5a. Musikkomposition und Urheberrecht

          Durch die Nutzung der Funktion Musikkomponist erkennst du an und stimmst zu, dass:

          
            du nur originale Musikkompositionen erstellst

            du keine urheberrechtlich geschutzten Melodien, Lieder oder Musikwerke nachbildest, kopierst oder imitierst

            du allein dafur verantwortlich bist sicherzustellen, dass deine Kompositionen keine bestehenden Urheberrechte, Marken oder sonstigen Rechte an geistigem Eigentum verletzen

            du Palette Plotting bei Anspruchen aus Urheberrechtsverletzungen in deinen Kompositionen schadlos haltst und freistellst

          
          
            Verstosse gegen diese Bedingungen konnen zur sofortigen Entfernung von Inhalten und zur Kontokundigung fuhren.





        
          6. Technologiegestutzte und systemgenerierte Inhalte

          
            Einige Funktionen konnen automatisierte Antworten, Vorschlage oder KI-generierte Inhalte anbieten, um deine Reflexion oder kreativen Ziele zu unterstutzen. Du erkennst an, dass:


          
            diese Inhalte unvollstandig oder fehlerhaft sein konnen

            sie keine professionelle Beratung ersetzen

            du fur ihre Verwendung verantwortlich bist

          
          Wir konnen diese Funktionen jederzeit anpassen oder einschranken.




        
          7. Benachrichtigungen zu Zielen

          
            Benachrichtigungen zu Zielen konnen mit vom Nutzer gewahlten externen Tools oder Diensten eingerichtet werden, z. B. Kalenderintegrationen, Gerateautomationen oder Betriebssystem-Kurzbefehlen. Diese Tools konnen verwendet werden, um an Zieluberprufungen zu erinnern, wochentliche Check-ins zu offnen oder zu ausgewahlten Zeiten auf bestimmte Bereiche des Dienstes zuzugreifen.


          
            Palette Plotting sendet derzeit keine Ziel-Benachrichtigungen per SMS/E-Mail und kontrolliert, betreibt oder garantiert nicht die Leistung von Kalendern Dritter, Gerateautomationen oder Betriebssystemfunktionen. Palette Plotting ist nicht verantwortlich fur verpasste Hinweise, Zustellfehler, Planungsfehler, Geratekonfigurationen oder Anderungen durch externe Anbieter.


          Die Nutzung externer Benachrichtigungstools ist optional und wird vollstandig vom Nutzer verwaltet.




        
          8. Abonnements und Abrechnung

          
            Palette Plotting bietet Abonnementplane an (einschliesslich Optionen wie monatliche oder jahrliche Plane). Namen und Preise der Plane konnen sich andern.


          
            Funktionen, Zugriffsebenen und Nutzungsgrenzen: Die in jeder Abonnementstufe enthaltenen Funktionen, Zugriffsebenen auf bestimmte Funktionalitat, Nutzungsgrenzen (wie tagliche Nachrichtenlimits, wochentliche Erstellungslimits und Speicherkontingente) sowie sonstige Vorteile konnen jederzeit ohne vorherige Ankundigung geandert werden. Wir behalten uns das Recht vor, Funktionen zu andern, hinzuzufugen oder zu entfernen, Nutzungsgrenzen anzupassen, Zugriffsebenen zu andern oder jeden Aspekt von Abonnementstufen zu verandern, soweit dies zur Aufrechterhaltung der Servicequalitat, zur Missbrauchspravention oder zur Anpassung an betriebliche Anforderungen erforderlich ist. Die fortgesetzte Nutzung des Dienstes nach solchen Anderungen gilt als Zustimmung zu den Anderungen.


          Alle Verkaufe sind endgultig, ausser wenn geltendes Recht etwas anderes verlangt.

          
            Google Play (Android): In-App-Abonnements, die uber die Android-App gekauft werden, nutzen das Abrechnungssystem von Google Play. Zahlungen, Verlangerungen, Kundigungen und Erstattungsanfragen werden gemass den Richtlinien von Google verwaltet; Erstattungsanfragen sind uber Google Play einzureichen, nicht bei Palette Plotting.


          
            Mit dem Abschluss eines Abonnements autorisierst du wiederkehrende Abrechnungen, bis du kundigst. Kundigungen werden am Ende des aktuellen Abrechnungszeitraums wirksam.


          Wir bieten keine Erstattungen fur Teilzeiträume oder ungenutzte Zeit an.

          
            Datenaufbewahrung: Bei Ablauf oder Kundigung des Abonnements konnen deine Nutzerinhalte, einschliesslich, aber nicht beschrankt auf Analysen von Glaubensstrukturen, Tagebucheintrage, Affirmationssatze, im Dienst erstellte Audiodateien und andere uber den Dienst erstellte Medien oder Daten, dauerhaft geloscht werden. Auch wenn wir bestimmte Daten nach Kundigung moglicherweise fur einen begrenzten Zeitraum aufbewahren, garantieren wir keine Datenaufbewahrung, und Inhalte konnen durch Systemfehler, technische Probleme oder Richtlinienanderungen verloren gehen.





        
          9. Geistiges Eigentum

          
            Palette Plotting sowie alle zugehorigen Inhalte, Markenauftritte, Designs und Materialien sind Eigentum von Palette Plotting LLC oder ihrer Lizenzgeber.


          Du darfst nicht:

          
            den Dienst kopieren oder verbreiten

            Software zuruckentwickeln

            Marken oder Branding missbrauchen

            abgeleitete Werke der Plattform erstellen

          



        
          10. Anderungen am Dienst

          Wir konnen jeden Teil des Dienstes jederzeit andern, einstellen oder aktualisieren.

          Wir haften nicht fur Anderungen, Aussetzungen oder Unterbrechungen des Dienstes.




        
          11. Haftungsausschlusse

          Der Dienst wird "wie besehen" und "wie verfugbar" bereitgestellt.

          Wir garantieren nicht:

          
            bestimmte Ergebnisse

            unterbrechungsfreie Verfugbarkeit

            Richtigkeit systemgenerierter Inhalte

          
          Wir schliessen alle Gewahrleistungen im gesetzlich zulassigen Umfang aus.




        
          12. Haftungsbegrenzung

          
            Soweit gesetzlich zulassig haftet Palette Plotting LLC nicht fur indirekte, zufallige, besondere, Folge- oder Strafschaden, die aus deiner Nutzung des Dienstes entstehen.


          
            Unsere gesamthafte Haftung fur Anspruche ubersteigt nicht den Betrag, den du in den 12 Monaten vor dem Anspruch an Abonnementgebuhren gezahlt hast.





        
          13. Freistellung

          Du stimmst zu, Palette Plotting LLC von Anspruchen freizustellen und schadlos zu halten, die entstehen aus:

          
            deiner missbrauchlichen Nutzung des Dienstes

            deinem Verstoss gegen diese Bedingungen

            deinen Nutzerinhalten

          



        
          14. Anwendbares Recht

          
            Diese Bedingungen unterliegen den Gesetzen des Bundesstaates Illinois unter Ausschluss kollisionsrechtlicher Regeln.





        
          15. Anderungen der Bedingungen

          
            Wir konnen diese Bedingungen aktualisieren. Die fortgesetzte Nutzung des Dienstes zeigt die Zustimmung zur aktualisierten Version.





        
          16. Kontakt

          Fragen konnen gesendet werden an:

          support@paletteplot.com



      

      EULA

      Zuletzt aktualisiert: [DATE]

      
        
          1. Zustimmung zu den Bedingungen

          
            Diese Endnutzer-Lizenzvereinbarung ("EULA") ist eine rechtliche Vereinbarung ausschliesslich zwischen dir und Palette Plotting LLC ("Palette Plotting", "wir", "unser"), und nicht mit Apple, Inc. ("Apple"). Palette Plotting ist allein fur die lizenzierte Anwendung und deren Inhalte verantwortlich. Diese EULA darf keine Nutzungsregeln enthalten, die mit den zum Wirksamkeitsdatum geltenden Apple Media Services Terms and Conditions in Konflikt stehen (du bestatigst, dass du Gelegenheit hattest, diese zu prufen). Durch den Zugriff auf oder die Nutzung von Palette Plotting stimmst du den Bedingungen dieser EULA zu.





        
          2. Umfang der Lizenz

          
            Vorbehaltlich deiner Einhaltung dieser EULA gewahrt dir Palette Plotting eine beschrankte, nicht exklusive, nicht ubertragbare und widerrufliche Lizenz zur Nutzung der lizenzierten Anwendung auf allen Apple-Markenprodukten, die du besitzt oder kontrollierst, wie durch die Nutzungsregeln in den Apple Media Services Terms and Conditions erlaubt. Diese Lizenz erlaubt zudem den Zugriff und die Nutzung der lizenzierten Anwendung durch andere mit dir verbundene Konten uber Family Sharing oder Volumenkauf.





        
          3. Wartung und Support

          
            Palette Plotting ist allein fur die Bereitstellung von Wartungs- und Supportleistungen in Bezug auf die lizenzierte Anwendung verantwortlich, wie in dieser EULA beschrieben oder durch geltendes Recht vorgeschrieben. Du erkennst an, dass Apple nicht verpflichtet ist, Wartung oder Support fur die lizenzierte Anwendung bereitzustellen.





        
          4. Gewahrleistung

          
            Palette Plotting ist allein fur Produktgewahrleistungen verantwortlich, ob ausdrucklich oder gesetzlich impliziert, soweit diese nicht wirksam ausgeschlossen sind. Fur Kaufe uber den App Store (einschliesslich In-App-Abonnements) gilt: Sollte die lizenzierte Anwendung eine anwendbare Gewahrleistung nicht erfullen, kannst du Apple benachrichtigen und Apple erstattet dir den Kaufpreis dieses App-Store-Kaufs. Dies gilt nicht fur Abonnements oder Kaufe uber unsere Website oder andere Zahlungsmethoden (z. B. Stripe); diese unterliegen unseren allgemeinen Nutzungsbedingungen und der Abrechnungsrichtlinie. Im gesetzlich zulassigen Umfang hat Apple keine weitere Gewahrleistungspflicht bezuglich der lizenzierten Anwendung, und alle weiteren Anspruche, Verluste, Haftungen, Schaden, Kosten oder Aufwendungen aufgrund einer Gewahrleistungsverletzung liegen ausschliesslich in der Verantwortung von Palette Plotting.





        
          5. Produktanspruche

          
            Du und Palette Plotting erkennen an, dass Palette Plotting und nicht Apple fur die Bearbeitung jeglicher Anspruche von dir oder Dritten im Zusammenhang mit der lizenzierten Anwendung oder deinem Besitz und/oder deiner Nutzung der lizenzierten Anwendung verantwortlich ist, einschliesslich, aber nicht beschrankt auf: (i) Produkthaftungsanspruche; (ii) Anspruche, dass die lizenzierte Anwendung geltende gesetzliche oder regulatorische Anforderungen nicht erfullt; und (iii) Anspruche nach Verbraucher-, Datenschutz- oder ahnlichem Recht. Diese EULA darf die Haftung von Palette Plotting dir gegenuber nicht uber das gesetzlich Zulassige hinaus beschranken.





        
          6. Anspruche wegen geistigen Eigentums

          
            Du und Palette Plotting erkennen an, dass im Falle eines Drittanspruchs, wonach die lizenzierte Anwendung oder dein Besitz und deine Nutzung der lizenzierten Anwendung Rechte am geistigen Eigentum dieses Dritten verletzt, Palette Plotting und nicht Apple allein fur Untersuchung, Verteidigung, Beilegung und Erledigung solcher Anspruche verantwortlich ist.





        
          7. Rechtskonformitat

          
            Du sicherst zu und gewahrleistest, dass (i) du dich nicht in einem Land befindest, das einem Embargo der US-Regierung unterliegt, oder das von der US-Regierung als Land eingestuft wurde, das "Terrorismus unterstutzt"; und (ii) du auf keiner Liste der US-Regierung uber verbotene oder eingeschrankte Parteien stehst.





        
          8. Entwicklername und Kontakt

          
            Die lizenzierte Anwendung wird von Palette Plotting LLC lizenziert. Fragen, Beschwerden oder Anspruche bezuglich der lizenzierten Anwendung sind zu richten an: support@paletteplot.com. (Fur eine Postadresse kontaktiere uns bitte uber die obige E-Mail-Adresse.)





        
          9. Bedingungen Dritter

          
            Du musst bei der Nutzung der lizenzierten Anwendung alle anwendbaren Vertragsbedingungen Dritter einhalten (beispielsweise darfst du bei Nutzung der lizenzierten Anwendung nicht gegen deinen Mobilfunk-Datenvertrag verstossen).





        
          10. Drittbegunstigter

          
            Du und Palette Plotting erkennen an und stimmen zu, dass Apple und die Tochtergesellschaften von Apple Drittbegunstigte dieser EULA sind und dass Apple nach deiner Annahme der Bedingungen dieser EULA das Recht hat (und als berechtigt gilt), diese EULA als Drittbegunstigter gegen dich durchzusetzen.





        
          11. Lizenzbeschrankungen

          Du darfst nicht:

          
            den Dienst kopieren, andern oder abgeleitete Werke erstellen

            den Dienst zuruckentwickeln, dekompilieren oder disassemblieren

            Eigentumshinweise oder Kennzeichnungen entfernen

            Zugang zum Dienst vermieten, verleasen, verleihen oder verkaufen

            den Dienst fur rechtswidrige Zwecke nutzen

            den Dienst oder Server storen oder unterbrechen

          



        
          12. Geistiges Eigentum

          
            Der Dienst einschliesslich aller Inhalte, Funktionen und Funktionalitaten ist Eigentum von Palette Plotting und durch Urheber-, Marken- und sonstige Gesetze zum geistigen Eigentum geschutzt. Diese EULA gewahrt dir keine Rechte zur Nutzung unserer Marken, Logos oder sonstiger Markenelemente.





        
          13. Nutzerinhalte

          
            Du erlaubst Palette Plotting, deine Inhalte nur insoweit zu hosten, zu speichern, zu ubertragen und technisch zu verarbeiten, wie dies zur Bereitstellung der lizenzierten Anwendung fur dein Konto erforderlich ist, wie im obigen Abschnitt zu Nutzerinhalten beschrieben.





        
          14. Beendigung

          
            Diese Lizenz gilt bis zu ihrer Beendigung. Wir konnen deinen Zugriff bei jedem Verstoss gegen diese EULA sofort und ohne vorherige Mitteilung beenden oder aussetzen. Nach Beendigung endet dein Recht zur Nutzung des Dienstes sofort.





        
          15. Gewahrleistungsausschluss

          
            DER DIENST WIRD "WIE BESEHEN" UND "WIE VERFUGBAR" OHNE GEWAHRLEISTUNGEN JEGLICHER ART BEREITGESTELLT, WEDER AUSDRUCKLICH NOCH IMPLIZIERT, EINSCHLIESSLICH, ABER NICHT BESCHRANKT AUF IMPLIZIERTE GEWAHRLEISTUNGEN DER MARKTFAHIGKEIT, EIGNUNG FUR EINEN BESTIMMTEN ZWECK ODER NICHTVERLETZUNG.





        
          16. Haftungsbegrenzung

          
            SOWEIT GESETZLICH ZULASSIG HAFTET PALETTE PLOTTING NICHT FUR INDIREKTE, ZUFALLIGE, BESONDERE, FOLGE- ODER STRAFSCHADEN ODER FUR ENTGANGENE GEWINNE ODER EINNAHMEN, OB DIREKT ODER INDIREKT ENTSTANDEN.





        
          17. Aktualisierungen und Anderungen

          
            Wir behalten uns das Recht vor, den Dienst jederzeit zu andern, zu aktualisieren oder einzustellen. Wir konnen diese EULA ebenfalls regelmassig aktualisieren. Deine fortgesetzte Nutzung des Dienstes nach solchen Anderungen stellt die Annahme der aktualisierten EULA dar.





        
          18. Anwendbares Recht

          
            Diese EULA unterliegt geltendem Recht und ist entsprechend auszulegen, ohne Berucksichtigung kollisionsrechtlicher Bestimmungen.





        
          19. Kontaktinformationen

          
            Wenn du Fragen zu dieser EULA hast, kontaktiere uns unter support@paletteplot.com
```

## Terms — FR

Route: /terms/FR

```
Conditions d&apos;utilisation et EULA

      
        Effective date: Jan 13, 2025

        Company: Palette Plotting LLC ("Palette Plotting", "nous", "notre", "nos")



      Conditions d&apos;utilisation

      
        
          
            Les presentes Conditions d&apos;utilisation ("Conditions") regissent votre acces et votre utilisation de Palette Plotting, y compris tous les outils numeriques, fonctionnalites, contenus et services proposes via notre site web, notre application ou notre PWA (collectivement, le "Service").


          En utilisant le Service, vous acceptez ces Conditions.

          Si vous n&apos;etes pas d&apos;accord, n&apos;utilisez pas le Service.




        
          1. Eligibilite

          Le Service est destine aux personnes agees de 18 ans ou plus.

          Vous ne pouvez pas utiliser le Service si vous avez moins de 18 ans.




        
          2. Apercu du Service

          
            Palette Plotting propose des outils numeriques destines a soutenir la reflexion personnelle, la fixation d&apos;objectifs, le journal, la creation audio et le developpement de l&apos;etat d&apos;esprit. Certaines parties du Service peuvent inclure des fonctionnalites automatisees, des suggestions generees par le systeme ou du contenu assiste par la technologie.


          
            Le Service ne constitue pas un conseil medical, psychologique, therapeutique, financier ou juridique et ne remplace pas un accompagnement professionnel.


          Nous pouvons mettre a jour ou modifier les fonctionnalites du Service a tout moment.




        
          3. Inscription au compte

          Pour utiliser certaines fonctionnalites, vous devrez peut-etre creer un compte. Vous acceptez de:

          
            fournir des informations exactes

            preserver la confidentialite de vos identifiants

            nous signaler toute utilisation non autorisee

          
          Vous etes responsable de l&apos;activite effectuee via votre compte.




        
          4. Utilisation acceptable

          
            Vous devez respecter notre Politique d&apos;utilisation acceptable, incorporee par renvoi et disponible separement.


          Les comportements interdits incluent, sans s&apos;y limiter:

          
            harcelement, abus ou comportement haineux

            televerser ou partager un contenu illegal ou inapproprie

            fraude, usurpation d&apos;identite ou fausse declaration

            tenter d&apos;interferer avec le Service ou de le perturber

            utiliser le Service a des fins illegales ou dangereuses

            tenter de contourner les protections du systeme

            exploiter des mineurs ou publier du contenu impliquant des mineurs dans un contexte inapproprie

            televerser du contenu soumis au droit d&apos;auteur sans autorisation

          
          Nous pouvons suspendre ou resilier votre compte en cas de violation.




        
          5. Contenu utilisateur

          
            Le "Contenu utilisateur" inclut les textes, audios, notes, entrees de journal, affirmations, compositions musicales ou tout autre element que vous saisissez ou generez via le Service.


          
            Vous autorisez Palette Plotting et les fournisseurs d&apos;infrastructure qui soutiennent le Service a heberger, stocker, transmettre et traiter techniquement votre Contenu utilisateur uniquement dans la mesure necessaire pour le conserver dans votre compte, vous le fournir, le synchroniser entre vos appareils et executer les fonctionnalites que vous choisissez d&apos;utiliser (comme la generation audio ou la mise en forme). Cette autorisation est limitee, non exclusive et libre de redevances, et ne s&apos;applique que tant que le contenu est conserve pour votre compte.


          
            Nous n&apos;utilisons pas votre Contenu utilisateur prive pour la publicite, l&apos;affichage public ou le developpement general du produit, sauf consentement separe de votre part (par exemple, entrainement de donnees optionnel dans les Parametres). Palette Plotting n&apos;examine pas de facon routiniere les journaux, affirmations ou audios prives a des fins editoriales ou commerciales.


          Nous pouvons supprimer tout contenu qui enfreint ces Conditions ou la Politique d&apos;utilisation acceptable.




        
          5a. Composition musicale et droit d&apos;auteur

          En utilisant la fonctionnalite Compositeur musical, vous reconnaissez et acceptez que:

          
            vous ne creerez que des compositions musicales originales

            vous ne recreerez pas, ne copierez pas et n&apos;imiterez pas des melodies, chansons ou oeuvres musicales protegees par le droit d&apos;auteur

            vous etes seul responsable de verifier que vos compositions n&apos;enfreignent pas des droits d&apos;auteur, marques ou autres droits de propriete intellectuelle existants

            vous indemniserez et degagerez Palette Plotting de toute responsabilite pour les reclamations liees a une violation de droit d&apos;auteur dans vos compositions

          
          
            La violation de ces conditions peut entrainer la suppression immediate du contenu et la resiliation du compte.





        
          6. Contenu assiste par la technologie et contenu genere par le systeme

          
            Certaines fonctionnalites peuvent fournir des reponses automatisees, des suggestions ou du contenu genere par IA pour soutenir votre reflexion ou vos objectifs creatifs. Vous reconnaissez que:


          
            ce contenu peut etre imparfait ou incomplet

            il ne remplace pas un conseil professionnel

            vous etes responsable de la maniere dont vous l&apos;utilisez

          
          Nous pouvons ajuster ou limiter ces fonctionnalites a tout moment.




        
          7. Notifications d&apos;objectifs

          
            Les notifications d&apos;objectifs peuvent etre configurees avec des outils ou services externes choisis par l&apos;utilisateur, comme des integrations de calendrier, des automatisations d&apos;appareil ou des raccourcis du systeme d&apos;exploitation. Ces outils peuvent etre utilises pour rappeler de consulter des objectifs, ouvrir des bilans hebdomadaires ou acceder a des zones specifiques du Service a des moments choisis.


          
            Palette Plotting n&apos;envoie actuellement pas de notifications d&apos;objectifs par SMS/e-mail et ne controle pas, n&apos;exploite pas et ne garantit pas les performances des calendriers tiers, des automatisations d&apos;appareil ou des fonctionnalites du systeme d&apos;exploitation. Palette Plotting n&apos;est pas responsable des alertes manquees, echecs de livraison, erreurs de planification, configurations d&apos;appareil ou modifications effectuees par des fournisseurs externes.


          L&apos;utilisation d&apos;outils de notification externes est optionnelle et entierement geree par l&apos;utilisateur.




        
          8. Abonnements et facturation

          
            Palette Plotting propose des forfaits d&apos;abonnement (y compris des options telles que des forfaits mensuels ou annuels). Les noms et prix des forfaits peuvent changer.


          
            Fonctionnalites, niveaux d&apos;acces et limites d&apos;utilisation: Les fonctionnalites incluses dans chaque niveau d&apos;abonnement, les niveaux d&apos;acces a des fonctionnalites specifiques, les limites d&apos;utilisation (comme des limites quotidiennes de messages, des limites hebdomadaires de creation et des quotas de stockage) et d&apos;autres avantages de l&apos;abonnement peuvent changer a tout moment sans preavis. Nous nous reservons le droit de modifier, ajouter ou supprimer des fonctionnalites, d&apos;ajuster les limites d&apos;utilisation, de modifier les niveaux d&apos;acces ou de changer tout aspect des niveaux d&apos;abonnement selon les besoins pour maintenir la qualite du service, prevenir les abus ou s&apos;adapter a des exigences operationnelles. L&apos;utilisation continue du Service apres ces modifications constitue votre acceptation des changements.


          Toutes les ventes sont definitives, sauf si la loi applicable l&apos;exige.

          
            Google Play (Android): Les abonnements integres achetes via l&apos;application Android utilisent le systeme de facturation Google Play. Les paiements, renouvellements, annulations et demandes de remboursement sont geres selon les politiques de Google; soumettez les demandes de remboursement via Google Play, pas a Palette Plotting.


          
            En vous abonnant, vous autorisez une facturation recurrente jusqu&apos;a annulation. Les annulations prennent effet a la fin de la periode de facturation en cours.


          Nous n&apos;offrons pas de remboursement pour des periodes partielles ou du temps non utilise.

          
            Conservation des donnees: En cas d&apos;expiration ou d&apos;annulation de l&apos;abonnement, votre contenu utilisateur, y compris notamment les analyses de structure des croyances, entrees de journal, ensembles d&apos;affirmations, audios crees dans le Service et autres medias ou donnees crees via le Service, peut etre supprime de facon permanente. Bien que nous puissions conserver certaines donnees pendant une periode limitee apres l&apos;annulation, nous ne garantissons pas la conservation des donnees, et le contenu peut etre perdu en raison d&apos;erreurs systeme, de problemes techniques ou de changements de politique.





        
          9. Propriete intellectuelle

          
            Palette Plotting ainsi que l&apos;ensemble de son contenu, de son image de marque, de son design et des materiaux associes sont la propriete de Palette Plotting LLC ou de ses concedants.


          Vous ne pouvez pas:

          
            copier ou distribuer le Service

            faire de l&apos;ingenierie inverse sur le logiciel

            utiliser abusivement des marques ou elements de branding

            creer des oeuvres derivees de la plateforme

          



        
          10. Modifications du Service

          Nous pouvons modifier, interrompre ou mettre a jour toute partie du Service a tout moment.

          Nous ne sommes pas responsables des modifications, suspensions ou interruptions du Service.




        
          11. Exclusions de garantie

          Le Service est fourni "en l&apos;etat" et "selon disponibilite".

          Nous ne garantissons pas:

          
            des resultats specifiques

            une disponibilite ininterrompue

            l&apos;exactitude du contenu genere par le systeme

          
          Nous declinons toute garantie dans la mesure maximale autorisee par la loi.




        
          12. Limitation de responsabilite

          
            Dans la mesure maximale autorisee par la loi, Palette Plotting LLC n&apos;est pas responsable des dommages indirects, accessoires, speciaux, consecutifs ou punitifs decoulant de votre utilisation du Service.


          
            Notre responsabilite totale pour toute reclamation ne depassera pas le montant que vous avez paye en frais d&apos;abonnement au cours des 12 mois precedant la reclamation.





        
          13. Indemnisation

          Vous acceptez d&apos;indemniser et de degager Palette Plotting LLC de toute responsabilite pour les reclamations decoulant de:

          
            votre mauvaise utilisation du Service

            votre violation de ces Conditions

            votre Contenu utilisateur

          



        
          14. Droit applicable

          
            Ces Conditions sont regies par les lois de l&apos;Etat de l&apos;Illinois, sans egard aux regles de conflit de lois.





        
          15. Modifications des Conditions

          
            Nous pouvons mettre a jour ces Conditions. L&apos;utilisation continue du Service indique l&apos;acceptation de la version mise a jour.





        
          16. Contact

          Les questions peuvent etre envoyees a:

          support@paletteplot.com



      

      EULA

      Derniere mise a jour: [DATE]

      
        
          1. Acceptation des conditions

          
            Le present Contrat de licence utilisateur final ("EULA") est un accord juridique entre vous et Palette Plotting LLC ("Palette Plotting", "nous", "notre") uniquement, et non avec Apple, Inc. ("Apple"). Palette Plotting est seul responsable de l&apos;Application sous licence et de son contenu. Cet EULA ne peut pas etablir de regles d&apos;utilisation en conflit avec les Apple Media Services Terms and Conditions en vigueur a la Date d&apos;effet (vous reconnaissez avoir eu la possibilite de les consulter). En accedant a Palette Plotting ou en l&apos;utilisant, vous acceptez les conditions du present EULA.





        
          2. Portee de la licence

          
            Sous reserve de votre respect du present EULA, Palette Plotting vous accorde une licence limitee, non exclusive, non transferable et revocable pour utiliser l&apos;Application sous licence sur tout produit de marque Apple que vous possedez ou controlez, dans la mesure permise par les Regles d&apos;utilisation enoncees dans les Apple Media Services Terms and Conditions. Cette licence autorise egalement l&apos;acces et l&apos;utilisation de l&apos;Application sous licence par d&apos;autres comptes associes a vous via le Partage familial ou les achats en volume.





        
          3. Maintenance et assistance

          
            Palette Plotting est seul responsable de fournir les services de maintenance et d&apos;assistance concernant l&apos;Application sous licence, comme precise dans le present EULA ou comme exige par la loi applicable. Vous reconnaissez qu&apos;Apple n&apos;a aucune obligation de fournir maintenance ou assistance concernant l&apos;Application sous licence.





        
          4. Garantie

          
            Palette Plotting est seul responsable des garanties produit, expresses ou implicites en vertu de la loi, dans la mesure ou elles ne sont pas valablement exclues. Pour les achats effectues via l&apos;App Store (y compris les abonnements integres), si l&apos;Application sous licence ne respecte pas une garantie applicable, vous pouvez en informer Apple et Apple vous remboursera le prix d&apos;achat de cet achat App Store. Cela ne s&apos;applique pas aux abonnements ou achats effectues via notre site web ou d&apos;autres methodes de paiement (par exemple Stripe); ceux-ci sont regis par nos Conditions d&apos;utilisation generales et notre politique de facturation. Dans la mesure maximale permise par la loi applicable, Apple n&apos;aura aucune autre obligation de garantie concernant l&apos;Application sous licence, et toute autre reclamation, perte, responsabilite, dommage, cout ou depense imputable a un manquement a la garantie relevera de la seule responsabilite de Palette Plotting.





        
          5. Reclamations relatives au produit

          
            Vous et Palette Plotting reconnaissez que Palette Plotting, et non Apple, est responsable du traitement de toute reclamation de votre part ou d&apos;un tiers relative a l&apos;Application sous licence ou a votre possession et/ou utilisation de l&apos;Application sous licence, y compris notamment: (i) les reclamations de responsabilite du fait des produits; (ii) toute reclamation selon laquelle l&apos;Application sous licence ne respecte pas des exigences legales ou reglementaires applicables; et (iii) les reclamations au titre de la protection des consommateurs, de la confidentialite ou d&apos;une legislation similaire. Le present EULA ne peut pas limiter la responsabilite de Palette Plotting a votre egard au-dela de ce que permet la loi applicable.





        
          6. Reclamations de propriete intellectuelle

          
            Vous et Palette Plotting reconnaissez qu&apos;en cas de reclamation d&apos;un tiers selon laquelle l&apos;Application sous licence ou votre possession et utilisation de l&apos;Application sous licence enfreint les droits de propriete intellectuelle de ce tiers, Palette Plotting, et non Apple, sera seul responsable d&apos;enqueter, de defendre, de regler et de decharger toute reclamation de violation de propriete intellectuelle.





        
          7. Conformite legale

          
            Vous declarez et garantissez que (i) vous ne vous trouvez pas dans un pays soumis a un embargo du gouvernement des Etats-Unis, ni dans un pays designe par le gouvernement des Etats-Unis comme soutenant le "terrorisme"; et (ii) vous ne figurez sur aucune liste du gouvernement des Etats-Unis de parties interdites ou restreintes.





        
          8. Nom du developpeur et contact

          
            L&apos;Application sous licence est concédée sous licence par Palette Plotting LLC. Les questions, plaintes ou reclamations concernant l&apos;Application sous licence doivent etre adressees a: support@paletteplot.com. (Pour l&apos;adresse postale, contactez-nous via l&apos;e-mail ci-dessus.)





        
          9. Conditions de tiers

          
            Vous devez respecter les conditions contractuelles de tiers applicables lors de l&apos;utilisation de l&apos;Application sous licence (par exemple, vous ne devez pas violer votre contrat de services de donnees mobiles en utilisant l&apos;Application sous licence).





        
          10. Beneficiaire tiers

          
            Vous et Palette Plotting reconnaissez et acceptez qu&apos;Apple et les filiales d&apos;Apple sont des beneficiaires tiers du present EULA et qu&apos;a la suite de votre acceptation des conditions du present EULA, Apple aura le droit (et sera reputee avoir accepte le droit) d&apos;en exiger l&apos;execution a votre encontre en tant que beneficiaire tiers.





        
          11. Restrictions de licence

          Vous ne pouvez pas:

          
            copier, modifier ou creer des oeuvres derivees du Service

            decompiler, desassembler ou proceder a l&apos;ingenierie inverse du Service

            supprimer les avis ou etiquettes de propriete

            louer, donner a bail, preter ou vendre l&apos;acces au Service

            utiliser le Service a toute fin illegale

            interferer avec le Service ou les serveurs, ou les perturber

          



        
          12. Propriete intellectuelle

          
            Le Service, y compris tout son contenu, ses fonctionnalites et son fonctionnement, est la propriete de Palette Plotting et est protege par les lois sur le droit d&apos;auteur, les marques et autres lois de propriete intellectuelle. Le present EULA ne vous accorde aucun droit d&apos;utiliser nos marques, logos ou autres elements de marque.





        
          13. Contenu utilisateur

          
            Vous autorisez Palette Plotting a heberger, stocker, transmettre et traiter techniquement votre contenu uniquement dans la mesure necessaire pour fournir l&apos;Application sous licence a votre compte, comme decrit dans la section Contenu utilisateur ci-dessus.





        
          14. Resiliation

          
            Cette licence reste en vigueur jusqu&apos;a sa resiliation. Nous pouvons resilier ou suspendre votre acces immediatement, sans preavis, en cas de violation du present EULA. A la resiliation, votre droit d&apos;utiliser le Service prend fin immediatement.





        
          15. Exclusion de garanties

          
            LE SERVICE EST FOURNI "EN L&apos;ETAT" ET "SELON DISPONIBILITE" SANS GARANTIES D&apos;AUCUNE SORTE, EXPRESSES OU IMPLICITES, Y COMPRIS, SANS S&apos;Y LIMITER, LES GARANTIES IMPLICITES DE QUALITE MARCHANDE, D&apos;ADEQUATION A UN USAGE PARTICULIER OU DE NON-CONTREFACON.





        
          16. Limitation de responsabilite

          
            DANS LA MESURE MAXIMALE AUTORISEE PAR LA LOI, PALETTE PLOTTING NE SERA PAS RESPONSABLE DES DOMMAGES INDIRECTS, ACCESSOIRES, SPECIAUX, CONSECUTIFS OU PUNITIFS, NI DE LA PERTE DE PROFITS OU DE REVENUS, QU&apos;ELLE SOIT SUBIE DIRECTEMENT OU INDIRECTEMENT.





        
          17. Mises a jour et modifications

          
            Nous nous reservons le droit de modifier, mettre a jour ou interrompre le Service a tout moment. Nous pouvons egalement mettre a jour periodiquement le present EULA. Votre utilisation continue du Service apres ces modifications constitue l&apos;acceptation de l&apos;EULA mis a jour.





        
          18. Droit applicable

          
            Le present EULA sera regi et interprete conformement au droit applicable, sans tenir compte des dispositions de conflit de lois.





        
          19. Informations de contact

          
            Si vous avez des questions au sujet du present EULA, contactez-nous a support@paletteplot.com
```

## Terms — IT

Route: /terms/IT

```
Termini di utilizzo ed EULA

      
        Data di entrata in vigore: 13 gennaio 2025

        Azienda: Palette Plotting LLC ("Palette Plotting", "noi", "nostro", "ci")



      Termini di utilizzo

      
        
          
            I presenti Termini di utilizzo ("Termini") disciplinano il tuo accesso e utilizzo di Palette Plotting, incluse tutte le funzionalita digitali, caratteristiche, contenuti e servizi offerti tramite il nostro sito web, app o PWA (collettivamente, il "Servizio").


          Utilizzando il Servizio, accetti i presenti Termini.

          Se non sei d&apos;accordo, non utilizzare il Servizio.




        
          1. Idoneita

          Il Servizio e destinato a persone di almeno 18 anni.

          Non puoi utilizzare il Servizio se hai meno di 18 anni.




        
          2. Panoramica del Servizio

          
            Palette Plotting offre strumenti digitali destinati a supportare la riflessione personale, la definizione degli obiettivi, la scrittura di diario, la creazione audio e lo sviluppo della mentalita. Alcune parti del Servizio possono includere funzionalita automatizzate, suggerimenti generati dal sistema o contenuti assistiti dalla tecnologia.


          
            Il Servizio non costituisce consulenza medica, psicologica, terapeutica, finanziaria o legale e non sostituisce il supporto professionale.


          Possiamo aggiornare o modificare le funzionalita del Servizio in qualsiasi momento.




        
          3. Registrazione dell&apos;account

          Per utilizzare alcune funzionalita, potrebbe essere necessario creare un account. Accetti di:

          
            fornire informazioni accurate

            mantenere riservate le tue credenziali di accesso

            informarci di qualsiasi uso non autorizzato

          
          Sei responsabile dell&apos;attivita che avviene tramite il tuo account.




        
          4. Uso consentito

          
            Devi rispettare la nostra Politica di uso consentito, incorporata per riferimento e disponibile separatamente.


          I comportamenti vietati includono, a titolo esemplificativo e non esaustivo:

          
            molestie, abusi o condotte d&apos;odio

            caricare o condividere contenuti illegali o inappropriati

            frode, impersonificazione o dichiarazioni ingannevoli

            tentare di interferire con il Servizio o interromperlo

            usare il Servizio per qualsiasi finalita illegale o non sicura

            tentare di aggirare le misure di sicurezza del sistema

            sfruttare minori o pubblicare contenuti con minori in qualsiasi contesto inappropriato

            caricare contenuti protetti da copyright senza autorizzazione

          
          Possiamo sospendere o chiudere il tuo account in caso di violazioni.




        
          5. Contenuti dell&apos;utente

          
            "Contenuti dell&apos;utente" include testo, audio, note, voci di diario, affermazioni, composizioni musicali o altro materiale che inserisci o generi tramite il Servizio.


          
            Autorizzi Palette Plotting e i fornitori di infrastruttura che supportano il Servizio a ospitare, archiviare, trasmettere ed elaborare tecnicamente i tuoi Contenuti dell&apos;utente solo nella misura necessaria per conservarli nel tuo account, fornirli a te, sincronizzarli tra i tuoi dispositivi ed eseguire le funzionalita che scegli di utilizzare (come la generazione audio o la formattazione). Questa autorizzazione e limitata, non esclusiva e gratuita, e si applica solo finche il contenuto e archiviato per il tuo account.


          
            Non utilizziamo i tuoi Contenuti dell&apos;utente privati per pubblicita, esposizione pubblica o sviluppo generale del prodotto, salvo tuo consenso separato (ad esempio, addestramento dati opzionale nelle Impostazioni). Palette Plotting non esamina abitualmente diari, affermazioni o audio privati per finalita editoriali o commerciali.


          Possiamo rimuovere contenuti che violano i presenti Termini o la Politica di uso consentito.




        
          5a. Composizione musicale e copyright

          Utilizzando la funzione Compositore musicale, riconosci e accetti che:

          
            creerai solo composizioni musicali originali

            non ricreerai, copierai o imiterai melodie, canzoni o opere musicali protette da copyright

            sei l&apos;unico responsabile nel garantire che le tue composizioni non violino copyright, marchi o altri diritti di proprieta intellettuale esistenti

            manleverai e terrai indenne Palette Plotting da pretese derivanti da violazioni del copyright nelle tue composizioni

          
          
            La violazione di questi termini puo comportare la rimozione immediata dei contenuti e la chiusura dell&apos;account.





        
          6. Contenuti assistiti dalla tecnologia e generati dal sistema

          
            Alcune funzionalita possono offrire risposte automatizzate, suggerimenti o contenuti generati dall&apos;IA per supportare la tua riflessione o i tuoi obiettivi creativi. Riconosci che:


          
            tali contenuti possono essere imperfetti o incompleti

            non sostituiscono la consulenza professionale

            sei responsabile di come li utilizzi

          
          Possiamo modificare o limitare tali funzionalita in qualsiasi momento.




        
          7. Notifiche degli obiettivi

          
            Le notifiche degli obiettivi possono essere configurate con strumenti o servizi esterni scelti dall&apos;utente, come integrazioni calendario, automazioni del dispositivo o scorciatoie del sistema operativo. Questi strumenti possono essere usati per ricordarti di rivedere gli obiettivi, aprire check-in settimanali o accedere ad aree specifiche del Servizio in orari selezionati.


          
            Palette Plotting attualmente non invia notifiche degli obiettivi tramite SMS/email e non controlla, gestisce o garantisce le prestazioni di calendari di terze parti, automazioni del dispositivo o funzionalita del sistema operativo. Palette Plotting non e responsabile per avvisi mancati, errori di consegna, errori di programmazione, impostazioni del dispositivo o modifiche apportate da fornitori esterni.


          L&apos;uso di strumenti di notifica esterni e facoltativo ed e gestito interamente dall&apos;utente.




        
          8. Abbonamenti e fatturazione

          
            Palette Plotting offre piani di abbonamento (incluse opzioni come piani mensili o annuali). I nomi e i prezzi dei piani possono cambiare.


          
            Funzionalita, livelli di accesso e limiti di utilizzo: Le funzionalita incluse in ciascun livello di abbonamento, i livelli di accesso a specifiche funzionalita, i limiti di utilizzo (come limiti giornalieri di messaggi, limiti settimanali di creazione e quote di archiviazione) e altri vantaggi dell&apos;abbonamento possono cambiare in qualsiasi momento senza preavviso. Ci riserviamo il diritto di modificare, aggiungere o rimuovere funzionalita, adeguare i limiti di utilizzo, cambiare i livelli di accesso o alterare qualsiasi aspetto dei livelli di abbonamento secondo necessita per mantenere la qualita del servizio, prevenire abusi o adattarci a requisiti operativi. L&apos;uso continuato del Servizio dopo tali cambiamenti costituisce accettazione delle modifiche.


          Tutte le vendite sono definitive, salvo ove richiesto dalla legge applicabile.

          
            Google Play (Android): Gli abbonamenti in-app acquistati tramite l&apos;app Android utilizzano il sistema di fatturazione Google Play. Pagamenti, rinnovi, cancellazioni e richieste di rimborso sono gestiti secondo le policy di Google; invia le richieste di rimborso tramite Google Play, non a Palette Plotting.


          
            Sottoscrivendo un abbonamento, autorizzi l&apos;addebito ricorrente fino alla cancellazione. Le cancellazioni hanno effetto al termine del periodo di fatturazione in corso.


          Non offriamo rimborsi per periodi parziali o tempo non utilizzato.

          
            Conservazione dei dati: In caso di scadenza o cancellazione dell&apos;abbonamento, i tuoi contenuti utente, inclusi a titolo esemplificativo ma non esaustivo analisi della struttura delle convinzioni, voci di diario, set di affermazioni, audio creato nel Servizio e altri media o dati creati tramite il Servizio, possono essere eliminati in modo permanente. Sebbene possiamo conservare alcuni dati per un periodo limitato dopo la cancellazione, non garantiamo la conservazione dei dati e i contenuti possono andare persi per errori di sistema, problemi tecnici o cambi di policy.





        
          9. Proprieta intellettuale

          
            Palette Plotting e tutti i contenuti, branding, design e materiali associati sono di proprieta di Palette Plotting LLC o dei suoi licenzianti.


          Non puoi:

          
            copiare o distribuire il Servizio

            effettuare reverse engineering del software

            usare impropriamente marchi o branding

            creare opere derivate dalla piattaforma

          



        
          10. Modifiche al Servizio

          Possiamo modificare, interrompere o aggiornare qualsiasi parte del Servizio in qualsiasi momento.

          Non siamo responsabili per modifiche, sospensioni o interruzioni del servizio.




        
          11. Esclusioni di responsabilita

          Il Servizio e fornito "cosi com&apos;e" e "come disponibile".

          Non garantiamo:

          
            risultati specifici

            disponibilita ininterrotta

            accuratezza dei contenuti generati dal sistema

          
          Decliniamo tutte le garanzie nella misura massima consentita dalla legge.




        
          12. Limitazione di responsabilita

          
            Nella misura massima consentita dalla legge, Palette Plotting LLC non e responsabile per danni indiretti, incidentali, speciali, consequenziali o punitivi derivanti dal tuo utilizzo del Servizio.


          
            La nostra responsabilita totale per qualsiasi pretesa non superera l&apos;importo da te pagato in quote di abbonamento nei 12 mesi precedenti la pretesa.





        
          13. Manleva

          Accetti di manlevare e tenere indenne Palette Plotting LLC da pretese derivanti da:

          
            il tuo uso improprio del Servizio

            la tua violazione dei presenti Termini

            i tuoi Contenuti dell&apos;utente

          



        
          14. Legge applicabile

          
            I presenti Termini sono disciplinati dalle leggi dello Stato dell&apos;Illinois, senza considerare le norme sui conflitti di legge.





        
          15. Modifiche ai Termini

          
            Possiamo aggiornare i presenti Termini. L&apos;uso continuato del Servizio indica l&apos;accettazione della versione aggiornata.





        
          16. Contatti

          Le domande possono essere inviate a:

          support@paletteplot.com



      

      EULA

      Ultimo aggiornamento: [DATE]

      
        
          1. Accettazione dei termini

          
            Il presente Contratto di licenza con l&apos;utente finale ("EULA") e un accordo legale tra te e Palette Plotting LLC ("Palette Plotting", "noi", "nostro") esclusivamente, e non con Apple, Inc. ("Apple"). Palette Plotting e l&apos;unico responsabile dell&apos;Applicazione concessa in licenza e dei suoi contenuti. Il presente EULA non puo prevedere regole di utilizzo in conflitto con i Termini e condizioni di Apple Media Services in vigore alla Data di entrata in vigore (riconosci di aver avuto l&apos;opportunita di consultarli). Accedendo o utilizzando Palette Plotting, accetti i termini del presente EULA.





        
          2. Ambito della licenza

          
            Subordinatamente al rispetto del presente EULA, Palette Plotting ti concede una licenza limitata, non esclusiva, non trasferibile e revocabile per utilizzare l&apos;Applicazione concessa in licenza su qualsiasi prodotto a marchio Apple che possiedi o controlli, come consentito dalle Regole d&apos;uso stabilite nei Termini e condizioni di Apple Media Services. Questa licenza consente l&apos;accesso e l&apos;utilizzo dell&apos;Applicazione concessa in licenza anche da altri account associati a te tramite In famiglia o acquisti a volume.





        
          3. Manutenzione e supporto

          
            Palette Plotting e l&apos;unico responsabile della fornitura dei servizi di manutenzione e supporto relativamente all&apos;Applicazione concessa in licenza, come specificato nel presente EULA o come richiesto dalla legge applicabile. Riconosci che Apple non ha alcun obbligo di fornire manutenzione o supporto relativamente all&apos;Applicazione concessa in licenza.





        
          4. Garanzia

          
            Palette Plotting e l&apos;unico responsabile per le garanzie del prodotto, espresse o implicite per legge, nella misura in cui non siano efficacemente escluse. Per acquisti effettuati tramite App Store (incluse sottoscrizioni in-app), qualora l&apos;Applicazione concessa in licenza non sia conforme a una garanzia applicabile, puoi informare Apple e Apple ti rimborsera il prezzo di acquisto di tale acquisto su App Store. Questo non si applica ad abbonamenti o acquisti effettuati tramite il nostro sito web o altri metodi di pagamento (ad esempio Stripe); tali casi sono disciplinati dai nostri Termini di utilizzo generali e dalla policy di fatturazione. Nella misura massima consentita dalla legge applicabile, Apple non avra alcun altro obbligo di garanzia relativamente all&apos;Applicazione concessa in licenza, e qualsiasi altra pretesa, perdita, responsabilita, danno, costo o spesa attribuibile a qualsiasi inadempimento della garanzia sara responsabilita esclusiva di Palette Plotting.





        
          5. Reclami sul prodotto

          
            Tu e Palette Plotting riconoscete che Palette Plotting, e non Apple, e responsabile della gestione di qualsiasi reclamo tuo o di terzi relativo all&apos;Applicazione concessa in licenza o al tuo possesso e/o utilizzo della stessa, inclusi, a titolo esemplificativo: (i) reclami per responsabilita da prodotto; (ii) qualsiasi reclamo secondo cui l&apos;Applicazione concessa in licenza non e conforme a requisiti legali o normativi applicabili; e (iii) reclami ai sensi della normativa su tutela dei consumatori, privacy o simili. Il presente EULA non puo limitare la responsabilita di Palette Plotting nei tuoi confronti oltre quanto consentito dalla legge applicabile.





        
          6. Reclami in materia di proprieta intellettuale

          
            Tu e Palette Plotting riconoscete che, in caso di qualsiasi reclamo di terzi secondo cui l&apos;Applicazione concessa in licenza o il tuo possesso e utilizzo della stessa violi diritti di proprieta intellettuale di tale terzo, Palette Plotting, e non Apple, sara l&apos;unico responsabile di investigare, difendere, comporre e definire qualsiasi reclamo di violazione della proprieta intellettuale.





        
          7. Conformita legale

          
            Dichiari e garantisci che (i) non ti trovi in un Paese soggetto a embargo del Governo degli Stati Uniti, ne in un Paese designato dal Governo degli Stati Uniti come Paese che "sostiene il terrorismo"; e (ii) non sei incluso in alcuna lista del Governo degli Stati Uniti di soggetti vietati o soggetti a restrizioni.





        
          8. Nome dello sviluppatore e contatti

          
            L&apos;Applicazione concessa in licenza e concessa in licenza da Palette Plotting LLC. Domande, reclami o segnalazioni relative all&apos;Applicazione concessa in licenza devono essere inviate a: support@paletteplot.com. (Per l&apos;indirizzo postale, contattaci all&apos;email precedente.)





        
          9. Termini di terze parti

          
            Devi rispettare i termini contrattuali di terze parti applicabili quando utilizzi l&apos;Applicazione concessa in licenza (ad esempio, non devi violare il tuo contratto di servizi dati mobili durante l&apos;uso dell&apos;Applicazione concessa in licenza).





        
          10. Terzo beneficiario

          
            Tu e Palette Plotting riconoscete e accettate che Apple e le societa controllate di Apple sono terzi beneficiari del presente EULA e che, a seguito della tua accettazione dei termini e condizioni del presente EULA, Apple avra il diritto (e si considerera che abbia accettato il diritto) di far valere il presente EULA nei tuoi confronti in qualita di terzo beneficiario dello stesso.





        
          11. Restrizioni della licenza

          Non puoi:

          
            Copiare, modificare o creare opere derivate del servizio

            Effettuare reverse engineering, decompilare o disassemblare il servizio

            Rimuovere avvisi o etichette di proprieta

            Noleggiare, concedere in leasing, prestare o vendere accesso al servizio

            Usare il servizio per qualsiasi finalita illegale

            Interferire con o interrompere il servizio o i server

          



        
          12. Proprieta intellettuale

          
            Il servizio, inclusi tutti i contenuti, le funzionalita e le caratteristiche, e di proprieta di Palette Plotting ed e protetto da leggi su copyright, marchi e altre leggi sulla proprieta intellettuale. Il presente EULA non ti concede diritti d&apos;uso dei nostri marchi, loghi o altri elementi di brand.





        
          13. Contenuti dell&apos;utente

          
            Autorizzi Palette Plotting a ospitare, archiviare, trasmettere ed elaborare tecnicamente i tuoi contenuti solo nella misura necessaria per fornire l&apos;Applicazione concessa in licenza al tuo account, come descritto nella precedente sezione Contenuti dell&apos;utente.





        
          14. Risoluzione

          
            Questa licenza e efficace fino alla sua risoluzione. Possiamo risolvere o sospendere il tuo accesso immediatamente, senza preavviso, in caso di violazione del presente EULA. Alla risoluzione, il tuo diritto a usare il servizio cessera immediatamente.





        
          15. Esclusione di garanzie

          
            IL SERVIZIO VIENE FORNITO "COSI COM&apos;E" E "COME DISPONIBILE" SENZA GARANZIE DI ALCUN TIPO, ESPRESSE O IMPLICITE, INCLUSE, A TITOLO ESEMPLIFICATIVO, GARANZIE IMPLICITE DI COMMERCIABILITA, IDONEITA A UNO SCOPO PARTICOLARE O NON VIOLAZIONE.





        
          16. Limitazione di responsabilita

          
            NELLA MISURA MASSIMA CONSENTITA DALLA LEGGE, PALETTE PLOTTING NON SARA RESPONSABILE PER DANNI INDIRETTI, INCIDENTALI, SPECIALI, CONSEQUENZIALI O PUNITIVI, NE PER PERDITA DI PROFITTI O RICAVI, SIA SOSTENUTA DIRETTAMENTE CHE INDIRETTAMENTE.





        
          17. Aggiornamenti e modifiche

          
            Ci riserviamo il diritto di modificare, aggiornare o interrompere il servizio in qualsiasi momento. Possiamo inoltre aggiornare periodicamente il presente EULA. Il tuo uso continuato del servizio dopo tali modifiche costituisce accettazione dell&apos;EULA aggiornato.





        
          18. Legge applicabile

          
            Il presente EULA sara disciplinato e interpretato in conformita alle leggi applicabili, senza considerare le relative disposizioni sui conflitti di legge.





        
          19. Informazioni di contatto

          
            Se hai domande su questo EULA, contattaci all&apos;indirizzo support@paletteplot.com
```

## Terms — NL

Route: /terms/NL

```
Gebruiksvoorwaarden en EULA

      
        Ingangsdatum: 13 januari 2025

        Bedrijf: Palette Plotting LLC ("Palette Plotting", "wij", "ons", "onze")



      Gebruiksvoorwaarden

      
        
          
            Deze Gebruiksvoorwaarden ("Voorwaarden") regelen jouw toegang tot en gebruik van Palette Plotting, inclusief alle digitale tools, functies, content en diensten die worden aangeboden via onze website, app of PWA (gezamenlijk de "Dienst").


          Door de Dienst te gebruiken, ga je akkoord met deze Voorwaarden.

          Als je niet akkoord gaat, gebruik de Dienst dan niet.




        
          1. Geschiktheid

          De Dienst is bedoeld voor personen van 18 jaar en ouder.

          Je mag de Dienst niet gebruiken als je jonger bent dan 18 jaar.




        
          2. Overzicht van de Dienst

          
            Palette Plotting biedt digitale tools die bedoeld zijn om persoonlijke reflectie, doelstelling, journaling, audiocreatie en mindsetontwikkeling te ondersteunen. Bepaalde onderdelen van de Dienst kunnen geautomatiseerde functies, door het systeem gegenereerde suggesties of door technologie ondersteunde content bevatten.


          
            De Dienst vormt geen medisch, psychologisch, therapeutisch, financieel of juridisch advies en vervangt geen professionele ondersteuning.


          We kunnen functies van de Dienst op elk moment bijwerken of wijzigen.




        
          3. Accountregistratie

          Om bepaalde functies te gebruiken, moet je mogelijk een account aanmaken. Je stemt ermee in om:

          
            nauwkeurige informatie te verstrekken

            je inloggegevens vertrouwelijk te houden

            ons op de hoogte te stellen van ongeautoriseerd gebruik

          
          Je bent verantwoordelijk voor activiteiten die plaatsvinden onder jouw account.




        
          4. Toegestaan gebruik

          
            Je moet ons Beleid voor toegestaan gebruik naleven, dat door verwijzing is opgenomen en afzonderlijk beschikbaar is.


          Verboden gedrag omvat onder meer:

          
            intimidatie, misbruik of haatdragend gedrag

            het uploaden of delen van illegale of ongepaste content

            fraude, impersonatie of onjuiste voorstelling van zaken

            pogingen om de Dienst te verstoren of te onderbreken

            gebruik van de Dienst voor illegale of onveilige doeleinden

            pogingen om systeembeveiligingen te omzeilen

            het uitbuiten van minderjarigen of het plaatsen van content met minderjarigen in ongepaste context

            het uploaden van auteursrechtelijk beschermd materiaal zonder toestemming

          
          We kunnen je account opschorten of beeindigen bij overtredingen.




        
          5. Gebruikerscontent

          
            "Gebruikerscontent" omvat tekst, audio, notities, dagboekitems, affirmaties, muziekcomposities of ander materiaal dat je invoert of genereert via de Dienst.


          
            Je verleent Palette Plotting en de infrastructuurproviders die de Dienst ondersteunen toestemming om jouw Gebruikerscontent alleen te hosten, op te slaan, te verzenden en technisch te verwerken voor zover nodig om deze in je account op te slaan, aan jou te leveren, tussen je apparaten te synchroniseren en de functies uit te voeren die je kiest te gebruiken (zoals audiogeneratie of opmaak). Deze toestemming is beperkt, niet-exclusief en royaltyvrij, en geldt alleen zolang de content voor je account is opgeslagen.


          
            We gebruiken jouw prive Gebruikerscontent niet voor advertenties, publieke weergave of algemene productontwikkeling, tenzij je daar afzonderlijk mee instemt (bijvoorbeeld optionele datatraining in Instellingen). Palette Plotting beoordeelt prive dagboeken, affirmaties of audio niet routinematig voor redactionele of commerciele doeleinden.


          We kunnen content verwijderen die deze Voorwaarden of het Beleid voor toegestaan gebruik schendt.




        
          5a. Muziekcompositie en auteursrecht

          Door de functie Muziekcomponist te gebruiken, erken en accepteer je dat:

          
            je alleen originele muziekcomposities maakt

            je geen melodieen, nummers of muzikale werken met auteursrecht zult recreeren, kopieren of imiteren

            je als enige verantwoordelijk bent om ervoor te zorgen dat je composities geen inbreuk maken op bestaande auteursrechten, handelsmerken of andere intellectuele eigendomsrechten

            je Palette Plotting vrijwaart en schadeloos stelt voor claims voortvloeiend uit auteursrechtinbreuk in je composities

          
          
            Overtreding van deze voorwaarden kan leiden tot onmiddellijke verwijdering van content en beeindiging van het account.





        
          6. Door technologie ondersteunde en door systeem gegenereerde content

          
            Sommige functies kunnen geautomatiseerde antwoorden, suggesties of door AI gegenereerde content bieden ter ondersteuning van jouw reflectie of creatieve doelen. Je erkent dat:


          
            dergelijke content onvolledig of onjuist kan zijn

            deze geen professioneel advies vervangt

            je verantwoordelijk bent voor hoe je deze gebruikt

          
          We kunnen deze functies op elk moment aanpassen of beperken.




        
          7. Doelmeldingen

          
            Doelmeldingen kunnen worden geconfigureerd met externe tools of diensten die door de gebruiker zijn gekozen, zoals kalenderintegraties, apparaatautomatiseringen of snelkoppelingen van het besturingssysteem. Deze tools kunnen worden gebruikt om te herinneren aan het bekijken van doelen, het openen van wekelijkse check-ins of toegang tot specifieke onderdelen van de Dienst op gekozen tijden.


          
            Palette Plotting verzendt momenteel geen doelmeldingen via sms/e-mail en beheert, exploiteert of garandeert de prestaties van kalenders van derden, apparaatautomatiseringen of functies van het besturingssysteem niet. Palette Plotting is niet verantwoordelijk voor gemiste meldingen, afleveringsfouten, planningsfouten, apparaatsinstellingen of wijzigingen die door externe providers zijn aangebracht.


          Het gebruik van externe notificatietools is optioneel en volledig door de gebruiker beheerd.




        
          8. Abonnementen en facturering

          
            Palette Plotting biedt abonnementsplannen aan (waaronder opties zoals maandelijkse of jaarlijkse plannen). Plannamen en prijzen kunnen wijzigen.


          
            Functies, toegangsniveaus en gebruikslimieten: De functies die in elk abonnementsniveau zijn inbegrepen, de toegangsniveaus tot specifieke functionaliteiten, gebruikslimieten (zoals dagelijkse berichtenlimieten, wekelijkse aanmaaklimieten en opslagquota) en andere abonnementsvoordelen kunnen op elk moment zonder voorafgaande kennisgeving wijzigen. We behouden ons het recht voor functies te wijzigen, toe te voegen of te verwijderen, gebruikslimieten aan te passen, toegangsniveaus te wijzigen of enig aspect van abonnementsniveaus aan te passen indien nodig om de servicekwaliteit te handhaven, misbruik te voorkomen of aan operationele vereisten te voldoen. Voortgezet gebruik van de Dienst na dergelijke wijzigingen vormt jouw aanvaarding van die wijzigingen.


          Alle verkopen zijn definitief, behalve waar toepasselijke wetgeving anders vereist.

          
            Google Play (Android): In-app abonnementen die via de Android-app worden gekocht, gebruiken het factureringssysteem van Google Play. Betalingen, verlengingen, annuleringen en terugbetalingsverzoeken worden beheerd onder het beleid van Google; dien terugbetalingsverzoeken in via Google Play, niet via Palette Plotting.


          
            Door je te abonneren, machtig je terugkerende facturering totdat je annuleert. Annuleringen worden van kracht aan het einde van de huidige factureringsperiode.


          Wij bieden geen terugbetalingen voor gedeeltelijke perioden of ongebruikte tijd.

          
            Gegevensbewaring: Bij afloop of annulering van het abonnement kan jouw gebruikerscontent, inclusief maar niet beperkt tot analyses van overtuigingsstructuren, dagboekitems, affirmatiesets, audio die in de Dienst is gemaakt en andere media of gegevens die via de Dienst zijn gemaakt, permanent worden verwijderd. Hoewel we bepaalde gegevens gedurende een beperkte periode na annulering kunnen bewaren, garanderen we geen gegevensbewaring en content kan verloren gaan door systeemfouten, technische problemen of beleidswijzigingen.





        
          9. Intellectueel eigendom

          
            Palette Plotting en alle bijbehorende content, branding, ontwerp en materialen zijn eigendom van Palette Plotting LLC of haar licentiegevers.


          Je mag niet:

          
            de Dienst kopieren of distribueren

            de software reverse engineeren

            handelsmerken of branding misbruiken

            afgeleide werken van het platform maken

          



        
          10. Wijzigingen van de Dienst

          We kunnen elk onderdeel van de Dienst op elk moment wijzigen, stopzetten of bijwerken.

          Wij zijn niet aansprakelijk voor wijzigingen, opschortingen of onderbrekingen van de dienst.




        
          11. Disclaimers

          De Dienst wordt geleverd "zoals deze is" en "zoals beschikbaar".

          Wij garanderen niet:

          
            specifieke resultaten

            ononderbroken beschikbaarheid

            nauwkeurigheid van door het systeem gegenereerde content

          
          Wij wijzen alle garanties af voor zover wettelijk toegestaan.




        
          12. Beperking van aansprakelijkheid

          
            Voor zover maximaal toegestaan door de wet is Palette Plotting LLC niet aansprakelijk voor indirecte, incidentele, bijzondere, gevolg- of punitieve schade die voortvloeit uit jouw gebruik van de Dienst.


          
            Onze totale aansprakelijkheid voor enige claim zal niet hoger zijn dan het bedrag dat je hebt betaald aan abonnementskosten in de 12 maanden voorafgaand aan de claim.





        
          13. Vrijwaring

          Je stemt ermee in Palette Plotting LLC te vrijwaren en schadeloos te stellen voor claims die voortvloeien uit:

          
            jouw oneigenlijk gebruik van de Dienst

            jouw schending van deze Voorwaarden

            jouw Gebruikerscontent

          



        
          14. Toepasselijk recht

          
            Deze Voorwaarden worden beheerst door de wetten van de staat Illinois, zonder rekening te houden met conflictenrechtelijke regels.





        
          15. Wijzigingen van de Voorwaarden

          
            We kunnen deze Voorwaarden bijwerken. Voortgezet gebruik van de Dienst geeft aan dat je de bijgewerkte versie accepteert.





        
          16. Contact

          Vragen kunnen worden gericht aan:

          support@paletteplot.com



      

      EULA

      Laatst bijgewerkt: [DATE]

      
        
          1. Aanvaarding van voorwaarden

          
            Deze Eindgebruikerslicentieovereenkomst ("EULA") is een juridische overeenkomst uitsluitend tussen jou en Palette Plotting LLC ("Palette Plotting", "wij", "ons"), en niet met Apple, Inc. ("Apple"). Palette Plotting is als enige verantwoordelijk voor de Gelicentieerde Applicatie en de inhoud daarvan. Deze EULA mag geen gebruiksregels bevatten die in strijd zijn met de Apple Media Services Terms and Conditions die gelden op de Ingangsdatum (je erkent dat je de mogelijkheid hebt gehad deze te bekijken). Door Palette Plotting te openen of te gebruiken, ga je akkoord met de voorwaarden van deze EULA.





        
          2. Reikwijdte van licentie

          
            Onder voorbehoud van jouw naleving van deze EULA verleent Palette Plotting je een beperkte, niet-exclusieve, niet-overdraagbare en herroepbare licentie om de Gelicentieerde Applicatie te gebruiken op elk Apple-merkproduct dat je bezit of beheert, zoals toegestaan onder de Usage Rules uiteengezet in de Apple Media Services Terms and Conditions. Deze licentie staat toe dat de Gelicentieerde Applicatie wordt geopend en gebruikt door andere accounts die aan jou zijn gekoppeld via Family Sharing of volumeaankopen.





        
          3. Onderhoud en ondersteuning

          
            Palette Plotting is als enige verantwoordelijk voor het leveren van onderhouds- en ondersteuningsdiensten met betrekking tot de Gelicentieerde Applicatie, zoals gespecificeerd in deze EULA of zoals vereist door toepasselijke wetgeving. Je erkent dat Apple geen verplichting heeft om onderhoud of ondersteuning te bieden met betrekking tot de Gelicentieerde Applicatie.





        
          4. Garantie

          
            Palette Plotting is als enige verantwoordelijk voor productgaranties, uitdrukkelijk of impliciet op grond van de wet, voor zover deze niet rechtsgeldig zijn uitgesloten. Voor aankopen via de App Store (inclusief in-app abonnementen) geldt dat als de Gelicentieerde Applicatie niet voldoet aan een toepasselijke garantie, je Apple hiervan op de hoogte kunt stellen en Apple de aankoopprijs van die App Store-aankoop zal terugbetalen. Dit is niet van toepassing op abonnementen of aankopen via onze website of andere betaalmethoden (bijvoorbeeld Stripe); deze vallen onder onze algemene Gebruiksvoorwaarden en het factureringsbeleid. Voor zover maximaal toegestaan door toepasselijke wetgeving heeft Apple geen andere garantieverplichting met betrekking tot de Gelicentieerde Applicatie, en enige andere claim, verlies, aansprakelijkheid, schade, kosten of uitgaven die toerekenbaar zijn aan een schending van garantie zijn de exclusieve verantwoordelijkheid van Palette Plotting.





        
          5. Productclaims

          
            Jij en Palette Plotting erkennen dat Palette Plotting, en niet Apple, verantwoordelijk is voor het afhandelen van claims van jou of derden met betrekking tot de Gelicentieerde Applicatie of jouw bezit en/of gebruik van de Gelicentieerde Applicatie, inclusief maar niet beperkt tot: (i) productaansprakelijkheidsclaims; (ii) claims dat de Gelicentieerde Applicatie niet voldoet aan toepasselijke wettelijke of regelgevende vereisten; en (iii) claims onder consumentenbescherming, privacywetgeving of soortgelijke wetgeving. Deze EULA mag de aansprakelijkheid van Palette Plotting jegens jou niet beperken buiten wat onder toepasselijke wetgeving is toegestaan.





        
          6. Claims inzake intellectueel eigendom

          
            Jij en Palette Plotting erkennen dat in het geval van een claim van een derde dat de Gelicentieerde Applicatie of jouw bezit en gebruik daarvan inbreuk maakt op intellectuele eigendomsrechten van die derde, Palette Plotting, en niet Apple, als enige verantwoordelijk zal zijn voor het onderzoeken, verdedigen, schikken en afdoen van enige dergelijke claim inzake intellectuele eigendomsinbreuk.





        
          7. Wettelijke naleving

          
            Je verklaart en garandeert dat (i) je je niet bevindt in een land dat onder embargo staat van de Amerikaanse overheid, of dat door de Amerikaanse overheid is aangewezen als een land dat "terrorisme ondersteunt"; en (ii) je niet voorkomt op een lijst van de Amerikaanse overheid met verboden of beperkte partijen.





        
          8. Naam ontwikkelaar en contact

          
            De Gelicentieerde Applicatie wordt in licentie gegeven door Palette Plotting LLC. Vragen, klachten of claims met betrekking tot de Gelicentieerde Applicatie moeten worden gericht aan: support@paletteplot.com. (Voor postadres, neem contact op via de bovenstaande e-mail.)





        
          9. Voorwaarden van derden

          
            Je moet voldoen aan toepasselijke voorwaarden van derden bij het gebruik van de Gelicentieerde Applicatie (bijvoorbeeld, je mag je mobiele datadienstovereenkomst niet schenden bij gebruik van de Gelicentieerde Applicatie).





        
          10. Derde-begunstigde

          
            Jij en Palette Plotting erkennen en stemmen ermee in dat Apple en de dochterondernemingen van Apple derde-begunstigden zijn van deze EULA, en dat Apple, na jouw aanvaarding van de voorwaarden van deze EULA, het recht heeft (en geacht wordt dat recht te hebben aanvaard) om deze EULA jegens jou af te dwingen als derde-begunstigde daarvan.





        
          11. Licentiebeperkingen

          Je mag niet:

          
            De dienst kopieren, wijzigen of afgeleide werken ervan maken

            De dienst reverse engineeren, decompileren of demonteren

            Eigendomsvermeldingen of labels verwijderen

            Toegang tot de dienst verhuren, leasen, uitlenen of verkopen

            De dienst gebruiken voor enig illegaal doel

            De dienst of servers verstoren of onderbreken

          



        
          12. Intellectueel eigendom

          
            De dienst, inclusief alle content, functies en functionaliteit, is eigendom van Palette Plotting en wordt beschermd door auteursrecht-, merken- en andere intellectuele-eigendomswetten. Deze EULA verleent je geen rechten om onze handelsmerken, logo&apos;s of andere merksymbolen te gebruiken.





        
          13. Gebruikerscontent

          
            Je verleent Palette Plotting toestemming om jouw content alleen te hosten, op te slaan, te verzenden en technisch te verwerken voor zover nodig om de Gelicentieerde Applicatie aan jouw account te leveren, zoals beschreven in de bovenstaande sectie Gebruikerscontent.





        
          14. Beeindiging

          
            Deze licentie is van kracht totdat deze wordt beeindigd. We kunnen jouw toegang onmiddellijk beeindigen of opschorten, zonder voorafgaande kennisgeving, bij een schending van deze EULA. Bij beeindiging vervalt jouw recht om de dienst te gebruiken onmiddellijk.





        
          15. Uitsluiting van garanties

          
            DE DIENST WORDT GELEVERD "AS IS" EN "AS AVAILABLE" ZONDER ENIGE GARANTIE, UITDRUKKELIJK OF IMPLICIET, INCLUSIEF MAAR NIET BEPERKT TOT IMPLICIETE GARANTIES VAN VERKOOPBAARHEID, GESCHIKTHEID VOOR EEN BEPAALD DOEL OF NIET-INBREUK.





        
          16. Beperking van aansprakelijkheid

          
            VOOR ZOVER MAXIMAAL TOEGESTAAN DOOR DE WET IS PALETTE PLOTTING NIET AANSPRAKELIJK VOOR INDIRECTE, INCIDENTELE, BIJZONDERE, GEVOLG- OF PUNITIEVE SCHADE, OF VOOR VERLIES VAN WINST OF INKOMSTEN, ONGEACHT OF DEZE DIRECT OF INDIRECT ZIJN OPGELOPEN.





        
          17. Updates en wijzigingen

          
            We behouden ons het recht voor om de dienst op elk moment te wijzigen, bij te werken of te stoppen. We kunnen deze EULA ook periodiek bijwerken. Jouw voortgezette gebruik van de dienst na dergelijke wijzigingen vormt aanvaarding van de bijgewerkte EULA.





        
          18. Toepasselijk recht

          
            Deze EULA wordt beheerst en uitgelegd in overeenstemming met toepasselijk recht, zonder rekening te houden met conflictenrechtelijke bepalingen.





        
          19. Contactgegevens

          
            Als je vragen hebt over deze EULA, neem dan contact met ons op via support@paletteplot.com
```

## Terms — ZH

Route: /terms/ZH

```
使用条款与 EULA

      
        生效日期：2025年1月13日

        公司：Palette Plotting LLC ("Palette Plotting"、"我们"、"我们的")



      使用条款

      
        
          
            本使用条款（"条款"）适用于您对 Palette Plotting 的访问和使用，包括通过我们的网站、应用程序或 PWA 提供的所有数字工具、功能、内容和服务（统称为"服务"）。


          使用本服务即表示您同意本条款。

          如您不同意，请勿使用本服务。




        
          1. 资格要求

          本服务面向年满 18 周岁的个人。

          如您未满 18 周岁，不得使用本服务。




        
          2. 服务概述

          
            Palette Plotting 提供旨在支持个人反思、目标设定、日记记录、音频创作和心态发展的数字工具。服务的部分内容可能包含自动化功能、系统生成建议或技术辅助内容。


          
            本服务不构成医疗、心理、治疗、财务或法律建议，亦不替代专业支持。


          我们可随时更新或修改服务功能。




        
          3. 账户注册

          使用部分功能时，您可能需要创建账户。您同意：

          
            提供准确的信息

            妥善保管您的登录凭据并保持其保密性

            在发现任何未经授权使用时及时通知我们

          
          您应对账户项下发生的活动负责。




        
          4. 可接受使用

          
            您须遵守我们单独提供并通过引用纳入本条款的《可接受使用政策》。


          禁止行为包括但不限于：

          
            骚扰、辱骂或仇恨行为

            上传或分享非法或不当内容

            欺诈、冒充或虚假陈述

            试图干扰或中断服务

            将服务用于任何非法或不安全目的

            试图规避系统安全防护措施

            剥削未成年人或在任何不当情境下发布涉及未成年人的内容

            未经许可上传受版权保护的内容

          
          如有违反，我们可暂停或终止您的账户。




        
          5. 用户内容

          
            "用户内容"包括您通过本服务输入或生成的文本、音频、笔记、日记条目、肯定语、音乐作品或其他材料。


          
            您允许 Palette Plotting 及支持本服务的基础设施提供商，仅在为将内容保存至您的账户、向您提供内容、在您的设备间同步内容以及执行您选择使用的功能（如音频生成或格式化）所必需的范围内，对您的用户内容进行托管、存储、传输和技术处理。该许可为有限、非独占、免版税许可，且仅在内容为您的账户存储期间有效。


          
            除非您另行同意（例如在设置中选择可选数据训练），我们不会将您的私密用户内容用于广告、公开展示或一般产品开发。Palette Plotting 不会出于编辑或商业目的对私密日记、肯定语或音频进行常规审查。


          我们可删除违反本条款或《可接受使用政策》的内容。




        
          5a. 音乐创作与版权

          使用音乐创作器功能即表示您确认并同意：

          
            您仅创作原创音乐作品

            您不会重现、复制或模仿受版权保护的旋律、歌曲或音乐作品

            您对确保作品不侵犯任何现有版权、商标或其他知识产权承担全部责任

            对于因您作品中的版权侵权所引发的任何主张，您将赔偿并使 Palette Plotting 免受损害

          
          
            违反上述条款可能导致内容被立即删除并导致账户被终止。





        
          6. 技术辅助及系统生成内容

          
            部分功能可能提供自动化回复、建议或 AI 生成内容，以支持您的反思或创意目标。您确认：


          
            该等内容可能并不完美或不完整

            其不构成专业建议的替代

            您应对其使用方式自行负责

          
          我们可随时调整或限制此类功能。




        
          7. 目标提醒通知

          
            目标提醒通知可通过用户自行选择的外部工具或服务进行配置，例如日历集成、设备自动化或操作系统快捷方式。该等工具可用于在选定时间提醒您查看目标、打开每周打卡或访问服务中的特定区域。


          
            Palette Plotting 目前不会通过短信/电子邮件发送目标提醒，亦不控制、运营或保证第三方日历、设备自动化或操作系统功能的表现。对于提醒遗漏、发送失败、排程错误、设备配置问题或外部提供方作出的变更，Palette Plotting 不承担责任。


          使用外部通知工具为可选项，且由用户完全自行管理。




        
          8. 订阅与计费

          
            Palette Plotting 提供订阅方案（包括月度或年度方案等选项）。方案名称和价格可能发生变更。


          
            功能、访问等级与使用限制：各订阅等级所含功能、特定功能的访问等级、使用限制（如每日消息上限、每周创建上限及存储配额）及其他订阅权益，均可能随时变更而不另行通知。我们保留在必要时修改、增加或删除功能，调整使用限制，变更访问等级，或调整订阅等级任何方面的权利，以维持服务质量、防止滥用或适应运营要求。在上述变更后继续使用服务，即构成您对变更内容的接受。


          除适用法律另有强制规定外，所有销售均为最终销售。

          
            Google Play（Android）：通过 Android 应用内购买的订阅使用 Google Play 计费系统。付款、续订、取消与退款申请均受 Google 政策约束；退款申请应通过 Google Play 提交，而非向 Palette Plotting 提交。


          
            订阅即表示您授权周期性计费，直至您取消为止。取消将在当前计费周期结束时生效。


          我们不对部分周期或未使用时长提供退款。

          
            数据保留：如订阅到期或被取消，您的用户内容（包括但不限于信念结构分析、日记条目、肯定语集合、在服务中创建的音频，以及通过服务创建的其他媒体或数据）可能被永久删除。尽管我们可能在取消后有限期间保留部分数据，但我们不保证数据保留，且内容可能因系统错误、技术问题或政策变更而丢失。





        
          9. 知识产权

          
            Palette Plotting 及所有相关内容、品牌标识、设计和材料均归 Palette Plotting LLC 或其许可方所有。


          您不得：

          
            复制或分发本服务

            对软件进行逆向工程

            不当使用商标或品牌标识

            基于本平台创建衍生作品

          



        
          10. 服务变更

          我们可随时修改、停止或更新服务的任何部分。

          对于服务变更、暂停或中断，我们不承担责任。




        
          11. 免责声明

          本服务按"现状"及"可用"基础提供。

          我们不保证：

          
            实现特定结果

            服务持续不中断

            系统生成内容的准确性

          
          在法律允许的最大范围内，我们不作任何保证。




        
          12. 责任限制

          
            在法律允许的最大范围内，Palette Plotting LLC 对因您使用服务而产生的任何间接、附带、特殊、后果性或惩罚性损害不承担责任。


          
            对于任何主张，我们的累计责任总额不超过您在该主张提出前 12 个月内支付的订阅费用。





        
          13. 赔偿

          您同意就以下事项对 Palette Plotting LLC 进行赔偿并使其免受损害：

          
            您对服务的不当使用

            您违反本条款

            您的用户内容

          



        
          14. 适用法律

          
            本条款受伊利诺伊州法律管辖，并据其解释，但不适用其法律冲突规则。





        
          15. 条款变更

          
            我们可更新本条款。您继续使用本服务即表示接受更新后的版本。





        
          16. 联系方式

          如有疑问，请联系：

          support@paletteplot.com



      

      EULA

      最后更新：[DATE]

      
        
          1. 条款接受

          
            本最终用户许可协议（"EULA"）系您与且仅与 Palette Plotting LLC（"Palette Plotting"、"我们"、"我们的"）之间的法律协议，而非您与 Apple, Inc.（"Apple"）之间的协议。Palette Plotting 对本授权应用及其内容承担唯一责任。本 EULA 不得制定与生效日期时有效的 Apple Media Services 条款与条件相冲突的使用规则（您确认您已有机会查阅该等条款）。访问或使用 Palette Plotting 即表示您同意本 EULA 条款。





        
          2. 许可范围

          
            在您遵守本 EULA 的前提下，Palette Plotting 授予您有限的、非独占的、不可转让的、可撤销的许可，允许您在您拥有或控制的任何 Apple 品牌产品上使用本授权应用，且该使用须符合 Apple Media Services 条款与条件中规定的使用规则。本许可允许与您关联的其他账户通过家庭共享或批量采购方式访问和使用本授权应用。





        
          3. 维护与支持

          
            Palette Plotting 仅对本授权应用的维护和支持服务承担责任，具体以本 EULA 约定或适用法律要求为准。您确认 Apple 对本授权应用不承担任何维护或支持义务。





        
          4. 保证

          
            在法律未被有效排除的范围内，Palette Plotting 对明示或法律默示的产品保证承担唯一责任。对于通过 App Store 完成的购买（包括应用内订阅），若本授权应用不符合任何适用保证，您可通知 Apple，Apple 将向您退还该次 App Store 购买价款。本条不适用于通过我们网站或其他支付方式（例如 Stripe）完成的订阅或购买；该等交易受我们一般使用条款及计费政策约束。在适用法律允许的最大范围内，Apple 对本授权应用不承担任何其他保证义务；因任何保证不成立而引发的其他主张、损失、责任、损害、成本或费用，由 Palette Plotting 独自承担。





        
          5. 产品相关主张

          
            您与 Palette Plotting 确认，对于您或任何第三方就本授权应用或您对本授权应用的占有和/或使用提出的任何主张，责任方为 Palette Plotting 而非 Apple，包括但不限于：(i) 产品责任主张；(ii) 本授权应用不符合任何适用法律或监管要求的主张；以及 (iii) 基于消费者保护、隐私或类似法律提出的主张。本 EULA 不得将 Palette Plotting 对您的责任限制至低于适用法律允许的范围。





        
          6. 知识产权主张

          
            您与 Palette Plotting 确认，如有任何第三方主张本授权应用或您对本授权应用的占有和使用侵犯该第三方知识产权，则由 Palette Plotting（而非 Apple）独自负责调查、抗辩、和解并处理该等知识产权侵权主张。





        
          7. 法律合规

          
            您声明并保证：(i) 您不位于受美国政府禁运的国家或被美国政府指定为"支持恐怖主义"的国家；且 (ii) 您未被列入任何美国政府禁止或限制名单。





        
          8. 开发者名称与联系方式

          
            本授权应用由 Palette Plotting LLC 提供许可。有关本授权应用的问题、投诉或主张，请发送至：support@paletteplot.com。（如需邮寄地址，请通过上述邮箱联系我们。）





        
          9. 第三方条款

          
            使用本授权应用时，您须遵守适用于您的第三方协议条款（例如，使用本授权应用时不得违反您的移动数据服务协议）。





        
          10. 第三方受益人

          
            您与 Palette Plotting 确认并同意，Apple 及 Apple 的子公司为本 EULA 的第三方受益人；且在您接受本 EULA 条款后，Apple 将有权（并视为已接受该权利）作为本 EULA 的第三方受益人向您主张执行本 EULA。





        
          11. 许可限制

          您不得：

          
            复制、修改或基于本服务创作衍生作品

            对本服务进行逆向工程、反编译或反汇编

            移除所有权声明或标签

            出租、出借、租赁或出售本服务访问权限

            将本服务用于任何非法目的

            干扰或中断本服务或其服务器

          



        
          12. 知识产权

          
            本服务及其全部内容、特性与功能均归 Palette Plotting 所有，并受版权、商标及其他知识产权法律保护。本 EULA 不授予您使用我们商标、标识或其他品牌元素的任何权利。





        
          13. 用户内容

          
            您允许 Palette Plotting 仅在向您的账户提供本授权应用所必需的范围内托管、存储、传输并技术性处理您的内容，具体如上述用户内容章节所述。





        
          14. 终止

          
            本许可自生效起持续有效，直至终止。如您违反本 EULA，我们可在不另行通知的情况下立即终止或暂停您的访问权限。终止后，您使用本服务的权利将立即终止。





        
          15. 保证免责声明

          
            本服务按"现状"及"可用"基础提供，不附带任何形式的明示或默示保证，包括但不限于适销性、特定用途适用性或不侵权的默示保证。





        
          16. 责任限制

          
            在法律允许的最大范围内，PALETTE PLOTTING 对任何间接、附带、特殊、后果性或惩罚性损害，或任何利润或收入损失（无论直接或间接发生）不承担责任。





        
          17. 更新与修改

          
            我们保留随时修改、更新或停止本服务的权利。我们亦可定期更新本 EULA。您在该等变更后继续使用本服务，即构成您对更新后 EULA 的接受。





        
          18. 适用法律

          
            本 EULA 受适用法律管辖并据其解释，但不适用其法律冲突规定。





        
          19. 联系信息

          
            如对本 EULA 有任何疑问，请通过 support@paletteplot.com 与我们联系
```


---

# Section 5 — Privacy Policy (full text per locale)

## Privacy — EN

Route: /privacy

```
Privacy Policy

              Effective Date: Jan 13, 2025

              Company: Palette Plotting LLC

                  This Privacy Policy explains how Palette Plotting collects, uses, and protects your information.

                  By using the Service, you agree to this Policy.

                1. Information We Collect

                Information you provide voluntarily

                  email and basic account details

                  journal entries, affirmations, notes

                  audio created or uploaded

                  selections, preferences, and settings

                  optional marketing communication opt-in information

                Information collected automatically

                  device and browser type

                  usage patterns and interaction data

                  general location (approximate IP-based)

                  performance and diagnostics

                  Palette Plotting does not require sensitive identifiers such as government IDs or financial account numbers.

                2. How We Use Your Information

                  We use information to:

                  operate and improve the Service

                  personalize your experience

                  generate system responses or suggestions

                  maintain platform integrity and security

                  comply with legal obligations

                  communicate with you about your account, marketing (if opted in), or updates

                  We do not sell your personal information.

                3. How Content Is Processed

                  System-generated features may require processing your input (such as text or audio) to provide suggestions, outputs, or formatted content. Processing is limited to supporting Service functionality.

                  Your private entries (journals, affirmations, notes) are not visible to other users unless you choose to share them.

                4. How Information Is Shared

                  We may share information with:

                  infrastructure providers (cloud hosting, analytics)

                  communication providers

                  vendors that support Service functionality

                  legal authorities when required by law

                  We do not sell or rent personal content or personal information.

                5. Data Security

                  We implement reasonable administrative, technical, and physical safeguards to protect your information.

                  No method of electronic storage or transmission is completely secure.

                6. Your Controls & Choices

                  You may:

                  update account details

                  delete journals or entries

                  request deletion of your account

                  adjust privacy or notification settings

                7. Data Retention

                  We retain information only as long as reasonably necessary to operate the Service or comply with legal requirements.

                  When you delete your account, we delete or anonymize associated data subject to necessary retention periods.

                8. Children's Privacy

                  The Service is intended for adults 18 and older.

                  We do not knowingly collect information from minors.

                9. International Users

                  Data may be processed in the United States regardless of user location.

                10. Policy Updates

                  We may update this Privacy Policy from time to time.

                  Continued use of the Service indicates acceptance of the updated Policy.

                11. Contact

                  For questions about this Policy:

                  support@paletteplot.com
```

## Privacy — ES

Route: /privacy/ES

```
Política de privacidad

      
        Fecha de vigencia: 13 de enero de 2025

        Empresa: Palette Plotting LLC



      
        
          
            Esta Política de privacidad explica cómo Palette Plotting recopila, usa y protege tu información.


          
            Al usar el Servicio, aceptas esta Política.





        
          1. Información que recopilamos

          Información que proporcionas voluntariamente

          
            correo electrónico y datos básicos de la cuenta

            entradas de diario, afirmaciones y notas

            audio creado o subido

            selecciones, preferencias y configuración

            información opcional de suscripción a comunicaciones de marketing

          
          Información recopilada automáticamente

          
            tipo de dispositivo y navegador

            patrones de uso e datos de interacción

            ubicación general (aproximada, basada en IP)

            rendimiento y diagnósticos

          
          
            Palette Plotting no requiere identificadores sensibles como documentos de identidad o números de cuentas financieras.





        
          2. Cómo usamos tu información

          Usamos la información para:

          
            operar y mejorar el Servicio

            personalizar tu experiencia

            generar respuestas o sugerencias del sistema

            mantener la integridad y seguridad de la plataforma

            cumplir obligaciones legales

            comunicarnos contigo sobre tu cuenta, marketing (si aceptaste) o actualizaciones

          
          No vendemos tu información personal.




        
          3. Cómo se procesa el contenido

          
            Las funciones generadas por el sistema pueden requerir procesar tu entrada (como texto o audio) para ofrecer sugerencias, resultados o contenido formateado. El procesamiento se limita a respaldar la funcionalidad del Servicio.


          
            Tus entradas privadas (diarios, afirmaciones, notas) no son visibles para otros usuarios a menos que elijas compartirlas.





        
          4. Cómo se comparte la información

          Podemos compartir información con:

          
            proveedores de infraestructura (hosting en la nube, analítica)

            proveedores de comunicación

            proveedores que respaldan la funcionalidad del Servicio

            autoridades legales cuando la ley lo exige

          
          
            No vendemos ni rentamos contenido personal ni información personal.





        
          5. Seguridad de los datos

          
            Implementamos medidas administrativas, técnicas y físicas razonables para proteger tu información.


          
            Ningún método de almacenamiento o transmisión electrónica es completamente seguro.





        
          6. Tus controles y opciones

          Puedes:

          
            actualizar los datos de tu cuenta

            eliminar diarios o entradas

            solicitar la eliminación de tu cuenta

            ajustar la configuración de privacidad o notificaciones

          



        
          7. Retención de datos

          
            Retenemos la información solo el tiempo razonablemente necesario para operar el Servicio o cumplir requisitos legales.


          
            Cuando eliminas tu cuenta, borramos o anonimizamos los datos asociados sujetos a los períodos de retención necesarios.





        
          8. Privacidad de menores

          El Servicio está destinado a adultos de 18 años o más.

          No recopilamos información de menores de edad a sabiendas.




        
          9. Usuarios internacionales

          
            Los datos pueden procesarse en Estados Unidos sin importar la ubicación del usuario.





        
          10. Actualizaciones de la Política

          Podemos actualizar esta Política de privacidad periódicamente.

          
            El uso continuado del Servicio indica la aceptación de la Política actualizada.





        
          11. Contacto

          Para preguntas sobre esta Política:

          support@paletteplot.com
```

## Privacy — PT

Route: /privacy/PT

```
Política de privacidade

      
        Data de vigência: 13 de janeiro de 2025

        Empresa: Palette Plotting LLC



      
        
          
            Esta Política de privacidade explica como Palette Plotting coleta, usa e protege suas informações.


          Ao usar o Serviço, você aceita esta Política.




        
          1. Informações que coletamos

          Informações que você fornece voluntariamente

          
            e-mail e dados básicos da conta

            entradas de diário, afirmações e notas

            áudio criado ou enviado

            seleções, preferências e configurações

            informações opcionais de opt-in para comunicações de marketing

          
          Informações coletadas automaticamente

          
            tipo de dispositivo e navegador

            padrões de uso e dados de interação

            localização geral (aproximada, baseada em IP)

            desempenho e diagnósticos

          
          
            Palette Plotting não exige identificadores sensíveis como documentos de identidade ou números de contas financeiras.





        
          2. Como usamos suas informações

          Usamos as informações para:

          
            operar e melhorar o Serviço

            personalizar sua experiência

            gerar respostas ou sugestões do sistema

            manter a integridade e segurança da plataforma

            cumprir obrigações legais

            comunicar com você sobre sua conta, marketing (se você aceitou) ou atualizações

          
          Não vendemos suas informações pessoais.




        
          3. Como o conteúdo é processado

          
            Recursos gerados pelo sistema podem exigir o processamento da sua entrada (como texto ou áudio) para fornecer sugestões, resultados ou conteúdo formatado. O processamento é limitado ao suporte à funcionalidade do Serviço.


          
            Suas entradas privadas (diários, afirmações, notas) não são visíveis para outros usuários, a menos que você escolha compartilhar.





        
          4. Como as informações são compartilhadas

          Podemos compartilhar informações com:

          
            provedores de infraestrutura (hospedagem em nuvem, análise)

            provedores de comunicação

            fornecedores que suportam a funcionalidade do Serviço

            autoridades legais quando exigido por lei

          
          
            Não vendemos nem alugamos conteúdo pessoal ou informações pessoais.





        
          5. Segurança dos dados

          
            Implementamos medidas administrativas, técnicas e físicas razoáveis para proteger suas informações.


          
            Nenhum método de armazenamento ou transmissão eletrônica é completamente seguro.





        
          6. Seus controles e escolhas

          Você pode:

          
            atualizar os dados da conta

            excluir diários ou entradas

            solicitar a exclusão da sua conta

            ajustar configurações de privacidade ou notificações

          



        
          7. Retenção de dados

          
            Retemos informações apenas pelo tempo razoavelmente necessário para operar o Serviço ou cumprir requisitos legais.


          
            Quando você exclui sua conta, eliminamos ou anonimizamos os dados associados, sujeitos aos períodos de retenção necessários.





        
          8. Privacidade de menores

          O Serviço é destinado a adultos com 18 anos ou mais.

          Não coletamos informações de menores de idade conscientemente.




        
          9. Usuários internacionais

          
            Os dados podem ser processados nos Estados Unidos, independentemente da localização do usuário.





        
          10. Atualizações da Política

          Podemos atualizar esta Política de privacidade periodicamente.

          
            O uso continuado do Serviço indica a aceitação da Política atualizada.





        
          11. Contato

          Para perguntas sobre esta Política:

          support@paletteplot.com
```

## Privacy — DE

Route: /privacy/DE

```
Datenschutzerklarung

      
        Effective date: Jan 13, 2025

        Company: Palette Plotting LLC



      
        
          
            Diese Datenschutzerklarung erlautert, wie Palette Plotting deine Informationen erhebt, verwendet und schutzt.


          
            Durch die Nutzung des Dienstes stimmst du dieser Richtlinie zu.





        
          1. Welche Informationen wir erfassen

          Informationen, die du freiwillig bereitstellst

          
            E-Mail-Adresse und grundlegende Kontodaten

            Tagebucheintrage, Affirmationen und Notizen

            erstellte oder hochgeladene Audiodateien

            Auswahlen, Einstellungen und Praferenzen

            optionale Angaben fur Marketing-Kommunikation

          
          Automatisch erfasste Informationen

          
            Gerate- und Browsertyp

            Nutzungsmuster und Interaktionsdaten

            allgemeiner Standort (annahernd uber IP)

            Leistungs- und Diagnosedaten

          
          
            Palette Plotting verlangt keine sensiblen Kennungen wie Ausweisdokumente oder Finanzkontonummern.





        
          2. Wie wir deine Informationen nutzen

          Wir nutzen Informationen, um:

          
            den Dienst zu betreiben und zu verbessern

            dein Erlebnis zu personalisieren

            Systemantworten oder Vorschlage zu erzeugen

            Integritat und Sicherheit der Plattform zu erhalten

            gesetzliche Pflichten zu erfullen

            mit dir uber dein Konto, Marketing (falls du zugestimmt hast) oder Updates zu kommunizieren

          
          Wir verkaufen deine personenbezogenen Daten nicht.




        
          3. Wie Inhalte verarbeitet werden

          
            Systemgenerierte Funktionen konnen die Verarbeitung deiner Eingaben (wie Text oder Audio) erfordern, um Vorschlage, Ergebnisse oder formatierte Inhalte bereitzustellen. Die Verarbeitung ist auf die Unterstutzung der Dienstfunktionalitat beschrankt.


          
            Deine privaten Eingaben (Tagebucher, Affirmationen, Notizen) sind fur andere Nutzer nicht sichtbar, sofern du sie nicht aktiv teilst.





        
          4. Wie Informationen weitergegeben werden

          Wir konnen Informationen teilen mit:

          
            Infrastruktur-Anbietern (Cloud-Hosting, Analytik)

            Kommunikationsdienstleistern

            Anbietern, die die Dienstfunktionalitat unterstutzen

            Behorden, wenn dies gesetzlich vorgeschrieben ist

          
          
            Wir verkaufen oder vermieten keine personlichen Inhalte oder personenbezogenen Daten.





        
          5. Datensicherheit

          
            Wir setzen angemessene administrative, technische und physische Massnahmen ein, um deine Informationen zu schutzen.


          
            Keine Methode der elektronischen Speicherung oder Ubertragung ist vollstandig sicher.





        
          6. Deine Kontrollen und Wahlmoglichkeiten

          Du kannst:

          
            deine Kontodaten aktualisieren

            Tagebucher oder Eintrage loschen

            die Loschung deines Kontos anfragen

            Datenschutz- oder Benachrichtigungseinstellungen anpassen

          



        
          7. Datenaufbewahrung

          
            Wir speichern Informationen nur so lange, wie es vernuftigerweise erforderlich ist, um den Dienst zu betreiben oder gesetzliche Anforderungen zu erfullen.


          
            Wenn du dein Konto loschst, loschen oder anonymisieren wir zugeordnete Daten vorbehaltlich erforderlicher Aufbewahrungsfristen.





        
          8. Datenschutz von Minderjahrigen

          Der Dienst richtet sich an Erwachsene ab 18 Jahren.

          Wir erfassen wissentlich keine Informationen von Minderjahrigen.




        
          9. Internationale Nutzer

          
            Daten konnen unabhangig vom Standort des Nutzers in den Vereinigten Staaten verarbeitet werden.





        
          10. Aktualisierungen dieser Richtlinie

          Wir konnen diese Datenschutzerklarung regelmassig aktualisieren.

          
            Die fortgesetzte Nutzung des Dienstes zeigt die Zustimmung zur aktualisierten Richtlinie.





        
          11. Kontakt

          Bei Fragen zu dieser Richtlinie:

          support@paletteplot.com
```

## Privacy — FR

Route: /privacy/FR

```
Politique de confidentialite

      
        Effective date: Jan 13, 2025

        Company: Palette Plotting LLC



      
        
          
            Cette Politique de confidentialite explique comment Palette Plotting collecte, utilise et protege vos informations.


          
            En utilisant le Service, vous acceptez cette Politique.





        
          1. Informations que nous collectons

          Informations que vous fournissez volontairement

          
            e-mail et informations de base du compte

            entrees de journal, affirmations et notes

            audio cree ou televerse

            choix, preferences et parametres

            informations optionnelles d&apos;inscription aux communications marketing

          
          Informations collectees automatiquement

          
            type d&apos;appareil et de navigateur

            modeles d&apos;utilisation et donnees d&apos;interaction

            localisation generale (approximative, basee sur l&apos;IP)

            performances et diagnostics

          
          
            Palette Plotting n&apos;exige pas d&apos;identifiants sensibles tels que des pieces d&apos;identite ou des numeros de comptes financiers.





        
          2. Comment nous utilisons vos informations

          Nous utilisons les informations pour:

          
            exploiter et ameliorer le Service

            personnaliser votre experience

            generer des reponses ou suggestions du systeme

            maintenir l&apos;integrite et la securite de la plateforme

            respecter les obligations legales

            communiquer avec vous au sujet de votre compte, du marketing (si vous avez accepte) ou des mises a jour

          
          Nous ne vendons pas vos informations personnelles.




        
          3. Comment le contenu est traite

          
            Les fonctionnalites generees par le systeme peuvent necessiter le traitement de vos donnees d&apos;entree (comme du texte ou de l&apos;audio) afin de fournir des suggestions, resultats ou contenus formates. Le traitement est limite au soutien de la fonctionnalite du Service.


          
            Vos donnees privees (journaux, affirmations, notes) ne sont pas visibles des autres utilisateurs sauf si vous choisissez de les partager.





        
          4. Comment les informations sont partagees

          Nous pouvons partager des informations avec:

          
            des fournisseurs d&apos;infrastructure (hebergement cloud, analytique)

            des fournisseurs de communication

            des fournisseurs soutenant la fonctionnalite du Service

            des autorites legales lorsque la loi l&apos;exige

          
          
            Nous ne vendons ni ne louons de contenu personnel ou d&apos;informations personnelles.





        
          5. Securite des donnees

          
            Nous mettons en oeuvre des mesures administratives, techniques et physiques raisonnables pour proteger vos informations.


          
            Aucune methode de stockage ou de transmission electronique n&apos;est totalement securisee.





        
          6. Vos controles et choix

          Vous pouvez:

          
            mettre a jour les donnees de votre compte

            supprimer des journaux ou des entrees

            demander la suppression de votre compte

            ajuster les parametres de confidentialite ou de notifications

          



        
          7. Conservation des donnees

          
            Nous conservons les informations uniquement pendant la duree raisonnablement necessaire a l&apos;exploitation du Service ou au respect d&apos;obligations legales.


          
            Lorsque vous supprimez votre compte, nous supprimons ou anonymisons les donnees associees, sous reserve des periodes de conservation necessaires.





        
          8. Confidentialite des mineurs

          Le Service est destine aux adultes de 18 ans ou plus.

          Nous ne collectons pas sciemment d&apos;informations concernant des mineurs.




        
          9. Utilisateurs internationaux

          
            Les donnees peuvent etre traitees aux Etats-Unis, quel que soit l&apos;emplacement de l&apos;utilisateur.





        
          10. Mises a jour de la Politique

          Nous pouvons mettre a jour cette Politique de confidentialite periodiquement.

          
            L&apos;utilisation continue du Service indique l&apos;acceptation de la Politique mise a jour.





        
          11. Contact

          Pour toute question au sujet de cette Politique:

          support@paletteplot.com
```

## Privacy — IT

Route: /privacy/IT

```
Informativa sulla privacy

      
        Data di entrata in vigore: 13 gennaio 2025

        Azienda: Palette Plotting LLC



      
        
          
            La presente Informativa sulla privacy spiega come Palette Plotting raccoglie, utilizza e protegge le tue informazioni.


          
            Utilizzando il Servizio, accetti la presente Informativa.





        
          1. Informazioni che raccogliamo

          Informazioni fornite volontariamente

          
            email e dati di base dell&apos;account

            voci di diario, affermazioni e note

            audio creato o caricato

            selezioni, preferenze e impostazioni

            informazioni facoltative per l&apos;iscrizione a comunicazioni di marketing

          
          Informazioni raccolte automaticamente

          
            tipo di dispositivo e browser

            modelli di utilizzo e dati di interazione

            posizione generale (approssimativa, basata su IP)

            prestazioni e diagnostica

          
          
            Palette Plotting non richiede identificatori sensibili come documenti di identita o numeri di conto finanziario.





        
          2. Come utilizziamo le tue informazioni

          Utilizziamo le informazioni per:

          
            gestire e migliorare il Servizio

            personalizzare la tua esperienza

            generare risposte o suggerimenti del sistema

            mantenere l&apos;integrita e la sicurezza della piattaforma

            adempiere agli obblighi legali

            comunicare con te riguardo al tuo account, al marketing (se hai aderito) o agli aggiornamenti

          
          Non vendiamo le tue informazioni personali.




        
          3. Come vengono trattati i contenuti

          
            Le funzionalita generate dal sistema possono richiedere l&apos;elaborazione dei tuoi input (come testo o audio) per fornire suggerimenti, risultati o contenuti formattati. L&apos;elaborazione e limitata al supporto della funzionalita del Servizio.


          
            I tuoi input privati (diari, affermazioni, note) non sono visibili ad altri utenti salvo tua scelta di condividerli.





        
          4. Come vengono condivise le informazioni

          Possiamo condividere informazioni con:

          
            fornitori di infrastruttura (hosting cloud, analisi)

            fornitori di comunicazione

            fornitori che supportano la funzionalita del Servizio

            autorita legali quando richiesto dalla legge

          
          
            Non vendiamo ne affittiamo contenuti personali o informazioni personali.





        
          5. Sicurezza dei dati

          
            Implementiamo misure amministrative, tecniche e fisiche ragionevoli per proteggere le tue informazioni.


          
            Nessun metodo di archiviazione o trasmissione elettronica e completamente sicuro.





        
          6. I tuoi controlli e le tue scelte

          Puoi:

          
            aggiornare i dati del tuo account

            eliminare diari o voci

            richiedere l&apos;eliminazione del tuo account

            regolare impostazioni di privacy o notifiche

          



        
          7. Conservazione dei dati

          
            Conserviamo le informazioni solo per il tempo ragionevolmente necessario a gestire il Servizio o soddisfare i requisiti legali.


          
            Quando elimini il tuo account, cancelliamo o anonimizzamo i dati associati nel rispetto dei periodi di conservazione necessari.





        
          8. Privacy dei minori

          Il Servizio e destinato ad adulti di almeno 18 anni.

          Non raccogliamo consapevolmente informazioni di minori.




        
          9. Utenti internazionali

          
            I dati possono essere trattati negli Stati Uniti indipendentemente dalla posizione dell&apos;utente.





        
          10. Aggiornamenti dell&apos;Informativa

          Possiamo aggiornare periodicamente la presente Informativa sulla privacy.

          
            L&apos;uso continuato del Servizio indica l&apos;accettazione dell&apos;Informativa aggiornata.





        
          11. Contatti

          Per domande sulla presente Informativa:

          support@paletteplot.com
```

## Privacy — NL

Route: /privacy/NL

```
Privacybeleid

      
        Ingangsdatum: 13 januari 2025

        Bedrijf: Palette Plotting LLC



      
        
          
            Dit Privacybeleid legt uit hoe Palette Plotting jouw informatie verzamelt, gebruikt en beschermt.


          
            Door de Dienst te gebruiken, ga je akkoord met dit Beleid.





        
          1. Informatie die we verzamelen

          Informatie die je vrijwillig verstrekt

          
            e-mail en basisaccountgegevens

            dagboekitems, affirmaties en notities

            gemaakte of geuploade audio

            keuzes, voorkeuren en instellingen

            optionele informatie voor aanmelding op marketingcommunicatie

          
          Automatisch verzamelde informatie

          
            type apparaat en browser

            gebruikspatronen en interactiegegevens

            algemene locatie (bij benadering, op basis van IP)

            prestaties en diagnostiek

          
          
            Palette Plotting vereist geen gevoelige identificatiegegevens zoals identiteitsdocumenten of rekeningnummers.





        
          2. Hoe we jouw informatie gebruiken

          We gebruiken informatie om:

          
            de Dienst te beheren en te verbeteren

            jouw ervaring te personaliseren

            systeemreacties of suggesties te genereren

            de integriteit en veiligheid van het platform te behouden

            te voldoen aan wettelijke verplichtingen

            met je te communiceren over je account, marketing (als je toestemming gaf) of updates

          
          Wij verkopen jouw persoonsgegevens niet.




        
          3. Hoe content wordt verwerkt

          
            Door het systeem gegenereerde functies kunnen verwerking van jouw input vereisen (zoals tekst of audio) om suggesties, resultaten of opgemaakte content te leveren. Verwerking is beperkt tot ondersteuning van de functionaliteit van de Dienst.


          
            Jouw prive-inputs (dagboeken, affirmaties, notities) zijn niet zichtbaar voor andere gebruikers tenzij je ervoor kiest ze te delen.





        
          4. Hoe informatie wordt gedeeld

          We kunnen informatie delen met:

          
            infrastructuurproviders (cloudhosting, analytics)

            communicatieproviders

            providers die de functionaliteit van de Dienst ondersteunen

            wettelijke autoriteiten wanneer dit wettelijk vereist is

          
          
            Wij verkopen of verhuren geen persoonlijke content of persoonsgegevens.





        
          5. Gegevensbeveiliging

          
            We implementeren redelijke administratieve, technische en fysieke maatregelen om jouw informatie te beschermen.


          
            Geen enkele methode van elektronische opslag of transmissie is volledig veilig.





        
          6. Jouw controle en keuzes

          Je kunt:

          
            je accountgegevens bijwerken

            dagboeken of items verwijderen

            verwijdering van je account aanvragen

            privacy- of notificatie-instellingen aanpassen

          



        
          7. Gegevensbewaring

          
            We bewaren informatie alleen zolang als redelijkerwijs nodig is om de Dienst te beheren of te voldoen aan wettelijke vereisten.


          
            Wanneer je je account verwijdert, verwijderen of anonimiseren we gekoppelde gegevens met inachtneming van noodzakelijke bewaartermijnen.





        
          8. Privacy van minderjarigen

          De Dienst is bedoeld voor volwassenen van 18 jaar of ouder.

          Wij verzamelen niet bewust informatie van minderjarigen.




        
          9. Internationale gebruikers

          
            Gegevens kunnen in de Verenigde Staten worden verwerkt, ongeacht de locatie van de gebruiker.





        
          10. Updates van dit Beleid

          We kunnen dit Privacybeleid periodiek bijwerken.

          
            Voortgezet gebruik van de Dienst betekent aanvaarding van het bijgewerkte Beleid.





        
          11. Contact

          Voor vragen over dit Beleid:

          support@paletteplot.com
```

## Privacy — ZH

Route: /privacy/ZH

```
隐私政策

      
        生效日期：2025年1月13日

        公司：Palette Plotting LLC



      
        
          
            本隐私政策说明 Palette Plotting 如何收集、使用并保护您的信息。


          
            使用本服务即表示您同意本政策。





        
          1. 我们收集的信息

          您自愿提供的信息

          
            电子邮箱及基础账户信息

            日记条目、肯定语和笔记

            创建或上传的音频

            选择项、偏好和设置

            可选的营销通信订阅信息

          
          自动收集的信息

          
            设备和浏览器类型

            使用模式与交互数据

            大致位置（基于 IP 的近似定位）

            性能与诊断数据

          
          
            Palette Plotting 不要求提供身份证件或金融账户号码等敏感标识信息。





        
          2. 我们如何使用您的信息

          我们将信息用于：

          
            运营并改进本服务

            个性化您的使用体验

            生成系统回复或建议

            维护平台完整性与安全性

            履行法律义务

            就账户、营销（如您同意）或更新事项与您沟通

          
          我们不会出售您的个人信息。




        
          3. 内容如何被处理

          
            系统生成功能可能需要处理您的输入（如文本或音频），以提供建议、结果或格式化内容。该处理仅限于支持服务功能实现所必需的范围。


          
            您的私密输入（如日记、肯定语、笔记）除非由您主动分享，否则不会向其他用户可见。





        
          4. 信息如何共享

          我们可能与以下对象共享信息：

          
            基础设施提供商（如云托管、分析服务）

            通信服务提供商

            支持本服务功能实现的提供商

            法律要求下的主管机关

          
          
            我们不会出售或出租个人内容或个人信息。





        
          5. 数据安全

          
            我们采取合理的管理、技术和物理措施保护您的信息。


          
            任何电子存储或传输方式都无法保证绝对安全。





        
          6. 您的控制与选择

          您可以：

          
            更新账户资料

            删除日记或条目

            请求删除您的账户

            调整隐私或通知设置

          



        
          7. 数据保留

          
            我们仅在为运营本服务或满足法律要求而合理必要的期限内保留信息。


          
            当您删除账户时，我们将在必要保留期限届满后删除或匿名化相关数据。





        
          8. 未成年人隐私

          本服务面向年满 18 周岁的成年人。

          我们不会在明知情况下收集未成年人的信息。




        
          9. 国际用户

          
            无论用户所在地为何，数据均可能在美国进行处理。





        
          10. 政策更新

          我们可能不时更新本隐私政策。

          
            您继续使用本服务即表示接受更新后的政策。





        
          11. 联系方式

          如对本政策有疑问：

          support@paletteplot.com
```


---

# Section 6 — Key counts

- Homepage keys: 122
- What is + feature strip keys: 20
- Quiz keys: 76
- Legal locales: 8 (EN + ES, PT, DE, FR, IT, NL, ZH)
- Website i18n locales: 8

## QA checklist for ChatGPT

1. Every non-EN cell should be a complete, natural translation of the EN reference — not literal word-for-word if it sounds wrong in that market.
2. Manifestation community terms (3D, SP, scripting, Law of Assumption, mirror work, subliminals) should stay recognizable or use established local equivalents.
3. Legal: same section structure as EN; keep Palette Plotting LLC, support@paletteplot.com, Illinois governing law, Apple EULA third-party beneficiary language.
4. Homepage footer terms/privacy links resolve to localized routes when a website language is selected.
5. Flag missing keys (empty cells) or `[object Object]` — there should be none.

Regenerate: `node scripts/generate-website-copy-handoff.mjs`
