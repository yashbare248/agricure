import { Link, useRouterState } from "@tanstack/react-router";
import {
  Leaf,
  Sparkles,
  ScanLine,
  History,
  Store,
  LogIn,
  LogOut,
  Bot,
  Building2,
  Newspaper,
} from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n, LANGS } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Lang } from "@/lib/treatments";
import { VoiceFab } from "./VoiceFab";

const NAV = [
  { to: "/", icon: ScanLine, key: "home" as const },
  { to: "/advisor", icon: Bot, key: "advisor" as const },
  { to: "/schemes", icon: Building2, key: "schemes" as const },
  { to: "/blogs", icon: Newspaper, key: "blogs" as const },
  { to: "/shops", icon: Store, key: "shops" as const },
  { to: "/history", icon: History, key: "history" as const },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang, demo, setDemo } = useI18n();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-background pb-24 md:pb-0">
      <header className="glass sticky top-0 z-50 border-b">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl hero-gradient text-forest-foreground">
              <Leaf className="size-5" />
              <Sparkles className="absolute -right-1 -top-1 size-3.5 text-amber-warm" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-extrabold tracking-tight">
                AgriCure <span className="text-primary">AI</span>
              </span>
              <span className="hidden truncate text-xs text-muted-foreground sm:block">
                {t("tagline")}
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <label className="flex items-center gap-2 rounded-full border bg-card px-2.5 py-1.5 text-xs font-medium">
              <Switch checked={demo} onCheckedChange={setDemo} aria-label={t("demoMode")} />
              <span className="whitespace-nowrap">{t("demoMode")}</span>
            </label>

            <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
              <SelectTrigger className="h-9 w-[112px] bg-card" aria-label="Language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGS.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => supabase.auth.signOut()}
                className="gap-1.5"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">{t("signOut")}</span>
              </Button>
            ) : (
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/auth">
                  <LogIn className="size-4" />
                  <span className="hidden sm:inline">{t("signIn")}</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        <nav className="mx-auto hidden max-w-6xl flex-wrap gap-1 px-4 pb-2 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                pathname === n.to
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <n.icon className="size-4" />
              {t(n.key)}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>

      <VoiceFab />

      <nav className="glass fixed inset-x-0 bottom-0 z-50 border-t md:hidden">
        <div className="grid grid-cols-6">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`flex min-h-[60px] flex-col items-center justify-center gap-1 px-0.5 text-center text-[9px] font-semibold leading-tight ${
                pathname === n.to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <n.icon className="size-5" />
              {t(n.key)}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
