# AI Info Hub

> Aggregate high-quality AI information from multiple sources　[中文](README.md)

## Overview

AI Info Hub aggregates AI-related updates from HackerNews, GitHub Trending, RSS feeds, and custom scraping sources, then presents them in a single web UI. The project has two main parts:

- `fetcher` collects, normalizes, and aggregates source data
- `web` reads the aggregated data on the server and renders the UI with Next.js App Router

Local development reads from `fetcher/data/index.json`. Preview and production deployments on Vercel read the aggregated payload from Blob storage.

## Project Structure

```
ai-info/
├── web/          # Next.js frontend
├── fetcher/      # Data fetching service
├── shared/       # Shared type definitions
└── e2e/          # End-to-end tests
```

### web — Frontend

| Path | Description |
|------|-------------|
| `app/page.tsx` | Homepage, articles grouped by time period |
| `app/api/sources/route.ts` | API route that returns the current aggregated payload |
| `lib/source-data.ts` | Unified loader for local JSON and Vercel Blob data |
| `components/ArticleCard.tsx` | Individual article card |
| `components/TimeGroupSourceCard.tsx` | Time-grouped source card view |
| `utils/timeUtils.ts` | Time period detection utilities |
| `utils/articleDate.ts` | Article date display helpers, preferring source publish text |

### fetcher — Scraping Service

| Path | Description |
|------|-------------|
| `src/core/fetcher.ts` | Concurrent scraping scheduler (concurrency limit: 5) |
| `src/adapters/rss.ts` | RSS/Atom feed parser |
| `src/adapters/scraper.ts` | HTML scraper |
| `src/sources/hackernews.ts` | HackerNews Top Stories (batched, 10 items/batch) |
| `src/sources/github-trending.ts` | GitHub Trending scraper |
| `src/core/storage.ts` | Data persistence and aggregated output generation |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Fetching | Node.js, TypeScript, Axios, Cheerio, RSS Parser |
| Logging | Pino |
| Testing | Vitest (unit), Playwright (E2E) |

## Quick Start

**Prerequisites:** Node.js 18.18+; Node.js 22 recommended

```bash
# 1. Install dependencies
npm run install:all

# 2. Fetch data (must run before starting the web server)
npm run fetch

# 3. Start the frontend dev server
npm run dev:web
# Open http://localhost:3000
```

## Development

```bash
# Frontend with hot reload
npm run dev:web

# Debug the fetcher in isolation
npm run dev:fetch

# Unit tests
cd web && npm test

# E2E tests (requires a running server)
npm run test:e2e
```

## Data And Date Rules

- `publishedAt` is used for sorting, filtering, and time-range logic
- `publishedLabel` stores the original publish-date text from the source when available
- The UI prefers `publishedLabel` and only falls back to formatting `publishedAt`
- Sources without a natural publish date, such as `github-trending`, still render range labels like "Trending today"

This keeps the visible date aligned with the article itself instead of the fetch job timestamp.

## Production

```bash
# Fetch latest data
npm run fetch

# Build the frontend
npm run build:web

# Start production server
npm start
```

The frontend reads data in two modes:

- Local: `DATA_FILE_PATH`, defaulting to `../fetcher/data/index.json`
- Vercel: private Blob reads enabled by `BLOB_STORE=true`, targeting `ai-info/index.json`

## Data Flow

```
External sources (HN / RSS / GitHub)
              ↓
    fetcher (scrape, clean, merge)
              ↓
    local JSON or Vercel Blob
              ↓
  web (Server Components / API routes)
              ↓
      Browser (React renders)
```

## Sources

Sources are configured in `fetcher/config/`. Currently supported types:

- **HackerNews** — Top Stories with batched concurrent detail fetching
- **RSS** — Any RSS/Atom feed URL
- **GitHub Trending** — Daily/weekly trending repositories
- **Custom API** — Extensible API adapter for additional sources

## License

MIT
