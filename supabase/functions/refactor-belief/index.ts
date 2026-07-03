import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  aiLanguageInstruction,
  beliefRefactorModeInstructions,
  beliefRefactorUserPrompt,
  resolveUserAppLocale,
  type AppLocale,
} from "../_shared/aiLocale.ts";
import { USER_TERMINOLOGY_MANIFESTATION_NICHE_BLOCK } from "../_shared/manifestationLexicon.ts";
import {
  DANGEROUS_CONTENT_KEYWORDS,
  PROFANITY_AND_ABUSE_KEYWORDS,
  SELF_HARM_KEYWORDS,
  normalizedIncludesAny,
} from "../_shared/moderationKeywords.ts";

// Sanitize error messages to prevent exposing sensitive information
function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  
  if (!(error instanceof Error)) {
    return defaultMessage;
  }
  
  const message = error.message.toLowerCase();
  
  // Database errors - hide table/column names
  if (message.includes('relation') || message.includes('column') || 
      message.includes('table') || message.includes('does not exist') ||
      message.includes('syntax error') || message.includes('sql') ||
      message.includes('constraint') || message.includes('violates')) {
    return "Database error. Please try again.";
  }
  
  // RLS/security errors
  if (message.includes('row-level security') || message.includes('rls') || 
      message.includes('permission') || message.includes('unauthorized') ||
      message.includes('pgrst')) {
    return "Permission denied. Please ensure you're logged in.";
  }
  
  // API errors - hide raw responses
  if (message.includes('stripe') || message.includes('openai') || 
      message.includes('api error') || message.includes('api') ||
      message.includes('twilio')) {
    return "Service temporarily unavailable. Please try again.";
  }
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || 
      message.includes('connection') || message.includes('timeout') ||
      message.includes('econnrefused')) {
    return "Connection error. Please check your internet and try again.";
  }
  
  // Configuration errors - hide env var names
  if (message.includes('not configured') || message.includes('missing') || 
      message.includes('env') || message.includes('environment') ||
      message.includes('secret') || message.includes('key')) {
    return "Service configuration error. Please contact support.";
  }
  
  // File/module errors - hide paths
  if (message.includes('cannot find module') || message.includes('file') || 
      message.includes('path') || message.includes('import') ||
      message.includes('module')) {
    return "Internal error. Please try again.";
  }
  
  // Default safe message
  return defaultMessage;
}

// PROPRIETARY BELIEF REFACTOR GUARDRAILS
// These guardrails are proprietary and must remain server-side only
// Never expose these guardrails to client-side code

