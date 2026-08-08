import type { Lang, L } from "./treatments";
import { soilByKey, type SoilKey } from "./soil";
import type { AnalysisResult } from "./analysis";

export type SprayTask = {
  id: string;
  day: number; // days from start
  date: string; // ISO date
  kind: "chemical" | "organic" | "prevention" | "check";
  title: L;
  detail: L;
  done: boolean;
};

export type SprayPlan = {
  createdAt: string;
  diseaseKey: string;
  diseaseName: L;
  soil: SoilKey;
  severity: number;
  tasks: SprayTask[];
};

const KEY = "agricure-spray-plan";
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (base: Date, n: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
};

const METHOD: Record<SoilKey, L> = {
  black: {
    en: "Foliar spray (avoid soil drenching — high absorption)",
    hi: "फोलियर स्प्रे करें (मिट्टी में न डालें — अवशोषण अधिक)",
    mr: "फोलियर फवारणी करा (आळवणी टाळा — शोषण जास्त)",
  },
  red: {
    en: "Spray with 2 kg/acre humic acid, keep dose at label minimum",
    hi: "2 किग्रा/एकड़ ह्यूमिक एसिड के साथ, खुराक न्यूनतम रखें",
    mr: "२ किलो/एकर ह्युमिक अ‍ॅसिडसह, मात्रा किमान ठेवा",
  },
  sandy: {
    en: "Add a spreading adjuvant to prevent runoff and leaching",
    hi: "बहाव रोकने के लिए स्प्रेडिंग एडजुवेंट मिलाएँ",
    mr: "वाहून जाऊ नये म्हणून स्प्रेडर अ‍ॅडज्युव्हंट मिसळा",
  },
  alluvial: {
    en: "Standard label dose — split into two lighter rounds",
    hi: "लेबल की सामान्य खुराक — दो हल्के छिड़काव में बाँटें",
    mr: "लेबलवरील मात्रा — दोन हलक्या फवारण्यांत विभागा",
  },
};

const first = (arr: string[] | undefined, fallback: string) => arr?.[0] ?? fallback;

