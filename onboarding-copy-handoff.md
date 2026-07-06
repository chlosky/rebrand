# Part 1 — Copy (i18n JSON)

Rewrite user-facing strings here first.

## src/i18n/locales/en/onboarding.json

```json
{
  "welcome": {
    "signUp": "Get started",
    "enterStudio": "Get started",
    "ctaSubtext": "About 3 minutes to set up",
    "freeTrialLine": "Start free",
    "nativeTitle": "Turn your vision into real follow-through",
    "nativeTitleLead": "Turn your vision into ",
    "nativeTitleAccent": "real follow-through",
    "nativeDescription": "Plot the life you are reshaping — choose your focus areas, build The Plan around your dates and goals, and let reminders keep you accountable.",
    "tagline": "Vision · Plan · Accountability",
    "pillars": [
      "Choose the areas of your life you are transforming",
      "Turn dates, goals, and next steps into The Plan",
      "Reminders that help you follow through"
    ],
    "awardLine1": "Plot what you want",
    "awardLine2": "Plan what matters",
    "awardLine3": "Stay accountable",
    "webHeadline1": "Turn your vision into",
    "webHeadlineAccent": "real follow-through",
    "toolRows": {
      "row1": ["Your focus areas", "The Plan"],
      "row2": ["Images & structure", "Dates & goals"],
      "row3": ["Email reminders", "Accountability", "Progress"]
    },
    "webSteps": {
      "desire": {
        "title": "Choose what you are transforming",
        "subtitle": "Pick the focus areas you want to reshape first"
      },
      "makeYours": {
        "title": "Plot your vision",
        "subtitle": "Add images, notes, and structure that match where you are headed"
      },
      "listen": {
        "title": "Follow through",
        "subtitle": "Use The Plan and reminders to stay accountable to your goals"
      }
    },
    "webToolbar": {
      "boards": "Boards",
      "clippings": "Clippings",
      "structures": "Structures",
      "marks": "Text & Notes"
    },
    "communityProof": "",
    "mockupScreenAlt": "Palette Plotting workspace preview",
    "mockupPreviewAria": "Palette Plotting app preview"
  },
  "plottingScene": {
    "whispers": {}
  },
  "setup": {
    "name": {
      "title": "First things first — what should we call you?",
      "firstNameLabel": "First name",
      "firstNamePlaceholder": "Your first name",
      "saveError": "Could not save your name. Check your connection and try again."
    },
    "focusCategories": {
      "title": "Choose your three focus boards",
      "subtitle": "Pick up to three. These become your starter focus boards alongside The Plan."
    },
    "primaryIntent": {
      "title": "What are you setting up?",
      "subtitle": "Choose your starting system. You can add other boards later.",
      "options": {
        "life_rebranding": {
          "title": "Life plotting & vision boards",
          "description": "Pick three focus areas and turn them into three starter boards plus The Plan."
        },
        "home_organization": {
          "title": "Home organization",
          "description": "Build household boards for routines, zones, chores, meals, and resets."
        },
        "office_work": {
          "title": "Office & projects",
          "description": "Build project boards with Kanban, timelines, priorities, OKRs, and next steps."
        },
        "moodboarding": {
          "title": "Moodboarding",
          "description": "Build image-forward boards for interiors, style, travel, events, or brand direction."
        }
      }
    },
    "homeFocus": {
      "title": "What is your home focus?",
      "subtitle": "Pick the area you want your starter boards built around.",
      "options": {
        "home_plan_routines": "Home plan & routines",
        "home_chores_cleaning": "Chores & cleaning",
        "home_meal_planning": "Meal planning",
        "home_family_kids": "Family & kids",
        "home_seasonal_reset": "Seasonal reset"
      }
    },
    "officePlanning": {
      "title": "Choose your starting structure",
      "subtitle": "Pick the structure you want on your first board. You can add more later.",
      "systems": {
        "kanban": {
          "title": "Kanban",
          "description": "Move tasks from To Do to Done."
        },
        "gantt": {
          "title": "Gantt timeline",
          "description": "Map tasks across a timeline."
        },
        "eisenhower": {
          "title": "Priority grid",
          "description": "Sort what matters now, next, later, or not at all."
        },
        "okrs": {
          "title": "OKRs",
          "description": "Set the goal and the results that show it is moving."
        },
        "five_s": {
          "title": "5S reset",
          "description": "Reset a space or workflow step by step."
        }
      }
    },
    "moodboardFocus": {
      "title": "What is your moodboard for?",
      "subtitle": "We will start you with boards that match that direction.",
      "options": {
        "mood_aesthetic_style": "Aesthetic & style",
        "mood_interiors_space": "Interiors & space",
        "mood_travel_inspo": "Travel inspo",
        "mood_events_weddings": "Events & weddings",
        "mood_brand_creative": "Brand & creative"
      }
    },
    "focusDetails": {
      "subtitle": "We will shape your starter boards around this.",
      "fallbackHeadline": "A quick detail",
      "fallbackMessage": "Go back and pick a focus area to unlock this step.",
      "customLabel": "Describe your focus",
      "customPlaceholder": "e.g., soft life reset, new career chapter, apartment setup",
      "categories": {
        "Identity": {
          "headline": "What identity shift are you plotting?",
          "options": {
            "confidence": "Confidence",
            "discipline": "Discipline",
            "newChapter": "A new chapter",
            "selfTrust": "Self-trust",
            "freshStart": "Fresh start"
          }
        },
        "Career & Money": {
          "headline": "What career or money move matters most?",
          "options": {
            "newJob": "New job",
            "promotion": "Promotion",
            "higherIncome": "Higher income",
            "debtFreedom": "Debt freedom",
            "startBusiness": "Start a business"
          }
        },
        "Love & Relationships": {
          "headline": "What are you building in your relationships?",
          "options": {
            "dating": "Dating",
            "deeperConnection": "Deeper connection",
            "selfLove": "Self-love",
            "betterBoundaries": "Better boundaries",
            "quality": "Quality time"
          }
        },
        "Home & Space": {
          "headline": "What's your home focus?",
          "options": {
            "redecorate": "Redecorate",
            "declutter": "Declutter & reset",
            "newPlace": "A new place",
            "cozyUpgrade": "Cozy upgrade",
            "systems": "Organized systems"
          }
        },
        "Beauty & Wellness": {
          "headline": "What glow-up are you after?",
          "options": {
            "skinBeauty": "Skin & beauty",
            "selfCare": "Self-care routine",
            "betterRest": "Better rest",
            "confidence": "Confidence",
            "overallWellness": "Overall wellness"
          }
        },
        "Travel & Adventure": {
          "headline": "What adventure are you plotting?",
          "options": {
            "dreamTrip": "Dream trip",
            "moveAbroad": "Move abroad",
            "weekendEscapes": "Weekend escapes",
            "bucketList": "Bucket list",
            "nomadLife": "Digital nomad life"
          }
        },
        "Organization & Plan": {
          "headline": "What are you getting organized?",
          "options": {
            "mySchedule": "My schedule",
            "mySpace": "My space",
            "myRoutines": "My routines",
            "myPriorities": "My priorities",
            "myWholeLife": "My whole life"
          }
        },
        "Aesthetic & Mood": {
          "headline": "What vibe are you curating?",
          "options": {
            "personalStyle": "Personal style",
            "interiors": "Interiors",
            "colorPalette": "Color palette",
            "creativeDirection": "Creative direction",
            "overallAesthetic": "Overall aesthetic"
          }
        },
        "College & School": {
          "headline": "What are you working toward in school?",
          "options": {
            "betterGrades": "Better grades",
            "examSuccess": "Exam success",
            "collegeAcceptance": "College acceptance",
            "scholarship": "Scholarship",
            "studyHabits": "Focus & study habits"
          }
        },
        "Health & Fitness": {
          "headline": "What health shift are you plotting?",
          "options": {
            "strength": "Strength",
            "shapeTone": "Shape & tone",
            "energy": "Energy",
            "consistentWorkouts": "Consistent workouts",
            "nutrition": "Nutrition"
          }
        }
      }
    },
    "currentFriction": {
      "title": "What's slowing the rebrand down?",
      "subtitle": "Name it once so we can build your boards around it.",
      "placeholder": "The thing you keep working around…"
    },
    "toolPreference": {
      "title": "How do you want to use your boards first?",
      "subtitle": "Choose the tool you are most likely to open again."
    },
    "toolPreferenceOptions": {
      "boards_workspace": "Board review & planning",
      "daily_wins_progress": "Habit & progress tracking"
    },
    "workspaceTemplate": {
      "title": "Choose your first board setup",
      "subtitle": "Pick a starting layout. You can rearrange everything later.",
      "summary": {
        "title": "Your starter boards",
        "subtitle": "We'll create one focus board for each area you selected, plus The Plan.",
        "planTitle": "The Plan",
        "planDescription": "Dates, goals, reminders, and next steps.",
        "continue": "Build my boards"
      },
      "titleByIntent": {
        "life_rebranding": "Choose your vision board setup",
        "home_organization": "Choose your home board setup",
        "office_work": "Choose your project board setup",
        "moodboarding": "Choose your moodboard setup"
      },
      "subtitleByIntent": {
        "life_rebranding": "Start with vision boards and The Plan.",
        "home_organization": "Start with household boards, zones, and checklists.",
        "office_work": "Start with project boards and planning structures.",
        "moodboarding": "Start with image-forward boards for visual direction."
      },
      "options": {
        "four-board-rebrand": {
          "name": "Three Focus Boards and The Plan",
          "description": "Three focus boards and one plan board — the signature four-board plot."
        },
        "soft-life-reset": {
          "name": "Glow, Home & Peace",
          "description": "Beauty, environment, and calm rituals with a plan board."
        },
        "career-girl": {
          "name": "Ambition & Wealth",
          "description": "Career vision, money goals, and confidence with a plan board."
        },
        "minimal-plan": {
          "name": "One Vision + Plan",
          "description": "One hero vision board and a dedicated plan board."
        },
        "home-plan-routines": {
          "name": "Home Plan & Routines",
          "description": "Weekly rhythms, zones, and family flow."
        },
        "home-chores-cleaning": {
          "name": "Chores & Cleaning",
          "description": "Chore charts, supplies, and reset zones."
        },
        "home-meal-planning": {
          "name": "Meal Planning",
          "description": "Menus, groceries, and kitchen rhythm."
        },
        "home-family-kids": {
          "name": "Family & Kids",
          "description": "Schedules, activities, and household command."
        },
        "home-seasonal-reset": {
          "name": "Seasonal Reset",
          "description": "Holiday, declutter, and seasonal home projects."
        },
        "office-kanban": {
          "name": "Kanban Flow",
          "description": "Backlog → To Do → Doing → Done."
        },
        "office-gantt": {
          "name": "Gantt Timeline",
          "description": "Tasks mapped across time."
        },
        "office-eisenhower": {
          "name": "Eisenhower Matrix",
          "description": "Urgent × Important quadrants."
        },
        "office-okrs": {
          "name": "OKRs",
          "description": "Objectives with measurable key results."
        },
        "office-five-s": {
          "name": "5S Workplace",
          "description": "Lean floor discipline — Sort through Sustain."
        },
        "mood-aesthetic-style": {
          "name": "Aesthetic & Style",
          "description": "Outfits, palettes, and vibe references."
        },
        "mood-interiors-space": {
          "name": "Interiors & Space",
          "description": "Rooms, furniture, and renovation mood."
        },
        "mood-travel-inspo": {
          "name": "Travel Inspo",
          "description": "Destinations, stays, and trip aesthetics."
        },
        "mood-events-weddings": {
          "name": "Events & Weddings",
          "description": "Ceremony, decor, and vendor vision."
        },
        "mood-brand-creative": {
          "name": "Brand & Creative",
          "description": "Logo, typography, and campaign looks."
        }
      }
    },
    "guide": {
      "title": "Choose a guide",
      "subtitle": "An AI companion for questions while you rebrand."
    },
    "attribution": {
      "title": "How did you find Palette Plotting?",
      "subtitle": "This helps us understand what's working.",
      "options": {
        "tiktok": "TikTok",
        "instagram": "Instagram",
        "app_store": "App Store / Google Play",
        "friend": "A friend told me",
        "youtube": "YouTube",
        "search": "Google / search",
        "other": "Somewhere else"
      }
    },
    "intensity": {
      "title": "How often do you want board reminders?",
      "titleByIntent": {
        "life_rebranding": "How often do you want board reminders?",
        "home_organization": "How intense is your reset?",
        "office_work": "How intense is your planning?",
        "moodboarding": "How often do you want to plot?"
      },
      "subtitle": "You can turn these off or change them anytime.",
      "continue": "Continue",
      "setRoutine": "Continue",
      "notificationsQuestion": "Send reminders for dates and goals from The Plan?",
      "notificationsDescription": "Email reminders are available now. Push notifications will arrive with the mobile app.",
      "notificationsHint": "Email reminders are available now. Push notifications will arrive with the mobile app.",
      "yes": "Yes",
      "notNow": "Not now",
      "dailyTime": "Daily notification time",
      "customizeInSettings": "You can change this anytime in Settings.",
      "light": {
        "title": "Light",
        "tagline": "1 reminder a day.",
        "description": "A simple daily check-in."
      },
      "consistent": {
        "title": "Consistent",
        "tagline": "2 reminders a day.",
        "description": "Morning and evening nudges for your boards and The Plan."
      },
      "lockedIn": {
        "title": "Locked In",
        "tagline": "3 reminders a day.",
        "description": "A stronger rhythm for active planning weeks."
      },
      "alerts": {
        "alert": "Alert",
        "first": "1st Alert",
        "second": "2nd Alert",
        "third": "3rd Alert"
      }
    },
    "notifications": {
      "title": "Turn on additional permissions",
      "subtitle": "Help us improve Palette Plotting."
    },
    "tracking": {
      "title": "Help us improve Palette Plotting (optional)",
      "body": "Palette Plotting uses app activity data to measure ad performance and improve experience. Will you help us improve Palette Plotting?",
      "yes": "Yes",
      "no": "No"
    },
    "email": {
      "title": "Save your plot",
      "titleLine1": "Save your plot &",
      "titleLine2": "start your free trial",
      "subtitle": "Create your account to lock in your rebrand workspace. Everything saves to this email.",
      "emailLabel": "Email",
      "passwordLabel": "Password",
      "emailPlaceholder": "you@email.com",
      "passwordPlaceholder": "8+ characters",
      "invalidEmail": "Please enter a valid email address",
      "needFirstName": "We need your first name from earlier in setup.",
      "passwordLength": "Please enter a password with at least 8 characters",
      "acceptTerms": "Please accept the Terms of Service and Privacy Policy",
      "subscriptionError": "Could not open subscription options. Try again in a moment.",
      "tryAgain": "Try again",
      "checkingAvailability": "Checking availability…",
      "wrongEmailHint": "Wrong email?",
      "signOutToChangeEmail": "Sign out to use a different address.",
      "signOutToChangeEmailToast": "Sign out first to use a different email address.",
      "signOutFailed": "Could not sign out. Try again.",
      "sessionExpired": "Your session expired. Enter your email and password again.",
      "hidePassword": "Hide password",
      "showPassword": "Show password",
      "termsAcceptPrefix": "I accept the",
      "termsOfService": "Terms of Service",
      "termsAnd": "and",
      "privacyPolicy": "Privacy Policy",
      "emailMarketingConsent": "Send me rebrand tips and updates. By checking this box, you consent to marketing communications. You can opt out anytime."
    },
    "plotSynthesis": {
      "title": "Your workspace is ready.",
      "subtitle": "Your starter boards, The Plan, extraction tools, and reminders are set up.",
      "items": {
        "workspace": "Your focus boards match the areas you selected.",
        "boards": "The Plan is where dates, goals, and next steps become reminders.",
        "tracking": "Use extraction to pull text, dates, and action items from boards and images."
      }
    },
    "plotLoading": {
      "title": "Building your board workspace…",
      "subtitle": "Creating your focus boards, The Plan, and reminder setup.",
      "loading": "Building",
      "hint": "Your first workspace starts from your selected focus areas.",
      "testimonials": {
        "row1": [
          {
            "quote": "Finally feels like my moodboard came to life.",
            "author": "Jordan M."
          },
          {
            "quote": "I stopped doom-scrolling and started plotting my era.",
            "author": "Riley T."
          },
          {
            "quote": "The aesthetic + plan combo is exactly what I needed.",
            "author": "Casey L."
          },
          {
            "quote": "My rebrand actually looks like me now.",
            "author": "Morgan P."
          }
        ],
        "row2": [
          {
            "quote": "Seeing it all in one place changed how I show up.",
            "author": "Dev S."
          },
          {
            "quote": "Reminders on my plotted goals keep me honest.",
            "author": "Avery K."
          },
          {
            "quote": "Small daily wins on the plan board add up fast.",
            "author": "Quinn R."
          },
          {
            "quote": "I open this more than any other app on my phone.",
            "author": "Jamie H."
          }
        ]
      }
    },
    "beginJourney": {
      "lead": "Your boards are taking shape.",
      "subtitle": "Next we'll save your setup and turn it into your workspace."
    }
  }
}

```

