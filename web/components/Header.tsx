'use client';

import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { formatTime } from '@/utils/formatTime';

type TimePeriod = 'today' | 'thisWeek' | 'thisMonth';
type CategoryFilter = 'all' | 'news' | 'research' | 'tech';

interface HeaderProps {
  lastUpdated?: string;
  activeTimePeriod?: TimePeriod;
  onTimePeriodChange?: (period: TimePeriod) => void;
  timePeriodCounts?: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  activeCategoryFilter?: CategoryFilter;
  onCategoryFilterChange?: (category: CategoryFilter) => void;
  categoryFilterCounts?: {
    all: number;
    news: number;
    research: number;
    tech: number;
  };
}

export default function Header({ 
  lastUpdated, 
  activeTimePeriod = 'today',
  onTimePeriodChange,
  timePeriodCounts,
  activeCategoryFilter = 'all',
  onCategoryFilterChange,
  categoryFilterCounts
}: HeaderProps) {
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const direction = currentScrollY > lastScrollY ? 'down' : 'up';
          
          setScrollDirection(direction);
          
          // 向下滚动且超过 30px 时隐藏筛选项（降低阈值使其更灵敏）
          if (direction === 'down' && currentScrollY > 30) {
            setIsFiltersVisible(false);
          } else if (direction === 'up') {
            // 向上滚动时立即显示筛选项
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

  const timePeriods = [
    { id: 'today' as TimePeriod, label: '今日', sublabel: 'Today' },
    { id: 'thisWeek' as TimePeriod, label: '本周', sublabel: 'This Week' },
    { id: 'thisMonth' as TimePeriod, label: '本月', sublabel: 'This Month' },
  ];

  const categoryFilters = [
    { id: 'all' as CategoryFilter, label: '全部' },
    { id: 'news' as CategoryFilter, label: '新闻' },
    { id: 'research' as CategoryFilter, label: '研究' },
    { id: 'tech' as CategoryFilter, label: '技术' },
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
        {/* Top bar - 减少上下 padding */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-[hsl(var(--foreground))] to-[hsl(var(--foreground))]/70 bg-clip-text text-transparent whitespace-nowrap">
              AI Info
            </h1>
            <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] hidden sm:block">
              缓解你的AI信息fomo
            </p>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1.5 flex-shrink-0" suppressHydrationWarning>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="hidden sm:inline" suppressHydrationWarning>更新于</span>{' '}
            <span suppressHydrationWarning>{formatTime(lastUpdated)}</span>
          </p>
        </div>

        {/* Filters - collapsible on scroll with improved animation */}
        <div 
          className="transition-all duration-200 ease-out"
          style={{
            maxHeight: isFiltersVisible ? '120px' : '0px',
            opacity: isFiltersVisible ? 1 : 0,
            overflow: 'hidden',
            transform: isFiltersVisible ? 'translateY(0)' : 'translateY(-10px)'
          }}
        >
          {/* Time period filters */}
          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-[hsl(var(--border))]/30 flex-wrap">
          <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] mr-1.5">时间:</span>
          {timePeriods.map((period) => {
            const isActive = activeTimePeriod === period.id;
            const count = timePeriodCounts?.[period.id] || 0;
            
            return (
              <button
                key={period.id}
                onClick={() => onTimePeriodChange?.(period.id)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-sm' 
                    : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]/80'
                  }
                `}
              >
                <span>{period.label}</span>
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

        {/* Category filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] mr-1.5">筛选:</span>
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
