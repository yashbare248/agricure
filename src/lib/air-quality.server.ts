/**
 * Air quality (PM2.5 / ozone) for crop-disease risk context.
 *
 * Order of preference:
 *  1. Google Air Quality API with the project's own server key
 *  2. Lovable connector gateway (managed Google Maps key)
 *  3. Open-Meteo air quality (free, no key) — keeps the overlay alive for
 *     anonymous visitors and whenever Google is unavailable.
 */
const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";
const GOOGLE_AQ = "https://airquality.googleapis.com";

export type AirQuality = {
  /** AQI value on the scale named by `scale` (local CPCB/US where available). */
  aqi: number;
  category: string;
  /** Which scale `aqi` is on — decides colour thresholds and the label shown. */
  scale: "local" | "uaqi" | "eu";
  /** Human name of the index, e.g. "AQI (IN)" / "US AQI". */
  indexName: string;
  /** µg/m³ */
  pm25: number | null;
  /** ppb (Google) / µg/m³ (Open-Meteo) — unit is carried in `ozoneUnit`. */
  ozone: number | null;
  ozoneUnit: string;
  dominant: string | null;
  source: "google" | "open-meteo";
};

type AqResponse = {
  indexes?: {
    code?: string;
    displayName?: string;
    aqi?: number;
    category?: string;
    dominantPollutant?: string;
  }[];
  pollutants?: {
    code?: string;
    concentration?: { value?: number; units?: string };
  }[];
};

async function googleAir(lat: number, lon: number): Promise<AirQuality | null> {
  const ownKey = process.env["GOOGLE_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];

  const body = JSON.stringify({
    location: { latitude: lat, longitude: lon },
    extraComputations: ["POLLUTANT_CONCENTRATION", "LOCAL_AQI", "DOMINANT_POLLUTANT_CONCENTRATION"],
    universalAqi: true,
  });

  const attempts: { url: string; headers: Record<string, string> }[] = [];
  if (ownKey) {
    attempts.push({
      url: `${GOOGLE_AQ}/v1/currentConditions:lookup?key=${encodeURIComponent(ownKey)}`,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (lovableKey && mapsKey) {
    attempts.push({
      url: `${GATEWAY}/airquality/v1/currentConditions:lookup`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": mapsKey,
      },
    });
  }

  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt.url, { method: "POST", headers: attempt.headers, body });
      if (!res.ok) {
        console.error(`Air Quality lookup failed [${res.status}]: ${await res.text()}`);
        continue;
      }
      const json = (await res.json()) as AqResponse;
      // Prefer the LOCAL index (e.g. India CPCB `ind_cpcb`) so the number matches
      // what the farmer sees in local weather apps. UAQI (0-100, higher = cleaner)
      // is only a last resort because it reads "backwards".
      const indexes = json.indexes ?? [];
      const local = indexes.find((i) => i.code && i.code !== "uaqi" && typeof i.aqi === "number");
      const index = local ?? indexes.find((i) => typeof i.aqi === "number");
      if (!index || typeof index.aqi !== "number") continue;
      const pollutant = (code: string) => json.pollutants?.find((p) => p.code === code);
      const o3 = pollutant("o3");
      return {
        aqi: Math.round(index.aqi),
        category: index.category ?? "",
        scale: local ? "local" : "uaqi",
        indexName: index.displayName ?? (local ? "Local AQI" : "Universal AQI"),
        pm25: pollutant("pm25")?.concentration?.value ?? null,
        ozone: o3?.concentration?.value ?? null,
        ozoneUnit: o3?.concentration?.units === "PARTS_PER_BILLION" ? "ppb" : "µg/m³",
        dominant: index.dominantPollutant ?? null,
        source: "google",
      };
    } catch (err) {
      console.error("Air Quality lookup error", err);
    }
  }
  return null;
}

/** US/CPCB-style 0-500 AQI wording — the scale Indian weather apps display. */
function usCategory(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
}

async function openMeteoAir(lat: number, lon: number): Promise<AirQuality | null> {
  const url =
    "https://air-quality-api.open-meteo.com/v1/air-quality" +
    `?latitude=${lat}&longitude=${lon}` +
    "&current=pm2_5,ozone,us_aqi&timezone=auto";
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      current?: { pm2_5?: number; ozone?: number; us_aqi?: number };
    };
    const c = json.current;
    if (!c || typeof c.us_aqi !== "number") return null;
    return {
      aqi: Math.round(c.us_aqi),
      category: usCategory(c.us_aqi),
      scale: "local",
      indexName: "US AQI",
      pm25: typeof c.pm2_5 === "number" ? c.pm2_5 : null,
      ozone: typeof c.ozone === "number" ? c.ozone : null,
      ozoneUnit: "µg/m³",
      dominant: null,
      source: "open-meteo",
    };
  } catch {
    return null;
  }
}

export async function airQuality(
  lat: number,
  lon: number,
  allowPaid = false,
): Promise<AirQuality | null> {
  if (allowPaid) {
    const google = await googleAir(lat, lon);
    if (google) return google;
  }
  return openMeteoAir(lat, lon);
}