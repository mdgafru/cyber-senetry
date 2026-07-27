'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API, api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Sparkles, PenLine, Edit3, Loader2, Eye, Save, Send } from 'lucide-react';

const CATEGORIES = ['ai', 'cybersecurity', 'threats', 'policy', 'cloud', 'data'];

/** Prefilled Policy draft — standard SEO lengths verified. Generate yourself. */
const POLICY_DRAFT = {
  topic: 'EU AI Act operational compliance for enterprise CISOs: mapping high-risk AI systems, documentation duties, and governance gaps that audits still miss',
  keywords: 'EU AI Act, AI governance, high-risk AI, CISO compliance, AI risk management',
  tags: 'policy, eu-ai-act, governance, compliance',
  category: 'policy',
  length: 'deep',
  metadata: {
    title: 'How CISOs Close EU AI Act Compliance Gaps in 2026',
    subtitle: 'A practitioner playbook for high-risk AI inventory, documentation, and board-ready governance before regulators ask.',
    excerpt: 'CISOs face new EU AI Act duties on high-risk systems. This guide maps inventory, documentation, and governance steps that hold up under audit scrutiny.',
    focus_keyword: 'EU AI Act compliance',
    seo_title: 'EU AI Act Compliance Gaps CISOs Must Close',
    meta_title: 'EU AI Act Compliance Gaps for CISOs 2026',
    meta_description: 'Map high-risk AI systems, documentation, and governance under the EU AI Act. A CISO playbook for audit-ready compliance without invented risk theater.',
    og_title: 'EU AI Act Compliance Gaps CISOs Must Close',
    og_description: 'Map high-risk AI systems, documentation, and governance under the EU AI Act. A CISO playbook for audit-ready compliance without invented risk theater.',
  },
};

const MANUAL_DEFAULTS = POLICY_DRAFT.metadata;

