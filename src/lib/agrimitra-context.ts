import { useSyncExternalStore } from "react";
import type { AnalysisResult } from "./analysis";
import type { SoilKey } from "./soil";

/**
 * Shares the current diagnosis with the floating "Ask AgriMitra" launcher so the
 * assistant lives in one place (the FAB) instead of a second on-page panel.
 */
export type AgriMitraContext = {
  result: AnalysisResult | null;
  soil: SoilKey;
  advisoryMessage?: string;
};

let state: AgriMitraContext = { result: null, soil: "black" };
const listeners = new Set<() => void>();

export function setAgriMitraContext(next: AgriMitraContext) {
  state = next;
  for (const l of listeners) l();
}

export function useAgriMitraContext() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}
