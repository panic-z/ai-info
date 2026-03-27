import axios from 'axios';
import type { SourceConfig, Article } from '../../../shared/types';
import { logger } from '../core/logger';

export async function fetchAPI(source: SourceConfig): Promise<Article[]> {
  logger.info({ sourceId: source.id }, 'Fetching API');
  
  try {
    const response = await axios.get(source.url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'AI-Info-Hub/1.0'
      }
    });
    
    logger.warn({ sourceId: source.id }, 'Using generic API adapter, results may be incomplete');
    return [];
  } catch (error) {
    logger.error({ sourceId: source.id, error }, 'Failed to fetch API');
    throw error;
  }
}
