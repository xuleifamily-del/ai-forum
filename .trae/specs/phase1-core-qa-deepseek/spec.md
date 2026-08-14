# Phase 1 核心问答 + DeepSeek AI 接入 Spec

## Why

PRD Phase 1「核心问答」要求用户能完成「提问→浏览→回答→点赞」全流程，并在提问/回答页内嵌 AI 伴随。当前页面骨架已存在，但 **AI 按钮全部为硬编码 mock**（`Ask.jsx` / `Detail.jsx` 用 `setTimeout` 返回假数据），点赞按钮无实际功能，回答未做 Markdown 渲染，排序/分页未持久化，`BehaviorProfile` 键虽定义但未被写入。需要补齐 Phase 1 闭环，并以 DeepSeek API 替换全部 mock，让 AI 真正可用。

## 模型与 API 选型

- **模型供应商**：DeepSeek（OpenAI 兼容协议）
- **Base URL**：`https://api.deepseek.com`
- **模型名**：`deepseek-v4-pro`（默认）/ `deepseek-v4-flash`（轻量任务，如模糊度检测）
- **接入方式**：OpenAI SDK 或原生 `fetch` 调用 `/chat/completions`（支持 `stream: true`）
- **API Key**：用户已提供（`sk-bb9e0a0e185f...`），**仅写入 Zeabur 环境变量 `DEEPSEEK_API_KEY`**，严禁进仓库、严禁进前端 bundle、严禁访客自填
- **降级**：Key 未配置 / 调用失败 / 超时 / 限流时，回落确定性模板回复并标注「模拟回复（离线演示）」

## 安全约束（强制）

- `DEEPSEEK_API_KEY` 只能通过 `process.env.DEEPSEEK_API_KEY` 在服务端读取，绝不写入任何提交文件
- 浏览器**不得直连** DeepSeek（CORS + 密钥泄露双重阻断），必须通过 `/api/ai/*` 代理
- `.gitignore` 必须排除 `.env` / `.env.local` / `.env.production`（已存在则确认）
- 降级响应必须明确标注 `mock: true`，避免污染真实 AI 使用率统计

## What Changes

### 新增：服务端 DeepSeek 代理路由

- 新增 `server/services/deepseekService.js` — 封装 DeepSeek 调用（chat completions，支持 stream），从 `process.env.DEEPSEEK_API_KEY` 读 key
- 新增 `server/services/aiPromptService.js` — 4 个引擎的系统提示词模板（润色 / 扩写 / 草稿 / 帮我答）
- 新增 `server/routes/ai.js` — 暴露以下接口：
  - `POST /api/ai/polish` — 润色标题/正文，入参 `{ type: 'title'|'body', text, context? }`，返回 `{ text, mock }`
  - `POST /api/ai/expand` — 扩写正文，入参 `{ title, body }`，返回 `{ text, mock }`
  - `POST /api/ai/draft` — 生成提问/回答草稿，入参 `{ intent: 'question'|'answer', title, body? }`，返回 `{ text, mock }`
  - `POST /api/ai/answer` — 「AI 帮我答」，入参 `{ questionId, title, body, topAnswers? }`，返回 `{ text, mock }`
  - `GET /api/ai/health` — 返回 `{ ai: boolean, model: string }`，反映 key 是否配置
- 降级策略统一在 `deepseekService.js`：捕获 4xx/5xx/网络错误/超时 → 返回模板回复 + `mock: true`
- 限流：每个 IP 每分钟 20 次（用内存计数器即可，MVP 阶段不引入 Redis 限流）

### 修改：服务端 health 端点

- `GET /api/health` 返回值新增 `ai` 字段，反映 `DEEPSEEK_API_KEY` 是否配置（不泄露 key 本身）

### 修改：服务端回答点赞接口

- `POST /api/questions/:questionId/answers/:answerId/upvote` — 切换点赞（已赞则取消），返回 `{ upvotes, upvoted }`，幂等
- `server/db/schema.sql` 的 `answers` 表 `upvotes` 字段已存在，无需改表
- 防重复点赞：MVP 阶段不做严格去重（无用户体系强约束），但 `BehaviorProfile.upvotedAnswerIds` 在客户端去重

