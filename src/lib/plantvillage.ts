import type { L, Lang, Treatment } from "./treatments";

/** Crops the PlantVillage-trained model can actually recognise. */
export type CropDef = { key: string; emoji: string; label: L; supported: boolean };

export const CROP_CATALOG: CropDef[] = [
  { key: "apple", emoji: "🍎", supported: true, label: { en: "Apple", hi: "सेब", mr: "सफरचंद" } },
  { key: "blueberry", emoji: "🫐", supported: true, label: { en: "Blueberry", hi: "ब्लूबेरी", mr: "ब्लूबेरी" } },
  { key: "cherry", emoji: "🍒", supported: true, label: { en: "Cherry", hi: "चेरी", mr: "चेरी" } },
  { key: "corn", emoji: "🌽", supported: true, label: { en: "Corn / Maize", hi: "मक्का", mr: "मका" } },
  { key: "grape", emoji: "🍇", supported: true, label: { en: "Grape", hi: "अंगूर", mr: "द्राक्ष" } },
  { key: "orange", emoji: "🍊", supported: true, label: { en: "Orange", hi: "संतरा", mr: "संत्रा" } },
  { key: "peach", emoji: "🍑", supported: true, label: { en: "Peach", hi: "आड़ू", mr: "पीच" } },
  { key: "pepper", emoji: "🫑", supported: true, label: { en: "Bell Pepper", hi: "शिमला मिर्च", mr: "ढोबळी मिरची" } },
  { key: "potato", emoji: "🥔", supported: true, label: { en: "Potato", hi: "आलू", mr: "बटाटा" } },
  { key: "raspberry", emoji: "🍓", supported: true, label: { en: "Raspberry", hi: "रसभरी", mr: "रासबेरी" } },
  { key: "soybean", emoji: "🌱", supported: true, label: { en: "Soybean", hi: "सोयाबीन", mr: "सोयाबीन" } },
  { key: "squash", emoji: "🎃", supported: true, label: { en: "Squash", hi: "कद्दू", mr: "भोपळा" } },
  { key: "strawberry", emoji: "🍓", supported: true, label: { en: "Strawberry", hi: "स्ट्रॉबेरी", mr: "स्ट्रॉबेरी" } },
  { key: "tomato", emoji: "🍅", supported: true, label: { en: "Tomato", hi: "टमाटर", mr: "टोमॅटो" } },
  { key: "rice", emoji: "🌾", supported: false, label: { en: "Rice", hi: "धान", mr: "भात" } },
  { key: "cotton", emoji: "🌿", supported: false, label: { en: "Cotton", hi: "कपास", mr: "कापूस" } },
  { key: "wheat", emoji: "🌾", supported: false, label: { en: "Wheat", hi: "गेहूँ", mr: "गहू" } },
  { key: "sugarcane", emoji: "🎋", supported: false, label: { en: "Sugarcane", hi: "गन्ना", mr: "ऊस" } },
];

export const cropByKey = (key: string | null | undefined) =>
  CROP_CATALOG.find((c) => c.key === key) ?? null;

export const SUPPORTED_CROP_KEYS = CROP_CATALOG.filter((c) => c.supported).map((c) => c.key);

export const supportedCropList = (lang: Lang) =>
  CROP_CATALOG.filter((c) => c.supported)
    .map((c) => c.label[lang])
    .join(", ");

