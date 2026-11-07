import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react";

import { TealBackground } from "@/components/teal-background";

// ---------------------------------------------------------------------------
// One question per screen.
//
// - The parent owns the answers (its own useState). It rebuilds the `questions` list on every
//   render, so questions can appear or disappear depending on earlier answers.
// - The flow owns only the position, the animation, validation display and the buttons.
// - Single-choice questions can move on by themselves right after a tap (`autoAdvance`).
// - Enter moves on in text fields. Ctrl/Cmd + Enter moves on in text areas.
// ---------------------------------------------------------------------------

export type FlowQuestion = {
  id: string;
  /** Used for analytics: which block of the old multi-step form this question belongs to. */
  group?: number | undefined;
  title: React.ReactNode;
  hint?: React.ReactNode | undefined;
  /** Optional questions show a "Skip" link and are never blocked by validation. */
  optional?: boolean | undefined;
  /** Single-choice questions move on 0.25s after a tap. */
  autoAdvance?: boolean | undefined;
  /** Return an error message to block the move, or null when the answer is fine. */
  validate?: (() => string | null) | undefined;
  children: React.ReactNode;
};

export type FlowLabels = {
  next: string;
  back: string;
  skip: string;
  submit: string;
  submitting: string;
  exit: string;
};

/** Rectangular buttons everywhere. Only the EN/FR toggle is a pill. */
export const flowPrimaryButton =
  "inline-flex h-14 items-center justify-center gap-2 rounded-sm bg-ochre px-9 text-base font-semibold text-forest-black transition hover:bg-ochre/90 active:scale-[0.98]";
export const flowSecondaryButton =
  "inline-flex h-14 items-center justify-center gap-2 rounded-sm border border-paper/30 px-9 text-base font-medium text-paper transition hover:border-mint hover:text-mint";

type FlowContextValue = { autoAdvance: boolean; advance: () => void };
const FlowContext = React.createContext<FlowContextValue>({ autoAdvance: false, advance: () => {} });