---

## src/i18n/locales/en/paywall.json

```json
{
  "postPaywall": {
    "title": "Your workspace is ready",
    "buildingDashboard": "Opening your workspace…",
    "finishingSubtitle": "Almost there — setting up your boards.",
    "loadingStatusAria": "Loading status",
    "commitmentLabel": "Quick reminder:",
    "commitmentText": "You have a place to put the boards, plans, images, and structures you are building. Start simple, then keep arranging.",
    "simsLines": [
      "Confirming your trial…",
      "Setting up your four-board workspace…",
      "Adding your starter boards and plan layout…",
      "Opening your workspace — almost there."
    ],
    "toastActivateFailedIos": "Purchase completed, but we could not activate your plan yet. Try again from subscriptions.",
    "toastActivateFailedAndroid": "Purchase completed, but we could not activate your plan yet. Please try again.",
    "toastSetupSnag": "We hit a snag finishing setup. Taking you to your workspace…"
  },
  "legacyIos": {
    "titleLine1": "Unlock your free trial",
    "titleLine2": "Start your membership",
    "subtitle": "Choose a weekly plan to claim your free trial.",
    "loadingOptions": "Loading subscription options…",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "yearly": "Yearly",
    "bestAnnualValue": "Best annual value",
    "onlyPerMonth": "Only {{amount}}/mo",
    "perWeek": "{{price}}/week",
    "perMonth": "{{price}}/month",
    "perYear": "{{price}}/year",
    "opening": "Opening…",
    "tryAgain": "Try again",
    "fallbackTitle": "We couldn't finish that step",
    "fallbackBody": "Tap Try again, or go back to sign up and tap Continue.",
    "terms": "Terms / EULA",
    "privacy": "Privacy",
    "restorePurchases": "Restore purchases",
    "restoring": "Restoring…",
    "restore": "Restore",
    "closeAria": "Close",
    "errorNotIosApp": "Subscriptions are only available in the iOS app.",
    "errorSignInAgain": "Sign in again, then open subscription.",
    "errorNoSession": "No active session. Sign out, sign in, then tap Continue.",
    "errorOpenFromSignup": "Open subscription from the app after sign up.",
    "errorSkippedDetail": "Use Continue on the sign-up screen, or open Account from Settings.",
    "errorGeneric": "Something went wrong.",
    "errorPersist": "Something went wrong. Copy debug log from Safari if this persists.",
    "restoreOnlyIos": "Restore is only available in the iOS app.",
    "restoredSuccess": "Subscription restored. Welcome back!",
    "restoreCancelled": "Restore cancelled.",
    "nothingToRestore": "Nothing to restore."
  },
  "legacyAndroid": {
    "title": "Unlock Palette Plotting Pro Today.",
    "subtitle": "Tap Continue to confirm your plan.",
    "opening": "Opening…",
    "tryAgain": "Try again",
    "fallbackTitle": "We couldn't finish that step",
    "fallbackBody": "Tap Try again, or go back to sign up and tap Continue.",
    "terms": "Terms / EULA",
    "privacy": "Privacy",
    "closeAria": "Close",
    "errorNotAndroidApp": "Subscriptions are only available in the Android app.",
    "errorSignInAgain": "Sign in again, then open subscription.",
    "errorNoSession": "No active session. Sign out, sign in, then tap Continue.",
    "errorOpenFromSignup": "Open subscription from the app after sign up.",
    "errorSkippedDetail": "Use Continue on the sign-up screen, or open Account from Settings.",
    "errorGeneric": "Something went wrong."
  },
  "flow": {
    "subscriptionAlreadyOpening": "Subscription is already opening — wait a few seconds, then try again.",
    "subscriptionScreenMayBeOpening": "A subscription screen may still be opening. Wait a few seconds, then try again. If nothing changes, force-quit the app and reopen.",
    "openingSubscriptionsTimedOut": "Opening subscriptions timed out. Force-quit the app, reopen, and tap Continue again.",
    "paymentNotCompleted": "Payment was not completed.",
    "couldNotOpenSubscription": "Could not open subscription options.",
    "signInRequiredBeforeSubscribing": "Sign in is required before subscribing."
  },
  "webWrapper": {
    "checkoutFailed": "We could not open checkout.",
    "checkoutClosed": "Checkout closed. You can subscribe anytime.",
    "viewPlans": "View plans",
    "close": "Close",
    "notConfigured": "Web checkout is not configured yet. Please try again later.",
    "subscriptionNotCompleted": "Subscription not completed."
  },
  "emailCollection": {
    "title": "Let's Get Started",
    "emailLabel": "Email",
    "firstNameLabel": "First Name",
    "usernameLabel": "Username",
    "passwordLabel": "Password",
    "confirmLabel": "Confirm",
    "emailPlaceholder": "your@email.com",
    "firstNamePlaceholder": "First name",
    "usernamePlaceholder": "Username",
    "passwordPlaceholder": "8+ characters",
    "confirmPlaceholder": "Re-enter",
    "checkingEmail": "Checking availability...",
    "checkingUsername": "Checking...",
    "emailTaken": "This email is already registered. Please sign in instead.",
    "usernameTaken": "This username is already taken. Please choose another.",
    "passwordMinLength": "Password must be at least 8 characters.",
    "passwordMismatch": "Passwords do not match.",
    "passwordMismatchToast": "Passwords do not match",
    "invalidEmail": "Please enter a valid email address",
    "needUsername": "Please enter a username",
    "needPassword": "Please enter a password with at least 8 characters",
    "needFirstName": "Please enter your first name",
    "acceptTerms": "Please accept the Terms of Service and Privacy Policy",
    "verifyEmailBlocked": "Account created, but sign-in is blocked. Please verify your email, then sign in.",
    "subscriptionError": "Could not open subscription options. Try again in a moment.",
    "saveFailed": "Failed to save. Please try again.",
    "tryAgain": "Try again",
    "termsAcceptPrefix": "I accept the",
    "termsOfService": "Terms of Service",
    "termsAnd": "and",
    "privacyPolicy": "Privacy Policy",
    "appNotificationsConsent": "I consent to app notifications (optional). New tools, promotions and app news. Opt out in Settings → Notification preferences.",
    "emailMarketingConsent": "I consent to email marketing communications (optional, separate from transactional emails minimally required). Opt out in settings.",
    "smsMarketingConsent": "I consent to SMS marketing communications (optional). Opt out in settings. Message and data rates may apply."
  },
  "errors": {
    "cancelled": "Cancelled",
    "paywallError": "Paywall error",
    "notPresented": "Not presented",
    "unknownResultDetail": "Unknown result: {{detail}}",
    "noApiKey": "No RevenueCat API key configured.",
    "notConfigured": "RevenueCat could not be configured.",
    "purchaseNotCompleted": "Purchase was not completed.",
    "billingUnavailable": "Billing unavailable; RevenueCat paywall UI is not used on this iOS version.",
    "noOfferings": "No offerings in RevenueCat. Add a default offering and paywall in the dashboard.",
    "checkoutFailed": "Could not complete checkout.",
    "subscriptionNotCompleted": "Subscription was not completed.",
    "webNotConfigured": "RevenueCat Web is not configured (missing API key)."
  },
  "paymentProcessing": {
    "title": "Processing Payment",
    "subtitle": "Please wait while we confirm your payment. This usually takes a few seconds.",
    "missingInfo": "Missing payment information. Please restart onboarding.",
    "verificationSlow": "Payment verification is taking longer than expected. Please contact support.",
    "verificationFailed": "Unable to verify payment. Please contact support."
  },
  "webStripe": {
    "headline": "Start your board workspace",
    "subtitle": "Create boards for life plotting, home organization, moodboards, and project planning.",
    "priceLine": "3 days free, then $9.99/month.",
    "cancelLine": "Cancel anytime.",
    "cta": "Start 3-Day Trial",
    "secondaryCta": "Not now",
    "features": [
      "Three focus boards plus The Plan",
      "Clippings, color, text, notes, and Structures",
      "Extract text and action items from boards and uploaded images",
      "AI-suggested reminders from dates, goals, and next steps",
      "Email reminders and iCal export",
      "Push notification framework for the mobile app"
    ]
  }
}

```

