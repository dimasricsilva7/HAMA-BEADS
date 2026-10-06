"use client";

import { track } from "@/lib/client/tracking";
import { RichText } from "@/components/ui/RichText";

export function Faq({ title, items }: { title: string | null; items: { id: string; question: string; answer: string }[] }) {
  if (!items.length) return null;
  return (
    <section id="faq" className="section bg-surface">
      <div className="container-page max-w-3xl">
        <div className="text-center">
          {title && <h2 className="h-section mt-2">{title}</h2>}
        </div>
        <div className="mt-8 divide-y divide-line rounded-card border border-line bg-bg">
          {items.map((f) => (
            <details
              key={f.id}
              className="group px-5"
              onToggle={(e) => {
                if ((e.currentTarget as HTMLDetailsElement).open) track("faq_open", { element: "faq", props: { question: f.question.slice(0, 120) } });
              }}
            >
              <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 py-4 font-bold [&::-webkit-details-marker]:hidden">
                {f.question}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 text-lg transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <RichText text={f.answer} className="pb-5 leading-relaxed text-muted" />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
