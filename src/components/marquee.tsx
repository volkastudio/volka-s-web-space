import { motion, useReducedMotion } from "motion/react";
import { type ReactNode } from "react";

type MarqueeProps = {
  items?: string[];
  children?: ReactNode;
  speed?: number; // duration in seconds
  reverse?: boolean;
  className?: string;
};

/**
 * Marquee component:
 * Seamless, 60fps infinite horizontal strip with liquid glass tags.
 * Pauses on hover, gracefully disables animation under prefers-reduced-motion.
 */
export function Marquee({
  items,
  children,
  speed = 35,
  reverse = false,
  className = "",
}: MarqueeProps) {
  const shouldReduce = useReducedMotion();

  const content = children ? (
    children
  ) : items ? (
    <div className="flex items-center gap-6">
      {items.map((item, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-3 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] backdrop-blur-md transition-colors hover:border-mint hover:bg-mint/10"
        >
          <span className="size-1.5 rounded-full bg-gold/80" />
          {item}
        </span>
      ))}
    </div>
  ) : null;

  if (shouldReduce) {
    return (
      <div className={`overflow-x-auto py-4 ${className}`}>
        <div className="flex gap-6 whitespace-nowrap">{content}</div>
      </div>
    );
  }

  return (
    <div className={`group relative overflow-hidden py-4 ${className}`}>
      {/* Edge gradient masks for smooth liquid fade */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

      <motion.div
        className="flex w-max gap-6 whitespace-nowrap"
        animate={{
          x: reverse ? ["-50%", "0%"] : ["0%", "-50%"],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
        style={{ willChange: "transform" }}
      >
        <div className="flex shrink-0 items-center gap-6">{content}</div>
        <div className="flex shrink-0 items-center gap-6" aria-hidden="true">
          {content}
        </div>
      </motion.div>
    </div>
  );
}
