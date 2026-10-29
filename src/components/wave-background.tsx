// ---------------------------------------------------------------------------
// Soft moving waves (single colour, very low opacity).
// Pure SVG + CSS transform: no JS animation, no blur filter, cheap on low-end phones.
// Each line is a sum of sines whose periods divide the tile width, so the loop is seamless.
// The parent must be `relative` (and should clip with `overflow-hidden`).
// ---------------------------------------------------------------------------
const WAVE_TILE = 1200; // one seamless period, in viewBox units
const WAVE_VIEW_W = WAVE_TILE * 2;
const WAVE_VIEW_H = 800;

function buildWavePath(base: number, amp: number, phase: number, harmonic: number): string {
  const pts: string[] = [];
  for (let x = 0; x <= WAVE_VIEW_W; x += 24) {
    const t = (2 * Math.PI * x) / WAVE_TILE;
    const y = base + amp * Math.sin(t + phase) + amp * 0.4 * Math.sin(harmonic * t + phase * 1.7);
    pts.push(`${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

const WAVE_LAYERS = [
  {
    duration: 70,
    lines: [
      { base: 250, amp: 70, phase: 0.2, harmonic: 2 },
      { base: 300, amp: 80, phase: 0.8, harmonic: 2 },
      { base: 350, amp: 90, phase: 1.4, harmonic: 3 },
    ],
  },
  {
    duration: 48,
    lines: [
      { base: 480, amp: 70, phase: 2.2, harmonic: 2 },
      { base: 540, amp: 85, phase: 2.9, harmonic: 3 },
      { base: 600, amp: 75, phase: 3.6, harmonic: 2 },
    ],
  },
].map((layer) => ({
  duration: layer.duration,
  paths: layer.lines.map((l) => buildWavePath(l.base, l.amp, l.phase, l.harmonic)),
}));

export function WaveBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden text-mint"
      style={{
        maskImage: "radial-gradient(ellipse 85% 75% at 50% 50%, black 35%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 50% 50%, black 35%, transparent 100%)",
      }}
    >
      <style>{`
        @keyframes volka-wave-drift { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
        @media (prefers-reduced-motion: reduce) { .volka-wave { animation: none !important; } }
      `}</style>

      {/* Faint colour wash behind the content */}
      <div className="absolute left-1/2 top-1/2 size-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/[0.04] blur-3xl" />

      {WAVE_LAYERS.map((layer, i) => (
        <svg
          key={i}
          className="volka-wave absolute inset-y-0 left-0 h-full"
          style={{
            // two tiles wide, never narrower than 1800px, so waves keep their shape on phones
            width: "max(200%, 1800px)",
            animation: `volka-wave-drift ${layer.duration}s linear infinite`,
            willChange: "transform",
          }}
          viewBox={`0 0 ${WAVE_VIEW_W} ${WAVE_VIEW_H}`}
          preserveAspectRatio="none"
          fill="none"
        >
          {layer.paths.map((d, j) => (
            <g key={j} stroke="currentColor" strokeLinecap="round">
              {/* wide, faint strokes = soft glow instead of a blur filter */}
              <path d={d} strokeWidth={44} opacity={0.02} vectorEffect="non-scaling-stroke" />
              <path d={d} strokeWidth={26} opacity={0.03} vectorEffect="non-scaling-stroke" />
              <path d={d} strokeWidth={12} opacity={0.04} vectorEffect="non-scaling-stroke" />
              <path d={d} strokeWidth={4} opacity={0.05} vectorEffect="non-scaling-stroke" />
              <path d={d} strokeWidth={1.25} opacity={0.11} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </svg>
      ))}
    </div>
  );
}
