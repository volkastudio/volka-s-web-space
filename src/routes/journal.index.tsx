import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Clock, Calendar, Youtube, Linkedin, PlayCircle } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { SplitHeading } from "@/components/split-heading";
import { useI18n } from "@/i18n/context";
import { getPostsList } from "@/lib/posts.functions";
import { getStaticPosts, getStaticPost } from "@/data/posts";
import type { ResolvedPost } from "@/lib/post-schema";

export const Route = createFileRoute("/journal/")({
  loader: async () => {
    const posts = await getPostsList();
    return { posts };
  },
  component: JournalIndexPage,
  head: () => ({
    meta: [
      { title: "Journal & Insights — Volka Studio" },
      {
        name: "description",
        content:
          "Analyses, guides pratiques et retours d'expérience sur le design de marque, l'ingénierie web et le commerce digital en Afrique de l'Ouest.",
      },
      { property: "og:title", content: "Journal & Insights — Volka Studio" },
      {
        property: "og:description",
        content:
          "Idées, études de cas et notes techniques pour bâtir des marques et plateformes numériques d'autorité en Afrique.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

function JournalIndexPage() {
  const { posts: initialPosts } = Route.useLoaderData();
  const { locale, t } = useI18n();

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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero Section */}
      <section className="px-5 pt-36 pb-16 md:px-10 md:pt-44 md:pb-24 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {t.journal.eyebrow}
            </p>
          </Reveal>
          <div className="mt-4 max-w-4xl">
            <SplitHeading
              as="h1"
              className="font-display text-5xl font-light tracking-tight md:text-7xl lg:text-8xl"
            >
              {t.journal.title}
            </SplitHeading>
          </div>
          <Reveal delay={150}>
            <p className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground md:text-xl">
              {t.journal.subtitle}
            </p>
          </Reveal>

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="mt-12 flex flex-wrap items-center gap-2 border-b border-border/60 pb-6">
              <button
                type="button"
                onClick={() => setSelectedTag("all")}
                className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${
                  selectedTag === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.journal.allTopics}
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${
                    selectedTag === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured / Lead Article */}
      {featuredPost && (
        <section className="px-5 pb-20 md:px-10 md:pb-28 lg:px-14">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <article className="group relative grid gap-8 overflow-hidden rounded-2xl border border-border/80 bg-muted/30 p-6 transition-all duration-300 hover:border-gold/50 md:grid-cols-12 md:gap-12 md:p-10">
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted md:col-span-7">
                  {featuredPost.cover_image && (
                    <img
                      src={featuredPost.cover_image}
                      alt={featuredPost.cover_alt || featuredPost.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  {featuredPost.social_links?.youtube && (
                    <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                      <PlayCircle className="size-3 text-red-500" />
                      <span>{t.journal.videoIncluded}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-col justify-between md:col-span-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {featuredPost.tags[0] && (
                        <span className="text-gold">{featuredPost.tags[0]}</span>
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

                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      {formatDate(featuredPost.published_at)}
                    </span>

                    <Link
                      to="/journal/$slug"
                      params={{ slug: featuredPost.slug }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:text-primary"
                    >
                      <span>{t.journal.readArticle}</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          </div>
        </section>
      )}

      {/* Grid of Remaining Articles */}
      {remainingPosts.length > 0 && (
        <section className="border-t border-border/60 px-5 py-20 md:px-10 md:py-28 lg:px-14">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {remainingPosts.map((post, idx) => (
                <Reveal key={post.slug} delay={idx * 80}>
                  <article className="group flex flex-col justify-between rounded-xl border border-border/60 bg-background p-6 transition-all duration-300 hover:border-gold/50 hover:shadow-lg">
                    <div>
                      {post.cover_image && (
                        <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-muted">
                          <img
                            src={post.cover_image}
                            alt={post.cover_alt || post.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                          {post.social_links?.youtube && (
                            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                              <PlayCircle className="size-3 text-red-500" />
                              <span>{t.journal.videoIncluded}</span>
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-5 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {post.tags[0] && <span className="text-gold">{post.tags[0]}</span>}
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {post.reading_time_minutes} {t.journal.minRead}
                        </span>
                      </div>

                      <h3 className="mt-3 font-display text-2xl font-light leading-snug transition-colors group-hover:text-gold">
                        <Link to="/journal/$slug" params={{ slug: post.slug }}>
                          {post.title}
                        </Link>
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(post.published_at)}
                      </span>
                      <Link
                        to="/journal/$slug"
                        params={{ slug: post.slug }}
                        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors group-hover:text-gold"
                      >
                        <span>{t.journal.readArticle}</span>
                        <ArrowUpRight className="size-3" />
                      </Link>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Multi-channel CTA banner */}
      <section className="bg-primary px-5 py-20 text-primary-foreground md:px-10 md:py-24 lg:px-14">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">
              {t.journal.mediaTitle}
            </p>
            <h2 className="mt-4 font-display text-4xl font-light md:text-5xl lg:text-6xl">
              {t.journal.mediaHeading}
            </h2>
            <p className="mt-6 text-base font-light leading-relaxed text-primary-foreground/80 md:text-lg">
              {t.journal.mediaSubheading}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://www.youtube.com/@volkastudio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm bg-red-600 px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
              >
                <Youtube className="size-4" />
                <span>YouTube</span>
              </a>
              <a
                href="https://www.linkedin.com/company/volka-studio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm bg-[#0A66C2] px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
              >
                <Linkedin className="size-4" />
                <span>LinkedIn</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
