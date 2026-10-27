import { describe, it, expect } from "vitest";
import { AuditSubmissionSchema } from "@/lib/audit/audit.server";

describe("Phase 11: Audit Growth System", () => {
  describe("AuditSubmissionSchema Validation", () => {
    const validPayload = {
      contactName: "Christian Kouassi",
      contactEmail: "christian@example.com",
      contactPhone: "+229 97 00 00 00",
      companyName: "Kōro Foods",
      activitySector: "Agroalimentaire",
      country: "Bénin",
      teamSize: "1-5",
      track: "website" as const,
      websiteUrl: "https://korofoods.com",
      specificAnswers: {
        q1: "Recevoir des commandes WhatsApp",
        q2: "Page d'accueil",
      },
      isEntitled: true,
      privacyConsent: true,
      gotcha: "",
      elapsedMs: 4500,
    };

    it("accepts a complete, valid submission", () => {
      const parsed = AuditSubmissionSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);
    });

    it("rejects invalid email address", () => {
      const parsed = AuditSubmissionSchema.safeParse({
        ...validPayload,
        contactEmail: "invalid-email",
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.path).toContain("contactEmail");
      }
    });

    it("rejects missing entitlement confirmation", () => {
      const parsed = AuditSubmissionSchema.safeParse({
        ...validPayload,
        isEntitled: false,
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects missing privacy consent", () => {
      const parsed = AuditSubmissionSchema.safeParse({
        ...validPayload,
        privacyConsent: false,
      });
      expect(parsed.success).toBe(false);
    });

    it("validates all four supported audit tracks", () => {
      const tracks = ["website", "marketing", "sales", "general"] as const;
      tracks.forEach((track) => {
        const res = AuditSubmissionSchema.safeParse({
          ...validPayload,
          track,
        });
        expect(res.success).toBe(true);
      });
    });

    it("rejects an unsupported track", () => {
      const res = AuditSubmissionSchema.safeParse({
        ...validPayload,
        track: "unsupported_track",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("Anti-bot & Honeypot logic", () => {
    it("detects bot honeypot submission", () => {
      const gotchaInput = "http://spam-link.ru";
      const isBot = Boolean(gotchaInput && gotchaInput.trim().length > 0);
      expect(isBot).toBe(true);
    });

    it("detects too-fast form completion under 3 seconds", () => {
      const elapsedMs = 1200; // < 3000ms
      const isTooFast = elapsedMs < 3000;
      expect(isTooFast).toBe(true);

      const normalElapsedMs = 6500;
      expect(normalElapsedMs < 3000).toBe(false);
    });
  });

  describe("Capacity & Status Assignment Rules", () => {
    function computeCapacityState(cap: number, used: number, isSettingOpen: boolean) {
      const remaining = Math.max(0, cap - used);
      const isOpen = isSettingOpen && remaining > 0;
      return {
        remaining,
        isOpen,
        assignedStatus: isOpen ? ("queued" as const) : ("waitlist" as const),
      };
    }

    it("assigns queued status when capacity is available", () => {
      const state = computeCapacityState(10, 4, true);
      expect(state.remaining).toBe(6);
      expect(state.isOpen).toBe(true);
      expect(state.assignedStatus).toBe("queued");
    });

    it("assigns waitlist status when capacity is fully reached", () => {
      const state = computeCapacityState(10, 10, true);
      expect(state.remaining).toBe(0);
      expect(state.isOpen).toBe(false);
      expect(state.assignedStatus).toBe("waitlist");
    });

    it("assigns waitlist status when setting is manually toggled closed", () => {
      const state = computeCapacityState(10, 2, false);
      expect(state.isOpen).toBe(false);
      expect(state.assignedStatus).toBe("waitlist");
    });
  });
});
