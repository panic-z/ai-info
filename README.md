# AI Info Hub

AI 消息汇集网站 - 聚合多个高质量 AI 信息源

## 项目结构

- `web/` - Next.js 前端
- `fetcher/` - 信息抓取服务
- `shared/` - 共享类型定义

## 开发

```bash
# 安装所有依赖
npm run install:all

# 开发模式
npm run dev:web     # 启动前端
npm run dev:fetch   # 测试抓取

# 生产
npm run fetch       # 执行抓取
npm run build:web   # 构建前端
npm start           # 启动服务
```
