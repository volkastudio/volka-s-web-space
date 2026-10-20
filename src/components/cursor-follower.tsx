import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { springs } from "@/lib/motion";

type CursorFollowerProps = {
  children: ReactNode;
  label?: string;
  className?: string;
};

/**
 * CursorFollower:
 * Floating frosted glass badge that smoothly tracks pointer movement over cards.
 * Desktop only; disabled on touch devices and under prefers-reduced-motion.
 */
export function CursorFollower({
  children,
  label = "View",
  className = "",
}: CursorFollowerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const shouldReduce = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = springs.snappy;
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Detect touch-only screen
    if (typeof window !== "undefined") {
      setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || shouldReduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className={`relative ${className}`}
    >
      {children}

      {!isTouchDevice && !shouldReduce && (
        <motion.div
          aria-hidden="true"
          style={{
            x: smoothX,
            y: smoothY,
            translateX: "-50%",
            translateY: "-50%",
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.5,
          }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute left-0 top-0 z-30 flex items-center gap-1.5 rounded-full border border-mint/40 bg-forest/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        >
          <span>{label}</span>
          <ArrowUpRight className="size-3.5 text-gold" />
        </motion.div>
      )}
    </div>
  );
}
