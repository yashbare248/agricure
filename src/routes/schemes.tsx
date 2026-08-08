import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, CheckCircle2, ExternalLink, Search } from "lucide-react";
import { AppShell } from "@/components/agri/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import type { Lang } from "@/lib/treatments";

export const Route = createFileRoute("/schemes")({
  head: () => ({
    meta: [
      { title: "Govt Schemes & Subsidies for Farmers — AgriCure AI" },
      {
        name: "description",
        content:
          "Browse PM-Kisan, MahaDBT micro-irrigation, PM Fasal Bima and SMAM machinery subsidies, and check eligibility by land size and district.",
      },
      { property: "og:title", content: "Govt Schemes & Subsidies — AgriCure AI" },
      {
        property: "og:description",
        content: "Farmer subsidy portal with an instant eligibility checker for Indian agri schemes.",
      },
    ],
    links: [{ rel: "canonical", href: "https://agricure.yashbare.tech/schemes" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Govt Schemes & Subsidies for Farmers",
          url: "https://agricure.yashbare.tech/schemes",
          description:
            "Directory of Indian government agriculture schemes and subsidies with an eligibility checker.",
          isPartOf: { "@type": "WebSite", name: "AgriCure AI", url: "https://agricure.yashbare.tech" },
        }),
      },
    ],
  }),
  component: SchemesPage,
});

type Cat = "all" | "cash" | "irrigation" | "machinery" | "organic" | "insurance";

const CATS: { key: Cat; label: Record<Lang, string> }[] = [
  { key: "all", label: { en: "All", hi: "सभी", mr: "सर्व" } },
  { key: "cash", label: { en: "Direct Cash Transfer", hi: "प्रत्यक्ष नकद हस्तांतरण", mr: "थेट रोख हस्तांतरण" } },
  { key: "irrigation", label: { en: "Irrigation & Drip", hi: "सिंचाई व ड्रिप", mr: "सिंचन व ठिबक" } },
  { key: "machinery", label: { en: "Machinery Subsidy", hi: "यंत्र अनुदान", mr: "यंत्र अनुदान" } },
  { key: "organic", label: { en: "Organic Farming", hi: "जैविक खेती", mr: "सेंद्रिय शेती" } },
  { key: "insurance", label: { en: "Crop Insurance", hi: "फसल बीमा", mr: "पीक विमा" } },
];

type Scheme = {
  id: string;
  cat: Exclude<Cat, "all">;
  emoji: string;
  title: Record<Lang, string>;
  summary: Record<Lang, string>;
  eligibility: Record<Lang, string>;
  maxAcres: number;
  link: string;
  linkLabel: Record<Lang, string>;
};

