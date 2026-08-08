import type { Lang, L, Treatment } from "./treatments";

type About = { cause: L; symptoms: L; spread: L; risk: L };

const GENERIC: About = {
  cause: {
    en: "This is a leaf disease caused by a fungal or bacterial pathogen that attacks the crop foliage.",
    hi: "यह पत्तियों का रोग है, जो फफूंद या जीवाणु रोगाणु के कारण फसल की पत्तियों पर हमला करता है।",
    mr: "हा पानांचा रोग असून बुरशी किंवा जिवाणू रोगजंतूमुळे पिकाच्या पानांवर हल्ला होतो.",
  },
  symptoms: {
    en: "Typical symptoms are discoloured spots, patches or curling on the leaves, which slowly enlarge and dry the leaf tissue.",
    hi: "आम लक्षण हैं पत्तियों पर रंग बदले धब्बे, चकत्ते या मुड़ाव, जो धीरे-धीरे बड़े होकर पत्ती के ऊतक को सुखा देते हैं।",
    mr: "सामान्य लक्षणे म्हणजे पानांवर रंग बदललेले ठिपके, चट्टे किंवा वळण, जे हळूहळू वाढून पानाची ऊती वाळवतात.",
  },
  spread: {
    en: "It spreads through wind, rain splash, irrigation water and infected plant debris, and moves faster in humid weather.",
    hi: "यह हवा, बारिश की छींटों, सिंचाई के पानी और संक्रमित अवशेषों से फैलता है, और नमी वाले मौसम में तेज़ी से बढ़ता है।",
    mr: "हा वारा, पावसाचे थेंब, सिंचनाचे पाणी आणि संक्रमित अवशेषांमधून पसरतो आणि दमट हवामानात वेगाने वाढतो.",
  },
  risk: {
    en: "If untreated it reduces photosynthesis, weakens the plant and can cut yield significantly.",
    hi: "उपचार न होने पर यह प्रकाश-संश्लेषण घटाता है, पौधे को कमजोर करता है और उपज में बड़ी कमी ला सकता है।",
    mr: "उपचार न केल्यास प्रकाशसंश्लेषण घटते, झाड कमजोर होते आणि उत्पादनात मोठी घट होऊ शकते.",
  },
};

