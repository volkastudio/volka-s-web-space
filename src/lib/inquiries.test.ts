/**
 * Unit tests for the inquiry schema. These import the real schema from
 * `inquiry-schema.ts` (a pure module with no server imports), so a change to
 * the production schema is tested automatically.
 */
import { describe, it, expect } from "vitest";

import { inquirySchema } from "./inquiry-schema";

const validPayload = {
  name: "Adéṣínà Kòrò",
  email: "adesinakoro@example.com",
  company: "Kòrò Foods",
  phone: "+22991000000",
  preferredChannel: "email" as const,
  offer: "Autorité",
  timeline: "Within a month",
  budgetRange: "500 000 – 1 000 000 FCFA / 800 – 1 500 €",
  vision: "We want to expand our brand to three new export markets within a year.",
  challenge: "Our current packaging does not travel well internationally.",
  referralSource: "Instagram",
};

describe("inquirySchema", () => {
  it("accepts a fully valid payload", () => {
    expect(inquirySchema.safeParse(validPayload).success).toBe(true);
  });

  it("accepts a minimal payload (only required fields)", () => {
    const result = inquirySchema.safeParse({
      name: "Ngozi",
      email: "ngozi@example.com",
      preferredChannel: "whatsapp",
      offer: "Présence",
      timeline: "As soon as possible",
      budgetRange: "Under 500 000 FCFA / 800 €",
      vision: "Launch a clean website for my new consultancy.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a name that is too short", () => {
    const result = inquirySchema.safeParse({ ...validPayload, name: "A" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe("Please tell us your name");
  });

  it("rejects an invalid email address", () => {
    const result = inquirySchema.safeParse({ ...validPayload, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe("Please enter a valid email address");
  });

  it("rejects an invalid preferredChannel", () => {
    expect(inquirySchema.safeParse({ ...validPayload, preferredChannel: "sms" }).success).toBe(false);
  });

  it("rejects a vision that is too short", () => {
    const result = inquirySchema.safeParse({ ...validPayload, vision: "Too short." });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe("A few more words, please");
  });

  it("rejects a vision that exceeds 2000 characters", () => {
    expect(inquirySchema.safeParse({ ...validPayload, vision: "a".repeat(2001) }).success).toBe(false);
  });

  it("trims whitespace from name and email", () => {
    const result = inquirySchema.safeParse({ ...validPayload, name: "  Mariam  ", email: "  mariam@example.com  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Mariam");
      expect(result.data.email).toBe("mariam@example.com");
    }
  });

  it("allows an empty string for optional fields", () => {
    expect(inquirySchema.safeParse({ ...validPayload, company: "", phone: "", challenge: "" }).success).toBe(true);
  });

  describe("delivery metadata", () => {
    it("accepts fr and en locales and rejects anything else", () => {
      expect(inquirySchema.safeParse({ ...validPayload, locale: "fr" }).success).toBe(true);
      expect(inquirySchema.safeParse({ ...validPayload, locale: "en" }).success).toBe(true);
      expect(inquirySchema.safeParse({ ...validPayload, locale: "de" }).success).toBe(false);
    });

    it("accepts the honeypot and timing fields", () => {
      const result = inquirySchema.safeParse({ ...validPayload, website: "", elapsedMs: 8421 });
      expect(result.success).toBe(true);
    });

    it("rejects a negative or fractional elapsedMs", () => {
      expect(inquirySchema.safeParse({ ...validPayload, elapsedMs: -1 }).success).toBe(false);
      expect(inquirySchema.safeParse({ ...validPayload, elapsedMs: 10.5 }).success).toBe(false);
    });
  });
});
