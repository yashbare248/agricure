import { useState } from "react";
import { Mic } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { AgronomistChat } from "./AgronomistChat";
import { VoiceConversation } from "./VoiceConversation";
import { useAgriMitraContext } from "@/lib/agrimitra-context";

const TXT = {
  ask: { en: "Ask AgriMitra", hi: "AgriMitra से पूछें", mr: "AgriMitra ला विचारा" },
  sub: {
    en: "Speak your question in Marathi, Hindi or English",
    hi: "अपना सवाल मराठी, हिंदी या अंग्रेज़ी में बोलें",
    mr: "तुमचा प्रश्न मराठी, हिंदी किंवा इंग्रजीत बोला",
  },
};

export function VoiceFab() {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const { result, soil, advisoryMessage } = useAgriMitraContext();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glow-cta fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105 md:bottom-6"
        aria-label={TXT.ask[lang]}
      >
        <span className="relative grid place-items-center">
          <span className="pulse-ring absolute size-8 rounded-full bg-primary-foreground/30" />
          <Mic className="relative size-5" />
        </span>
        <span className="hidden sm:inline">🎙️ {TXT.ask[lang]}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85dvh] flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>🎙️ {TXT.ask[lang]}</DialogTitle>
            <p className="text-xs text-muted-foreground">{TXT.sub[lang]}</p>
          </DialogHeader>
          {result && result.status === "ok" ? (
            <VoiceConversation
              embedded
              result={result}
              soil={soil}
              {...(advisoryMessage ? { advisoryMessage } : {})}
            />
          ) : (
            <AgronomistChat compact />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
