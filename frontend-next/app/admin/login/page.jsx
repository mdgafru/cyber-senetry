'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success('Welcome back.');
      router.push('/admin');
    } catch (err) {
      toast.error(err?.message || 'Login failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="hidden md:flex bg-foreground text-background flex-col justify-between p-10">
        <Link href="/" className="font-heading font-black text-3xl tracking-tighter" data-testid="login-brand">cybersentry<span className="text-primary">360</span></Link>
        <div>
          <div className="overline text-primary mb-6">Newsroom OS · v2.0</div>
          <h1 className="font-heading font-black uppercase text-5xl lg:text-7xl tracking-tighter leading-none">Sign the ledger.</h1>
          <p className="mt-6 font-serif italic text-xl text-background/80 max-w-md">Editorial access only. Every draft, publish, and generation is logged for accountability.</p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-background/50">Restricted · Editorial staff only</div>
      </div>
      <div className="flex items-center justify-center p-8 bg-background">
        <form onSubmit={submit} className="w-full max-w-md brutal-border p-8 bg-card" data-testid="login-form">
          <div className="overline text-primary mb-2">Sign in</div>
          <h2 className="font-heading font-black uppercase text-3xl tracking-tighter mb-8">Editor access</h2>
          <label className="block mb-4">
            <span className="overline block mb-2">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none"
              data-testid="login-email" />
          </label>
          <label className="block mb-6">
            <span className="overline block mb-2">Password</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none"
              data-testid="login-password" />
          </label>
          <button type="submit" disabled={busy} className="brutal-btn-primary w-full py-4" data-testid="login-submit">
            {busy ? 'Signing in…' : 'Sign in →'}
          </button>
          <Link href="/" className="mt-6 block text-center overline hover:text-primary" data-testid="login-back-home">← Back to site</Link>
        </form>
      </div>
    </div>
  );
}
