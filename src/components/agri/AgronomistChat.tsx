import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Loader2, Mic, Send, ShieldAlert, ShieldCheck, Square, Trash2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { askAgronomist, type ChatTurn } from "@/lib/agronomist.functions";
import { ChatMarkdown } from "./ChatMarkdown";
import { speak, stopSpeaking, synthesisSupported } from "@/lib/speech";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { listen, speechSupported, type Recognizer } from "@/lib/voice";
import { readScanContext } from "@/lib/scan-context";
import { soilByKey, storedSoil } from "@/lib/soil";
import { plainTextForSpeech } from "@/lib/chat-markdown";
import {
  MAX_QUESTION_LENGTH,
  RATE_LIMIT_MS,
  guardQuestion,
  filterResponse,
} from "@/lib/chat-guard";

export const PILLS = {
  en: [
    "Pesticide Dosage Calculator",
    "Safe Interval Period before Harvest",
    "Organic Alternative",
  ],
  hi: ["कीटनाशक खुराक कैलकुलेटर", "कटाई से पहले सुरक्षित अंतराल", "जैविक विकल्प"],
  mr: ["कीटकनाशक मात्रा कॅल्क्युलेटर", "काढणीपूर्वी सुरक्षित कालावधी", "सेंद्रिय पर्याय"],
} as const;

