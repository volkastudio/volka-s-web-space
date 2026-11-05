import type {
  IgAutomationWithTargets,
  MatchMode,
  MatchResult,
  SimulationResult,
  SkipReason,
} from "./types";

/**
 * Normalises text for robust keyword matching:
 * 1. Unicode NFD normalization.
 * 2. Strip diacritical marks / accents (é -> e, à -> a, etc.).
 * 3. Lowercase.
 * 4. Replace non-alphanumeric characters (punctuation, symbols, emojis) with spaces.
 * 5. Collapse consecutive spaces and trim.
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Checks whether a single keyword matches a text according to match_mode.
 * Automatically normalises both the text and the keyword.
 */
export function matchesKeyword(
  text: string,
  rawKeyword: string,
  mode: MatchMode = "word",
): boolean {
  const normText = normalizeText(text);
  const normKw = normalizeText(rawKeyword);
  if (!normText || !normKw) return false;

  switch (mode) {
    case "exact":
      return normText === normKw;

    case "starts_with":
      return normText.startsWith(normKw) && (
        normText.length === normKw.length ||
        normText[normKw.length] === " "
      );

    case "contains":
      return normText.includes(normKw);

    case "word":
    default: {
      // Surround both with spaces for reliable whole-word / whole-phrase boundary checking
      const paddedText = ` ${normText} `;
      const paddedKw = ` ${normKw} `;
      return paddedText.includes(paddedKw);
    }
  }
}

/**
 * Checks if any keyword from an array matches the text.
 */
export function matchesAnyKeyword(
  text: string,
  keywords: string[],
  mode: MatchMode = "word",
): { matched: boolean; matchedKeyword?: string } {
  for (const kw of keywords) {
    if (matchesKeyword(text, kw, mode)) {
      return { matched: true, matchedKeyword: kw };
    }
  }
  return { matched: false };
}

/**
 * Checks if any excluded word appears in the text as a whole word.
 */
