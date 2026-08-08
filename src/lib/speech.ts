import { SPEECH_LOCALE } from "./i18n";
import type { Lang } from "./treatments";

/* ---------- voice loading ---------- */

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const v = window.speechSynthesis.getVoices();
  if (v.length) cachedVoices = v;
  return cachedVoices;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", () => loadVoices());
}

/** Prefer natural/neural cloud voices over robotic compact ones. */
function score(v: SpeechSynthesisVoice) {
  const n = v.name.toLowerCase();
  let s = 0;
  if (/neural|natural|wavenet|premium|enhanced/.test(n)) s += 4;
  if (/google/.test(n)) s += 3;
  if (/microsoft/.test(n)) s += 2;
  if (/aarohi|manohar|swara|madhur|dhwani|kabir/.test(n)) s += 2; // Indian voice names
  if (/compact|eloquence|espeak/.test(n)) s -= 3;
  if (!v.localService) s += 1;
  return s;
}

function pick(pred: (v: SpeechSynthesisVoice) => boolean) {
  const list = loadVoices().filter(pred);
  if (!list.length) return undefined;
  return list.slice().sort((a, b) => score(b) - score(a))[0];
}

export function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const locale = SPEECH_LOCALE[lang];
  const base = locale.split("-")[0]!;
  if (lang === "mr") {
    return (
      pick((v) => v.lang.replace("_", "-").toLowerCase() === "mr-in") ??
      pick((v) => v.lang.toLowerCase().startsWith("mr")) ??
      // Marathi voices are rare. Hindi shares Devanagari and reads Marathi
      // text intelligibly; Indian English is the last resort.
      pick((v) => v.lang.toLowerCase().startsWith("hi")) ??
      pick((v) => v.lang.replace("_", "-").toLowerCase() === "en-in")
    );
  }
  return (
    pick((v) => v.lang.replace("_", "-").toLowerCase() === locale.toLowerCase()) ??
    pick((v) => v.lang.toLowerCase().startsWith(base)) ??
    (lang === "hi" ? pick((v) => v.lang.replace("_", "-").toLowerCase() === "en-in") : undefined)
  );
}

/* ---------- text shaping ---------- */

const DEVANAGARI_DIGITS: Record<string, string> = {
  "0": "शून्य", "1": "एक", "2": "दोन", "3": "तीन", "4": "चार",
  "5": "पाच", "6": "सहा", "7": "सात", "8": "आठ", "9": "नऊ",
};

/**
 * Marathi TTS (usually rendered by a Hindi voice) mangles Latin symbols and
 * abbreviations. Rewrite them into Devanagari words so the narration flows.
 */