const TXT = {
  verified: {
    en: "ICAR / KVK Guidelines Verified AI Response",
    hi: "ICAR / KVK दिशानिर्देश सत्यापित AI उत्तर",
    mr: "ICAR / KVK मार्गदर्शक तत्त्वे पडताळलेले AI उत्तर",
  },
  placeholder: {
    en: "Ask the AI agronomist…",
    hi: "AI कृषि विशेषज्ञ से पूछें…",
    mr: "AI कृषी तज्ज्ञांना विचारा…",
  },
  listening: { en: "Listening…", hi: "सुन रहे हैं…", mr: "ऐकत आहोत…" },
  play: { en: "Play Answer", hi: "उत्तर सुनें", mr: "उत्तर ऐका" },
  thinking: { en: "Consulting KVK knowledge…", hi: "KVK ज्ञान से परामर्श…", mr: "KVK ज्ञानाचा सल्ला…" },
  safety: {
    en: "⚠️ Spray during early morning or late evening. Wear protective gear.",
    hi: "⚠️ सुबह जल्दी या देर शाम छिड़काव करें। सुरक्षा उपकरण पहनें।",
    mr: "⚠️ पहाटे किंवा संध्याकाळी फवारणी करा. संरक्षक साधने वापरा.",
  },
  ctx: { en: "Your field context", hi: "आपके खेत का संदर्भ", mr: "तुमच्या शेताचा संदर्भ" },
  betaToggle: {
    en: "Try Hindi/Marathi voice (beta)",
    hi: "हिंदी/मराठी आवाज़ आज़माएँ (बीटा)",
    mr: "हिंदी/मराठी आवाज वापरून पहा (बीटा)",
  },
  betaHint: {
    en: "Voice input is fully supported in English. Hindi and Marathi recognition is experimental — if it fails, we read the answer aloud instead.",
    hi: "आवाज़ इनपुट अंग्रेज़ी में पूरी तरह समर्थित है। हिंदी व मराठी पहचान प्रयोगात्मक है — विफल होने पर हम उत्तर पढ़कर सुनाते हैं।",
    mr: "आवाज इनपुट इंग्रजीत पूर्ण समर्थित आहे. हिंदी व मराठी ओळख प्रायोगिक आहे — अयशस्वी झाल्यास आम्ही उत्तर वाचून दाखवतो.",
  },
  voiceFailed: {
    en: "Voice not recognised — showing the text answer and reading it aloud.",
    hi: "आवाज़ पहचानी नहीं गई — टेक्स्ट उत्तर दिखाकर पढ़ा जा रहा है।",
    mr: "आवाज ओळखला नाही — मजकूर उत्तर दाखवून वाचून दाखवत आहोत.",
  },
  voiceUnsupported: {
    en: "This browser does not support voice input — please type your question.",
    hi: "यह ब्राउज़र आवाज़ इनपुट समर्थित नहीं करता — कृपया सवाल टाइप करें।",
    mr: "हा ब्राउझर आवाज इनपुट समर्थित करत नाही — कृपया प्रश्न टाइप करा.",
  },
  demoSeed: {
    en: "Tomato Early Blight dosage for 1 Acre in Black Cotton Soil",
    hi: "काली मिट्टी में 1 एकड़ के लिए टमाटर अर्ली ब्लाइट की खुराक",
    mr: "काळ्या मातीत १ एकरसाठी टोमॅटो अर्ली ब्लाईट मात्रा",
  },
  micDenied: {
    en: "Microphone permission is blocked. Allow mic access in your browser settings, or type your question.",
    hi: "माइक्रोफ़ोन अनुमति अवरुद्ध है। ब्राउज़र सेटिंग में अनुमति दें, या प्रश्न टाइप करें।",
    mr: "मायक्रोफोन परवानगी अडवली आहे. ब्राउझर सेटिंगमध्ये परवानगी द्या, किंवा प्रश्न टाइप करा.",
  },
  noTts: {
    en: "This browser can't speak aloud — answers are shown as text.",
    hi: "यह ब्राउज़र बोल नहीं सकता — उत्तर टेक्स्ट में दिखाए गए हैं।",
    mr: "हा ब्राउझर बोलू शकत नाही — उत्तरे मजकुरात दाखवली आहेत.",
  },
  errors: {
    rate_limit: {
      en: "Too many requests — please wait a moment.",
      hi: "बहुत अधिक अनुरोध — कृपया रुकें।",
      mr: "खूप विनंत्या — कृपया थोडे थांबा.",
    },
    credits: {
      en: "AI credits exhausted. Please add credits to continue.",
      hi: "AI क्रेडिट समाप्त। जारी रखने हेतु क्रेडिट जोड़ें।",
      mr: "AI क्रेडिट संपले. सुरू ठेवण्यासाठी क्रेडिट जोडा.",
    },
    generic: {
      en: "Could not reach the AI agronomist. Try again.",
      hi: "AI विशेषज्ञ से संपर्क नहीं हो सका। पुनः प्रयास करें।",
      mr: "AI तज्ज्ञांशी संपर्क झाला नाही. पुन्हा प्रयत्न करा.",
    },
    auth: {
      en: "Please sign in to ask AgriMitra — the AI assistant needs an account.",
      hi: "AgriMitra से पूछने के लिए साइन इन करें — AI सहायक के लिए खाता आवश्यक है।",
      mr: "AgriMitra ला विचारण्यासाठी साइन इन करा — AI सहाय्यकासाठी खाते आवश्यक आहे.",
    },
  },
  guard: {
    blocked: {
      en: "That request was blocked for safety. Ask about crops, disease, spraying, soil or weather.",
      hi: "सुरक्षा कारणों से यह अनुरोध रोका गया। फसल, रोग, छिड़काव, मिट्टी या मौसम के बारे में पूछें।",
      mr: "सुरक्षेसाठी ही विनंती रोखली. पीक, रोग, फवारणी, माती किंवा हवामानाबद्दल विचारा.",
    },
    off_topic: {
      en: "I can only answer questions about AgriCure AI — crops, disease, treatment, soil and weather.",
      hi: "मैं केवल AgriCure AI से जुड़े सवालों का उत्तर दे सकता हूँ — फसल, रोग, उपचार, मिट्टी और मौसम।",
      mr: "मी फक्त AgriCure AI संबंधित प्रश्नांची उत्तरे देऊ शकतो — पीक, रोग, उपचार, माती आणि हवामान.",
    },
    too_long: {
      en: `Question is too long — keep it under ${MAX_QUESTION_LENGTH} characters.`,
      hi: `प्रश्न बहुत लंबा है — ${MAX_QUESTION_LENGTH} अक्षरों से कम रखें।`,
      mr: `प्रश्न खूप मोठा आहे — ${MAX_QUESTION_LENGTH} अक्षरांपेक्षा कमी ठेवा.`,
    },
    rate_limited: {
      en: "Please wait 2 seconds between questions.",
      hi: "प्रश्नों के बीच 2 सेकंड रुकें।",
      mr: "प्रश्नांमध्ये 2 सेकंद थांबा.",
    },
    empty: {
      en: "Please type a question.",
      hi: "कृपया प्रश्न लिखें।",
      mr: "कृपया प्रश्न लिहा.",
    },
  },
  settings: {
    voiceIn: { en: "Voice input", hi: "आवाज़ इनपुट", mr: "आवाज इनपुट" },
    voiceOut: { en: "Voice output", hi: "आवाज़ आउटपुट", mr: "आवाज आउटपुट" },
    clear: { en: "Clear history", hi: "इतिहास मिटाएँ", mr: "इतिहास पुसा" },
    protected: {
      en: "Input firewall active",
      hi: "इनपुट फ़ायरवॉल सक्रिय",
      mr: "इनपुट फायरवॉल सक्रिय",
    },
  },
  footer: {
    queries: { en: "Queries", hi: "प्रश्न", mr: "प्रश्न" },
    updated: { en: "Last update", hi: "अंतिम अपडेट", mr: "शेवटचा अपडेट" },
  },
};

