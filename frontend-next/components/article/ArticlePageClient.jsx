'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { formatDate } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import ReadingProgress from '@/components/article/ReadingProgress';
import TableOfContents from '@/components/article/TableOfContents';
import ArticleContent from '@/components/article/ArticleContent';
import FAQSection from '@/components/article/FAQSection';
import ShareBar from '@/components/article/ShareBar';
import { NewsletterSubscribe } from '@/components/NewsletterSubscribe';

export default function ArticlePageClient({ article }) {
  const { slug } = article;
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    try {
      const list = JSON.parse(localStorage.getItem('cybersentry360_saved') || '[]');
      setSaved(list.includes(slug));
    } catch {
      /* ignore */
    }
  }, [slug]);

  const toggleSave = () => {
    try {
      const key = 'cybersentry360_saved';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const next = saved ? list.filter((s) => s !== slug) : [...list, slug];
      localStorage.setItem(key, JSON.stringify(next));
      setSaved(!saved);
    } catch {
      /* ignore */
    }
  };

  return (
    <PublicLayout>
      <ReadingProgress />

      <article className="max-w-[1100px] mx-auto px-5 py-4 md:py-5" data-testid="article-page">
        <nav className="flex flex-wrap items-center gap-1.5 overline text-xs mb-3">
          <Link href="/" prefetch className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href={`/category/${article.category}`} prefetch className="hover:text-primary capitalize" data-testid="back-to-category">
            {article.category}
          </Link>
        </nav>

        <header className="border-b-2 border-foreground pb-4 mb-4">
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <Link
              href={`/category/${article.category}`}
              prefetch
              className="bg-primary text-primary-foreground font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 hover:opacity-90"
            >
              {article.category}
            </Link>
            {article.ai_generated && (
              <span className="border border-foreground font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5">
                AI-drafted
              </span>
            )}
          </div>

          <h1 className="font-heading font-black uppercase tracking-tighter text-2xl sm:text-3xl md:text-4xl leading-[1.05]">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="mt-2.5 article-subtitle max-w-3xl line-clamp-3">
              {article.subtitle}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-foreground/85 uppercase tracking-wider">
              <span className="text-foreground">{article.author}</span>
              <span>{formatDate(article.published_at || article.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleSave}
                className={`brutal-btn text-[9px] px-2.5 py-1.5 ${saved ? 'bg-foreground text-background' : ''}`}
              >
                <Bookmark className={`w-3 h-3 ${saved ? 'fill-current' : ''}`} />
                {saved ? 'Saved' : 'Save'}
              </button>
              <ShareBar title={article.title} slug={article.slug} />
            </div>
          </div>
        </header>

        {article.hero_image && (
          <figure className="mb-4">
            <div className="overflow-hidden border-2 border-foreground bg-muted">
              <img
                src={article.hero_image}
                alt={article.title}
                fetchPriority="high"
                decoding="async"
                className="w-full aspect-[2.4/1] object-cover"
              />
            </div>
          </figure>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 w-full items-start">
          <div className="lg:col-span-8 w-full min-w-0 order-2 lg:order-1">
            <div className="lg:hidden mb-4">
              <TableOfContents content={article.body} items={article.table_of_contents} defaultOpen compact />
            </div>

            <ArticleContent content={article.body} />

            <FAQSection faq={article.faq} />

            {article.tags?.length > 0 && (
              <div className="mt-6 pt-4 border-t-2 border-foreground">
                <div className="overline text-[10px] mb-2">Tagged</div>
                <div className="flex flex-wrap gap-1.5">
                  {article.tags.map((t) => (
                    <Link key={t} href={`/tag/${encodeURIComponent(t)}`} className="tag-chip" data-testid={`article-tag-${t}`}>
                      #{t}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 brutal-border bg-foreground text-background p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="overline text-primary text-[9px] mb-1">Keep reading</div>
                <h3 className="font-heading font-black uppercase text-lg tracking-tight leading-none">
                  More from {article.category}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/category/${article.category}`} prefetch className="brutal-btn-primary text-[9px] px-3 py-2">
                  Browse desk →
                </Link>
                <Link href="/search" className="brutal-btn bg-background text-foreground text-[9px] px-3 py-2">
                  Archive
                </Link>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-3 order-1 lg:order-2 lg:sticky lg:top-16 lg:self-start z-10 min-w-0">
            <div className="hidden lg:block">
              <TableOfContents content={article.body} items={article.table_of_contents} defaultOpen compact />
            </div>

            <div className="brutal-border bg-card p-3">
              <div className="overline text-primary text-[9px] mb-2">Desks</div>
              <div className="flex flex-wrap gap-1.5">
                {['ai', 'cybersecurity', 'threats', 'policy', 'cloud', 'data'].map((c) => (
                  <Link
                    key={c}
                    href={`/category/${c}`}
                    prefetch
                    className={`tag-chip text-[9px] ${c === article.category ? 'bg-foreground text-white' : ''}`}
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>

            <NewsletterSubscribe variant="sidebar" testid="article-subscribe" />

            <Link
              href={`/category/${article.category}`}
              prefetch
              className="inline-flex items-center gap-1.5 overline text-[10px] hover:text-primary"
            >
              <ArrowLeft className="w-3 h-3" /> All {article.category}
            </Link>
          </aside>
        </div>
      </article>
    </PublicLayout>
  );
}
