import { getPublicClient } from '@/lib/supabase/public';
import { getAdminClient } from '@/lib/supabase/admin';
import { toArticleDTO } from '@/lib/posts';

export type PublicArticle = ReturnType<typeof toArticleDTO> & {
  schema?: Record<string, unknown> | null;
  faq?: { question: string; answer: string }[];
  geo_data?: unknown;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  table_of_contents?: { id: string; title: string; level: number }[];
};

export async function getPublishedArticleBySlug(slug: string): Promise<PublicArticle | null> {
  try {
    const db = getPublicClient();
    const { data: post, error } = await db
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !post) return null;

    return {
      ...toArticleDTO(post),
      schema: post.schema,
      faq: post.faq,
      geo_data: post.geo_data,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      canonical: post.canonical,
      og_title: post.og_title,
      og_description: post.og_description,
      table_of_contents: post.table_of_contents,
    };
  } catch {
    return null;
  }
}

export async function getPublishedSlugs(): Promise<string[]> {
  try {
    const db = getPublicClient();
    const { data } = await db.from('posts').select('slug').eq('status', 'published');
    return (data || []).map((row) => row.slug as string);
  } catch {
    return [];
  }
}

export function incrementArticleViews(postId: string, currentViews = 0): void {
  void (async () => {
    try {
      const admin = getAdminClient();
      await admin.from('posts').update({ views: currentViews + 1 }).eq('id', postId);
    } catch {
      /* ignore */
    }
  })();
}
