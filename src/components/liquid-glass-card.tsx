import { motion, useReducedMotion } from "motion/react";
import { useState, useRef, type ReactNode, type PointerEvent } from "react";
import { easeLiquid } from "@/lib/motion";

type LiquidGlassCardProps = {
  children: ReactNode;
  className?: string;
  variant?: "dark" | "light" | "forest";
  glow?: boolean;
  interactive?: boolean;
};

/**
 * LiquidGlassCard:
 * A premium frosted glass surface with interactive specular light refraction.
 *
 * Features:
 * - Dynamic liquid specular highlight tracking pointer coordinates
 * - Translucent chromatic border with inner reflection
 * - Ambient liquid glow backdrop
 * - 60fps GPU acceleration, accessible fallback under prefers-reduced-motion
 */
export function LiquidGlassCard({
  children,
  className = "",
  variant = "dark",
  glow = true,
  interactive = true,
}: LiquidGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();
  const [coords, setCoords] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!interactive || shouldReduce || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCoords({ x, y, active: true });
  };

  const handlePointerLeave = () => {
    setCoords((prev) => ({ ...prev, active: false }));
  };

  const variantStyles = {
    dark: "bg-primary/40 border-primary-foreground/15 text-primary-foreground shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]",
    forest: "bg-forest/60 border-mint/20 text-primary-foreground shadow-[0_8px_32px_0_rgba(7,24,19,0.35)]",
    light: "bg-background/70 border-border/60 text-foreground shadow-[0_8px_30px_0_rgba(0,0,0,0.06)]",
  };

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      whileHover={interactive && !shouldReduce ? { y: -4, transition: { duration: 0.35, ease: easeLiquid } } : {}}
      className={`relative overflow-hidden rounded-xl border backdrop-blur-xl backdrop-saturate-150 transition-colors duration-500 ${variantStyles[variant]} ${className}`}
      style={{
        ["--mouse-x" as string]: `${coords.x}%`,
        ["--mouse-y" as string]: `${coords.y}%`,
      } as any}
    >
      {/* Ambient liquid glow orb in the background */}
      {glow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px -z-10 opacity-40 blur-2xl transition-opacity duration-700"
          style={{
            background:
              variant === "light"
                ? "radial-gradient(circle at 50% 0%, oklch(0.82 0.055 168.8 / 15%), transparent 70%)"
                : "radial-gradient(circle at 50% 0%, oklch(0.82 0.055 168.8 / 25%), oklch(0.69 0.151 65.8 / 10%), transparent 70%)",
          }}
        />
      )}

      {/* Dynamic liquid specular reflection on pointer hover */}
      {interactive && !shouldReduce && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            opacity: coords.active ? 1 : 0,
            background: `radial-gradient(circle 280px at var(--mouse-x) var(--mouse-y), ${
              variant === "light" ? "rgba(255, 255, 255, 0.6)" : "oklch(0.82 0.055 168.8 / 14%)"
            }, transparent 80%)`,
          }}
        />
      )}

      {/* Subtle top edge liquid rim highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />

      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
