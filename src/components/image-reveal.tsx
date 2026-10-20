import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { easeVolkaOut, durations } from "@/lib/motion";

type ImageRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/**
 * ImageReveal component:
 * Premium cinematic clip-path wipe with subtle scale drift.
 * Uses an elegant directional mask reveal inspired by luxury editorial sites.
 */
export function ImageReveal({
  children,
  className = "",
  delay = 0,
}: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Mask container */}
      <motion.div
        initial={{ clipPath: "inset(0% 0% 100% 0%)", scale: 1.08 }}
        animate={
          isInView
            ? { clipPath: "inset(0% 0% 0% 0%)", scale: 1 }
            : { clipPath: "inset(0% 0% 100% 0%)", scale: 1.08 }
        }
        transition={{
          duration: durations.deliberate,
          delay: delay / 1000,
          ease: easeVolkaOut,
        }}
        className="h-full w-full"
      >
        {children}
      </motion.div>

      {/* Shimmer glaze over the image upon reveal */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0.6, y: "-100%" }}
        animate={isInView ? { opacity: 0, y: "100%" } : {}}
        transition={{
          duration: 1.2,
          delay: (delay + 100) / 1000,
          ease: easeVolkaOut,
        }}
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-white/20 to-transparent"
      />
    </div>
  );
}
