import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { initialPosts, getStaticPost, getStaticPosts } from "@/data/posts";
import {
  resolvePost,
  type PostRecord,
  type ResolvedPost,
} from "./post-schema";

export const getPostsList = createServerFn({ method: "GET" })
  .validator((data?: { locale?: "fr" | "en"; tag?: string }) =>
    z
      .object({
        locale: z.enum(["fr", "en"]).default("fr"),
        tag: z.string().optional(),
      })
      .optional()
      .parse(data ?? {}),
  )
  .handler(async ({ data: input = {} }) => {
    const locale = input.locale ?? "fr";
    const filterTag = input.tag;

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      let query = supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (filterTag) {
        query = query.contains("tags", [filterTag]);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        return (data as unknown as PostRecord[]).map((r) => resolvePost(r, locale));
      }
    } catch (err) {
      console.warn("[getPostsList] Falling back to static data:", err);
    }

    let staticList = getStaticPosts(locale);
    if (filterTag) {
      staticList = staticList.filter((p) => p.tags.includes(filterTag));
    }
    return staticList;
  });

export const getPostDetail = createServerFn({ method: "GET" })
  .validator((data: { slug: string; locale?: "fr" | "en" }) =>
    z.object({ slug: z.string(), locale: z.enum(["fr", "en"]).default("fr") }).parse(data),
  )
  .handler(async ({ data: input }) => {
    const locale = input.locale ?? "fr";
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: allPublished, error } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error && allPublished && allPublished.length > 0) {
        const records = allPublished as unknown as PostRecord[];
        const index = records.findIndex((r) => r.slug === input.slug);
        if (index !== -1) {
          const post = resolvePost(records[index]!, locale);
          const nextIndex = (index + 1) % records.length;
          const next = records.length > 1 ? resolvePost(records[nextIndex]!, locale) : null;
          return { post, next };
        }
      }
    } catch (err) {
      console.warn("[getPostDetail] Falling back to static data:", err);
    }

    const post = getStaticPost(input.slug, locale);
    if (!post) return null;
    const all = getStaticPosts(locale);
    const index = all.findIndex((p) => p.slug === input.slug);
    const next = all.length > 1 ? all[(index + 1) % all.length] ?? null : null;
    return { post, next };
  });

export const getRecentPosts = createServerFn({ method: "GET" })
  .validator((data?: { locale?: "fr" | "en"; limit?: number }) =>
    z
      .object({
        locale: z.enum(["fr", "en"]).default("fr"),
        limit: z.number().int().min(1).max(10).default(3),
      })
      .optional()
      .parse(data ?? {}),
  )
  .handler(async ({ data: input = {} }) => {
    const locale = input.locale ?? "fr";
    const limit = input.limit ?? 3;

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return (data as unknown as PostRecord[]).map((r) => resolvePost(r, locale));
      }
    } catch (err) {
      console.warn("[getRecentPosts] Falling back to static:", err);
    }

    return getStaticPosts(locale).slice(0, limit);
  });
