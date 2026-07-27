'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function AdminProfilePage() {
  const { user } = useAuth();

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <div className="border-b-2 border-foreground pb-4 mb-5">
        <div className="overline text-primary">Account</div>
        <h1 className="font-heading font-black uppercase text-3xl md:text-4xl tracking-tighter">Profile</h1>
      </div>

      <div className="brutal-border bg-card p-5 md:p-6 space-y-4">
        <div>
          <div className="overline text-muted-foreground text-[10px] mb-1">Email</div>
          <div className="font-mono text-sm">{user?.email || '-'}</div>
        </div>
        <div>
          <div className="overline text-muted-foreground text-[10px] mb-1">User ID</div>
          <div className="font-mono text-xs break-all">{user?.id || '-'}</div>
        </div>
        <div>
          <div className="overline text-muted-foreground text-[10px] mb-1">Last Sign In</div>
          <div className="font-mono text-xs">
            {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '-'}
          </div>
        </div>
        <div>
          <div className="overline text-muted-foreground text-[10px] mb-1">Role</div>
          <div className="font-mono text-xs uppercase">Admin</div>
        </div>

        <div className="pt-3 border-t border-muted">
          <p className="text-sm text-muted-foreground mb-3">
            Extra admin accounts are created in Supabase Auth. This profile is your current session.
          </p>
          <Link href="/admin/settings" className="brutal-btn text-[10px] px-3 py-2">
            Site settings →
          </Link>
        </div>
      </div>
    </div>
  );
}
