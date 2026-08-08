const HF_MODEL = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification";

export type RawPrediction = { label: string; score: number; runnerUpScore?: number };

/** The 14 crop species covered by the PlantVillage-trained model. */
const SUPPORTED_CROPS = [
  "Apple",
  "Blueberry",
  "Cherry",
  "Corn",
  "Grape",
  "Orange",
  "Peach",
  "Pepper,_bell",
  "Potato",
  "Raspberry",
  "Soybean",
  "Squash",
  "Strawberry",
  "Tomato",
] as const;

function toDataUrl(input: string) {
  return input.startsWith("data:") ? input : `data:image/jpeg;base64,${input}`;
}

function stripDataUrl(input: string) {
  return input.startsWith("data:") ? (input.split(",")[1] ?? "") : input;
}

const isHealthy = (label: string) => /healthy|unknown/i.test(label);

/**
 * Merges per-patch predictions. A disease seen confidently in ANY patch wins over
 * "healthy" full-frame reads, which is how small lesions were previously missed.
 */
export function aggregatePredictions(
  results: (RawPrediction | null)[],
): RawPrediction | null {
  const preds = results.filter((r): r is RawPrediction => Boolean(r?.label));
  if (preds.length === 0) return null;

  const diseased = preds
    .filter((p) => !isHealthy(p.label))
    .sort((a, b) => b.score - a.score);
  const healthy = preds.filter((p) => isHealthy(p.label)).sort((a, b) => b.score - a.score);

  if (diseased.length === 0) return healthy[0] ?? preds[0] ?? null;

  // Vote per label across patches: a label seen in several patches beats a
  // single confident outlier patch.
  const byLabel = new Map<string, { votes: number; best: number }>();
  for (const p of preds) {
    const entry = byLabel.get(p.label) ?? { votes: 0, best: 0 };
    entry.votes += 1;
    entry.best = Math.max(entry.best, p.score);
    byLabel.set(p.label, entry);
  }
  const weight = (label: string) => {
    const e = byLabel.get(label)!;
    return e.best * (e.votes / preds.length);
  };

  const top = [...diseased].sort((a, b) => weight(b.label) - weight(a.label))[0]!;
  const agreeing = byLabel.get(top.label)!.votes;
  const score = Math.min(0.99, top.score + (agreeing - 1) * 0.05);
  // Runner-up is compared on the same vote-weighted scale, so one dissenting
  // patch no longer makes a well-supported diagnosis look ambiguous.
  const others = [...byLabel.keys()].filter((l) => l !== top.label);
  const runnerUp = others.length
    ? Math.max(...others.map(weight))
    : (top.runnerUpScore ?? 0);
  return {
    label: top.label,
    score,
    ...(typeof runnerUp === "number" ? { runnerUpScore: runnerUp } : {}),
  };
}

/**
 * Vision classification through the Lovable AI gateway. Used as the primary
 * engine so real user photos get a real diagnosis (no Hugging Face token needed).
 */
export async function classifyWithLovableAI(image: string): Promise<RawPrediction | null> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) {
    const googleKey = process.env["GOOGLE_API_KEY"];
    if (googleKey) {
      const { classifyWithGoogle } = await import("./google-vision.server");
      return classifyWithGoogle(image);
    }
    return null;
  }

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a plant pathologist emulating a PlantVillage-trained classifier. " +
              "Identify the crop and leaf disease in the photo. " +
              'Answer ONLY with strict JSON: {"label": "Crop___Disease", "confidence": 0-1}. ' +
              "The photo may be a zoomed crop/patch of a larger image. Inspect closely for lesions, " +
              "rot, mould, spots, holes or discolouration on ANY part of the visible leaf or fruit; " +
              "report the disease if even a small area is affected, and only say healthy when the " +
              "entire visible tissue is clean. " +
              `The crop portion MUST be one of: ${SUPPORTED_CROPS.join(", ")}. ` +
              'If the leaf is any other crop (rice, cotton, wheat, sugarcane, etc.) or you cannot tell, return {"label": "Unknown___unknown", "confidence": 0}. ' +
              "Use ___healthy as the disease portion when no disease is visible. Never guess a crop that is not in the list.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Diagnose this leaf." },
              { type: "image_url", image_url: { url: toDataUrl(image) } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()) as {
      label?: string;
      confidence?: number;
    };
    if (!parsed.label) return null;
    return {
      label: parsed.label,
      score: typeof parsed.confidence === "number" ? parsed.confidence : 0.9,
    };
  } catch {
    return null;
  }
}

/**
 * Calls the Hugging Face Inference API image-classification endpoint.
 * Returns null when no token is configured or the model is unavailable,
 * so the caller can fall back to the local mapping engine.
 */
export async function classifyWithHuggingFace(
  image: string,
): Promise<RawPrediction | null> {
  const token = process.env["HUGGINGFACE_API_KEY"];
  if (!token) return null;

  const binary = Uint8Array.from(atob(stripDataUrl(image)), (c) => c.charCodeAt(0));

  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
      },
      body: binary,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as RawPrediction[] | { error?: string };
    if (!Array.isArray(json) || json.length === 0) return null;
    const top = json[0];
    if (!top) return null;
    const runnerUp = json[1]?.score;
    return typeof runnerUp === "number" ? { ...top, runnerUpScore: runnerUp } : top;
  } catch {
    return null;
  }
}

