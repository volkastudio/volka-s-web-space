import { ArrowUpRight } from "lucide-react";
import type { PostSocialLinks } from "@/lib/post-schema";

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
    return url ? [{ key, url, ...copy.channels[key] }] : [];
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
              className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-muted/30 sm:px-2"
            >
              <span className="min-w-0">
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