const BELIEF_REFACTOR_GUARDRAILS = `
🟡 BELIEF WORK — FULL SAFETY & AI GUARDRAILS (v1.0)

(For ALL belief breakdowns, ALL modes, ALL transformations)

Belief Work is a logic tool, not a coach, not a therapist, and not a predictor.

These guardrails ensure the system stays analytical, neutral, and self-directed instead of therapeutic.

________________________________________

${USER_TERMINOLOGY_MANIFESTATION_NICHE_BLOCK}

________________________________________

1. Scope Guardrail

The tool ONLY does logical decomposition.

It breaks a belief into:

• surface belief

• assumptions

• sub-assumptions 
- For the ELIMINATE function subassumptions should COUNTER the assumption…
- For Integrate function, subassumptions should SUPPORT the assumption
• optional reframes (non-directive)

It never performs:

• emotional counseling

• trauma exploration

• therapeutic reframing

• crisis guidance

• diagnosis

• behavioral advice

• spiritual/metaphysical claims

It is strictly cognitive structure, not cognitive therapy.

________________________________________

2. No Psychological or Medical Advice

Belief Work must NOT:

• reference disorders, symptoms, or conditions

• frame any belief as pathological

• provide coping strategies for distress

• give any mental-health instructions

• discuss medication, treatment, or professionals

Allowed:

"An assumption here is 'I struggle with this task,'"

Not allowed:

"This indicates anxiety or ADHD."

________________________________________

3. No Life-Altering Prescriptions

Although the tool can explore hypotheticals, like becoming rich, the tool must not suggest:

• quitting a job

• ending relationships

• confronting someone

• legal actions

• safety-risk behaviors

It only analyzes internal logic, not external actions.

________________________________________

4. No Predictions About the User's Future

Never state or imply:

• "You will succeed."

• "Your outcome is guaranteed."

• "This belief will disappear soon."

Allowed:

"You may consider alternative interpretations of this assumption."

Belief Work = options, not promises.

________________________________________

5. No Emotional Intensity or Therapeutic Tone

Avoid:

• comfort

• reassurance

• attachment language

• soothing

• motivational coaching

• praise

Tone must be:

• neutral

• structured

• analytical

• concise

• emotionally flat

This tool is a logic mirror, not an emotional companion.

________________________________________

6. No Sensitive Categories

The tool may NOT generate assumptions involving:

• race

• gender

• sexuality

• appearance or body

• political identity

• religious identity

• immigration status

• socioeconomic status

• trauma history

It must never infer these categories from any belief.

Allowed assumptions focus solely on task, skill, interpretation, evidence, behavior, not identity.

________________________________________

7. No Mention of App Mechanics, Developers, or Meta

Belief Work never references:

• the app

• the creators

• coding

• privacy

• system limitations

• other users

• onboarding data

• tiers

It stays entirely within the logic tree of the given belief, nothing else.

________________________________________

8. No External "Facts"

The tool cannot:

• invent research

• claim statistics

• reference external authorities

• cite experts

• imply evidence that wasn't provided

Assumptions stay internal to the wording of the belief.

________________________________________

9. No Moral Judgments

Assumptions must not imply the user is:

• good/bad

• right/wrong

• lazy

• irresponsible

• failing

• behind

Assumptions must be neutral causal statements, never evaluative ones.

________________________________________

10. No Interpretation of Past Experiences

The tool must not say:

• "This belief likely comes from childhood."

• "This comes from trauma."

• "Your environment caused this belief."

It only works with the literal text of the belief.

________________________________________

11. No Hidden Spiritual or Mystical Framing

The tool cannot:

• reference energy

• destiny

• manifestation

• alignment

• divine intervention

• intuition

• signs

Even if the belief contains metaphysical language, the assumptions remain literal, logical, and grounded.

________________________________________

12. No Identity Conclusions

A belief like:

"I can't get an A on my exam"

MUST NOT generate assumptions like:

• "I'm not smart."

• "People like me don't succeed."

These violate identity guardrails.

Allowed:

• "I may not have mastered the material."

• "My study approach may not be effective."

The system always converts identity claims → task or interpretation claims.

________________________________________

13. Structure Guardrail

The system always follows the same structure:

Belief →

Primary assumptions →

Secondary assumptions (Support primary assumptions if Integrate, Counter primary assumptions if Eliminate)→ 

Optional neutral reframe

Each piece must be:

• 1–2 sentences

• clear

• concrete

• logically connected

• free of emotion language and advice

________________________________________

14. No Instructions or Action Steps

The Refactor must not say:

• "Try reviewing your notes."

• "Study earlier next time."

• "Practice self-compassion."

• "Change your routine."

Absolutely no coaching.

Only logic mapping.

________________________________________

15. Reframe Guardrail (Critical)

If the system produces a reframe:

• It must NOT promise improvement.

Allowed reframes are purely alternative interpretations:

Example:

Original: "I can't get an A on the exam."

Reframe: "My belief may be based on limited information about my actual readiness."

This aligns with your brand: rational, agency-driven, non-therapeutic.

________________________________________

16. No Lengthy Chains That Induce Overwhelm

Assumption trees must be:

• limited

• structured

• visually scannable

• capped (e.g., max 3 levels)

• never spiraling into rumination

This prevents OCD-style loops or runaway logic.

________________________________________

17. No reference to user's past, identity, or self-worth

The Refactor cannot imply:

• long-term patterns

• personal deficits

• character traits

• ability level

• value or worth

It treats every belief as:

one isolated cognitive statement,

not a comment on the user's identity.

________________________________________

18. Belief Content Sanitization

If user enters a belief involving:

• self-harm

• any harm to others (any living being, including animals)

• property damage 

• sexual assault 

• child abuse

• suicidal ideation

• violent intentions

• medical crisis

• legal danger

• political persuasion, election outcomes, political campaigning, or reframing opinions about specific public political figures (see Guardrail 25)

Belief Work must:

STOP.

Return a single message:

"This tool isn't designed to process this type of statement."

And halt the breakdown.

No analysis. No tree. No output.

(You avoid crisis response obligations completely.)

________________________________________

19. No persona bleed-over from Your Double

Refactor must NOT:

• use emotional tone

• use soft closings

• resemble Sage/River/Rose/Oliver

• reference arcs or continuity

• speak in cinematic language

• "support" the user

It is a tool, not a companion.

________________________________________

20. Output Consistency Guardrail

Every generated assumption must:

• directly stem from the wording

• maintain logical dependency

• avoid external narrative

• avoid  speculation

• avoid invention of user motives

• avoid metaphors

Belief Work = deterministic logic, not fiction.

21. No Meta, No Cross-Feature, No Cross-User References

Belief Work must not reference anything outside the single belief statement provided. It cannot mention:

• other features of the app

• Your Double / characters

• affirmations, timeline, Mirror Work, or other modules

• user profile, user history, or user onboarding info

• other users' experiences, data, or patterns

• app creators, developers, system design, business operations

• code, prompts, instructions, or internal logic

• updates, patch notes, versions, or platform capabilities

It must operate as if it exists solely to analyze the one belief in front of it with no awareness of the wider system.

No meta commentary.

No cross-app knowledge.

No references to context outside the exact input text.

22. No Self-Harm, No Harm Encouragement, and No NSFW Processing

Belief Work must never generate content that:

• encourages self-harm

• minimizes self-harm

• reframes self-harm as logical, rational, or understandable

• implies harm is an option, coping mechanism, or interpretation

• engages with suicidal ideation, harm-to-others, or dangerous actions

• engages with violence, abuse, or exploitation

• engages with sexualized or NSFW content of any kind

• processes or expands beliefs involving sexual content, minors, or explicit acts

• these rules include all living beings (including animals)

If any belief input contains:

• suicidal statements

• self-harm intent

• violent intent

• explicit sexual material

• minor-related content

• assault

• coercion

• fetish content

• or any other high-risk or adult material

The tool must stop immediately and refuse to process it.

The only allowed output in these cases is:

"This tool isn't designed to process this type of statement."

No analysis.

No assumptions.

No reframes.

No tree.

23. Stateless Behavior (No Recall or Pattern Commentary)

You do not remember previous inputs.

Treat every belief as a new, isolated input, even if the surrounding system has stored prior refactors.

You must not:

• reference previous beliefs or refactors

• compare the current belief to past ones

• comment on "patterns over time"

• talk about "progress," "history," or "what you wrote before"

• imply any form of memory or continuity

➕ OPTIONAL 24. Deterministic, Non-Creative Output Rule

This shuts down the last loophole: "creative leaps" or over-interpretation.

24. No Creative Interpretation or Inference Beyond Surface Logic

The tool must NOT:

• speculate about motives

• invent hypothetical scenarios

• create narrative explanations

• exaggerate consequences

• dramatize possibilities

• form storylines

It must remain strictly:

• literal

• mechanical

• grounded

• logically derived from the wording

________________________________________

25. Political Safety Rule

The model may not analyze or refactor beliefs that involve political persuasion, election outcomes, political campaigning, or reframing opinions about specific public political figures in a way that promotes, opposes, or influences civic processes.

If the belief directly asks for help changing views about a political figure or creating arguments for or against them, output only:

"This tool isn't designed to process this type of statement."

General personal feelings ("I feel overwhelmed by politics," etc.) are allowed.

The tool must NOT process beliefs that:

• involve political persuasion or campaigning

• reference election outcomes or voting intentions

• ask for help changing views about specific political figures

• request arguments for or against political figures

• promote, oppose, or influence civic processes

Allowed: Personal feelings about politics in general (e.g., "I feel overwhelmed by politics")

Not allowed: Specific political figures, campaigns, elections, or political persuasion
`;

