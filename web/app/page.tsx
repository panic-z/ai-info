'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import TimeGroupSourceCard from '@/components/TimeGroupSourceCard';
import { isInToday, isInThisWeek, isInThisMonth } from '@/utils/timeUtils';
import type { AggregatedData, FetchResult } from '@shared/types';

const MAX_READ_ARTICLES = 1000;

interface TimeGroupedData {
  today: FetchResult[];
  thisWeek: FetchResult[];
  thisMonth: FetchResult[];
}

function groupArticlesByTime(data: AggregatedData): TimeGroupedData {
  // Flatten all sources from all categories
  const allSources = data.categories.flatMap(cat => cat.sources);
  
  // Helper to filter articles by time and regroup by source
  const filterByTime = (
    sources: FetchResult[],
    timeFilter: (date: string, timeRange?: string) => boolean
  ): FetchResult[] => {
    return sources
      .map(source => ({
        ...source,
        items: source.items.filter(article => timeFilter(article.publishedAt, article.timeRange))
      }))
      .filter(source => source.items.length > 0);
  };
  
  return {
    today: filterByTime(allSources, isInToday),
    thisWeek: filterByTime(allSources, isInThisWeek),
    thisMonth: filterByTime(allSources, isInThisMonth),
  };
}

export default function Home() {
  const [data, setData] = useState<AggregatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readArticleIds, setReadArticleIds] = useState<Set<string>>(new Set());
  const [activeTimePeriod, setActiveTimePeriod] = useState<'today' | 'thisWeek' | 'thisMonth'>('today');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'news' | 'research' | 'tech' | 'podcast'>('all');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('readArticleIds');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setReadArticleIds(new Set(parsed));
        }
      }
    } catch (error) {
      console.error('Failed to load read articles from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem('readArticleIds');
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setReadArticleIds(prev => {
      const next = new Set(prev);
      next.add(id);
      
      // Limit localStorage size to prevent quota errors
      let idsToSave = Array.from(next);
      if (idsToSave.length > MAX_READ_ARTICLES) {
        idsToSave = idsToSave.slice(-MAX_READ_ARTICLES);
      }
      
      try {
        localStorage.setItem('readArticleIds', JSON.stringify(idsToSave));
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded, clearing old data');
          // Keep only last 500 and try again
          idsToSave = idsToSave.slice(-500);
          try {
            localStorage.setItem('readArticleIds', JSON.stringify(idsToSave));
          } catch {
            console.error('Failed to save even after truncating');
          }
        } else {
          console.error('Failed to save to localStorage:', error);
        }
      }
      return next;
    });
  }, []);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch('/api/sources', { signal });
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Invalid JSON response from server');
      }
      
      setData(result);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Fetch was cancelled, ignore
        return;
      }
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    fetchData(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fetchData]);

  // Group articles by time (memoized for performance)
  const groupedData = useMemo(() => {
    if (!data) return null;
    return groupArticlesByTime(data);
  }, [data]);

  // Calculate article counts for each time period
  const timePeriodCounts = useMemo(() => {
    if (!groupedData) return { today: 0, thisWeek: 0, thisMonth: 0 };
    
    return {
      today: groupedData.today.reduce((sum, source) => sum + source.items.length, 0),
      thisWeek: groupedData.thisWeek.reduce((sum, source) => sum + source.items.length, 0),
      thisMonth: groupedData.thisMonth.reduce((sum, source) => sum + source.items.length, 0),
    };
  }, [groupedData]);

  // Get current time period data with category filter
  const currentSources = useMemo(() => {
    if (!groupedData) return [];
    let sources = groupedData[activeTimePeriod] || [];
    
    // Apply category filter
    if (activeCategoryFilter !== 'all') {
      sources = sources.filter(source => source.categoryId === activeCategoryFilter);
    }
    
    return sources;
  }, [groupedData, activeTimePeriod, activeCategoryFilter]);

  // Calculate category filter counts for current time period
  const categoryFilterCounts = useMemo(() => {
    if (!groupedData) return { all: 0, news: 0, research: 0, tech: 0, podcast: 0 };

    const sources = groupedData[activeTimePeriod] || [];
    const allCount = sources.reduce((sum, source) => sum + source.items.length, 0);
    const newsCount = sources
      .filter(s => s.categoryId === 'news')
      .reduce((sum, source) => sum + source.items.length, 0);
    const researchCount = sources
      .filter(s => s.categoryId === 'research')
      .reduce((sum, source) => sum + source.items.length, 0);
    const techCount = sources
      .filter(s => s.categoryId === 'tech')
      .reduce((sum, source) => sum + source.items.length, 0);
    const podcastCount = sources
      .filter(s => s.categoryId === 'podcast')
      .reduce((sum, source) => sum + source.items.length, 0);

    return {
      all: allCount,
      news: newsCount,
      research: researchCount,
      tech: techCount,
      podcast: podcastCount,
    };
  }, [groupedData, activeTimePeriod]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))]">
        <Header
          activeTimePeriod={activeTimePeriod}
          onTimePeriodChange={setActiveTimePeriod}
          timePeriodCounts={{ today: 0, thisWeek: 0, thisMonth: 0 }}
          activeCategoryFilter={activeCategoryFilter}
          onCategoryFilterChange={setActiveCategoryFilter}
          categoryFilterCounts={{ all: 0, news: 0, research: 0, tech: 0, podcast: 0 }}
        />
        <main className="max-w-6xl mx-auto px-8 py-16">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-8 h-8 text-[hsl(var(--primary))] animate-spin" />
            <p className="text-[hsl(var(--muted-foreground))] font-medium">加载中...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))]">
        <Header
          activeTimePeriod={activeTimePeriod}
          onTimePeriodChange={setActiveTimePeriod}
          timePeriodCounts={{ today: 0, thisWeek: 0, thisMonth: 0 }}
          activeCategoryFilter={activeCategoryFilter}
          onCategoryFilterChange={setActiveCategoryFilter}
          categoryFilterCounts={{ all: 0, news: 0, research: 0, tech: 0, podcast: 0 }}
        />
        <main className="max-w-6xl mx-auto px-8 py-16">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center max-w-md">
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                {error || '暂无数据'}
              </h2>
              <p className="text-[hsl(var(--muted-foreground))] mb-6">
                请先运行抓取服务以获取最新的 AI 资讯
              </p>
              <code className="inline-block bg-[hsl(var(--card))] text-[hsl(var(--foreground))] px-4 py-2 rounded-lg font-mono text-sm border border-[hsl(var(--border))]">
                npm run fetch
              </code>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Header 
        lastUpdated={data.lastUpdated} 
        activeTimePeriod={activeTimePeriod}
        onTimePeriodChange={setActiveTimePeriod}
        timePeriodCounts={timePeriodCounts}
        activeCategoryFilter={activeCategoryFilter}
        onCategoryFilterChange={setActiveCategoryFilter}
        categoryFilterCounts={categoryFilterCounts}
      />
      <main className="max-w-[1600px] mx-auto px-8 py-4">
        {currentSources.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* Left column */}
            <div className="flex flex-col gap-4">
              {currentSources.filter((_, i) => i % 2 === 0).map((source) => (
                <TimeGroupSourceCard
                  key={source.sourceId}
                  source={source}
                  readArticleIds={readArticleIds}
                  onMarkRead={markAsRead}
                />
              ))}
            </div>
            {/* Right column */}
            <div className="flex flex-col gap-4">
              {currentSources.filter((_, i) => i % 2 === 1).map((source) => (
                <TimeGroupSourceCard
                  key={source.sourceId}
                  source={source}
                  readArticleIds={readArticleIds}
                  onMarkRead={markAsRead}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <p className="text-[hsl(var(--muted-foreground))] font-medium">
              该时间段暂无文章
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
