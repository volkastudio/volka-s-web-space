// Server-only logic for the Médiathèque admin (/admin/media)
import { createServerFn } from "@tanstack/react-start";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";
import { z } from "zod";
import { getMediaUrl } from "@/lib/case-study-schema";

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
    const supabaseUrl = (
      process.env["SUPABASE_URL"] ??
      process.env["VITE_SUPABASE_URL"] ??
      ""
    ).replace(/\/$/, "");

    // 1. Recursively list files in Supabase Storage "media" bucket across all directories
    async function listPrefix(prefix = ""): Promise<MediaFileItem[]> {
      try {
        const { data, error } = await supabaseAdmin.storage
          .from("media")
          .list(prefix, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });

        if (error || !data) return [];

        const items: MediaFileItem[] = [];

        for (const item of data) {
          if (item.name === ".emptyFolderPlaceholder") continue;
          const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

          // Check if item is a folder: in Supabase Storage, folder objects lack mime types or id
          const isFolder =
            !item.id ||
            item.metadata === null ||
            item.metadata === undefined ||
            item.metadata?.mimetype === undefined;

          if (isFolder) {
            const sub = await listPrefix(fullPath);
            items.push(...sub);
          } else {
            const size = (item.metadata?.size ?? 0) as number;
            const contentType = (item.metadata?.mimetype ?? "") as string;
            items.push({
              name: fullPath,
              id: item.id || fullPath,
              size,
              contentType: contentType || (/\.(jpe?g|png|webp|gif|svg|avif)$/i.test(fullPath) ? "image/jpeg" : ""),
              publicUrl: `${supabaseUrl}/storage/v1/object/public/media/${fullPath}`,
            });
          }
        }
        return items;
      } catch (err) {
        console.warn(`[listMediaFiles] Failed to list prefix "${prefix}":`, err);
        return [];
      }
    }

    const storageFiles = await listPrefix("");

    // Also check known subdirectories in case the root list didn't yield folder placeholders
    const knownFolders = ["cases", "posts", "uploads", "general", "covers", "products"];
    for (const folder of knownFolders) {
      if (!storageFiles.some((f) => f.name.startsWith(`${folder}/`))) {
        const sub = await listPrefix(folder);
        for (const file of sub) {
          if (!storageFiles.some((f) => f.name === file.name)) {
            storageFiles.push(file);
          }
        }
      }
    }

    // 2. Collect all media paths referenced in database records (case studies, posts, products)
    const seenNames = new Set(storageFiles.map((f) => f.name.toLowerCase()));
    const dbItems: MediaFileItem[] = [];

    try {
      const [casesRes, postsRes, productsRes] = await Promise.all([
        supabaseAdmin.from("case_studies").select("cover_path, gallery").limit(500),
        supabaseAdmin.from("posts").select("cover_path").limit(500),
        supabaseAdmin.from("digital_products").select("cover_image").limit(500),
      ]);

      const addDbPath = (rawPath: string | null | undefined) => {
        if (!rawPath) return;
        const trimmed = rawPath.trim();
        if (!trimmed) return;
        const normalized = trimmed.replace(/^\/+/, "");

        if (!seenNames.has(normalized.toLowerCase()) && !seenNames.has(trimmed.toLowerCase())) {
          seenNames.add(normalized.toLowerCase());
          seenNames.add(trimmed.toLowerCase());
          const publicUrl = getMediaUrl(trimmed);
          dbItems.push({
            name: normalized,
            id: `db-${normalized}`,
            size: 0,
            contentType: /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(trimmed) ? "image/jpeg" : "image/*",
            publicUrl,
          });
        }
      };

      if (casesRes.data) {
        for (const row of casesRes.data) {
          addDbPath(row.cover_path);
          if (Array.isArray(row.gallery)) {
            for (const item of row.gallery) {
              if (typeof item === "string") addDbPath(item);
              else if (item && typeof item === "object" && "path" in item) {
                addDbPath((item as { path?: string }).path);
              }
            }
          }
        }
      }

      if (postsRes.data) {
        for (const row of postsRes.data) {
          addDbPath(row.cover_path);
        }
      }

      if (productsRes.data) {
        for (const row of productsRes.data) {
          addDbPath(row.cover_image);
        }
      }
    } catch (dbErr) {
      console.warn("[listMediaFiles] Failed to load media from DB tables:", dbErr);
    }

    // Combine storage files + DB media files
    const allFiles = [...storageFiles, ...dbItems];
    return allFiles;
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
