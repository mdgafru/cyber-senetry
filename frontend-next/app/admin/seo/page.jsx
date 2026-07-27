'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
import { Save, MapPin, Search } from 'lucide-react';

export default function AdminSeoPage() {
  const [tab, setTab] = useState('seo');
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/admin/articles', { params: { status: 'all', limit: 100 } }).then((r) => setPosts(r.data.items || []));
    api.get('/admin/automation').then((r) => setSettings(r.data.settings));
  }, []);

  const setGeo = (k, v) => setSettings((s) => ({ ...s, geo: { ...(s.geo || {}), [k]: v } }));

  const saveGeo = async () => {
    setBusy(true);
    try {
      await api.put('/admin/automation', settings);
      toast.success('Geo / Local SEO saved');
    } catch {
      toast.error('Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-5 md:p-8 max-w-6xl" data-testid="admin-seo-page">
      <div className="border-b-2 border-foreground pb-4 mb-5">
        <div className="overline text-primary">Search Optimization</div>
        <h1 className="font-heading font-black uppercase text-3xl md:text-4xl tracking-tighter">SEO &amp; Geo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Post meta + local geo tags used in article generation.</p>
      </div>

      <div className="flex gap-1.5 mb-5">
        <button
          type="button"
          onClick={() => setTab('seo')}
          className={`tag-chip inline-flex items-center gap-1.5 ${tab === 'seo' ? 'bg-foreground text-white hover:bg-foreground' : ''}`}
        >
          <Search className="w-3 h-3" /> Post SEO
        </button>
        <button
          type="button"
          onClick={() => setTab('geo')}
          className={`tag-chip inline-flex items-center gap-1.5 ${tab === 'geo' ? 'bg-foreground text-white hover:bg-foreground' : ''}`}
        >
          <MapPin className="w-3 h-3" /> Local Geo
        </button>
      </div>

      {tab === 'seo' && (
        <div className="brutal-border bg-card overflow-x-auto">
          <table className="w-full font-mono text-xs">
            <thead className="border-b-2 border-foreground bg-muted">
              <tr>
                <th className="text-left p-3 uppercase tracking-widest">Title</th>
                <th className="text-left p-3 uppercase tracking-widest">SEO Title</th>
                <th className="text-left p-3 uppercase tracking-widest">Meta Description</th>
                <th className="text-left p-3 uppercase tracking-widest">Focus KW</th>
                <th className="text-left p-3 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p, i) => (
                <tr key={p.id} className={i < posts.length - 1 ? 'border-b border-muted' : ''}>
                  <td className="p-3">
                    <Link href={`/admin/articles/${p.id}`} className="font-heading font-bold hover:text-primary">
                      {p.title}
                    </Link>
                  </td>
                  <td className="p-3 max-w-[160px] truncate">{p.seo_title || '-'}</td>
                  <td className="p-3 max-w-[220px] truncate">{p.seo_description || '-'}</td>
                  <td className="p-3 max-w-[120px] truncate">{p.focus_keyword || (p.keywords && p.keywords[0]) || '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 border ${p.status === 'published' ? 'bg-primary text-primary-foreground border-primary' : 'border-foreground'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">No posts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'geo' && (
        <div className="brutal-border bg-card p-5 md:p-6 space-y-4 max-w-3xl">
          {!settings ? (
            <p className="font-mono text-sm text-muted-foreground">Loading geo settings…</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                These values are injected into every AI article (geo meta, local keywords, schema region).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['country', 'state', 'city', 'region', 'business_area'].map((k) => (
                  <label key={k} className="block">
                    <span className="overline block mb-1.5 text-[10px]">{k.replace('_', ' ')}</span>
                    <input
                      value={settings.geo?.[k] || ''}
                      onChange={(e) => setGeo(k, e.target.value)}
                      className="w-full border-2 border-foreground px-3 py-2.5 font-mono text-sm bg-background focus:outline-none"
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="overline block mb-1.5 text-[10px]">Latitude</span>
                  <input
                    type="number"
                    step="any"
                    value={settings.geo?.latitude ?? ''}
                    onChange={(e) => setGeo('latitude', e.target.value === '' ? null : parseFloat(e.target.value))}
                    className="w-full border-2 border-foreground px-3 py-2.5 font-mono text-sm bg-background focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="overline block mb-1.5 text-[10px]">Longitude</span>
                  <input
                    type="number"
                    step="any"
                    value={settings.geo?.longitude ?? ''}
                    onChange={(e) => setGeo('longitude', e.target.value === '' ? null : parseFloat(e.target.value))}
                    className="w-full border-2 border-foreground px-3 py-2.5 font-mono text-sm bg-background focus:outline-none"
                  />
                </label>
              </div>
              <button type="button" onClick={saveGeo} disabled={busy} className="brutal-btn-primary text-[10px] px-4 py-2.5">
                <Save className="w-3.5 h-3.5" /> {busy ? 'Saving…' : 'Save Geo'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
