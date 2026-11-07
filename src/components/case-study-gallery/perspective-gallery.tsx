import * as React from "react";
import type { GalleryStyleComponentProps } from "./types";
import { TiltedGridHero } from "./tilted-grid";

/**
 * "Perspective" style: one row of project images streams around the inside of a cylinder.
 * The centre faces the visitor flat, the ends curve toward them and fade out. It moves on its own
 * (and freezes as a still if the visitor prefers reduced motion), so it has no arrows.
 */
export function PerspectiveGallery({ images, clientName }: GalleryStyleComponentProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // A stable list: the band preloads every image whenever this changes.
  const tiles = React.useMemo(
    () =>
      images.map((image, i) => ({
        src: image.url,
        alt: image.alt || `${clientName || "Project"} — image ${i + 1}`,
      })),
    [images, clientName],
  );

  if (tiles.length === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={`${clientName ? `${clientName} — ` : ""}Image gallery`}
      className="relative w-full select-none"
    >
      <TiltedGridHero
        images={tiles}
        speed={isMobile ? 4.5 : 5.5}
        tileHeight={isMobile ? 62 : 56}
        aspectRatio={isMobile ? 4 / 5 : 4 / 3}
        gap={isMobile ? 8 : 6}
        axis={50}
        curve={isMobile ? 62 : 70}
        fade={isMobile ? 8 : 12}
        className="mx-auto h-[360px] w-full max-w-[1400px] sm:h-[440px] md:h-[520px] lg:h-[580px]"
      />

      {/* The animated band is decorative; this keeps the images available to screen readers. */}
      <ul className="sr-only">
        {tiles.map((tile, i) => (
          <li key={`${tile.src}-${i}`}>{tile.alt}</li>
        ))}
      </ul>
    </div>
  );
}
