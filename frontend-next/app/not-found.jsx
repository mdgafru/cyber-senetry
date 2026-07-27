'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
      <div className="font-heading font-black uppercase text-5xl tracking-tighter mb-3">404</div>
      <p className="font-mono text-sm text-muted-foreground mb-6">Page not found.</p>
      <Link href="/" className="brutal-btn-primary text-[10px] px-4 py-2">
        ← Back home
      </Link>
    </div>
  );
}
