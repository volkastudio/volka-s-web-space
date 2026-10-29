// Shared (client + server) configuration of a sales page's editable texts and optional email step.
// Everything here is editable per page from the back office (Ventes → Éditeur).

export type CaptureMode = "off" | "optional" | "required";

export interface SalesPageConfig {
  /** Main button label. */
  cta_label: string;
  /** Question shown when a page has several regions. */
  region_question: string;
  /** Optional small line under the question. */
  region_hint: string;
  /** Optional step asking for an email before redirecting to the checkout. */
  capture: {
    mode: CaptureMode;
    title: string;
    subtitle: string;
    email_label: string;
    /** Also ask for a first name. */
    ask_name: boolean;
    /** Unchecked marketing checkbox. Leave empty for no checkbox. */
    consent_label: string;
    /** Submit button label. */
    button_label: string;
    /** Link label to skip the step (only when mode = optional). */
    skip_label: string;
  };
}

export const DEFAULT_SALES_PAGE_CONFIG: SalesPageConfig = {
  cta_label: "Obtenir",
  region_question: "Où habitez-vous ?",
  region_hint: "",
  capture: {
    mode: "off",
    title: "Où devons-nous vous écrire ?",
    subtitle: "",
    email_label: "Votre email",
    ask_name: false,
    consent_label: "",
    button_label: "Continuer",
    skip_label: "Continuer sans email",
  },
};

const MAX = { short: 80, long: 240, label: 160 } as const;

function text(value: unknown, fallback: string, max: number, allowEmpty = false): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().slice(0, max);
  if (!trimmed && !allowEmpty) return fallback;
  return trimmed;
}

/**
 * Merges whatever is stored (or sent by the editor) with the defaults.
 * Blank required texts fall back to defaults; optional ones may be empty.
 */
export function resolvePageConfig(raw: unknown): SalesPageConfig {
  const d = DEFAULT_SALES_PAGE_CONFIG;
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const cap = (src["capture"] && typeof src["capture"] === "object" ? src["capture"] : {}) as Record<
    string,
    unknown
  >;

  const mode: CaptureMode =
    cap["mode"] === "optional" || cap["mode"] === "required" ? cap["mode"] : "off";

  return {
    cta_label: text(src["cta_label"], d.cta_label, MAX.short),
    region_question: text(src["region_question"], d.region_question, MAX.long),
    region_hint: text(src["region_hint"], d.region_hint, MAX.long, true),
    capture: {
      mode,
      title: text(cap["title"], d.capture.title, MAX.long),
      subtitle: text(cap["subtitle"], d.capture.subtitle, MAX.long, true),
      email_label: text(cap["email_label"], d.capture.email_label, MAX.short),
      ask_name: cap["ask_name"] === true,
      consent_label: text(cap["consent_label"], "", MAX.label, true),
      button_label: text(cap["button_label"], d.capture.button_label, MAX.short),
      skip_label: text(cap["skip_label"], d.capture.skip_label, MAX.short),
    },
  };
}