const ABOUT: Record<string, About> = {
  tomato_early_blight: {
    cause: {
      en: "Tomato early blight is caused by the fungus Alternaria solani, which survives in soil and old crop residue.",
      hi: "टमाटर का अगेती झुलसा रोग अल्टरनेरिया सोलानी नामक फफूंद से होता है, जो मिट्टी और पुराने फसल अवशेष में जीवित रहती है।",
      mr: "टोमॅटोचा अर्ली ब्लाइट अल्टरनेरिया सोलानी या बुरशीमुळे होतो, जी मातीत आणि जुन्या पिकाच्या अवशेषात टिकून राहते.",
    },
    symptoms: {
      en: "It shows dark brown spots with concentric rings, like a target, starting on the older lower leaves with a yellow halo around them.",
      hi: "इसमें गहरे भूरे धब्बे बनते हैं जिनमें छल्लेदार गोल घेरे होते हैं, ये पहले नीचे की पुरानी पत्तियों पर आते हैं और चारों ओर पीला घेरा दिखता है।",
      mr: "यात गडद तपकिरी ठिपके वर्तुळाकार रिंगांसह दिसतात, हे प्रथम खालच्या जुन्या पानांवर येतात आणि भोवती पिवळे वलय दिसते.",
    },
    spread: {
      en: "Spores spread by wind and rain splash, and infection speeds up in warm, humid weather above 24 degrees Celsius.",
      hi: "बीजाणु हवा और बारिश की छींटों से फैलते हैं, और 24 डिग्री सेल्सियस से ऊपर गर्म-नम मौसम में संक्रमण तेज़ हो जाता है।",
      mr: "बीजाणू वारा व पावसाच्या थेंबांतून पसरतात आणि २४ अंश सेल्सिअसवरील उष्ण-दमट हवामानात संसर्ग वेगाने वाढतो.",
    },
    risk: {
      en: "Severe attacks defoliate the plant, expose fruits to sunscald and can reduce yield by up to half.",
      hi: "तेज़ संक्रमण में पत्तियाँ झड़ जाती हैं, फल धूप से जल जाते हैं और उपज आधी तक घट सकती है।",
      mr: "तीव्र प्रादुर्भावात पाने गळतात, फळे उन्हाने भाजतात आणि उत्पादन निम्म्यापर्यंत घटू शकते.",
    },
  },
  potato_late_blight: {
    cause: {
      en: "Potato late blight is caused by the water mould Phytophthora infestans, the same pathogen behind historic famine-level crop losses.",
      hi: "आलू का पछेती झुलसा फाइटोफ्थोरा इन्फेस्टैन्स नामक जल-फफूंद से होता है, यही रोगाणु इतिहास में भारी फसल नुकसान का कारण रहा है।",
      mr: "बटाट्याचा लेट ब्लाइट फायटोफ्थोरा इन्फेस्टन्स या जल-बुरशीमुळे होतो, हाच रोगजंतू इतिहासात मोठ्या पीकहानीस कारणीभूत ठरला.",
    },
    symptoms: {
      en: "Look for water-soaked dark green to black patches on leaf tips and margins, with a white fuzzy growth on the underside in the morning.",
      hi: "पत्ती के सिरों और किनारों पर पानी भरे गहरे हरे से काले धब्बे दिखते हैं, और सुबह पत्ती के नीचे सफेद रुई जैसी परत आती है।",
      mr: "पानांच्या टोकांवर व कडांवर पाणथळ गडद हिरवे ते काळे चट्टे दिसतात आणि सकाळी पानाखाली पांढरी बुरशी दिसते.",
    },
    spread: {
      en: "It explodes in cool, wet, cloudy weather and can destroy a whole field within seven to ten days.",
      hi: "ठंडे, गीले और बादल वाले मौसम में यह बहुत तेज़ी से फैलता है और सात से दस दिन में पूरा खेत बर्बाद कर सकता है।",
      mr: "थंड, ओलसर व ढगाळ हवामानात हा झपाट्याने पसरतो आणि सात ते दहा दिवसांत संपूर्ण शेत उद्ध्वस्त करू शकतो.",
    },
    risk: {
      en: "Tubers rot in storage as well, so act immediately and do not delay the spray.",
      hi: "कंद भंडारण में भी सड़ जाते हैं, इसलिए तुरंत कार्रवाई करें और छिड़काव में देरी न करें।",
      mr: "कंद साठवणुकीतही कुजतात, त्यामुळे तात्काळ कृती करा आणि फवारणीस उशीर करू नका.",
    },
  },
  apple_scab: {
    cause: {
      en: "Apple scab is caused by the fungus Venturia inaequalis, which overwinters in fallen infected leaves.",
      hi: "सेब का स्कैब वेंचुरिया इनइक्वालिस नामक फफूंद से होता है, जो गिरी हुई संक्रमित पत्तियों में सर्दियाँ बिताती है।",
      mr: "सफरचंदाचा स्कॅब व्हेंच्युरिया इनइक्वालिस या बुरशीमुळे होतो, जी गळून पडलेल्या संक्रमित पानांत हिवाळा काढते.",
    },
    symptoms: {
      en: "Olive green to velvety brown blotches appear on leaves and fruit, later turning corky and cracked.",
      hi: "पत्तियों और फलों पर जैतूनी हरे से मखमली भूरे धब्बे आते हैं, जो बाद में खुरदरे और फटे हुए हो जाते हैं।",
      mr: "पानांवर व फळांवर ऑलिव्ह हिरवे ते मखमली तपकिरी डाग येतात, जे नंतर खरखरीत व भेगाळलेले होतात.",
    },
    spread: {
      en: "Spring rain releases spores onto new leaves, so wet springs cause the worst outbreaks.",
      hi: "वसंत की बारिश बीजाणुओं को नई पत्तियों पर छोड़ती है, इसलिए गीले वसंत में प्रकोप सबसे अधिक होता है।",
      mr: "वसंतातील पाऊस बीजाणू नव्या पानांवर सोडतो, त्यामुळे ओल्या वसंतात प्रादुर्भाव सर्वाधिक होतो.",
    },
    risk: {
      en: "Scabbed fruit loses market value even when the tree survives, so protect the crop early.",
      hi: "पेड़ बच भी जाए तो दागी फल का बाज़ार भाव गिर जाता है, इसलिए फसल की शुरुआती सुरक्षा ज़रूरी है।",
      mr: "झाड टिकले तरी डाग पडलेल्या फळांना बाजारभाव मिळत नाही, म्हणून पिकाचे लवकर संरक्षण करा.",
    },
  },
  rice_blast: {
    cause: {
      en: "Rice blast is caused by the fungus Magnaporthe oryzae, favoured by high nitrogen and long leaf wetness.",
      hi: "धान का ब्लास्ट रोग मैग्नापोर्थे ओराइज़ी नामक फफूंद से होता है, अधिक नाइट्रोजन और लंबी पत्ती-नमी इसे बढ़ाते हैं।",
      mr: "भाताचा ब्लास्ट मॅग्नापोर्थे ओरायझी या बुरशीमुळे होतो; जास्त नत्र व दीर्घ पानओल यास पोषक ठरते.",
    },
    symptoms: {
      en: "Spindle or diamond shaped lesions with grey centres and brown borders appear on leaves, and the neck of the panicle may blacken.",
      hi: "पत्तियों पर तकली या हीरे के आकार के धब्बे बनते हैं जिनका बीच धूसर और किनारा भूरा होता है, और बाली की गर्दन काली पड़ सकती है।",
      mr: "पानांवर भाल्यासारखे किंवा हिऱ्याच्या आकाराचे डाग येतात, मध्यभाग करडा व कडा तपकिरी असते; लोंबीची मान काळी पडू शकते.",
    },
    spread: {
      en: "Night dew, cloudy days and dense planting help spores spread quickly across the field.",
      hi: "रात की ओस, बादल वाले दिन और घनी रोपाई बीजाणुओं को खेत में तेज़ी से फैलाते हैं।",
      mr: "रात्रीचे दव, ढगाळ दिवस व दाट लागवड यामुळे बीजाणू शेतात झपाट्याने पसरतात.",
    },
    risk: {
      en: "Neck blast at flowering can cause almost total grain loss, so scout the crop daily at that stage.",
      hi: "फूल आने पर नेक ब्लास्ट लगभग पूरा दाना नुकसान कर सकता है, इसलिए उस समय रोज़ फसल की जाँच करें।",
      mr: "फुलोऱ्याच्या वेळी नेक ब्लास्टमुळे जवळजवळ संपूर्ण दाणे वाया जाऊ शकतात, म्हणून त्या वेळी रोज पाहणी करा.",
    },
  },
  cotton_leaf_curl: {
    cause: {
      en: "Cotton leaf curl is a virus disease transmitted by the whitefly, not by fungus, so vector control is the real cure.",
      hi: "कपास का पत्ती मरोड़ एक विषाणु रोग है जो सफेद मक्खी से फैलता है, फफूंद से नहीं, इसलिए असली इलाज कीट नियंत्रण है।",
      mr: "कापसाचा पानगुंडाळ हा विषाणूजन्य रोग पांढऱ्या माशीमुळे पसरतो, बुरशीमुळे नाही; त्यामुळे खरा उपाय कीड नियंत्रण आहे.",
    },
    symptoms: {
      en: "Leaves curl upward, veins thicken and darken, and small leaf-like outgrowths appear on the underside with stunted growth.",
      hi: "पत्तियाँ ऊपर की ओर मुड़ती हैं, शिराएँ मोटी और गहरी हो जाती हैं, नीचे की ओर छोटी पत्ती जैसी वृद्धि दिखती है और पौधा बौना रह जाता है।",
      mr: "पाने वरच्या दिशेने वळतात, शिरा जाड व गडद होतात, खालच्या बाजूस लहान पानासारखी वाढ दिसते आणि झाड खुजे राहते.",
    },
    spread: {
      en: "Whiteflies carry the virus from plant to plant, and hot dry weather multiplies the insect population fast.",
      hi: "सफेद मक्खी विषाणु को एक पौधे से दूसरे पौधे तक ले जाती है, और गर्म-सूखे मौसम में इनकी संख्या तेज़ी से बढ़ती है।",
      mr: "पांढरी माशी विषाणू एका झाडावरून दुसऱ्यावर नेते आणि उष्ण-कोरड्या हवामानात तिची संख्या झपाट्याने वाढते.",
    },
    risk: {
      en: "Infected plants cannot be cured, so remove them and protect the healthy crop from whiteflies.",
      hi: "संक्रमित पौधे ठीक नहीं होते, इसलिए उन्हें हटाएँ और स्वस्थ फसल को सफेद मक्खी से बचाएँ।",
      mr: "संक्रमित झाडे बरी होत नाहीत, म्हणून ती काढून टाका आणि निरोगी पिकाचे पांढऱ्या माशीपासून संरक्षण करा.",
    },
  },
};

