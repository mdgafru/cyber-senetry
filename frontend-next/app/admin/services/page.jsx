'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminServicesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', slug: '', description: '', priority: 99 });

  const load = () => {
    setLoading(true);
    api.get('/admin/services').then((r) => { setItems(r.data.items || []); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const toggle = async (item) => {
    await api.put('/admin/services', { ...item, enabled: !item.enabled });
    toast.success(item.enabled ? 'Service disabled' : 'Service enabled');
    load();
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Delete service "${name}"?`)) return;
    await api.delete('/admin/services', { data: { id } });
    toast.success('Deleted');
    load();
  };

  const add = async (e) => {
    e.preventDefault();
    if (!form.name || !form.slug) return toast.error('Name and slug required');
    await api.post('/admin/services', form);
    toast.success('Service added');
    setForm({ name: '', slug: '', description: '', priority: 99 });
    load();
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl" data-testid="admin-services-page">
      <div className="border-b-2 border-foreground pb-6 mb-8">
        <div className="overline text-primary">Content Desks</div>
        <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter">Services</h1>
        <p className="mt-2 font-serif italic text-lg text-muted-foreground">Each enabled service receives daily AI-generated articles in rotation.</p>
      </div>

      <form onSubmit={add} className="brutal-border p-6 bg-card mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
          className="border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none" />
        <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none" />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none" />
        <button type="submit" className="brutal-btn-primary"><Plus className="w-4 h-4" /> Add Service</button>
      </form>

      <div className="brutal-border bg-card">
        {loading ? <p className="p-6 font-mono text-sm">Loading…</p> : items.map((s, i) => (
          <div key={s.id} className={`p-5 flex items-center gap-4 ${i < items.length - 1 ? 'border-b border-muted' : ''}`}>
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-heading font-bold uppercase">{s.name}</div>
              <div className="font-mono text-xs text-muted-foreground mt-1">{s.slug} · Priority {s.priority}</div>
              {s.description && <p className="text-sm text-muted-foreground mt-1 truncate">{s.description}</p>}
              {s.last_generated_at && <div className="font-mono text-[10px] text-muted-foreground mt-1">Last generated: {new Date(s.last_generated_at).toLocaleString()}</div>}
            </div>
            <button onClick={() => toggle(s)} className="shrink-0" title={s.enabled ? 'Disable' : 'Enable'}>
              {s.enabled ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
            </button>
            <button onClick={() => remove(s.id, s.name)} className="text-primary hover:opacity-70 shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
