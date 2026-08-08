import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { filterResponse, guardQuestion, isGreeting } from "@/lib/chat-guard";

export type ChatTurn = { role: "user" | "assistant"; content: string };

type Input = {
  messages: ChatTurn[];
  context?: string;
  lang: "en" | "hi" | "mr";
};

const LANG_NAME = { en: "English", hi: "Hindi (Devanagari)", mr: "Marathi (Devanagari)" };

export const askAgronomist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input) => {
    if (!Array.isArray(input?.messages) || input.messages.length === 0) {
      throw new Error("messages required");
    }
    const lang = ["en", "hi", "mr"].includes(input.lang) ? input.lang : "en";
    return {
      lang,
      context: typeof input.context === "string" ? input.context.slice(0, 1200) : "",
      messages: input.messages.slice(-12).map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: String(m.content).slice(0, 2000),
      })),
    };
  })
  .handler(async ({ data }): Promise<{ reply: string; error?: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { reply: "", error: "AI is not configured." };

    // Server-side firewall: the client check can be bypassed.
    const lastUser = [...data.messages].reverse().find((m) => m.role === "user");
    const verdict = guardQuestion(lastUser?.content ?? "", {
      hasHistory: data.messages.length > 1,
    });
    if (!verdict.ok) return { reply: "", error: verdict.reason };
    const greeting = isGreeting(verdict.text);

    const system = [
      "You are 'Krishi-Gyan AI Doctor', an expert Indian agronomist for smallholder farmers.",
      "Base every recommendation on ICAR and Krishi Vigyan Kendra (KVK) published guidelines and Indian label doses.",
      `Answer ONLY in ${LANG_NAME[data.lang]}. Keep it under 180 words.`,
      "Format the answer in clean GitHub-flavoured Markdown. Structure: a bold '**Diagnosis:** ...' line, then a markdown table of spray options with columns Option | Product | Dose per Litre | Total per Acre, then 2-4 short bullets of extra actions, then a one-line pre-harvest interval note.",
      "Never leave stray asterisks or unclosed markdown syntax.",
      "Never suggest banned pesticides. Prefer the cheapest effective option and always mention one organic alternative.",
      greeting
        ? "The farmer only greeted you or made small talk. Skip the diagnosis format entirely: greet them back warmly in one or two short sentences, mention you can help with crop leaf diseases, sprays, soil, weather and schemes, and ask which crop or leaf problem they need help with. No tables, no treatment advice yet."
        : "",
      data.context ? `Farmer's current scan context: ${data.context}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(20_000),
        headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
        body: JSON.stringify({
          model: "google/gemini-3.6-flash",
          messages: [{ role: "system", content: system }, ...data.messages],
        }),
      });
      if (res.status === 429) return { reply: "", error: "rate_limit" };
      if (res.status === 402) return { reply: "", error: "credits" };
      if (!res.ok) return { reply: "", error: `AI error ${res.status}` };
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const reply = json.choices?.[0]?.message?.content?.trim() ?? "";
      const safe = filterResponse(reply);
      return safe ? { reply: safe } : { reply: "", error: "empty" };
    } catch {
      return { reply: "", error: "network" };
    }
  });
