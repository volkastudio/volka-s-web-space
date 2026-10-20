import koroFoodsImage from "@/assets/case-koro-foods.jpg";
import sayoImage from "@/assets/case-sayo.jpg";
import thePalmImage from "@/assets/case-the-palm.jpg";
import atelierNoirImage from "@/assets/case-atelier-noir.jpg";
import type { OfferId } from "@/data/offers";

export type CaseStudy = {
  slug: string;
  /**
   * "concept": a fictional client and brief created by Volka to show its process.
   *            Results are illustrative targets, not measured outcomes.
   * "client":  real delivered work. Only use this once the client has agreed to be
   *            named and the numbers and quote are real.
   */
  kind: "concept" | "client";
  client: string;
  tagline: string;
  discipline: string;
  sector: string;
  year: string;
  location: string;
  offer: OfferId;
  image: string;
  imageAlt: string;
  summary: string;
  context: string;
  challenge: string;
  execution: string;
  services: string[];
  deliverables: string[];
  /** Target outcomes for concepts; measured results for real client work. */
  results: { value: string; label: string }[];
  /** Real testimonials only. Leave undefined for concept projects. */
  quote?: { text: string; author: string; role: string };
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "koro-foods",
    kind: "concept",
    client: "Kòrò Foods",
    tagline: "A pantry brand with the poise of an export house.",
    discipline: "Brand identity",
    sector: "Food & retail",
    year: "2025",
    location: "Cotonou, Bénin",
    offer: "Autorité",
    image: koroFoodsImage,
    imageAlt: "Kòrò Foods packaging system in cream and gold on a deep green surface",
    summary:
      "A regional food producer with excellent products and packaging that undersold every one of them.",
    context:
      "Kòrò had spent six years building a trusted supply chain for shea, hibiscus, honey and cold-pressed oils. Buyers in Lagos and Paris loved the product and hesitated at the shelf. Nothing about the packaging suggested the standard inside the jar.",
    challenge:
      "The brand needed to read as premium to an export buyer without losing the warmth that made it loved locally. Every earlier attempt had drifted into either generic minimalism or heavy-handed pattern work.",
    execution:
      "We built an identity around a single engraved landscape motif, a restrained gold-on-cream palette, and a typographic system disciplined enough to survive twelve SKUs. Packaging, market stall signage and the wholesale deck all draw from one kit.",
    services: ["Brand strategy", "Naming architecture", "Identity system", "Packaging design", "Brand guidelines"],
    deliverables: [
      "Primary and secondary logo suite",
      "Twelve-SKU packaging system",
      "Illustrated motif library",
      "42-page brand guide",
      "Wholesale and retail collateral",
    ],
    results: [
      { value: "3×", label: "Wholesale enquiries in the first quarter" },
      { value: "2", label: "New export markets opened" },
      { value: "+38%", label: "Average basket value in retail" },
    ],
  },
  {
    slug: "sayo",
    kind: "concept",
    client: "Sayo",
    tagline: "Making a young fintech feel like an institution.",
    discipline: "Digital platform",
    sector: "Financial services",
    year: "2025",
    location: "Lagos, Nigeria",
    offer: "Expansion",
    image: sayoImage,
    imageAlt: "Sayo mobile app shown on two phones with a calm green and cream interface",
    summary:
      "A personal finance app that needed to earn trust in the first eight seconds of use.",
    context:
      "Sayo had strong retention among users who made it past onboarding, and heavy drop-off before it. The interface was capable but spoke like a prototype.",
    challenge:
      "Financial confidence is a design problem. The product had to feel calm, legible and unmistakably safe on low-end Android devices and patchy networks alike.",
    execution:
      "We rebuilt the design system around a quiet green palette, generous typographic hierarchy and a one-decision-per-screen onboarding flow. Marketing site, product UI and support content now share one voice.",
    services: ["Product design system", "Onboarding UX", "Marketing site", "Design ops", "Content strategy"],
    deliverables: [
      "Component library across 60+ screens",
      "Rebuilt onboarding flow",
      "Marketing site and app store assets",
      "Accessibility and low-bandwidth guidelines",
    ],
    results: [
      { value: "−41%", label: "Onboarding drop-off" },
      { value: "+62%", label: "Weekly active users in four months" },
      { value: "4.7", label: "Average app store rating" },
    ],
  },
  {
    slug: "the-palm-hotel",
    kind: "concept",
    client: "The Palm",
    tagline: "A coastal hotel, booked direct.",
    discipline: "Digital platform",
    sector: "Hospitality",
    year: "2024",
    location: "Grand-Popo, Bénin",
    offer: "Autorité",
    image: thePalmImage,
    imageAlt: "The Palm hotel website on a laptop in a warm tropical lobby at golden hour",
    summary:
      "A beautiful property losing a fifth of every booking to platform commission.",
    context:
      "The Palm was full most weekends and dependent on third-party travel platforms to stay that way. Its own site was a brochure nobody finished reading.",
    challenge:
      "Direct booking only works when the site is faster, calmer and more persuasive than the marketplace listing sitting next to it in the search results.",
    execution:
      "We rebuilt the site as a single-purpose booking experience: full-bleed photography, room comparison that fits on one screen, transparent pricing and a three-step reservation flow that works on a phone with two bars of signal.",
    services: ["Web design", "Booking experience", "Photography direction", "Copywriting", "Local SEO"],
    deliverables: [
      "Bilingual website, French and English",
      "Direct booking flow",
      "Photography and art direction",
      "Search and maps optimisation",
    ],
    results: [
      { value: "+54%", label: "Direct bookings year on year" },
      { value: "−19%", label: "Commission paid to platforms" },
      { value: "1.4s", label: "Median page load on mobile" },
    ],
  },
  {
    slug: "atelier-noir",
    kind: "concept",
    client: "Atelier Noir",
    tagline: "A portfolio that closes commissions.",
    discipline: "Brand identity",
    sector: "Architecture",
    year: "2024",
    location: "Abidjan, Côte d'Ivoire",
    offer: "Présence",
    image: atelierNoirImage,
    imageAlt: "Atelier Noir architecture portfolio website on a large monitor in a concrete office",
    summary:
      "An architecture practice whose work outclassed every way it was being presented.",
    context:
      "Atelier Noir won work through relationships and lost it in the shortlist stage, where clients compared them against international firms with polished portfolios.",
    challenge:
      "Show the rigour of the practice without the noise of a typical agency site, and make the project archive easy to extend as the studio grows.",
    execution:
      "A restrained editorial system: one typeface, generous white space, project pages built around drawings and finished photography in sequence. The studio updates everything itself.",
    services: ["Visual identity", "Website design", "Project templates", "Photography direction"],
    deliverables: [
      "Identity refresh and typographic system",
      "Portfolio site with self-managed project pages",
      "Proposal and tender document templates",
    ],
    results: [
      { value: "+3", label: "Shortlist invitations in six months" },
      { value: "2×", label: "Average project value" },
      { value: "0", label: "Developer hours needed to publish a project" },
    ],
  },
];

export const getCaseStudy = (slug: string) => caseStudies.find((study) => study.slug === slug);

export const getNextCaseStudy = (slug: string): CaseStudy => {
  const index = caseStudies.findIndex((study) => study.slug === slug);
  return caseStudies[(index + 1) % caseStudies.length]!;
};
