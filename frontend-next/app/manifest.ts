import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo/site-url';

export default function manifest(): MetadataRoute.Manifest {
  const siteUrl = getSiteUrl();

  return {
    name: 'cybersentry360',
    short_name: 'CS360',
    description: 'Rigorous reporting on AI and cybersecurity for enterprise technology leaders.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F5F0',
    theme_color: '#E63946',
    icons: [
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    id: siteUrl,
  };
}
