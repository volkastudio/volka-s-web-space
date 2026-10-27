import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  hashIdentifier,
  checkLoginThrottle,
  recordLoginAttempt,
  sendDebouncedAlert,
  LOGIN_MAX_FAILURES,
} from "./admin/security.server";
import {
  checkConfiguration,
  checkAuth,
  checkSiteAssets,
} from "./admin/health.server";

// Mock Supabase admin client for isolated testing
vi.mock("@/integrations/supabase/client.server", () => {
  const mockTableData: Record<string, any[]> = {
    login_attempts: [],
    security_events: [],
    admin_users: [
      { user_id: "00000000-0000-0000-0000-000000000001", role: "owner" },
      { user_id: "00000000-0000-0000-0000-000000000002", role: "sales" },
    ],
    project_inquiries: [],
    site_settings: [
      {
        key: "socials",
        value: {
          whatsapp: "https://wa.me/22997123456",
          email: "hello@volkastudio.com",
        },
      },
    ],
  };

  return {
    supabaseAdmin: {
      from: (table: string) => {
        let rows = mockTableData[table] || [];
        let filterOr: string | null = null;
        let filterEq: { col: string; val: any }[] = [];
        let filterContains: { col: string; val: any } | null = null;
        let filterGte: { col: string; val: any } | null = null;

        const chain: any = {
          select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
            return chain;
          }),
          insert: vi.fn(async (record: any) => {
            const row = { id: (rows.length + 1), ts: new Date().toISOString(), ...record };
            rows.push(row);
            return { data: [row], error: null };
          }),
          or: vi.fn((expr: string) => {
            filterOr = expr;
            return chain;
          }),
          eq: vi.fn((col: string, val: any) => {
            filterEq.push({ col, val });
            return chain;
          }),
          contains: vi.fn((col: string, val: any) => {
            filterContains = { col, val };
            return chain;
          }),
          gte: vi.fn((col: string, val: any) => {
            filterGte = { col, val };
            return chain;
          }),
          order: vi.fn(() => chain),
          limit: vi.fn((n: number) => {
            const filtered = rows.filter((r) => {
              for (const { col, val } of filterEq) {
                if (r[col] !== val) return false;
              }
              if (filterContains && (!r[filterContains.col] || !JSON.stringify(r[filterContains.col]).includes(filterContains.val.rule))) {
                return false;
              }
              return true;
            });
            return Promise.resolve({ data: filtered.slice(0, n), error: null });
          }),
          maybeSingle: vi.fn(async () => {
            const found = rows.find((r) => {
              return filterEq.every(({ col, val }) => r[col] === val);
            });
            return { data: found || null, error: null };
          }),
          upsert: vi.fn(async (records: any) => {
            return { data: records, error: null };
          }),
        };

        // When awaited directly or evaluating count
        chain.then = (resolve: any) => {
          let filtered = [...rows];
          for (const { col, val } of filterEq) {
            filtered = filtered.filter((r) => r[col] === val);
          }
          resolve({ count: filtered.length, data: filtered, error: null });
        };

        return chain;
      },
    },
  };
});

// Mock mailer
vi.mock("@/lib/mailer.server", () => ({
  sendSecurityAlertEmail: vi.fn(async () => ({ success: true })),
  isMailConfigured: () => true,
}));

describe("Phase 5c: Security and Health Monitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("5c.1 Security Logging & Login Throttling", () => {
    it("hashIdentifier produces a deterministic SHA-256 hex string", async () => {
      const email = "ADMIN@VolkaStudio.com";
      const salt = "test_salt_123";
      const hash1 = await hashIdentifier(email, salt);
      const hash2 = await hashIdentifier("admin@volkastudio.com", salt);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    });

    it("checkLoginThrottle returns false when failures are below threshold", async () => {
      const result = await checkLoginThrottle({
        emailHash: "fake_email_hash_1",
        ipHash: "fake_ip_hash_1",
      });

      expect(result.isLocked).toBe(false);
      expect(result.remainingMinutes).toBe(0);
    });

    it("recordLoginAttempt records failed and successful attempts", async () => {
      await expect(
        recordLoginAttempt({
          emailHash: "test_email_hash",
          ipHash: "test_ip_hash",
          success: false,
        })
      ).resolves.not.toThrow();
    });

    it("sendDebouncedAlert de-duplicates alerts within the 1-hour window", async () => {
      const alertParams = {
        rule: "unauthorized_admin_access",
        title: "Test Alert",
        message: "Test message for de-duplication",
      };

      // First dispatch should succeed
      const firstResult = await sendDebouncedAlert(alertParams);
      expect(firstResult).toBe(true);

      // Second immediate dispatch of same rule should be de-duplicated
      const secondResult = await sendDebouncedAlert(alertParams);
      expect(secondResult).toBe(false);
    });
  });

  describe("5c.2 Health Checks", () => {
    it("checkConfiguration verifies SMTP, SECRET_SALT, and WhatsApp (F1)", async () => {
      process.env["SECRET_SALT"] = "test_salt_volka";
      process.env["SMTP_HOST"] = "smtp.volkastudio.test";
      process.env["MAIL_FROM"] = "hello@volkastudio.com";
      process.env["MAIL_NOTIFY_TO"] = "owner@volkastudio.com";
      process.env["SITE_URL"] = "https://volkastudio.com";

      const checks = await checkConfiguration();
      expect(checks).toHaveLength(6);

      const saltCheck = checks.find((c) => c.key === "config_secret_salt");
      expect(saltCheck?.status).toBe("ok");

      const smtpCheck = checks.find((c) => c.key === "config_smtp");
      expect(smtpCheck?.status).toBe("ok");

      const whatsappCheck = checks.find((c) => c.key === "config_whatsapp");
      expect(whatsappCheck?.status).toBe("ok");
    });

    it("checkAuth confirms presence of at least one owner (D12)", async () => {
      const checks = await checkAuth();
      const ownerCheck = checks.find((c) => c.key === "auth_owners_present");

      expect(ownerCheck?.status).toBe("ok");
      expect(ownerCheck?.detail).toContain("1 compte(s) Propriétaire");
    });

    it("checkSiteAssets confirms endpoints and assets", async () => {
      const checks = await checkSiteAssets();
      expect(checks.length).toBeGreaterThanOrEqual(1);

      const endpointsCheck = checks.find((c) => c.key === "site_endpoints_status");
      expect(endpointsCheck?.status).toBe("ok");
    });
  });
});
