import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  Plus,
  Upload,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  ChevronRight,
  Mail,
  Globe,
  ShoppingBag,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getAdminBuyers,
  addAdminBuyer,
  importBuyersCsv,
  getAdminProducts,
} from "@/lib/sales/sales.functions";

export const Route = createFileRoute("/admin/sales/buyers")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Acheteurs — Volka Admin" },
    ],
  }),
  loader: async () => {
    const [buyersData, products] = await Promise.all([
      getAdminBuyers({ data: { limit: 100 } }),
      getAdminProducts(),
    ]);
    return { buyersData, products };
  },
  component: AdminBuyersPage,
});

type MarketingConsent = "yes" | "no" | "unknown";

interface BuyerItem {
  id: string;
  email: string;
  name: string | null;
  country: string | null;
  product_title: string;
  platform: string;
  platform_order_ref: string | null;
  amount_cents: number | null;
  currency: string;
  marketing_consent: MarketingConsent;
  consent_note: string | null;
  source_tag: string | null;
  created_at: string;
  purchased_at: string | null;
}

interface ProductItem {
  id: string;
  title: string;
  slug: string;
}

const CONSENT_LABELS: Record<MarketingConsent, { label: string; className: string }> = {
  yes: { label: "Consent. oui", className: "bg-mint/15 border-mint/40 text-mint" },
  no: { label: "Refus", className: "bg-terracotta/15 border-terracotta/40 text-terracotta" },
  unknown: { label: "Inconnu", className: "bg-pine/10 border-pine/30 text-forest-black/60" },
};

const PLATFORM_LABELS: Record<string, string> = {
  whop: "Whop",
  chariow: "Chariow",
  manual: "Manuel",
  csv: "Import CSV",
};

