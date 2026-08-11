/**
 * On-device leaf classifier (browser ONNX, no API cost).
 *
 * Runs a PlantVillage fine-tuned MobileNetV2 through transformers.js /
 * onnxruntime-web. It acts as a *first-pass gate*: when it is confident and
 * agrees with the crop the farmer selected, we serve the diagnosis locally and
 * skip the paid vision call entirely. Otherwise the normal AI pipeline runs.
 *
 * The weights (~4 MB quantised) are fetched from the Hugging Face CDN on first
 * use and then cached by the browser, so later scans work offline.
 */

const MODEL_ID = "onnx-community/mobilenet_v2_1.0_224-plant-disease-identification-ONNX";

/** Confidence required to bypass the cloud vision call. */
export const CNN_GATE_THRESHOLD = 0.85;

/** The model's human-readable classes → canonical "Crop___disease" labels. */
const LABEL_MAP: Record<string, string> = {
  "Apple Scab": "Apple___applescab",
  "Apple with Black Rot": "Apple___blackrot",
  "Cedar Apple Rust": "Apple___cedarapplerust",
  "Healthy Apple": "Apple___healthy",
  "Healthy Blueberry Plant": "Blueberry___healthy",
  "Cherry with Powdery Mildew": "Cherry___powderymildew",
  "Healthy Cherry Plant": "Cherry___healthy",
  "Corn (Maize) with Cercospora and Gray Leaf Spot": "Corn___cercosporaleafspotgrayleafspot",
  "Corn (Maize) with Common Rust": "Corn___commonrust",
  "Corn (Maize) with Northern Leaf Blight": "Corn___northernleafblight",
  "Healthy Corn (Maize) Plant": "Corn___healthy",
  "Grape with Black Rot": "Grape___blackrot",
  "Grape with Esca (Black Measles)": "Grape___escablackmeasles",
  "Grape with Isariopsis Leaf Spot": "Grape___leafblightisariopsisleafspot",
  "Healthy Grape Plant": "Grape___healthy",
  "Orange with Citrus Greening": "Orange___haunglongbingcitrusgreening",
  "Peach with Bacterial Spot": "Peach___bacterialspot",
  "Healthy Peach Plant": "Peach___healthy",
  "Bell Pepper with Bacterial Spot": "Pepper___bacterialspot",
  "Healthy Bell Pepper Plant": "Pepper___healthy",
  "Potato with Early Blight": "Potato___earlyblight",
  "Potato with Late Blight": "Potato___lateblight",
  "Healthy Potato Plant": "Potato___healthy",
  "Healthy Raspberry Plant": "Raspberry___healthy",
  "Healthy Soybean Plant": "Soybean___healthy",
  "Squash with Powdery Mildew": "Squash___powderymildew",
  "Strawberry with Leaf Scorch": "Strawberry___leafscorch",
  "Healthy Strawberry Plant": "Strawberry___healthy",
  "Tomato with Bacterial Spot": "Tomato___bacterialspot",
  "Tomato with Early Blight": "Tomato___earlyblight",
  "Tomato with Late Blight": "Tomato___lateblight",
  "Tomato with Leaf Mold": "Tomato___leafmold",
  "Tomato with Septoria Leaf Spot": "Tomato___septorialeafspot",
  "Tomato with Spider Mites or Two-spotted Spider Mite": "Tomato___spidermitestwospottedspidermite",
  "Tomato with Target Spot": "Tomato___targetspot",
  "Tomato Yellow Leaf Curl Virus": "Tomato___tomatoyellowleafcurlvirus",
  "Tomato Mosaic Virus": "Tomato___tomatomosaicvirus",
  "Healthy Tomato Plant": "Tomato___healthy",
};

export type CnnPrediction = { label: string; score: number; runnerUpScore: number };

type ClassifierOutput = { label: string; score: number }[];
type Classifier = (input: string, opts: { top_k: number }) => Promise<ClassifierOutput>;

let classifierPromise: Promise<Classifier | null> | null = null;

/** Loads (and caches) the on-device model. Browser only. */
async function getClassifier(): Promise<Classifier | null> {
  if (typeof window === "undefined") return null;
  if (!classifierPromise) {
    classifierPromise = (async () => {
      try {
        const { pipeline, env } = await import("@huggingface/transformers");
        env.allowLocalModels = false;
        const pipe = await pipeline("image-classification", MODEL_ID, { dtype: "q8" });
        return pipe as unknown as Classifier;
      } catch (err) {
        console.warn("On-device leaf model unavailable", err);
        return null;
      }
    })();
  }
  return classifierPromise;
}

/** Warms the model up in the background so the first real scan is fast. */
export function preloadLeafCnn() {
  void getClassifier();
}

const isHealthy = (label: string) => /healthy/i.test(label);

/**
 * Classifies up to `maxTiles` patches and merges them: a confidently diseased
 * patch beats a healthy full-frame read, matching the cloud pipeline's rule.
 */
export async function classifyOnDevice(
  tiles: string[],
  maxTiles = 3,
): Promise<CnnPrediction | null> {
  const pipe = await getClassifier();
  if (!pipe) return null;

  const inputs = tiles.slice(0, maxTiles);
  const runs: ClassifierOutput[] = [];
  for (const input of inputs) {
    try {
      runs.push(await pipe(input, { top_k: 3 }));
    } catch {
      /* skip an unreadable patch */
    }
  }

  const tops = runs
    .map((r) => r[0])
    .filter((r): r is { label: string; score: number } => Boolean(r?.label))
    .map((r) => ({ label: LABEL_MAP[r.label] ?? "", score: r.score, runnerUp: 0 }))
    .filter((r) => r.label);
  if (tops.length === 0) return null;

  // Runner-up is the best score of any *other* class across all patches.
  const best = [...tops].sort((a, b) => {
    const diseased = Number(!isHealthy(a.label)) - Number(!isHealthy(b.label));
    return diseased !== 0 ? -diseased : b.score - a.score;
  })[0];
  if (!best) return null;

  const others = runs
    .flat()
    .map((r) => ({ label: LABEL_MAP[r.label] ?? "", score: r.score }))
    .filter((r) => r.label && r.label !== best.label)
    .map((r) => r.score);
  const runnerUpScore = others.length ? Math.max(...others) : 0;

  // Agreement across patches keeps a single noisy patch from winning outright.
  const agreeing = tops.filter((t) => t.label === best.label).length;
  const score = best.score * (0.7 + 0.3 * (agreeing / tops.length));

  return { label: best.label, score: Math.min(0.99, score), runnerUpScore };
}