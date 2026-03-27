'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Folder } from 'lucide-react';
import type { CategoryData, Article } from '@shared/types';
import ArticleCard from './ArticleCard';

interface CategoryCardProps {
  category: CategoryData;
  readArticleIds: Set<string>;
  onMarkRead: (id: string) => void;
}

const INITIAL_DISPLAY_COUNT = 5;

export default function CategoryCard({ category, readArticleIds, onMarkRead }: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  
  const allArticles: Article[] = category.sources
    .flatMap(source => source.items)
    .sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      
      // Handle invalid dates - push them to the end
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      
      return dateB - dateA;
    });
  
  // Don't render empty categories
  if (allArticles.length === 0) {
    return null;
  }
  
  const unreadCount = allArticles.filter(a => !readArticleIds.has(a.id)).length;
  const displayedArticles = showAll ? allArticles : allArticles.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <section className="bg-gradient-to-br from-white to-neutral-50/50 dark:from-neutral-800/50 dark:to-neutral-900/30 rounded-3xl border border-neutral-200/60 dark:border-neutral-700/50 overflow-hidden backdrop-blur-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-all duration-200"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center">
            <Folder className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 tracking-tight">
              {category.name}
            </h2>
            {category.description && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                {category.description}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <span className="ml-2 px-3 py-1 bg-primary-500/10 text-primary-700 dark:text-primary-300 text-sm font-semibold rounded-full border border-primary-500/20">
              {unreadCount} 新
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-6 h-6 text-neutral-400 transition-transform" />
        ) : (
          <ChevronDown className="w-6 h-6 text-neutral-400 transition-transform" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-6 pb-6 space-y-3">
          {displayedArticles.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              isRead={readArticleIds.has(article.id)}
              onMarkRead={onMarkRead}
            />
          ))}
          
          {allArticles.length > INITIAL_DISPLAY_COUNT && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full mt-4 py-3 px-4 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50/50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 rounded-xl transition-all duration-200 border border-primary-200/50 dark:border-primary-800/30"
            >
              加载更多 ({allArticles.length - INITIAL_DISPLAY_COUNT} 条)
            </button>
          )}
        </div>
      )}
    </section>
  );
}
