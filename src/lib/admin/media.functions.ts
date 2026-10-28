// Server-only logic for the Médiathèque admin (/admin/media)
import { createServerFn } from "@tanstack/react-start";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";
import { z } from "zod";

export interface MediaFileItem {
  name: string;
  id: string;
  size: number;
  contentType: string;
  publicUrl: string;
}

export const listMediaFiles = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async (): Promise<MediaFileItem[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.storage
      .from("media")
      .list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw new Error(error.message);
    const supabaseUrl = process.env["SUPABASE_URL"] ?? "";
    return (data ?? []).map((f) => ({
      name: f.name,
      id: f.id ?? f.name,
      size: (f.metadata?.size ?? 0) as number,
      contentType: (f.metadata?.mimetype ?? "") as string,
      publicUrl: `${supabaseUrl}/storage/v1/object/public/media/${f.name}`,
    }));
  });

export const deleteMediaFile = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { path: string }) =>
    z.object({ path: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from("media").remove([data.path]);
    if (error) throw new Error(error.message);
    return { success: true as const };
  });
