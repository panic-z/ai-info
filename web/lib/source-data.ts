import fs from 'fs/promises';
import path from 'path';
import type { AggregatedData } from '@shared/types';

async function readFromBlob(): Promise<AggregatedData> {
  const { get, list } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: 'ai-info/index.json', limit: 1 });
  if (blobs.length === 0) {
    throw new Error('Blob not found — run /api/cron/fetch to seed data');
  }

  const result = await get(blobs[0].pathname, { access: 'private' });
  if (!result) {
    throw new Error('Blob not found — run /api/cron/fetch to seed data');
  }

  const content = await new Response(result.stream).text();
  return JSON.parse(content) as AggregatedData;
}

async function readFromFile(): Promise<AggregatedData> {
  const filePath = process.env.DATA_FILE_PATH ??
    (() => {
      const cwd = process.cwd();
      const base = cwd.endsWith('/web') ? path.join(cwd, '..') : cwd;
      return path.join(base, 'fetcher/data/index.json');
    })();

  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as AggregatedData;
}

export async function readSourcesData(): Promise<AggregatedData> {
  return process.env.BLOB_STORE === 'true'
    ? readFromBlob()
    : readFromFile();
}
