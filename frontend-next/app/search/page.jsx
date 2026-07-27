'use client';
import { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api, formatDate } from '@/lib/api';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';

const DESKS = ['all', 'ai', 'cybersecurity', 'threats', 'policy', 'cloud', 'data'];
const HERO_FALLBACK = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?crop=entropy&cs=srgb&fm=jpg&q=85&w=800';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get('q') || '';
  const initialCat = searchParams.get('category') || 'all';

  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState(initialCat);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  const run = useCallback(async (query, cat) => {
    setBusy(true);
    setSearched(true);
    try {
      const params = { limit: 50 };
      if (query) params.q = query;
      if (cat && cat !== 'all') params.category = cat;
      const { data } = await api.get('/articles', { params });
      setItems(data.items || []);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const qq = searchParams.get('q') || '';
    const cc = searchParams.get('category') || 'all';
    setQ(qq);
    setCategory(cc);
    run(qq, cc);
  }, [searchParams, run]);

  const pushUrl = (query, cat) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (cat && cat !== 'all') params.set('category', cat);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : '/search');
  };

  const submit = (e) => {
    e.preventDefault();
    pushUrl(q, category);
  };

  const setDesk = (cat) => {
    setCategory(cat);
    pushUrl(q, cat);
  };

  const clear = () => {
    setQ('');
    setCategory('all');
    router.push('/search');
  };

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-8 md:py-10" data-testid="search-page">
      <div className="mb-8">
        <div className="overline text-primary mb-2">Archive</div>
        <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter leading-none">
          Search
        </h1>
        <p className="mt-2 font-serif italic text-muted-foreground">
          Find stories by title, keyword, or desk.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={submit} className="brutal-border bg-card flex items-stretch overflow-hidden mb-4">
        <div className="px-3 md:px-4 flex items-center bg-muted border-r-2 border-foreground shrink-0">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search articles, topics, keywords…"
          className="flex-1 min-w-0 px-3 md:px-4 py-3 md:py-3.5 bg-background font-mono text-sm focus:outline-none"
          data-testid="search-input"
          autoFocus
        />
        {q && (
          <button
            type="button"
            onClick={clear}
            className="px-3 border-l-2 border-foreground hover:bg-muted text-muted-foreground"
            aria-label="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button type="submit" className="brutal-btn-primary rounded-none border-0 border-l-2 px-5 md:px-6" data-testid="search-submit">
          Search
        </button>
      </form>

      {/* Desk filters */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {DESKS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDesk(d)}
            className={`tag-chip capitalize ${category === d ? 'bg-foreground text-white hover:bg-foreground' : ''}`}
          >
            {d === 'all' ? 'All desks' : d}
          </button>
        ))}
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="overline text-muted-foreground">
          {busy ? 'Searching…' : (
            <>
              {items.length} result{items.length !== 1 ? 's' : ''}
              {initialQ && <> for “{initialQ}”</>}
              {category !== 'all' && <> · {category}</>}
            </>
          )}
        </div>
      </div>

      {/* Results - 3 col cards on desktop, list on mobile feel via cards */}
      {busy && !searched ? (
        <p className="font-mono text-sm py-10 text-center text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="brutal-border bg-card p-10 text-center">
          <SearchIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-heading font-bold uppercase text-lg mb-1">No matches</p>
          <p className="text-sm text-muted-foreground mb-4">Try another keyword or clear filters.</p>
          <button type="button" onClick={clear} className="brutal-btn text-[10px]">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((a) => (
            <Link
              key={a.slug}
              href={`/article/${a.slug}`}
              className="brutal-border bg-card group overflow-hidden hover:shadow-brutal-sm transition-shadow flex flex-col"
              data-testid={`search-item-${a.slug}`}
            >
              <div className="aspect-[16/9] border-b-2 border-foreground overflow-hidden bg-muted relative">
                <img
                  src={a.hero_image || HERO_FALLBACK}
                  alt={a.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
                <span className="absolute top-2 left-2 bg-primary text-primary-foreground font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 capitalize">
                  {a.category}
                </span>
              </div>
              <div className="p-3.5 flex flex-col flex-1">
                <div className="mb-1.5 overline text-[9px] text-muted-foreground">
                  {formatDate(a.published_at || a.created_at)}
                </div>
                <div className="font-heading font-bold uppercase text-base leading-snug group-hover:text-primary line-clamp-3">
                  {a.title}
                </div>
                {a.subtitle && (
                  <p className="mt-1.5 text-base font-serif italic font-semibold text-foreground line-clamp-2">{a.subtitle}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <PublicLayout>
      <Suspense
        fallback={
          <div className="max-w-[1200px] mx-auto px-5 py-10 font-mono text-sm text-muted-foreground">
            Loading search…
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </PublicLayout>
  );
}
