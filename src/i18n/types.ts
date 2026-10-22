export type Locale = "fr" | "en";

export interface Translations {
  locale: Locale;
  nav: {
    home: string;
    cases: string;
    journal: string;
    services: string;
    studio: string;
    start: string;
    switchLang: string;
  };
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    cta: string;
    seeApproach: string;
  };
  marquee: string[];
  stats: {
    projects: string;
    experience: string;
    countries: string;
    satisfaction: string;
  };
  studio: {
    eyebrow: string;
    title: string;
    p1: string;
    p2: string;
  };
  work: {
    eyebrow: string;
    title: string;
    allCases: string;
    viewProject: string;
    conceptLabel: string;
  };
  services: {
    eyebrow: string;
    subtitle: string;
    items: {
      number: string;
      title: string;
      description: string;
      keywords?: string[];
    }[];
  };
  offers: {
    eyebrow: string;
    title: string;
    subtitle: string;
    currencyNote: string;
    selectOffer: string;
    /** CTA on home cards — links to the offer detail page */
    learnMore: string;
    /** Note under pricing cards */
    pricingNote: string;
  };
  form: {
    eyebrow: string;
    title: string;
    subtitle: string;
    howItWorks: string;
    howItWorksText: string;
    responseTime: string;
    responseTimeText: string;
    directMail: string;
    step1: string;
    name: string;
    email: string;
    phone: string;
    preferredChannel: string;
    step2: string;
    timelineLabel: string;
    budgetLabel: string;
    step3: string;
    visionLabel: string;
    challengeLabel: string;
    referralLabel: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successMessage: string;
    urgentNote: string;
    seeCases: string;
  };
  casesIndex: {
    eyebrow: string;
    title: string;
    subtitle: string;
    allWork: string;
    brandIdentity: string;
    digitalPlatform: string;
    /** Fixed canonical filter categories */
    catBranding: string;
    catDigital: string;
    catStrategy: string;
    catContent: string;
  };
  footer: {
    statement: string;
    location: string;
    rights: string;
    quickLinks: string;
    /** CTA headline above the footer links */
    ctaEyebrow: string;
    ctaHeadline: string;
    legalNotice: string;
  };
  caseStudy: {
    /** "Back" arrow link */
    allCases: string;
    /** "Sector / Location / Year / Engagement" metadata labels */
    metaSector: string;
    metaLocation: string;
    metaYear: string;
    metaEngagement: string;
    metaPillars: string;
    /** Concept-project disclaimer paragraph */
    conceptDisclaimer: string;
    /** Section headings */
    sectionContext: string;
    sectionChallenge: string;
    sectionExecution: string;
    sectionDelivered: string;
    servicesLabel: string;
    /** Results / impact section */
    targetOutcomes: string;
    theImpact: string;
    /** Small note under concept metrics */
    conceptMetricsNote: string;
    nextProject: string;
  };
  startForm: {
    company: string;
    privacyNote: string;
    scopeNotSure: string;
    scopeNotSureDetail: string;
    timelines: string[];
    budgets: string[];
  };
  legalPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    lastUpdated: string;
    publisherTitle: string;
    publisherBody: string[];
    hostingTitle: string;
    hostingBody: string[];
    ipTitle: string;
    ipBody: string[];
    conceptsTitle: string;
    conceptsBody: string[];
    privacyTitle: string;
    privacyBody: string[];
    cookiesTitle: string;
    cookiesBody: string[];
    governingTitle: string;
    governingBody: string[];
  };
  /** Journal page-specific translations */
  journal: {
    eyebrow: string;
    title: string;
    subtitle: string;
    allArticles: string;
    allTopics: string;
    minRead: string;
    videoIncluded: string;
    readArticle: string;
    read: string;
    reading: string;
    noArticles: string;
    backToJournal: string;
    nextArticle: string;
    share: string;
    copied: string;
    ctaEyebrow: string;
    ctaHeadline: string;
    ctaBody: string;
    ctaButton: string;
    studioLine: string;
    mediaTitle: string;
    mediaHeading: string;
    mediaSubheading: string;
  };
  /** Error / 404 page translations */
  errors: {
    notFoundTitle: string;
    notFoundMessage: string;
    goHome: string;
    seeOurWork: string;
    somethingWentWrong: string;
    pageDidNotLoad: string;
    pageDidNotLoadMessage: string;
    tryAgain: string;
    projectNotFoundTitle: string;
    projectNotFoundMessage: string;
  };
  errorPages: {
    notFoundTitle: string;
    notFoundMessage: string;
    goHome: string;
    seeWork: string;
    errorTitle: string;
    errorMessage: string;
    tryAgain: string;
    projectNotFoundTitle: string;
    projectNotFoundMessage: string;
  };
  /** Offer detail page translations */
  offerDetail: {
    backToOffers: string;
    formula: string;
    startProject: string;
    whatsIncluded: string;
    whatsIncludedSubtitle: string;
    howItWorks: string;
    howItWorksTitle: string;
    steps: { n: string; title: string; desc: string }[];
    readyTitle: string;
    readyHeadline: string;
    startWith: string;
    nextFormula: string;
  };
}
