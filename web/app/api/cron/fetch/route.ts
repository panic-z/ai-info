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
