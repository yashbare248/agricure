import { FlaskConical, Info } from "lucide-react";
import type { Lang } from "@/lib/treatments";

export const SAMPLE_DATA_TXT: Record<Lang, string> = {
  en: "Sample data shown — live regional reporting activates as more farmers join.",
  hi: "नमूना डेटा दिखाया जा रहा है — अधिक किसान जुड़ने पर लाइव क्षेत्रीय रिपोर्टिंग शुरू होगी।",
  mr: "नमुना डेटा दाखवला आहे — अधिक शेतकरी जोडले की थेट प्रादेशिक अहवाल सुरू होतील.",
};

export const PHASE2_TXT: Record<Lang, string> = {
  en: "Coming in Phase 2 — this is a preview. Reading works; publishing and contact actions unlock in the full release.",
  hi: "फेज़ 2 में आ रहा है — यह पूर्वावलोकन है। पढ़ना काम करता है; प्रकाशन व संपर्क क्रियाएँ पूर्ण रिलीज़ में खुलेंगी।",
  mr: "फेज २ मध्ये येत आहे — हे पूर्वावलोकन आहे. वाचन चालते; प्रकाशन व संपर्क कृती पूर्ण आवृत्तीत उपलब्ध होतील.",
};

export const UNAVAILABLE_TXT: Record<Lang, string> = {
  en: "Available in the full release",
  hi: "पूर्ण रिलीज़ में उपलब्ध",
  mr: "पूर्ण आवृत्तीत उपलब्ध",
};

export function SampleDataBanner({ lang }: { lang: Lang }) {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-2xl border border-warning/50 bg-warning/10 px-3 py-2 text-[11px] font-semibold leading-relaxed text-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0 text-warning" />
      {SAMPLE_DATA_TXT[lang]}
    </p>
  );
}

export function Phase2Banner({ lang }: { lang: Lang }) {
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-warm/60 bg-amber-warm/15 px-4 py-3">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wider text-accent-foreground">
          Phase 2 Preview
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-relaxed">{PHASE2_TXT[lang]}</p>
      </div>
    </div>
  );
}
