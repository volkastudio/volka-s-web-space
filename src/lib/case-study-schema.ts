import { z } from "zod";
import type { OfferId } from "@/data/offers";

export const caseStudyTranslationSchema = z.object({
  tagline: z.string().min(1, "Tagline is required"),
  discipline: z.string().min(1, "Discipline is required"),
  sector: z.string().min(1, "Sector is required"),
  imageAlt: z.string().min(1, "Image alt text is required"),
  summary: z.string().min(1, "Summary is required"),
  context: z.string().min(1, "Context is required"),
  challenge: z.string().min(1, "Challenge is required"),
  execution: z.string().min(1, "Execution is required"),
  services: z.array(z.string().min(1)).min(1, "At least one service is required"),
  deliverables: z.array(z.string().min(1)).min(1, "At least one deliverable is required"),
  results: z.array(
    z.object({
      value: z.string().min(1, "Result value is required"),
      label: z.string().min(1, "Result label is required"),
    }),
  ),
  quote: z
    .object({
      text: z.string().min(1),
      author: z.string().min(1),
      role: z.string().min(1),
    })
    .optional(),
});

export type CaseStudyTranslation = z.infer<typeof caseStudyTranslationSchema>;

export const galleryItemSchema = z.object({
  path: z.string().min(1),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

export type GalleryItem = z.infer<typeof galleryItemSchema>;

export const caseStudySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  kind: z.enum(["concept", "client"]).default("concept"),
  status: z.enum(["draft", "published"]).default("draft"),
  sort_order: z.number().int().default(0),
  featured: z.boolean().default(false),
  client: z.string().min(1, "Client name is required"),
  year: z.string().min(4, "Year is required"),
  location: z.string().min(1, "Location is required"),
  offer: z.string().nullable().optional(),
  cover_path: z.string().nullable().optional(),
  gallery: z.array(galleryItemSchema).default([]),
  translations: z.object({
    fr: caseStudyTranslationSchema,
    en: caseStudyTranslationSchema.partial().optional(),
  }),
  published_at: z.string().nullable().optional(),
});

export type CaseStudyInput = z.infer<typeof caseStudySchema>;

export interface CaseStudyRecord {
  id: string;
  slug: string;
  kind: "concept" | "client";
  status: "draft" | "published";
  sort_order: number;
  featured: boolean;
  client: string;
  year: string;
  location: string;
  offer: string | null;
  cover_path: string | null;
  gallery: GalleryItem[];
  translations: {
    fr: CaseStudyTranslation;
    en?: Partial<CaseStudyTranslation> | undefined;
  };
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResolvedCaseStudy {
  id?: string | undefined;
  slug: string;
  kind: "concept" | "client";
  status?: "draft" | "published" | undefined;
  sort_order?: number | undefined;
  featured?: boolean | undefined;
  client: string;
  year: string;
  location: string;
  offer: OfferId;
  image: string;
  imageAlt: string;
  tagline: string;
  discipline: string;
  sector: string;
  summary: string;
  context: string;
  challenge: string;
  execution: string;
  services: string[];
  deliverables: string[];
  results: { value: string; label: string }[];
  quote?: { text: string; author: string; role: string } | undefined;
  gallery?: GalleryItem[] | undefined;
}

/**
 * Resolves a public media URL from a path.
 * If the path starts with http/https or /assets/, returns it directly.
 * Otherwise resolves against the Supabase media bucket CDN.
 */
export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/") || path.startsWith("data:")) {
    return path;
  }
  const supabaseUrl =
    (typeof process !== "undefined" ? process.env?.["SUPABASE_URL"] : undefined) ||
    import.meta.env?.["VITE_SUPABASE_URL"] ||
    "";
  if (!supabaseUrl) return path;
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/media/${path.replace(/^\/+/, "")}`;
}

/**
 * Resolves a database row into a localized CaseStudy object.
 * Falls back to FR if translation in requested locale is missing.
 */
export function resolveCaseStudy(
  record: CaseStudyRecord,
  locale: "fr" | "en" = "fr",
): ResolvedCaseStudy {
  const transLocale = record.translations[locale];
  const transFr = record.translations.fr;
  const fallback = transFr || (record.translations.en as CaseStudyTranslation | undefined);

  const tagline = transLocale?.tagline || fallback?.tagline || "";
  const discipline = transLocale?.discipline || fallback?.discipline || "";
  const sector = transLocale?.sector || fallback?.sector || "";
  const imageAlt = transLocale?.imageAlt || fallback?.imageAlt || record.client;
  const summary = transLocale?.summary || fallback?.summary || "";
  const context = transLocale?.context || fallback?.context || "";
  const challenge = transLocale?.challenge || fallback?.challenge || "";
  const execution = transLocale?.execution || fallback?.execution || "";
  const services = transLocale?.services || fallback?.services || [];
  const deliverables = transLocale?.deliverables || fallback?.deliverables || [];
  const results = transLocale?.results || fallback?.results || [];
  const quote = transLocale?.quote || fallback?.quote;

  const result: ResolvedCaseStudy = {
    id: record.id,
    slug: record.slug,
    kind: record.kind,
    status: record.status,
    sort_order: record.sort_order,
    featured: record.featured,
    client: record.client,
    year: record.year,
    location: record.location,
    offer: (record.offer as OfferId) || "Autorité",
    image: getMediaUrl(record.cover_path),
    imageAlt,
    tagline,
    discipline,
    sector,
    summary,
    context,
    challenge,
    execution,
    services,
    deliverables,
    results,
    gallery: record.gallery,
  };

  if (quote) {
    result.quote = quote;
  }

  return result;
}