/** Build a soil- and severity-aware spray schedule from the AI advisory. */
export function buildPlan(result: AnalysisResult, soil: SoilKey, start = new Date()): SprayPlan {
  const { treatment, severity } = result;
  const healthy = treatment.key === "healthy_leaf";
  const gap = severity >= 60 ? 7 : severity >= 30 ? 10 : 12;
  const method = METHOD[soil];

  const mk = (
    day: number,
    kind: SprayTask["kind"],
    title: L,
    detail: L,
  ): SprayTask => ({
    id: `${kind}-${day}`,
    day,
    date: iso(addDays(start, day)),
    kind,
    title,
    detail,
    done: false,
  });

  const chem = (i: number): L => ({
    en: first(treatment.chemical.en.slice(i), "Apply the recommended fungicide at label dose."),
    hi: first(treatment.chemical.hi.slice(i), "अनुशंसित फफूंदनाशक लेबल खुराक पर दें।"),
    mr: first(treatment.chemical.mr.slice(i), "शिफारस केलेले बुरशीनाशक लेबल मात्रेत द्या."),
  });
  const org: L = {
    en: first(treatment.organic.en, "Neem oil 5 ml/L as a preventive spray."),
    hi: first(treatment.organic.hi, "नीम तेल 5 मिली/लीटर निवारक छिड़काव।"),
    mr: first(treatment.organic.mr, "निंबोळी तेल ५ मिली/लि. प्रतिबंधक फवारणी."),
  };
  const prev: L = {
    en: first(treatment.prevention.en, "Remove infected leaves and keep the field weed free."),
    hi: first(treatment.prevention.hi, "संक्रमित पत्तियाँ हटाएँ और खेत खरपतवार मुक्त रखें।"),
    mr: first(treatment.prevention.mr, "बाधित पाने काढा व शेत तणमुक्त ठेवा."),
  };

  const withMethod = (base: L): L => ({
    en: `${base.en} — ${method.en}`,
    hi: `${base.hi} — ${method.hi}`,
    mr: `${base.mr} — ${method.mr}`,
  });

  const tasks: SprayTask[] = healthy
    ? [
        mk(0, "organic", { en: "Preventive neem spray", hi: "निवारक नीम छिड़काव", mr: "प्रतिबंधक निंबोळी फवारणी" }, withMethod(org)),
        mk(14, "check", { en: "Field scouting", hi: "खेत निरीक्षण", mr: "शेत निरीक्षण" }, prev),
        mk(21, "organic", { en: "Booster bio-spray", hi: "बूस्टर जैविक छिड़काव", mr: "बूस्टर जैविक फवारणी" }, withMethod(org)),
      ]
    : [
        mk(0, "chemical", { en: "Spray 1 — knock-down dose", hi: "छिड़काव 1 — प्रारंभिक खुराक", mr: "फवारणी १ — प्रारंभिक मात्रा" }, withMethod(chem(0))),
        mk(3, "prevention", { en: "Sanitation & irrigation check", hi: "सफाई व सिंचाई जाँच", mr: "स्वच्छता व सिंचन तपासणी" }, prev),
        mk(gap, "chemical", { en: "Spray 2 — rotate the molecule", hi: "छिड़काव 2 — दवा बदलें", mr: "फवारणी २ — औषध बदला" }, withMethod(chem(1))),
        mk(gap + 4, "organic", { en: "Organic support spray", hi: "जैविक सहायक छिड़काव", mr: "जैविक पूरक फवारणी" }, withMethod(org)),
        mk(gap * 2, "chemical", { en: "Spray 3 — final round", hi: "छिड़काव 3 — अंतिम दौर", mr: "फवारणी ३ — अंतिम फेरी" }, withMethod(chem(2))),
        mk(gap * 2 + 7, "check", { en: "Re-scan the crop", hi: "फसल दोबारा स्कैन करें", mr: "पीक पुन्हा स्कॅन करा" }, {
          en: "Take a fresh leaf photo in AgriCure AI to confirm recovery.",
          hi: "रिकवरी की पुष्टि हेतु AgriCure AI में नई पत्ती फोटो लें।",
          mr: "बरे झाल्याची खात्री करण्यासाठी AgriCure AI मध्ये नवीन फोटो घ्या.",
        }),
      ];

  return {
    createdAt: new Date().toISOString(),
    diseaseKey: treatment.key,
    diseaseName: treatment.name,
    soil,
    severity,
    tasks,
  };
}

export function loadPlan(): SprayPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SprayPlan) : null;
  } catch {
    return null;
  }
}

export function savePlan(plan: SprayPlan) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(plan));
}

export function clearPlan() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

export const soilNote = (soil: SoilKey, lang: Lang) => soilByKey(soil).advisory[lang];

export function daysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${date}T00:00:00`);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

/** Ask for browser notification permission. */
export async function enableNotifications(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}

const SENT = "agricure-spray-notified";

/** Fire a reminder for any task due today or overdue, once per task per day. */
export function runReminders(plan: SprayPlan, lang: Lang) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const stamp = new Date().toISOString().slice(0, 10);
  let sent: Record<string, string> = {};
  try {
    sent = JSON.parse(localStorage.getItem(SENT) ?? "{}") as Record<string, string>;
  } catch {
    sent = {};
  }
  for (const task of plan.tasks) {
    if (task.done) continue;
    if (daysUntil(task.date) > 0) continue;
    if (sent[task.id] === stamp) continue;
    new Notification(`🌿 AgriCure AI — ${task.title[lang]}`, { body: task.detail[lang] });
    sent[task.id] = stamp;
  }
  localStorage.setItem(SENT, JSON.stringify(sent));
}

/** Downloadable .ics so farmers can push the plan to their phone calendar. */
export function planToIcs(plan: SprayPlan, lang: Lang) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AgriCure AI//Spray Calendar//EN",
    ...plan.tasks.flatMap((t) => [
      "BEGIN:VEVENT",
      `UID:${t.id}-${plan.createdAt}@agricure.ai`,
      `DTSTART;VALUE=DATE:${t.date.replace(/-/g, "")}`,
      `SUMMARY:${t.title[lang]} — ${plan.diseaseName[lang]}`,
      `DESCRIPTION:${t.detail[lang].replace(/\n/g, " ")}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}