### 新增：前端 AI 服务层

- 新增 `src/services/aiService.js` — 封装 4 个 AI 接口调用（polish / expand / draft / answer），统一处理 `mock` 标记
- 新增 `src/services/aiInteractionService.js` — 记录 `AIInteraction` 埋点到 `localStorage[STORAGE_KEYS.AI_INTERACTIONS]`，区分真实/mock

### 修改：Ask.jsx 替换 mock

- 移除 `mockAiAction` 函数及其硬编码文案
- 「AI 润色 / AI 扩写 / 生成草稿」改为调用 `aiService`，加载态、错误提示、结果回填
- 标题输入 `onBlur` 触发 `POST /api/ai/polish { type: 'title' }` 做模糊度检测，仅当 `isVague: true` 才显示润色提示卡
- 「相似问题」改为：发布前 `GET /api/questions?keyword=<title>` 取 top-3 展示为可点击卡片
- 每次真实 AI 调用记一条 `AIInteraction`（type / success / mock / duration）

### 修改：Detail.jsx 替换 mock + 补齐功能

- 「AI 帮我答」改为调用 `aiService.answer()`，支持 SSE 流式输出（逐字显示）
- 「AI 润色」改为调用 `aiService.polish({ type: 'body', text: answer })`
- **点赞按钮接真实接口**：点击调用 `POST /api/questions/:id/answers/:answerId/upvote`，乐观更新 + 失败回滚
- **回答 Markdown 渲染**：引入 `react-markdown` + `remark-gfm`，渲染 `answer.content`（含代码块、列表、链接）
- 摘要区域 `summary.content` 同样用 Markdown 渲染
- 每次真实 AI 调用记 `AIInteraction`

### 修改：Explore.jsx 排序与分页持久化

- 排序状态（`sort=latest|hot`）与页码（`page`）持久化到 URL query（`useSearchParams`）
- 切换排序 / 翻页时仅更新 URL，由 `useEffect` 监听 URL 重新拉数据
- 分页大小固定 10，前后端已支持 `limit` / `offset`

### 修改：Home.jsx / Detail.jsx 行为信号采集

- `Detail.jsx` 加载成功后调用 `behaviorService.recordView(questionId, tags)` 写入 `BehaviorProfile.viewedQuestionIds` + `tagWeights`
- 点赞成功后调用 `behaviorService.recordUpvote(answerId, tags)` 写入 `BehaviorProfile.upvotedAnswerIds` + `tagWeights`
- 新增 `src/services/behaviorService.js` 封装上述写入（读 `STORAGE_KEYS.BEHAVIOR`，带 7d/30d/30d+ 三档时间衰减）

### 修改：健康检查与降级 UI

- `ForumAppContext` 启动时调用 `GET /api/health`，新增 `aiAvailable` 状态（true/false/mock）
- AI 按钮根据 `aiAvailable` 显示不同提示：可用 / 离线演示

## Impact

- Affected specs:
  - `integrate-postgresql-backend` — 复用其 API 客户端与路由挂载模式，新增 `/api/ai/*` 与点赞接口
  - `add-user-auth` — 点赞接口若用户已登录可绑定 `userId` 做严格去重（MVP 阶段非强制）
- Affected code:
  - 新增：`server/services/{deepseekService,aiPromptService}.js`、`server/routes/ai.js`、`src/services/{aiService,aiInteractionService,behaviorService}.js`
  - 修改：`server/index.js`（挂载 ai 路由 + health 字段）、`server/routes/answers.js`（新增 upvote）、`src/pages/forum/{Ask,Detail,Explore,Home}.jsx`、`src/contexts/ForumAppContext.jsx`（aiAvailable）、`src/services/questionRepository.js`（toggleUpvote）、`package.json`（`react-markdown`、`remark-gfm`）
  - 不变：`identityService.js`、`migrationService.js`、`storageService.js`、`forumStorageKeys.js`（键已齐备）

