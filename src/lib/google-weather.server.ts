/**
 * Google Weather API (Google Maps Platform). Prefers the project's own server
 * API key (works on custom domains); falls back to the Lovable connector
 * gateway. Every helper degrades gracefully: on any failure the caller gets
 * `null` and can fall back to cached/sample values.
 */
const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";
const GOOGLE_WEATHER = "https://weather.googleapis.com";

async function gw(path: string, params: Record<string, string>): Promise<unknown | null> {
  // `path` is shaped like /weather/v1/... for the gateway; strip the sub-API
  // prefix when calling Google directly.
  const ownKey = process.env["GOOGLE_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];

  // Try the project's own server key first, then the managed connector gateway.
  // A referrer-restricted (browser) key 403s on server calls, so we must not
  // stop at the first attempt.
  const attempts: { url: string; headers: Record<string, string> }[] = [];
  if (ownKey) {
    const qs = new URLSearchParams({ ...params, key: ownKey }).toString();
    attempts.push({ url: `${GOOGLE_WEATHER}${path.replace(/^\/weather/, "")}?${qs}`, headers: {} });
  }
  if (lovableKey && mapsKey) {
    attempts.push({
      url: `${GATEWAY}${path}?${new URLSearchParams(params).toString()}`,
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": mapsKey,
      },
    });
  }

  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt.url, { headers: attempt.headers });
      if (!res.ok) {
        console.error(`Google Weather ${path} failed [${res.status}]: ${await res.text()}`);
        continue;
      }
      return await res.json();
    } catch (err) {
      console.error(`Google Weather ${path} error`, err);
    }
  }
  return null;
}

const loc = (lat: number, lon: number) => ({
  "location.latitude": String(lat),
  "location.longitude": String(lon),
  unitsSystem: "METRIC",
});

export type GoogleCurrent = {
  temp: number;
  humidity: number;
  wind: number;
  rainChance: number;
  condition: string;
};

export async function googleCurrent(lat: number, lon: number): Promise<GoogleCurrent | null> {
  const json = (await gw("/weather/v1/currentConditions:lookup", loc(lat, lon))) as {
    temperature?: { degrees?: number };
    relativeHumidity?: number;
    wind?: { speed?: { value?: number } };
    precipitation?: { probability?: { percent?: number } };
    weatherCondition?: { description?: { text?: string } };
  } | null;
  if (!json || typeof json.temperature?.degrees !== "number") return null;
  return {
    temp: Math.round(json.temperature.degrees),
    humidity: Math.round(json.relativeHumidity ?? 60),
    wind: Math.round(json.wind?.speed?.value ?? 0),
    rainChance: Math.round(json.precipitation?.probability?.percent ?? 0),
    condition: json.weatherCondition?.description?.text ?? "",
  };
}

export type GoogleDay = {
  date: string;
  temp: number;
  humidity: number;
  rain: number;
  rainChance: number;
};

type ForecastDay = {
  displayDate?: { year?: number; month?: number; day?: number };
  interval?: { startTime?: string };
  maxTemperature?: { degrees?: number };
  minTemperature?: { degrees?: number };
  daytimeForecast?: DayHalf;
  nighttimeForecast?: DayHalf;
};
type DayHalf = {
  relativeHumidity?: number;
  precipitation?: { probability?: { percent?: number }; qpf?: { quantity?: number } };
};

function toDay(d: ForecastDay): GoogleDay | null {
  const dd = d.displayDate;
  const date =
    dd?.year && dd.month && dd.day
      ? `${dd.year}-${String(dd.month).padStart(2, "0")}-${String(dd.day).padStart(2, "0")}`
      : (d.interval?.startTime?.slice(0, 10) ?? "");
  if (!date) return null;
  const halves = [d.daytimeForecast, d.nighttimeForecast].filter(Boolean) as DayHalf[];
  const avg = (pick: (h: DayHalf) => number | undefined, fallback: number) => {
    const vals = halves.map(pick).filter((v): v is number => typeof v === "number");
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : fallback;
  };
  const max = d.maxTemperature?.degrees;
  const min = d.minTemperature?.degrees;
  return {
    date,
    temp: typeof max === "number" && typeof min === "number" ? (max + min) / 2 : (max ?? 25),
    humidity: avg((h) => h.relativeHumidity, 60),
    rain: halves.reduce((s, h) => s + (h.precipitation?.qpf?.quantity ?? 0), 0),
    rainChance: Math.max(0, ...halves.map((h) => h.precipitation?.probability?.percent ?? 0)),
  };
}

/** Up to 10 forecast days from Google. */
export async function googleForecastDays(lat: number, lon: number, count = 10) {
  const json = (await gw("/weather/v1/forecast/days:lookup", {
    ...loc(lat, lon),
    days: String(count),
    pageSize: String(count),
  })) as { forecastDays?: ForecastDay[] } | null;
  return (json?.forecastDays ?? []).map(toDay).filter((d): d is GoogleDay => d !== null);
}

type HistoryHour = {
  displayDateTime?: { year?: number; month?: number; day?: number };
  temperature?: { degrees?: number };
  relativeHumidity?: number;
  precipitation?: { probability?: { percent?: number }; qpf?: { quantity?: number } };
};

/**
 * Google exposes history hour-by-hour only, so we page through the last N days
 * of hourly observations and roll them up into daily means/totals.
 */
export async function googleHistoryDays(lat: number, lon: number, count = 10) {
  const hours = Math.min(240, count * 24);
  const rows: HistoryHour[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < Math.ceil(hours / 24); page++) {
    const json = (await gw("/weather/v1/history/hours:lookup", {
      ...loc(lat, lon),
      hours: String(hours),
      pageSize: "24",
      ...(pageToken ? { pageToken } : {}),
    })) as { historyHours?: HistoryHour[]; nextPageToken?: string } | null;
    if (!json?.historyHours?.length) break;
    rows.push(...json.historyHours);
    pageToken = json.nextPageToken || undefined;
    if (!pageToken) break;
  }

  const byDate = new Map<string, HistoryHour[]>();
  for (const h of rows) {
    const d = h.displayDateTime;
    if (!d?.year || !d.month || !d.day) continue;
    const key = `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
    byDate.set(key, [...(byDate.get(key) ?? []), h]);
  }

  return [...byDate.entries()]
    .map(([date, hs]): GoogleDay => {
      const mean = (pick: (h: HistoryHour) => number | undefined, fallback: number) => {
        const vals = hs.map(pick).filter((v): v is number => typeof v === "number");
        return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : fallback;
      };
      return {
        date,
        temp: mean((h) => h.temperature?.degrees, 25),
        humidity: mean((h) => h.relativeHumidity, 60),
        rain: hs.reduce((s, h) => s + (h.precipitation?.qpf?.quantity ?? 0), 0),
        rainChance: Math.max(0, ...hs.map((h) => h.precipitation?.probability?.percent ?? 0)),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
