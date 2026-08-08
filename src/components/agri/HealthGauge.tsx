import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export function HealthGauge({ score }: { score: number }) {
  const [shown, setShown] = useState(0);
  const { t } = useI18n();

  useEffect(() => {
    setShown(0);
    const id = setTimeout(() => setShown(score), 80);
    return () => clearTimeout(id);
  }, [score]);

  const tone =
    score >= 80 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--danger)";
  const label = score >= 80 ? t("healthy") : score >= 50 ? t("moderate") : t("severe");
  const r = 78;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center">
      <div className="relative size-48">
        <svg viewBox="0 0 180 180" className="size-full -rotate-90">
          <circle cx="90" cy="90" r={r} fill="none" stroke="var(--muted)" strokeWidth="14" />
          <circle
            cx="90"
            cy="90"
            r={r}
            fill="none"
            stroke={tone}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * shown) / 100}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black tabular-nums" style={{ color: tone }}>
            {shown}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            / 100
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm font-bold uppercase tracking-wide" style={{ color: tone }}>
        {label}
      </p>
      <p className="text-xs text-muted-foreground">{t("healthScore")}</p>
    </div>
  );
}
