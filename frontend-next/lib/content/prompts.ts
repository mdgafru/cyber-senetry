import type { AutomationSettings, Service } from './types';

export function buildSystemPrompt(settings: AutomationSettings): string {
  return `You are a senior editorial writer for ${settings.site_name}, a respected AI and cybersecurity publication read by CISOs, security engineers, and technology policy leaders.

Write with the voice of an experienced industry journalist - conversational yet authoritative. You have spent 15+ years covering enterprise security, threat intelligence, and AI governance.

STRICT RULES:
- Write 100% original content. Never copy or closely paraphrase existing articles.
- Minimum 1800 words, target 2000-2500 words in the content field (markdown).
- Sound human: vary sentence length, use occasional contractions, include specific examples and real-world scenarios.
- No keyword stuffing. Use focus keyword naturally 3-5 times.
- Follow Google Helpful Content and E-E-A-T guidelines.
- Include Experience (first-hand practitioner insights), Expertise (technical depth), Authority (cite frameworks/standards), Trust (acknowledge trade-offs and limitations).
- Never use phrases like "In today's digital landscape", "In conclusion", "It's important to note", "delve", "leverage", "utilize", "comprehensive guide", "game-changer", "robust", "cutting-edge".
- Use ASCII hyphen (-) with spaces for breaks in titles/subtitles (e.g. "topic - detail"). Never use em dash (—) or en dash (–).
- Write as if you've interviewed practitioners and reviewed primary sources.
- Include a "## What to Watch" section near the end with 3-4 forward-looking bullet points.

MARKDOWN & FORMATTING:
- Write 100% original prose. Never copy text from other publications, press releases, or vendor blogs.
- Use **double asterisks** sparingly for bold (max 2-3 times per section).
- Never wrap example prompts or quotes in asterisks. Write: "Summarize our pricing strategy..." not *"Summarize our pricing strategy..."*.
- Do not leave stray * characters anywhere in titles, headings, FAQs, or body text.
- Headings must be plain text without markdown symbols.

VERIFIED DATA ONLY:
- Do NOT invent statistics, dollar amounts, CVE IDs, company breach figures, survey percentages, or dates you cannot support.
- Prefer qualitative practitioner guidance over fake numbers. If you mention a figure, keep it clearly framed as industry-typical / illustrative — never as a cited fact unless it is a well-known public standard (e.g. NIST, ISO 27001 names).
- Do NOT fabricate quotes, interviews, or named sources.
- Do NOT invent product version numbers or vendor roadmaps.

SEO FIELD LENGTH LIMITS (HARD — count characters carefully):
- title: 50-70 characters (never over 70)
- subtitle: 80-120 characters (never over 120)
- seo_title / meta_title / og_title / twitter_title: 50-60 characters (NEVER over 60)
- meta_description / excerpt / og_description / twitter_description: 140-160 characters (NEVER over 160, never under 120 if provided)
- If a field would exceed the max, rewrite shorter — do not truncate mid-word in the JSON value.

Return ONLY valid JSON matching the schema. No markdown fences, no preamble.`;
}

export function buildArticlePrompt(params: {
  service: Service;
  topic: string;
  usedTopics: string[];
  settings: AutomationSettings;
  internalLinkTargets: { name: string; slug: string; type: string }[];
}): string {
  const { service, topic, usedTopics, settings, internalLinkTargets } = params;

  const linksGuide = internalLinkTargets.length
    ? `\nINTERNAL LINKING - weave 4-6 natural markdown links to these pages:\n${internalLinkTargets.map((l) => `- [${l.name}](/${l.type}/${l.slug})`).join('\n')}`
    : '';

  const avoidTopics = usedTopics.length
    ? `\nNEVER repeat or closely overlap these previously covered topics for ${service.name}:\n${usedTopics.slice(-30).map((t) => `- ${t}`).join('\n')}`
    : '';

  const geo = settings.geo;

  return `Generate a complete SEO-optimized editorial article for the "${service.name}" desk.

TOPIC (unique angle): ${topic}
SERVICE/CATEGORY: ${service.name} (${service.slug})
SITE: ${settings.site_name}
AUTHOR: ${settings.author_name}
${avoidTopics}
${linksGuide}

LOCAL SEO CONTEXT:
- Country: ${geo.country || 'United States'}
- State: ${geo.state || 'California'}
- City: ${geo.city || 'San Francisco'}
- Region: ${geo.region || 'US-CA'}
- Business area: ${geo.business_area || 'Nationwide'}

Return this exact JSON structure (HARD character caps — over-limit values will be rejected):
{
  "title": "H1 title 50-70 chars MAX 70",
  "subtitle": "Dek 80-120 chars MAX 120",
  "topic": "${topic}",
  "content": "Full markdown article with: # H1 at top, ## Table of Contents, multiple ## H2 and ### H3 sections, bullet lists, a comparison table (markdown), Benefits section, Common Mistakes section, Expert Tips section, ## FAQs (5-7 Q&As as ### headings), ## What to Watch, ## Conclusion with CTA linking to /contact or relevant service page. Minimum 1800 words. No fabricated statistics.",
  "excerpt": "EXACTLY 140-160 chars",
  "focus_keyword": "primary SEO keyword",
  "keywords": ["5-8 secondary keywords"],
  "tags": ["4-6 editorial tags"],
  "faq": [{"question": "...", "answer": "..."}],
  "table_of_contents": [{"id": "section-slug", "title": "Section Title", "level": 2}],
  "featured_image_prompt": "Detailed prompt for editorial hero image",
  "image_alt": "SEO alt text for featured image MAX 125 chars",
  "image_caption": "Photo caption",
  "seo_title": "MAX 60 chars",
  "meta_title": "MAX 60 chars",
  "meta_description": "EXACTLY 140-160 chars",
  "og_title": "MAX 60 chars",
  "og_description": "EXACTLY 140-160 chars",
  "twitter_title": "MAX 60 chars",
  "twitter_description": "EXACTLY 140-160 chars",
  "local_keywords": ["3-5 geo-targeted keywords"],
  "near_me_keywords": ["2-3 near-me style keywords"]
}`;
}

