import { notFound } from 'next/navigation';
import ArticlePageClient from '@/components/article/ArticlePageClient';
import {
  getPublishedArticleBySlug,
  getPublishedSlugs,
  incrementArticleViews,
} from '@/lib/posts/public-article';
import { getSiteUrl } from '@/lib/seo/site-url';

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return {};

  const title = article.meta_title || article.seo_title || article.title;
  const description =
    article.meta_description || article.seo_description || article.excerpt || article.subtitle || '';
  const url = `${getSiteUrl()}/article/${article.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: article.canonical || url,
    },
    openGraph: {
      type: 'article',
      title: article.og_title || title,
      description: article.og_description || description,
      url,
      publishedTime: article.published_at || undefined,
      modifiedTime: article.updated_at || undefined,
      authors: [article.author],
      section: article.category || undefined,
      tags: article.tags,
      images: article.hero_image
        ? [{ url: article.hero_image, alt: article.title }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.twitter_title || article.og_title || title,
      description: article.twitter_description || article.og_description || description,
      images: article.hero_image ? [article.hero_image] : undefined,
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
