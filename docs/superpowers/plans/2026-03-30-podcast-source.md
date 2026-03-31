# Podcast 消息源 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 ai-info 中新增可扩展的 Podcast RSS 分类，支持解析 iTunes 命名空间字段，并在前端以轻度差异化方式显示时长和剧集编号。

**Architecture:** 扩展 `Article` 类型增加三个可选字段（`audioUrl`、`duration`、`episodeNumber`），RSS 适配器解析 iTunes 命名空间，`sources.json` 新增 `podcast` 分类，前端 Header/ArticleCard 同步更新。所有现有源完全不受影响（新字段为可选）。

**Tech Stack:** TypeScript, rss-parser (already installed), Next.js, Vitest (web tests)

---

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `shared/types.ts` | 修改：`Article` 增加 3 个可选字段 |
| `fetcher/src/adapters/rss.ts` | 修改：解析 iTunes namespace 字段并映射到 Article |
| `fetcher/config/sources.json` | 修改：新增 `podcast` 分类 |
| `web/components/Header.tsx` | 修改：`CategoryFilter` 类型 + 接口 + Podcast Tab |
| `web/components/ArticleCard.tsx` | 修改：条件渲染 duration / episodeNumber 标签 |
| `web/app/page.tsx` | 修改：`activeCategoryFilter` 类型 + podcast 计数 |

---

## Task 1: 扩展 Article 类型

**Files:**
- Modify: `shared/types.ts`

- [ ] **Step 1: 在 `Article` 接口末尾添加三个可选字段**

打开 `shared/types.ts`，将 `Article` 接口从：

```ts
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
```

改为：

```ts
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
  audioUrl?: string;      // Podcast: audio file URL from RSS <enclosure>
  duration?: string;      // Podcast: episode duration, e.g. "1:23:45"
  episodeNumber?: number; // Podcast: episode number from itunes:episode
}
```

- [ ] **Step 2: 验证 TypeScript 编译通过**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info/fetcher && npx tsc --noEmit
```

期望输出：无错误（或只有与本次改动无关的已有警告）。

- [ ] **Step 3: Commit**

```bash
git add shared/types.ts
git commit -m "feat: extend Article type with podcast fields (audioUrl, duration, episodeNumber)"
```

---

## Task 2: 扩展 RSS 适配器解析 iTunes 字段

**Files:**
- Modify: `fetcher/src/adapters/rss.ts`

- [ ] **Step 1: 更新 rss-parser 的 customFields 配置**

打开 `fetcher/src/adapters/rss.ts`，将 parser 初始化从：

```ts
const parser = new Parser({
  timeout: 30000,
  customFields: {
    item: ['contentSnippet', 'content']
  }
});
```

改为：

```ts
const parser = new Parser({
  timeout: 30000,
  customFields: {
    item: [
      'contentSnippet', 'content',
      ['itunes:duration', 'itunesDuration'],
      ['itunes:episode', 'itunesEpisode'],
    ]
  }
});
```

- [ ] **Step 2: 在 Article 映射中填充新字段**

在 `fetchRSS` 函数的 `.map((item: any) => ({...}))` 中，在 `fetchedAt` 之后添加三个字段。将整个 return 语句从：

```ts
    return (feed.items || []).slice(0, 100).map((item: any) => ({
      id: generateArticleId(source.id, item.link || '', item.title || ''),
      title: item.title || 'Untitled',
      summary: item.contentSnippet || item.content?.replace(/<[^>]*>/g, '').substring(0, 200),
      url: item.link || '',
      publishedAt: item.isoDate || item.pubDate || fetchedAt,
      author: item.creator || item.author,
      sourceId: source.id,
      sourceName: source.name,
      categoryId: '',
      fetchedAt
    }));
```

改为：

```ts
    return (feed.items || []).slice(0, 100).map((item: any) => ({
      id: generateArticleId(source.id, item.link || '', item.title || ''),
      title: item.title || 'Untitled',
      summary: item.contentSnippet || item.content?.replace(/<[^>]*>/g, '').substring(0, 200),
      url: item.link || '',
      publishedAt: item.isoDate || item.pubDate || fetchedAt,
      author: item.creator || item.author,
      sourceId: source.id,
      sourceName: source.name,
      categoryId: '',
      fetchedAt,
      audioUrl: item.enclosure?.url,
      duration: item.itunesDuration,
      episodeNumber: item.itunesEpisode ? Number(item.itunesEpisode) : undefined,
    }));
