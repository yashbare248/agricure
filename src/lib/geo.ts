import type { Lang } from "./treatments";

export const NASHIK = { lat: 20.0063, lon: 73.7898 };

export type Outbreak = {
  id: string;
  lat: number;
  lon: number;
  disease: Record<Lang, string>;
  distanceKm: number;
  hoursAgo: number;
  severity: "high" | "medium";
};

const TEMPLATE: {
  id: string;
  bearing: number;
  distanceKm: number;
  hoursAgo: number;
  severity: "high" | "medium";
  disease: Record<Lang, string>;
}[] = [
  {
    id: "o1",
    bearing: 35,
    distanceKm: 3.2,
    hoursAgo: 18,
    severity: "high",
    disease: { en: "Tomato Early Blight", hi: "टमाटर अगेती झुलसा", mr: "टोमॅटो अर्ली ब्लाईट" },
  },
  {
    id: "o2",
    bearing: 140,
    distanceKm: 5.4,
    hoursAgo: 26,
    severity: "high",
    disease: { en: "Tomato Early Blight", hi: "टमाटर अगेती झुलसा", mr: "टोमॅटो अर्ली ब्लाईट" },
  },
  {
    id: "o3",
    bearing: 230,
    distanceKm: 7.1,
    hoursAgo: 41,
    severity: "medium",
    disease: { en: "Potato Late Blight", hi: "आलू पछेती झुलसा", mr: "बटाटा उशिरा करपा" },
  },
  {
    id: "o4",
    bearing: 310,
    distanceKm: 9.3,
    hoursAgo: 46,
    severity: "medium",
    disease: { en: "Apple Scab", hi: "सेब स्कैब", mr: "सफरचंद खपली" },
  },
];

/** Offsets a lat/lon by distance (km) along a compass bearing (degrees). */
export function offset(lat: number, lon: number, km: number, bearingDeg: number) {
  const rad = (bearingDeg * Math.PI) / 180;
  const dLat = (km * Math.cos(rad)) / 111;
  const dLon = (km * Math.sin(rad)) / (111 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lon: lon + dLon };
}

export function outbreaksAround(lat: number, lon: number, disease?: Record<Lang, string>): Outbreak[] {
  return TEMPLATE.map((o, i) => {
    const p = offset(lat, lon, o.distanceKm, o.bearing);
    return {
      id: o.id,
      lat: p.lat,
      lon: p.lon,
      distanceKm: o.distanceKm,
      hoursAgo: o.hoursAgo,
      severity: o.severity,
      disease: disease && i < 2 ? disease : o.disease,
    };
  });
}

export type LatLon = { lat: number; lon: number };

/** Great-circle distance in km. */
export function distanceKm(a: LatLon, b: LatLon) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Planar shoelace area of a small polygon, in acres. */
export function polygonAcres(points: LatLon[]) {
  if (points.length < 3) return 0;
  const lat0 = points[0]!.lat;
  const mx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const my = 110540;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    const q = points[(i + 1) % points.length]!;
    sum += p.lon * mx * (q.lat * my) - q.lon * mx * (p.lat * my);
  }
  return Math.abs(sum / 2) / 4046.86;
}

export function centroid(points: LatLon[]): LatLon | null {
  if (!points.length) return null;
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lon = points.reduce((s, p) => s + p.lon, 0) / points.length;
  return { lat, lon };
}

function _legacyOutbreaks(lat: number, lon: number, disease?: Record<Lang, string>): Outbreak[] {
  return TEMPLATE.map((o, i) => {
    const p = offset(lat, lon, o.distanceKm, o.bearing);
    return {
      id: o.id,
      lat: p.lat,
      lon: p.lon,
      distanceKm: o.distanceKm,
      hoursAgo: o.hoursAgo,
      severity: o.severity,
      disease: disease && i < 2 ? disease : o.disease,
    };
  });
}