/* ---------- open-vocabulary detection (no crop boundaries) ---------- */

export type OpenDiagnosis = {
  crop: { en: string; hi: string; mr: string };
  disease: { en: string; hi: string; mr: string };
  scientific: string | null;
  confidence: number;
  severity: number;
  healthy: boolean;
  chemical: { en: string[]; hi: string[]; mr: string[] };
  organic: { en: string[]; hi: string[]; mr: string[] };
  prevention: { en: string[]; hi: string[]; mr: string[] };
  sources: { title: string; url: string }[];
};

const L3 = (v: unknown): { en: string; hi: string; mr: string } => {
  const o = (v ?? {}) as Record<string, unknown>;
  const en = String(o["en"] ?? "").trim();
  return {
    en,
    hi: String(o["hi"] ?? en).trim() || en,
    mr: String(o["mr"] ?? en).trim() || en,
  };
};

const L3List = (v: unknown): { en: string[]; hi: string[]; mr: string[] } => {
  const o = (v ?? {}) as Record<string, unknown>;
  const arr = (x: unknown) =>
    Array.isArray(x) ? x.map((s) => String(s).trim()).filter(Boolean).slice(0, 4) : [];
  const en = arr(o["en"]);
  return { en, hi: arr(o["hi"]).length ? arr(o["hi"]) : en, mr: arr(o["mr"]).length ? arr(o["mr"]) : en };
};

/**
 * Google Gemini vision + web-grounded advisory for ANY crop, including the ones
 * outside the 38-label PlantVillage set (rice, cotton, wheat, sugarcane, chilli,
 * banana, onion…). Used when the closed classifier says "unsupported".
 */
export async function identifyOpenVocabulary(
  image: string,
  cropHint?: string,
): Promise<OpenDiagnosis | null> {
  // 1) Google first — Gemini API on the project's own GOOGLE_API_KEY, grounded
  //    with live Google Search results (same key that powers weather / AQI).
  const { identifyWithGoogle } = await import("./google-vision.server");
  const viaGoogle = await identifyWithGoogle(image, cropHint);
  if (viaGoogle) return viaGoogle;

  // 2) Fallback — Lovable AI gateway.
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return null;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an Indian plant pathologist with access to current public advisories " +
              "(ICAR, KVK, state agricultural universities, FAO). Identify the crop and the " +
              "disease/pest/deficiency in the photo. There is NO fixed list of crops or diseases — " +
              "name whatever you actually see (rice blast, cotton leaf curl, sugarcane red rot, " +
              "banana sigatoka, chilli anthracnose, nutrient deficiency, etc.). " +
              "Give doses that match Indian label recommendations. " +
              "Reply ONLY with strict JSON: {" +
              '"crop":{"en":"","hi":"","mr":""},' +
              '"disease":{"en":"","hi":"","mr":""},' +
              '"scientific":"","confidence":0-1,"severity":0-100,"healthy":false,' +
              '"chemical":{"en":[],"hi":[],"mr":[]},' +
              '"organic":{"en":[],"hi":[],"mr":[]},' +
              '"prevention":{"en":[],"hi":[],"mr":[]},' +
              '"sources":[{"title":"","url":""}]}. ' +
              "3 items per list, each a concrete field step with product + dose per litre where relevant. " +
              'If the leaf is completely clean set healthy=true, severity 0 and disease "Healthy leaf". ' +
              'If the photo is not a plant at all, return confidence 0 and crop.en "Unknown".',
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: cropHint
                  ? `The farmer says this is ${cropHint}. Verify and diagnose.`
                  : "Diagnose this leaf.",
              },
              { type: "image_url", image_url: { url: toDataUrl(image) } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      console.error(`Open diagnosis failed [${res.status}]`);
      return null;
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content;
    if (!raw) return null;
    const p = JSON.parse(raw.replace(/```json|```/g, "").trim()) as Record<string, unknown>;

    const crop = L3(p["crop"]);
    const disease = L3(p["disease"]);
    const confidence = Number(p["confidence"] ?? 0);
    if (!crop.en || !disease.en || !Number.isFinite(confidence) || confidence <= 0) return null;
    if (/^unknown/i.test(crop.en)) return null;

    const healthy = Boolean(p["healthy"]);
    const severityRaw = Number(p["severity"] ?? 0);
    const sources = Array.isArray(p["sources"])
      ? (p["sources"] as Record<string, unknown>[])
          .map((s) => ({ title: String(s?.["title"] ?? "").trim(), url: String(s?.["url"] ?? "").trim() }))
          .filter((s) => s.title && /^https?:\/\//.test(s.url))
          .slice(0, 4)
      : [];

    return {
      crop,
      disease,
      scientific: p["scientific"] ? String(p["scientific"]).trim() : null,
      confidence: Math.max(0, Math.min(1, confidence)),
      severity: healthy ? 0 : Math.max(1, Math.min(98, Math.round(severityRaw || 30))),
      healthy,
      chemical: L3List(p["chemical"]),
      organic: L3List(p["organic"]),
      prevention: L3List(p["prevention"]),
      sources,
    };
  } catch (err) {
    console.error("Open diagnosis error", err);
    return null;
  }
}