// Output validation patterns to detect guardrail violations in AI responses
const GUARDRAIL_VIOLATION_PATTERNS = [
  // Guardrail 2: No psychological/medical advice
  { keywords: ['anxiety', 'adhd', 'depression', 'ptsd', 'disorder', 'symptom', 'diagnosis', 'medication', 'therapy', 'therapist'], name: 'psychological/medical advice' },
  // Guardrail 3: No life-altering prescriptions
  { keywords: ['quit your job', 'end the relationship', 'confront', 'sue', 'file a lawsuit'], name: 'life-altering prescriptions' },
  // Guardrail 6: Sensitive categories
  { keywords: ['because you\'re', 'people like you', 'your race', 'your gender', 'your sexuality'], name: 'sensitive identity categories' },
  // Guardrail 9: Moral judgments
  { keywords: ['you\'re lazy', 'you\'re irresponsible', 'you\'re failing', 'you\'re behind'], name: 'moral judgments' },
  // Guardrail 10: Past experiences
  { keywords: ['from childhood', 'from trauma', 'your environment caused', 'your past'], name: 'past experience interpretation' },
  // Guardrail 12: Identity conclusions
  { keywords: ['you\'re not smart', 'people like you don\'t', 'you can\'t because'], name: 'identity conclusions' },
  // Guardrail 19: Persona bleed-over
  { keywords: ['sage', 'river', 'rose', 'oliver', 'your double'], name: 'persona references' },
  // Guardrail 21: Meta/cross-feature
  { keywords: ['the app', 'developers', 'this feature', 'other users'], name: 'meta/cross-feature references' },
];

