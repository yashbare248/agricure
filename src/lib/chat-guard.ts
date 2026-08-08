/**
 * Firewall for the AgriMitra assistant.
 *
 * Runs on the client (fast feedback) and again on the server (real
 * enforcement) so a crafted request can't bypass it.
 */

export const MAX_QUESTION_LENGTH = 500;
/** Minimum gap between two accepted questions. */
export const RATE_LIMIT_MS = 2000;

export type GuardVerdict =
  | { ok: true; text: string }
  | { ok: false; reason: "empty" | "too_long" | "blocked" | "off_topic" | "rate_limited" };

/** Injection / destructive / credential-probing patterns. */
const BLOCK_PATTERNS: RegExp[] = [
  /\bdrop\s+table\b/i,
  /\btruncate\s+table\b/i,
  /\bdelete\s+from\b/i,
  /\bupdate\s+\w+\s+set\b/i,
  /\bunion\s+select\b/i,
  /\bselect\b[\s\S]*\bfrom\b/i,
  /\brm\s+-rf\b/i,
  /\b(sudo|chmod|curl|wget|ssh)\b\s+\S/i,
  /<\s*script/i,
  /javascript\s*:/i,
  /\bon(error|load|click)\s*=/i,
  /\b(api[\s_-]?key|secret[\s_-]?key|service[\s_-]?role|access[\s_-]?token|bearer\s+ey)\b/i,
  /\b(password|passwd|credential|private key)\b/i,
  /\b(env|dotenv|process\.env|\.env)\b/i,
  /\b(supabase|postgres|psql|database dump|db dump|schema dump)\b/i,
  /\bshow me the (database|db|tables|schema|users)\b/i,
  /\bignore (all |your |previous )?(prior |previous )?instructions\b/i,
  /\b(system prompt|jailbreak|developer mode)\b/i,
  /(\.\.\/){2,}|\/etc\/passwd|~\/\.ssh/i,
];

/** Topics the assistant is allowed to discuss (EN + Devanagari cues). */
const TOPIC_KEYWORDS = [
  "crop", "leaf", "leaves", "plant", "disease", "blight", "rust", "mildew", "rot", "spot",
  "pest", "insect", "fungus", "fungal", "bacteria", "virus", "weed", "pesticide", "fungicide",
  "insecticide", "spray", "dose", "dosage", "ml", "litre", "liter", "acre", "hectare",
  "fertilizer", "fertiliser", "urea", "npk", "compost", "manure", "organic", "neem",
  "soil", "ph", "irrigation", "water", "drip", "monsoon", "rain", "weather", "humidity",
  "temperature", "wind", "aqi", "air quality", "harvest", "sowing", "seed", "yield",
  "market", "price", "mandi", "scheme", "subsidy", "kisan", "kvk", "icar", "farm", "farmer",
  "agri", "agriculture", "horticulture", "tomato", "potato", "grape", "corn", "maize",
  "rice", "paddy", "wheat", "cotton", "onion", "sugarcane", "soybean", "chilli", "apple",
  "pepper", "banana", "mango", "pomegranate", "interval", "phi", "safety", "protective",
  "agricure", "agrimitra", "scan", "diagnosis", "health score", "treatment", "remedy",
  // Hindi / Marathi cues
  "फसल", "पीक", "पान", "रोग", "किड", "कीट", "कीटनाशक", "बुरशी", "फवारणी", "छिड़काव",
  "खत", "खाद", "माती", "मिट्टी", "पाणी", "पानी", "हवामान", "मौसम", "उपचार", "मात्रा",
  "खुराक", "एकड़", "एकर", "बाजार", "भाव", "योजना", "शेती", "खेती", "टमाटर", "टोमॅटो",
  "द्राक्ष", "अंगूर", "गहू", "गेहूं", "कापूस", "कपास", "कांदा", "प्याज",
];

/** Removes control chars, tags and stray injection punctuation. */
export function sanitizeQuestion(raw: string): string {
  return String(raw ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>{}[\]\\^`|]/g, " ")
    .replace(/[;$]+/g, " ")
    .replace(/--+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isOnTopic(text: string, hasHistory: boolean): boolean {
  const t = text.toLowerCase();
  if (TOPIC_KEYWORDS.some((k) => t.includes(k))) return true;
  // Plain greetings / small talk are always welcome — the assistant answers
  // warmly and asks which crop leaf or disease it should help with.
  if (isGreeting(text)) return true;
  // Short conversational follow-ups ("and after that?", "how much?") are fine
  // once a topical thread already exists.
  if (hasHistory && t.split(/\s+/).length <= 8) return true;
  return false;
}

/** Greetings and light small talk in EN / HI / MR and common Indian scripts. */
const GREETING_PATTERNS: RegExp[] = [
  /^(hi+|hey+|hello+|yo|hii+)\b/i,
  /\b(good\s+(morning|afternoon|evening|day)|how are you|how're you|what'?s up|whats up)\b/i,
  /\b(namaste|namaskar|namaskaar|ram ram|salaam|assalam|vanakkam|sat sri akal)\b/i,
  /\b(thanks|thank you|thank u|ok(ay)?|bye|goodbye|see you|nice to meet)\b/i,
  /\b(who are you|what can you do|what do you do|help me|can you help|introduce yourself)\b/i,
  /(नमस्ते|नमस्कार|राम राम|कैसे हो|कसे आहात|धन्यवाद|शुक्रिया|आभारी|हॅलो|हैलो|मदद|मदत|तुम्ही कोण|आप कौन)/,
];

export function isGreeting(text: string): boolean {
  const t = String(text ?? "").trim();
  if (!t) return false;
  // Only treat short utterances as pure small talk.
  if (t.split(/\s+/).length > 10) return false;
  return GREETING_PATTERNS.some((re) => re.test(t));
}

/** Full input firewall. `lastAt` is the timestamp of the previous accepted question. */
export function guardQuestion(
  raw: string,
  opts: { hasHistory?: boolean; lastAt?: number; now?: number } = {},
): GuardVerdict {
  const now = opts.now ?? Date.now();
  if (opts.lastAt && now - opts.lastAt < RATE_LIMIT_MS) return { ok: false, reason: "rate_limited" };

  const original = String(raw ?? "");
  if (original.length > MAX_QUESTION_LENGTH) return { ok: false, reason: "too_long" };
  if (BLOCK_PATTERNS.some((re) => re.test(original))) return { ok: false, reason: "blocked" };

  const text = sanitizeQuestion(original);
  if (!text) return { ok: false, reason: "empty" };
  if (BLOCK_PATTERNS.some((re) => re.test(text))) return { ok: false, reason: "blocked" };
  if (!isOnTopic(text, Boolean(opts.hasHistory))) return { ok: false, reason: "off_topic" };

  return { ok: true, text };
}

/** Redacts anything key/credential/path shaped before an answer is shown. */
export function filterResponse(text: string): string {
  return String(text ?? "")
    .replace(/\b(sb_(?:publishable|secret)_[A-Za-z0-9_-]{6,})/g, "[redacted]")
    .replace(/\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, "[redacted]")
    .replace(/\b(sk|pk|api)[-_][A-Za-z0-9]{16,}/gi, "[redacted]")
    .replace(/\bhttps?:\/\/[a-z0-9-]+\.supabase\.co\S*/gi, "[redacted]")
    .replace(/\b(?:\/(?:home|etc|var|root|usr)|[A-Z]:\\)[^\s"']*/g, "[redacted]")
    .replace(/\bprocess\.env\.[A-Z0-9_]+/g, "[redacted]");
}