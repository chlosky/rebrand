# Handoff: Conditional question copy (en / es-419 / pt-BR)

Updated 2026-06-09 (es-419 / pt-BR native-copy pass approved). Source of truth: `src/i18n/locales/{en,es-419,pt-BR}/onboarding.json` → `setup.conditionalSpecificity`.

**Screen:** `src/pages/onboarding/setup/ConditionalSpecificity.tsx`  
**Branch config:** `src/lib/conditionalSpecificityStep7.ts`  
**Routes:** `/onboarding/setup/conditional-specificity` · `/onboarding/suite/setup/conditional-specificity`

---

## How scenarios branch

After the user picks a focus area on **Desire Category**, this step shows one of **12 conditional flows** (or a fallback if category is missing/invalid).

| Focus area (`desireCategory`) | UI label | Branch |
|-------------------------------|----------|--------|
| `Connections` | Love / SP | **SP person** — yes/no/complicated/prefer-not + optional name |
| `Finances` | Money | Category headline + 5 options |
| `Self-Love` | Beauty / Glow Up | Category headline + 5 options |
| `Confidence` | Self-Concept | Category headline + 4 options |
| `Productivity` | Focus | Category headline + 5 options |
| `Organization` | Life Reset | Category headline + 5 options |
| `Fitness` | Body / Fitness | Category headline + 5 options |
| `Nutrition` | Wellness | Category headline + 5 options |
| `Discipline` | Discipline | Category headline + 5 options |
| `Career` | Career | Category headline + 4 options |
| `Business` | Business | Category headline + 4 options |
| `Learning` | School / Exams | Category headline + 5 options |

**Note:** `customLabel` / `customPlaceholder` are wired in the component for a `Custom` tile, but no category currently exposes that option in `conditionalSpecificityStep7.ts`.

---

## Shared copy (every scenario)

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `subtitle` | We'll use this to shape your guidance in the app. | Usaremos esto para personalizar tu guía en la app. | Vamos usar isso para personalizar sua orientação no app. |
| `fallbackHeadline` | A quick detail | Un detalle rápido | Um detalhe rápido |
| `fallbackMessage` | Go back and pick one of the twelve focus areas to unlock this step. | Regresa y elige un área de enfoque para desbloquear este paso. | Volte e escolha uma área de foco para liberar este passo. |
| `customLabel` | Describe your focus | Describe tu enfoque | Descreva seu foco |
| `customPlaceholder` | e.g., Launching my online business | p. ej., Lanzar mi negocio en línea | ex.: Lançar meu negócio online |

---

## Scenario: Love / SP (`Connections`)

Shown when `desireCategory` is `Connections` (legacy alias: `sp_love`).

### Headline

| en | es-419 | pt-BR |
|----|--------|-------|
| Is there a specific person connected to this desire? | ¿Hay una persona específica conectada con este deseo? | Há uma pessoa específica ligada a esse desejo? |

### Choices

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `yes` | Yes | Sí | Sim |
| `no` | No | No | Não |
| `complicated` | It's complicated | Es complicado | É complicado |
| `prefer_not` | Prefer not to say | Prefiero no decirlo | Prefiro não dizer |

### Name field (shown if **Yes** or **It's complicated**)

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `nameLabel` | What should we call them? | ¿Cómo quieres que le llamemos? | Como você quer que a gente chame essa pessoa? |
| `namePlaceholder` | e.g., Alex | p. ej., Alex | ex.: Alex |

---

## Scenario: Finances (`Finances`)

### Headline

| en | es-419 | pt-BR |
|----|--------|-------|
| What kind of money shift are you calling in? | ¿Qué cambio financiero estás llamando? | Que mudança financeira você quer atrair? |

### Options

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `consistentIncome` | Consistent income | Ingresos constantes | Renda constante |
| `debtFreedom` | Debt freedom | Libertad de deudas | Liberdade das dívidas |
| `moreSales` | More sales | Más ventas | Mais vendas |
| `luxuryEase` | Luxury & ease | Lujo y facilidad | Luxo e leveza |
| `financialSafety` | Financial safety | Seguridad financiera | Segurança financeira |

---

## Scenario: Beauty / Glow Up (`Self-Love`)

### Headline

| en | es-419 | pt-BR |
|----|--------|-------|
| What do you want to feel when you see yourself? | ¿Qué quieres sentir cuando te ves? | O que você quer sentir quando se vê? |

### Options

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `beautiful` | Beautiful | Hermosa | Bonita |
| `desired` | Desired | Deseada | Desejada |
| `radiant` | Radiant | Radiante | Radiante |
| `expensive` | Expensive | Valiosa | Valiosa |
| `seen` | Seen | Vista | Vista |

---

## Scenario: Self-Concept (`Confidence`)

### Headline

| en | es-419 | pt-BR |
|----|--------|-------|
| Which self-concept focus fits best? | ¿Qué enfoque de autoconcepto encaja mejor? | Qual foco de autoconceito combina mais? |

### Options

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `confidence` | Confidence | Confianza | Confiança |
| `visibility` | Visibility | Visibilidad | Visibilidade |
| `selfTrust` | Self-trust | Confianza en mí | Confiança em mim |
| `magnetism` | Magnetism | Magnetismo | Magnetismo |

---

## Scenario: Focus (`Productivity`)

### Headline

| en | es-419 | pt-BR |
|----|--------|-------|
| Where do you want more focus? | ¿Dónde quieres tener más enfoque? | Onde você quer ter mais foco? |

