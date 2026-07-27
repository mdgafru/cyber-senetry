# cyber-sentry360

**cybersentry360** — editorial intelligence for the AI & cybersecurity era.

Swiss-brutalist public site + newsroom CMS, powered by Next.js, Supabase, and Claude.

## App

Primary codebase: [`frontend-next/`](./frontend-next)

- Public desks: AI · Cyber · Threats · Policy · Cloud · Data
- Article pages with TOC, FAQ, SEO/OG meta
- Admin newsroom: AI draft, manual generate, publish, newsletter, automation
- Newsletter subscribe / unsubscribe
- Vercel-ready (`vercel.json` cron for daily generate)

## Quick start

```bash
cd frontend-next
cp .env.example .env.local
# fill Supabase + Anthropic keys
npm install
npm run dev
```

See `frontend-next/.env.example` for required environment variables.

## Deploy

- Host on **Vercel**
- Root Directory: `frontend-next`
- Apply SQL migrations in `frontend-next/supabase/migrations/` on your Supabase project
# cyber-senetry
