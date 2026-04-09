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
