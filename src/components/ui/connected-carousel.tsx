"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { HTMLAttributes, MouseEvent, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export interface CarouselItem {
  id: string | number;
  stat: string;
  quote: string;
  author: string;
  role: string;
  defaultImage: string;
  selectedImage: string;
  alt?: string;
  tagline?: string;
  actionHref?: string;
  actionSearch?: Record<string, string>;
  actionText?: string;
  points?: string[];
}

export interface ConnectedCarouselProps extends HTMLAttributes<HTMLDivElement> {
  items: CarouselItem[];
  autoPlayInterval?: number;
  pauseOnHover?: boolean;
}

type ScreenTier = "mobile" | "tablet" | "desktop";

const VISIBLE_OFFSETS = [-4, -3, -2, -1, 0, 1, 2, 3, 4] as const;

const TRANSITION_SPRING = {
  type: "spring",
  stiffness: 220,
  damping: 26,
  mass: 0.75,
} as const;

export function ConnectedCarousel({
  items,
  autoPlayInterval = 6500,
  pauseOnHover = true,
  className,
  ...props
}: ConnectedCarouselProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef<number>(0);

  // State
  const [page, setPage] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [tier, setTier] = useState<ScreenTier>("desktop");
  const [viewportWidth, setViewportWidth] = useState<number>(1200);

  const total = items.length;
  const activeIndex = ((page % total) + total) % total;

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setViewportWidth(width);
      if (width < 768) {
        setTier("mobile");
      } else if (width < 1120) {
        setTier("tablet");
      } else {
        setTier("desktop");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (pauseOnHover && isHovered) {
      lastTimeRef.current = null;
      return;
    }

    const step = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      elapsedRef.current += delta;

      if (elapsedRef.current >= autoPlayInterval) {
        elapsedRef.current = 0;
        lastTimeRef.current = null;
        setProgress(0);
        setPage((curr) => curr + 1);
        return;
      }

      setProgress(Math.min((elapsedRef.current / autoPlayInterval) * 100, 100));
      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastTimeRef.current = null;
    };
  }, [page, pauseOnHover, isHovered, autoPlayInterval]);

  const handlePrev = useCallback(() => {
    elapsedRef.current = 0;
    lastTimeRef.current = null;
    setProgress(0);
    setPage((curr) => curr - 1);
  }, []);

  const handleNext = useCallback(() => {
    elapsedRef.current = 0;
    lastTimeRef.current = null;
    setProgress(0);
    setPage((curr) => curr + 1);
  }, []);

  const handleSelectTab = (event: React.MouseEvent<HTMLButtonElement>) => {
    const indexStr = event.currentTarget.getAttribute("data-index");
    if (indexStr !== null && indexStr !== undefined) {
      const targetIdx = Number.parseInt(indexStr, 10);
      let diff = targetIdx - activeIndex;
      if (diff > total / 2) {
        diff -= total;
      } else if (diff < -total / 2) {
        diff += total;
      }
      elapsedRef.current = 0;
      lastTimeRef.current = null;
      setProgress(0);
      setPage((curr) => curr + diff);
    }
  };

  const handleSelectCard = (event: React.MouseEvent<HTMLDivElement>) => {
    const offsetStr = event.currentTarget.getAttribute("data-offset");
    if (offsetStr !== null && offsetStr !== undefined) {
      const offset = Number.parseInt(offsetStr, 10);
      if (offset !== 0) {
        elapsedRef.current = 0;
        lastTimeRef.current = null;
        setProgress(0);
        setPage((curr) => curr + offset);
      }
    }
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      handlePrev();
    } else if (event.key === "ArrowRight") {
      handleNext();
    }
  };

  const activeDimensions = {
    desktop: { width: 840, height: 500 },
    tablet: { width: 620, height: 460 },
    mobile: { width: Math.min(350, viewportWidth - 36), height: 520 },
  }[tier];

  return (
    <div
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Méthodologie du Studio Volka"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative w-full max-w-[1240px] mx-auto flex flex-col items-center select-none outline-none py-6 overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Cards Panel */}
      <div
        id="carousel-view-panel"
        role="tabpanel"
        aria-live="polite"
        className="relative w-full flex items-center justify-center"
        style={{ height: activeDimensions.height }}
      >
        {VISIBLE_OFFSETS.map((offset) => {
          const virtualIndex = page + offset;
          const itemIndex = ((virtualIndex % total) + total) % total;
          const item = items[itemIndex];
          if (!item) return null;
          const isActive = offset === 0;

          const getVariant = () => {
            if (tier === "mobile") {
              const activeW = activeDimensions.width;
              const activeH = activeDimensions.height;
              const gap = 14;
              const peekW = 48;
              const peekH = 430;

              if (offset === 0) {
                return {
                  x: -activeW / 2,
                  y: -activeH / 2,
                  width: activeW,
                  height: activeH,
                  opacity: 1,
                  zIndex: 10,
                  pointerEvents: "auto" as const,
                };
              }
              if (offset === -1) {
                return {
                  x: -activeW / 2 - gap - peekW,
                  y: -peekH / 2,
                  width: peekW,
                  height: peekH,
                  opacity: 0.85,
                  zIndex: 5,
                  pointerEvents: "auto" as const,
                };
              }
              if (offset === 1) {
                return {
                  x: activeW / 2 + gap,
                  y: -peekH / 2,
                  width: peekW,
                  height: peekH,
                  opacity: 0.85,
                  zIndex: 5,
                  pointerEvents: "auto" as const,
                };
              }
              return {
                x: offset < 0 ? -activeW / 2 - 180 : activeW / 2 + 180,
                y: -peekH / 2,
                width: peekW,
                height: peekH,
                opacity: 0,
                zIndex: 0,
                pointerEvents: "none" as const,
              };
            }

            if (tier === "tablet") {
              const activeW = 620;
              const activeH = 460;
              const gap = 16;
              const sideW = 96;
              const sideH = 360;

              if (offset === 0) {
                return {
                  x: -activeW / 2,
                  y: -activeH / 2,
                  width: activeW,
                  height: activeH,
                  opacity: 1,
                  zIndex: 10,
                  pointerEvents: "auto" as const,
                };
              }
              if (offset === -1) {
                return {
                  x: -activeW / 2 - gap - sideW,
                  y: -sideH / 2,
                  width: sideW,
                  height: sideH,
                  opacity: 0.9,
                  zIndex: 5,
                  pointerEvents: "auto" as const,
                };
              }
              if (offset === 1) {
                return {
                  x: activeW / 2 + gap,
                  y: -sideH / 2,
                  width: sideW,
                  height: sideH,
                  opacity: 0.9,
                  zIndex: 5,
                  pointerEvents: "auto" as const,
                };
              }
              return {
                x: offset < 0 ? -activeW / 2 - 220 : activeW / 2 + 220,
                y: -sideH / 2,
                width: 70,
                height: 220,
                opacity: 0,
                zIndex: 0,
                pointerEvents: "none" as const,
              };
            }

            // Desktop layout
            switch (offset) {
              case 0:
                return {
                  x: -420,
                  y: -250,
                  width: 840,
                  height: 500,
                  opacity: 1,
                  zIndex: 10,
                  pointerEvents: "auto" as const,
                };
              case -1:
                return {
                  x: -545,
                  y: -180,
                  width: 105,
                  height: 360,
                  opacity: 0.9,
                  zIndex: 5,
                  pointerEvents: "auto" as const,
                };
              case 1:
                return {
                  x: 440,
                  y: -180,
                  width: 105,
                  height: 360,
                  opacity: 0.9,
                  zIndex: 5,
                  pointerEvents: "auto" as const,
                };
              case -2:
                return {
                  x: -640,
                  y: -115,
                  width: 75,
                  height: 230,
                  opacity: 0.7,
                  zIndex: 3,
                  pointerEvents: "auto" as const,
                };
              case 2:
                return {
                  x: 565,
                  y: -115,
                  width: 75,
                  height: 230,
                  opacity: 0.7,
                  zIndex: 3,
                  pointerEvents: "auto" as const,
                };
              case -3:
                return {
                  x: -740,
                  y: -115,
                  width: 75,
                  height: 230,
                  opacity: 0,
                  zIndex: 0,
                  pointerEvents: "none" as const,
                };
              case 3:
                return {
                  x: 665,
                  y: -115,
                  width: 75,
                  height: 230,
                  opacity: 0,
                  zIndex: 0,
                  pointerEvents: "none" as const,
                };
              default:
                return {
                  x: offset < 0 ? -860 : 860,
                  y: -115,
                  width: 75,
                  height: 230,
                  opacity: 0,
                  zIndex: 0,
                  pointerEvents: "none" as const,
                };
            }
          };

          return (
            <motion.div
              key={virtualIndex}
              data-offset={offset}
              onClick={handleSelectCard}
              initial={false}
              animate={getVariant()}
              transition={TRANSITION_SPRING}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                willChange: "transform",
              }}
              className={cn(
                "rounded-[24px] sm:rounded-[28px] bg-ivory text-forest-black border border-pine/20 shadow-[0_16px_40px_rgba(10,25,18,0.12),0_4px_12px_rgba(10,25,18,0.06)] overflow-visible",
                !isActive && "cursor-pointer hover:border-forest/50 transition-colors"
              )}
            >
              {/* Connector SVG Notch Left */}
              {offset === -1 && (
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 flex items-center text-ivory pointer-events-none z-[100]"
                  style={{
                    width: 22,
                    height: 42,
                    margin: "auto 0",
                    left: "calc(100% - 1px)",
                  }}
                >
                  <svg
                    viewBox="0 0 20 37.3338"
                    preserveAspectRatio="none"
                    className="size-full fill-current overflow-visible block"
                  >
                    <path d="M0 0C0 0 1.2422 13.5759 10 13.5759C18.7578 13.5759 20 0 20 0V37.3338C20 37.3338 18.7578 23.7578 10 23.7578C1.2422 23.7578 0 37.3338 0 37.3338V0Z" />
                  </svg>
                </div>
              )}

              {/* Connector SVG Notch Right */}
              {offset === 1 && (
                <div
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 flex items-center text-ivory pointer-events-none z-[100]"
                  style={{
                    width: 22,
                    height: 42,
                    margin: "auto 0",
                    right: "calc(100% - 1px)",
                  }}
                >
                  <svg
                    viewBox="0 0 20 37.3338"
                    preserveAspectRatio="none"
                    className="size-full fill-current overflow-visible block"
                  >
                    <path d="M0 0C0 0 1.2422 13.5759 10 13.5759C18.7578 13.5759 20 0 20 0V37.3338C20 37.3338 18.7578 23.7578 10 23.7578C1.2422 23.7578 0 37.3338 0 37.3338V0Z" />
                  </svg>
                </div>
              )}

              <div
                className="size-full overflow-hidden relative"
                style={{ borderRadius: "inherit" }}
              >
                {/* Inactive Card Thumbnail Cover */}
                <motion.div
                  initial={false}
                  animate={{ opacity: isActive ? 0 : 1 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={cn(
                    "absolute inset-0 p-2",
                    isActive && "pointer-events-none"
                  )}
                >
                  <div className="size-full rounded-[18px] sm:rounded-[22px] overflow-hidden bg-forest/10 relative">
                    <img
                      alt={item.alt || item.author}
                      src={item.defaultImage}
                      draggable={false}
                      className="size-full object-cover filter grayscale contrast-125"
                    />
                    <div className="absolute inset-0 bg-forest-black/40" />
                    <div className="absolute inset-0 flex items-center justify-center p-2 text-center">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-paper bg-forest-black/80 px-2 py-1 rounded">
                        {item.author}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Active Card Content */}
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: activeDimensions.width,
                    height: activeDimensions.height,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      x: isActive ? 0 : offset < 0 ? -822 : 822,
                    }}
                    transition={TRANSITION_SPRING}
                    className={cn(
                      "size-full flex flex-col md:flex-row p-6 sm:p-8 md:p-10 gap-6 sm:gap-8 justify-between",
                      !isActive && "pointer-events-none"
                    )}
                  >
                    {/* Left Column: Copy & Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded px-2.5 py-0.5 text-[11px] font-mono font-bold tracking-wider uppercase bg-forest text-paper">
                            {item.author}
                          </span>
                          <span className="text-xs text-ochre font-mono font-medium">
                            {item.role}
                          </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-light text-forest-black tracking-tight leading-snug">
                          {item.stat}
                        </h3>
                      </div>

                      <div className="relative py-1">
                        <p className="text-sm sm:text-base text-forest-black/80 font-normal leading-relaxed">
                          {item.quote}
                        </p>
                      </div>

                      {/* Bullet checkpoints */}
                      {item.points && item.points.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-pine/10">
                          {item.points.map((pt, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-2 text-xs text-forest-black/75">
                              <CheckCircle2 className="size-3.5 text-forest shrink-0" />
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bottom Action CTA */}
                      {item.actionHref && (
                        <div className="pt-2">
                          <Link
                            to={item.actionHref as any}
                            search={item.actionSearch as any}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-forest text-paper hover:bg-forest/90 font-medium text-xs sm:text-sm shadow-sm transition-all group cursor-pointer"
                          >
                            <span>{item.actionText || "Choisir ce parcours"}</span>
                            <ArrowRight className="size-4 text-mint transition-transform group-hover:translate-x-1" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Visual Mockup Container */}
                    <div className="relative shrink-0 overflow-hidden rounded-[18px] sm:rounded-[22px] bg-forest-black w-full md:w-[clamp(240px,42%,340px)] flex-1 md:flex-initial md:h-full max-h-[220px] md:max-h-none border border-pine/20 shadow-md">
                      <img
                        alt={item.alt || item.stat}
                        src={item.selectedImage}
                        draggable={false}
                        className="size-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-forest-black/70 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-lg bg-forest-black/80 backdrop-blur-md border border-pine/30 text-paper text-[11px] font-mono flex items-center justify-between">
                        <span className="text-paper/80">Audit 5 Jours</span>
                        <span className="text-mint font-semibold">Méthodologie Volka</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Connected Navigation Tabs with Progress bar */}
      <div
        role="tablist"
        aria-label="Sélection des piliers de croissance"
        className="flex items-center gap-2 sm:gap-3 mt-8 max-w-full overflow-x-auto p-2"
      >
        {items.map((item, idx) => {
          const isSelected = idx === activeIndex;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              data-index={idx}
              id={`carousel-tab-${idx}`}
              aria-controls="carousel-view-panel"
              onClick={handleSelectTab}
              aria-selected={isSelected}
              aria-label={`Pilier ${idx + 1}: ${item.stat}`}
              tabIndex={isSelected ? 0 : -1}
              className={cn(
                "relative h-10 rounded-full px-4 text-xs font-medium flex items-center justify-center border transition-all duration-300 ease-out outline-none cursor-pointer overflow-hidden",
                isSelected
                  ? "bg-forest text-paper border-mint/40 shadow-sm"
                  : "bg-ivory text-forest-black/70 border-pine/15 hover:border-pine/30 hover:text-forest-black"
              )}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span className="font-mono text-[10px] opacity-75">{`0${idx + 1}`}</span>
                <span className="hidden sm:inline font-semibold">{item.stat.split(" ")[0]}</span>
                <span className="sm:hidden font-semibold">{item.author}</span>
              </span>

              {/* Progress Fill bar when selected */}
              {isSelected && (
                <div
                  className="absolute inset-0 bg-mint/20 pointer-events-none"
                  style={{
                    transformOrigin: "0% 50%",
                    transform: `scaleX(${progress / 100})`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
