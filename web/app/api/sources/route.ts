import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { AggregatedData } from '@shared/types';

const DATA_FILE_PATH = process.env.DATA_FILE_PATH || 
  path.join(process.cwd(), '../fetcher/data/index.json');

export async function GET() {
  try {
    const content = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const data: AggregatedData = JSON.parse(content);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Failed to load data:', error);
    return NextResponse.json(
      { error: 'Data not found. Please run fetcher first.' },
      { status: 404 }
    );
  }
}
