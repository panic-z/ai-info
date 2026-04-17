'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { FetchResult, Article } from '@shared/types';
import { getArticleDisplayDateShort } from '@/utils/articleDate';

interface TimeGroupSourceCardProps {
  source: FetchResult;
  readArticleIds: Set<string>;
  onMarkRead: (id: string) => void;
  lang?: 'zh' | 'en';
}

const INITIAL_DISPLAY_COUNT = 5;

const TIME_RANGES_ZH = [
  { id: 'daily' as const, label: '今日' },
  { id: 'weekly' as const, label: '本周' },
  { id: 'monthly' as const, label: '本月' },
];

const TIME_RANGES_EN = [
  { id: 'daily' as const, label: 'Today' },
  { id: 'weekly' as const, label: 'This Week' },
  { id: 'monthly' as const, label: 'This Month' },
];

export default function TimeGroupSourceCard({ source, readArticleIds, onMarkRead, lang = 'zh' }: TimeGroupSourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Detect if this source uses timeRange-based filtering (e.g. GitHub Trending)
  const isTimeFilterable = source.items.some(a => a.timeRange);

  useEffect(() => {
    if (!isExpanded) setShowAll(false);
  }, [isExpanded]);

  // Reset showAll when range changes
  useEffect(() => {
    setShowAll(false);
  }, [selectedRange]);

  const sortedItems: Article[] = [...source.items].sort((a, b) => {
    const dateA = new Date(a.publishedAt ?? a.fetchedAt).getTime();
    const dateB = new Date(b.publishedAt ?? b.fetchedAt).getTime();
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateB - dateA;
  });

  const allArticles: Article[] = isTimeFilterable
    ? sortedItems.filter(a => a.timeRange === selectedRange)
    : sortedItems;

  if (allArticles.length === 0 && !isTimeFilterable) {
    return null;
  }

  const displayedArticles = showAll ? allArticles : allArticles.slice(0, INITIAL_DISPLAY_COUNT);

  const timeRanges = lang === 'en' ? TIME_RANGES_EN : TIME_RANGES_ZH;

  const categoryLabel = lang === 'zh'
    ? (source.categoryId === 'news' ? '新闻' :
       source.categoryId === 'research' ? '研究' :
       source.categoryId === 'tech' ? '技术' :
       source.categoryId === 'newsletters' ? '资讯' : '其他')
    : (source.categoryId === 'news' ? 'News' :
       source.categoryId === 'research' ? 'Research' :
       source.categoryId === 'tech' ? 'Tech' :
       source.categoryId === 'newsletters' ? 'Newsletter' : 'Other');

  const statusBadge = source.fetchStatus === 'error' ? (
    <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
      {lang === 'zh' ? '失败' : 'Failed'}
    </span>
  ) : null;

  return (
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden transition-[border-color,box-shadow] duration-300 hover:border-[hsl(var(--primary))]/30 hover:shadow-md">
      <div className="flex items-center hover:bg-[hsl(var(--accent))]/10 transition-colors">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 p-3 sm:p-4 text-left"
        >
          {/* Expand/Collapse Icon */}
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            )}
          </div>

          {/* Source Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-medium text-[hsl(var(--foreground))]">
                {source.sourceName}
              </h3>
              <span className="px-2 py-0.5 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-xs font-medium rounded-md">
                {categoryLabel}
              </span>
              {statusBadge}
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              {allArticles.length} {lang === 'zh' ? '篇文章' : 'articles'}
              {source.fetchStatus === 'error' && source.errorMessage && (
                <span className="ml-2 text-red-600 dark:text-red-400">
                  · {source.errorMessage}
                </span>
              )}
            </p>
          </div>

        </button>

        {/* Time range tabs - only for time-filterable sources */}
        {isTimeFilterable && (
          <div className="flex items-center gap-1 mr-2">
            {timeRanges.map(range => (
              <button
                key={range.id}
                onClick={() => setSelectedRange(range.id)}
                className={`
                  px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150
                  ${selectedRange === range.id
                    ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]'
                  }
                `}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}

        {/* Visit Source Link */}
        {source.homepage && (
          <a
            href={source.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 mr-3 sm:mr-4 inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] transition-colors border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/30"
            title={lang === 'zh' ? `访问 ${source.sourceName}` : `Visit ${source.sourceName}`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'zh' ? '访问源' : 'Visit'}</span>
          </a>
        )}
      </div>

      {isExpanded && allArticles.length > 0 && (
        <div className="border-t border-[hsl(var(--border))]">
          <div className="p-3 space-y-2">
            {displayedArticles.map(article => {
              const isRead = readArticleIds.has(article.id);
              const formattedDate = getArticleDisplayDateShort(article, lang);

              return (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onMarkRead(article.id)}
                  className="group block p-2 sm:p-3 rounded-lg hover:bg-[hsl(var(--accent))]/30 transition-colors border border-transparent hover:border-[hsl(var(--border))]"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    {!isRead && (
                      <span className="inline-flex flex-shrink-0 rounded-full h-1.5 w-1.5 bg-blue-500 mt-1.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium leading-snug mb-1 transition-colors ${
                        isRead
                          ? 'text-[hsl(var(--muted-foreground))]'
                          : 'text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))]'
                      }`}>
                        {article.title}
                      </h4>
                      {article.summary && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                      <span className="text-xs text-[hsl(var(--muted-foreground))] mt-1 inline-block" suppressHydrationWarning>
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          {allArticles.length > INITIAL_DISPLAY_COUNT && !showAll && (
            <div className="px-4 py-3 text-center border-t border-[hsl(var(--border))]">
              <button
                onClick={() => setShowAll(true)}
                className="text-sm text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 font-medium transition-colors"
              >
                {lang === 'zh' ? `查看全部 ${allArticles.length} 篇文章` : `Show all ${allArticles.length} articles`}
              </button>
            </div>
          )}
        </div>
      )}

      {isExpanded && isTimeFilterable && allArticles.length === 0 && (
        <div className="border-t border-[hsl(var(--border))] px-4 py-6 text-center">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{lang === 'zh' ? '暂无数据' : 'No data'}</p>
        </div>
      )}
    </div>
  );
}
