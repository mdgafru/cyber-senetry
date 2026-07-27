'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/admin/automation').then((r) => setSettings(r.data.settings));
  }, []);

  if (!settings) return <div className="p-10 font-mono text-sm">Loading…</div>;

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      await api.put('/admin/automation', settings);
      toast.success('Settings saved');
    } catch {
      toast.error('Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <div className="border-b-2 border-foreground pb-4 mb-5">
        <div className="overline text-primary">Configuration</div>
        <h1 className="font-heading font-black uppercase text-3xl md:text-4xl tracking-tighter">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Site identity. For Local Geo, use <span className="text-primary">SEO &amp; Geo</span>.
        </p>
      </div>

      <div className="brutal-border p-5 bg-card space-y-4">
        <div className="overline text-primary text-[10px]">Site</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="overline block mb-1.5 text-[10px]">Site Name</span>
            <input
              value={settings.site_name || ''}
              onChange={(e) => set('site_name', e.target.value)}
              className="w-full border-2 border-foreground px-3 py-2.5 font-mono text-sm bg-background focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="overline block mb-1.5 text-[10px]">Site URL</span>
            <input
              value={settings.site_url || ''}
              onChange={(e) => set('site_url', e.target.value)}
              className="w-full border-2 border-foreground px-3 py-2.5 font-mono text-sm bg-background focus:outline-none"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="overline block mb-1.5 text-[10px]">Author Name</span>
            <input
              value={settings.author_name || ''}
              onChange={(e) => set('author_name', e.target.value)}
              className="w-full border-2 border-foreground px-3 py-2.5 font-mono text-sm bg-background focus:outline-none"
            />
          </label>
        </div>

        <div className="overline text-primary text-[10px] pt-2">API Keys</div>
        <p className="font-mono text-xs text-muted-foreground">
          Anthropic and Supabase keys stay in <code>.env.local</code> - never exposed on the frontend.
        </p>

        <button onClick={save} disabled={busy} className="brutal-btn-primary w-full py-3 text-[10px]">
          <Save className="w-3.5 h-3.5" /> {busy ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