export function hasExcludedWord(
  text: string,
  excludedKeywords: string[],
): boolean {
  if (!excludedKeywords || excludedKeywords.length === 0) return false;
  const normText = normalizeText(text);
  const paddedText = ` ${normText} `;
  for (const excluded of excludedKeywords) {
    const normExcluded = normalizeText(excluded);
    if (normExcluded && paddedText.includes(` ${normExcluded} `)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a rule targets the given media_id.
 * If target_mode is 'any', it targets all media.
 * If target_mode is 'selected', it must match one of the rule's target media IDs.
 */
export function matchesTargetMedia(
  rule: IgAutomationWithTargets,
  mediaId: string | null | undefined,
): boolean {
  if (rule.target_mode === "any") return true;
  if (!mediaId) return false;
  if (!rule.targets || rule.targets.length === 0) return false;
  return rule.targets.some((t) => t.media_id === mediaId);
}

/**
 * Interpolates variables `{username}` and `{lien}` in DM text.
 */
export function interpolateDm(
  template: string,
  options: {
    username?: string | null;
    link?: string | null;
  },
): string {
  const rawUsername = options.username?.replace(/^@/, "").trim() || "";
  const link = options.link || "";

  let result = template
    .replace(/\{username\}/gi, rawUsername ? `@${rawUsername}` : "")
    .replace(/\{lien\}/gi, link);

  if (!rawUsername) {
    // Clean up empty greeting punctuation like "Salut  !" or "Hey  !" or leading orphan punctuation
    result = result
      .replace(/Salut\s*!/gi, "")
      .replace(/Bonjour\s*!/gi, "")
      .replace(/Hello\s*!/gi, "")
      .replace(/Hey\s*!/gi, "")
      .replace(/^[\s!?,.-]+/, "");
  }

  return result
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+\n/g, "\n\n")
    .trim();
}

/**
 * Pick a public reply variant at random if configured.
 */
export function pickPublicReply(variants?: string[] | null): string | undefined {
  if (!variants || variants.length === 0) return undefined;
  const valid = variants.map((v) => v.trim()).filter(Boolean);
  if (valid.length === 0) return undefined;
  const index = Math.floor(Math.random() * valid.length);
  return valid[index];
}

/**
 * Builds the tracked URL for the product link.
 */
export function buildProductUrl(
  siteUrl: string,
  productSlug?: string | null,
  ruleTag?: string | null,
  ruleName?: string,
): string {
  const base = siteUrl.replace(/\/+$/, "");
  if (!productSlug) {
    return base;
  }
  const tag = ruleTag || normalizeText(ruleName || "ig").replace(/\s+/g, "-");
  return `${base}/tools/${encodeURIComponent(productSlug)}?src=ig-${encodeURIComponent(tag)}`;
}

/**
 * Evaluates incoming comment/message against an ordered list of active automations.
 * Returns the first matching rule and the populated text.
 */
export function evaluateRules(
  rules: IgAutomationWithTargets[],
  input: {
    commentText: string;
    mediaId?: string | null;
    username?: string | null;
    ownUsername?: string | null;
    siteUrl: string;
  },
): MatchResult {
  const normalized = normalizeText(input.commentText);

  // 1. Check if comment is from the account itself
  if (
    input.ownUsername &&
    input.username &&
    input.username.toLowerCase() === input.ownUsername.toLowerCase()
  ) {
    return { matched: false, skipReason: "own_comment" };
  }

  // 2. Iterate through rules by position order
  const sortedRules = [...rules].sort((a, b) => a.position - b.position);

  let targetMismatchFound = false;

  for (const rule of sortedRules) {
    if (!rule.is_active) continue;

    // Check target media
    if (!matchesTargetMedia(rule, input.mediaId)) {
      targetMismatchFound = true;
      continue;
    }

    // Check excluded words
    if (hasExcludedWord(normalized, rule.exclude_keywords)) {
      return { matched: false, automation: rule, skipReason: "excluded_word" };
    }

    // Check keywords
    const { matched } = matchesAnyKeyword(normalized, rule.keywords, rule.match_mode);
    if (!matched) {
      continue;
    }

    // Check active date window if specified
    const now = new Date();
    if (rule.starts_at && new Date(rule.starts_at) > now) {
      return { matched: false, automation: rule, skipReason: "outside_dates" };
    }
    if (rule.ends_at && new Date(rule.ends_at) < now) {
      return { matched: false, automation: rule, skipReason: "outside_dates" };
    }

    // Build product link & interpolate DM
    const link = buildProductUrl(
      input.siteUrl,
      rule.product?.slug,
      rule.link_src_tag,
      rule.name,
    );

    const interpolatedDm = interpolateDm(rule.dm_text, {
      username: input.username,
      link,
    });

    const publicReply = pickPublicReply(rule.public_reply_variants);

    return {
      matched: true,
      automation: rule,
      interpolatedDm,
      publicReply,
    };
  }

  return {
    matched: false,
    skipReason: targetMismatchFound ? "no_rule_for_post" : "no_keyword",
  };
}

/**
 * Pure simulator for the backoffice test suite (no call to Meta).
 */
export function simulateMatch(
  rules: IgAutomationWithTargets[],
  input: {
    commentText: string;
    mediaId?: string | null;
    username?: string | null;
    siteUrl: string;
  },
): SimulationResult {
  const normalized = normalizeText(input.commentText);
  const result = evaluateRules(rules, input);

  if (result.matched && result.automation) {
    const { matchedKeyword } = matchesAnyKeyword(
      normalized,
      result.automation.keywords,
      result.automation.match_mode,
    );

    return {
      matched: true,
      ruleName: result.automation.name,
      ruleId: result.automation.id,
      interpolatedDm: result.interpolatedDm,
      publicReply: result.publicReply,
      normalizedComment: normalized,
      matchedKeyword,
    };
  }

  return {
    matched: false,
    skipReason: result.skipReason,
    normalizedComment: normalized,
    ruleName: result.automation?.name,
    ruleId: result.automation?.id,
  };
}

