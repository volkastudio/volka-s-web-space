import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { GalleryStyleComponentProps } from "./types";
import { GalleryControls } from "./gallery-controls";

export function PerspectiveGallery({ images, clientName }: GalleryStyleComponentProps) {
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
        z: 0,
        rotateY: 0,
        scale: 1,
        zIndex: 30,
        opacity: 1,
        filter: "brightness(1)",
      };
    }

    if (isImmediate) {
      const xDistance = isMobile ? 135 : 230;
      const angle = isMobile ? 18 : 22;
      const zDepth = isMobile ? -40 : -60;
      return {
        x: offset > 0 ? xDistance : -xDistance,
        z: zDepth,
        rotateY: offset > 0 ? -angle : angle,
        scale: isMobile ? 0.9 : 0.92,
        zIndex: 20,
        opacity: isMobile ? 0.75 : 0.9,
        filter: "brightness(0.92)",
      };
    }

    if (isOuter) {
      const xDistance = isMobile ? 240 : 440;
      const angle = isMobile ? 32 : 40;
      const zDepth = isMobile ? -90 : -150;
      return {
        x: offset > 0 ? xDistance : -xDistance,
        z: zDepth,
        rotateY: offset > 0 ? -angle : angle,
        scale: isMobile ? 0.78 : 0.84,
        zIndex: 10,
        opacity: isMobile ? 0.3 : 0.75,
        filter: "brightness(0.8)",
      };
    }

    return {
      x: offset > 0 ? 580 : -580,
      z: -220,
      rotateY: offset > 0 ? -50 : 50,
      scale: 0.6,
      zIndex: 0,
      opacity: 0,
      filter: "brightness(0.6)",
    };
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${clientName ? `${clientName} — ` : ""}Perspective 3D image gallery`}
      className="relative w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-4 rounded-xl"
    >
      {/*
        Curved wall stage.
        The outer box clips the sides. The perspective lives on its own inner box, because an
        element with overflow:hidden flattens its children and would cancel the 3D rotation
        (this is why both galleries used to look identical).
      */}
      <div className="relative mx-auto h-[400px] sm:h-[480px] md:h-[540px] lg:h-[590px] w-full max-w-7xl overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ perspective: isMobile ? "900px" : "1300px" }}
        >
        <div
          className="relative flex h-full w-full items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
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
                          x: offset > 0 ? 560 : -560,
                          z: -180,
                          rotateY: offset > 0 ? -45 : 45,
                          scale: 0.6,
                          opacity: 0,
                        }
                  }
                  animate={{
                    x: style.x,
                    z: reducedMotion ? 0 : style.z,
                    rotateY: reducedMotion ? 0 : style.rotateY,
                    scale: style.scale,
                    zIndex: style.zIndex,
                    opacity: style.opacity,
                    filter: style.filter,
                  }}
                  exit={
                    reducedMotion
                      ? { opacity: 0 }
                      : {
                          x: offset > 0 ? 580 : -580,
                          z: -200,
                          rotateY: offset > 0 ? -50 : 50,
                          scale: 0.6,
                          opacity: 0,
                        }
                  }
                  transition={
                    reducedMotion
                      ? { duration: 0.15 }
                      : {
                          type: "spring",
                          stiffness: 270,
                          damping: 29,
                          mass: 0.85,
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
                    width: isMobile ? "68vw" : "290px",
                    maxWidth: isMobile ? "270px" : "340px",
                    height: isMobile ? "350px" : "480px",
                    transformStyle: "preserve-3d",
                    touchAction: "pan-y",
                  }}
                  aria-hidden={!isCenter}
                >
                  <div
                    className={`group relative h-full w-full overflow-hidden rounded-md border border-border/70 bg-muted transition-transform duration-300 ${
                      isCenter
                        ? "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] ring-1 ring-border/80"
                        : "shadow-xl shadow-black/20 hover:scale-[1.01]"
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

                    {/* Subtle angled lighting sheen on side cards */}
                    {!isCenter && (
                      <div
                        className={`pointer-events-none absolute inset-0 ${
                          offset > 0
                            ? "bg-gradient-to-r from-transparent via-transparent to-black/25"
                            : "bg-gradient-to-l from-transparent via-transparent to-black/25"
                        }`}
                        aria-hidden="true"
                      />
                    )}

                    {/* Gradient scrim for caption readability */}
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-opacity duration-300 ${
                        isCenter ? "opacity-30" : "opacity-50"
                      }`}
                      aria-hidden="true"
                    />

                    {/* Alt label on center image */}
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

