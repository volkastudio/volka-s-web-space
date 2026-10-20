import { motion, useInView, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef } from "react";

type CountUpProps = {
  /** Target number */
  to: number;
  /** Optional prefix (e.g. "€") */
  prefix?: string;
  /** Optional suffix (e.g. "+" or "k") */
  suffix?: string;
  /** Duration in seconds */
  duration?: number;
  className?: string;
};

/**
 * Animates a number from 0 to `to` when it enters the viewport.
 */
export function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 1.8,
  className = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shouldReduce = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (v) => `${prefix}${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (isInView && !shouldReduce) spring.set(to);
    if (shouldReduce) spring.set(to);
  }, [isInView, to, spring, shouldReduce]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}
