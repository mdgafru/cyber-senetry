'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { inlineFormat, stripMarkdown } from '@/lib/content/markdown-inline';

export default function FAQSection({ faq }) {
  const [open, setOpen] = useState(-1);
  if (!faq?.length) return null;

  return (
    <section className="mt-6" id="faqs">
      <div className="border-b-2 border-foreground pb-2 mb-3">
        <div className="overline text-primary text-[9px] mb-0.5">Reader questions</div>
        <h2 className="font-heading font-black uppercase text-xl tracking-tight">FAQs</h2>
      </div>
      <div className="brutal-border bg-card divide-y divide-foreground">
        {faq.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full flex items-start justify-between gap-3 px-3.5 py-3 text-left hover:bg-muted transition-colors group"
              >
                <span className="font-heading font-bold text-sm leading-snug group-hover:text-primary">
                  {stripMarkdown(item.question)}
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 mt-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                />
              </button>
              {isOpen && (
                <p className="px-3.5 pb-3 text-sm leading-relaxed text-foreground/85 border-t border-muted pt-2">
                  {inlineFormat(item.answer, `faq-${i}`)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
