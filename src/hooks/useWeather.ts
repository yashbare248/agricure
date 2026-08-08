import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getForecast, type LiveWeather } from "@/lib/weather.functions";

// Pune, Maharashtra — sensible default until the farmer grants location access.
const FALLBACK = { lat: 18.5204, lon: 73.8567 };

export function useWeather() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [located, setLocated] = useState(false);
  const fetchForecast = useServerFn(getForecast);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setCoords(FALLBACK);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocated(true);
      },
      () => setCoords(FALLBACK),
      // High accuracy + a short cache window: a stale/coarse fix was making the
      // air-quality reading come from a different neighbourhood.
      { timeout: 10000, maximumAge: 120000, enableHighAccuracy: true },
    );
  }, []);

  const query = useQuery<LiveWeather>({
    queryKey: ["forecast", coords?.lat, coords?.lon],
    queryFn: () => fetchForecast({ data: coords! }),
    enabled: !!coords,
    staleTime: 15 * 60 * 1000,
  });

  return { weather: query.data ?? null, loading: query.isPending || !coords, located, coords };
}
