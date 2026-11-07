import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Teal animated backgrounds, built with CSS only (no image, no blur filter).
//
//   variant="lines"  -> vertical architectural slats lit by a slow moving light (homepage hero)
//   variant="glow"   -> dark scene with a large teal ring of light + grain (audit, /tools)
//
// How it stays cheap and readable:
//   - Only `transform` is animated, on 2 big gradient layers (GPU-composited, no repaint).
//   - Softness comes from the gradients themselves, never from `filter: blur()`.
//   - The slats are a STATIC layer on top of the moving light: the light slides "behind" them.
//   - Slat pitch is an integer number of CSS pixels per breakpoint, to avoid moiré on phones.
//   - A grain tile hides gradient banding on dark screens.
//   - A scrim keeps the text zone dark: the light never sits right behind the headline.
//   - Animation pauses when the section is off screen, and is off for prefers-reduced-motion.
//
// The parent must be `relative` (and should clip with `overflow-hidden`). Put the content
// above it with `relative z-10`.
// ---------------------------------------------------------------------------

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

const CSS = `
.tb{position:absolute;inset:0;overflow:hidden;pointer-events:none;contain:paint;background:var(--tb-base)}
.tb-lines{--tb-base:#00130f;--pitch:16px}
.tb-glow{--tb-base:#000807}
.tb-quiet{--tb-base:#070a09}
@media (min-width:768px){.tb-lines{--pitch:22px}}
@media (min-width:1280px){.tb-lines{--pitch:28px}}
@media (min-width:1920px){.tb-lines{--pitch:34px}}
.tb-light,.tb-slats,.tb-scrim,.tb-grain{position:absolute}
.tb-light{will-change:transform}

.tb-lines .tb-a{right:-40%;top:-12%;width:120%;height:125%;
  background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(0,196,164,.50) 0%,rgba(0,150,128,.30) 34%,rgba(0,96,82,.12) 60%,rgba(0,96,82,0) 78%);
  animation:tb-a 26s ease-in-out infinite alternate}
.tb-lines .tb-b{left:-45%;top:22%;width:90%;height:75%;
  background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(232,220,182,.30) 0%,rgba(150,176,146,.14) 40%,rgba(150,176,146,0) 72%);
  animation:tb-b 34s ease-in-out infinite alternate}
@keyframes tb-a{from{transform:translate3d(-22%,-6%,0) scale(.92)}to{transform:translate3d(6%,8%,0) scale(1.08)}}
@keyframes tb-b{from{transform:translate3d(-4%,6%,0) scale(1)}to{transform:translate3d(46%,-8%,0) scale(1.12)}}

.tb-slats{inset:0;
  background-image:repeating-linear-gradient(90deg,rgba(0,10,8,0) 0,rgba(0,10,8,0) calc(var(--pitch)*.06),rgba(0,10,8,.36) calc(var(--pitch)*.55),rgba(0,10,8,.84) calc(var(--pitch)*.94),rgba(0,10,8,0) var(--pitch));
  -webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 38%,rgba(0,0,0,.55) 100%);
  mask-image:linear-gradient(to bottom,#000 0%,#000 38%,rgba(0,0,0,.55) 100%)}

.tb-lines .tb-scrim{inset:0;background:
  linear-gradient(to top,rgba(0,12,10,.86) 0%,rgba(0,12,10,.5) 26%,rgba(0,12,10,0) 60%),
  linear-gradient(to bottom,rgba(0,12,10,.55) 0%,rgba(0,12,10,0) 20%),
  radial-gradient(ellipse 120% 90% at 50% 50%,rgba(0,8,7,0) 55%,rgba(0,8,7,.55) 100%)}
@media (min-width:768px){.tb-lines .tb-scrim{background:
  linear-gradient(to right,rgba(0,12,10,.62) 0%,rgba(0,12,10,.2) 40%,rgba(0,12,10,0) 62%),
  linear-gradient(to top,rgba(0,12,10,.8) 0%,rgba(0,12,10,.3) 30%,rgba(0,12,10,0) 58%),
  linear-gradient(to bottom,rgba(0,12,10,.5) 0%,rgba(0,12,10,0) 18%),
  radial-gradient(ellipse 120% 90% at 50% 50%,rgba(0,8,7,0) 55%,rgba(0,8,7,.5) 100%)}}

.tb-glow .tb-a{right:-70%;top:-14%;width:190%;height:150%;
  background:radial-gradient(circle farthest-side at 62% 70%,rgba(2,22,18,0) 0%,rgba(4,48,41,.55) 34%,rgba(8,130,110,.72) 52%,rgba(10,170,142,.62) 58%,rgba(6,100,86,.28) 68%,rgba(0,40,34,0) 82%);
  animation:tb-g1 28s ease-in-out infinite alternate}
.tb-glow .tb-b{left:-50%;bottom:-30%;width:120%;height:70%;
  background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(0,170,142,.30) 0%,rgba(0,110,94,.14) 45%,rgba(0,110,94,0) 75%);
  animation:tb-g2 36s ease-in-out infinite alternate}
@keyframes tb-g1{from{transform:translate3d(-6%,-3%,0) scale(.97)}to{transform:translate3d(5%,4%,0) scale(1.06)}}
@keyframes tb-g2{from{transform:translate3d(-8%,4%,0) scale(1)}to{transform:translate3d(14%,-6%,0) scale(1.1)}}
.tb-glow .tb-scrim{inset:0;background:
  radial-gradient(ellipse 78% 66% at 50% 50%,rgba(0,8,7,.7) 0%,rgba(0,8,7,.5) 55%,rgba(0,8,7,0) 100%),
  linear-gradient(to bottom,rgba(0,8,7,.5) 0%,rgba(0,8,7,0) 18%)}

/* quiet variant: near-black with two very faint teal lights (forms). Nothing bright behind text. */
.tb-quiet .tb-a{right:-35%;top:-40%;width:120%;height:95%;
  background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(0,170,142,.17) 0%,rgba(0,120,100,.07) 45%,rgba(0,120,100,0) 72%);
  animation:tb-q1 32s ease-in-out infinite alternate}
.tb-quiet .tb-b{left:-40%;bottom:-45%;width:110%;height:80%;
  background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(0,150,125,.10) 0%,rgba(0,110,94,.04) 50%,rgba(0,110,94,0) 75%);
  animation:tb-q2 40s ease-in-out infinite alternate}
@keyframes tb-q1{from{transform:translate3d(-6%,-2%,0) scale(.96)}to{transform:translate3d(5%,6%,0) scale(1.06)}}
@keyframes tb-q2{from{transform:translate3d(-4%,3%,0) scale(1)}to{transform:translate3d(16%,-4%,0) scale(1.08)}}

.tb-grain{inset:0;opacity:.07;background-size:200px 200px}
.tb-drift{position:absolute;inset:0;pointer-events:none}
@media (pointer:fine) and (prefers-reduced-motion:no-preference){
  .tb-drift{transform:translate3d(var(--tb-dx,0px),var(--tb-dy,0px),0);transition:transform .7s cubic-bezier(.22,1,.36,1);will-change:transform}
  .tb-cursor{position:absolute;width:680px;height:680px;border-radius:50%;pointer-events:none;
    transform:translate3d(calc(var(--tb-cx,-9999px) - 340px),calc(var(--tb-cy,-9999px) - 340px),0);
    background:radial-gradient(circle,rgba(0,196,164,.12) 0%,rgba(0,150,128,.04) 45%,rgba(0,0,0,0) 70%);
    opacity:var(--tb-co,0);transition:opacity .5s ease-out;will-change:transform}
}
.tb[data-paused="true"] .tb-light{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.tb-light{animation:none!important}}
`;

