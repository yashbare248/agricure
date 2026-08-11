import type { Lang, Treatment } from "./treatments";
import { TREATMENTS } from "./treatments";

export type ReportParams = {
  d: string; // disease key
  h: number; // health score
  s: number; // severity
  c?: number; // confidence
  t?: string; // ISO date
  /** Full treatment, embedded when the diagnosis is not one of the built-in keys. */
  treatment?: Treatment;
};

/** Compact payload embedded in the QR for AI (open-vocabulary) diagnoses. */
export type EmbeddedDiagnosis = {
  e: string;
  cr: Record<Lang, string>;
  n: Record<Lang, string>;
  ch: Record<Lang, string[]>;
  or: Record<Lang, string[]>;
  pr: Record<Lang, string[]>;
};

const b64urlEncode = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export function decodeDiagnosis(p: string): EmbeddedDiagnosis | null {
  try {
    const b64 = p.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as EmbeddedDiagnosis;
    return parsed?.n ? parsed : null;
  } catch {
    return null;
  }
}

/** Keeps embedded AI reports below practical QR capacity. */
const trim = (v: Record<Lang, string[]>): Record<Lang, string[]> => ({
  en: (v.en ?? []).slice(0, 1).map((x) => x.slice(0, 100)),
  hi: (v.hi ?? []).slice(0, 1).map((x) => x.slice(0, 100)),
  mr: (v.mr ?? []).slice(0, 1).map((x) => x.slice(0, 100)),
});

export function buildReportUrl(p: ReportParams): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const known = TREATMENTS.some((t) => t.key === p.d);
  const q = new URLSearchParams({
    d: p.d,
    h: String(Math.round(p.h)),
    s: String(Math.round(p.s)),
    ...(p.c != null ? { c: String(Math.round(p.c)) } : {}),
    ...(p.t ? { t: p.t } : {}),
  });
  if (!known && p.treatment) {
    const payload: EmbeddedDiagnosis = {
      e: p.treatment.emoji,
      cr: p.treatment.crop,
      n: p.treatment.name,
      ch: trim(p.treatment.chemical),
      or: trim(p.treatment.organic),
      pr: trim(p.treatment.prevention),
    };
    q.set("p", b64urlEncode(JSON.stringify(payload)));
  }
  return `${origin}/report?${q.toString()}`;
}