## ADDED Requirements

### Requirement: DeepSeek 代理服务

系统 SHALL 通过 `server/services/deepseekService.js` 封装 DeepSeek API 调用，从 `process.env.DEEPSEEK_API_KEY` 读取密钥，禁止硬编码或前端直连。

#### Scenario: 正常调用
- **GIVEN** `DEEPSEEK_API_KEY` 已配置
- **WHEN** 调用 `deepseekService.chat({ messages, model, stream })`
- **THEN** 返回 DeepSeek 响应（非流式返回完整文本，流式返回 async generator）

#### Scenario: 密钥未配置
- **GIVEN** `DEEPSEEK_API_KEY` 未配置
- **WHEN** 调用任何 AI 接口
- **THEN** 返回模板回复 + `{ mock: true }`，HTTP 200（不报错），文案标注「模拟回复（离线演示）」

#### Scenario: 调用失败
- **GIVEN** DeepSeek 返回 4xx/5xx 或网络超时（>30s）
- **WHEN** 调用任何 AI 接口
- **THEN** 降级返回模板回复 + `{ mock: true }`，并在服务端日志记录错误

### Requirement: AI 代理路由

系统 SHALL 暴露以下 `/api/ai/*` 路由，统一返回 `{ text, mock }` 结构：

| 方法 | 路径 | 用途 |
|------|------|------|
| POST | `/api/ai/polish` | 润色标题或正文 |
| POST | `/api/ai/expand` | 扩写正文 |
| POST | `/api/ai/draft` | 生成草稿（提问/回答） |
| POST | `/api/ai/answer` | 「AI 帮我答」流式输出 |
| GET | `/api/ai/health` | AI 可用性检查 |

#### Scenario: 润色接口
- **WHEN** `POST /api/ai/polish { type: 'title', text: 'react 问题' }`
- **THEN** 返回 `{ text: '<润色后标题>', mock: false }`

#### Scenario: AI 帮我答（流式）
- **WHEN** `POST /api/ai/answer { questionId, title, body }` 且 `Accept: text/event-stream`
- **THEN** 以 SSE 逐 token 返回 `{ "delta": "..." }`，结束帧 `{ "done": true }`

#### Scenario: AI 健康检查
- **WHEN** `GET /api/ai/health`
- **THEN** 返回 `{ ai: <true|false>, model: 'deepseek-v4-pro' }`

### Requirement: 回答点赞接口

系统 SHALL 提供 `POST /api/questions/:questionId/answers/:answerId/upvote`，切换点赞状态。

#### Scenario: 点赞
- **WHEN** 已登录或匿名用户调用该接口
- **THEN** `answers.upvotes` +1（或 -1 取消），返回 `{ upvotes, upvoted }`

#### Scenario: 回答不存在
- **WHEN** `answerId` 不存在
- **THEN** 返回 404 `{ error: 'answer not found' }`

### Requirement: 前端 AI 服务层

系统 SHALL 提供 `src/services/aiService.js`，封装 4 个 AI 接口调用，统一处理 `mock` 标记与错误。

#### Scenario: 调用润色
- **WHEN** `aiService.polish({ type: 'title', text })`
- **THEN** 返回 `{ text, mock }`，调用方据 `mock` 决定是否记 `AIInteraction`

#### Scenario: 流式帮我答
- **WHEN** `aiService.answerStream({ questionId, title, body }, onDelta)`
- **THEN** 通过 SSE 逐 token 回调 `onDelta(text)`，结束返回 `{ mock }`

### Requirement: AI 交互埋点

系统 SHALL 通过 `aiInteractionService` 将每次 AI 调用记录到 `localStorage[STORAGE_KEYS.AI_INTERACTIONS]`，区分真实/mock，供看板统计 AI 使用率。

#### Scenario: 真实 AI 调用
- **WHEN** AI 接口返回 `mock: false`
- **THEN** 写入 `{ type, success: true, mock: false, duration, timestamp }`

