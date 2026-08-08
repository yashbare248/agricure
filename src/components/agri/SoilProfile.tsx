import { useEffect, useState } from "react";
import { Layers, Loader2, Satellite } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { SOILS, soilByKey, soilFromCoords, storeSoil, storedSoil, type SoilKey } from "@/lib/soil";

const TXT = {
  title: { en: "Soil Profile", hi: "मृदा प्रोफ़ाइल", mr: "माती प्रोफाइल" },
  sub: {
    en: "Dosage and spraying method are adjusted to your soil",
    hi: "खुराक व छिड़काव विधि आपकी मिट्टी के अनुसार",
    mr: "मात्रा व फवारणी पद्धत तुमच्या मातीनुसार",
  },
  detect: { en: "Detect from GPS", hi: "GPS से पहचानें", mr: "GPS वरून ओळखा" },
  detected: { en: "Auto-detected from SoilGrids", hi: "SoilGrids से स्वतः पहचाना", mr: "SoilGrids वरून स्वयंचलित" },
  manual: { en: "Manually selected", hi: "स्वयं चुना गया", mr: "स्वतः निवडलेले" },
};

export function SoilProfile({
  value,
  onChange,
}: {
  value: SoilKey;
  onChange: (k: SoilKey, auto: boolean) => void;
}) {
  const { lang } = useI18n();
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = storedSoil();
    if (s) onChange(s, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detect = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    setBusy(true);
    const apply = (lat: number, lon: number) => {
      const s = soilFromCoords(lat, lon);
      storeSoil(s.key);
      onChange(s.key, true);
      setAuto(true);
      setBusy(false);
    };
    navigator.geolocation.getCurrentPosition(
      (p) => apply(p.coords.latitude, p.coords.longitude),
      () => apply(20.0063, 73.7898),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  const active = soilByKey(value);

  return (
    <section className="glass mt-4 rounded-3xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <Layers className="size-4 text-primary" /> 🌱 {TXT.title[lang]}
          </h2>
          <p className="text-xs text-muted-foreground">{TXT.sub[lang]}</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 rounded-full bg-card" onClick={detect}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Satellite className="size-4" />}
          {TXT.detect[lang]}
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SOILS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              storeSoil(s.key);
              setAuto(false);
              onChange(s.key, false);
            }}
            className={`rounded-2xl border p-3 text-left transition-all ${
              s.key === value
                ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--color-primary)]"
                : "bg-card hover:bg-secondary"
            }`}
          >
            <span className="text-xl">{s.emoji}</span>
            <p className="mt-1 text-xs font-bold leading-tight">{s.label[lang]}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">pH {s.ph}</p>
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
          {auto ? TXT.detected[lang] : TXT.manual[lang]} · {active.label[lang]} · pH {active.ph} ·
          OC {active.carbon}
        </p>
        <p className="mt-1 text-sm font-medium leading-relaxed">{active.advisory[lang]}</p>
      </div>
    </section>
  );
}
