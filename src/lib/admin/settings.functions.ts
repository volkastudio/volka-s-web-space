import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth, logAdminAction } from "@/integrations/supabase/admin-middleware";
import type { Database, Json } from "@/integrations/supabase/types";

export type SiteSettingPrimitive = string | number | boolean | null;
export type SiteSettingValue = Record<string, SiteSettingPrimitive>;

const PUBLIC_SETTING_KEYS = ["socials", "contact", "audit", "general"] as const;

export const getPublicSiteSettings = createServerFn({ method: "GET" })
  .validator((data: { key: string }) =>
    z.object({ key: z.enum(PUBLIC_SETTING_KEYS) }).parse(data),
  )
  .handler(async ({ data: input }): Promise<SiteSettingValue | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("key, value, updated_at")
      .eq("key", input.key)
      .maybeSingle();

    if (error) {
      console.warn(`[getPublicSiteSettings] Could not load setting '${input.key}':`, error.message);
      return null;
    }

    return (data?.value ?? null) as SiteSettingValue | null;
  });

export const getAdminSiteSettings = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator((data: { key: string }) => z.object({ key: z.string().min(1) }).parse(data))
  .handler(async ({ data: input }): Promise<SiteSettingValue | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("key, value, updated_at, updated_by")
      .eq("key", input.key)
      .maybeSingle();

    if (error) {
      console.error(`[getAdminSiteSettings] Error loading '${input.key}':`, error.message);
      throw new Error(`Failed to load site setting: ${error.message}`);
    }

    return (data?.value ?? null) as SiteSettingValue | null;
  });

export const updateAdminSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator(
    (data: { key: string; value: SiteSettingValue }) =>
      z
        .object({
          key: z.string().min(1),
          value: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
        })
        .parse(data),
  )
  .handler(async ({ data: input, context }): Promise<{ success: true; key: string; value: SiteSettingValue }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .upsert(
        {
          key: input.key,
          value: input.value as unknown as Database["public"]["Tables"]["site_settings"]["Insert"]["value"],
          updated_at: now,
          updated_by: context.userId,
        },
        { onConflict: "key" },
      )
      .select("key, value, updated_at")
      .single();

    if (error) {
      console.error(`[updateAdminSiteSettings] Error saving '${input.key}':`, error.message);
      throw new Error(`Failed to save site setting: ${error.message}`);
    }

    // Record audit log entry (Finding F7)
    await logAdminAction({
      actorId: context.userId,
      action: "update_site_setting",
      entity: "site_settings",
      entityId: input.key,
      diff: input.value as Record<string, unknown>,
    });

    return {
      success: true,
      key: data.key,
      value: (data.value ?? {}) as SiteSettingValue,
    };
  });