export function AgronomistChat({ compact = false }: { compact?: boolean }) {
  const { lang, demo } = useI18n();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<Recognizer | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [fieldCtx, setFieldCtx] = useState("");
  const [betaVoice, setBetaVoice] = useState(false);
  const [sttOk, setSttOk] = useState(false);
  const [ttsOk, setTtsOk] = useState(true);
  const [micDenied, setMicDenied] = useState(false);
  const [voiceIn, setVoiceIn] = useState(true);
  const [voiceOut, setVoiceOut] = useState(true);
  const [queryCount, setQueryCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const lastSentAt = useRef(0);

  // Capability probes run after hydration so SSR markup stays stable.
  useEffect(() => {
    setSttOk(speechSupported());
    setTtsOk(synthesisSupported());
  }, []);

  useEffect(() => {
    const soil = storedSoil();
    setFieldCtx(
      [readScanContext(), soil ? `Soil: ${soilByKey(soil).label[lang]} (pH ${soilByKey(soil).ph})` : ""]
        .filter(Boolean)
        .join(" | "),
    );
  }, [lang]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  useEffect(() => {
    if (demo && input === "") setInput(TXT.demoSeed[lang]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, demo]);

  const send = async (text: string) => {
    if (busy) return;
    const verdict = guardQuestion(text, {
      hasHistory: messages.length > 0,
      lastAt: lastSentAt.current,
    });
    if (!verdict.ok) {
      toast.warning(TXT.guard[verdict.reason][lang]);
      if (verdict.reason !== "rate_limited" && verdict.reason !== "empty") {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: TXT.guard[verdict.reason][lang] },
        ]);
      }
      return;
    }
    const q = verdict.text;
    lastSentAt.current = Date.now();
    setInput("");
    const next: ChatTurn[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setBusy(true);
    setQueryCount((c) => c + 1);
    const soil = storedSoil();
    const context = [
      readScanContext(),
      soil ? `Soil: ${soilByKey(soil).label.en} (pH ${soilByKey(soil).ph})` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        setMessages(messages);
        toast.error(TXT.errors.auth[lang], {
          action: { label: "Sign in", onClick: () => void navigate({ to: "/auth" }) },
        });
        return;
      }
      const res = await askAgronomist({ data: { messages: next, lang, context } });
      if (res.reply) {
        const safe = filterResponse(res.reply);
        setMessages([...next, { role: "assistant", content: safe }]);
        if (voiceOut) play(safe);
      } else {
        const guardKey = res.error as keyof typeof TXT.guard;
        if (guardKey && guardKey in TXT.guard) {
          setMessages([...next, { role: "assistant", content: TXT.guard[guardKey][lang] }]);
          return;
        }
        const e = res.error === "rate_limit" || res.error === "credits" ? res.error : "generic";
        setMessages([
          ...next,
          { role: "assistant", content: TXT.errors[e as keyof typeof TXT.errors][lang] },
        ]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setMessages([
        ...next,
        {
          role: "assistant",
          content: /unauthor/i.test(msg) ? TXT.errors.auth[lang] : TXT.errors.generic[lang],
        },
      ]);
    } finally {
      setBusy(false);
      setLastUpdate(new Date().toLocaleTimeString());
    }
  };

  /** Never leave a failed recognition silent: read the latest answer aloud. */
  const voiceFallback = () => {
    toast.warning(TXT.voiceFailed[lang]);
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (last) play(last.content);
  };

  const toggleMic = async () => {
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    if (!speechSupported()) {
      setSttOk(false);
      toast.warning(TXT.voiceUnsupported[lang]);
      voiceFallback();
      return;
    }
    // Ask for the microphone explicitly so a blocked permission is reported
    // clearly instead of the recogniser ending silently.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicDenied(false);
    } catch {
      setMicDenied(true);
      toast.warning(TXT.micDenied[lang]);
      return;
    }
    // English is the primary supported path; Hindi/Marathi only when beta is on.
    const recLang = lang === "en" || betaVoice ? lang : "en";
    const rec = listen(
      recLang,
      (text) => void send(text),
      () => setRecording(false),
      (code?: string) => {
        if (code === "not-allowed" || code === "service-not-allowed") {
          setMicDenied(true);
          toast.warning(TXT.micDenied[lang]);
          return;
        }
        voiceFallback();
      },
    );
    if (rec) {
      recRef.current = rec;
      setRecording(true);
    } else {
      voiceFallback();
    }
  };

  const play = (text: string) => {
    const plain = plainTextForSpeech(text);
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    if (!synthesisSupported()) {
      setTtsOk(false);
      toast.warning(TXT.noTts[lang]);
      return;
    }
    setSpeaking(true);
    if (!speak(plain, lang, () => setSpeaking(false))) {
      setSpeaking(false);
      toast.warning(TXT.noTts[lang]);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={`min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 ${compact ? "max-h-[46vh]" : "max-h-[52vh]"}`}
      >
        {fieldCtx && (
          <div className="rounded-r-xl border-l-4 border-primary bg-primary/10 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
              {TXT.ctx[lang]}
            </p>
            <p className="text-sm font-semibold leading-relaxed text-forest dark:text-foreground">
              {fieldCtx}
            </p>
          </div>
        )}
        {messages.length === 0 && !busy && (
          <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
            {TXT.placeholder[lang]}
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[92%] rounded-2xl border p-3 text-sm leading-relaxed ${
              m.role === "user" ? "ml-auto bg-primary/10 border-primary/30" : "bg-card"
            }`}
          >
            {m.role === "assistant" ? (
              <>
                <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success">
                  <BadgeCheck className="size-3.5" /> {TXT.verified[lang]}
                </p>
                <ChatMarkdown>{m.content}</ChatMarkdown>
                <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-warning/15 px-3 py-2 text-[11px] font-semibold leading-relaxed text-foreground">
                  <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />
                  {TXT.safety[lang]}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-8 gap-1.5 rounded-full text-[11px]"
                  onClick={() => play(m.content)}
                >
                  {speaking ? <Square className="size-3.5" /> : <Volume2 className="size-3.5" />} 🔊{" "}
                  {TXT.play[lang]}
                </Button>
              </>
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            )}
          </div>
        ))}
        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {TXT.thinking[lang]}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {PILLS[lang].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => void send(p)}
            className="rounded-full border bg-card px-3.5 py-1.5 text-[11px] font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border bg-card px-3 py-2 text-[11px] font-semibold">
        <span className="inline-flex items-center gap-1.5 text-success">
          <ShieldCheck className="size-3.5" /> {TXT.settings.protected[lang]}
        </span>
        <label className="flex items-center gap-1.5">
          <Switch checked={voiceIn} onCheckedChange={setVoiceIn} />
          {TXT.settings.voiceIn[lang]}
        </label>
        <label className="flex items-center gap-1.5">
          <Switch
            checked={voiceOut}
            onCheckedChange={(v) => {
              setVoiceOut(v);
              if (!v) {
                stopSpeaking();
                setSpeaking(false);
              }
            }}
          />
          {TXT.settings.voiceOut[lang]}
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="ml-auto h-7 gap-1.5 rounded-full text-[11px]"
          onClick={() => {
            stopSpeaking();
            setSpeaking(false);
            setMessages([]);
          }}
        >
          <Trash2 className="size-3.5" /> {TXT.settings.clear[lang]}
        </Button>
      </div>

      {lang !== "en" && sttOk && voiceIn && (
        <div className="mt-3 rounded-2xl border bg-card px-3 py-2">
          <label className="flex items-center gap-2 text-xs font-bold">
            <Switch checked={betaVoice} onCheckedChange={setBetaVoice} />
            {TXT.betaToggle[lang]}
          </label>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {TXT.betaHint[lang]}
          </p>
        </div>
      )}

      {(micDenied || !ttsOk) && (
        <p className="mt-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-[11px] font-semibold leading-relaxed">
          {micDenied ? TXT.micDenied[lang] : TXT.noTts[lang]}
        </p>
      )}

      {recording && (
        <div className="mt-3 flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-2">
          <span className="flex items-end gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-1 animate-pulse rounded-full bg-primary"
                style={{ height: `${6 + ((i * 7) % 16)}px`, animationDelay: `${i * 120}ms` }}
              />
            ))}
          </span>
          <span className="text-xs font-bold text-primary">{TXT.listening[lang]}</span>
        </div>
      )}

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={TXT.placeholder[lang]}
          maxLength={MAX_QUESTION_LENGTH}
          className="h-11 bg-card"
        />
        {sttOk && voiceIn && (
          <Button
            type="button"
            variant={recording ? "destructive" : "outline"}
            className={`h-11 w-11 shrink-0 rounded-xl p-0 ${recording ? "" : "border-success text-success"}`}
            onClick={() => void toggleMic()}
            aria-label="Voice input"
          >
            <Mic className="size-5" />
          </Button>
        )}
        <Button type="submit" disabled={busy} className="h-11 gap-1.5 rounded-xl font-bold">
          <Send className="size-4" />
        </Button>
      </form>

      <p className="mt-2 flex flex-wrap items-center gap-x-3 text-[10px] font-semibold text-muted-foreground">
        <span>
          {TXT.footer.queries[lang]}: {queryCount}
        </span>
        <span>
          {input.length}/{MAX_QUESTION_LENGTH}
        </span>
        {lastUpdate && (
          <span>
            {TXT.footer.updated[lang]}: {lastUpdate}
          </span>
        )}
        <span>≤1 req / {RATE_LIMIT_MS / 1000}s</span>
      </p>
    </div>
  );
}
