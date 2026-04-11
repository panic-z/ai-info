'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import TimeGroupSourceCard from '@/components/TimeGroupSourceCard';
import type { AggregatedData } from '@shared/types';

const MAX_READ_ARTICLES = 1000;

type Lang = 'zh' | 'en';

export default function HomeClient({
  initialData,
}: {
  initialData: AggregatedData | null;
}) {
  const [data, setData] = useState<AggregatedData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [readArticleIds, setReadArticleIds] = useState<Set<string>>(new Set());
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'news' | 'research' | 'tech' | 'podcast'>('all');
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

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
      localStorage.removeItem('readArticleIds');
    }

    const storedLang = localStorage.getItem('lang');
    if (storedLang === 'en' || storedLang === 'zh') {
      setLang(storedLang);
    }
  }, []);

  const handleLangChange = useCallback((newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setReadArticleIds(prev => {
      const next = new Set(prev);
      next.add(id);

      let idsToSave = Array.from(next);
      if (idsToSave.length > MAX_READ_ARTICLES) {
        idsToSave = idsToSave.slice(-MAX_READ_ARTICLES);
      }

      try {
        localStorage.setItem('readArticleIds', JSON.stringify(idsToSave));
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
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
      setLoading(!data);
      const response = await fetch('/api/sources', { signal });
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchData(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchData]);

  const currentSources = useMemo(() => {
    if (!data) return [];
    const allSources = data.categories.flatMap(cat => cat.sources);
    if (activeCategoryFilter === 'all') return allSources;
    return allSources.filter(source => source.categoryId === activeCategoryFilter);
  }, [data, activeCategoryFilter]);

  const categoryFilterCounts = useMemo(() => {
    if (!data) return { all: 0, news: 0, research: 0, tech: 0, podcast: 0 };
    const allSources = data.categories.flatMap(cat => cat.sources);
    const countItems = (source: typeof allSources[0]) => {
      const isTimeFilterable = source.items.some(a => a.timeRange);
      return isTimeFilterable
        ? source.items.filter(a => a.timeRange === 'daily').length
        : source.items.length;
    };
    const count = (catId: string) =>
      allSources
        .filter(s => s.categoryId === catId)
        .reduce((sum, s) => sum + countItems(s), 0);
    return {
      all: allSources.reduce((sum, s) => sum + countItems(s), 0),
      news: count('news'),
      research: count('research'),
      tech: count('tech'),
      podcast: count('podcast'),
    };
  }, [data]);

  const headerProps = {
    activeCategoryFilter,
    onCategoryFilterChange: setActiveCategoryFilter,
    lang,
    onLangChange: handleLangChange,
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))]">
        <Header
          {...headerProps}
          categoryFilterCounts={{ all: 0, news: 0, research: 0, tech: 0, podcast: 0 }}
        />
        <main className="max-w-6xl mx-auto px-4 sm:px-8 py-16">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-8 h-8 text-[hsl(var(--primary))] animate-spin" />
            <p className="text-[hsl(var(--muted-foreground))] font-medium">
              {lang === 'zh' ? '加载中...' : 'Loading...'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))]">
        <Header
          {...headerProps}
          categoryFilterCounts={{ all: 0, news: 0, research: 0, tech: 0, podcast: 0 }}
        />
        <main className="max-w-6xl mx-auto px-4 sm:px-8 py-16">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center max-w-md">
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                {error || (lang === 'zh' ? '暂无数据' : 'No data')}
              </h2>
              <p className="text-[hsl(var(--muted-foreground))] mb-6">
                {lang === 'zh'
                  ? '请先运行抓取服务以获取最新的 AI 资讯'
                  : 'Run the fetcher service to get the latest AI news'}
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
        {...headerProps}
        lastUpdated={data.lastUpdated}
        categoryFilterCounts={categoryFilterCounts}
      />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-4">
        <section className="max-w-5xl mb-8 pt-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            {lang === 'zh' ? '聚合 AI 新闻、研究与工程更新' : 'Curated AI news, research, and engineering updates'}
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-8 text-[hsl(var(--muted-foreground))]">
            {lang === 'zh'
              ? 'AI Info 以可抓取、可浏览的方式聚合主要实验室、公司与社区的 AI 新闻、研究文章、工程博客和产品动态。你可以按分类浏览来源，快速判断当天最值得看的更新。'
              : 'AI Info brings together AI news, research posts, engineering write-ups, and product announcements from major labs, companies, and communities in one crawlable hub.'}
          </p>
        </section>
        {currentSources.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className="flex flex-col gap-4">
              {currentSources.filter((_, i) => i % 2 === 0).map((source) => (
                <TimeGroupSourceCard
                  key={source.sourceId}
                  source={source}
                  readArticleIds={readArticleIds}
                  onMarkRead={markAsRead}
                  lang={lang}
                />
              ))}
            </div>
            <div className="flex flex-col gap-4">
              {currentSources.filter((_, i) => i % 2 === 1).map((source) => (
                <TimeGroupSourceCard
                  key={source.sourceId}
                  source={source}
                  readArticleIds={readArticleIds}
                  onMarkRead={markAsRead}
                  lang={lang}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <p className="text-[hsl(var(--muted-foreground))] font-medium">
              {lang === 'zh' ? '暂无文章' : 'No articles'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
