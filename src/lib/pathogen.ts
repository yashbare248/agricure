/**
 * Maps a detected disease to its pathogen class and the weather window that
 * pathogen needs. Used to correlate live/observed weather with the local
 * model's prediction (a confidence cross-check, not a second classifier).
 */
export type PathogenClass = "fungal" | "oomycete" | "bacterial" | "viral" | "pest" | "none";

export type PathogenProfile = {
  cls: PathogenClass;
  /** Ideal temperature band (°C) for infection. */
  temp: [number, number];
  /** Relative humidity (%) at or above which infection accelerates. */
  humidity: number;
  /** Whether leaf wetness / rainfall strongly drives spread. */
  rainDriven: boolean;
};

const PROFILES: Record<PathogenClass, PathogenProfile> = {
  oomycete: { cls: "oomycete", temp: [12, 24], humidity: 85, rainDriven: true },
  fungal: { cls: "fungal", temp: [18, 30], humidity: 75, rainDriven: true },
  bacterial: { cls: "bacterial", temp: [22, 34], humidity: 80, rainDriven: true },
  viral: { cls: "viral", temp: [24, 34], humidity: 50, rainDriven: false },
  pest: { cls: "pest", temp: [25, 36], humidity: 45, rainDriven: false },
  none: { cls: "none", temp: [15, 32], humidity: 60, rainDriven: false },
};

export function pathogenClass(diseaseKeyOrName: string): PathogenClass {
  const s = diseaseKeyOrName.toLowerCase();
  if (/healthy/.test(s)) return "none";
  if (/late[_ ]?blight|downy|phytophthora/.test(s)) return "oomycete";
  if (/virus|curl|mosaic|yellow leaf/.test(s)) return "viral";
  if (/mite|borer|worm|aphid|thrip|pest/.test(s)) return "pest";
  if (/bacter|citrus greening|haunglongbing|huanglongbing/.test(s)) return "bacterial";
  return "fungal";
}

export function profileFor(diseaseKeyOrName: string): PathogenProfile {
  return PROFILES[pathogenClass(diseaseKeyOrName)];
}

/** 0–100 likelihood that a day's weather favours this pathogen. */
export function riskForDay(
  p: PathogenProfile,
  day: { temp: number; humidity: number; rain: number },
): number {
  if (p.cls === "none") return 0;
  const [lo, hi] = p.temp;
  const mid = (lo + hi) / 2;
  const span = Math.max(1, (hi - lo) / 2);
  const tempScore = Math.max(0, 1 - Math.abs(day.temp - mid) / (span * 1.8));
  const humScore = Math.min(1, Math.max(0, (day.humidity - (p.humidity - 25)) / 25));
  const rainScore = p.rainDriven ? Math.min(1, day.rain / 12) : Math.max(0, 1 - day.rain / 10);
  const score = tempScore * 0.4 + humScore * 0.4 + rainScore * 0.2;
  return Math.round(Math.min(1, Math.max(0, score)) * 100);
}