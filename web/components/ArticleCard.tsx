'use client';

import type { Article } from '@shared/types';
import { getArticleDisplayDate } from '@/utils/articleDate';

interface ArticleCardProps {
  article: Article;
  isRead?: boolean;
  onMarkRead?: (id: string) => void;
}

export default function ArticleCard({ article, isRead, onMarkRead }: ArticleCardProps) {
  const formattedDate = getArticleDisplayDate(article, 'zh');

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onMarkRead?.(article.id)}
      className="group grid grid-cols-[140px_1fr_2fr] gap-4 py-3 px-4 border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--accent))]/30 transition-colors"
    >
      {/* Date Column */}
      <div className="flex flex-col justify-center gap-0.5 text-sm text-[hsl(var(--muted-foreground))]">
        <div className="flex items-center gap-2">
          {!isRead && (
            <span className="inline-flex flex-shrink-0 rounded-full h-1.5 w-1.5 bg-blue-500" />
          )}
          <span>{formattedDate}</span>
        </div>
        {(article.episodeNumber !== undefined || article.duration) && (
          <div className="flex items-center gap-1.5 text-xs pl-3.5">
            {article.episodeNumber !== undefined && (
              <span>EP.{article.episodeNumber}</span>
            )}
            {article.duration && (
              <span>🎙 {article.duration}</span>
            )}
          </div>
        )}
      </div>

      {/* Title Column with hover tooltip */}
      <div className="flex items-center min-w-0">
        <h3 
          className={`text-sm font-normal leading-snug truncate transition-colors ${
            isRead 
              ? 'text-[hsl(var(--muted-foreground))]' 
              : 'text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))]'
          }`}
          title={article.title}
        >
          {article.title}
        </h3>
      </div>

      {/* Summary Column with hover tooltip */}
      <div className="flex items-center min-w-0">
        <p 
          className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-1"
          title={article.summary || '暂无简介'}
        >
          {article.summary || '暂无简介'}
        </p>
      </div>
    </a>
  );
}
