'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

export default function AdminArticlesPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/admin/articles', { params: { status: 'all', limit: 500 } });
    setItems(data.items || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try { await api.delete(`/admin/articles/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);

  return (
    <div className="p-6 md:p-10 max-w-6xl" data-testid="admin-articles-page">
      <div className="border-b-2 border-foreground pb-6 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="overline text-primary">Editorial</div>
          <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter">All Articles</h1>
        </div>
        <Link href="/admin/articles/new" className="brutal-btn-primary" data-testid="new-article-btn">
          <Plus className="w-4 h-4" /> New Article
        </Link>
      </div>
      <div className="flex gap-2 mb-6">
        {['all', 'published', 'draft'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`tag-chip ${filter === f ? 'bg-foreground text-white' : ''}`}
            data-testid={`filter-${f}`}>{f} ({f === 'all' ? items.length : items.filter(i => i.status === f).length})</button>
        ))}
      </div>
      <div className="brutal-border bg-card overflow-x-auto">
        <table className="w-full font-mono text-xs">
          <thead className="border-b-2 border-foreground bg-muted">
            <tr>
              <th className="text-left p-3 uppercase tracking-widest">Title</th>
              <th className="text-left p-3 uppercase tracking-widest">Category</th>
              <th className="text-left p-3 uppercase tracking-widest">Status</th>
              <th className="text-left p-3 uppercase tracking-widest">Views</th>
              <th className="text-left p-3 uppercase tracking-widest">Updated</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nothing here.</td></tr>
              : filtered.map((a, i) => (
                <tr key={a.id} className={i < filtered.length - 1 ? 'border-b border-muted' : ''} data-testid={`row-${a.id}`}>
                  <td className="p-3">
                    <Link href={`/admin/articles/${a.id}`} className="font-heading font-bold text-sm hover:text-primary" data-testid={`edit-${a.id}`}>{a.title}</Link>
                    {a.ai_generated && <span className="ml-2 border border-primary text-primary px-1">AI</span>}
                  </td>
                  <td className="p-3 uppercase">{a.category}</td>
                  <td className="p-3"><span className={`px-2 py-1 border ${a.status === 'published' ? 'bg-primary text-primary-foreground border-primary' : 'border-foreground'}`}>{a.status}</span></td>
                  <td className="p-3">{a.views}</td>
                  <td className="p-3">{new Date(a.updated_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => remove(a.id, a.title)} className="text-primary hover:opacity-70" data-testid={`del-${a.id}`}><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
