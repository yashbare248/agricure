import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { FORMULA_MARK, normalizeChatMarkdown } from "@/lib/chat-markdown";

function nodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  const el = node as { props?: { children?: ReactNode } };
  return el.props ? nodeText(el.props.children) : "";
}

function CodeBlock({ code, lang }: { code: string; lang?: string | undefined }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };
  return (
    <div className="overflow-hidden rounded-2xl border bg-secondary/60">
      <div className="flex items-center justify-between gap-2 border-b bg-forest px-3 py-1.5 text-forest-foreground">
        <span className="text-[10px] font-bold uppercase tracking-widest">{lang || "code"}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold opacity-90 transition-opacity hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-w-full overflow-x-auto px-3 py-2.5 text-[13px] leading-relaxed">
        <code className="font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

/** Renders AI agronomist markdown with farm-friendly typography and cards. */
export function ChatMarkdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 break-words text-[15px] leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3 className="text-base font-black text-forest dark:text-primary">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="text-base font-black text-forest dark:text-primary">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-sm font-bold uppercase tracking-wide text-forest dark:text-primary">
              {children}
            </h4>
          ),
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-bold text-forest dark:text-primary">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
          ul: ({ children }) => (
            <ul className="space-y-2 rounded-2xl border bg-secondary/40 p-3">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-2 rounded-2xl border bg-secondary/40 p-3 pl-6">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="marker:text-primary [&:not(ol_&)]:relative [&:not(ol_&)]:pl-4 [&:not(ol_&)]:before:absolute [&:not(ol_&)]:before:left-0 [&:not(ol_&)]:before:top-[0.55em] [&:not(ol_&)]:before:size-1.5 [&:not(ol_&)]:before:rounded-full [&:not(ol_&)]:before:bg-primary">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <div className="rounded-r-xl border-l-4 border-success bg-success/10 px-3 py-2 text-sm">
              {children}
            </div>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
              {children}
            </a>
          ),
          pre: ({ children }) => <>{children}</>,
          code: ({ children, className }) => {
            const raw = nodeText(children);
            if (raw.startsWith(FORMULA_MARK)) {
              return (
                <span className="mx-0.5 inline-block rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[13px] font-semibold text-forest dark:text-primary">
                  {raw.slice(FORMULA_MARK.length)}
                </span>
              );
            }
            const lang = /language-([\w-]+)/.exec(className ?? "")?.[1];
            if (lang || raw.includes("\n")) {
              return <CodeBlock code={raw.replace(/\n$/, "")} lang={lang} />;
            }
            return (
              <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[13px] break-words">
                {children}
              </code>
            );
          },
          hr: () => <hr className="border-dashed" />,
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-forest text-forest-foreground">{children}</thead>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">{children}</th>
          ),
          td: ({ children }) => <td className="border-t px-3 py-2 align-top">{children}</td>,
        }}
      >
        {normalizeChatMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
}