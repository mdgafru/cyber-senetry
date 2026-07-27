'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Zap, Newspaper, Search } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import { ArticleCard, ArticleGridSkeleton, DeskTabs, DESKS } from '@/components/ArticleCard';
import { NewsletterSubscribe } from '@/components/NewsletterSubscribe';

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['home-feed'],
    queryFn: async () => {
      const [a, top] = await Promise.all([
        api.get('/articles?limit=12').catch(() => ({ data: { items: [] } })),
        api.get('/trending-topics').catch(() => ({ data: { topics: [] } })),
      ]);
      return {
        articles: a.data.items || [],
        topics: top.data.topics || [],
      };
    },
  });

  const articles = data?.articles || [];
  const topics = data?.topics || [];
  const loading = isLoading && !data;

  const issueDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <PublicLayout>
      <div className="max-w-[1200px] mx-auto px-5 pb-12" data-testid="home-page">
        <header className="border-b-2 border-foreground py-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="overline text-primary mb-1.5">Issue · {issueDate}</div>
              <h1 className="font-heading font-black uppercase text-3xl md:text-[2.5rem] tracking-tighter leading-none">
                The Signal <span className="text-primary">·</span> Not the Noise
              </h1>
            </div>
            <Link href="/search" prefetch className="brutal-btn text-[10px] px-3 py-2 gap-2">
              <Search className="w-3.5 h-3.5" /> Search archive
            </Link>
          </div>
          <p className="mt-3 lead-muted max-w-lg">
            Rigorous AI &amp; cybersecurity reporting for builders and CISOs.
          </p>
        </header>

        <div className="-mt-[2px]">
          <DeskTabs />
        </div>

        {loading ? (
          <div className="mt-6">
            <ArticleGridSkeleton />
          </div>
        ) : !articles.length ? (
          <div className="brutal-border bg-card p-10 text-center my-6">
            <Newspaper className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="font-heading font-black uppercase text-2xl tracking-tighter mb-2">No stories yet</h2>
            <p className="text-caption mb-5">Publish from the newsroom to fill this grid.</p>
            <Link href="/admin/generate" className="brutal-btn-primary text-[10px]">
              Draft with AI →
            </Link>
          </div>
        ) : (
          <>
            <section className="mt-6" aria-label="Latest stories">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="font-heading font-black uppercase text-base md:text-lg tracking-tight">
                  Latest · {articles.length}
                </h2>
                <Link href="/search" className="overline hover:text-primary" data-testid="view-all-articles">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {articles.map((a) => (
                  <ArticleCard key={a.slug} a={a} />
                ))}
              </div>
            </section>

            {topics.length > 0 && (
              <section className="mt-9" data-testid="trending-topics">
                <div className="flex items-center gap-2 mb-2.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <h2 className="overline">Trending topics</h2>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {topics.map((t) => (
                    <Link
                      key={t.tag}
                      href={`/tag/${encodeURIComponent(t.tag)}`}
                      className="tag-chip"
                      data-testid={`topic-${t.tag}`}
                    >
                      {t.tag}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-9 grid grid-cols-1 lg:grid-cols-5 gap-4">
              <section className="lg:col-span-3">
                <div className="flex items-center gap-2 border-b-2 border-foreground pb-2">
                  <h2 className="font-heading font-black uppercase text-base tracking-tight">More stories</h2>
                </div>
                <div className="border-x-2 border-b-2 border-foreground divide-y-2 divide-foreground">
                  {articles.slice(0, 4).map((a, i) => (
                    <Link
                      key={a.slug}
                      href={`/article/${a.slug}`}
                      prefetch
                      className="flex items-center gap-3 px-3.5 py-3 hover:bg-muted transition-colors duration-100 group"
                      data-testid={`trending-${a.slug}`}
                    >
                      <span className="font-heading font-black text-xl text-primary w-7 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="overline text-primary capitalize text-[9px]">{a.category}</span>
                        <div className="font-heading font-bold text-sm leading-snug group-hover:text-primary line-clamp-2">
                          {a.title}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <section
                className="lg:col-span-2 min-w-0 max-w-full overflow-x-hidden border-2 border-foreground bg-foreground text-background p-5 flex flex-col justify-center"
                data-testid="hero-newsletter"
              >
                <div className="overline text-primary mb-2">Weekly brief</div>
                <h2 className="font-heading font-black uppercase text-xl tracking-tight leading-none mb-2">
                  CISOs read this on Tuesday
                </h2>
                <p className="font-serif italic text-sm text-background/90 mb-4">One dispatch. Zero fluff.</p>
                <NewsletterSubscribe variant="footer" testid="hero-newsletter" />
              </section>
            </div>

            <section className="mt-9">
              <div className="overline mb-3">Browse desks</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {DESKS.map((d) => (
                  <Link
                    key={d.slug}
                    href={`/category/${d.slug}`}
                    prefetch
                    className="brutal-border bg-card px-3 py-3 hover:bg-muted hover:shadow-brutal-sm transition-shadow duration-100 text-center group"
                  >
                    <div className="font-heading font-bold uppercase text-sm group-hover:text-primary">{d.name}</div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
