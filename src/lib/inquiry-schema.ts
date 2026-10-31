import { z } from "zod";

/**
 * Inquiry validation schema, shared by the /start form (client) and the
 * `submitInquiry` server function. Keep this file free of server-only imports
 * so it can be bundled for the browser and imported directly by unit tests.
 */
export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(100),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  preferredChannel: z.enum(["email", "whatsapp", "phone"]),
  offer: z.string().trim().min(1).max(80),
  timeline: z.string().trim().min(1).max(80),
  budgetRange: z.string().trim().min(1).max(80),
  vision: z.string().trim().min(20, "A few more words, please").max(2000),
  challenge: z.string().trim().max(2000).optional().or(z.literal("")),
  referralSource: z.string().trim().max(120).optional().or(z.literal("")),

  // ── Anti-spam and delivery metadata (not shown to the visitor) ──────────
  /** Language of the page the brief was sent from; picks the auto-reply language. */
  locale: z.enum(["fr", "en"]).optional(),
  /** Honeypot. Hidden from humans; any value means a bot filled it in. */
  website: z.string().max(200).optional(),
  /** Milliseconds between the form mounting and the submit click, measured on the client. */
  elapsedMs: z.number().int().nonnegative().optional(),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
