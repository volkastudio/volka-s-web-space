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
  const { posts } = Route.useLoaderData();
  const { locale } = useI18n();

  const isFr = locale === "fr";

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

      {/* Hero Header */}
      <section className="relative px-5 pt-36 pb-16 md:px-10 md:pt-44 md:pb-24 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {isFr ? "Journal & Réflexions" : "Journal & Insights"}
          </p>
          <div className="mt-4 max-w-4xl">
            <SplitHeading
              text={
                isFr
                  ? "Idées, analyses et notes d'ingénierie."
                  : "Ideas, teardowns, and engineering notes."
              }
              className="font-display text-4xl font-light leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
            />
          </div>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground leading-relaxed md:text-lg">
            {isFr
              ? "Nos retours d'expérience sur la conception de marques à fort impact, l'ingénierie logicielle frugale et les leviers d'acquisition adaptés au marché africain."
              : "Observations and field notes on building durable brand systems, resilient software, and high-conversion funnels tailored to emerging African markets."}
          </p>

          {/* Tags Filter Row */}
          {allTags.length > 0 && (
            <div className="mt-12 flex flex-wrap items-center gap-2 border-b border-border/60 pb-6">
              <button
                type="button"
                onClick={() => setSelectedTag("all")}
                className={`relative rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-colors ${
                  selectedTag === "all"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                {isFr ? "Tous les articles" : "All articles"}
              </button>
              {allTags.map((tag) => {
                const isActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`relative rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Articles Grid */}
      <section className="px-5 pb-28 md:px-10 lg:px-14">
        <div className="mx-auto max-w-7xl">
          {filteredPosts.length === 0 ? (
            <div className="rounded-lg border border-border/80 bg-card/40 p-12 text-center text-muted-foreground">
              {isFr
                ? "Aucun article dans cette catégorie pour le moment."
                : "No articles found in this category."}
            </div>
          ) : (
            <div className="space-y-16">
              {/* Featured Post (First item) */}
              {featuredPost && (
                <Reveal>
                  <Link
                    to="/journal/$slug"
                    params={{ slug: featuredPost.slug }}
                    className="group grid grid-cols-1 gap-8 rounded-xl border border-border/60 bg-card/30 p-6 transition-all duration-300 hover:border-border hover:bg-card/60 md:grid-cols-12 md:p-8"
                  >
                    <div className="overflow-hidden rounded-lg md:col-span-7">
                      <div className="aspect-[16/10] w-full overflow-hidden bg-primary/20">
                        {featuredPost.cover_image ? (
                          <img
                            src={featuredPost.cover_image}
                            alt={featuredPost.cover_alt || featuredPost.title}
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground/40 font-display text-4xl">
                            Volka
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between md:col-span-5">
                      <div>
                        {/* Meta badges */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {featuredPost.tags[0] && (
                            <span className="rounded-full bg-gold/10 px-2.5 py-0.5 font-medium text-gold">
                              {featuredPost.tags[0]}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 text-muted-foreground" />
                            {featuredPost.reading_time_minutes} min {isFr ? "de lecture" : "read"}
                          </span>
                          {featuredPost.published_at && (
                            <span>{formatDate(featuredPost.published_at)}</span>
                          )}
                        </div>

                        <h2 className="mt-4 font-display text-2xl font-normal leading-snug tracking-tight text-foreground transition-colors group-hover:text-gold md:text-3xl lg:text-4xl">
                          {featuredPost.title}
                        </h2>

                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                          {featuredPost.excerpt}
                        </p>
                      </div>

                      <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-4">
                        {/* Social pills if present */}
                        <div className="flex items-center gap-2">
                          {featuredPost.social_links.youtube?.trim() && (
                            <span
                              title="Format vidéo YouTube disponible"
                              className="flex size-6 items-center justify-center rounded-full bg-red-600/10 text-red-500"
                            >
                              <Youtube className="size-3.5" />
                            </span>
                          )}
                          {featuredPost.social_links.linkedin?.trim() && (
                            <span
                              title="Débat LinkedIn disponible"
                              className="flex size-6 items-center justify-center rounded-full bg-sky-600/10 text-sky-400"
                            >
                              <Linkedin className="size-3.5" />
                            </span>
                          )}
                          {featuredPost.social_links.tiktok?.trim() && (
                            <span
                              title="Format TikTok disponible"
                              className="flex size-6 items-center justify-center rounded-full bg-teal-600/10 text-teal-400"
                            >
                              <PlayCircle className="size-3.5" />
                            </span>
                          )}
                        </div>

                        <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-transform group-hover:translate-x-1">
                          <span>{isFr ? "Lire l'article" : "Read article"}</span>
                          <ArrowUpRight className="size-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              )}

              {/* Remaining Posts Grid */}
              {remainingPosts.length > 0 && (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {remainingPosts.map((post, idx) => (
                    <Reveal key={post.slug} delay={idx * 0.1}>
                      <Link
                        to="/journal/$slug"
                        params={{ slug: post.slug }}
                        className="group flex h-full flex-col justify-between rounded-xl border border-border/60 bg-card/30 p-5 transition-all duration-300 hover:border-border hover:bg-card/60"
                      >
                        <div>
                          <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-primary/20">
                            {post.cover_image ? (
                              <img
                                src={post.cover_image}
                                alt={post.cover_alt || post.title}
                                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground/30 font-display text-2xl">
                                Volka
                              </div>
                            )}
                          </div>

                          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {post.tags[0] && (
                              <span className="rounded-full bg-gold/10 px-2 py-0.5 font-medium text-gold">
                                {post.tags[0]}
                              </span>
                            )}
                            <span>•</span>
                            <span>{post.reading_time_minutes} min</span>
                          </div>

                          <h3 className="mt-3 font-display text-xl font-normal leading-snug tracking-tight text-foreground transition-colors group-hover:text-gold md:text-2xl">
                            {post.title}
                          </h3>

                          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground md:text-sm">
                            {post.excerpt}
                          </p>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                          <div className="flex items-center gap-1.5">
                            {post.social_links.youtube?.trim() && (
                              <Youtube className="size-3.5 text-red-500" />
                            )}
                            {post.social_links.linkedin?.trim() && (
                              <Linkedin className="size-3.5 text-sky-400" />
                            )}
                            {post.social_links.tiktok?.trim() && (
                              <PlayCircle className="size-3.5 text-teal-400" />
                            )}
                          </div>

                          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-transform group-hover:translate-x-1">
                            <span>{isFr ? "Lire" : "Read"}</span>
                            <ArrowUpRight className="size-3.5" />
                          </span>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
