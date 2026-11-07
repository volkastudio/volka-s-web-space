import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion, useScroll, useSpring } from "motion/react";
import { ArrowLeft, ArrowUpRight, Clock, Calendar, Share2, Check, ArrowRight } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TealBackground } from "@/components/teal-background";
import { Reveal } from "@/components/reveal";
import { MarkdownContent } from "@/components/markdown-content";
import { SocialContentLinks } from "@/components/social-content-links";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";
import { useReadTracking } from "@/lib/analytics/use-read-tracking";
import { track } from "@/lib/analytics/tracker";
import { getPostDetail } from "@/lib/posts.functions";
import { getStaticPost } from "@/data/posts";
import { canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/journal/$slug")({
  loader: async ({ params }) => {
    const data = await getPostDetail({ data: { slug: params.slug } });
    if (!data || !data.post) {
      throw notFound();
    }
    return data;
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    return {
      meta: [
        { title: post ? `${post.seo_title || post.title} — Volka Journal` : "Article — Volka" },
        { name: "description", content: post?.seo_description || post?.excerpt || "" },
        { property: "og:title", content: post?.title || "" },
        { property: "og:description", content: post?.excerpt || "" },
        { property: "og:image", content: post?.cover_image || "" },
        { property: "og:type", content: "article" },
      ],
      links: post ? [canonicalLink(`/journal/${post.slug}`)] : [],
    };
  },
  component: JournalArticlePage,
  notFoundComponent: ArticleNotFound,
});

function ArticleNotFound() {
  const { locale } = useI18n();
  const isFr = locale === "fr";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-24 text-center md:px-10 md:py-32">
        <img
          src="/vectors/project_not_found.svg"
          alt="Article introuvable"
          width={500}
          height={500}
          className="mx-auto h-48 w-auto md:h-64 object-contain"
        />
        <h1 className="mt-8 font-display text-4xl font-medium md:text-6xl">
          {isFr ? "Cet article n'est pas disponible." : "This article is not available."}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {isFr
            ? "L'article que vous cherchez a peut-être été renommé, archivé ou déplacé."
            : "The article you are looking for may have been renamed, archived, or moved."}
        </p>
        <Button asChild variant="volka" size="volka" className="mt-8">
          <Link to="/journal">{isFr ? "Retour au Journal" : "Back to Journal"}</Link>
        </Button>
      </section>
      <SiteFooter />
    </main>
  );
}

