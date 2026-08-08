import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Globe2, Loader2, TrendingDown, TrendingUp, Minus, ExternalLink } from "lucide-react";
import { getClimateIntel, getOnlineGuidance } from "@/lib/insights.functions";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import type { AnalysisResult } from "@/lib/analysis";

const TXT = {
  title: { en: "Live internet intelligence", hi: "लाइव इंटरनेट जानकारी", mr: "थेट इंटरनेट माहिती" },
  sub: {
    en: "Live weather correlation and current public advisories for this diagnosis",
    hi: "इस निदान हेतु लाइव मौसम मिलान व वर्तमान सार्वजनिक सलाह",
    mr: "या निदानासाठी थेट हवामान जुळवणी व सध्याचे सार्वजनिक सल्ले",
  },
  match: { en: "Weather match today", hi: "आज मौसम मिलान", mr: "आजची हवामान जुळवणी" },
  trend: { en: "14-day risk trend", hi: "14-दिन जोखिम रुझान", mr: "१४ दिवसांचा धोका कल" },
  rising: { en: "Rising", hi: "बढ़ रहा", mr: "वाढतोय" },
  falling: { en: "Falling", hi: "घट रहा", mr: "घटतोय" },
  steady: { en: "Steady", hi: "स्थिर", mr: "स्थिर" },
  boost: {
    en: "Conditions match this disease — diagnosis confidence supported",
    hi: "मौसम इस रोग के अनुकूल — निदान की पुष्टि होती है",
    mr: "हवामान या रोगास अनुकूल — निदानास पुष्टी मिळते",
  },
  noBoost: {
    en: "Current weather is less favourable for this pathogen — re-check in 2 days",
    hi: "वर्तमान मौसम इस रोगजनक के कम अनुकूल — 2 दिन बाद पुनः जाँचें",
    mr: "सध्याचे हवामान या रोगजंतूस कमी अनुकूल — २ दिवसांनी पुन्हा तपासा",
  },
  rain: { en: "Rain (7 days)", hi: "वर्षा (7 दिन)", mr: "पाऊस (७ दिवस)" },
  online: { en: "From agricultural sources", hi: "कृषि स्रोतों से", mr: "कृषी स्रोतांकडून" },
  alts: { en: "Also rule out", hi: "इन्हें भी जाँचें", mr: "हेही तपासा" },
  regional: { en: "Regional context", hi: "क्षेत्रीय स्थिति", mr: "प्रादेशिक स्थिती" },
  sources: { en: "Sources", hi: "स्रोत", mr: "स्रोत" },
  signIn: {
    en: "Sign in to load the latest online advisories for this disease.",
    hi: "इस रोग की नवीनतम ऑनलाइन सलाह हेतु साइन इन करें।",
    mr: "या रोगाचे नवीनतम ऑनलाइन सल्ले पाहण्यासाठी साइन इन करा.",
  },
  offline: {
    en: "Online sources unavailable right now — the built-in treatment guide above still applies.",
    hi: "अभी ऑनलाइन स्रोत उपलब्ध नहीं — ऊपर दी गई उपचार सलाह लागू रहती है।",
    mr: "सध्या ऑनलाइन स्रोत उपलब्ध नाहीत — वरील उपचार सल्ला लागू राहतो.",
  },
  loading: { en: "Fetching live data…", hi: "लाइव डेटा लाया जा रहा है…", mr: "थेट माहिती आणत आहे…" },
};

