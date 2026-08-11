import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Info, Leaf, Sprout, CloudSun, Radar, Mic, Building2, Newspaper } from "lucide-react";
import { AppShell } from "@/components/agri/AppShell";
import { UploadZone } from "@/components/agri/UploadZone";
import { SoilProfile } from "@/components/agri/SoilProfile";
import { ResultsPanel } from "@/components/agri/ResultsPanel";
import { ProgressTimeline } from "@/components/agri/ProgressTimeline";
import { SprayCalendar } from "@/components/agri/SprayCalendar";
import { DiseaseMap } from "@/components/agri/DiseaseMap";
import { GeoDiseaseMap } from "@/components/agri/GeoDiseaseMap";
import { WeatherStrip } from "@/components/agri/WeatherStrip";
import { LiveIntel } from "@/components/agri/LiveIntel";
import { HowItWorks } from "@/components/agri/HowItWorks";
import {
  analyzeImage,
  AuthRequiredError,
  AnalysisUnavailableError,
  fileToBase64,
  type AnalysisResult,
} from "@/lib/analysis";
import { buildReportUrl } from "@/lib/report-link";
import { CROP_CATALOG } from "@/lib/plantvillage";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useWeather } from "@/hooks/useWeather";
import { advisoryFromWeather } from "@/lib/weather";
import { soilByKey, type SoilKey } from "@/lib/soil";
import { storeScanContext } from "@/lib/scan-context";
import { setAgriMitraContext } from "@/lib/agrimitra-context";
import { supabase } from "@/integrations/supabase/client";

const TXT = {
  heroTitle: {
    en: "AI Leaf Diagnosis for every farm",
    hi: "हर खेत के लिए AI पत्ती निदान",
    mr: "प्रत्येक शेतासाठी AI पान निदान",
  },
  heroSub: {
    en: "Scan a leaf, get soil-aware treatment advice, and spray at the right time with weather-smart timing.",
    hi: "पत्ती स्कैन करें, मिट्टी-अनुरूप उपचार सलाह पाएँ और मौसम-अनुसार सही समय पर छिड़काव करें।",
    mr: "पान स्कॅन करा, माती-अनुरूप उपचार सल्ला मिळवा आणि हवामानानुसार योग्य वेळी फवारणी करा.",
  },
  flagship: [
    {
      icon: Leaf,
      en: ["AI Leaf Diagnosis", "Disease, severity and health score from one photo."],
      hi: ["AI पत्ती निदान", "एक फोटो से रोग, गंभीरता व स्वास्थ्य स्कोर।"],
      mr: ["AI पान निदान", "एका फोटोतून रोग, तीव्रता व आरोग्य गुण."],
    },
    {
      icon: Sprout,
      en: ["Soil-Aware Treatment Advice", "Dosage tuned to your soil type and pH."],
      hi: ["मिट्टी-अनुरूप उपचार सलाह", "आपकी मिट्टी व pH के अनुसार खुराक।"],
      mr: ["माती-अनुरूप उपचार सल्ला", "तुमच्या माती व pH नुसार मात्रा."],
    },
    {
      icon: CloudSun,
      en: ["Weather-Smart Spray Timing", "Live rain, wind and temperature decide go or wait."],
      hi: ["मौसम-स्मार्ट छिड़काव समय", "लाइव बारिश, हवा व तापमान से तय करें।"],
      mr: ["हवामान-स्मार्ट फवारणी वेळ", "थेट पाऊस, वारा व तापमानावरून ठरवा."],
    },
  ],
  exploreTitle: { en: "Explore More", hi: "और देखें", mr: "अधिक पहा" },
  exploreSub: {
    en: "Extra tools around the core diagnosis workflow",
    hi: "मुख्य निदान के साथ अतिरिक्त सुविधाएँ",
    mr: "मुख्य निदानासोबतची अतिरिक्त साधने",
  },
  analysisFailed: {
    en: "Could not complete the live analysis. No diagnosis was shown—please try again.",
    hi: "लाइव जाँच पूरी नहीं हो सकी। कोई निदान नहीं दिखाया गया—कृपया फिर प्रयास करें।",
    mr: "थेट तपासणी पूर्ण झाली नाही. कोणतेही निदान दाखवले नाही—कृपया पुन्हा प्रयत्न करा.",
  },
};

