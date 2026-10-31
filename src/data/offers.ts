/**
 * Single source of truth for Volka offers and pricing.
 * Matches Section 10 of "The New Volka International" strategy document:
 * 1. Résoudre un problème précis (À partir de 1 500 € HT / From €1,500 excl. VAT)
 * 2. Construire un système de croissance cohérent (À partir de 5 000 € HT / From €5,000 excl. VAT)
 * 3. Faire progresser le système dans la durée (À partir de 800 € HT/mois / From €800/month excl. VAT)
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

/**
 * Starting price per currency, as numbers. These are the amounts you decide (D27):
 * they are never converted automatically. `xof` is FCFA. Edit them here.
 */
export type OfferAmounts = {
  xof: number;
  eur: number;
  usd: number;
  /** Recurring monthly price (shown as "/mois" or "/month"). */
  monthly: boolean;
};

export type Offer = {
  /** Numeric starting prices used for display in the visitor's currency. */
  amounts: OfferAmounts;
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
    tagline:
      "Une intervention ciblée pour résoudre un problème concret et améliorer un mécanisme précis de votre croissance.",
    prices: {
      eur: "À partir de 1 500 € HT",
      usd: "From $1,650",
      xof: "À partir de 1 000 000 FCFA",
    },
    amounts: { eur: 1500, usd: 1650, xof: 1000000, monthly: false },
    duration: "Projet ciblé",
    cta: "Parler de mon projet",
    includes: [
      "Diagnostic et cadrage du point de friction",
      "Intervention ciblée sur un pilier précis (Perception, Conversion, Ventes ou Automatisation)",
      "Une page de destination orientée conversion ou une clarification de message",
      "Configuration d'un flux CRM ou automatisation bien délimitée",
      "Déploiement, recette et transfert d'usage",
    ],
    translations: {
      fr: {
        name: "Résoudre un problème précis",
        tagline:
          "Une intervention ciblée pour résoudre un problème concret et améliorer un mécanisme précis de votre croissance.",
        duration: "Projet ciblé",
        cta: "Parler de mon projet",
        includes: [
          "Diagnostic et cadrage du point de friction",
          "Intervention ciblée sur un pilier précis (Perception, Conversion, Ventes ou Automatisation)",
          "Une page de destination orientée conversion ou une clarification de message",
          "Configuration d'un flux CRM ou automatisation bien délimitée",
          "Déploiement, recette et transfert d'usage",
        ],
      },
      en: {
        name: "Solve a specific problem",
        tagline:
          "A focused intervention to solve a concrete issue and improve one specific mechanism of your growth.",
        duration: "Focused project",
        cta: "Talk about my project",
        includes: [
          "Diagnosis and scoping of the bottleneck",
          "Focused intervention on a single pillar (Perception, Conversion, Sales, or Automation)",
          "Conversion-focused landing page or brand positioning alignment",
          "Defined CRM workflow setup or scoped automation",
          "Deployment, quality review, and team handover",
        ],
      },
    },
  },
  {
    id: "Construire un système de croissance cohérent",
    slug: "construire-un-systeme-de-croissance-coherent",
    index: "02",
    name: "Construire un système de croissance cohérent",
    tagline:
      "Des solutions pensées ensemble pour connecter les bons éléments de votre croissance et en améliorer le fonctionnement.",
    prices: {
      eur: "À partir de 5 000 € HT",
      usd: "From $5,500",
      xof: "À partir de 3 300 000 FCFA",
    },
    amounts: { eur: 5000, usd: 5500, xof: 3300000, monthly: false },
    duration: "Système",
    cta: "Construire mon système",
    includes: [
      "Diagnostic stratégique et cartographie du parcours client",
      "Connexion Perception + Conversion (positionnement et plateforme web)",
      "Connexion Acquisition + Conversion (campagnes et capture de demandes)",
      "Connexion Conversion + Ventes (parcours prospect et pipeline commercial)",
      "Automatisation de l'infrastructure de liaison et métriques clés",
    ],
    translations: {
      fr: {
        name: "Construire un système de croissance cohérent",
        tagline:
          "Des solutions pensées ensemble pour connecter les bons éléments de votre croissance et en améliorer le fonctionnement.",
        duration: "Système",
        cta: "Construire mon système",
        includes: [
          "Diagnostic stratégique et cartographie du parcours client",
          "Connexion Perception + Conversion (positionnement et plateforme web)",
          "Connexion Acquisition + Conversion (campagnes et capture de demandes)",
          "Connexion Conversion + Ventes (parcours prospect et pipeline commercial)",
          "Automatisation de l'infrastructure de liaison et métriques clés",
        ],
      },
      en: {
        name: "Build a coherent growth system",
        tagline:
          "Coordinated solutions designed together to connect the right parts of your growth and improve how they work.",
        duration: "System",
        cta: "Build my system",
        includes: [
          "Strategic diagnosis and customer journey mapping",
          "Connecting Perception + Conversion (positioning and digital platform)",
          "Connecting Acquisition + Conversion (campaigns and lead capture)",
          "Connecting Conversion + Sales (lead routing and sales pipeline)",
          "Infrastructure automation layer and key growth tracking",
        ],
      },
    },
  },
  {
    id: "Faire progresser le système dans la durée",
    slug: "faire-progresser-le-systeme-dans-la-duree",
    index: "03",
    name: "Faire progresser le système dans la durée",
    tagline:
      "Un accompagnement continu pour piloter, mesurer et améliorer les mécanismes de croissance de votre entreprise.",
    prices: {
      eur: "À partir de 800 € HT/mois",
      usd: "From $900/mo",
      xof: "À partir de 525 000 FCFA/mois",
    },
    amounts: { eur: 800, usd: 900, xof: 525000, monthly: true },
    duration: "Accompagnement",
    cta: "Parlons de mes objectifs",
    includes: [
      "Pilotage et optimisation continue des canaux prioritaires",
      "Itérations sur les campagnes d'acquisition et les contenus",
      "Optimisation constante du taux de conversion",
      "Amélioration des étapes de vente et du suivi CRM",
      "Maintenance des automatisations et revue stratégique mensuelle",
    ],
    translations: {
      fr: {
        name: "Faire progresser le système dans la durée",
        tagline:
          "Un accompagnement continu pour piloter, mesurer et améliorer les mécanismes de croissance de votre entreprise.",
        duration: "Accompagnement",
        cta: "Parlons de mes objectifs",
        includes: [
          "Pilotage et optimisation continue des canaux prioritaires",
          "Itérations sur les campagnes d'acquisition et les contenus",
          "Optimisation constante du taux de conversion",
          "Amélioration des étapes de vente et du suivi CRM",
          "Maintenance des automatisations et revue stratégique mensuelle",
        ],
      },
      en: {
        name: "Keep improving the system over time",
        tagline:
          "Ongoing support to run, measure, and continuously refine your business growth engine.",
        duration: "Ongoing",
        cta: "Let's talk about my goals",
        includes: [
          "Management and continuous optimization of priority channels",
          "Iteration on campaigns, content distribution, and creative",
          "Continuous conversion rate optimization",
          "Sales workflow enhancements and pipeline monitoring",
          "Automation maintenance and monthly strategic performance review",
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