const SCHEMES: Scheme[] = [
  {
    id: "pmkisan",
    cat: "cash",
    emoji: "💸",
    title: {
      en: "PM-Kisan Samman Nidhi + Namo Shetkari Yojana",
      hi: "पीएम-किसान सम्मान निधि + नमो शेतकरी योजना",
      mr: "पीएम-किसान सन्मान निधी + नमो शेतकरी योजना",
    },
    summary: {
      en: "₹6,000 central + ₹6,000 Maharashtra state = ₹12,000 per year, paid in three ₹4,000 instalments directly to your Aadhaar-linked bank account.",
      hi: "₹6,000 केंद्र + ₹6,000 राज्य = ₹12,000 प्रति वर्ष, तीन किस्तों में सीधे आधार-लिंक बैंक खाते में।",
      mr: "₹६,००० केंद्र + ₹६,००० राज्य = ₹१२,००० दरवर्षी, तीन हप्त्यांत थेट आधार-लिंक बँक खात्यात.",
    },
    eligibility: {
      en: "All landholding farmer families; e-KYC and land record seeding mandatory.",
      hi: "सभी भूमिधारक किसान परिवार; e-KYC व भूमि रिकॉर्ड अनिवार्य।",
      mr: "सर्व जमीनधारक शेतकरी कुटुंबे; e-KYC व जमीन नोंद आवश्यक.",
    },
    maxAcres: 9999,
    link: "https://pmkisan.gov.in/BeneficiaryStatus_New.aspx",
    linkLabel: { en: "Check DBT status", hi: "DBT स्थिति देखें", mr: "DBT स्थिती पहा" },
  },
  {
    id: "mahadbt",
    cat: "irrigation",
    emoji: "💧",
    title: {
      en: "Micro-Irrigation Subsidy (MahaDBT / PDMC)",
      hi: "सूक्ष्म सिंचाई अनुदान (MahaDBT / PDMC)",
      mr: "सूक्ष्म सिंचन अनुदान (MahaDBT / PDMC)",
    },
    summary: {
      en: "Up to 80% subsidy for small & marginal farmers on drip and sprinkler sets (55% central + 25% state top-up); 75% for other farmers.",
      hi: "छोटे व सीमांत किसानों को ड्रिप/स्प्रिंकलर पर 80% तक अनुदान (55% केंद्र + 25% राज्य); अन्य किसानों को 75%।",
      mr: "लहान व सीमांत शेतकऱ्यांना ठिबक/तुषारवर ८०% पर्यंत अनुदान (५५% केंद्र + २५% राज्य); इतरांना ७५%.",
    },
    eligibility: {
      en: "Holding up to 5 acres gets the highest slab; 7/12 extract and water source proof needed.",
      hi: "5 एकड़ तक की जोत को सर्वोच्च स्लैब; 7/12 व जल स्रोत प्रमाण आवश्यक।",
      mr: "५ एकरपर्यंत क्षेत्रास सर्वोच्च टप्पा; ७/१२ व पाणी स्रोत पुरावा आवश्यक.",
    },
    maxAcres: 5,
    link: "https://mahadbt.maharashtra.gov.in/Farmer/Login/Login",
    linkLabel: { en: "Apply on MahaDBT", hi: "MahaDBT पर आवेदन", mr: "MahaDBT वर अर्ज करा" },
  },
  {
    id: "pmfby",
    cat: "insurance",
    emoji: "🛡️",
    title: {
      en: "PM Fasal Bima Yojana (Crop Insurance)",
      hi: "प्रधानमंत्री फसल बीमा योजना",
      mr: "प्रधानमंत्री पीक विमा योजना",
    },
    summary: {
      en: "Farmer premium only 2% for Kharif, 1.5% for Rabi, 5% for horticulture. Kharif cut-off 31 July, Rabi 15 December. Report crop loss within 72 hours on the Crop Insurance App.",
      hi: "किसान प्रीमियम खरीफ 2%, रबी 1.5%, बागवानी 5%। खरीफ अंतिम तिथि 31 जुलाई, रबी 15 दिसंबर। नुकसान 72 घंटे में दर्ज करें।",
      mr: "शेतकरी हप्ता खरीप २%, रब्बी १.५%, फळपिके ५%. खरीप मुदत ३१ जुलै, रब्बी १५ डिसेंबर. नुकसान ७२ तासांत कळवा.",
    },
    eligibility: {
      en: "All notified-crop growers, loanee and non-loanee; enrolment via bank, CSC or portal.",
      hi: "सभी अधिसूचित फसल उत्पादक; बैंक, CSC या पोर्टल से नामांकन।",
      mr: "सर्व अधिसूचित पीक उत्पादक; बँक, CSC किंवा पोर्टलवरून नोंदणी.",
    },
    maxAcres: 9999,
    link: "https://pmfby.gov.in/",
    linkLabel: { en: "Enrol / file claim", hi: "नामांकन / दावा", mr: "नोंदणी / दावा" },
  },
  {
    id: "smam",
    cat: "machinery",
    emoji: "🚜",
    title: {
      en: "Sub-Mission on Agricultural Mechanization (SMAM)",
      hi: "कृषि यंत्रीकरण उप-मिशन (SMAM)",
      mr: "कृषी यांत्रिकीकरण उप-अभियान (SMAM)",
    },
    summary: {
      en: "40–50% subsidy on tractors, power tillers, rotavators and harvesters; SC/ST, women and small farmers get the higher slab. Custom Hiring Centres get up to 40% of ₹10 lakh project cost.",
      hi: "ट्रैक्टर, पावर टिलर, रोटावेटर पर 40–50% अनुदान; अनुसूचित जाति/जनजाति, महिला व छोटे किसानों को अधिक स्लैब।",
      mr: "ट्रॅक्टर, पॉवर टिलर, रोटाव्हेटरवर ४०–५०% अनुदान; अनुसूचित जाती/जमाती, महिला व लहान शेतकऱ्यांना जास्त टप्पा.",
    },
    eligibility: {
      en: "Individual farmers with valid 7/12; one machine per family in 5 years.",
      hi: "वैध 7/12 वाले किसान; 5 वर्ष में परिवार को एक मशीन।",
      mr: "वैध ७/१२ असलेले शेतकरी; ५ वर्षांत कुटुंबास एक यंत्र.",
    },
    maxAcres: 9999,
    link: "https://agrimachinery.nic.in/",
    linkLabel: { en: "Open SMAM portal", hi: "SMAM पोर्टल खोलें", mr: "SMAM पोर्टल उघडा" },
  },
  {
    id: "pkvy",
    cat: "organic",
    emoji: "🍃",
    title: {
      en: "Paramparagat Krishi Vikas Yojana (Organic)",
      hi: "परंपरागत कृषि विकास योजना",
      mr: "परंपरागत कृषी विकास योजना",
    },
    summary: {
      en: "₹31,500 per hectare over 3 years for organic inputs, certification and cluster formation (minimum 20 hectare cluster).",
      hi: "3 वर्षों में ₹31,500 प्रति हेक्टेयर — जैविक इनपुट, प्रमाणन व क्लस्टर हेतु।",
      mr: "३ वर्षांत ₹३१,५०० प्रति हेक्टर — सेंद्रिय निविष्ठा, प्रमाणीकरण व क्लस्टरसाठी.",
    },
    eligibility: {
      en: "Farmers joining a 20-hectare organic cluster; chemical-free commitment for 3 years.",
      hi: "20 हेक्टेयर जैविक क्लस्टर में शामिल किसान; 3 वर्ष रसायन-मुक्त।",
      mr: "२० हेक्टर सेंद्रिय क्लस्टरमधील शेतकरी; ३ वर्षे रसायनमुक्त.",
    },
    maxAcres: 9999,
    link: "https://pgsindia-ncof.gov.in/",
    linkLabel: { en: "Organic portal", hi: "जैविक पोर्टल", mr: "सेंद्रिय पोर्टल" },
  },
];