export function TealBackground({
  variant = "lines",
  fixed = false,
  className = "",
}: {
  variant?: "lines" | "glow" | "quiet";
  /** Pin to the screen instead of the parent (long pages and forms). The page root must be `isolate`. */
  fixed?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Pause the light while the section is off screen (saves battery on phones).
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      el.dataset["paused"] = entry && !entry.isIntersecting ? "true" : "false";
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Desktop mouse tracking: gently drifts illumination toward the pointer.
  // Strictly disabled on phones and touch devices (pointer: coarse) and reduced motion.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window === "undefined" ||
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let ticking = false;

    const onPointerMove = (e: PointerEvent) => {
      if (el.dataset["paused"] === "true") return;
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          // Only compute if section is reasonably near viewport
          if (rect.bottom > -200 && rect.top < window.innerHeight + 200) {
            const normX = e.clientX / window.innerWidth - 0.5;
            const normY = e.clientY / window.innerHeight - 0.5;
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;

            el.style.setProperty("--tb-dx", `${(normX * 36).toFixed(1)}px`);
            el.style.setProperty("--tb-dy", `${(normY * 24).toFixed(1)}px`);
            el.style.setProperty("--tb-cx", `${cx.toFixed(1)}px`);
            el.style.setProperty("--tb-cy", `${cy.toFixed(1)}px`);
            el.style.setProperty("--tb-co", "1");
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    const onMouseLeave = () => {
      el.style.setProperty("--tb-co", "0");
      el.style.setProperty("--tb-dx", "0px");
      el.style.setProperty("--tb-dy", "0px");
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`tb tb-${variant} ${className}`}
      style={fixed ? { position: "fixed", zIndex: -1 } : undefined}
    >
      <style>{CSS}</style>
      <div className="tb-drift">
        <div className="tb-light tb-a" />
        <div className="tb-light tb-b" />
        <div className="tb-cursor" />
      </div>
      {variant === "lines" && <div className="tb-slats" />}
      <div className="tb-scrim" />
      <div className="tb-grain" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}
