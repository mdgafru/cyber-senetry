'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState([]);

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then(setCats);
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="border-b-2 border-foreground pb-6 mb-8">
        <div className="overline text-primary">Editorial Desks</div>
        <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter">Categories</h1>
        <p className="mt-2 font-serif italic text-lg text-muted-foreground">Categories map to your navbar desks. Managed via Services.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cats.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="brutal-border p-6 bg-card hover:shadow-brutal transition-all group">
            <div className="font-heading font-bold uppercase text-xl group-hover:text-primary">{c.name}</div>
            <div className="font-mono text-xs text-muted-foreground mt-2">{c.slug}</div>
            {c.blurb && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{c.blurb}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
