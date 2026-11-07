/**
 * Single source of truth for Volka offers, pricing, and fit guidance.
 * Aligned with "Website Copy & SEO Master Brief" & "Volka Offer Fit Guide":
 * 1. Résoudre un problème précis (À partir de 750 € HT / From €750 excl. VAT)
 * 2. Construire un système de croissance cohérent (À partir de 2 500 € HT / From €2,500 excl. VAT)
 * 3. Faire progresser le système dans la durée (À partir de 500 € HT/mois / From €500/month excl. VAT)
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
  /** Opening paragraph on the offer page: the situation this engagement is for. */
  pitch: string;
  /** How the engagement works for this offer. */
  howItWorks: string;
  /** What the starting price does and does not represent. */
  priceMeaning: string;
};

export type OfferFitGuide = {
  forYouIf: string[];
  notForYouIf: string[];
  guidance: string;
  recommendedAlternativeSlug: string;
};

/**
 * Starting price per currency, as numbers. These are the amounts you decide:
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
  fitGuide: {
    fr: OfferFitGuide;
    en: OfferFitGuide;
  };
};

export const offers: Offer[] = [
  {
    id: "Résoudre un problème précis",
    slug: "resoudre-un-probleme-precis",
    index: "01",
    name: "Résoudre un problème précis",
    tagline:
      "Une intervention ciblée pour traiter un problème clairement identifié, avec un périmètre défini autour de votre besoin.",
    prices: {
      eur: "À partir de 750 € HT",
      usd: "From $825",
      xof: "À partir de 500 000 FCFA",
    },
    amounts: { eur: 750, usd: 825, xof: 500000, monthly: false },
    duration: "Intervention ciblée",
    cta: "Parler de mon projet",
    includes: [
      "Diagnostic et cadrage précis du point de friction",
      "Intervention ciblée sur un pilier défini (Perception, Conversion, Ventes ou Automatisation)",
      "Clarification du positionnement ou création d'une page orientée conversion",
      "Configuration d'un flux CRM ou automatisation d'un processus bien délimité",
      "Déploiement, recette et transfert d'usage à votre équipe",
    ],
    translations: {
      fr: {
        name: "Résoudre un problème précis",
        tagline:
          "Une intervention ciblée pour traiter un problème clairement identifié, avec un périmètre défini autour de votre besoin.",
        duration: "Intervention ciblée",
        cta: "Parler de mon projet",
        pitch:
          "Votre activité n'a pas toujours besoin d'une refonte complète. Parfois, un point précis freine le reste : une offre difficile à comprendre, un site qui transforme peu les visites en demandes, des prospects qui ne sont pas suivis ou un processus encore trop manuel. Volka se concentre sur ce point et mobilise les compétences qu'il exige, dans un périmètre défini ensemble.",
        howItWorks:
          "Nous clarifions le résultat recherché, déterminons ce qui doit réellement être fait, puis réunissons les compétences adaptées pour réaliser le périmètre convenu. Vous savez ce que l'intervention couvre, ce qui en est exclu et comment elle s'intègre à votre activité. L'objectif n'est pas d'ajouter des prestations : c'est de résoudre le problème qui justifie le projet.",
        priceMeaning:
          "Ce tarif correspond au point d'entrée d'une intervention au périmètre limité, avec un objectif clairement défini. Il ne correspond pas à un forfait universel. Le budget final dépend du travail nécessaire, de sa complexité et des livrables convenus.",
        includes: [
          "Diagnostic et cadrage précis du point de friction",
          "Intervention ciblée sur un pilier défini (Perception, Conversion, Ventes ou Automatisation)",
          "Clarification du positionnement ou création d'une page orientée conversion",
          "Configuration d'un flux CRM ou automatisation d'un processus bien délimité",
          "Déploiement, recette et transfert d'usage à votre équipe",
        ],
      },
      en: {
        name: "Solve a specific problem",
        tagline:
          "A focused engagement built around a clearly identified business problem and a defined scope.",
        duration: "Focused engagement",
        cta: "Discuss my project",
        pitch:
          "Not every business problem calls for a full rebuild. Sometimes one specific issue is holding other things back: an offer that is hard to understand, a website that is not turning visits into enquiries, leads that are slipping through the cracks, or a process still handled manually. Volka focuses on that issue and brings in the expertise it actually requires, within a clearly agreed scope.",
        howItWorks:
          "We clarify what needs to change, establish the work required and bring in the expertise needed to deliver the agreed scope. You know what is covered, what is not and how the work fits into your business. The point is not to add more services. It is to address the issue that made the project necessary.",
        priceMeaning:
          "This is the entry point for a contained engagement with a clearly defined objective. It is not a universal package. The final price depends on the work required, its complexity and the agreed deliverables.",
        includes: [
          "Diagnosis and clear scoping of the primary friction point",
          "Targeted intervention on a defined pillar (Perception, Conversion, Sales, or Automation)",
          "Positioning clarification or high-conversion landing page design",
          "CRM workflow setup or targeted process automation",
          "Deployment, quality assurance, and complete team handover",
        ],
      },
    },
    fitGuide: {
      fr: {
        forYouIf: [
          "Vous avez déjà identifié ce qui doit être amélioré — par exemple votre site, votre identité de marque, votre acquisition, votre suivi commercial ou un processus précis ?",
          "Le besoin peut-il être traité comme un chantier distinct, sans devoir repenser en profondeur plusieurs autres éléments de votre activité ?",
          "Vous cherchez une expertise pour cadrer et réaliser cette intervention, plutôt qu'un accompagnement permanent ?",
        ],
        notForYouIf: [
          "Votre difficulté semble-t-elle toucher plusieurs éléments qui dépendent les uns des autres, au point qu'une intervention isolée risque de ne pas suffire ?",
          "Êtes-vous encore incertain de la cause du problème et avez-vous besoin de prendre du recul sur l'ensemble de votre fonctionnement avant de choisir une solution ?",
          "Cherchez-vous surtout un partenaire qui pilote et améliore vos actions de manière récurrente, mois après mois ?",
        ],
        guidance:
          "Si votre besoin dépasse un chantier isolé, l'offre « Construire un système de croissance cohérent » peut être plus adaptée. Si vous recherchez un suivi récurrent, regardez plutôt l'accompagnement continu.",
        recommendedAlternativeSlug: "construire-un-systeme-de-croissance-coherent",
      },
      en: {
        forYouIf: [
          "You already know what needs attention — your website, brand identity, customer acquisition, sales follow-up or a specific process?",
          "Can the work be treated as a distinct project, without having to rethink several other parts of the business at the same time?",
          "Are you looking for the right expertise to scope and deliver this piece of work, rather than ongoing support?",
        ],
        notForYouIf: [
          "Does the issue seem to involve several connected parts of the business, making a standalone fix unlikely to be enough?",
          "Are you still unsure what is causing the problem and need a broader look at how the business works before deciding what to change?",
          "Are you mainly looking for a partner to manage and improve your activities on a recurring basis?",
        ],
        guidance:
          "If the challenge spans several connected areas, an integrated growth system may be a better fit. If you need recurring support, explore the ongoing partnership.",
        recommendedAlternativeSlug: "construire-un-systeme-de-croissance-coherent",
      },
    },
  },
  {
    id: "Construire un système de croissance cohérent",
    slug: "construire-un-systeme-de-croissance-coherent",
    index: "02",
    name: "Construire un système de croissance cohérent",
    tagline:
      "Des expertises coordonnées pour relier les éléments qui doivent fonctionner ensemble autour de votre objectif.",
    prices: {
      eur: "À partir de 2 500 € HT",
      usd: "From $2,750",
      xof: "À partir de 1 650 000 FCFA",
    },
    amounts: { eur: 2500, usd: 2750, xof: 1650000, monthly: false },
    duration: "Système intégré",
    cta: "Construire mon système",
    includes: [
      "Diagnostic stratégique et cartographie complète du parcours client",
      "Connexion Perception + Conversion (positionnement, identité et plateforme web)",
      "Connexion Acquisition + Conversion (campagnes d'acquisition et capture de demandes)",
      "Connexion Conversion + Ventes (parcours prospect qualifié et pipeline commercial)",
      "Couche d'infrastructure d'automatisation et indicateurs clés de performance",
    ],
    translations: {
      fr: {
        name: "Construire un système de croissance cohérent",
        tagline:
          "Des expertises coordonnées pour relier les éléments qui doivent fonctionner ensemble autour de votre objectif.",
        duration: "Système intégré",
        cta: "Construire mon système",
        pitch:
          "Votre entreprise peut disposer des bons éléments sans qu'ils forment un ensemble efficace. Une identité peut inspirer confiance sans guider clairement vers l'achat. Une campagne peut générer des demandes sans que leur suivi soit organisé. Un site, un CRM et plusieurs outils peuvent coexister sans former un véritable parcours commercial. Volka examine les liens entre les éléments qui comptent pour votre objectif, repère les points de friction et réunit les expertises nécessaires pour construire une réponse cohérente.",
        howItWorks:
          "Nous partons de votre objectif commercial, pas d'une liste de services à vendre. Nous examinons les éléments concernés, hiérarchisons les problèmes à résoudre, puis définissons ce qui doit être clarifié, conçu, connecté ou mis en place. Le périmètre est construit autour des priorités réelles de votre activité ; il ne suppose pas que les cinq piliers soient tous nécessaires.",
        priceMeaning:
          "Ce tarif constitue le point d'entrée d'un projet qui nécessite de coordonner plusieurs éléments autour d'un objectif défini. Il ne signifie pas que toutes les expertises de Volka, les cinq piliers ou une transformation complète sont inclus. La proposition précise les éléments étudiés, conçus, mis en œuvre et remis à votre équipe.",
        includes: [
          "Diagnostic stratégique et cartographie complète du parcours client",
          "Connexion Perception + Conversion (positionnement, identité et plateforme web)",
          "Connexion Acquisition + Conversion (campagnes d'acquisition et capture de demandes)",
          "Connexion Conversion + Ventes (parcours prospect qualifié et pipeline commercial)",
          "Couche d'infrastructure d'automatisation et indicateurs clés de performance",
        ],
      },
      en: {
        name: "Build an integrated growth system",
        tagline:
          "A coordinated combination of expertise, bringing the parts that need to work together around one business objective.",
        duration: "Integrated system",
        cta: "Build my growth system",
        pitch:
          "A business can have the right pieces and still lack a system that works. A strong brand does not automatically create a clear path to purchase. A campaign can generate enquiries without a reliable follow-up process. A website, a CRM and a collection of tools can all exist without supporting one coherent customer journey. Volka looks at how the relevant parts connect, identifies where things are breaking down and brings the right expertise together to build around a defined business objective.",
        howItWorks:
          "We start with the business objective, not a predetermined list of services. We look at the relevant parts of the business, prioritise the issues that need attention and define what must be clarified, designed, connected or implemented. The scope is built around the priorities that matter, not around an assumption that every capability is required.",
        priceMeaning:
          "This is the entry point for a project that needs several elements coordinated around a defined objective. It does not include every Volka capability, all five pillars or a complete business transformation by default. The proposal specifies what will be reviewed, designed, implemented and handed over.",
        includes: [
          "Strategic diagnosis and complete customer journey mapping",
          "Connecting Perception + Conversion (positioning, identity, and web platform)",
          "Connecting Acquisition + Conversion (acquisition campaigns and lead capture)",
          "Connecting Conversion + Sales (qualified prospect routing and sales pipeline)",
          "Automation infrastructure layer and key growth performance metrics",
        ],
      },
    },
    fitGuide: {
      fr: {
        forYouIf: [
          "Votre objectif nécessite-t-il de faire travailler ensemble plusieurs éléments — par exemple votre positionnement, votre site, l'acquisition de prospects et leur suivi commercial ?",
          "Les actions menées aujourd'hui sont-elles dispersées ou déconnectées, avec des résultats limités parce qu'elles ne s'inscrivent pas dans un même système ?",
          "Êtes-vous prêt à définir un objectif commun et à mettre en œuvre un périmètre de travail coordonné, plutôt qu'à commander une prestation isolée ?",
        ],
        notForYouIf: [
          "Avez-vous simplement besoin de résoudre un problème bien délimité, avec un résultat et un périmètre précis ?",
          "Votre système fonctionne-t-il déjà et avez-vous surtout besoin d'un partenaire pour le gérer, le mesurer et l'améliorer dans la durée ?",
          "Vous attendez-vous à ce que le tarif de départ couvre automatiquement toutes les expertises, tous les canaux et tous les livrables de Volka ?",
        ],
        guidance:
          "Pour un besoin unique et bien circonscrit, l'offre « Résoudre un problème précis » sera probablement plus pertinente. Pour faire évoluer un système déjà en place, l'accompagnement continu peut mieux convenir.",
        recommendedAlternativeSlug: "resoudre-un-probleme-precis",
      },
      en: {
        forYouIf: [
          "Does your goal depend on several connected elements — such as positioning, your website, lead generation and sales follow-up?",
          "Are your current activities fragmented or disconnected, limiting their impact because they are not working towards the same objective?",
          "Are you ready to agree on a shared objective and implement a coordinated scope of work, rather than commission a standalone service?",
        ],
        notForYouIf: [
          "Do you simply need one well-defined problem solved, with a clear and contained scope?",
          "Is your current system already in place, and do you mainly need a partner to manage, measure and improve it over time?",
          "Are you expecting the starting price to automatically include every Volka capability, channel and deliverable?",
        ],
        guidance:
          "For one contained need, a focused solution may be more appropriate. If the foundations are already in place and need ongoing improvement, consider the ongoing partnership.",
        recommendedAlternativeSlug: "resoudre-un-probleme-precis",
      },
    },
  },
  {
    id: "Faire progresser le système dans la durée",
    slug: "faire-progresser-le-systeme-dans-la-duree",
    index: "03",
    name: "Faire progresser le système dans la durée",
    tagline:
      "Un accompagnement récurrent pour piloter et améliorer un périmètre précis de votre système.",
    prices: {
      eur: "À partir de 500 € HT/mois",
      usd: "From $550/mo",
      xof: "À partir de 330 000 FCFA/mois",
    },
    amounts: { eur: 500, usd: 550, xof: 330000, monthly: true },
    duration: "Accompagnement mensuel",
    cta: "Discuter d'un accompagnement continu",
    includes: [
      "Pilotage et optimisation continue des canaux prioritaires",
      "Itérations sur les campagnes d'acquisition, messages et contenus",
      "Optimisation régulière des parcours et du taux de conversion",
      "Amélioration des étapes de vente et suivi du pipeline CRM",
      "Maintenance proactive des automatisations et revue stratégique mensuelle",
    ],
    translations: {
      fr: {
        name: "Faire progresser le système dans la durée",
        tagline:
          "Un accompagnement récurrent pour piloter et améliorer un périmètre précis de votre système.",
        duration: "Accompagnement mensuel",
        cta: "Discuter d'un accompagnement continu",
        pitch:
          "La mise en place n'est pas le dernier mot. Les campagnes évoluent, les contenus doivent garder une direction, les parcours clients demandent des ajustements et les outils doivent suivre les pratiques de l'équipe. Sans suivi, même un système bien conçu peut finir par ne plus correspondre à la réalité de l'activité. Volka reste impliqué pour piloter les actions convenues, suivre leur fonctionnement et améliorer les éléments dont la progression compte.",
        howItWorks:
          "Nous définissons ensemble les priorités récurrentes, le périmètre suivi, les responsabilités de chacun et le rythme de collaboration. Volka intervient sur les activités convenues, fait le point sur leur fonctionnement et recommande les ajustements utiles. Le contenu de l'accompagnement évolue selon les besoins, mais reste encadré par un périmètre et des priorités explicites.",
        priceMeaning:
          "Ce tarif correspond au démarrage d'un accompagnement récurrent sur un périmètre défini. La proposition précise les priorités, les activités prises en charge, le rythme, les responsabilités, le suivi et les limites de l'intervention.",
        includes: [
          "Pilotage et optimisation continue des canaux prioritaires",
          "Itérations sur les campagnes d'acquisition, messages et contenus",
          "Optimisation régulière des parcours et du taux de conversion",
          "Amélioration des étapes de vente et suivi du pipeline CRM",
          "Maintenance proactive des automatisations et revue stratégique mensuelle",
        ],
      },
      en: {
        name: "Ongoing growth partnership",
        tagline:
          "Ongoing support to manage and improve a clearly agreed part of your growth system.",
        duration: "Monthly partnership",
        cta: "Discuss ongoing support",
        pitch:
          "Launch is not the finish line. Campaigns change, content needs direction, customer journeys need refinement and the tools behind the work have to keep up with how your team operates. Without ongoing attention, even a well-built system can drift out of step with the business. Volka stays involved to manage the agreed work, review how it is performing and improve the parts that matter.",
        howItWorks:
          "We agree on recurring priorities, the parts of the system Volka will look after, each party's responsibilities and the working rhythm. We carry out the agreed activities, review how they are working and identify where adjustments are needed. The work can evolve as the business does, while remaining governed by a clear scope and set of priorities.",
        priceMeaning:
          "This is the entry point for recurring support within an agreed scope. The proposal defines the priorities, activities covered, working rhythm, responsibilities, reporting and limits of the engagement.",
        includes: [
          "Continuous management and optimization of priority channels",
          "Targeted iterations on acquisition campaigns, messaging, and content",
          "Regular customer journey refinement and conversion rate optimization",
          "Sales pipeline enhancement and CRM follow-up monitoring",
          "Proactive automation maintenance and monthly strategic performance review",
        ],
      },
    },
    fitGuide: {
      fr: {
        forYouIf: [
          "Disposez-vous déjà d'une activité, d'outils ou de processus en place qui nécessitent un suivi régulier ?",
          "Y a-t-il des actions à piloter, mesurer, ajuster ou exécuter de façon récurrente — par exemple des campagnes, du contenu, la conversion ou certains processus commerciaux ?",
          "Souhaitez-vous inscrire ces améliorations dans une collaboration suivie, avec des priorités et un périmètre définis ensemble chaque mois ?",
        ],
        notForYouIf: [
          "Avez-vous plutôt besoin d'un projet ponctuel pour créer ou corriger un élément précis, sans suivi mensuel ensuite ?",
          "Votre entreprise doit-elle d'abord poser ses fondations ou connecter plusieurs éléments avant qu'un accompagnement récurrent soit pertinent ?",
          "Attendez-vous une disponibilité illimitée, une production sans limite ou la prise en charge de tous vos canaux pour le tarif mensuel de départ ?",
        ],
        guidance:
          "Si vous avez d'abord besoin de construire ou de connecter les bases de votre système, commencez par l'une des deux offres projet. Un accompagnement mensuel peut ensuite prendre le relais.",
        recommendedAlternativeSlug: "construire-un-systeme-de-croissance-coherent",
      },
      en: {
        forYouIf: [
          "Do you already have activities, tools or processes in place that need regular attention?",
          "Are there areas that need to be managed, measured, refined or delivered on an ongoing basis — such as campaigns, content, conversion or parts of your sales process?",
          "Would you benefit from a continuing working relationship, with priorities and a defined scope agreed together?",
        ],
        notForYouIf: [
          "Do you need a one-off project to build or fix something specific, with no ongoing work required afterwards?",
          "Does the business first need stronger foundations or several connected elements put in place before recurring support would make sense?",
          "Are you expecting unlimited availability, unlimited production or management of every channel at the monthly starting price?",
        ],
        guidance:
          "If you first need to build or connect the foundations, one of the project-based engagements may be the better starting point. Ongoing support can follow once the system is in place.",
        recommendedAlternativeSlug: "construire-un-systeme-de-croissance-coherent",
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
  const fit = offer.fitGuide[locale] || offer.fitGuide.fr;
  return {
    ...offer,
    name: t.name,
    tagline: t.tagline,
    duration: t.duration,
    cta: t.cta,
    includes: t.includes,
    pitch: t.pitch,
    howItWorks: t.howItWorks,
    priceMeaning: t.priceMeaning,
    fitGuide: fit,
  };
};
