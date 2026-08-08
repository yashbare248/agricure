import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  BadgeCheck,
  Camera,
  FlaskConical,
  HelpCircle,
  Leaf,
  AlertTriangle,
  ShieldCheck,
  ShoppingBag,
  Volume2,
  Square,
  QrCode,
  Zap,
} from "lucide-react";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HealthGauge } from "./HealthGauge";
import { useI18n } from "@/lib/i18n";
import { speak, stopSpeaking } from "@/lib/speech";
import { buildNarration } from "@/lib/narration";
import { advisoryFor, type Advisory } from "@/lib/weather";
import { marketInfo, categoryLabel } from "@/lib/market";
import { soilByKey, type SoilKey } from "@/lib/soil";
import type { AnalysisResult } from "@/lib/analysis";
import { cropByKey, supportedCropList } from "@/lib/plantvillage";

const STATUS_STYLE: Record<string, string> = {
  postpone: "border-danger/40 bg-danger/10 text-danger",
  caution: "border-warning/50 bg-warning/15 text-accent-foreground",
  go: "border-success/40 bg-success/10 text-success",
};

const CONFIDENCE_FLOOR = 60;

const TXT = {
  howTitle: { en: "How this works", hi: "यह कैसे काम करता है", mr: "हे कसे चालते" },
  howBody: {
    en: "This diagnosis uses a pretrained computer vision model (MobileNetV2/ResNet50 architecture, trained on the PlantVillage dataset) combined with our own treatment-mapping logic for soil type, severity, and regional context. This model currently supports 14 crop types trained on the PlantVillage dataset.",
    hi: "यह निदान एक पूर्व-प्रशिक्षित कंप्यूटर विज़न मॉडल (MobileNetV2/ResNet50, PlantVillage डेटासेट पर प्रशिक्षित) और मिट्टी, गंभीरता व क्षेत्रीय संदर्भ हेतु हमारी उपचार-मैपिंग लॉजिक से बनता है। यह मॉडल फ़िलहाल PlantVillage डेटासेट की 14 फसलों को ही पहचानता है।",
    mr: "हे निदान पूर्व-प्रशिक्षित संगणक दृष्टी मॉडेल (MobileNetV2/ResNet50, PlantVillage डेटासेटवर प्रशिक्षित) आणि माती, तीव्रता व प्रादेशिक संदर्भासाठी आमच्या उपचार-मॅपिंग लॉजिकच्या संयोगातून तयार होते. हे मॉडेल सध्या PlantVillage डेटासेटमधील १४ पिकेच ओळखते.",
  },
  howCrops: { en: "Supported crops", hi: "समर्थित फसलें", mr: "समर्थित पिके" },
  howUnsupported: {
    en: "Rice, Cotton, Sugarcane and Wheat are not yet supported and will show as unrecognised.",
    hi: "धान, कपास, गन्ना व गेहूँ अभी समर्थित नहीं हैं और अपरिचित के रूप में दिखेंगे।",
    mr: "भात, कापूस, ऊस व गहू अद्याप समर्थित नाहीत आणि अनोळखी म्हणून दाखवले जातील.",
  },
  howNote: {
    en: "We do not train our own model — accuracy depends on the public dataset, so always confirm serious cases with an agricultural officer.",
    hi: "हम अपना मॉडल प्रशिक्षित नहीं करते — सटीकता सार्वजनिक डेटासेट पर निर्भर है, गंभीर मामलों में कृषि अधिकारी से पुष्टि करें।",
    mr: "आम्ही स्वतःचे मॉडेल प्रशिक्षित करत नाही — अचूकता सार्वजनिक डेटासेटवर अवलंबून आहे, गंभीर बाबतीत कृषी अधिकाऱ्याची खात्री घ्या.",
  },
  uncertain: { en: "Uncertain Diagnosis", hi: "अनिश्चित निदान", mr: "अनिश्चित निदान" },
  uncertainMsg: {
    en: "Confidence too low for a reliable recommendation — consult your local KVK office or agricultural officer.",
    hi: "भरोसेमंद सिफ़ारिश हेतु सटीकता बहुत कम — अपने स्थानीय KVK कार्यालय या कृषि अधिकारी से संपर्क करें।",
    mr: "विश्वासार्ह शिफारशीसाठी अचूकता खूप कमी — तुमच्या स्थानिक KVK कार्यालयाशी किंवा कृषी अधिकाऱ्याशी संपर्क साधा.",
  },
  unsupported: {
    en: "Crop Not Yet Supported",
    hi: "यह फसल अभी समर्थित नहीं",
    mr: "हे पीक अद्याप समर्थित नाही",
  },
  mismatch: { en: "Crop Mismatch", hi: "फसल मेल नहीं खाती", mr: "पीक जुळत नाही" },
  possible: { en: "Top 2 possible diseases", hi: "2 संभावित रोग", mr: "२ संभाव्य रोग" },
  retake: { en: "Retake Photo", hi: "फिर से फोटो लें", mr: "पुन्हा फोटो काढा" },
  retakeHint: {
    en: "Take a sharp, well-lit close-up of a single affected leaf against a plain background.",
    hi: "एक प्रभावित पत्ती की साफ़, अच्छी रोशनी वाली नज़दीकी फोटो सादे बैकग्राउंड पर लें।",
    mr: "एका बाधित पानाचा स्पष्ट, चांगल्या प्रकाशातील जवळून फोटो साध्या पार्श्वभूमीवर काढा.",
  },
  suggestTitle: {
    en: "This looks like a different crop",
    hi: "यह कोई और फसल लगती है",
    mr: "हे वेगळे पीक दिसते",
  },
  suggestBody: {
    en: "Our AI thinks the photo shows",
    hi: "हमारे AI के अनुसार फोटो में है",
    mr: "आमच्या AI नुसार फोटोत आहे",
  },
  suggestCta: { en: "Use this crop & re-analyze", hi: "यही फसल चुनकर दोबारा जाँचें", mr: "हेच पीक निवडून पुन्हा तपासा" },
};

