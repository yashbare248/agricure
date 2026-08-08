export type Recognizer = { stop: () => void };

type SR = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e?: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

const LOCALE = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" } as const;

type ListenOpts = {
  onText: (text: string) => void;
  onInterim?: (text: string) => void;
  onEnd?: () => void;
  onError?: (code?: string) => void;
  /** Keep the mic open for a back-and-forth conversation. */
  continuous?: boolean;
};

/**
 * Recognition against an arbitrary BCP-47 locale, used by the multilingual
 * voice assistant (the `listen` helper below is the legacy en/hi/mr wrapper).
 */
export function listenLocale(locale: string, opts: ListenOpts): Recognizer | null {
  if (!speechSupported()) return null;
  const w = window as unknown as Record<string, new () => SR>;
  const Ctor = w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]!;
  let rec: SR;
  try {
    rec = new Ctor();
  } catch {
    opts.onError?.();
    return null;
  }
  rec.lang = locale;
  rec.interimResults = true;
  rec.continuous = Boolean(opts.continuous);
  let heard = false;
  rec.onresult = (e) => {
    let text = "";
    for (let i = 0; i < e.results.length; i++) text += e.results[i]?.[0]?.transcript ?? "";
    const trimmed = text.trim();
    if (!trimmed) return;
    const final = (e as unknown as { results: ArrayLike<{ isFinal?: boolean }> }).results;
    const isFinal = final[final.length - 1]?.isFinal !== false;
    if (isFinal) {
      heard = true;
      opts.onText(trimmed);
    } else {
      opts.onInterim?.(trimmed);
    }
  };
  rec.onerror = (e) => {
    heard = true; // an error already reported; don't double-report on end
    opts.onError?.(e?.error);
    opts.onEnd?.();
  };
  rec.onend = () => {
    if (!heard) opts.onError?.();
    opts.onEnd?.();
  };
  try {
    rec.start();
  } catch {
    opts.onError?.();
    return null;
  }
  return {
    stop: () => {
      heard = true;
      rec.stop();
    },
  };
}

export function speechSupported() {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w["SpeechRecognition"] || w["webkitSpeechRecognition"]);
}

export function listen(
  lang: "en" | "hi" | "mr",
  onText: (text: string) => void,
  onEnd?: () => void,
  onError?: () => void,
): Recognizer | null {
  if (!speechSupported()) return null;
  const w = window as unknown as Record<string, new () => SR>;
  const Ctor = w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]!;
  let rec: SR;
  try {
    rec = new Ctor();
  } catch {
    onError?.();
    return null;
  }
  rec.lang = LOCALE[lang];
  rec.interimResults = false;
  rec.continuous = false;
  let heard = false;
  rec.onresult = (e) => {
    let text = "";
    for (let i = 0; i < e.results.length; i++) text += e.results[i]?.[0]?.transcript ?? "";
    if (text.trim()) {
      heard = true;
      onText(text.trim());
    }
  };
  rec.onerror = () => {
    onError?.();
    onEnd?.();
  };
  rec.onend = () => {
    if (!heard) onError?.();
    onEnd?.();
  };
  try {
    rec.start();
  } catch {
    onError?.();
    return null;
  }
  return {
    stop: () => {
      heard = true; // manual stop is not a failure
      rec.stop();
    },
  };
}
