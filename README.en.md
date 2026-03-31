# AI Info Hub

> Aggregate high-quality AI information from multiple sources　[中文](README.md)

## Overview

AI Info Hub is an information aggregation tool that collects AI-related content from HackerNews, GitHub Trending, RSS feeds, and other channels, then displays it through a clean web interface. The project is split into two independently runnable services: a **fetcher** that scrapes and stores data, and a **web** frontend that reads and displays it. Data is passed via a local JSON file.

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
| `app/api/sources/route.ts` | API route that reads the fetcher's JSON output |
| `components/ArticleCard.tsx` | Individual article card |
| `components/CategoryCard.tsx` | Category grouping card |
| `components/TimeSection.tsx` | Time period sections (today / this week / this month) |
| `utils/timeUtils.ts` | Time period detection utilities |

### fetcher — Scraping Service

| Path | Description |
|------|-------------|
| `src/core/fetcher.ts` | Concurrent scraping scheduler (concurrency limit: 5) |
| `src/adapters/rss.ts` | RSS/Atom feed parser |
| `src/adapters/scraper.ts` | HTML scraper |
| `src/sources/hackernews.ts` | HackerNews Top Stories (batched, 10 items/batch) |
| `src/sources/github-trending.ts` | GitHub Trending scraper |
| `src/core/storage.ts` | Data persistence (writes to `fetcher/data/index.json`) |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 13+, React, TypeScript, Tailwind CSS |
| Fetching | Node.js, TypeScript, Axios, Cheerio, RSS Parser |
| Logging | Pino |
| Testing | Vitest (unit), Playwright (E2E) |

## Quick Start

**Prerequisites:** Node.js 18+

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

## Production

```bash
# Fetch latest data
npm run fetch

# Build the frontend
npm run build:web

# Start production server
npm start
```

The frontend reads the data file path from the `DATA_FILE_PATH` environment variable (default: `../fetcher/data/index.json`).

## Data Flow

```
External sources (HN / RSS / GitHub)
              ↓
    fetcher (scrape, clean, merge)
              ↓
    fetcher/data/index.json
              ↓
  web API /api/sources (reads file)
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
