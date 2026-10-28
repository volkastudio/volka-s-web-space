import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShoppingBag,
  Plus,
  Copy,
  ExternalLink,
  Search,
  CheckCircle2,
  TrendingUp,
  MousePointer,
  Link as LinkIcon,
  Sparkles,
  Check,
  Users,
  Pencil,
  Mail,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAdminProducts,
  duplicateProduct,
  saveProduct,
  deleteProduct,
} from "@/lib/sales/sales.functions";

export const Route = createFileRoute("/admin/sales/")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Pages de Vente — Volka Admin" },
    ],
  }),
  loader: async () => {
    return await getAdminProducts();
  },
  component: AdminSalesIndexPage,
});

interface ProductItem {
  id: string;
  slug: string;
  title: string;
  headline: string;
  status: "draft" | "published" | "archived";
  trigger_keyword: string | null;
  views_count: number;
  cta_clicks_count: number;
  outbound_clicks_count: number;
  product_regions?: { id: string; region_key: string; label_fr: string; is_active: boolean }[];
}

function AdminSalesIndexPage() {
  const initialProducts = Route.useLoaderData() as unknown as ProductItem[];
  const [products, setProducts] = React.useState<ProductItem[]>(initialProducts);
  const [copiedLink, setCopiedLink] = React.useState<string | null>(null);
  const [sourceTag, setSourceTag] = React.useState<string>("ig-bio");
  const [duplicating, setDuplicating] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const handleDuplicate = async (id: string) => {
    setDuplicating(id);
    try {
      const cloned = await duplicateProduct({ data: { id } });
      const refreshed = await getAdminProducts();
      setProducts(refreshed as unknown as ProductItem[]);
    } catch (err) {
      console.error(err);
    } finally {
      setDuplicating(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Supprimer définitivement « ${title} » ? Cette action est irréversible.`)) return;
    setDeleting(id);
    try {
      await deleteProduct({ data: { id } });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    } finally {
      setDeleting(null);
    }
  };

  const copyTaggedLink = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://volkastudio.com";
    const tag = sourceTag.trim() ? `?src=${encodeURIComponent(sourceTag.trim())}` : "";
    const fullUrl = `${origin}/sales/${slug}${tag}`;

    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(slug);
    setTimeout(() => setCopiedLink(null), 3000);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-forest-black">
            Ventes — Pages & Acheteurs
          </h1>
          <p className="text-sm text-forest-black/70">
            Gérez vos pages de vente `/sales/$slug`, liens trackés et redirections de paiement.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/admin/sales/buyers"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-pine/20 hover:bg-pine/10 text-forest-black/70 transition-colors"
          >
            <Users className="size-3.5" /> Acheteurs
          </Link>
          <Link
            to="/admin/sales/sequences"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-pine/20 hover:bg-pine/10 text-forest-black/70 transition-colors"
          >
            <Mail className="size-3.5" /> Séquences
          </Link>
          <Link
            to="/admin/sales/editor"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-pine hover:bg-pine/90 text-paper transition-colors"
          >
            <Plus className="size-3.5" /> Nouvelle page
          </Link>
        </div>
      </div>

      {/* Source tag input helper */}
      <div className="flex items-center gap-2 bg-soft-paper/60 p-2 rounded-lg border border-pine/10 text-xs w-fit">
        <LinkIcon className="size-3.5 text-terracotta" />
        <span className="text-forest-black/60">Tag source pour les liens :</span>
        <Input
          type="text"
          value={sourceTag}
          onChange={(e) => setSourceTag(e.target.value)}
          placeholder="ex: reel-mars"
          className="h-7 w-28 bg-warm-ivory text-xs px-2"
        />
      </div>

      {/* Table of Products */}
      <div className="bg-warm-ivory rounded-lg border border-pine/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-soft-paper/80 border-b border-pine/10 text-forest-black/70 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Produit & Titre</th>
                <th className="py-3 px-4">Mot-clé Déclencheur</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Vues</th>
                <th className="py-3 px-4">Clics CTA</th>
                <th className="py-3 px-4">Sortants</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine/5">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-forest-black/50 text-sm">
                    Aucune page de vente créée pour le moment.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isCopied = copiedLink === p.slug;

                  return (
                    <tr key={p.id} className="hover:bg-soft-paper/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-forest-black text-sm">
                          {p.title}
                        </div>
                        <div className="text-forest-black/60 font-mono text-[11px]">
                          /sales/{p.slug}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.trigger_keyword ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-ochre/15 text-forest-black font-mono font-medium text-[11px]">
                            {p.trigger_keyword}
                          </span>
                        ) : (
                          <span className="text-forest-black/40">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${
                            p.status === "published"
                              ? "bg-mint/15 border-mint/40 text-mint"
                              : p.status === "draft"
                                ? "bg-pine/10 border-pine/30 text-forest-black/70"
                                : "bg-forest-black/10 text-forest-black/40"
                          }`}
                        >
                          {p.status === "published"
                            ? "Publié"
                            : p.status === "draft"
                              ? "Brouillon"
                              : "Archivé"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">{p.views_count}</td>
                      <td className="py-3.5 px-4 font-mono">{p.cta_clicks_count}</td>
                      <td className="py-3.5 px-4 font-mono text-mint font-semibold">
                        {p.outbound_clicks_count}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {/* Copy Tagged Link */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyTaggedLink(p.slug)}
                          className="h-7 text-xs border-pine/20 hover:bg-pine/10"
                        >
                          {isCopied ? (
                            <>
                              <Check className="mr-1 size-3 text-mint" />
                              Copié !
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1 size-3" />
                              Lien tagué
                            </>
                          )}
                        </Button>

                        {/* Edit */}
                        <Link
                          to="/admin/sales/editor"
                          search={{ id: p.id }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded hover:text-terracotta hover:bg-terracotta/5 transition-colors"
                        >
                          <Pencil className="size-3" /> Éditer
                        </Link>

                        {/* Duplicate */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(p.id)}
                          disabled={duplicating === p.id}
                          className="h-7 text-xs hover:text-terracotta"
                        >
                          Dupliquer
                        </Button>

                        {/* Open Page */}
                        <a
                          href={`/sales/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs p-1 hover:text-terracotta"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(p.id, p.title)}
                          disabled={deleting === p.id}
                          className="h-7 text-xs hover:text-red-600 hover:bg-red-50 px-1.5"
                          title="Supprimer cette page"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
