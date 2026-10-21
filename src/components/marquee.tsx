import { useReducedMotion } from "motion/react";
import { type ReactNode } from "react";
import {
  Sparkles,
  MapPin,
  Globe,
  Cpu,
  TrendingUp,
  Rocket,
  Workflow,
  Compass,
  Layers,
} from "lucide-react";

type MarqueeProps = {
  items?: string[];
  children?: ReactNode;
  speed?: number; // duration in seconds
  reverse?: boolean;
  className?: string;
  variant?: "light" | "dark";
  /** CSS color value for the edge fade-out gradient. Defaults to page background. */
  maskColor?: string;
};

/**
 * Returns an icon suited to the marquee tag
 */
function getMarqueeIcon(item: string) {
  const lower = item.toLowerCase();
  if (lower.includes("cotonou") || lower.includes("bénin") || lower.includes("benin")) {
    return <MapPin className="size-3.5 text-accent transition-transform duration-300 group-hover/pill:scale-125 group-hover/pill:-rotate-12" />;
  }
  if (lower.includes("lagos") || lower.includes("dakar") || lower.includes("abidjan") || lower.includes("paris")) {
    return <Compass className="size-3.5 text-primary/70 transition-transform duration-300 group-hover/pill:scale-125 group-hover/pill:rotate-45" />;
  }
  if (lower.includes("identité") || lower.includes("brand")) {
    return <Sparkles className="size-3.5 text-accent transition-transform duration-300 group-hover/pill:scale-125 group-hover/pill:rotate-180" />;
  }
  if (lower.includes("plateforme") || lower.includes("digital")) {
    return <Globe className="size-3.5 text-accent transition-transform duration-300 group-hover/pill:scale-125 group-hover/pill:rotate-12" />;
  }
  if (lower.includes("architecture") || lower.includes("web")) {
    return <Cpu className="size-3.5 text-accent transition-transform duration-300 group-hover/pill:scale-125 group-hover/pill:rotate-90" />;
  }
  if (lower.includes("conversion")) {
    return <TrendingUp className="size-3.5 text-accent transition-transform duration-300 group-hover/pill:scale-125 group-hover/pill:-translate-y-0.5 group-hover/pill:translate-x-0.5" />;
  }
  if (lower.includes("panafricain")) {
    return <Rocket className="size-3.5 text-accent transition-transform duration-300 group-hover/pill:scale-125 group-hover/pill:-rotate-12" />;
  }
  if (lower.includes("système") || lower.includes("automatisation")) {
    return <Workflow className="size-3.5 text-accent transition-transform duration-300 group-hover/pill:scale-125 group-hover/pill:rotate-90" />;
  }
  return <Layers className="size-3.5 text-accent transition-transform duration-300 group-hover/pill:scale-125" />;
}

/**
 * Marquee Component:
 * - Light background by default, dark green text (primary).
 * - Slides horizontally nonstop.
 * - Pauses completely in place when the cursor hovers ("se pose quand le curseur est dessus").
 * - Individual micro-icons react to cursor contact on hover.
 * - Seamless GPU-accelerated infinite ticker.
 */
export function Marquee({
  items,
  children,
  speed = 34,
  reverse = false,
  className = "",
  variant = "light",
  maskColor,
}: MarqueeProps) {
  const shouldReduce = useReducedMotion();

  const isLight = variant === "light";

  const defaultMaskLeft = isLight
    ? "linear-gradient(to right, var(--background, #FAF7EE) 0%, transparent 100%)"
    : "linear-gradient(to right, var(--primary, #0D2A20) 0%, transparent 100%)";

  const defaultMaskRight = isLight
    ? "linear-gradient(to left, var(--background, #FAF7EE) 0%, transparent 100%)"
    : "linear-gradient(to left, var(--primary, #0D2A20) 0%, transparent 100%)";

  const gradientLeft = maskColor
    ? `linear-gradient(to right, ${maskColor}, transparent)`
    : defaultMaskLeft;

  const gradientRight = maskColor
    ? `linear-gradient(to left, ${maskColor}, transparent)`
    : defaultMaskRight;

  const pillStyle = isLight
    ? "border-primary/15 bg-primary/[0.04] text-primary hover:border-primary/40 hover:bg-primary/[0.09] hover:shadow-sm"
    : "border-primary-foreground/15 bg-primary-foreground/5 text-primary-foreground hover:border-mint hover:bg-mint/10";

  const content = children ? (
    children
  ) : items ? (
    <div className="flex items-center gap-4 md:gap-6">
      {items.map((item, idx) => {
        const isCity = item.includes(",");
        return (
          <span
            key={idx}
            className={`group/pill inline-flex cursor-pointer items-center gap-2.5 rounded-full border px-4 py-2 text-xs md:text-sm font-medium tracking-[0.14em] uppercase backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 ${pillStyle} ${
              isCity ? "font-semibold" : ""
            }`}
          >
            {getMarqueeIcon(item)}
            <span className="whitespace-nowrap">{item}</span>
          </span>
        );
      })}
    </div>
  ) : null;

  if (shouldReduce) {
    return (
      <div className={`overflow-x-auto py-3 ${className}`}>
        <div className="flex gap-4 md:gap-6 whitespace-nowrap">{content}</div>
      </div>
    );
  }

  return (
    <div
      className={`marquee-container group relative overflow-hidden py-2 ${className}`}
      style={{ ["--marquee-duration" as string]: `${speed}s` }}
    >
      {/* Edge gradient masks for smooth fade-in/fade-out */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 md:w-28"
        style={{ background: gradientLeft }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 md:w-28"
        style={{ background: gradientRight }}
      />

      {/* Sliding track with CSS animation — pauses immediately on hover */}
      <div className={reverse ? "marquee-track-reverse" : "marquee-track"}>
        <div className="flex shrink-0 items-center gap-4 md:gap-6 pr-4 md:pr-6">
          {content}
        </div>
        <div className="flex shrink-0 items-center gap-4 md:gap-6 pr-4 md:pr-6" aria-hidden="true">
          {content}
        </div>
      </div>
    </div>
  );
}
