// TanStack Start server functions for audit reports (Phase 11.1)
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";
import {
  getAuditReportByToken,
  createAuditReport,
  revokeAuditReport,
  getReportsForAudit,
  getAuditFindingsLibrary,
  type AuditScorecardItem,
  type AuditFinding,
  type AuditRecommendation,
} from "./audit-report.server";

/**
 * Public: Fetch a report by its raw token.
 */
export const getPublicAuditReport = createServerFn({ method: "GET" })
  .validator((data: { token: string }) =>
    z.object({ token: z.string().min(32) }).parse(data)
  )
  .handler(async ({ data }) => {
    return await getAuditReportByToken(data.token);
  });

/**
 * Admin: Create/send a new report for an audit.
 */
export const createAdminAuditReport = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) => data as {
    auditRequestId: string;
    locale?: string;
    scorecard: AuditScorecardItem[];
    findings: AuditFinding[];
    quickWins: AuditFinding[];
    recommendation: AuditRecommendation;
    minutesSpent?: number;
    sendEmail?: boolean;
  })
  .handler(async ({ data }) => {
    return await createAuditReport(data);
  });

/**
 * Admin: Revoke a report link.
 */
export const revokeAdminAuditReport = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { reportId: string }) =>
    z.object({ reportId: z.string().uuid() }).parse(data)
  )
  .handler(async ({ data }) => {
    return await revokeAuditReport(data.reportId);
  });

/**
 * Admin: Get all report versions for an audit.
 */
export const getAdminAuditReports = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator((data: { auditRequestId: string }) =>
    z.object({ auditRequestId: z.string().uuid() }).parse(data)
  )
  .handler(async ({ data }) => {
    return await getReportsForAudit(data.auditRequestId);
  });

/**
 * Admin: List findings from library.
 */
export const getAdminFindingsLibrary = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator((data?: { track?: string }) => data ?? {})
  .handler(async ({ data }) => {
    return await getAuditFindingsLibrary(data as { track?: string });
  });