function Spark({ series }: { series: { date: string; risk: number }[] }) {
  if (series.length < 2) return null;
  const w = 100;
  const h = 28;
  const pts = series
    .map((p, i) => `${(i / (series.length - 1)) * w},${h - (p.risk / 100) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function LiveIntel({
  result,
  coords,
}: {
  result: AnalysisResult;
  coords: { lat: number; lon: number } | null;
}) {
  const { lang } = useI18n();
  const { user } = useAuth();
  const climateFn = useServerFn(getClimateIntel);
  const guidanceFn = useServerFn(getOnlineGuidance);
  const disease = result.treatment.name.en;

  const climate = useQuery({
    queryKey: ["climate-intel", coords?.lat, coords?.lon, result.treatment.key],
    queryFn: () => climateFn({ data: { ...coords!, diseaseKey: result.treatment.key } }),
    enabled: !!coords,
    staleTime: 30 * 60 * 1000,
  });

  const weatherNote = climate.data?.live
    ? `avg temp ${climate.data.temp}°C, humidity ${climate.data.humidity}%, ${climate.data.rain7d} mm rain in last 7 days`
    : "no live weather available";

  const guidance = useQuery({
    queryKey: ["online-guidance", result.treatment.key, lang, climate.data?.live],
    queryFn: () =>
      guidanceFn({
        data: {
          disease,
          crop: result.treatment.crop.en,
          lang,
          region: coords ? `lat ${coords.lat.toFixed(2)}, lon ${coords.lon.toFixed(2)}, India` : "India",
          weatherNote,
        },
      }),
    enabled: !!user && !climate.isPending,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  const c = climate.data;
  const risk = c?.todayRisk ?? 0;
  const TrendIcon = c?.trend === "rising" ? TrendingUp : c?.trend === "falling" ? TrendingDown : Minus;
  const trendLabel =
    c?.trend === "rising" ? TXT.rising[lang] : c?.trend === "falling" ? TXT.falling[lang] : TXT.steady[lang];
  const tone = risk >= 65 ? "var(--danger)" : risk >= 40 ? "var(--warning)" : "var(--success)";

  return (
    <section className="glass rise-in rounded-3xl p-5 sm:p-6">
      <header className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Globe2 className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-extrabold">{TXT.title[lang]}</h2>
          <p className="text-xs text-muted-foreground">{TXT.sub[lang]}</p>
        </div>
      </header>

      {climate.isPending ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {TXT.loading[lang]}
        </p>
      ) : c?.live ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {TXT.match[lang]}
            </p>
            <p className="text-2xl font-black tabular-nums" style={{ color: tone }}>
              {risk}%
            </p>
            <p className="text-[11px] text-muted-foreground">
              {c.temp}°C · {c.humidity}% RH
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {TXT.trend[lang]}
            </p>
            <Spark series={c.series} />
            <p className="flex items-center gap-1 text-[11px] font-semibold">
              <TrendIcon className="size-3.5" /> {trendLabel}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {TXT.rain[lang]}
            </p>
            <p className="text-2xl font-black tabular-nums">{c.rain7d} mm</p>
            <p className="text-[11px] text-muted-foreground">
              {c.idealTemp[0]}–{c.idealTemp[1]}°C · &gt;{c.idealHumidity}% RH
            </p>
          </div>
        </div>
      ) : null}

      {c?.live && (
        <p
          className="mt-3 rounded-2xl border p-3 text-sm font-semibold"
          style={{ borderColor: tone, color: tone }}
        >
          {risk >= 55 ? `✅ ${TXT.boost[lang]}` : `ℹ️ ${TXT.noBoost[lang]}`}
        </p>
      )}

      {!user ? (
        <p className="mt-4 rounded-2xl border border-dashed p-3 text-sm text-muted-foreground">
          {TXT.signIn[lang]}
        </p>
      ) : guidance.isPending ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {TXT.loading[lang]}
        </p>
      ) : guidance.data ? (
        <div className="mt-4 space-y-3">
          {guidance.data.summary && <p className="text-sm">{guidance.data.summary}</p>}
          {guidance.data.treatments.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {TXT.online[lang]}
              </p>
              <ul className="mt-1 space-y-1.5 text-sm">
                {guidance.data.treatments.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {guidance.data.alternatives.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {TXT.alts[lang]}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {guidance.data.alternatives.map((x) => (
                  <span key={x} className="rounded-full border bg-card px-3 py-1 text-xs font-semibold">
                    {x}
                  </span>
                ))}
              </div>
            </div>
          )}
          {guidance.data.regional && (
            <p className="rounded-2xl bg-secondary/50 p-3 text-sm">
              <span className="font-bold">{TXT.regional[lang]}: </span>
              {guidance.data.regional}
            </p>
          )}
          {guidance.data.sources.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {TXT.sources[lang]}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {guidance.data.sources.map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs font-semibold hover:border-primary hover:text-primary"
                  >
                    {s.title || new URL(s.url).hostname} <ExternalLink className="size-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{TXT.offline[lang]}</p>
      )}
    </section>
  );
}