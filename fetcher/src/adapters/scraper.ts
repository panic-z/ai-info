import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SourceConfig, Article } from '../../../shared/types';
import { logger } from '../core/logger';

export async function fetchScraper(source: SourceConfig): Promise<Article[]> {
  logger.info({ sourceId: source.id }, 'Scraping webpage');
  
  try {
    const response = await axios.get(source.url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    logger.warn({ sourceId: source.id }, 'Using generic scraper, results may be incomplete');
    return [];
  } catch (error) {
    logger.error({ sourceId: source.id, error }, 'Failed to scrape webpage');
    throw error;
  }
}