function StatBar({ value, tone }: { value: number; tone: "severity" | "confidence" }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const color =
    tone === "severity"
      ? value >= 60
        ? "bg-danger"
        : value >= 25
          ? "bg-warning"
          : "bg-success"
      : value >= 90
        ? "bg-success"
        : value >= 70
          ? "bg-warning"
          : "bg-danger";

  return (
    <div
      className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${color} shadow-[0_0_12px_-2px_currentColor] transition-[width] duration-[1200ms] ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function ResultsPanel({
  result,
  qrValue,
  advisory: liveAdvisory,
  liveWeather = false,
  soil,
  onRetake,
  onUseDetectedCrop,
}: {
  result: AnalysisResult;
  qrValue?: string;
  advisory?: Advisory | null;
  liveWeather?: boolean;
  soil?: SoilKey;
  onRetake?: () => void;
  onUseDetectedCrop?: (cropKey: string) => void;
}) {
  const { t, lang } = useI18n();
  const [speaking, setSpeaking] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const { treatment, severity, healthScore, confidence } = result;
  const advisory = liveAdvisory ?? advisoryFor(treatment.key);
  const status = result.status ?? (confidence < CONFIDENCE_FLOOR ? "uncertain" : "ok");
  const warn = status !== "ok";
  const candidates = [treatment, ...(result.alternatives ?? [])].slice(0, 2);
  const selectedCrop = cropByKey(result.selectedCropKey);
  const detectedCrop = cropByKey(result.detectedCropKey);

  const warnTitle =
    status === "mismatch"
      ? TXT.mismatch[lang]
      : status === "unsupported"
        ? TXT.unsupported[lang]
        : TXT.uncertain[lang];

  const warnMessage =
    status === "mismatch"
      ? lang === "hi"
        ? `आपने ${selectedCrop?.label.hi ?? "-"} चुना, पर हमारा AI मॉडल फ़िलहाल ${detectedCrop?.label.hi ?? "-"}-वर्ग की फसलें ही भरोसे से पहचानता है। यह मॉडल अभी ${selectedCrop?.label.hi ?? "इस फसल"} का निदान नहीं करता।`
        : lang === "mr"
          ? `तुम्ही ${selectedCrop?.label.mr ?? "-"} निवडले, पण आमचे AI मॉडेल सध्या ${detectedCrop?.label.mr ?? "-"}-गटातील पिकेच विश्वासाने ओळखते. हे मॉडेल अद्याप ${selectedCrop?.label.mr ?? "या पिकाचे"} निदान करत नाही.`
          : `You selected ${selectedCrop?.label.en ?? "this crop"} but our AI model currently only recognises ${detectedCrop?.label.en ?? "other"}-family crops reliably. This model doesn't yet support ${selectedCrop?.label.en ?? "this crop"} diagnosis.`
      : status === "unsupported"
        ? lang === "hi"
          ? `हमारा वर्तमान AI मॉडल इस फसल को नहीं पहचानता। अपने स्थानीय KVK कार्यालय से सलाह लें या इनमें से किसी फसल के साथ पुनः प्रयास करें: ${supportedCropList("hi")}।`
          : lang === "mr"
            ? `आमचे सध्याचे AI मॉडेल हे पीक ओळखत नाही. स्थानिक KVK कार्यालयाचा सल्ला घ्या किंवा यापैकी एका पिकासह पुन्हा प्रयत्न करा: ${supportedCropList("mr")}.`
            : `Our current AI model doesn't recognise this crop. Consult your local KVK office, or try again with one of the supported crops: ${supportedCropList("en")}.`
        : TXT.uncertainMsg[lang];

  const spokenText = buildNarration({
    treatment,
    severity,
    healthScore,
    confidence,
    advisoryMessage: advisory.message[lang],
    lang,
    status,
    warnTitle,
    warnMessage,
  });

  const toggleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    const ok = speak(spokenText, lang, () => setSpeaking(false));
    if (!ok) setSpeaking(false);
  };

  const tabs = [
    { v: "chemical", icon: FlaskConical, label: t("chemical"), items: treatment.chemical[lang] },
    { v: "organic", icon: Leaf, label: t("organic"), items: treatment.organic[lang] },
    { v: "prevention", icon: ShieldCheck, label: t("prevention"), items: treatment.prevention[lang] },
  ];

  return (
    <div className="rise-in space-y-4">
      <div className="glass grid gap-6 rounded-3xl p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-6">
        <div className="flex flex-col items-center">
          {warn ? (
            <span className="grid size-28 place-items-center rounded-full border-2 border-warning bg-warning/15 text-4xl">
              <AlertTriangle className="size-10 text-warning" />
            </span>
          ) : (
            <HealthGauge score={healthScore} />
          )}
          <button
            type="button"
            onClick={() => setHowOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-[11px] font-bold text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <HelpCircle className="size-3.5" /> {TXT.howTitle[lang]}
          </button>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("diagnosis")}
          </p>
          <h2 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">
            <span className="mr-2">{treatment.emoji}</span>
            {treatment.name[lang]}
          </h2>
          <p className="text-sm text-muted-foreground">
            {treatment.crop[lang]} · {treatment.name.en}
          </p>
          {result.openVocabulary && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">
                Google AI · any crop
              </span>
              {result.sources?.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-primary"
                >
                  {s.title}
                </a>
              ))}
            </p>
          )}

          {!warn && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-card p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground">
                <Activity className="size-3.5" /> {t("severityLabel")}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums">{severity}%</p>
              <StatBar value={severity} tone="severity" />
            </div>
            <div className="rounded-2xl border bg-card p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground">
                <BadgeCheck className="size-3.5" /> {t("confidence")}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-primary">{confidence}%</p>
              <StatBar value={confidence} tone="confidence" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                {result.openVocabulary
                  ? "Google Gemini vision + public advisories"
                  : result.source === "huggingface"
                    ? "Hugging Face vision model"
                    : "AgriCure mapping engine"}
              </p>
            </div>
          </div>
          )}

          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              <Zap className="size-3.5" /> {t("actionsTitle")}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{t("actionsSub")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={toggleSpeak} className="glow-cta h-12 gap-2 rounded-xl font-bold">
                {speaking ? <Square className="size-4" /> : <Volume2 className="size-5" />}
                🔊 {speaking ? t("stop") : t("listen")} ·{" "}
                {lang === "mr" ? "मराठी" : lang === "hi" ? "हिंदी" : "English"}
              </Button>
              {qrValue && (
                <Button
                  variant="outline"
                  className="h-12 gap-2 rounded-xl bg-card"
                  onClick={() => setShowQr((v) => !v)}
                >
                  <QrCode className="size-4" /> 🖨️ {t("qr")}
                </Button>
              )}
            </div>

            {showQr && qrValue && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border bg-card p-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrValue)}`}
                  alt="QR diagnostic summary"
                  className="size-28 rounded-lg"
                  width={112}
                  height={112}
                />
                <p className="text-xs text-muted-foreground">{t("qrHint")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={howOpen} onOpenChange={setHowOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{TXT.howTitle[lang]}</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed">{TXT.howBody[lang]}</p>
          <div className="rounded-2xl border p-3 text-xs leading-relaxed">
            <p className="font-black uppercase tracking-wider text-muted-foreground">
              {TXT.howCrops[lang]}
            </p>
            <p className="mt-1">{supportedCropList(lang)}</p>
          </div>
          <p className="rounded-2xl bg-warning/15 p-3 text-xs font-semibold leading-relaxed">
            {TXT.howUnsupported[lang]}
          </p>
          <p className="rounded-2xl bg-warning/15 p-3 text-xs font-semibold leading-relaxed">
            {TXT.howNote[lang]}
          </p>
        </DialogContent>
      </Dialog>

      <div className={`rounded-2xl border p-4 ${STATUS_STYLE[advisory.status]}`}>
        <p className="text-xs font-bold uppercase tracking-wider opacity-80">
          {t("weatherTitle")}
          <span className="ml-2 rounded-full border border-current/30 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal">
            {liveWeather ? t("liveForecast") : t("sampleForecast")}
          </span>
        </p>
        <p className="mt-1 text-sm font-semibold leading-relaxed">{advisory.message[lang]}</p>
        <p className="mt-2 text-xs opacity-80">
          🌡️ {advisory.temp}°C · 💧 {advisory.humidity}% · 🌬️ {advisory.wind} km/h · 🌧️{" "}
          {advisory.rainChance}%
        </p>
      </div>

      {warn ? (
        <section className="rounded-3xl border-2 border-warning bg-warning/10 p-5">
          <p className="flex items-center gap-2 text-lg font-black text-accent-foreground">
            <AlertTriangle className="size-5 text-warning" /> {warnTitle}
          </p>
          <p className="mt-2 text-sm font-semibold leading-relaxed">{warnMessage}</p>

          {detectedCrop && detectedCrop.key !== selectedCrop?.key && (
            <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/5 p-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-primary">
                {TXT.suggestTitle[lang]}
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed">
                {TXT.suggestBody[lang]}{" "}
                <span className="text-base font-black">
                  {detectedCrop.emoji} {detectedCrop.label[lang]}
                </span>
                {selectedCrop ? ` — ${selectedCrop.emoji} ${selectedCrop.label[lang]} ✕` : ""}
              </p>
              {onUseDetectedCrop && (
                <Button
                  onClick={() => onUseDetectedCrop(detectedCrop.key)}
                  className="mt-3 h-11 gap-2 rounded-xl font-bold"
                >
                  <Sprout className="size-4" /> {TXT.suggestCta[lang]}
                </Button>
              )}
            </div>
          )}

          {status === "uncertain" && (
            <>
              <p className="mt-4 text-[11px] font-black uppercase tracking-wider text-accent-foreground">
                {TXT.possible[lang]}
              </p>
              <ol className="mt-2 space-y-2">
            {candidates.map((c, i) => (
              <li
                key={c.key}
                className="flex items-center gap-3 rounded-2xl border border-warning/50 bg-card p-3"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-warning/25 text-xs font-black">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">
                    {c.emoji} {c.name[lang]}
                  </span>
                  <span className="block text-xs text-muted-foreground">{c.crop[lang]}</span>
                </span>
              </li>
            ))}
              </ol>
            </>
          )}

          <Button
            onClick={onRetake}
            disabled={!onRetake}
            className="mt-4 h-11 gap-2 rounded-xl font-bold"
          >
            <Camera className="size-4" /> {TXT.retake[lang]}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">{TXT.retakeHint[lang]}</p>
        </section>
      ) : (
      <Tabs defaultValue="chemical" className="glass rounded-3xl p-4">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-secondary p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.v}
              value={tab.v}
              className="flex-col gap-1 py-2 text-[11px] font-semibold sm:flex-row sm:text-sm"
            >
              <tab.icon className="size-4" />
              <span className="leading-tight">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.v} value={tab.v} className="mt-4 space-y-2">
            {tab.v === "chemical" && soil && (
              <div className="rounded-2xl border border-warning/50 bg-warning/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider">
                  🌱 {soilByKey(soil).label[lang]} · pH {soilByKey(soil).ph}
                </p>
                <p className="mt-1 text-sm font-semibold leading-relaxed">
                  {soilByKey(soil).advisory[lang]}
                </p>
              </div>
            )}
            {tab.items.map((item, i) => {
              const market = tab.v === "chemical" ? marketInfo(treatment.chemical.en[i] ?? "") : null;
              return (
                <div key={i} className="flex gap-3 rounded-2xl border bg-card p-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed">{item}</p>
                    {market && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-warm/20 px-2.5 py-1 text-[11px] font-bold text-accent-foreground">
                          {t("approx")} ₹{market.priceMin}–₹{market.priceMax} {t("perAcre")}
                        </span>
                        <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 rounded-full text-[11px]">
                          <Link to="/shops" search={{ category: market.category }}>
                            <ShoppingBag className="size-3.5" /> {t("findInShop")}
                          </Link>
                        </Button>
                        <span className="text-[11px] text-muted-foreground">
                          {categoryLabel(market.category, lang)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>
      )}
    </div>
  );
}
