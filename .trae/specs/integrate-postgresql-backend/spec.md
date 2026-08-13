# 接入 PostgreSQL 后端 Spec

## Why

项目当前是「无后端架构」，所有共享内容（问题 / 回答 / AI 摘要）存浏览器 `localStorage`，导致数据无法跨用户、跨设备共享。用户已在 Zeabur 部署 PostgreSQL 服务，需要接入真实数据库，让社区内容持久化到服务端，实现多用户可见的问答数据。

## 安全约束（强制）

- **数据库连接串严禁写入代码仓库**。用户提供的连接串（含密码）只能配置在 Zeabur 环境变量 `DATABASE_URL` 中，绝不进 `src/`、`server/`、`.env`、`zbpack.json` 或任何提交文件。
- 浏览器**不得直连** PostgreSQL（安全 + 协议阻断）。必须通过服务端 API 代理访问，与 AGENTS.md 中 LLM key 的安全约定一致。
- `.gitignore` 必须排除 `.env` / `.env.local` 等含密钥的本地文件。

## What Changes

### 新增：Node.js + Express 后端服务
- 新增 `server/` 目录，包含 Express 应用，连接 PostgreSQL（通过 `pg` 驱动 + `DATABASE_URL` 环境变量）。
- 后端同时承担两个职责：提供 `/api/*` REST 接口、托管构建后的静态前端（`dist/`），单服务部署避免 CORS。
- 仓储层（repository pattern）封装所有 SQL 访问，路由层只调仓储不写裸 SQL。

### 新增：PostgreSQL Schema
- 按现有 `src/types/forum.js` 实体定义，创建以下表：
  - `questions` — 问题（含 `author_name` / `author_avatar_seed` 冗余字段，避免单独 identities 表）
  - `answers` — 回答
  - `ai_summaries` — AI 摘要
  - `feedback` — 反馈信号（跨用户聚合）
- 时间戳沿用现有「毫秒时间戳（BIGINT）」格式，ID 用 UUID。

### 新增：种子数据迁移
- 将 `src/seed/forumSeedData.js` 中的种子问题 / 回答 / 摘要写入 PostgreSQL，通过 `server/db/seed.js` 脚本执行。
- 种子数据补充 `author_name` / `author_avatar_seed`（原数据仅有 `authorId`）。

### 新增：前端 API 客户端
- 新增 `src/services/apiClient.js`（fetch 封装）与 `src/services/questionRepository.js`（前端侧，调 API）。
- API 不可用时显示加载 / 错误状态，不再静默回落 mockData。

### 修改：页面接入真实数据 **BREAKING**
- `Home.jsx` / `Explore.jsx` / `Detail.jsx` / `Ask.jsx` 移除对 `./mockData.js` 的直接依赖，改从 API 客户端获取数据。
- `Ask.jsx` 发布问题改为 `POST /api/questions`，成功后跳转新详情页。
- `Detail.jsx` 查看问题改为 `GET /api/questions/:id`，含回答列表与摘要；撰写回答改为 `POST /api/questions/:id/answers`。

### 保留：本地存储（遵循 AGENTS.md）
- 以下数据**仍存 localStorage**，不上传服务端：匿名身份、行为画像（`tagWeights` / `viewedQuestionIds` / `upvotedAnswerIds` / `searchHistory`）、AI 使用统计、AI 交互埋点、Schema 版本。
- `identityService.js` / `storageService.js` / `migrationService.js` 保持不变。

### 修改：部署配置
- 根 `package.json` 新增后端依赖（`express`、`pg`）与 `start` / `server` 脚本。
- `zbpack.json` 新增 `start_command`，Zeabur 部署后由 Node 服务托管静态资源 + API。
- `vite.config.js` 新增 `/api` 开发代理到本地 Express（端口 5175）。
- `.gitignore` 追加 `.env*`。

## Impact

- Affected specs: 无后端架构约定（AGENTS.md §1）— 共享内容改为后端存储，身份与行为信号仍本地。
- Affected code:
  - 新增：`server/` 全部文件、`src/services/apiClient.js`、`src/services/questionRepository.js`
  - 修改：`src/pages/forum/{Home,Explore,Detail,Ask}.jsx`、`package.json`、`zbpack.json`、`vite.config.js`、`.gitignore`、`src/bootstrap/forumBootstrap.js`（健康检查）
  - 不变：`src/services/{identityService,storageService,migrationService,seedService}.js`、`src/contexts/ForumAppContext.jsx`（身份 / 行为仍本地）

## ADDED Requirements

### Requirement: PostgreSQL 数据库连接
系统 SHALL 通过 `DATABASE_URL` 环境变量连接 PostgreSQL，连接串不得出现在任何提交文件中。