const TXT = {
  title: { en: "Govt Schemes & Subsidies", hi: "सरकारी योजनाएँ व अनुदान", mr: "शासकीय योजना व अनुदान" },
  sub: {
    en: "Central and Maharashtra schemes with an instant eligibility check",
    hi: "केंद्र व महाराष्ट्र की योजनाएँ, तुरंत पात्रता जाँच सहित",
    mr: "केंद्र व महाराष्ट्र योजना, त्वरित पात्रता तपासणीसह",
  },
  search: { en: "Search schemes…", hi: "योजनाएँ खोजें…", mr: "योजना शोधा…" },
  eligTitle: { en: "Eligibility Checker", hi: "पात्रता जाँच", mr: "पात्रता तपासणी" },
  step1: { en: "Step 1 · Land size (acres)", hi: "चरण 1 · भूमि (एकड़)", mr: "पायरी १ · जमीन (एकर)" },
  step2: { en: "Step 2 · District", hi: "चरण 2 · जिला", mr: "पायरी २ · जिल्हा" },
  step3: { en: "Step 3 · See results", hi: "चरण 3 · परिणाम देखें", mr: "पायरी ३ · निकाल पहा" },
  check: { en: "Check my eligibility", hi: "मेरी पात्रता जाँचें", mr: "माझी पात्रता तपासा" },
  qualify: { en: "You likely qualify for", hi: "आप संभवतः पात्र हैं", mr: "तुम्ही बहुधा पात्र आहात" },
  eligibility: { en: "Eligibility", hi: "पात्रता", mr: "पात्रता" },
};

