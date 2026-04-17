import axios from 'axios';
import crypto from 'crypto';
import type { SourceConfig, Article } from '../../../shared/types';
import { logger } from '../core/logger';

function generateArticleId(sourceId: string, url: string, title: string): string {
  const hash = crypto.createHash('md5').update(`${url}|${title}`).digest('hex').substring(0, 16);
  return `${sourceId}-${hash}`;
}

interface EngineeringArticle {
  _type: string;
  slug?: { current?: string };
  title?: string;
  summary?: string;
  publishedOn?: string | null;
}

function findArticles(node: unknown): EngineeringArticle[] {
  const results: EngineeringArticle[] = [];

  function traverse(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      for (const item of obj) traverse(item);
      return;
    }

    const record = obj as Record<string, unknown>;

    if (record._type === 'engineeringArticle' && typeof record.title === 'string') {
      results.push(record as unknown as EngineeringArticle);
      return;
    }

    for (const value of Object.values(record)) {
      traverse(value);
    }
  }

  traverse(node);
  return results;
}

export async function fetchAnthropicEngineering(source: SourceConfig): Promise<Article[]> {
  logger.info({ sourceId: source.id }, 'Scraping Anthropic Engineering page');

  const response = await axios.get(source.url, {
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });

  const html: string = response.data;

  // Next.js App Router embeds RSC payloads as self.__next_f.push([1, "escaped-string"])
  // The string is RSC format: "id:json_value\n..." lines
  const pushPattern = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\[\s\S])*)"\]\)/g;
  const allArticles: EngineeringArticle[] = [];

  let match;
  while ((match = pushPattern.exec(html)) !== null) {
    let rscText: string;
    try {
      rscText = JSON.parse(`"${match[1]}"`);
    } catch {
      continue;
    }

    // RSC lines: "id:value\n" — split and parse each line's JSON value
    for (const line of rscText.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const jsonStr = line.substring(colonIdx + 1).trim();
      if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) continue;
      try {
        const data = JSON.parse(jsonStr);
        const found = findArticles(data);
        if (found.length > 0) allArticles.push(...found);
      } catch {
        // not valid JSON, skip
      }
    }
  }

  if (allArticles.length === 0) {
    throw new Error('No engineering articles found in page RSC payload');
  }

  const fetchedAt = new Date().toISOString();
  const seen = new Set<string>();
  const articles: Article[] = [];

  for (const raw of allArticles) {
    const slug = raw.slug?.current;
    const title = raw.title;
    if (!slug || !title) continue;

    const url = `https://www.anthropic.com/engineering/${slug}`;
    if (seen.has(url)) continue;
    seen.add(url);

    const publishedAt = raw.publishedOn
      ? new Date(raw.publishedOn).toISOString()
      : undefined;

    articles.push({
      id: generateArticleId(source.id, url, title),
      title,
      summary: raw.summary ?? undefined,
      url,
      publishedAt,
      publishedLabel: raw.publishedOn ?? undefined,
      sourceId: source.id,
      sourceName: source.name,
      categoryId: '',
      fetchedAt
    });
  }

  const limited = articles.slice(0, 10);
  logger.info({ sourceId: source.id, count: limited.length }, 'Scraped Anthropic Engineering articles');
  return limited;
}
