import { format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import type { Article } from '@shared/types';

const TRENDING_LABELS = {
  zh: {
    daily: '今日热门',
    weekly: '本周热门',
    monthly: '本月热门'
  },
  en: {
    daily: 'Trending today',
    weekly: 'Trending this week',
    monthly: 'Trending this month'
  }
} as const;

// Legacy data may have publishedAt populated as a fallback to fetchedAt when
// the source didn't expose a real publish date. Treat that case as missing.
function getRealPublishedAt(article: Article): string | undefined {
  if (!article.publishedAt) return undefined;
  if (article.publishedAt === article.fetchedAt) return undefined;
  return article.publishedAt;
}

export function getArticleDisplayDate(article: Article, lang: 'zh' | 'en' = 'zh'): string {
  if (article.sourceId === 'github-trending' && article.timeRange) {
    return TRENDING_LABELS[lang][article.timeRange];
  }

  if (article.publishedLabel?.trim()) {
    return article.publishedLabel.trim();
  }

  const publishedAt = getRealPublishedAt(article);
  if (publishedAt) {
    const publishDate = new Date(publishedAt);
    if (!isNaN(publishDate.getTime())) {
      return format(publishDate, 'MMM d, yyyy', { locale: lang === 'zh' ? zhCN : enUS });
    }
  }

  return lang === 'zh' ? '日期未知' : 'Unknown date';
}

export function getArticleDisplayDateShort(article: Article, lang: 'zh' | 'en' = 'zh'): string {
  if (article.sourceId === 'github-trending' && article.timeRange) {
    return TRENDING_LABELS[lang][article.timeRange];
  }

  if (article.publishedLabel?.trim()) {
    return article.publishedLabel.trim();
  }

  const publishedAt = getRealPublishedAt(article);
  if (publishedAt) {
    const publishDate = new Date(publishedAt);
    if (!isNaN(publishDate.getTime())) {
      return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
        month: 'long',
        day: 'numeric'
      }).format(publishDate);
    }
  }

  return lang === 'zh' ? '日期未知' : 'Unknown date';
}
