'use client';
import { useState } from 'react';
import { Link2, Check, Share2, Linkedin, Facebook, Instagram } from 'lucide-react';
import { toast } from 'sonner';
import { getSiteUrl } from '@/lib/seo/site-url';
import { toOgImageUrl } from '@/lib/seo/share-image';

export default function ShareBar({ title, slug, image, compact = false }) {
  const [copied, setCopied] = useState(false);

  const articleUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/article/${slug}`
      : `${getSiteUrl()}/article/${slug}`;

  const encoded = encodeURIComponent(articleUrl);
  const thumb = toOgImageUrl(image);

  const copy = async (text = articleUrl, success = 'Link copied') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(success);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url: articleUrl });
        return;
      } catch {
        /* cancelled */
      }
    }
    copy();
  };

  const openShare = (href) => {
    window.open(href, '_blank', 'noopener,noreferrer,width=640,height=720');
  };

  const shareLinkedIn = () => {
    openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`);
  };

  const shareFacebook = () => {
    openShare(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`);
  };

  const shareInstagram = async () => {
    await copy(`${title}\n\n${articleUrl}`, 'Caption copied — paste in Instagram with the article image');
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  };

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={shareLinkedIn}
        className="share-btn share-btn-linkedin"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">LinkedIn</span>
      </button>
      <button
        type="button"
        onClick={shareFacebook}
        className="share-btn share-btn-facebook"
        aria-label="Share on Facebook"
      >
        <Facebook className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Facebook</span>
      </button>
      <button
        type="button"
        onClick={shareInstagram}
        className="share-btn share-btn-instagram"
        aria-label="Share on Instagram"
      >
        <Instagram className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instagram</span>
      </button>
      <button type="button" onClick={() => copy()} className="share-btn share-btn-copy" aria-label="Copy article link">
        {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <button type="button" onClick={nativeShare} className="share-btn share-btn-more" aria-label="More share options">
        <Share2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">More</span>
      </button>
    </div>
  );

  if (compact) return actions;

  return (
    <section className="share-highlight" data-testid="share-highlight">
      <div className="flex gap-3 min-w-0">
        <div className="hidden sm:block shrink-0 w-[132px] border-2 border-foreground overflow-hidden bg-muted">
          <img src={thumb} alt="" className="w-full h-[70px] object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="overline text-primary text-[9px] mb-1">Share this dispatch</div>
          <p className="font-heading font-black uppercase tracking-tight text-sm sm:text-base leading-tight line-clamp-2 mb-2.5">
            {title}
          </p>
          {actions}
        </div>
      </div>
    </section>
  );
}
