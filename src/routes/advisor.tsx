import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Bot } from "lucide-react";
import { AppShell } from "@/components/agri/AppShell";
import { AgronomistChat } from "@/components/agri/AgronomistChat";
import { useI18n } from "@/lib/i18n";
import { readScanContext } from "@/lib/scan-context";

export const Route = createFileRoute("/advisor")({
  head: () => ({
    meta: [
      { title: "Krishi-Gyan AI Doctor — AgriCure AI Expert Advisory" },
      {
        name: "description",
        content:
          "Chat or speak with an ICAR/KVK-guided AI agronomist for dosage, pre-harvest intervals and organic alternatives in English, Hindi and Marathi.",
      },
      { property: "og:title", content: "Krishi-Gyan AI Doctor — AgriCure AI" },
      {
        property: "og:description",
        content: "Context-aware crop advice from an AI agronomist trained on ICAR / KVK guidelines.",
      },
    ],
  }),
  component: AdvisorPage,
});

const TXT = {
  title: { en: "Krishi-Gyan AI Doctor", hi: "कृषि-ज्ञान AI डॉक्टर", mr: "कृषी-ज्ञान AI डॉक्टर" },
  sub: {
    en: "Context-aware advice from your latest scan, soil profile and region",
    hi: "आपकी नवीनतम जाँच, मिट्टी व क्षेत्र के अनुसार सलाह",
    mr: "तुमची अलीकडील तपासणी, माती व प्रदेशानुसार सल्ला",
  },
  ctx: { en: "Scan context", hi: "जाँच संदर्भ", mr: "तपासणी संदर्भ" },
  verified: {
    en: "ICAR / KVK Guidelines Verified",
    hi: "ICAR / KVK दिशानिर्देश सत्यापित",
    mr: "ICAR / KVK मार्गदर्शक पडताळलेले",
  },
};

function AdvisorPage() {
  const { lang } = useI18n();
  const ctx = typeof window === "undefined" ? "" : readScanContext();

  return (
    <AppShell>
      <section className="hero-gradient rise-in mb-5 rounded-3xl px-5 py-7 text-forest-foreground">
        <h1 className="flex items-center gap-2 text-2xl font-black sm:text-3xl">
          <Bot className="size-7" /> 🤖 {TXT.title[lang]}
        </h1>
        <p className="mt-2 max-w-lg text-sm opacity-90">{TXT.sub[lang]}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-forest-foreground/15 px-3 py-1.5 text-xs font-bold">
          <BadgeCheck className="size-3.5" /> {TXT.verified[lang]}
        </p>
      </section>

      {ctx && (
        <p className="mb-4 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-xs font-semibold text-primary">
          {TXT.ctx[lang]}: {ctx}
        </p>
      )}

      <div className="glass flex min-h-[60vh] flex-col rounded-3xl p-4">
        <AgronomistChat />
      </div>
    </AppShell>
  );
}
