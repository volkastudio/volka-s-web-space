/**
 * Single source of truth for Volka offers and pricing.
 * Matches Section 10 of "The New Volka" strategy document:
 * 1. Résoudre un problème précis (À partir de 200 000 FCFA)
 * 2. Construire un système de croissance cohérent (À partir de 800 000 FCFA)
 * 3. Faire progresser le système dans la durée (À partir de 150 000 FCFA/mois)
 */

export type OfferId =
  | "Résoudre un problème précis"
  | "Construire un système de croissance cohérent"
  | "Faire progresser le système dans la durée"
  // Backwards compatibility aliases
  | "Présence"
  | "Autorité"
  | "Expansion"
  | "Accompagnement continu";

export type LocalizedOfferContent = {
  name: string;
  tagline: string;
  duration: string;
  cta: string;
  includes: string[];
};

export type Offer = {
  id: OfferId;
  slug: string;
  index: string;
  name: string;
  tagline: string;
  prices: {
    xof: string;
    eur: string;
    usd: string;
  };
  duration: string;
  cta: string;
  includes: string[];
  translations: {
    fr: LocalizedOfferContent;
    en: LocalizedOfferContent;
  };
};

export const offers: Offer[] = [
  {
    id: "Résoudre un problème précis",
    slug: "resoudre-un-probleme-precis",
    index: "01",
    name: "Résoudre un problème précis",
    tagline: "Une intervention ciblée pour résoudre un problème concret et améliorer un mécanisme précis de votre croissance.",
    prices: { xof: "À partir de 200 000 FCFA", eur: "À partir de 320 €", usd: "From $350" },
    duration: "1 à 2 semaines",
    cta: "Parler de mon projet",
    includes: [
      "Diagnostic et cadrage du point de friction",
      "Intervention sur un pilier précis (Perception, Conversion, Ventes ou Automatisation)",
      "Livrable opérationnel clé en main",
      "Déploiement et transfert d'usage",
      "Garantie de bon fonctionnement",
    ],
    translations: {
      fr: {
        name: "Résoudre un problème précis",
        tagline: "Une intervention ciblée pour résoudre un problème concret et améliorer un mécanisme précis de votre croissance.",
        duration: "1 à 2 semaines",
        cta: "Parler de mon projet",
        includes: [
          "Diagnostic et cadrage du point de friction",
          "Intervention sur un pilier précis (Perception, Conversion, Ventes ou Automatisation)",
          "Livrable opérationnel clé en main",
          "Déploiement et transfert d'usage",
          "Garantie de bon fonctionnement",
        ],
      },
      en: {
        name: "Solve a specific problem",
        tagline: "A targeted intervention to solve a concrete issue and improve a specific mechanism of your growth.",
        duration: "1 to 2 weeks",
        cta: "Discuss my project",
        includes: [
          "Diagnosis and scoping of the bottleneck",
          "Focused intervention on one pillar (Perception, Conversion, Sales or Automation)",
          "Turnkey operational deliverables",
          "Deployment and team handover",
          "Post-launch warranty",
        ],
      },
    },
  },
  {
    id: "Construire un système de croissance cohérent",
    slug: "construire-un-systeme-de-croissance-coherent",
    index: "02",
    name: "Construire un système de croissance cohérent",
    tagline: "Des solutions pensées ensemble pour connecter les bons éléments de votre croissance et en améliorer le fonctionnement.",
    prices: { xof: "À partir de 800 000 FCFA", eur: "À partir de 1 250 €", usd: "From $1,350" },
    duration: "3 à 5 semaines",
    cta: "Construire mon système",
    includes: [
      "Audit stratégique et cartographie du parcours client",
      "Alignement Perception + Conversion ou Acquisition + Ventes",
      "Plateforme web d'autorité ou système de marque complet",
      "Tunnel WhatsApp / CRM et intégration des flux",
      "Tableaux de bord et métriques de conversion",
    ],
    translations: {
      fr: {
        name: "Construire un système de croissance cohérent",
        tagline: "Des solutions pensées ensemble pour connecter les bons éléments de votre croissance et en améliorer le fonctionnement.",
        duration: "3 à 5 semaines",
        cta: "Construire mon système",
        includes: [
          "Audit stratégique et cartographie du parcours client",
          "Alignement Perception + Conversion ou Acquisition + Ventes",
          "Plateforme web d'autorité ou système de marque complet",
          "Tunnel WhatsApp / CRM et intégration des flux",
          "Tableaux de bord et métriques de conversion",
        ],
      },
      en: {
        name: "Build a coherent growth system",
        tagline: "Coordinated systems designed together to connect your growth levers and streamline performance.",
        duration: "3 to 5 weeks",
        cta: "Build my system",
        includes: [
          "Strategic audit and customer journey mapping",
          "Connecting Perception + Conversion or Acquisition + Sales",
          "High-converting digital platform or full brand identity",
          "WhatsApp funnel / CRM pipeline automation",
          "Performance dashboards and tracking",
        ],
      },
    },
  },
  {
    id: "Faire progresser le système dans la durée",
    slug: "faire-progresser-le-systeme-dans-la-duree",
    index: "03",
    name: "Faire progresser le système dans la durée",
    tagline: "Un accompagnement continu pour piloter, mesurer et améliorer les mécanismes de croissance de votre entreprise.",
    prices: { xof: "À partir de 150 000 FCFA/mois", eur: "À partir de 230 €/mois", usd: "From $250/mo" },
    duration: "Mensuel récurrent",
    cta: "Parlons de mes objectifs",
    includes: [
      "Pilotage et optimisation continue des leviers de croissance",
      "Campagnes d'acquisition, création de contenu et diffusion",
      "Optimisation constante du taux de conversion",
      "Maintenance, évolutions et automatisations de processus",
      "Point stratégique mensuel et reporting transparent",
    ],
    translations: {
      fr: {
        name: "Faire progresser le système dans la durée",
        tagline: "Un accompagnement continu pour piloter, mesurer et améliorer les mécanismes de croissance de votre entreprise.",
        duration: "Mensuel récurrent",
        cta: "Parlons de mes objectifs",
        includes: [
          "Pilotage et optimisation continue des leviers de croissance",
          "Campagnes d'acquisition, création de contenu et diffusion",
          "Optimisation constante du taux de conversion",
          "Maintenance, évolutions et automatisations de processus",
          "Point stratégique mensuel et reporting transparent",
        ],
      },
      en: {
        name: "Continuous system growth",
        tagline: "Ongoing advisory and execution to operate, measure, and refine your business growth engine.",
        duration: "Monthly recurring",
        cta: "Let's discuss objectives",
        includes: [
          "Ongoing management and performance optimization",
          "Acquisition campaigns, content production and distribution",
          "Continuous conversion rate optimization",
          "Maintenance, workflow refinements and automation",
          "Monthly strategic review and transparent reporting",
        ],
      },
    },
  },
];