```

- [ ] **Step 3: 验证编译通过**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info/fetcher && npx tsc --noEmit
```

期望输出：无错误。

- [ ] **Step 4: Commit**

```bash
git add fetcher/src/adapters/rss.ts
git commit -m "feat: parse iTunes namespace fields (duration, episode) in RSS adapter"
```

---

## Task 3: 在 sources.json 新增 Podcast 分类

**Files:**
- Modify: `fetcher/config/sources.json`

- [ ] **Step 1: 追加 podcast 分类到 categories 数组末尾**

打开 `fetcher/config/sources.json`，在最后一个分类（`tech`）的闭合 `}` 后，在 `]` 之前追加：

```json
    ,
    {
      "id": "podcast",
      "name": "AI Podcast",
      "description": "AI 领域优质播客节目",
      "sources": [
        {
          "id": "lex-fridman",
          "name": "Lex Fridman Podcast",
          "type": "rss",
          "url": "https://lexfridman.com/feed/podcast/",
          "homepage": "https://lexfridman.com/podcast",
          "enabled": true,
          "fetchInterval": 86400
        }
      ]
    }
```

完整的 `categories` 数组末尾应如下所示：

```json
        ...
        {
          "id": "anthropic-engineering",
          ...
        }
      ]
    },
    {
      "id": "podcast",
      "name": "AI Podcast",
      "description": "AI 领域优质播客节目",
      "sources": [
        {
          "id": "lex-fridman",
          "name": "Lex Fridman Podcast",
          "type": "rss",
          "url": "https://lexfridman.com/feed/podcast/",
          "homepage": "https://lexfridman.com/podcast",
          "enabled": true,
          "fetchInterval": 86400
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: 验证 JSON 格式正确**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info && node -e "JSON.parse(require('fs').readFileSync('fetcher/config/sources.json', 'utf-8')); console.log('JSON valid')"
```

期望输出：`JSON valid`

- [ ] **Step 3: Commit**

```bash
git add fetcher/config/sources.json
git commit -m "feat: add podcast category with Lex Fridman source"
```

---

## Task 4: 更新 Header 组件支持 podcast 过滤器

**Files:**
- Modify: `web/components/Header.tsx`

- [ ] **Step 1: 扩展 CategoryFilter 类型**

打开 `web/components/Header.tsx`，将第 8 行从：

```ts
type CategoryFilter = 'all' | 'news' | 'research' | 'tech';
```

改为：

```ts
type CategoryFilter = 'all' | 'news' | 'research' | 'tech' | 'podcast';
```

- [ ] **Step 2: 扩展 HeaderProps 中的 categoryFilterCounts 接口**

将 `categoryFilterCounts` 接口从：

```ts
  categoryFilterCounts?: {
    all: number;
    news: number;
    research: number;
    tech: number;
  };
```

改为：

```ts
  categoryFilterCounts?: {
    all: number;
    news: number;
    research: number;
    tech: number;
    podcast: number;
  };
```

- [ ] **Step 3: 在 categoryFilters 数组中追加 Podcast 选项**

将 `categoryFilters` 数组从：

```ts
  const categoryFilters = [
    { id: 'all' as CategoryFilter, label: '全部' },
    { id: 'news' as CategoryFilter, label: '新闻' },
    { id: 'research' as CategoryFilter, label: '研究' },
    { id: 'tech' as CategoryFilter, label: '技术' },
  ];
```

改为：

```ts
  const categoryFilters = [
    { id: 'all' as CategoryFilter, label: '全部' },
    { id: 'news' as CategoryFilter, label: '新闻' },
    { id: 'research' as CategoryFilter, label: '研究' },
    { id: 'tech' as CategoryFilter, label: '技术' },
    { id: 'podcast' as CategoryFilter, label: 'Podcast' },
  ];
```

