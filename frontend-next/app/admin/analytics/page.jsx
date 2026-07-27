'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminAnalyticsPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.get('/admin/articles', { params: { status: 'all', limit: 500 } }).then((r) => setPosts(r.data.items || []));
  }, []);

  const published = posts.filter((p) => p.status === 'published');
  const totalViews = published.reduce((s, p) => s + (p.views || 0), 0);
  const topPosts = [...published].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
  const byCategory = published.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + 1; return acc; }, {});

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="border-b-2 border-foreground pb-6 mb-8">
        <div className="overline text-primary">Performance</div>
        <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter">Analytics</h1>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Views', value: totalViews },
          { label: 'Published', value: published.length },
          { label: 'Avg Views/Post', value: published.length ? Math.round(totalViews / published.length) : 0 },
          { label: 'AI Generated', value: posts.filter((p) => p.ai_generated).length },
        ].map((s) => (
          <div key={s.label} className="brutal-border p-6 bg-card">
            <div className="overline text-muted-foreground">{s.label}</div>
            <div className="mt-2 font-heading font-black text-4xl tracking-tighter">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="brutal-border bg-card">
          <div className="border-b-2 border-foreground p-4 overline">Top Posts by Views</div>
          {topPosts.map((p, i) => (
            <div key={p.id} className={`p-4 flex justify-between ${i < topPosts.length - 1 ? 'border-b border-muted' : ''}`}>
              <span className="font-heading font-bold text-sm truncate flex-1">{p.title}</span>
              <span className="font-mono text-xs text-primary ml-4">{p.views || 0}</span>
            </div>
          ))}
          {topPosts.length === 0 && <p className="p-6 font-mono text-sm text-muted-foreground">No data yet.</p>}
        </div>
        <div className="brutal-border bg-card">
          <div className="border-b-2 border-foreground p-4 overline">Posts by Category</div>
          {Object.entries(byCategory).map(([cat, count], i, arr) => (
            <div key={cat} className={`p-4 flex justify-between ${i < arr.length - 1 ? 'border-b border-muted' : ''}`}>
              <span className="font-mono text-xs uppercase">{cat}</span>
              <span className="font-heading font-bold">{count}</span>
            </div>
          ))}
          {Object.keys(byCategory).length === 0 && <p className="p-6 font-mono text-sm text-muted-foreground">No data yet.</p>}
        </div>
      </div>
    </div>
  );
}
