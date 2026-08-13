# Tasks

- [x] Task 1: 后端基础设施与依赖配置
  - [x] 1.1 根 `package.json` 新增依赖 `express`、`pg`，新增脚本 `start`（`node server/index.js`）、`server`（`node server/index.js`，开发用）、`db:seed`（`node server/db/seed.js`）
  - [x] 1.2 `.gitignore` 追加 `.env`、`.env.local`、`.env.*`
  - [x] 1.3 `zbpack.json` 新增 `start_command: "node server/index.js"`
  - [x] 1.4 `vite.config.js` 新增 `server.proxy`，将 `/api` 代理到 `http://localhost:5175`

- [x] Task 2: PostgreSQL 连接池与 Schema
  - [x] 2.1 创建 `server/db/pool.js`：从 `process.env.DATABASE_URL` 创建 `pg.Pool`，导出 `query` 与 `pool`；未配置时导出空实现并打日志
  - [x] 2.2 创建 `server/db/schema.sql`：定义 `questions` / `answers` / `ai_summaries` / `feedback` 四张表（`CREATE TABLE IF NOT EXISTS`），字段映射 `src/types/forum.js`，时间戳用 BIGINT，ID 用 UUID，`author_name` / `author_avatar_seed` 冗余存储
  - [x] 2.3 `server/db/pool.js` 提供 `initSchema()` 函数读取并执行 `schema.sql`

- [x] Task 3: 种子数据脚本
  - [x] 3.1 创建 `server/db/seed.js`：执行 `initSchema()` 后，从 `src/seed/forumSeedData.js` 读取种子数据，为每个 `authorId` 补充 `author_name`（如「游客#A001」）与 `author_avatar_seed`（固定渐变色），用 `INSERT ... ON CONFLICT (id) DO NOTHING` 写入 `questions` / `answers` / `ai_summaries`
  - [x] 3.2 `seed.js` 执行完毕打印各表写入条数，幂等可重复运行

- [x] Task 4: 仓储层（repository）
  - [x] 4.1 `server/repositories/questionRepository.js`：`listQuestions({ sort, limit, offset, tag })`、`getQuestionById(id)`（含 answers + summary 聚合）、`createQuestion(data)`、`incrementView(id)`
  - [x] 4.2 `server/repositories/answerRepository.js`：`listByQuestion(questionId)`、`createAnswer(data)`、`incrementUpvote(id)`（暂不暴露路由，预留）
  - [x] 4.3 `server/repositories/summaryRepository.js`：`getByQuestion(questionId)`、`upsertSummary(data)`
  - [x] 4.4 `server/repositories/feedbackRepository.js`：`createFeedback(data)`、`getSummaryFeedbackStats(targetId)`

- [x] Task 5: Express 路由与应用入口
  - [x] 5.1 `server/routes/questions.js`：`GET /`（list）、`GET /:id`（detail）、`POST /`（create）、`POST /:id/view`
  - [x] 5.2 `server/routes/answers.js`：`POST /:questionId/answers`
  - [x] 5.3 `server/routes/summaries.js`：`PUT /:questionId/summary`
  - [x] 5.4 `server/routes/feedback.js`：`POST /`
  - [x] 5.5 `server/index.js`：组装 Express app，挂载路由到 `/api`，`GET /api/health` 健康检查，生产环境 `express.static('dist')` 托管前端，监听 `PORT` 环境变量（默认 5175）

- [x] Task 6: 前端 API 客户端
  - [x] 6.1 创建 `src/services/apiClient.js`：封装 `get` / `post` / `put`，基础路径 `/api`，统一 JSON 解析与错误抛出
  - [x] 6.2 创建 `src/services/questionRepository.js`（前端侧）：`fetchQuestions`、`fetchQuestionDetail`、`createQuestion`、`incrementView`、`createAnswer`、`upsertSummary`、`submitFeedback`

- [x] Task 7: 页面接入 API — Home
  - [x] 7.1 `Home.jsx` 推荐流改用 `fetchQuestions({ sort: 'hot', limit: 6 })`，移除 `recommendedQuestions` import
  - [x] 7.2 加载中显示 loading 文案，失败显示错误提示与重试按钮
  - [x] 7.3 字段映射：API 返回的 `Question`（`viewCount` / `answerCount` / `createdAt` 毫秒时间戳）→ 页面展示所需格式（`views` / `answers` / 相对时间）

- [x] Task 8: 页面接入 API — Explore
  - [x] 8.1 `Explore.jsx` 改用 `fetchQuestions({ sort, limit: 20 })`，移除 `exploreQuestions` import
  - [x] 8.2 「最新 / 热度」切换重新请求 API，加载 / 错误状态处理
  - [x] 8.3 字段映射同 Task 7.3

- [x] Task 9: 页面接入 API — Detail
  - [x] 9.1 `Detail.jsx` 用 `useParams` 的 `id` 调 `fetchQuestionDetail(id)`，移除 `questionDetail` import
  - [x] 9.2 渲染真实问题 / 回答列表 / 摘要；字段映射（tags 数组、answers 数组、aiSummary）
  - [x] 9.3 进入页面时 `incrementView(id)`
  - [x] 9.4 「撰写回答」发布改为 `createAnswer(id, { content, authorId, authorName, authorAvatarSeed })`，成功后刷新回答列表
  - [x] 9.5 「AI 帮我答」保持现有 mock 生成逻辑（AI 代理接入是独立 spec），生成后可保存为回答

- [x] Task 10: 页面接入 API — Ask
  - [x] 10.1 `Ask.jsx` 「发布问题」改为 `createQuestion({ title, body, tags, authorId, authorName, authorAvatarSeed, aiAssisted })`
  - [x] 10.2 成功后 `navigate(/detail/${返回的 question.id})`
  - [x] 10.3 AI 润色 / 扩写 / 草稿保持现有 mock 逻辑不变

- [x] Task 11: Bootstrap 健康检查
  - [x] 11.1 `src/bootstrap/forumBootstrap.js` 增加 `GET /api/health` 探测，返回 `{ aiAvailable, dbAvailable }` 供 Context 使用
  - [x] 11.2 `ForumAppContext.jsx` 暴露 `dbAvailable` 状态，页面可据此显示降级提示

- [x] Task 12: Zeabur 部署验证
  - [x] 12.1 本地验证：`npm run build` 成功，`npm start` 启动后 `GET /api/health` 返回 degraded（无 DATABASE_URL 时预期行为）
  - [x] 12.2 本地验证：`GET /api/questions` 在 DB 不可用时返回 503；静态托管 dist/ 正常（GET / 返回 200 text/html）
  - [ ] 12.3 Zeabur 部署：确认 `DATABASE_URL` 环境变量已配置（用户手动在 Zeabur 控制台设置，不进代码），部署后健康检查通过 — **需用户操作**

# Task Dependencies
- Task 2 依赖 Task 1（需要依赖配置）
- Task 3 依赖 Task 2（需要 schema）
- Task 4 依赖 Task 2（需要 pool）
- Task 5 依赖 Task 4（需要 repository）
- Task 6 与 Task 5 可并行（前端 API 客户端不依赖后端代码，只依赖接口约定）
- Task 7-10 依赖 Task 6（需要前端 API 客户端）
- Task 11 依赖 Task 6
- Task 12 依赖 Task 5、6、7-10
