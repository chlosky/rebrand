# Palette Plotting — App tools & structure (support chatbot handoff)

**Purpose:** Give a support agent (human or chatbot) enough product context to answer user questions, triage issues, and help with “Help Me Create” requests. This describes **what exists in the app today**, how tools connect, and where data lives.

**App name:** Palette Plotting (repo: `belief-craft-nexus`)  
**Authenticated area:** `/dashboard/*` (subscription required via `ProtectedRoute`)

---

## 1. How the app is organized

### Home dashboard — `/dashboard`

- Personalized greeting (`profiles.first_name`).
- **Manifestation Charge** meter — daily practice progress (see §8).
- **Inspired Actions** — read-only grid of the user’s 5 active Embody practices; completion is done in **Embody**, not on home.
- **Your tools** — 3×2 grid of main tools (see table below).
- Header shortcuts: **Talk to Guide** (chat), **Appearance** (light/dark), **Profile/Settings**, **Help** → `/dashboard/report-issue`.

### Main tools (dashboard grid)

| Tool | Route | One-line purpose |
|------|--------|------------------|
| Affirm & Script | `/dashboard/affirmations-builder` | Create affirmation sets, attach images, play visualizer |
| Subliminal Maker | `/dashboard/subliminal` | Build custom subliminal audio tracks |
| Mirror Work | `/dashboard/mirror` | Camera mirror session with affirmations |
| Belief Work | `/dashboard/refactor` | AI belief analysis — eliminate or integrate |
| Embody | `/dashboard/double` | Daily inspired-action tracking with guide videos |
| Your Journey | `/dashboard/your-journey` | Charge snapshot, milestones, journal link, chat entry |

### Secondary routes (not on main grid)

| Route | Tool |
|-------|------|
| `/dashboard/affirmation-viewer/:setId` | Affirmation Visualizer v2 (teleprompter) |
| `/dashboard/chrono`, `/dashboard/timeline` | Manifestation Journal |
| `/dashboard/activity-tracking` | Milestones full page (`#review` → Weekly Wins tab) |
| `/dashboard/tap-in`, `/dashboard/freeplay` | Piano Tapping |
| `/dashboard/music-composer` | Subliminal Backgrounds (custom backing audio) |
| `/dashboard/choose-double` | Choose guide character + 5 embody practices |
| `/dashboard/your-journey/chat`, `/dashboard/chat` | Talk to Guide |
| `/dashboard/settings` | Account & settings |
| `/dashboard/settings/manifestation-routine` | Intensity, routine display, notifications |
| `/dashboard/report-issue` | Help / support (what you serve) |
| `/dashboard/get-app` | Mobile app download (web) |

### Navigation

- **Desktop:** collapsible left sidebar (same tools as grid).
- **Mobile:** bottom nav — Home, Affirm & Script, Your Journey, Profile.

### Guide characters (shared across Embody, Chat, categories)

Four guides: **River**, **Sage**, **Rose**, **Oliver**. Stored in `user_preferences.selected_character`. Chosen in onboarding and **Choose Your Guide** (`/dashboard/choose-double`).

---

## 2. Shared data hub — Affirmation sets

**Affirm & Script is the hub.** User-created and premade affirmation sets live in `user_affirmation_sets` and flow into:

- **Mirror Work** — pick set before session
- **Subliminal Maker** — Karaoke and Text-to-Speech vocal steps
- **Piano Tapping** — word-by-word practice
- **Visualizer v2** — teleprompter playback

There are **no direct “Send to Mirror” buttons** in Affirm & Script; users pick the same sets inside each tool.

### Premade sets (cannot delete)

Examples: Wealth & Abundance, Love & Relationships, Confidence & Self-Worth, Health & Wellness, Career & Success (and more in `PREMADE_SETS`).

### User sets — limits & fields

- Set name max **50** characters.
- Each affirmation line max **150** characters.
- Optional **category** (12 support categories: Love/SP, Money, Self-Concept, etc.).
- Optional **images** — up to one image per affirmation line from the in-app image library (`/affirmationimagelibrary/`).
- **AI affirmations** — edge function `generate-affirmations`; weekly cap from tier (`get_weekly_ai_affirmation_count` RPC).
- Custom set count cap: **30** sets (subscribed tier).

---

## 3. Affirm & Script — `/dashboard/affirmations-builder`

### What users do here

