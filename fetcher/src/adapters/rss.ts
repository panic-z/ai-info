import Parser from 'rss-parser';
import axios from 'axios';
import crypto from 'crypto';
import type { SourceConfig, Article } from '../../../shared/types';
import { logger } from '../core/logger';

const parser = new Parser({
  timeout: 30000,
  customFields: {
    item: [
      'contentSnippet', 'content',
      ['itunes:duration', 'itunesDuration'],
      ['itunes:episode', 'itunesEpisode'],
    ]
  }
});

function generateArticleId(sourceId: string, url: string, title: string): string {
  // Use 16-char hex (64 bits) for much lower collision probability
  // Birthday paradox: ~4.3 billion articles for 1% collision chance
  const hash = crypto.createHash('md5').update(`${url}|${title}`).digest('hex').substring(0, 16);
  return `${sourceId}-${hash}`;
}

export async function fetchRSS(source: SourceConfig): Promise<Article[]> {
  logger.info({ sourceId: source.id }, 'Fetching RSS feed');
  
  try {
    // Use axios with timeout for better control
    const response = await axios.get(source.url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'feedparser/6.0 +https://github.com/kurtmckee/feedparser'
      }
    });
    
    const feed = await parser.parseString(response.data);
    const fetchedAt = new Date().toISOString();
    
    return (feed.items || []).slice(0, 10).map((item: any) => ({
      id: generateArticleId(source.id, item.link || '', item.title || ''),
      title: item.title || 'Untitled',
      summary: item.contentSnippet || item.content?.replace(/<[^>]*>/g, '').substring(0, 200),
      url: item.link || '',
      publishedAt: item.isoDate || item.pubDate || undefined,
      publishedLabel: typeof item.pubDate === 'string' ? item.pubDate : undefined,
      author: item.creator || item.author,
      sourceId: source.id,
      sourceName: source.name,
      categoryId: '',
      fetchedAt,
      audioUrl: item.enclosure?.url,
      duration: item.itunes?.duration ?? item.itunesDuration,
      episodeNumber: item.itunes?.episode != null
        ? Number(item.itunes.episode)
        : item.itunesEpisode != null
        ? Number(item.itunesEpisode)
        : undefined,
    }));
  } catch (error) {
    logger.error({ sourceId: source.id, error }, 'Failed to fetch RSS');
    throw error;
  }
}