- [ ] **Step 4: 验证 TypeScript 编译通过**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info/web && npx tsc --noEmit
```

期望：无新增错误（TypeScript 会在 page.tsx 尚未更新时报错，这是预期中的临时状态，Task 6 会修复）。

- [ ] **Step 5: Commit**

```bash
git add web/components/Header.tsx
git commit -m "feat: add podcast filter tab to Header component"
```

---

## Task 5: 更新 ArticleCard 显示 Podcast 元数据

**Files:**
- Modify: `web/components/ArticleCard.tsx`

- [ ] **Step 1: 修改日期列，支持显示剧集编号和时长**

打开 `web/components/ArticleCard.tsx`，将日期列（`{/* Date Column */}`）从：

```tsx
      {/* Date Column */}
      <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
        {!isRead && (
          <span className="inline-flex flex-shrink-0 rounded-full h-1.5 w-1.5 bg-blue-500" />
        )}
        <span>{formattedDate}</span>
      </div>
```

改为：

```tsx
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
```

- [ ] **Step 2: 验证 TypeScript 编译通过**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info/web && npx tsc --noEmit
```

期望：无新增错误。

- [ ] **Step 3: Commit**

```bash
git add web/components/ArticleCard.tsx
git commit -m "feat: show episode number and duration badges in ArticleCard for podcasts"
```

---

## Task 6: 更新 page.tsx 接入 podcast 分类过滤

**Files:**
- Modify: `web/app/page.tsx`

- [ ] **Step 1: 扩展 activeCategoryFilter 的类型**

打开 `web/app/page.tsx`，找到 `activeCategoryFilter` 的 `useState` 声明，将类型从：

```ts
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'news' | 'research' | 'tech'>('all');
```

改为：

```ts
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'news' | 'research' | 'tech' | 'podcast'>('all');
```

- [ ] **Step 2: 在 categoryFilterCounts useMemo 中增加 podcast 计数**

找到 `categoryFilterCounts` 的 `useMemo`，将整个 useMemo 从：

```ts
  const categoryFilterCounts = useMemo(() => {
    if (!groupedData) return { all: 0, news: 0, research: 0, tech: 0 };

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

    return {
      all: allCount,
      news: newsCount,
      research: researchCount,
      tech: techCount,
    };
  }, [groupedData, activeTimePeriod]);
```

改为：

```ts
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
```

- [ ] **Step 3: 同步修复 loading 和 error 状态中传给 Header 的 categoryFilterCounts 默认值**

在 loading 返回（约第 197 行）和 error 返回（约第 218 行）中，将 `categoryFilterCounts={{ all: 0, news: 0, research: 0, tech: 0 }}` 均改为：

```tsx
categoryFilterCounts={{ all: 0, news: 0, research: 0, tech: 0, podcast: 0 }}
```

（共两处，分别在 loading 状态和 error 状态的 Header 调用中。）

- [ ] **Step 4: 全量 TypeScript 检查**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info/web && npx tsc --noEmit
```

期望：0 个错误。

- [ ] **Step 5: 运行现有单元测试**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info/web && npm test -- --run
```

期望：所有已有测试（timeUtils、formatTime）通过，无失败。

- [ ] **Step 6: Commit**

```bash
git add web/app/page.tsx
git commit -m "feat: wire podcast category filter in page (state, counts, Header props)"
```

---

## Task 7: 端对端冒烟测试

- [ ] **Step 1: 构建并确认无编译错误**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info/web && npm run build
```

期望：Build 成功，无 TypeScript/ESLint 错误。

- [ ] **Step 2: 试运行 fetcher 确认 podcast 源被识别**

```bash
cd /Users/wubaiyu/DEV/side-projects/ai-info/fetcher && npm run dev 2>&1 | head -30
```

期望日志中出现：`"sourceId":"lex-fridman"` 的 fetch 记录（或网络错误，均表示源已被识别）。

- [ ] **Step 3: 最终 Commit（如有遗漏文件）**

```bash
git status
# 如有未提交文件：
git add <file>
git commit -m "chore: finalize podcast source integration"
```

---

## 后续追加 Podcast 源

只需在 `fetcher/config/sources.json` 的 `podcast.sources` 数组中追加条目，无需改代码：

```json
{
  "id": "latent-space",
  "name": "Latent Space Podcast",
  "type": "rss",
  "url": "https://www.latent.space/feed/podcast",
  "homepage": "https://www.latent.space",
  "enabled": true,
  "fetchInterval": 86400
}
```
