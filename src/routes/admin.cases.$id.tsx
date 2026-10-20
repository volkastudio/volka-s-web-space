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
} from "lucide-react";
import { offers } from "@/data/offers";
import { getAdminCase, saveCase, signUpload } from "@/lib/admin/cases.functions";
import { getMediaUrl, type CaseStudyInput, type CaseStudyRecord } from "@/lib/case-study-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/cases/$id")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Case Study Editor — Volka Admin" },
    ],
  }),
  component: AdminCaseEditorPage,
});

function createEmptyCase(): CaseStudyInput {
  return {
    slug: "",
    kind: "concept",
    status: "draft",
    sort_order: 0,
    featured: false,
    client: "",
    year: new Date().getFullYear().toString(),
    location: "Cotonou, Bénin",
    offer: "Autorité",
    cover_path: "",
    gallery: [],
    translations: {
      fr: {
        tagline: "",
        discipline: "Identité de marque",
        sector: "",
        imageAlt: "",
        summary: "",
        context: "",
        challenge: "",
        execution: "",
        services: [""],
        deliverables: [""],
        results: [{ value: "", label: "" }],
      },
      en: {
        tagline: "",
        discipline: "Brand identity",
        sector: "",
        imageAlt: "",
        summary: "",
        context: "",
        challenge: "",
        execution: "",
        services: [""],
        deliverables: [""],
        results: [{ value: "", label: "" }],
      },
    },
  };
}

function AdminCaseEditorPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [form, setForm] = React.useState<CaseStudyInput>(createEmptyCase());
  const [activeTab, setActiveTab] = React.useState<"fr" | "en">("fr");
  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isNew) return;

    let mounted = true;
    async function loadCase() {
      try {
        setLoading(true);
        const data = (await getAdminCase({ data: { id } })) as CaseStudyRecord;
        if (mounted && data) {
          const transFr = data.translations.fr || {};
          const transEn = data.translations.en || {};

          setForm({
            id: data.id,
            slug: data.slug,
            kind: data.kind,
            status: data.status,
            sort_order: data.sort_order,
            featured: data.featured,
            client: data.client,
            year: data.year,
            location: data.location,
            offer: data.offer ?? "Autorité",
            cover_path: data.cover_path ?? "",
            gallery: data.gallery || [],
            translations: {
              fr: {
                tagline: transFr.tagline ?? "",
                discipline: transFr.discipline ?? "Identité de marque",
                sector: transFr.sector ?? "",
                imageAlt: transFr.imageAlt ?? "",
                summary: transFr.summary ?? "",
                context: transFr.context ?? "",
                challenge: transFr.challenge ?? "",
                execution: transFr.execution ?? "",
                services: transFr.services?.length ? transFr.services : [""],
                deliverables: transFr.deliverables?.length ? transFr.deliverables : [""],
                results: transFr.results?.length ? transFr.results : [{ value: "", label: "" }],
                quote: transFr.quote,
              },
              en: {
                tagline: transEn.tagline ?? "",
                discipline: transEn.discipline ?? "Brand identity",
                sector: transEn.sector ?? "",
                imageAlt: transEn.imageAlt ?? "",
                summary: transEn.summary ?? "",
                context: transEn.context ?? "",
                challenge: transEn.challenge ?? "",
                execution: transEn.execution ?? "",
                services: transEn.services?.length ? transEn.services : [""],
                deliverables: transEn.deliverables?.length ? transEn.deliverables : [""],
                results: transEn.results?.length ? transEn.results : [{ value: "", label: "" }],
                quote: transEn.quote,
              },
            },
          });
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load case study");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCase();
    return () => {
      mounted = false;
    };
  }, [id, isNew]);

  // Auto-generate slug from client name if slug is untouched
  const handleClientChange = (val: string) => {
    setForm((prev) => {
      const shouldAutoSlug = isNew && (!prev.slug || prev.slug === slugify(prev.client));
      return {
        ...prev,
        client: val,
        slug: shouldAutoSlug ? slugify(val) : prev.slug,
      };
    });
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Slugify on blur to avoid fighting keystrokes mid-edit
  const handleSlugBlur = () => {
    setForm((prev) => ({ ...prev, slug: slugify(prev.slug) }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      // Sign upload
      const { signedUrl, path } = await signUpload({
        data: { filename: file.name },
      });

      // Upload file directly using the signed URL
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed with status ${uploadRes.status}`);
      }

      setForm((prev) => ({
        ...prev,
        cover_path: path,
      }));
      setSuccess("Image uploaded successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (targetStatus?: "draft" | "published") => {
    setError(null);
    setSuccess(null);
    setSaving(true);

    const payload: CaseStudyInput = {
      ...form,
      status: targetStatus ?? form.status,
      // Filter empty list items
      translations: {
        fr: {
          ...form.translations.fr,
          services: form.translations.fr.services.filter(Boolean),
          deliverables: form.translations.fr.deliverables.filter(Boolean),
          results: form.translations.fr.results.filter((r) => r.value.trim() && r.label.trim()),
        },
        en: form.translations.en
          ? {
              ...form.translations.en,
              services: form.translations.en.services?.filter(Boolean),
              deliverables: form.translations.en.deliverables?.filter(Boolean),
              results: form.translations.en.results?.filter((r) => r.value.trim() && r.label.trim()),
            }
          : undefined,
      },
    };

    // Validation checks
    if (!payload.client.trim()) {
      setError("Client name is required.");
      setSaving(false);
      return;
    }
    if (!payload.slug.trim()) {
      setError("Slug is required.");
      setSaving(false);
      return;
    }
    if (!payload.translations.fr.tagline?.trim()) {
      setError("French tagline is required.");
      setSaving(false);
      return;
    }

    try {
      const saved = (await saveCase({ data: payload })) as CaseStudyRecord;
      setSuccess("Case study saved successfully!");
      setForm((prev) => ({ ...prev, id: saved.id, status: saved.status }));
      if (isNew) {
        navigate({ to: "/admin/cases/$id", params: { id: saved.id }, replace: true });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save case study");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-xs text-muted-foreground">
        Loading case study...
      </div>
    );
  }

  const currentTrans = activeTab === "fr" ? form.translations.fr : form.translations.en || form.translations.fr;

  const updateTranslation = (field: string, value: unknown) => {
    setForm((prev) => {
      const lang = activeTab;
      const existing = prev.translations[lang] || prev.translations.fr;
      return {
        ...prev,
        translations: {
          ...prev.translations,
          [lang]: {
            ...existing,
            [field]: value,
          },
        },
      };
    });
  };

  return (
    <div className="p-6 md:p-10 lg:p-12">
      {/* Top Bar Navigation */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/cases"
            className="rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-medium sm:text-3xl">
              {isNew ? "Create Case Study" : `Edit: ${form.client || "Untitled"}`}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isNew ? "Draft a new portfolio entry" : `Slug: /${form.slug} · Status: ${form.status}`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {!isNew && form.status === "published" && (
            <a
              href={`/cases/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3.5 py-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-gold hover:text-gold"
            >
              <span>View live</span>
              <ExternalLink className="size-3.5" />
            </a>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => handleSave("draft")}
            className="text-xs uppercase tracking-[0.14em]"
          >
            Save Draft
          </Button>
          <Button
            type="button"
            variant="volka"
            size="sm"
            disabled={saving}
            onClick={() => handleSave("published")}
            className="text-xs uppercase tracking-[0.14em]"
          >
            {saving ? "Saving..." : "Publish to site"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-6 flex items-center gap-3 rounded border border-green-500/30 bg-green-500/10 p-4 text-xs text-green-700 dark:text-green-400">
          <CheckCircle className="size-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Main Content & Translatable Fields */}
        <div className="space-y-8 lg:col-span-2">
          {/* Language Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Globe className="size-4 text-gold mr-1" />
            <button
              type="button"
              onClick={() => setActiveTab("fr")}
              className={`rounded-sm px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${
                activeTab === "fr"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Français (Master)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("en")}
              className={`rounded-sm px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${
                activeTab === "en"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              English
            </button>
          </div>

          {/* Localized Story Section */}
          <div className="space-y-5 rounded-sm border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-medium">
              Copy & Story ({activeTab.toUpperCase()})
            </h2>

            <div className="space-y-2">
              <Label htmlFor="tagline" className="text-xs uppercase tracking-wider text-muted-foreground">
                Tagline *
              </Label>
              <Input
                id="tagline"
                value={currentTrans.tagline || ""}
                onChange={(e) => updateTranslation("tagline", e.target.value)}
                placeholder="A pantry brand with the poise of an export house."
                className="text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="discipline" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Discipline *
                </Label>
                <Input
                  id="discipline"
                  value={currentTrans.discipline || ""}
                  onChange={(e) => updateTranslation("discipline", e.target.value)}
                  placeholder="Brand identity / Digital platform"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Sector *
                </Label>
                <Input
                  id="sector"
                  value={currentTrans.sector || ""}
                  onChange={(e) => updateTranslation("sector", e.target.value)}
                  placeholder="Food & retail / Financial services"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary" className="text-xs uppercase tracking-wider text-muted-foreground">
                Summary / Executive Overview *
              </Label>
              <Textarea
                id="summary"
                rows={3}
                value={currentTrans.summary || ""}
                onChange={(e) => updateTranslation("summary", e.target.value)}
                placeholder="Short 2-line summary shown on cards and intros..."
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="context" className="text-xs uppercase tracking-wider text-muted-foreground">
                01 Context *
              </Label>
              <Textarea
                id="context"
                rows={3}
                value={currentTrans.context || ""}
                onChange={(e) => updateTranslation("context", e.target.value)}
                placeholder="Background of the business and why they reached out..."
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="challenge" className="text-xs uppercase tracking-wider text-muted-foreground">
                02 Challenge *
              </Label>
              <Textarea
                id="challenge"
                rows={3}
                value={currentTrans.challenge || ""}
                onChange={(e) => updateTranslation("challenge", e.target.value)}
                placeholder="The core friction or obstacle faced..."
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="execution" className="text-xs uppercase tracking-wider text-muted-foreground">
                03 Execution *
              </Label>
              <Textarea
                id="execution"
                rows={3}
                value={currentTrans.execution || ""}
                onChange={(e) => updateTranslation("execution", e.target.value)}
                placeholder="How Volka solved it: craft, strategy, and systems..."
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageAlt" className="text-xs uppercase tracking-wider text-muted-foreground">
                Cover Image Alt Text ({activeTab.toUpperCase()}) *
              </Label>
              <Input
                id="imageAlt"
                value={currentTrans.imageAlt || ""}
                onChange={(e) => updateTranslation("imageAlt", e.target.value)}
                placeholder="Descriptive alt text for accessibility and SEO..."
                className="text-sm"
              />
            </div>
          </div>

          {/* Repeatable Lists: Services & Deliverables */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Services */}
            <div className="rounded-sm border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider">Services</h3>
                <button
                  type="button"
                  onClick={() =>
                    updateTranslation("services", [...(currentTrans.services || []), ""])
                  }
                  className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
                >
                  <Plus className="size-3" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {(currentTrans.services || [""]).map((svc, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-2">
                    <Input
                      value={svc}
                      onChange={(e) => {
                        const copy = [...(currentTrans.services || [])];
                        copy[sIdx] = e.target.value;
                        updateTranslation("services", copy);
                      }}
                      placeholder={`Service #${sIdx + 1}`}
                      className="text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = (currentTrans.services || []).filter((_, i) => i !== sIdx);
                        updateTranslation("services", copy.length ? copy : [""]);
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables */}
            <div className="rounded-sm border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider">Deliverables</h3>
                <button
                  type="button"
                  onClick={() =>
                    updateTranslation("deliverables", [...(currentTrans.deliverables || []), ""])
                  }
                  className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
                >
                  <Plus className="size-3" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {(currentTrans.deliverables || [""]).map((deliv, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2">
                    <Input
                      value={deliv}
                      onChange={(e) => {
                        const copy = [...(currentTrans.deliverables || [])];
                        copy[dIdx] = e.target.value;
                        updateTranslation("deliverables", copy);
                      }}
                      placeholder={`Deliverable #${dIdx + 1}`}
                      className="text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = (currentTrans.deliverables || []).filter((_, i) => i !== dIdx);
                        updateTranslation("deliverables", copy.length ? copy : [""]);
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Repeatable Results (Metrics) */}
          <div className="rounded-sm border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Outcomes / Results ({activeTab.toUpperCase()})
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Target metrics for concept work; measured results for delivered client work.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateTranslation("results", [
                    ...(currentTrans.results || []),
                    { value: "", label: "" },
                  ])
                }
                className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
              >
                <Plus className="size-3" /> Add result
              </button>
            </div>
            <div className="space-y-3">
              {(currentTrans.results || []).map((res, rIdx) => (
                <div key={rIdx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <Input
                      value={res.value}
                      onChange={(e) => {
                        const copy = [...(currentTrans.results || [])];
                        copy[rIdx] = { ...copy[rIdx]!, value: e.target.value };
                        updateTranslation("results", copy);
                      }}
                      placeholder="e.g. 3× or +38%"
                      className="text-xs font-medium"
                    />
                  </div>
                  <div className="col-span-7">
                    <Input
                      value={res.label}
                      onChange={(e) => {
                        const copy = [...(currentTrans.results || [])];
                        copy[rIdx] = { ...copy[rIdx]!, label: e.target.value };
                        updateTranslation("results", copy);
                      }}
                      placeholder="Metric description..."
                      className="text-xs"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        const copy = (currentTrans.results || []).filter((_, i) => i !== rIdx);
                        updateTranslation("results", copy.length ? copy : [{ value: "", label: "" }]);
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Quote / Testimonial */}
          <div className="rounded-sm border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Client Quote ({activeTab.toUpperCase()})
                </h3>
                <p className="text-[11px] text-muted-foreground">Optional. Displayed as a pull-quote on the case page.</p>
              </div>
              {!currentTrans.quote && (
                <button
                  type="button"
                  onClick={() =>
                    updateTranslation("quote", { text: "", author: "", role: "" })
                  }
                  className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
                >
                  <Plus className="size-3" /> Add quote
                </button>
              )}
            </div>

            {currentTrans.quote ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quote text</Label>
                  <Textarea
                    rows={3}
                    value={currentTrans.quote.text}
                    onChange={(e) =>
                      updateTranslation("quote", { ...currentTrans.quote!, text: e.target.value })
                    }
                    placeholder={`"The work Volka delivered exceeded every expectation..."`}
                    className="text-sm italic"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Author name</Label>
                    <Input
                      value={currentTrans.quote.author}
                      onChange={(e) =>
                        updateTranslation("quote", { ...currentTrans.quote!, author: e.target.value })
                      }
                      placeholder="Jean-Baptiste Adeyemi"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Role / Title</Label>
                    <Input
                      value={currentTrans.quote.role}
                      onChange={(e) =>
                        updateTranslation("quote", { ...currentTrans.quote!, role: e.target.value })
                      }
                      placeholder="Founder, Kòrò Foods"
                      className="text-xs"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateTranslation("quote", undefined)}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3" /> Remove quote
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60 text-center py-4">
                No quote added. Click "Add quote" to include a client testimonial.
              </p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Metadata & Project Attributes */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="rounded-sm border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="font-display text-lg font-medium border-b border-border pb-3">
              Project Attributes
            </h2>

            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-xs uppercase tracking-wider text-muted-foreground">
                Client Name *
              </Label>
              <Input
                id="client-name"
                value={form.client}
                onChange={(e) => handleClientChange(e.target.value)}
                placeholder="e.g. Kòrò Foods"
                className="text-sm font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-xs uppercase tracking-wider text-muted-foreground">
                URL Slug *
              </Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                onBlur={handleSlugBlur}
                placeholder="e.g. koro-foods"
                className="text-sm font-mono"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="kind" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Project Kind
                </Label>
                <select
                  id="kind"
                  value={form.kind}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, kind: e.target.value as "concept" | "client" }))
                  }
                  className="w-full rounded-sm border border-border bg-card p-2 text-xs"
                >
                  <option value="concept">Concept project</option>
                  <option value="client">Real client work</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value as "draft" | "published" }))
                  }
                  className="w-full rounded-sm border border-border bg-card p-2 text-xs"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="year" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Year *
                </Label>
                <Input
                  id="year"
                  value={form.year}
                  onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                  placeholder="2025"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Location *
                </Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Cotonou, Bénin"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer" className="text-xs uppercase tracking-wider text-muted-foreground">
                Engagement / Offer
              </Label>
              <select
                id="offer"
                value={form.offer ?? "Autorité"}
                onChange={(e) => setForm((prev) => ({ ...prev, offer: e.target.value }))}
                className="w-full rounded-sm border border-border bg-card p-2 text-xs"
              >
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.duration})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                  className="size-4 rounded border-border accent-gold"
                />
                <span className="font-medium">Feature on home page</span>
              </label>
            </div>
          </div>

          {/* Cover Media Card */}
          <div className="rounded-sm border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="font-display text-lg font-medium border-b border-border pb-3">
              Cover Image
            </h2>

            {form.cover_path && (
              <div className="relative aspect-[16/10] overflow-hidden rounded border border-border bg-muted">
                <img
                  src={getMediaUrl(form.cover_path)}
                  alt={form.client}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cover-path" className="text-xs uppercase tracking-wider text-muted-foreground">
                Storage Path or URL
              </Label>
              <Input
                id="cover-path"
                value={form.cover_path || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, cover_path: e.target.value }))}
                placeholder="cases/hero.webp or https://..."
                className="text-xs font-mono"
              />
            </div>

            <div className="pt-2">
              <label className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border p-4 text-center cursor-pointer hover:border-gold transition-colors">
                <Upload className="size-5 text-muted-foreground" />
                <span className="mt-2 text-xs font-medium">
                  {uploading ? "Uploading..." : "Upload new image"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Resized & uploaded to media bucket
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  disabled={uploading}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Gallery Card */}
          <div className="rounded-sm border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display text-lg font-medium">Gallery</h2>
              <span className="text-[10px] text-muted-foreground">{form.gallery.length} image{form.gallery.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Existing gallery items */}
            {form.gallery.length > 0 && (
              <div className="space-y-2">
                {form.gallery.map((item, gIdx) => (
                  <div key={gIdx} className="flex items-center gap-2 rounded border border-border bg-muted/30 p-2">
                    {getMediaUrl(item.path) && (
                      <img
                        src={getMediaUrl(item.path)}
                        alt={item.alt || `Gallery ${gIdx + 1}`}
                        className="size-10 shrink-0 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <Input
                        value={item.path}
                        onChange={(e) => {
                          const copy = [...form.gallery];
                          copy[gIdx] = { ...copy[gIdx]!, path: e.target.value };
                          setForm((prev) => ({ ...prev, gallery: copy }));
                        }}
                        placeholder="cases/gallery-01.webp"
                        className="text-[11px] font-mono h-7"
                      />
                      <Input
                        value={item.alt || ""}
                        onChange={(e) => {
                          const copy = [...form.gallery];
                          copy[gIdx] = { ...copy[gIdx]!, alt: e.target.value };
                          setForm((prev) => ({ ...prev, gallery: copy }));
                        }}
                        placeholder="Alt text..."
                        className="text-[11px] h-7"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          gallery: prev.gallery.filter((_, i) => i !== gIdx),
                        }));
                      }}
                      className="shrink-0 p-1 text-muted-foreground hover:text-destructive"
                      title="Remove"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload to gallery */}
            <label className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border p-4 text-center cursor-pointer hover:border-gold transition-colors">
              <Upload className="size-5 text-muted-foreground" />
              <span className="mt-2 text-xs font-medium">
                {uploading ? "Uploading..." : "Add gallery image"}
              </span>
              <span className="text-[10px] text-muted-foreground">Uploaded to media bucket</span>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setUploading(true);
                    setError(null);
                    const { signedUrl, path } = await signUpload({ data: { filename: file.name } });
                    const uploadRes = await fetch(signedUrl, {
                      method: "PUT",
                      headers: { "Content-Type": file.type },
                      body: file,
                    });
                    if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
                    setForm((prev) => ({
                      ...prev,
                      gallery: [...prev.gallery, { path, alt: "" }],
                    }));
                    // Reset input
                    e.target.value = "";
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : "Gallery upload failed");
                  } finally {
                    setUploading(false);
                  }
                }}
                className="hidden"
              />
            </label>

            {form.gallery.length === 0 && (
              <p className="text-center text-[11px] text-muted-foreground/60">
                No gallery images yet. Upload images above to build a project gallery.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
