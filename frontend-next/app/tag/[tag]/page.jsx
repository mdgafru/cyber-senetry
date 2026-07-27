'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Newspaper } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import { ArticleCard, ArticleGridSkeleton, DeskTabs } from '@/components/ArticleCard';

export default function TagPage() {
  const { tag } = useParams();
  const decoded = decodeURIComponent(tag || '');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    api
      .get('/articles', { params: { tag: decoded, limit: 40 } })
      .then((r) => setItems(r.data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [decoded]);

  return (
    <PublicLayout>
      <div className="max-w-[1200px] mx-auto px-5 pb-12" data-testid="tag-page">
        <header className="border-b-2 border-foreground py-5">
          <Link href="/" className="inline-flex items-center gap-1.5 overline text-muted-foreground hover:text-primary mb-3">
            <ArrowLeft className="w-3 h-3" /> Home
          </Link>
          <div className="overline text-primary mb-1.5">Tag</div>
          <h1 className="font-heading font-black uppercase text-3xl md:text-[2.75rem] tracking-tighter leading-none">
            #{decoded}
          </h1>
          <p className="mt-3 font-serif italic text-base text-muted-foreground">
            Every dispatch tagged {decoded}.
            {!loading && ` · ${items.length} result${items.length !== 1 ? 's' : ''}`}
          </p>
        </header>

        <div className="-mt-[2px]">
          <DeskTabs />
        </div>

        <section className="mt-6">
          {loading ? (
            <ArticleGridSkeleton />
          ) : items.length === 0 ? (
            <div className="brutal-border bg-card p-10 text-center">
              <Newspaper className="w-8 h-8 text-primary mx-auto mb-4" />
              <p className="font-mono text-sm text-muted-foreground mb-4">No articles for this tag yet.</p>
              <Link href="/" className="brutal-btn text-[10px]">
                ← Back home
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {items.map((a) => (
                <ArticleCard key={a.slug} a={a} />
              ))}
            </div>
          )}
        </section>
      </div>
    </PublicLayout>
  );
}
