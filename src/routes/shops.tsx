import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Phone, Star, Navigation, X } from "lucide-react";
import { AppShell } from "@/components/agri/AppShell";
import { Button } from "@/components/ui/button";
import { NEARBY_SHOPS } from "@/lib/shops";
import { categoryLabel, type ProductCategory } from "@/lib/market";
import { useI18n } from "@/lib/i18n";
import { Phase2Banner, UNAVAILABLE_TXT } from "@/components/agri/PreviewBanner";

export const Route = createFileRoute("/shops")({
  head: () => ({
    meta: [
      { title: "Nearby Agri Shops & Input Dealers — AgriCure AI" },
      {
        name: "description",
        content:
          "Find verified agricultural supply stores near your farm with distance, phone numbers and available fungicides, bio-inputs and fertilizers.",
      },
      { property: "og:title", content: "Nearby Agri Shops — AgriCure AI" },
      {
        property: "og:description",
        content: "Verified agri input dealers near your farm with distance and contact details.",
      },
    ],
    links: [{ rel: "canonical", href: "https://agricure.yashbare.tech/shops" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Nearby Agri Shops & Input Dealers",
          url: "https://agricure.yashbare.tech/shops",
          description:
            "Listing of agricultural supply stores and input dealers with distance, contact details and stocked products.",
          isPartOf: { "@type": "WebSite", name: "AgriCure AI", url: "https://agricure.yashbare.tech" },
        }),
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    category:
      search["category"] === "fungicide" || search["category"] === "bio" || search["category"] === "nutrition"
        ? (search["category"] as ProductCategory)
        : undefined,
  }),
  component: Shops,
});

function Shops() {
  const { t, lang } = useI18n();
  const { category } = Route.useSearch();
  const shops = category ? NEARBY_SHOPS.filter((s) => s.categories.includes(category)) : NEARBY_SHOPS;
  return (
    <AppShell>
      <Phase2Banner lang={lang} />
      <h1 className="text-2xl font-black sm:text-3xl">{t("shops")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("shopsSub")}</p>

      {category && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
          <p className="text-sm font-semibold">
            {t("showingFor")}: <span className="text-primary">{categoryLabel(category, lang)}</span>
          </p>
          <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 rounded-full bg-card text-xs">
            <Link to="/shops" search={{ category: undefined }}>
              <X className="size-3.5" /> {t("clearFilter")}
            </Link>
          </Button>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {shops.map((s) => (
          <article key={s.name} className="glass rise-in rounded-2xl p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold">{s.name}</h2>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{s.address}</span>
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
                {s.distanceKm} km
              </span>
            </div>

            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-accent-foreground">
              <Star className="size-3.5 fill-amber-warm text-amber-warm" /> {s.rating}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {s.stock.map((item) => (
                <span key={item} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                size="sm"
                className="gap-1.5"
                disabled
                title={UNAVAILABLE_TXT[lang]}
                aria-label={UNAVAILABLE_TXT[lang]}
              >
                <Phone className="size-4" /> {t("call")}
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + " " + s.address)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation className="size-4" /> {t("directions")}
                </a>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
