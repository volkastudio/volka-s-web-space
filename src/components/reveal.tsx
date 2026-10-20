import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { easeVolkaOut } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in milliseconds */
  delay?: number;
  /** Vertical travel distance in pixels */
  distance?: number;
};

/**
 * Scroll-triggered reveal powered by Motion.
 * SSR-safe: starts visible on the server via .motion-safe-hidden fallback,
 * animates in seamlessly on the client.
 * Respects prefers-reduced-motion automatically.
 */
export function Reveal({ children, className = "", delay = 0, distance = 32 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });

  return (
    <motion.div
      ref={ref}
      className={`motion-safe-hidden ${className}`}
      initial={{ opacity: 0, y: shouldReduce ? 0 : distance }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.85,
        delay: delay / 1000,
        ease: easeVolkaOut,
      }}
    >
      {children}
    </motion.div>
  );
}
