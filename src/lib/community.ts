import type { Lang } from "./treatments";

export type CommunityReport = {
  id: string;
  diseaseKey: string;
  label: Record<Lang, string>;
  distanceKm: number;
  hoursAgo: number;
  /** normalised map position 0-1 */
  x: number;
  y: number;
  intensity: "low" | "medium" | "high";
};

export const COMMUNITY_REPORTS: CommunityReport[] = [
  {
    id: "r1",
    diseaseKey: "tomato_early_blight",
    label: { en: "Tomato Early Blight", hi: "टमाटर अगेती झुलसा", mr: "टोमॅटो अर्ली ब्लाईट" },
    distanceKm: 1.4,
    hoursAgo: 9,
    x: 0.36,
    y: 0.3,
    intensity: "high",
  },
  {
    id: "r2",
    diseaseKey: "tomato_early_blight",
    label: { en: "Tomato Early Blight", hi: "टमाटर अगेती झुलसा", mr: "टोमॅटो अर्ली ब्लाईट" },
    distanceKm: 3.2,
    hoursAgo: 21,
    x: 0.68,
    y: 0.24,
    intensity: "high",
  },
  {
    id: "r3",
    diseaseKey: "potato_late_blight",
    label: { en: "Potato Late Blight", hi: "आलू पछेती झुलसा", mr: "बटाटा उशिरा करपा" },
    distanceKm: 5.6,
    hoursAgo: 40,
    x: 0.22,
    y: 0.66,
    intensity: "medium",
  },
  {
    id: "r4",
    diseaseKey: "apple_scab",
    label: { en: "Apple Scab", hi: "सेब स्कैब", mr: "सफरचंद खपली" },
    distanceKm: 7.9,
    hoursAgo: 55,
    x: 0.78,
    y: 0.72,
    intensity: "low",
  },
  {
    id: "r5",
    diseaseKey: "tomato_early_blight",
    label: { en: "Tomato Early Blight", hi: "टमाटर अगेती झुलसा", mr: "टोमॅटो अर्ली ब्लाईट" },
    distanceKm: 9.1,
    hoursAgo: 66,
    x: 0.52,
    y: 0.82,
    intensity: "medium",
  },
];

export function spreadRisk(diseaseKey?: string) {
  const total = COMMUNITY_REPORTS.length;
  const same = COMMUNITY_REPORTS.filter((r) => r.diseaseKey === diseaseKey);
  const share = Math.round((same.length / total) * 100);
  const level: "high" | "medium" | "low" = share >= 50 ? "high" : share >= 25 ? "medium" : "low";
  return { share, level, count: same.length, total, reports: same };
}
