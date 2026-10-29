// Phase 12: First-party analytics types
export const ALLOWED_EVENT_NAMES = [
  'pageview',
  'read',
  'engagement',
  // Funnel & Conversion events (Phase 12b)
  'cta_start_click',
  'pricing_view',
  'start_step_view',
  'start_submit',
  'audit_start',
  'audit_submit',
  'whatsapp_click',
  'report_view',
  // Sales events (Phase 14 integration)
  'sales_view',
  'sales_cta_click',
  'sales_region_pick',
  'sales_outbound',
  // Content engagement
  'post_cta_click',
  'post_social_click',
] as const;

export type AnalyticsEventName = (typeof ALLOWED_EVENT_NAMES)[number];

export interface ClientEventPayload {
  eventName: AnalyticsEventName;
  path: string;
  entityType?: 'post' | 'case' | 'sales' | 'audit' | 'general';
  entityId?: string;
  source?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  locale?: 'fr' | 'en';
  durationSeconds?: number;
  scrollDepth?: number;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface DailyStatPoint {
  date: string;
  views: number;
  visitors: number;
  reads: number;
  avgDurationSeconds: number;
}

export interface AnalyticsOverviewData {
  periodDays: number;
  current: {
    views: number;
    visitors: number;
    reads: number;
    readRate: number;
    pagesPerVisit: number;
    avgDurationSeconds: number;
  };
  previous: {
    views: number;
    visitors: number;
    reads: number;
    readRate: number;
    pagesPerVisit: number;
    avgDurationSeconds: number;
  };
  growth: {
    viewsPercent: number;
    visitorsPercent: number;
    readsPercent: number;
  };
  trend: DailyStatPoint[];
  topPages: Array<{ path: string; views: number; percent: number }>;
  topSources: Array<{ source: string; referrerHost: string; views: number; visitors: number; percent: number }>;
  topCampaigns: Array<{ campaign: string; source: string; views: number }>;
  devices: Array<{ deviceClass: string; views: number; percent: number }>;
  countries: Array<{ country: string; views: number; percent: number }>;
  languages: Array<{ locale: string; views: number; percent: number }>;
}

export interface ContentPerformanceRow {
  entityType: 'post' | 'case';
  entityId: string;
  title: string;
  views: number;
  visitors: number;
  reads: number;
  readRate: number; // percentage 0-100
  avgReadingTimeSeconds: number;
  ctaClicks: number;
  topSource: string;
}

export interface FunnelStepData {
  stepKey: string;
  stepLabel: string;
  count: number;
  conversionFromFirstPercent: number;
  conversionFromPreviousPercent: number;
  dropOffPercent: number;
}

export interface AnalyticsFunnelData {
  periodDays: number;
  projectBriefFunnel: FunnelStepData[];
  auditFunnel: FunnelStepData[];
  leadsBySource: Array<{ source: string; count: number; percentage: number }>;
  leadsByOffer: Array<{ offer: string; count: number; percentage: number }>;
  pipelineConversion: {
    newLeads: number;
    inConversation: number;
    proposalSent: number;
    won: number;
    lost: number;
    conversionRate: number;
  };
  lossReasons: Array<{ reason: string; count: number }>;
  avgTimeToReviewHours: number;
}

