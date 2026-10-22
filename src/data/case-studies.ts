import koroFoodsImage from "@/assets/case-koro-foods.jpg";
import sayoImage from "@/assets/case-sayo.jpg";
import thePalmImage from "@/assets/case-the-palm.jpg";
import atelierNoirImage from "@/assets/case-atelier-noir.jpg";
import type { OfferId } from "@/data/offers";
import type { CaseStudyRecord, ResolvedCaseStudy } from "@/lib/case-study-schema";
import { resolveCaseStudy } from "@/lib/case-study-schema";

export type CaseStudy = ResolvedCaseStudy;

export const initialCaseStudies: CaseStudyRecord[] = [
  {
    id: "c1a11111-1111-4111-8111-111111111111",
    slug: "koro-foods",
    kind: "concept",
    status: "published",
    sort_order: 1,
    featured: true,
    client: "Kòrò Foods",
    year: "2025",
    location: "Cotonou, Bénin",
    offer: "Résoudre un problème précis",
    cover_path: koroFoodsImage,
    gallery: [],
    published_at: "2025-01-15T00:00:00Z",
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
    translations: {
      fr: {
        tagline: "Une marque de terroir avec l'envergure d'une maison d'export.",
        discipline: "Identité de marque",
        sector: "Agroalimentaire & distribution",
        imageAlt: "Système de packaging Kòrò Foods en crème et or sur fond vert profond",
        summary:
          "Un producteur agroalimentaire régional aux produits d'exception, pénalisé par des packagings qui ne reflétaient pas leur niveau réel.",
        context:
          "Kòrò a passé six ans à bâtir une filière d'approvisionnement exigeante pour le karité, l'hibiscus, le miel et les huiles pressées à froid. Les acheteurs à Lagos et Paris adoraient la qualité des produits mais hésitaient en rayon : rien dans le packaging n'exprimait l'exigence contenue dans le flacon.",
        challenge:
          "La marque devait être perçue comme haut de gamme par les acheteurs à l'international sans perdre la chaleur et l'authenticité qui faisaient son succès local. Toutes les tentatives précédentes oscillaient entre un minimalisme générique et un folklore surchargé.",
        execution:
          "Nous avons conçu une identité articulée autour d'une gravure de paysage emblématique, d'une palette or et crème sobre, et d'un système typographique rigoureux capable de couvrir 12 références. Packagings, signalétique de marché et dossiers grossistes partagent désormais le même kit cohérent.",
        services: ["Stratégie de marque", "Architecture de gamme", "Système d'identité", "Design packaging", "Charte graphique"],
        deliverables: [
          "Suite de logos primaire et secondaire",
          "Système de packaging pour 12 références",
          "Bibliothèque de motifs gravés",
          "Guide de marque complet (42 pages)",
          "Supports de vente gros et détail",
        ],
        results: [
          { value: "3×", label: "Demandes grossistes au premier trimestre" },
          { value: "2", label: "Nouveaux marchés d'exportation ouverts" },
          { value: "+38%", label: "Panier moyen en point de vente" },
        ],
      },
      en: {
        tagline: "A pantry brand with the poise of an export house.",
        discipline: "Brand identity",
        sector: "Food & retail",
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
    },
  },
  {
    id: "c2a22222-2222-4222-8222-222222222222",
    slug: "sayo",
    kind: "concept",
    status: "published",
    sort_order: 2,
    featured: true,
    client: "Sayo",
    year: "2025",
    location: "Lagos, Nigeria",
    offer: "Construire un système de croissance cohérent",
    cover_path: sayoImage,
    gallery: [],
    published_at: "2025-02-10T00:00:00Z",
    created_at: "2025-02-10T00:00:00Z",
    updated_at: "2025-02-10T00:00:00Z",
    translations: {
      fr: {
        tagline: "Donner à une jeune fintech la crédibilité d'une institution.",
        discipline: "Plateforme digitale",
        sector: "Services financiers",
        imageAlt: "Application mobile Sayo affichée sur deux téléphones avec interface verte et crème",
        summary:
          "Une application de finances personnelles qui devait inspirer confiance dès les huit premières secondes d'utilisation.",
        context:
          "Sayo affichait une excellente rétention auprès des utilisateurs ayant franchi l'onboarding, mais subissait une déperdition massive avant cette étape. L'interface fonctionnait techniquement mais ressemblait à un prototype peu rassurant.",
        challenge:
          "La confiance financière est avant tout un enjeu de design. Le produit devait paraître serein, lisible et incontestablement sécurisé, aussi bien sur un smartphone Android d'entrée de gamme que sur un réseau mobile intermittent.",
        execution:
          "Nous avons reconstruit le design system autour d'une palette verte apaisante, d'une hiérarchie typographique aérée et d'un flux d'onboarding à une décision par écran. Le site marketing, l'application et les contenus d'aide parlent désormais d'une seule voix.",
        services: ["Design system produit", "UX onboarding", "Site marketing", "Design ops", "Stratégie de contenu"],
        deliverables: [
          "Bibliothèque de composants sur 60+ écrans",
          "Parcours d'onboarding repensé",
          "Site vitrine et visuels pour stores d'applications",
          "Directives d'accessibilité et faible bande passante",
        ],
        results: [
          { value: "−41%", label: "Taux d'abandon à l'onboarding" },
          { value: "+62%", label: "Utilisateurs actifs hebdomadaires en 4 mois" },
          { value: "4.7", label: "Note moyenne sur les stores" },
        ],
      },
      en: {
        tagline: "Making a young fintech feel like an institution.",
        discipline: "Digital platform",
        sector: "Financial services",
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
    },
  },
  {
    id: "c3a33333-3333-4333-8333-333333333333",
    slug: "the-palm-hotel",
    kind: "concept",
    status: "published",
    sort_order: 3,
    featured: true,
    client: "The Palm",
    year: "2024",
    location: "Grand-Popo, Bénin",
    offer: "Construire un système de croissance cohérent",
    cover_path: thePalmImage,
    gallery: [],
    published_at: "2024-11-20T00:00:00Z",
    created_at: "2024-11-20T00:00:00Z",
    updated_at: "2024-11-20T00:00:00Z",
    translations: {
      fr: {
        tagline: "Un hôtel balnéaire réservé en direct.",
        discipline: "Plateforme digitale",
        sector: "Hôtellerie & tourisme",
        imageAlt: "Site web de l'hôtel The Palm sur un ordinateur portable dans un lobby tropical chaleureux",
        summary:
          "Un établissement d'exception qui perdait un cinquième de chaque réservation en commissions de plateformes tierces.",
        context:
          "The Palm affichait complet la plupart des week-ends mais dépendait lourdement des plateformes de voyage en ligne (Booking, Expedia). Son propre site internet n'était qu'une brochure passive que personne ne lisait jusqu'au bout.",
        challenge:
          "La réservation directe ne fonctionne que si le site officiel est plus rapide, plus immersif et plus convaincant que la fiche de l'agrégateur concurrent dans les résultats de recherche.",
        execution:
          "Nous avons conçu le site comme une expérience d'immersion et de réservation directe : photographies grand format, comparatif des chambres tenant sur un seul écran, tarification transparente et tunnel de réservation en trois étapes fluide même avec deux barres de réseau sur mobile.",
        services: ["Design web", "Expérience de réservation", "Direction photo", "Copywriting", "Référencement local"],
        deliverables: [
          "Site bilingue français et anglais",
          "Flux de réservation directe intégré",
          "Direction artistique et photographique",
          "Optimisation Google Business et recherche locale",
        ],
        results: [
          { value: "+54%", label: "Réservations directes d'une année sur l'autre" },
          { value: "−19%", label: "Commissions versées aux plateformes" },
          { value: "1.4s", label: "Temps de chargement médian sur mobile" },
        ],
      },
      en: {
        tagline: "A coastal hotel, booked direct.",
        discipline: "Digital platform",
        sector: "Hospitality",
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
    },
  },
  {
    id: "c4a44444-4444-4444-8444-444444444444",
    slug: "atelier-noir",
    kind: "concept",
    status: "published",
    sort_order: 4,
    featured: true,
    client: "Atelier Noir",
    year: "2024",
    location: "Abidjan, Côte d'Ivoire",
    offer: "Résoudre un problème précis",
    cover_path: atelierNoirImage,
    gallery: [],
    published_at: "2024-09-05T00:00:00Z",
    created_at: "2024-09-05T00:00:00Z",
    updated_at: "2024-09-05T00:00:00Z",
    translations: {
      fr: {
        tagline: "Un portfolio d'architecture taillé pour signer des commandes majeures.",
        discipline: "Identité de marque",
        sector: "Architecture & design",
        imageAlt: "Portfolio d'architecture Atelier Noir sur grand écran dans un bureau contemporain",
        summary:
          "Une agence d'architecture dont le travail surpassait tout ce que son ancienne présentation laissait paraître.",
        context:
          "Atelier Noir obtenait des opportunités grâce à sa réputation mais peinait lors des sélections finales, où les clients institutionnels comparaient leur dossier à ceux de cabinets internationaux dotés de présentations impeccables.",
        challenge:
          "Exprimer la rigueur constructive de l'agence sans le bavardage visuel des sites d'agence classiques, et rendre l'archive des réalisations facile à actualiser en interne au fil des livraisons.",
        execution:
          "Un système éditorial épuré : une seule famille typographique de caractère, de larges blancs tournants, des pages de projets combinant plans techniques et photographies d'architecture en séquences rythmées. L'équipe administre désormais tout en autonomie.",
        services: ["Identité visuelle", "Design de portfolio web", "Modèles de projets", "Direction photo"],
        deliverables: [
          "Actualisation de l'identité et système typographique",
          "Site portfolio avec gestion autonome des projets",
          "Modèles de propositions et réponses aux appels d'offres",
        ],
        results: [
          { value: "+3", label: "Appels d'offres remportés en six mois" },
          { value: "2×", label: "Valeur moyenne des commandes" },
          { value: "0", label: "Heure de développement requise pour publier un projet" },
        ],
      },
      en: {
        tagline: "A portfolio that closes commissions.",
        discipline: "Brand identity",
        sector: "Architecture",
        year: "2024",
        location: "Abidjan, Côte d'Ivoire",
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
    },
  },
];

export function getStaticCaseStudies(locale: "fr" | "en" = "fr"): ResolvedCaseStudy[] {
  return initialCaseStudies
    .filter((c) => c.status === "published")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => resolveCaseStudy(c, locale));
}

export function getStaticCaseStudy(slug: string, locale: "fr" | "en" = "fr"): ResolvedCaseStudy | null {
  const record = initialCaseStudies.find((c) => c.slug === slug);
  if (!record) return null;
  return resolveCaseStudy(record, locale);
}

export function getNextStaticCaseStudy(slug: string, locale: "fr" | "en" = "fr"): ResolvedCaseStudy | null {
  const published = initialCaseStudies.filter((c) => c.status === "published");
  const index = published.findIndex((c) => c.slug === slug);
  if (index === -1) return null;
  const nextRecord = published[(index + 1) % published.length]!;
  return resolveCaseStudy(nextRecord, locale);
}

// Backwards-compatible defaults
export const caseStudies: ResolvedCaseStudy[] = getStaticCaseStudies("fr");
export const getCaseStudy = (slug: string) => getStaticCaseStudy(slug, "fr");
export const getNextCaseStudy = (slug: string): ResolvedCaseStudy =>
  getNextStaticCaseStudy(slug, "fr") ?? caseStudies[0]!;