const HEALTHY: L = {
  en: "Good news. No disease pattern was found on this leaf. The colour, texture and leaf margins look normal, which means the plant is photosynthesising well.",
  hi: "अच्छी खबर। इस पत्ती पर कोई रोग नहीं मिला। रंग, बनावट और किनारे सामान्य दिख रहे हैं, यानी पौधा अच्छी तरह प्रकाश-संश्लेषण कर रहा है।",
  mr: "चांगली बातमी. या पानावर कोणताही रोग आढळला नाही. रंग, पोत आणि कडा सामान्य दिसतात, म्हणजे झाड चांगले प्रकाशसंश्लेषण करत आहे.",
};

const TX = {
  intro: {
    en: "Diagnosis report.",
    hi: "निदान रिपोर्ट।",
    mr: "निदान अहवाल.",
  },
  detected: (crop: string, name: string): L => ({
    en: `The crop is ${crop} and the detected condition is ${name}.`,
    hi: `फसल है ${crop} और पहचाना गया रोग है ${name}।`,
    mr: `पीक आहे ${crop} आणि आढळलेली स्थिती आहे ${name}.`,
  }),
  stats: (sev: number, hs: number, conf: number): L => ({
    en: `Infection severity is about ${sev} percent, the overall crop health score is ${hs} out of 100, and the model is ${conf} percent confident in this result.`,
    hi: `संक्रमण की गंभीरता लगभग ${sev} प्रतिशत है, फसल का कुल स्वास्थ्य स्कोर 100 में से ${hs} है, और मॉडल इस परिणाम पर ${conf} प्रतिशत आश्वस्त है।`,
    mr: `संसर्गाची तीव्रता सुमारे ${sev} टक्के आहे, पिकाचा एकूण आरोग्य स्कोअर १०० पैकी ${hs} आहे आणि मॉडेल या निकालावर ${conf} टक्के खात्रीशीर आहे.`,
  }),
  what: { en: "What this disease is.", hi: "यह रोग क्या है।", mr: "हा रोग काय आहे." },
  signs: { en: "Signs to look for.", hi: "पहचान के लक्षण।", mr: "ओळखीची लक्षणे." },
  spreads: { en: "How it spreads.", hi: "यह कैसे फैलता है।", mr: "हा कसा पसरतो." },
  ifIgnored: { en: "If you ignore it.", hi: "अनदेखा करने पर।", mr: "दुर्लक्ष केल्यास." },
  chemical: { en: "Chemical treatment.", hi: "रासायनिक उपचार।", mr: "रासायनिक उपचार." },
  organic: { en: "Organic treatment.", hi: "जैविक उपचार।", mr: "सेंद्रिय उपचार." },
  prevention: { en: "Prevention for next season.", hi: "अगली फसल के लिए रोकथाम।", mr: "पुढील हंगामासाठी प्रतिबंध." },
  weather: { en: "Spray weather advisory.", hi: "छिड़काव मौसम सलाह।", mr: "फवारणी हवामान सल्ला." },
  safety: {
    en: "Safety note. Always wear gloves and a mask while spraying, spray in the early morning or late evening, keep children and animals away from the field, and follow the waiting period printed on the label before harvest.",
    hi: "सुरक्षा सूचना। छिड़काव करते समय हमेशा दस्ताने और मास्क पहनें, सुबह जल्दी या शाम को छिड़काव करें, बच्चों और जानवरों को खेत से दूर रखें, और कटाई से पहले लेबल पर लिखी प्रतीक्षा अवधि का पालन करें।",
    mr: "सुरक्षा सूचना. फवारणी करताना नेहमी हातमोजे व मास्क वापरा, पहाटे किंवा संध्याकाळी फवारणी करा, मुलांना व जनावरांना शेतापासून दूर ठेवा आणि काढणीपूर्वी लेबलवरील प्रतीक्षा कालावधी पाळा.",
  },
  end: {
    en: "That is the complete explanation. For any doubt contact your nearest Krishi Vigyan Kendra.",
    hi: "यही पूरी जानकारी है। किसी भी संदेह के लिए अपने नज़दीकी कृषि विज्ञान केंद्र से संपर्क करें।",
    mr: "हीच संपूर्ण माहिती आहे. कोणतीही शंका असल्यास जवळच्या कृषी विज्ञान केंद्राशी संपर्क साधा.",
  },
  step: { en: "Step", hi: "चरण", mr: "पायरी" },
};

