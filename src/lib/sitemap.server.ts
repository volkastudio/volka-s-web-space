/**
 * Dynamic sitemap.xml.
 *
 * Lists the fixed public pages, the three offers, and every published case study and journal
 * article, so a new article appears in the sitemap as soon as it is published in the back office.
 * Static (built-in) content is merged with the database rows, because a slug missing from the
 * database is still served from the built-in data.
 *
 * Served from src/server.ts at /sitemap.xml. There must be no public/sitemap.xml next to it,
 * otherwise the static file wins.
 */
import { initialCaseStudies } from "@/data/case-studies";
import { offers } from "@/data/offers";
import { initialPosts } from "@/data/posts";
import { localizedUrl } from "@/lib/seo";

type Entry = {
  path: string;
  lastmod?: string | undefined;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
};

const FIXED_PAGES: Entry[] = [
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/start", changefreq: "monthly", priority: 0.9 },
  { path: "/audit", changefreq: "weekly", priority: 0.9 },
  { path: "/cases", changefreq: "weekly", priority: 0.8 },
  { path: "/journal", changefreq: "daily", priority: 0.8 },
  { path: "/legal", changefreq: "yearly", priority: 0.3 },
];

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toDate = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
};

type Row = { slug: string; updated_at?: string | null; published_at?: string | null };

async function loadPublished(table: "posts" | "case_studies"): Promise<Row[]> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    // Loosely typed on purpose: one helper serves two tables.
    const client = supabase as unknown as {
      from: (name: string) => {
        select: (cols: string) => {
          eq: (col: string, value: string) => PromiseLike<{ data: unknown; error: unknown }>;
        };
      };
    };
    const { data, error } = await client
      .from(table)
      .select("slug, updated_at, published_at")
      .eq("status", "published");
    if (error || !Array.isArray(data)) return [];
    return data as Row[];
  } catch (err) {
    console.warn(`[sitemap] Could not read ${table}:`, err);
    return [];
  }
}

/** Static rows first, then database rows override them by slug. */
function mergeBySlug(staticRows: Row[], dbRows: Row[]): Row[] {
  const map = new Map<string, Row>();
  for (const row of staticRows) map.set(row.slug, row);
  for (const row of dbRows) map.set(row.slug, row);
  return [...map.values()];
}

export async function handleSitemap(): Promise<Response> {
  const [dbPosts, dbCases] = await Promise.all([loadPublished("posts"), loadPublished("case_studies")]);

  const posts = mergeBySlug(
    initialPosts
      .filter((p) => p.status === "published")
      .map((p) => ({ slug: p.slug, updated_at: p.updated_at, published_at: p.published_at })),
    dbPosts,
  );
  const cases = mergeBySlug(
    initialCaseStudies
      .filter((c) => c.status === "published")
      .map((c) => ({ slug: c.slug, updated_at: c.updated_at, published_at: c.published_at })),
    dbCases,
  );

  const entries: Entry[] = [
    ...FIXED_PAGES,
    ...offers.map((o): Entry => ({
      path: `/offres/${o.slug}`,
      changefreq: "monthly",
      priority: 0.8,
    })),
    ...cases.map((c): Entry => ({
      path: `/cases/${c.slug}`,
      lastmod: toDate(c.updated_at ?? c.published_at),
      changefreq: "monthly",
      priority: 0.7,
    })),
    ...posts
      .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
      .map((p): Entry => ({
        path: `/journal/${p.slug}`,
        lastmod: toDate(p.updated_at ?? p.published_at),
        changefreq: "monthly",
        priority: 0.7,
      })),
  ];

  // Every page is listed twice (French at the plain path, English under /en), and each entry
  // points to both versions so search engines pair them up.
  const body = entries
    .flatMap((e) => {
      const fr = localizedUrl(e.path, "fr");
      const en = localizedUrl(e.path, "en");
      const alternates = [
        `    <xhtml:link rel="alternate" hreflang="fr" href="${xmlEscape(fr)}"/>`,
        `    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(en)}"/>`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(fr)}"/>`,
      ];
      return [fr, en].map((loc) =>
        [
          "  <url>",
          `    <loc>${xmlEscape(loc)}</loc>`,
          ...alternates,
          ...(e.lastmod ? [`    <lastmod>${e.lastmod}</lastmod>`] : []),
          `    <changefreq>${e.changefreq}</changefreq>`,
          `    <priority>${e.priority.toFixed(1)}</priority>`,
          "  </url>",
        ].join("\n"),
      );
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
