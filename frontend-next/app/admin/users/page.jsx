'use client';
import { useAuth } from '@/lib/auth';

export default function AdminUsersPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <div className="border-b-2 border-foreground pb-6 mb-8">
        <div className="overline text-primary">Access Control</div>
        <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter">Users</h1>
        <p className="mt-2 font-serif italic text-lg text-muted-foreground">Manage admin users via Supabase Auth dashboard.</p>
      </div>
      <div className="brutal-border bg-card p-6">
        <div className="overline mb-4">Current Session</div>
        <div className="font-heading font-bold text-xl">{user?.email}</div>
        <div className="font-mono text-xs text-muted-foreground mt-2">Role: Admin · ID: {user?.id?.slice(0, 8)}…</div>
        <p className="mt-6 text-sm text-muted-foreground">To add new admin users, create accounts in your Supabase project under Authentication → Users. They will automatically receive admin role on first login.</p>
      </div>
    </div>
  );
}
