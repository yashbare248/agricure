import { Camera, Sprout, CloudSun, ClipboardCheck, CalendarClock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TXT = {
  title: { en: "How AgriCure AI Works", hi: "AgriCure AI कैसे काम करता है", mr: "AgriCure AI कसे चालते" },
  sub: {
    en: "Five simple steps from a leaf photo to a spray plan.",
    hi: "पत्ती की फोटो से छिड़काव योजना तक पाँच आसान चरण।",
    mr: "पानाच्या फोटोपासून फवारणी योजनेपर्यंत पाच सोपी पावले.",
  },
  faqTitle: { en: "Frequently asked", hi: "अक्सर पूछे जाने वाले", mr: "वारंवार विचारले जाणारे" },
};

const FAQ = [
  {
    en: [
      "How accurate is the diagnosis?",
      "It uses a pretrained PlantVillage vision model, so it is a strong first opinion — not a lab test. Below 60% confidence we show an Uncertain Diagnosis card and ask you to confirm with your local KVK office.",
    ],
    hi: [
      "निदान कितना सटीक है?",
      "यह PlantVillage पर प्रशिक्षित मॉडल है — एक अच्छी पहली राय, प्रयोगशाला जाँच नहीं। 60% से कम सटीकता पर हम 'अनिश्चित निदान' दिखाते हैं और स्थानीय KVK से पुष्टि करने को कहते हैं।",
    ],
    mr: [
      "निदान किती अचूक आहे?",
      "हे PlantVillage वर प्रशिक्षित मॉडेल आहे — चांगले पहिले मत, प्रयोगशाळा चाचणी नाही. ६०% पेक्षा कमी अचूकतेला आम्ही 'अनिश्चित निदान' दाखवतो व स्थानिक KVK कडून खात्री करण्यास सांगतो.",
    ],
  },
  {
    en: [
      "How long does a scan take?",
      "Usually a few seconds. If live analysis is unavailable, no sample diagnosis is substituted; we ask you to try again so an unrelated disease is never shown for your photo.",
    ],
    hi: [
      "एक स्कैन में कितना समय लगता है?",
      "आमतौर पर कुछ सेकंड। लाइव जाँच उपलब्ध न होने पर कोई नमूना निदान नहीं दिखाया जाता; गलत रोग से बचने के लिए दोबारा प्रयास करने को कहा जाता है।",
    ],
    mr: [
      "एका स्कॅनला किती वेळ लागतो?",
      "साधारण काही सेकंद. थेट तपासणी उपलब्ध नसल्यास नमुना निदान दाखवले जात नाही; चुकीचा रोग टाळण्यासाठी पुन्हा प्रयत्न करण्यास सांगितले जाते.",
    ],
  },
  {
    en: [
      "What is Demo Mode, and does it work offline?",
      "Demo Mode uses four pre-cached diagnoses (rice blast, tomato early blight, cotton leaf curl, healthy leaf) with no network call — ideal for demos or a weak field signal. Weather and the AI advisor still need internet.",
    ],
    hi: [
      "डेमो मोड क्या है, क्या यह ऑफ़लाइन चलता है?",
      "डेमो मोड चार पूर्व-सहेजे निदान (राइस ब्लास्ट, टमाटर अर्ली ब्लाइट, कपास लीफ कर्ल, स्वस्थ पत्ती) बिना नेटवर्क दिखाता है — कमज़ोर सिग्नल में उपयोगी। मौसम व AI सलाहकार हेतु इंटरनेट चाहिए।",
    ],
    mr: [
      "डेमो मोड म्हणजे काय, तो ऑफलाइन चालतो का?",
      "डेमो मोड चार पूर्व-साठवलेली निदाने (राइस ब्लास्ट, टोमॅटो अर्ली ब्लाइट, कापूस लीफ कर्ल, निरोगी पान) नेटवर्कशिवाय दाखवतो — कमी सिग्नलमध्ये उपयुक्त. हवामान व AI सल्लागारासाठी इंटरनेट लागते.",
    ],
  },
  {
    en: [
      "What happens to my photo and data?",
      "The photo is sent only for classification and is not stored. If you sign in, we save just the scan summary — disease, health score, severity and confidence — to your private history, visible only to you.",
    ],
    hi: [
      "मेरी फोटो और डेटा का क्या होता है?",
      "फोटो केवल पहचान हेतु भेजी जाती है, सहेजी नहीं जाती। साइन इन करने पर केवल स्कैन सारांश — रोग, स्वास्थ्य स्कोर, गंभीरता व सटीकता — आपके निजी इतिहास में सहेजा जाता है।",
    ],
    mr: [
      "माझ्या फोटो व माहितीचे काय होते?",
      "फोटो फक्त ओळखीसाठी पाठवला जातो, साठवला जात नाही. साइन इन केल्यास फक्त स्कॅन सारांश — रोग, आरोग्य गुण, तीव्रता व अचूकता — तुमच्या खाजगी इतिहासात साठवला जातो.",
    ],
  },
  {
    en: [
      "When should I retake the photo?",
      "Retake if the result looks uncertain or wrong. Use daylight, fill the frame with one affected leaf on a plain background, avoid shadows and blur, and keep the camera steady.",
    ],
    hi: [
      "फोटो कब दोबारा लें?",
      "यदि परिणाम अनिश्चित या ग़लत लगे तो दोबारा लें। दिन के उजाले में, सादे बैकग्राउंड पर एक प्रभावित पत्ती को फ्रेम में भरें, छाया व धुंधलापन से बचें।",
    ],
    mr: [
      "फोटो पुन्हा कधी काढावा?",
      "निकाल अनिश्चित किंवा चुकीचा वाटल्यास पुन्हा काढा. दिवसाच्या प्रकाशात, साध्या पार्श्वभूमीवर एक बाधित पान फ्रेममध्ये भरा, सावली व अस्पष्टता टाळा.",
    ],
  },
];

const STEPS = [
  {
    icon: Camera,
    en: ["Capture the leaf", "Upload or click a clear close-up of one affected leaf, or pick a sample."],
    hi: ["पत्ती की फोटो लें", "एक प्रभावित पत्ती की साफ़ नज़दीकी फोटो अपलोड करें या नमूना चुनें।"],
    mr: ["पानाचा फोटो घ्या", "एका बाधित पानाचा स्पष्ट जवळून फोटो अपलोड करा किंवा नमुना निवडा."],
  },
  {
    icon: ClipboardCheck,
    en: ["AI diagnoses it", "A pretrained vision model returns the disease, severity % and confidence %."],
    hi: ["AI निदान करता है", "पूर्व-प्रशिक्षित मॉडल रोग, गंभीरता % व सटीकता % बताता है।"],
    mr: ["AI निदान करते", "पूर्व-प्रशिक्षित मॉडेल रोग, तीव्रता % व अचूकता % देते."],
  },
  {
    icon: Sprout,
    en: ["Soil-aware advice", "Dosage and method are tuned to your soil type, pH and organic carbon."],
    hi: ["मिट्टी-अनुरूप सलाह", "खुराक व विधि आपकी मिट्टी, pH व जैविक कार्बन के अनुसार।"],
    mr: ["माती-अनुरूप सल्ला", "मात्रा व पद्धत तुमची माती, pH व सेंद्रिय कर्बानुसार."],
  },
  {
    icon: CloudSun,
    en: ["Weather check", "Live rain, wind and temperature decide spray now, caution or postpone."],
    hi: ["मौसम जाँच", "लाइव बारिश, हवा व तापमान से तय — अभी करें, सावधानी या टालें।"],
    mr: ["हवामान तपासणी", "थेट पाऊस, वारा व तापमानावरून — आता करा, काळजी किंवा पुढे ढकला."],
  },
  {
    icon: CalendarClock,
    en: ["Follow the plan", "Get a spray calendar with reminders, and track recovery scan by scan."],
    hi: ["योजना अपनाएँ", "रिमाइंडर के साथ छिड़काव कैलेंडर पाएँ और सुधार ट्रैक करें।"],
    mr: ["योजना पाळा", "स्मरणपत्रांसह फवारणी दिनदर्शिका मिळवा व सुधारणा ट्रॅक करा."],
  },
];

export function HowItWorks() {
  const { lang } = useI18n();

  return (
    <section className="mt-8">
      <h2 className="text-xl font-black sm:text-2xl">{TXT.title[lang]}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{TXT.sub[lang]}</p>

      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((s, i) => (
          <li key={i} className="glass relative rounded-2xl p-4">
            <span className="absolute right-3 top-3 text-2xl font-black text-primary/15">
              {i + 1}
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="size-4.5" />
            </span>
            <p className="mt-2.5 text-sm font-black">{s[lang][0]}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s[lang][1]}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6">
        <h3 className="text-base font-black">{TXT.faqTitle[lang]}</h3>
        <Accordion type="single" collapsible className="mt-2">
          {FAQ.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-bold">
                {f[lang][0]}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f[lang][1]}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}