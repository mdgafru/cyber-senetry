import { notFound } from 'next/navigation';
import ArticlePageClient from '@/components/article/ArticlePageClient';
import {
  getPublishedArticleBySlug,
  getPublishedSlugs,
  incrementArticleViews,
} from '@/lib/posts/public-article';
import { getSiteUrl } from '@/lib/seo/site-url';
import { ogImageMeta } from '@/lib/seo/share-image';

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const slugs = await getPublishedSlugs();
    // Pre-render recent articles at build; rest via ISR on first visit (faster deploys).
    return slugs.slice(0, 12).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return {};

  const title = article.meta_title || article.seo_title || article.title;
  const description =
    article.meta_description || article.seo_description || article.excerpt || article.subtitle || '';
  const url = `${getSiteUrl()}/article/${article.slug}`;
  const image = ogImageMeta(article.hero_image, article.title);

  return {
    title,
    description,
    alternates: {
      canonical: article.canonical || url,
    },
    openGraph: {
      type: 'article',
      siteName: 'cybersentry360',
      locale: 'en_US',
      title: article.og_title || title,
      description: article.og_description || description,
      url,
      publishedTime: article.published_at || undefined,
      modifiedTime: article.updated_at || undefined,
      authors: [article.author],
      section: article.category || undefined,
      tags: article.tags,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.twitter_title || article.og_title || title,
      description: article.twitter_description || article.og_description || description,
      images: [image.url],
    },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  incrementArticleViews(article.id, article.views || 0);

  const jsonLd = article.schema && typeof article.schema === 'object' ? article.schema : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <ArticlePageClient article={article} />
    </>
  );
}