function SchemesPage() {
  const { lang } = useI18n();
  const [cat, setCat] = useState<Cat>("all");
  const [q, setQ] = useState("");
  const [acres, setAcres] = useState("");
  const [district, setDistrict] = useState("");
  const [checked, setChecked] = useState(false);

  const list = useMemo(
    () =>
      SCHEMES.filter((s) => (cat === "all" || s.cat === cat) &&
        (q.trim() === "" ||
          `${s.title[lang]} ${s.summary[lang]} ${s.title.en}`.toLowerCase().includes(q.toLowerCase()))),
    [cat, q, lang],
  );

  const eligible = useMemo(() => {
    const a = Number(acres);
    if (!checked || !Number.isFinite(a) || a <= 0) return [];
    return SCHEMES.filter((s) => a <= s.maxAcres);
  }, [acres, checked]);

  return (
    <AppShell>
      <header className="hero-gradient rise-in mb-5 rounded-3xl px-5 py-7 text-forest-foreground">
        <h1 className="flex items-center gap-2 text-2xl font-black sm:text-3xl">
          <Building2 className="size-7" /> 🏛️ {TXT.title[lang]}
        </h1>
        <p className="mt-2 max-w-lg text-sm opacity-90">{TXT.sub[lang]}</p>
      </header>

      <div className="glass mb-5 rounded-3xl p-4">
        <h2 className="text-sm font-extrabold">{TXT.eligTitle[lang]}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold text-muted-foreground">
            {TXT.step1[lang]}
            <Input
              value={acres}
              inputMode="decimal"
              onChange={(e) => setAcres(e.target.value)}
              placeholder="2.5"
              className="mt-1 bg-card"
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            {TXT.step2[lang]}
            <Input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Nashik"
              className="mt-1 bg-card"
            />
          </label>
          <div className="flex items-end">
            <Button className="h-10 w-full rounded-xl font-bold" onClick={() => setChecked(true)}>
              {TXT.step3[lang]} → {TXT.check[lang]}
            </Button>
          </div>
        </div>
        {checked && eligible.length > 0 && (
          <div className="mt-3 rounded-2xl border border-success/40 bg-success/10 p-3">
            <p className="text-xs font-bold text-success">
              {TXT.qualify[lang]} ({district || "—"}, {acres} acre):
            </p>
            <ul className="mt-2 space-y-1">
              {eligible.map((s) => (
                <li key={s.id} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  {s.emoji} {s.title[lang]}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {CATS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCat(c.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              cat === c.key ? "bg-primary text-primary-foreground" : "border bg-card hover:bg-secondary"
            }`}
          >
            {c.label[lang]}
          </button>
        ))}
        <div className="relative ml-auto min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={TXT.search[lang]}
            className="bg-card pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((s) => (
          <article key={s.id} className="glass rounded-3xl p-4">
            <h3 className="text-base font-extrabold leading-tight">
              {s.emoji} {s.title[lang]}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.summary[lang]}</p>
            <p className="mt-3 rounded-2xl border bg-card p-3 text-xs">
              <span className="font-bold">{TXT.eligibility[lang]}:</span> {s.eligibility[lang]}
            </p>
            <Button asChild size="sm" variant="outline" className="mt-3 gap-1.5 rounded-full bg-card">
              <a href={s.link} target="_blank" rel="noreferrer noopener">
                <ExternalLink className="size-3.5" /> {s.linkLabel[lang]}
              </a>
            </Button>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