#### Scenario: 正常连接
- **GIVEN** Zeabur 已配置 `DATABASE_URL` 环境变量
- **WHEN** 后端服务启动
- **THEN** `pg.Pool` 成功建立连接池，`GET /api/health` 返回 `{ status: "ok", db: true }`

#### Scenario: 缺少环境变量
- **GIVEN** 未配置 `DATABASE_URL`
- **WHEN** 后端启动
- **THEN** 服务仍启动但 `/api/health` 返回 `{ status: "degraded", db: false }`，API 数据接口返回 503

### Requirement: PostgreSQL Schema 初始化
系统 SHALL 提供 `server/db/schema.sql` 定义表结构，提供 `server/db/seed.js` 执行种子数据注入。

#### Scenario: 首次初始化
- **WHEN** 运行 `node server/db/seed.js`
- **THEN** 创建 `questions` / `answers` / `ai_summaries` / `feedback` 四张表（`CREATE TABLE IF NOT EXISTS`），并插入 `forumSeedData.js` 中的全部种子记录
- **AND** 重复执行不产生重复数据（`ON CONFLICT (id) DO NOTHING`）

### Requirement: REST API 接口
系统 SHALL 提供以下接口，返回 JSON：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/questions` | 问题列表（`sort=latest\|hot`、`limit`、`offset`、`tag`） |
| GET | `/api/questions/:id` | 问题详情（含回答列表 + 摘要） |
| POST | `/api/questions` | 创建问题 |
| POST | `/api/questions/:id/view` | 浏览数 +1 |
| POST | `/api/questions/:id/answers` | 创建回答 |
| PUT | `/api/questions/:id/summary` | 创建 / 更新摘要 |
| POST | `/api/feedback` | 提交反馈 |

#### Scenario: 获取问题列表
- **WHEN** `GET /api/questions?sort=hot&limit=10`
- **THEN** 返回 `{ items: Question[], total: number }`，按热度排序

#### Scenario: 创建问题
- **GIVEN** 请求体含 `title` / `body` / `tags` / `authorId` / `authorName` / `authorAvatarSeed`
- **WHEN** `POST /api/questions`
- **THEN** 插入数据库并返回完整 `Question` 对象（含生成的 `id` / `createdAt`）

#### Scenario: API 错误兜底
- **WHEN** 数据库查询失败
- **THEN** 返回 `{ error: string }` + HTTP 500，前端显示错误状态而非崩溃

### Requirement: 前端 API 客户端
系统 SHALL 提供 `src/services/apiClient.js` 封装 fetch，统一处理 JSON 解析、错误、基础路径（`/api`）。

#### Scenario: 正常请求
- **WHEN** 调用 `apiClient.get('/questions')`
- **THEN** 返回解析后的 JSON 对象

#### Scenario: 网络错误
- **WHEN** fetch 抛出网络错误
- **THEN** 抛出带 `message` 的 Error，调用方可 catch 并显示降级 UI

### Requirement: 页面接入真实数据
`Home` / `Explore` / `Detail` / `Ask` 四个页面 SHALL 通过 API 客户端获取 / 提交数据，不再从 `mockData.js` 读取。

#### Scenario: 首页加载
- **WHEN** 用户访问 `/`
- **THEN** `Home.jsx` 调用 `GET /api/questions?sort=hot&limit=6` 渲染推荐流
- **AND** 加载中显示骨架 / loading 文案，失败显示错误提示与重试按钮

#### Scenario: 提问发布
- **WHEN** 用户在 `Ask.jsx` 填写标题 / 正文 / 标签后点击「发布问题」
- **THEN** 调用 `POST /api/questions`，成功后 `navigate(/detail/${新id})`

## MODIFIED Requirements

### Requirement: 数据存储架构
原「无后端架构：所有数据存浏览器 localStorage」调整为分层存储：
- **共享内容**（questions / answers / ai_summaries / feedback）→ PostgreSQL，通过 API 访问。
- **本地信号**（identity / behaviorProfile / aiUsageStats / aiInteractions / searchSessions / schemaVersion）→ 仍存 localStorage，遵循 AGENTS.md §5「行为信号仅存本地不上传」。

`storageService.js` / `identityService.js` / `migrationService.js` / `seedService.js` 保持不变，仍服务于本地信号。`forumStorageKeys.js` 中 `QUESTIONS` / `ANSWERS` / `SUMMARIES` / `FEEDBACK` 键保留用于本地缓存（如需），但权威数据源改为 API。

## REMOVED Requirements

### Requirement: 页面直接读取 mockData
**Reason**: 页面改为从 API 获取真实数据。
**Migration**: `src/pages/forum/mockData.js` 文件保留（不删除，避免破坏可能的引用），但 `Home` / `Explore` / `Detail` / `Ask` 不再 import 它。`Dashboard.jsx` 暂不动（其数据为本地行为信号展示，后续任务再接入）。
