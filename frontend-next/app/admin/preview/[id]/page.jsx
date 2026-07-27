'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, formatDate } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Eye, Save, Send, Loader2 } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import ArticleContent from '@/components/article/ArticleContent';
import FAQSection from '@/components/article/FAQSection';
import TableOfContents from '@/components/article/TableOfContents';

export default function AdminPreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/admin/articles/${id}`)
      .then((r) => setArticle(r.data.article))
      .catch(() => toast.error('Preview load failed'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const setStatus = async (status) => {
    if (!article) return;
    setBusy(true);
    try {
      const { data } = await api.put(`/admin/articles/${article.id}`, { status });
      setArticle((a) => ({ ...a, ...data, status: data.status || status }));
      toast.success(status === 'published' ? 'Published live.' : 'Saved as draft.');
      if (status === 'published') {
        // refresh so public fields sync
        load();
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading preview…
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="font-mono text-sm">Article not found.</p>
        <Link href="/admin/generate" className="brutal-btn text-[10px]">← Back</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-preview-page">
      <div className="sticky top-0 z-50 border-b-2 border-foreground bg-foreground text-background">
        <div className="max-w-[1100px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="font-mono text-[10px] uppercase tracking-wider inline-flex items-center gap-1 hover:text-primary"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
            <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border border-background/30">
              Preview · {article.status}
            </span>
            <span className="font-heading font-bold text-sm truncate hidden sm:inline">{article.title}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus('draft')}
              className="brutal-btn bg-background text-foreground text-[9px] px-2.5 py-1.5 gap-1"
              data-testid="preview-save-draft"
            >
              <Save className="w-3 h-3" /> Save draft
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus('published')}
              className="brutal-btn-primary text-[9px] px-2.5 py-1.5 gap-1"
              data-testid="preview-publish"
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Publish
            </button>
            <Link
              href={`/admin/articles/${article.id}`}
              className="brutal-btn bg-background text-foreground text-[9px] px-2.5 py-1.5"
            >
              Edit
            </Link>
            {article.status === 'published' && (
              <Link
                href={`/article/${article.slug}`}
                target="_blank"
                className="brutal-btn bg-background text-foreground text-[9px] px-2.5 py-1.5 gap-1"
              >
                <Eye className="w-3 h-3" /> Live
              </Link>
            )}
          </div>
        </div>
      </div>

      <PublicLayout>
        <div className="max-w-[1100px] mx-auto px-5 py-5">
          {article.status !== 'published' && (
            <div className="mb-4 border-2 border-primary bg-primary/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-primary">
              Draft preview — not public until you Publish
            </div>
          )}
          <div className="overline text-primary capitalize mb-2">{article.category}</div>
          <h1 className="font-heading font-black uppercase tracking-tighter text-2xl sm:text-3xl md:text-4xl leading-[1.05]">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="mt-2.5 font-serif italic text-base md:text-lg text-muted-foreground leading-snug max-w-3xl">
              {article.subtitle}
            </p>
          )}
          <div className="mt-3 font-mono text-[10px] text-muted-foreground uppercase tracking-wider flex gap-3">
            <span className="text-foreground">{article.author}</span>
            <span>{formatDate(article.published_at || article.created_at)}</span>
          </div>

          {article.hero_image && (
            <figure className="my-4">
              <div className="overflow-hidden border-2 border-foreground bg-muted">
                <img src={article.hero_image} alt={article.title} className="w-full aspect-[2.4/1] object-cover" />
              </div>
            </figure>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
            <div>
              <ArticleContent content={article.body} />
              {article.faq?.length > 0 && <FAQSection faq={article.faq} />}
            </div>
            {article.table_of_contents?.length > 0 && (
              <aside className="hidden lg:block">
                <TableOfContents items={article.table_of_contents} content={article.body} />
              </aside>
            )}
          </div>
        </div>
      </PublicLayout>
    </div>
  );
}
