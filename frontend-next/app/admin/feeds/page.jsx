'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ExternalLink, RefreshCw } from 'lucide-react';

export default function AdminFeedsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/feeds');
      setItems(data.items || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);
  const cats = ['all', ...Array.from(new Set(items.map(i => i.category)))];

  return (
    <div className="p-6 md:p-10 max-w-6xl" data-testid="admin-feeds-page">
      <div className="border-b-2 border-foreground pb-6 mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="overline text-primary">Wire</div>
          <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter">News Feeds</h1>
          <p className="mt-2 font-serif italic text-lg text-muted-foreground">Live from Krebs, Dark Reading, Anthropic, BleepingComputer & more.</p>
        </div>
        <button onClick={load} disabled={loading} className="brutal-btn" data-testid="feeds-refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {cats.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`tag-chip ${filter === c ? 'bg-foreground text-white' : ''}`} data-testid={`feed-filter-${c}`}>{c}</button>
        ))}
      </div>
      {loading ? <p className="font-mono text-sm">Loading feeds…</p> : (
        <div className="brutal-border bg-card divide-y divide-muted">
          {filtered.map((it, i) => (
            <div key={i} className="p-5 flex flex-col md:flex-row md:items-start md:gap-6 hover:bg-muted transition-colors" data-testid={`feed-item-${i}`}>
              <div className="md:w-48 shrink-0 mb-2 md:mb-0">
                <div className="overline text-primary">{it.source}</div>
                <div className="font-mono text-[10px] uppercase text-muted-foreground mt-1">{it.published?.slice(0, 25)}</div>
                <div className="font-mono text-[10px] uppercase mt-1">{it.category}</div>
              </div>
              <div className="flex-1 min-w-0">
                <a href={it.link} target="_blank" rel="noreferrer" className="font-heading font-bold text-lg hover:text-primary inline-flex items-baseline gap-2" data-testid={`feed-link-${i}`}>
                  {it.title} <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{it.summary}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="p-6 font-mono text-sm text-muted-foreground">No items.</p>}
        </div>
      )}
    </div>
  );
}
