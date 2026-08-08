import { classifyLeaf, identifyAnyLeaf } from "./analyze.functions";
import { mapLabelToTreatment, byKey, type Treatment } from "./treatments";
import { cropByKey, parseLabel } from "./plantvillage";
import { buildImageTiles } from "./image-tiles";
import { supabase } from "@/integrations/supabase/client";

/** Why a result is shown in the amber warning state instead of a confident diagnosis. */
export type ResultStatus = "ok" | "uncertain" | "unsupported" | "mismatch";

export type AnalysisResult = {
  treatment: Treatment;
  confidence: number;
  severity: number;
  healthScore: number;
  source: "huggingface" | "demo" | "fallback";
  status: ResultStatus;
  /** Crop the user picked in the dropdown, if any. */
  selectedCropKey?: string;
  /** Crop the model actually detected, if any. */
  detectedCropKey?: string;
  /** Runner-up candidates, used by the low-confidence "uncertain" state. */
  alternatives: Treatment[];
  /** True when the diagnosis came from the boundary-free Google AI pipeline. */
  openVocabulary?: boolean;
  /** Public advisory links backing an open-vocabulary diagnosis. */
  sources?: { title: string; url: string }[];
};

/** The four pre-cached demo diagnoses used by Demo Mode and every fallback path. */
export const DEMO_KEYS = [
  "tomato_early_blight",
  "potato_late_blight",
  "unsupported_crop",
  "healthy_leaf",
] as const;

const LIVE_TIMEOUT_MS = 20000;
/** Minimum top1 − top2 score gap (percentage points) for a confident call. */
const AMBIGUITY_GAP = 10;
const CONFIDENCE_FLOOR = 60;

const jitter = (base: number, spread: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(base + (Math.random() * 2 - 1) * spread)));

function altsFor(t: Treatment): Treatment[] {
  return DEMO_KEYS.filter((k) => k !== t.key && k !== "unsupported_crop")
    .slice(0, 2)
    .map((k) => byKey(k));
}

function buildResult(
  t: Treatment,
  source: AnalysisResult["source"],
  score?: number,
  status: ResultStatus = "ok",
): AnalysisResult {
  if (t.key === "unsupported_crop") {
    return {
      treatment: t,
      severity: 0,
      healthScore: 0,
      confidence: 0,
      source,
      status: status === "ok" ? "unsupported" : status,
      alternatives: [],
    };
  }
  const severity = jitter(t.severity, 4, 1, 98);
  return {
    treatment: t,
    severity,
    healthScore: t.key === "healthy_leaf" ? jitter(t.healthScore, 3, 85, 99) : 100 - severity - 3,
    confidence: score ? Math.round(score * 1000) / 10 : jitter(t.confidence, 1.5, 88, 99),
    source,
    status,
    alternatives: altsFor(t),
  };
}

let demoCursor = 0;

export function demoResult(forcedKey?: string): AnalysisResult {
  if (forcedKey) return buildResult(byKey(forcedKey), "demo");
  const key = DEMO_KEYS[demoCursor % DEMO_KEYS.length]!;
  demoCursor += 1;
  return buildResult(byKey(key), "demo");
}

/** Result shown when the chosen/detected crop is outside the model's 14 classes. */
export function unsupportedResult(
  selectedCropKey?: string,
  detectedCropKey?: string,
  status: ResultStatus = "unsupported",
): AnalysisResult {
  return {
    treatment: byKey("unsupported_crop"),
    severity: 0,
    healthScore: 0,
    confidence: 0,
    source: "fallback",
    status,
    alternatives: [],
    ...(selectedCropKey ? { selectedCropKey } : {}),
    ...(detectedCropKey ? { detectedCropKey } : {}),
  };
}

/** Thrown when a real upload needs live AI but no session exists. */
export class AuthRequiredError extends Error {
  constructor() {
    super("auth_required");
    this.name = "AuthRequiredError";
  }
}

