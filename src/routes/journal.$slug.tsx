import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Clock, Calendar, Share2, Check } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { MarkdownContent } from "@/components/markdown-content";
import { SocialContentLinks } from "@/components/social-content-links";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";
import { useReadTracking } from "@/lib/analytics/use-read-tracking";
import { track } from "@/lib/analytics/tracker";
import { getPostDetail } from "@/lib/posts.functions";
import { getStaticPost } from "@/data/posts";

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
    };
  },
  component: JournalArticlePage,
  notFoundComponent: ArticleNotFound,
});

function ArticleNotFound() {
  const { locale, t } = useI18n();
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
  const { post: initialPost, next: initialNext } = Route.useLoaderData();
  const { locale } = useI18n();
  const isFr = locale === "fr";

  // Reactive localization that switches instantly on locale toggle
  const post = getStaticPost(initialPost.slug, locale) || initialPost;
  const next = (initialNext?.slug ? getStaticPost(initialNext.slug, locale) : null) || initialNext;

  // Track engaged reading time and scroll completion per D17
  useReadTracking({
    slug: initialPost.slug,
    readingMinutes: post.reading_time_minutes || 4,
    entityType: "post",
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
      <SiteHeader />

      {/* Article Header */}
      <article className="px-5 pt-36 pb-24 md:px-10 md:pt-44 md:pb-32 lg:px-14">
        <div className="mx-auto max-w-4xl">
          {/* Back link */}
          <Link
            to="/journal"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>{isFr ? "Retour au Journal" : "Back to Journal"}</span>
          </Link>

          {/* Tags & Meta */}
          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gold/10 px-3 py-1 font-medium text-gold"
              >
                {tag}
              </span>
            ))}
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {post.reading_time_minutes} min {isFr ? "de lecture" : "read"}
            </span>
            {post.published_at && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {formatDate(post.published_at)}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="mt-6 font-display text-4xl font-light leading-tight tracking-tight md:text-5xl lg:text-6xl">
            {post.title}
          </h1>

          {/* Excerpt / Subheading */}
          <p className="mt-6 text-lg font-light leading-relaxed text-muted-foreground md:text-xl">
            {post.excerpt}
          </p>

          {/* Share & Actions Toolbar */}
          <div className="mt-8 flex items-center justify-between border-y border-border/60 py-4">
            <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Volka Studio
            </span>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-gold hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-green-500" />
                  <span className="text-green-500">{isFr ? "Lien copié" : "Link copied"}</span>
                </>
              ) : (
                <>
                  <Share2 className="size-3.5" />
                  <span>{isFr ? "Partager" : "Share"}</span>
                </>
              )}
            </button>
          </div>

          {/* Featured Image */}
          {post.cover_image && (
            <div className="mt-10 overflow-hidden rounded-xl bg-muted">
              <img
                src={post.cover_image}
                alt={post.cover_alt || post.title}
                className="h-auto w-full object-cover"
              />
            </div>
          )}

          {/* Markdown Content */}
          <div className="mt-12">
            <MarkdownContent content={post.body_md} />
          </div>

          {/* Cross-channel links: YouTube, LinkedIn, TikTok */}
          {post.social_links && (
            <div className="mt-14 border-t border-border/60 pt-8">
              <SocialContentLinks socialLinks={post.social_links} />
            </div>
          )}

          {/* Next Article link */}
          {next && (
            <div className="mt-16 border-t border-border/60 pt-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                {isFr ? "Article suivant" : "Next article"}
              </p>
              <Link
                to="/journal/$slug"
                params={{ slug: next.slug }}
                className="group mt-4 flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 p-6 transition-all duration-300 hover:border-gold/50"
              >
                <div>
                  <h4 className="font-display text-2xl font-light transition-colors group-hover:text-gold">
                    {next.title}
                  </h4>
                  <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                    {next.excerpt}
                  </p>
                </div>
                <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-gold" />
              </Link>
            </div>
          )}

          {/* CTA Box */}
          <div className="mt-16 rounded-xl border border-gold/30 bg-primary p-8 text-primary-foreground md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">
              {isFr ? "Démarrer une collaboration" : "Start a project"}
            </p>
            <h3 className="mt-3 font-display text-3xl font-light md:text-4xl">
              {isFr
                ? "L'ambition mérite d'être visible."
                : "Ambition deserves to be visible."}
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-primary-foreground/80 md:text-base">
              {isFr
                ? "Vous préparez le lancement d'une marque d'autorité ou la mise en place d'un système de croissance ? Parlons de vos objectifs."
                : "Preparing to launch an authoritative brand or build a business growth system? Let's discuss your objectives."}
            </p>
            <div className="mt-8">
              <Link
                to="/start"
                onClick={() => {
                  track("post_cta_click", {
                    entityType: "post",
                    entityId: initialPost.slug,
                    metadata: { target: "/start" },
                  });
                }}
                className="inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary transition-opacity hover:opacity-90"
              >
                <span>{isFr ? "Initier un brief" : "Start a project brief"}</span>
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
