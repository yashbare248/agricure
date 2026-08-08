/**
 * Conversation languages for the live voice assistant.
 *
 * The app UI stays in English/Hindi/Marathi, but the two-way voice assistant
 * can listen and reply in any of these languages. `stt` is the BCP-47 tag we
 * hand to SpeechRecognition, `tts` the tag we ask SpeechSynthesis for.
 */
export type VoiceLangCode =
  | "en" | "hi" | "mr" | "ta" | "te" | "gu" | "pa" | "bn" | "kn" | "ml" | "or" | "as" | "ur";

export type VoiceLang = {
  code: VoiceLangCode;
  /** English name, used in prompts. */
  name: string;
  /** Native label, used in the picker. */
  native: string;
  stt: string;
  tts: string;
  /** Unicode script range used to auto-detect this language from a transcript. */
  script?: RegExp;
};

export const VOICE_LANGS: VoiceLang[] = [
  { code: "en", name: "English", native: "English", stt: "en-IN", tts: "en-IN" },
  { code: "hi", name: "Hindi", native: "हिंदी", stt: "hi-IN", tts: "hi-IN", script: /[\u0900-\u097F]/ },
  { code: "mr", name: "Marathi", native: "मराठी", stt: "mr-IN", tts: "mr-IN", script: /[\u0900-\u097F]/ },
  { code: "ta", name: "Tamil", native: "தமிழ்", stt: "ta-IN", tts: "ta-IN", script: /[\u0B80-\u0BFF]/ },
  { code: "te", name: "Telugu", native: "తెలుగు", stt: "te-IN", tts: "te-IN", script: /[\u0C00-\u0C7F]/ },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", stt: "kn-IN", tts: "kn-IN", script: /[\u0C80-\u0CFF]/ },
  { code: "ml", name: "Malayalam", native: "മലയാളം", stt: "ml-IN", tts: "ml-IN", script: /[\u0D00-\u0D7F]/ },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", stt: "gu-IN", tts: "gu-IN", script: /[\u0A80-\u0AFF]/ },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", stt: "pa-IN", tts: "pa-IN", script: /[\u0A00-\u0A7F]/ },
  { code: "bn", name: "Bengali", native: "বাংলা", stt: "bn-IN", tts: "bn-IN", script: /[\u0980-\u09FF]/ },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", stt: "or-IN", tts: "or-IN", script: /[\u0B00-\u0B7F]/ },
  { code: "as", name: "Assamese", native: "অসমীয়া", stt: "as-IN", tts: "as-IN", script: /[\u0980-\u09FF]/ },
  { code: "ur", name: "Urdu", native: "اردو", stt: "ur-IN", tts: "ur-IN", script: /[\u0600-\u06FF]/ },
];

export const VOICE_LANG_BY_CODE = Object.fromEntries(
  VOICE_LANGS.map((l) => [l.code, l]),
) as Record<VoiceLangCode, VoiceLang>;

export function voiceLang(code: string | undefined): VoiceLang {
  return VOICE_LANG_BY_CODE[(code ?? "en") as VoiceLangCode] ?? VOICE_LANG_BY_CODE.en;
}

/** UI language (en/hi/mr) → conversation language. */
export function fromUiLang(lang: string): VoiceLangCode {
  return (["en", "hi", "mr"].includes(lang) ? lang : "en") as VoiceLangCode;
}

/**
 * Best-effort language detection from a spoken transcript.
 *
 * SpeechRecognition never reports which language it heard, so we detect the
 * script instead. Devanagari and Bengali scripts are shared, so we keep the
 * currently active language when it already uses that script.
 */
export function detectLangFromText(text: string, current: VoiceLangCode): VoiceLangCode {
  const t = text.trim();
  if (!t) return current;
  const scripted = VOICE_LANGS.filter((l) => l.script && l.script.test(t));
  if (!scripted.length) {
    // Latin script → English, unless the active language is romanised-friendly.
    return /[A-Za-z]/.test(t) ? "en" : current;
  }
  if (scripted.some((l) => l.code === current)) return current;
  return scripted[0]!.code;
}
