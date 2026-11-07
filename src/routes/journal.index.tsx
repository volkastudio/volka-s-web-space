import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Clock, Calendar, Youtube, Linkedin, PlayCircle, ArrowRight } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { SplitHeading } from "@/components/split-heading";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";
import { getPostsList } from "@/lib/posts.functions";
import { getStaticPosts, getStaticPost } from "@/data/posts";
import { useStudioSocials } from "@/lib/studio-socials";
import type { ResolvedPost } from "@/lib/post-schema";

export const Route = createFileRoute("/journal/")({
  loader: async () => {
    const posts = await getPostsList();
    return { posts };
  },
  component: JournalIndexPage,
  head: () => ({
    meta: [
      { title: "Journal Volka — Analyses sur la croissance, l'acquisition et la conversion" },
      {
        name: "description",
        content:
          "Guides pratiques, retours d'expérience et analyses sur les systèmes de croissance, l'acquisition digitale, la conversion et le suivi commercial. Par l'équipe Volka Studio.",
      },
      { property: "og:title", content: "Journal Volka — Analyses & Guides pratiques" },
      {
        property: "og:description",
        content:
          "Des idées concrètes pour faire fonctionner vos leviers de croissance dans la même direction : acquisition, conversion, automatisation.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

function JournalIndexPage() {
  const { posts: initialPosts } = Route.useLoaderData();
  const { locale, t } = useI18n();
  const socials = useStudioSocials();
  const isFr = locale === "fr";

  // Reactive posts list that updates immediately on locale toggle
  const posts = React.useMemo(() => {
    if (initialPosts && initialPosts.length > 0) {
      return initialPosts.map((p) => getStaticPost(p.slug, locale) || p);
    }
    return getStaticPosts(locale);
  }, [initialPosts, locale]);

  // Extract all unique tags across posts
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    for (const post of posts) {
      for (const tag of post.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet);
  }, [posts]);

  const [selectedTag, setSelectedTag] = React.useState<string>("all");
  const [hoveredPost, setHoveredPost] = React.useState<ResolvedPost | null>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  const filteredPosts = React.useMemo(() => {
    if (selectedTag === "all") return posts;
    return posts.filter((p) => p.tags.includes(selectedTag));
  }, [posts, selectedTag]);

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(isFr ? "fr-FR" : "en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ─── Hero Section (Dark for consistent studio aesthetic) ─── */}
      <section className="relative isolate overflow-hidden bg-forest-black text-primary-foreground pt-36 pb-20 md:pt-48 md:pb-28 px-5 md:px-10 lg:px-14">
        <SiteHeader variant="overlay" />

        {/* Ambient liquid glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-gold/10 blur-3xl animate-liquid-glow"
        />

        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mint">
              {t.journal.eyebrow}
            </p>
          </Reveal>

          <div className="mt-4 max-w-4xl">
            <SplitHeading
              as="h1"
              className="font-display text-5xl font-light tracking-tight md:text-7xl lg:text-8xl text-primary-foreground"
            >
              {t.journal.title}
            </SplitHeading>
          </div>

          <Reveal delay={150}>
            <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-primary-foreground/75 md:text-xl">
              {t.journal.subtitle}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── Light Editorial Body: Filters + Featured Article + Clean Rows ─── */}
      <div className="bg-background text-foreground px-5 py-16 md:px-10 md:py-24 lg:px-14">
        <div className="mx-auto max-w-7xl">
          {/* Simple text tabs with underline (in place of grey chips) */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-8 border-b border-border/80 pb-3 mb-16">
              <button
                type="button"
                onClick={() => setSelectedTag("all")}
                className={`relative pb-3 text-xs font-mono uppercase tracking-[0.16em] transition-colors ${
                  selectedTag === "all"
                    ? "text-gold font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.journal.allTopics}
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`relative pb-3 text-xs font-mono uppercase tracking-[0.16em] transition-colors ${
                    selectedTag === tag
                      ? "text-gold font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-gold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Big Featured Article */}
          {featuredPost && (
            <section className="mb-24">
              <Reveal>
                <article className="group grid gap-8 overflow-hidden rounded-2xl border border-border bg-muted/20 p-6 md:grid-cols-12 md:gap-12 md:p-10 transition-all hover:border-gold/40">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted md:col-span-7">
                    {featuredPost.cover_image && (
                      <img
                        src={featuredPost.cover_image}
                        alt={featuredPost.cover_alt || featuredPost.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    )}
                    {featuredPost.social_links?.youtube && (
                      <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                        <PlayCircle className="size-3 text-red-500" />
                        <span>{t.journal.videoIncluded}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col justify-between md:col-span-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground font-mono">
                        {featuredPost.tags[0] && (
                          <span className="text-gold font-semibold">{featuredPost.tags[0]}</span>
                        )}
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {featuredPost.reading_time_minutes} {t.journal.minRead}
                        </span>
                      </div>

                      <h2 className="mt-4 font-display text-3xl font-light leading-tight transition-colors group-hover:text-gold md:text-4xl">
                        <Link to="/journal/$slug" params={{ slug: featuredPost.slug }}>
                          {featuredPost.title}
                        </Link>
                      </h2>

                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base font-light">
                        {featuredPost.excerpt}
                      </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Calendar className="size-3" />
                        {formatDate(featuredPost.published_at)}
                      </span>

                      <Link
                        to="/journal/$slug"
                        params={{ slug: featuredPost.slug }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:text-foreground"
                      >
                        <span>{t.journal.readArticle}</span>
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            </section>
          )}

          {/* Clean List of Rows (date, title, tag, reading time) */}
          {remainingPosts.length > 0 && (
            <section onMouseMove={handleMouseMove} className="relative">
              <Reveal>
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                    {t.journal.allArticles}
                  </h3>
                </div>
              </Reveal>

              <div className="divide-y divide-border border-y border-border">
                {remainingPosts.map((post, idx) => (
                  <Reveal key={post.slug} delay={idx * 50}>
                    <div
                      onMouseEnter={() => setHoveredPost(post)}
                      onMouseLeave={() => setHoveredPost(null)}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      <Link
                        to="/journal/$slug"
                        params={{ slug: post.slug }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between py-6 md:py-8 gap-4 px-2 sm:px-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-8 md:gap-12 flex-1">
                          <span className="font-mono text-xs text-muted-foreground/80 shrink-0 sm:w-28">
                            {formatDate(post.published_at)}
                          </span>
                          <h4 className="font-display text-xl sm:text-2xl md:text-3xl font-light text-foreground group-hover:text-gold transition-colors leading-snug">
                            {post.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-wider text-muted-foreground shrink-0 self-end sm:self-auto">
                          {post.tags[0] && (
                            <span className="rounded-full border border-border/80 bg-background px-3 py-1 text-[11px] text-muted-foreground group-hover:border-gold/40">
                              {post.tags[0]}
                            </span>
                          )}
                          <span className="hidden sm:inline-flex items-center gap-1">
                            <Clock className="size-3" />
                            {post.reading_time_minutes} {t.journal.minRead}
                          </span>
                          <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-gold transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                      </Link>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Floating Image Preview on Desktop Hover */}
              <AnimatePresence>
                {hoveredPost && hoveredPost.cover_image && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="pointer-events-none fixed z-50 hidden lg:block overflow-hidden rounded-xl shadow-2xl border border-white/20 bg-forest-black w-80 h-48"
                    style={{
                      left: mousePos.x + 28,
                      top: mousePos.y - 96,
                    }}
                  >
                    <img
                      src={hoveredPost.cover_image}
                      alt={hoveredPost.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-[11px] text-white/90 font-mono truncate">
                      {hoveredPost.title}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
        </div>
      </div>

      {/* ─── Dark Closing Block (Points to Free Audit + Media Channels) ─── */}
      <section className="relative isolate overflow-hidden bg-forest-black px-5 py-20 text-primary-foreground md:px-10 md:py-28 lg:px-14 border-t border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-mint/10 blur-3xl animate-liquid-glow"
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-mint">
              {t.journal.auditCtaEyebrow}
            </p>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-balance">
              {t.journal.auditCtaHeadline}
            </h2>
            <p className="mt-6 text-base font-light leading-relaxed text-primary-foreground/80 md:text-lg max-w-2xl mx-auto">
              {t.journal.auditCtaBody}
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button asChild variant="volka" size="volka" className="rounded-sm">
                <Link to="/audit">
                  <span>{t.journal.auditCtaButton}</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            {/* Social channels */}
            <div className="mt-16 border-t border-white/10 pt-10">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary-foreground/60 mb-6">
                {t.journal.mediaHeading}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {socials.youtube?.trim() && (
                  <a
                    href={socials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-sm bg-red-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
                  >
                    <Youtube className="size-4" />
                    <span>YouTube</span>
                  </a>
                )}
                {socials.linkedin?.trim() && (
                  <a
                    href={socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-sm bg-[#0A66C2] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
                  >
                    <Linkedin className="size-4" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {socials.tiktok?.trim() && (
                  <a
                    href={socials.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90 border border-white/20"
                  >
                    <span>TikTok</span>
                  </a>
                )}
                {socials.twitter?.trim() && (
                  <a
                    href={socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-sm bg-neutral-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90 border border-white/20"
                  >
                    <span>X (Twitter)</span>
                  </a>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
