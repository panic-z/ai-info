import { NextResponse } from 'next/server';
import { readSourcesData } from '@/lib/source-data';

export async function GET() {
  try {
    const data = await readSourcesData();

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/sources] GET failed:', message);
    const isNotFound = message.includes('not found') || message.includes('ENOENT');
    return NextResponse.json(
      { error: isNotFound ? 'Data not available yet' : 'Failed to load data' },
      { status: isNotFound ? 503 : 500 },
    );
  }
}
