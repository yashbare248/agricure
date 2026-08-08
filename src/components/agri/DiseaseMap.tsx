import { AlertTriangle, MapPin, Radar, ShieldAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { COMMUNITY_REPORTS, spreadRisk } from "@/lib/community";
import { SampleDataBanner } from "./PreviewBanner";

const RISK_STYLE = {
  high: "border-danger/40 bg-danger/10 text-danger",
  medium: "border-warning/50 bg-warning/15 text-accent-foreground",
  low: "border-success/40 bg-success/10 text-success",
} as const;

const PIN_COLOR = {
  high: "bg-danger",
  medium: "bg-warning",
  low: "bg-success",
} as const;

export function DiseaseMap({ diseaseKey, diseaseName }: { diseaseKey?: string; diseaseName?: string }) {
  const { t, lang } = useI18n();
  const risk = spreadRisk(diseaseKey);
  const riskWord = { high: t("riskHigh"), medium: t("riskMedium"), low: t("riskLow") }[risk.level];

  const alertText = {
    en: `Warning: ${risk.share}% of nearby fields reported ${diseaseName ?? "crop disease"} in the last 72 hours. Probability of spread to your field: ${riskWord}. Please double your regular inspection.`,
    hi: `चेतावनी: पिछले 72 घंटों में आस-पास के ${risk.share}% खेतों में ${diseaseName ?? "फसल रोग"} की सूचना मिली। आपके खेत में फैलने की संभावना: ${riskWord}। निरीक्षण दोगुना करें।`,
    mr: `इशारा: गेल्या ७२ तासांत जवळील ${risk.share}% शेतांमध्ये ${diseaseName ?? "पीक रोग"} आढळला. तुमच्या शेतात पसरण्याची शक्यता: ${riskWord}. तपासणी दुप्पट करा.`,
  }[lang];

  return (
    <section className="glass rise-in mt-6 rounded-3xl p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Radar className="size-5 text-primary" />
        <h2 className="text-lg font-black sm:text-xl">{t("mapTitle")}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t("mapSub")}</p>
      <SampleDataBanner lang={lang} />

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border bg-secondary/50 sm:aspect-[16/10]">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
            aria-hidden
          />
          <div className="pulse-ring absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/40 bg-primary/5" />
          <div className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30" />
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
            <MapPin className="mx-auto size-6 text-primary" />
            <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold">{t("yourField")}</span>
          </div>

          {COMMUNITY_REPORTS.map((r) => (
            <div
              key={r.id}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%` }}
            >
              <span className={`block size-3.5 rounded-full ring-4 ring-background ${PIN_COLOR[r.intensity]}`} />
              <span className="pointer-events-none absolute left-1/2 top-5 z-20 hidden w-40 -translate-x-1/2 rounded-lg border bg-card p-2 text-[10px] font-semibold shadow-lg group-hover:block">
                {r.label[lang]} · {r.distanceKm} km · {r.hoursAgo}h
              </span>
            </div>
          ))}

          <span className="absolute bottom-2 right-3 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-bold">
            10 km {t("radius")}
          </span>
        </div>

        <div className="space-y-3">
          <div className={`rounded-2xl border p-4 ${RISK_STYLE[risk.level]}`}>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="size-4" /> {t("alertsTitle")}
            </p>
            <p className="mt-2 text-sm font-semibold leading-relaxed">{alertText}</p>
          </div>

          <ul className="space-y-2">
            {COMMUNITY_REPORTS.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                <AlertTriangle
                  className={`size-4 shrink-0 ${
                    r.intensity === "high"
                      ? "text-danger"
                      : r.intensity === "medium"
                        ? "text-warning"
                        : "text-success"
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{r.label[lang]}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.distanceKm} km · {r.hoursAgo}h {t("ago")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
