"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";
import { Sparkles, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

export interface StackedSlide {
  id: string | number;
  image: string;
  title: string;
  description: string;
  badge: string;
  metric?: string;
}

interface CarouselConfig {
  distanceDivisor: number;
  velocityDivisor: number;
  sensitivity: number;
  xMultiplier: number;
  yMultiplier: number;
  rotationMultiplier: number;
  scaleReduction: number;
}

const getCarouselConfig = (width: number): CarouselConfig => {
  if (width < 640) {
    return {
      distanceDivisor: 120,
      velocityDivisor: 500,
      sensitivity: 180,
      xMultiplier: 75,
      yMultiplier: 15,
      rotationMultiplier: 7,
      scaleReduction: 0.07,
    };
  }
  if (width < 1024) {
    return {
      distanceDivisor: 160,
      velocityDivisor: 650,
      sensitivity: 220,
      xMultiplier: 120,
      yMultiplier: 25,
      rotationMultiplier: 9,
      scaleReduction: 0.09,
    };
  }
  return {
    distanceDivisor: 200,
    velocityDivisor: 800,
    sensitivity: 250,
    xMultiplier: 155,
    yMultiplier: 32,
    rotationMultiplier: 11,
    scaleReduction: 0.11,
  };
};

interface CarouselStackedProps {
  slides: StackedSlide[];
  className?: string;
}

export function CarouselStacked({ slides, className }: CarouselStackedProps) {
  const scrollProgress = useMotionValue(0);
  const startProgress = React.useRef(0);
  const [windowWidth, setWindowWidth] = React.useState(1200);
  const total = slides.length;

  React.useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const config = React.useMemo(() => getCarouselConfig(windowWidth), [windowWidth]);

  const handleDragStart = () => {
    startProgress.current = scrollProgress.get();
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const dragDistance = info.offset.x;
    const velocity = info.velocity.x;
    const distanceShift = -dragDistance / config.distanceDivisor;
    const velocityShift = -velocity / config.velocityDivisor;
    const totalShift = Math.max(-2, Math.min(2, Math.round(distanceShift + velocityShift)));
    const target = Math.round(startProgress.current) + totalShift;

    animate(scrollProgress, target, {
      type: "spring",
      stiffness: 220,
      damping: 28,
      mass: 0.9,
    });
  };

  const handlePrev = () => {
    const current = Math.round(scrollProgress.get());
    animate(scrollProgress, current - 1, {
      type: "spring",
      stiffness: 220,
      damping: 28,
    });
  };

  const handleNext = () => {
    const current = Math.round(scrollProgress.get());
    animate(scrollProgress, current + 1, {
      type: "spring",
      stiffness: 220,
      damping: 28,
    });
  };

  if (!slides || slides.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full py-6 select-none relative",
        className
      )}
    >
      <div className="relative w-full max-w-5xl h-80 sm:h-96 lg:h-[430px] flex items-center justify-center">
        {/* Transparent Drag Surface */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragStart={handleDragStart}
          onDrag={(_, info) => {
            const delta = -info.delta.x / config.sensitivity;
            scrollProgress.set(scrollProgress.get() + delta);
          }}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 z-40 cursor-grab active:cursor-grabbing"
        />

        {slides.map((slide, i) => (
          <StackedCard
            key={slide.id || i}
            slide={slide}
            index={i}
            total={total}
            progress={scrollProgress}
            config={config}
          />
        ))}
      </div>

      {/* Swipe hints & Nav controls */}
      <div className="flex items-center gap-4 mt-6 z-50">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Slide précédente"
          className="p-2.5 rounded-full bg-forest border border-pine/30 hover:border-mint text-mint hover:bg-forest-black transition-colors cursor-pointer shadow-md"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-xs font-mono uppercase tracking-widest text-forest-black/60 bg-paper/80 px-3 py-1 rounded-full border border-pine/10">
          Glisser ou cliquer pour explorer
        </span>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Slide suivante"
          className="p-2.5 rounded-full bg-forest border border-pine/30 hover:border-mint text-mint hover:bg-forest-black transition-colors cursor-pointer shadow-md"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

interface CardProps {
  slide: StackedSlide;
  index: number;
  total: number;
  progress: MotionValue<number>;
  config: CarouselConfig;
}

const StackedCard = ({ slide, index, total, progress, config }: CardProps) => {
  const offset = useTransform(progress, (p) => {
    let diff = (index - p) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  });

  const x = useTransform(offset, (o) => o * config.xMultiplier);
  const rotate = useTransform(offset, (o) => {
    const absO = Math.abs(o);
    if (absO < 0.05) return 0;
    return o * config.rotationMultiplier;
  });
  const y = useTransform(offset, (o) => {
    const absO = Math.abs(o);
    if (absO < 0.05) return 0;
    return absO * config.yMultiplier;
  });
  const scale = useTransform(offset, (o) => Math.max(0.7, 1 - Math.abs(o) * config.scaleReduction));
  const opacity = useTransform(
    offset,
    [-total / 2, -total / 2 + 0.4, 0, total / 2 - 0.4, total / 2],
    [0, 1, 1, 1, 0]
  );
  const zIndex = useTransform(offset, (o) => Math.round(100 - Math.abs(o) * 10));

  return (
    <motion.div
      style={{
        x,
        rotate,
        y,
        scale,
        opacity,
        zIndex,
      }}
      className={cn(
        "absolute rounded-2xl overflow-hidden border border-pine/30 bg-forest-black shadow-2xl group pointer-events-none",
        "w-60 h-80 sm:w-72 sm:h-96 lg:w-80 lg:h-[410px]"
      )}
    >
      <img
        src={slide.image}
        alt={slide.title}
        className="absolute inset-0 size-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-105"
      />

      <motion.div
        style={{
          opacity: useTransform(offset, [-2, -0.5, 0, 0.5, 2], [0.65, 0.25, 0.1, 0.25, 0.65]),
        }}
        className="absolute inset-0 bg-forest-black pointer-events-none"
      />

      {/* Editorial Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-forest-black via-forest-black/50 to-transparent pointer-events-none" />

      {/* Top Badge */}
      <div className="absolute top-4 right-4 z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-black/90 backdrop-blur-md border border-mint/40 text-mint text-[11px] font-mono font-bold uppercase tracking-wider shadow-md">
          <Sparkles className="size-3 text-ochre" />
          {slide.badge}
        </span>
      </div>

      {/* Bottom Content Area */}
      <div className="absolute bottom-5 left-5 right-5 text-paper space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-pine text-mint">
            <CheckCircle2 className="size-3.5" />
          </span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-ochre font-semibold">
            {slide.metric || "Inclus dans le pack"}
          </span>
        </div>

        <motion.p
          style={{
            opacity: useTransform(offset, [-0.6, 0, 0.6], [0.3, 1, 0.3]),
          }}
          className="text-base sm:text-lg font-display font-medium text-paper leading-snug drop-shadow-md"
        >
          {slide.title}
        </motion.p>

        <motion.p
          style={{
            opacity: useTransform(offset, [-0.4, 0, 0.4], [0, 1, 0]),
          }}
          className="text-xs text-paper/85 line-clamp-3 leading-relaxed font-normal"
        >
          {slide.description}
        </motion.p>
      </div>
    </motion.div>
  );
};
