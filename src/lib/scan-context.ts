const KEY = "agricure-scan-context";

export function storeScanContext(text: string) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, text);
}

export function readScanContext(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY) ?? "";
}
