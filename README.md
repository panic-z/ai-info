# AI Info Hub

> AI 消息汇集网站，聚合多个高质量 AI 信息源　[English](README.en.md)

## 简介

AI Info Hub 是一个信息聚合工具，将 HackerNews、GitHub Trending、RSS 订阅等多个渠道的 AI 相关内容统一抓取、分类，并通过 Web 界面展示。项目分为独立运行的抓取服务（fetcher）和展示前端（web），数据通过本地 JSON 文件传递。

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
| `app/api/sources/route.ts` | API 路由，读取 fetcher 产出的 JSON |
| `components/ArticleCard.tsx` | 文章卡片组件 |
| `components/CategoryCard.tsx` | 分类卡片组件 |
| `components/TimeSection.tsx` | 时间段分组（今天 / 本周 / 本月）|
| `utils/timeUtils.ts` | 时间段判断工具 |

### fetcher — 抓取服务

| 路径 | 说明 |
|------|------|
| `src/core/fetcher.ts` | 并发抓取调度（concurrency limit: 5）|
| `src/adapters/rss.ts` | RSS 订阅解析 |
| `src/adapters/scraper.ts` | HTML 爬取 |
| `src/sources/hackernews.ts` | HackerNews Top Stories（批量并发，每批 10 条）|
| `src/sources/github-trending.ts` | GitHub Trending 爬取 |
| `src/core/storage.ts` | 数据持久化（写入 `fetcher/data/index.json`）|

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Next.js 13+、React、TypeScript、Tailwind CSS |
| 抓取 | Node.js、TypeScript、Axios、Cheerio、RSS Parser |
| 日志 | Pino |
| 测试 | Vitest（单元）、Playwright（E2E）|

## 快速上手

**前置要求：** Node.js 18+

```bash
# 1. 安装依赖
npm run install:all

# 2. 抓取数据（首次运行必须先执行）
npm run fetch

# 3. 启动前端开发服务
npm run dev:web
# 访问 http://localhost:3000
```

## 开发

```bash
# 开发模式（同时监听前端热更新）
npm run dev:web

# 单独调试抓取逻辑
npm run dev:fetch

# 单元测试
cd web && npm test

# E2E 测试（需先启动服务）
npm run test:e2e
```

## 生产部署

```bash
# 抓取最新数据
npm run fetch

# 构建前端
npm run build:web

# 启动生产服务器
npm start
```

前端通过 `DATA_FILE_PATH` 环境变量指定数据文件路径，默认为 `../fetcher/data/index.json`。

## 数据流

```
外部来源（HN / RSS / GitHub）
        ↓
   fetcher（抓取、清洗、合并）
        ↓
  fetcher/data/index.json
        ↓
 web API /api/sources（读取文件）
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
