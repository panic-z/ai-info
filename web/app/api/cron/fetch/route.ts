import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { runFetcher } from 'ai-info-fetcher';

function isValidToken(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(`Bearer ${expected}`);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || !isValidToken(authHeader, expectedToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await runFetcher();
    return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron/fetch] runFetcher failed:', message);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
