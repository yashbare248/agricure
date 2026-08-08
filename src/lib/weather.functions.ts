import { createServerFn } from "@tanstack/react-start";

export type AirQualityReading = {
  aqi: number;
  category: string;
  scale: "local" | "uaqi" | "eu";
  indexName: string;
  pm25: number | null;
  ozone: number | null;
  ozoneUnit: string;
  dominant: string | null;
  source: "google" | "open-meteo";
};

export type LiveWeather = {
  temp: number;
  humidity: number;
  wind: number;
  rainChance: number;
  rainTomorrow: number;
  live: boolean;
  /** Where the reading came from — shown to the farmer for transparency. */
  source: "google" | "open-meteo" | "sample";
  condition?: string;
  /** PM2.5 / ozone overlay used for crop-disease risk context. */
  air?: AirQualityReading | null;
};

export const getForecast = createServerFn({ method: "GET" })
  .inputValidator((input: { lat: number; lon: number }) => {
    const lat = Number(input?.lat);
    const lon = Number(input?.lon);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error("Invalid latitude");
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new Error("Invalid longitude");
    return { lat, lon };
  })
  .handler(async ({ data }): Promise<LiveWeather> => {
    // 1) Google Weather (Maps Platform) — paid API, signed-in users only.
    const { hasSupabaseSession } = await import("./optional-auth.server");
    const authed = await hasSupabaseSession();

    const { airQuality } = await import("./air-quality.server");
    const airPromise = airQuality(data.lat, data.lon, authed).catch(() => null);

    const current = authed
      ? await (async () => {
          const { googleCurrent, googleForecastDays } = await import("./google-weather.server");
          const [cur, fc] = await Promise.all([
            googleCurrent(data.lat, data.lon),
            googleForecastDays(data.lat, data.lon, 2),
          ]);
          return cur ? { cur, fc } : null;
        })()
      : null;

    if (current) {
      const { cur, fc } = current;
      return {
        temp: cur.temp,
        humidity: cur.humidity,
        wind: cur.wind,
        rainChance: Math.max(cur.rainChance, fc[0]?.rainChance ?? 0),
        rainTomorrow: fc[1]?.rainChance ?? fc[0]?.rainChance ?? cur.rainChance,
        live: true,
        source: "google",
        condition: cur.condition,
        air: await airPromise,
      };
    }

    // 2) Open-Meteo fallback so the advisory still works if Google is down.
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${data.lat}&longitude=${data.lon}` +
      "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation" +
      "&daily=precipitation_probability_max" +
      "&forecast_days=2&timezone=auto&wind_speed_unit=kmh";

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Forecast API ${res.status}`);
      const json = (await res.json()) as {
        current?: {
          temperature_2m?: number;
          relative_humidity_2m?: number;
          wind_speed_10m?: number;
        };
        daily?: { precipitation_probability_max?: (number | null)[] };
      };

      const daily = json.daily?.precipitation_probability_max ?? [];
      return {
        temp: Math.round(json.current?.temperature_2m ?? 28),
        humidity: Math.round(json.current?.relative_humidity_2m ?? 60),
        wind: Math.round(json.current?.wind_speed_10m ?? 8),
        rainChance: Math.round(daily[0] ?? 0),
        rainTomorrow: Math.round(daily[1] ?? daily[0] ?? 0),
        live: true,
        source: "open-meteo",
        air: await airPromise,
      };
    } catch {
      return {
        temp: 28,
        humidity: 60,
        wind: 8,
        rainChance: 0,
        rainTomorrow: 0,
        live: false,
        source: "sample",
        air: await airPromise,
      };
    }
  });
