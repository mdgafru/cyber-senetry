'use client';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export const NAV_START_EVENT = 'cybersentry:nav-start';

/** Call before router.push / router.replace on public pages */
export function signalNavStart() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NAV_START_EVENT));
  }
}

function isInternalNav(anchor) {
  if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return false;
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  if (href.startsWith('http')) {
    try {
      return new URL(href).origin === window.location.origin;
    } catch {
      return false;
    }
  }
  return href.startsWith('/');
}

function sameLocation(href) {
  try {
    const next = new URL(href, window.location.origin);
    return (
      next.pathname === window.location.pathname &&
      next.search === window.location.search
    );
  } catch {
    return false;
  }
}

/**
 * Spinning loader while public-site client navigations are in flight.
 */
export default function RouteChangeSpinner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBusy(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const start = () => setBusy(true);

    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href]');
      if (!a || !isInternalNav(a)) return;
      const href = a.getAttribute('href');
      if (!href || sameLocation(href)) return;
      // Stay on public chrome only — admin has its own shell
      if (href.startsWith('/admin')) return;
      start();
    };

    const onPop = () => start();

    document.addEventListener('click', onClick, true);
    window.addEventListener(NAV_START_EVENT, start);
    window.addEventListener('popstate', onPop);

    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener(NAV_START_EVENT, start);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  useEffect(() => {
    if (!busy) return undefined;
    const t = setTimeout(() => setBusy(false), 8000);
    return () => clearTimeout(t);
  }, [busy]);

  if (!busy) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/50 pointer-events-none"
      aria-live="polite"
      aria-busy="true"
      data-testid="route-spinner"
    >
      <div className="border-2 border-foreground bg-card p-4 shadow-brutal-sm">
        <Loader2 className="w-8 h-8 animate-spin text-primary" strokeWidth={2.5} />
      </div>
    </div>
  );
}
