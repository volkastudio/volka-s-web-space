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
  whatsapp: "https://wa.me/22900000000?text=Bonjour%20Volka%2C%20je%20voudrais%20d%C3%A9marrer%20un%20projet.",
  email: "hello@volkastudio.com",
};

const STORAGE_KEY = "volka_studio_socials";

/**
 * Retrieves the current studio social links with fallbacks.
 */
export function getStudioSocials(): StudioSocialLinks {
  if (typeof window === "undefined") {
    return DEFAULT_STUDIO_SOCIALS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STUDIO_SOCIALS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STUDIO_SOCIALS, ...parsed };
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