/** Map old slugs or IDs to current offers for backwards compatibility */
const legacyMap: Record<string, string> = {
  presence: "resoudre-un-probleme-precis",
  autorite: "construire-un-systeme-de-croissance-coherent",
  expansion: "construire-un-systeme-de-croissance-coherent",
  "accompagnement-continu": "faire-progresser-le-systeme-dans-la-duree",
  Présence: "resoudre-un-probleme-precis",
  Autorité: "construire-un-systeme-de-croissance-coherent",
  Expansion: "construire-un-systeme-de-croissance-coherent",
  "Accompagnement continu": "faire-progresser-le-systeme-dans-la-duree",
};

/** Look up an offer by its ID or slug. */
export const getOffer = (idOrSlug: string): Offer | undefined => {
  const normalized = idOrSlug.toLowerCase().trim().replace(/\s+/g, "-");
  const resolvedSlug = legacyMap[idOrSlug] || legacyMap[normalized] || normalized;

  return offers.find(
    (o) =>
      o.id.toLowerCase() === idOrSlug.toLowerCase() ||
      o.slug === resolvedSlug ||
      o.slug === normalized,
  );
};

export const getLocalizedOffer = (offer: Offer, locale: "fr" | "en" = "fr") => {
  const t = offer.translations[locale] || offer.translations.fr;
  return {
    ...offer,
    name: t.name,
    tagline: t.tagline,
    duration: t.duration,
    cta: t.cta,
    includes: t.includes,
  };
};
