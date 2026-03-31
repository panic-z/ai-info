import axios from 'axios';
import type { SourceConfig, Article } from '../../../shared/types';
import { logger } from '../core/logger';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';
const MAX_CONCURRENT_REQUESTS = 10;

export async function fetchHackerNews(source: SourceConfig): Promise<Article[]> {
  logger.info({ sourceId: source.id }, 'Fetching Hacker News');
  
  try {
    const topStoriesRes = await axios.get(`${HN_API_BASE}/topstories.json`, {
      timeout: 10000
    });
    const topStoryIds = topStoriesRes.data.slice(0, 15);
    
    const fetchedAt = new Date().toISOString();
    
    // Batch requests for better performance
    const fetchItem = async (id: number) => {
      try {
        const itemRes = await axios.get(`${HN_API_BASE}/item/${id}.json`, {
          timeout: 5000
        });
        const item = itemRes.data;
        
        if (item && item.title) {
          return {
            id: `hn-${item.id}`,
            title: item.title,
            summary: item.text ? item.text.substring(0, 200) : undefined,
            url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
            publishedAt: item.time ? new Date(item.time * 1000).toISOString() : fetchedAt,
            author: item.by,
            sourceId: source.id,
            sourceName: source.name,
            categoryId: '',
            fetchedAt
          };
        }
      } catch (error) {
        logger.warn({ id, error }, 'Failed to fetch HN item');
      }
      return null;
    };
    
    // Process in batches to avoid overwhelming the API
    const articles: Article[] = [];
    for (let i = 0; i < topStoryIds.length; i += MAX_CONCURRENT_REQUESTS) {
      const batch = topStoryIds.slice(i, i + MAX_CONCURRENT_REQUESTS);
      const results = await Promise.all(batch.map(fetchItem));
      articles.push(...results.filter((item): item is Article => item !== null));
    }
    
    return articles;
  } catch (error) {
    logger.error({ sourceId: source.id, error }, 'Failed to fetch Hacker News');
    throw error;
  }
}
