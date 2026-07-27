-- Rename brand to cybersentry360 (run in Supabase SQL Editor if 001 already applied)

UPDATE settings
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(value, '{}'::jsonb),
      '{site_name}',
      '"cybersentry360"'
    ),
    '{author_name}',
    '"cybersentry360 Editorial"'
  ),
  '{site_url}',
  '"https://cybersentry360.com"'
),
updated_at = NOW()
WHERE key = 'automation';

UPDATE posts
SET author = 'cybersentry360 Editorial'
WHERE author IN ('SENTRY Editorial', 'SENTRY.io');
