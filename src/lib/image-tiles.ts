/**
 * Splits a leaf/fruit photo into overlapping patches before AI classification.
 * A small lesion often covers <5% of a full frame, so a whole-image pass reads
 * "healthy"; zoomed patches make the damaged region dominate its own frame.
 */
const MAX_SIDE = 640;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

type Box = { x: number; y: number; w: number; h: number };

/** Full frame, centre crop, and a 2x2 grid with 15% overlap. */
function boxes(w: number, h: number): Box[] {
  const ox = w * 0.075;
  const oy = h * 0.075;
  const hw = w / 2 + ox;
  const hh = h / 2 + oy;
  return [
    { x: 0, y: 0, w, h },
    { x: w * 0.2, y: h * 0.2, w: w * 0.6, h: h * 0.6 },
    { x: 0, y: 0, w: hw, h: hh },
    { x: w - hw, y: 0, w: hw, h: hh },
    { x: 0, y: h - hh, w: hw, h: hh },
    { x: w - hw, y: h - hh, w: hw, h: hh },
  ];
}

/**
 * Returns JPEG data URLs: index 0 is the whole image, the rest are patches.
 * Falls back to the original image when canvas is unavailable (SSR/older browsers).
 */
export async function buildImageTiles(dataUrl: string): Promise<string[]> {
  if (typeof document === "undefined") return [dataUrl];
  try {
    const img = await loadImage(dataUrl);
    const { naturalWidth: w, naturalHeight: h } = img;
    if (!w || !h) return [dataUrl];

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return [dataUrl];

    return boxes(w, h).map((b) => {
      const scale = Math.min(1, MAX_SIDE / Math.max(b.w, b.h));
      canvas.width = Math.max(1, Math.round(b.w * scale));
      canvas.height = Math.max(1, Math.round(b.h * scale));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, b.x, b.y, b.w, b.h, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.85);
    });
  } catch {
    return [dataUrl];
  }
}
