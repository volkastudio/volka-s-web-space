import { describe, it, expect } from "vitest";

import {
  MIN_FILL_MS,
  RATE_LIMIT_MAX,
  escapeHtml,
  getClientIp,
  hashIp,
  isHoneypotFilled,
  isRateLimited,
  isTooFast,
  stripLineBreaks,
} from "./inquiry-guards";

describe("honeypot", () => {
  it("is clean when empty, missing or whitespace", () => {
    expect(isHoneypotFilled(undefined)).toBe(false);
    expect(isHoneypotFilled("")).toBe(false);
    expect(isHoneypotFilled("   ")).toBe(false);
  });

  it("flags any real value", () => {
    expect(isHoneypotFilled("https://spam.example")).toBe(true);
  });
});

describe("isTooFast", () => {
  it("treats a missing timing value as a bot", () => {
    expect(isTooFast(undefined)).toBe(true);
  });

  it("rejects submissions faster than the minimum", () => {
    expect(isTooFast(0)).toBe(true);
    expect(isTooFast(MIN_FILL_MS - 1)).toBe(true);
  });

  it("accepts submissions at or above the minimum", () => {
    expect(isTooFast(MIN_FILL_MS)).toBe(false);
    expect(isTooFast(45_000)).toBe(false);
  });
});

describe("isRateLimited", () => {
  it("allows counts below the cap", () => {
    expect(isRateLimited(0)).toBe(false);
    expect(isRateLimited(RATE_LIMIT_MAX - 1)).toBe(false);
  });

  it("blocks at and above the cap", () => {
    expect(isRateLimited(RATE_LIMIT_MAX)).toBe(true);
    expect(isRateLimited(RATE_LIMIT_MAX + 3)).toBe(true);
  });

  it("honours a custom cap", () => {
    expect(isRateLimited(2, 2)).toBe(true);
    expect(isRateLimited(1, 2)).toBe(false);
  });
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("returns 'unknown' when no header is present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("hashIp", () => {
  it("is deterministic, hex, and never contains the raw IP", async () => {
    const a = await hashIp("203.0.113.7", "salt");
    const b = await hashIp("203.0.113.7", "salt");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("203.0.113.7");
  });

  it("changes with the salt and with the IP", async () => {
    const base = await hashIp("203.0.113.7", "salt");
    expect(await hashIp("203.0.113.7", "other-salt")).not.toBe(base);
    expect(await hashIp("203.0.113.8", "salt")).not.toBe(base);
  });
});

describe("escapeHtml", () => {
  it("escapes every HTML-significant character", () => {
    expect(escapeHtml(`<script>alert("x") & 'y'</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;) &amp; &#39;y&#39;&lt;/script&gt;",
    );
  });

  it("does not double-escape in a single pass", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });
});

describe("stripLineBreaks", () => {
  it("removes CR/LF so a value cannot inject mail headers", () => {
    const out = stripLineBreaks("Hello\r\nBcc: attacker@example.com");
    expect(out).not.toMatch(/[\r\n]/);
    expect(out).toBe("Hello Bcc: attacker@example.com");
  });

  it("trims the result", () => {
    expect(stripLineBreaks("  hi \n")).toBe("hi");
  });
});