function Field({ label, children, hint, className = '' }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="flex items-baseline justify-between gap-2 mb-1">
        <span className="overline text-[9px]">{label}</span>
        {hint && <span className="font-mono text-[9px] text-muted-foreground shrink-0">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function inputClass(extra = '') {
  return `w-full border-2 border-foreground px-2.5 py-1.5 font-mono text-xs bg-background focus:outline-none ${extra}`;
}

export default function AdminGeneratePage() {
  const router = useRouter();
  const [mode, setMode] = useState('manual');

  const [topic, setTopic] = useState(POLICY_DRAFT.topic);
  const [keywords, setKeywords] = useState(POLICY_DRAFT.keywords);
  const [tags, setTags] = useState(POLICY_DRAFT.tags);
  const [category, setCategory] = useState(POLICY_DRAFT.category);
  const [length, setLength] = useState(POLICY_DRAFT.length);
  const [autoPublish, setAutoPublish] = useState(false);
  const [metadata, setMetadata] = useState(MANUAL_DEFAULTS);

  const [streaming, setStreaming] = useState(false);
  const [buffer, setBuffer] = useState('');
  const [savedArticle, setSavedArticle] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const setMeta = (key, value) => setMetadata((m) => ({ ...m, [key]: value }));

  const syncTitleMeta = (title) => {
    setMetadata((m) => ({
      ...m,
      title,
      seo_title: m.seo_title || title,
      meta_title: m.meta_title || title,
      og_title: m.og_title || title,
    }));
  };

  const setArticleStatus = async (status) => {
    if (!savedArticle?.id) return;
    setActionBusy(true);
    try {
      const { data } = await api.put(`/admin/articles/${savedArticle.id}`, { status });
      setSavedArticle((a) => ({ ...a, ...data, status: data.status || status }));
      toast.success(status === 'published' ? 'Published successfully.' : 'Saved as draft.');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Update failed');
    } finally {
      setActionBusy(false);
    }
  };

  const openPreview = () => {
    if (!savedArticle?.id) return;
    window.open(`/admin/preview/${savedArticle.id}`, '_blank');
  };

  const runGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return toast.error('Topic required');
    if (mode === 'manual' && !metadata.title.trim()) return toast.error('Title required');

    if (mode === 'manual') {
      const over = [];
      if (metadata.title.length > 70) over.push(`Title ≤70 (now ${metadata.title.length})`);
      if (metadata.seo_title.length > 60) over.push(`SEO title ≤60 (now ${metadata.seo_title.length})`);
      if (metadata.meta_title.length > 60) over.push(`Meta title ≤60 (now ${metadata.meta_title.length})`);
      if (metadata.meta_description.length > 160) over.push(`Meta description ≤160 (now ${metadata.meta_description.length})`);
      if (metadata.excerpt.length > 160) over.push(`Excerpt ≤160 (now ${metadata.excerpt.length})`);
      if (metadata.og_title.length > 60) over.push(`OG title ≤60 (now ${metadata.og_title.length})`);
      if (metadata.og_description.length > 160) over.push(`OG description ≤160 (now ${metadata.og_description.length})`);
      if (over.length) return toast.error(over[0]);
    }

    setStreaming(true);
    setBuffer('');
    setSavedArticle(null);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const payload = {
      mode,
      topic: topic.trim(),
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      category,
      length,
      auto_publish: autoPublish,
      ...(mode === 'manual' ? { metadata } : {}),
    };

    try {
      const res = await fetch(`${API}/admin/generate/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const parts = acc.split('\n\n');
        acc = parts.pop() || '';

        for (const chunk of parts) {
          if (!chunk.startsWith('data: ')) continue;
          try {
            const p = JSON.parse(chunk.slice(6));
            if (p.type === 'delta') setBuffer((b) => b + p.content);
            else if (p.type === 'article') {
              setSavedArticle(p.article);
              toast.success(mode === 'manual' ? (autoPublish ? 'Published & saved.' : 'Draft saved automatically.') : 'Draft saved.');
            } else if (p.type === 'error') {
              const msg = String(p.message || 'Generation failed');
              toast.error(
                msg.includes('not_found') || msg.includes('404') || msg.includes('claude-sonnet-4-20250514')
                  ? 'Model fixed to Claude Sonnet 4.5 — click Generate again.'
                  : msg
              );
            }
          } catch { /* ignore partial JSON */ }
        }
      }
    } catch (err) {
      const msg = err.message || 'Generation failed';
      toast.error(msg.includes('not_found') || msg.includes('404')
        ? 'Model not found. Fixed to Claude Sonnet 4.5 — try Generate again.'
        : msg);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl" data-testid="admin-generate-page">
      <div className="border-b-2 border-foreground pb-3 mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="overline text-primary flex items-center gap-1.5 text-[9px]">
            <Sparkles className="w-3 h-3" /> Claude
          </div>
          <h1 className="font-heading font-black uppercase text-2xl md:text-3xl tracking-tighter leading-none">
            {mode === 'quick' ? 'AI Draft' : 'Manual Generate'}
          </h1>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`brutal-btn text-[9px] px-3 py-1.5 gap-1.5 ${mode === 'quick' ? 'bg-foreground text-background' : ''}`}
            data-testid="gen-mode-quick"
          >
            <Sparkles className="w-3 h-3" /> AI Draft
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`brutal-btn text-[9px] px-3 py-1.5 gap-1.5 ${mode === 'manual' ? 'bg-foreground text-background' : ''}`}
            data-testid="gen-mode-manual"
          >
            <PenLine className="w-3 h-3" /> Manual
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${mode === 'manual' ? 'xl:grid-cols-[1.15fr_0.85fr]' : 'lg:grid-cols-2'}`}>
        <form onSubmit={runGenerate} className={`brutal-border p-3 md:p-4 bg-card space-y-2.5 ${streaming ? 'opacity-70 pointer-events-none' : ''}`} data-testid="generate-form">
          {mode === 'quick' ? (
            <>
              <Field label="Topic *">
                <input
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. The rise of AI-driven phishing in Q1 2026"
                  className={inputClass()}
                  data-testid="gen-topic"
                />
              </Field>
              <Field label="SEO Keywords">
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="AI phishing, deepfake attacks"
                  className={inputClass()}
                  data-testid="gen-keywords"
                />
              </Field>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Category">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass()} data-testid="gen-category">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Length">
                  <select value={length} onChange={(e) => setLength(e.target.value)} className={inputClass()} data-testid="gen-length">
                    <option value="brief">Brief · 600-900</option>
                    <option value="standard">Standard · 900-1400</option>
                    <option value="deep">Deep · 1400-2000</option>
                  </select>
                </Field>
              </div>
              <label className="flex items-center gap-2 border-2 border-foreground px-2.5 py-2 cursor-pointer" data-testid="gen-auto-publish-wrap">
                <input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} data-testid="gen-auto-publish" />
                <span className="font-mono text-[10px] uppercase">Auto-publish immediately</span>
              </label>
              <button type="submit" disabled={streaming} className="brutal-btn-primary w-full py-2.5 text-xs inline-flex items-center justify-center gap-2" data-testid="gen-submit">
                {streaming ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Drafting…</>) : 'Draft with Claude →'}
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <Field label="Topic / angle *" className="sm:col-span-2">
                  <input
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="CSPM blind spots in multi-cloud K8s"
                    className={inputClass()}
                    data-testid="gen-topic"
                  />
                </Field>
                <Field label="Desk *">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass()} data-testid="gen-category">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Length">
                  <select value={length} onChange={(e) => setLength(e.target.value)} className={inputClass()} data-testid="gen-length">
                    <option value="brief">Brief</option>
                    <option value="standard">Standard</option>
                    <option value="deep">Deep</option>
                  </select>
                </Field>
              </div>

              <div className="border-t border-foreground/30 pt-2.5 space-y-2.5">
                <Field label="Title (H1) *" hint={`${metadata.title.length}/70`}>
                  <input
                    required
                    value={metadata.title}
                    onChange={(e) => syncTitleMeta(e.target.value)}
                    placeholder="Exact headline"
                    maxLength={70}
                    className={`${inputClass()} font-heading font-bold`}
                    data-testid="gen-title"
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Field label="Subtitle" hint={`${metadata.subtitle.length}/120`}>
                    <input
                      value={metadata.subtitle}
                      onChange={(e) => setMeta('subtitle', e.target.value)}
                      placeholder="Dek / subheadline"
                      maxLength={120}
                      className={`${inputClass()} font-serif italic`}
                      data-testid="gen-subtitle"
                    />
                  </Field>
                  <Field label="Focus keyword">
                    <input
                      value={metadata.focus_keyword}
                      onChange={(e) => setMeta('focus_keyword', e.target.value)}
                      className={inputClass()}
                      data-testid="gen-focus-keyword"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Field label="Keywords">
                    <input
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="comma, separated"
                      className={inputClass()}
                      data-testid="gen-keywords"
                    />
                  </Field>
                  <Field label="Tags">
                    <input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="cloud, cspm"
                      className={inputClass()}
                      data-testid="gen-tags"
                    />
                  </Field>
                </div>
                <Field label="Excerpt" hint={`${metadata.excerpt.length}/160`}>
                  <input
                    value={metadata.excerpt}
                    onChange={(e) => setMeta('excerpt', e.target.value)}
                    placeholder="Optional short excerpt"
                    maxLength={160}
                    className={inputClass()}
                    data-testid="gen-excerpt"
                  />
                </Field>
              </div>

              <div className="border-t border-foreground/30 pt-2.5 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Field label="SEO title" hint={`${metadata.seo_title.length}/60`}>
                    <input
                      value={metadata.seo_title}
                      onChange={(e) => setMeta('seo_title', e.target.value)}
                      maxLength={60}
                      className={inputClass()}
                      data-testid="gen-seo-title"
                    />
                  </Field>
                  <Field label="Meta title" hint={`${metadata.meta_title.length}/60`}>
                    <input
                      value={metadata.meta_title}
                      onChange={(e) => setMeta('meta_title', e.target.value)}
                      maxLength={60}
                      className={inputClass()}
                      data-testid="gen-meta-title"
                    />
                  </Field>
                </div>
                <Field label="Meta description" hint={`${metadata.meta_description.length}/160`}>
                  <textarea
                    value={metadata.meta_description}
                    onChange={(e) => setMeta('meta_description', e.target.value)}
                    maxLength={160}
                    rows={2}
                    className={inputClass('leading-snug')}
                    data-testid="gen-meta-description"
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Field label="OG title" hint={`${metadata.og_title.length}/60`}>
                    <input
                      value={metadata.og_title}
                      onChange={(e) => setMeta('og_title', e.target.value)}
                      maxLength={60}
                      className={inputClass()}
                      data-testid="gen-og-title"
                    />
                  </Field>
                  <Field label="OG description" hint={`${metadata.og_description.length}/160`}>
                    <input
                      value={metadata.og_description}
                      onChange={(e) => setMeta('og_description', e.target.value)}
                      maxLength={160}
                      className={inputClass()}
                      data-testid="gen-og-description"
                    />
                  </Field>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label className="flex items-center gap-2 border-2 border-foreground px-2.5 py-1.5 cursor-pointer grow" data-testid="gen-auto-publish-wrap">
                  <input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} data-testid="gen-auto-publish" />
                  <span className="font-mono text-[10px] uppercase">Auto-publish</span>
                </label>
                <button type="submit" disabled={streaming} className="brutal-btn-primary px-5 py-2 text-xs grow sm:grow-0 inline-flex items-center justify-center gap-2" data-testid="gen-submit">
                  {streaming ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>) : 'Generate →'}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="brutal-border bg-card flex flex-col min-h-[280px] xl:sticky xl:top-4 xl:max-h-[calc(100vh-6rem)] relative">
          <div className="border-b-2 border-foreground px-3 py-2 flex items-center justify-between shrink-0">
            <div className="overline text-[9px]">{mode === 'quick' ? 'Live draft' : 'Live output'}</div>
            {streaming && (
              <span className="overline text-primary inline-flex items-center gap-1.5 text-[9px]">
                <Loader2 className="w-3 h-3 animate-spin" /> Generating…
              </span>
            )}
          </div>
          <div className="p-3 overflow-auto font-mono text-[11px] whitespace-pre-wrap flex-1 leading-relaxed relative" data-testid="gen-output">
            {streaming && !buffer && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/90 z-10" data-testid="gen-loading">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <div className="font-mono text-[10px] uppercase tracking-widest text-center px-4">
                  Claude is writing…
                  <br />
                  <span className="text-muted-foreground normal-case tracking-normal">Usually 1–3 minutes. Keep this tab open.</span>
                </div>
              </div>
            )}
            {buffer || (
              !streaming && (
                <span className="text-muted-foreground">
                  {mode === 'quick' ? 'Article streams here.' : 'Fill fields → Generate. Auto-saves as draft.'}
                </span>
              )
            )}
          </div>
          {savedArticle && (
            <div className="border-t-2 border-foreground px-3 py-2.5 space-y-2 bg-muted shrink-0">
              <div className="font-mono text-[10px] min-w-0 line-clamp-2">
                <span className="text-primary">✓</span> <strong>{savedArticle.title}</strong>
                <span className="text-muted-foreground ml-1">({savedArticle.status})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={openPreview}
                  className="brutal-btn text-[9px] px-2.5 py-1.5 gap-1 bg-background"
                  data-testid="gen-preview"
                >
                  <Eye className="w-3 h-3" /> Preview
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => setArticleStatus('draft')}
                  className="brutal-btn text-[9px] px-2.5 py-1.5 gap-1 bg-background"
                  data-testid="gen-save-draft"
                >
                  <Save className="w-3 h-3" /> Save draft
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => setArticleStatus('published')}
                  className="brutal-btn-primary text-[9px] px-2.5 py-1.5 gap-1"
                  data-testid="gen-publish"
                >
                  {actionBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Publish
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/admin/articles/${savedArticle.id}`)}
                  className="brutal-btn text-[9px] px-2.5 py-1.5 gap-1 bg-background"
                  data-testid="gen-open-editor"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                {savedArticle.status === 'published' && (
                  <Link
                    href={`/article/${savedArticle.slug}`}
                    target="_blank"
                    className="brutal-btn text-[9px] px-2.5 py-1.5 bg-background"
                  >
                    Live →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
