import { describe, it, expect } from 'vitest';
import type { Article } from '@shared/types';
import { getArticleDisplayDate, getArticleDisplayDateShort } from './articleDate';

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 'a1',
    title: 'Test Article',
    url: 'https://example.com',
    publishedAt: '2026-04-12T10:00:00.000Z',
    sourceId: 'test-source',
    sourceName: 'Test Source',
    categoryId: 'news',
    fetchedAt: '2026-04-12T11:00:00.000Z',
    ...overrides,
  };
}

describe('article date display helpers', () => {
  it('uses source publishedLabel before publishedAt', () => {
    const article = makeArticle({
      publishedLabel: 'Apr 2, 2026',
      publishedAt: '2026-04-12T10:00:00.000Z',
    });

    expect(getArticleDisplayDate(article, 'en')).toBe('Apr 2, 2026');
    expect(getArticleDisplayDateShort(article, 'en')).toBe('Apr 2, 2026');
  });

  it('uses trending labels for github-trending source', () => {
    const article = makeArticle({
      sourceId: 'github-trending',
      timeRange: 'weekly',
      publishedLabel: 'should-not-be-used',
    });

    expect(getArticleDisplayDate(article, 'zh')).toBe('本周热门');
    expect(getArticleDisplayDateShort(article, 'en')).toBe('Trending this week');
  });

  it('falls back to unknown text for invalid publishedAt', () => {
    const article = makeArticle({ publishedAt: 'not-a-date' });

    expect(getArticleDisplayDate(article, 'zh')).toBe('日期未知');
    expect(getArticleDisplayDateShort(article, 'en')).toBe('Unknown date');
  });
});
