"use client";

import createGlobe, { type COBEOptions } from "cobe";
import * as React from "react";
import { cn } from "@/lib/utils";

const DEFAULT_GLOBE_CONFIG: COBEOptions = {
  width: 600,
  height: 600,
  onRender: (_state) => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.25,
  dark: 1,
  diffuse: 1.2,
  mapSamples: 14000,
  mapBrightness: 3,
  baseColor: [0.04, 0.11, 0.09], // Forest Black
  markerColor: [0.66, 0.83, 0.73], // Sage Mint
  glowColor: [0.83, 0.64, 0.45], // Warm Ochre
  markers: [
    { location: [48.8566, 2.3522], size: 0.08 }, // Europe (Paris)
    { location: [6.3703, 2.3912], size: 0.11 }, // West Africa (Benin)
    { location: [5.36, -4.0083], size: 0.09 }, // West Africa (Abidjan)
    { location: [14.7167, -17.4677], size: 0.08 }, // West Africa (Dakar)
    { location: [40.7128, -74.006], size: 0.06 }, // North America
  ],
};

interface GlobeProps {
  className?: string;
  config?: Partial<COBEOptions>;
  highlightRegion?: "europe" | "afrique" | null;
}

export function Globe({ className, config = {}, highlightRegion }: GlobeProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const pointerInteracting = React.useRef<number | null>(null);
  const pointerInteractionMovement = React.useRef(0);
  const [r, setR] = React.useState(0);

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab";
    }
  };

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      setR(delta / 180);
    }
  };

  React.useEffect(() => {
    let phi = highlightRegion === "afrique" ? 0.3 : highlightRegion === "europe" ? 0.1 : 0;
    let width = 0;

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };

    window.addEventListener("resize", onResize);
    onResize();

    const mergedConfig: COBEOptions = {
      ...DEFAULT_GLOBE_CONFIG,
      ...config,
      width: (width || 300) * 2,
      height: (width || 300) * 2,
      onRender: (state) => {
        if (!pointerInteracting.current) {
          phi += 0.004;
        }
        state.phi = phi + r;
        state.width = (width || 300) * 2;
        state.height = (width || 300) * 2;
      },
    };

    let globe: ReturnType<typeof createGlobe> | null = null;
    try {
      if (canvasRef.current) {
        globe = createGlobe(canvasRef.current, mergedConfig);
        canvasRef.current.style.opacity = "1";
      }
    } catch (e) {
      console.warn("Could not initialize WebGL Globe:", e);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (globe) {
        globe.destroy();
      }
    };
  }, [r, config, highlightRegion]);

  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-[400px]", className)}>
      <canvas
        ref={canvasRef}
        className="size-full opacity-0 transition-opacity duration-700 [contain:layout_paint_size]"
        onPointerDown={(e) => updatePointerInteraction(e.clientX - pointerInteractionMovement.current)}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) => e.touches[0] && updateMovement(e.touches[0].clientX)}
      />
    </div>
  );
}
