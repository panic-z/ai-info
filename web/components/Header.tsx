'use client';

import { useState, useEffect } from 'react';
import { formatTime } from '@/utils/formatTime';

type CategoryFilter = 'all' | 'news' | 'research' | 'tech' | 'podcast';
type Lang = 'zh' | 'en';

interface HeaderProps {
  lastUpdated?: string;
  activeCategoryFilter?: CategoryFilter;
  onCategoryFilterChange?: (category: CategoryFilter) => void;
  categoryFilterCounts?: {
    all: number;
    news: number;
    research: number;
    tech: number;
    podcast: number;
  };
  lang?: Lang;
  onLangChange?: (lang: Lang) => void;
}

export default function Header({
  lastUpdated,
  activeCategoryFilter = 'all',
  onCategoryFilterChange,
  categoryFilterCounts,
  lang = 'zh',
  onLangChange,
}: HeaderProps) {
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const direction = currentScrollY > lastScrollY ? 'down' : 'up';

          if (direction === 'down' && currentScrollY > 30) {
            setIsFiltersVisible(false);
          } else if (direction === 'up') {
            setIsFiltersVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const categoryFilters = lang === 'zh'
    ? [
        { id: 'all' as CategoryFilter, label: '全部' },
        { id: 'news' as CategoryFilter, label: '新闻' },
        { id: 'research' as CategoryFilter, label: '研究' },
        { id: 'tech' as CategoryFilter, label: '技术' },
        { id: 'podcast' as CategoryFilter, label: '自媒体' },
      ]
    : [
        { id: 'all' as CategoryFilter, label: 'All' },
        { id: 'news' as CategoryFilter, label: 'News' },
        { id: 'research' as CategoryFilter, label: 'Research' },
        { id: 'tech' as CategoryFilter, label: 'Tech' },
        { id: 'podcast' as CategoryFilter, label: 'Media' },
      ];

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-[hsl(var(--background))] to-[hsl(var(--background))]/95 backdrop-blur-xl border-b border-[hsl(var(--border))]/30 transition-all duration-300">
      <div
        className="max-w-6xl mx-auto px-4 sm:px-8 transition-all duration-200"
        style={{
          paddingTop: '1rem',
          paddingBottom: isFiltersVisible ? '1rem' : '0.5rem'
        }}
      >
        {/* Top bar */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-[hsl(var(--foreground))] to-[hsl(var(--foreground))]/70 bg-clip-text text-transparent whitespace-nowrap">
              AI Info
            </h1>
            <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] hidden sm:block">
              {lang === 'zh' ? '缓解你的AI信息fomo' : 'Stay up to date with AI'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1.5" suppressHydrationWarning>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="hidden sm:inline" suppressHydrationWarning>{lang === 'zh' ? '更新于' : 'Updated'}</span>{' '}
              <span suppressHydrationWarning>{formatTime(lastUpdated, lang)}</span>
            </p>
            {onLangChange && (
              <button
                onClick={() => onLangChange(lang === 'zh' ? 'en' : 'zh')}
                className="px-2.5 py-1 rounded-full text-xs font-medium border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]/30 hover:bg-[hsl(var(--accent))] transition-colors"
              >
                {lang === 'zh' ? 'EN' : '中'}
              </button>
            )}
          </div>
        </div>

        {/* Category filter - collapsible on scroll */}
        <div
          className="transition-all duration-200 ease-out"
          style={{
            maxHeight: isFiltersVisible ? '60px' : '0px',
            opacity: isFiltersVisible ? 1 : 0,
            overflow: 'hidden',
            transform: isFiltersVisible ? 'translateY(0)' : 'translateY(-10px)'
          }}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] mr-1.5">
              {lang === 'zh' ? '筛选:' : 'Filter:'}
            </span>
            {categoryFilters.map((filter) => {
              const isActive = activeCategoryFilter === filter.id;
              const count = categoryFilterCounts?.[filter.id] || 0;

              return (
                <button
                  key={filter.id}
                  onClick={() => onCategoryFilterChange?.(filter.id)}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                    transition-all duration-200
                    ${isActive
                      ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-sm'
                      : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]/80'
                    }
                  `}
                >
                  <span>{filter.label}</span>
                  <span className={`
                    inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-bold tabular-nums
                    ${isActive
                      ? 'bg-[hsl(var(--background))]/20 text-[hsl(var(--background))]'
                      : 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                    }
                  `}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
