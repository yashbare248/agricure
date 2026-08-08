import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Leaf, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/agri/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { byKey } from "@/lib/treatments";

type Search = {
  d?: string | undefined;
  h?: number | undefined;
  s?: number | undefined;
  c?: number | undefined;
  t?: string | undefined;
};

export const Route = createFileRoute("/report")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    d: typeof search['d'] === "string" ? search['d'] : undefined,
    h: Number.isFinite(Number(search['h'])) ? Number(search['h']) : undefined,
    s: Number.isFinite(Number(search['s'])) ? Number(search['s']) : undefined,
    c: Number.isFinite(Number(search['c'])) ? Number(search['c']) : undefined,
    t: typeof search['t'] === "string" ? search['t'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Crop Diagnostic Report — AgriCure AI" },
      {
        name: "description",
        content:
          "Scannable crop diagnostic report with disease name, health score, severity and recommended treatment steps.",
      },
      { property: "og:title", content: "Crop Diagnostic Report — AgriCure AI" },
      {
        property: "og:description",
        content: "Disease name, health score, severity and treatment steps from an AgriCure AI leaf scan.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { t, lang } = useI18n();
  const { d, h, s, c, t: when } = Route.useSearch();

  if (!d) {
    return (
      <AppShell>
        <div className="glass mx-auto mt-10 max-w-md rounded-2xl p-6 text-center">
          <h1 className="text-xl font-black">Report not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This QR link is missing its diagnosis details. Run a new scan to generate a fresh report.
          </p>
          <Button asChild className="glow-cta mt-4 rounded-xl">
            <Link to="/">{t("home")}</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const info = byKey(d);
  const health = h ?? info.healthScore;
  const severity = s ?? info.severity;
  const tone = health >= 80 ? "var(--success)" : health >= 50 ? "var(--warning)" : "var(--danger)";

  return (
    <AppShell>
      <article className="mx-auto max-w-2xl">
        <div className="glass rise-in rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-secondary text-3xl">
              {info.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {info.crop[lang]}
              </p>
              <h1 className="truncate text-xl font-black sm:text-2xl">{info.name[lang]}</h1>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <Stat label={t("healthScore")} value={`${health}`} color={tone} />
            <Stat label={t("severityLabel")} value={`${severity}%`} />
            <Stat label={t("confidence")} value={c != null ? `${c}%` : "—"} />
          </div>

          {when && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {new Date(when).toLocaleDateString()}
            </p>
          )}
        </div>

        <Section icon={<ShieldCheck className="size-4" />} title={t("chemical")} items={info.chemical[lang]} />
        <Section icon={<Leaf className="size-4" />} title={t("organic")} items={info.organic[lang]} />
        <Section icon={<Leaf className="size-4" />} title={t("prevention")} items={info.prevention[lang]} />

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild className="glow-cta rounded-xl">
            <Link to="/">{t("home")}</Link>
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </article>
    </AppShell>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xl font-black tabular-nums" style={color ? { color } : undefined}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <section className="glass mt-4 rounded-2xl p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        {icon}
        {title}
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((it) => (
          <li key={it} className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
