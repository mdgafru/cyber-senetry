'use client';
import { useState } from 'react';
import { Link2, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareBar({ title, slug }) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? `${window.location.origin}/article/${slug}` : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url || window.location.href);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: url || window.location.href });
      } catch {
        /* cancelled */
      }
    } else {
      copy();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" onClick={share} className="brutal-btn text-[9px] px-2.5 py-1.5">
        <Share2 className="w-3 h-3" /> Share
      </button>
      <button type="button" onClick={copy} className="brutal-btn text-[9px] px-2.5 py-1.5">
        {copied ? <Check className="w-3 h-3 text-primary" /> : <Link2 className="w-3 h-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
