import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  imageBase64: z.string().min(16),
  /** Zoomed patches of the same photo; small lesions dominate their own frame. */
  tiles: z.array(z.string().min(16)).max(6).optional(),
});

const OpenInput = z.object({
  imageBase64: z.string().min(16),
  cropHint: z.string().max(80).optional(),
});

export const classifyLeaf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const { classifyWithHuggingFace, classifyWithLovableAI, aggregatePredictions } = await import(
      "./analyze.server"
    );
    const images = data.tiles?.length ? data.tiles : [data.imageBase64];

    const results = await Promise.all(
      images.map(async (img) =>
        (await classifyWithHuggingFace(img)) ?? (await classifyWithLovableAI(img)),
      ),
    );
    const prediction = aggregatePredictions(results);
    return {
      label: prediction?.label ?? null,
      score: prediction?.score ?? null,
      runnerUpScore: prediction?.runnerUpScore ?? null,
      source: prediction ? ("huggingface" as const) : ("fallback" as const),
    };
  });

/**
 * Boundary-free diagnosis: Google Gemini vision grounded in current public
 * advisories, for crops the closed PlantVillage classifier cannot name.
 */
export const identifyAnyLeaf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => OpenInput.parse(input))
  .handler(async ({ data }) => {
    const { identifyOpenVocabulary } = await import("./analyze.server");
    return { diagnosis: await identifyOpenVocabulary(data.imageBase64, data.cropHint) };
  });
