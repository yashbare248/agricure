import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bot, Keyboard, Languages, Loader2, Mic, Radio, Send, Square, User, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { speakLocale, stopSpeaking, hasVoiceForLocale, synthesisSupported } from "@/lib/speech";
import { listenLocale, speechSupported, type Recognizer } from "@/lib/voice";
import { askVoiceAssistant, type VoiceTurn } from "@/lib/voice-chat.functions";
import { detectLangFromText, fromUiLang, VOICE_LANGS, voiceLang, type VoiceLangCode } from "@/lib/voice-langs";
import type { AnalysisResult } from "@/lib/analysis";
import { soilByKey, type SoilKey } from "@/lib/soil";

const TXT = {
  title: { en: "Talk to AgriMitra", hi: "AgriMitra से बात करें", mr: "AgriMitra शी बोला" },
  sub: {
    en: "The assistant speaks the diagnosis, then answers your spoken follow-up questions in your own language.",
    hi: "सहायक निदान बोलकर सुनाता है, फिर आपकी भाषा में आपके सवालों का उत्तर देता है।",
    mr: "सहाय्यक निदान बोलून सांगतो व तुमच्या भाषेत प्रश्नांची उत्तरे देतो.",
  },
  startTalk: { en: "Start Conversation", hi: "बातचीत शुरू करें", mr: "संभाषण सुरू करा" },
  hold: { en: "Tap & speak", hi: "टैप करके बोलें", mr: "टॅप करून बोला" },
  listening: { en: "Listening…", hi: "सुन रहे हैं…", mr: "ऐकत आहोत…" },
  thinking: { en: "Thinking…", hi: "सोच रहे हैं…", mr: "विचार करत आहोत…" },
  stop: { en: "Stop", hi: "रोकें", mr: "थांबा" },
  auto: { en: "Auto-detect language", hi: "भाषा स्वतः पहचानें", mr: "भाषा आपोआप ओळखा" },
  detected: { en: "Detected", hi: "पहचानी गई", mr: "ओळखली" },
  noVoice: {
    en: "No installed voice for this language — the reply is shown as text.",
    hi: "इस भाषा के लिए कोई वॉइस नहीं मिली — उत्तर टेक्स्ट में दिखाया गया है।",
    mr: "या भाषेसाठी आवाज उपलब्ध नाही — उत्तर मजकुरात दाखवले आहे.",
  },
  unsupported: {
    en: "This browser does not support voice input — use Chrome on Android or desktop.",
    hi: "यह ब्राउज़र वॉइस इनपुट समर्थित नहीं करता — Chrome उपयोग करें।",
    mr: "हा ब्राउझर आवाज इनपुट समर्थित करत नाही — Chrome वापरा.",
  },
  failed: {
    en: "Could not reach the assistant. Try again.",
    hi: "सहायक से संपर्क नहीं हुआ। पुनः प्रयास करें।",
    mr: "सहाय्यकाशी संपर्क झाला नाही. पुन्हा प्रयत्न करा.",
  },
  notHeard: { en: "Didn't catch that — please speak again.", hi: "सुनाई नहीं दिया — फिर बोलें।", mr: "ऐकू आले नाही — पुन्हा बोला." },
  denied: {
    en: "Microphone permission was blocked. Allow mic access in your browser settings, or type your question below.",
    hi: "माइक्रोफ़ोन अनुमति अवरुद्ध है। ब्राउज़र सेटिंग में अनुमति दें, या नीचे प्रश्न टाइप करें।",
    mr: "मायक्रोफोन परवानगी अडवली आहे. ब्राउझर सेटिंगमध्ये परवानगी द्या, किंवा खाली प्रश्न टाइप करा.",
  },
  noStt: {
    en: "Voice input isn't available in this browser — type your question instead.",
    hi: "इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं — प्रश्न टाइप करें।",
    mr: "या ब्राउझरमध्ये आवाज इनपुट उपलब्ध नाही — प्रश्न टाइप करा.",
  },
  noTts: {
    en: "This browser can't speak aloud — answers are shown as text.",
    hi: "यह ब्राउज़र बोल नहीं सकता — उत्तर टेक्स्ट में दिखाए गए हैं।",
    mr: "हा ब्राउझर बोलू शकत नाही — उत्तरे मजकुरात दाखवली आहेत.",
  },
  typeHere: { en: "Type your question…", hi: "अपना प्रश्न लिखें…", mr: "तुमचा प्रश्न लिहा…" },
  send: { en: "Send", hi: "भेजें", mr: "पाठवा" },
  signIn: {
    en: "Sign in to talk to AgriMitra — the AI assistant needs an account.",
    hi: "AgriMitra से बात करने के लिए साइन इन करें — AI सहायक के लिए खाता आवश्यक है।",
    mr: "AgriMitra शी बोलण्यासाठी साइन इन करा — AI सहाय्यकासाठी खाते आवश्यक आहे.",
  },
};

