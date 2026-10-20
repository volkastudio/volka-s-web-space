export type Locale = "fr" | "en";

export interface Translations {
  locale: Locale;
  nav: {
    home: string;
    cases: string;
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
    }[];
  };
  offers: {
    eyebrow: string;
    title: string;
    subtitle: string;
    currencyNote: string;
    selectOffer: string;
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
}
