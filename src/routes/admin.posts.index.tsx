import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus,
  Search,
  AlertCircle,
  ExternalLink,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  Youtube,
  Linkedin,
  PlayCircle,
  Database,
  Calendar,
  Instagram,
  Twitter,
  Facebook,
} from "lucide-react";
import {
  listAdminPosts,
  deletePost,
  setPostStatus,
} from "@/lib/admin/posts.functions";
import type { PostRecord } from "@/lib/post-schema";

export const Route = createFileRoute("/admin/posts/")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Journal & Articles — Volka Admin" },
    ],
  }),
  component: AdminPostsIndexPage,
});

function AdminPostsIndexPage() {
  const [posts, setPosts] = React.useState<PostRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dbReady, setDbReady] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "published" | "draft">("all");
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const fetchPosts = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await listAdminPosts();
      setPosts(res.items);
      setDbReady(res.dbReady);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des articles");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleToggleStatus = async (item: PostRecord) => {
    const nextStatus = item.status === "published" ? "draft" : "published";
    try {
      setActionLoading(item.id);
      setError(null);
      await setPostStatus({ data: { id: item.id, status: nextStatus } });
      setPosts((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: nextStatus } : p)),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de modifier le statut");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (item: PostRecord) => {
    const title = item.translations.fr.title || item.slug;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'article "${title}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      setActionLoading(item.id);
      setError(null);
      await deletePost({ data: { id: item.id } });
      setPosts((prev) => prev.filter((p) => p.id !== item.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer l'article");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const titleFr = p.translations.fr.title.toLowerCase();
    const titleEn = p.translations.en?.title?.toLowerCase() || "";
    const tags = p.tags.join(" ").toLowerCase();
    return (
      titleFr.includes(term) ||
      titleEn.includes(term) ||
      p.slug.toLowerCase().includes(term) ||
      tags.includes(term)
    );
  });

  return (
    <div className="p-6 md:p-10 lg:p-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
            Editorial
          </p>
          <h1 className="mt-2 font-display text-4xl font-light md:text-5xl">
            Journal & Articles
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Rédigez les analyses stratégiques, publiez vos guides et associez les formats vidéo et réseaux sociaux.
          </p>
        </div>

        <Link
          to="/admin/posts/$id"
          params={{ id: "new" }}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="size-4 text-gold" />
          <span>Nouvel article</span>
        </Link>
      </div>

      {/* Database Warning if table not yet migrated */}
      {!dbReady && (
        <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 p-4 text-xs text-foreground">
          <div className="flex items-center gap-2 font-medium text-gold">
            <Database className="size-4" />
            <span>Migration de la table Supabase `posts` recommandée</span>
          </div>
          <p className="mt-1 text-muted-foreground">
            Affichage des articles de référence statiques. Exécutez la migration{" "}
            <code className="rounded bg-card px-1 py-0.5 text-foreground font-mono">
              20261021180000_phase6_blog.sql
            </code>{" "}
            dans l'éditeur SQL Supabase pour activer la persistance complète en base.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls: Search & Filter */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par titre, étiquette, slug..."
            className="w-full rounded-sm border border-border bg-card pl-9 pr-4 py-2 text-xs focus:border-gold focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 rounded-sm border border-border bg-card p-1 text-xs">
          {([
            { id: "all", label: "Tous" },
            { id: "published", label: "Publiés" },
            { id: "draft", label: "Brouillons" },
          ] as const).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                statusFilter === filter.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            Chargement des articles...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            Aucun article ne correspond à votre recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-background/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Article</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium">Étiquettes</th>
                  <th className="px-6 py-4 font-medium">Réseaux associés</th>
                  <th className="px-6 py-4 font-medium">Langues</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredPosts.map((post) => {
                  const titleFr = post.translations.fr.title;
                  const hasEn = Boolean(post.translations.en?.title?.trim());
                  const isLoading = actionLoading === post.id;
                  const hasSocial = Boolean(
                    post.social_links.youtube?.trim() ||
                    post.social_links.tiktok?.trim() ||
                    post.social_links.linkedin?.trim() ||
                    post.social_links.instagram?.trim() ||
                    post.social_links.twitter?.trim() ||
                    post.social_links.facebook?.trim()
                  );

                  return (
                    <tr
                      key={post.id}
                      className="transition-colors hover:bg-background/40"
                    >
                      {/* Title & Slug */}
                      <td className="px-6 py-4">
                        <Link
                          to="/admin/posts/$id"
                          params={{ id: post.id }}
                          className="font-medium text-foreground hover:text-gold block max-w-sm truncate text-sm"
                        >
                          {titleFr || post.slug}
                        </Link>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          /journal/{post.slug}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleToggleStatus(post)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-opacity ${
                            post.status === "published"
                              ? "bg-mint/10 text-mint hover:opacity-80"
                              : "bg-muted text-muted-foreground hover:opacity-80"
                          } ${isLoading ? "opacity-50" : ""}`}
                        >
                          {post.status === "published" ? (
                            <>
                              <CheckCircle className="size-3" />
                              <span>Publié</span>
                            </>
                          ) : (
                            <>
                              <Clock className="size-3" />
                              <span>Brouillon</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Tags */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {post.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            >
                              {t}
                            </span>
                          ))}
                          {post.tags.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{post.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Social Links Badge Column */}
                      <td className="px-6 py-4">
                        {hasSocial ? (
                          <div className="flex items-center gap-2">
                            {post.social_links.youtube?.trim() && (
                              <span
                                title={`YouTube: ${post.social_links.youtube}`}
                                className="flex size-5 items-center justify-center rounded bg-red-600/10 text-red-500"
                              >
                                <Youtube className="size-3" />
                              </span>
                            )}
                            {post.social_links.tiktok?.trim() && (
                              <span
                                title={`TikTok: ${post.social_links.tiktok}`}
                                className="flex size-5 items-center justify-center rounded bg-teal-600/10 text-teal-400"
                              >
                                <PlayCircle className="size-3" />
                              </span>
                            )}
                            {post.social_links.linkedin?.trim() && (
                              <span
                                title={`LinkedIn: ${post.social_links.linkedin}`}
                                className="flex size-5 items-center justify-center rounded bg-sky-600/10 text-sky-400"
                              >
                                <Linkedin className="size-3" />
                              </span>
                            )}
                            {post.social_links.instagram?.trim() && (
                              <span
                                title={`Instagram: ${post.social_links.instagram}`}
                                className="flex size-5 items-center justify-center rounded bg-pink-600/10 text-pink-400"
                              >
                                <Instagram className="size-3" />
                              </span>
                            )}
                            {post.social_links.twitter?.trim() && (
                              <span
                                title={`X / Twitter: ${post.social_links.twitter}`}
                                className="flex size-5 items-center justify-center rounded bg-foreground/10 text-foreground"
                              >
                                <Twitter className="size-3" />
                              </span>
                            )}
                            {post.social_links.facebook?.trim() && (
                              <span
                                title={`Facebook: ${post.social_links.facebook}`}
                                className="flex size-5 items-center justify-center rounded bg-blue-600/10 text-blue-500"
                              >
                                <Facebook className="size-3" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>

                      {/* Languages */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          <span className="rounded bg-primary/20 px-1 py-0.5 text-primary-foreground font-semibold">
                            FR
                          </span>
                          <span
                            className={`rounded px-1 py-0.5 ${
                              hasEn
                                ? "bg-primary/20 text-primary-foreground font-semibold"
                                : "text-muted-foreground/40"
                            }`}
                          >
                            EN
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-muted-foreground text-[11px]">
                        {post.published_at ? (
                          new Date(post.published_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        ) : (
                          <span>Non planifié</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {post.status === "published" && (
                            <Link
                              to="/journal/$slug"
                              params={{ slug: post.slug }}
                              target="_blank"
                              title="Consulter l'article en ligne"
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <ExternalLink className="size-3.5" />
                            </Link>
                          )}
                          <Link
                            to="/admin/posts/$id"
                            params={{ id: post.id }}
                            title="Modifier l'article"
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Edit2 className="size-3.5" />
                          </Link>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleDelete(post)}
                            title="Supprimer l'article"
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
