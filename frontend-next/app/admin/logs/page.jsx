'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminLogsPage() {
  const [cronLogs, setCronLogs] = useState([]);
  const [genLogs, setGenLogs] = useState([]);
  const [tab, setTab] = useState('cron');

  useEffect(() => {
    api.get('/admin/logs', { params: { type: 'cron' } }).then((r) => setCronLogs(r.data.items || []));
    api.get('/admin/logs', { params: { type: 'generation' } }).then((r) => setGenLogs(r.data.items || []));
  }, []);

  const logs = tab === 'cron' ? cronLogs : genLogs;

  return (
    <div className="p-6 md:p-10 max-w-6xl" data-testid="admin-logs-page">
      <div className="border-b-2 border-foreground pb-6 mb-8">
        <div className="overline text-primary">System</div>
        <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter">Logs</h1>
      </div>
      <div className="flex gap-2 mb-6">
        {['cron', 'generation'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`tag-chip ${tab === t ? 'bg-foreground text-white' : ''}`}>{t} ({t === 'cron' ? cronLogs.length : genLogs.length})</button>
        ))}
      </div>
      <div className="brutal-border bg-card overflow-x-auto">
        <table className="w-full font-mono text-xs">
          <thead className="border-b-2 border-foreground bg-muted">
            <tr>
              <th className="text-left p-3 uppercase tracking-widest">Time</th>
              <th className="text-left p-3 uppercase tracking-widest">Status</th>
              {tab === 'generation' && <th className="text-left p-3 uppercase tracking-widest">Topic</th>}
              <th className="text-left p-3 uppercase tracking-widest">Message</th>
              {tab === 'generation' && <th className="text-left p-3 uppercase tracking-widest">Duration</th>}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No logs yet.</td></tr>
              : logs.map((l, i) => (
                <tr key={l.id} className={i < logs.length - 1 ? 'border-b border-muted' : ''}>
                  <td className="p-3 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="p-3"><span className={`px-2 py-1 border ${l.status === 'success' ? 'bg-primary text-primary-foreground border-primary' : l.status === 'failed' ? 'border-primary text-primary' : 'border-foreground'}`}>{l.status}</span></td>
                  {tab === 'generation' && <td className="p-3 max-w-[200px] truncate">{l.topic || '-'}</td>}
                  <td className="p-3 max-w-md truncate">{l.message || l.error || '-'}</td>
                  {tab === 'generation' && <td className="p-3">{l.duration_ms ? `${(l.duration_ms / 1000).toFixed(1)}s` : '-'}</td>}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
