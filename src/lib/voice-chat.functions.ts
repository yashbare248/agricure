import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { filterResponse, guardQuestion, isGreeting } from "@/lib/chat-guard";

export type VoiceTurn = { role: "user" | "assistant"; content: string };

type Input = {
  messages: VoiceTurn[];
  /** Language name to answer in, e.g. "Tamil". */
  langName: string;
  langCode: string;
  /** Detected disease + farm context assembled on the client. */
  context?: string;
};

export const askVoiceAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input) => {
    if (!Array.isArray(input?.messages) || input.messages.length === 0) {
      throw new Error("messages required");
    }
    return {
      langName: String(input.langName || "English").slice(0, 40),
      langCode: String(input.langCode || "en").slice(0, 8),
      context: typeof input.context === "string" ? input.context.slice(0, 1500) : "",
      messages: input.messages.slice(-10).map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: String(m.content).slice(0, 1200),
      })),
    };
  })
  .handler(async ({ data }): Promise<{ reply: string; error?: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { reply: "", error: "AI is not configured." };

    const lastUser = [...data.messages].reverse().find((m) => m.role === "user");
    const verdict = guardQuestion(lastUser?.content ?? "", {
      hasHistory: data.messages.length > 1,
    });
    if (!verdict.ok) return { reply: "", error: verdict.reason };
    const greeting = isGreeting(verdict.text);

    const system = [
      "You are 'AgriMitra', a spoken voice assistant for Indian smallholder farmers.",
      "Your answer is read aloud by a text-to-speech engine, so write plain conversational sentences.",
      "NEVER use markdown, asterisks, bullet points, tables, headings, emoji or numbers written as symbols.",
      "Keep answers under 70 words. Be concrete: name products, doses per litre and timing.",
      `Reply ONLY in ${data.langName}, using that language's own script. Do not mix in English sentences.`,
      "Base advice on ICAR and Krishi Vigyan Kendra guidance. Never suggest banned pesticides.",
      "End with one short question inviting the farmer to ask more, unless they said goodbye.",
      greeting
        ? "The farmer only greeted you or made small talk. Greet them back warmly in one short sentence, say you are AgriMitra and can help with crop leaf diseases, sprays, weather and schemes, then ask which crop or leaf problem they need help with. Do not give any treatment advice yet. Maximum 35 words."
        : "",
      data.context ? `Current diagnosis and field context: ${data.context}` : "",
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
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const reply = json.choices?.[0]?.message?.content?.trim() ?? "";
      // Strip any markdown the model slipped in — this text goes straight to TTS.
      const clean = filterResponse(reply).replace(/[*_#`>|]/g, "").replace(/\s+/g, " ").trim();
      return clean ? { reply: clean } : { reply: "", error: "empty" };
    } catch {
      return { reply: "", error: "network" };
    }
  });