/** Normalises the crop portion of a "Crop___Disease" label to a catalog key. */
function cropKeyFromToken(token: string): string | null {
  const t = token.toLowerCase().replace(/[^a-z]/g, "");
  if (t.startsWith("apple")) return "apple";
  if (t.startsWith("blueberry")) return "blueberry";
  if (t.startsWith("cherry")) return "cherry";
  if (t.startsWith("corn") || t.startsWith("maize")) return "corn";
  if (t.startsWith("grape")) return "grape";
  if (t.startsWith("orange") || t.startsWith("citrus")) return "orange";
  if (t.startsWith("peach")) return "peach";
  if (t.startsWith("pepper") || t.includes("bell")) return "pepper";
  if (t.startsWith("potato")) return "potato";
  if (t.startsWith("raspberry")) return "raspberry";
  if (t.startsWith("soybean") || t.startsWith("soy")) return "soybean";
  if (t.startsWith("squash")) return "squash";
  if (t.startsWith("strawberry")) return "strawberry";
  if (t.startsWith("tomato")) return "tomato";
  if (t.startsWith("rice") || t.startsWith("paddy")) return "rice";
  if (t.startsWith("cotton")) return "cotton";
  if (t.startsWith("wheat")) return "wheat";
  if (t.startsWith("sugarcane")) return "sugarcane";
  return null;
}

type DiseaseDef = { slug: string; label: L; severity: number };

