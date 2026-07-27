'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'cybersentry360_newsletter_email';
const STATUS_KEY = 'cybersentry360_newsletter_email_status';

export function NewsletterSubscribe({
  variant = 'sidebar',
  testid = 'newsletter',
}) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const saved = localStorage.getItem(STORAGE_KEY);
    const cached = localStorage.getItem(STATUS_KEY);

    if (saved) {
      setEmail(saved);
      if (cached === 'subscribed') setSubscribed(true);
    }

    // Trust local cache — only revalidate in background if status unknown
    if (!saved || cached === 'subscribed' || cached === 'off') return undefined;

    api
      .get('/newsletter/subscribe', { params: { email: saved } })
      .then((r) => {
        if (cancelled) return;
        const on = !!r.data.subscribed;
        setSubscribed(on);
        localStorage.setItem(STATUS_KEY, on ? 'subscribed' : 'off');
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      const normalized = email.toLowerCase().trim();
      localStorage.setItem(STORAGE_KEY, normalized);
      localStorage.setItem(STATUS_KEY, 'subscribed');
      setSubscribed(true);
      toast.success("You're in. Weekly brief hits Tuesday.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Subscription failed');
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async (e) => {
    e.preventDefault();
    const target = email.trim() || localStorage.getItem(STORAGE_KEY);
    if (!target) return toast.error('Email required');
    setBusy(true);
    try {
      await api.post('/newsletter/unsubscribe', { email: target });
      localStorage.setItem(STATUS_KEY, 'off');
      setSubscribed(false);
      toast.success('Unsubscribed. You can rejoin anytime.');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Unsubscribe failed');
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'footer') {
    if (subscribed) {
      return (
        <div className="w-full min-w-0 max-w-full space-y-2" data-testid={`${testid}-unsub`}>
          <p className="text-sm text-background/70 leading-snug break-words">
            Subscribed as <span className="text-background font-mono text-xs break-all">{email}</span>
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={unsubscribe}
            className="w-full border-2 border-background/40 hover:border-primary hover:text-primary font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 transition-colors cursor-pointer"
            data-testid={`${testid}-unsubscribe`}
          >
            {busy ? '…' : 'Unsubscribe'}
          </button>
        </div>
      );
    }

    return (
      <form
        onSubmit={subscribe}
        className="flex w-full min-w-0 max-w-full overflow-hidden border-2 border-background"
        data-testid={`${testid}-form`}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="flex-1 min-w-0 max-w-full px-3 py-2.5 bg-transparent text-background placeholder:text-background/45 font-mono text-xs focus:outline-none border-r-2 border-background"
          data-testid={`${testid}-email`}
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest px-3 sm:px-4 hover:bg-primary/90 cursor-pointer disabled:opacity-60"
          data-testid={`${testid}-submit`}
        >
          {busy ? '…' : 'Join'}
        </button>
      </form>
    );
  }

  return (
    <div className="brutal-border bg-card w-full min-w-0 max-w-full overflow-x-hidden" data-testid={`${testid}-box`}>
      <div className="border-b-2 border-foreground px-3 py-2 bg-muted">
        <div className="overline text-primary text-[9px] inline-flex items-center gap-1.5">
          <Mail className="w-3 h-3 shrink-0" />
          {subscribed ? 'Subscribed' : 'Subscribe now'}
        </div>
      </div>
      <div className="p-3 space-y-2.5 min-w-0 overflow-x-hidden">
        {subscribed ? (
          <>
            <p className="font-serif italic text-sm text-foreground/85 leading-snug">
              You&apos;re on the list as{' '}
              <span className="font-mono text-xs not-italic text-foreground break-all">{email}</span>
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={unsubscribe}
              className="brutal-btn w-full py-2 text-[10px]"
              data-testid={`${testid}-unsubscribe`}
            >
              {busy ? (
                <span className="inline-flex items-center gap-1.5 justify-center">
                  <Loader2 className="w-3 h-3 animate-spin" /> Working…
                </span>
              ) : (
                'Unsubscribe'
              )}
            </button>
            <p className="font-mono text-[9px] text-foreground/65 text-center uppercase tracking-wider">
              You can re-subscribe anytime
            </p>
          </>
        ) : (
          <>
            <p className="font-serif italic text-sm text-foreground/85 leading-snug">
              One Tuesday brief. Zero fluff. For CISOs &amp; builders.
            </p>
            <form onSubmit={subscribe} className="space-y-2 w-full min-w-0 max-w-full overflow-x-hidden">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="block w-full min-w-0 max-w-full box-border border-2 border-foreground px-2.5 py-2 font-mono text-xs bg-background focus:outline-none focus:ring-0"
                data-testid={`${testid}-email`}
              />
              <button
                type="submit"
                disabled={busy}
                className="brutal-btn-primary w-full max-w-full py-2 text-[10px]"
                data-testid={`${testid}-submit`}
              >
                {busy ? 'Joining…' : 'Subscribe now →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
