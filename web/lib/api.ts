import type { AggregatedData } from '@shared/types';

const DATA_PATH = '../../fetcher/data/index.json';

export async function fetchSourcesData(): Promise<AggregatedData | null> {
  try {
    const data = require(DATA_PATH);
    return data as AggregatedData;
  } catch {
    return null;
  }
}

export function getLastUpdated(data: AggregatedData | null): string | undefined {
  return data?.lastUpdated;
}
