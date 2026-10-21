import React from "react";
import { ArrowUpRight, Youtube, Linkedin, Video, PlayCircle } from "lucide-react";
import type { PostSocialLinks } from "@/lib/post-schema";

// Custom TikTok SVG Icon
function TikTokIcon({ className = "size-5" }: { className?: string }) {
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

interface SocialContentLinksProps {
  socialLinks?: PostSocialLinks;
  locale?: "fr" | "en";
  className?: string;
}

export function SocialContentLinks({
  socialLinks,
  locale = "fr",
  className = "",
}: SocialContentLinksProps) {
  if (!socialLinks) return null;

  const { tiktok, youtube, linkedin } = socialLinks;
  const hasLinks = Boolean(tiktok?.trim() || youtube?.trim() || linkedin?.trim());

  if (!hasLinks) return null;

  const labels = {
    fr: {
      eyebrow: "Formats complémentaires",
      title: "Prolongez ce sujet sur nos réseaux",
      subtitle:
        "Nous explorons également cette thématique sous forme de formats vidéo condensés, d'analyses longues et de discussions professionnelles.",
      youtube: {
        title: "Vidéo approfondie",
        desc: "Immersion complète, analyse d'écrans et retour d'expérience",
        action: "Regarder sur YouTube",
      },
      tiktok: {
        title: "Format express",
        desc: "Décryptage synthétique en 60 secondes",
        action: "Voir sur TikTok",
      },
      linkedin: {
        title: "Débat professionnel",
        desc: "Échanges d'experts, coulisses et perspectives de marché",
        action: "Participer sur LinkedIn",
      },
    },
    en: {
      eyebrow: "Related formats",
      title: "Explore this topic across our channels",
      subtitle:
        "We also cover this topic with practical video deep-dives, quick breakdowns, and executive industry discussions.",
      youtube: {
        title: "In-depth video",
        desc: "Full teardown, screen walkthroughs and tactical insights",
        action: "Watch on YouTube",
      },
      tiktok: {
        title: "Quick insight",
        desc: "60-second high-signal synthesis and takeaways",
        action: "Watch on TikTok",
      },
      linkedin: {
        title: "Industry discussion",
        desc: "Peer debates, behind-the-scenes and strategic notes",
        action: "Join on LinkedIn",
      },
    },
  }[locale];

  return (
    <div
      className={`my-12 rounded-xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 p-6 md:p-8 backdrop-blur-sm ${className}`}
    >
      <div className="flex flex-col gap-2 border-b border-border/60 pb-6">
        <div className="flex items-center gap-2">
          <PlayCircle className="size-4 text-gold" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            {labels.eyebrow}
          </span>
        </div>
        <h3 className="font-display text-2xl font-normal text-foreground md:text-3xl">
          {labels.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {labels.subtitle}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* YouTube Card */}
        {youtube?.trim() && (
          <a
            href={youtube.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col justify-between rounded-lg border border-red-500/20 bg-card/60 p-5 transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/5 hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-md bg-red-600/10 text-red-500 transition-colors group-hover:bg-red-600 group-hover:text-white">
                  <Youtube className="size-5" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
              </div>
              <h4 className="mt-4 font-display text-lg font-medium text-foreground">
                {labels.youtube.title}
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {labels.youtube.desc}
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-red-500">
              <span>{labels.youtube.action}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </a>
        )}

        {/* TikTok Card */}
        {tiktok?.trim() && (
          <a
            href={tiktok.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col justify-between rounded-lg border border-teal-500/20 bg-card/60 p-5 transition-all duration-300 hover:border-teal-500/50 hover:bg-teal-500/5 hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-md bg-teal-500/10 text-teal-400 transition-colors group-hover:bg-teal-500 group-hover:text-black">
                  <TikTokIcon className="size-5" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
              </div>
              <h4 className="mt-4 font-display text-lg font-medium text-foreground">
                {labels.tiktok.title}
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {labels.tiktok.desc}
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-teal-400">
              <span>{labels.tiktok.action}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </a>
        )}

        {/* LinkedIn Card */}
        {linkedin?.trim() && (
          <a
            href={linkedin.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col justify-between rounded-lg border border-sky-500/20 bg-card/60 p-5 transition-all duration-300 hover:border-sky-500/50 hover:bg-sky-500/5 hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-md bg-sky-500/10 text-sky-400 transition-colors group-hover:bg-sky-500 group-hover:text-white">
                  <Linkedin className="size-5" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
              </div>
              <h4 className="mt-4 font-display text-lg font-medium text-foreground">
                {labels.linkedin.title}
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {labels.linkedin.desc}
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-sky-400">
              <span>{labels.linkedin.action}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}
