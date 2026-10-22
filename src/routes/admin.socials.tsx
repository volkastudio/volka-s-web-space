import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Facebook,
  Phone,
  Mail,
  Check,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_STUDIO_SOCIALS,
  getStudioSocials,
  saveStudioSocials,
  type StudioSocialLinks,
} from "@/lib/studio-socials";

// Custom TikTok Icon
function TikTokIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.16 1.18 2.09 2.35 2.29.98.19 2.02-.04 2.81-.66.69-.53 1.11-1.34 1.15-2.21.05-3.88.02-7.77.03-11.66.01-2.12.01-4.24.01-6.36z" />
    </svg>
  );
}

export const Route = createFileRoute("/admin/socials")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Social Media Links — Volka Admin" },
    ],
  }),
  component: AdminSocialsPage,
});

function AdminSocialsPage() {
  const [form, setForm] = React.useState<StudioSocialLinks>(() => getStudioSocials());
  const [saved, setSaved] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleChange = (key: keyof StudioSocialLinks, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveStudioSocials(form);
    setSaved(true);
    setMessage("Tous les liens des réseaux sociaux du studio ont été enregistrés avec succès !");
    setTimeout(() => {
      setMessage(null);
    }, 4000);
  };

  const handleReset = () => {
    if (confirm("Réinitialiser tous les liens des réseaux sociaux aux valeurs par défaut ?")) {
      setForm(DEFAULT_STUDIO_SOCIALS);
      saveStudioSocials(DEFAULT_STUDIO_SOCIALS);
      setSaved(true);
      setMessage("Les liens ont été réinitialisés aux valeurs par défaut.");
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const channels: {
    key: keyof StudioSocialLinks;
    label: string;
    description: string;
    placeholder: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
  }[] = [
    {
      key: "instagram",
      label: "Instagram",
      description: "Page de profil Instagram officielle du studio (affichée dans le footer et pages clés)",
      placeholder: "https://www.instagram.com/volkastudio",
      icon: Instagram,
      iconColor: "text-pink-400",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      description: "Page d'entreprise ou profil exécutif LinkedIn (affiché dans le journal et le footer)",
      placeholder: "https://www.linkedin.com/company/volka-studio",
      icon: Linkedin,
      iconColor: "text-sky-400",
    },
    {
      key: "tiktok",
      label: "TikTok",
      description: "Compte TikTok officiel pour les analyses et formats vidéo courts",
      placeholder: "https://www.tiktok.com/@volkastudio",
      icon: TikTokIcon,
      iconColor: "text-teal-400",
    },
    {
      key: "youtube",
      label: "YouTube",
      description: "Chaîne YouTube pour les études de cas approfondies et les démonstrations",
      placeholder: "https://www.youtube.com/@volkastudio",
      icon: Youtube,
      iconColor: "text-red-500",
    },
    {
      key: "twitter",
      label: "X (anciennement Twitter)",
      description: "Compte X pour les réflexions stratégiques, veilles et discussions",
      placeholder: "https://x.com/volkastudio",
      icon: Twitter,
      iconColor: "text-foreground",
    },
    {
      key: "facebook",
      label: "Facebook",
      description: "Page Facebook ou communauté officielle du studio",
      placeholder: "https://www.facebook.com/volkastudio",
      icon: Facebook,
      iconColor: "text-blue-500",
    },
    {
      key: "whatsapp",
      label: "WhatsApp Business Direct",
      description: "Lien direct wa.me pour échanger instantanément avec les prospects",
      placeholder: "https://wa.me/22900000000?text=Bonjour%20Volka...",
      icon: Phone,
      iconColor: "text-emerald-400",
    },
    {
      key: "email",
      label: "Email de contact principal",
      description: "Adresse email institutionnelle pour les demandes générales",
      placeholder: "hello@volkastudio.com",
      icon: Mail,
      iconColor: "text-amber-400",
    },
  ];

  return (
    <div className="p-6 md:p-10 lg:p-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-8 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-gold">
            <Share2 className="size-4" />
            <p className="text-xs font-medium uppercase tracking-[0.2em]">Paramètres Studio</p>
          </div>
          <h1 className="mt-2 font-display text-4xl font-light md:text-5xl">
            Réseaux Sociaux & Contact
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Configurez ici l'ensemble des liens officiels de Volka Studio (Instagram, LinkedIn, TikTok, YouTube, X, WhatsApp, etc.). Ces liens alimentent directement le footer, la section Journal et les composants de contact de l'ensemble du site.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs uppercase tracking-wider"
          >
            <RotateCcw className="size-3.5 mr-1" />
            Par défaut
          </Button>
          <Button
            type="button"
            variant="volka"
            size="sm"
            onClick={handleSubmit}
            className="text-xs uppercase tracking-wider shadow-sm"
          >
            <Check className="size-3.5 mr-1" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {message && (
        <div className="mt-6 flex items-center gap-3 rounded border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400">
          <Check className="size-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {channels.map((channel) => {
            const Icon = channel.icon;
            const value = form[channel.key];
            const hasValue = Boolean(value?.trim());

            return (
              <div
                key={channel.key}
                className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-gold/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-sm bg-background border border-border/70">
                      <Icon className={`size-4 ${channel.iconColor}`} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        {channel.label}
                      </label>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {channel.description}
                      </p>
                    </div>
                  </div>

                  {hasValue && (
                    <a
                      href={value.startsWith("http") || value.startsWith("mailto:") ? value : `https://${value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Tester le lien"
                      className="rounded p-1.5 text-muted-foreground hover:text-gold"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>

                <div className="mt-4">
                  <input
                    type={channel.key === "email" ? "email" : "text"}
                    value={value || ""}
                    onChange={(e) => handleChange(channel.key, e.target.value)}
                    placeholder={channel.placeholder}
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none transition-colors"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Preview Card */}
        <div className="rounded-xl border border-gold/30 bg-card p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2 text-gold">
            <Sparkles className="size-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Aperçu en direct (Liens actifs pour le public)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Voici les réseaux actuellement configurés qui apparaîtront pour les visiteurs :
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {Object.entries(form).map(([key, val]) => {
              if (!val?.trim()) return null;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1.5 text-xs text-foreground"
                >
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span className="font-medium capitalize">{key}</span>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="flex justify-end pt-4">
          <Button type="submit" variant="volka" size="volka" className="shadow-sm">
            <Check className="size-4 mr-1.5" />
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}
