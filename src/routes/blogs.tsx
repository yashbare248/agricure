import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowBigUp, Clock, Heart, Newspaper, PenLine, Share2 } from "lucide-react";
import { AppShell } from "@/components/agri/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { Phase2Banner, UNAVAILABLE_TXT } from "@/components/agri/PreviewBanner";

export const Route = createFileRoute("/blogs")({
  head: () => ({
    meta: [
      { title: "Krishi Samvad — Agri Blogs & Farmer Research Community" },
      {
        name: "description",
        content:
          "Read and publish field research from agronomists, students and progressive farmers on soil health, organic farming and crop disease management.",
      },
      { property: "og:title", content: "Krishi Samvad — Agri Blogs & Research" },
      {
        property: "og:description",
        content: "An open community feed where farmers and researchers share practical agri knowledge.",
      },
    ],
    links: [{ rel: "canonical", href: "https://agricure.yashbare.tech/blogs" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Krishi Samvad",
          url: "https://agricure.yashbare.tech/blogs",
          blogPost: SEED.map((p) => ({
            "@type": "Article",
            headline: p.title,
            author: { "@type": "Person", name: p.author },
            datePublished: p.createdAt,
            keywords: p.tags.join(", "),
            ...(p.cover ? { image: p.cover } : {}),
            url: "https://agricure.yashbare.tech/blogs",
          })),
        }),
      },
    ],
  }),
  component: BlogsPage,
});

type Post = {
  id: string;
  title: string;
  author: string;
  badge: string;
  tags: string[];
  minutes: number;
  createdAt: string;
  cover?: string;
  body: string;
  likes: number;
  upvotes: number;
};

const SEED: Post[] = [
  {
    id: "p1",
    title: "Cutting Early Blight losses by 40% with a 10-day alternating spray calendar",
    author: "Dr. S. Patil",
    badge: "Agronomist",
    tags: ["#TomatoBlight", "#SprayCalendar", "#ICAR"],
    minutes: 6,
    createdAt: "2026-07-28T09:00:00Z",
    cover: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&q=60",
    body: "Across 42 trial plots in Nashik and Ahmednagar, alternating Mancozeb 75% WP (2 g/L) with Chlorothalonil at 10-day intervals reduced defoliation from 61% to 22% compared with a single-molecule schedule. Resistance pressure fell sharply, and the pre-harvest interval of 7 days was comfortably respected. Farmers who added a spreading adjuvant on sandy soils saw a further 8% improvement in leaf coverage.",
    likes: 128,
    upvotes: 64,
  },
  {
    id: "p2",
    title: "Soil organic carbon in black cotton soils: what 3 years of green manure did",
    author: "Ananya Deshmukh",
    badge: "Student Researcher",
    tags: ["#SoilHealth", "#OrganicFarming"],
    minutes: 4,
    createdAt: "2026-07-24T06:30:00Z",
    cover: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=60",
    body: "Sunhemp incorporated before the Kharif sowing lifted organic carbon from 0.52% to 0.78% over three seasons. Water-holding capacity improved measurably, and fungicide requirement dropped by one spray per season because canopy humidity stabilised.",
    likes: 87,
    upvotes: 41,
  },
  {
    id: "p3",
    title: "Drip + mulch on Nashik grapes: my water bill and downy mildew both fell",
    author: "Ramesh Jadhav",
    badge: "Progressive Farmer",
    tags: ["#NashikGrapes", "#DripIrrigation"],
    minutes: 3,
    createdAt: "2026-07-19T13:10:00Z",
    cover: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800&q=60",
    body: "After switching from flood to inline drip with silver-black mulch, water use per acre dropped 46%. Because foliage stayed dry, downy mildew sprays came down from nine to five per season. The MahaDBT subsidy covered most of the installation cost.",
    likes: 154,
    upvotes: 96,
  },
];

