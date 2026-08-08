import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Coords = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  diseaseKey: z.string().min(1).max(120),
});

/** Live weather correlation for the detected pathogen. Free API, no AI cost. */
export const getClimateIntel = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => Coords.parse(input))
  .handler(async ({ data }) => {
    const { hasSupabaseSession } = await import("./optional-auth.server");
    const { climateIntel } = await import("./disease-intel.server");
    const authed = await hasSupabaseSession();
    return climateIntel(data.lat, data.lon, data.diseaseKey, authed);
  });

const GuidanceInput = z.object({
  disease: z.string().min(1).max(120),
  crop: z.string().min(1).max(60),
  lang: z.enum(["en", "hi", "mr"]),
  region: z.string().min(1).max(120),
  weatherNote: z.string().max(300),
});

/** Web-grounded advisories from public agricultural sources (AI, auth-gated). */
export const getOnlineGuidance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GuidanceInput.parse(input))
  .handler(async ({ data }) => {
    const { onlineGuidance } = await import("./disease-intel.server");
    return onlineGuidance(data);
  });