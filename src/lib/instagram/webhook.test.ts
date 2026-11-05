import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import {
  verifyWebhookSignature,
  handleWebhookChallenge,
} from "./webhook.server";

describe("Instagram Webhook - Signature Verification", () => {
  const testSecret = "super-secret-volka-app-key-12345";
  const payload = JSON.stringify({
    object: "instagram",
    entry: [{ id: "123", time: 1700000000 }],
  });

  function generateSignature(body: string, secret: string): string {
    const hash = crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");
    return `sha256=${hash}`;
  }

  it("accepts valid HMAC-SHA256 signature", () => {
    const signature = generateSignature(payload, testSecret);
    const valid = verifyWebhookSignature(payload, signature, testSecret);
    expect(valid).toBe(true);
  });

  it("rejects tampered payload body", () => {
    const signature = generateSignature(payload, testSecret);
    const tamperedPayload = payload + " ";
    const valid = verifyWebhookSignature(tamperedPayload, signature, testSecret);
    expect(valid).toBe(false);
  });

  it("rejects wrong secret", () => {
    const signature = generateSignature(payload, "wrong-secret");
    const valid = verifyWebhookSignature(payload, signature, testSecret);
    expect(valid).toBe(false);
  });

  it("rejects missing or empty signature header", () => {
    expect(verifyWebhookSignature(payload, null, testSecret)).toBe(false);
    expect(verifyWebhookSignature(payload, undefined, testSecret)).toBe(false);
    expect(verifyWebhookSignature(payload, "", testSecret)).toBe(false);
  });

  it("rejects empty secret", () => {
    const signature = generateSignature(payload, testSecret);
    expect(verifyWebhookSignature(payload, signature, "")).toBe(false);
  });
});

describe("Instagram Webhook - Verification Handshake (hub.challenge)", () => {
  const originalToken = process.env["IG_WEBHOOK_VERIFY_TOKEN"];

  it("returns challenge string when verify token matches", () => {
    process.env["IG_WEBHOOK_VERIFY_TOKEN"] = "volka_verify_token_secure_99";

    const url = new URL(
      "https://volkastudio.com/api/ig/webhook?hub.mode=subscribe&hub.verify_token=volka_verify_token_secure_99&hub.challenge=1158201444",
    );

    const response = handleWebhookChallenge(url);
    expect(response.status).toBe(200);

    // Restore
    process.env["IG_WEBHOOK_VERIFY_TOKEN"] = originalToken;
  });

  it("returns 403 when verify token does not match", () => {
    process.env["IG_WEBHOOK_VERIFY_TOKEN"] = "volka_verify_token_secure_99";

    const url = new URL(
      "https://volkastudio.com/api/ig/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=1158201444",
    );

    const response = handleWebhookChallenge(url);
    expect(response.status).toBe(403);

    // Restore
    process.env["IG_WEBHOOK_VERIFY_TOKEN"] = originalToken;
  });
});

