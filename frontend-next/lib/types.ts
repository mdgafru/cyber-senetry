export type PostStatus = 'draft' | 'published' | 'scheduled' | 'failed';

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  enabled: boolean;
  priority: number;
  last_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  blurb: string | null;
  service_id: string | null;
}

export interface Post {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  content: string;
  excerpt: string | null;
  status: PostStatus;
  category: string | null;
  service_id: string | null;
  featured_image: string | null;
  featured_prompt: string | null;
  seo_title: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical: string | null;
  focus_keyword: string | null;
  keywords: string[];
  tags: string[];
  schema: Record<string, unknown>;
  faq: FAQItem[];
  reading_time: number;
  author: string;
  published_at: string | null;
  updated_at: string;
  created_at: string;
  og_title: string | null;
  og_description: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  geo_data: GeoData;
  robots: string;
  views: number;
  ai_generated: boolean;
  table_of_contents: TOCItem[];
  internal_links: InternalLink[];
  external_links: ExternalLink[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface TOCItem {
  id: string;
  title: string;
  level: number;
}

export interface InternalLink {
  text: string;
  href: string;
}

export interface ExternalLink {
  text: string;
  href: string;
}

export interface GeoData {
  country?: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  region?: string;
  business_area?: string;
  local_keywords?: string[];
  near_me_keywords?: string[];
}

export interface AutomationSettings {
  enabled: boolean;
  daily_time: string;
  articles_per_day: number;
  ai_model: string;
  temperature: number;
  max_tokens: number;
  retry_count: number;
  publishing_delay_minutes: number;
  prompt_template: string;
  site_url: string;
  site_name: string;
  author_name: string;
  geo: GeoData;
}

export interface GeneratedArticle {
  title: string;
  subtitle: string;
  topic: string;
  content: string;
  excerpt: string;
  focus_keyword: string;
  keywords: string[];
  tags: string[];
  faq: FAQItem[];
  table_of_contents: TOCItem[];
  featured_image_prompt: string;
  image_alt: string;
  image_caption: string;
  seo_title: string;
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  twitter_title: string;
  twitter_description: string;
  local_keywords: string[];
  near_me_keywords: string[];
}

/** Frontend-compatible article shape (legacy API contract) */
export interface ArticleDTO {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  body: string;
  category: string;
  tags: string[];
  keywords: string[];
  hero_image?: string | null;
  author: string;
  status: PostStatus;
  seo_title?: string | null;
  meta_title?: string | null;
  seo_description?: string | null;
  excerpt?: string | null;
  focus_keyword?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  reading_time: number;
  views: number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  ai_generated?: boolean;
}
