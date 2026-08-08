import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, CalendarDays, CalendarPlus, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { soilByKey, type SoilKey } from "@/lib/soil";
import type { AnalysisResult } from "@/lib/analysis";
import {
  buildPlan,
  clearPlan,
  daysUntil,
  enableNotifications,
  loadPlan,
  planToIcs,
  runReminders,
  savePlan,
  type SprayPlan,
} from "@/lib/spray-calendar";

const TXT = {
  title: { en: "Spray Calendar", hi: "छिड़काव कैलेंडर", mr: "फवारणी दिनदर्शिका" },
  sub: {
    en: "Personalised schedule from your AI advisory and soil type",
    hi: "आपकी AI सलाह और मिट्टी के अनुसार व्यक्तिगत कार्यक्रम",
    mr: "तुमच्या AI सल्ल्यानुसार व मातीनुसार वैयक्तिक वेळापत्रक",
  },
  remindOn: { en: "Reminders ON", hi: "रिमाइंडर चालू", mr: "स्मरणपत्रे सुरू" },
  remindOff: { en: "Enable reminders", hi: "रिमाइंडर चालू करें", mr: "स्मरणपत्रे सुरू करा" },
  ics: { en: "Add to phone calendar", hi: "फ़ोन कैलेंडर में जोड़ें", mr: "फोन दिनदर्शिकेत जोडा" },
  reset: { en: "Rebuild plan", hi: "योजना दोबारा बनाएँ", mr: "योजना पुन्हा तयार करा" },
  today: { en: "Due today", hi: "आज करना है", mr: "आज करायचे" },
  overdue: { en: "Overdue", hi: "विलंबित", mr: "उशीर" },
  inDays: { en: "in %d days", hi: "%d दिन में", mr: "%d दिवसांत" },
  done: { en: "Done", hi: "पूर्ण", mr: "पूर्ण" },
  progress: { en: "steps completed", hi: "चरण पूर्ण", mr: "टप्पे पूर्ण" },
  denied: {
    en: "Notifications are blocked in your browser settings.",
    hi: "ब्राउज़र सेटिंग में नोटिफिकेशन बंद हैं।",
    mr: "ब्राउझर सेटिंगमध्ये सूचना बंद आहेत.",
  },
  enabled: {
    en: "Reminders enabled — we will alert you on each spray day.",
    hi: "रिमाइंडर चालू — हर छिड़काव दिन पर सूचना मिलेगी।",
    mr: "स्मरणपत्रे सुरू — प्रत्येक फवारणी दिवशी सूचना मिळेल.",
  },
};

const KIND_STYLE: Record<string, string> = {
  chemical: "border-danger/40 bg-danger/10 text-danger",
  organic: "border-success/40 bg-success/10 text-success",
  prevention: "border-warning/50 bg-warning/15 text-accent-foreground",
  check: "border-primary/40 bg-primary/10 text-primary",
};
const KIND_EMOJI: Record<string, string> = {
  chemical: "🧪",
  organic: "🍃",
  prevention: "🛡️",
  check: "🔍",
};

export function SprayCalendar({ result, soil }: { result: AnalysisResult; soil: SoilKey }) {
  const { lang } = useI18n();
  const [plan, setPlan] = useState<SprayPlan | null>(null);
  const [notify, setNotify] = useState(false);

  useEffect(() => {
    const saved = loadPlan();
    const fresh =
      saved && saved.diseaseKey === result.treatment.key && saved.soil === soil
        ? saved
        : buildPlan(result, soil);
    savePlan(fresh);
    setPlan(fresh);
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotify(Notification.permission === "granted");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.treatment.key, soil, result.severity]);

  useEffect(() => {
    if (!plan || !notify) return;
    runReminders(plan, lang);
    const id = window.setInterval(() => runReminders(plan, lang), 60 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [plan, notify, lang]);

  if (!plan) return null;

  const update = (next: SprayPlan) => {
    savePlan(next);
    setPlan(next);
  };

  const toggle = (id: string) =>
    update({
      ...plan,
      tasks: plan.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    });

  const askNotify = async () => {
    const ok = await enableNotifications();
    setNotify(ok);
    toast[ok ? "success" : "error"](ok ? TXT.enabled[lang] : TXT.denied[lang]);
    if (ok) runReminders(plan, lang);
  };

  const downloadIcs = () => {
    const blob = new Blob([planToIcs(plan, lang)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agricure-spray-calendar.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const rebuild = () => {
    clearPlan();
    update(buildPlan(result, soil));
  };

  const doneCount = plan.tasks.filter((t) => t.done).length;

  return (
    <section className="glass rise-in mt-4 rounded-3xl p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-extrabold">
            <CalendarDays className="size-4 text-primary" /> 🗓️ {TXT.title[lang]}
          </h3>
          <p className="text-xs text-muted-foreground">{TXT.sub[lang]}</p>
          <p className="mt-1 text-[11px] font-semibold text-primary">
            {result.treatment.name[lang]} · {soilByKey(soil).label[lang]} ·{" "}
            {doneCount}/{plan.tasks.length} {TXT.progress[lang]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={notify ? "default" : "outline"}
            className="gap-1.5 rounded-full"
            onClick={askNotify}
          >
            {notify ? <Bell className="size-4" /> : <BellOff className="size-4" />}
            {notify ? TXT.remindOn[lang] : TXT.remindOff[lang]}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 rounded-full bg-card" onClick={downloadIcs}>
            <CalendarPlus className="size-4" /> {TXT.ics[lang]}
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5 rounded-full" onClick={rebuild}>
            <RotateCcw className="size-4" /> {TXT.reset[lang]}
          </Button>
        </div>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700"
          style={{ width: `${(doneCount / plan.tasks.length) * 100}%` }}
        />
      </div>

      <ol className="mt-4 space-y-2">
        {plan.tasks.map((task) => {
          const dd = daysUntil(task.date);
          const when =
            dd === 0 ? TXT.today[lang] : dd < 0 ? TXT.overdue[lang] : TXT.inDays[lang].replace("%d", String(dd));
          return (
            <li
              key={task.id}
              className={`flex gap-3 rounded-2xl border bg-card p-3 transition-opacity ${task.done ? "opacity-55" : ""}`}
            >
              <button
                type="button"
                onClick={() => toggle(task.id)}
                aria-label={TXT.done[lang]}
                className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                  task.done ? "border-success bg-success text-primary-foreground" : "border-muted-foreground/30"
                }`}
              >
                {task.done && <Check className="size-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-sm font-bold ${task.done ? "line-through" : ""}`}>
                    {KIND_EMOJI[task.kind]} {task.title[lang]}
                  </p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${KIND_STYLE[task.kind]}`}>
                    {when}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(`${task.date}T00:00:00`).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{task.detail[lang]}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}