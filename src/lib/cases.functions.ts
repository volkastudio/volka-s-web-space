import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getStaticCaseStudies,
  getStaticCaseStudy,
  getNextStaticCaseStudy,
} from "@/data/case-studies";
import {
  resolveCaseStudy,
  type CaseStudyRecord,
  type ResolvedCaseStudy,
} from "./case-study-schema";

async function getEffectiveLocale(explicitLocale?: "fr" | "en"): Promise<"fr" | "en"> {
  if (explicitLocale) return explicitLocale;
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const req = getRequest();
    const cookie = req?.headers?.get("cookie");
    if (cookie) {
      const match = cookie.match(/volka_locale=(fr|en)/);
      if (match) return match[1] as "fr" | "en";
    }
  } catch {}
  return "fr";
}

export const getCaseStudiesList = createServerFn({ method: "GET" })
  .validator((data?: { locale?: "fr" | "en" }) =>
    z.object({ locale: z.enum(["fr", "en"]).optional() }).optional().parse(data ?? {}),
  )
  .handler(async ({ data: input = {} }) => {
    const locale = await getEffectiveLocale(input?.locale);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("case_studies")
        .select("*")
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return (data as unknown as CaseStudyRecord[]).map((r) => resolveCaseStudy(r, locale));
      }
    } catch (err) {
      console.warn("[getCaseStudiesList] Falling back to static data:", err);
    }

    return getStaticCaseStudies(locale);
  });

export const getCaseStudyDetail = createServerFn({ method: "GET" })
  .validator((data: { slug: string; locale?: "fr" | "en" }) =>
    z.object({ slug: z.string(), locale: z.enum(["fr", "en"]).optional() }).parse(data),
  )
  .handler(async ({ data: input }) => {
    const locale = await getEffectiveLocale(input?.locale);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: allPublished, error } = await supabase
        .from("case_studies")
        .select("*")
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!error && allPublished && allPublished.length > 0) {
        const records = allPublished as unknown as CaseStudyRecord[];
        const index = records.findIndex((r) => r.slug === input.slug);
        if (index !== -1) {
          const study = resolveCaseStudy(records[index]!, locale);
          const nextIndex = (index + 1) % records.length;
          const next = resolveCaseStudy(records[nextIndex]!, locale);
          return { study, next };
        }
      }
    } catch (err) {
      console.warn("[getCaseStudyDetail] Falling back to static data:", err);
    }

    const study = getStaticCaseStudy(input.slug, locale);
    if (!study) return null;
    const next = getNextStaticCaseStudy(input.slug, locale) ?? study;
    return { study, next };
  });

export const getFeaturedCaseStudies = createServerFn({ method: "GET" })
  .validator((data?: { locale?: "fr" | "en" }) =>
    z.object({ locale: z.enum(["fr", "en"]).optional() }).optional().parse(data ?? {}),
  )
  .handler(async ({ data: input = {} }) => {
    const locale = await getEffectiveLocale(input?.locale);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("case_studies")
        .select("*")
        .eq("status", "published")
        .eq("featured", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return (data as unknown as CaseStudyRecord[]).map((r) => resolveCaseStudy(r, locale));
      }
    } catch (err) {
      console.warn("[getFeaturedCaseStudies] Falling back to static data:", err);
    }

    return getStaticCaseStudies(locale).slice(0, 4);
  });