1. Browse premade sets or create/edit their own.
2. Add lines manually or generate with AI.
3. Attach vision images per line (category-filtered library).
4. Tap **Play** on a set → opens Visualizer v2.

### Visualizer v2 — `/dashboard/affirmation-viewer/:setId`

Teleprompter-style session (only v2 is linked from the app; v1 is legacy).

**Experience**

- Full-screen **typewriter** text reveal with autoscroll (`OnboardingTypewriter` style).
- **Background images** from the set (or demo rotation if none); crossfade ~45% opacity.
- **Start** / **Reset** controls.

**Settings** (saved per user in `localStorage` key `affirmation-visualizer-v2:settings:{userId}`)

| Setting | Behavior |
|---------|----------|
| Autoplay images | Rotate backgrounds on a timer |
| Loop text | Auto-restart script when finished |
| Loop counter | Show session loop count (loops since Start) |
| Image rhythm | 0.5–14 seconds between image changes |
| Speed of scripting | 8–100 ms per character (typewriter speed) |

**Manifestation Charge note:** Charge checkpoint `affirm_visualize` fires when user taps **Play** in Affirm & Script (before navigating to v2). **Start inside v2 alone does not add charge.**

---

## 4. Subliminal Maker — `/dashboard/subliminal`

Creates private subliminal audio tracks mixed server-side, stored in `subliminal_tracks` + storage bucket `subliminal-tracks`.

### Track list

- Play / pause saved tracks.
- Delete tracks.
- **Manifestation Charge:** `subliminal_listen` when user **starts playback** of a finished track.

### Create menu (especially on mobile)

From **Create**:

1. **Subliminal Track** — main 3-step builder
2. **Subliminal Backgrounds** → `/dashboard/music-composer`
3. **Piano Tapping** → `/dashboard/tap-in`

### Step 1 — Vocal base

- **Track name** (max 60 characters).
- **Freestyle** — record with mic; waveform + timer.
- **Karaoke** — select affirmation set; lines shown on screen while recording.
- **Text-to-Speech** — select set → **Generate Audio** (edge `generate-affirmation-audio`, voice `nova`); **480 character** total limit; tier gate `text_to_speech`.

Must have name + audio blob before continuing.

### Step 2 — Binaural beats

| Value | Label | Typical use (in-app copy) |
|-------|--------|---------------------------|
| `none` | No binaural beat | Affirmations + background only |
| `delta` | Delta (0.5–4 Hz) | Deep sleep, healing |
| `theta` | Theta (4–8 Hz) | Meditation, deep relaxation (recommended copy) |
| `alpha` | Alpha (8–13 Hz) | Relaxation, learning |
| `beta` | Beta (13–30 Hz) | Focus, alertness |
| `gamma` | Gamma (30–100 Hz) | Peak awareness |

### Step 3 — Subliminal settings

| Control | Range / notes |
|---------|----------------|
| Affirmation volume | 0–100% slider (playback uses reduced gain in mix) |
| Binaural volume | Shown when beat ≠ none |
| Background volume | ~30–100% |
| Background sound | Built-ins: City Corner, Fireplace, Gold Coins, Nature Park, Ocean, Rain + **custom** tracks from `user_background_tracks` |
| Affirmation layers | **1–7** (UI recommends 3–5) — loops vocal in the mix for intensity |
| Track length | **1–15 minutes** (capped by tier `maxAudioLengthMinutes`) |

**Create Track** runs server-side audio generation; progress UI while generating.

### Tier limits (subscribed monthly/annual)

- **10** generations per week
- **3000 MB** storage
- **15** min max track length

---

## 5. Subliminal Backgrounds — `/dashboard/music-composer`

- Record or compose custom backing audio for subliminals.
- Saves to `user_background_tracks`.
- Appears in Subliminal step 3 background picker as user tracks.
- Linked from Subliminal **Create → Subliminal Backgrounds**.

---

## 6. Piano Tapping — `/dashboard/tap-in`

Also labeled **Tap-in / Piano** in support tool picker.

- Select affirmation set (premade + user).
- On-screen **piano keyboard**; synthesized notes.
- **Word-by-word highlight** through affirmation lines as user taps keys.
- **Color feedback** toggle — gradient background + sparkles synced to rhythm.
- iPhone hint: turn off Silent Mode if no sound.
- **Does not** count toward Manifestation Charge.
- Reachable from Subliminal Create menu (hidden from main dashboard grid by design).

