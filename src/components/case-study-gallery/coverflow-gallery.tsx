import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { GalleryStyleComponentProps } from "./types";
import { GalleryControls } from "./gallery-controls";

export function CoverflowGallery({ images, clientName }: GalleryStyleComponentProps) {
  const [virtualIndex, setVirtualIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    const checkMotion = () => {
      setReducedMotion(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
    };

    checkViewport();
    checkMotion();

    window.addEventListener("resize", checkViewport, { passive: true });
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionQuery.addEventListener("change", checkMotion);

    return () => {
      window.removeEventListener("resize", checkViewport);
      motionQuery.removeEventListener("change", checkMotion);
    };
  }, []);

  // Support 1, 2, 3+ images seamlessly
  const totalOriginal = images.length;
  if (totalOriginal === 0) return null;

  // Duplicate items if only 2 images so virtual 5-slot window works without duplicates
  const activeItems = totalOriginal === 2 ? [...images, ...images] : images;
  const count = activeItems.length;

  const prev = React.useCallback(() => {
    setVirtualIndex((v) => v - 1);
  }, []);

  const next = React.useCallback(() => {
    setVirtualIndex((v) => v + 1);
  }, []);

  // Keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    },
    [prev, next],
  );

  // Visible slots offsets: [-2, -1, 0, 1, 2]
  const offsets = count >= 3 ? [-2, -1, 0, 1, 2] : [0];

  const getSlotStyle = (offset: number) => {
    const isCenter = offset === 0;
    const isImmediate = Math.abs(offset) === 1;
    const isOuter = Math.abs(offset) === 2;

    if (isCenter) {
      return {
        x: 0,
        scale: 1,
        zIndex: 30,
        opacity: 1,
        filter: "brightness(1)",
      };
    }

    if (isImmediate) {
      const xDistance = isMobile ? 120 : 230;
      return {
        x: offset > 0 ? xDistance : -xDistance,
        scale: isMobile ? 0.84 : 0.82,
        zIndex: 20,
        opacity: 0.88,
        filter: "brightness(0.9)",
      };
    }

    if (isOuter) {
      const xDistance = isMobile ? 210 : 420;
      return {
        x: offset > 0 ? xDistance : -xDistance,
        scale: isMobile ? 0.7 : 0.65,
        zIndex: 10,
        opacity: 0.45,
        filter: "brightness(0.75)",
      };
    }

    return {
      x: offset > 0 ? 550 : -550,
      scale: 0.5,
      zIndex: 0,
      opacity: 0,
      filter: "brightness(0.5)",
    };
  };

  const activeActualIndex = ((virtualIndex % totalOriginal) + totalOriginal) % totalOriginal;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${clientName ? `${clientName} — ` : ""}Centered coverflow image gallery`}
      className="relative w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-4 rounded-xl"
    >
      {/* 3D Coverflow stage */}
      <div className="relative mx-auto flex h-[420px] sm:h-[500px] md:h-[560px] lg:h-[620px] w-full max-w-7xl items-center justify-center overflow-hidden py-4">
        <div className="relative flex h-full w-full items-center justify-center">
          <AnimatePresence initial={false}>
            {offsets.map((offset) => {
              const slotKey = virtualIndex + offset;
              const itemIndex = ((slotKey % count) + count) % count;
              const image = activeItems[itemIndex]!;
              const isCenter = offset === 0;
              const style = getSlotStyle(offset);

              return (
                <motion.div
                  key={slotKey}
                  layout="position"
                  initial={
                    reducedMotion
                      ? { opacity: 0 }
                      : {
                          x: offset > 0 ? 500 : -500,
                          scale: 0.5,
                          opacity: 0,
                        }
                  }
                  animate={{
                    x: style.x,
                    scale: style.scale,
                    zIndex: style.zIndex,
                    opacity: style.opacity,
                    filter: style.filter,
                  }}
                  exit={
                    reducedMotion
                      ? { opacity: 0 }
                      : {
                          x: offset > 0 ? 520 : -520,
                          scale: 0.5,
                          opacity: 0,
                        }
                  }
                  transition={
                    reducedMotion
                      ? { duration: 0.15 }
                      : {
                          type: "spring",
                          stiffness: 280,
                          damping: 30,
                          mass: 0.8,
                        }
                  }
                  drag={isCenter ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.25}
                  onDragEnd={(_e, info) => {
                    if (info.offset.x < -45) {
                      next();
                    } else if (info.offset.x > 45) {
                      prev();
                    }
                  }}
                  onClick={() => {
                    if (!isCenter) {
                      setVirtualIndex((v) => v + offset);
                    }
                  }}
                  className={`absolute top-1/2 -translate-y-1/2 cursor-pointer transition-shadow ${
                    isCenter
                      ? "cursor-grab active:cursor-grabbing"
                      : "cursor-pointer hover:opacity-100"
                  }`}
                  style={{
                    width: isMobile ? "78vw" : "400px",
                    maxWidth: isMobile ? "320px" : "440px",
                    height: isMobile ? "380px" : "540px",
                    touchAction: "pan-y",
                  }}
                  aria-hidden={!isCenter}
                >
                  <div
                    className={`group relative h-full w-full overflow-hidden rounded-md border border-border/60 bg-muted transition-transform duration-300 ${
                      isCenter
                        ? "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_12px_24px_-8px_rgba(0,0,0,0.2)] ring-1 ring-border/80"
                        : "shadow-lg shadow-black/15 hover:scale-[1.02]"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || `${clientName || "Project"} — image ${itemIndex + 1}`}
                      loading={isCenter ? "eager" : "lazy"}
                      fetchPriority={isCenter ? "high" : "low"}
                      draggable={false}
                      className="h-full w-full object-cover transition-transform duration-500 will-change-transform select-none"
                    />

                    {/* Gradient scrim at bottom for depth */}
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-opacity duration-300 ${
                        isCenter ? "opacity-30" : "opacity-60"
                      }`}
                      aria-hidden="true"
                    />

                    {/* Caption / Alt badge if provided on active center card */}
                    {isCenter && image.alt && (
                      <div className="pointer-events-none absolute bottom-3 left-3 right-3 text-center">
                        <span className="inline-block rounded-sm bg-black/60 px-3 py-1 font-mono text-[11px] text-paper/90 backdrop-blur-md">
                          {image.alt}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Controls */}
      <GalleryControls
        onPrev={prev}
        onNext={next}
        hasMultiple={totalOriginal > 1}
      />
    </div>
  );
}