const TXT = {
  title: { en: "Krishi Samvad", hi: "कृषि संवाद", mr: "कृषी संवाद" },
  sub: {
    en: "Open research and field notes from agronomists, students and farmers",
    hi: "कृषि विशेषज्ञों, विद्यार्थियों व किसानों के खुले शोध व अनुभव",
    mr: "कृषी तज्ज्ञ, विद्यार्थी व शेतकऱ्यांचे खुले संशोधन व अनुभव",
  },
  write: { en: "Write Research / Blog", hi: "शोध / ब्लॉग लिखें", mr: "संशोधन / ब्लॉग लिहा" },
  postTitle: { en: "Title", hi: "शीर्षक", mr: "शीर्षक" },
  author: { en: "Your name", hi: "आपका नाम", mr: "तुमचे नाव" },
  badge: { en: "Role (e.g. Progressive Farmer)", hi: "भूमिका", mr: "भूमिका" },
  tags: { en: "Tags (comma separated)", hi: "टैग (अल्पविराम से)", mr: "टॅग (स्वल्पविरामाने)" },
  cover: { en: "Cover image link (optional)", hi: "कवर छवि लिंक (वैकल्पिक)", mr: "कव्हर प्रतिमा दुवा (ऐच्छिक)" },
  body: { en: "Article body", hi: "लेख", mr: "लेख" },
  publish: { en: "Publish", hi: "प्रकाशित करें", mr: "प्रकाशित करा" },
  read: { en: "min read", hi: "मिनट पढ़ें", mr: "मिनिट वाचन" },
  share: { en: "Share", hi: "साझा करें", mr: "शेअर करा" },
};

const STORE = "agricure-posts";

function timeAgo(iso: string, lang: "en" | "hi" | "mr") {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const unit = d > 0 ? { en: "d", hi: "दि", mr: "दि" } : { en: "h", hi: "घं", mr: "ता" };
  return `${d > 0 ? d : Math.max(h, 1)}${unit[lang]}`;
}

function BlogsPage() {
  const { lang } = useI18n();
  const [posts, setPosts] = useState<Post[]>(SEED);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", badge: "", tags: "", cover: "", body: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) setPosts([...(JSON.parse(raw) as Post[]), ...SEED]);
    } catch {
      /* ignore corrupt local drafts */
    }
  }, []);

  const persist = (custom: Post[]) => {
    const own = custom.filter((p) => !SEED.some((s) => s.id === p.id));
    localStorage.setItem(STORE, JSON.stringify(own));
  };

  const bump = (id: string, field: "likes" | "upvotes") => {
    const next = posts.map((p) => (p.id === id ? { ...p, [field]: p[field] + 1 } : p));
    setPosts(next);
    if (field === "likes") setLiked((l) => ({ ...l, [id]: true }));
    persist(next);
  };

  const sorted = useMemo(
    () => [...posts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [posts],
  );

  return (
    <AppShell>
      <Phase2Banner lang={lang} />
      <header className="hero-gradient rise-in mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl px-5 py-7 text-forest-foreground">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black sm:text-3xl">
            <Newspaper className="size-7" /> 📰 {TXT.title[lang]}
          </h1>
          <p className="mt-2 max-w-lg text-sm opacity-90">{TXT.sub[lang]}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="gap-1.5 rounded-full font-bold">
              <PenLine className="size-4" /> + {TXT.write[lang]}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{TXT.write[lang]}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder={TXT.postTitle[lang]}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder={TXT.author[lang]}
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
                <Input
                  placeholder={TXT.badge[lang]}
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                />
              </div>
              <Input
                placeholder={TXT.tags[lang]}
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
              <Input
                placeholder={TXT.cover[lang]}
                value={form.cover}
                onChange={(e) => setForm({ ...form, cover: e.target.value })}
              />
              <Textarea
                rows={7}
                placeholder={TXT.body[lang]}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
              <Button
                className="w-full rounded-xl font-bold"
                disabled
                title={UNAVAILABLE_TXT[lang]}
              >
                {TXT.publish[lang]}
              </Button>
              <p className="text-center text-[11px] font-semibold text-muted-foreground">
                {UNAVAILABLE_TXT[lang]}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((p) => (
          <article key={p.id} className="glass overflow-hidden rounded-3xl">
            {p.cover && (
              <img
                src={p.cover}
                alt={p.title}
                loading="lazy"
                className="h-40 w-full object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-primary">
                  {p.author} · {p.badge}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="size-3" /> {p.minutes} {TXT.read[lang]} · {timeAgo(p.createdAt, lang)}
                </span>
              </div>
              <h2 className="mt-2 text-base font-extrabold leading-snug">{p.title}</h2>
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                {p.body}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 rounded-full text-[11px]"
                  onClick={() => bump(p.id, "likes")}
                >
                  <Heart className={`size-3.5 ${liked[p.id] ? "fill-danger text-danger" : ""}`} />
                  {p.likes}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 rounded-full text-[11px]"
                  onClick={() => bump(p.id, "upvotes")}
                >
                  <ArrowBigUp className="size-4" /> {p.upvotes}
                </Button>
                <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 rounded-full text-[11px]">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${p.title} — AgriCure AI Krishi Samvad`)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Share2 className="size-3.5" /> {TXT.share[lang]}
                  </a>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