---

## 7. Mirror Work — `/dashboard/mirror`

Platform routing: Android native, iOS native, or **web** (`MirrorRehearsalWeb`).

### Pre-session settings (web; similar on native)

- **Affirmation set** — premade + user sets.
- **Scenes** (tier `scenes`): None, Hearts, Coins, Nature Park, Rain, Summit — overlay animations/audio on camera feed.
- **Feedback** — confidence meter (tier `confidence_meter_feedback`).
- **Display speed:** 0.5×, 1×, 1.5×, 2× — how fast affirmations rotate.

### Session

- Front camera, mirrored preview, body-segmentation mask.
- Affirmations cycle at chosen speed.
- **Stop** ends session.
- **Manifestation Charge:** `mirror_work` on qualifying session completion.

---

## 8. Belief Work — `/dashboard/refactor`

### Two modes

| Mode | Purpose | Tier gate |
|------|---------|-----------|
| **Eliminate** | Break down limiting beliefs; refute assumptions MECE-style | `belief_elimination` (premium) |
| **Integrate** | Build expansionary beliefs in conceivable chunks | `belief_integration` (plus+) |

### Flow

1. Optional title (max 20 chars) + belief text.
2. **Analyze** — content moderation, then `refactor-belief` edge function.
3. Weekly limit: **10** analyses/week (`get_weekly_belief_refactor_count`); resets Monday.
4. **Visualization** — hierarchical assumptions tree.
5. **Save** → `belief_refactor_entries`.
6. **Export PNG** — diagram download/share (native: Capacitor Filesystem + Share).
7. **Saved list** — reopening a saved entry records **`belief_view`** for Manifestation Charge.

---

## 9. Embody — `/dashboard/double`

Daily **inspired action** tracking with guide character videos.

### The 10 practices (user picks exactly **5** active)

| Key | Label | Confirmation question (summary) |
|-----|-------|--------------------------------|
| `rest` | Rest | Did you rest? |
| `self-care` | Care | Self-care today? |
| `clean` | Clean | Clean a space? |
| `drink-water` | Water | Drink water? |
| `have-fun` | Fun | Something fun? |
| `exercise` | Move | Exercise? |
| `glam-up` | Glam Up | Glam up / celebrate beauty? |
| `connect` | Connect | Connect with people, nature, or animals? |
| `seen` | Seen | Practice being seen? |
| `work` | Work | Career or academic progress? |

Stored in `user_preferences.embody_active_practices` (exactly 5 slugs).

### Session flow

- Tap a practice button → guide video clip → confirm completion.
- Writes **today’s** completion to `user_double_progress` (`completed_actions[]`, `progress_date`) and history `user_double_action_history`.

### Header links

- **Activity chart** → `/dashboard/activity-tracking`
- **Settings** → `/dashboard/choose-double` (change character or 5 practices)

### Important distinction

**Inspired Actions ≠ Manifestation Charge.** Embody completions show on Dashboard / Your Journey but do **not** add charge checkpoints.

---

## 10. Your Journey — `/dashboard/your-journey`

Hub for progress, journal entry, and chat shortcut.

### Daily Snapshot

- Same **Manifestation Charge** meter as home.
- **Inspired Actions** grid (read-only from Embody).

### Your Progress — three tabs (`ManifestationMilestonesTabs`)

| Tab | Data source | What it shows |
|-----|-------------|---------------|
| **Inspired Actions** | `user_double_action_history` | Week heatmap of completed practices |
| **Desires** | `weekly_goals` | User’s weekly desire list by category; mark complete; week navigation |
| **Weekly Wins** | Goals + action history | Review stats — desires set/attained, actions completed, category breakdown |

### Journal button

→ **Manifestation Journal** `/dashboard/chrono`

### Talk to Guide

Header / links → `/dashboard/your-journey/chat`

---

## 11. Manifestation Journal — `/dashboard/chrono`

Timeline of `chrono_entries`.

### New / edit entry fields

- Title (optional)
- Date picker
- Body text
- Two mood questions (3-face scale each): `negative` | `neutral` | `positive`
  - **Environment / 3D rating** (`journal_env_3d_rating`)
  - **Day experience** (`journal_day_experience_rating`)
- Multiple entries per calendar day allowed.

Legacy/extra columns may exist on rows (location, AI fields) but core UX is title + text + moods.

---