/** All disease portions across the 38 PlantVillage classes. */
const DISEASES: DiseaseDef[] = [
  { slug: "healthy", severity: 2, label: { en: "Healthy Leaf", hi: "स्वस्थ पत्ती", mr: "निरोगी पान" } },
  { slug: "applescab", severity: 45, label: { en: "Apple Scab", hi: "सेब का स्कैब रोग", mr: "सफरचंदावरील खपली रोग" } },
  { slug: "blackrot", severity: 55, label: { en: "Black Rot", hi: "काला सड़न रोग", mr: "काळी कूज" } },
  { slug: "cedarapplerust", severity: 40, label: { en: "Cedar Apple Rust", hi: "सीडर-सेब रतुआ", mr: "सीडर-सफरचंद तांबेरा" } },
  { slug: "powderymildew", severity: 38, label: { en: "Powdery Mildew", hi: "चूर्णिल आसिता", mr: "भुरी रोग" } },
  { slug: "cercosporaleafspotgrayleafspot", severity: 42, label: { en: "Grey Leaf Spot", hi: "धूसर पर्ण धब्बा", mr: "करडे पानठिपके" } },
  { slug: "commonrust", severity: 36, label: { en: "Common Rust", hi: "सामान्य रतुआ", mr: "सामान्य तांबेरा" } },
  { slug: "northernleafblight", severity: 50, label: { en: "Northern Leaf Blight", hi: "उत्तरी पर्ण झुलसा", mr: "उत्तरी पानकरपा" } },
  { slug: "escablackmeasles", severity: 58, label: { en: "Esca (Black Measles)", hi: "एस्का (ब्लैक मीज़ल्स)", mr: "एस्का (काळे ठिपके)" } },
  { slug: "leafblightisariopsisleafspot", severity: 44, label: { en: "Isariopsis Leaf Blight", hi: "इसारिओप्सिस पर्ण झुलसा", mr: "इसारिओप्सिस पानकरपा" } },
  { slug: "haunglongbingcitrusgreening", severity: 78, label: { en: "Citrus Greening (HLB)", hi: "नींबू ग्रीनिंग (HLB)", mr: "सिट्रस ग्रीनिंग (HLB)" } },
  { slug: "bacterialspot", severity: 46, label: { en: "Bacterial Spot", hi: "जीवाणु धब्बा रोग", mr: "जिवाणू ठिपके" } },
  { slug: "earlyblight", severity: 35, label: { en: "Early Blight", hi: "अगेती झुलसा रोग", mr: "अर्ली ब्लाईट (तांबरा)" } },
  { slug: "lateblight", severity: 70, label: { en: "Late Blight", hi: "पछेती झुलसा रोग", mr: "उशिरा येणारा करपा" } },
  { slug: "leafscorch", severity: 40, label: { en: "Leaf Scorch", hi: "पर्ण झुलसन", mr: "पान करपणे" } },
  { slug: "leafmold", severity: 38, label: { en: "Leaf Mould", hi: "पर्ण फफूंदी", mr: "पानावरील बुरशी" } },
  { slug: "septorialeafspot", severity: 44, label: { en: "Septoria Leaf Spot", hi: "सेप्टोरिया पर्ण धब्बा", mr: "सेप्टोरिया पानठिपके" } },
  { slug: "spidermitestwospottedspidermite", severity: 41, label: { en: "Two-spotted Spider Mite", hi: "दो-धब्बेदार मकड़ी माइट", mr: "दोन ठिपक्यांची कोळी कीड" } },
  { slug: "targetspot", severity: 39, label: { en: "Target Spot", hi: "टारगेट स्पॉट", mr: "टार्गेट स्पॉट" } },
  { slug: "tomatoyellowleafcurlvirus", severity: 62, label: { en: "Yellow Leaf Curl Virus", hi: "पीला पत्ती मरोड़ विषाणु", mr: "पिवळा पानगुंडाळ विषाणू" } },
  { slug: "tomatomosaicvirus", severity: 52, label: { en: "Mosaic Virus", hi: "मोज़ेक विषाणु", mr: "मोझॅक विषाणू" } },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

function diseaseFromToken(token: string): DiseaseDef {
  const s = slugify(token);
  const exact = DISEASES.find((d) => d.slug === s);
  if (exact) return exact;
  const partial = DISEASES.find((d) => s.includes(d.slug) || d.slug.includes(s));
  if (partial) return partial;
  const pretty = token.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
  return { slug: s, severity: 40, label: { en: pretty, hi: pretty, mr: pretty } };
}

const GENERIC = {
  chemical: {
    en: [
      "Consult your local KVK / agri-input dealer for a label-approved fungicide or insecticide for this crop and disease.",
      "Apply a broad-spectrum protectant such as Mancozeb 75% WP @ 2 g per litre of water, covering both leaf surfaces.",
      "Repeat after 10–12 days and rotate the active ingredient to avoid resistance. Observe the label waiting period before harvest.",
    ],
    hi: [
      "इस फसल व रोग हेतु स्वीकृत दवा के लिए अपने KVK / कृषि दुकानदार से सलाह लें।",
      "व्यापक सुरक्षात्मक दवा जैसे मैंकोजेब 75% WP @ 2 ग्राम/लीटर पानी, पत्ती के दोनों ओर छिड़कें।",
      "10–12 दिन बाद दोहराएँ व दवा बदलें। कटाई से पहले लेबल की प्रतीक्षा अवधि का पालन करें।",
    ],
    mr: [
      "या पीक व रोगासाठी मान्यताप्राप्त औषधासाठी स्थानिक KVK / कृषी दुकानदाराचा सल्ला घ्या.",
      "व्यापक संरक्षक औषध उदा. मॅन्कोझेब ७५% WP @ २ ग्रॅम/लिटर पाणी, पानाच्या दोन्ही बाजूंनी फवारा.",
      "१०–१२ दिवसांनी पुन्हा फवारा व औषध बदला. काढणीपूर्वी लेबलवरील प्रतीक्षा काळ पाळा.",
    ],
  },
  organic: {
    en: [
      "Neem oil (1500 ppm) 5 ml/L with 1 ml sticker, sprayed in the evening.",
      "Trichoderma viride @ 5 g/L as a soil drench around the root zone.",
      "Pseudomonas fluorescens @ 10 g/L foliar spray every 10 days.",
    ],
    hi: [
      "नीम तेल (1500 ppm) 5 मिली/लीटर + 1 मिली स्टिकर, शाम को छिड़कें।",
      "ट्राइकोडर्मा विरिडी @ 5 ग्राम/लीटर जड़ क्षेत्र में डालें।",
      "स्यूडोमोनास फ्लोरेसेंस @ 10 ग्राम/लीटर हर 10 दिन में छिड़कें।",
    ],
    mr: [
      "निंबोळी तेल (१५०० ppm) ५ मिली/लिटर + १ मिली स्टिकर, संध्याकाळी फवारा.",
      "ट्रायकोडर्मा व्हिरिडी @ ५ ग्रॅम/लिटर मुळाभोवती आळवणी करा.",
      "स्यूडोमोनास फ्लुरेसन्स @ १० ग्रॅम/लिटर दर १० दिवसांनी फवारा.",
    ],
  },
  prevention: {
    en: [
      "Remove and destroy infected leaves; never compost them in the field.",
      "Avoid overhead irrigation and water early in the day so leaves dry fast.",
      "Follow crop rotation and keep field borders weed-free to break the disease cycle.",
    ],
    hi: [
      "संक्रमित पत्तियाँ हटाकर नष्ट करें; खेत में खाद न बनाएँ।",
      "ऊपर से सिंचाई न करें, सुबह पानी दें ताकि पत्ते जल्दी सूखें।",
      "फसल चक्र अपनाएँ व मेड़ें खरपतवार मुक्त रखें।",
    ],
    mr: [
      "रोगट पाने काढून नष्ट करा; शेतात कंपोस्ट करू नका.",
      "वरून पाणी देऊ नका, सकाळी पाणी द्या म्हणजे पाने लवकर सुकतील.",
      "पीक फेरपालट करा व बांध तणमुक्त ठेवा.",
    ],
  },
};

const HEALTHY_ADVICE = {
  chemical: {
    en: [
      "No fungicide required. Do not spray preventively without visible symptoms.",
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
    en: ["Jeevamrut soil application once every 15 days.", "Panchagavya 3% foliar spray to boost natural immunity."],
    hi: ["हर 15 दिन में जीवामृत मिट्टी में डालें।", "3% पंचगव्य छिड़कें।"],
    mr: ["दर १५ दिवसांनी जीवामृत जमिनीत द्या.", "३% पंचगव्य फवारा."],
  },
  prevention: GENERIC.prevention,
};

export type ParsedLabel = {
  cropKey: string | null;
  cropToken: string;
  diseaseToken: string;
  healthy: boolean;
};

/** Parses the model's "Crop___Disease" label format. */
export function parseLabel(label: string): ParsedLabel {
  const parts = label.split("___");
  const cropToken = (parts[0] ?? label).trim();
  const diseaseToken = (parts[1] ?? (parts.length > 1 ? "" : "unknown")).trim();
  return {
    cropKey: cropKeyFromToken(cropToken),
    cropToken,
    diseaseToken,
    healthy: slugify(diseaseToken).includes("healthy"),
  };
}

/** Builds a Treatment for any parsed PlantVillage class, generic advice when no dosage table exists. */
export function treatmentFromLabel(
  parsed: ParsedLabel,
  specific: (key: string) => Treatment | undefined,
): Treatment {
  const crop = cropByKey(parsed.cropKey);
  const disease = diseaseFromToken(parsed.diseaseToken);
  const specificKey = `${parsed.cropKey}_${disease.slug}`;
  const known =
    specific(specificKey) ??
    (parsed.healthy ? specific("healthy_leaf") : undefined) ??
    (parsed.cropKey === "apple" && disease.slug === "applescab" ? specific("apple_scab") : undefined) ??
    (parsed.cropKey === "potato" && disease.slug === "lateblight" ? specific("potato_late_blight") : undefined) ??
    (parsed.cropKey === "tomato" && disease.slug === "earlyblight" ? specific("tomato_early_blight") : undefined);
  if (known) return known;

  const cropLabel: L = crop?.label ?? { en: parsed.cropToken, hi: parsed.cropToken, mr: parsed.cropToken };
  const name: L = {
    en: `${cropLabel.en} ${disease.label.en}`,
    hi: `${cropLabel.hi} ${disease.label.hi}`,
    mr: `${cropLabel.mr} ${disease.label.mr}`,
  };
  const advice = parsed.healthy ? HEALTHY_ADVICE : GENERIC;
  return {
    key: specificKey,
    emoji: crop?.emoji ?? "🌱",
    crop: cropLabel,
    name,
    severity: disease.severity,
    healthScore: Math.max(5, 100 - disease.severity - 4),
    confidence: 90,
    chemical: advice.chemical,
    organic: advice.organic,
    prevention: advice.prevention,
  };
}
