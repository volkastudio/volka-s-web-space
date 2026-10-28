import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  Save,
  Plus,
  Trash2,
  Globe,
  ChevronUp,
  ChevronDown,
  Loader2,
  ArrowLeft,
  Eye,
  ExternalLink,
  ImageIcon,
  CheckCircle2,
  X,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getAdminProducts,
  saveProduct,
  deleteProduct,
} from "@/lib/sales/sales.functions";
import { signUpload } from "@/lib/admin/cases.functions";

const searchSchema = z.object({
  id: z.string().uuid().optional(),
});

export const Route = createFileRoute("/admin/sales/editor")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Éditeur de page de vente — Volka Admin" },
    ],
  }),
  loader: async ({ location }) => {
    const search = location.search as { id?: string };
    if (search.id) {
      const products = await getAdminProducts();
      const found = (products as unknown as ProductFormState[]).find(
        (p: any) => p.id === search.id
      );
      return { product: found ?? null };
    }
    return { product: null };
  },
  component: AdminSalesEditorPage,
});

interface RegionRow {
  region_key: string;
  label_fr: string;
  label_en: string;
  checkout_url: string;
  platform_name: string;
  sort_order: number;
  is_active: boolean;
}

interface ProductFormState {
  id?: string;
  slug: string;
  title: string;
  headline: string;
  cover_image: string;
  description: string;
  features: string[];
  faq: { q: string; a: string }[];
  status: "draft" | "published" | "archived";
  trigger_keyword: string;
  regions: RegionRow[];
}

const DEFAULT_REGIONS: RegionRow[] = [
  {
    region_key: "europe",
    label_fr: "Europe & international",
    label_en: "Europe & international",
    checkout_url: "",
    platform_name: "whop",
    sort_order: 0,
    is_active: true,
  },
  {
    region_key: "afrique",
    label_fr: "Afrique (Mobile Money & Carte)",
    label_en: "Africa (Mobile Money & Card)",
    checkout_url: "",
    platform_name: "chariow",
    sort_order: 1,
    is_active: true,
  },
];

const EMPTY_PRODUCT: ProductFormState = {
  slug: "",
  title: "",
  headline: "",
  cover_image: "",
  description: "",
  features: [""],
  faq: [{ q: "", a: "" }],
  status: "draft",
  trigger_keyword: "",
  regions: DEFAULT_REGIONS,
};

/** Derive public media URL from storage path */
function getMediaPublicUrl(path: string): string {
  const supabaseUrl =
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_SUPABASE_URL) ||
    "";
  return `${supabaseUrl}/storage/v1/object/public/media/${path}`;
}

