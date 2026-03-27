'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';
import type { FetchResult } from '@shared/types';
import TimeGroupSourceCard from './TimeGroupSourceCard';

interface TimeSectionProps {
  title: string;
  sources: FetchResult[];
  readArticleIds: Set<string>;
  onMarkRead: (id: string) => void;
  defaultExpanded?: boolean;
  icon?: 'calendar' | 'clock';
}

export default function TimeSection({
  title,
  sources,
  readArticleIds,
  onMarkRead,
  defaultExpanded = false,
  icon = 'calendar'
}: TimeSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  // Calculate total articles
  const totalArticles = sources.reduce((sum, source) => sum + source.items.length, 0);
  
  // Don't render if no articles
  if (totalArticles === 0) {
    return null;
  }
  
  const Icon = icon === 'calendar' ? Calendar : Clock;
  
  return (
    <section className="bg-[hsl(var(--accent))]/20 rounded-2xl border border-[hsl(var(--border))] p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-[hsl(var(--primary))]" />
          <h2 className="text-2xl font-medium text-[hsl(var(--foreground))]">
            {title}
          </h2>
          <span className="text-sm text-[hsl(var(--muted-foreground))] font-medium">
            ({totalArticles} 篇文章)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
        )}
      </button>
      
      {isExpanded && (
        <div className="space-y-3">
          {sources.map(source => (
            <TimeGroupSourceCard
              key={source.sourceId}
              source={source}
              readArticleIds={readArticleIds}
              onMarkRead={onMarkRead}
            />
          ))}
        </div>
      )}
    </section>
  );
}
