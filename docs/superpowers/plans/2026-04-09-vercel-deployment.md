# ai-info Vercel Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy ai-info (fetcher + web) to Vercel Hobby with a daily cron job that fetches AI news and stores it in Vercel Blob, served by a Next.js API route.

**Architecture:** The fetcher runs as a Next.js API route (`/api/cron/fetch`) triggered daily by Vercel Cron. It calls the existing `runFetcher()` logic and persists the result to Vercel Blob. The web's `/api/sources` route reads from Blob in production and falls back to the local file in development.

**Tech Stack:** Next.js 15 App Router, Vercel Blob (`@vercel/blob`), Vercel Cron (via `vercel.json`), npm workspaces (monorepo), vitest

---

## File Map

| File | Action | Summary |
|------|--------|---------|
| `fetcher/src/core/logger.ts` | Modify | Remove file write; use stdout-only in production |
| `fetcher/src/core/fetcher.ts` | Modify | Replace `fs.readFile` config loading with static `import` |
| `fetcher/src/core/storage.ts` | Modify | Use `FETCHER_DATA_DIR` env var; add Blob write path to `saveAggregatedData` |
| `fetcher/package.json` | Modify | Add `exports` field so web can import `runFetcher`; add `@vercel/blob` |
| `web/package.json` | Modify | Add `ai-info-fetcher: "*"` workspace dep and `@vercel/blob` |
| `web/next.config.js` | Modify | Add `transpilePackages: ['ai-info-fetcher']`; remove `output: 'standalone'` |
| `web/app/api/sources/route.ts` | Modify | Read from Vercel Blob when `BLOB_STORE=true` |
| `web/app/api/sources/route.test.ts` | Create | Unit tests for the modified sources route |
| `web/app/api/cron/fetch/route.ts` | Create | Cron handler: validates `CRON_SECRET`, calls `runFetcher()` |
| `web/app/api/cron/fetch/route.test.ts` | Create | Unit tests for the cron route |
| `vercel.json` | Create | Root-level Vercel config: build commands + cron schedule |

---

### Task 1: Make logger production-safe

`fetcher/src/core/logger.ts` currently writes to a log file and uses `pino-pretty`. On Vercel's read-only filesystem this crashes at module load time.

**Files:**
- Modify: `fetcher/src/core/logger.ts`

- [ ] **Step 1: Replace the logger with a production-safe version**

Replace the entire contents of `fetcher/src/core/logger.ts` with:

```ts
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = isProduction
  ? pino({ level: process.env.LOG_LEVEL || 'info' })
  : pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    });
```

- [ ] **Step 2: Verify fetcher still starts locally**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info
npm run dev:fetch
```

Expected: fetcher starts and logs to stdout without error.

- [ ] **Step 3: Commit**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info
git add fetcher/src/core/logger.ts
git commit -m "fix(fetcher): make logger production-safe for Vercel"
```

---

### Task 2: Change config loading to static import

`fetcher/src/core/fetcher.ts` reads `sources.json` with `fs.readFile` at a `__dirname`-relative path. Next.js's bundler cannot trace this dynamic path when the fetcher is imported as a workspace package. A static `import` guarantees the file is bundled.

**Files:**
- Modify: `fetcher/src/core/fetcher.ts`
- Modify: `fetcher/tsconfig.json` (enable resolveJsonModule — already on)

- [ ] **Step 1: Replace runtime config loading with static import**

In `fetcher/src/core/fetcher.ts`, replace these lines near the top of `runFetcher()`:

```ts
    // Load config asynchronously
    const configPath = path.join(__dirname, '../../config/sources.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config: SourcesConfig = JSON.parse(configContent);
```

With a static import at the top of the file (before any functions):

```ts
import sourcesConfig from '../../config/sources.json';
```

And inside `runFetcher()`, replace the three lines above with:

```ts
    const config = sourcesConfig as SourcesConfig;
```

Also remove the `fs` and `path` imports from the top of `fetcher.ts` since `runFetcher` no longer uses them (keep them only if used elsewhere in the file — check first).