#### Scenario: Mock 兜底
- **WHEN** AI 接口返回 `mock: true`
- **THEN** 写入 `{ type, success: true, mock: true, duration, timestamp }`，看板统计时与真实调用分开计数

### Requirement: 行为信号采集

系统 SHALL 在用户浏览问题、点赞回答时更新 `BehaviorProfile`（`localStorage[STORAGE_KEYS.BEHAVIOR]`）。

#### Scenario: 浏览问题
- **WHEN** 用户进入 `/detail/:id` 页面且加载成功
- **THEN** `behaviorService.recordView(questionId, tags)` 写入 `viewedQuestionIds` 并累加 `tagWeights`（权重 1.0）

#### Scenario: 点赞回答
- **WHEN** 用户点击点赞按钮且 API 成功
- **THEN** `behaviorService.recordUpvote(answerId, tags)` 写入 `upvotedAnswerIds` 并累加 `tagWeights`（权重 1.0）

#### Scenario: 时间衰减
- **WHEN** 读取 `tagWeights` 用于推荐排序
- **THEN** 7 天内行为权重 1.0，7-30 天 0.5，30 天以上 0.2

### Requirement: Explore 排序与分页持久化

`Explore.jsx` SHALL 将排序状态（`sort=latest|hot`）与页码（`page`）持久化到 URL query。

#### Scenario: 切换排序
- **WHEN** 用户点击「最新」/「热门」tab
- **THEN** URL 更新为 `?sort=latest` 或 `?sort=hot`，页面据 URL 重新拉数据

#### Scenario: 翻页
- **WHEN** 用户点击下一页
- **THEN** URL 更新为 `?page=2`，列表展示第 2 页

### Requirement: 回答 Markdown 渲染

`Detail.jsx` SHALL 使用 `react-markdown` + `remark-gfm` 渲染 `answer.content` 与 `summary.content`。

#### Scenario: 包含代码块
- **WHEN** 回答内容含 \`\`\`js ... \`\`\`
- **THEN** 渲染为带语法高亮背景的代码块（MVP 不强制高亮插件，黑底白字即可）

#### Scenario: 包含列表与链接
- **WHEN** 回答内容含 `- item` 与 `[text](url)`
- **THEN** 渲染为 HTML 列表与可点击链接（外链 `target="_blank" rel="noopener"`）

## MODIFIED Requirements

### Requirement: Ask 页 AI 伴随

原「mockAiAction 用 setTimeout 返回硬编码文案」改为调用真实 `/api/ai/*` 接口，AI 不可用时自动降级为模板回复（接口侧已处理，前端无需额外分支）。每次调用记 `AIInteraction`。

### Requirement: Detail 页 AI 帮我答

原「handleAiAnswer 用 setTimeout 返回固定文案」改为调用 `aiService.answerStream`，SSE 逐字流式输出到编辑器。AI 不可用时一次性返回模板回复。

### Requirement: Detail 页点赞按钮

原「点赞按钮无 onClick」改为调用 `toggleUpvote`，乐观更新 + 失败回滚，并写入 `BehaviorProfile`。

### Requirement: /api/health 响应

原 `{ status, db, redis }` 扩展为 `{ status, db, redis, ai }`，`ai` 反映 `DEEPSEEK_API_KEY` 是否配置。

### Requirement: ForumAppContext 全局状态

新增 `aiAvailable`（true / false）状态，启动时由 `/api/health` 的 `ai` 字段决定。

## REMOVED Requirements

### Requirement: mockAiAction 硬编码文案
**Reason**: 改为真实 DeepSeek 调用 + 服务端降级。
**Migration**: `Ask.jsx` 的 `mockAiAction` 函数与硬编码字符串全部删除；`Detail.jsx` 的 `handleAiAnswer` setTimeout 实现删除。

### Requirement: 相似问题硬编码列表
**Reason**: `Ask.jsx` 顶部 `similarQuestions` 常量为写死数据。
**Migration**: 改为发布前 `GET /api/questions?keyword=<title>` 动态查询；未输入标题时显示空态。
