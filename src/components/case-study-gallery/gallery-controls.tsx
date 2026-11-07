import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export interface GalleryControlsProps {
  onPrev: () => void;
  onNext: () => void;
  className?: string;
  hasMultiple?: boolean;
}

export function GalleryControls({
  onPrev,
  onNext,
  className = "",
  hasMultiple = true,
}: GalleryControlsProps) {
  if (!hasMultiple) return null;

  return (
    <div
      className={`flex items-center justify-center gap-3 pt-6 sm:pt-8 ${className}`}
      role="group"
      aria-label="Gallery navigation controls"
    >
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous image"
        className="group relative flex size-11 sm:size-12 items-center justify-center rounded-full border border-foreground/25 bg-background/80 text-foreground backdrop-blur-sm transition-all duration-300 hover:border-foreground hover:bg-foreground hover:text-background active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <ArrowLeft className="size-4 sm:size-4.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
      </button>

      <button
        type="button"
        onClick={onNext}
        aria-label="Next image"
        className="group relative flex size-11 sm:size-12 items-center justify-center rounded-full border border-foreground/25 bg-background/80 text-foreground backdrop-blur-sm transition-all duration-300 hover:border-foreground hover:bg-foreground hover:text-background active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <ArrowRight className="size-4 sm:size-4.5 transition-transform duration-300 group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

