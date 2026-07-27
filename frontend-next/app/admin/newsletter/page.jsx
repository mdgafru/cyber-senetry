'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

export default function AdminNewsletterPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/admin/newsletter')
      .then((r) => setItems(r.data.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const active = items.filter((i) => i.status !== 'unsubscribed');

  const csv = () => {
    const rows = [
      ['email', 'status', 'subscribed_at', 'unsubscribed_at'],
      ...items.map((i) => [i.email, i.status || 'subscribed', i.subscribed_at, i.unsubscribed_at || '']),
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cybersentry360-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const remove = async (s) => {
    if (!confirm(`Delete ${s.email} permanently?`)) return;
    const key = s.id || s.email;
    setDeleting(key);
    try {
      await api.delete('/admin/newsletter', {
        params: s.id ? { id: s.id } : { email: s.email },
      });
      setItems((list) => list.filter((i) => (i.id ? i.id !== s.id : i.email !== s.email)));
      toast.success('Subscriber deleted');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl" data-testid="admin-newsletter-page">
      <div className="border-b-2 border-foreground pb-6 mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="overline text-primary">Audience</div>
          <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter">Newsletter</h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {active.length} active · {items.length - active.length} unsubscribed
          </p>
        </div>
        <button onClick={csv} disabled={!items.length} className="brutal-btn-primary" data-testid="newsletter-export">
          Export CSV
        </button>
      </div>
      <div className="brutal-border bg-card">
        <div className="border-b-2 border-foreground p-3 grid grid-cols-12 font-mono text-[10px] uppercase tracking-widest bg-muted gap-2">
          <span className="col-span-5">Email</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-3 text-right">Date</span>
          <span className="col-span-2 text-right">Action</span>
        </div>
        {loading ? (
          <p className="p-6 font-mono text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-6 font-mono text-sm text-muted-foreground">No subscribers yet.</p>
        ) : (
          items.map((s, i) => {
            const key = s.id || s.email;
            const busy = deleting === key;
            return (
              <div
                key={key}
                className={`grid grid-cols-12 p-3 font-mono text-xs items-center gap-2 ${i < items.length - 1 ? 'border-b border-muted' : ''}`}
                data-testid={`sub-${i}`}
              >
                <span className="col-span-5 truncate">{s.email}</span>
                <span className={`col-span-2 uppercase ${s.status === 'unsubscribed' ? 'text-muted-foreground' : 'text-primary'}`}>
                  {s.status === 'unsubscribed' ? 'Off' : 'On'}
                </span>
                <span className="col-span-3 text-right text-muted-foreground">
                  {new Date(s.unsubscribed_at || s.subscribed_at).toLocaleDateString()}
                </span>
                <span className="col-span-2 flex justify-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(s)}
                    className="brutal-btn text-[9px] px-2 py-1.5 gap-1 hover:bg-primary hover:text-primary-foreground"
                    data-testid={`sub-delete-${i}`}
                    title="Delete subscriber"
                  >
                    {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete
                  </button>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
