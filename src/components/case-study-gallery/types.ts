import type {
  CaseStudyGalleryConfig,
  CaseStudyGalleryImage,
  GalleryStyle,
} from "@/lib/case-study-schema";

export type { CaseStudyGalleryConfig, CaseStudyGalleryImage, GalleryStyle };

export interface CaseStudyGalleryProps {
  gallery?: CaseStudyGalleryConfig | null | undefined;
  clientName?: string | undefined;
  className?: string | undefined;
}

export interface GalleryStyleComponentProps {
  images: CaseStudyGalleryImage[];
  clientName?: string | undefined;
}

