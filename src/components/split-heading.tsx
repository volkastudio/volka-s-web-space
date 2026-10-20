import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

type SplitHeadingProps = {
  /** The heading text — will be split word-by-word */
  children: string;
  /** HTML tag to render */
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
  /** Stagger base delay in ms before the first word animates */
  startDelay?: number;
};

/**
 * Splits a heading into individual words and staggers them in on scroll.
 * Uses a clip-path wipe so each word rises into view cleanly.
 */
export function SplitHeading({
  children,
  as: Tag = "h2",
  className = "",
  startDelay = 0,
}: SplitHeadingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "0px 0px -6% 0px" });

  const words = children.split(" ");

  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.07,
        delayChildren: startDelay / 1000,
      },
    },
  };

  const word = {
    hidden: shouldReduce ? {} : { y: "110%", opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={container}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      style={{ display: "block" }}
    >
      <Tag style={{ display: "flex", flexWrap: "wrap", gap: "0 0.28em", lineHeight: "inherit" }}>
        {words.map((w, i) => (
          <span key={i} style={{ overflow: "hidden", display: "inline-block" }}>
            <motion.span style={{ display: "inline-block" }} variants={word}>
              {w}
            </motion.span>
          </span>
        ))}
      </Tag>
    </motion.div>
  );
}
