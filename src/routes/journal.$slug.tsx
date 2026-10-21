import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Clock, Calendar, Share2, Check } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { MarkdownContent } from "@/components/markdown-content";
import { SocialContentLinks } from "@/components/social-content-links";
import { useI18n } from "@/i18n/context";
import { getPostDetail } from "@/lib/posts.functions";

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
});

function JournalArticlePage() {
  const { post, next } = Route.useLoaderData();
  const { locale } = useI18n();
  const isFr = locale === "fr";

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

          {/* Headline */}
          <h1 className="mt-6 font-display text-4xl font-light leading-[1.08] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {post.title}
          </h1>

          {/* Subtitle / Excerpt */}
          <p className="mt-6 text-lg font-light leading-relaxed text-muted-foreground md:text-xl">
            {post.excerpt}
          </p>

          {/* Author line & Share button */}
          <div className="mt-8 flex items-center justify-between border-y border-border/60 py-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary font-display font-semibold text-primary-foreground text-xs">
                V
              </div>
              <div>
                <p className="font-semibold text-foreground">Volka Studio</p>
                <p className="text-[11px] text-muted-foreground">
                  {isFr ? "Studio numérique · Cotonou, Bénin" : "Digital Studio · Cotonou, Benin"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded border border-border/80 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-gold" />
                  <span>{isFr ? "Lien copié" : "Copied"}</span>
                </>
              ) : (
                <>
                  <Share2 className="size-3.5" />
                  <span>{isFr ? "Partager" : "Share"}</span>
                </>
              )}
            </button>
          </div>

          {/* Cover Image */}
          {post.cover_image && (
            <div className="my-10 overflow-hidden rounded-xl border border-border/80 bg-primary/20">
              <img
                src={post.cover_image}
                alt={post.cover_alt || post.title}
                className="w-full object-cover max-h-[560px]"
              />
            </div>
          )}

          {/* Main Markdown Body */}
          <div className="mt-12">
            <MarkdownContent content={post.body_md} />
          </div>

          {/* ── Key Section: Social Content Links (TikTok, YouTube, LinkedIn) ── */}
          <SocialContentLinks
            socialLinks={post.social_links}
            locale={locale}
          />

          {/* Next Article link */}
          {next && (
            <div className="mt-16 rounded-xl border border-border/80 bg-card/40 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                {isFr ? "Article suivant" : "Next article"}
              </p>
              <Link
                to="/journal/$slug"
                params={{ slug: next.slug }}
                className="group mt-3 flex items-start justify-between gap-4"
              >
                <div>
                  <h3 className="font-display text-2xl font-normal text-foreground transition-colors group-hover:text-gold">
                    {next.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
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
                ? "Vous préparez le lancement d'une marque d'autorité ou la refonte d'une plateforme stratégique ? Parlons de vos objectifs."
                : "Preparing to launch an authoritative brand or rebuild a mission-critical platform? Tell us about your timeline."}
            </p>
            <div className="mt-8">
              <Link
                to="/start"
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
