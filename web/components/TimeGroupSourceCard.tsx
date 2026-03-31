'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { FetchResult, Article } from '@shared/types';

interface TimeGroupSourceCardProps {
  source: FetchResult;
  readArticleIds: Set<string>;
  onMarkRead: (id: string) => void;
}

const INITIAL_DISPLAY_COUNT = 5;

export default function TimeGroupSourceCard({ source, readArticleIds, onMarkRead }: TimeGroupSourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!isExpanded) setShowAll(false);
  }, [isExpanded]);
  
  const allArticles: Article[] = source.items
    .sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      
      return dateB - dateA;
    });
  
  if (allArticles.length === 0) {
    return null;
  }
  
  const unreadCount = allArticles.filter(a => !readArticleIds.has(a.id)).length;
  const displayedArticles = showAll ? allArticles : allArticles.slice(0, INITIAL_DISPLAY_COUNT);
  
  // Determine category label
  const categoryLabel = source.categoryId === 'news' ? '新闻' : 
                       source.categoryId === 'research' ? '研究' :
                       source.categoryId === 'tech' ? '技术' : 
                       source.categoryId === 'newsletters' ? '资讯' :
                       '其他';
  
  const statusBadge = source.fetchStatus === 'error' ? (
    <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
      失败
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
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-medium text-[hsl(var(--foreground))]">
                {source.sourceName}
              </h3>
              {/* Category Badge */}
              <span className="px-2 py-0.5 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-xs font-medium rounded-md">
                {categoryLabel}
              </span>
              {statusBadge}
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              {allArticles.length} 篇文章
              {source.fetchStatus === 'error' && source.errorMessage && (
                <span className="ml-2 text-red-600 dark:text-red-400">
                  · {source.errorMessage}
                </span>
              )}
            </p>
          </div>

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="flex-shrink-0 px-2.5 py-1 bg-[hsl(var(--primary))] text-white text-sm font-semibold rounded-full">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Visit Source Link - sibling of button, not nested inside */}
        {source.homepage && (
          <a
            href={source.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 mr-3 sm:mr-4 inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] transition-colors border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/30"
            title={`访问 ${source.sourceName}`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">访问源</span>
          </a>
        )}
      </div>
      
      {isExpanded && allArticles.length > 0 && (
        <div className="border-t border-[hsl(var(--border))]">
          {/* Article List - Card Style */}
          <div className="p-3 space-y-2">
            {displayedArticles.map(article => {
              const isRead = readArticleIds.has(article.id);
              
              // Format date
              let formattedDate = '日期未知';
              try {
                const publishDate = new Date(article.publishedAt);
                if (!isNaN(publishDate.getTime())) {
                  if (article.sourceId === 'github-trending' && article.timeRange) {
                    const rangeLabels = {
                      'daily': '今日热门',
                      'weekly': '本周热门',
                      'monthly': '本月热门'
                    };
                    formattedDate = rangeLabels[article.timeRange as keyof typeof rangeLabels] ?? article.timeRange ?? '未知';
                  } else {
                    formattedDate = new Intl.DateTimeFormat('zh-CN', { 
                      month: 'long', 
                      day: 'numeric' 
                    }).format(publishDate);
                  }
                }
              } catch (error) {
                console.error('Failed to format article date:', error);
              }
              
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
                    {/* Unread indicator */}
                    {!isRead && (
                      <span className="inline-flex flex-shrink-0 rounded-full h-1.5 w-1.5 bg-blue-500 mt-1.5" />
                    )}

                    {/* Content */}
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
                查看全部 {allArticles.length} 篇文章
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
