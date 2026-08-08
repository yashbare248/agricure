import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Footprints, Layers, Loader2, MapPin, Pencil, RotateCcw, Satellite, ShieldAlert, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SampleDataBanner } from "./PreviewBanner";
import { NASHIK, outbreaksAround, polygonAcres, distanceKm, type LatLon } from "@/lib/geo";

const SatelliteMap = lazy(() => import("./SatelliteMap"));

const FARM_KEY = "agricure.farm.boundary";
const RADIUS_KEY = "agricure.farm.radius";

const MapSkeleton = () => (
  <div className="grid h-full w-full place-items-center bg-secondary/60 text-sm text-muted-foreground">
    <Loader2 className="size-5 animate-spin" />
  </div>
);

export function GeoDiseaseMap({
  healthScore,
  diseaseName,
  wind,
}: {
  healthScore: number | null;
  diseaseName?: string;
  wind?: number;
}) {
  const { lang } = useI18n();
  const [coords, setCoords] = useState<{ lat: number; lon: number }>(NASHIK);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [live, setLive] = useState(false);
  const [view, setView] = useState<"satellite" | "topo">("satellite");
  const [radiusKm, setRadiusKm] = useState(10);
  const [farm, setFarm] = useState<LatLon[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [walking, setWalking] = useState(false);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    try {
      const f = localStorage.getItem(FARM_KEY);
      if (f) setFarm(JSON.parse(f) as LatLon[]);
      const r = localStorage.getItem(RADIUS_KEY);
      if (r) setRadiusKm(Number(r));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FARM_KEY, JSON.stringify(farm));
      localStorage.setItem(RADIUS_KEY, String(radiusKm));
    } catch {
      /* ignore */
    }
  }, [farm, radiusKm]);

  useEffect(() => () => {
    if (watchId.current != null && typeof navigator !== "undefined") navigator.geolocation.clearWatch(watchId.current);
  }, []);

  const outbreaks = useMemo(() => outbreaksAround(coords.lat, coords.lon), [coords.lat, coords.lon]);
  const windSpeed = wind ?? 14;
  const acres = useMemo(() => polygonAcres(farm), [farm]);

  const addPoint = (p: LatLon) => setFarm((prev) => [...prev, p]);

  const startWalk = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    setDrawing(false);
    setWalking(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCoords(p);
        setLive(true);
        setAccuracy(pos.coords.accuracy);
        // only record a new vertex once the farmer has moved ~8 m
        setFarm((prev) => {
          const last = prev[prev.length - 1];
          if (last && distanceKm(last, p) < 0.008) return prev;
          return [...prev, p];
        });
      },
      () => stopWalk(),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const stopWalk = () => {
    if (watchId.current != null && typeof navigator !== "undefined") navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setWalking(false);
  };

  const locate = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
        setLive(true);
        setLocating(false);
      },
      () => {
        setCoords(NASHIK);
        setLive(false);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const accLabel = accuracy == null ? "Default" : accuracy <= 50 ? "High" : accuracy <= 500 ? "Medium" : "Low";
  const disease = diseaseName ?? { en: "Tomato Early Blight", hi: "टमाटर अगेती झुलसा", mr: "टोमॅटो अर्ली ब्लाईट" }[lang];

  const alertText = {
    en: `3 nearby farms have reported ${disease} in the last 48 hours. Based on your live GPS position and current wind direction (${windSpeed} km/h SW), your crop is at a Moderate Risk of airborne spore infection. Take preventive neem oil or copper spray action today.`,
    hi: `पिछले 48 घंटों में आस-पास के 3 खेतों में ${disease} की सूचना मिली। आपकी लाइव GPS स्थिति और हवा की दिशा (${windSpeed} किमी/घंटा दक्षिण-पश्चिम) के अनुसार, आपकी फसल पर हवा से फैलने वाले संक्रमण का मध्यम जोखिम है। आज ही नीम तेल या कॉपर स्प्रे करें।`,
    mr: `गेल्या ४८ तासांत जवळील ३ शेतांमध्ये ${disease} आढळला. तुमच्या लाइव्ह GPS स्थानानुसार व वाऱ्याच्या दिशेनुसार (${windSpeed} किमी/तास नैऋत्य), तुमच्या पिकाला हवेतून बुरशी संसर्गाचा मध्यम धोका आहे. आजच निंबोळी तेल किंवा कॉपर फवारणी करा.`,
  }[lang];

  return (
    <section className="glass rise-in mt-6 rounded-3xl p-5 shadow-lg sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Satellite className="size-5 text-primary" />
          <h2 className="text-lg font-black sm:text-xl">Live Geo-Disease Satellite Map</h2>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
          Current Coordinates: Lat {coords.lat.toFixed(4)}, Long {coords.lon.toFixed(4)} | Accuracy: {accLabel}
        </span>
      </div>

      <SampleDataBanner lang={lang} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="pulse-ring inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-md transition hover:brightness-110 disabled:opacity-70"
        >
          {locating ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
          📍 Locate My Farm (Live GPS)
        </button>
        {live && (
          <span className="rounded-full bg-success/15 px-3 py-1 text-[11px] font-bold text-success">GPS locked</span>
        )}

        <div className="ml-auto inline-flex rounded-full border bg-card p-1">
          {(["satellite", "topo"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "satellite" ? "🛰️ Satellite View" : "🗺️ Topo Map View"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 rounded-2xl border bg-card/60 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Bio-security radius · {radiusKm} km
          </span>
          <input
            type="range"
            min={1}
            max={25}
            step={1}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--primary)]"
            aria-label="Bio-security radius in kilometres"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              stopWalk();
              setDrawing((d) => !d);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition ${
              drawing ? "bg-primary text-primary-foreground" : "border bg-card hover:bg-secondary"
            }`}
          >
            <Pencil className="size-3.5" /> {drawing ? "Tap map to add corners" : "Mark my farm"}
          </button>
          <button
            type="button"
            onClick={walking ? stopWalk : startWalk}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition ${
              walking ? "bg-danger text-white" : "border bg-card hover:bg-secondary"
            }`}
          >
            <Footprints className="size-3.5" /> {walking ? "Stop walking" : "Walk my border"}
          </button>
          <button
            type="button"
            onClick={() => setFarm((p) => p.slice(0, -1))}
            disabled={!farm.length}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-2 text-xs font-bold hover:bg-secondary disabled:opacity-40"
          >
            <RotateCcw className="size-3.5" /> Undo
          </button>
          <button
            type="button"
            onClick={() => {
              stopWalk();
              setFarm([]);
            }}
            disabled={!farm.length}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-2 text-xs font-bold text-danger hover:bg-secondary disabled:opacity-40"
          >
            <Trash2 className="size-3.5" /> Clear
          </button>
        </div>

        <p className="text-xs font-semibold text-muted-foreground sm:col-span-2">
          {farm.length >= 3
            ? `🟨 Farm block marked · ${acres.toFixed(2)} acres · ${farm.length} boundary points (drag any point to adjust)`
            : walking
              ? `Walking the border… ${farm.length} points recorded. Keep the phone with you and walk the full boundary.`
              : drawing
                ? "Tap each corner of your field on the map, then tap Mark my farm again to finish."
                : "Mark your farm by tapping corners on the map, or walk the boundary with GPS."}
        </p>
      </div>

      <div className="relative mt-4 h-[320px] overflow-hidden rounded-2xl border border-primary/20 shadow-lg sm:h-[420px]">
        <ClientOnly fallback={<MapSkeleton />}>
          <Suspense fallback={<MapSkeleton />}>
            <SatelliteMap
              lat={coords.lat}
              lon={coords.lon}
              view={view}
              outbreaks={outbreaks}
              lang={lang}
              healthScore={healthScore}
              radiusKm={radiusKm}
              farm={farm}
              drawing={drawing}
              onPick={addPoint}
              onMoveVertex={(i, p) => setFarm((prev) => prev.map((v, j) => (j === i ? p : v)))}
            />
          </Suspense>
        </ClientOnly>
        <span className="pointer-events-none absolute bottom-2 left-2 z-[500] rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-bold">
          <Layers className="mr-1 inline size-3" />
          {radiusKm} km bio-security radius
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-warning/50 bg-warning/10 p-4">
        <p className="flex items-center gap-2 text-sm font-black">
          <ShieldAlert className="size-4 text-warning" /> ⚠️ 10km Regional Bio-Security Alert
        </p>
        <p className="mt-2 text-sm font-semibold leading-relaxed">{alertText}</p>
      </div>
    </section>
  );
}