const EXPLORE = [
  {
    to: "/advisor" as const,
    icon: Mic,
    label: { en: "Voice Assistant", hi: "वॉइस सहायक", mr: "व्हॉइस सहाय्यक" },
    desc: {
      en: "Ask AgriMitra your crop question by voice or text.",
      hi: "AgriMitra से आवाज़ या टेक्स्ट में सवाल पूछें।",
      mr: "AgriMitra ला आवाजाने किंवा मजकुराने विचारा.",
    },
  },
  {
    to: "/schemes" as const,
    icon: Building2,
    label: { en: "Govt Schemes", hi: "सरकारी योजनाएँ", mr: "शासकीय योजना" },
    desc: {
      en: "Subsidies and eligibility checks for your farm.",
      hi: "आपके खेत हेतु सब्सिडी व पात्रता जाँच।",
      mr: "तुमच्या शेतासाठी अनुदान व पात्रता तपासणी.",
    },
  },
  {
    to: "/blogs" as const,
    icon: Newspaper,
    label: { en: "Community Blog", hi: "समुदाय ब्लॉग", mr: "समुदाय ब्लॉग" },
    desc: {
      en: "Krishi Samvad field notes (Phase 2 preview).",
      hi: "कृषि संवाद अनुभव (फेज़ 2 पूर्वावलोकन)।",
      mr: "कृषी संवाद नोंदी (फेज २ पूर्वावलोकन).",
    },
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriCure AI — Instant Crop Disease Detection for Farmers" },
      {
        name: "description",
        content:
          "Upload a leaf photo and get an AI crop disease diagnosis, health score, weather spraying advisory and treatment plan in English, Hindi and Marathi.",
      },
      { property: "og:title", content: "AgriCure AI — Instant Crop Disease Detection" },
      {
        property: "og:description",
        content:
          "AI leaf scanning with crop health score, chemical and organic treatments, and voice guidance for farmers.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { t, lang, demo } = useI18n();
  const { user } = useAuth();
  const { weather, loading: weatherLoading, located, coords } = useWeather();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sample, setSample] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cropKey, setCropKey] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [soil, setSoil] = useState<SoilKey>("black");
  const navigate = useNavigate();

  // Feed the floating "Ask AgriMitra" launcher with the current diagnosis.
  const advisoryMessage =
    weather && result && result.status === "ok"
      ? advisoryFromWeather(weather, result.treatment.key).message.en
      : undefined;
  useEffect(() => {
    setAgriMitraContext({
      result,
      soil,
      ...(advisoryMessage ? { advisoryMessage } : {}),
    });
  }, [result, soil, advisoryMessage]);

  const onFile = (f: File) => {
    setFile(f);
    setSample(null);
    setResult(null);
    setPreview(URL.createObjectURL(f));
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const retake = () => {
    clear();
    setSample(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const analyze = async (overrideCrop?: string) => {
    const activeCrop = overrideCrop ?? cropKey;
    setBusy(true);
    setResult(null);
    try {
      const base64 = file ? await fileToBase64(file) : "sample-demo-image-payload";
      const res = await analyzeImage(base64, {
        // Real uploads always run live AI diagnosis; Demo Mode only drives the sample chips.
        demo: !file,
        ...(activeCrop ? { cropKey: activeCrop } : {}),
        ...(sample ? { forcedKey: sample } : {}),
        onFallback: () => {},
        onAuthRequired: () => {},
      });
      setResult(res);
      if (res.status !== "ok") return;
      storeScanContext(
        `Disease: ${res.treatment.name.en}; crop: ${res.treatment.crop.en}; severity ${res.severity}%; health ${res.healthScore}/100; confidence ${res.confidence}%; soil: ${soilByKey(soil).label.en} (pH ${soilByKey(soil).ph}, OC ${soilByKey(soil).carbon}); region: Maharashtra, India.`,
      );
      if (user) {
        const { error } = await supabase.from("scans").insert({
          user_id: user.id,
          disease_key: res.treatment.key,
          disease_name: res.treatment.name.en,
          health_score: res.healthScore,
          severity: res.severity,
          confidence: res.confidence,
        });
        if (!error) toast.success(t("saved"));
      } else {
        toast.info(t("loginToSave"));
      }
    } catch (err) {
      if (err instanceof AnalysisUnavailableError) {
        toast.error(
          "The AI diagnosis engine is unavailable right now, so no result is shown. Please try again shortly.",
        );
      } else if (err instanceof AuthRequiredError) {
        toast.error("Sign in to run live AI diagnosis on your own photo.", {
          action: { label: "Sign in", onClick: () => navigate({ to: "/auth" }) },
        });
      } else {
        toast.error(TXT.analysisFailed[lang]);
      }
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <section
        className={`hero-gradient rise-in relative mb-6 overflow-hidden rounded-3xl px-5 py-8 text-forest-foreground transition-opacity duration-500 sm:px-8 sm:py-12 ${
          demo ? "opacity-75 saturate-75" : ""
        }`}
      >
        <div className="pulse-ring pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-amber-warm/20 blur-2xl" />
        <h1 className="max-w-xl text-3xl font-black leading-tight sm:text-5xl">
          {TXT.heroTitle[lang]}
        </h1>
        <p className="mt-3 max-w-lg text-sm opacity-90 sm:text-base">{TXT.heroSub[lang]}</p>
        <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
          {TXT.flagship.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl border border-forest-foreground/25 bg-forest-foreground/10 p-3"
            >
              <p className="flex items-center gap-2 text-sm font-black">
                <f.icon className="size-4 shrink-0" /> {f[lang][0]}
              </p>
              <p className="mt-1 text-xs opacity-90">{f[lang][1]}</p>
            </div>
          ))}
        </div>
        {demo && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-forest-foreground/30 bg-forest-foreground/15 px-3 py-1.5 text-xs font-bold">
              <Info className="size-3.5" /> {t("demoBadge")}
            </p>
            <p className="inline-block rounded-full bg-forest-foreground/10 px-3 py-1.5 text-xs font-semibold">
              {t("demoOn")}
            </p>
          </div>
        )}
      </section>

      <WeatherStrip weather={weather} loading={weatherLoading} located={located} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        <UploadZone
          preview={preview}
          onFile={onFile}
          onClear={clear}
          cropKey={cropKey}
          onCropChange={(k) => {
            setCropKey(k);
            setResult(null);
          }}
          onSample={(k) => {
            setSample(k);
            const match = CROP_CATALOG.find((c) => k.startsWith(`${c.key}_`));
            if (match) setCropKey(match.key);
            setResult(null);
          }}
          onAnalyze={analyze}
          busy={busy}
          activeSample={sample}
        />
        <div className="min-w-0">
          {result ? (
            <ResultsPanel
              result={result}
              advisory={weather ? advisoryFromWeather(weather, result.treatment.key) : null}
              liveWeather={!!weather?.live}
              soil={soil}
              onRetake={retake}
              onUseDetectedCrop={(k) => {
                setCropKey(k);
                void analyze(k);
              }}
              qrValue={buildReportUrl({ d: result.treatment.key, h: result.healthScore, s: result.severity, c: result.confidence, t: new Date().toISOString(), treatment: result.treatment })}
            />
          ) : (
            <div className="grid min-h-[280px] place-items-center rounded-3xl border-2 border-dashed p-8 text-center">
              <p className="max-w-xs text-sm text-muted-foreground">{t("heroSub")}</p>
            </div>
          )}
        </div>
      </div>

      <SoilProfile value={soil} onChange={(k) => setSoil(k)} />

      <HowItWorks />

      {result && result.status === "ok" && (
        <>
          <LiveIntel result={result} coords={coords} />
          <SprayCalendar result={result} soil={soil} />
          <ProgressTimeline result={result} />
        </>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-black sm:text-2xl">{TXT.exploreTitle[lang]}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{TXT.exploreSub[lang]}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="#outbreak-map"
            className="glass rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="flex items-center gap-2 text-sm font-black">
              <Radar className="size-4 text-primary" />
              {lang === "hi" ? "प्रकोप मानचित्र" : lang === "mr" ? "उद्रेक नकाशा" : "Outbreak Map"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {lang === "hi"
                ? "10 किमी के भीतर नमूना रोग रिपोर्ट।"
                : lang === "mr"
                  ? "१० किमी परिसरातील नमुना रोग अहवाल."
                  : "Sample disease reports within 10 km."}
            </p>
          </a>
          {EXPLORE.map((e) => (
            <Link
              key={e.to}
              to={e.to}
              className="glass rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="flex items-center gap-2 text-sm font-black">
                <e.icon className="size-4 text-primary" /> {e.label[lang]}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{e.desc[lang]}</p>
            </Link>
          ))}
        </div>
      </section>

      {result && result.status === "ok" && (
        <div id="outbreak-map" className="scroll-mt-24">
          <GeoDiseaseMap
            healthScore={result.healthScore}
            diseaseName={result.treatment.name[lang]}
            {...(weather ? { wind: weather.wind } : {})}
          />
          <DiseaseMap diseaseKey={result.treatment.key} diseaseName={result.treatment.name[lang]} />
        </div>
      )}
    </AppShell>
  );
}
