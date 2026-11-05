import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { TargetAndTransition, Transition } from "motion/react";
import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

// ─── Preset catalogue ────────────────────────────────────────────────────────

export type TransitionPreset =
  | "fade"    // Clean opacity only — minimal
  | "slide"   // Horizontal slide — modern default
  | "rise"    // Vertical fade-up — editorial
  | "clip"    // Clip-path reveal from left — magazine
  | "scale"   // Zoom-in entry, zoom-out exit — immersive
  | "blur";   // Blur + opacity — glassmorphism

type BezierTuple = [number, number, number, number];

interface VariantSet {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
  transition: Transition;
}

// All presets respect `prefers-reduced-motion` when shouldReduce = true.
function getVariants(preset: TransitionPreset, shouldReduce: boolean): VariantSet {
  if (shouldReduce) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.18, ease: "easeInOut" as const },
    };
  }

  const smooth: BezierTuple = [0.22, 1, 0.36, 1];
  const snappy: BezierTuple = [0.76, 0, 0.24, 1];

  switch (preset) {
    case "fade":
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3, ease: "easeInOut" as const },
      };

    case "slide":
      return {
        initial: { opacity: 0, x: 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -16 },
        transition: { duration: 0.38, ease: smooth },
      };

    case "rise":
      return {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
        transition: { duration: 0.4, ease: smooth },
      };

    case "clip":
      return {
        initial: { clipPath: "inset(0 100% 0 0)" } as TargetAndTransition,
        animate: { clipPath: "inset(0 0% 0 0)" } as TargetAndTransition,
        exit: { clipPath: "inset(0 0 0 100%)" } as TargetAndTransition,
        transition: { duration: 0.5, ease: snappy },
      };

    case "scale":
      return {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.02 },
        transition: { duration: 0.35, ease: smooth },
      };

    case "blur":
      return {
        initial: { opacity: 0, filter: "blur(8px)" },
        animate: { opacity: 1, filter: "blur(0px)" },
        exit: { opacity: 0, filter: "blur(6px)" },
        transition: { duration: 0.4, ease: smooth },
      };

    default:
      return getVariants("rise", shouldReduce);
  }
}

// ─── Public component API ─────────────────────────────────────────────────────

export interface PageTransitionProps {
  children: ReactNode;
  /** When false, children are rendered without any animation wrapper. */
  enabled?: boolean;
  /** Which animation preset to use. Defaults to "rise". */
  preset?: TransitionPreset;
}

/**
 * Wraps every page in a configurable transition animation.
 * `enabled` and `preset` come from the backoffice site_settings["appearance"].
 * AnimatePresence keys on the pathname, so navigation triggers the animation.
 */
export function PageTransition({
  children,
  enabled = true,
  preset = "rise",
}: PageTransitionProps) {
  const location = useLocation();
  const shouldReduce = useReducedMotion();

  if (!enabled) {
    return <>{children}</>;
  }

  const { initial, animate, exit, transition } = getVariants(
    preset,
    shouldReduce ?? false,
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Preset label map (used in admin UI) ─────────────────────────────────────

export const PRESET_LABELS: Record<
  TransitionPreset,
  { fr: string; en: string; description: string }
> = {
  fade: {
    fr: "Fondu",
    en: "Fade",
    description: "Simple opacité — le plus discret",
  },
  slide: {
    fr: "Glissement",
    en: "Slide",
    description: "Glissement horizontal fluide",
  },
  rise: {
    fr: "Élévation",
    en: "Rise",
    description: "Montée verticale douce — éditoriale",
  },
  clip: {
    fr: "Rideau",
    en: "Curtain",
    description: "Révélation en rideau — magazine",
  },
  scale: {
    fr: "Zoom",
    en: "Scale",
    description: "Légère mise au point — immersif",
  },
  blur: {
    fr: "Flou",
    en: "Blur",
    description: "Entrée par le flou — glassmorphism",
  },
};
