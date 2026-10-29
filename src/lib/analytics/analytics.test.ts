import { describe, it, expect } from "vitest";
import {
  isReadQualified,
  computeDailyVisitorHash,
  isBotUserAgent,
  detectDeviceClass,
  detectBrowserFamily,
  ClientEventSchema,
} from "./schema";
import { ALLOWED_EVENT_NAMES } from "./types";

describe("Phase 12: First-Party Cookieless Analytics", () => {
  describe("12.1 Decision D17: Read Qualification Logic", () => {
    it("rejects read when scroll depth is below 70%", () => {
      // 5 min article -> required time = min(30, 300 * 0.4 = 120) = 30s
      // User spent 40s but only scrolled 65%
      const qualified = isReadQualified(65, 40, 5);
      expect(qualified).toBe(false);
    });

    it("rejects read when scroll depth is >= 70% but visible time is insufficient", () => {
      // 5 min article -> required time = 30s
      // User scrolled 85% in only 15s (skim / quick scroll)
      const qualified = isReadQualified(85, 15, 5);
      expect(qualified).toBe(false);
    });

    it("qualifies as Read when scroll >= 70% AND visible time >= min(30s, 40% reading time)", () => {
      // 5 min article -> required time = 30s
      // User scrolled 72% and spent 32s
      const qualified = isReadQualified(72, 32, 5);
      expect(qualified).toBe(true);
    });

    it("caps required reading time at 30 seconds for long articles", () => {
      // 10 min article (600s * 0.4 = 240s) -> capped at min(30, 240) = 30s
      expect(isReadQualified(75, 29, 10)).toBe(false);
      expect(isReadQualified(75, 30, 10)).toBe(true);
    });

    it("uses proportional 40% time for very short notes under 1 minute", () => {
      // 1 min article (60s) -> required time = min(30, 60 * 0.4 = 24s) = 24s
      expect(isReadQualified(80, 20, 1)).toBe(false);
      expect(isReadQualified(80, 24, 1)).toBe(true);
    });
  });

  describe("12.2 Decision D18: Anonymous Daily Visitor Hash Rotation", () => {
    const salt = "test-secret-salt-volka-2026";
    const ip = "197.234.221.15";
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15";

    it("generates deterministic 64-char sha256 hash for identical inputs", async () => {
      const hash1 = await computeDailyVisitorHash(ip, ua, "2026-10-29", salt);
      const hash2 = await computeDailyVisitorHash(ip, ua, "2026-10-29", salt);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    });

    it("rotates hash on the next day (zero cross-day profiling)", async () => {
      const todayHash = await computeDailyVisitorHash(ip, ua, "2026-10-29", salt);
      const tomorrowHash = await computeDailyVisitorHash(ip, ua, "2026-10-30", salt);
      expect(todayHash).not.toBe(tomorrowHash);
    });

    it("produces completely different hashes for different IPs or user agents", async () => {
      const hashA = await computeDailyVisitorHash(ip, ua, "2026-10-29", salt);
      const hashB = await computeDailyVisitorHash("197.234.221.16", ua, "2026-10-29", salt);
      const hashC = await computeDailyVisitorHash(ip, "OtherUA/1.0", "2026-10-29", salt);

      expect(hashA).not.toBe(hashB);
      expect(hashA).not.toBe(hashC);
    });

    it("never contains the raw IP in plaintext", async () => {
      const hash = await computeDailyVisitorHash(ip, ua, "2026-10-29", salt);
      expect(hash.includes("197.234")).toBe(false);
    });
  });

  describe("12.3 Bot Filter Detection", () => {
    it("identifies search crawlers as bots", () => {
      expect(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
      expect(isBotUserAgent("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)")).toBe(true);
      expect(isBotUserAgent("Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)")).toBe(true);
    });

    it("identifies social preview unfurlers as bots", () => {
      expect(isBotUserAgent("WhatsApp/2.21.19.21 A")).toBe(true);
      expect(isBotUserAgent("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")).toBe(true);
      expect(isBotUserAgent("TelegramBot (like TwitterBot)")).toBe(true);
      expect(isBotUserAgent("LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)")).toBe(true);
    });

    it("allows standard human browser user agents", () => {
      expect(isBotUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36")).toBe(false);
      expect(isBotUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1")).toBe(false);
      expect(isBotUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0")).toBe(false);
    });
  });

  describe("12.4 Device & Browser Detection", () => {
    it("detects mobile devices", () => {
      const iphoneUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Mobile/15E148";
      expect(detectDeviceClass(iphoneUa)).toBe("mobile");

      const androidPhoneUa = "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Mobile Safari/537.36";
      expect(detectDeviceClass(androidPhoneUa)).toBe("mobile");
    });

    it("detects tablets", () => {
      const ipadUa = "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15";
      expect(detectDeviceClass(ipadUa)).toBe("tablet");
    });

    it("detects desktops", () => {
      const desktopMac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0";
      expect(detectDeviceClass(desktopMac)).toBe("desktop");
    });

    it("detects browser family", () => {
      expect(detectBrowserFamily("Mozilla/5.0 (Windows NT 10.0) Edg/129.0.0.0")).toBe("Edge");
      expect(detectBrowserFamily("Mozilla/5.0 (Macintosh; Intel Mac OS X) Version/17.5 Safari/605.1.15")).toBe("Safari");
      expect(detectBrowserFamily("Mozilla/5.0 (X11; Ubuntu; Linux) Gecko/20100101 Firefox/130.0")).toBe("Firefox");
      expect(detectBrowserFamily("Mozilla/5.0 (Windows NT 10.0) Chrome/129.0.0.0 Safari/537.36")).toBe("Chrome");
    });
  });

  describe("12.5 Ingest Payload Schema Validation", () => {
    it("accepts valid pageview and funnel events", () => {
      for (const eventName of ALLOWED_EVENT_NAMES) {
        const result = ClientEventSchema.safeParse({
          eventName,
          path: "/journal/mon-article",
          entityType: "post",
          entityId: "mon-article",
          durationSeconds: 45,
          scrollDepth: 82,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects unknown event names outside the whitelist", () => {
      const result = ClientEventSchema.safeParse({
        eventName: "unauthorized_custom_event",
        path: "/",
      });
      expect(result.success).toBe(false);
    });

    it("rejects unsafe paths with directory traversal or script injection", () => {
      expect(ClientEventSchema.safeParse({ eventName: "pageview", path: "../etc/passwd" }).success).toBe(false);
      expect(ClientEventSchema.safeParse({ eventName: "pageview", path: "javascript:alert(1)" }).success).toBe(false);
      expect(ClientEventSchema.safeParse({ eventName: "pageview", path: "https://evil.com" }).success).toBe(false);
    });

    it("accepts valid root and sub-paths", () => {
      expect(ClientEventSchema.safeParse({ eventName: "pageview", path: "/" }).success).toBe(true);
      expect(ClientEventSchema.safeParse({ eventName: "pageview", path: "/start" }).success).toBe(true);
      expect(ClientEventSchema.safeParse({ eventName: "pageview", path: "/cases/atelier-noir" }).success).toBe(true);
      expect(ClientEventSchema.safeParse({ eventName: "pageview", path: "/audit/demande" }).success).toBe(true);
    });
  });
});

