import type { Lang } from "./treatments";

export type ProductCategory = "fungicide" | "bio" | "nutrition";

export type MarketInfo = {
  category: ProductCategory;
  priceMin: number;
  priceMax: number;
};

const CATEGORY_LABEL: Record<ProductCategory, Record<Lang, string>> = {
  fungicide: { en: "Fungicides", hi: "फफूंदनाशक", mr: "बुरशीनाशके" },
  bio: { en: "Bio-inputs", hi: "जैविक इनपुट", mr: "जैविक निविष्ठा" },
  nutrition: { en: "Nutrition", hi: "पोषक तत्व", mr: "पोषक घटक" },
};

export const categoryLabel = (c: ProductCategory, lang: Lang) => CATEGORY_LABEL[c][lang];

const RULES: { match: RegExp; info: MarketInfo }[] = [
  { match: /metalaxyl|cymoxanil/i, info: { category: "fungicide", priceMin: 850, priceMax: 980 } },
  { match: /mancozeb/i, info: { category: "fungicide", priceMin: 450, priceMax: 520 } },
  { match: /chlorothalonil/i, info: { category: "fungicide", priceMin: 620, priceMax: 700 } },
  { match: /captan/i, info: { category: "fungicide", priceMin: 380, priceMax: 450 } },
  { match: /dodine/i, info: { category: "fungicide", priceMin: 700, priceMax: 820 } },
  { match: /bordeaux|copper/i, info: { category: "fungicide", priceMin: 300, priceMax: 360 } },
  { match: /sulphur|sulfur/i, info: { category: "fungicide", priceMin: 250, priceMax: 310 } },
  { match: /trichoderma|neem/i, info: { category: "bio", priceMin: 220, priceMax: 300 } },
  { match: /19:19:19|fertilis|fertiliz|micronutrient/i, info: { category: "nutrition", priceMin: 180, priceMax: 240 } },
];

/** Derive price + shop category from the English source line so it works in every language. */
export function marketInfo(englishItem: string): MarketInfo | null {
  if (/no fungicide required/i.test(englishItem)) return null;
  return RULES.find((r) => r.match.test(englishItem))?.info ?? null;
}