- [ ] **Step 2: Verify the fetcher still runs correctly**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info
npm run dev:fetch
```

Expected: fetcher runs, fetches sources, writes `fetcher/data/index.json`.

- [ ] **Step 3: Commit**

```bash
git add fetcher/src/core/fetcher.ts
git commit -m "refactor(fetcher): load sources.json as static import for bundler compatibility"
```

---

### Task 3: Update storage to use env-configurable data dir + Blob write

On Vercel, the filesystem is read-only except `/tmp`. The fetcher writes intermediate per-source JSON files. These need to go to `/tmp/ai-info-data` on Vercel. The final `saveAggregatedData` must write to Vercel Blob instead of a file.

**Files:**
- Modify: `fetcher/src/core/storage.ts`
- Modify: `fetcher/package.json`

- [ ] **Step 1: Add `@vercel/blob` to fetcher dependencies**

Edit `fetcher/package.json` — add to `dependencies`:

```json
"@vercel/blob": "^0.29.0"
```

And add an `exports` field so the web package can import from it:

```json
"exports": {
  ".": "./src/core/fetcher.ts"
}
```

Full updated `fetcher/package.json`:

```json
{
  "name": "ai-info-fetcher",
  "version": "1.0.0",
  "description": "AI 信息抓取服务",
  "main": "dist/index.js",
  "exports": {
    ".": "./src/core/fetcher.ts"
  },
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/fetcher/src/index.js"
  },
  "dependencies": {
    "@vercel/blob": "^0.29.0",
    "axios": "^1.6.0",
    "cheerio": "^1.0.0-rc.12",
    "pino": "^8.17.0",
    "pino-pretty": "^10.3.0",
    "rss-parser": "^3.13.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Step 2: Update `storage.ts` — env-configurable data dir**

Replace the `dataDir` constant at the top of `fetcher/src/core/storage.ts`:

```ts
// Before:
const dataDir = path.join(__dirname, '../../data');

// After:
const dataDir = process.env.FETCHER_DATA_DIR ?? path.join(__dirname, '../../data');
```

- [ ] **Step 3: Update `saveAggregatedData` to write to Vercel Blob in production**

Replace the `saveAggregatedData` function in `fetcher/src/core/storage.ts`:

```ts
export async function saveAggregatedData(data: AggregatedData): Promise<void> {
  if (process.env.BLOB_STORE === 'true') {
    const { put } = await import('@vercel/blob');
    await put('ai-info/index.json', JSON.stringify(data), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
      cacheControlMaxAge: 86400, // 1 day — matches the daily cron schedule
    });
    return;
  }
  await ensureDataDir();
  const filePath = path.join(dataDir, 'index.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
```

- [ ] **Step 4: Run fetcher locally to confirm nothing broke**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info
npm run dev:fetch
```

Expected: runs without error, writes to `fetcher/data/index.json` (no `BLOB_STORE` set locally).

- [ ] **Step 5: Commit**

```bash
git add fetcher/package.json fetcher/src/core/storage.ts
git commit -m "feat(fetcher): configurable data dir + Vercel Blob write for saveAggregatedData"
```

---

### Task 4: Configure the web package to import the fetcher

**Files:**
- Modify: `web/package.json`
- Modify: `web/next.config.js`

- [ ] **Step 1: Add fetcher workspace dependency and `@vercel/blob` to web**

Edit `web/package.json` — add to `dependencies`:

```json
"ai-info-fetcher": "*",
"@vercel/blob": "^0.29.0"
```

- [ ] **Step 2: Update `next.config.js`**

Replace the entire contents of `web/next.config.js` with:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ai-info-fetcher'],
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
```

(The `output: 'standalone'` is removed — not needed on Vercel and it complicates workspace bundling.)

- [ ] **Step 3: Install dependencies**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info
npm install
```

Expected: no errors; `web/node_modules/ai-info-fetcher` symlinks to `../fetcher`.

- [ ] **Step 4: Verify web builds**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info
npm run build:web
```

Expected: build completes without TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add web/package.json web/next.config.js package-lock.json
git commit -m "feat(web): add ai-info-fetcher workspace dep + transpilePackages config"
```

---

### Task 5: Update `/api/sources` to read from Vercel Blob

**Files:**
- Modify: `web/app/api/sources/route.ts`
- Create: `web/app/api/sources/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `web/app/api/sources/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@vercel/blob', () => ({
  list: vi.fn(),
}));

describe('GET /api/sources', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetAllMocks();
  });

  it('returns 503 when BLOB_STORE=true but no blob found', async () => {
    process.env.BLOB_STORE = 'true';
    const { list } = await import('@vercel/blob');
    vi.mocked(list).mockResolvedValue({ blobs: [], cursor: undefined, hasMore: false });

    const { GET } = await import('./route');
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toMatch(/not available/i);
  });

  it('returns data from Blob when BLOB_STORE=true and blob exists', async () => {
    process.env.BLOB_STORE = 'true';
    const mockData = { categories: [], lastUpdated: '2026-04-09T00:00:00Z' };

    const { list } = await import('@vercel/blob');
    vi.mocked(list).mockResolvedValue({
      blobs: [{
        url: 'https://example.com/ai-info/index.json',
        downloadUrl: 'https://example.com/ai-info/index.json',
        pathname: 'ai-info/index.json',
        size: 100,
        uploadedAt: new Date(),
      }],
      cursor: undefined,
      hasMore: false,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }) as unknown as typeof fetch;

    const { GET } = await import('./route');
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockData);
  });
});
```

- [ ] **Step 2: Run the test — confirm it fails**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info/web
npm run test:run -- app/api/sources/route.test.ts
```

Expected: FAIL — `GET` does not yet read from Blob.

- [ ] **Step 3: Update the route to pass the tests**

Replace the entire contents of `web/app/api/sources/route.ts`:

```ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { AggregatedData } from '@shared/types';

async function readFromBlob(): Promise<AggregatedData> {
  const { list } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: 'ai-info/index.json', limit: 1 });
  if (blobs.length === 0) {
    throw new Error('Blob not found — run /api/cron/fetch to seed data');
  }
  const response = await fetch(blobs[0].url);
  if (!response.ok) throw new Error(`Blob fetch failed: ${response.status}`);
  return response.json() as Promise<AggregatedData>;
}

