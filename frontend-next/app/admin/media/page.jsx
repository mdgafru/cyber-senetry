'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ImageIcon, Loader2, RefreshCw } from 'lucide-react';

export default function AdminMediaPage() {
  const [posts, setPosts] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get('/admin/articles', { params: { status: 'all', limit: 200 } }).then((r) => setPosts(r.data.items || []));
  };

  useEffect(() => {
    load();
  }, []);

  const refreshAll = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/admin/images/refresh', { all: true });
      toast.success(`Updated ${data.updated} images (${data.unsplash} from Unsplash)`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Image refresh failed');
    } finally {
      setBusy(false);
    }
  };

  const withImages = posts.filter((p) => p.hero_image);

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="border-b-2 border-foreground pb-6 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="overline text-primary">Assets</div>
          <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter">Media</h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {withImages.length} featured images · Unsplash topic search
          </p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          disabled={busy}
          className="brutal-btn-primary text-[10px] gap-2"
          data-testid="refresh-all-images"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh all from Unsplash
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {withImages.map((p) => (
          <div key={p.id} className="brutal-border bg-card overflow-hidden">
            <img src={p.hero_image} alt={p.title} className="w-full aspect-[16/10] object-cover border-b-2 border-foreground" />
            <div className="p-3">
              <div className="font-heading font-bold text-xs uppercase truncate">{p.title}</div>
              <div className="font-mono text-[10px] text-muted-foreground mt-1">{p.category}</div>
            </div>
          </div>
        ))}
        {withImages.length === 0 && (
          <p className="col-span-full font-mono text-sm text-muted-foreground py-16 text-center flex items-center justify-center gap-2">
            <ImageIcon className="w-4 h-4" /> No media yet. Generate an article or refresh images after adding UNSPLASH_ACCESS_KEY.
          </p>
        )}
      </div>
    </div>
  );
}
