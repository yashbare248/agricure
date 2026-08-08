export type ReportParams = {
  d: string; // disease key
  h: number; // health score
  s: number; // severity
  c?: number; // confidence
  t?: string; // ISO date
};

export function buildReportUrl(p: ReportParams): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const q = new URLSearchParams({
    d: p.d,
    h: String(p.h),
    s: String(p.s),
    ...(p.c != null ? { c: String(p.c) } : {}),
    ...(p.t ? { t: p.t } : {}),
  });
  return `${origin}/report?${q.toString()}`;
}
