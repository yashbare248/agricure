import { CloudRain, Droplets, Loader2, MapPin, Thermometer, Wind, Waves } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { LiveWeather } from "@/lib/weather.functions";

function aqiTone(aqi: number, scale: "local" | "uaqi" | "eu") {
  // UAQI runs 0-100 with higher = cleaner; local (CPCB/US) and EU scales are
  // the other way round.
  const clean = scale === "uaqi" ? aqi >= 70 : scale === "eu" ? aqi <= 40 : aqi <= 50;
  const middling = scale === "uaqi" ? aqi >= 40 : scale === "eu" ? aqi <= 70 : aqi <= 100;
  if (clean) return "bg-primary/10 text-primary";
  if (middling) return "bg-warning/15 text-warning";
  return "bg-danger/15 text-danger";
}

export function WeatherStrip({
  weather,
  loading,
  located,
}: {
  weather: LiveWeather | null;
  loading: boolean;
  located: boolean;
}) {
  const { t } = useI18n();

  if (loading || !weather) {
    return (
      <div className="glass mb-6 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 shrink-0 animate-spin" />
        <span className="min-w-0 truncate">{t("weatherLoading")}</span>
      </div>
    );
  }

  const rain = Math.max(weather.rainChance, weather.rainTomorrow);
  const air = weather.air ?? null;

  return (
    <div className="glass mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-4 py-3 sm:flex sm:flex-wrap sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <MapPin className="size-4 shrink-0 text-primary" />
        <span className="truncate text-sm font-semibold">{t("weatherNow")}</span>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {weather.live ? (located ? t("myLocation") : t("defaultLocation")) : t("sampleForecast")}
        </span>
        {weather.source === "google" && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            Google
          </span>
        )}
      </div>
      <dl className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold sm:col-auto">
        <div className="flex items-center gap-1.5">
          <Thermometer className="size-4 shrink-0 text-danger" aria-hidden />
          <dt className="sr-only">Temperature</dt>
          <dd>{weather.temp}°C</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="size-4 shrink-0 text-primary" aria-hidden />
          <dt className="sr-only">Humidity</dt>
          <dd>{weather.humidity}%</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <dt className="sr-only">Wind</dt>
          <dd>{weather.wind} km/h</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <CloudRain className="size-4 shrink-0 text-primary" aria-hidden />
          <dt className="sr-only">Rain probability</dt>
          <dd>{rain}%</dd>
        </div>
      </dl>
      {air && (
        <div className="col-span-2 flex w-full flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-2 text-sm sm:col-auto">
          <span className="flex items-center gap-1.5 font-semibold">
            <Waves className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            {t("airQuality")}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${aqiTone(air.aqi, air.scale ?? "local")}`}
          >
            {air.indexName || "AQI"} {air.aqi}
            {air.category ? ` · ${air.category}` : ""}
          </span>
          {air.dominant && (
            <span className="text-xs text-muted-foreground">
              {air.dominant.toUpperCase()}
            </span>
          )}
          {air.pm25 !== null && (
            <span className="text-xs text-muted-foreground">
              PM2.5 {Math.round(air.pm25)} µg/m³
            </span>
          )}
          {air.ozone !== null && (
            <span className="text-xs text-muted-foreground">
              O₃ {Math.round(air.ozone)} {air.ozoneUnit}
            </span>
          )}
          <span className="w-full text-xs text-muted-foreground sm:w-auto">
            {t("airQualityHint")}
          </span>
        </div>
      )}
    </div>
  );
}
