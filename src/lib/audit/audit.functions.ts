import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";
import {
  getAuditCapacityStatus,
  submitAuditRequest,
  verifyAuditEmail,
  getAdminAuditsList,
  getAdminAuditById,
  updateAdminAuditStatus,
  updateAuditSettings,
  type AuditCapacityStatus,
  type AuditStatus,
} from "./audit.server";

function getClientIp(headers: Headers): string | undefined {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    undefined
  );
}

/**
 * Public capacity check for /audit page.
 */
export const getPublicAuditCapacity = createServerFn({ method: "GET" })
  .handler(async (): Promise<AuditCapacityStatus> => {
    return await getAuditCapacityStatus();
  });

/**
 * Public audit request submission.
 */
export const submitAuditForm = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<{ success: boolean; error?: string; auditId?: string }> => {
    let clientIp: string | undefined;
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const req = getRequest();
      if (req) {
        clientIp = getClientIp(req.headers);
      }
    } catch {
      // Ignore if server context not available
    }

    return await submitAuditRequest(data, clientIp);
  });

/**
 * Double opt-in token verification.
 */
export const verifyAuditTokenAction = createServerFn({ method: "POST" })
  .validator((data: { token: string }) =>
    z.object({ token: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }): Promise<{
    success: boolean;
    error?: string;
    status?: "queued" | "waitlist";
    company?: string;
    track?: string;
  }> => {
    return await verifyAuditEmail(data.token);
  });

/**
 * Admin: list audit requests with filters.
 */
export const getAdminAudits = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator((data: { status?: string; track?: string; limit?: number; offset?: number }) =>
    z
      .object({
        status: z.string().optional(),
        track: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
      .parse(data || {})
  )
  .handler(async ({ data }) => {
    return await getAdminAuditsList(data);
  });

/**
 * Admin: update audit status / notes.
 */
export const updateAdminAudit = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator(
    (data: {
      id: string;
      status?: AuditStatus;
      adminNotes?: string;
      markSent?: boolean;
    }) =>
      z
        .object({
          id: z.string().uuid(),
          status: z
            .enum(["pending_verification", "queued", "waitlist", "reviewing", "completed", "rejected"])
            .optional(),
          adminNotes: z.string().optional(),
          markSent: z.boolean().optional(),
        })
        .parse(data)
  )
  .handler(async ({ data }) => {
    return await updateAdminAuditStatus(data);
  });

/**
 * Admin: update capacity and delivery settings for /audit offer.
 */
export const saveAdminAuditSettings = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator(
    (data: {
      capacity_per_month?: number;
      delivery_working_days?: number;
      is_open?: boolean;
    }) =>
      z
        .object({
          capacity_per_month: z.number().int().min(1).max(100).optional(),
          delivery_working_days: z.number().int().min(1).max(30).optional(),
          is_open: z.boolean().optional(),
        })
        .parse(data)
  )
  .handler(async ({ data }): Promise<AuditCapacityStatus> => {
    return await updateAuditSettings(data);
  });

/**
 * Admin: fetch single audit request by ID for the workbench.
 */
export const getAdminAudit = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator((data: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(data)
  )
  .handler(async ({ data }) => {
    return await getAdminAuditById(data.id);
  });


