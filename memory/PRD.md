# SENTRY.io — Product Requirements Document

## Original Problem Statement
Design an AI & Cybersecurity publisher platform with keyword-based content, self-updating with latest news/trends via Claude, professional editorial voice, full SEO optimisation. Reference cadence: InformationWeek + Cybersecurity Dive. All content must be original, plagiarism-free.

## Architecture
- **Backend**: FastAPI + MongoDB + Motor (async), JWT auth (bcrypt), Claude Sonnet 4.6 via emergentintegrations (streaming SSE), feedparser for RSS wire.
- **Frontend**: React 19 + React Router + Tailwind (Swiss Brutalist design system) + shadcn/ui + sonner.
- **Design**: `/app/design_guidelines.json` — Chivo (heads) / Cormorant Garamond (features) / IBM Plex Sans (body) / JetBrains Mono (utility). Signal red `#E63946` accent, bone `#F4F4F0` background, hard 2px black borders.

## User Personas
1. **Reader** (CISO / engineer / policy analyst) — consumes editorial content, subscribes to newsletter.
2. **Editor** — authenticates to admin, drafts / reviews / publishes articles, triggers AI generation.

## Core Requirements (implemented)
- Homepage with hero + secondary grid + trending topics + latest + most-read
- Article detail page with SEO title/desc + JSON-LD schema + related sidebar
- Category & tag landing pages (keyword-driven)
- Full-text search
- Newsletter subscribe (email capture)
- Admin: JWT login, dashboard, AI generation (SSE streaming Claude), CRUD editor, RSS wire aggregation, subscriber list w/ CSV export
- `/api/sitemap.xml` + `/api/robots.txt`
- Seeded admin (`admin@sentry.io` / `SentryAdmin2026!`) + 3 sample articles

## Implemented (2026-02-07)
- All P0 above
- Claude Sonnet 4.6 streaming article generator returning strict JSON with title/subtitle/seo/tags/markdown body
- 8 seed RSS feeds (Krebs, Dark Reading, Anthropic, Hacker News, BleepingComputer, Ars, Schneier, Google AI)

## Backlog / P1
- Scheduled cron for auto-drafting daily briefs by keyword (currently manual trigger)
- OG image auto-generation per article
- Email delivery for newsletter (Resend/SendGrid) — currently email capture only
- Analytics dashboard (top articles by view, referrer)
- Comments / discussion threading

## P2
- Multi-editor roles + review workflow
- AI SEO audit on every publish
- Related-article ML instead of same-category
