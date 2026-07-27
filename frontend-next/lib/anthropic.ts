import Anthropic from '@anthropic-ai/sdk';
import type { GeneratedArticle } from './types';
import { sanitizeSeoFields } from './content/meta';

/** Working Anthropic model — older IDs return 404 */
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929';

const RETIRED_MODELS = new Set([
  'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
]);

export function resolveAnthropicModel(requested?: string | null): string {
  const envModel = process.env.ANTHROPIC_MODEL?.trim();
  const pick = (requested || envModel || DEFAULT_ANTHROPIC_MODEL).trim();
  if (RETIRED_MODELS.has(pick)) {
    return envModel && !RETIRED_MODELS.has(envModel) ? envModel : DEFAULT_ANTHROPIC_MODEL;
  }
  return pick || DEFAULT_ANTHROPIC_MODEL;
}

let client: Anthropic | null = null;

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('Missing ANTHROPIC_API_KEY');
  if (!client) client = new Anthropic({ apiKey: key });
  return client;
}

export async function generateWithClaude(params: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ text: string; tokensUsed: number }> {
  const anthropic = getClient();
  const model = resolveAnthropicModel(params.model);

  const response = await anthropic.messages.create({
    model,
    max_tokens: params.maxTokens || 16000,
    temperature: params.temperature ?? 0.85,
    system: params.system,
    messages: [{ role: 'user', content: params.user }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('');

  const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  return { text, tokensUsed };
}

export async function* streamWithClaude(params: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): AsyncGenerator<string, { tokensUsed: number }, unknown> {
  const anthropic = getClient();
  const model = resolveAnthropicModel(params.model);

  const stream = anthropic.messages.stream({
    model,
    max_tokens: params.maxTokens || 16000,
    temperature: params.temperature ?? 0.85,
    system: params.system,
    messages: [{ role: 'user', content: params.user }],
  });

  let tokensUsed = 0;

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
    if (event.type === 'message_delta' && event.usage) {
      tokensUsed = event.usage.output_tokens || tokensUsed;
    }
  }

  const final = await stream.finalMessage();
  tokensUsed = (final.usage?.input_tokens || 0) + (final.usage?.output_tokens || 0);

  return { tokensUsed };
}

export function parseGeneratedJSON(raw: string): GeneratedArticle {
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in AI response');
  cleaned = cleaned.slice(start, end + 1);

  const parsed = JSON.parse(cleaned) as GeneratedArticle;

  if (!parsed.title || !parsed.content) {
    throw new Error('Generated article missing required fields (title, content)');
  }

  // Length-safe SEO only — never save oversized / empty garbage meta
  const seo = sanitizeSeoFields({
    title: parsed.title,
    subtitle: parsed.subtitle,
    excerpt: parsed.excerpt,
    focus_keyword: parsed.focus_keyword,
    seo_title: parsed.seo_title,
    meta_title: parsed.meta_title,
    meta_description: parsed.meta_description,
    og_title: parsed.og_title,
    og_description: parsed.og_description,
    twitter_title: parsed.twitter_title,
    twitter_description: parsed.twitter_description,
    keywords: parsed.keywords,
    tags: parsed.tags,
  });

  return {
    ...parsed,
    ...seo,
    content: parsed.content,
    faq: Array.isArray(parsed.faq) ? parsed.faq : [],
    table_of_contents: Array.isArray(parsed.table_of_contents) ? parsed.table_of_contents : [],
    local_keywords: Array.isArray(parsed.local_keywords) ? parsed.local_keywords.slice(0, 5) : [],
    near_me_keywords: Array.isArray(parsed.near_me_keywords) ? parsed.near_me_keywords.slice(0, 3) : [],
  };
}