---

## src/i18n/locales/en/tools.json

```json
{
  "focusCategories": {
    "Identity": "Identity",
    "Career & Money": "Career & Money",
    "Love & Relationships": "Love & Relationships",
    "Home & Space": "Home & Space",
    "Beauty & Wellness": "Beauty & Wellness",
    "Travel & Adventure": "Travel & Adventure",
    "Organization & Plan": "Organization & Plan",
    "Aesthetic & Mood": "Aesthetic & Mood",
    "College & School": "College & School",
    "Health & Fitness": "Health & Fitness"
  },
  "focusCategoryTiles": {
    "Identity": "Identity",
    "Career & Money": "Career & Money",
    "Love & Relationships": "Love & Relationships",
    "Home & Space": "Home & Space",
    "Beauty & Wellness": "Beauty & Wellness",
    "Travel & Adventure": "Travel & Adventure",
    "Organization & Plan": "Organization & Plan",
    "Aesthetic & Mood": "Aesthetic & Mood",
    "College & School": "College & School",
    "Health & Fitness": "Health & Fitness"
  },
  "boards": {
    "pageTitle": "Boards | Palette Plotting",
    "loading": "Loading your board system…",
    "saveFailed": "Could not save board layout"
  },
  "activity": {
    "title": "Progress Milestones",
    "milestones": {
      "tabs": {
        "inspiredActions": "Inspired Actions",
        "desires": "Weekly Goals",
        "weeklyWins": "Weekly Wins"
      },
      "toasts": {
        "error": "Error",
        "loadHistoryFailed": "Failed to load action history. Please try again.",
        "loadGoalsFailed": "Failed to load weekly goals",
        "categoryRequired": "Category Required",
        "selectCategoryForGoal": "Please select a category for your goal",
        "saveGoalFailed": "Failed to save goal",
        "updateGoalFailed": "Failed to update goal",
        "deleteGoalFailed": "Failed to delete goal",
        "loadReviewFailed": "Failed to load week review"
      },
      "aria": {
        "completed": "Completed",
        "notCompleted": "Not completed"
      },
      "goals": {
        "addPlaceholder": "Add",
        "category": "Category",
        "addButton": "Add",
        "loading": "Loading goals...",
        "emptyTitle": "No goals set for this week.",
        "emptyHint": "Add a goal above to get started."
      },
      "review": {
        "loading": "Loading weekly wins...",
        "inspiredActionsTitle": "Inspired Actions",
        "inspiredActionsCount": "Inspired Actions completed this week",
        "desiresTitle": "Weekly Goals",
        "desiresSet": "Goals set",
        "desiresAttained": "Goals completed",
        "completionRate": "{{pct}}% completion rate",
        "byCategoryTitle": "Goals by category",
        "categoryCompleted": "{{completed}}/{{total}} completed",
        "emptyTitle": "No activity recorded for this week.",
        "emptyHint": "Log inspired actions and weekly goals to see your progress here."
      }
    }
  },
  "chrono": {
    "title": "Journal",
    "loadingTimeline": "Loading your timeline...",
    "emptyTimeline": "Your timeline is waiting to be written.",
    "createFirstEntry": "Create your first entry",
    "timeline": {
      "description": "Reflect on your days and track what shifted.",
      "newEntry": "New entry",
      "editEntry": "Edit entry",
      "showLess": "Show less",
      "showMore": "Show more",
      "env3d": "3D (environment):",
      "dayExperience": "How you experienced the day:",
      "winToday": "Win today:",
      "yes": "Yes",
      "no": "No",
      "env3dAria": "3D environment felt {{rating}}",
      "dayExperienceAria": "Day was experienced as {{rating}}"
    },
    "form": {
      "editEntry": "Edit entry",
      "newEntry": "New entry",
      "deleteEntry": "Delete entry",
      "date": "Date",
      "pickDate": "Pick a date",
      "titleLabel": "Title *",
      "titlePlaceholder": "Give your entry a title...",
      "whatHappened": "What happened? *",
      "textPlaceholder": "Tell your timeline what happened today...",
      "env3dQuestion": "(1) How was the 3D (external environment) today? *",
      "dayExperienceQuestion": "(2) How did you experience the day? *",
      "updating": "Updating...",
      "creating": "Creating...",
      "update": "Update",
      "addEntry": "Add entry",
      "deleteTitle": "Delete entry",
      "deleteDescription": "Are you sure you want to delete this entry? This action cannot be undone.",
      "deleting": "Deleting...",
      "delete": "Delete",
      "mood": {
        "rough": "Rough or heavy",
        "neutral": "Neutral",
        "good": "Good"
      },
      "toast": {
        "titleRequired": "Title required",
        "titleRequiredDesc": "Give your entry a title.",
        "entryRequired": "Entry required",
        "entryRequiredDesc": "Write something for your timeline.",
        "authRequired": "Authentication required",
        "authRequiredDesc": "Please log in to create entries.",
        "reflectionIncomplete": "Reflection incomplete",
        "reflectionIncompleteDesc": "Answer both questions using the faces below.",
        "permissionDenied": "Permission denied",
        "permissionDeniedDesc": "Please ensure you are logged in and try again.",
        "error": "Error",
        "createFailed": "Failed to create entry. Please try again.",
        "deleteFailed": "Failed to delete entry. Please try again.",
        "noSession": "No valid session found. Please log in and try again."
      }
    }
  },
  "double": {
    "choose": {
      "practicesShort": {
        "rest": "Rest",
        "selfCare": "Care",
        "clean": "Clean",
        "drinkWater": "Water",
        "haveFun": "Fun",
        "exercise": "Move",
        "glamUp": "Glam Up",
        "connect": "Connect",
        "seen": "Seen",
        "work": "Work"
      }
    },
    "embody": {
      "confirmQuestions": {
        "rest": "Did you rest?",
        "selfCare": "Did you do some self-care?",
        "clean": "Did you clean a space today?",
        "drinkWater": "Did you drink water?",
        "haveFun": "Did you do something fun today?",
        "exercise": "Did you exercise?",
        "glamUp": "Did you glam up or celebrate your beauty today?",
        "connect": "Did you connect with people, nature, or animals today?",
        "seen": "Did you practice being seen (online or in person) today?",
        "work": "Did you make career or academic progress today?"
      }
    }
  },
  "journey": {
    "pageTitle": "Reminders | Palette Plotting",
    "title": "Reminders",
    "subtitle": "Dates, goals, and next steps from The Plan — with email reminders and calendar export.",
    "dailySnapshot": "Daily Snapshot",
    "statusAligned": "Aligned",
    "coherenceHint": "Check in on your boards and journal to stay aligned with your plan.",
    "yourProgress": "Your Progress",
    "journalTitle": "Journal",
    "journalDescription": "Daily reflections and notes in one place.",
    "remindersTitle": "The Plan Reminders",
    "remindersDescription": "Extract dates, goals, and next steps from The Plan, then send reminders by email or export them to your calendar.",
    "planEmptyTitle": "Turn The Plan into reminders",
    "planEmptyBody": "Add dates, goals, and next steps here. Palette Plotting can extract action items and help schedule reminders.",
    "extractDatesGoals": "Extract dates & goals",
    "addReminderManually": "Add reminder manually",
    "exportCalendar": "Export to calendar"
  }
}

```

---

