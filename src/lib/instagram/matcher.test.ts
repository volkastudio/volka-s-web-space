import { describe, expect, it } from "vitest";
import {
  normalizeText,
  matchesKeyword,
  matchesAnyKeyword,
  hasExcludedWord,
  interpolateDm,
  evaluateRules,
  simulateMatch,
} from "./matcher";
import type { IgAutomationWithTargets } from "./types";

describe("Instagram Matcher - normalizeText", () => {
  it("removes accents and diacritics", () => {
    expect(normalizeText("GUIDÉ")).toBe("guide");
    expect(normalizeText("Élégance à Paris")).toBe("elegance a paris");
    expect(normalizeText("Ça marche ?")).toBe("ca marche");
  });

  it("converts uppercase to lowercase", () => {
    expect(normalizeText("GUIDE")).toBe("guide");
    expect(normalizeText("VoLkA StUdIo")).toBe("volka studio");
  });

  it("replaces emoji and punctuation with spaces and collapses whitespace", () => {
    expect(normalizeText("Je veux le guide ! 🔥🚀")).toBe("je veux le guide");
    expect(normalizeText("hello...world???")).toBe("hello world");
    expect(normalizeText("  multi   spaced   text  ")).toBe("multi spaced text");
  });

  it("handles null/undefined gracefully", () => {
    expect(normalizeText(null)).toBe("");
    expect(normalizeText(undefined)).toBe("");
  });
});

describe("Instagram Matcher - Keyword Matching Modes", () => {
  it("matches whole word in 'word' mode", () => {
    expect(matchesKeyword("salut le guide svp", "guide", "word")).toBe(true);
    expect(matchesKeyword("GUIDE", "guide", "word")).toBe(true);
    expect(matchesKeyword("guidé !", "guide", "word")).toBe(true);
    // Should NOT match substring in another word
    expect(matchesKeyword("voici les guidelines", "guide", "word")).toBe(false);
    expect(matchesKeyword("misguided comment", "guide", "word")).toBe(false);
  });

  it("matches multi-word phrases in 'word' mode", () => {
    expect(matchesKeyword("oui je veux le lien merci", "je veux le lien", "word")).toBe(true);
    expect(matchesKeyword("je veux le lien", "je veux le lien", "word")).toBe(true);
    expect(matchesKeyword("je veux autre chose", "je veux le lien", "word")).toBe(false);
  });

  it("matches exact in 'exact' mode", () => {
    expect(matchesKeyword("guide", "guide", "exact")).toBe(true);
    expect(matchesKeyword("Guide !", "guide", "exact")).toBe(true);
    expect(matchesKeyword("le guide", "guide", "exact")).toBe(false);
  });

  it("matches starts_with in 'starts_with' mode", () => {
    expect(matchesKeyword("guide svp", "guide", "starts_with")).toBe(true);
    expect(matchesKeyword("guide", "guide", "starts_with")).toBe(true);
    expect(matchesKeyword("guidelines svp", "guide", "starts_with")).toBe(false);
    expect(matchesKeyword("je veux guide", "guide", "starts_with")).toBe(false);
  });

  it("matches contains in 'contains' mode", () => {
    expect(matchesKeyword("voici les guidelines", "guide", "contains")).toBe(true);
    expect(matchesKeyword("aucun mot", "guide", "contains")).toBe(false);
  });
});

describe("Instagram Matcher - Excluded Words", () => {
  it("identifies excluded words", () => {
    expect(hasExcludedWord("je ne veux pas de spam", ["spam", "arnaque"])).toBe(true);
    expect(hasExcludedWord("superbe travail !", ["spam", "arnaque"])).toBe(false);
  });
});

describe("Instagram Matcher - interpolateDm", () => {
  it("replaces {username} and {lien}", () => {
    const template = "Salut {username} 👋 Voici le lien : {lien}\nRéponds STOP pour te désinscrire.";
    const result = interpolateDm(template, {
      username: "alice_dev",
      link: "https://volkastudio.com/tools/guide",
    });

    expect(result).toContain("@alice_dev");
    expect(result).toContain("https://volkastudio.com/tools/guide");
    expect(result).toContain("Réponds STOP");
  });

  it("handles missing username gracefully", () => {
    const template = "Salut {username} ! Ton lien : {lien}";
    const result = interpolateDm(template, {
      username: null,
      link: "https://volkastudio.com/tools/guide",
    });
    expect(result).toBe("Ton lien : https://volkastudio.com/tools/guide");
  });
});

