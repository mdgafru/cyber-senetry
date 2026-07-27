import { NextResponse } from 'next/server';
import { toArticleDTO } from '@/lib/posts';
import { getPublicClient } from '@/lib/supabase/public';
import { getAdminClient } from '@/lib/supabase/admin';

export const revalidate = 30;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getPublicClient();

  const { data: post, error } = await db
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !post) {
    return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  }

  // Don't block response on view counter
  void (async () => {
    try {
      const admin = getAdminClient();
      await admin.from('posts').update({ views: (post.views || 0) + 1 }).eq('id', post.id);
    } catch {
      /* ignore */
    }
  })();

  return NextResponse.json(
    {
      article: {
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
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    }
  );
}
