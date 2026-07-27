import './globals.css';
import { Toaster } from 'sonner';
import Providers from '@/components/Providers';
import { getSiteUrl } from '@/lib/seo/site-url';

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'cybersentry360 - AI & Cybersecurity Editorial',
    template: '%s | cybersentry360',
  },
  description: 'Rigorous reporting on AI and cybersecurity for enterprise technology leaders.',
  applicationName: 'cybersentry360',
  keywords: ['cybersecurity', 'AI security', 'threat intelligence', 'enterprise security', 'cybersentry360'],
  authors: [{ name: 'cybersentry360 Editorial' }],
  creator: 'cybersentry360',
  publisher: 'cybersentry360',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'cybersentry360',
    title: 'cybersentry360 - AI & Cybersecurity Editorial',
    description: 'Rigorous reporting on AI and cybersecurity for enterprise technology leaders.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'cybersentry360',
    description: 'Rigorous reporting on AI and cybersecurity for enterprise technology leaders.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/manifest.webmanifest',
  verification: {
    google: 'googlee92e0cf8261b500f',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chivo:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { border: '2px solid #0A0A0A', borderRadius: 0, fontFamily: 'JetBrains Mono, monospace' },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
