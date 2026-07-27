import type { Post, AutomationSettings, FAQItem, GeoData } from '../types';

export function buildArticleSchema(post: Post, settings: AutomationSettings) {
  const url = `${settings.site_url}/article/${post.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    image: post.featured_image ? [post.featured_image] : [],
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: settings.site_name,
      logo: {
        '@type': 'ImageObject',
        url: `${settings.site_url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    keywords: [post.focus_keyword, ...(post.keywords || [])].filter(Boolean).join(', '),
    articleSection: post.category,
    wordCount: post.content.split(/\s+/).length,
  };
}

export function buildBreadcrumbSchema(post: Post, settings: AutomationSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: settings.site_url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: post.category,
        item: `${settings.site_url}/category/${post.category}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${settings.site_url}/article/${post.slug}`,
      },
    ],
  };
}

export function buildFAQSchema(faq: FAQItem[]) {
  if (!faq?.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildCombinedSchema(post: Post, settings: AutomationSettings) {
  const schemas = [
    buildArticleSchema(post, settings),
    buildBreadcrumbSchema(post, settings),
  ];

  const faqSchema = buildFAQSchema(post.faq);
  if (faqSchema) schemas.push(faqSchema);

  return schemas;
}

export function buildGeoMeta(geo: GeoData) {
  return {
    'geo.region': geo.region || '',
    'geo.placename': geo.city || '',
    'geo.position': geo.latitude && geo.longitude ? `${geo.latitude};${geo.longitude}` : '',
    ICBM: geo.latitude && geo.longitude ? `${geo.latitude}, ${geo.longitude}` : '',
    'business:contact_data:locality': geo.city || '',
    'business:contact_data:region': geo.state || '',
    'business:contact_data:country_name': geo.country || '',
  };
}

export function imageFilename(slug: string): string {
  return `${slug}-featured.jpg`;
}

export function webpFilename(slug: string): string {
  return `${slug}-featured.webp`;
}
