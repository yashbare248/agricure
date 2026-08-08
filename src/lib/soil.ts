import type { Lang, L } from "./treatments";

export type SoilKey = "black" | "red" | "sandy" | "alluvial";

export type SoilType = {
  key: SoilKey;
  emoji: string;
  label: L;
  ph: string;
  carbon: string;
  advisory: L;
};

export const SOILS: SoilType[] = [
  {
    key: "black",
    emoji: "⬛",
    label: { en: "Black Cotton Soil", hi: "काली कपास मिट्टी", mr: "काळी कापूस माती" },
    ph: "7.5 – 8.5",
    carbon: "0.6 – 0.9%",
    advisory: {
      en: "High chemical absorption rate — Apply as FOLIAR SPRAY on leaves rather than soil drenching.",
      hi: "रसायन सोखने की दर अधिक — मिट्टी में डालने की बजाय पत्तियों पर फोलियर स्प्रे करें।",
      mr: "रसायन शोषणाचा दर जास्त — आळवणीऐवजी पानांवर फोलियर फवारणी करा.",
    },
  },
  {
    key: "red",
    emoji: "🔴",
    label: { en: "Red Soil", hi: "लाल मिट्टी", mr: "तांबडी माती" },
    ph: "6.0 – 6.8",
    carbon: "0.3 – 0.5%",
    advisory: {
      en: "Low organic carbon — Add 2 kg/acre humic acid with the fungicide and keep dosage at the label minimum.",
      hi: "जैविक कार्बन कम — फफूंदनाशक के साथ 2 किग्रा/एकड़ ह्यूमिक एसिड दें और खुराक न्यूनतम रखें।",
      mr: "सेंद्रिय कर्ब कमी — बुरशीनाशकासोबत २ किलो/एकर ह्युमिक अ‍ॅसिड द्या व मात्रा किमान ठेवा.",
    },
  },
  {
    key: "sandy",
    emoji: "🟡",
    label: { en: "Sandy / Loamy Soil", hi: "बलुई/दोमट मिट्टी", mr: "वालुकामय / पोयट्याची माती" },
    ph: "6.5 – 7.5",
    carbon: "0.2 – 0.4%",
    advisory: {
      en: "High leaching risk — Combine fungicide with a spreading adjuvant to prevent runoff.",
      hi: "बहाव (लीचिंग) का जोखिम अधिक — फफूंदनाशक के साथ स्प्रेडिंग एडजुवेंट मिलाएँ ताकि बहाव रुके।",
      mr: "निचरा होण्याचा धोका जास्त — वाहून जाऊ नये म्हणून बुरशीनाशकात स्प्रेडर अ‍ॅडज्युव्हंट मिसळा.",
    },
  },
  {
    key: "alluvial",
    emoji: "🟤",
    label: { en: "Alluvial / Brown Soil", hi: "जलोढ़/भूरी मिट्टी", mr: "गाळाची / तपकिरी माती" },
    ph: "7.0 – 8.0",
    carbon: "0.5 – 0.8%",
    advisory: {
      en: "Balanced retention — Standard label dosage works; split the spray into two lighter rounds 8 days apart.",
      hi: "संतुलित धारण क्षमता — लेबल की सामान्य खुराक ठीक है; 8 दिन के अंतर पर दो हल्के छिड़काव करें।",
      mr: "संतुलित धारणक्षमता — लेबलवरील मात्रा योग्य; ८ दिवसांच्या अंतराने दोन हलक्या फवारण्या घ्या.",
    },
  },
];

export const soilByKey = (k: SoilKey) => SOILS.find((s) => s.key === k) ?? SOILS[0]!;

/** Simulated ISRIC SoilGrids / Bhuvan GIS lookup — deterministic from coordinates. */
export function soilFromCoords(lat: number, lon: number): SoilType {
  const idx = Math.abs(Math.round(lat * 37 + lon * 53)) % SOILS.length;
  return SOILS[idx]!;
}

const KEY = "agricure-soil";

export function storedSoil(): SoilKey | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v && SOILS.some((s) => s.key === v) ? (v as SoilKey) : null;
}

export function storeSoil(k: SoilKey) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, k);
}

export const soilSummary = (s: SoilType, lang: Lang) =>
  `${s.label[lang]} · pH ${s.ph} · OC ${s.carbon}`;
