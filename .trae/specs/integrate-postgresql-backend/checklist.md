# Checklist

## 安全
- [x] 代码库中无任何位置硬编码数据库连接串 / 密码（在 src/ 与 server/ 中搜索 `postgresql://` 确认为零命中）
- [x] 数据库连接仅通过 `process.env.DATABASE_URL` 读取
- [x] `.gitignore` 已排除 `.env` / `.env.local` / `.env.*`
- [x] 浏览器代码（`src/`）中无 `pg` import，无直连数据库代码

## Schema 与种子
- [x] `server/db/schema.sql` 定义 questions / answers / ai_summaries / feedback 四张表，`CREATE TABLE IF NOT EXISTS`
- [x] 表字段与 `src/types/forum.js` 实体定义一致（ID UUID、时间戳 BIGINT、tags 为 TEXT[]）
- [x] `node server/db/seed.js` 幂等执行：首次写入种子数据，重复执行不产生重复（ON CONFLICT DO NOTHING）
- [x] 种子数据中每个 authorId 补充了 author_name 与 author_avatar_seed

## 后端 API
- [x] `GET /api/health` 在 DB 可用时返回 `{ status:"ok", db:true }`，不可用时返回 `{ status:"degraded", db:false }`
- [x] `GET /api/questions` 支持 `sort` / `limit` / `offset` / `tag` 参数，返回 `{ items, total }`
- [x] `GET /api/questions/:id` 返回问题详情 + 回答列表 + 摘要
- [x] `POST /api/questions` 成功创建并返回完整对象（含 id / createdAt）
- [x] `POST /api/questions/:id/view` 浏览数 +1
- [x] `POST /api/questions/:id/answers` 成功创建回答
- [x] `PUT /api/questions/:id/summary` 创建 / 更新摘要
- [x] `POST /api/feedback` 提交反馈
- [x] 所有数据接口在 DB 不可用时返回 503，不抛未捕获异常
- [x] 生产环境 Express 静态托管 `dist/`，非 `/api` 路径回退到 `index.html`（SPA）

## 前端
- [x] `src/services/apiClient.js` 封装 get / post / put，统一错误处理
- [x] `Home.jsx` 数据来自 `GET /api/questions`，不再 import `recommendedQuestions`
- [x] `Explore.jsx` 数据来自 `GET /api/questions`，不再 import `exploreQuestions`
- [x] `Detail.jsx` 数据来自 `GET /api/questions/:id`，不再 import `questionDetail`
- [x] `Ask.jsx` 发布调用 `POST /api/questions`，成功跳转新详情页
- [x] 四个页面均有加载中与错误状态处理
- [x] 时间戳（毫秒）正确映射为页面展示的相对时间格式
- [x] `identityService.js` / `storageService.js` / `migrationService.js` / `seedService.js` 未被修改（本地信号仍存 localStorage）
- [x] `ForumAppContext` 暴露 `dbAvailable` 状态

## 配置与部署
- [x] `package.json` 新增 `express` / `pg` 依赖与 `start` / `server` / `db:seed` 脚本
- [x] `zbpack.json` 新增 `start_command`
- [x] `vite.config.js` 新增 `/api` → `localhost:5175` 代理
- [x] 本地 `npm run build` + `npm start` 通过，`/api/health` 与 `/api/questions` 可访问（degraded 模式）
- [ ] Zeabur 部署后 `DATABASE_URL` 由用户在控制台配置（不在代码中），部署成功且健康检查通过 — **需用户操作**
