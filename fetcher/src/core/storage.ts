import fs from 'fs/promises';
import path from 'path';
import type { FetchResult, ErrorLog, AggregatedData, CategoryData } from '../../../shared/types';
import sourcesConfig from '../../config/sources.json';

const dataDir = process.env.FETCHER_DATA_DIR ?? path.join(__dirname, '../../data');

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      console.error('Failed to create data directory:', error);
      throw error;
    }
  }
}

export async function saveFetchResult(result: FetchResult): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(dataDir, `${result.sourceId}.json`);
  await fs.writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8');
}

export async function loadFetchResult(sourceId: string): Promise<FetchResult | null> {
  try {
    const filePath = path.join(dataDir, `${sourceId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as FetchResult;
  } catch {
    return null;
  }
}

export async function saveErrorLog(errors: ErrorLog): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(dataDir, 'errors.json');
  await fs.writeFile(filePath, JSON.stringify(errors, null, 2), 'utf-8');
}

export async function loadErrorLog(): Promise<ErrorLog> {
  try {
    const filePath = path.join(dataDir, 'errors.json');
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as ErrorLog;
  } catch {
    return { errors: [] };
  }
}

export async function buildAggregatedData(): Promise<AggregatedData> {
  await ensureDataDir();
  const files = await fs.readdir(dataDir);
  const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'errors.json' && f !== 'index.json');
  
  const results: FetchResult[] = [];
  for (const file of jsonFiles) {
    try {
      const content = await fs.readFile(path.join(dataDir, file), 'utf-8');
      results.push(JSON.parse(content) as FetchResult);
    } catch (error) {
      console.warn(`Failed to parse ${file}:`, error);
      // Skip invalid files
    }
  }

  // Load config to get category metadata
  try {
    const config = sourcesConfig;
    
    const categoryMetadata = new Map<string, { name: string; description?: string }>(
      config.categories.map((cat: { id: string; name: string; description?: string }) => 
        [cat.id, { name: cat.name, description: cat.description }]
      )
    );

    // Group by category
    const categoryMap = new Map<string, CategoryData>();
    for (const result of results) {
      if (!categoryMap.has(result.categoryId)) {
        const metadata = categoryMetadata.get(result.categoryId);
        categoryMap.set(result.categoryId, {
          id: result.categoryId,
          name: metadata?.name || result.categoryId,
          description: metadata?.description,
          sources: []
        });
      }
      categoryMap.get(result.categoryId)!.sources.push(result);
    }

    const categories = Array.from(categoryMap.values());
    
    return {
      categories,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to load config file:', error);
    // Fallback: create categories from results only
    const categoryMap = new Map<string, CategoryData>();
    for (const result of results) {
      if (!categoryMap.has(result.categoryId)) {
        categoryMap.set(result.categoryId, {
          id: result.categoryId,
          name: result.categoryId,
          sources: []
        });
      }
      categoryMap.get(result.categoryId)!.sources.push(result);
    }

    const categories = Array.from(categoryMap.values());
    
    return {
      categories,
      lastUpdated: new Date().toISOString()
    };
  }
}

export async function saveAggregatedData(data: AggregatedData): Promise<void> {
  if (process.env.BLOB_STORE === 'true') {
    const { put } = await import('@vercel/blob');
    await put('ai-info/index.json', JSON.stringify(data), {
      access: 'private',
      contentType: 'application/json',
      allowOverwrite: true,
    });
    return;
  }
  await ensureDataDir();
  const filePath = path.join(dataDir, 'index.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
