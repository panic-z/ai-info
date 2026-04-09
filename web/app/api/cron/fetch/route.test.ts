import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('ai-info-fetcher', () => ({
  runFetcher: vi.fn().mockResolvedValue(undefined),
}));

describe('GET /api/cron/fetch', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
    vi.resetAllMocks();
  });

  it('returns 401 when Authorization header is missing', async () => {
    process.env.CRON_SECRET = 'secret123';
    const { GET } = await import('./route');
    const request = new Request('http://localhost/api/cron/fetch', { method: 'GET' });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('returns 401 when Authorization header has wrong secret', async () => {
    process.env.CRON_SECRET = 'secret123';
    const { GET } = await import('./route');
    const request = new Request('http://localhost/api/cron/fetch', {
      method: 'GET',
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('calls runFetcher and returns 200 with correct secret', async () => {
    process.env.CRON_SECRET = 'secret123';
    const { runFetcher } = await import('ai-info-fetcher');
    const { GET } = await import('./route');
    const request = new Request('http://localhost/api/cron/fetch', {
      method: 'GET',
      headers: { Authorization: 'Bearer secret123' },
    });
    const response = await GET(request);
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
    const { GET } = await import('./route');
    const request = new Request('http://localhost/api/cron/fetch', {
      method: 'GET',
      headers: { Authorization: 'Bearer secret123' },
    });
    const response = await GET(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Fetch failed');
  });

  it('returns 401 when CRON_SECRET env var is not set', async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import('./route');
    const request = new Request('http://localhost/api/cron/fetch', {
      method: 'GET',
      headers: { Authorization: 'Bearer anything' },
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});
