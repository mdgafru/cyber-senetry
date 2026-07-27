'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  LogOut, LayoutDashboard, Sparkles, FileText, Rss, Mail,
  Layers, Search, Zap, BarChart3, Settings, User, ScrollText,
  Menu, X, ExternalLink, ChevronRight,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, testid: 'sidebar-dashboard' },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, testid: 'sidebar-analytics' },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/articles', label: 'Posts', icon: FileText, testid: 'sidebar-articles' },
      { to: '/admin/generate', label: 'AI Generate', icon: Sparkles, testid: 'sidebar-generate' },
      { to: '/admin/seo', label: 'SEO & Geo', icon: Search, testid: 'sidebar-seo' },
    ],
  },
  {
    label: 'Automation',
    items: [
      { to: '/admin/automation', label: 'Automation', icon: Zap, testid: 'sidebar-automation' },
      { to: '/admin/services', label: 'Services', icon: Layers, testid: 'sidebar-services' },
      { to: '/admin/logs', label: 'Logs', icon: ScrollText, testid: 'sidebar-logs' },
    ],
  },
  {
    label: 'Audience',
    items: [
      { to: '/admin/feeds', label: 'News Feeds', icon: Rss, testid: 'sidebar-feeds' },
      { to: '/admin/newsletter', label: 'Newsletter', icon: Mail, testid: 'sidebar-newsletter' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: Settings, testid: 'sidebar-settings' },
      { to: '/admin/profile', label: 'Profile', icon: User, testid: 'sidebar-profile' },
    ],
  },
];

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/articles': 'Posts',
  '/admin/generate': 'AI Generate',
  '/admin/seo': 'SEO & Geo',
  '/admin/automation': 'Automation',
  '/admin/services': 'Services',
  '/admin/logs': 'Logs',
  '/admin/feeds': 'News Feeds',
  '/admin/newsletter': 'Newsletter',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Settings',
  '/admin/profile': 'Profile',
};

function isActive(pathname, item) {
  if (item.exact) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function SidebarNav({ pathname, onNavigate }) {
  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="px-3 mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-background/40">
            {group.label}
          </div>
          <ul className="space-y-0.5">
            {group.items.map((l) => {
              const active = isActive(pathname, l);
              return (
                <li key={l.to}>
                  <Link
                    href={l.to}
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors border-l-2 ${
                      active
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-transparent text-background/75 hover:bg-background/10 hover:text-background'
                    }`}
                    data-testid={l.testid}
                  >
                    <l.icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-primary' : 'text-background/50'}`} />
                    <span className="truncate">{l.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const pageTitle = useMemo(() => {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    const match = Object.keys(PAGE_TITLES)
      .filter((k) => k !== '/admin' && pathname.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    return PAGE_TITLES[match] || 'Admin';
  }, [pathname]);

  const doLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  const initials = (user?.email || 'A')[0].toUpperCase();

  const sidebar = (
    <div className="h-full flex flex-col bg-foreground text-background">
      <div className="h-14 px-4 border-b border-background/15 flex items-center justify-between shrink-0">
        <Link href="/admin" className="flex items-baseline gap-0.5" data-testid="admin-brand">
          <span className="font-heading font-black text-lg tracking-tighter">cybersentry</span>
          <span className="text-primary font-heading font-black text-lg">360</span>
        </Link>
        <span className="font-mono text-[8px] uppercase tracking-widest text-background/40 border border-background/20 px-1.5 py-0.5">
          CMS
        </span>
      </div>

      <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />

      <div className="p-3 border-t border-background/15 shrink-0 space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 border-2 border-primary bg-primary/20 flex items-center justify-center font-heading font-black text-sm text-primary shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-wider truncate">{user?.email || 'Admin'}</div>
            <div className="font-mono text-[9px] text-background/40 uppercase">Editor</div>
          </div>
        </div>
        <button
          onClick={doLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-background/25 font-mono text-[10px] uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
          data-testid="admin-logout"
        >
          <LogOut className="w-3 h-3" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/40 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-[240px] xl:w-[260px] shrink-0 border-r-2 border-foreground sticky top-0 h-screen flex-col z-30">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-[260px] max-w-[80vw] h-full border-r-2 border-foreground shadow-brutal relative z-10">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 border border-background/30 text-background hover:bg-background/10"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebar}
          </div>
          <button
            type="button"
            className="flex-1 bg-foreground/50"
            onClick={() => setMobileOpen(false)}
            aria-label="Close overlay"
          />
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top navbar */}
        <header className="sticky top-0 z-20 h-14 border-b-2 border-foreground bg-background flex items-center gap-3 px-3 md:px-5">
          <button
            type="button"
            className="lg:hidden p-2 border-2 border-foreground hover:bg-muted"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            data-testid="admin-menu-btn"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="overline text-muted-foreground hidden sm:inline">Admin</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground hidden sm:inline shrink-0" />
            <h1 className="font-heading font-black uppercase text-sm md:text-base tracking-tight truncate">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <Link
              href="/admin/generate"
              className="hidden md:inline-flex brutal-btn-primary text-[9px] px-3 py-1.5"
            >
              <Sparkles className="w-3 h-3" /> Generate
            </Link>
            <Link
              href="/"
              target="_blank"
              className="brutal-btn text-[9px] px-2.5 py-1.5"
              title="View live site"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Site</span>
            </Link>
            <div className="hidden sm:flex w-8 h-8 border-2 border-foreground items-center justify-center font-heading font-black text-xs bg-card">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
