/**
 * Single source of truth for Volka offers and pricing.
 * Used by: home page "Ways to work together", /start scope picker,
 * and as the valid set of offer IDs for case studies.
 *
 * Prices are in XOF (primary), EUR and USD (secondary).
 * Update here and nowhere else.
 */

export type OfferId = "Présence" | "Autorité" | "Expansion" | "Accompagnement continu";

export type Offer = {
  id: OfferId;
  /** Short sequential label, e.g. "01" */
  index: string;
  /** Display name */
  name: string;
  /** One-line positioning tagline */
  tagline: string;
  prices: {
    xof: string; // e.g. "400 000 FCFA"
    eur: string; // e.g. "650 €"
    usd: string; // e.g. "$720"
  };
  /** Delivery window shown to clients */
  duration: string;
  /** Key deliverables, shown in the scope picker */
  includes: string[];
};

export const offers: Offer[] = [
  {
    id: "Présence",
    index: "01",
    name: "Présence",
    tagline: "A focused, custom website and the essential digital setup to look credible everywhere.",
    prices: { xof: "400 000 FCFA", eur: "650 €", usd: "$720" },
    duration: "10 days",
    includes: [
      "Up to 5 pages",
      "Mobile-first responsive design",
      "SEO fundamentals",
      "Contact or lead form",
      "Google Analytics setup",
    ],
  },
  {
    id: "Autorité",
    index: "02",
    name: "Autorité",
    tagline: "A complete visual identity, website, and content direction built as one coherent system.",
    prices: { xof: "From 1 000 000 FCFA", eur: "From 1 650 €", usd: "From $1 800" },
    duration: "18 days",
    includes: [
      "Full brand identity system",
      "Up to 10 pages",
      "Copywriting and content direction",
      "Social media starter kit",
      "Brand guidelines document",
    ],
  },
  {
    id: "Expansion",
    index: "03",
    name: "Expansion",
    tagline: "An advanced digital ecosystem for businesses ready to scale with confidence.",
    prices: { xof: "From 1 850 000 FCFA", eur: "From 3 000 €", usd: "From $3 300" },
    duration: "Scoped to project",
    includes: [
      "Everything in Autorité",
      "E-commerce or booking system",
      "Multilingual (FR/EN)",
      "Growth and conversion strategy",
      "Ongoing support option",
    ],
  },
  {
    id: "Accompagnement continu",
    index: "04",
    name: "Accompagnement continu",
    tagline: "A dedicated monthly partnership — design, strategy, and execution on tap.",
    prices: { xof: "Monthly retainer", eur: "Monthly retainer", usd: "Monthly retainer" },
    duration: "Monthly",
    includes: [
      "Priority access",
      "Monthly strategy session",
      "Design and dev hours",
      "Content updates and publishing",
      "Monthly performance report",
    ],
  },
];

/** Look up an offer by its ID. */
export const getOffer = (id: OfferId): Offer =>
  offers.find((o) => o.id === id)!;
