import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";
import {
  getProductBySlug,
  recordCtaClick,
  resolveRegionRedirect,
  listAdminProducts,
  saveAdminProduct,
  duplicateAdminProduct,
  listAdminBuyers,
  createAdminBuyer,
  importAdminBuyersBatch,
  getAdminEmailSequences,
  toggleSequenceActive,
  updateSequenceStep,
  sendTestSequenceEmail,
  suppressEmail,
  type DigitalProductWithRegions,
} from "./sales.server";

/**
 * Public: Get product and its checkout regions.
 */
export const getPublicProduct = createServerFn({ method: "GET" })
  .validator((data: { slug: string }) =>
    z.object({ slug: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }): Promise<DigitalProductWithRegions | null> => {
    return await getProductBySlug(data.slug);
  });

/**
 * Public: Record that the user clicked the main "Obtenir" CTA.
 */
export const trackProductCta = createServerFn({ method: "POST" })
  .validator((data: { slug: string }) =>
    z.object({ slug: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    await recordCtaClick(data.slug);
    return { success: true };
  });

/**
 * Public: Resolve destination redirect URL for region pick.
 */
export const getRegionRedirectUrl = createServerFn({ method: "POST" })
  .validator((data: { slug: string; regionKey: string; sourceTag?: string | undefined }) =>
    z
      .object({
        slug: z.string().min(1),
        regionKey: z.string().min(1),
        sourceTag: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }): Promise<{ redirectUrl: string | null }> => {
    const url = await resolveRegionRedirect(data.slug, data.regionKey, data.sourceTag);
    return { redirectUrl: url };
  });

/**
 * Admin: List all products.
 */
export const getAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    return await listAdminProducts();
  });

/**
 * Admin: Save/update product with its regions.
 */
export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) => data as Parameters<typeof saveAdminProduct>[0])
  .handler(async ({ data }) => {
    return await saveAdminProduct(data);
  });

/**
 * Admin: Clone product.
 */
export const duplicateProduct = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(data)
  )
  .handler(async ({ data }) => {
    return await duplicateAdminProduct(data.id);
  });

/**
 * Admin: List buyers.
 */
export const getAdminBuyers = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator((data: {
    search?: string | undefined;
    consent?: string | undefined;
    platform?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
  }) => z.record(z.unknown()).parse(data || {}))
  .handler(async ({ data }) => {
    return await listAdminBuyers(data as Parameters<typeof listAdminBuyers>[0]);
  });

/**
 * Admin: Add buyer manually.
 */
export const addAdminBuyer = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) => data as Parameters<typeof createAdminBuyer>[0])
  .handler(async ({ data }) => {
    return await createAdminBuyer(data);
  });

/**
 * Admin: Import CSV batch.
 */
export const importBuyersCsv = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { rows: Parameters<typeof importAdminBuyersBatch>[0] }) =>
    z.object({ rows: z.array(z.record(z.unknown())) }).parse(data)
  )
  .handler(async ({ data }) => {
    return await importAdminBuyersBatch(data.rows as Parameters<typeof importAdminBuyersBatch>[0]);
  });

/**
 * Admin: Get email sequences and stats.
 */
export const getAdminSequences = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    return await getAdminEmailSequences();
  });

/**
 * Admin: Toggle sequence active state.
 */
export const toggleSequence = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { sequenceId: string; active: boolean }) =>
    z.object({ sequenceId: z.string().uuid(), active: z.boolean() }).parse(data)
  )
  .handler(async ({ data }) => {
    return await toggleSequenceActive(data.sequenceId, data.active);
  });

/**
 * Admin: Update sequence step.
 */
export const updateStep = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator(
    (data: {
      stepId: string;
      delay_days?: number;
      subject_fr?: string;
      body_fr?: string;
    }) =>
      z
        .object({
          stepId: z.string().uuid(),
          delay_days: z.number().int().min(1).max(90).optional(),
          subject_fr: z.string().min(1).optional(),
          body_fr: z.string().min(1).optional(),
        })
        .parse(data)
  )
  .handler(async ({ data }) => {
    const patch: { delay_days?: number; subject_fr?: string; body_fr?: string } = {};
    if (data.delay_days !== undefined) patch.delay_days = data.delay_days;
    if (data.subject_fr !== undefined) patch.subject_fr = data.subject_fr;
    if (data.body_fr !== undefined) patch.body_fr = data.body_fr;
    return await updateSequenceStep(data.stepId, patch);
  });

/**
 * Admin: Send a test email for a sequence step.
 */
export const sendTestSequence = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { stepId: string; recipientEmail: string }) =>
    z.object({ stepId: z.string().uuid(), recipientEmail: z.string().email() }).parse(data)
  )
  .handler(async ({ data }) => {
    return await sendTestSequenceEmail(data.stepId, data.recipientEmail);
  });

/**
 * Admin: Delete a digital product and its associated regions.
 */
export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(data)
  )
  .handler(async ({ data }) => {
    const { deleteAdminProduct } = await import("./sales.server");
    return await deleteAdminProduct(data.id);
  });

/**
 * Public: One-click unsubscribe from buyer follow-up emails.
 */
export const submitUnsubscribe = createServerFn({ method: "POST" })
  .validator((data: { email: string }) =>
    z.object({ email: z.string().email() }).parse(data)
  )
  .handler(async ({ data }) => {
    return await suppressEmail(data.email, "unsubscribe");
  });

