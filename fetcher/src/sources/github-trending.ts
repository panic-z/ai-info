import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import type { SourceConfig, Article } from '../../../shared/types';
import { logger } from '../core/logger';

function generateArticleId(sourceId: string, url: string, title: string): string {
  // Use 16-char hex (64 bits) for much lower collision probability
  const hash = crypto.createHash('md5').update(`${url}|${title}`).digest('hex').substring(0, 16);
  return `${sourceId}-${hash}`;
}

export async function fetchGitHubTrending(source: SourceConfig): Promise<Article[]> {
  logger.info({ sourceId: source.id }, 'Fetching GitHub Trending');
  
  const timeRanges = ['daily', 'weekly', 'monthly'] as const;
  const allArticles: Article[] = [];
  
  try {
    // Fetch trending repos for all time ranges
    for (const range of timeRanges) {
      try {
        const url = `https://github.com/trending?since=${range}`;
        const response = await axios.get(url, {
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        const fetchedAt = new Date().toISOString();
        
        $('article.Box-row').each((index, element) => {
          const $el = $(element);
          const link = $el.find('h2 a').attr('href');
          const title = $el.find('h2 a').text().trim().replace(/\s+/g, ' ');
          const description = $el.find('p').text().trim();
          
          if (link && title) {
            const repoUrl = `https://github.com${link}`;
            // Use range in ID to make each range unique
            const articleId = generateArticleId(source.id, repoUrl + range, title);
            
            allArticles.push({
              id: articleId,
              title: title,
              summary: description,
              url: repoUrl,
              publishedAt: fetchedAt,
              sourceId: source.id,
              sourceName: source.name,
              categoryId: '',
              fetchedAt,
              timeRange: range
            });
          }
        });
        
        logger.info({ sourceId: source.id, range, count: allArticles.length }, `Fetched ${range} trending`);
      } catch (rangeError) {
        logger.warn({ sourceId: source.id, range, error: rangeError }, `Failed to fetch ${range} trending`);
        // Continue with other ranges even if one fails
      }
    }
    
    return allArticles;
  } catch (error) {
    logger.error({ sourceId: source.id, error }, 'Failed to fetch GitHub Trending');
    throw error;
  }
}
