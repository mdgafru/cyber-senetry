'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';
import { api } from '@/lib/api';
import { Search as SearchIcon, Menu, X, ArrowRight } from 'lucide-react';
import { NewsletterSubscribe } from '@/components/NewsletterSubscribe';
import RouteChangeSpinner, { signalNavStart } from '@/components/RouteChangeSpinner';

const NAV = [
  { slug: 'ai', name: 'AI' },
  { slug: 'cybersecurity', name: 'Cyber' },
  { slug: 'threats', name: 'Threats' },
  { slug: 'policy', name: 'Policy' },
  { slug: 'cloud', name: 'Cloud' },
  { slug: 'data', name: 'Data' },
];

function Ticker() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get('/articles?limit=6').then((r) => setItems(r.data.items || [])).catch(() => {});
  }, []);
  if (!items.length) return null;
  const tape = [...items, ...items];
  return (
    <div className="w-full border-b-2 border-foreground bg-foreground text-background overflow-hidden max-h-8 group/ticker" data-testid="ticker">
      <div className="inline-flex w-max min-w-full gap-8 whitespace-nowrap animate-ticker py-1.5 px-4 font-mono text-[10px] uppercase tracking-widest group-hover/ticker:[animation-play-state:paused]">
        {tape.map((a, i) => (
          <Link
            key={`${a.slug}-${i}`}
            href={`/article/${a.slug}`}
            prefetch
            className="hover:text-primary shrink-0 relative z-[1] py-0.5"
          >
            <span className="text-primary mr-1.5">■</span>
            {a.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = (e) => {
    e.preventDefault();
    const query = q.trim();
    setOpen(false);
    signalNavStart();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  };

  return (
    <div className="relative flex items-center">
      {open ? (
        <form onSubmit={submit} className="flex items-stretch border-2 border-foreground bg-background absolute right-0 top-1/2 -translate-y-1/2 z-50 w-[min(320px,70vw)] shadow-brutal-sm">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search archive…"
            className="flex-1 min-w-0 px-3 py-2 font-mono text-xs bg-transparent focus:outline-none"
            data-testid="header-search-input"
          />
          <button type="submit" className="px-3 bg-primary text-primary-foreground border-l-2 border-foreground" data-testid="header-search-submit">
            <SearchIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setQ(''); }}
            className="px-2 border-l-2 border-foreground hover:bg-muted"
            aria-label="Close search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-2 border-2 border-foreground hover:bg-foreground hover:text-background transition-colors"
          data-testid="header-search-btn"
          aria-label="Open search"
        >
          <SearchIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function PublicLayout({ children }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Suspense fallback={null}>
        <RouteChangeSpinner />
      </Suspense>
      <Ticker />

      <header className="border-b-2 border-foreground bg-background sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-5 h-14 md:h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-baseline gap-0.5 shrink-0 relative z-10" data-testid="brand-link">
            <span className="font-heading font-black text-xl md:text-2xl tracking-tighter">cybersentry</span>
            <span className="text-primary font-heading font-black text-xl md:text-2xl">360</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest relative z-10" data-testid="main-nav">
            <Link
              href="/"
              prefetch
              className={`px-3 py-1.5 hover:text-primary transition-colors duration-100 ${pathname === '/' ? 'text-primary' : ''}`}
            >
              Home
            </Link>
            {NAV.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                prefetch
                className={`px-3 py-1.5 hover:text-primary transition-colors duration-100 ${
                  pathname === `/category/${c.slug}` ? 'text-primary border-b-2 border-primary' : ''
                }`}
                data-testid={`nav-${c.slug}`}
              >
                {c.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <HeaderSearch />
            <Link
              href="/admin/login"
              className="hidden sm:inline-flex brutal-btn text-[10px] px-3 py-2"
              data-testid="header-admin-btn"
            >
              Editor
            </Link>
            <button
              type="button"
              className="lg:hidden p-2 border-2 border-foreground hover:bg-muted"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              data-testid="mobile-menu-btn"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t-2 border-foreground bg-background">
            <nav className="max-w-[1200px] mx-auto px-5 py-3 grid grid-cols-2 gap-1" data-testid="mobile-nav">
              <Link href="/" className="px-3 py-2.5 font-mono text-xs uppercase tracking-widest hover:bg-muted hover:text-primary">
                Home
              </Link>
              {NAV.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className={`px-3 py-2.5 font-mono text-xs uppercase tracking-widest hover:bg-muted hover:text-primary ${
                    pathname === `/category/${c.slug}` ? 'text-primary bg-muted' : ''
                  }`}
                >
                  {c.name}
                </Link>
              ))}
              <Link href="/search" className="px-3 py-2.5 font-mono text-xs uppercase tracking-widest hover:bg-muted hover:text-primary col-span-2 border-t border-muted mt-1 pt-3">
                Search archive
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 w-full min-w-0">{children}</main>

      <footer className="border-t-2 border-foreground bg-foreground text-background mt-8">
        <div className="max-w-[1200px] mx-auto px-5 py-10 md:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-4">
              <Link href="/" className="font-heading font-black text-2xl tracking-tighter inline-block">
                cybersentry<span className="text-primary">360</span>
              </Link>
              <p className="mt-3 font-serif italic text-base text-background/90 leading-snug max-w-xs">
                Editorial intelligence for the AI &amp; cybersecurity era.
              </p>
            </div>

            <div className="lg:col-span-2">
              <div className="overline text-primary mb-3">Desks</div>
              <ul className="space-y-2 font-mono text-[11px] uppercase tracking-wider">
                {NAV.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/category/${c.slug}`} className="hover:text-primary inline-flex items-center gap-1 group">
                      {c.name}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <div className="overline text-primary mb-3">Explore</div>
              <ul className="space-y-2 font-mono text-[11px] uppercase tracking-wider">
                <li><Link href="/search" className="hover:text-primary">Archive</Link></li>
                <li><Link href="/admin/login" className="hover:text-primary">Newsroom</Link></li>
                <li><Link href="/category/ai" className="hover:text-primary">Latest AI</Link></li>
                <li><Link href="/category/threats" className="hover:text-primary">Threats</Link></li>
              </ul>
            </div>

            <div className="lg:col-span-4 min-w-0 max-w-full overflow-x-hidden">
              <div className="overline text-primary mb-3">Weekly brief</div>
              <p className="text-sm mb-3 text-background/90 leading-snug">One dispatch every Tuesday. No fluff.</p>
              <NewsletterSubscribe variant="footer" testid="footer-newsletter" />
            </div>
          </div>
        </div>

        <div className="border-t border-background/20">
          <div className="max-w-[1200px] mx-auto px-5 py-4 flex flex-wrap justify-between items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-background/70">
            <span>© {new Date().getFullYear()} cybersentry360</span>
            <span>Plagiarism-free · Independent · Human-reviewed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
