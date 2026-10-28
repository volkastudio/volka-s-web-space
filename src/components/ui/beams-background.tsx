"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface BeamsBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  intensity?: "subtle" | "medium" | "strong";
  /** Optional custom color tone: 'volka' (mint/pine/gold), 'mint', or 'ochre' */
  tone?: "volka" | "mint" | "ochre";
}

interface Beam {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  hue: number;
  pulse: number;
  pulseSpeed: number;
}

function createBeam(width: number, height: number, tone: "volka" | "mint" | "ochre"): Beam {
  const angle = -35 + Math.random() * 12;
  // Volka palette hues: Mint (~165), Deep Emerald (~175), Warm Gold/Ochre (~38)
  let hue = 165;
  if (tone === "volka") {
    // 80% mint/emerald, 20% warm ochre/gold accent
    hue = Math.random() > 0.2 ? 155 + Math.random() * 30 : 38 + Math.random() * 10;
  } else if (tone === "mint") {
    hue = 155 + Math.random() * 25;
  } else if (tone === "ochre") {
    hue = 35 + Math.random() * 15;
  }

  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 25 + Math.random() * 50,
    length: height * 2.2,
    angle: angle,
    speed: 0.4 + Math.random() * 0.8,
    opacity: 0.08 + Math.random() * 0.14,
    hue: hue,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.015 + Math.random() * 0.025,
  };
}

export function BeamsBackground({
  className,
  children,
  intensity = "subtle",
  tone = "volka",
}: BeamsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beamsRef = useRef<Beam[]>([]);
  const animationFrameRef = useRef<number>(0);

  const opacityMultiplier = {
    subtle: 0.65,
    medium: 0.85,
    strong: 1,
  }[intensity];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let totalBeams = 18;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      totalBeams = Math.min(24, Math.max(12, Math.floor(w / 70)));
      beamsRef.current = Array.from({ length: totalBeams }, () =>
        createBeam(w, h, tone)
      );
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    function resetBeam(beam: Beam, index: number) {
      if (!canvas) return beam;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;

      const column = index % 3;
      const spacing = w / 3;
      beam.y = h + 80;
      beam.x = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.6;
      beam.width = 30 + Math.random() * 50;
      beam.speed = 0.35 + Math.random() * 0.5;
      beam.opacity = 0.08 + Math.random() * 0.12;
      return beam;
    }

    function drawBeam(c: CanvasRenderingContext2D, beam: Beam) {
      c.save();
      c.translate(beam.x, beam.y);
      c.rotate((beam.angle * Math.PI) / 180);

      const pulsingOpacity =
        beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.25) * opacityMultiplier;

      const gradient = c.createLinearGradient(0, 0, 0, beam.length);
      const isGold = beam.hue < 60;
      const saturation = isGold ? "75%" : "60%";
      const lightness = isGold ? "60%" : "68%";

      gradient.addColorStop(0, `hsla(${beam.hue}, ${saturation}, ${lightness}, 0)`);
      gradient.addColorStop(0.15, `hsla(${beam.hue}, ${saturation}, ${lightness}, ${pulsingOpacity * 0.5})`);
      gradient.addColorStop(0.5, `hsla(${beam.hue}, ${saturation}, ${lightness}, ${pulsingOpacity})`);
      gradient.addColorStop(0.85, `hsla(${beam.hue}, ${saturation}, ${lightness}, ${pulsingOpacity * 0.5})`);
      gradient.addColorStop(1, `hsla(${beam.hue}, ${saturation}, ${lightness}, 0)`);

      c.fillStyle = gradient;
      c.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      c.restore();
    }

    function animate() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;

      ctx.clearRect(0, 0, w, h);
      ctx.filter = "blur(28px)";

      beamsRef.current.forEach((beam, index) => {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;

        if (beam.y + beam.length < -80) {
          resetBeam(beam, index);
        }
        drawBeam(ctx, beam);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intensity, tone, opacityMultiplier]);

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
        style={{ filter: "blur(14px)" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-forest-black/10"
        animate={{
          opacity: [0.03, 0.08, 0.03],
        }}
        transition={{
          duration: 9,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
        }}
        style={{
          backdropFilter: "blur(30px)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
