import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarketingSiteLayout } from "@/components/marketing/MarketingSiteLayout";
import {
  MARKETING_BODY_CLASS,
  MARKETING_DISPLAY_CLASS,
  MARKETING_PINK,
  MARKETING_PRIMARY_CTA_CLASS,
  MARKETING_SOFT_SURFACE_CLASS,
  MARKETING_SUBCOPY_CLASS,
} from "@/components/marketing/marketingVisualTheme";
import { insertEmailCapture } from "@/lib/emailCaptureInsert";
import { PALETTE_PLOTTING_APP_STORE_URL } from "@/lib/appStore";
import {
  LIFE_REBRAND_QUIZ_QUESTION_META,
  scoreLifeRebrandQuiz,
  type LifeRebrandQuizResultId,
} from "@/lib/lifeRebrandQuizContent";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { cn } from "@/lib/utils";

type QuizStep = "intro" | "question" | "email" | "result";

const SESSION_KEY = "life_rebrand_quiz_v1";
const QUIZ_PATH = "/quiz/life-rebrand";
const QUIZ_SOURCE = "life_rebrand_quiz";

type SavedQuizState = {
  answers: LifeRebrandQuizResultId[];
  resultId: LifeRebrandQuizResultId;
  email: string;
  firstName: string;
};

