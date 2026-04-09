# ai-info Vercel Deployment Design

**Date:** 2026-04-09  
**Status:** Approved

## Overview

Deploy the `ai-info` project (fetcher + web) to Vercel's free (Hobby) tier. The fetcher runs as a daily Vercel Cron Job, writing aggregated data to Vercel Blob. The Next.js web app reads from Vercel Blob to serve data to users.

## Constraints

- Vercel Hobby (free) plan — Cron minimum interval is once per day
- Vercel Blob free tier — 500MB storage, 100GB/month bandwidth
- No paid external services

## Architecture

```
Vercel Cron (0 2 * * * UTC)
    → POST /api/cron/fetch  (protected by CRON_SECRET)
        → runFetcher()  (existing fetcher core logic)
        → write result → Vercel Blob (key: ai-info/index.json)

User request
    → GET /api/sources
        → read from Vercel Blob (ai-info/index.json)
        → fallback to local file (dev environment)
        → return AggregatedData JSON
```

## Components

### 1. `web/vercel.json` (new)

Configures the daily cron schedule:

```json
{
  "crons": [{ "path": "/api/cron/fetch", "schedule": "0 2 * * *" }]
}
```

### 2. `web/app/api/cron/fetch/route.ts` (new)

- Validates `Authorization: Bearer <CRON_SECRET>` header (rejects 401 if missing/wrong)
- Calls `runFetcher()` from the fetcher package
- Writes the aggregated result to Vercel Blob using `@vercel/blob`
- Returns `{ ok: true, updatedAt }` on success

### 3. `fetcher/src/core/storage.ts` (modify)

- `saveAggregatedData()` gains a new code path: when `process.env.BLOB_STORE === 'true'`, upload to Vercel Blob instead of writing to local filesystem
- All other storage functions (individual source files, error logs) remain file-based and are only called in local/CI environments
- Local development behavior unchanged

### 4. `web/app/api/sources/route.ts` (modify)

- When `process.env.BLOB_STORE === 'true'`: fetch `ai-info/index.json` from Vercel Blob
- Otherwise: read from local file path (existing behavior, keeps local dev working)

## Environment Variables

| Variable | Where set | Purpose |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel dashboard (auto-injected) | Vercel Blob access |
| `CRON_SECRET` | Vercel dashboard | Protects `/api/cron/fetch` from public calls |
| `BLOB_STORE` | Vercel dashboard | Feature flag: `true` in production, unset locally |

## Data Flow

- The cron job replaces the entire `ai-info/index.json` blob on each run (no incremental updates)
- First deploy: blob does not exist yet; `/api/sources` returns a 503 until the first cron run completes
- To seed data on first deploy: manually trigger `POST /api/cron/fetch` with the correct `CRON_SECRET`

## Local Development

No changes to local dev workflow. Set `BLOB_STORE` to unset (or omit) and the app reads from `fetcher/data/index.json` as before.

## Out of Scope

- Incremental/partial data updates
- Per-source error recovery in the cron job
- Vercel KV or database storage
- Sub-daily update frequency (requires Vercel Pro)
