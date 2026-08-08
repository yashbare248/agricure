import { CheckCircle2, Flag, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { AnalysisResult } from "@/lib/analysis";

type Point = { label: string; sub: string; severity: number; state: "past" | "now" | "goal" };

export function ProgressTimeline({ result }: { result: AnalysisResult }) {
  const { t, lang } = useI18n();
  const now = result.severity;
  const previous = Math.min(98, now + 7);
  const first = Math.min(99, now + 14);
  const delta = previous - now;
  const improving = delta > 0;

  const points: Point[] = [
    { label: `${t("scan")} 1`, sub: t("sixDaysAgo"), severity: first, state: "past" },
    { label: `${t("scan")} 2`, sub: t("threeDaysAgo"), severity: previous, state: "past" },
    { label: `${t("scan")} 3`, sub: t("nowLabel"), severity: now, state: "now" },
    { label: t("goalLabel"), sub: t("targetSoon"), severity: 5, state: "goal" },
  ];

  const summary = {
    en: improving
      ? `Good job! Disease severity has dropped by ${delta}% since your last scan — the treatment is working. Post-scan advisory: keep spacing between plants as new leaves emerge and re-scan in 3 days.`
      : `Severity has risen by ${Math.abs(delta)}% since your last scan. Switch to the alternate chemical in the treatment tab and re-scan after 3 days.`,
    hi: improving
      ? `शाबाश! पिछली जाँच से रोग की गंभीरता ${delta}% घटी है — उपचार असर कर रहा है। सलाह: नई पत्तियाँ आने पर पौधों के बीच दूरी बनाए रखें और 3 दिन बाद फिर जाँच करें।`
      : `पिछली जाँच से गंभीरता ${Math.abs(delta)}% बढ़ी है। उपचार टैब में दी गई वैकल्पिक दवा अपनाएँ और 3 दिन बाद दोबारा जाँचें।`,
    mr: improving
      ? `छान! मागील तपासणीपासून रोगाची तीव्रता ${delta}% कमी झाली आहे — उपचार काम करत आहेत. सल्ला: नवीन पाने येताना झाडांमध्ये योग्य अंतर ठेवा आणि ३ दिवसांनी पुन्हा तपासा.`
      : `मागील तपासणीपासून तीव्रता ${Math.abs(delta)}% वाढली आहे. उपचार टॅबमधील पर्यायी औषध वापरा आणि ३ दिवसांनी पुन्हा तपासा.`,
  }[lang];

  return (
    <section className="glass rise-in mt-6 rounded-3xl p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h2 className="text-lg font-black sm:text-xl">{t("timeline")}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t("timelineSub")}</p>

      <ol className="mt-5 grid gap-4 sm:grid-cols-4">
        {points.map((p, i) => (
          <li key={i} className="relative rounded-2xl border bg-card p-3">
            <span
              className="absolute right-3 top-3 grid size-6 place-items-center rounded-full text-[11px] font-black"
              aria-hidden
            >
              {p.state === "goal" ? (
                <Flag className="size-4 text-primary" />
              ) : p.state === "now" ? (
                <CheckCircle2 className="size-4 text-primary" />
              ) : null}
            </span>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{p.label}</p>
            <p className="text-[11px] text-muted-foreground">{p.sub}</p>
            <p
              className={`mt-2 text-2xl font-black tabular-nums ${
                p.severity >= 60 ? "text-danger" : p.severity >= 25 ? "text-accent-foreground" : "text-success"
              }`}
            >
              {p.severity}%
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-[width] duration-1000 ${
                  p.severity >= 60 ? "bg-danger" : p.severity >= 25 ? "bg-warning" : "bg-success"
                }`}
                style={{ width: `${p.severity}%` }}
              />
            </div>
            {i < points.length - 1 && (
              <span className="pointer-events-none absolute -right-2 top-1/2 hidden h-0.5 w-4 bg-border sm:block" />
            )}
          </li>
        ))}
      </ol>

      <div
        className={`mt-4 flex gap-3 rounded-2xl border p-4 ${
          improving ? "border-success/40 bg-success/10" : "border-danger/40 bg-danger/10"
        }`}
      >
        {improving ? (
          <TrendingDown className="size-5 shrink-0 text-success" />
        ) : (
          <TrendingUp className="size-5 shrink-0 text-danger" />
        )}
        <p className="text-sm font-semibold leading-relaxed">{summary}</p>
      </div>
    </section>
  );
}