function readSavedQuiz(): SavedQuizState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedQuizState;
    if (!parsed?.resultId || !Array.isArray(parsed.answers)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSavedQuiz(state: SavedQuizState) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export default function LifeRebrandQuiz() {
  const { t } = useMarketingTranslation();
  const startedRef = useRef(false);

  const saved = useMemo(() => readSavedQuiz(), []);
  const [step, setStep] = useState<QuizStep>(() => (saved ? "result" : "intro"));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<LifeRebrandQuizResultId[]>(() => saved?.answers ?? []);
  const [resultId, setResultId] = useState<LifeRebrandQuizResultId | null>(() => saved?.resultId ?? null);

  const [email, setEmail] = useState(saved?.email ?? "");
  const [firstName, setFirstName] = useState(saved?.firstName ?? "");
  const [emailError, setEmailError] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const currentQuestion = LIFE_REBRAND_QUIZ_QUESTION_META[questionIndex];
  const totalQuestions = LIFE_REBRAND_QUIZ_QUESTION_META.length;

  const result = resultId
    ? {
        id: resultId,
        title: t(`lifeRebrandQuiz.results.${resultId}.title`),
        explanation: t(`lifeRebrandQuiz.results.${resultId}.explanation`),
        actionStep: t(`lifeRebrandQuiz.results.${resultId}.actionStep`),
        paletteplottingPitch: t(`lifeRebrandQuiz.results.${resultId}.paletteplottingPitch`),
      }
    : null;

  useEffect(() => {
    if (startedRef.current || step !== "intro") return;
    startedRef.current = true;
    trackMarketingConversion("quiz_start", {
      source: QUIZ_SOURCE,
      page_path: QUIZ_PATH,
    });
  }, [step]);

  useEffect(() => {
    if (step !== "question" || !currentQuestion) return;
    trackMarketingConversion("quiz_question_view", {
      source: QUIZ_SOURCE,
      question_id: currentQuestion.id,
      question_index: questionIndex + 1,
      page_path: QUIZ_PATH,
    });
  }, [step, questionIndex, currentQuestion]);

  const goToQuestion = useCallback((index: number) => {
    setQuestionIndex(index);
    setStep("question");
  }, []);

  const handleStart = () => {
    setAnswers([]);
    setResultId(null);
    goToQuestion(0);
  };

  const handleSelectAnswer = (resultCategory: LifeRebrandQuizResultId) => {
    const nextAnswers = [...answers.slice(0, questionIndex), resultCategory];
    setAnswers(nextAnswers);

    if (questionIndex + 1 >= totalQuestions) {
      setStep("email");
      return;
    }

    setQuestionIndex(questionIndex + 1);
  };

  const handleBack = () => {
    if (step === "question" && questionIndex === 0) {
      setStep("intro");
      return;
    }
    if (step === "question" && questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
      return;
    }
    if (step === "email") {
      setQuestionIndex(totalQuestions - 1);
      setStep("question");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError(t("lifeRebrandQuiz.email.emailRequired"));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError(t("lifeRebrandQuiz.email.emailInvalid"));
      return;
    }

    const scored = scoreLifeRebrandQuiz(answers);
    setIsSubmittingEmail(true);

    try {
      const { error: insertError } = await insertEmailCapture({
        email: trimmedEmail,
        first_name: firstName.trim() || null,
        marketing_consent: true,
        source: QUIZ_SOURCE,
        feedback: `result:${scored}`,
      });

      if (insertError) throw insertError;

      trackMarketingConversion("quiz_email_capture", {
        source: QUIZ_SOURCE,
        result_id: scored,
        page_path: QUIZ_PATH,
      });
      trackMarketingConversion("quiz_complete", {
        source: QUIZ_SOURCE,
        result_id: scored,
        content_name: t(`lifeRebrandQuiz.results.${scored}.title`),
        page_path: QUIZ_PATH,
      });

      setResultId(scored);
      writeSavedQuiz({
        answers,
        resultId: scored,
        email: trimmedEmail,
        firstName: firstName.trim(),
      });
      setStep("result");
    } catch (err: unknown) {
      console.error("[LifeRebrandQuiz]", err);
      setEmailError(
        err instanceof Error ? err.message : t("lifeRebrandQuiz.email.genericError"),
      );
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleTrialClick = () => {
    if (!result) return;
    trackMarketingConversion("quiz_cta_click", {
      source: QUIZ_SOURCE,
      result_id: result.id,
      page_path: QUIZ_PATH,
    });
  };

  const progressPercent =
    step === "question"
      ? ((questionIndex + 1) / totalQuestions) * 100
      : step === "email"
        ? 100
        : 0;

  return (
    <MarketingSiteLayout>
      <div className="relative flex-1 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(136,98,158,0.22), transparent 55%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(232,168,196,0.12), transparent 50%)",
          }}
        />

        <div className="relative mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
          {(step === "question" || step === "email") && (
            <div className="mb-8">
              <button
                type="button"
                onClick={handleBack}
                className="mb-5 inline-flex items-center gap-1.5 text-sm text-white/55 transition hover:text-white/85"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {t("lifeRebrandQuiz.nav.back")}
              </button>
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%`, backgroundColor: MARKETING_PINK }}
                />
              </div>
              {step === "question" && (
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-white/45">
                  {t("lifeRebrandQuiz.nav.questionProgress", {
                    current: questionIndex + 1,
                    total: totalQuestions,
                  })}
                </p>
              )}
            </div>
          )}

          {step === "intro" && (
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a8bc]">
                {t("lifeRebrandQuiz.intro.eyebrow")}
              </p>
              <h1 className={cn(MARKETING_DISPLAY_CLASS, "mt-4 text-3xl sm:text-4xl md:text-[2.75rem]")}>
                {t("lifeRebrandQuiz.intro.title")}
              </h1>
              <p className={cn(MARKETING_SUBCOPY_CLASS, "mx-auto mt-5 max-w-lg")}>
                {t("lifeRebrandQuiz.intro.subtitle")}
              </p>
              <p className={cn(MARKETING_BODY_CLASS, "mx-auto mt-3 max-w-md")}>
                {t("lifeRebrandQuiz.intro.meta")}
              </p>
              <Button
                type="button"
                size="lg"
                className={cn(MARKETING_PRIMARY_CTA_CLASS, "mt-10 min-w-[12rem]")}
                onClick={handleStart}
              >
                {t("lifeRebrandQuiz.intro.startCta")}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Button>
            </div>
          )}

          {step === "question" && currentQuestion && (
            <div>
              <h2 className={cn(MARKETING_DISPLAY_CLASS, "text-2xl sm:text-3xl")}>
                {t(`lifeRebrandQuiz.questions.${currentQuestion.id}.prompt`)}
              </h2>
              <ul className="mt-8 space-y-3">
                {currentQuestion.options.map((option) => (
                  <li key={option.key}>
                    <button
                      type="button"
                      onClick={() => handleSelectAnswer(option.resultId)}
                      className={cn(
                        "w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left",
                        "font-sans text-[15px] leading-snug text-white/90 transition",
                        "hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.995]",
                      )}
                    >
                      {t(`lifeRebrandQuiz.questions.${currentQuestion.id}.options.${option.key}`)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === "email" && (
            <div className={cn(MARKETING_SOFT_SURFACE_CLASS, "mx-auto max-w-md")}>
              <div className="text-center">
                <h2 className={cn(MARKETING_DISPLAY_CLASS, "text-2xl sm:text-3xl")}>
                  {t("lifeRebrandQuiz.email.title")}
                </h2>
                <p className={cn(MARKETING_SUBCOPY_CLASS, "mt-3")}>
                  {t("lifeRebrandQuiz.email.subtitle")}
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="mt-8 space-y-3">
                <Input
                  type="email"
                  inputMode="email"
                  placeholder={t("lifeRebrandQuiz.email.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmittingEmail}
                  className="h-12 border-white/10 bg-white/[0.05] text-white placeholder:text-white/35 focus-visible:ring-[#c9a8bc]/40"
                  autoComplete="email"
                  required
                />
                <Input
                  type="text"
                  placeholder={t("lifeRebrandQuiz.email.firstNamePlaceholder")}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSubmittingEmail}
                  className="h-12 border-white/10 bg-white/[0.05] text-white placeholder:text-white/35 focus-visible:ring-[#c9a8bc]/40"
                  autoComplete="given-name"
                />
                <Button
                  type="submit"
                  disabled={isSubmittingEmail || !email.trim()}
                  className={cn(MARKETING_PRIMARY_CTA_CLASS, "mt-2 h-12 w-full")}
                >
                  {isSubmittingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      {t("lifeRebrandQuiz.email.submitting")}
                    </>
                  ) : (
                    t("lifeRebrandQuiz.email.submit")
                  )}
                </Button>
              </form>

              {emailError ? <p className="mt-3 text-sm text-rose-300">{emailError}</p> : null}

              <p className="mt-4 text-center text-[11px] leading-relaxed text-white/40">
                {t("lifeRebrandQuiz.email.consent")}
              </p>
            </div>
          )}

          {step === "result" && result && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a8bc]">
                  {t("lifeRebrandQuiz.result.eyebrow")}
                </p>
                <h1 className={cn(MARKETING_DISPLAY_CLASS, "mt-3 text-3xl sm:text-4xl")}>{result.title}</h1>
              </div>

              <section className={MARKETING_SOFT_SURFACE_CLASS}>
                <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-white/50">
                  {t("lifeRebrandQuiz.result.whatThisMeans")}
                </h2>
                <p className={cn(MARKETING_SUBCOPY_CLASS, "mt-3 text-white/90")}>{result.explanation}</p>
              </section>

              <section className={MARKETING_SOFT_SURFACE_CLASS}>
                <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-white/50">
                  {t("lifeRebrandQuiz.result.actionStepHeading")}
                </h2>
                <p className={cn(MARKETING_SUBCOPY_CLASS, "mt-3 text-white/90")}>{result.actionStep}</p>
              </section>

              <section
                className={cn(
                  MARKETING_SOFT_SURFACE_CLASS,
                  "border border-[#c9a8bc]/20 bg-gradient-to-br from-white/[0.06] to-transparent",
                )}
              >
                <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-[#c9a8bc]">
                  {t("lifeRebrandQuiz.result.recommended")}
                </h2>
                <p className={cn(MARKETING_SUBCOPY_CLASS, "mt-3 text-white/90")}>{result.paletteplottingPitch}</p>
                <p className={cn(MARKETING_BODY_CLASS, "mt-4")}>
                  {t("lifeRebrandQuiz.result.buildPractice")}
                </p>
                <Button size="lg" className={cn(MARKETING_PRIMARY_CTA_CLASS, "mt-6 w-full sm:w-auto")} asChild>
                  <a
                    href={PALETTE_PLOTTING_APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleTrialClick}
                  >
                    {t("lifeRebrandQuiz.result.startTrial")}
                  </a>
                </Button>
              </section>

              <p className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem(SESSION_KEY);
                    setAnswers([]);
                    setResultId(null);
                    setEmail("");
                    setFirstName("");
                    setQuestionIndex(0);
                    setStep("intro");
                    startedRef.current = false;
                  }}
                  className="text-sm text-white/45 underline-offset-2 hover:text-white/70 hover:underline"
                >
                  {t("lifeRebrandQuiz.result.retake")}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </MarketingSiteLayout>
  );
}
