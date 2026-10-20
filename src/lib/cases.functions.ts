import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { caseStudies, getCaseStudy, getNextCaseStudy } from "@/data/case-studies";
import {
  resolveCaseStudy,
  type CaseStudyRecord,
  type ResolvedCaseStudy,
} from "./case-study-schema";

export const getCaseStudiesList = createServerFn({ method: "GET" })
  .validator((data?: { locale?: "fr" | "en" }) =>
    z.object({ locale: z.enum(["fr", "en"]).default("fr") }).optional().parse(data ?? {}),
  )
  .handler(async ({ data: input = {} }) => {
    const locale = input.locale ?? "fr";
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

    return caseStudies as unknown as ResolvedCaseStudy[];
  });

export const getCaseStudyDetail = createServerFn({ method: "GET" })
  .validator((data: { slug: string; locale?: "fr" | "en" }) =>
    z.object({ slug: z.string(), locale: z.enum(["fr", "en"]).default("fr") }).parse(data),
  )
  .handler(async ({ data: input }) => {
    const locale = input.locale ?? "fr";
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

    const study = getCaseStudy(input.slug);
    if (!study) return null;
    const next = getNextCaseStudy(input.slug);
    return { study: study as unknown as ResolvedCaseStudy, next: next as unknown as ResolvedCaseStudy };
  });

export const getFeaturedCaseStudies = createServerFn({ method: "GET" })
  .validator((data?: { locale?: "fr" | "en" }) =>
    z.object({ locale: z.enum(["fr", "en"]).default("fr") }).optional().parse(data ?? {}),
  )
  .handler(async ({ data: input = {} }) => {
    const locale = input.locale ?? "fr";
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

    return caseStudies as unknown as ResolvedCaseStudy[];
  });
