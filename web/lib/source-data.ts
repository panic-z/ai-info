import fs from 'fs/promises';
import path from 'path';
import type { AggregatedData } from '@shared/types';

async function readFromBlob(): Promise<AggregatedData> {
  const { list } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: 'ai-info/index.json', limit: 1 });
  if (blobs.length === 0) {
    throw new Error('Blob not found — run /api/cron/fetch to seed data');
  }

  const blob = blobs[0];
  const blobUrl = blob.downloadUrl || blob.url;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const response = await fetch(
    blobUrl,
    token && blobUrl === blob.url
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined,
  );

  if (!response.ok) {
    throw new Error(`Blob fetch failed: ${response.status}`);
  }

  return response.json() as Promise<AggregatedData>;
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