## 12. Talk to Guide — `/dashboard/your-journey/chat`

- Chat with selected guide character (River, Sage, Rose, Oliver).
- Thread in `character_messages` (`message_type: 'chat'`); loads ~200 recent messages.
- Send → edge **`handle-chat-message`**.
- **Daily message limit:** **20**/day for subscribed monthly/annual (`user_message_limits.chat_count` vs tier `chatDaily`).
- Limit errors may appear as **system messages** in the thread.
- Requires character selected (`/dashboard/choose-double` if missing).

---

## 13. Manifestation Charge system

Shown on **Dashboard** and **Your Journey**.

### How it works

- Each qualifying action inserts a row in `manifestation_power_daily_signals` for **today** (user’s device local calendar date in `signal_date`).
- **Repeats count** — multiple actions same day stack (not deduped by kind).
- **Target** from `manifestation_intensity`:

| Intensity | Checkpoints needed for “Locked In” |
|-----------|--------------------------------------|
| `light` | 1 |
| `consistent` (default) | 2 |
| `locked_in` | 3 |

### Status labels

- **Needs Persistence** — 0 checkpoints today
- **Aligned** — at least 1 but below target
- **Locked In** — at or above target

### Qualifying actions only

| Signal kind | User action |
|-------------|-------------|
| `affirm_visualize` | Tap **Play** on a set in Affirm & Script |
| `mirror_work` | Complete a Mirror Work session |
| `subliminal_listen` | Start playback of a saved subliminal track |
| `belief_view` | Open a saved Belief Work entry from the list |

**Not charge:** Embody inspired actions, Piano Tapping, journal entries, chat, merely opening tools without the actions above.

---

## 14. Manifestation routine settings — `/dashboard/settings/manifestation-routine`

Linked from Settings → **Manifestation routine**.

### Manifestation intensity

**Light / Consistent / Locked In** — updates `manifestation_intensity` on `user_preferences` + `profiles`; also adjusts charge target (§13).

### Routine items (informational list)

Built at onboarding from tool preferences; stored as `manifest_routine_items` JSON array. Each item: `slug`, `label`, `cadence`, `target_per_week`.

Possible slugs:

| Slug | Label (typical) |
|------|-----------------|
| `affirmations` | Affirmations |
| `subliminals` | Subliminal listening |
| `mirror_work` | Mirror work |
| `belief_work` | Belief work |
| `guide_check_in` | Guide check-in |
| `progress_review` | Progress review |

Weekly targets scale up with **Locked In** intensity. Changing intensity in settings recalculates targets.

### Notifications (native)

- **Routine notifications** toggle.
- Uses **OneSignal** push permission on iOS/Android.
- Syncs tags: `manifestation_intensity`, `notifications_enabled`, `notification_permission_status`.
- Fields: `app_notifications_enabled`, `notification_permission_status` (`granted` / `denied` / `skipped`).

---

## 15. Settings — `/dashboard/settings`

Account email, subscription/billing entry, appearance, link to **Manifestation routine**, training opt-in copy, logout, etc.

---

## 16. Help & support — `/dashboard/report-issue` (your channel)

This is the feature **you are serving**. Three tabs:

### Tab 1 — Create (“Help me create”)

For users who want coaching on building their practice.

| Field | Rules |
|-------|--------|
| Manifesting focus | Free text, max **1000** chars — what they’re working toward |
| Help type | One of: Affirmations or scripting · Make a strong subliminal · Mirror work guidance · Build a weekly routine · Not sure — help me choose |

Submits with `message_type: help_me_create`, `submission_type: help_me_create`.

### Tab 2 — Support (issues & feedback)

| Field | Rules |
|-------|--------|
| Submission type | Report an issue · Flag AI-generated content · Feature request |
| Tool / area | Picker — dashboard tools + visualizer, chat, piano, journal, activity tracking, settings, billing, other |
| Description | Min **10** chars |
| Attachments | Up to **3** images, **5 MB** each → storage `support-reports` |
| Billing extra | If tool = billing → purchase channel: Apple App Store / Google Play / Web |

Edge function: `submit-app-support-report`.

### Tab 3 — Inbox

- User’s cases from `support_cases`.
- Thread replies via `inbox_messages` / `inbox_threads` when `thread_id` exists.
- Mark read (`user_unread`).

### Tool picker values (for triage)

