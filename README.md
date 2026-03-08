# AI D&D Web MVP

本项目是一个本地运行的 AI D&D 文字跑团 MVP：

- 前端：Vue 3 + TypeScript + Vite + Pinia + Vue Router
- 后端：Hono + Node.js + TypeScript
- 数据库：MySQL
- AI：BYOK，前端将 API Key / Base URL / Model 存到 LocalStorage，请求时透传给后端

## 目录

- `apps/web`：前端
- `apps/server`：后端
- `database/schema.sql`：MySQL 初始化脚本
- `skills/dnd-5e-dm`：D&D 规则 skill

## 启动

1. 创建 MySQL 数据库，例如 `ai_dnd_local`
2. 执行 `database/schema.sql`
3. 复制 `apps/server/.env.example` 为 `apps/server/.env`
4. 安装依赖：`npm install`
5. 启动：`npm run dev`

## 关键接口

- `POST /api/characters`
- `GET /api/game-state?sessionId=...`
- `POST /api/chat/stream`
