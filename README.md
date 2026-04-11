# AI Info Hub

> AI 消息汇集网站，聚合多个高质量 AI 信息源　[English](README.en.md)

## 简介

AI Info Hub 是一个 AI 信息聚合工具，将 HackerNews、GitHub Trending、RSS 订阅以及定制抓取源的内容统一抓取、分类，并通过 Web 界面展示。项目分为两个主要部分：

- `fetcher` 负责抓取、清洗、聚合数据
- `web` 负责在 Next.js App Router 中服务端读取数据并渲染页面

本地开发默认通过 `fetcher/data/index.json` 传递数据；Vercel 预发和生产环境通过 Blob 读取聚合结果。

## 项目结构

```
ai-info/
├── web/          # Next.js 前端
├── fetcher/      # 信息抓取服务
├── shared/       # 共享类型定义
└── e2e/          # 端到端测试
```

### web — 前端

| 路径 | 说明 |
|------|------|
| `app/page.tsx` | 主页，按时间段展示文章 |
| `app/api/sources/route.ts` | API 路由，返回当前聚合数据 |
| `lib/source-data.ts` | 统一读取本地 JSON / Vercel Blob |
| `components/ArticleCard.tsx` | 文章卡片组件 |
| `components/TimeGroupSourceCard.tsx` | 按来源分组的时间视图卡片 |
| `utils/timeUtils.ts` | 时间段判断工具 |
| `utils/articleDate.ts` | 文章日期展示逻辑，优先显示来源发布日期文本 |

### fetcher — 抓取服务

| 路径 | 说明 |
|------|------|
| `src/core/fetcher.ts` | 并发抓取调度（concurrency limit: 5）|
| `src/adapters/rss.ts` | RSS 订阅解析 |
| `src/adapters/scraper.ts` | HTML 爬取 |
| `src/sources/hackernews.ts` | HackerNews Top Stories（批量并发，每批 10 条）|
| `src/sources/github-trending.ts` | GitHub Trending 爬取 |
| `src/core/storage.ts` | 数据持久化（写入 `fetcher/data/index.json` / 聚合输出）|

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Next.js 15、React 19、TypeScript、Tailwind CSS |
| 抓取 | Node.js、TypeScript、Axios、Cheerio、RSS Parser |
| 日志 | Pino |
| 测试 | Vitest（单元）、Playwright（E2E）|

## 快速上手

**前置要求：** Node.js 18.18+，推荐 Node.js 22

```bash
# 1. 安装依赖
npm run install:all

# 2. 抓取数据（首次运行必须先执行）
npm run fetch

# 3. 启动前端开发服务
npm run dev:web
# 访问 http://localhost:3000
```

## 快速开始

```bash
# 开发模式（同时监听前端热更新）
npm run dev:web

# 单独调试抓取逻辑
npm run dev:fetch

# 启动前端（端口 80）
make start

# 执行抓取
make fetch

# 单元测试
cd web && npm test

# E2E 测试（需先启动服务）
npm run test:e2e
```

## 数据与日期规则

- `publishedAt` 用于排序、筛选和时间范围判断
- `publishedLabel` 用于展示文章来源自带的日期文本
- UI 会优先显示 `publishedLabel`，只有缺失时才回退到 `publishedAt`
- `github-trending` 这类没有自然发布日期的来源，仍显示“今日热门 / 本周热门 / 本月热门”

这保证了页面看到的是文章来源本身的日期，而不是抓取任务执行时间。

## 生产部署

```bash
# 抓取最新数据
npm run fetch

# 构建前端
npm run build:web

# 启动生产服务器
npm start
```

前端通过以下方式读取数据：

- 本地：`DATA_FILE_PATH` 指向聚合 JSON，默认 `../fetcher/data/index.json`
- Vercel：设置 `BLOB_STORE=true` 后，从私有 Blob 读取 `ai-info/index.json`

## 数据流

```
外部来源（HN / RSS / GitHub）
        ↓
   fetcher（抓取、清洗、合并）
        ↓
 本地 JSON 或 Vercel Blob
        ↓
 web（Server Component / API 读取）
        ↓
    浏览器（React 渲染）
```

## 信息源

目前支持以下类型的信息源，通过 `fetcher/config/` 目录下的配置文件管理：

- **HackerNews** — Top Stories，批量并发拉取详情
- **RSS** — 任意 RSS/Atom 订阅地址
- **GitHub Trending** — 每日/每周热门仓库
- **自定义 API** — 可扩展的 API 适配器

## 许可

MIT
