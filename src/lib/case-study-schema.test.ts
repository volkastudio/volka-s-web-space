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

describe("caseStudyGallerySchema", () => {
  it("defaults to disabled coverflow when given empty array or undefined", () => {
    const fromArray = caseStudySchema.shape.gallery.parse([]);
    expect(fromArray).toEqual({ enabled: false, style: "coverflow", images: [] });

    const fromNull = caseStudySchema.shape.gallery.parse(null);
    expect(fromNull).toEqual({ enabled: false, style: "coverflow", images: [] });
  });

  it("parses valid gallery config with style coverflow or perspective", () => {
    const config = {
      enabled: true,
      style: "perspective" as const,
      images: [
        { id: "1", url: "cases/img1.webp", alt: "First" },
        { id: "2", url: "cases/img2.webp", alt: "Second" },
        { id: "3", url: "cases/img3.webp", alt: "Third" },
      ],
    };
    const parsed = caseStudySchema.shape.gallery.parse(config);
    expect(parsed.enabled).toBe(true);
    expect(parsed.style).toBe("perspective");
    expect(parsed.images).toHaveLength(3);
    expect(parsed.images[0]?.alt).toBe("First");
  });

  it("normalizes legacy gallery array with path property", () => {
    const legacy = [
      { path: "cases/item1.jpg", alt: "Alt 1" },
      { path: "cases/item2.jpg", alt: "Alt 2" },
    ];
    const parsed = caseStudySchema.shape.gallery.parse(legacy);
    expect(parsed.enabled).toBe(false);
    expect(parsed.images).toHaveLength(2);
    expect(parsed.images[0]?.url).toBe("cases/item1.jpg");
    expect(parsed.images[0]?.alt).toBe("Alt 1");
  });

  it("resolves gallery image URLs in resolveCaseStudy", () => {
    const mockRecordWithGallery: CaseStudyRecord = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      slug: "gallery-case",
      kind: "concept",
      status: "published",
      sort_order: 1,
      featured: true,
      client: "Gallery Client",
      year: "2025",
      location: "Paris",
      offer: null,
      cover_path: "/assets/cover.jpg",
      gallery: {
        enabled: true,
        style: "coverflow",
        images: [
          { id: "g1", url: "/assets/g1.jpg", alt: "G1" },
          { id: "g2", url: "https://example.com/g2.jpg", alt: "G2" },
          { id: "g3", url: "cases/g3.webp", alt: "G3" },
        ],
      },
      translations: {
        fr: {
          tagline: "Tag",
          discipline: "Discipline",
          sector: "Sector",
          imageAlt: "Alt",
          summary: "Summary",
          context: "Context",
          challenge: "Challenge",
          execution: "Execution",
          services: ["S1"],
          deliverables: ["D1"],
          results: [{ value: "1", label: "R1" }],
        },
      },
      published_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const resolved = resolveCaseStudy(mockRecordWithGallery, "fr");
    expect(resolved.gallery?.enabled).toBe(true);
    expect(resolved.gallery?.style).toBe("coverflow");
    expect(resolved.gallery?.images).toHaveLength(3);
    expect(resolved.gallery?.images[0]?.url).toBe("/assets/g1.jpg");
    expect(resolved.gallery?.images[1]?.url).toBe("https://example.com/g2.jpg");
  });
});
