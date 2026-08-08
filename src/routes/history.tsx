import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, QrCode } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/agri/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { buildReportUrl } from "@/lib/report-link";
import { byKey } from "@/lib/treatments";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Scan History & Diagnostic Reports — AgriCure AI" },
      {
        name: "description",
        content:
          "Review your past crop scans with disease name, health score and a printable QR diagnostic summary for expert consultation.",
      },
      { property: "og:title", content: "Scan History — AgriCure AI" },
      {
        property: "og:description",
        content: "Past crop diagnoses with health scores and QR diagnostic summaries.",
      },
    ],
  }),
  component: History,
});

function History() {
  const { t, lang } = useI18n();
  const { user, loading } = useAuth();
  const [openQr, setOpenQr] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["scans", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell>
      <h1 className="text-2xl font-black sm:text-3xl">{t("history")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("historySub")}</p>

      {!user && !loading && (
        <div className="glass mt-6 rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("loginToSave")}</p>
          <Button asChild className="glow-cta mt-4 rounded-xl">
            <Link to="/auth">{t("signIn")}</Link>
          </Button>
        </div>
      )}

      {user && (isLoading || !data) && (
        <p className="mt-6 text-sm text-muted-foreground">…</p>
      )}

      {user && data && data.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">{t("noHistory")}</p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((scan) => {
          const info = byKey(scan.disease_key);
          const tone =
            scan.health_score >= 80
              ? "var(--success)"
              : scan.health_score >= 50
                ? "var(--warning)"
                : "var(--danger)";
          const qr = buildReportUrl({
            d: scan.disease_key,
            h: scan.health_score,
            s: scan.severity,
            t: scan.created_at,
          });
          return (
            <article key={scan.id} className="glass rise-in rounded-2xl p-4">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-2xl">
                  {info.emoji}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold">{info.name[lang]}</h2>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    {new Date(scan.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="shrink-0 text-xl font-black tabular-nums" style={{ color: tone }}>
                  {scan.health_score}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full gap-1.5"
                onClick={() => setOpenQr(openQr === scan.id ? null : scan.id)}
              >
                <QrCode className="size-4" /> {t("qr")}
              </Button>

              {openQr === scan.id && (
                <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border bg-card p-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qr)}`}
                    alt={`QR diagnostic summary for ${info.name.en}`}
                    className="size-32 rounded-lg"
                    width={128}
                    height={128}
                  />
                  <p className="text-center text-[11px] text-muted-foreground">{t("qrHint")}</p>
                  <Button size="sm" variant="secondary" onClick={() => window.print()}>
                    Print
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
