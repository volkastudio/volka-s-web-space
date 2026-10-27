import * as React from "react";

export interface StudioSocialLinks {
  instagram: string;
  linkedin: string;
  tiktok: string;
  youtube: string;
  twitter: string;
  facebook: string;
  whatsapp: string;
  email: string;
}

export const DEFAULT_STUDIO_SOCIALS: StudioSocialLinks = {
  instagram: "https://www.instagram.com/volkastudio",
  linkedin: "https://www.linkedin.com/company/volka-studio",
  tiktok: "https://www.tiktok.com/@volkastudio",
  youtube: "https://www.youtube.com/@volkastudio",
  twitter: "https://x.com/volkastudio",
  facebook: "",
  whatsapp: "",
  email: "hello@volkastudio.com",
};

const STORAGE_KEY = "volka_studio_socials";

/**
 * Checks whether a WhatsApp string is a fake or empty placeholder.
 */
export function isPlaceholderWhatsApp(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return true;
  return url.includes("22900000000") || url.includes("00000000");
}

/**
 * Retrieves the current studio social links with fallbacks and placeholder stripping.
 */
export function getStudioSocials(): StudioSocialLinks {
  if (typeof window === "undefined") {
    return DEFAULT_STUDIO_SOCIALS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STUDIO_SOCIALS;
    const parsed = JSON.parse(raw);
    const sanitized: StudioSocialLinks = { ...DEFAULT_STUDIO_SOCIALS, ...parsed };
    if (isPlaceholderWhatsApp(sanitized.whatsapp)) {
      sanitized.whatsapp = "";
    }
    return sanitized;
  } catch {
    return DEFAULT_STUDIO_SOCIALS;
  }
}

/**
 * Persists studio social links and dispatches a cross-tab / local event.
 */
export function saveStudioSocials(data: Partial<StudioSocialLinks>): StudioSocialLinks {
  const current = getStudioSocials();
  const updated: StudioSocialLinks = { ...current, ...data };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("volka:socials-updated"));
    } catch {
      // storage unavailable
    }
  }
  return updated;
}

/**
 * React hook to reactively subscribe to studio social links updates.
 */
export function useStudioSocials(): StudioSocialLinks {
  const [socials, setSocials] = React.useState<StudioSocialLinks>(() => getStudioSocials());

  React.useEffect(() => {
    setSocials(getStudioSocials());
    const onUpdate = () => setSocials(getStudioSocials());
    window.addEventListener("volka:socials-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("volka:socials-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  return socials;
}
