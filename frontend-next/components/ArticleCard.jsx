'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/api';

const HERO_FALLBACK = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600';

export const DESKS = [
  { slug: 'ai', name: 'AI', blurb: 'Models, agents, and enterprise AI risk' },
  { slug: 'cybersecurity', name: 'Cyber', blurb: 'Defense, resilience, and security ops' },
  { slug: 'threats', name: 'Threats', blurb: 'Actor tactics and emerging attacks' },
  { slug: 'policy', name: 'Policy', blurb: 'Regulation, compliance, and governance' },
  { slug: 'cloud', name: 'Cloud', blurb: 'Architecture, CSPM, and multi-cloud risk' },
  { slug: 'data', name: 'Data', blurb: 'Privacy, encryption, and DLP' },
];

export function ArticleCard({ a, showCategory = true }) {
  return (
    <article className="brutal-border bg-card group h-full flex flex-col overflow-hidden hover:shadow-brutal-sm transition-shadow duration-100">
      <Link
        href={`/article/${a.slug}`}
        prefetch
        className="flex flex-col h-full cursor-pointer"
        data-testid={`card-${a.slug}`}
      >
        <div className="aspect-[16/9] overflow-hidden border-b-2 border-foreground bg-muted relative shrink-0">
          <img
            src={a.hero_image || HERO_FALLBACK}
            alt={a.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
          {showCategory && (
            <span className="absolute top-2 left-2 bg-primary text-primary-foreground font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 capitalize pointer-events-none">
              {a.category}
            </span>
          )}
        </div>
        <div className="p-3.5 flex flex-col flex-1">
          <div className="mb-1.5">
            <span className="overline text-foreground/85 text-xs">
              {formatDate(a.published_at || a.created_at)}
            </span>
          </div>
          <h3 className="font-heading font-black uppercase tracking-tight text-base md:text-[1.05rem] leading-snug group-hover:text-primary transition-colors duration-100 line-clamp-3">
            {a.title}
          </h3>
          {a.subtitle && (
            <p className="mt-1.5 font-serif italic font-semibold text-base text-foreground leading-snug line-clamp-2">
              {a.subtitle}
            </p>
          )}
          <div className="mt-auto pt-3 overline text-xs inline-flex items-center gap-1.5 text-foreground/85 group-hover:text-primary">
            Read <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ArticleGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n} className="border-2 border-foreground">
          <div className="aspect-[16/9] bg-muted" />
          <div className="p-3.5 space-y-2">
            <div className="h-3 w-20 bg-muted" />
            <div className="h-5 w-full bg-muted" />
            <div className="h-5 w-2/3 bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DeskTabs({ active }) {
  return (
    <nav className="border-b-2 border-foreground flex overflow-x-auto">
      <Link
        href="/"
        prefetch
        className={`shrink-0 px-4 py-2.5 overline border-r-2 border-foreground hover:bg-muted hover:text-primary transition-colors duration-100 ${
          !active ? 'text-primary bg-muted' : ''
        }`}
      >
        All
      </Link>
      {DESKS.map((d, i) => (
        <Link
          key={d.slug}
          href={`/category/${d.slug}`}
          prefetch
          className={`shrink-0 px-4 py-2.5 overline hover:bg-muted hover:text-primary transition-colors duration-100 ${
            i < DESKS.length - 1 ? 'border-r-2 border-foreground' : ''
          } ${active === d.slug ? 'text-primary bg-muted' : ''}`}
          data-testid={`desk-tab-${d.slug}`}
        >
          {d.name}
        </Link>
      ))}
    </nav>
  );
}