function AdminSalesEditorPage() {
  const { product: initialProduct } = Route.useLoaderData() as { product: any };
  const navigate = useNavigate();

  const [form, setForm] = React.useState<ProductFormState>(() => {
    if (initialProduct) {
      return {
        id: initialProduct.id,
        slug: initialProduct.slug ?? "",
        title: initialProduct.title ?? "",
        headline: initialProduct.headline ?? "",
        cover_image: initialProduct.cover_image ?? "",
        description: initialProduct.description ?? "",
        features: (initialProduct.features as string[])?.length ? initialProduct.features : [""],
        faq: (initialProduct.faq as { q: string; a: string }[])?.length
          ? initialProduct.faq
          : [{ q: "", a: "" }],
        status: initialProduct.status ?? "draft",
        trigger_keyword: initialProduct.trigger_keyword ?? "",
        regions: (initialProduct.product_regions ?? initialProduct.regions ?? []).length
          ? (initialProduct.product_regions ?? initialProduct.regions)
          : DEFAULT_REGIONS,
      };
    }
    return EMPTY_PRODUCT;
  });

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Image upload state
  const [imageUploading, setImageUploading] = React.useState(false);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const update = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Features
  const addFeature = () => update("features", [...form.features, ""]);
  const removeFeature = (i: number) =>
    update("features", form.features.filter((_, idx) => idx !== i));
  const editFeature = (i: number, v: string) =>
    update("features", form.features.map((f, idx) => (idx === i ? v : f)));

  // FAQ
  const addFaq = () => update("faq", [...form.faq, { q: "", a: "" }]);
  const removeFaq = (i: number) => update("faq", form.faq.filter((_, idx) => idx !== i));
  const editFaq = (i: number, field: "q" | "a", v: string) =>
    update("faq", form.faq.map((f, idx) => (idx === i ? { ...f, [field]: v } : f)));

  // Regions
  const addRegion = () =>
    update("regions", [
      ...form.regions,
      {
        region_key: `region-${form.regions.length + 1}`,
        label_fr: "",
        label_en: "",
        checkout_url: "",
        platform_name: "whop",
        sort_order: form.regions.length,
        is_active: true,
      },
    ]);

  const removeRegion = (i: number) =>
    update("regions", form.regions.filter((_, idx) => idx !== i));

  const editRegion = (i: number, field: keyof RegionRow, val: string | boolean | number) =>
    update(
      "regions",
      form.regions.map((r, idx) => (idx === i ? { ...r, [field]: val } : r))
    );

  const moveRegion = (i: number, dir: -1 | 1) => {
    const next = [...form.regions];
    const target = i + dir;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target]!, next[i]!];
    update(
      "regions",
      next.map((r, idx) => ({ ...r, sort_order: idx }))
    );
  };

  // ── Image Upload ──────────────────────────────────────────────
  const handleImageFile = async (file: File) => {
    setImageError(null);
    setImageUploading(true);
    try {
      const { signedUrl, path } = await signUpload({
        data: { filename: file.name, contentType: file.type },
      });

      const res = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`);
      }

      const publicUrl = getMediaPublicUrl(path);
      update("cover_image", publicUrl);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Erreur lors de l'upload.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await saveProduct({
        data: {
          id: form.id,
          slug: form.slug,
          title: form.title,
          headline: form.headline,
          cover_image: form.cover_image || undefined,
          description: form.description,
          features: form.features.filter(Boolean),
          faq: form.faq.filter((f) => f.q || f.a),
          status: form.status,
          trigger_keyword: form.trigger_keyword || undefined,
          regions: form.regions.map((r, i) => ({ ...r, sort_order: i })),
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id) return;
    if (!window.confirm(`Supprimer définitivement « ${form.title} » ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      await deleteProduct({ data: { id: form.id } });
      navigate({ to: "/admin/sales/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a
            href="/admin/sales/"
            className="p-2 rounded-md hover:bg-pine/10 text-forest-black/60 hover:text-forest-black transition-colors"
          >
            <ArrowLeft className="size-5" />
          </a>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-light text-forest-black">
              {form.id ? "Modifier la page de vente" : "Nouvelle page de vente"}
            </h1>
            {form.slug && (
              <p className="text-xs text-forest-black/50 font-mono">
                /sales/{form.slug}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {form.slug && form.status === "published" && (
            <a
              href={`/sales/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-forest-black/60 hover:text-terracotta px-2 py-1"
            >
              <Eye className="size-3.5" /> Prévisualiser
            </a>
          )}

          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value as "draft" | "published" | "archived")}
            className="h-9 px-3 rounded-md bg-warm-ivory border border-pine/20 text-xs text-forest-black focus:outline-none"
          >
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="archived">Archivé</option>
          </select>

          <Button
            onClick={handleSave}
            disabled={saving}
            className={`text-xs px-4 ${saved ? "bg-mint text-forest-black" : "bg-pine hover:bg-pine/90 text-paper"}`}
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin mr-1" />
            ) : saved ? (
              <CheckCircle2 className="size-3.5 mr-1" />
            ) : (
              <Save className="size-3.5 mr-1" />
            )}
            {saving ? "Enregistrement..." : saved ? "Enregistré !" : "Enregistrer"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-terracotta/10 border border-terracotta/30 text-sm text-terracotta">
          {error}
        </div>
      )}

      {/* ── Identité du produit ── */}
      <section className="bg-warm-ivory border border-pine/10 rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-forest-black text-sm uppercase tracking-wider border-b border-pine/10 pb-3">
          Identité du produit
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-forest-black/70">Titre court *</Label>
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="ex: Hooks Maîtres Instagram"
              className="bg-soft-paper border-pine/20 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-forest-black/70">Slug URL *</Label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-forest-black/50 font-mono">/sales/</span>
              <Input
                value={form.slug}
                onChange={(e) =>
                  update("slug", e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))
                }
                placeholder="hooks-instagram"
                className="bg-soft-paper border-pine/20 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-forest-black/70">
            Accroche principale (headline Cormorant) *
          </Label>
          <Input
            value={form.headline}
            onChange={(e) => update("headline", e.target.value)}
            placeholder="ex: Écrivez des hooks qui arrêtent le scroll et déclenchent les ventes."
            className="bg-soft-paper border-pine/20 text-sm"
          />
          <p className="text-[11px] text-forest-black/50">
            Cette phrase est le h1 de la page — courte, percutante, centrée sur le bénéfice.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-forest-black/70">Description développée</Label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Description libre visible sous la headline. Contexte, public cible, format livré..."
            className="bg-soft-paper border-pine/20 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ── Image Upload Widget ── */}
          <div className="space-y-1.5 sm:col-span-1">
            <Label className="text-xs font-medium text-forest-black/70 flex items-center gap-1.5">
              <ImageIcon className="size-3.5" /> Image de couverture
            </Label>

            {form.cover_image ? (
              /* Preview */
              <div className="relative group rounded-lg overflow-hidden border border-pine/20 bg-soft-paper">
                <img
                  src={form.cover_image}
                  alt="Couverture"
                  className="w-full h-36 object-cover"
                />
                <div className="absolute inset-0 bg-forest-black/0 group-hover:bg-forest-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-warm-ivory text-xs font-medium text-forest-black rounded-md shadow"
                  >
                    Changer
                  </button>
                  <button
                    type="button"
                    onClick={() => update("cover_image", "")}
                    className="px-3 py-1.5 bg-terracotta text-white text-xs font-medium rounded-md shadow"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              /* Drop zone */
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleImageDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 h-36 border-2 border-dashed border-pine/25 rounded-lg bg-soft-paper/60 hover:border-pine/50 hover:bg-soft-paper cursor-pointer transition-all"
              >
                {imageUploading ? (
                  <Loader2 className="size-6 animate-spin text-pine/60" />
                ) : (
                  <>
                    <Upload className="size-5 text-pine/50" />
                    <span className="text-xs text-forest-black/50 text-center px-4">
                      Glissez une image ou cliquez pour parcourir
                      <br />
                      <span className="text-[11px] text-forest-black/35">WebP, PNG, JPG — max 5 MB</span>
                    </span>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
                e.target.value = "";
              }}
            />

            {imageError && (
              <p className="text-[11px] text-terracotta">{imageError}</p>
            )}

            {/* URL fallback input */}
            <Input
              value={form.cover_image}
              onChange={(e) => update("cover_image", e.target.value)}
              placeholder="ou collez une URL externe https://..."
              className="bg-soft-paper border-pine/15 text-xs font-mono"
            />
          </div>

          {/* Trigger keyword */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-forest-black/70">
              Mot-clé déclencheur (ex: commentaire Instagram)
            </Label>
            <Input
              value={form.trigger_keyword}
              onChange={(e) => update("trigger_keyword", e.target.value)}
              placeholder="ex: HOOKS"
              className="bg-soft-paper border-pine/20 text-sm font-mono"
            />
            <p className="text-[11px] text-forest-black/50">Mémo interne — le mot que les abonnés commentent pour obtenir le lien.</p>
          </div>
        </div>
      </section>

      {/* ── Ce que vous obtenez ── */}
      <section className="bg-warm-ivory border border-pine/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-pine/10 pb-3">
          <h2 className="font-semibold text-forest-black text-sm uppercase tracking-wider">
            Ce que vous obtenez (bullet points)
          </h2>
          <Button variant="outline" size="sm" onClick={addFeature} className="text-xs h-7 border-pine/20">
            <Plus className="size-3 mr-1" /> Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {form.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-mint shrink-0" />
              <Input
                value={f}
                onChange={(e) => editFeature(i, e.target.value)}
                placeholder={`Bénéfice ${i + 1}...`}
                className="bg-soft-paper border-pine/20 text-sm flex-1"
              />
              {form.features.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="p-1 text-forest-black/30 hover:text-terracotta"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-warm-ivory border border-pine/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-pine/10 pb-3">
          <h2 className="font-semibold text-forest-black text-sm uppercase tracking-wider">
            FAQ (questions/réponses)
          </h2>
          <Button variant="outline" size="sm" onClick={addFaq} className="text-xs h-7 border-pine/20">
            <Plus className="size-3 mr-1" /> Ajouter
          </Button>
        </div>
        <div className="space-y-4">
          {form.faq.map((item, i) => (
            <div key={i} className="p-4 bg-soft-paper/60 border border-pine/10 rounded-lg space-y-2.5 relative">
              <button
                type="button"
                onClick={() => removeFaq(i)}
                className="absolute top-3 right-3 p-1 text-forest-black/30 hover:text-terracotta"
              >
                <X className="size-3.5" />
              </button>
              <div className="space-y-1">
                <Label className="text-[11px] text-forest-black/60">Question</Label>
                <Input
                  value={item.q}
                  onChange={(e) => editFaq(i, "q", e.target.value)}
                  placeholder="ex: Sous quel format est livré le produit ?"
                  className="bg-warm-ivory border-pine/20 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-forest-black/60">Réponse</Label>
                <Textarea
                  rows={2}
                  value={item.a}
                  onChange={(e) => editFaq(i, "a", e.target.value)}
                  placeholder="Réponse concise..."
                  className="bg-warm-ivory border-pine/20 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Régions de paiement ── */}
      <section className="bg-warm-ivory border border-pine/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-pine/10 pb-3">
          <div>
            <h2 className="font-semibold text-forest-black text-sm uppercase tracking-wider">
              Régions de paiement
            </h2>
            <p className="text-[11px] text-forest-black/50 mt-1">
              Une seule région active = question de région ignorée, redirection directe.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addRegion} className="text-xs h-7 border-pine/20">
            <Plus className="size-3 mr-1" /> Ajouter
          </Button>
        </div>
        <div className="space-y-4">
          {form.regions.map((region, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border space-y-3 ${
                region.is_active
                  ? "bg-soft-paper/60 border-pine/15"
                  : "bg-forest-black/5 border-pine/10 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-forest-black/70">
                  Région {i + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveRegion(i, -1)}
                    disabled={i === 0}
                    className="p-1 text-forest-black/30 hover:text-forest-black disabled:opacity-20"
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRegion(i, 1)}
                    disabled={i === form.regions.length - 1}
                    className="p-1 text-forest-black/30 hover:text-forest-black disabled:opacity-20"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                  <label className="flex items-center gap-1.5 text-[11px] text-forest-black/60 ml-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={region.is_active}
                      onChange={(e) => editRegion(i, "is_active", e.target.checked)}
                      className="rounded border-pine/30"
                    />
                    Active
                  </label>
                  {form.regions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRegion(i)}
                      className="p-1 text-forest-black/30 hover:text-terracotta ml-1"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-[11px] text-forest-black/60">Clé région (unique)</Label>
                  <Input
                    value={region.region_key}
                    onChange={(e) => editRegion(i, "region_key", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="europe"
                    className="bg-warm-ivory border-pine/20 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-forest-black/60">Plateforme</Label>
                  <select
                    value={region.platform_name}
                    onChange={(e) => editRegion(i, "platform_name", e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-warm-ivory border border-pine/20 text-xs text-forest-black focus:outline-none"
                  >
                    <option value="whop">Whop</option>
                    <option value="chariow">Chariow</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-forest-black/60">Label FR *</Label>
                  <Input
                    value={region.label_fr}
                    onChange={(e) => editRegion(i, "label_fr", e.target.value)}
                    placeholder="Europe & international"
                    className="bg-warm-ivory border-pine/20 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-forest-black/60">Label EN</Label>
                  <Input
                    value={region.label_en}
                    onChange={(e) => editRegion(i, "label_en", e.target.value)}
                    placeholder="Europe & international"
                    className="bg-warm-ivory border-pine/20 text-xs"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] text-forest-black/60">
                    URL de destination (checkout) *
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={region.checkout_url}
                      onChange={(e) => editRegion(i, "checkout_url", e.target.value)}
                      placeholder="https://whop.com/..."
                      className="bg-warm-ivory border-pine/20 text-xs font-mono flex-1"
                    />
                    {region.checkout_url && (
                      <a
                        href={region.checkout_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-forest-black/40 hover:text-terracotta"
                        title="Tester le lien"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Danger Zone ── */}
      {form.id && (
        <section className="bg-terracotta/5 border border-terracotta/25 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-terracotta">
            <AlertTriangle className="size-4 shrink-0" />
            <h2 className="font-semibold text-sm uppercase tracking-wider">Zone de danger</h2>
          </div>
          <p className="text-xs text-forest-black/60">
            La suppression est définitive et irréversible. Les acheteurs liés à cette page ne seront pas supprimés.
          </p>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs border-terracotta/40 text-terracotta hover:bg-terracotta hover:text-white transition-colors"
          >
            {deleting ? (
              <Loader2 className="size-3.5 animate-spin mr-1" />
            ) : (
              <Trash2 className="size-3.5 mr-1" />
            )}
            {deleting ? "Suppression..." : "Supprimer cette page de vente"}
          </Button>
        </section>
      )}

      {/* Save bottom bar */}
      <div className="sticky bottom-0 bg-warm-ivory/95 backdrop-blur-md border-t border-pine/15 p-4 flex justify-end gap-3 -mx-6 rounded-b-none print:hidden">
        <a
          href="/admin/sales/"
          className="inline-flex items-center text-sm text-forest-black/60 hover:text-forest-black px-4 py-2"
        >
          Annuler
        </a>
        <Button
          onClick={handleSave}
          disabled={saving}
          className={`${saved ? "bg-mint text-forest-black" : "bg-pine hover:bg-pine/90 text-paper"}`}
        >
          {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Save className="size-4 mr-1.5" />}
          {saving ? "Enregistrement..." : saved ? "Enregistré ✓" : "Enregistrer la page"}
        </Button>
      </div>
    </div>
  );
}
