/**
 * Scraper for Anthropic pages (news, research) that use Next.js App Router
 * with RSC payloads containing Sanity CMS data (_type: "post").
 */
import axios from 'axios';
import crypto from 'crypto';
import type { SourceConfig, Article } from '../../../shared/types';
import { logger } from '../core/logger';

function generateArticleId(sourceId: string, url: string, title: string): string {
  const hash = crypto.createHash('md5').update(`${url}|${title}`).digest('hex').substring(0, 16);
  return `${sourceId}-${hash}`;
}

interface SanityPost {
  _type: string;
  slug?: { current?: string };
  title?: string;
  summary?: string;
  publishedOn?: string | null;
}

function findPosts(node: unknown): SanityPost[] {
  const results: SanityPost[] = [];

  function traverse(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      for (const item of obj) traverse(item);
      return;
    }

    const record = obj as Record<string, unknown>;

    if (record._type === 'post' && typeof record.title === 'string') {
      results.push(record as unknown as SanityPost);
      return;
    }

    for (const value of Object.values(record)) {
      traverse(value);
    }
  }

  traverse(node);
  return results;
}

async function fetchAnthropicPage(source: SourceConfig, basePath: string): Promise<Article[]> {
  logger.info({ sourceId: source.id }, `Scraping ${source.url}`);

  const response = await axios.get(source.url, {
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });

  const html: string = response.data;
  const pushPattern = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/gs;
  const allPosts: SanityPost[] = [];

  let match;
  while ((match = pushPattern.exec(html)) !== null) {
    let rscText: string;
    try {
      rscText = JSON.parse(`"${match[1]}"`);
    } catch {
      continue;
    }

    for (const line of rscText.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const jsonStr = line.substring(colonIdx + 1).trim();
      if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) continue;
      try {
        const data = JSON.parse(jsonStr);
        const found = findPosts(data);
        if (found.length > 0) allPosts.push(...found);
      } catch {
        // skip
      }
    }
  }

  if (allPosts.length === 0) {
    throw new Error(`No posts found in RSC payload for ${source.url}`);
  }

  const fetchedAt = new Date().toISOString();
  const seen = new Set<string>();
  const articles: Article[] = [];

  for (const raw of allPosts) {
    const slug = raw.slug?.current;
    const title = raw.title;
    if (!slug || !title) continue;

    const url = `https://www.anthropic.com${basePath}/${slug}`;
    if (seen.has(url)) continue;
    seen.add(url);

    const publishedAt = raw.publishedOn
      ? new Date(raw.publishedOn).toISOString()
      : fetchedAt;

    articles.push({
      id: generateArticleId(source.id, url, title),
      title,
      summary: raw.summary ?? undefined,
      url,
      publishedAt,
      sourceId: source.id,
      sourceName: source.name,
      categoryId: '',
      fetchedAt
    });
  }

  const limited = articles.slice(0, 10);
  logger.info({ sourceId: source.id, count: limited.length }, 'Scraped Anthropic posts');
  return limited;
}

export async function fetchAnthropicNews(source: SourceConfig): Promise<Article[]> {
  return fetchAnthropicPage(source, '/news');
}

export async function fetchAnthropicResearch(source: SourceConfig): Promise<Article[]> {
  return fetchAnthropicPage(source, '/research');
}
