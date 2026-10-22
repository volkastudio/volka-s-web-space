import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";
import { postSchema, type PostInput, type PostRecord } from "@/lib/post-schema";
import { initialPosts } from "@/data/posts";

export const listAdminPosts = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[listAdminPosts] Supabase posts table warning:", error.message);
      // Return static posts as reference if table isn't migrated yet
      return { items: initialPosts as unknown as PostRecord[], dbReady: false, error: error.message };
    }

    return { items: (data || []) as unknown as PostRecord[], dbReady: true, error: null };
  });

export const getAdminPost = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator((data: { id: string }) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .or(`id.eq.${input.id},slug.eq.${input.id}`)
      .maybeSingle();

    if (error) {
      console.warn("[getAdminPost] DB query error:", error.message);
    }

    if (data) {
      return data as unknown as PostRecord;
    }

    // Check static initial posts
    const staticMatch = initialPosts.find((p) => p.id === input.id || p.slug === input.id);
    if (staticMatch) {
      return staticMatch as unknown as PostRecord;
    }

    throw new Error("Post not found");
  });

export const savePost = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) => postSchema.parse(data))
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const validated = input as PostInput;

    // Check slug uniqueness
    const slugQuery = supabaseAdmin
      .from("posts")
      .select("id")
      .eq("slug", validated.slug);

    if (validated.id) {
      slugQuery.neq("id", validated.id);
    }

    const { data: existingSlug, error: slugCheckError } = await slugQuery.maybeSingle();
    if (!slugCheckError && existingSlug) {
      throw new Error(`A post with slug "${validated.slug}" already exists`);
    }

    const recordToSave = {
      slug: validated.slug,
      status: validated.status,
      published_at:
        validated.status === "published"
          ? validated.published_at || new Date().toISOString()
          : validated.published_at || null,
      cover_path: validated.cover_path || null,
      tags: validated.tags,
      reading_time_minutes: validated.reading_time_minutes,
      social_links: validated.social_links,
      translations: validated.translations,
      updated_at: new Date().toISOString(),
    };

    if (validated.id) {
      const { data, error } = await supabaseAdmin
        .from("posts")
        .update(recordToSave)
        .eq("id", validated.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update post: ${error.message}`);
      }
      return data as unknown as PostRecord;
    } else {
      const { data, error } = await supabaseAdmin
        .from("posts")
        .insert({
          ...recordToSave,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create post: ${error.message}`);
      }
      return data as unknown as PostRecord;
    }
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("posts").delete().eq("id", input.id);
    if (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }

    return { success: true };
  });

export const setPostStatus = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { id: string; status: "draft" | "published" }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["draft", "published"]),
      })
      .parse(data),
  )
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const updates: Record<string, unknown> = {
      status: input.status,
      updated_at: new Date().toISOString(),
    };

    if (input.status === "published") {
      updates["published_at"] = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from("posts")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(updates as any)
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update post status: ${error.message}`);
    }

    return data as unknown as PostRecord;
  });