Dashboard home, Affirm & Script, Subliminal Maker, Mirror Work, Belief Work, Embody, Your Journey, Affirmation Visualizer, Talk to Guide, Music Composer, Tap-in / Piano, Activity tracking, Manifestation journal, Settings, Billing, Other.

---

## 17. Feature connection map

```
user_affirmation_sets (hub)
    ├── Affirm & Script → Visualizer v2
    ├── Mirror Work (set picker)
    ├── Subliminal Maker (Karaoke / TTS)
    └── Piano Tapping

manifestation_intensity → Manifestation Charge target
embody_active_practices (5) → Embody UI → Inspired Actions display
user_double_progress → today's inspired completions
manifestation_power_daily_signals → Manifestation Charge meter

weekly_goals → Desires tab → Weekly Wins tab
chrono_entries → Manifestation Journal

selected_character → Embody videos + Talk to Guide
character_messages → chat history
support_cases → Help inbox (you)
```

---

## 18. Subscription & common blockers

Active subscription required for dashboard (`user_plans` + session cache).

**Subscribed tier limits (monthly and annual are equal today):**

| Limit | Value |
|-------|-------|
| Custom affirmation sets | 30 |
| AI affirmation generations / week | 15 |
| Subliminal generations / week | 10 |
| Subliminal storage | 3000 MB |
| Max subliminal length | 15 min |
| Belief Work analyses / week | 10 |
| Chat messages / day | 20 |

**Feature gates (examples):**

- TTS in Subliminal → `text_to_speech`
- Belief Eliminate → `belief_elimination`
- Belief Integrate → `belief_integration`
- Mirror Scenes → `scenes`
- Mirror confidence meter → `confidence_meter_feedback`

If user reports “can’t generate” or “limit reached,” check tier, weekly RPC counts, and daily chat count.

---

## 19. Support playbook — quick answers

**“Why didn’t my Manifestation Charge go up?”**

- Only four actions count (§13). Embody does not.
- Affirmations: must tap **Play** in builder, not only open visualizer.
- Subliminal: must **play** a finished track, not only create one.
- Belief: must **open a saved** entry, not only run new analysis.
- Charge uses **device local date**; near midnight, “today” may differ from UTC.

**“Where did my affirmations go?”**

- Same sets appear in Mirror, Subliminal karaoke/TTS, Piano — user must select set in each tool.

**“How do I make a stronger subliminal?”**

- More **layers** (3–5 recommended), longer track, theta binaural, custom background from Music Composer, karaoke or TTS from a strong affirmation set.

**“Piano has no sound on iPhone”**

- Turn off Silent Mode, raise volume (in-app hint).

**“Chat stopped responding”**

- Daily limit 20 messages; check for system message in thread.

**“Help me create” vs bug report**

- Create tab = coaching intake (focus + help type). Support tab = bugs, AI flags, feature requests with tool picker.

---

## 20. Database quick reference

| Area | Tables |
|------|--------|
| Profile | `profiles`, `user_preferences`, `user_plans` |
| Affirmations | `user_affirmation_sets` |
| Subliminal | `subliminal_tracks`, `subliminal_generation_log`, `user_background_tracks` |
| Belief | `belief_refactor_entries`, `belief_refactor_generation_log` |
| Embody | `user_double_progress`, `user_double_action_history` |
| Charge | `manifestation_power_daily_signals`, `user_activity_stats` |
| Routine | `manifestation_intensity`, `manifest_routine_items`, notification fields on prefs/profile |
| Journal | `chrono_entries` |
| Goals | `weekly_goals` |
| Chat | `character_messages`, `user_message_limits` |
| Support | `support_cases`, `inbox_messages`, `inbox_threads`, storage `support-reports` |

---

## 21. Kickoff prompt (copy into support bot workspace)

```
Read support-tools-handoff.md in full.

You are Palette Plotting support. You help users with:
- Tool how-to (Affirm & Script, Subliminal Maker, Mirror, Belief Work, Embody, Journey, Journal, Chat)
- Manifestation Charge vs Inspired Actions (different systems)
- Help Me Create coaching (affirmations, subliminals, mirror, routines)
- Triaging bugs via report-issue fields (tool, submission type, attachments)

Do not invent features not in the handoff. When unsure, ask which tool/route the user is on.
For billing/account issues, collect purchase channel (Apple / Google / Web).
```

Copy this file into the support bot project as `SUPPORT-HANDOFF.md` when starting.
