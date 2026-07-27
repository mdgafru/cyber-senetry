'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AdminLayout from '@/components/AdminLayout';

export default function AdminRootLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login';
  const isPreview = pathname?.startsWith('/admin/preview');

  useEffect(() => {
    if (loading) return;
    if (!user && !isLogin) router.replace('/admin/login');
    if (user && isLogin) router.replace('/admin');
  }, [user, loading, router, isLogin]);

  // Login / preview: no admin shell chrome
  if (isLogin || isPreview) {
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center font-mono text-sm">LOADING…</div>;
    }
    if (isPreview && !user) return null;
    return children;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-mono text-sm">LOADING…</div>;
  }

  if (!user) return null;

  return <AdminLayout>{children}</AdminLayout>;
}