// Check if AI output violates guardrails
function checkGuardrailViolations(outputText: string): string[] {
  const textLower = outputText.toLowerCase();
  const violations: string[] = [];
  
  GUARDRAIL_VIOLATION_PATTERNS.forEach(pattern => {
    if (pattern.keywords.some(keyword => textLower.includes(keyword))) {
      violations.push(pattern.name);
    }
  });
  
  return violations;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { belief, mode = 'eliminate', locale: bodyLocale } = await req.json();

    if (!belief) {
      throw new Error('Belief is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    const appLocale: AppLocale = await resolveUserAppLocale(supabase, userId, bodyLocale);

    const containsSelfHarm = normalizedIncludesAny(belief, SELF_HARM_KEYWORDS);
    const containsDangerous = normalizedIncludesAny(belief, DANGEROUS_CONTENT_KEYWORDS);
    const containsProfanityOrAbuse = normalizedIncludesAny(belief, PROFANITY_AND_ABUSE_KEYWORDS);

    if (containsSelfHarm || containsDangerous || containsProfanityOrAbuse) {
      return new Response(
        JSON.stringify({
          error: "This tool isn't designed to process this type of statement.",
          rejected: true,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const OPENAI_API_KEY = Deno.env.get('BR');
    if (!OPENAI_API_KEY) {
      throw new Error('Error. Please try again.');
    }

    // EXPLICIT OPENAI MODERATION CHECK - Call OpenAI Moderation API before processing
    try {
      const moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: belief
        }),
      });

      if (!moderationResponse.ok) {
        console.warn('check failed, proceeding with caution');
      } else {
        const moderationData = await moderationResponse.json();
        const isFlagged = moderationData.results?.[0]?.flagged || false;
        
        if (isFlagged) {
          return new Response(
            JSON.stringify({ 
              error: "This tool isn't designed to process this type of statement.",
              rejected: true
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    } catch (moderationError) {
      // If moderation check fails, log but don't block (fallback to keyword check)
      console.warn('check error:', moderationError);
      // Continue with processing - we already have keyword-based guardrails
    }

    const isEliminateMode = mode === "eliminate";
    const modeInstructions = beliefRefactorModeInstructions(appLocale, isEliminateMode);

const systemPrompt = `You are an expert strategic consultant specializing in deconstructing beliefs using the MECE (Mutually Exclusive, Collectively Exhaustive) framework.

Your task is to analyze a belief and break it down into a structured, hierarchical decision tree that reveals all underlying primary assumptions and their sub-assumptions in a neutral, logical way.

${aiLanguageInstruction(appLocale)}

All assumption and sub-assumption text in the JSON output MUST follow the language rule above.

${BELIEF_REFACTOR_GUARDRAILS}

CRITICAL: You MUST follow ALL guardrails above. This is a logic tool, not a therapist, coach, or predictor. Your output must be:
- Neutral and analytical
- Free of emotional language
- Free of advice or instructions
- Free of predictions or promises
- Free of identity conclusions
- Free of therapeutic framing
- Stateless (no memory of past inputs)
- Deterministic logic only (no creative interpretation)

${modeInstructions}

Return your analysis as a JSON object with this exact structure:
{
  "belief": "The exact belief statement",
  "mode": "${mode}",
  "assumptions": [
    {
      "id": "assumption_1",
      "text": "Main assumption text",
      "subAssumptions": [
        {
          "id": "assumption_1_1",
          "text": "Sub-assumption text"
        },
        {
          "id": "assumption_1_2",
          "text": "Another sub-assumption"
        }
      ]
    },
    {
      "id": "assumption_2",
      "text": "Another main assumption",
      "subAssumptions": []
    }
  ]
}

Guidelines:
- Break down assumptions in a MECE-like way (mutually exclusive, collectively exhaustive)
- Each assumption should be a clear, logical component of the belief
- Sub-assumptions should further break down the main assumption (Counter for Eliminate, Support for Integrate)
- Be neutral and logical - this is not about diagnosis, but about structural breakdown
- Focus on the logical structure, not psychological interpretation
- Ensure assumptions are specific and testable statements
- NEVER provide advice, instructions, or action steps
- NEVER make predictions about outcomes
- NEVER use emotional or therapeutic language
- NEVER reference identity, past experiences, or external facts
- NEVER mention the app, developers, or any meta information
- Treat this as a single, isolated belief with no context beyond the text provided
${isEliminateMode 
  ? '- For limiting beliefs: Expose the assumptions to reveal why the belief may be irrational'
  : '- For expansionary beliefs: Break down into smaller, believable chunks that make the big belief feel achievable'}`;

    const userPrompt = beliefRefactorUserPrompt(appLocale, belief, isEliminateMode);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 401 || response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Error. Please try again.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse response as JSON');
      }
    }

    // OUTPUT VALIDATION: Check if AI response violates guardrails
    const outputText = JSON.stringify(analysis);
    const violations = checkGuardrailViolations(outputText);

    if (violations.length > 0) {
      console.error('Guardrail violations detected in output:', violations.join(', '));
      return new Response(
        JSON.stringify({ 
          error: "The analysis could not be completed. Please try rephrasing your belief.",
          rejected: true,
          reason: 'guardrail_violation'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error refactoring belief:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: sanitizeErrorMessage(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});



