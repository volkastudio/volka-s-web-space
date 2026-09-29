import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(100),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  preferredChannel: z.enum(["email", "whatsapp"]),
  offer: z.string().trim().min(1).max(80),
  timeline: z.string().trim().min(1).max(80),
  budgetRange: z.string().trim().min(1).max(80),
  vision: z.string().trim().min(20, "A few more words, please").max(2000),
  challenge: z.string().trim().max(2000).optional().or(z.literal("")),
  referralSource: z.string().trim().max(120).optional().or(z.literal("")),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inquirySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("project_inquiries").insert({
      name: data.name,
      email: data.email,
      company: data.company || null,
      phone: data.phone || null,
      preferred_channel: data.preferredChannel,
      offer: data.offer,
      timeline: data.timeline,
      budget_range: data.budgetRange,
      vision: data.vision,
      challenge: data.challenge || null,
      referral_source: data.referralSource || null,
    });

    if (error) {
      console.error("Failed to store project inquiry", error.message);
      throw new Error("We could not send your brief. Please try again in a moment.");
    }

    return { ok: true as const };
  });
