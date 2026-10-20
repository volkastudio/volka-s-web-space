import { describe, expect, it } from "vitest";
import {
  caseStudySchema,
  caseStudyTranslationSchema,
  resolveCaseStudy,
  getMediaUrl,
  type CaseStudyRecord,
} from "./case-study-schema";

describe("caseStudyTranslationSchema", () => {
  it("accepts valid translation object", () => {
    const valid = {
      tagline: "Test tagline",
      discipline: "Brand identity",
      sector: "Fintech",
      imageAlt: "Alt description",
      summary: "Short summary",
      context: "Context paragraph",
      challenge: "Challenge paragraph",
      execution: "Execution paragraph",
      services: ["Strategy", "Design"],
      deliverables: ["Guidelines", "Logo"],
      results: [{ value: "2×", label: "Growth" }],
    };

    const parsed = caseStudyTranslationSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("fails if tagline is empty", () => {
    const invalid = {
      tagline: "",
      discipline: "Brand identity",
      sector: "Fintech",
      imageAlt: "Alt",
      summary: "Summary",
      context: "Context",
      challenge: "Challenge",
      execution: "Execution",
      services: ["Strategy"],
      deliverables: ["Logo"],
      results: [{ value: "1", label: "Metric" }],
    };

    const parsed = caseStudyTranslationSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});

describe("caseStudySchema", () => {
  it("accepts valid case study input", () => {
    const input = {
      slug: "koro-foods",
      kind: "concept",
      status: "published",
      sort_order: 1,
      featured: true,
      client: "Kòrò Foods",
      year: "2025",
      location: "Cotonou, Bénin",
      offer: "Autorité",
      cover_path: "cases/koro.jpg",
      gallery: [],
      translations: {
        fr: {
          tagline: "Tagline FR",
          discipline: "Identité",
          sector: "Agro",
          imageAlt: "Image FR",
          summary: "Résumé FR",
          context: "Contexte FR",
          challenge: "Défi FR",
          execution: "Exécution FR",
          services: ["Service 1"],
          deliverables: ["Livrable 1"],
          results: [{ value: "3×", label: "Demandes" }],
        },
      },
    };

    const parsed = caseStudySchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid slugs with uppercase or special characters", () => {
    const input = {
      slug: "Koro_Foods!",
      client: "Koro",
      year: "2025",
      location: "Cotonou",
      translations: {
        fr: {
          tagline: "Tagline",
          discipline: "Discipline",
          sector: "Sector",
          imageAlt: "Alt",
          summary: "Summary",
          context: "Context",
          challenge: "Challenge",
          execution: "Execution",
          services: ["Service"],
          deliverables: ["Deliverable"],
          results: [{ value: "1", label: "Result" }],
        },
      },
    };

    const parsed = caseStudySchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });
});

describe("resolveCaseStudy", () => {
  const mockRecord: CaseStudyRecord = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    slug: "sample-case",
    kind: "concept",
    status: "published",
    sort_order: 1,
    featured: true,
    client: "Sample Client",
    year: "2025",
    location: "Cotonou",
    offer: "Autorité",
    cover_path: "cases/sample.jpg",
    gallery: [],
    translations: {
      fr: {
        tagline: "Slogan français",
        discipline: "Identité de marque",
        sector: "Commerce",
        imageAlt: "Alt français",
        summary: "Résumé français",
        context: "Contexte français",
        challenge: "Défi français",
        execution: "Exécution française",
        services: ["Design de marque"],
        deliverables: ["Charte graphique"],
        results: [{ value: "+50%", label: "Conversion" }],
      },
      en: {
        tagline: "English tagline",
      },
    },
    published_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("resolves full French translation correctly", () => {
    const resolved = resolveCaseStudy(mockRecord, "fr");
    expect(resolved.client).toBe("Sample Client");
    expect(resolved.tagline).toBe("Slogan français");
    expect(resolved.discipline).toBe("Identité de marque");
    expect(resolved.services).toEqual(["Design de marque"]);
  });

  it("falls back to French fields when English translation is partial", () => {
    const resolved = resolveCaseStudy(mockRecord, "en");
    expect(resolved.tagline).toBe("English tagline");
    // discipline fell back to FR because EN didn't specify it
    expect(resolved.discipline).toBe("Identité de marque");
    expect(resolved.services).toEqual(["Design de marque"]);
  });
});

describe("getMediaUrl", () => {
  it("preserves absolute HTTP/HTTPS URLs", () => {
    expect(getMediaUrl("https://example.com/image.jpg")).toBe("https://example.com/image.jpg");
    expect(getMediaUrl("http://example.com/image.jpg")).toBe("http://example.com/image.jpg");
  });

  it("preserves relative asset paths", () => {
    expect(getMediaUrl("/assets/case.jpg")).toBe("/assets/case.jpg");
  });

  it("returns empty string for empty input", () => {
    expect(getMediaUrl("")).toBe("");
    expect(getMediaUrl(null)).toBe("");
  });
});
