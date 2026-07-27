-- Fix newsletter RLS + unsubscribe support
-- Run this entire file in Supabase SQL Editor

-- Status for subscribe / unsubscribe
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'subscribed'
    CHECK (status IN ('subscribed', 'unsubscribed'));

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- Existing rows are subscribed
UPDATE newsletter_subscribers
SET status = 'subscribed'
WHERE status IS NULL OR status = '';

CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);

-- RLS policies
DROP POLICY IF EXISTS "Public subscribe newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public insert newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public update newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admin read newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admin all newsletter" ON newsletter_subscribers;

CREATE POLICY "Public insert newsletter"
  ON newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Upsert + unsubscribe need UPDATE
CREATE POLICY "Public update newsletter"
  ON newsletter_subscribers
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Public can check own subscription status by email (SELECT for status lookup)
CREATE POLICY "Public select newsletter"
  ON newsletter_subscribers
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin all newsletter"
  ON newsletter_subscribers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Explicit admin DELETE (also covered by Admin all above)
DROP POLICY IF EXISTS "Admin delete newsletter" ON newsletter_subscribers;
CREATE POLICY "Admin delete newsletter"
  ON newsletter_subscribers
  FOR DELETE
  TO authenticated
  USING (true);
