'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye, ImageIcon, Loader2 } from 'lucide-react';

const CATEGORIES = ['ai', 'cybersecurity', 'threats', 'policy', 'cloud', 'data'];
const BLANK = {
  title: '', subtitle: '', body: '', category: 'cybersecurity', tags: [], keywords: [], hero_image: '',
  author: 'cybersentry360 Editorial', status: 'draft',
  seo_title: '', meta_title: '', seo_description: '', excerpt: '', focus_keyword: '',
  og_title: '', og_description: '', twitter_title: '', twitter_description: '',
};

function Field({ label, children, testid }) {
  return (
    <label className="block" data-testid={testid}>
      <span className="overline block mb-2">{label}</span>
      {children}
    </label>
  );
}

export default function AdminEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === 'new';
  const [form, setForm] = useState(BLANK);
  const [existing, setExisting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);

  useEffect(() => {
    if (isNew || !id) return;
    api.get('/admin/articles', { params: { status: 'all', limit: 500 } }).then((r) => {
      const found = (r.data.items || []).find(a => a.id === id);
      if (found) {
        setExisting(found);
        setForm({
          title: found.title,
          subtitle: found.subtitle || '',
          body: found.body,
          category: found.category,
          tags: found.tags || [],
          keywords: found.keywords || [],
          hero_image: found.hero_image || '',
          author: found.author || 'cybersentry360 Editorial',
          status: found.status,
          seo_title: found.seo_title || '',
          meta_title: found.meta_title || found.seo_title || '',
          seo_description: found.seo_description || '',
          excerpt: found.excerpt || '',
          focus_keyword: found.focus_keyword || '',
          og_title: found.og_title || '',
          og_description: found.og_description || '',
          twitter_title: found.twitter_title || '',
          twitter_description: found.twitter_description || '',
        });
      }
    });
  }, [id, isNew]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchUnsplashImage = async () => {
    if (!existing?.id) return toast.error('Save draft first, then fetch image');
    setImageBusy(true);
    try {
      const { data } = await api.post('/admin/images/refresh', { postId: existing.id });
      const item = data.items?.[0];
      if (item?.url) {
        set('hero_image', item.url);
        toast.success(`Unsplash image applied (${item.query})`);
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Unsplash fetch failed');
    } finally {
      setImageBusy(false);
    }
  };

  const save = async (publish = false) => {
    setBusy(true);
    try {
      const payload = { ...form, status: publish ? 'published' : form.status };
      if (existing) {
        await api.put(`/admin/articles/${existing.id}`, payload);
        toast.success(publish ? 'Published' : 'Saved');
      } else {
        const { data } = await api.post('/admin/articles', payload);
        toast.success(publish ? 'Published' : 'Draft saved');
        router.push(`/admin/articles/${data.id}`);
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Save failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl" data-testid="admin-editor-page">
      <Link href="/admin/articles" className="overline inline-flex items-center gap-2 mb-6 hover:text-primary" data-testid="editor-back">
        <ArrowLeft className="w-3 h-3" /> All articles
      </Link>
      <div className="border-b-2 border-foreground pb-6 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="overline text-primary">{existing ? 'Edit' : 'New'} article</div>
          <h1 className="font-heading font-black uppercase text-3xl md:text-4xl tracking-tighter">{existing ? existing.title : 'Untitled Draft'}</h1>
        </div>
        <div className="flex gap-3">
          {existing?.status === 'published' && (
            <Link href={`/article/${existing.slug}`} target="_blank" className="brutal-btn" data-testid="editor-preview">
              <Eye className="w-4 h-4" /> View
            </Link>
          )}
          <button disabled={busy} onClick={() => save(false)} className="brutal-btn" data-testid="editor-save"><Save className="w-4 h-4" /> Save draft</button>
          <button disabled={busy} onClick={() => save(true)} className="brutal-btn-primary" data-testid="editor-publish">Publish →</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Field label="Title" testid="ed-title">
            <input value={form.title} onChange={(e) => set('title', e.target.value)} className="w-full border-2 border-foreground px-4 py-3 font-heading font-bold text-2xl bg-background focus:outline-none" data-testid="ed-title-input" />
          </Field>
          <Field label="Subtitle" testid="ed-subtitle">
            <input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} className="w-full border-2 border-foreground px-4 py-3 font-serif italic text-lg bg-background focus:outline-none" data-testid="ed-subtitle-input" />
          </Field>
          <Field label="Body (Markdown)" testid="ed-body">
            <textarea value={form.body} onChange={(e) => set('body', e.target.value)} rows={22} className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none leading-relaxed" data-testid="ed-body-input" />
          </Field>
        </div>
        <div className="space-y-4">
          <Field label="Status" testid="ed-status">
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none" data-testid="ed-status-input">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
          <Field label="Category" testid="ed-category">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none" data-testid="ed-category-input">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Author" testid="ed-author">
            <input value={form.author} onChange={(e) => set('author', e.target.value)} className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none" data-testid="ed-author-input" />
          </Field>
          <Field label="Hero image URL" testid="ed-hero">
            {form.hero_image && (
              <img src={form.hero_image} alt="" className="w-full aspect-[16/9] object-cover border-2 border-foreground mb-2" />
            )}
            <input value={form.hero_image} onChange={(e) => set('hero_image', e.target.value)} placeholder="Auto from Unsplash on generate…" className="w-full border-2 border-foreground px-4 py-3 font-mono text-xs bg-background focus:outline-none mb-2" data-testid="ed-hero-input" />
            {existing && (
              <button
                type="button"
                disabled={imageBusy}
                onClick={fetchUnsplashImage}
                className="brutal-btn w-full text-[10px] gap-2"
                data-testid="ed-hero-unsplash"
              >
                {imageBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                Fetch from Unsplash
              </button>
            )}
          </Field>
          <Field label="Tags (comma separated)" testid="ed-tags">
            <input value={form.tags.join(', ')} onChange={(e) => set('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="w-full border-2 border-foreground px-4 py-3 font-mono text-xs bg-background focus:outline-none" data-testid="ed-tags-input" />
          </Field>
          <Field label="SEO Keywords" testid="ed-keywords">
            <input value={form.keywords.join(', ')} onChange={(e) => set('keywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="w-full border-2 border-foreground px-4 py-3 font-mono text-xs bg-background focus:outline-none" data-testid="ed-keywords-input" />
          </Field>
          <Field label="SEO title (≤60ch)" testid="ed-seo-title">
            <input value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} maxLength={60} className="w-full border-2 border-foreground px-4 py-3 font-mono text-xs bg-background focus:outline-none" data-testid="ed-seo-title-input" />
          </Field>
          <Field label="Meta title (≤60ch)" testid="ed-meta-title">
            <input value={form.meta_title} onChange={(e) => set('meta_title', e.target.value)} maxLength={60} className="w-full border-2 border-foreground px-4 py-3 font-mono text-xs bg-background focus:outline-none" data-testid="ed-meta-title-input" />
          </Field>
          <Field label="Meta description (≤160ch)" testid="ed-seo-desc">
            <textarea value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} maxLength={160} rows={3} className="w-full border-2 border-foreground px-4 py-3 font-mono text-xs bg-background focus:outline-none" data-testid="ed-seo-desc-input" />
          </Field>
          <Field label="Focus keyword" testid="ed-focus-keyword">
            <input value={form.focus_keyword} onChange={(e) => set('focus_keyword', e.target.value)} className="w-full border-2 border-foreground px-4 py-3 font-mono text-xs bg-background focus:outline-none" data-testid="ed-focus-keyword-input" />
          </Field>
          <Field label="Excerpt" testid="ed-excerpt">
            <textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} maxLength={160} rows={2} className="w-full border-2 border-foreground px-4 py-3 font-mono text-xs bg-background focus:outline-none" data-testid="ed-excerpt-input" />
          </Field>
          <div className="border-t-2 border-foreground pt-4 space-y-4">
            <div className="overline text-muted-foreground">Open Graph</div>
            <Field label="OG title" testid="ed-og-title">
              <input value={form.og_title} onChange={(e) => set('og_title', e.target.value)} maxLength={60} className="w-full border-2 border-foreground px-4 py-3 font-mono text-xs bg-background focus:outline-none" data-testid="ed-og-title-input" />
            </Field>
            <Field label="OG description" testid="ed-og-desc">
              <textarea value={form.og_description} onChange={(e) => set('og_description', e.target.value)} maxLength={160} rows={2} className="w-full border-2 border-foreground px-4 py-3 font-mono text-xs bg-background focus:outline-none" data-testid="ed-og-desc-input" />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