export function buildTopicPrompt(service: Service, usedTopics: string[]): string {
  const avoid = usedTopics.length
    ? `Previously covered topics (DO NOT repeat):\n${usedTopics.map((t) => `- ${t}`).join('\n')}\n\n`
    : '';

  return `${avoid}Generate ONE unique, specific, timely article topic for the "${service.name}" editorial desk at a cybersecurity & AI publication.

The topic must be:
- Specific enough for a 2000+ word deep dive (not generic like "What is cybersecurity")
- Relevant to ${service.description || service.name}
- Fresh - never overlap with previous topics
- Interesting to CISOs and senior security engineers
- Timely for ${new Date().getFullYear()}

Return ONLY JSON: {"topic": "Your specific topic title", "angle": "One sentence describing the unique editorial angle"}`;
}

export function buildManualGeneratePrompt(params: {
  topic: string;
  keywords: string[];
  category: string;
  length: string;
}): string {
  const wordTarget = params.length === 'brief' ? '600-900' : params.length === 'deep' ? '1800-2500' : '900-1400';

  return `Write an original editorial article for category "${params.category}".

Topic: ${params.topic}
Keywords: ${params.keywords.join(', ') || 'none specified'}
Target length: ${wordTarget} words

Return JSON (HARD length caps):
{
  "title": "MAX 70 chars",
  "subtitle": "MAX 120 chars",
  "topic": "${params.topic}",
  "content": "markdown body — no fabricated statistics or fake citations",
  "excerpt": "140-160 chars",
  "focus_keyword": "...",
  "keywords": [...],
  "tags": [...],
  "faq": [{"question":"...","answer":"..."}],
  "table_of_contents": [],
  "featured_image_prompt": "...",
  "image_alt": "MAX 125 chars",
  "image_caption": "...",
  "seo_title": "MAX 60 chars",
  "meta_title": "MAX 60 chars",
  "meta_description": "140-160 chars",
  "og_title": "MAX 60 chars",
  "og_description": "140-160 chars",
  "twitter_title": "MAX 60 chars",
  "twitter_description": "140-160 chars",
  "local_keywords": [],
  "near_me_keywords": []
}`;
}

export type ManualMetadataInput = {
  topic: string;
  category: string;
  length: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  focus_keyword?: string;
  keywords?: string[];
  tags?: string[];
  seo_title?: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  twitter_title?: string;
  twitter_description?: string;
};

export function buildManualMetadataGeneratePrompt(params: ManualMetadataInput): string {
  const wordTarget = params.length === 'brief' ? '600-900' : params.length === 'deep' ? '1800-2500' : '900-1400';

  return `Write the article BODY only for "${params.category}" desk. All titles and SEO metadata are already set by the editor — do NOT invent new titles or meta fields.

FIXED METADATA (use exactly in content, do not change):
- Topic: ${params.topic}
- Title (H1): ${params.title}
- Subtitle: ${params.subtitle || '(none)'}
- Focus keyword: ${params.focus_keyword || '(none)'}
- Keywords: ${params.keywords?.join(', ') || '(none)'}
- Tags: ${params.tags?.join(', ') || '(none)'}
- SEO title: ${params.seo_title || params.title}
- Meta description: ${params.meta_description || '(none)'}

REQUIREMENTS:
- Target length: ${wordTarget} words in markdown
- Start content with # ${params.title} then ## Table of Contents
- Include multiple ## H2 / ### H3 sections, lists, a comparison table, Benefits, Common Mistakes, Expert Tips, ## FAQs (5-7), ## What to Watch, ## Conclusion
- Match the editorial angle implied by the title and topic
- Use focus keyword naturally 3-5 times if provided
- VERIFIED DATA ONLY: no invented stats, CVE IDs, dollar figures, survey %, fake quotes, or unsourced claims
- If excerpt was provided above, keep it close; otherwise return excerpt 140-160 chars

Return ONLY this JSON (no title/seo fields — editor already set those):
{
  "topic": "${params.topic.replace(/"/g, '\\"')}",
  "content": "full markdown article body",
  "excerpt": "140-160 char excerpt${params.excerpt ? ` (prefer: ${params.excerpt.replace(/"/g, '\\"').slice(0, 160)})` : ''}",
  "faq": [{"question":"...","answer":"..."}],
  "table_of_contents": [{"id":"section-slug","title":"Section Title","level":2}],
  "featured_image_prompt": "hero image prompt",
  "image_alt": "SEO alt text MAX 125",
  "image_caption": "caption"
}`;
}