/** Turns a boundary-free Google AI diagnosis into a normal result card. */
async function openDiagnosis(
  imageBase64: string,
  cropHint?: string,
): Promise<AnalysisResult | null> {
  try {
    const { diagnosis } = await identifyAnyLeaf({ data: { imageBase64, ...(cropHint ? { cropHint } : {}) } });
    if (!diagnosis) return null;
    const slug = diagnosis.disease.en.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const treatment: Treatment = {
      key: `open_${slug || "diagnosis"}`,
      emoji: diagnosis.healthy ? "🌿" : "🔬",
      crop: diagnosis.crop,
      name: diagnosis.disease,
      severity: diagnosis.severity,
      healthScore: diagnosis.healthy ? 95 : Math.max(2, 100 - diagnosis.severity - 3),
      confidence: Math.round(diagnosis.confidence * 1000) / 10,
      chemical: diagnosis.chemical,
      organic: diagnosis.organic,
      prevention: diagnosis.prevention,
    };
    const confidence = Math.round(diagnosis.confidence * 1000) / 10;
    return {
      treatment,
      confidence,
      severity: treatment.severity,
      healthScore: treatment.healthScore,
      source: "huggingface",
      status: confidence < CONFIDENCE_FLOOR ? "uncertain" : "ok",
      alternatives: [],
      openVocabulary: true,
      sources: diagnosis.sources,
    };
  } catch {
    return null;
  }
}

export async function analyzeImage(
  imageBase64: string,
  opts: {
    demo: boolean;
    cropKey?: string;
    forcedKey?: string;
    onFallback?: () => void;
    onAuthRequired?: () => void;
  },
): Promise<AnalysisResult> {
  const selected = cropByKey(opts.cropKey);

  if (opts.demo) {
    await new Promise((r) => setTimeout(r, 1400));
    return demoResult(opts.forcedKey);
  }

  // Live inference is auth-gated; without a session skip the call so the
  // server function never throws an unhandled 401 into the app shell.
  let signedIn = false;
  try {
    const { data } = await supabase.auth.getSession();
    signedIn = Boolean(data.session);
  } catch {
    signedIn = false;
  }
  if (!signedIn) {
    opts.onAuthRequired?.();
    // Never fabricate a diagnosis for a real photo — a cached sample would
    // show the wrong crop/disease.
    throw new AuthRequiredError();
  }

  // Crops the PlantVillage model has zero classes for (rice, cotton, wheat,
  // sugarcane…) go straight to the boundary-free Google AI pipeline.
  if (selected && !selected.supported) {
    const open = await openDiagnosis(imageBase64, selected.label.en);
    if (open) return { ...open, selectedCropKey: selected.key };
    return unsupportedResult(selected.key);
  }

  try {
    const tiles = await buildImageTiles(imageBase64);
    const res = await Promise.race([
      classifyLeaf({ data: { imageBase64, tiles } }),
      new Promise<null>((r) => setTimeout(() => r(null), LIVE_TIMEOUT_MS)),
    ]);
    if (res?.label) {
      const parsed = parseLabel(res.label);
      const detected = cropByKey(parsed.cropKey);

      // (a) crop outside the model's supported list → open-vocabulary fallback
      // so any crop still gets a real diagnosis.
      if (!detected || !detected.supported) {
        const open = await openDiagnosis(imageBase64, selected?.label.en);
        if (open) {
          return {
            ...open,
            ...(selected ? { selectedCropKey: selected.key } : {}),
            ...(detected ? { detectedCropKey: detected.key } : {}),
          };
        }
        return unsupportedResult(selected?.key, detected?.key ?? undefined);
      }
      // Model detected a different crop than the farmer selected.
      if (selected && detected.key !== selected.key) {
        return unsupportedResult(selected.key, detected.key, "mismatch");
      }

      const built = buildResult(mapLabelToTreatment(res.label), "huggingface", res.score ?? undefined);
      const gap =
        typeof res.score === "number" && typeof res.runnerUpScore === "number"
          ? (res.score - res.runnerUpScore) * 100
          : null;
      // (b) low confidence, or (c) ambiguous top-1 vs top-2.
      const uncertain =
        built.confidence < CONFIDENCE_FLOOR || (gap !== null && gap < AMBIGUITY_GAP);
      return {
        ...built,
        status: uncertain ? "uncertain" : "ok",
        detectedCropKey: detected.key,
        ...(selected ? { selectedCropKey: selected.key } : {}),
      };
    }
  } catch {
    /* network failure — fall through to the cached mapping engine */
  }

  // Closed classifier gave nothing usable — try the open Google pipeline before
  // falling back to a cached sample.
  const open = await openDiagnosis(imageBase64, selected?.label.en);
  if (open) return { ...open, ...(selected ? { selectedCropKey: selected.key } : {}) };

  opts.onFallback?.();
  const cached = demoResult(opts.forcedKey);
  return { ...cached, source: "fallback" };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
