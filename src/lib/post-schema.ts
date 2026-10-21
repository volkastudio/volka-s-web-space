import { z } from "zod";
import { getMediaUrl } from "./case-study-schema";

export { getMediaUrl };

export const postSocialLinksSchema = z.object({
  tiktok: z.string().optional().default(""),
  youtube: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
});

export type PostSocialLinks = z.infer<typeof postSocialLinksSchema>;

export const postTranslationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  body_md: z.string().min(1, "Body content is required"),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  cover_alt: z.string().optional(),
});

export type PostTranslation = z.infer<typeof postTranslationSchema>;

export const postSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and hyphens only"),
  status: z.enum(["draft", "published"]).default("draft"),
  published_at: z.string().nullable().optional(),
  cover_path: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  reading_time_minutes: z.number().int().min(1).default(5),
  social_links: postSocialLinksSchema.default({ tiktok: "", youtube: "", linkedin: "" }),
  translations: z.object({
    fr: postTranslationSchema,
    en: postTranslationSchema.partial().optional(),
  }),
});

export type PostInput = z.infer<typeof postSchema>;

export interface PostRecord {
  id: string;
  slug: string;
  status: "draft" | "published";
  published_at: string | null;
  cover_path: string | null;
  tags: string[];
  reading_time_minutes: number;
  social_links: PostSocialLinks;
  translations: {
    fr: PostTranslation;
    en?: Partial<PostTranslation> | undefined;
  };
  created_at: string;
  updated_at: string;
}

export interface ResolvedPost {
  id?: string | undefined;
  slug: string;
  status: "draft" | "published";
  published_at: string | null;
  cover_image: string;
  cover_alt: string;
  tags: string[];
  reading_time_minutes: number;
  social_links: PostSocialLinks;
  title: string;
  excerpt: string;
  body_md: string;
  seo_title: string;
  seo_description: string;
  created_at?: string | undefined;
}

/**
 * Calculates estimated reading time in minutes based on ~200 words/min
 */
export function estimateReadingTime(text: string): number {
  if (!text) return 1;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Resolves a database post row into localized article data with fallback.
 */
export function resolvePost(
  record: PostRecord,
  locale: "fr" | "en" = "fr",
): ResolvedPost {
  const transLocale = record.translations[locale];
  const transFr = record.translations.fr;
  const fallback = transFr || (record.translations.en as PostTranslation | undefined);

  const title = transLocale?.title || fallback?.title || "";
  const excerpt = transLocale?.excerpt || fallback?.excerpt || "";
  const body_md = transLocale?.body_md || fallback?.body_md || "";
  const seo_title = transLocale?.seo_title || title;
  const seo_description = transLocale?.seo_description || excerpt;
  const cover_alt = transLocale?.cover_alt || fallback?.cover_alt || title;

  return {
    id: record.id,
    slug: record.slug,
    status: record.status,
    published_at: record.published_at,
    cover_image: getMediaUrl(record.cover_path),
    cover_alt,
    tags: record.tags || [],
    reading_time_minutes: record.reading_time_minutes || estimateReadingTime(body_md),
    social_links: record.social_links || { tiktok: "", youtube: "", linkedin: "" },
    title,
    excerpt,
    body_md,
    seo_title,
    seo_description,
    created_at: record.created_at,
  };
}
