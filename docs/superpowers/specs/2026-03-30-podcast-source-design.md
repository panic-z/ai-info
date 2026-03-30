# Podcast 消息源设计文档

**日期：** 2026-03-30
**状态：** 已批准

## 背景

ai-info 当前聚合 AI 新闻、研究、技术社区三类消息源。本次在此基础上新增 Podcast 分类，支持订阅 AI 领域播客节目，并以轻度差异化的方式展示剧集信息（时长、剧集编号）。

## 目标

- 建立可扩展的 Podcast RSS 框架，后续可随时在 `sources.json` 追加新节目
- 复用现有 RSS 适配器，扩展解析 iTunes 命名空间字段
- 前端新增 `podcast` 分类 Tab，剧集卡片轻度差异化显示

## 数据模型

`shared/types.ts` 的 `Article` 接口新增三个可选字段：

```ts
audioUrl?: string;      // 音频文件 URL，来自 RSS <enclosure url>
duration?: string;      // 时长，格式 "HH:MM:SS" 或 "MM:SS"，来自 itunes:duration
episodeNumber?: number; // 剧集编号，来自 itunes:episode
```

这三个字段对所有现有文章均为 `undefined`，完全向后兼容。`SourceConfig.type` 保持不变，Podcast 源使用 `type: "rss"`。

## Fetcher 层

### RSS 适配器扩展（`fetcher/src/adapters/rss.ts`）

扩展 `rss-parser` 的 `customFields` 配置以解析 iTunes 命名空间：

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

映射到 `Article` 字段：

```ts
audioUrl: item.enclosure?.url,
duration: item.itunesDuration,
episodeNumber: item.itunesEpisode ? Number(item.itunesEpisode) : undefined,
```

`rss-parser` 已原生支持 `enclosure` 对象，无需额外配置。

### 新增 Podcast 分类（`fetcher/config/sources.json`）

```json
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

`fetchInterval` 设为 86400 秒（每天一次），匹配播客的低更新频率。后续直接在 `sources` 数组追加新节目即可，无需改动代码。

## 前端层

### 类型扩展（`web/app/page.tsx`）

- `activeCategoryFilter` 类型：`'all' | 'news' | 'research' | 'tech' | 'podcast'`
- `categoryFilterCounts` 新增 `podcast` 字段
- Header 组件的分类过滤器新增 `Podcast` Tab

### Header 组件内部类型更新（`web/components/Header.tsx`）

`Header.tsx` 内部定义了独立的 `CategoryFilter` 类型和 `categoryFilterCounts` 接口，需同步更新：

- `CategoryFilter` 类型：`'all' | 'news' | 'research' | 'tech' | 'podcast'`
- `categoryFilterCounts` 接口新增 `podcast: number` 字段
- 渲染过滤器按钮的循环/列表中加入 `Podcast` 选项

### 卡片轻度差异化（`web/components/ArticleCard.tsx` 或对应组件）

- 若 `article.duration` 存在，显示时长标签（如 `🎙 1:23:45`）
- 若 `article.episodeNumber` 存在，显示 `EP.123` 标签
- 点击行为不变，跳转 `article.url`

## 变更文件清单

| 文件 | 变更类型 |
|------|---------|
| `shared/types.ts` | 扩展 `Article` 接口，加 3 个可选字段 |
| `fetcher/src/adapters/rss.ts` | 扩展 parser customFields，映射 iTunes 字段 |
| `fetcher/config/sources.json` | 新增 `podcast` 分类及初始源 |
| `web/app/page.tsx` | 新增 podcast 过滤器状态和计数 |
| `web/components/ArticleCard.tsx` | 轻度差异化显示时长和剧集编号 |
| `web/components/Header.tsx` | 更新内部 `CategoryFilter` 类型和接口，新增 Podcast Tab |

## 不在范围内

- 内嵌音频播放器
- 播客专属页面或路由
- 收藏/订阅功能
- 转录文本支持