async function readFromFile(): Promise<AggregatedData> {
  const filePath = process.env.DATA_FILE_PATH ??
    path.join(process.cwd(), '../fetcher/data/index.json');
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as AggregatedData;
}

export async function GET() {
  try {
    const data = process.env.BLOB_STORE === 'true'
      ? await readFromBlob()
      : await readFromFile();

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isNotFound = message.includes('not found') || message.includes('ENOENT');
    return NextResponse.json(
      { error: isNotFound ? 'Data not available yet' : 'Failed to load data' },
      { status: isNotFound ? 503 : 500 },
    );
  }
}
```

- [ ] **Step 4: Run the tests — confirm they pass**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info/web
npm run test:run -- app/api/sources/route.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info
git add web/app/api/sources/route.ts web/app/api/sources/route.test.ts
git commit -m "feat(web): read from Vercel Blob in production, local file in dev"
```

---

### Task 6: Create the cron route

**Files:**
- Create: `web/app/api/cron/fetch/route.ts`
- Create: `web/app/api/cron/fetch/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `web/app/api/cron/fetch/route.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('ai-info-fetcher', () => ({
  runFetcher: vi.fn().mockResolvedValue(undefined),
}));

describe('POST /api/cron/fetch', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetAllMocks();
  });

  it('returns 401 when Authorization header is missing', async () => {
    process.env.CRON_SECRET = 'secret123';
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/cron/fetch', { method: 'POST' });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 401 when Authorization header has wrong secret', async () => {
    process.env.CRON_SECRET = 'secret123';
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/cron/fetch', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('calls runFetcher and returns 200 with correct secret', async () => {
    process.env.CRON_SECRET = 'secret123';
    const { runFetcher } = await import('ai-info-fetcher');
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/cron/fetch', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret123' },
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(runFetcher).toHaveBeenCalledOnce();
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.updatedAt).toBeDefined();
  });

  it('returns 500 when runFetcher throws', async () => {
    process.env.CRON_SECRET = 'secret123';
    const { runFetcher } = await import('ai-info-fetcher');
    vi.mocked(runFetcher).mockRejectedValueOnce(new Error('network error'));
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/cron/fetch', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret123' },
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run the test — confirm it fails**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info/web
npm run test:run -- app/api/cron/fetch/route.test.ts
```

Expected: FAIL — module does not exist yet.

- [ ] **Step 3: Create the cron route**

Create `web/app/api/cron/fetch/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { runFetcher } from 'ai-info-fetcher';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await runFetcher();
    return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron/fetch] runFetcher failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run the tests — confirm they pass**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info/web