/** Shared page frame: calm background, logo, and a way out. */
export function FlowFrame({
  exitHref,
  exitLabel,
  children,
}: {
  exitHref: string;
  exitLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate flex min-h-svh flex-col bg-[#070a09] font-sans text-paper selection:bg-mint selection:text-forest-black">
      <TealBackground variant="quiet" fixed />
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-8 sm:pt-6">
        <span className="size-11" aria-hidden="true" />
        <a
          href="/"
          className="inline-flex items-center gap-2.5 font-display text-xl tracking-tight text-paper transition-colors hover:text-mint"
        >
          <img src="/volka-icon-light.png" alt="" className="size-6 object-contain" />
          <span>VOLKA</span>
        </a>
        <a
          href={exitHref}
          aria-label={exitLabel}
          className="inline-flex size-11 items-center justify-center rounded-sm text-paper/70 transition hover:bg-paper/10 hover:text-paper"
        >
          <X className="size-5" />
        </a>
      </header>
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

/** The page shown before the first question: what to expect, so nobody feels rushed. */
export function FlowIntro({
  eyebrow,
  title,
  body,
  facts,
  startLabel,
  onStart,
  exitHref,
  exitLabel,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body: React.ReactNode;
  facts: { value: string; label: string }[];
  startLabel: string;
  onStart: () => void;
  exitHref: string;
  exitLabel: string;
}) {
  const reduce = useReducedMotion();
  return (
    <FlowFrame exitHref={exitHref} exitLabel={exitLabel}>
      <main className="flex flex-1 flex-col justify-center px-5 pb-6 pt-6 sm:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-xl"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-mint">{eyebrow}</p>
          <h1 className="mt-4 text-balance font-display text-[2.4rem] font-medium leading-[1.05] tracking-[-0.01em] text-paper sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 text-pretty text-base leading-relaxed text-paper/70 sm:text-lg">{body}</p>

          <dl className="mt-9 grid grid-cols-3 gap-3 border-y border-paper/10 py-5">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="font-display text-2xl text-paper sm:text-3xl">{fact.value}</dt>
                <dd className="mt-1 text-xs leading-snug text-paper/55 sm:text-sm">{fact.label}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </main>

      <div className="sticky bottom-0 z-20 bg-gradient-to-t from-[#070a09] via-[#070a09]/95 to-transparent px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-xl">
          <button type="button" onClick={onStart} className={`${flowPrimaryButton} w-full sm:w-auto`}>
            {startLabel}
            <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
    </FlowFrame>
  );
}

export function QuestionFlow({
  questions,
  initialIndex = 0,
  labels,
  exitHref,
  onSubmit,
  onStep,
  submitting = false,
  error = null,
  honeypot,
}: {
  questions: FlowQuestion[];
  initialIndex?: number | undefined;
  labels: FlowLabels;
  exitHref: string;
  onSubmit: () => void | Promise<void>;
  onStep?: ((question: FlowQuestion, index: number) => void) | undefined;
  submitting?: boolean | undefined;
  error?: string | null | undefined;
  honeypot?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const total = questions.length;
  const [index, setIndex] = React.useState(() => Math.max(0, Math.min(initialIndex, total - 1)));
  const [direction, setDirection] = React.useState(1);
  const [problem, setProblem] = React.useState<string | null>(null);

  const safeIndex = Math.min(index, total - 1);
  const question = questions[safeIndex];
  const isLast = safeIndex === total - 1;

  const onStepRef = React.useRef(onStep);
  onStepRef.current = onStep;
  React.useEffect(() => {
    if (question) onStepRef.current?.(question, safeIndex);
    // Only when the question changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  const move = (to: number, dir: number) => {
    setProblem(null);
    setDirection(dir);
    setIndex(to);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  const go = (skipping = false) => {
    if (!question || submitting) return;
    if (!skipping) {
      const message = question.validate?.() ?? null;
      if (message) {
        setProblem(message);
        return;
      }
    }
    if (isLast) {
      void onSubmit();
      return;
    }
    move(safeIndex + 1, 1);
  };

  // Auto-advance timers read the latest `go`, so they never see a stale answer.
  const goRef = React.useRef(go);
  goRef.current = go;
  const advance = React.useCallback(() => goRef.current(), []);

  const back = () => {
    if (safeIndex > 0) move(safeIndex - 1, -1);
  };

  if (!question) return null;

  const progress = ((safeIndex + 1) / total) * 100;

  return (
    <div className="relative isolate flex min-h-svh flex-col bg-[#070a09] font-sans text-paper selection:bg-mint selection:text-forest-black">
      <TealBackground variant="quiet" fixed />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-8 sm:pt-6">
        {safeIndex > 0 ? (
          <button
            type="button"
            onClick={back}
            aria-label={labels.back}
            className="inline-flex size-11 items-center justify-center rounded-sm text-paper/70 transition hover:bg-paper/10 hover:text-paper"
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : (
          <span className="size-11" aria-hidden="true" />
        )}

        <a
          href="/"
          className="inline-flex items-center gap-2.5 font-display text-xl tracking-tight text-paper transition-colors hover:text-mint"
        >
          <img src="/volka-icon-light.png" alt="" className="size-6 object-contain" />
          <span>VOLKA</span>
        </a>

        <a
          href={exitHref}
          aria-label={labels.exit}
          className="inline-flex size-11 items-center justify-center rounded-sm text-paper/70 transition hover:bg-paper/10 hover:text-paper"
        >
          <X className="size-5" />
        </a>
      </header>

      {/* Progress */}
      <div
        className="relative z-10 mx-4 h-[3px] overflow-hidden rounded-full bg-paper/10 sm:mx-8"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={safeIndex + 1}
      >
        <div
          className="h-full rounded-full bg-mint transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <form
        className="relative z-10 flex flex-1 flex-col"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        onKeyDown={(e) => {
          // Textareas keep Enter for new lines; Ctrl/Cmd + Enter moves on.
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            go();
          }
        }}
        onInputCapture={() => setProblem(null)}
      >
        {honeypot}

        <main className="flex flex-1 flex-col justify-center px-5 pb-10 pt-6 sm:px-8">
          <div className="mx-auto w-full max-w-xl">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={question.id}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 28 }),
                  center: { opacity: 1, x: 0 },
                  exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -28 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-paper/45">
                  {safeIndex + 1} / {total}
                </p>
                <h1 className="mt-4 text-balance font-display text-[2.1rem] font-medium leading-[1.08] tracking-[-0.01em] text-paper sm:text-5xl">
                  {question.title}
                </h1>
                {question.hint && (
                  <p className="mt-3 text-pretty text-sm leading-relaxed text-paper/60 sm:text-base">
                    {question.hint}
                  </p>
                )}

                <FlowContext.Provider value={{ autoAdvance: Boolean(question.autoAdvance), advance }}>
                  <div className="mt-8 sm:mt-10">{question.children}</div>
                </FlowContext.Provider>

                {(problem ?? (isLast ? error : null)) && (
                  <p role="alert" className="mt-5 flex items-start gap-2 text-sm text-gold">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{problem ?? error}</span>
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Action bar: stays reachable above the phone keyboard */}
        <div className="sticky bottom-0 z-20 bg-gradient-to-t from-[#070a09] via-[#070a09]/95 to-transparent px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 sm:px-8">
          <div className="mx-auto flex w-full max-w-xl flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
            {question.optional && !isLast ? (
              <button
                type="button"
                onClick={() => go(true)}
                className="min-h-11 px-4 text-sm text-paper/60 underline underline-offset-4 transition hover:text-paper"
              >
                {labels.skip}
              </button>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`${flowPrimaryButton} w-full sm:w-auto disabled:opacity-70`}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  {labels.submitting}
                </>
              ) : (
                <>
                  {isLast ? labels.submit : labels.next}
                  {!isLast && <ArrowRight className="size-5" />}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Answer building blocks
// ---------------------------------------------------------------------------

const underlineField =
  "w-full rounded-none border-0 border-b border-paper/25 bg-transparent px-0 py-3 font-light text-paper outline-none transition-colors placeholder:text-paper/30 focus:border-mint";

export function FlowInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      autoFocus
      {...rest}
      className={`${underlineField} text-2xl sm:text-3xl ${className}`}
    />
  );
}

export function FlowTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", rows = 4, ...rest } = props;
  return (
    <textarea
      autoFocus
      rows={rows}
      {...rest}
      className={`${underlineField} resize-none text-xl leading-snug sm:text-2xl ${className}`}
    />
  );
}

export type ChoiceOption = {
  value: string;
  label: string;
  description?: string | undefined;
  badge?: string | undefined;
  icon?: React.ReactNode;
};

const cardBase =
  "group flex w-full items-center gap-4 rounded-md border px-5 py-4 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint";
const cardIdle = "border-paper/15 bg-paper/[0.03] hover:border-paper/40 hover:bg-paper/[0.06]";
const cardOn = "border-mint bg-mint/10";

function Indicator({ on, round }: { on: boolean; round: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-6 shrink-0 items-center justify-center border transition-colors ${
        round ? "rounded-full" : "rounded-md"
      } ${on ? "border-mint bg-mint text-forest-black" : "border-paper/30"}`}
    >
      {on && <Check className="size-3.5 stroke-[3]" />}
    </span>
  );
}

function OptionBody({ option }: { option: ChoiceOption }) {
  return (
    <>
      {option.icon && <span className="shrink-0 text-paper/70">{option.icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-base text-paper sm:text-lg">{option.label}</span>
          {option.badge && (
            <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold">
              {option.badge}
            </span>
          )}
        </span>
        {option.description && (
          <span className="mt-1 block text-sm leading-snug text-paper/60">{option.description}</span>
        )}
      </span>
    </>
  );
}

/** Pick one. Moves on by itself when the question has `autoAdvance`. */
export function ChoiceList({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const { autoAdvance, advance } = React.useContext(FlowContext);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2.5">
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => {
              onChange(option.value);
              if (autoAdvance) {
                window.clearTimeout(timer.current);
                timer.current = window.setTimeout(advance, 260);
              }
            }}
            className={`${cardBase} ${on ? cardOn : cardIdle}`}
          >
            <OptionBody option={option} />
            <Indicator on={on} round />
          </button>
        );
      })}
    </div>
  );
}

/** Pick several. */
export function MultiChoiceList({
  options,
  values,
  onToggle,
  label,
}: {
  options: readonly ChoiceOption[];
  values: readonly string[];
  onToggle: (value: string) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="grid gap-2.5">
      {options.map((option) => {
        const on = values.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => onToggle(option.value)}
            className={`${cardBase} ${on ? cardOn : cardIdle}`}
          >
            <Indicator on={on} round={false} />
            <OptionBody option={option} />
          </button>
        );
      })}
    </div>
  );
}

/** A large tick box for confirmations. */
export function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-4 rounded-md border px-5 py-4 transition-colors ${
        checked ? cardOn : cardIdle
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-mint ${
          checked ? "border-mint bg-mint text-forest-black" : "border-paper/30"
        }`}
      >
        {checked && <Check className="size-3.5 stroke-[3]" />}
      </span>
      <span className="text-sm leading-relaxed text-paper/85 sm:text-base">{children}</span>
    </label>
  );
}
