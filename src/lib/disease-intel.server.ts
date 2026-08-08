import { profileFor, riskForDay, type PathogenProfile } from "./pathogen";
import { googleForecastDays, googleHistoryDays, type GoogleDay } from "./google-weather.server";

export type RiskPoint = { date: string; risk: number };

export type ClimateIntel = {
  live: boolean;
  todayRisk: number;
  avgRisk: number;
  trend: "rising" | "falling" | "steady";
  series: RiskPoint[];
  temp: number;
  humidity: number;
  rain7d: number;
  pathogen: PathogenProfile["cls"];
  idealTemp: [number, number];
  idealHumidity: number;
  source: "google" | "open-meteo" | "sample";
};

/**
 * Pulls 14 days of real observed + forecast weather from Open-Meteo and scores
 * each day against the detected pathogen's infection window.
 */
export async function climateIntel(
  lat: number,
  lon: number,
  diseaseKey: string,
  allowPaid = false,
): Promise<ClimateIntel> {
  const profile = profileFor(diseaseKey);
  const base = {
    live: false,
    todayRisk: 0,
    avgRisk: 0,
    trend: "steady" as const,
    series: [] as RiskPoint[],
    temp: 0,
    humidity: 0,
    rain7d: 0,
    pathogen: profile.cls,
    idealTemp: profile.temp,
    idealHumidity: profile.humidity,
    source: "sample" as ClimateIntel["source"],
  };

  // 1) Google Weather (paid) — only for authenticated callers.
  const [history, forecast] = allowPaid
    ? await Promise.all([googleHistoryDays(lat, lon, 10), googleForecastDays(lat, lon, 4)])
    : [[] as GoogleDay[], [] as GoogleDay[]];
  const gdays: GoogleDay[] = [...history, ...forecast].filter(
    (d, i, arr) => arr.findIndex((x) => x.date === d.date) === i,
  );
  if (gdays.length > 0) {
    gdays.sort((a, b) => a.date.localeCompare(b.date));
    const series: RiskPoint[] = gdays.map((d) => ({
      date: d.date,
      risk: riskForDay(profile, { temp: d.temp, humidity: d.humidity, rain: d.rain }),
    }));
    const today = new Date().toISOString().slice(0, 10);
    const foundIdx = gdays.findIndex((d) => d.date >= today);
    const todayIdx = foundIdx === -1 ? series.length - 1 : foundIdx;
    return summarise(base, series, todayIdx, gdays, "google");
  }

  // 2) Open-Meteo fallback keeps the risk chart alive if Google is unavailable.
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat}&longitude=${lon}` +
    "&daily=temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum" +
    "&past_days=10&forecast_days=4&timezone=auto";

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`weather ${res.status}`);
    const json = (await res.json()) as {
      daily?: {
        time?: string[];
        temperature_2m_mean?: (number | null)[];
        relative_humidity_2m_mean?: (number | null)[];
        precipitation_sum?: (number | null)[];
      };
    };
    const d = json.daily;
    const days = d?.time ?? [];
    if (days.length === 0) return base;

    const rows: GoogleDay[] = days.map((date, i) => ({
      date,
      temp: d?.temperature_2m_mean?.[i] ?? 25,
      humidity: d?.relative_humidity_2m_mean?.[i] ?? 60,
      rain: d?.precipitation_sum?.[i] ?? 0,
      rainChance: 0,
    }));
    const series: RiskPoint[] = rows.map((r) => ({
      date: r.date,
      risk: riskForDay(profile, r),
    }));
    return summarise(base, series, Math.min(series.length - 1, 10), rows, "open-meteo");
  } catch {
    return base;
  }
}

function summarise(
  base: ClimateIntel,
  series: RiskPoint[],
  todayIdx: number,
  rows: GoogleDay[],
  source: ClimateIntel["source"],
): ClimateIntel {
  const mean = (xs: RiskPoint[]) =>
    xs.length ? Math.round(xs.reduce((s, p) => s + p.risk, 0) / xs.length) : 0;
  const recentAvg = mean(series.slice(Math.max(0, todayIdx - 3), todayIdx + 1));
  const earlierAvg = mean(series.slice(Math.max(0, todayIdx - 8), Math.max(1, todayIdx - 3)));
  const today = rows[todayIdx];

  return {
    ...base,
    live: true,
    source,
    series,
    todayRisk: series[todayIdx]?.risk ?? recentAvg,
    avgRisk: mean(series),
    trend: recentAvg - earlierAvg > 8 ? "rising" : earlierAvg - recentAvg > 8 ? "falling" : "steady",
    temp: Math.round(today?.temp ?? 0),
    humidity: Math.round(today?.humidity ?? 0),
    rain7d: Math.round(
      rows.slice(Math.max(0, todayIdx - 6), todayIdx + 1).reduce((s, r) => s + r.rain, 0),
    ),
  };
}

export type OnlineGuidance = {
  summary: string;
  treatments: string[];
  alternatives: string[];
  regional: string;
  sources: { title: string; url: string }[];
};

const LANG_NAME = { en: "English", hi: "Hindi", mr: "Marathi" } as const;

/**
 * Web-grounded advisory lookup through the Lovable AI gateway. Returns null on
 * any failure so the offline knowledge base stays the source of truth.
 */
export async function onlineGuidance(input: {
  disease: string;
  crop: string;
  lang: "en" | "hi" | "mr";
  region: string;
  weatherNote: string;
}): Promise<OnlineGuidance | null> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return null;

  const body = {
    model: "google/gemini-3.6-flash",
    messages: [
      {
        role: "system",
        content:
          "You are an agricultural extension officer compiling CURRENT public advisories " +
          "(ICAR, KVK, state agriculture universities, FAO, university extension services) " +
          "for Indian farmers. Search the web for the latest guidance. " +
          'Reply ONLY with JSON: {"summary": string, "treatments": string[], "alternatives": string[], "regional": string, "sources": [{"title": string, "url": string}]}. ' +
          "treatments: 3-4 concrete field steps with product + dose where public advisories give one. " +
          "alternatives: 2-3 other diseases/disorders that look similar and should be ruled out. " +
          "regional: one sentence on current season/region risk and outbreak reports, if any. " +
          "sources: 2-4 real, working public URLs you actually used. Never invent a URL. " +
          `Write summary, treatments, alternatives and regional in ${LANG_NAME[input.lang]}. Keep each line under 200 characters.`,
      },
      {
        role: "user",
        content:
          `Disease: ${input.disease} on ${input.crop}. Region: ${input.region}. ` +
          `Live weather context: ${input.weatherNote}. ` +
          "Give the latest online guidance, similar-looking alternatives, and regional outbreak context.",
      },
    ],
    response_format: { type: "json_object" },
  };

  const call = async (withSearch: boolean) =>
    fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify(
        withSearch ? { ...body, plugins: [{ id: "web", max_results: 4 }] } : body,
      ),
    });

  try {
    let res = await call(true);
    if (!res.ok) res = await call(false);
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()) as Partial<OnlineGuidance>;
    const list = (v: unknown) =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 5) : [];
    const sources = Array.isArray(parsed.sources)
      ? parsed.sources
          .filter(
            (s): s is { title: string; url: string } =>
              !!s && typeof s.url === "string" && /^https?:\/\//.test(s.url),
          )
          .slice(0, 4)
      : [];
    if (!parsed.summary && list(parsed.treatments).length === 0) return null;
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      treatments: list(parsed.treatments),
      alternatives: list(parsed.alternatives),
      regional: typeof parsed.regional === "string" ? parsed.regional : "",
      sources,
    };
  } catch {
    return null;
  }
}