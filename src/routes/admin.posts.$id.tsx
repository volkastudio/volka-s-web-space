import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Save,
  Globe,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Youtube,
  Linkedin,
  Eye,
  FileEdit,
  Calculator,
  PlayCircle,
  Share2,
  Instagram,
  Twitter,
  Facebook,
} from "lucide-react";
import { getAdminPost, savePost } from "@/lib/admin/posts.functions";
import { signUpload } from "@/lib/admin/cases.functions";
import {
  getMediaUrl,
  estimateReadingTime,
  type PostInput,
  type PostRecord,
} from "@/lib/post-schema";
import { MarkdownContent } from "@/components/markdown-content";
import { SocialContentLinks } from "@/components/social-content-links";

export const Route = createFileRoute("/admin/posts/$id")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Article Editor — Volka Admin" },
    ],
  }),
  component: AdminPostEditorPage,
});

function createEmptyPost(): PostInput {
  return {
    slug: "",
    status: "draft",
    published_at: null,
    cover_path: "",
    tags: ["Stratégie"],
    reading_time_minutes: 5,
    social_links: {
      tiktok: "",
      youtube: "",
      linkedin: "",
      instagram: "",
      twitter: "",
      facebook: "",
    },
    translations: {
      fr: {
        title: "",
        excerpt: "",
        body_md: "",
        seo_title: "",
        seo_description: "",
        cover_alt: "",
      },
      en: {
        title: "",
        excerpt: "",
        body_md: "",
        seo_title: "",
        seo_description: "",
        cover_alt: "",
      },
    },
  };
}

const COMMON_TAGS = [
  "Stratégie",
  "Engineering",
  "Design",
  "Mobile",
  "Conversion",
  "WhatsApp",
  "E-commerce",
  "Branding",
  "Afrique de l'Ouest",
  "Budget",
];

function AdminPostEditorPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [form, setForm] = React.useState<PostInput>(createEmptyPost());
  const [activeLang, setActiveLang] = React.useState<"fr" | "en">("fr");
  const [markdownTab, setMarkdownTab] = React.useState<"write" | "preview">("write");
  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [customTag, setCustomTag] = React.useState("");

  React.useEffect(() => {
    if (isNew) return;

    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await getAdminPost({ data: { id } });
        if (mounted && data) {
          setForm({
            id: data.id,
            slug: data.slug,
            status: data.status,
            published_at: data.published_at,
            cover_path: data.cover_path || "",
            tags: data.tags || [],
            reading_time_minutes: data.reading_time_minutes || 5,
            social_links: {
              tiktok: data.social_links?.tiktok || "",
              youtube: data.social_links?.youtube || "",
              linkedin: data.social_links?.linkedin || "",
              instagram: data.social_links?.instagram || "",
              twitter: data.social_links?.twitter || "",
              facebook: data.social_links?.facebook || "",
            },
            translations: {
              fr: {
                title: data.translations.fr?.title || "",
                excerpt: data.translations.fr?.excerpt || "",
                body_md: data.translations.fr?.body_md || "",
                seo_title: data.translations.fr?.seo_title || "",
                seo_description: data.translations.fr?.seo_description || "",
                cover_alt: data.translations.fr?.cover_alt || "",
              },
              en: {
                title: data.translations.en?.title || "",
                excerpt: data.translations.en?.excerpt || "",
                body_md: data.translations.en?.body_md || "",
                seo_title: data.translations.en?.seo_title || "",
                seo_description: data.translations.en?.seo_description || "",
                cover_alt: data.translations.en?.cover_alt || "",
              },
            },
          });
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load post");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id, isNew]);

  // Auto-generate slug from FR title
  const handleAutoSlug = () => {
    const title = form.translations.fr.title;
    if (!title) return;
    const generated = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setForm((prev) => ({ ...prev, slug: generated }));
  };

  // Auto-calculate reading time based on active language body_md
  const handleAutoReadingTime = () => {
    const text = form.translations[activeLang]?.body_md || form.translations.fr.body_md;
    const minutes = estimateReadingTime(text);
    setForm((prev) => ({ ...prev, reading_time_minutes: minutes }));
  };

  // Image upload handler
  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const signRes = await signUpload({
        data: {
          filename: `posts/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
          contentType: file.type || "image/jpeg",
        },
      });

      const uploadRes = await fetch(signRes.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed with status ${uploadRes.status}`);
      }

      setForm((prev) => ({ ...prev, cover_path: signRes.path }));
      setSuccess("Cover image uploaded successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // Tag management
  const handleToggleTag = (tag: string) => {
    setForm((prev) => {
      const exists = prev.tags.includes(tag);
      return {
        ...prev,
        tags: exists ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
      };
    });
  };

  const handleAddCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed || form.tags.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
    setCustomTag("");
  };

  // Save handler
  const handleSave = async (statusOverride?: "draft" | "published") => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validation
      if (!form.translations.fr.title.trim()) {
        throw new Error("French Title is required");
      }
      if (!form.slug.trim()) {
        throw new Error("Slug is required");
      }
      if (!form.translations.fr.body_md.trim()) {
        throw new Error("French Body content is required");
      }

      const nextStatus = statusOverride ?? form.status;

      const payload: PostInput = {
        ...form,
        status: nextStatus,
        published_at:
          nextStatus === "published"
            ? form.published_at || new Date().toISOString()
            : form.published_at,
      };

      const saved = await savePost({ data: payload });
      setSuccess(
        nextStatus === "published"
          ? "Article published successfully!"
          : "Draft saved successfully.",
      );

      if (isNew && saved.id) {
        navigate({ to: "/admin/posts/$id", params: { id: saved.id } });
      } else {
        setForm((prev) => ({ ...prev, status: nextStatus }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-12 text-xs text-muted-foreground">
        Loading article editor...
      </div>
    );
  }

  const currentTrans = form.translations[activeLang] || {
    title: "",
    excerpt: "",
    body_md: "",
    seo_title: "",
    seo_description: "",
    cover_alt: "",
  };

  const updateTransField = (field: keyof typeof currentTrans, value: string) => {
    setForm((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [activeLang]: {
          ...prev.translations[activeLang],
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="p-6 md:p-10 lg:p-12">
      {/* Top Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/posts"
            className="rounded p-2 text-muted-foreground hover:bg-card hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-light md:text-3xl">
              {isNew ? "New Article" : form.translations.fr.title || form.slug}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              {form.slug ? `/journal/${form.slug}` : "Unsaved article draft"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {form.status === "published" && form.slug && (
            <Link
              to="/journal/$slug"
              params={{ slug: form.slug }}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:border-gold hover:text-gold"
            >
              <span>View live</span>
              <ExternalLink className="size-3.5" />
            </Link>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("draft")}
            className="rounded-sm border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            Save Draft
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave("published")}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Save className="size-3.5 text-gold" />
            <span>{saving ? "Saving..." : form.status === "published" ? "Save Changes" : "Publish"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mt-6 flex items-center gap-3 rounded border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mt-6 flex items-center gap-3 rounded border border-mint/30 bg-mint/10 p-4 text-xs text-mint">
          <CheckCircle className="size-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Language Switcher Bar */}
      <div className="mt-8 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-gold" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Language:
          </span>
          <div className="flex items-center rounded-sm border border-border bg-card p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveLang("fr")}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                activeLang === "fr"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Français (Master)
            </button>
            <button
              type="button"
              onClick={() => setActiveLang("en")}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                activeLang === "en"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              English {form.translations.en?.title ? "✓" : ""}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Status:</span>
          <span
            className={`font-semibold uppercase tracking-wider ${
              form.status === "published" ? "text-mint" : "text-gold"
            }`}
          >
            {form.status}
          </span>
        </div>
      </div>

      {/* Main Grid: Left editor (8 cols), Right sidebar (4 cols) */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column */}
        <div className="space-y-8 lg:col-span-8">
          {/* Section 1: Title, Slug & Excerpt */}
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-6">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Article Title ({activeLang.toUpperCase()}) *
              </label>
              <input
                type="text"
                value={currentTrans.title || ""}
                onChange={(e) => updateTransField("title", e.target.value)}
                placeholder={
                  activeLang === "fr"
                    ? "ex: Le coût réel d'un site web au Bénin"
                    : "e.g. The real cost of building a website in West Africa"
                }
                className="mt-2 w-full rounded-sm border border-border bg-background px-4 py-3 text-lg font-display text-foreground focus:border-gold focus:outline-none"
              />
            </div>

            {/* Slug Row (Shown in FR tab) */}
            {activeLang === "fr" && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    URL Slug *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSlug}
                    className="text-[11px] font-medium text-gold hover:underline"
                  >
                    Auto-generate from title
                  </button>
                </div>
                <div className="mt-2 flex items-center rounded-sm border border-border bg-background px-3 py-2 text-xs font-mono">
                  <span className="text-muted-foreground">/journal/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                      }))
                    }
                    placeholder="my-article-slug"
                    className="w-full bg-transparent text-foreground focus:outline-none pl-1"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Summary / Excerpt ({activeLang.toUpperCase()}) *
              </label>
              <textarea
                rows={3}
                value={currentTrans.excerpt || ""}
                onChange={(e) => updateTransField("excerpt", e.target.value)}
                placeholder="A compelling 2-sentence summary that appears in cards and search previews..."
                className="mt-2 w-full rounded-sm border border-border bg-background p-3 text-sm text-foreground focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Markdown Body with Live Preview */}
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="font-display text-lg font-medium text-foreground">
                  Article Body ({activeLang.toUpperCase()})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Write formatted Markdown (supports ## headings, **bold**, *italics*, &gt; quotes, lists, tables).
                </p>
              </div>

              <div className="flex items-center rounded-sm border border-border bg-background p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMarkdownTab("write")}
                  className={`inline-flex items-center gap-1.5 rounded px-3 py-1 font-medium transition-colors ${
                    markdownTab === "write"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileEdit className="size-3.5" />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMarkdownTab("preview")}
                  className={`inline-flex items-center gap-1.5 rounded px-3 py-1 font-medium transition-colors ${
                    markdownTab === "preview"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="size-3.5" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            <div className="mt-6">
              {markdownTab === "write" ? (
                <textarea
                  rows={20}
                  value={currentTrans.body_md || ""}
                  onChange={(e) => updateTransField("body_md", e.target.value)}
                  placeholder="### Section Heading&#10;&#10;Write your essay here... Use Markdown for structure."
                  className="w-full rounded-sm border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground focus:border-gold focus:outline-none"
                />
              ) : (
                <div className="min-h-[400px] rounded-sm border border-border/60 bg-background p-6">
                  {currentTrans.body_md ? (
                    <MarkdownContent content={currentTrans.body_md} />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Nothing to preview yet. Start writing in the Write tab.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: KEY USER REQUIREMENT — Associated Social Media Content */}
          <div className="rounded-xl border border-gold/30 bg-card p-6 md:p-8 space-y-6">
            <div className="border-b border-border pb-4">
              <div className="flex items-center gap-2 text-gold">
                <PlayCircle className="size-5" />
                <h3 className="font-display text-xl font-normal text-foreground">
                  Associated Social Content (Instagram, YouTube, TikTok, LinkedIn, X, Facebook)
                </h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Add links to companion videos, breakdowns, carousels or discussion threads created on this topic.
                They will render as interactive cards directly below the published article.
              </p>
            </div>

            <div className="space-y-4">
              {/* Instagram input */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Instagram className="size-4 text-pink-400" />
                  <span>Instagram Post, Reel or Carousel URL</span>
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="url"
                    value={form.social_links.instagram || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        social_links: { ...prev.social_links, instagram: e.target.value },
                      }))
                    }
                    placeholder="https://www.instagram.com/p/..."
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                  />
                  {form.social_links.instagram?.trim() && (
                    <a
                      href={form.social_links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-2 text-muted-foreground hover:text-gold"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* YouTube input */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Youtube className="size-4 text-red-500" />
                  <span>YouTube Video or Deep-Dive URL</span>
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="url"
                    value={form.social_links.youtube || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        social_links: { ...prev.social_links, youtube: e.target.value },
                      }))
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                  />
                  {form.social_links.youtube?.trim() && (
                    <a
                      href={form.social_links.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-2 text-muted-foreground hover:text-gold"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* TikTok input */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <PlayCircle className="size-4 text-teal-400" />
                  <span>TikTok Video or Short Clip URL</span>
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="url"
                    value={form.social_links.tiktok || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        social_links: { ...prev.social_links, tiktok: e.target.value },
                      }))
                    }
                    placeholder="https://www.tiktok.com/@volkastudio/video/..."
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                  />
                  {form.social_links.tiktok?.trim() && (
                    <a
                      href={form.social_links.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-2 text-muted-foreground hover:text-gold"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* LinkedIn input */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Linkedin className="size-4 text-sky-400" />
                  <span>LinkedIn Post or Executive Discussion URL</span>
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="url"
                    value={form.social_links.linkedin || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        social_links: { ...prev.social_links, linkedin: e.target.value },
                      }))
                    }
                    placeholder="https://www.linkedin.com/posts/..."
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                  />
                  {form.social_links.linkedin?.trim() && (
                    <a
                      href={form.social_links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-2 text-muted-foreground hover:text-gold"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* X / Twitter input */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Twitter className="size-4 text-foreground" />
                  <span>X (Twitter) Post or Breakdown Thread URL</span>
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="url"
                    value={form.social_links.twitter || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        social_links: { ...prev.social_links, twitter: e.target.value },
                      }))
                    }
                    placeholder="https://x.com/volkastudio/status/..."
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                  />
                  {form.social_links.twitter?.trim() && (
                    <a
                      href={form.social_links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-2 text-muted-foreground hover:text-gold"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Facebook input */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Facebook className="size-4 text-blue-500" />
                  <span>Facebook Post or Community Thread URL</span>
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="url"
                    value={form.social_links.facebook || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        social_links: { ...prev.social_links, facebook: e.target.value },
                      }))
                    }
                    placeholder="https://www.facebook.com/..."
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                  />
                  {form.social_links.facebook?.trim() && (
                    <a
                      href={form.social_links.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-2 text-muted-foreground hover:text-gold"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Social preview */}
            {(form.social_links.youtube ||
              form.social_links.tiktok ||
              form.social_links.linkedin ||
              form.social_links.instagram ||
              form.social_links.twitter ||
              form.social_links.facebook) && (
              <div className="pt-4 border-t border-border/40">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">
                  Live Preview of Article Footer Box:
                </p>
                <SocialContentLinks socialLinks={form.social_links} locale={activeLang} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Settings & Metadata */}
        <div className="space-y-8 lg:col-span-4">
          {/* Publication State */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-display text-lg font-medium text-foreground">
              Publication State
            </h3>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as "draft" | "published",
                  }))
                }
                className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Public)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Published Date
              </label>
              <input
                type="datetime-local"
                value={
                  form.published_at
                    ? new Date(form.published_at).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    published_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                  }))
                }
                className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Reading Time (minutes)
                </label>
                <button
                  type="button"
                  onClick={handleAutoReadingTime}
                  className="flex items-center gap-1 text-[11px] text-gold hover:underline"
                >
                  <Calculator className="size-3" />
                  <span>Calculate</span>
                </button>
              </div>
              <input
                type="number"
                min={1}
                max={60}
                value={form.reading_time_minutes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    reading_time_minutes: parseInt(e.target.value, 10) || 5,
                  }))
                }
                className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Cover Image Upload */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-display text-lg font-medium text-foreground">
              Cover Image
            </h3>

            {form.cover_path && (
              <div className="overflow-hidden rounded-lg border border-border bg-background">
                <img
                  src={getMediaUrl(form.cover_path)}
                  alt="Article cover"
                  className="aspect-[16/10] w-full object-cover"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Upload New Image
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:border-gold hover:text-gold">
                  <Upload className="size-3.5" />
                  <span>{uploading ? "Uploading..." : "Choose Image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleUploadCover}
                    className="hidden"
                  />
                </label>
                {form.cover_path && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, cover_path: "" }))}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Image Alt Text ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={currentTrans.cover_alt || ""}
                onChange={(e) => updateTransField("cover_alt", e.target.value)}
                placeholder="Descriptive alt text for accessibility..."
                className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-display text-lg font-medium text-foreground">
              Tags & Categories
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_TAGS.map((tag) => {
                const isSelected = form.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-gold text-primary font-semibold"
                        : "bg-background text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-xs text-muted-foreground">
                Add custom tag:
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  placeholder="Tag name"
                  className="w-full rounded-sm border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* SEO Metadata */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-display text-lg font-medium text-foreground">
              SEO Overrides ({activeLang.toUpperCase()})
            </h3>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Meta Title
              </label>
              <input
                type="text"
                value={currentTrans.seo_title || ""}
                onChange={(e) => updateTransField("seo_title", e.target.value)}
                placeholder="Defaults to article title"
                className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Meta Description
              </label>
              <textarea
                rows={3}
                value={currentTrans.seo_description || ""}
                onChange={(e) => updateTransField("seo_description", e.target.value)}
                placeholder="Defaults to article excerpt"
                className="mt-1.5 w-full rounded-sm border border-border bg-background p-3 text-xs text-foreground focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
