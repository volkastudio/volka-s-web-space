import { motion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

type ParallaxProps = {
  children: ReactNode;
  /** How many px to travel over the full scroll of the container. Positive = slower than scroll. */
  speed?: number;
  className?: string;
};

/**
 * Wraps an element in a subtle scroll-driven parallax.
 * The child moves `speed` pixels slower than the scroll, creating depth.
 */
export function Parallax({ children, speed = 60, className = "" }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Map scroll progress [0,1] to a y shift [-speed/2, speed/2]
  const y = useTransform(scrollYProgress, [0, 1], [-speed / 2, speed / 2]);

  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      <motion.div style={{ y, scale: 1.08 }}>{children}</motion.div>
    </div>
  );
}
