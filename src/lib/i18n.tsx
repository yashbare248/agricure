import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Lang } from "./treatments";

const DICT = {
  appName: { en: "AgriCure AI", hi: "AgriCure AI", mr: "AgriCure AI" },
  tagline: {
    en: "Instant crop disease detection for every farmer",
    hi: "हर किसान के लिए तुरंत फसल रोग पहचान",
    mr: "प्रत्येक शेतकऱ्यासाठी त्वरित पीक रोग निदान",
  },
  heroTitle: {
    en: "Scan a leaf. Save the harvest.",
    hi: "पत्ती स्कैन करें। फसल बचाएँ।",
    mr: "पान स्कॅन करा. पीक वाचवा.",
  },
  heroSub: {
    en: "Upload a leaf photo and get a disease diagnosis, treatment plan and spraying advice in seconds.",
    hi: "पत्ती की फोटो अपलोड करें और सेकंडों में रोग पहचान, उपचार व छिड़काव सलाह पाएँ।",
    mr: "पानाचा फोटो अपलोड करा आणि काही सेकंदात रोग निदान, उपचार व फवारणी सल्ला मिळवा.",
  },
  dropHere: {
    en: "Drag & drop a leaf image, or tap to browse",
    hi: "पत्ती की छवि खींचें व छोड़ें, या चुनने के लिए टैप करें",
    mr: "पानाची प्रतिमा ड्रॅग करा, किंवा निवडण्यासाठी टॅप करा",
  },
  takePhoto: { en: "Take Photo", hi: "फोटो लें", mr: "फोटो काढा" },
  browse: { en: "Choose File", hi: "फ़ाइल चुनें", mr: "फाईल निवडा" },
  samples: {
    en: "Try a sample leaf",
    hi: "नमूना पत्ती आज़माएँ",
    mr: "नमुना पान वापरून पहा",
  },
  analyze: { en: "Analyze Crop Health", hi: "फसल स्वास्थ्य जाँचें", mr: "पीक आरोग्य तपासा" },
  analyzing: { en: "Analyzing leaf…", hi: "पत्ती की जाँच हो रही है…", mr: "पानाची तपासणी सुरू आहे…" },
  healthScore: { en: "Crop Health Score", hi: "फसल स्वास्थ्य स्कोर", mr: "पीक आरोग्य गुण" },
  healthy: { en: "Healthy", hi: "स्वस्थ", mr: "निरोगी" },
  moderate: { en: "Moderate", hi: "मध्यम", mr: "मध्यम" },
  severe: { en: "Severe", hi: "गंभीर", mr: "गंभीर" },
  diagnosis: { en: "Diagnosis", hi: "निदान", mr: "निदान" },
  severityLabel: { en: "Infection severity", hi: "संक्रमण गंभीरता", mr: "प्रादुर्भाव तीव्रता" },
  confidence: { en: "AI confidence", hi: "AI सटीकता", mr: "AI अचूकता" },
  listen: { en: "Listen", hi: "सुनें", mr: "ऐका" },
  stop: { en: "Stop", hi: "रोकें", mr: "थांबवा" },
  chemical: { en: "Chemical Treatment", hi: "रासायनिक उपचार", mr: "रासायनिक उपचार" },
  organic: { en: "Organic Remedies", hi: "जैविक उपाय", mr: "सेंद्रिय उपाय" },
  prevention: { en: "Prevention & Irrigation", hi: "रोकथाम व सिंचाई", mr: "प्रतिबंध व सिंचन" },
  weatherTitle: { en: "Spraying Advisory", hi: "छिड़काव सलाह", mr: "फवारणी सल्ला" },
  liveForecast: { en: "Live forecast", hi: "लाइव पूर्वानुमान", mr: "थेट अंदाज" },
  sampleForecast: { en: "Sample data", hi: "नमूना डेटा", mr: "नमुना डेटा" },
  weatherLoading: {
    en: "Fetching live weather for your field…",
    hi: "आपके खेत का लाइव मौसम लाया जा रहा है…",
    mr: "तुमच्या शेतासाठी थेट हवामान आणत आहोत…",
  },
  weatherNow: { en: "Field weather now", hi: "अभी खेत का मौसम", mr: "सध्याचे शेतातील हवामान" },
  myLocation: { en: "Your location", hi: "आपका स्थान", mr: "तुमचे ठिकाण" },
  airQuality: { en: "Air quality", hi: "वायु गुणवत्ता", mr: "हवेची गुणवत्ता" },
  airQualityHint: {
    en: "Dust and ozone stress leaves and can worsen disease spread.",
    hi: "धूल और ओज़ोन पत्तों पर दबाव डालते हैं और रोग बढ़ा सकते हैं।",
    mr: "धूळ आणि ओझोन पानांवर ताण देतात व रोग वाढवू शकतात.",
  },
  defaultLocation: { en: "Default region", hi: "डिफ़ॉल्ट क्षेत्र", mr: "डीफॉल्ट प्रदेश" },
  shops: { en: "Nearby Agri Shops", hi: "नज़दीकी कृषि दुकानें", mr: "जवळील कृषी दुकाने" },
  shopsSub: {
    en: "Verified input dealers near your farm",
    hi: "आपके खेत के पास सत्यापित कृषि विक्रेता",
    mr: "तुमच्या शेताजवळील पडताळलेले कृषी विक्रेते",
  },
  call: { en: "Call", hi: "कॉल करें", mr: "कॉल करा" },
  directions: { en: "Directions", hi: "रास्ता", mr: "दिशा" },
  history: { en: "History", hi: "इतिहास", mr: "इतिहास" },
  historySub: {
    en: "Your past diagnostic reports",
    hi: "आपकी पिछली जाँच रिपोर्ट",
    mr: "तुमचे मागील निदान अहवाल",
  },
  noHistory: {
    en: "No scans yet. Analyze a leaf to build your record.",
    hi: "अभी कोई स्कैन नहीं। रिकॉर्ड बनाने हेतु पत्ती जाँचें।",
    mr: "अजून स्कॅन नाही. नोंद तयार करण्यासाठी पान तपासा.",
  },
  loginToSave: {
    en: "Sign in to save this scan to your farm records.",
    hi: "इस जाँच को सहेजने के लिए साइन इन करें।",
    mr: "ही तपासणी जतन करण्यासाठी साइन इन करा.",
  },
  qr: { en: "QR Report", hi: "QR रिपोर्ट", mr: "QR अहवाल" },
  qrHint: {
    en: "Show this QR to an agriculture officer for instant case details.",
    hi: "कृषि अधिकारी को यह QR दिखाएँ ताकि पूरी जानकारी तुरंत मिले।",
    mr: "कृषी अधिकाऱ्याला हा QR दाखवा म्हणजे संपूर्ण माहिती लगेच मिळेल.",
  },
  home: { en: "Scan", hi: "स्कैन", mr: "स्कॅन" },
  advisor: { en: "AI Doctor", hi: "AI डॉक्टर", mr: "AI डॉक्टर" },
  schemes: { en: "Schemes", hi: "योजनाएँ", mr: "योजना" },
  blogs: { en: "Blogs", hi: "ब्लॉग", mr: "ब्लॉग" },
  signIn: { en: "Sign In", hi: "साइन इन", mr: "साइन इन" },
  signOut: { en: "Sign Out", hi: "साइन आउट", mr: "साइन आउट" },
  demoMode: { en: "Demo Mode", hi: "डेमो मोड", mr: "डेमो मोड" },
  demoOn: {
    en: "Demo Mode on — analysis runs offline with a full sample report.",
    hi: "डेमो मोड चालू — जाँच ऑफ़लाइन नमूना रिपोर्ट से चलती है।",
    mr: "डेमो मोड चालू — तपासणी ऑफलाइन नमुना अहवालाने चालते.",
  },
  newScan: { en: "New Scan", hi: "नई जाँच", mr: "नवीन तपासणी" },
  saved: { en: "Scan saved to your records", hi: "जाँच आपके रिकॉर्ड में सहेजी गई", mr: "तपासणी तुमच्या नोंदीत जतन झाली" },
  scan: { en: "Scan", hi: "जाँच", mr: "तपासणी" },
  nowLabel: { en: "Now", hi: "अभी", mr: "आत्ता" },
  goalLabel: { en: "Goal", hi: "लक्ष्य", mr: "ध्येय" },
  targetSoon: { en: "Target < 5%", hi: "लक्ष्य < 5%", mr: "लक्ष्य < ५%" },
  threeDaysAgo: { en: "3 days ago", hi: "3 दिन पहले", mr: "३ दिवसांपूर्वी" },
  sixDaysAgo: { en: "6 days ago", hi: "6 दिन पहले", mr: "६ दिवसांपूर्वी" },
  timeline: { en: "Plant Progress Tracking", hi: "पौधे की प्रगति ट्रैकिंग", mr: "पीक प्रगती नोंद" },
  timelineSub: {
    en: "Severity trend across your scans for this plant",
    hi: "इस पौधे की जाँचों में गंभीरता का रुझान",
    mr: "या झाडाच्या तपासण्यांतील तीव्रतेचा कल",
  },
  mapTitle: { en: "Localized Disease Map", hi: "स्थानीय रोग मानचित्र", mr: "स्थानिक रोग नकाशा" },
  mapSub: {
    en: "Anonymous reports from farms within 10 km",
    hi: "10 किमी के भीतर के खेतों की गुमनाम रिपोर्ट",
    mr: "१० किमी परिसरातील शेतांचे निनावी अहवाल",
  },
  yourField: { en: "Your field", hi: "आपका खेत", mr: "तुमचे शेत" },
  radius: { en: "radius", hi: "दायरा", mr: "परिसर" },
  alertsTitle: { en: "Community Health Alerts", hi: "सामुदायिक स्वास्थ्य अलर्ट", mr: "सामुदायिक आरोग्य सूचना" },
  ago: { en: "ago", hi: "पहले", mr: "पूर्वी" },
  riskHigh: { en: "High", hi: "अधिक", mr: "जास्त" },
  riskMedium: { en: "Medium", hi: "मध्यम", mr: "मध्यम" },
  riskLow: { en: "Low", hi: "कम", mr: "कमी" },
  actionsTitle: { en: "Quick Actions", hi: "त्वरित क्रियाएँ", mr: "त्वरित कृती" },
  actionsSub: {
    en: "Listen to the diagnosis or share a QR report",
    hi: "निदान सुनें या QR रिपोर्ट साझा करें",
    mr: "निदान ऐका किंवा QR अहवाल शेअर करा",
  },
  findInShop: { en: "Find in nearby shop", hi: "नज़दीकी दुकान में खोजें", mr: "जवळच्या दुकानात शोधा" },
  approx: { en: "Approx.", hi: "लगभग", mr: "अंदाजे" },
  perAcre: { en: "/ acre", hi: "/ एकड़", mr: "/ एकर" },
  showingFor: { en: "Showing shops stocking", hi: "इन उत्पादों वाली दुकानें", mr: "ही उत्पादने असलेली दुकाने" },
  clearFilter: { en: "Show all shops", hi: "सभी दुकानें दिखाएँ", mr: "सर्व दुकाने दाखवा" },
  demoBadge: {
    en: "DEMO MODE: Results are pre-simulated and do not require upload.",
    hi: "डेमो मोड: परिणाम पूर्व-अनुकरण हैं, अपलोड ज़रूरी नहीं।",
    mr: "डेमो मोड: निकाल पूर्व-अनुरूपित आहेत, अपलोडची गरज नाही.",
  },
} as const;

export type DictKey = keyof typeof DICT;

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "mr", label: "मराठी" },
  { code: "hi", label: "हिंदी" },
];

export const SPEECH_LOCALE: Record<Lang, string> = {
  en: "en-US",
  hi: "hi-IN",
  mr: "mr-IN",
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: DictKey) => string;
  demo: boolean;
  setDemo: (v: boolean) => void;
};

const LangContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [demo, setDemoState] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("agricure-lang") as Lang | null;
    if (stored && ["en", "hi", "mr"].includes(stored)) setLangState(stored);
    const d = localStorage.getItem("agricure-demo");
    if (d !== null) setDemoState(d === "1");
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: (l) => {
        setLangState(l);
        localStorage.setItem("agricure-lang", l);
      },
      demo,
      setDemo: (v) => {
        setDemoState(v);
        localStorage.setItem("agricure-demo", v ? "1" : "0");
      },
      t: (k) => DICT[k][lang],
    }),
    [lang, demo],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}
