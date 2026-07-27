-- Fix retired Anthropic model ID stored in automation settings
UPDATE settings
SET value = jsonb_set(
  COALESCE(value, '{}'::jsonb),
  '{ai_model}',
  '"claude-sonnet-4-5-20250929"'
),
updated_at = NOW()
WHERE key = 'automation'
  AND (
    value->>'ai_model' IS NULL
    OR value->>'ai_model' IN (
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022'
    )
  );
