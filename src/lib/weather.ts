import type { Lang } from "./treatments";
import type { LiveWeather } from "./weather.functions";

export type Advisory = {
  status: "postpone" | "caution" | "go";
  rainChance: number;
  temp: number;
  humidity: number;
  wind: number;
  message: Record<Lang, string>;
};

const ADVISORIES: Advisory[] = [
  {
    status: "postpone",
    rainChance: 80,
    temp: 27,
    humidity: 86,
    wind: 14,
    message: {
      en: "🌧️ Rain predicted tomorrow (80% probability) — POSTPONE pesticide spraying for 48 hours to prevent wash-off.",
      hi: "🌧️ कल बारिश की संभावना (80%) — दवा बह जाने से बचाने हेतु छिड़काव 48 घंटे टाल दें।",
      mr: "🌧️ उद्या पावसाची शक्यता (८०%) — औषध वाहून जाऊ नये म्हणून फवारणी ४८ तास पुढे ढकला.",
    },
  },
  {
    status: "caution",
    rainChance: 35,
    temp: 31,
    humidity: 68,
    wind: 22,
    message: {
      en: "💨 Wind at 22 km/h — spray only before 9 AM to avoid drift and uneven coverage.",
      hi: "💨 हवा 22 किमी/घंटा — बहाव से बचने हेतु सुबह 9 बजे से पहले ही छिड़काव करें।",
      mr: "💨 वारा २२ किमी/तास — औषध उडू नये म्हणून सकाळी ९ पूर्वीच फवारणी करा.",
    },
  },
  {
    status: "go",
    rainChance: 10,
    temp: 29,
    humidity: 52,
    wind: 8,
    message: {
      en: "☀️ Clear and calm for 72 hours — ideal window for spraying today.",
      hi: "☀️ अगले 72 घंटे मौसम साफ़ — आज छिड़काव के लिए सर्वोत्तम समय।",
      mr: "☀️ पुढील ७२ तास हवामान स्वच्छ — आज फवारणीसाठी उत्तम वेळ.",
    },
  },
];

export function advisoryFor(diseaseKey: string): Advisory {
  if (diseaseKey === "healthy_leaf") return ADVISORIES[2]!;
  if (diseaseKey === "potato_late_blight") return ADVISORIES[0]!;
  if (diseaseKey === "apple_scab") return ADVISORIES[1]!;
  return ADVISORIES[0]!;
}

/**
 * Builds a spraying advisory from a live forecast reading.
 * Rules: heavy rain soon -> postpone, high wind / heat / borderline rain -> caution, else go.
 */
export function advisoryFromWeather(w: LiveWeather, diseaseKey: string): Advisory {
  const rain = Math.max(w.rainChance, w.rainTomorrow);
  const base = { rainChance: rain, temp: w.temp, humidity: w.humidity, wind: w.wind };
  const healthy = diseaseKey === "healthy_leaf";

  if (rain >= 60) {
    return {
      ...base,
      status: "postpone",
      message: {
        en: `🌧️ Rain likely within 48 hours (${rain}% probability) — POSTPONE spraying for 48 hours to prevent wash-off.`,
        hi: `🌧️ अगले 48 घंटों में बारिश की संभावना (${rain}%) — दवा बह जाने से बचाने हेतु छिड़काव 48 घंटे टाल दें।`,
        mr: `🌧️ पुढील ४८ तासांत पावसाची शक्यता (${rain}%) — औषध वाहून जाऊ नये म्हणून फवारणी ४८ तास पुढे ढकला.`,
      },
    };
  }

  if (w.wind >= 20) {
    return {
      ...base,
      status: "caution",
      message: {
        en: `💨 Wind at ${w.wind} km/h — spray only in the calm early morning to avoid drift and uneven coverage.`,
        hi: `💨 हवा ${w.wind} किमी/घंटा — बहाव से बचने हेतु शांत सुबह के समय ही छिड़काव करें।`,
        mr: `💨 वारा ${w.wind} किमी/तास — औषध उडू नये म्हणून शांत सकाळीच फवारणी करा.`,
      },
    };
  }

  if (w.temp >= 35) {
    return {
      ...base,
      status: "caution",
      message: {
        en: `🌡️ ${w.temp}°C heat — spray after 5 PM; midday spraying evaporates fast and can scorch leaves.`,
        hi: `🌡️ ${w.temp}°C गर्मी — शाम 5 बजे के बाद छिड़काव करें; दोपहर में दवा जल्दी सूखती है और पत्ते झुलस सकते हैं।`,
        mr: `🌡️ ${w.temp}°C उष्णता — संध्याकाळी ५ नंतर फवारणी करा; दुपारी औषध लवकर आटते व पाने करपू शकतात.`,
      },
    };
  }

  if (rain >= 30) {
    return {
      ...base,
      status: "caution",
      message: {
        en: `🌦️ ${rain}% chance of rain — spray only if the sky stays clear for the next 6 hours.`,
        hi: `🌦️ बारिश की ${rain}% संभावना — अगले 6 घंटे मौसम साफ़ रहने पर ही छिड़काव करें।`,
        mr: `🌦️ पावसाची ${rain}% शक्यता — पुढील ६ तास आकाश स्वच्छ राहिल्यासच फवारणी करा.`,
      },
    };
  }

  return {
    ...base,
    status: "go",
    message: {
      en: healthy
        ? `☀️ Clear weather (${w.temp}°C, wind ${w.wind} km/h) — good conditions for preventive spraying today.`
        : `☀️ Clear weather (${w.temp}°C, wind ${w.wind} km/h) — ideal spraying window today.`,
      hi: `☀️ मौसम साफ़ (${w.temp}°C, हवा ${w.wind} किमी/घंटा) — आज छिड़काव के लिए सर्वोत्तम समय।`,
      mr: `☀️ हवामान स्वच्छ (${w.temp}°C, वारा ${w.wind} किमी/तास) — आज फवारणीसाठी उत्तम वेळ.`,
    },
  };
}
