'use client';
import { useEffect, useState } from 'react';
import { List } from 'lucide-react';
import { stripMarkdown } from '@/lib/content/markdown-inline';

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

export default function TableOfContents({ content, items, defaultOpen = true, compact = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [active, setActive] = useState('');

  const headings =
    items?.length > 0
      ? items.filter((i) => i.level === 2 || !i.level)
      : (content || '')
          .split(/\r?\n/)
          .filter((l) => l.startsWith('## ') && !l.startsWith('### '))
          .map((l) => {
            const title = l.replace(/^##\s+/, '').trim();
            return { id: slugify(title), title, level: 2 };
          })
          .filter((h) => !/^table of contents$/i.test(h.title));

  useEffect(() => {
    if (!headings.length) return;
    const observers = [];
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(h.id);
        },
        { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [content, items]);

  if (!headings.length) return null;

  return (
    <div className={`brutal-border bg-card overflow-hidden ${compact ? 'mb-0' : 'mb-4'}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border-b-2 border-foreground hover:bg-muted transition-colors"
      >
        <span className="overline text-primary text-[9px] inline-flex items-center gap-1.5">
          <List className="w-3 h-3" /> Contents
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          {open ? 'Hide' : 'Show'} · {headings.length}
        </span>
      </button>
      {open && (
        <nav className="p-1 max-h-[min(220px,calc(100vh-22rem))] overflow-y-auto overscroll-contain">
          {headings.map((h, i) => (
            <a
              key={h.id || i}
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActive(h.id);
              }}
              className={`flex items-start gap-2 px-2 py-1.5 text-[11px] transition-colors border-l-2 ${
                active === h.id
                  ? 'border-primary text-primary bg-muted/60'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <span className="text-primary/60 shrink-0 font-mono text-[10px]">{String(i + 1).padStart(2, '0')}</span>
              <span className="leading-snug font-sans">{stripMarkdown(h.title)}</span>
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