function steps(list: string[], lang: Lang) {
  return list.map((s, i) => `${TX.step[lang]} ${i + 1}. ${s}`).join(" ");
}

export function buildNarration(opts: {
  treatment: Treatment;
  severity: number;
  healthScore: number;
  confidence: number;
  advisoryMessage?: string;
  lang: Lang;
  status?: "ok" | "uncertain" | "mismatch" | "unsupported";
  warnTitle?: string;
  warnMessage?: string;
}): string {
  const { treatment, severity, healthScore, confidence, advisoryMessage, lang, status = "ok" } = opts;
  const parts: string[] = [TX.intro[lang]];

  if (status !== "ok") {
    if (opts.warnTitle) parts.push(`${opts.warnTitle}.`);
    if (opts.warnMessage) parts.push(opts.warnMessage);
    parts.push(TX.end[lang]);
    return parts.join(" ");
  }

  parts.push(TX.detected(treatment.crop[lang], treatment.name[lang])[lang]);
  parts.push(TX.stats(severity, healthScore, confidence)[lang]);

  if (treatment.key === "healthy_leaf") {
    parts.push(HEALTHY[lang]);
  } else {
    const about = ABOUT[treatment.key] ?? GENERIC;
    parts.push(TX.what[lang], about.cause[lang]);
    parts.push(TX.signs[lang], about.symptoms[lang]);
    parts.push(TX.spreads[lang], about.spread[lang]);
    parts.push(TX.ifIgnored[lang], about.risk[lang]);
  }

  if (advisoryMessage) parts.push(TX.weather[lang], advisoryMessage);

  if (treatment.chemical[lang]?.length) parts.push(TX.chemical[lang], steps(treatment.chemical[lang], lang));
  if (treatment.organic[lang]?.length) parts.push(TX.organic[lang], steps(treatment.organic[lang], lang));
  if (treatment.prevention[lang]?.length) parts.push(TX.prevention[lang], steps(treatment.prevention[lang], lang));

  if (treatment.key !== "healthy_leaf") parts.push(TX.safety[lang]);
  parts.push(TX.end[lang]);

  return parts.join(" ");
}
