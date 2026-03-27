import type { SourcesConfig, SourceConfig, FetchResult, FetchError, Article } from '../../../shared/types';
import { logger } from './logger';
import { saveFetchResult, saveErrorLog, loadErrorLog, buildAggregatedData, saveAggregatedData } from './storage';
import { fetchRSS } from '../adapters/rss';
import { fetchHackerNews } from '../sources/hackernews';
import { fetchGitHubTrending } from '../sources/github-trending';
import fs from 'fs/promises';
import path from 'path';

const CONCURRENCY_LIMIT = 5;

const specialHandlers: Record<string, (source: SourceConfig) => Promise<Article[]>> = {
  'hackernews': fetchHackerNews,
  'github-trending': fetchGitHubTrending
};

async function fetchSource(source: SourceConfig, categoryId: string): Promise<FetchResult> {
  const startTime = Date.now();
  logger.info({ sourceId: source.id, type: source.type }, 'Starting fetch');
  
  try {
    let items: Article[];
    
    if (specialHandlers[source.id]) {
      items = await specialHandlers[source.id](source);
    } else if (source.type === 'rss') {
      items = await fetchRSS(source);
    } else {
      throw new Error(`Unsupported source type: ${source.type}`);
    }
    
    items = items.map(item => ({ ...item, categoryId }));
    
    const result: FetchResult = {
      sourceId: source.id,
      sourceName: source.name,
      categoryId,
      homepage: source.homepage,
      lastFetched: new Date().toISOString(),
      fetchStatus: 'success',
      errorMessage: null,
      items
    };
    
    logger.info({ sourceId: source.id, itemCount: items.length, duration: Date.now() - startTime }, 'Fetch completed');
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ sourceId: source.id, error: errorMessage }, 'Fetch failed');
    
    return {
      sourceId: source.id,
      sourceName: source.name,
      categoryId,
      homepage: source.homepage,
      lastFetched: new Date().toISOString(),
      fetchStatus: 'error',
      errorMessage,
      items: []
    };
  }
}

async function fetchWithConcurrency(sources: { source: SourceConfig; categoryId: string }[]): Promise<FetchResult[]> {
  const results: FetchResult[] = [];
  
  for (let i = 0; i < sources.length; i += CONCURRENCY_LIMIT) {
    const batch = sources.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map(({ source, categoryId }) => fetchSource(source, categoryId))
    );
    results.push(...batchResults);
    
    if (i + CONCURRENCY_LIMIT < sources.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

export async function runFetcher(): Promise<void> {
  logger.info('Starting fetcher run');
  const startTime = Date.now();
  
  try {
    // Load config asynchronously
    const configPath = path.join(__dirname, '../../config/sources.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config: SourcesConfig = JSON.parse(configContent);
    
    // Validate config structure
    if (!config.categories || !Array.isArray(config.categories)) {
      throw new Error('Invalid config: missing or invalid categories array');
    }
    
    const sourcesToFetch: { source: SourceConfig; categoryId: string }[] = [];
    for (const category of config.categories) {
      if (!category.id || !category.sources || !Array.isArray(category.sources)) {
        logger.warn({ categoryId: category?.id }, 'Skipping invalid category');
        continue;
      }
      for (const source of category.sources) {
        if (!source.id || !source.type || !source.url) {
          logger.warn({ sourceId: source?.id }, 'Skipping invalid source');
          continue;
        }
        if (source.enabled) {
          sourcesToFetch.push({ source, categoryId: category.id });
        }
      }
    }
    
    logger.info({ sourceCount: sourcesToFetch.length }, 'Found sources to fetch');
    
    const errorLog = await loadErrorLog();
    const newErrors: FetchError[] = [];
    
    const results = await fetchWithConcurrency(sourcesToFetch);
    
    for (const result of results) {
      await saveFetchResult(result);
      
      if (result.fetchStatus === 'error') {
        const previousError = errorLog.errors.find(e => e.sourceId === result.sourceId);
        const retryCount = previousError ? previousError.retryCount + 1 : 1;
        
        newErrors.push({
          sourceId: result.sourceId,
          timestamp: result.lastFetched,
          error: 'FetchFailed',
          message: result.errorMessage || 'Unknown error',
          retryCount
        });
      }
    }
    
    // Merge with existing errors, keep last 100 per source
    const mergedErrors = [...errorLog.errors.filter(e => !newErrors.some(ne => ne.sourceId === e.sourceId)), ...newErrors]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100);
    
    await saveErrorLog({ errors: mergedErrors });
    
    const aggregated = await buildAggregatedData();
    await saveAggregatedData(aggregated);
    
    logger.info({ 
      duration: Date.now() - startTime,
      successCount: results.filter(r => r.fetchStatus === 'success').length,
      errorCount: results.filter(r => r.fetchStatus === 'error').length
    }, 'Fetcher run completed');
    
  } catch (error) {
    logger.error({ error }, 'Fetcher run failed');
    throw error;
  }
}
