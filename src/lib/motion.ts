/**
 * Motion Tokens & Animation Presets for Volka
 *
 * Principles:
 * - Motion explains hierarchy, never blocks reading.
 * - Always respect `prefers-reduced-motion`.
 * - 60fps GPU-accelerated transforms and opacities only.
 */

export const easeVolkaOut = [0.22, 1, 0.36, 1] as const;
export const easeVolkaInOut = [0.76, 0, 0.24, 1] as const;
export const easeLiquid = [0.16, 1, 0.3, 1] as const;

export const durations = {
  instant: 0.15,
  fast: 0.35,
  normal: 0.65,
  deliberate: 0.9,
  ambient: 2.4,
} as const;

export const staggers = {
  fast: 0.04,
  normal: 0.08,
  slow: 0.12,
} as const;

export const springs = {
  snappy: { stiffness: 450, damping: 28 },
  liquid: { stiffness: 220, damping: 22, mass: 0.8 },
  floating: { stiffness: 90, damping: 14 },
} as const;

/**
 * Transition variants for liquid glass cards, specular highlights, and reveals
 */
export const liquidGlassVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: durations.normal,
      ease: easeLiquid,
    },
  },
  hover: {
    y: -4,
    scale: 1.01,
    transition: {
      duration: durations.fast,
      ease: easeVolkaOut,
    },
  },
} as const;
