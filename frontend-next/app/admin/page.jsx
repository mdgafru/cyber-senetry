'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { FileText, Sparkles, Zap, AlertTriangle } from 'lucide-react';

function Stat({ label, value, testid, accent }) {
  return (
    <div className="brutal-border p-6 bg-card" data-testid={testid}>
      <div className="overline text-muted-foreground">{label}</div>
      <div className={`mt-2 font-heading font-black text-5xl tracking-tighter ${accent ? 'text-primary' : ''}`}>{value}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, subs: 0, todayGenerated: 0, failedJobs: 0 });
  const [recent, setRecent] = useState([]);
  const [logs, setLogs] = useState([]);
  const [automation, setAutomation] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/newsletter'),
    ]).then(([dash, n]) => {
      setStats({ ...dash.data.stats, subs: n.data.total || 0 });
      setRecent(dash.data.recentPosts || []);
      setLogs(dash.data.recentLogs || []);
      setAutomation(dash.data.automation);
    }).catch(() => {
      api.get('/admin/articles', { params: { status: 'all', limit: 500 } }).then((a) => {
        const items = a.data.items || [];
        setStats({
          total: items.length,
          published: items.filter(x => x.status === 'published').length,
          drafts: items.filter(x => x.status === 'draft').length,
          subs: 0, todayGenerated: 0, failedJobs: 0,
        });
        setRecent(items.slice(0, 8));
      });
    });
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-6xl" data-testid="admin-dashboard">
      <div className="border-b-2 border-foreground pb-6 mb-8">
        <div className="overline text-primary">Newsroom · AI CMS</div>
        <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter">Control Room</h1>
        {automation && (
          <div className="mt-3 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${automation.enabled ? 'bg-green-500' : 'bg-primary'}`} />
            Automation {automation.enabled ? 'Active' : 'Paused'} · Daily at {automation.daily_time} UTC
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Stat label="Total Posts" value={stats.total} testid="stat-total" />
        <Stat label="Published" value={stats.published} testid="stat-published" />
        <Stat label="Drafts" value={stats.drafts} testid="stat-drafts" />
        <Stat label="Subscribers" value={stats.subs} testid="stat-subs" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <Stat label="Today's Generated" value={stats.todayGenerated} testid="stat-today" accent />
        <Stat label="Failed Jobs" value={stats.failedJobs} testid="stat-failed" accent={stats.failedJobs > 0} />
        <Stat label="Traffic" value="-" testid="stat-traffic" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Link href="/admin/automation" className="brutal-border p-6 bg-card hover:shadow-brutal transition-all group" data-testid="quick-automation">
          <Zap className="w-6 h-6 text-primary mb-3" />
          <div className="font-heading font-bold uppercase text-lg">Automation</div>
          <p className="text-sm text-muted-foreground mt-1">Daily generation, scheduling, and AI settings.</p>
        </Link>
        <Link href="/admin/generate" className="brutal-border p-6 bg-card hover:shadow-brutal transition-all group" data-testid="quick-generate">
          <Sparkles className="w-6 h-6 text-primary mb-3" />
          <div className="font-heading font-bold uppercase text-lg">AI Generate</div>
          <p className="text-sm text-muted-foreground mt-1">Draft an article from a keyword or topic.</p>
        </Link>
        <Link href="/admin/articles/new" className="brutal-border p-6 bg-card hover:shadow-brutal transition-all" data-testid="quick-new">
          <FileText className="w-6 h-6 text-primary mb-3" />
          <div className="font-heading font-bold uppercase text-lg">New Post</div>
          <p className="text-sm text-muted-foreground mt-1">Compose an original piece by hand.</p>
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="brutal-border bg-card">
          <div className="border-b-2 border-foreground p-4 flex items-center justify-between">
            <div className="overline">Recent Posts</div>
            <Link href="/admin/articles" className="overline hover:text-primary" data-testid="see-all-articles">See all →</Link>
          </div>
          <div>
            {recent.length === 0 ? <p className="p-6 font-mono text-sm text-muted-foreground">No articles yet.</p> : recent.map((a, i) => (
              <Link key={a.id} href={`/admin/articles/${a.id}`}
                className={`flex items-center justify-between p-4 hover:bg-muted ${i < recent.length - 1 ? 'border-b border-muted' : ''}`}
                data-testid={`recent-${a.id}`}>
                <div className="min-w-0">
                  <div className="font-heading font-bold truncate">{a.title}</div>
                  <div className="font-mono text-xs text-muted-foreground mt-1">{a.category} · {a.reading_time || '?'} min · {a.status}</div>
                </div>
                <span className={`shrink-0 ml-4 font-mono text-[10px] uppercase px-2 py-1 border ${a.status === 'published' ? 'bg-primary text-primary-foreground border-primary' : 'border-foreground'}`}>{a.status}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="brutal-border bg-card">
          <div className="border-b-2 border-foreground p-4 flex items-center justify-between">
            <div className="overline flex items-center gap-2"><AlertTriangle className="w-3 h-3" /> Recent Logs</div>
            <Link href="/admin/logs" className="overline hover:text-primary">View all →</Link>
          </div>
          <div>
            {logs.length === 0 ? <p className="p-6 font-mono text-sm text-muted-foreground">No logs yet.</p> : logs.map((l, i) => (
              <div key={l.id} className={`p-4 ${i < logs.length - 1 ? 'border-b border-muted' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${l.status === 'success' ? 'bg-primary text-primary-foreground border-primary' : l.status === 'failed' ? 'border-primary text-primary' : 'border-foreground'}`}>{l.status}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-2 text-sm truncate">{l.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
