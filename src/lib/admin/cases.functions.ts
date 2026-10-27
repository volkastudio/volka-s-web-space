import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";
import { caseStudySchema, type CaseStudyInput, type CaseStudyRecord } from "@/lib/case-study-schema";

export const getAdminCasesStats = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [totalRes, publishedRes, draftRes] = await Promise.all([
      supabaseAdmin.from("case_studies").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("case_studies").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabaseAdmin.from("case_studies").select("id", { count: "exact", head: true }).eq("status", "draft"),
    ]);

    return {
      total: totalRes.count ?? 0,
      published: publishedRes.count ?? 0,
      draft: draftRes.count ?? 0,
    };
  });

export const listAdminCases = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator((data?: { limit?: number }) =>
    z.object({ limit: z.number().int().min(1).max(100).optional() }).optional().parse(data ?? {}),
  )
  .handler(async ({ data: input = {} }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("case_studies")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (input.limit) {
      query = query.limit(input.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[listAdminCases] Error:", error.message);
      throw new Error(`Failed to list case studies: ${error.message}`);
    }

    return (data || []) as unknown as CaseStudyRecord[];
  });

export const getAdminCase = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const cleanId = input.id.replace(/[,()%:*\\]/g, "").trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    let query = supabaseAdmin.from("case_studies").select("*");
    if (isUuid) {
      query = query.eq("id", cleanId);
    } else {
      query = query.eq("slug", cleanId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("[getAdminCase] Error:", error.message);
      throw new Error(`Failed to load case study: ${error.message}`);
    }

    if (!data) {
      throw new Error("Case study not found");
    }

    return data as unknown as CaseStudyRecord;
  });

export const saveCase = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) => caseStudySchema.parse(data))
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const validated = input as CaseStudyInput;

    // Check slug uniqueness
    const slugQuery = supabaseAdmin
      .from("case_studies")
      .select("id")
      .eq("slug", validated.slug);

    if (validated.id) {
      slugQuery.neq("id", validated.id);
    }

    const { data: existingWithSlug, error: slugError } = await slugQuery.maybeSingle();
    if (slugError) {
      console.error("[saveCase] Slug check error:", slugError.message);
    }
    if (existingWithSlug) {
      throw new Error(`Slug "${validated.slug}" is already in use by another case study.`);
    }

    const now = new Date().toISOString();
    const isPublishing = validated.status === "published";

    if (validated.id) {
      // Update
      const { data, error } = await supabaseAdmin
        .from("case_studies")
        .update({
          slug: validated.slug,
          kind: validated.kind,
          status: validated.status,
          sort_order: validated.sort_order,
          featured: validated.featured,
          client: validated.client,
          year: validated.year,
          location: validated.location,
          offer: validated.offer ?? null,
          cover_path: validated.cover_path ?? null,
          gallery: validated.gallery as unknown as import("@/integrations/supabase/types").Json,
          translations: validated.translations as unknown as import("@/integrations/supabase/types").Json,
          published_at: isPublishing ? (validated.published_at || now) : null,
          updated_at: now,
        })
        .eq("id", validated.id)
        .select()
        .single();

      if (error) {
        console.error("[saveCase] Update error:", error.message);
        throw new Error(`Failed to update case study: ${error.message}`);
      }

      return data as unknown as CaseStudyRecord;
    } else {
      // Insert
      const { data, error } = await supabaseAdmin
        .from("case_studies")
        .insert({
          slug: validated.slug,
          kind: validated.kind,
          status: validated.status,
          sort_order: validated.sort_order,
          featured: validated.featured,
          client: validated.client,
          year: validated.year,
          location: validated.location,
          offer: validated.offer ?? null,
          cover_path: validated.cover_path ?? null,
          gallery: validated.gallery as unknown as import("@/integrations/supabase/types").Json,
          translations: validated.translations as unknown as import("@/integrations/supabase/types").Json,
          published_at: isPublishing ? (validated.published_at || now) : null,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        console.error("[saveCase] Insert error:", error.message);
        throw new Error(`Failed to create case study: ${error.message}`);
      }

      return data as unknown as CaseStudyRecord;
    }
  });

export const deleteCase = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("case_studies")
      .delete()
      .eq("id", input.id);

    if (error) {
      console.error("[deleteCase] Error:", error.message);
      throw new Error(`Failed to delete case study: ${error.message}`);
    }

    return { ok: true as const };
  });

export const reorderCases = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { items: Array<{ id: string; sort_order: number }> }) =>
    z
      .object({
        items: z.array(
          z.object({
            id: z.string().uuid(),
            sort_order: z.number().int(),
          }),
        ),
      })
      .parse(data),
  )
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Update each case's sort_order
    for (const item of input.items) {
      const { error } = await supabaseAdmin
        .from("case_studies")
        .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
        .eq("id", item.id);

      if (error) {
        console.error(`[reorderCases] Error updating ${item.id}:`, error.message);
      }
    }

    return { ok: true as const };
  });

export const setCaseStatus = createServerFn({ method: "POST" })
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

    const now = new Date().toISOString();
    const updatePayload: import("@/integrations/supabase/types").Database["public"]["Tables"]["case_studies"]["Update"] = {
      status: input.status,
      updated_at: now,
      ...(input.status === "published" ? { published_at: now } : {}),
    };

    const { data, error } = await supabaseAdmin
      .from("case_studies")
      .update(updatePayload)
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.error("[setCaseStatus] Error:", error.message);
      throw new Error(`Failed to change status: ${error.message}`);
    }

    return data as unknown as CaseStudyRecord;
  });

export const signUpload = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { filename: string; contentType?: string }) =>
    z
      .object({
        filename: z.string().min(1),
        contentType: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const cleanName = input.filename
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const storagePath = `cases/${Date.now()}-${cleanName}`;

    const { data, error } = await supabaseAdmin.storage
      .from("media")
      .createSignedUploadUrl(storagePath);

    if (error) {
      console.error("[signUpload] Error creating signed URL:", error.message);
      throw new Error(`Failed to get upload signature: ${error.message}`);
    }

    return {
      path: storagePath,
      signedUrl: data.signedUrl,
      token: data.token,
    };
  });

export const setFeatured = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { id: string; featured: boolean }) =>
    z
      .object({
        id: z.string().uuid(),
        featured: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("case_studies")
      .update({ featured: input.featured, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.error("[setFeatured] Error:", error.message);
      throw new Error(`Failed to update featured status: ${error.message}`);
    }

    return data as unknown as CaseStudyRecord;
  });