/** Local opener for the three fully-localised UI languages. */
const OPENER = {
  en: (d: string, s: number) =>
    `I detected ${d} with about ${s} percent severity. Would you like to know the treatment?`,
  hi: (d: string, s: number) =>
    `मैंने ${d} पहचाना है, गंभीरता लगभग ${s} प्रतिशत है। क्या आप उपचार जानना चाहेंगे?`,
  mr: (d: string, s: number) =>
    `मला ${d} आढळला आहे, तीव्रता सुमारे ${s} टक्के आहे. तुम्हाला उपचार जाणून घ्यायचे आहेत का?`,
};

export function VoiceConversation({
  result,
  soil,
  advisoryMessage,
  embedded = false,
}: {
  result: AnalysisResult;
  soil: SoilKey;
  advisoryMessage?: string;
  /** Rendered inside the "Ask AgriMitra" dialog: no card chrome, no title. */
  embedded?: boolean;
}) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [convLang, setConvLang] = useState<VoiceLangCode>(fromUiLang(lang));
  const [autoDetect, setAutoDetect] = useState(true);
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [started, setStarted] = useState(false);
  const [typed, setTyped] = useState("");
  const [sttOk, setSttOk] = useState(true);
  const [ttsOk, setTtsOk] = useState(true);
  const [micDenied, setMicDenied] = useState(false);
  const recRef = useRef<Recognizer | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Capability probes run after hydration so SSR markup stays stable.
  useEffect(() => {
    setSttOk(speechSupported());
    setTtsOk(synthesisSupported());
  }, []);

  const active = voiceLang(convLang);

  const context = [
    `Disease: ${result.treatment.name.en} on ${result.treatment.crop.en}`,
    `severity ${result.severity}%`,
    `health score ${result.healthScore}/100`,
    `AI confidence ${result.confidence}%`,
    `soil ${soilByKey(soil).label.en} (pH ${soilByKey(soil).ph})`,
    result.treatment.chemical.en?.length ? `chemical plan: ${result.treatment.chemical.en.join("; ")}` : "",
    result.treatment.organic.en?.length ? `organic plan: ${result.treatment.organic.en.join("; ")}` : "",
    advisoryMessage ? `weather advisory: ${advisoryMessage}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, busy]);

  // A fresh diagnosis resets the conversation.
  useEffect(() => {
    setTurns([]);
    setStarted(false);
    stopSpeaking();
    setSpeaking(false);
  }, [result.treatment.key, result.severity]);

  useEffect(() => () => {
    recRef.current?.stop();
    stopSpeaking();
  }, []);

  const say = useCallback((text: string, code: VoiceLangCode) => {
    if (!synthesisSupported()) {
      setTtsOk(false);
      setSpeaking(false);
      return;
    }
    stopSpeaking();
    setSpeaking(true);
    const l = voiceLang(code);
    if (!hasVoiceForLocale(l.tts)) toast.info(TXT.noVoice[lang]);
    if (!speakLocale(text, l.tts, () => setSpeaking(false))) setSpeaking(false);
  }, [lang]);

  const ask = useCallback(
    async (userText: string, code: VoiceLangCode, seed?: VoiceTurn[]) => {
      const base = seed ?? turns;
      const next: VoiceTurn[] = [...base, { role: "user", content: userText }];
      setTurns(next);
      setBusy(true);
      try {
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session) {
          toast.error(TXT.signIn[lang], {
            action: { label: "Sign in", onClick: () => void navigate({ to: "/auth" }) },
          });
          setTurns(base);
          return;
        }
        const l = voiceLang(code);
        const res = await askVoiceAssistant({
          data: { messages: next, langName: l.name, langCode: l.code, context },
        });
        if (res.reply) {
          setTurns([...next, { role: "assistant", content: res.reply }]);
          say(res.reply, code);
        } else {
          const guarded =
            res.error === "off_topic"
              ? "I can only answer questions about AgriCure AI — crops, disease, treatment, soil and weather."
              : res.error === "blocked"
                ? "That request was blocked for safety."
                : res.error === "too_long"
                  ? "Question is too long — keep it under 500 characters."
                  : null;
          if (guarded) {
            setTurns([...next, { role: "assistant", content: guarded }]);
            say(guarded, code);
            return;
          }
          toast.error(
            res.error === "credits"
              ? "AI credits exhausted — add credits to continue."
              : res.error === "rate_limit"
                ? "Too many requests — try again in a moment."
                : TXT.failed[lang],
          );
          setTurns(base);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        toast.error(/unauthor/i.test(msg) ? TXT.signIn[lang] : TXT.failed[lang]);
        setTurns(base);
      } finally {
        setBusy(false);
      }
    },
    [turns, context, lang, say, navigate],
  );

  const startConversation = () => {
    setStarted(true);
    const code = convLang;
    const name = result.treatment.name[["en", "hi", "mr"].includes(code) ? (code as "en") : "en"];
    if (code === "en" || code === "hi" || code === "mr") {
      const opener = OPENER[code](name, result.severity);
      setTurns([{ role: "assistant", content: opener }]);
      say(opener, code);
      return;
    }
    // Other languages: let the model produce the opener in that language.
    void ask(
      `Greet me briefly, tell me you detected ${result.treatment.name.en} with ${result.severity} percent severity, and ask if I want the treatment.`,
      code,
      [],
    );
  };

  const toggleMic = () => {
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    if (!speechSupported()) {
      setSttOk(false);
      toast.warning(TXT.unsupported[lang]);
      return;
    }
    stopSpeaking();
    setSpeaking(false);
    setInterim("");
    const rec = listenLocale(active.stt, {
      onInterim: setInterim,
      onText: (text) => {
        setInterim("");
        const code = autoDetect ? detectLangFromText(text, convLang) : convLang;
        if (code !== convLang) setConvLang(code);
        void ask(text, code);
      },
      onEnd: () => {
        setRecording(false);
        setInterim("");
      },
      onError: (code) => {
        if (code === "not-allowed" || code === "service-not-allowed") {
          setMicDenied(true);
          toast.warning(TXT.denied[lang]);
          return;
        }
        toast.warning(TXT.notHeard[lang]);
      },
    });
    if (rec) {
      recRef.current = rec;
      setRecording(true);
    }
  };

  const submitTyped = (e: React.FormEvent) => {
    e.preventDefault();
    const text = typed.trim();
    if (!text || busy) return;
    setTyped("");
    if (!started) setStarted(true);
    const code = autoDetect ? detectLangFromText(text, convLang) : convLang;
    if (code !== convLang) setConvLang(code);
    void ask(text, code);
  };

  return (
    <section className={embedded ? "flex min-h-0 flex-col" : "glass mt-6 rounded-3xl p-4 sm:p-5"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        {embedded ? (
          <span className="sr-only">{TXT.title[lang]}</span>
        ) : (
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-black">
              <Radio className="size-4 text-primary" /> {TXT.title[lang]}
            </h3>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
              {TXT.sub[lang]}
            </p>
          </div>
        )}
        <div className="flex flex-col items-end gap-1.5">
          <label className="flex items-center gap-2 text-xs font-bold">
            <Languages className="size-4 text-primary" />
            <select
              value={convLang}
              onChange={(e) => setConvLang(e.target.value as VoiceLangCode)}
              className="h-9 rounded-xl border bg-card px-2 text-xs font-semibold outline-none focus:border-primary"
              aria-label="Conversation language"
            >
              {VOICE_LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native} · {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <input
              type="checkbox"
              checked={autoDetect}
              onChange={(e) => setAutoDetect(e.target.checked)}
              className="size-3.5 accent-[hsl(var(--primary))]"
            />
            {TXT.auto[lang]}
          </label>
        </div>
      </div>

      {turns.length > 0 && (
        <div
          className={`mt-4 space-y-2.5 overflow-y-auto pr-1 ${
            embedded ? "min-h-0 flex-1" : "max-h-[42vh]"
          }`}
        >
          {turns.map((t, i) => (
            <div
              key={i}
              className={`flex max-w-[92%] gap-2 rounded-2xl border p-3 text-sm leading-relaxed ${
                t.role === "user" ? "ml-auto border-primary/30 bg-primary/10" : "bg-card"
              }`}
            >
              {t.role === "user" ? (
                <User className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <Bot className="mt-0.5 size-4 shrink-0 text-primary" />
              )}
              <div className="min-w-0">
                <p className="whitespace-pre-wrap">{t.content}</p>
                {t.role === "assistant" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 gap-1.5 rounded-full text-[11px]"
                    onClick={() =>
                      speaking ? (stopSpeaking(), setSpeaking(false)) : say(t.content, convLang)
                    }
                  >
                    {speaking ? <Square className="size-3" /> : <Volume2 className="size-3" />}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {interim && (
            <p className="ml-auto max-w-[92%] rounded-2xl border border-dashed p-3 text-sm italic text-muted-foreground">
              {interim}
            </p>
          )}
          {busy && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> {TXT.thinking[lang]}
            </p>
          )}
          <div ref={endRef} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!started ? (
          <Button className="h-11 gap-2 rounded-xl font-bold" onClick={startConversation}>
            <Volume2 className="size-4" /> {TXT.startTalk[lang]}
          </Button>
        ) : sttOk && !micDenied ? (
          <Button
            className="h-11 gap-2 rounded-xl font-bold"
            variant={recording ? "destructive" : "default"}
            onClick={toggleMic}
            disabled={busy}
          >
            <Mic className="size-4" /> {recording ? TXT.listening[lang] : TXT.hold[lang]}
          </Button>
        ) : null}
        {(speaking || recording) && (
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-xl font-bold"
            onClick={() => {
              stopSpeaking();
              setSpeaking(false);
              recRef.current?.stop();
              setRecording(false);
            }}
          >
            <Square className="size-4" /> {TXT.stop[lang]}
          </Button>
        )}
        <span className="text-[11px] font-semibold text-muted-foreground">
          {TXT.detected[lang]}: {active.native}
        </span>
      </div>

      {(!sttOk || micDenied || !ttsOk) && (
        <p className="mt-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-[11px] font-semibold leading-relaxed">
          {micDenied ? TXT.denied[lang] : !sttOk ? TXT.noStt[lang] : TXT.noTts[lang]}
        </p>
      )}

      <form onSubmit={submitTyped} className="mt-3 flex items-center gap-2">
        <Keyboard className="size-4 shrink-0 text-muted-foreground" />
        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={TXT.typeHere[lang]}
          aria-label={TXT.typeHere[lang]}
          className="h-11 rounded-xl text-sm"
        />
        <Button
          type="submit"
          className="h-11 shrink-0 gap-1.5 rounded-xl font-bold"
          disabled={busy || !typed.trim()}
        >
          <Send className="size-4" /> {TXT.send[lang]}
        </Button>
      </form>
    </section>
  );
}
