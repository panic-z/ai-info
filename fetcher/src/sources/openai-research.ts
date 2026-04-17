/**
 * Scraper for OpenAI Research articles via their sitemap.
 * The research page returns 403 for non-Googlebot requests, but the sitemap
 * (https://openai.com/sitemap.xml/research/) is publicly accessible and
 * contains all research URLs with lastmod dates.
 */
import axios from 'axios';
import crypto from 'crypto';
import type { SourceConfig, Article } from '../../../shared/types';
import { logger } from '../core/logger';

const SITEMAP_URL = 'https://openai.com/sitemap.xml/research/';

function generateArticleId(sourceId: string, url: string, title: string): string {
  const hash = crypto.createHash('md5').update(`${url}|${title}`).digest('hex').substring(0, 16);
  return `${sourceId}-${hash}`;
}

function slugToTitle(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export async function fetchOpenAIResearch(source: SourceConfig): Promise<Article[]> {
  logger.info({ sourceId: source.id }, 'Fetching OpenAI Research via sitemap');

  const response = await axios.get(SITEMAP_URL, {
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'application/xml,text/xml,*/*',
    }
  });

  const xml: string = response.data;

  const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  const lastmodMatches = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)];

  if (locMatches.length === 0) {
    throw new Error('No entries found in OpenAI research sitemap');
  }

  const fetchedAt = new Date().toISOString();
  const articles: Article[] = [];

  for (let i = 0; i < locMatches.length; i++) {
    const url = locMatches[i][1].trim();
    const lastmod = lastmodMatches[i]?.[1]?.trim();

    // Skip non-article entries (e.g. the /news/ index page)
    const indexMatch = url.match(/openai\.com\/index\/([^/]+)\//);
    if (!indexMatch) continue;

    const slug = indexMatch[1];
    const title = slugToTitle(slug);
    const publishedAt = lastmod ? new Date(lastmod).toISOString() : undefined;

    articles.push({
      id: generateArticleId(source.id, url, title),
      title,
      url,
      publishedAt,
      publishedLabel: lastmod,
      sourceId: source.id,
      sourceName: source.name,
      categoryId: '',
      fetchedAt
    });
  }

  const limited = articles.slice(0, 10);
  logger.info({ sourceId: source.id, count: limited.length }, 'Fetched OpenAI research from sitemap');
  return limited;
}
