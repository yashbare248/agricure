import type { OpenDiagnosis } from "./analyze.server";

/**
 * Direct Google (Gemini API) leaf diagnosis, grounded with Google Search.
 * Uses the project's own GOOGLE_API_KEY — the same key powering Google Weather /
 * Air Quality — so disease detection is backed by live Google results rather
 * than model memory alone. Returns null when the key is missing or Google fails,
 * so the caller can fall back to the Lovable AI gateway path.
 */

const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const PROMPT =
  "You are an Indian plant pathologist. Identify the crop and the disease/pest/deficiency in this photo. " +
  "Use Google Search to confirm current symptoms, pathogen name and India-approved control measures " +
  "(ICAR, KVK, state agricultural universities, FAO). There is NO fixed list of crops or diseases. " +
  "Reply ONLY with strict JSON (no prose, no markdown fence): {" +
  '"crop":{"en":"","hi":"","mr":""},' +
  '"disease":{"en":"","hi":"","mr":""},' +
  '"scientific":"","confidence":0-1,"severity":0-100,"healthy":false,' +
  '"chemical":{"en":[],"hi":[],"mr":[]},' +
  '"organic":{"en":[],"hi":[],"mr":[]},' +
  '"prevention":{"en":[],"hi":[],"mr":[]}}. ' +
  "3 items per list, each a concrete field step with product + dose per litre where relevant. " +
  'If the leaf is completely clean set healthy=true, severity 0, disease "Healthy leaf". ' +
  'If the photo is not a plant, return confidence 0 and crop.en "Unknown".';

function mimeAndData(input: string) {
  if (input.startsWith("data:")) {
    const [head, body] = input.split(",");
    const mime = head?.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
    return { mime, data: body ?? "" };
  }
  return { mime: "image/jpeg", data: input };
}

type GroundingChunk = { web?: { uri?: string; title?: string } };

export async function identifyWithGoogle(
  image: string,
  cropHint?: string,
): Promise<OpenDiagnosis | null> {
  const key = process.env["GOOGLE_API_KEY"];
  if (!key) return null;

  const { mime, data } = mimeAndData(image);
  if (!data) return null;

  try {
    const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: cropHint
                  ? `${PROMPT}\nThe farmer says this is ${cropHint}. Verify before diagnosing.`
                  : PROMPT,
              },
              { inline_data: { mime_type: mime, data } },
            ],
          },
        ],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) {
      console.error(`Google vision diagnosis failed [${res.status}]`);
      return null;
    }

    const json = (await res.json()) as {
      candidates?: {
        content?: { parts?: { text?: string }[] };
        groundingMetadata?: { groundingChunks?: GroundingChunk[] };
      }[];
    };

    const candidate = json.candidates?.[0];
    const text = (candidate?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!text) return null;

    const body = text.replace(/```json|```/g, "").trim();
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    const p = JSON.parse(body.slice(start, end + 1)) as Record<string, unknown>;

    const crop = l3(p["crop"]);
    const disease = l3(p["disease"]);
    const confidence = Number(p["confidence"] ?? 0);
    if (!crop.en || !disease.en || !Number.isFinite(confidence) || confidence <= 0) return null;
    if (/^unknown/i.test(crop.en)) return null;

    const healthy = Boolean(p["healthy"]);
    const severityRaw = Number(p["severity"] ?? 0);

    // Real Google Search citations behind the diagnosis.
    const seen = new Set<string>();
    const sources = (candidate?.groundingMetadata?.groundingChunks ?? [])
      .map((c) => ({
        title: String(c.web?.title ?? "").trim(),
        url: String(c.web?.uri ?? "").trim(),
      }))
      .filter((s) => {
        if (!s.title || !/^https?:\/\//.test(s.url) || seen.has(s.url)) return false;
        seen.add(s.url);
        return true;
      })
      .slice(0, 4);

    return {
      crop,
      disease,
      scientific: p["scientific"] ? String(p["scientific"]).trim() : null,
      confidence: Math.max(0, Math.min(1, confidence)),
      severity: healthy ? 0 : Math.max(1, Math.min(98, Math.round(severityRaw || 30))),
      healthy,
      chemical: l3List(p["chemical"]),
      organic: l3List(p["organic"]),
      prevention: l3List(p["prevention"]),
      sources,
    };
  } catch (err) {
    console.error("Google vision diagnosis error", err);
    return null;
  }
}

const l3 = (v: unknown) => {
  const o = (v ?? {}) as Record<string, unknown>;
  const en = String(o["en"] ?? "").trim();
  return { en, hi: String(o["hi"] ?? en).trim() || en, mr: String(o["mr"] ?? en).trim() || en };
};

const l3List = (v: unknown) => {
  const o = (v ?? {}) as Record<string, unknown>;
  const arr = (x: unknown) =>
    Array.isArray(x) ? x.map((s) => String(s).trim()).filter(Boolean).slice(0, 4) : [];
  const en = arr(o["en"]);
  return { en, hi: arr(o["hi"]).length ? arr(o["hi"]) : en, mr: arr(o["mr"]).length ? arr(o["mr"]) : en };
};

/**
 * Emulates the PlantVillage-trained classifier directly using Google Gemini API.
 * Uses the GOOGLE_API_KEY environment variable.
 */
export async function classifyWithGoogle(image: string): Promise<{ label: string; score: number; runnerUpScore?: number } | null> {
  const key = process.env["GOOGLE_API_KEY"];
  if (!key) return null;

  const { mime, data } = mimeAndData(image);
  if (!data) return null;

  const prompt =
    "You are a plant pathologist emulating a PlantVillage-trained classifier. " +
    "Identify the crop and leaf disease in the photo. " +
    'Answer ONLY with strict JSON: {"label": "Crop___Disease", "confidence": 0-1}. ' +
    "The photo may be a zoomed crop/patch of a larger image. Inspect closely for lesions, " +
    "rot, mould, spots, holes or discolouration on ANY part of the visible leaf or fruit; " +
    "report the disease if even a small area is affected, and only say healthy when the " +
    "entire visible tissue is clean. " +
    "The crop portion MUST be one of: Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Pepper,_bell, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato. " +
    'If the leaf is any other crop (rice, cotton, wheat, sugarcane, etc.) or you cannot tell, return {"label": "Unknown___unknown", "confidence": 0}. ' +
    "Use ___healthy as the disease portion when no disease is visible. Never guess a crop that is not in the list.";

  try {
    const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mime, data } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      console.error(`Google classification failed [${res.status}]`);
      return null;
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text.trim()) as { label?: string; confidence?: number };
    if (!parsed.label) return null;

    return {
      label: parsed.label,
      score: typeof parsed.confidence === "number" ? parsed.confidence : 0.9,
    };
  } catch (err) {
    console.error("Google classification error", err);
    return null;
  }
}

