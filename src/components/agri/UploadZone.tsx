import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Loader2, Sprout, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { TREATMENTS } from "@/lib/treatments";
import { CROP_CATALOG } from "@/lib/plantvillage";
import { preloadLeafCnn } from "@/lib/leaf-cnn";

type Props = {
  preview: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
  onSample: (key: string) => void;
  onAnalyze: () => void;
  busy: boolean;
  activeSample: string | null;
  cropKey: string;
  onCropChange: (key: string) => void;
};

const CROP_TXT = {
  label: { en: "What crop is this?", hi: "यह कौन सी फसल है?", mr: "हे कोणते पीक आहे?" },
  placeholder: { en: "Select crop (required)", hi: "फसल चुनें (आवश्यक)", mr: "पीक निवडा (आवश्यक)" },
  notSupported: {
    en: "Diagnosed by the Google AI engine (open crop coverage)",
    hi: "Google AI इंजन से निदान (सभी फसलें शामिल)",
    mr: "Google AI इंजिनद्वारे निदान (सर्व पिके समाविष्ट)",
  },
};

export function UploadZone({
  preview,
  onFile,
  onClear,
  onSample,
  onAnalyze,
  busy,
  activeSample,
  cropKey,
  onCropChange,
}: Props) {
  const { t, lang } = useI18n();
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  // Warm the on-device model once a real photo is staged, so the first-pass
  // classification is instant when the farmer taps Analyze.
  useEffect(() => {
    if (preview && !activeSample) preloadLeafCnn();
  }, [preview, activeSample]);

  // Sample leaves are pre-cached demos and carry their own crop, so they don't
  // require the crop dropdown; real uploads still do.
  const ready = Boolean(activeSample) || Boolean(preview && cropKey);
  const selectedCrop = CROP_CATALOG.find((c) => c.key === cropKey);

  return (
    <section className="glass rounded-3xl p-4 sm:p-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        onClick={() => !preview && fileRef.current?.click()}
        className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          dragging ? "border-primary bg-primary/10" : "border-border bg-secondary/40"
        }`}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Uploaded crop leaf preview"
              className="max-h-56 w-auto rounded-xl object-cover shadow-lg"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-3 top-3 size-8 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              aria-label="Remove image"
            >
              <X className="size-4" />
            </Button>
          </>
        ) : (
          <>
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary">
              <ImageUp className="size-7" />
            </span>
            <p className="max-w-xs text-sm font-medium text-muted-foreground">{t("dropHere")}</p>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
          <ImageUp className="size-4" /> {t("browse")}
        </Button>
        <Button variant="outline" onClick={() => camRef.current?.click()} className="gap-2">
          <Camera className="size-4" /> {t("takePhoto")}
        </Button>
      </div>

      <div className="mt-5">
        <label
          htmlFor="crop-select"
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
        >
          {CROP_TXT.label[lang]}
        </label>
        <select
          id="crop-select"
          required
          value={cropKey}
          onChange={(e) => onCropChange(e.target.value)}
          className="mt-2 h-11 w-full rounded-xl border bg-card px-3 text-sm font-semibold outline-none focus:border-primary"
        >
          <option value="">{CROP_TXT.placeholder[lang]}</option>
          {CROP_CATALOG.map((c) => (
            <option key={c.key} value={c.key}>
              {c.emoji} {c.label[lang]}
              {c.supported ? "" : " •"}
            </option>
          ))}
        </select>
        {selectedCrop && !selectedCrop.supported && (
          <p className="mt-2 rounded-xl border border-primary/40 bg-primary/10 p-2 text-[11px] font-semibold">
            🔬 {selectedCrop.label[lang]} — {CROP_TXT.notSupported[lang]}
          </p>
        )}
      </div>

      <p className="mt-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {t("samples")}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {TREATMENTS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onSample(s.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
              activeSample === s.key
                ? "border-primary bg-primary text-primary-foreground shadow-md"
                : "bg-card hover:border-primary hover:text-primary"
            }`}
          >
            {s.emoji} {s.name[lang]}
          </button>
        ))}
      </div>

      <Button
        onClick={onAnalyze}
        disabled={!ready || busy}
        className="glow-cta mt-5 h-14 w-full rounded-2xl text-base font-extrabold disabled:opacity-50 disabled:shadow-none"
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 size-5 animate-spin" /> {t("analyzing")}
          </>
        ) : (
          <>
            {t("analyze")} <Sprout className="ml-2 size-5" />
          </>
        )}
      </Button>
    </section>
  );
}
