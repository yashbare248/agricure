import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const classifyLeaf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    return z
      .object({
        imageBase64: z.string().min(16),
        tiles: z.array(z.string().min(16)).max(6).optional(),
        cropKey: z.string().max(40).optional(),
      })
      .parse(input);
  })
  .handler(async ({ data }) => {
    const { classifyCropAware, aggregatePredictions } = await import("./analyze.server");
    const images = data.tiles?.length ? data.tiles : [data.imageBase64];

    const results = await Promise.all(images.map((img) => classifyCropAware(img, data.cropKey)));
    const prediction = aggregatePredictions(results, data.cropKey);
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
  .inputValidator((input: unknown) => {
    return z
      .object({
        imageBase64: z.string().min(16),
        cropHint: z.string().max(80).optional(),
      })
      .parse(input);
  })
  .handler(async ({ data }) => {
    const { identifyOpenVocabulary } = await import("./analyze.server");
    return { diagnosis: await identifyOpenVocabulary(data.imageBase64, data.cropHint) };
  });
