import { describe, it, expect } from "vitest";

// The authoritative 7 Volka brand colors from Volka - Color Palette.png
export const VOLKA_PALETTE = {
  forestBlack: "#0E1C12",
  deepPine: "#01322D",
  sageMint: "#AAD4C6",
  warmIvory: "#FCF5EB",
  softPaper: "#FEFFF1",
  terracotta: "#A45727",
  warmOchre: "#C8853A",
} as const;

/**
 * Calculates relative luminance according to WCAG 2.1 specifications.
 */
function getLuminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = hex
    .replace(/^#/, "")
    .match(/.{2}/g)!
    .map((x) => parseInt(x, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates contrast ratio between two hex colors.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe("Volka Brand Color System (Phase 5a)", () => {
  it("defines all 7 official brand colors from Volka - Color Palette.png", () => {
    expect(VOLKA_PALETTE.forestBlack).toBe("#0E1C12");
    expect(VOLKA_PALETTE.deepPine).toBe("#01322D");
    expect(VOLKA_PALETTE.sageMint).toBe("#AAD4C6");
    expect(VOLKA_PALETTE.warmIvory).toBe("#FCF5EB");
    expect(VOLKA_PALETTE.softPaper).toBe("#FEFFF1");
    expect(VOLKA_PALETTE.terracotta).toBe("#A45727");
    expect(VOLKA_PALETTE.warmOchre).toBe("#C8853A");
  });

  it("passes WCAG AAA (7:1) for Forest Black text on Soft Paper background", () => {
    const ratio = getContrastRatio(VOLKA_PALETTE.forestBlack, VOLKA_PALETTE.softPaper);
    expect(ratio).toBeGreaterThanOrEqual(14.0); // Extremely crisp, ~14.8:1
  });

  it("passes WCAG AAA (7:1) for Forest Black text on Warm Ivory card surface", () => {
    const ratio = getContrastRatio(VOLKA_PALETTE.forestBlack, VOLKA_PALETTE.warmIvory);
    expect(ratio).toBeGreaterThanOrEqual(13.0); // ~13.8:1
  });

  it("passes WCAG AAA (7:1) for Soft Paper text on Deep Pine primary buttons", () => {
    const ratio = getContrastRatio(VOLKA_PALETTE.softPaper, VOLKA_PALETTE.deepPine);
    expect(ratio).toBeGreaterThanOrEqual(10.0); // ~10.5:1
  });

  it("passes WCAG AA (4.5:1) for Terracotta text/borders on Soft Paper canvas", () => {
    const ratio = getContrastRatio(VOLKA_PALETTE.terracotta, VOLKA_PALETTE.softPaper);
    expect(ratio).toBeGreaterThanOrEqual(4.5); // ~4.9:1
  });

  it("passes WCAG AA (4.5:1) for Forest Black text on Sage Mint badge pills", () => {
    const ratio = getContrastRatio(VOLKA_PALETTE.forestBlack, VOLKA_PALETTE.sageMint);
    expect(ratio).toBeGreaterThanOrEqual(8.0); // ~8.2:1
  });
});