npm run test:run -- app/api/cron/fetch/route.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Run all web tests to confirm nothing regressed**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info/web
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info
git add web/app/api/cron/fetch/route.ts web/app/api/cron/fetch/route.test.ts
git commit -m "feat(web): add /api/cron/fetch route for Vercel Cron daily trigger"
```

---

### Task 7: Configure Vercel project

**Files:**
- Create: `vercel.json` (repo root)

- [ ] **Step 1: Create `vercel.json` at repo root**

Create `/Users/wubaiyu/DEV/side-projects/ai-info/vercel.json`:

```json
{
  "buildCommand": "npm run build:web",
  "outputDirectory": "web/.next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/cron/fetch",
      "schedule": "0 2 * * *"
    }
  ]
}
```

This tells Vercel to:
- Run `npm run build:web` (which is `cd web && npm run build`) for the build
- Use `web/.next` as the output
- Run a cron job at 02:00 UTC every day

- [ ] **Step 2: Verify the build command works from repo root**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info
npm run build:web
```

Expected: Next.js build completes successfully.

- [ ] **Step 3: Commit**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info
git add vercel.json
git commit -m "chore: add Vercel project config with daily cron"
```

---

### Task 8: Deploy to Vercel and seed initial data

- [ ] **Step 1: Install Vercel CLI if not already installed**

```bash
npm i -g vercel
```

- [ ] **Step 2: Link the project to Vercel**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info
vercel link
```

When prompted: set Root Directory to `.` (repo root), framework to Next.js.

- [ ] **Step 3: Provision Vercel Blob storage**

In the Vercel dashboard → your project → Storage tab → Connect Store → Create new Blob store → name it `ai-info-blob`. This auto-injects `BLOB_READ_WRITE_TOKEN` into all environments.

Alternatively via CLI (requires Vercel CLI v37+):
```bash
vercel integration add blob
```

- [ ] **Step 4: Add environment variables**

```bash
vercel env add BLOB_STORE production
# Value: true

vercel env add CRON_SECRET production
# Value: <generate a random string, e.g. openssl rand -hex 32>

vercel env add FETCHER_DATA_DIR production
# Value: /tmp/ai-info-data
```

- [ ] **Step 5: Deploy to production**

```bash
vercel --prod
```

Expected: deployment succeeds, you get a production URL.

- [ ] **Step 6: Seed initial data by manually triggering the cron**

The Blob is empty after first deploy. Trigger the cron route once to populate it:

```bash
CRON_SECRET=$(vercel env pull --yes > /dev/null && grep CRON_SECRET .env.local | cut -d= -f2)
curl -X POST https://<your-production-url>/api/cron/fetch \
  -H "Authorization: Bearer $CRON_SECRET"
```

Expected: `{"ok":true,"updatedAt":"..."}` — the site is now live with data.

- [ ] **Step 7: Verify the site loads data**

```bash
curl https://<your-production-url>/api/sources | head -c 200
```

Expected: JSON with `categories` and `lastUpdated` fields.
