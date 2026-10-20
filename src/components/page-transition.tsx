import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "motion/react";
import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

type PageTransitionProps = {
  children: ReactNode;
};

/**
 * Wraps every page in a subtle fade + upward-rise transition.
 * AnimatePresence keys on the pathname so navigation between routes triggers the animation.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const shouldReduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: shouldReduce ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: shouldReduce ? 0 : -8 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
