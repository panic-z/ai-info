export interface Article {
  id: string;
  title: string;
  summary?: string;
  url: string;
  publishedAt: string;
  author?: string;
  sourceId: string;
  sourceName: string;
  categoryId: string;
  fetchedAt: string;
  timeRange?: 'daily' | 'weekly' | 'monthly'; // For GitHub Trending
}

export interface SourceConfig {
  id: string;
  name: string;
  type: 'rss' | 'api' | 'scraper';
  url: string;
  homepage: string;
  enabled: boolean;
  fetchInterval: number;
}

export interface CategoryConfig {
  id: string;
  name: string;
  description?: string;
  sources: SourceConfig[];
}

export interface SourcesConfig {
  categories: CategoryConfig[];
}

export interface FetchResult {
  sourceId: string;
  sourceName: string;
  categoryId: string;
  homepage?: string;
  lastFetched: string;
  fetchStatus: 'success' | 'error' | 'partial';
  errorMessage: string | null;
  items: Article[];
}

export interface FetchError {
  sourceId: string;
  timestamp: string;
  error: string;
  message: string;
  retryCount: number;
}

export interface ErrorLog {
  errors: FetchError[];
}

export interface CategoryData {
  id: string;
  name: string;
  description?: string;
  sources: FetchResult[];
}

export interface AggregatedData {
  categories: CategoryData[];
  lastUpdated: string;
}