function JournalArticlePage() {
  const { post: initialPost, next: initialNext, related: initialRelated } = Route.useLoaderData();
  const { locale, t } = useI18n();
  const isFr = locale === "fr";

  // Reactive localization that switches instantly on locale toggle
  const post = getStaticPost(initialPost.slug, locale) || initialPost;
  const next = (initialNext?.slug ? getStaticPost(initialNext.slug, locale) : null) || initialNext;

  // Related articles come from the loader (back-office posts, or static ones as a fallback).
  // Where a static translation exists it is swapped in so the language toggle applies instantly.
  const relatedArticles = React.useMemo(
    () => (initialRelated ?? []).map((rel) => getStaticPost(rel.slug, locale) || rel),
    [initialRelated, locale],
  );

  // Track engaged reading time and scroll completion per D17
  useReadTracking({
    slug: initialPost.slug,
    readingMinutes: post.reading_time_minutes || 4,
    entityType: "post",
  });

  // Smooth Reading Progress Bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [copied, setCopied] = React.useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(isFr ? "fr-FR" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ─── Thin Fixed Reading-Progress Bar ─── */}
      <motion.div
        className="fixed top-0 inset-x-0 z-50 h-[3px] bg-gold origin-left"
        style={{ scaleX }}
      />

      {/* ─── Dark Hero Header (consistent with site aesthetic) ─── */}
      <section className="relative isolate overflow-hidden bg-forest-black text-primary-foreground pt-36 pb-20 md:pt-44 md:pb-28 px-5 md:px-10 lg:px-14">
        <SiteHeader variant="overlay" />

        <TealBackground variant="quiet" />

        <div className="relative mx-auto max-w-4xl">
          {/* Back link */}
          <Link
            to="/journal"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.16em] text-primary-foreground/60 transition-colors hover:text-primary-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>{isFr ? "Retour au Journal" : "Back to Journal"}</span>
          </Link>

          {/* Tags & Meta */}
          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-mono text-primary-foreground/70">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-sm border border-gold/30 bg-gold/10 px-3 py-1 font-medium text-gold"
              >
                {tag}
              </span>
            ))}
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-mint" />
              {post.reading_time_minutes} min {isFr ? "de lecture" : "read"}
            </span>
            {post.published_at && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-mint" />
                  {formatDate(post.published_at)}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl font-light leading-[1.08] tracking-tight text-primary-foreground">
            {post.title}
          </h1>

          {/* Excerpt / Subheading */}
          <p className="mt-6 text-lg sm:text-xl font-light leading-relaxed text-primary-foreground/80 max-w-3xl">
            {post.excerpt}
          </p>

          {/* Share & Actions Toolbar */}
          <div className="mt-10 flex items-center justify-between border-t border-white/15 pt-5">
            <span className="text-xs font-mono uppercase tracking-[0.16em] text-primary-foreground/60">
              {t.journal.studioLine}
            </span>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-sm border border-white/20 px-3.5 py-1.5 text-xs font-medium text-primary-foreground/80 transition-colors hover:border-gold hover:text-gold"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-mint" />
                  <span className="text-mint">{isFr ? "Lien copié" : "Link copied"}</span>
                </>
              ) : (
                <>
                  <Share2 className="size-3.5" />
                  <span>{isFr ? "Partager" : "Share"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ─── Light Reading Body (Narrower reading column + Larger text) ─── */}
      <article className="bg-background text-foreground px-5 py-16 md:px-10 md:py-24 lg:px-14">
        {/* Centered narrower column for optimal reading comfort */}
        <div className="mx-auto max-w-2xl lg:max-w-[720px]">
          {/* Featured Cover Image */}
          {post.cover_image && (
            <div className="mb-14 overflow-hidden rounded-2xl bg-muted border border-border shadow-md">
              <img
                src={post.cover_image}
                alt={post.cover_alt || post.title}
                className="h-auto w-full object-cover"
              />
            </div>
          )}

          {/* Markdown Content with larger comfortable text */}
          <div className="prose prose-lg md:prose-xl max-w-none text-foreground/90 font-light leading-relaxed">
            <MarkdownContent content={post.body_md} />
          </div>

          {/* Cross-channel links: YouTube, LinkedIn, TikTok */}
          {post.social_links && (
            <div className="mt-16 border-t border-border/70 pt-8">
              <SocialContentLinks socialLinks={post.social_links} locale={locale} />
            </div>
          )}

          {/* Next Article link */}
          {next && (
            <div className="mt-16 border-t border-border/70 pt-10">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-gold font-semibold">
                {isFr ? "Article suivant" : "Next article"}
              </p>
              <Link
                to="/journal/$slug"
                params={{ slug: next.slug }}
                className="group mt-4 flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-6 sm:p-7 transition-all hover:border-gold/50"
              >
                <div>
                  <h4 className="font-display text-2xl font-light transition-colors group-hover:text-gold leading-snug">
                    {next.title}
                  </h4>
                  <p className="mt-2 line-clamp-1 text-sm text-muted-foreground font-light">
                    {next.excerpt}
                  </p>
                </div>
                <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-gold" />
              </Link>
            </div>
          )}
        </div>
      </article>

      {/* ─── Related Articles Section ─── */}
      {relatedArticles.length > 0 && (
        <section className="border-t border-border bg-muted/20 px-5 py-20 md:px-10 md:py-24 lg:px-14">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-center justify-between">
              <h3 className="font-display text-2xl sm:text-3xl font-medium tracking-tight">
                {t.journal.relatedArticles}
              </h3>
              <Link
                to="/journal"
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-gold hover:text-foreground transition-colors"
              >
                <span>{t.journal.allArticles}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((rel) => (
                <article
                  key={rel.slug}
                  className="group flex flex-col justify-between rounded-xl border border-border bg-background p-6 transition-all hover:border-gold/50 hover:shadow-md"
                >
                  <div>
                    {rel.cover_image && (
                      <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted mb-5">
                        <img
                          src={rel.cover_image}
                          alt={rel.cover_alt || rel.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                      {rel.tags[0] && <span className="text-gold font-semibold">{rel.tags[0]}</span>}
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {rel.reading_time_minutes} {t.journal.minRead}
                      </span>
                    </div>

                    <h4 className="mt-3 font-display text-xl sm:text-2xl font-light leading-snug transition-colors group-hover:text-gold">
                      <Link to="/journal/$slug" params={{ slug: rel.slug }}>
                        {rel.title}
                      </Link>
                    </h4>

                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground font-light leading-relaxed">
                      {rel.excerpt}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-border/50 pt-4 flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatDate(rel.published_at)}
                    </span>
                    <Link
                      to="/journal/$slug"
                      params={{ slug: rel.slug }}
                      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gold group-hover:text-foreground transition-colors"
                    >
                      <span>{t.journal.read}</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── End of Article CTA: Points directly to Free Audit (Dark Closing Block) ─── */}
      <section className="relative isolate overflow-hidden bg-forest-black px-5 py-20 text-primary-foreground md:px-10 md:py-28 lg:px-14 border-t border-white/10">
        <TealBackground variant="quiet" />

        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-mint">
              {t.journal.auditCtaEyebrow}
            </p>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-balance">
              {t.journal.auditCtaHeadline}
            </h2>
            <p className="mt-5 text-base sm:text-lg font-light leading-relaxed text-primary-foreground/80 max-w-2xl mx-auto">
              {t.journal.auditCtaBody}
            </p>
            <div className="mt-9">
              <Button asChild variant="volka" size="volka" className="rounded-sm">
                <Link
                  to="/audit"
                  onClick={() => {
                    track("post_cta_click", {
                      entityType: "post",
                      entityId: initialPost.slug,
                      metadata: { target: "/audit" },
                    });
                  }}
                >
                  <span>{t.journal.auditCtaButton}</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
