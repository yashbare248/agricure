import { cropByKey, parseLabel, treatmentFromLabel } from "./plantvillage";

export type Lang = "en" | "hi" | "mr";
export type L = Record<Lang, string>;

export type Treatment = {
  key: string;
  crop: L;
  name: L;
  severity: number; // infection %
  healthScore: number; // 0-100
  confidence: number;
  emoji: string;
  chemical: Record<Lang, string[]>;
  organic: Record<Lang, string[]>;
  prevention: Record<Lang, string[]>;
};

export const TREATMENTS: Treatment[] = [
  {
    key: "tomato_early_blight",
    emoji: "🍅",
    crop: { en: "Tomato", hi: "टमाटर", mr: "टोमॅटो" },
    name: {
      en: "Tomato Early Blight",
      hi: "टमाटर अगेती झुलसा रोग",
      mr: "टोमॅटोवर तांबरा (अर्ली ब्लाईट)",
    },
    severity: 35,
    healthScore: 62,
    confidence: 96.4,
    chemical: {
      en: [
        "Mancozeb 75% WP @ 2 g per litre of water — spray on both leaf surfaces.",
        "Alternate with Chlorothalonil 75% WP @ 2 g/L after 10 days to avoid resistance.",
        "Repeat 2–3 sprays at 10–12 day intervals. Stop 7 days before harvest.",
      ],
      hi: [
        "मैंकोजेब 75% WP @ 2 ग्राम प्रति लीटर पानी — पत्ती के दोनों ओर छिड़काव करें।",
        "10 दिन बाद क्लोरोथैलोनिल 75% WP @ 2 ग्राम/लीटर बदल-बदल कर प्रयोग करें।",
        "10–12 दिन के अंतराल पर 2–3 छिड़काव करें। कटाई से 7 दिन पहले रोक दें।",
      ],
      mr: [
        "मॅन्कोझेब ७५% WP @ २ ग्रॅम प्रति लिटर पाणी — पानाच्या दोन्ही बाजूंनी फवारणी करा.",
        "१० दिवसांनी क्लोरोथॅलोनिल ७५% WP @ २ ग्रॅम/लिटर आलटून पालटून वापरा.",
        "१०–१२ दिवसांच्या अंतराने २–३ फवारण्या घ्या. काढणीच्या ७ दिवस आधी थांबवा.",
      ],
    },
    organic: {
      en: [
        "Neem oil (1500 ppm) 5 ml/L + 1 ml sticker, spray in the evening.",
        "Trichoderma viride soil drench @ 5 g/L around the root zone.",
        "Buttermilk-based spray (200 ml/L) every 7 days as a mild antifungal.",
      ],
      hi: [
        "नीम तेल (1500 ppm) 5 मिली/लीटर + 1 मिली स्टिकर, शाम को छिड़कें।",
        "जड़ क्षेत्र में ट्राइकोडर्मा विरिडी @ 5 ग्राम/लीटर डालें।",
        "हर 7 दिन में छाछ का घोल (200 मिली/लीटर) छिड़कें।",
      ],
      mr: [
        "निंबोळी तेल (१५०० ppm) ५ मिली/लिटर + १ मिली स्टिकर, संध्याकाळी फवारा.",
        "मुळाभोवती ट्रायकोडर्मा व्हिरिडी @ ५ ग्रॅम/लिटर आळवणी करा.",
        "दर ७ दिवसांनी ताकाचे द्रावण (२०० मिली/लिटर) फवारा.",
      ],
    },
    prevention: {
      en: [
        "Avoid overhead watering — use drip irrigation early in the day.",
        "Remove and burn infected lower leaves; do not compost them.",
        "Follow a 2-year crop rotation with cereals or legumes.",
      ],
      hi: [
        "ऊपर से सिंचाई न करें — सुबह ड्रिप सिंचाई का उपयोग करें।",
        "संक्रमित निचली पत्तियाँ तोड़कर जला दें, खाद में न डालें।",
        "अनाज या दलहन के साथ 2 वर्ष का फसल चक्र अपनाएँ।",
      ],
      mr: [
        "वरून पाणी देऊ नका — सकाळी ठिबक सिंचन वापरा.",
        "रोगट खालची पाने काढून जाळा; कंपोस्टमध्ये टाकू नका.",
        "तृणधान्य किंवा कडधान्यासोबत २ वर्षांची पीक फेरपालट करा.",
      ],
    },
  },
  {
    key: "apple_scab",
    emoji: "🍎",
    crop: { en: "Apple", hi: "सेब", mr: "सफरचंद" },
    name: { en: "Apple Scab", hi: "सेब का स्कैब रोग", mr: "सफरचंदावरील खपली रोग" },
    severity: 48,
    healthScore: 54,
    confidence: 94.1,
    chemical: {
      en: [
        "Captan 50% WP @ 3 g/L at green-tip and pink-bud stage.",
        "Dodine 65% WP @ 0.75 g/L when infection pressure is high.",
        "Maximum 4 sprays per season; rotate active ingredients.",
      ],
      hi: [
        "कैप्टान 50% WP @ 3 ग्राम/लीटर हरी कली व गुलाबी कली अवस्था पर।",
        "संक्रमण अधिक होने पर डोडीन 65% WP @ 0.75 ग्राम/लीटर।",
        "प्रति सीजन अधिकतम 4 छिड़काव; दवाइयाँ बदलते रहें।",
      ],
      mr: [
        "कॅप्टन ५०% WP @ ३ ग्रॅम/लिटर हिरव्या व गुलाबी कळी अवस्थेत.",
        "प्रादुर्भाव जास्त असल्यास डोडीन ६५% WP @ ०.७५ ग्रॅम/लिटर.",
        "हंगामात जास्तीत जास्त ४ फवारण्या; औषधे बदलत रहा.",
      ],
    },
    organic: {
      en: [
        "Sulphur 80% WG @ 2 g/L — organic-approved protectant spray.",
        "Neem cake 200 g per tree in the basin to suppress spores.",
        "Spray 1% potassium bicarbonate solution after rainfall.",
      ],
      hi: [
        "सल्फर 80% WG @ 2 ग्राम/लीटर — जैविक स्वीकृत छिड़काव।",
        "प्रति पेड़ 200 ग्राम नीम खली थाले में डालें।",
        "बारिश के बाद 1% पोटैशियम बाइकार्बोनेट घोल छिड़कें।",
      ],
      mr: [
        "सल्फर ८०% WG @ २ ग्रॅम/लिटर — सेंद्रिय मान्यताप्राप्त फवारणी.",
        "प्रति झाड २०० ग्रॅम निंबोळी पेंड आळ्यात टाका.",
        "पावसानंतर १% पोटॅशियम बायकार्बोनेट द्रावण फवारा.",
      ],
    },
    prevention: {
      en: [
        "Rake and destroy fallen leaves in winter to break the spore cycle.",
        "Prune the canopy for airflow and quick leaf drying.",
        "Plant scab-resistant varieties in new orchards.",
      ],
      hi: [
        "सर्दियों में गिरी पत्तियाँ इकट्ठा कर नष्ट करें।",
        "हवा के प्रवाह के लिए छँटाई करें ताकि पत्ते जल्दी सूखें।",
        "नए बागों में स्कैब-प्रतिरोधी किस्में लगाएँ।",
      ],
      mr: [
        "हिवाळ्यात गळलेली पाने गोळा करून नष्ट करा.",
        "हवा खेळती राहावी म्हणून छाटणी करा, पाने लवकर सुकतील.",
        "नवीन बागेत खपली-प्रतिरोधक जाती लावा.",
      ],
    },
  },
  {
    key: "potato_late_blight",
    emoji: "🥔",
    crop: { en: "Potato", hi: "आलू", mr: "बटाटा" },
    name: {
      en: "Potato Late Blight",
      hi: "आलू पछेती झुलसा रोग",
      mr: "बटाट्यावरील उशिरा येणारा करपा",
    },
    severity: 72,
    healthScore: 31,
    confidence: 97.8,
    chemical: {
      en: [
        "URGENT: Metalaxyl 8% + Mancozeb 64% WP @ 2.5 g/L immediately.",
        "Follow with Cymoxanil 8% + Mancozeb 64% @ 3 g/L after 7 days.",
        "Ensure full canopy coverage; spray before 10 AM.",
      ],
      hi: [
        "तुरंत: मेटालैक्सिल 8% + मैंकोजेब 64% WP @ 2.5 ग्राम/लीटर।",
        "7 दिन बाद साइमोक्सानिल 8% + मैंकोजेब 64% @ 3 ग्राम/लीटर।",
        "पूरे पौधे पर छिड़काव करें; सुबह 10 बजे से पहले करें।",
      ],
      mr: [
        "तातडीने: मेटालॅक्झिल ८% + मॅन्कोझेब ६४% WP @ २.५ ग्रॅम/लिटर.",
        "७ दिवसांनी सायमोक्सॅनिल ८% + मॅन्कोझेब ६४% @ ३ ग्रॅम/लिटर.",
        "संपूर्ण झाडावर फवारणी करा; सकाळी १० पूर्वी करा.",
      ],
    },
    organic: {
      en: [
        "Bordeaux mixture 1% as a protective copper spray.",
        "Pseudomonas fluorescens @ 10 g/L foliar spray weekly.",
        "Remove and bury infected haulms at least 50 cm deep.",
      ],
      hi: [
        "1% बोर्डो मिश्रण सुरक्षात्मक कॉपर छिड़काव के रूप में।",
        "स्यूडोमोनास फ्लोरेसेंस @ 10 ग्राम/लीटर साप्ताहिक छिड़काव।",
        "संक्रमित पौधे निकालकर 50 सेमी गहरा दबा दें।",
      ],
      mr: [
        "१% बोर्डो मिश्रण संरक्षक तांबे फवारणी म्हणून वापरा.",
        "स्यूडोमोनास फ्लुरेसन्स @ १० ग्रॅम/लिटर दर आठवड्याला फवारा.",
        "रोगट झाडे काढून ५० सेमी खोल पुरा.",
      ],
    },
    prevention: {
      en: [
        "Use certified disease-free seed tubers only.",
        "Earth up ridges well so tubers are never exposed to spores.",
        "Stop irrigation during cool, humid, cloudy spells.",
      ],
      hi: [
        "केवल प्रमाणित रोगमुक्त बीज कंद का प्रयोग करें।",
        "मेड़ों पर अच्छी मिट्टी चढ़ाएँ ताकि कंद खुले न रहें।",
        "ठंडे, नम, बादल वाले मौसम में सिंचाई रोक दें।",
      ],
      mr: [
        "फक्त प्रमाणित रोगमुक्त बियाणे बटाटे वापरा.",
        "सऱ्यांना चांगली भर द्या म्हणजे बटाटे उघडे पडणार नाहीत.",
        "थंड, दमट, ढगाळ हवामानात पाणी देणे थांबवा.",
      ],
    },
  },
  {
    key: "healthy_leaf",
    emoji: "🌿",
    crop: { en: "Mixed crop", hi: "मिश्रित फसल", mr: "मिश्र पीक" },
    name: { en: "Healthy Leaf", hi: "स्वस्थ पत्ती", mr: "निरोगी पान" },
    severity: 2,
    healthScore: 94,
    confidence: 98.6,
    chemical: {
      en: [
        "No fungicide required. Do not spray preventively without symptoms.",
        "Optional: 19:19:19 water-soluble fertiliser @ 5 g/L as a foliar tonic.",
      ],
      hi: [
        "किसी फफूंदनाशक की आवश्यकता नहीं। बिना लक्षण छिड़काव न करें।",
        "वैकल्पिक: 19:19:19 घुलनशील उर्वरक @ 5 ग्राम/लीटर पत्तियों पर।",
      ],
      mr: [
        "बुरशीनाशकाची गरज नाही. लक्षणांशिवाय फवारणी करू नका.",
        "पर्यायी: १९:१९:१९ विद्राव्य खत @ ५ ग्रॅम/लिटर पानांवर फवारा.",
      ],
    },
    organic: {
      en: [
        "Jeevamrut soil application once every 15 days.",
        "Panchagavya 3% foliar spray to boost natural immunity.",
      ],
      hi: [
        "हर 15 दिन में जीवामृत मिट्टी में डालें।",
        "प्राकृतिक रोग प्रतिरोधक क्षमता हेतु 3% पंचगव्य छिड़कें।",
      ],
      mr: [
        "दर १५ दिवसांनी जीवामृत जमिनीत द्या.",
        "नैसर्गिक प्रतिकारशक्तीसाठी ३% पंचगव्य फवारा.",
      ],
    },
    prevention: {
      en: [
        "Keep scouting fields twice a week for early symptoms.",
        "Maintain balanced NPK and adequate potassium for strong leaves.",
        "Keep field borders weed-free to reduce pest carry-over.",
      ],
      hi: [
        "सप्ताह में दो बार खेत का निरीक्षण करते रहें।",
        "संतुलित NPK व पर्याप्त पोटाश दें ताकि पत्ते मजबूत रहें।",
        "खेत की मेड़ों को खरपतवार मुक्त रखें।",
      ],
      mr: [
        "आठवड्यातून दोनदा शेताची पाहणी करत रहा.",
        "संतुलित NPK व पुरेसे पोटॅश द्या म्हणजे पाने मजबूत राहतील.",
        "बांध तणमुक्त ठेवा म्हणजे किडींचा प्रादुर्भाव कमी होईल.",
      ],
    },
  },
  {
    key: "rice_blast",
    emoji: "🌾",
    crop: { en: "Rice", hi: "धान", mr: "भात" },
    name: { en: "Rice Blast", hi: "धान का ब्लास्ट रोग", mr: "भातावरील करपा (ब्लास्ट)" },
    severity: 42,
    healthScore: 55,
    confidence: 93.2,
    chemical: {
      en: [
        "Tricyclazole 75% WP @ 0.6 g per litre of water at first spindle-shaped lesions.",
        "Alternate with Isoprothiolane 40% EC @ 1.5 ml/L after 12 days.",
        "Two sprays: at tillering and at boot-leaf stage. Stop 21 days before harvest.",
      ],
      hi: [
        "पहले धब्बे दिखते ही ट्राइसाइक्लाज़ोल 75% WP @ 0.6 ग्राम/लीटर छिड़कें।",
        "12 दिन बाद आइसोप्रोथायोलेन 40% EC @ 1.5 मिली/लीटर बदलकर प्रयोग करें।",
        "दो छिड़काव: कल्ले फूटते समय व गोभ अवस्था पर। कटाई से 21 दिन पहले रोकें।",
      ],
      mr: [
        "पहिले ठिपके दिसताच ट्रायसायक्लॅझोल ७५% WP @ ०.६ ग्रॅम/लिटर फवारा.",
        "१२ दिवसांनी आयसोप्रोथायोलेन ४०% EC @ १.५ मिली/लिटर आलटून पालटून वापरा.",
        "दोन फवारण्या: फुटवे व पोटरी अवस्थेत. काढणीच्या २१ दिवस आधी थांबवा.",
      ],
    },
    organic: {
      en: [
        "Pseudomonas fluorescens @ 10 g/L foliar spray at 10-day intervals.",
        "Seed treatment with Trichoderma harzianum @ 10 g/kg before the next sowing.",
        "Cow-urine extract (1:10) sprayed in the evening to harden the canopy.",
      ],
      hi: [
        "स्यूडोमोनास फ्लोरेसेंस @ 10 ग्राम/लीटर, 10 दिन के अंतराल पर छिड़कें।",
        "अगली बुवाई से पहले ट्राइकोडर्मा हर्जियानम @ 10 ग्राम/किग्रा बीज उपचार करें।",
        "गोमूत्र घोल (1:10) शाम को छिड़कें।",
      ],
      mr: [
        "स्यूडोमोनास फ्लुरोसेन्स @ १० ग्रॅम/लिटर, १० दिवसांच्या अंतराने फवारा.",
        "पुढील पेरणीपूर्वी ट्रायकोडर्मा हर्जियानम @ १० ग्रॅम/किलो बीजप्रक्रिया करा.",
        "गोमूत्र द्रावण (१:१०) संध्याकाळी फवारा.",
      ],
    },
    prevention: {
      en: [
        "Avoid excess nitrogen — split urea into 3 doses instead of 2.",
        "Keep 2–3 cm standing water; do not let the field dry and flood repeatedly.",
        "Use blast-tolerant varieties and destroy stubble after harvest.",
      ],
      hi: [
        "अधिक नाइट्रोजन न दें — यूरिया को 2 के बजाय 3 भागों में दें।",
        "खेत में 2–3 सेमी पानी बनाए रखें; बार-बार सुखाना-भरना टालें।",
        "ब्लास्ट सहनशील किस्में लगाएँ और कटाई बाद ठूँठ नष्ट करें।",
      ],
      mr: [
        "जास्त नत्र देऊ नका — युरिया २ ऐवजी ३ हप्त्यांत द्या.",
        "शेतात २–३ सेमी पाणी ठेवा; वारंवार आटवणे-भरणे टाळा.",
        "करपा सहनशील वाण वापरा व काढणीनंतर धसकटे नष्ट करा.",
      ],
    },
  },
  {
    key: "cotton_leaf_curl",
    emoji: "🌿",
    crop: { en: "Cotton", hi: "कपास", mr: "कापूस" },
    name: {
      en: "Cotton Leaf Curl Virus",
      hi: "कपास पत्ती मरोड़ विषाणु",
      mr: "कापूस पानगुंडाळ विषाणू",
    },
    severity: 51,
    healthScore: 46,
    confidence: 91.5,
    chemical: {
      en: [
        "The virus itself has no cure — control the whitefly vector with Diafenthiuron 50% WP @ 1.2 g/L.",
        "Alternate with Flonicamid 50% WG @ 0.3 g/L after 12 days to avoid resistance.",
        "Do not spray synthetic pyrethroids; they cause whitefly resurgence.",
      ],
      hi: [
        "विषाणु का सीधा इलाज नहीं — सफेद मक्खी हेतु डायफेनथ्यूरॉन 50% WP @ 1.2 ग्राम/लीटर छिड़कें।",
        "12 दिन बाद फ्लोनिकामिड 50% WG @ 0.3 ग्राम/लीटर बदलकर प्रयोग करें।",
        "सिंथेटिक पायरेथ्रॉइड न छिड़कें, इससे सफेद मक्खी बढ़ती है।",
      ],
      mr: [
        "विषाणूवर थेट उपाय नाही — पांढऱ्या माशीसाठी डायफेनथ्युरॉन ५०% WP @ १.२ ग्रॅम/लिटर फवारा.",
        "१२ दिवसांनी फ्लोनिकामिड ५०% WG @ ०.३ ग्रॅम/लिटर आलटून पालटून वापरा.",
        "सिंथेटिक पायरेथ्रॉइड फवारू नका, पांढरी माशी वाढते.",
      ],
    },
    organic: {
      en: [
        "Neem oil 5 ml/L + yellow sticky traps @ 10 per acre for whitefly trapping.",
        "Verticillium lecanii @ 5 g/L sprayed in the evening on the underside of leaves.",
        "Remove and burn severely curled plants to cut the virus source.",
      ],
      hi: [
        "नीम तेल 5 मिली/लीटर + पीले चिपचिपे ट्रैप 10 प्रति एकड़ लगाएँ।",
        "वर्टिसिलियम लेकानी @ 5 ग्राम/लीटर शाम को पत्तों की निचली सतह पर छिड़कें।",
        "अधिक मुड़े पौधे उखाड़कर जला दें।",
      ],
      mr: [
        "निंबोळी तेल ५ मिली/लिटर + पिवळे चिकट सापळे १० प्रति एकर लावा.",
        "व्हर्टिसिलियम लेकॅनी @ ५ ग्रॅम/लिटर संध्याकाळी पानाच्या खालच्या बाजूस फवारा.",
        "जास्त गुंडाळलेली झाडे उपटून जाळा.",
      ],
    },
    prevention: {
      en: [
        "Sow CLCuV-tolerant Bt hybrids and finish sowing before the whitefly peak.",
        "Keep field bunds free of weed hosts such as Xanthium and Abutilon.",
        "Grow a maize or bajra border row as a barrier crop against whitefly flight.",
      ],
      hi: [
        "सहनशील बीटी संकर बोएँ और सफेद मक्खी चरम से पहले बुवाई पूरी करें।",
        "मेड़ों पर खरपतवार (गोखरू, कंघी) न रहने दें।",
        "किनारे मक्का/बाजरा की कतार लगाएँ जो अवरोधक फसल का काम करे।",
      ],
      mr: [
        "सहनशील बीटी संकरित वाण पेरा व पांढऱ्या माशीच्या उद्रेकापूर्वी पेरणी पूर्ण करा.",
        "बांधावरील तण (गोखरू, पेटारी) काढून टाका.",
        "कडेने मका/बाजरीची ओळ लावा, ती अडथळा पीक म्हणून काम करते.",
      ],
    },
  },
  {
    key: "unsupported_crop",
    emoji: "⚠️",
    crop: { en: "Unrecognised crop", hi: "अपरिचित फसल", mr: "अनोळखी पीक" },
    name: {
      en: "Crop Not Yet Supported",
      hi: "यह फसल अभी समर्थित नहीं",
      mr: "हे पीक अद्याप समर्थित नाही",
    },
    severity: 0,
    healthScore: 0,
    confidence: 0,
    chemical: {
      en: [
        "Our current AI model does not recognise this crop, so no dosage can be recommended safely.",
        "Consult your local KVK office or agricultural officer before applying any chemical.",
      ],
      hi: [
        "हमारा वर्तमान AI मॉडल इस फसल को नहीं पहचानता, इसलिए कोई खुराक सुझाई नहीं जा सकती।",
        "कोई भी दवा छिड़कने से पहले अपने KVK कार्यालय या कृषि अधिकारी से सलाह लें।",
      ],
      mr: [
        "आमचे सध्याचे AI मॉडेल हे पीक ओळखत नाही, त्यामुळे सुरक्षित मात्रा सुचवता येत नाही.",
        "कोणतीही फवारणी करण्यापूर्वी स्थानिक KVK कार्यालय किंवा कृषी अधिकाऱ्याचा सल्ला घ्या.",
      ],
    },
    organic: {
      en: ["Follow general field hygiene: remove affected leaves and avoid overhead irrigation."],
      hi: ["सामान्य खेत स्वच्छता अपनाएँ: प्रभावित पत्तियाँ हटाएँ व ऊपर से सिंचाई न करें।"],
      mr: ["सामान्य शेत स्वच्छता पाळा: बाधित पाने काढा व वरून पाणी देऊ नका."],
    },
    prevention: {
      en: ["Try again with one of the crops our model currently supports."],
      hi: ["मॉडल द्वारा समर्थित किसी फसल के साथ पुनः प्रयास करें।"],
      mr: ["मॉडेलद्वारे समर्थित पिकांपैकी एका पिकासह पुन्हा प्रयत्न करा."],
    },
  },
];

export const byKey = (key: string) =>
  TREATMENTS.find((t) => t.key === key) ?? TREATMENTS[0]!;

const findTreatment = (key: string) => TREATMENTS.find((t) => t.key === key);

/**
 * Maps a raw model label ("Crop___Disease") to a treatment entry by parsing the
 * real crop and disease names. Unknown/unsupported crops route to the amber
 * "unsupported_crop" state instead of a confident-but-wrong diagnosis.
 */
export function mapLabelToTreatment(label: string): Treatment {
  const parsed = parseLabel(label);
  const crop = cropByKey(parsed.cropKey);
  if (!crop || !crop.supported) return byKey("unsupported_crop");
  return treatmentFromLabel(parsed, findTreatment);
}