function shapeMarathi(text: string) {
  return text
    .replace(/\bKVK\b/g, "कृषी विज्ञान केंद्र")
    .replace(/(\d)\s*%/g, "$1 टक्के")
    .replace(/%/g, " टक्के ")
    .replace(/(\d)\s*°\s*C/gi, "$1 अंश सेल्सिअस")
    .replace(/(\d)\s*ml\/?L?/gi, "$1 मिलिलिटर प्रति लिटर")
    .replace(/(\d)\s*g\/?L?\b/gi, "$1 ग्रॅम प्रति लिटर")
    .replace(/(\d)\s*kg\b/gi, "$1 किलो")
    .replace(/(\d)\s*(l|ltr|litre|liter)\b/gi, "$1 लिटर")
    .replace(/\bkm\/?h\b/gi, "किलोमीटर प्रति तास")
    .replace(/\bkm\b/gi, "किलोमीटर")
    .replace(/₹\s*(\d)/g, "$1 रुपये")
    .replace(/\bAI\b/g, "ए आय")
    .replace(/\b(\d+)\b/g, (m) => m.split("").map((d) => DEVANAGARI_DIGITS[d] ?? d).join(" "))
    .replace(/[*_#`~>|]/g, " ");
}

function shapeCommon(text: string) {
  return text
    // strip emoji / pictographs which some engines read out literally
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, " ")
    .replace(/[*_#`~>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function shapeForSpeech(text: string, lang: Lang) {
  const t = lang === "mr" ? shapeMarathi(text) : text;
  return shapeCommon(t);
}

/**
 * Chrome truncates long utterances (~200-300 chars) and stalls after ~15s.
 * Split on sentence boundaries and queue the pieces.
 */
function chunk(text: string, max = 180): string[] {
  const sentences = text.match(/[^।.!?]+[।.!?]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (s.length > max) {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
      const words = s.split(/\s+/);
      let buf = "";
      for (const w of words) {
        if ((buf + " " + w).length > max) {
          if (buf.trim()) out.push(buf.trim());
          buf = w;
        } else buf = buf ? `${buf} ${w}` : w;
      }
      if (buf.trim()) out.push(buf.trim());
      continue;
    }
    if (cur && (cur + s).length > max) {
      out.push(cur.trim());
      cur = s;
    } else cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

/* ---------- playback ---------- */

let keepAlive: ReturnType<typeof setInterval> | null = null;
let token = 0;

function stopKeepAlive() {
  if (keepAlive) {
    clearInterval(keepAlive);
    keepAlive = null;
  }
}

export function speak(text: string, lang: Lang, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  stopKeepAlive();

  const spoken = shapeForSpeech(text, lang);
  if (!spoken) return false;

  const pieces = chunk(spoken);
  const myToken = ++token;
  let index = 0;

  const finish = () => {
    stopKeepAlive();
    onEnd?.();
  };

  const next = () => {
    if (myToken !== token) return;
    if (index >= pieces.length) return finish();
    const utter = new SpeechSynthesisUtterance(pieces[index]!);
    index += 1;
    // Resolve late: voices can finish loading after the first call.
    const voice = pickVoice(lang);
    if (voice) utter.voice = voice;
    utter.lang =
      lang === "mr" && voice && !voice.lang.toLowerCase().startsWith("mr")
        ? voice.lang
        : SPEECH_LOCALE[lang];
    // Devanagari narration is denser; slow it down a little more for Marathi.
    utter.rate = lang === "mr" ? 0.82 : lang === "hi" ? 0.88 : 0.95;
    utter.pitch = lang === "mr" ? 1.02 : 1;
    utter.volume = 1;
    utter.onend = () => next();
    utter.onerror = () => {
      if (myToken !== token) return;
      // Skip the failed chunk rather than killing the whole narration.
      if (index < pieces.length) next();
      else finish();
    };
    synth.speak(utter);
  };

  // Chrome pauses synthesis on long queues; nudge it periodically.
  keepAlive = setInterval(() => {
    if (myToken !== token || !synth.speaking) return;
    synth.pause();
    synth.resume();
  }, 9000);

  // Voices may not be ready on the very first call.
  if (!loadVoices().length) {
    setTimeout(next, 250);
  } else {
    next();
  }
  return true;
}

export function stopSpeaking() {
  token += 1;
  stopKeepAlive();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/** True when a real Marathi voice exists on this device. */
export function hasMarathiVoice() {
  return loadVoices().some((v) => v.lang.toLowerCase().startsWith("mr"));
}

/** True when this browser can speak at all (SpeechSynthesis present with voices). */
export function synthesisSupported() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  return typeof window.SpeechSynthesisUtterance === "function";
}

/* ---------- arbitrary-locale playback (multilingual voice assistant) ---------- */

/** Best available voice for a BCP-47 tag, falling back to the base language, then Indian English. */
export function pickVoiceForLocale(locale: string): SpeechSynthesisVoice | undefined {
  const want = locale.replace("_", "-").toLowerCase();
  const base = want.split("-")[0]!;
  return (
    pick((v) => v.lang.replace("_", "-").toLowerCase() === want) ??
    pick((v) => v.lang.toLowerCase().startsWith(base)) ??
    pick((v) => v.lang.replace("_", "-").toLowerCase() === "en-in")
  );
}

/** True when the device can actually voice this locale (not just fall back to English). */
export function hasVoiceForLocale(locale: string) {
  const base = locale.split("-")[0]!.toLowerCase();
  return loadVoices().some((v) => v.lang.toLowerCase().startsWith(base));
}

/**
 * Speak text in any locale. Same chunking/keep-alive machinery as `speak`,
 * but without the Marathi-specific text shaping.
 */
export function speakLocale(text: string, locale: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  stopKeepAlive();

  const spoken = shapeCommon(text);
  if (!spoken) return false;

  const pieces = chunk(spoken);
  const myToken = ++token;
  let index = 0;

  const finish = () => {
    stopKeepAlive();
    onEnd?.();
  };

  const next = () => {
    if (myToken !== token) return;
    if (index >= pieces.length) return finish();
    const utter = new SpeechSynthesisUtterance(pieces[index]!);
    index += 1;
    const voice = pickVoiceForLocale(locale);
    if (voice) utter.voice = voice;
    utter.lang = voice && !hasVoiceForLocale(locale) ? voice.lang : locale;
    utter.rate = locale.startsWith("en") ? 0.95 : 0.86;
    utter.volume = 1;
    utter.onend = () => next();
    utter.onerror = () => {
      if (myToken !== token) return;
      if (index < pieces.length) next();
      else finish();
    };
    synth.speak(utter);
  };

  keepAlive = setInterval(() => {
    if (myToken !== token || !synth.speaking) return;
    synth.pause();
    synth.resume();
  }, 9000);

  if (!loadVoices().length) setTimeout(next, 250);
  else next();
  return true;
}