function parseCsvRows(csvText: string): Record<string, string>[] {
  const lines = csvText.split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = (lines[0] ?? "").split(",").map((h) => h.trim().toLowerCase().replace(/[\s"]/g, "_"));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

function mapCsvRow(row: Record<string, string>, platform: string) {
  return {
    email: row["email"] ?? "",
    name: row["name"] ?? row["prénom"] ?? row["first_name"] ?? "",
    country: row["country"] ?? row["pays"] ?? "",
    product_title: row["product"] ?? row["produit"] ?? row["product_title"] ?? "",
    platform,
    platform_order_ref: row["order_id"] ?? row["order_ref"] ?? row["reference"] ?? "",
    amount_cents: row["amount"]
      ? Math.round(parseFloat(row["amount"].replace(",", ".")) * 100)
      : undefined,
    currency: row["currency"] ?? row["devise"] ?? "EUR",
    marketing_consent: (["yes", "no", "unknown"].includes(row["marketing_consent"] ?? "")
      ? row["marketing_consent"]
      : "unknown") as MarketingConsent,
    consent_note: row["consent_note"] ?? `Import CSV plateforme ${platform}`,
  };
}

function formatAmount(cents: number | null, currency: string): string {
  if (!cents) return "—";
  const amount = cents / 100;
  if (currency === "XOF") return `${amount.toLocaleString("fr-FR")} FCFA`;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount);
}

function AdminBuyersPage() {
  const { buyersData, products } = Route.useLoaderData() as {
    buyersData: { buyers: BuyerItem[]; totalCount: number };
    products: ProductItem[];
  };

  const [buyers, setBuyers] = React.useState<BuyerItem[]>(buyersData.buyers as BuyerItem[]);
  const [search, setSearch] = React.useState("");
  const [consentFilter, setConsentFilter] = React.useState("all");
  const [platformFilter, setPlatformFilter] = React.useState("all");

  // Modal states
  const [showManualForm, setShowManualForm] = React.useState(false);
  const [showCsvImport, setShowCsvImport] = React.useState(false);
  const [selectedBuyer, setSelectedBuyer] = React.useState<BuyerItem | null>(null);

  // Toast
  const [toast, setToast] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredBuyers = buyers.filter((b) => {
    if (consentFilter !== "all" && b.marketing_consent !== consentFilter) return false;
    if (platformFilter !== "all" && b.platform !== platformFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        b.email.toLowerCase().includes(q) ||
        (b.name ?? "").toLowerCase().includes(q) ||
        b.product_title.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const consentCounts = {
    yes: buyers.filter((b) => b.marketing_consent === "yes").length,
    no: buyers.filter((b) => b.marketing_consent === "no").length,
    unknown: buyers.filter((b) => b.marketing_consent === "unknown").length,
  };

  // CSV Export
  const exportCsv = () => {
    const headers = ["email", "name", "country", "product", "platform", "amount", "currency", "consent", "date"];
    const rows = filteredBuyers.map((b) =>
      [
        b.email,
        b.name ?? "",
        b.country ?? "",
        b.product_title,
        b.platform,
        b.amount_cents ? (b.amount_cents / 100).toFixed(2) : "",
        b.currency,
        b.marketing_consent,
        new Date(b.purchased_at ?? b.created_at).toISOString().slice(0, 10),
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acheteurs-volka-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-md bg-forest-black border border-mint text-paper text-sm shadow-xl flex items-center gap-2">
          <CheckCircle2 className="size-4 text-mint" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-forest-black">Acheteurs</h1>
          <p className="text-sm text-forest-black/70">
            {buyers.length} acheteur{buyers.length > 1 ? "s" : ""} ·{" "}
            <span className="text-mint font-medium">{consentCounts.yes} consentements oui</span> ·{" "}
            <span className="text-forest-black/50">{consentCounts.unknown} inconnus</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/admin/sales"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-pine/20 hover:bg-pine/10 text-forest-black/70 transition-colors"
          >
            <ShoppingBag className="size-3.5" /> Pages de vente
          </Link>
          <Link
            to="/admin/sales/sequences"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-pine/20 hover:bg-pine/10 text-forest-black/70 transition-colors"
          >
            <Mail className="size-3.5" /> Séquences
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="text-xs border-pine/20 hover:bg-pine/10"
          >
            <Download className="size-3.5 mr-1.5" /> Exporter CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCsvImport(true)}
            className="text-xs border-pine/20 hover:bg-pine/10"
          >
            <Upload className="size-3.5 mr-1.5" /> Importer CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setShowManualForm(true)}
            className="text-xs bg-pine hover:bg-pine/90 text-paper"
          >
            <Plus className="size-3.5 mr-1.5" /> Ajouter manuellement
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Consentement oui", value: consentCounts.yes, color: "text-mint" },
          { label: "Refus / Non-email", value: consentCounts.no, color: "text-terracotta" },
          { label: "Inconnus", value: consentCounts.unknown, color: "text-ochre" },
        ].map((s) => (
          <div key={s.label} className="bg-warm-ivory rounded-lg border border-pine/10 p-4 text-center">
            <div className={`font-display text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-xs text-forest-black/60 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-soft-paper/50 p-4 rounded-lg border border-pine/10">
        <div className="relative w-full md:w-80">
          <Search className="size-4 text-forest-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Rechercher par email, nom, produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-warm-ivory border-pine/20 text-xs"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={consentFilter}
            onChange={(e) => setConsentFilter(e.target.value)}
            className="h-9 px-3 rounded-md bg-warm-ivory border border-pine/20 text-xs text-forest-black focus:outline-none"
          >
            <option value="all">Tout consentement</option>
            <option value="yes">Oui</option>
            <option value="no">Non</option>
            <option value="unknown">Inconnu</option>
          </select>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="h-9 px-3 rounded-md bg-warm-ivory border border-pine/20 text-xs text-forest-black focus:outline-none"
          >
            <option value="all">Toutes plateformes</option>
            <option value="whop">Whop</option>
            <option value="chariow">Chariow</option>
            <option value="manual">Manuel</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-warm-ivory rounded-lg border border-pine/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-soft-paper/80 border-b border-pine/10 text-forest-black/70 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Acheteur</th>
                <th className="py-3 px-4">Produit & Plateforme</th>
                <th className="py-3 px-4">Montant</th>
                <th className="py-3 px-4">Consentement</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine/5">
              {filteredBuyers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-forest-black/50 text-sm space-y-2">
                    <Users className="size-8 mx-auto text-forest-black/20" />
                    <p>Aucun acheteur ne correspond aux filtres appliqués.</p>
                  </td>
                </tr>
              ) : (
                filteredBuyers.map((b) => {
                  const consent = CONSENT_LABELS[b.marketing_consent];
                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBuyer(b)}
                      className="hover:bg-soft-paper/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-forest-black text-sm group-hover:text-terracotta transition-colors">
                          {b.name || "—"}
                        </div>
                        <div className="text-forest-black/60 text-[11px]">{b.email}</div>
                        {b.country && (
                          <div className="text-forest-black/40 text-[11px] flex items-center gap-1">
                            <Globe className="size-2.5" />{b.country}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-forest-black">{b.product_title}</div>
                        <div className="text-forest-black/50 text-[11px] mt-0.5">
                          {PLATFORM_LABELS[b.platform] ?? b.platform}
                          {b.source_tag && (
                            <span className="ml-1 px-1.5 py-0.5 rounded bg-ochre/10 text-ochre font-mono text-[10px]">
                              {b.source_tag}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-forest-black">
                        {formatAmount(b.amount_cents, b.currency)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-medium ${consent.className}`}
                        >
                          {consent.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-forest-black/70">
                        {new Date(b.purchased_at ?? b.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 hover:text-terracotta"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBuyer(b);
                          }}
                        >
                          Voir <ChevronRight className="ml-1 size-3.5" />
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

      {/* ── MANUAL ENTRY MODAL ── */}
      {showManualForm && (
        <ManualBuyerModal
          products={products}
          onClose={() => setShowManualForm(false)}
          onSuccess={(newBuyer) => {
            setBuyers((prev) => [newBuyer as BuyerItem, ...prev]);
            setShowManualForm(false);
            setToast("Acheteur ajouté avec succès.");
          }}
        />
      )}

      {/* ── CSV IMPORT MODAL ── */}
      {showCsvImport && (
        <CsvImportModal
          onClose={() => setShowCsvImport(false)}
          onSuccess={(count) => {
            setShowCsvImport(false);
            setToast(`${count} acheteur${count > 1 ? "s" : ""} importé${count > 1 ? "s" : ""} avec succès.`);
            // Reload the list
            getAdminBuyers({ data: { limit: 100 } }).then((res) =>
              setBuyers((res as any).buyers ?? [])
            );
          }}
        />
      )}

      {/* ── BUYER DETAIL DRAWER ── */}
      {selectedBuyer && (
        <BuyerDetailDrawer
          buyer={selectedBuyer}
          onClose={() => setSelectedBuyer(null)}
        />
      )}
    </div>
  );
}

// ── Manual buyer entry modal ──
function ManualBuyerModal({
  products,
  onClose,
  onSuccess,
}: {
  products: ProductItem[];
  onClose: () => void;
  onSuccess: (buyer: unknown) => void;
}) {
  const [form, setForm] = React.useState({
    email: "",
    name: "",
    country: "",
    product_title: "",
    product_id: "",
    platform: "manual",
    platform_order_ref: "",
    amount: "",
    currency: "EUR",
    marketing_consent: "unknown" as MarketingConsent,
    consent_note: "",
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email || !form.product_title) {
      setError("L'email et le titre du produit sont requis.");
      return;
    }
    setSaving(true);
    try {
      const result = await addAdminBuyer({
        data: {
          email: form.email,
          name: form.name || undefined,
          country: form.country || undefined,
          product_id: form.product_id || undefined,
          product_title: form.product_title,
          platform: form.platform,
          platform_order_ref: form.platform_order_ref || undefined,
          amount_cents: form.amount ? Math.round(parseFloat(form.amount.replace(",", ".")) * 100) : undefined,
          currency: form.currency,
          marketing_consent: form.marketing_consent,
          consent_note: form.consent_note || undefined,
        },
      });
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-forest-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-warm-ivory border border-pine/20 rounded-xl p-6 space-y-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl font-medium text-forest-black">Ajouter un acheteur</h3>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-pine/10 rounded text-forest-black/60">
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-terracotta/10 border border-terracotta/30 rounded text-sm text-terracotta">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-forest-black/70">Email *</Label>
              <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="acheteur@email.com" type="email" className="text-sm bg-soft-paper border-pine/20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-forest-black/70">Nom</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Prénom Nom" className="text-sm bg-soft-paper border-pine/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-forest-black/70">Pays</Label>
              <Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="Bénin" className="text-sm bg-soft-paper border-pine/20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-forest-black/70">Plateforme</Label>
              <select value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                className="w-full h-9 px-3 rounded-md bg-soft-paper border border-pine/20 text-sm text-forest-black">
                <option value="manual">Manuel</option>
                <option value="whop">Whop</option>
                <option value="chariow">Chariow</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-forest-black/70">Produit *</Label>
            <div className="space-y-1">
              <select
                value={form.product_id}
                onChange={(e) => {
                  const sel = products.find((p) => p.id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    product_id: e.target.value,
                    product_title: sel?.title ?? f.product_title,
                  }));
                }}
                className="w-full h-9 px-3 rounded-md bg-soft-paper border border-pine/20 text-sm text-forest-black"
              >
                <option value="">Choisir un produit existant...</option>
                {(products as ProductItem[]).map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <Input
                value={form.product_title}
                onChange={(e) => setForm((f) => ({ ...f, product_title: e.target.value, product_id: "" }))}
                placeholder="Ou saisir un nom de produit libre..."
                className="text-sm bg-soft-paper border-pine/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-forest-black/70">Référence commande plateforme</Label>
              <Input value={form.platform_order_ref} onChange={(e) => setForm((f) => ({ ...f, platform_order_ref: e.target.value }))}
                placeholder="ex: ord_abc123" className="text-sm bg-soft-paper border-pine/20 font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-forest-black/70">Devise</Label>
              <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="w-full h-9 px-3 rounded-md bg-soft-paper border border-pine/20 text-sm">
                <option value="EUR">EUR</option>
                <option value="XOF">FCFA</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-forest-black/70">Montant payé (en unité monétaire)</Label>
            <Input value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="ex: 29.90 ou 12500" type="text" className="text-sm bg-soft-paper border-pine/20" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-forest-black/70">Consentement marketing *</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["yes", "no", "unknown"] as MarketingConsent[]).map((c) => (
                <label
                  key={c}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-md border cursor-pointer text-xs font-medium transition-colors ${
                    form.marketing_consent === c
                      ? CONSENT_LABELS[c].className
                      : "border-pine/20 text-forest-black/60 hover:bg-pine/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="consent"
                    value={c}
                    checked={form.marketing_consent === c}
                    onChange={() => setForm((f) => ({ ...f, marketing_consent: c }))}
                    className="sr-only"
                  />
                  {c === "yes" ? "Oui" : c === "no" ? "Non" : "Inconnu"}
                </label>
              ))}
            </div>
            <p className="text-[11px] text-forest-black/50">
              « Oui » = la case opt-in était cochée sur la plateforme. Seuls les « oui » recevront des emails séquencés.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-forest-black/70">Note sur le consentement</Label>
            <Input value={form.consent_note} onChange={(e) => setForm((f) => ({ ...f, consent_note: e.target.value }))}
              placeholder="ex: Opt-in coché sur Whop checkout, export du 24 oct." className="text-sm bg-soft-paper border-pine/20" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-pine/10">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={saving}
              className="text-xs bg-pine hover:bg-pine/90 text-paper">
              {saving ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Plus className="size-3.5 mr-1" />}
              Ajouter l'acheteur
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── CSV Import Modal ──
function CsvImportModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (count: number) => void;
}) {
  const [platform, setPlatform] = React.useState("whop");
  const [csvText, setCsvText] = React.useState("");
  const [preview, setPreview] = React.useState<Record<string, string>[] | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<{
    importedCount: number;
    skippedCount: number;
    errors: string[];
  } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setPreview(parseCsvRows(text).slice(0, 5));
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const rows = parseCsvRows(csvText);
    if (!rows.length) return;
    setImporting(true);
    try {
      const mapped = rows.map((r) => mapCsvRow(r, platform));
      const res = await importBuyersCsv({ data: { rows: mapped } });
      setResult(res as { importedCount: number; skippedCount: number; errors: string[] });
    } catch (err) {
      setResult({ importedCount: 0, skippedCount: 0, errors: [String(err)] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-forest-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-warm-ivory border border-pine/20 rounded-xl p-6 space-y-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl font-medium text-forest-black">Importer des acheteurs CSV</h3>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-pine/10 rounded text-forest-black/60">
            <X className="size-5" />
          </button>
        </div>

        {!result ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-forest-black/70">Plateforme source</Label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-soft-paper border border-pine/20 text-sm text-forest-black">
                <option value="whop">Whop (export CSV)</option>
                <option value="chariow">Chariow (export CSV)</option>
                <option value="manual">Autre / Manuel</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-forest-black/70">Fichier CSV</Label>
              <div className="border-2 border-dashed border-pine/20 rounded-lg p-6 text-center space-y-2 hover:border-pine/40 transition-colors">
                <Upload className="size-8 text-forest-black/30 mx-auto" />
                <p className="text-sm text-forest-black/60">Glissez votre export CSV ou</p>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-pine/10 hover:bg-pine/20 text-sm font-medium text-forest-black transition-colors">
                  <Upload className="size-4" /> Choisir un fichier
                  <input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleFile} />
                </label>
              </div>
              <p className="text-[11px] text-forest-black/50">
                Colonnes attendues (en-tête FR ou EN) : email, name/prénom, country/pays,
                product/produit, amount, currency, order_id, marketing_consent
              </p>
            </div>

            {/* Or paste */}
            <div className="space-y-1.5">
              <Label className="text-xs text-forest-black/70">Ou coller le CSV directement</Label>
              <Textarea
                rows={5}
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  setPreview(parseCsvRows(e.target.value).slice(0, 5));
                  setResult(null);
                }}
                placeholder={"email,name,product,...\nexemple@email.com,Jean Dupont,..."}
                className="text-xs font-mono bg-soft-paper border-pine/20"
              />
            </div>

            {/* Preview */}
            {preview && preview.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-forest-black/70">
                  Prévisualisation — {parseCsvRows(csvText).length} ligne{parseCsvRows(csvText).length > 1 ? "s" : ""} détectée{parseCsvRows(csvText).length > 1 ? "s" : ""}
                </p>
                <div className="overflow-x-auto rounded-lg border border-pine/15">
                  <table className="w-full text-[11px]">
                    <thead className="bg-pine/5 text-forest-black/60 uppercase tracking-wider">
                      <tr>
                        {Object.keys(preview[0] ?? {}).slice(0, 5).map((h) => (
                          <th key={h} className="py-2 px-3 text-left font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pine/5">
                      {preview.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-warm-ivory" : "bg-soft-paper"}>
                          {Object.values(row).slice(0, 5).map((v, j) => (
                            <td key={j} className="py-2 px-3 truncate max-w-[120px]">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-pine/10">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">Annuler</Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={importing || !csvText.trim()}
                className="text-xs bg-pine hover:bg-pine/90 text-paper"
              >
                {importing ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Upload className="size-3.5 mr-1" />}
                {importing ? "Importation..." : `Importer ${parseCsvRows(csvText).length || ""} lignes`}
              </Button>
            </div>
          </>
        ) : (
          /* Result screen */
          <div className="space-y-4 text-center py-4">
            {result.errors.length === 0 ? (
              <CheckCircle2 className="size-12 text-mint mx-auto" />
            ) : (
              <AlertTriangle className="size-12 text-ochre mx-auto" />
            )}
            <h4 className="font-display text-2xl font-medium text-forest-black">
              Import terminé
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-mint/10 border border-mint/30 text-center">
                <div className="font-display text-3xl text-mint font-medium">{result.importedCount}</div>
                <div className="text-xs text-forest-black/60 mt-1">Importé{result.importedCount > 1 ? "s" : ""}</div>
              </div>
              <div className="p-4 rounded-lg bg-pine/5 border border-pine/20 text-center">
                <div className="font-display text-3xl text-forest-black/50">{result.skippedCount}</div>
                <div className="text-xs text-forest-black/60 mt-1">Ignoré{result.skippedCount > 1 ? "s" : ""} (doublons)</div>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="p-3 bg-terracotta/10 border border-terracotta/20 rounded text-left text-xs space-y-1">
                <p className="font-semibold text-terracotta">{result.errors.length} erreur{result.errors.length > 1 ? "s" : ""} :</p>
                {result.errors.slice(0, 5).map((e, i) => <p key={i} className="text-forest-black/70">{e}</p>)}
              </div>
            )}
            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">Fermer</Button>
              <Button size="sm" onClick={() => onSuccess(result.importedCount)} className="text-xs bg-pine text-paper">
                Voir les acheteurs
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Buyer detail drawer ──
function BuyerDetailDrawer({ buyer, onClose }: { buyer: BuyerItem; onClose: () => void }) {
  const consent = CONSENT_LABELS[buyer.marketing_consent];
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-forest-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-warm-ivory border-l border-pine/20 h-full overflow-y-auto p-6 space-y-6 shadow-2xl z-10">
        <div className="flex items-start justify-between border-b border-pine/10 pb-4">
          <div>
            <h2 className="font-display text-2xl text-forest-black font-semibold">
              {buyer.name || buyer.email.split("@")[0]}
            </h2>
            <p className="text-xs text-forest-black/60 mt-0.5">{buyer.email}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-pine/10 rounded text-forest-black/60">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {[
            { label: "Pays", value: buyer.country ?? "—" },
            { label: "Produit", value: buyer.product_title },
            { label: "Plateforme", value: PLATFORM_LABELS[buyer.platform] ?? buyer.platform },
            { label: "Référence commande", value: buyer.platform_order_ref ?? "—" },
            { label: "Montant", value: formatAmount(buyer.amount_cents, buyer.currency) },
            { label: "Source tag", value: buyer.source_tag ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-pine/5 last:border-0">
              <span className="text-forest-black/60 font-medium">{label}</span>
              <span className="text-forest-black font-medium text-right">{value}</span>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-soft-paper/60 border border-pine/10 space-y-2">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-forest-black/50">
            Consentement marketing
          </p>
          <span className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${consent.className}`}>
            {consent.label}
          </span>
          {buyer.consent_note && (
            <p className="text-xs text-forest-black/70 italic">{buyer.consent_note}</p>
          )}
        </div>

        <div className="text-xs text-forest-black/50 space-y-1">
          <p>
            Ajouté le{" "}
            {new Date(buyer.purchased_at ?? buyer.created_at).toLocaleDateString("fr-FR", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <a
            href={`mailto:${buyer.email}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-pine/10 hover:bg-pine/20 text-xs font-medium text-forest-black transition-colors"
          >
            <Mail className="size-3.5" /> Envoyer un email
          </a>
          <a
            href={`https://wa.me/${buyer.country === "Bénin" ? "229" : ""}${buyer.email}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-mint/10 hover:bg-mint/20 text-xs font-medium text-forest-black transition-colors"
          >
            <ShoppingBag className="size-3.5" /> Voir dans le pipeline
          </a>
        </div>

        <div className="pt-2 border-t border-pine/10 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">Fermer</Button>
        </div>
      </div>
    </div>
  );
}
