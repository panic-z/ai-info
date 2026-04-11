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

export function getArticleDisplayDate(article: Article, lang: 'zh' | 'en' = 'zh'): string {
  if (article.sourceId === 'github-trending' && article.timeRange) {
    return TRENDING_LABELS[lang][article.timeRange];
  }

  if (article.publishedLabel?.trim()) {
    return article.publishedLabel.trim();
  }

  try {
    const publishDate = new Date(article.publishedAt);
    if (!isNaN(publishDate.getTime())) {
      return format(publishDate, 'MMM d, yyyy', { locale: lang === 'zh' ? zhCN : enUS });
    }
  } catch {
    // Keep fallback text below
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

  try {
    const publishDate = new Date(article.publishedAt);
    if (!isNaN(publishDate.getTime())) {
      return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
        month: 'long',
        day: 'numeric'
      }).format(publishDate);
    }
  } catch {
    // Keep fallback text below
  }

  return lang === 'zh' ? '日期未知' : 'Unknown date';
}