describe("Instagram Matcher - Rules Evaluation & Priority", () => {
  const mockRules: IgAutomationWithTargets[] = [
    {
      id: "rule-1",
      name: "Guide Acquisition",
      is_active: true,
      trigger: "comment",
      target_mode: "any",
      match_mode: "word",
      keywords: ["guide", "acquisition"],
      exclude_keywords: ["non", "pas de lien"],
      dm_text: "Salut {username} ! Voici ton guide : {lien}",
      public_reply_variants: ["C'est envoyé en DM ! 📩"],
      product_id: "prod-1",
      link_src_tag: "post-guide",
      one_per_user: true,
      cooldown_hours: 0,
      starts_at: null,
      ends_at: null,
      position: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product: {
        id: "prod-1",
        slug: "guide-acquisition",
        title: "Guide Acquisition B2B",
      },
    },
    {
      id: "rule-2",
      name: "Audit Express",
      is_active: true,
      trigger: "comment",
      target_mode: "selected",
      targets: [
        {
          id: "t-1",
          automation_id: "rule-2",
          media_id: "media_123",
          media_type: "post",
          permalink: "https://instagram.com/p/123",
          caption_excerpt: "Test post",
          thumbnail_url: null,
          created_at: new Date().toISOString(),
        },
      ],
      match_mode: "word",
      keywords: ["audit"],
      exclude_keywords: [],
      dm_text: "Voici le lien pour l'audit : {lien}",
      public_reply_variants: [],
      product_id: "prod-2",
      link_src_tag: "ig-audit",
      one_per_user: true,
      cooldown_hours: 0,
      starts_at: null,
      ends_at: null,
      position: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product: {
        id: "prod-2",
        slug: "audit-express",
        title: "Audit Express",
      },
    },
  ];

  it("matches first matching rule and returns formatted link", () => {
    const result = evaluateRules(mockRules, {
      commentText: "Je veux bien le GUIDE merci !",
      username: "sophie",
      siteUrl: "https://volkastudio.com",
    });

    expect(result.matched).toBe(true);
    expect(result.automation?.id).toBe("rule-1");
    expect(result.interpolatedDm).toContain("@sophie");
    expect(result.interpolatedDm).toContain("https://volkastudio.com/tools/guide-acquisition?src=ig-post-guide");
    expect(result.publicReply).toBe("C'est envoyé en DM ! 📩");
  });

  it("skips excluded words", () => {
    const result = evaluateRules(mockRules, {
      commentText: "guide mais non pas de lien",
      username: "sophie",
      siteUrl: "https://volkastudio.com",
    });

    expect(result.matched).toBe(false);
    expect(result.skipReason).toBe("excluded_word");
  });

  it("enforces media selection for targeted rules", () => {
    // Comment with 'audit' on wrong post -> no match
    const resultWrongPost = evaluateRules(mockRules, {
      commentText: "audit",
      mediaId: "media_999",
      username: "paul",
      siteUrl: "https://volkastudio.com",
    });
    expect(resultWrongPost.matched).toBe(false);

    // Comment with 'audit' on targeted post -> matches rule-2
    const resultTargetedPost = evaluateRules(mockRules, {
      commentText: "audit",
      mediaId: "media_123",
      username: "paul",
      siteUrl: "https://volkastudio.com",
    });
    expect(resultTargetedPost.matched).toBe(true);
    expect(resultTargetedPost.automation?.id).toBe("rule-2");
  });

  it("detects own account comments", () => {
    const result = evaluateRules(mockRules, {
      commentText: "guide",
      username: "volkastudio",
      ownUsername: "volkastudio",
      siteUrl: "https://volkastudio.com",
    });

    expect(result.matched).toBe(false);
    expect(result.skipReason).toBe("own_comment");
  });

  it("simulates match without side effects", () => {
    const sim = simulateMatch(mockRules, {
      commentText: "Salut, je veux le guide svp 🔥",
      username: "test_user",
      siteUrl: "https://volkastudio.com",
    });

    expect(sim.matched).toBe(true);
    expect(sim.ruleName).toBe("Guide Acquisition");
    expect(sim.matchedKeyword).toBe("guide");
    expect(sim.normalizedComment).toBe("salut je veux le guide svp");
  });
});

