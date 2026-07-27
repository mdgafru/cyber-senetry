'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Zap, Play, Save } from 'lucide-react';

export default function AdminAutomationPage() {
  const [settings, setSettings] = useState(null);
  const [nextService, setNextService] = useState(null);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get('/admin/automation').then((r) => {
      setSettings(r.data.settings);
      setNextService(r.data.nextService);
    });
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    try {
      await api.put('/admin/automation', settings);
      toast.success('Automation settings saved');
    } catch { toast.error('Save failed'); }
    finally { setBusy(false); }
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const { data } = await api.post('/admin/automation', { action: 'run_now' });
      if (data.success) toast.success(`Published article for ${data.service}`);
      else toast.error(data.error || 'Generation failed');
      load();
    } catch { toast.error('Run failed'); }
    finally { setRunning(false); }
  };

  if (!settings) return <div className="p-10 font-mono text-sm">Loading…</div>;

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  return (
    <div className="p-6 md:p-10 max-w-4xl" data-testid="admin-automation-page">
      <div className="border-b-2 border-foreground pb-6 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="overline text-primary flex items-center gap-2"><Zap className="w-3 h-3" /> Daily Automation</div>
          <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter">Automation</h1>
          {nextService && <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Next in queue: <span className="text-primary">{nextService.name}</span></p>}
        </div>
        <button onClick={runNow} disabled={running} className="brutal-btn-primary"><Play className="w-4 h-4" /> {running ? 'Generating…' : 'Run Now'}</button>
      </div>

      <div className="brutal-border p-6 bg-card space-y-5">
        <label className="flex items-center gap-3 border-2 border-foreground p-4 cursor-pointer">
          <input type="checkbox" checked={settings.enabled} onChange={(e) => set('enabled', e.target.checked)} />
          <span className="font-mono text-xs uppercase">Enable daily automation</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="overline block mb-2">Daily generation time (UTC)</span>
            <input type="time" value={settings.daily_time} onChange={(e) => set('daily_time', e.target.value)}
              className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none" />
          </label>
          <label className="block">
            <span className="overline block mb-2">Articles per day</span>
            <input type="number" min={1} max={5} value={settings.articles_per_day} onChange={(e) => set('articles_per_day', parseInt(e.target.value))}
              className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none" />
          </label>
          <label className="block">
            <span className="overline block mb-2">AI Model</span>
            <select value={settings.ai_model} onChange={(e) => set('ai_model', e.target.value)}
              className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none">
              <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (legacy)</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
            </select>
          </label>
          <label className="block">
            <span className="overline block mb-2">Temperature</span>
            <input type="number" min={0} max={1} step={0.05} value={settings.temperature} onChange={(e) => set('temperature', parseFloat(e.target.value))}
              className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none" />
          </label>
          <label className="block">
            <span className="overline block mb-2">Max Tokens</span>
            <input type="number" value={settings.max_tokens} onChange={(e) => set('max_tokens', parseInt(e.target.value))}
              className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none" />
          </label>
          <label className="block">
            <span className="overline block mb-2">Retry Count</span>
            <input type="number" min={1} max={10} value={settings.retry_count} onChange={(e) => set('retry_count', parseInt(e.target.value))}
              className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none" />
          </label>
          <label className="block">
            <span className="overline block mb-2">Publishing Delay (minutes)</span>
            <input type="number" min={0} value={settings.publishing_delay_minutes} onChange={(e) => set('publishing_delay_minutes', parseInt(e.target.value))}
              className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none" />
          </label>
          <label className="block">
            <span className="overline block mb-2">Author Name</span>
            <input value={settings.author_name} onChange={(e) => set('author_name', e.target.value)}
              className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none" />
          </label>
        </div>

        <button onClick={save} disabled={busy} className="brutal-btn-primary w-full py-4"><Save className="w-4 h-4" /> Save Settings</button>
      </div>

      <div className="mt-8 brutal-border p-6 bg-muted font-mono text-xs">
        <div className="overline mb-3">How it works</div>
        <ul className="space-y-2 text-muted-foreground">
          <li>· Every day at the scheduled time, the cron job selects the next enabled service (round-robin).</li>
          <li>· Claude generates a unique 1800-2500 word article with full SEO metadata.</li>
          <li>· The article is automatically published - no manual approval required.</li>
          <li>· Topics are tracked in prompt_history to never repeat.</li>
          <li>· Failed jobs retry automatically up to the configured retry count.</li>
        </ul>
      </div>
    </div>
  );
}
