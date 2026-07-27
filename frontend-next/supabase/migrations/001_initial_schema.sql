-- cybersentry360 AI Content Automation System
-- Run this in Supabase SQL Editor or via supabase db push

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Services (editorial desks / content categories) ───
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  blurb TEXT,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Posts ───
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  excerpt TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'failed')),
  category TEXT,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  featured_image TEXT,
  featured_prompt TEXT,
  seo_title TEXT,
  meta_title TEXT,
  meta_description TEXT,
  canonical TEXT,
  focus_keyword TEXT,
  keywords TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  schema JSONB DEFAULT '{}',
  faq JSONB DEFAULT '[]',
  reading_time INTEGER DEFAULT 5,
  author TEXT DEFAULT 'cybersentry360 Editorial',
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  og_title TEXT,
  og_description TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  geo_data JSONB DEFAULT '{}',
  robots TEXT DEFAULT 'index, follow',
  views INTEGER DEFAULT 0,
  ai_generated BOOLEAN DEFAULT false,
  table_of_contents JSONB DEFAULT '[]',
  internal_links JSONB DEFAULT '[]',
  external_links JSONB DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_service_id ON posts(service_id);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_posts_keywords ON posts USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(subtitle, '') || ' ' || coalesce(content, ''))
);

-- ─── SEO (extended metadata per post) ───
CREATE TABLE IF NOT EXISTS seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  image_alt TEXT,
  image_caption TEXT,
  image_title TEXT,
  image_description TEXT,
  image_filename TEXT,
  image_webp_filename TEXT,
  breadcrumb_schema JSONB DEFAULT '{}',
  article_schema JSONB DEFAULT '{}',
  faq_schema JSONB DEFAULT '{}',
  local_keywords TEXT[] DEFAULT '{}',
  near_me_keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Media ───
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  title TEXT,
  description TEXT,
  filename TEXT,
  webp_filename TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── User profiles (extends Supabase Auth) ───
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer')),
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Settings (key-value automation config) ───
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Publish queue ───
CREATE TABLE IF NOT EXISTS publish_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- ─── Cron logs ───
CREATE TABLE IF NOT EXISTS cron_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL DEFAULT 'daily_generate',
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed', 'retry')),
  message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Generation logs ───
CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed', 'retry')),
  topic TEXT,
  error TEXT,
  tokens_used INTEGER,
  duration_ms INTEGER,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Prompt history (never repeat topics) ───
CREATE TABLE IF NOT EXISTS prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  angle TEXT,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_prompt_history_service ON prompt_history(service_id);

-- ─── Newsletter ───
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- ─── Seed services (editorial desks) ───
INSERT INTO services (name, slug, description, enabled, priority) VALUES
  ('AI', 'ai', 'Artificial intelligence, machine learning, and generative AI for enterprise security teams.', true, 1),
  ('Cybersecurity', 'cybersecurity', 'Core cybersecurity practices, frameworks, and defense strategies.', true, 2),
  ('Threats', 'threats', 'Threat intelligence, attack vectors, and emerging adversary tactics.', true, 3),
  ('Policy', 'policy', 'Regulation, compliance, privacy law, and governance for security leaders.', true, 4),
  ('Cloud', 'cloud', 'Cloud security architecture, CSPM, and multi-cloud risk management.', true, 5),
  ('Data', 'data', 'Data protection, encryption, DLP, and privacy engineering.', true, 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, blurb, service_id)
SELECT s.name, s.slug, s.description, s.id FROM services s
ON CONFLICT (slug) DO NOTHING;

-- ─── Default automation settings ───
INSERT INTO settings (key, value) VALUES
  ('automation', '{
    "enabled": true,
    "daily_time": "06:00",
    "articles_per_day": 1,
    "ai_model": "claude-sonnet-4-5-20250929",
    "temperature": 0.85,
    "max_tokens": 16000,
    "retry_count": 3,
    "publishing_delay_minutes": 0,
    "prompt_template": "default",
    "site_url": "https://cybersentry360.com",
    "site_name": "cybersentry360",
    "author_name": "cybersentry360 Editorial",
    "geo": {
      "country": "United States",
      "state": "California",
      "city": "San Francisco",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "region": "US-CA",
      "business_area": "Bay Area & nationwide"
    }
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ─── RLS Policies ───
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo ENABLE ROW LEVEL SECURITY;

-- Public read for published posts
CREATE POLICY "Public read published posts" ON posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public read services" ON services FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);

-- Authenticated admin full access
CREATE POLICY "Admin all posts" ON posts FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin all services" ON services FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin all categories" ON categories FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin all settings" ON settings FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin all logs" ON cron_logs FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin all gen logs" ON generation_logs FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin all prompt history" ON prompt_history FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin all publish queue" ON publish_queue FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin all media" ON media FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin all seo" ON seo FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin all users" ON users FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public insert newsletter" ON newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public update newsletter" ON newsletter_subscribers
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public select newsletter" ON newsletter_subscribers
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin all newsletter" ON newsletter_subscribers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, display_name)
  VALUES (NEW.id, NEW.email, 'admin', split_part(NEW.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Service role bypass (used by API routes with service key)
-- Note: service role key bypasses RLS automatically