### Options

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `workProjects` | Work projects | Proyectos de trabajo | Projetos de trabalho |
| `studying` | Studying | Estudiar | Estudar |
| `creativeWork` | Creative work | Trabajo creativo | Trabalho criativo |
| `contentCreation` | Content creation | Crear contenido | Criar conteúdo |
| `dailyRoutine` | Daily routine | Rutina diaria | Rotina diária |

---

## Scenario: Life Reset (`Organization`)

### Headline

| en | es-419 | pt-BR |
|----|--------|-------|
| What part of your life are you resetting? | ¿Qué parte de tu vida quieres reiniciar? | Que parte da sua vida você quer reorganizar? |

### Options

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `mySpace` | My space | Mi espacio | Meu espaço |
| `mySchedule` | My schedule | Mi agenda | Minha agenda |
| `myRoutines` | My routines | Mis rutinas | Minhas rotinas |
| `myEnvironment` | My environment | Mi entorno | Meu ambiente |
| `myPriorities` | My priorities | Mis prioridades | Minhas prioridades |

---

## Scenario: Body / Fitness (`Fitness`)

### Headline

| en | es-419 | pt-BR |
|----|--------|-------|
| What body or fitness shift are you calling in? | ¿Qué cambio físico o de fitness estás llamando? | Que mudança no corpo ou no fitness você quer atrair? |

### Options

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `strength` | Strength | Fuerza | Força |
| `shapeTone` | Shape & tone | Forma y tono | Forma e tônus |
| `energy` | Energy | Energía | Energia |
| `confidence` | Confidence | Confianza | Confiança |
| `consistentWorkouts` | Consistent workouts | Entrenos constantes | Treinos constantes |

---

## Scenario: Wellness (`Nutrition`)

### Headline

| en | es-419 | pt-BR |
|----|--------|-------|
| What kind of wellness shift do you want? | ¿Qué cambio de bienestar quieres? | Que mudança de bem-estar você quer? |

### Options

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `moreEnergy` | More energy | Más energía | Mais energia |
| `betterRest` | Better rest | Mejor descanso | Melhor descanso |
| `emotionalEase` | Emotional ease | Calma emocional | Calma emocional |
| `balance` | Balance | Equilibrio | Equilíbrio |
| `softerRoutines` | Softer routines | Rutinas más suaves | Rotinas mais leves |

---

## Scenario: Discipline (`Discipline`)

### Headline

| en | es-419 | pt-BR |
|----|--------|-------|
| What are you building consistency around? | ¿Dónde quieres tener más constancia? | Onde você quer ter mais constância? |

### Options

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `morningRoutine` | Morning routine | Rutina de mañana | Rotina da manhã |
| `fitness` | Fitness | Fitness | Fitness |
| `studying` | Studying | Estudiar | Estudar |
| `work` | Work | Trabajo | Trabalho |
| `selfCare` | Self-care | Autocuidado | Autocuidado |

---

## Scenario: Career (`Career`)

### Headline

| en | es-419 | pt-BR |
|----|--------|-------|
| What career outcome are you calling in? | ¿Qué resultado profesional estás llamando? | Que resultado de carreira você quer atrair? |

### Options

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `newJob` | New job | Nuevo trabajo | Novo emprego |
| `promotion` | Promotion | Ascenso | Promoção |
| `higherPay` | Higher pay | Mejor salario | Salário maior |
| `dreamOpportunity` | Dream opportunity | Oportunidad ideal | Oportunidade ideal |

---

## Scenario: Business (`Business`)

### Headline

| en | es-419 | pt-BR |
|----|--------|-------|
| What business result do you want most? | ¿Qué resultado quieres más en tu negocio? | Que resultado você mais quer no seu negócio? |

### Options

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `moreSales` | More sales | Más ventas | Mais vendas |
| `moreCustomersClients` | More customers/clients | Más clientes | Mais clientes |
| `launchSuccess` | Launch success | Lanzamiento exitoso | Lançamento de sucesso |
| `audienceGrowth` | Audience growth | Crecer tu audiencia | Crescer sua audiência |

---

## Scenario: School / Exams (`Learning`)

### Headline

| en | es-419 | pt-BR |
|----|--------|-------|
| What education outcome are you calling in? | ¿Qué resultado académico estás llamando? | Que resultado nos estudos você quer atrair? |

### Options

| Key | en | es-419 | pt-BR |
|-----|----|--------|-------|
| `betterGrades` | Better grades | Mejores notas | Notas melhores |
| `examSuccess` | Exam success | Éxito en exámenes | Sucesso nas provas |
| `collegeAcceptance` | College acceptance | Aceptación universitaria | Aprovação na faculdade |
| `scholarship` | Scholarship | Beca | Bolsa de estudos |
| `focusStudying` | Focus studying | Foco al estudiar | Foco nos estudos |

---

## Notes for review

- **English is reference.** Propose edits to es-419 and pt-BR unless English itself is wrong.
- **Do not change i18n keys or JSON structure** — copy only.
- **Persisted values** for category options are English canonical strings in `conditionalSpecificityStep7.ts` (e.g. `"Consistent income"`); UI shows localized labels via `labelKey`.
- **SP branch** persists choice keys (`yes`, `no`, `complicated`, `prefer_not`) plus optional free-text name.
- **Product terms to keep:** SP (specific person) where relevant in reviewer notes; option tiles are fully localized.
- Edits go in the three `onboarding.json` files under `setup.conditionalSpecificity`.
