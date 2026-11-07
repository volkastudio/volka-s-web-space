import type { ComponentType } from "react";
import { ArrowUpRight, Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import type { PostSocialLinks } from "@/lib/post-schema";

// TikTok has no lucide icon.
function TikTokIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.16 1.18 2.09 2.35 2.29.98.19 2.02-.04 2.81-.66.69-.53 1.11-1.34 1.15-2.21.05-3.88.02-7.77.03-11.66.01-2.12.01-4.24.01-6.36z" />
    </svg>
  );
}

const ICONS: Record<keyof PostSocialLinks, ComponentType<{ className?: string }>> = {
  youtube: Youtube,
  linkedin: Linkedin,
  instagram: Instagram,
  tiktok: TikTokIcon,
  twitter: Twitter,
  facebook: Facebook,
};

interface SocialContentLinksProps {
  socialLinks?: PostSocialLinks;
  locale?: "fr" | "en";
  className?: string;
}

type Channel = keyof PostSocialLinks;

// One calm line per channel: the platform, what this format adds, and a quiet arrow.
// No brand colours, boxes or icons: the article stays the main thing on the page.
const COPY: Record<
  "fr" | "en",
  { eyebrow: string; channels: Record<Channel, { name: string; note: string }> }
> = {
  fr: {
    eyebrow: "Ce sujet en vidéo et ailleurs",
    channels: {
      youtube: { name: "YouTube", note: "La version vidéo, avec les écrans et les exemples" },
      tiktok: { name: "TikTok", note: "L'essentiel en une minute" },
      linkedin: { name: "LinkedIn", note: "Le sujet en discussion avec d'autres professionnels" },
      instagram: { name: "Instagram", note: "Schémas et coulisses" },
      twitter: { name: "X", note: "Les idées clés en fil court" },
      facebook: { name: "Facebook", note: "Échanges et retours d'expérience" },
    },
  },
  en: {
    eyebrow: "This topic on video and elsewhere",
    channels: {
      youtube: { name: "YouTube", note: "The video version, with screens and examples" },
      tiktok: { name: "TikTok", note: "The essentials in one minute" },
      linkedin: { name: "LinkedIn", note: "The topic in discussion with other professionals" },
      instagram: { name: "Instagram", note: "Diagrams and behind the scenes" },
      twitter: { name: "X", note: "The key ideas in a short thread" },
      facebook: { name: "Facebook", note: "Discussion and shared experience" },
    },
  },
};

const ORDER: Channel[] = ["youtube", "linkedin", "instagram", "tiktok", "twitter", "facebook"];

export function SocialContentLinks({
  socialLinks,
  locale = "fr",
  className = "",
}: SocialContentLinksProps) {
  if (!socialLinks) return null;

  const copy = COPY[locale];
  const items = ORDER.flatMap((key) => {
    const url = socialLinks[key]?.trim();
    return url ? [{ key, url, Icon: ICONS[key], ...copy.channels[key] }] : [];
  });

  if (items.length === 0) return null;

  return (
    <div className={className}>
      <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
        {copy.eyebrow}
      </p>

      <ul className="mt-4 divide-y divide-border border-y border-border">
        {items.map((item) => (
          <li key={item.key}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 py-4 transition-colors hover:bg-muted/30 sm:px-2"
            >
              <item.Icon className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl text-foreground transition-colors group-hover:text-primary">
                  {item.name}
                </span>
                <span className="mt-0.5 block text-sm font-light text-muted-foreground">
                  {item.note}
                </span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
