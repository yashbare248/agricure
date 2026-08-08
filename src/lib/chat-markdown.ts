/** Marker used to tag inline math/formula spans extracted from AI markdown. */
export const FORMULA_MARK = "\u27E6f\u27E7";

/**
 * Makes AI markdown safe to render:
 *  - closes an unbalanced ``` fence (streamed / truncated replies)
 *  - normalises \[ \] and \( \) and $…$ math into inline code tagged with FORMULA_MARK
 *  - leaves anything inside fences or inline code untouched
 */
export function normalizeChatMarkdown(raw: string): string {
  let text = String(raw ?? "").replace(/\r\n/g, "\n");

  const fences = (text.match(/^[ \t]*```/gm) ?? []).length;
  if (fences % 2 === 1) text += "\n```";

  // Split on fenced blocks and inline code so we only touch prose segments.
  const parts = text.split(/(```[\s\S]*?```|`[^`\n]*`)/g);
  return parts
    .map((part, i) => (i % 2 === 1 ? part : convertFormulas(part)))
    .join("");
}

function convertFormulas(segment: string): string {
  return segment
    .replace(/\\\[([\s\S]+?)\\\]/g, (_m, body: string) => wrap(body))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_m, body: string) => wrap(body))
    .replace(/\$\$([^$\n]+?)\$\$/g, (_m, body: string) => wrap(body))
    .replace(/(?<![\d$])\$([^$\n]+?)\$(?!\d)/g, (m, body: string) =>
      /[a-zA-Z\\^_=+*/×÷]/.test(body) ? wrap(body) : m,
    );
}

function wrap(body: string): string {
  const clean = body.replace(/\s+/g, " ").replace(/`/g, "").trim();
  return clean ? `\`${FORMULA_MARK}${clean}\`` : "";
}

/** Strips markdown/code/formula syntax so text-to-speech reads cleanly. */
export function plainTextForSpeech(raw: string): string {
  return String(raw ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(new RegExp(FORMULA_MARK, "g"), " ")
    .replace(/[*_#>`|~$\\]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
