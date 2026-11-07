import * as React from "react";
import { useI18n } from "@/i18n/context";
import type { CaseStudyGalleryProps } from "./types";
import { CoverflowGallery } from "./coverflow-gallery";
import { PerspectiveGallery } from "./perspective-gallery";

export { CoverflowGallery } from "./coverflow-gallery";
export { PerspectiveGallery } from "./perspective-gallery";
export * from "./types";

export function CaseStudyGallery({
  gallery,
  clientName,
  className = "",
}: CaseStudyGalleryProps) {
  const { locale } = useI18n();
  // If gallery is disabled, missing, or has no valid images, render absolutely nothing
  if (!gallery || !gallery.enabled || !Array.isArray(gallery.images) || gallery.images.length === 0) {
    return null;
  }

  // Filter out any image entries without a URL
  const validImages = gallery.images.filter((img) => Boolean(img.url && img.url.trim()));
  if (validImages.length === 0) {
    return null;
  }

  const isPerspective = gallery.style === "perspective";

  return (
    <section
      className={`relative w-full overflow-hidden border-t border-border bg-background py-16 sm:py-20 md:py-28 ${className}`}
      aria-label={clientName ? `${clientName} gallery` : "Case study gallery"}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Subtle section eyebrow matching Volka's editorial design system */}
        <div className="mb-6 md:mb-10 text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-gold">
            {locale === "fr" ? "Portfolio visuel" : "Visual portfolio"}
          </p>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-light text-foreground">
            {locale === "fr" ? (
              <>
                Le projet <span className="italic text-primary font-light">en images</span>
              </>
            ) : (
              <>
                The project <span className="italic text-primary font-light">in pictures</span>
              </>
            )}
          </h2>
        </div>

        {/* Gallery Renderer */}
        {isPerspective ? (
          <PerspectiveGallery images={validImages} clientName={clientName} />
        ) : (
          <CoverflowGallery images={validImages} clientName={clientName} />
        )}
      </div>
    </section>
  );
}

