import Script from 'next/script';

/** Alli AI SEO widget — loads on public pages (admin blocked via robots.txt). */
const ALLI_SITE_ID = 'site_z9tAYtTvkAbF8d1k';

export default function AlliAiScript() {
  return (
    <Script id="alli-ai-widget" strategy="beforeInteractive">
      {`
        /* Alli AI widget for www.cybersentry360.com */
        (function (w,d,s,o,f,js,fjs) {
          w['AlliJSWidget']=o;
          w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
          js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
          js.id=o;js.src=f;js.async=1;
          fjs.parentNode.insertBefore(js,fjs);
        }(window,document,'script','alli','https://static.alliai.com/widget/v1.js'));
        alli('init','${ALLI_SITE_ID}');
        alli('optimize','all');
      `}
    </Script>
  );
}
